const express = require('express');
const { execute } = require('./executor');

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

  const result = await execute(code);
  res.json(result);
});

app.listen(3000, () => console.log('Worker running on :3000'));