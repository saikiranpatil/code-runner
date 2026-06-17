import { Injectable, Logger } from '@nestjs/common';
import { execFile } from 'child_process';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';
import { promisify } from 'util';
import { ExecutionOptions, ExecutionResult } from './execution.types';
import { LanguageRegistry } from './strategies/language-registry';

const execFileAsync = promisify(execFile);

// RUN phase: full lockdown — container can only read /sandbox, write to /tmp
const RUN_SECURITY_FLAGS = [
  '--network', 'none',
  '--cap-drop', 'ALL',
  '--security-opt', 'no-new-privileges',
  '--read-only',
  '--tmpfs', '/tmp:size=64m,noexec,nosuid',
  '--user', '65534:65534',
  '--pids-limit', '64',
];

// COMPILE phase: relaxed — compiler needs to write binary back to /sandbox
// Still no network, still no capabilities, still no root
const COMPILE_SECURITY_FLAGS = [
  '--network', 'none',
  '--cap-drop', 'ALL',
  '--security-opt', 'no-new-privileges',
  '--tmpfs', '/tmp:size=256m,nosuid', // no noexec — javac/tsc need to exec helpers
  '--user', '65534:65534',
  '--pids-limit', '128', // javac spawns annotation processors
];

const MAX_OUTPUT_BYTES = 1 * 1024 * 1024;

@Injectable()
export class DockerExecutionService {
  private readonly logger = new Logger(DockerExecutionService.name);
  private readonly isWindows = os.platform() === 'win32';

  constructor(private readonly languageRegistry: LanguageRegistry) { }

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

      // Always write stdin.txt — even if empty — so the shell command always finds it.
      await fs.writeFile(
        path.join(workDir, 'stdin.txt'),
        options.stdin ?? '',
        'utf8',
      );

      await fs.chmod(path.join(workDir, strategy.sourceFileName), 0o777);
      await fs.chmod(path.join(workDir, 'stdin.txt'), 0o777);

      const containerName = `judge-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

      // ── Compile phase ──────────────────
      const compileCommand = strategy.getCompileCommand();
      if (compileCommand) {
        const compileResult = await this.runContainer({
          containerName: `${containerName}-compile`,
          image: strategy.dockerImage,
          workDir,
          command: ['sh', '-c', compileCommand],
          securityFlags: COMPILE_SECURITY_FLAGS,
          volumeMode: 'rw',
          timeLimitMs: 30_000,
          memoryLimitMb: 512,
        });

        if (compileResult.exitCode !== 0) {
          return {
            stdout: '',
            stderr: compileResult.stderr,
            exitCode: compileResult.exitCode,
            executionTimeMs: 0,
            timedOut: false,
            oomKilled: false,
          };
        }
      }

      // ── Run phase ──────────────────────────────────────────────────
      const runCmd = strategy.getRunCommand();
      const wrappedRunCmd = `start=$(date +%s%N); ${runCmd} < /sandbox/stdin.txt; rc=$?; end=$(date +%s%N); echo "__T:$((end-start))" >&2; exit $rc`;
      return await this.runContainer({
        containerName: `${containerName}-run`,
        image: strategy.dockerImage,
        workDir,
        command: ['sh', '-c', `${wrappedRunCmd} < /sandbox/stdin.txt`],
        securityFlags: RUN_SECURITY_FLAGS,
        volumeMode: 'ro',
        timeLimitMs: options.timeLimitMs,
        memoryLimitMb: options.memoryLimitMb,
        isRunPhase: true,
      });

    }
    finally {
      // Attempt clean up of workspace directory
      await fs.rm(workDir, { recursive: true, force: true }).catch((err) =>
        this.logger.warn(`Failed to clean up ${workDir}: ${err.message}`),
      );
    }
  }

  private async runContainer(params: {
    containerName: string;
    image: string;
    workDir: string;
    command: string[];
    securityFlags: string[];
    volumeMode: 'ro' | 'rw';
    timeLimitMs: number;
    memoryLimitMb: number;
    isRunPhase?: boolean; // NEW OPTIONAL FLAG
  }): Promise<ExecutionResult> {
    const {
      containerName,
      image,
      workDir,
      command,
      securityFlags, 
      volumeMode, 
      timeLimitMs,
      memoryLimitMb,
      isRunPhase = false
     } = params;

    const normalizedWorkDir = this.isWindows ? workDir.replace(/\\/g, '/') : workDir;

    const dockerArgs = [
      'run', '--rm',
      '--name', containerName,
      '--volume', `${normalizedWorkDir}:/sandbox:${volumeMode}`,
      '--workdir', '/sandbox',
      '--memory', `${memoryLimitMb}m`,
      '--memory-swap', `${memoryLimitMb}m`,
      '--cpus', '1.0',
      ...securityFlags,
      image,
      ...command,
    ];

    this.logger.debug(`docker ${dockerArgs.join(' ')}`);
    const startTime = Date.now();

    let stdout = '';
    let stderr = '';
    let exitCode = 0;
    let outerTimedOut = false;
    let oomKilled = false;

    // ADD A 1500MS SAFETY SLACK FOR DOCKER PLUMBING
    const killTimer = setTimeout(async () => {
      outerTimedOut = true;
      await this.killContainer(containerName);
    }, timeLimitMs + 1500);

    try {
      const env = { ...process.env };
      if (this.isWindows) {
        env['MSYS_NO_PATHCONV'] = '1';
      }

      const result = await execFileAsync('docker', dockerArgs, {
        maxBuffer: MAX_OUTPUT_BYTES * 2,
        env,
      });
      stdout = result.stdout;
      stderr = result.stderr;
    } catch (err: any) {
      stdout = err.stdout ?? '';
      stderr = err.stderr ?? '';
      exitCode = err.code ?? 1;

      if (exitCode === 137 && !outerTimedOut) {
        oomKilled = true;
      }
    } finally {
      clearTimeout(killTimer);
    }

    // DEFAULT FALLBACK VALUES
    let executionTimeMs = Date.now() - startTime; 
    let finalTimedOut = outerTimedOut;

    // PARSE IN-CONTAINER REAL TIME (RUN PHASE ONLY)
    if (isRunPhase) {
      const markerRegex = /__T:(\Bigint|\d+)\r?\n?$/;
      const match = stderr.match(markerRegex);

      if (match) {
        const nanoseconds = BigInt(match[1]);
        // Convert to rounded milliseconds
        executionTimeMs = Number(nanoseconds / 1_000_000n); 
        // Remove the tracking marker from standard error output
        stderr = stderr.replace(markerRegex, ''); 
      }

      if (executionTimeMs > timeLimitMs) {
        finalTimedOut = true;
      }
    }

    return {
      stdout: stdout.slice(0, MAX_OUTPUT_BYTES).trim(),
      stderr: stderr.slice(0, MAX_OUTPUT_BYTES).trim(),
      exitCode,
      executionTimeMs,
      timedOut: finalTimedOut,
      oomKilled,
    };
  }

  private async killContainer(name: string): Promise<void> {
    try {
      await execFileAsync('docker', ['kill', name]);
    } catch {
      // May have already exited cleanly — ignore
    }
  }

  private async createTempWorkDir(): Promise<string> {
    let baseTmpDir: string;

    if (this.isWindows) {
      // FIX #1 (Windows context): Instead of standard OS temp directories which require manual sharing configuration,
      // utilize the User Profile home directory which is pre-shared by default via WSL2 backend configurations.
      baseTmpDir = path.join(os.homedir(), '.docker-judge-tmp');
    } else {
      // FIX #1 (macOS/Linux context): Use system root /tmp directly since /var/folders/ is blocked by default on Mac
      baseTmpDir = '/tmp/docker-judge-tmp';
    }

    // Ensure the base runner temp directory exists
    await fs.mkdir(baseTmpDir, { recursive: true });

    // Generate unique micro-workspace for this isolated job
    const uniqueFolder = path.join(baseTmpDir, `job-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`);
    await fs.mkdir(uniqueFolder, { recursive: true });
    
    // Give global permissions to the workspace directory so user 65534 can interact with files inside
    await fs.chmod(uniqueFolder, 0o777);

    return uniqueFolder;
  }
}
