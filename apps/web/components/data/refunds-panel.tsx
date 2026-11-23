'use client';

import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth';
import { apiGet, apiPatch } from '@/lib/api';
import { formatDate, formatInr } from '@/lib/format';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/ui/status-badge';
import ui from '@/components/ui/ui.module.css';

type Refund = {
  id: string;
  status: string;
  amountCents: number;
  reason: string;
  createdAt: string;
  student?: { user?: { email?: string; displayName?: string } };
};

export function RefundsPanel({ title }: { title?: string }) {
  const { token } = useAuth();
  const [rows, setRows] = useState<Refund[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [acting, setActing] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const data = await apiGet<Refund[]>(token, '/v1/admin/refunds');
      setRows(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    load();
  }, [load]);

  async function decide(id: string, decision: 'approve' | 'reject') {
    if (!token) return;
    setActing(id);
    try {
      await apiPatch(token, `/v1/admin/refunds/${id}`, { decision });
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Action failed');
    } finally {
      setActing(null);
    }
  }

  return (
    <div className={ui.card}>
      {title ? (
        <div className={ui.cardHeader}>
          <div>
            <h2 className={ui.cardTitle}>{title}</h2>
            <p className={ui.cardDescription}>
              Human approval required before funds are returned.
            </p>
          </div>
        </div>
      ) : null}
      {error ? <div className={ui.error}>{error}</div> : null}
      {loading ? (
        <div className={ui.loadingRow}>
          <div className={ui.spinner} />
          Loading refund queue…
        </div>
      ) : rows.length === 0 ? (
        <p className={ui.empty}>No pending refund requests.</p>
      ) : (
        <div className={ui.tableWrap}>
          <table className={ui.table}>
            <thead>
              <tr>
                <th>Student</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Reason</th>
                <th>Requested</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id}>
                  <td>
                    {r.student?.user?.displayName ?? '—'}
                    <br />
                    <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>
                      {r.student?.user?.email}
                    </span>
                  </td>
                  <td>{formatInr(r.amountCents)}</td>
                  <td>
                    <StatusBadge status={r.status} />
                  </td>
                  <td style={{ maxWidth: 220 }}>{r.reason}</td>
                  <td>{formatDate(r.createdAt)}</td>
                  <td>
                    {r.status === 'pending_approval' ? (
                      <span style={{ display: 'flex', gap: 8 }}>
                        <Button
                          size="sm"
                          disabled={acting === r.id}
                          onClick={() => decide(r.id, 'approve')}
                        >
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="secondary"
                          disabled={acting === r.id}
                          onClick={() => decide(r.id, 'reject')}
                        >
                          Reject
                        </Button>
                      </span>
                    ) : (
                      '—'
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}