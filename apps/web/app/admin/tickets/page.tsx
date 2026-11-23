'use client';
import { AppShell } from '@/components/shell/app-shell';
import { TicketsTable } from '@/components/data/tickets-table';
import { useRequireAuth } from '@/lib/auth';

export default function AdminTicketsPage() {
  useRequireAuth(['admin']);
  return (
    <AppShell title="Tickets" subtitle="Organization-wide support workload">
      <TicketsTable />
    </AppShell>
  );
}
