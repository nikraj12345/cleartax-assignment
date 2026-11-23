'use client';
import { AppShell } from '@/components/shell/app-shell';
import { RefundsPanel } from '@/components/data/refunds-panel';
import { useRequireAuth } from '@/lib/auth';

export default function FinanceRefundsPage() {
  useRequireAuth(['finance_reviewer', 'admin']);
  return (
    <AppShell title="Refund approvals" subtitle="No refund executes without your decision">
      <RefundsPanel title="Pending queue" />
    </AppShell>
  );
}
