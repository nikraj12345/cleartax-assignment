import { runFixtureGraph } from './fixture-graph';
import { runLiveAgent } from './live-agent';

export type RunInput = {
  conversationId: string;
  studentId: string;
  message: string;
  history: { role: string; content: string }[];
};

export type RunOutput = {
  reply: string;
  intent: string;
  citations?: string[];
  escalated?: boolean;
  ticketId?: string;
};

function resolveMode(): 'live' | 'fixture' {
  const mode = (process.env.LLM_MODE || 'live').toLowerCase();
  if (mode === 'fixture') return 'fixture';
  if (mode === 'live' && process.env.OPENAI_API_KEY) return 'live';
  if (!process.env.OPENAI_API_KEY) {
    console.warn(
      '[orchestrator] OPENAI_API_KEY missing — falling back to fixture mode',
    );
    return 'fixture';
  }
  return 'live';
}

export async function runSupportGraph(input: RunInput): Promise<RunOutput> {
  const mode = resolveMode();
  if (mode === 'live') {
    return runLiveAgent(input);
  }
  return runFixtureGraph(input);
}