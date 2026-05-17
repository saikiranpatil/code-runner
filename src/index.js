const express = require('express');
const { executionQueue, queueEvents } = require('./queue');
const { validateRequest } = require('./validate');

const app = express();
app.use(express.json());

app.post('/execute', async (req, res) => {
  const error = validateRequest(req.body);
  if (error) return res.status(400).json({ error });

  const { code, language = 'javascript' } = req.body;

  try {
    const job = await executionQueue.add('run', { code, language });
    const result = await job.waitUntilFinished(queueEvents, 10000);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: 'execution failed', detail: err.message });
  }
});

app.listen(3000, () => console.log('Server on :3000'));