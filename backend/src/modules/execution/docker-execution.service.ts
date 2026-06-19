import { Injectable, Logger } from '@nestjs/common';
import { execFile } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';
import { ExecutionOptions, ExecutionResult } from './execution.types';
import { LanguageRegistry } from './strategies/language-registry';
import { LanguageStrategy } from './strategies/language-strategy.interface';

const execFileAsync = promisify(execFile);

const COMPILE_TIMEOUT_MS = 30_000;
const COMPILE_MEMORY_MB = 512;

const MAX_OUTPUT_BYTES = 1 * 1024 * 1024; // 1 MB

const KILL_GRACE_MS = 1_500;

const TIMING_MARKER_REGEX = /__T:(\d+)\r?\n?$/;

const RUN_SECURITY_FLAGS = [
  '--cap-drop', 'ALL',
  '--security-opt', 'no-new-privileges',
  '--read-only',
  '--tmpfs', '/tmp:size=64m,noexec,nosuid',
  '--user', '65534:65534',
  '--pids-limit', '64',
];

const COMPILE_SECURITY_FLAGS = [
  '--cap-drop', 'ALL',
  '--security-opt', 'no-new-privileges',
  '--tmpfs', '/tmp:size=256m,nosuid',
  '--user', '65534:65534',
  '--pids-limit', '128',
];

/**
 * Prevents Git Bash / MSYS2 on Windows from rewriting volume mount paths
 * (e.g. /c/Users/... → C:\Users\...) when passing arguments to `docker run`.
 * Has no effect on Linux / macOS.
 */
function getPlatformSafeEnv(): NodeJS.ProcessEnv {
  return {
    ...process.env,
    MSYS_NO_PATHCONV: '1',
    MSYS2_ARG_CONV_EXCL: '*',
  };
}

/**
 * Wraps a shell command so the container measures its own wall-clock execution
 * time at nanosecond resolution and reports it on stderr as `__T:<nanoseconds>`.
 *
 * We do this instead of timing `docker run` from the host because host-side timing
 * also captures Docker's own startup/teardown overhead, which would make programs
 * appear to take longer than they actually did — and could push borderline-fast
 * solutions over the time limit unfairly.
 */
function wrapWithTiming(command: string): string {
  return `start=$(date +%s%N); ${command}; rc=$?; end=$(date +%s%N); echo "__T:$((end-start))" >&2; exit $rc`;
}

interface ContainerRunParams {
  containerName: string;
  image: string;
  workDir: string;
  command: string[];
  securityFlags: string[];
  /** 'rw' for the compile phase (output files must be written); 'ro' for the run phase. */
  volumeMode: 'ro' | 'rw';
  timeLimitMs: number;
  memoryLimitMb: number;
  /** When true, the in-container `__T:` timing marker is parsed out of stderr. */
  isRunPhase?: boolean;
}

@Injectable()
export class DockerExecutionService {
  private readonly logger = new Logger(DockerExecutionService.name);
  private readonly isWindows = os.platform() === 'win32';

  constructor(private readonly languageRegistry: LanguageRegistry) { }

  async execute(options: ExecutionOptions): Promise<ExecutionResult> {
    const { language, sourceCode, stdin, timeLimitMs, memoryLimitMb } = options;
    const strategy = this.languageRegistry.resolve(language);
    const workDir = await this.createTempWorkDir();
    // A unique session ID scopes container names so concurrent runs never collide.
    const sessionId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

    try {
      await this.writeWorkspaceFiles(workDir, strategy, sourceCode, stdin ?? '');

      const compileFailure = await this.compileSourceCode(workDir, strategy, sessionId);
      if (compileFailure !== null) {
        // Return immediately — there is no point running test cases against code
        // that didn't compile.
        return compileFailure;
      }

      return await this.runSourceCode(workDir, strategy, sessionId, timeLimitMs, memoryLimitMb);
    } finally {
      await this.cleanupWorkDir(workDir);
    }
  }

  /**
   * Writes the source file and the stdin payload into the workspace.
   *
   * stdin is written to a file (rather than piped through `echo`) so multi-line
   * input survives intact — shell-escaping a string for `echo`/`printf` is brittle
   * and mangles embedded newlines.
   */
  private async writeWorkspaceFiles(
    workDir: string,
    strategy: LanguageStrategy,
    sourceCode: string,
    stdin: string,
  ): Promise<void> {
    const sourcePath = path.join(workDir, strategy.sourceFileName);
    const stdinPath = path.join(workDir, 'stdin.txt');

    await fs.writeFile(sourcePath, sourceCode, 'utf-8');
    // Always write stdin.txt, even when empty, so the run command can unconditionally redirect from it.
    await fs.writeFile(stdinPath, stdin, 'utf-8');

    // The run/compile containers execute as the unprivileged user 65534, so both
    // files need to be world-readable (and world-writable, since some compilers
    // touch the source file, e.g. to normalize line endings).
    await fs.chmod(sourcePath, 0o777);
    await fs.chmod(stdinPath, 0o777);
  }

  private async cleanupWorkDir(workDir: string): Promise<void> {
    await fs.rm(workDir, { recursive: true, force: true }).catch((err: Error) => {
      this.logger.warn(`Failed to remove work directory ${workDir}: ${err.message}`);
    });
  }

  /**
   * Runs the compilation step for languages that require it (C++, Java, TypeScript).
   *
   * @returns `null` when compilation is not needed or succeeds.
   *          An `ExecutionResult` with `compilationFailed: true` when the compiler
   *          exits non-zero, so the caller can surface a `COMPILATION_ERROR` verdict.
   */
  private async compileSourceCode(
    workDir: string,
    strategy: LanguageStrategy,
    sessionId: string,
  ): Promise<ExecutionResult | null> {
    const compileCommand = strategy.getCompileCommand();
    if (!compileCommand) return null;

    const result = await this.runContainer({
      containerName: `code-runner-${sessionId}-compile`,
      image: strategy.dockerImage,
      workDir,
      command: ['sh', '-c', compileCommand],
      securityFlags: COMPILE_SECURITY_FLAGS,
      // Compilation must write output binaries/class files into the work directory.
      volumeMode: 'rw',
      timeLimitMs: COMPILE_TIMEOUT_MS,
      memoryLimitMb: COMPILE_MEMORY_MB,
    });

    if (result.exitCode === 0) return null;

    return { ...result, compilationFailed: true };
  }

  /**
   * Runs the user's compiled (or interpreted) code against the stdin file already
   * written into the workspace, timing it precisely via `wrapWithTiming`.
   */
  private async runSourceCode(
    workDir: string,
    strategy: LanguageStrategy,
    sessionId: string,
    timeLimitMs: number,
    memoryLimitMb: number,
  ): Promise<ExecutionResult> {
    const runCommand = `${strategy.getRunCommand()} < /workspace/stdin.txt`;

    return this.runContainer({
      containerName: `code-runner-${sessionId}-run`,
      image: strategy.dockerImage,
      workDir,
      command: ['sh', '-c', wrapWithTiming(runCommand)],
      securityFlags: RUN_SECURITY_FLAGS,
      // The source file (and any compiled artifacts) are already written; lock the
      // volume read-only so user code cannot modify its own container filesystem.
      volumeMode: 'ro',
      timeLimitMs,
      memoryLimitMb,
      isRunPhase: true,
    });
  }

  // ── Private: Docker orchestration ─────────────────────────────────────────

  private async runContainer(params: ContainerRunParams): Promise<ExecutionResult> {
    const { containerName, timeLimitMs, isRunPhase = false } = params;
    const args = this.buildDockerRunArgs(params);
    const env = getPlatformSafeEnv();

    const startTime = Date.now();
    let timedOut = false;
    let killTimer: NodeJS.Timeout | null = null;

    const { stdout, stderr, exitCode } = await new Promise<{ stdout: string; stderr: string; exitCode: number }>(
      (resolve) => {
        execFile(
          'docker',
          args,
          { env, maxBuffer: MAX_OUTPUT_BYTES * 2 },
          (error, rawStdout, rawStderr) => {
            if (killTimer) clearTimeout(killTimer);
            resolve({
              stdout: rawStdout ?? '',
              stderr: rawStderr ?? '',
              exitCode: this.extractExitCode(error),
            });
          },
        );

        // Give Docker a little extra time beyond the requested limit to absorb its
        // own startup/teardown overhead before we force-kill the container.
        killTimer = setTimeout(async () => {
          timedOut = true;
          await this.killContainer(containerName);
        }, timeLimitMs + KILL_GRACE_MS);
      },
    );

    // Docker SIGKILLs an OOM'd container, which surfaces as exit code 137. Only
    // attribute that to OOM if our own timeout didn't fire first.
    const oomKilled = exitCode === 137 && !timedOut;

    let executionTimeMs = Date.now() - startTime;
    let finalStderr = stderr;

    // The run phase wraps its command with `wrapWithTiming`, which reports the
    // container's own high-resolution execution time on stderr. Prefer that over
    // host-side wall-clock timing, which also bakes in Docker's startup/teardown
    // overhead and would overstate how long the user's code actually ran.
    if (isRunPhase) {
      const match = stderr.match(TIMING_MARKER_REGEX);
      if (match) {
        const nanoseconds = BigInt(match[1]);
        executionTimeMs = Number(nanoseconds / 1_000_000n);
        finalStderr = stderr.replace(TIMING_MARKER_REGEX, '');
      }

      if (executionTimeMs > timeLimitMs) {
        timedOut = true;
      }
    }

    return {
      stdout: stdout.slice(0, MAX_OUTPUT_BYTES).trim(),
      stderr: finalStderr.slice(0, MAX_OUTPUT_BYTES).trim(),
      exitCode,
      executionTimeMs,
      timedOut,
      oomKilled,
      compilationFailed: false,
    };
  }

  /**
   * Node reports a failed child process's exit code on `error.code`. Falls back to
   * `1` if it's missing or non-numeric (e.g. a spawn-level error code like 'ENOENT').
   */
  private extractExitCode(error: (Error & { code?: number | string | null }) | null): number {
    if (!error) return 0;
    const code = Number(error.code);
    return Number.isFinite(code) ? code : 1;
  }

  /**
   * Builds the `docker run` argument list.
   *
   * Security policy is centralised here rather than spread across callers. The base
   * flags below apply to every phase; phase-specific hardening (capabilities, the
   * non-root user, read-only root fs for the run phase, etc.) is layered in via
   * `securityFlags` — see `RUN_SECURITY_FLAGS` / `COMPILE_SECURITY_FLAGS`.
   */
  private buildDockerRunArgs(params: ContainerRunParams): string[] {
    const { containerName, image, workDir, command, securityFlags, volumeMode, memoryLimitMb } = params;

    // Git Bash / MSYS2 rewrites POSIX-style paths in arguments; normalize to forward
    // slashes so the volume spec docker receives is well-formed on Windows too.
    const normalizedWorkDir = this.isWindows ? workDir.replace(/\\/g, '/') : workDir;

    return [
      'run',
      '--rm',
      '--name', containerName,
      `--memory=${memoryLimitMb}m`,
      `--memory-swap=${memoryLimitMb}m`,
      '--cpus=1.0',
      '--network=none',
      ...securityFlags,
      '-v', `${normalizedWorkDir}:/workspace:${volumeMode}`,
      '-w', '/workspace',
      image,
      ...command,
    ];
  }

  private async killContainer(name: string): Promise<void> {
    try {
      await execFileAsync('docker', ['kill', name]);
    } catch {
      // The container may have already exited between the timeout firing and this
      // call reaching Docker — safe to ignore.
    }
  }

  private async createTempWorkDir(): Promise<string> {
    // `os.tmpdir()` resolves to `/var/folders/...` on macOS and a random AppData
    // path on Windows — neither is shared with Docker Desktop's VM by default, so
    // bind-mounting them silently fails. Use locations Docker Desktop shares out of
    // the box instead.
    const baseTmpDir = this.isWindows
      ? path.join(os.homedir(), '.docker-judge-tmp') // shared automatically via the WSL2 backend
      : '/tmp/docker-judge-tmp'; // /var/folders is not shared by default on macOS

    await fs.mkdir(baseTmpDir, { recursive: true });

    const jobDir = path.join(baseTmpDir, `job-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`);
    await fs.mkdir(jobDir, { recursive: true });

    // The container runs as the unprivileged user 65534, which needs write access
    // here to create compiled artifacts during the compile phase.
    await fs.chmod(jobDir, 0o777);

    return jobDir;
  }
}