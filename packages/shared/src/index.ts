import { z } from 'zod';

export const Role = z.enum([
  'student',
  'support_agent',
  'finance_reviewer',
  'admin',
]);
export type Role = z.infer<typeof Role>;

export const TicketCategory = z.enum([
  'course_content',
  'video_app',
  'payment',
  'refund',
  'login_account',
  'other',
]);
export type TicketCategory = z.infer<typeof TicketCategory>;

export const TicketStatus = z.enum([
  'open',
  'in_progress',
  'resolved',
  'escalated',
  'closed',
]);
export type TicketStatus = z.infer<typeof TicketStatus>;

export const PaymentStatus = z.enum([
  'initiated',
  'pending',
  'succeeded',
  'failed',
  'reversed',
  'unknown',
]);
export type PaymentStatus = z.infer<typeof PaymentStatus>;

export const RefundStatus = z.enum([
  'submitted',
  'pending_approval',
  'approved',
  'rejected',
  'processed',
]);
export type RefundStatus = z.infer<typeof RefundStatus>;

export const SupportIntent = z.enum([
  'faq_course',
  'video_troubleshoot',
  'payment_issue',
  'refund_request',
  'account_recovery',
  'unknown',
]);
export type SupportIntent = z.infer<typeof SupportIntent>;

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const createConversationSchema = z.object({
  channel: z.enum(['web_chat', 'email', 'phone']).default('web_chat'),
});

export const sendMessageSchema = z.object({
  content: z.string().min(1).max(8000),
});

export const refundDecisionSchema = z.object({
  decision: z.enum(['approve', 'reject']),
  reason: z.string().optional(),
});

export const studentContextHeader = 'x-student-context';