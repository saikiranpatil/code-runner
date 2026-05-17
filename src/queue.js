const { Queue, Worker, QueueEvents } = require('bullmq');

const connection = { host: 'localhost', port: 6379 };

const executionQueue = new Queue('executions', { connection });
const queueEvents = new QueueEvents('executions', { connection });

module.exports = { executionQueue, queueEvents, connection };