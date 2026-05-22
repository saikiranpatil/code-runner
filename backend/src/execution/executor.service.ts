// executor.service.ts

import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { spawn } from 'child_process';
import { randomUUID } from 'crypto';
import { AppConfig } from 'src/config/configuration';
import { LANGUAGES } from 'src/config/languages.config';

@Injectable()
export class ExecutorService {
    private readonly executionTimeout: number;
    private readonly maxOutputBytes: number;

    constructor(
        private readonly config: ConfigService<AppConfig>,
    ) {
        const executionConfig = this.config.getOrThrow('execution');
        this.executionTimeout = executionConfig.executionTimeout;
        this.maxOutputBytes = executionConfig.maxOutputBytes;
    }

    execute(
        code: string,
        language = 'js',
        timeoutMs = this.executionTimeout,
    ) {
        return new Promise((resolve) => {
            const lang = LANGUAGES[language];
            if (!lang) {
                return resolve({
                    stdout: '',
                    stderr: `Unsupported language: ${language}`,
                    exitCode: 1,
                    timedOut: false,
                });
            }

            const containerName = `runner-${randomUUID()}`;

            const child = spawn('docker', [
                'run',
                '--rm',
                '-i',
                '--name',
                containerName,
                '--network',
                'none',
                '--memory',
                '50m',
                '--cpus',
                '0.5',
                lang.image,
                ...lang.cmd,
            ]);

            let stdout = '';
            let stderr = '';
            let outputBytes = 0;
            let outputLimitHit = false;

            const killContainer = () => {
                child.kill('SIGKILL');

                spawn('docker', [
                    'kill',
                    containerName,
                ]);
            }

            const handleChunk = (
                target: 'stdout' | 'stderr',
                chunk: Buffer,
            ) => {
                outputBytes += chunk.length;

                if (outputBytes > this.maxOutputBytes) {
                    outputLimitHit = true;
                    killContainer();
                    return;
                }

                if (target === 'stdout') {
                    stdout += chunk.toString();
                } else {
                    stderr += chunk.toString();
                }
            }

            child.stdout.on('data', (chunk) =>
                handleChunk('stdout', chunk),
            );

            child.stderr.on('data', (chunk) =>
                handleChunk('stderr', chunk),
            );

            const timer = setTimeout(() => {
                killContainer();

                resolve({
                    stdout,
                    stderr,
                    exitCode: null,
                    timedOut: true,
                    oomKilled: false,
                    outputLimitHit: false,
                });
            }, timeoutMs);

            child.on('close', (exitCode) => {
                clearTimeout(timer);

                resolve({
                    stdout,
                    stderr,
                    exitCode,
                    timedOut: false,
                    oomKilled: exitCode === 137,
                    outputLimitHit,
                });
            });

            child.on('error', (err) => {
                clearTimeout(timer);

                resolve({
                    stdout: '',
                    stderr: err.message,
                    exitCode: null,
                    timedOut: false,
                    oomKilled: false,
                    outputLimitHit: false,
                });
            });

            child.stdin.write(code);
            child.stdin.end();
        });
    }
}