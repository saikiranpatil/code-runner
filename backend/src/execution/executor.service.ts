import { Injectable, Logger } from '@nestjs/common';
import { envConfig, LANGUAGES } from '../config';
import { randomUUID } from 'crypto';
import { spawn } from 'child_process';

export interface ExecutionResult {
  stdout: string;
  stderr: string;
  exitCode: number | null;
  timedOut: boolean;
  oomKilled: boolean;
  outputLimitHit: boolean;
}

@Injectable()
export class ExecutorService {
  private readonly logger = new Logger(ExecutorService.name);

  execute(code: string, language: string): Promise<ExecutionResult> {
    return new Promise((resolve, reject) => {
      const langConfig = LANGUAGES[language];
      if (!langConfig) {
        return reject(new Error(`Unsupported language: ${language}`));
      }

      const containerName = `runner-${randomUUID()}`;
      const timeout = envConfig.worker.executionTimeout;
      const maxBytes = envConfig.worker.maxOutputBytes;

      const args = [
        'run',
        '--rm',
        '--name', containerName,
        '--network', 'none',
        '--memory', '128m',
        '--memory-swap', '128m',
        '--cpus', '0.5',
        '--read-only',
        '--cap-drop', 'ALL',
        '--security-opt', 'no-new-privileges',
        langConfig.image,
        ...langConfig.cmd,
      ];

      const child = spawn('docker', args);

      let stdout = '';
      let stderr = '';
      let timedOut = false;
      let oomKilled = false;
      let outputLimitHit = false;
      let settled = false;

      // Kill the container on the host (not just the spawned process)
      const killContainer = () => {
        try {
          spawn('docker', ['kill', containerName], { stdio: 'ignore' });
        } catch {
          // best-effort; container may have already exited
        }
      };

      // Timeout
      const timer = setTimeout(() => {
        timedOut = true;
        killContainer();
        child.kill('SIGKILL');
      }, timeout);

      // stdout / stderr collection with output cap
      const handleChunk = (
        target: 'stdout' | 'stderr',
        chunk: Buffer,
      ) => {
        const current = target === 'stdout' ? stdout : stderr;
        const text = chunk.toString('utf8');
        
        const remaining = maxBytes - current.length;
        if (remaining <= 0) {
          outputLimitHit = true;
          return;
        }
        
        const trimmed = text.slice(0, remaining);
        if (target === 'stdout') stdout += trimmed;
        else stderr += trimmed;

        if (stdout.length + stderr.length >= maxBytes) {
          outputLimitHit = true;
          killContainer();
          child.kill('SIGKILL');
        }
      };

      child.stdout.on('data', (chunk: Buffer) => handleChunk('stdout', chunk));
      child.stderr.on('data', (chunk: Buffer) => handleChunk('stderr', chunk));

      // Write code to container stdin
      if (code) {
        child.stdin.write(code);
        child.stdin.end();
      }

      // Process exit
      child.on('close', (exitCode, signal) => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        
        // Always attempt cleanup even on normal exit
        killContainer();

        // Docker OOM killer uses exit code 137 (SIGKILL)
        if (exitCode === 137 && !timedOut) oomKilled = true;

        resolve({ stdout, stderr, exitCode, timedOut, oomKilled, outputLimitHit });
      });

      child.on('error', (err) => {
        if (settled) return;
        
        settled = true;
        clearTimeout(timer);
        killContainer();
        
        this.logger.error(`Executor spawn error: ${err.message}`, err.stack);
        
        reject(err);
      });
    });
  }
}