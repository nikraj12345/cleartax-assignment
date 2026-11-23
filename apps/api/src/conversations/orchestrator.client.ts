import { Injectable } from '@nestjs/common';

@Injectable()
export class OrchestratorClient {
  private baseUrl =
    process.env.ORCHESTRATOR_URL || 'http://localhost:3002';

  async runTurn(input: {
    conversationId: string;
    studentId: string;
    message: string;
    history: { role: string; content: string }[];
  }) {
    const res = await fetch(`${this.baseUrl}/v1/run`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Orchestrator error: ${res.status} ${text}`);
    }
    return res.json() as Promise<{
      reply: string;
      intent: string;
      ticketId?: string;
      citations?: string[];
      escalated?: boolean;
    }>;
  }
}