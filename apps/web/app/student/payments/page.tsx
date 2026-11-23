'use client';
import { AppShell } from '@/components/shell/app-shell';
import { PaymentsTable } from '@/components/data/payments-table';
import { useRequireAuth } from '@/lib/auth';

export default function StudentPaymentsPage() {
  useRequireAuth(['student']);
  return (
    <AppShell title="Payments" subtitle="Status from the payment provider — not estimates">
      <PaymentsTable />
    </AppShell>
  );
}
