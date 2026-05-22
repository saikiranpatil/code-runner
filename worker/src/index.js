const { Worker } = require('bullmq');
const { execute } = require('./executor');
const { connection } = require('../src/queue');

const WORKER_CONCURRENCY = 3;

const worker = new Worker('executions', async (job) => {
    const { code, language } = job.data;
    const result = await execute(code, language);
    return result; // this becomes job.returnvalue
}, {
    connection,
    concurrency: WORKER_CONCURRENCY // max 3 containers running at once
});

worker.on('completed', (job) => console.log(`Job ${job.id} done`));
worker.on('failed', (job, err) => console.error(`Job ${job.id} failed:`, err));

// If worker itself throws unexpectedly
process.on('unhandledRejection', (err) => {
    console.error('Unhandled rejection in worker:', err);
});

console.log(`Worker started, concurrency: ${WORKER_CONCURRENCY}`);