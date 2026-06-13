// src/execution/docker-execution.service.ts

import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { execFile } from 'child_process';
import * as fs from 'fs/promises';
import * as os from 'os';
import * as path from 'path';
import { promisify } from 'util';
import { ExecutionOptions, ExecutionResult } from './execution.types';
import { LanguageRegistry } from './strategies/language-registry';

const execFileAsync = promisify(execFile);

/**
 * Security configuration applied to every container.
 *
 * Tradeoffs documented per-option:
 * - --network none: prevents outbound HTTP; tradeoff: packages can't be fetched at runtime (desired).
 * - --memory: hard OOM kill. Tradeoff: JVM / V8 heap may not perfectly map to RSS.
 * - --cpus: throttles to N CPUs. Tradeoff: doesn't prevent CPU bursts within the slice.
 * - --pids-limit: prevents fork bombs. Tradeoff: language runtimes that spawn threads count against this.
 * - --read-only: prevents writes outside /sandbox. Tradeoff: some runtimes need /tmp (overridden with tmpfs).
 * - --cap-drop ALL: removes all Linux capabilities. Tradeoff: no raw socket, no chroot, no setuid.
 * - --security-opt no-new-privileges: prevents privilege escalation via setuid binaries.
 * - --user 65534 (nobody): runs as non-root inside the container.
 */
const DOCKER_SECURITY_FLAGS = [
  '--network', 'none',
  '--cap-drop', 'ALL',
  '--security-opt', 'no-new-privileges',
  '--read-only',
  '--tmpfs', '/tmp:size=64m,noexec,nosuid',
  '--user', '65534:65534',
  '--pids-limit', '64',
];

const MAX_OUTPUT_BYTES = 1 * 1024 * 1024; // 1 MB stdout/stderr cap

@Injectable()
export class DockerExecutionService {
  private readonly logger = new Logger(DockerExecutionService.name);

  constructor(private readonly languageRegistry: LanguageRegistry) {}

  async execute(options: ExecutionOptions): Promise<ExecutionResult> {
    const strategy = this.languageRegistry.resolve(options.language);
    const workDir = await this.createTempWorkDir();

    try {
      // Write source code to temp dir
      await fs.writeFile(
        path.join(workDir, strategy.sourceFileName),
        options.sourceCode,
        'utf8',
      );

      // Write stdin to a file (avoids shell injection via process.argv)
      const stdinFile = path.join(workDir, 'stdin.txt');
      await fs.writeFile(stdinFile, options.stdin, 'utf8');

      const containerName = `judge-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

      // ── Compile phase ──────────────────────────────────────────────
      const compileCommand = strategy.getCompileCommand();
      if (compileCommand) {
        const compileResult = await this.runContainer({
          containerName: `${containerName}-compile`,
          image: strategy.dockerImage,
          workDir,
          command: ['sh', '-c', compileCommand],
          timeLimitMs: 30_000, // Compilation timeout: 30 s
          memoryLimitMb: options.memoryLimitMb,
          stdinFile: null,
        });

        if (compileResult.exitCode !== 0) {
          return {
            stdout: '',
            stderr: compileResult.stderr,
            exitCode: compileResult.exitCode,
            executionTimeMs: 0,
            timedOut: false,
            oomKilled: compileResult.oomKilled,
          };
        }
      }

      // ── Run phase ──────────────────────────────────────────────────
      const runCommand = strategy.getRunCommand();
      return this.runContainer({
        containerName: `${containerName}-run`,
        image: strategy.dockerImage,
        workDir,
        command: ['sh', '-c', `${runCommand} < /sandbox/stdin.txt`],
        timeLimitMs: options.timeLimitMs,
        memoryLimitMb: options.memoryLimitMb,
        stdinFile,
      });
    } finally {
      // Always clean up temp directory
      await fs.rm(workDir, { recursive: true, force: true }).catch((err) =>
        this.logger.warn(`Failed to clean up workDir ${workDir}: ${err.message}`),
      );
    }
  }

  private async runContainer(params: {
    containerName: string;
    image: string;
    workDir: string;
    command: string[];
    timeLimitMs: number;
    memoryLimitMb: number;
    stdinFile: string | null;
  }): Promise<ExecutionResult> {
    const {
      containerName,
      image,
      workDir,
      command,
      timeLimitMs,
      memoryLimitMb,
    } = params;

    const dockerArgs = [
      'run',
      '--rm',
      '--name', containerName,
      '--volume', `${workDir}:/sandbox:ro`,
      '--workdir', '/sandbox',
      '--memory', `${memoryLimitMb}m`,
      '--memory-swap', `${memoryLimitMb}m`, // disable swap
      '--cpus', '1.0',
      ...DOCKER_SECURITY_FLAGS,
      image,
      ...command,
    ];

    this.logger.debug(`Spawning container: ${containerName}`);
    const startTime = Date.now();

    let stdout = '';
    let stderr = '';
    let exitCode = 0;
    let timedOut = false;
    let oomKilled = false;

    const timeoutHandle = setTimeout(async () => {
      timedOut = true;
      await this.killContainer(containerName);
    }, timeLimitMs);

    try {
      const result = await execFileAsync('docker', dockerArgs, {
        maxBuffer: MAX_OUTPUT_BYTES,
        timeout: timeLimitMs + 2000, // grace period after we kill manually
      });
      stdout = result.stdout;
      stderr = result.stderr;
    } catch (err: any) {
      // execFile rejects on non-zero exit or timeout
      stdout = err.stdout ?? '';
      stderr = err.stderr ?? '';
      exitCode = err.code ?? 1;

      // Detect OOM kill: Docker sets exit code 137 (128 + SIGKILL) for OOM
      if (exitCode === 137 && !timedOut) {
        oomKilled = await this.wasOomKilled(containerName);
      }
    } finally {
      clearTimeout(timeoutHandle);
    }

    const executionTimeMs = Date.now() - startTime;

    // Truncate oversized output
    if (stdout.length > MAX_OUTPUT_BYTES) {
      stdout = stdout.slice(0, MAX_OUTPUT_BYTES);
    }
    if (stderr.length > MAX_OUTPUT_BYTES) {
      stderr = stderr.slice(0, MAX_OUTPUT_BYTES);
    }

    return {
      stdout: stdout.trim(),
      stderr: stderr.trim(),
      exitCode,
      executionTimeMs,
      timedOut,
      oomKilled,
    };
  }

  private async killContainer(name: string): Promise<void> {
    try {
      await execFileAsync('docker', ['kill', name]);
    } catch {
      // Container may have already exited — ignore
    }
  }

  /**
   * Inspect container state to confirm OOM kill.
   * Only applicable when exit code is 137.
   */
  private async wasOomKilled(name: string): Promise<boolean> {
    try {
      const { stdout } = await execFileAsync('docker', [
        'inspect',
        '--format',
        '{{.State.OOMKilled}}',
        name,
      ]);
      return stdout.trim() === 'true';
    } catch {
      return false;
    }
  }

  private async createTempWorkDir(): Promise<string> {
    try {
      return await fs.mkdtemp(path.join(os.tmpdir(), 'judge-'));
    } catch (err: any) {
      throw new InternalServerErrorException(
        `Failed to create temp directory: ${err.message}`,
      );
    }
  }
}
