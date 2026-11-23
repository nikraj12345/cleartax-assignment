'use client';
import { useEffect, useState } from 'react';
import { AppShell } from '@/components/shell/app-shell';
import { useRequireAuth } from '@/lib/auth';
import { apiGet } from '@/lib/api';
import { TicketsTable } from '@/components/data/tickets-table';
import ui from '@/components/ui/ui.module.css';

type Metrics = {
  openTickets: number;
  pendingRefunds: number;
  byCategory: { category: string; _count: number }[];
};

export default function SupportHomePage() {
  const { token } = useRequireAuth(['support_agent']);
  const [metrics, setMetrics] = useState<Metrics | null>(null);

  useEffect(() => {
    if (!token) return;
    apiGet<Metrics>(token, '/v1/admin/metrics').then(setMetrics);
  }, [token]);

  return (
    <AppShell title="Support queue" subtitle="Prioritize escalations and payment issues">
      {metrics ? (
        <div className={ui.statGrid}>
          <div className={ui.stat}><div className={ui.statLabel}>Open tickets</div><div className={ui.statValue}>{metrics.openTickets}</div></div>
          <div className={ui.stat}><div className={ui.statLabel}>Pending refunds</div><div className={ui.statValue}>{metrics.pendingRefunds}</div></div>
          <div className={ui.stat}><div className={ui.statLabel}>Categories tracked</div><div className={ui.statValue}>{metrics.byCategory.length}</div></div>
        </div>
      ) : null}
      <div style={{ marginTop: '1.5rem' }}><TicketsTable /></div>
    </AppShell>
  );
}
