import express from 'express';
import { runSupportGraph } from './graph';

const app = express();
app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'orchestrator' });
});

app.post('/v1/run', async (req, res) => {
  try {
    const output = await runSupportGraph(req.body);
    res.json(output);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    res.status(500).json({ error: message });
  }
});

const port = Number(process.env.ORCHESTRATOR_PORT || 3002);
app.listen(port, () => {
  console.log(`Orchestrator listening on ${port}`);
});