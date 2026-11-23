import { callTool } from './tools-client';

export const TOOL_NAMES = [
  'get_enrollment',
  'get_schedule',
  'search_knowledge',
  'match_playbook',
  'record_device_report',
  'list_recent_payments',
  'lookup_payment_by_reference',
  'explain_payment_reversal',
  'create_refund_request',
  'create_support_ticket',
  'escalate_support_ticket',
  'initiate_password_reset',
] as const;

export type ToolName = (typeof TOOL_NAMES)[number];

export type ToolContext = {
  studentId: string;
  conversationId?: string;
};

export async function executeTool(
  name: string,
  args: Record<string, unknown>,
  ctx: ToolContext,
): Promise<unknown> {
  const { studentId } = ctx;
  switch (name as ToolName) {
    case 'get_enrollment':
      return callTool(studentId, '/internal/tools/enrollment');
    case 'get_schedule':
      return callTool(studentId, '/internal/tools/schedule');
    case 'search_knowledge':
      return callTool(studentId, '/internal/tools/knowledge/search', {
        method: 'POST',
        body: { query: String(args.query ?? '') },
      });
    case 'match_playbook':
      return callTool(studentId, '/internal/tools/playbook/match', {
        method: 'POST',
        body: { platform: String(args.platform ?? 'android') },
      });
    case 'record_device_report':
      return callTool(studentId, '/internal/tools/device-report', {
        method: 'POST',
        body: {
          platform: String(args.platform ?? 'android'),
          appVersion: args.app_version ? String(args.app_version) : undefined,
          errorCode: args.error_code ? String(args.error_code) : undefined,
          rawSymptoms: args.raw_symptoms ? String(args.raw_symptoms) : undefined,
        },
      });
    case 'list_recent_payments':
      return callTool(studentId, '/internal/tools/payments/recent');
    case 'lookup_payment_by_reference':
      return callTool(
        studentId,
        `/internal/tools/payments/by-ref/${encodeURIComponent(String(args.provider_ref))}`,
      );
    case 'explain_payment_reversal':
      return callTool(studentId, '/internal/tools/payments/reversal-guidance');
    case 'create_refund_request':
      return callTool(studentId, '/internal/tools/refunds', {
        method: 'POST',
        body: {
          paymentId: String(args.payment_id),
          reason: String(args.reason ?? 'Student request'),
        },
      });
    case 'create_support_ticket':
      return callTool(studentId, '/internal/tools/tickets', {
        method: 'POST',
        body: {
          category: String(args.category ?? 'other'),
          summary: String(args.summary ?? 'Student support request via chat'),
          conversationId: ctx.conversationId,
          escalate: args.escalate !== false,
        },
      });
    case 'escalate_support_ticket':
      return callTool(
        studentId,
        `/internal/tools/tickets/${encodeURIComponent(String(args.ticket_id))}/escalate`,
        { method: 'POST' },
      );
    case 'initiate_password_reset':
      return callTool(studentId, '/internal/tools/account/password-reset', {
        method: 'POST',
      });
    default:
      throw new Error(`Unknown tool: ${name}`);
  }
}

export function intentFromTools(used: string[]): string {
  if (used.includes('search_knowledge') || used.includes('get_schedule') || used.includes('get_enrollment')) {
    return 'faq_course';
  }
  if (used.includes('match_playbook') || used.includes('record_device_report')) {
    return 'video_troubleshoot';
  }
  if (
    used.includes('list_recent_payments') ||
    used.includes('lookup_payment_by_reference') ||
    used.includes('explain_payment_reversal')
  ) {
    return 'payment_issue';
  }
  if (used.includes('create_refund_request')) {
    return 'refund_request';
  }
  if (used.includes('initiate_password_reset')) {
    return 'account_recovery';
  }
  if (
    used.includes('create_support_ticket') ||
    used.includes('escalate_support_ticket')
  ) {
    if (
      used.includes('list_recent_payments') ||
      used.includes('lookup_payment_by_reference')
    ) {
      return 'payment_issue';
    }
    if (used.includes('create_refund_request')) {
      return 'refund_request';
    }
    if (used.includes('match_playbook') || used.includes('record_device_report')) {
      return 'video_troubleshoot';
    }
    return 'unknown';
  }
  return 'unknown';
}

export function citationsFromToolResults(
  results: { name: string; data: unknown }[],
): string[] {
  const cites: string[] = [];
  for (const r of results) {
    if (r.name === 'search_knowledge' && Array.isArray(r.data)) {
      for (const hit of r.data as { title?: string }[]) {
        if (hit.title) cites.push(hit.title);
      }
    }
  }
  return [...new Set(cites)];
}