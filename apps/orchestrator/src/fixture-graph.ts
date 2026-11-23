import { classifyIntentFixture } from './intent';
import { callTool } from './tools-client';
import type { RunInput, RunOutput } from './graph';

function inferTicketCategory(message: string, intent: string): string {
  if (intent === 'payment_issue' || message.toLowerCase().includes('payment')) {
    return 'payment';
  }
  if (intent === 'refund_request') return 'refund';
  if (intent === 'video_troubleshoot') return 'video_app';
  if (intent === 'account_recovery') return 'login_account';
  if (intent === 'faq_course') return 'course_content';
  return 'other';
}

async function createTicketFlow(
  input: RunInput,
  intent: string,
): Promise<RunOutput> {
  const summary =
    input.message.length > 20
      ? input.message
      : `Follow-up from chat: ${input.history.at(-1)?.content?.slice(0, 180) ?? input.message}`;
  const ticket = await callTool<{ id: string }>(
    input.studentId,
    '/internal/tools/tickets',
    {
      method: 'POST',
      body: {
        category: inferTicketCategory(input.message, intent),
        summary,
        conversationId: input.conversationId,
        escalate: true,
      },
    },
  );
  const shortId = ticket.id.slice(0, 8).toUpperCase();
  return {
    reply: `Done — I've opened support ticket #${shortId} for our team. Status is escalated and linked to this chat. You can track it under My tickets; a support agent will follow up on the payment if that's what you need.`,
    intent,
    ticketId: ticket.id,
    escalated: true,
  };
}

export async function runFixtureGraph(input: RunInput): Promise<RunOutput> {
  const intent = classifyIntentFixture(input.message);
  const ticketAsk =
    input.message.toLowerCase().includes('ticket') &&
    (input.message.toLowerCase().includes('raise') ||
      input.message.toLowerCase().includes('want') ||
      input.message.toLowerCase().includes('open') ||
      input.message.toLowerCase().includes('create'));

  if (ticketAsk) {
    const chatIntent = classifyIntentFixture(
      [...input.history.map((h) => h.content), input.message].join(' '),
    );
    return createTicketFlow(
      input,
      chatIntent === 'unknown' ? 'payment_issue' : chatIntent,
    );
  }

  if (intent === 'faq_course') {
    const [schedule, hits] = await Promise.all([
      callTool<{ title: string; startsAt: string; course: string }[]>(
        input.studentId,
        '/internal/tools/schedule',
      ),
      callTool<{ title: string; snippet: string; sourceKey: string }[]>(
        input.studentId,
        '/internal/tools/knowledge/search',
        { method: 'POST', body: { query: input.message } },
      ),
    ]);
    const next = schedule[0];
    const cite = hits.map((h) => h.title);
    const reply = next
      ? `Your next class is ${next.title} for ${next.course} on ${new Date(next.startsAt).toLocaleString()}.`
      : hits[0]?.snippet ||
        'I could not find an upcoming class. Check your dashboard or ask support to confirm.';
    return { reply, intent, citations: cite };
  }

  if (intent === 'video_troubleshoot') {
    const platform = input.message.toLowerCase().includes('ios') ? 'ios' : 'android';
    const playbook = await callTool<{ title: string; steps: { action: string }[] }>(
      input.studentId,
      '/internal/tools/playbook/match',
      { method: 'POST', body: { platform } },
    );
    await callTool(input.studentId, '/internal/tools/device-report', {
      method: 'POST',
      body: { platform, rawSymptoms: input.message },
    });
    const steps = (playbook.steps as { action: string }[])
      .map((s, i) => `${i + 1}. ${s.action}`)
      .join('\n');
    return {
      reply: `Let's try these steps for ${playbook.title}:\n${steps}`,
      intent,
      escalated: false,
    };
  }

  if (intent === 'payment_issue') {
    const [guidance, recent] = await Promise.all([
      callTool<{ message: string }>(input.studentId, '/internal/tools/payments/reversal-guidance'),
      callTool<{ providerRef: string; status: string; id: string }[]>(
        input.studentId,
        '/internal/tools/payments/recent',
      ),
    ]);
    const pending = recent.find((p) => p.status === 'pending');
    const reply = `${guidance.message}${
      pending
        ? `\n\nYour recent transaction ${pending.providerRef} is still ${pending.status}. We will update you when the bank confirms.`
        : ''
    }`;
    return { reply, intent };
  }

  if (intent === 'refund_request') {
    const recent = await callTool<{ id: string; status: string; amountCents: number }[]>(
      input.studentId,
      '/internal/tools/payments/recent',
    );
    const succeeded = recent.find((p) => p.status === 'succeeded');
    if (!succeeded) {
      return {
        reply:
          'I need a succeeded payment to open a refund request. Share your payment reference or try again after payment confirms.',
        intent,
        escalated: true,
      };
    }
    const refund = await callTool<{ id: string; status: string }>(
      input.studentId,
      '/internal/tools/refunds',
      {
        method: 'POST',
        body: { paymentId: succeeded.id, reason: input.message },
      },
    );
    return {
      reply: `Your refund request ${refund.id.slice(0, 8)} is ${refund.status.replace('_', ' ')}. A finance reviewer must approve before funds are returned.`,
      intent,
    };
  }

  if (intent === 'account_recovery') {
    await callTool(input.studentId, '/internal/tools/account/password-reset', {
      method: 'POST',
    });
    return {
      reply:
        'I initiated a secure password reset to your registered email. Check your inbox and follow the link (demo: notification logged).',
      intent,
    };
  }

  return {
    reply:
      'I can help with class schedules, video issues, payments, refunds, or login problems. What do you need?',
    intent: 'unknown',
    escalated: true,
  };
}