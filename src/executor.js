const { spawn } = require("child_process");

function execute(code, timeoutMs = 5000) {
    return new Promise((resolve) => {
        const child = spawn('node', ['-'], { stdio: ['pipe', 'pipe', 'pipe'] });

        let stdout = '';
        let stderr = '';

        child.stdout.on('data', (chunk) => stdout += chunk.toString());
        child.stderr.on('data', (chunk) => stderr += chunk.toString());

        const timer = setTimeout(() => {
            child.kill('SIGKILL');
            resolve({ stdout, stderr, exitCode: null, timedOut: true });
        }, timeoutMs);

        child.on('close', (exitCode) => {
            clearTimeout(timer);
            resolve({ stdout, stderr, exitCode, timedOut: false });
        });

        child.stdin.write(code);
        child.stdin.end();
    });
}

module.exports = { execute };