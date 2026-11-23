'use client';
import { AppShell } from '@/components/shell/app-shell';
import { TicketsTable } from '@/components/data/tickets-table';
import { useRequireAuth } from '@/lib/auth';

export default function StudentTicketsPage() {
  useRequireAuth(['student']);
  return (
    <AppShell title="My tickets" subtitle="Track issues raised through chat or support">
      <TicketsTable student />
    </AppShell>
  );
}
