import { createHmac } from 'crypto';
import { describe, expect, it } from 'vitest';

const API = process.env.E2E_API_URL || 'http://localhost:3001';
const ORCH_TOKEN =
  process.env.ORCHESTRATOR_SERVICE_TOKEN || 'orchestrator-internal-service-token';
const WEBHOOK_SECRET =
  process.env.MOCK_PAYMENT_WEBHOOK_SECRET || 'mock-webhook-secret-demo';

async function login(email: string, password: string) {
  const res = await fetch(`${API}/v1/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  expect(res.ok).toBe(true);
  return res.json() as Promise<{ accessToken: string; user: { studentId?: string } }>;
}

function bearer(token: string) {
  return { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };
}

describe('BrightPath API E2E', () => {
  it('auth: student and finance login', async () => {
    const student = await login('student.demo@brightpath.test', 'demo1234');
    expect(student.accessToken).toBeTruthy();
    const finance = await login('finance.demo@brightpath.test', 'demo1234');
    expect(finance.accessToken).toBeTruthy();

    const forbidden = await fetch(`${API}/v1/admin/refunds`, {
      headers: bearer(student.accessToken),
    });
    expect(forbidden.status).toBe(403);
  });

  it('FAQ path: conversation message persists', async () => {
    const { accessToken, user } = await login('student.demo@brightpath.test', 'demo1234');
    const convRes = await fetch(`${API}/v1/conversations`, {
      method: 'POST',
      headers: bearer(accessToken),
      body: JSON.stringify({ channel: 'web_chat' }),
    });
    expect(convRes.ok).toBe(true);
    const conv = await convRes.json();

    const msgRes = await fetch(`${API}/v1/conversations/${conv.id}/messages`, {
      method: 'POST',
      headers: bearer(accessToken),
      body: JSON.stringify({ content: 'When is the next class?' }),
    });
    expect(msgRes.ok).toBe(true);
    const msg = await msgRes.json();
    expect(msg.intent).toBe('faq_course');
    expect(msg.message?.content?.length).toBeGreaterThan(10);
    expect(user.studentId).toBeTruthy();
  });

  it('payment webhook is idempotent', async () => {
    const body = {
      providerRef: 'DEMO-REV-pending-001',
      status: 'reversed',
      idempotencyKey: 'e2e-key-1',
    };
    const raw = JSON.stringify(body);
    const signature = createHmac('sha256', WEBHOOK_SECRET).update(raw).digest('hex');

    const res1 = await fetch(`${API}/webhooks/payments/mock`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-mock-signature': signature },
      body: raw,
    });
    expect(res1.ok).toBe(true);
    const res2 = await fetch(`${API}/webhooks/payments/mock`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-mock-signature': signature },
      body: raw,
    });
    expect(res2.ok).toBe(true);
  });

  it('refund request requires finance approval', async () => {
    const student = await login('student.demo@brightpath.test', 'demo1234');
    const convRes = await fetch(`${API}/v1/conversations`, {
      method: 'POST',
      headers: bearer(student.accessToken),
      body: JSON.stringify({ channel: 'web_chat' }),
    });
    const conv = await convRes.json();
    const msgRes = await fetch(`${API}/v1/conversations/${conv.id}/messages`, {
      method: 'POST',
      headers: bearer(student.accessToken),
      body: JSON.stringify({ content: 'I need a refund for my payment' }),
    });
    const msg = await msgRes.json();
    expect(msg.intent).toBe('refund_request');

    const finance = await login('finance.demo@brightpath.test', 'demo1234');
    const pending = await fetch(`${API}/v1/admin/refunds`, {
      headers: bearer(finance.accessToken),
    });
    expect(pending.status).toBe(200);
    const refunds = (await pending.json()) as { id: string; status: string }[];
    const target = refunds.find((r) => r.status === 'pending_approval');
    expect(target, 'expected a pending_approval refund (re-run db seed if already processed)').toBeTruthy();

    const approve = await fetch(`${API}/v1/admin/refunds/${target.id}`, {
      method: 'PATCH',
      headers: bearer(finance.accessToken),
      body: JSON.stringify({ decision: 'approve' }),
    });
    expect(approve.status).toBe(200);
    const approved = await approve.json();
    expect(approved.status).toBe('processed');
  });

  it('internal tools reject student token', async () => {
    const student = await login('student.demo@brightpath.test', 'demo1234');
    const res = await fetch(`${API}/internal/tools/schedule`, {
      headers: {
        Authorization: `Bearer ${student.accessToken}`,
        'x-student-context': 'fake',
      },
    });
    expect(res.status).toBe(401);
  });

  it('internal tools accept orchestrator token', async () => {
    const student = await login('student.demo@brightpath.test', 'demo1234');
    expect(student.user.studentId).toBeTruthy();
    const res = await fetch(`${API}/internal/tools/schedule`, {
      headers: {
        'x-orchestrator-token': ORCH_TOKEN,
        'x-student-context': student.user.studentId!,
      },
    });
    expect(res.status).toBe(200);
  });
});