const { Queue, Worker, QueueEvents } = require('bullmq');

const connection = {
  host: process.env.REDIS_HOST || 'localhost',
  port: process.env.REDIS_PORT || 6379
};

const executionQueue = new Queue('executions', { connection });
const queueEvents = new QueueEvents('executions', { connection });

module.exports = { executionQueue, queueEvents, connection };