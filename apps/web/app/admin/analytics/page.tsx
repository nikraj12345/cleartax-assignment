'use client';
import { useEffect, useState } from 'react';
import { AppShell } from '@/components/shell/app-shell';
import { useRequireAuth } from '@/lib/auth';
import { apiGet } from '@/lib/api';
import { formatCategory } from '@/lib/format';
import ui from '@/components/ui/ui.module.css';

type Metrics = {
  byCategory: { category: string; _count: number }[];
};

export default function AdminAnalyticsPage() {
  const { token } = useRequireAuth(['admin']);
  const [metrics, setMetrics] = useState<Metrics | null>(null);

  useEffect(() => {
    if (!token) return;
    apiGet<Metrics>(token, '/v1/admin/metrics').then(setMetrics);
  }, [token]);

  return (
    <AppShell title="Analytics" subtitle="Ticket volume by category from live data">
      <div className={ui.card}>
        {!metrics ? (
          <div className={ui.loadingRow}><div className={ui.spinner} /> Loading…</div>
        ) : (
          <div className={ui.tableWrap}>
            <table className={ui.table}>
              <thead><tr><th>Category</th><th>Volume</th></tr></thead>
              <tbody>
                {metrics.byCategory.map((row) => (
                  <tr key={row.category}><td>{formatCategory(row.category)}</td><td>{row._count}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AppShell>
  );
}
