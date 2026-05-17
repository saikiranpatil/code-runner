const { spawn } = require("child_process");

function execute(code, timeoutMs = 5000) {
    return new Promise((resolve) => {
        const child = spawn('docker', [
            'run', '--rm',        // delete container after exit
            '-i',                 // keep stdin open so we can pipe code in
            '--network', 'none',  // no internet
            '--memory', '50m',    // max 50MB RAM
            '--cpus', '0.5',      // max half a CPU
            'node:alpine',        // image
            'node', '--input-type=module', '-'
        ]);

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

            const oomKilled = exitCode === 137;
            resolve({ stdout, stderr, exitCode, timedOut: false, oomKilled });
        });

        child.stdin.write(code);
        child.stdin.end();
    });
}

module.exports = { execute };