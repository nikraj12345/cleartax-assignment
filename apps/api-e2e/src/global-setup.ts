const API = process.env.E2E_API_URL || 'http://localhost:3001';
const ORCH = process.env.E2E_ORCHESTRATOR_URL || 'http://localhost:3002';

async function waitFor(url: string, attempts = 60) {
  for (let i = 0; i < attempts; i++) {
    try {
      const res = await fetch(`${url}/health`);
      if (res.ok) return;
    } catch {
      // retry
    }
    await new Promise((r) => setTimeout(r, 1000));
  }
  throw new Error(`Service not ready: ${url}`);
}

export default async function setup() {
  await waitFor(API);
  await waitFor(ORCH);
}