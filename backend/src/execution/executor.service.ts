import { Injectable } from "@nestjs/common";
import { envConfig, LANGUAGES } from "../config";
import { randomUUID } from "crypto";
import { spawn } from "child_process";

@Injectable()
export class ExecutorService {
    constructor() { }

    execute(code, language) {
        return new Promise((resolve) => {
            const lang = LANGUAGES[language];

            if (!lang) {
                return resolve({ stdout: '', stderr: `Unsupported language: ${language}`, exitCode: 1, timedOut: false });
            }

            const containerName = `runner-${randomUUID()}`;  // unique per execution

            const child = spawn('docker', [
                'run', '--rm',
                '-i',
                '--name', containerName,   // ← named container
                '--network', 'none',
                '--memory', '50m',
                '--cpus', '0.5',
                lang.image,
                ...lang.cmd
            ]);

            let stdout = '';
            let stderr = '';
            let outputBytes = 0;
            let outputLimitHit = false;

            function killContainer() {
                // Kill both the host process AND the container
                child.kill('SIGKILL');
                spawn('docker', ['kill', containerName]);  // ensure container dies
            }

            function handleChunk(target, chunk) {
                outputBytes += chunk.length;
                if (outputBytes > envConfig.worker.maxOutputBytes) {
                    outputLimitHit = true;
                    killContainer();
                    return;
                }
                if (target === 'stdout') stdout += chunk.toString();
                else stderr += chunk.toString();
            }

            child.stdout.on('data', (chunk) => handleChunk('stdout', chunk));
            child.stderr.on('data', (chunk) => handleChunk('stderr', chunk));

            const timer = setTimeout(() => {
                killContainer();
                resolve({ stdout, stderr, exitCode: null, timedOut: true, oomKilled: false, outputLimitHit: false });
            }, envConfig.worker.executionTimeout);

            child.on('close', (exitCode) => {
                clearTimeout(timer);
                resolve({
                    stdout,
                    stderr,
                    exitCode,
                    timedOut: false,
                    oomKilled: exitCode === 137,
                    outputLimitHit
                });
            });

            child.on('error', (err) => {
                clearTimeout(timer);
                resolve({ stdout: '', stderr: err.message, exitCode: null, timedOut: false, oomKilled: false, outputLimitHit: false });
            });

            child.stdin.write(code);
            child.stdin.end();
        });
    }
}