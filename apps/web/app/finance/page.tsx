'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { AppShell } from '@/components/shell/app-shell';
import { useRequireAuth } from '@/lib/auth';
import { apiGet } from '@/lib/api';
import ui from '@/components/ui/ui.module.css';
import { Button } from '@/components/ui/button';
import { RefundsPanel } from '@/components/data/refunds-panel';

type Metrics = {
  pendingRefunds: number;
  openTickets: number;
};

export default function FinanceHomePage() {
  const { token } = useRequireAuth(['finance_reviewer']);
  const [metrics, setMetrics] = useState<Metrics | null>(null);

  useEffect(() => {
    if (!token) return;
    apiGet<Metrics>(token, '/v1/admin/metrics').then(setMetrics);
  }, [token]);

  return (
    <AppShell title="Finance overview" subtitle="Approvals and payment reconciliation">
      {metrics ? (
        <div className={ui.statGrid}>
          <div className={ui.stat}><div className={ui.statLabel}>Pending refunds</div><div className={ui.statValue}>{metrics.pendingRefunds}</div></div>
          <div className={ui.stat}><div className={ui.statLabel}>Open support tickets</div><div className={ui.statValue}>{metrics.openTickets}</div></div>
        </div>
      ) : null}
      <div style={{ marginTop: '1rem', display: 'flex', gap: 8 }}>
        <Link href="/finance/refunds"><Button>Review refunds</Button></Link>
        <Link href="/finance/payments"><Button variant="secondary">Transactions</Button></Link>
      </div>
      <div style={{ marginTop: '1.5rem' }}>
        <RefundsPanel title="Approval queue" />
      </div>
    </AppShell>
  );
}
