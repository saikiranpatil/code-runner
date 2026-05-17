const { spawn } = require('child_process');
const { randomUUID } = require('crypto');
const languages = require('./languages');

const MAX_OUTPUT_BYTES = 1024 * 100; // 100KB

function execute(code, language = 'javascript', timeoutMs = 5000) {
    return new Promise((resolve) => {
        const lang = languages[language];

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
            if (outputBytes > MAX_OUTPUT_BYTES) {
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
        }, timeoutMs);

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

module.exports = { execute };