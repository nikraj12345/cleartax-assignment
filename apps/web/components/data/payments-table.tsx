'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth';
import { apiGet } from '@/lib/api';
import { formatDate, formatInr } from '@/lib/format';
import { StatusBadge } from '@/components/ui/status-badge';
import ui from '@/components/ui/ui.module.css';

type Payment = {
  id: string;
  providerRef: string;
  status: string;
  amountCents: number;
  description?: string | null;
  updatedAt: string;
  student?: { user?: { displayName?: string; email?: string } };
};

export function PaymentsTable({ admin = false }: { admin?: boolean }) {
  const { token } = useAuth();
  const [rows, setRows] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    const path = admin ? '/v1/payments/admin/transactions' : '/v1/payments';
    apiGet<Payment[]>(token, path)
      .then(setRows)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [token, admin]);

  if (loading) {
    return (
      <div className={ui.loadingRow}>
        <div className={ui.spinner} />
        Loading transactions…
      </div>
    );
  }

  return (
    <div className={ui.card}>
      {error ? <div className={ui.error}>{error}</div> : null}
      <div className={ui.tableWrap}>
        <table className={ui.table}>
          <thead>
            <tr>
              {admin && <th>Student</th>}
              <th>Reference</th>
              <th>Amount</th>
              <th>Status</th>
              <th>Description</th>
              <th>Updated</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((p) => (
              <tr key={p.id}>
                {admin && (
                  <td>
                    {p.student?.user?.displayName ?? '—'}
                    <br />
                    <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                      {p.student?.user?.email}
                    </span>
                  </td>
                )}
                <td style={{ fontFamily: 'monospace', fontSize: 12 }}>
                  {p.providerRef}
                </td>
                <td>{formatInr(p.amountCents)}</td>
                <td>
                  <StatusBadge status={p.status} />
                </td>
                <td>{p.description ?? '—'}</td>
                <td>{formatDate(p.updatedAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {!rows.length && <p className={ui.empty}>No transactions found.</p>}
      </div>
    </div>
  );
}