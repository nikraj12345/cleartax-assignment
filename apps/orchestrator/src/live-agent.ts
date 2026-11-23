import OpenAI from 'openai';
import type { RunInput, RunOutput } from './graph';
import { SUPPORT_TOOLS, SYSTEM_PROMPT } from './openai-tools';
import {
  citationsFromToolResults,
  executeTool,
  intentFromTools,
} from './tool-executor';
import {
  studentAskedForTicket,
  ticketMetaFromToolResults,
} from './ticket-meta';

const MAX_TOOL_ROUNDS = 6;
const MODEL = process.env.OPENAI_MODEL || 'gpt-4o-mini';

function buildMessages(input: RunInput): OpenAI.Chat.Completions.ChatCompletionMessageParam[] {
  const history = input.history.slice(-12).map((m) => ({
    role: (m.role === 'assistant' ? 'assistant' : 'user') as 'user' | 'assistant',
    content: m.content,
  }));
  const ticketNudge = studentAskedForTicket(input.message)
    ? '\n\n(Student requested a support ticket — use create_support_ticket after any quick factual tool calls.)'
    : '';

  return [
    { role: 'system', content: SYSTEM_PROMPT },
    ...history,
    { role: 'user', content: input.message + ticketNudge },
  ];
}

export async function runLiveAgent(input: RunInput): Promise<RunOutput> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY is required when LLM_MODE=live');
  }

  const openai = new OpenAI({ apiKey });
  const messages = buildMessages(input);
  const toolsUsed: string[] = [];
  const toolResults: { name: string; data: unknown }[] = [];
  const ticketRequested = studentAskedForTicket(input.message);
  const toolCtx = {
    studentId: input.studentId,
    conversationId: input.conversationId,
  };

  for (let round = 0; round < MAX_TOOL_ROUNDS; round++) {
    const completion = await openai.chat.completions.create({
      model: MODEL,
      messages,
      tools: SUPPORT_TOOLS,
      tool_choice:
        round === 0 && !ticketRequested ? 'required' : 'auto',
      temperature: 0.2,
    });

    const choice = completion.choices[0];
    const msg = choice.message;
    messages.push(msg);

    const toolCalls = msg.tool_calls ?? [];
    if (toolCalls.length === 0) {
      const reply = msg.content?.trim() || 'I could not generate a response. Please try again.';
      const intent = intentFromTools(toolsUsed);
      const citations = citationsFromToolResults(toolResults);
      const ticketMeta = ticketMetaFromToolResults(toolResults);
      return {
        reply,
        intent: intent === 'unknown' && toolsUsed.length === 0 ? 'unknown' : intent,
        citations: citations.length ? citations : undefined,
        escalated:
          ticketMeta.escalated ||
          (intent === 'unknown' && toolsUsed.length === 0),
        ticketId: ticketMeta.ticketId,
      };
    }

    for (const call of toolCalls) {
      if (call.type !== 'function') continue;
      const name = call.function.name;
      let args: Record<string, unknown> = {};
      try {
        args = JSON.parse(call.function.arguments || '{}');
      } catch {
        args = {};
      }

      let result: unknown;
      try {
        result = await executeTool(name, args, toolCtx);
      } catch (err) {
        result = {
          error: err instanceof Error ? err.message : 'Tool failed',
        };
      }

      toolsUsed.push(name);
      toolResults.push({ name, data: result });

      messages.push({
        role: 'tool',
        tool_call_id: call.id,
        content: JSON.stringify(result),
      });
    }
  }

  const final = await openai.chat.completions.create({
    model: MODEL,
    messages: [
      ...messages,
      {
        role: 'user',
        content:
          'Summarize for the student using only tool results above. Do not add new facts.',
      },
    ],
    temperature: 0.2,
  });

  const reply =
    final.choices[0].message.content?.trim() ||
    'I hit a processing limit. Please try a shorter message or contact support.';

  const ticketMeta = ticketMetaFromToolResults(toolResults);
  return {
    reply,
    intent: intentFromTools(toolsUsed),
    citations: citationsFromToolResults(toolResults),
    escalated: ticketMeta.escalated,
    ticketId: ticketMeta.ticketId,
  };
}