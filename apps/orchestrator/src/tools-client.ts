import { randomUUID } from 'crypto';

const API_URL = process.env.API_URL || 'http://localhost:3001';
const TOKEN = process.env.ORCHESTRATOR_SERVICE_TOKEN || 'orchestrator-internal-service-token';

export async function callTool<T>(
  studentId: string,
  path: string,
  options: { method?: string; body?: unknown } = {},
): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    method: options.method || 'GET',
    headers: {
      'Content-Type': 'application/json',
      'x-orchestrator-token': TOKEN,
      'x-student-context': studentId,
      'x-correlation-id': randomUUID(),
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });
  if (!res.ok) {
    throw new Error(`Tool ${path} failed: ${res.status}`);
  }
  return res.json() as Promise<T>;
}