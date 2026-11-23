import { SupportIntent } from '@brightpath/shared';

export function classifyIntentFixture(message: string): SupportIntent {
  const m = message.toLowerCase();
  if (m.includes('next class') || m.includes('schedule') || m.includes('when is')) {
    return 'faq_course';
  }
  if (m.includes('video') || m.includes('android') || m.includes('play')) {
    return 'video_troubleshoot';
  }
  if (m.includes('refund')) {
    return 'refund_request';
  }
  if (m.includes('payment') || m.includes('deducted') || m.includes('failed')) {
    return 'payment_issue';
  }
  if (m.includes('password') || m.includes('login')) {
    return 'account_recovery';
  }
  if (
    m.includes('raise a ticket') ||
    m.includes('open a ticket') ||
    m.includes('create a ticket') ||
    (m.includes('ticket') && (m.includes('want') || m.includes('raise')))
  ) {
    return 'payment_issue';
  }
  return 'unknown';
}