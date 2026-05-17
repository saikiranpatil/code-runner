const { Worker } = require('bullmq');
const { execute } = require('./executor');
const { connection } = require('./queue');

const worker = new Worker('executions', async (job) => {
    const { code, language } = job.data;
    const result = await execute(code, language);
    return result; // this becomes job.returnvalue
}, {
    connection,
    concurrency: 3  // max 3 containers running at once
});

worker.on('completed', (job) => console.log(`Job ${job.id} done`));
worker.on('failed', (job, err) => console.error(`Job ${job.id} failed:`, err));

console.log('Worker started, concurrency: 3');