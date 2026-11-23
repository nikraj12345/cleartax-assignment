'use client';
import { AppShell } from '@/components/shell/app-shell';
import { SupportChat } from '@/components/chat/support-chat';
import { useRequireAuth } from '@/lib/auth';

export default function StudentChatPage() {
  useRequireAuth(['student']);
  return (
    <AppShell title="Support chat" subtitle="AI-assisted help with human escalation when needed">
      <SupportChat variant="page" />
    </AppShell>
  );
}
