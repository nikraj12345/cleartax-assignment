import OpenAI from 'openai';

export const SUPPORT_TOOLS: OpenAI.Chat.Completions.ChatCompletionTool[] = [
  {
    type: 'function',
    function: {
      name: 'get_enrollment',
      description:
        'Fetch enrolled courses for this student from PostgreSQL. Call before answering course ownership questions.',
      parameters: { type: 'object', properties: {}, additionalProperties: false },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_schedule',
      description:
        'Fetch upcoming live class schedule for enrolled courses from PostgreSQL.',
      parameters: { type: 'object', properties: {}, additionalProperties: false },
    },
  },
  {
    type: 'function',
    function: {
      name: 'search_knowledge',
      description:
        'Search BrightPath knowledge base (Qdrant RAG + FAQ index). Required for policy/course content questions.',
      parameters: {
        type: 'object',
        properties: {
          query: { type: 'string', description: 'Search query derived from student message' },
        },
        required: ['query'],
        additionalProperties: false,
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'match_playbook',
      description: 'Load troubleshooting steps from database playbooks (video/app issues).',
      parameters: {
        type: 'object',
        properties: {
          platform: {
            type: 'string',
            enum: ['android', 'ios', 'web'],
            description: 'Device platform; default android for video issues',
          },
        },
        required: ['platform'],
        additionalProperties: false,
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'record_device_report',
      description: 'Log device symptoms to PostgreSQL for support analytics.',
      parameters: {
        type: 'object',
        properties: {
          platform: { type: 'string' },
          app_version: { type: 'string' },
          error_code: { type: 'string' },
          raw_symptoms: { type: 'string' },
        },
        required: ['platform', 'raw_symptoms'],
        additionalProperties: false,
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'list_recent_payments',
      description: 'List recent payment transactions and statuses from PostgreSQL.',
      parameters: { type: 'object', properties: {}, additionalProperties: false },
    },
  },
  {
    type: 'function',
    function: {
      name: 'lookup_payment_by_reference',
      description: 'Lookup a single payment by provider reference ID.',
      parameters: {
        type: 'object',
        properties: {
          provider_ref: { type: 'string' },
        },
        required: ['provider_ref'],
        additionalProperties: false,
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'explain_payment_reversal',
      description:
        'Get official guidance text for failed-but-deducted payments (deterministic policy from API).',
      parameters: { type: 'object', properties: {}, additionalProperties: false },
    },
  },
  {
    type: 'function',
    function: {
      name: 'create_refund_request',
      description:
        'Create a refund request in pending_approval state only. Never approves or sends money.',
      parameters: {
        type: 'object',
        properties: {
          payment_id: { type: 'string', description: 'UUID from list_recent_payments' },
          reason: { type: 'string' },
        },
        required: ['payment_id', 'reason'],
        additionalProperties: false,
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'create_support_ticket',
      description:
        'Open a support ticket in PostgreSQL for human follow-up. Use when the student asks to raise/log a ticket or needs escalation after automated help.',
      parameters: {
        type: 'object',
        properties: {
          category: {
            type: 'string',
            enum: [
              'course_content',
              'video_app',
              'payment',
              'refund',
              'login_account',
              'other',
            ],
          },
          summary: {
            type: 'string',
            description: 'Concise issue description including refs from tools',
          },
          escalate: {
            type: 'boolean',
            description: 'Default true — route to support queue',
          },
        },
        required: ['category', 'summary'],
        additionalProperties: false,
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'escalate_support_ticket',
      description: 'Escalate an existing ticket by id when student needs human agent.',
      parameters: {
        type: 'object',
        properties: {
          ticket_id: { type: 'string' },
        },
        required: ['ticket_id'],
        additionalProperties: false,
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'initiate_password_reset',
      description: 'Queue password reset notification (no password in chat).',
      parameters: { type: 'object', properties: {}, additionalProperties: false },
    },
  },
];

export const SYSTEM_PROMPT = `You are BrightPath's student support assistant.

Rules (mandatory):
1. Never invent schedules, payment status, refunds, or policies. Use tools for every factual claim.
2. For course/FAQ/policy questions: call search_knowledge and/or get_schedule or get_enrollment before answering.
3. For payment questions: call list_recent_payments and/or explain_payment_reversal and/or lookup_payment_by_reference.
4. For video/app issues: call match_playbook and record_device_report.
5. Refunds: only create_refund_request — tell the student finance must approve; you cannot approve refunds.
6. Cite knowledge sources by title when search_knowledge returns results.
7. If tools return empty data, say what is missing and suggest next steps; do not guess.
8. When the student asks to raise/open/log a ticket or wants a human: MUST call create_support_ticket (gather payment/schedule facts with other tools first if needed). Confirm the ticket id in your reply.
9. Never say ticket creation is unavailable or blocked by technical issues — you have create_support_ticket.
10. Be concise, professional, and empathetic.`;