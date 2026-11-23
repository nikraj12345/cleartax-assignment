'use client';
import { AppShell } from '@/components/shell/app-shell';
import { PaymentsTable } from '@/components/data/payments-table';
import { useRequireAuth } from '@/lib/auth';

export default function AdminPaymentsPage() {
  useRequireAuth(['admin', 'admin']);
  return (
    <AppShell title="Transactions" subtitle="Stripe-style ledger view for finance review">
      <PaymentsTable admin />
    </AppShell>
  );
}
