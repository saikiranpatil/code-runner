const express = require('express');
const { execute } = require('./executor');
const { executionQueue, queueEvents } = require('./queue');

const app = express();
app.use(express.json());

app.post('/execute', async (req, res) => {
  const { code } = req.body;

  if (!code || typeof code !== 'string') {
    return res.status(400).json({ error: 'code is required' });
  }

  if (code.length > 10000) {
    return res.status(400).json({ error: 'code too long' });
  }

  // Add job to queue
  const job = await executionQueue.add('run', { code });

  // Wait for result (long-polling on the job)
  const result = await job.waitUntilFinished(queueEvents, 10000);

  res.json(result);
});

app.listen(3000, () => console.log('Worker running on :3000'));