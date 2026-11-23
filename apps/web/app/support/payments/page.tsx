'use client';
import { AppShell } from '@/components/shell/app-shell';
import { PaymentsTable } from '@/components/data/payments-table';
import { useRequireAuth } from '@/lib/auth';

export default function SupportPaymentsPage() {
  useRequireAuth(['support_agent']);
  return (
    <AppShell title="Transactions" subtitle="Help students with failed or pending payments">
      <PaymentsTable admin />
    </AppShell>
  );
}
