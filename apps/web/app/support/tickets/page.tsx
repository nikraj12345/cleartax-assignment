'use client';
import { AppShell } from '@/components/shell/app-shell';
import { TicketsTable } from '@/components/data/tickets-table';
import { useRequireAuth } from '@/lib/auth';

export default function SupportTicketsPage() {
  useRequireAuth(['support_agent']);
  return (
    <AppShell title="All tickets" subtitle="Across channels and automation outcomes">
      <TicketsTable />
    </AppShell>
  );
}
