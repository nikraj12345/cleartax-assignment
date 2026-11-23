'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { AppShell } from '@/components/shell/app-shell';
import { useRequireAuth } from '@/lib/auth';
import { apiGet } from '@/lib/api';
import ui from '@/components/ui/ui.module.css';
import { Button } from '@/components/ui/button';

type Metrics = {
  openTickets: number;
  pendingRefunds: number;
  byCategory: { category: string; _count: number }[];
};

export default function AdminHomePage() {
  const { token } = useRequireAuth(['admin']);
  const [metrics, setMetrics] = useState<Metrics | null>(null);

  useEffect(() => {
    if (!token) return;
    apiGet<Metrics>(token, '/v1/admin/metrics').then(setMetrics);
  }, [token]);

  return (
    <AppShell title="Platform overview" subtitle="Automation rates, volume, and risk signals">
      {metrics ? (
        <div className={ui.statGrid}>
          <div className={ui.stat}><div className={ui.statLabel}>Open tickets</div><div className={ui.statValue}>{metrics.openTickets}</div></div>
          <div className={ui.stat}><div className={ui.statLabel}>Pending refunds</div><div className={ui.statValue}>{metrics.pendingRefunds}</div></div>
          <div className={ui.stat}><div className={ui.statLabel}>Ticket categories</div><div className={ui.statValue}>{metrics.byCategory.length}</div></div>
        </div>
      ) : null}
      <div style={{ marginTop: '1rem', display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        <Link href="/admin/analytics"><Button variant="secondary">Analytics</Button></Link>
        <Link href="/admin/tickets"><Button variant="secondary">Tickets</Button></Link>
        <Link href="/finance/refunds"><Button variant="secondary">Refunds</Button></Link>
      </div>
    </AppShell>
  );
}
