'use client';

import { useEffect, useState } from 'react';
import { ChevronRight } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { apiGet } from '@/lib/api';
import {
  formatCategory,
  formatDate,
  formatShortId,
} from '@/lib/format';
import { StatusBadge } from '@/components/ui/status-badge';
import { Modal } from '@/components/ui/modal';
import ui from '@/components/ui/ui.module.css';
import detailStyles from './ticket-detail.module.css';

type Ticket = {
  id: string;
  category: string;
  status: string;
  summary?: string | null;
  aiResolved: boolean;
  updatedAt: string;
  createdAt?: string;
  channel?: string;
  escalatedAt?: string | null;
  student?: { user?: { displayName?: string; email?: string } };
};

type TicketDetail = Ticket & {
  conversation?: {
    id: string;
    messages: { role: string; content: string; createdAt: string }[];
  } | null;
};

export function TicketsTable({ student = false }: { student?: boolean }) {
  const { token } = useAuth();
  const [rows, setRows] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<TicketDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  useEffect(() => {
    if (!token) return;
    const path = student ? '/v1/student/tickets' : '/v1/admin/tickets';
    apiGet<Ticket[]>(token, path)
      .then(setRows)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [token, student]);

  useEffect(() => {
    if (!token || !selectedId) {
      setDetail(null);
      return;
    }
    setDetailLoading(true);
    const path = student
      ? `/v1/student/tickets/${selectedId}`
      : `/v1/admin/tickets/${selectedId}`;
    apiGet<TicketDetail>(token, path)
      .then(setDetail)
      .catch((e) => setError(e.message))
      .finally(() => setDetailLoading(false));
  }, [token, selectedId, student]);

  const selectedRow = rows.find((r) => r.id === selectedId);

  if (loading) {
    return (
      <div className={ui.loadingRow}>
        <div className={ui.spinner} />
        Loading tickets…
      </div>
    );
  }

  return (
    <>
      <div className={ui.card}>
        <div className={ui.cardHeader}>
          <div>
            <h2 className={ui.cardTitle}>
              {student ? 'Support tickets' : 'All tickets'}
            </h2>
            <p className={ui.cardDescription}>
              Click a row to open full details, status, and conversation excerpt.
            </p>
          </div>
          <span className={ui.pill}>{rows.length} total</span>
        </div>
        {error ? <div className={ui.error}>{error}</div> : null}
        <div className={ui.tableWrap}>
          <table className={ui.table}>
            <thead>
              <tr>
                <th>ID</th>
                {!student && <th>Student</th>}
                <th>Category</th>
                <th>Status</th>
                <th>Channel</th>
                <th>Summary</th>
                <th>Updated</th>
                <th aria-hidden />
              </tr>
            </thead>
            <tbody>
              {rows.map((t) => (
                <tr
                  key={t.id}
                  className={ui.rowClickable}
                  onClick={() => setSelectedId(t.id)}
                >
                  <td>
                    <span className={ui.monoId}>{formatShortId(t.id)}</span>
                  </td>
                  {!student && (
                    <td>
                      {t.student?.user?.displayName ?? '—'}
                      <br />
                      <span className={ui.textMutedSm}>
                        {t.student?.user?.email}
                      </span>
                    </td>
                  )}
                  <td>{formatCategory(t.category)}</td>
                  <td>
                    <StatusBadge status={t.status} />
                  </td>
                  <td>
                    <span className={ui.pillNeutral}>{t.channel ?? 'web'}</span>
                  </td>
                  <td className={ui.cellClamp}>
                    {t.summary ?? '—'}
                    <div className={ui.textMutedSm}>
                      {t.aiResolved ? 'AI resolved' : 'Human / open'}
                    </div>
                  </td>
                  <td>{formatDate(t.updatedAt)}</td>
                  <td>
                    <ChevronRight size={16} color="var(--text-muted)" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!rows.length && <p className={ui.empty}>No tickets yet.</p>}
        </div>
      </div>

      <Modal
        open={!!selectedId}
        onClose={() => setSelectedId(null)}
        title={
          detail
            ? `${formatCategory(detail.category)} · #${formatShortId(detail.id)}`
            : selectedRow
              ? `${formatCategory(selectedRow.category)} · #${formatShortId(selectedRow.id)}`
              : 'Ticket'
        }
        subtitle={detail ? `Updated ${formatDate(detail.updatedAt)}` : undefined}
      >
        {detailLoading ? (
          <div className={ui.loadingRow}>
            <div className={ui.spinner} />
            Loading details…
          </div>
        ) : detail ? (
          <div className={detailStyles.grid}>
            <div className={detailStyles.metaGrid}>
              <div className={detailStyles.field}>
                <span className={detailStyles.label}>Status</span>
                <span className={detailStyles.value}>
                  <StatusBadge status={detail.status} />
                </span>
              </div>
              <div className={detailStyles.field}>
                <span className={detailStyles.label}>AI handling</span>
                <span className={detailStyles.value}>
                  {detail.aiResolved ? 'Resolved by AI' : 'Escalated or in progress'}
                </span>
              </div>
              {!student && detail.student?.user ? (
                <div className={detailStyles.field}>
                  <span className={detailStyles.label}>Student</span>
                  <span className={detailStyles.value}>
                    {detail.student.user.displayName}
                    <br />
                    <span className={ui.textMutedSm}>{detail.student.user.email}</span>
                  </span>
                </div>
              ) : null}
              <div className={detailStyles.field}>
                <span className={detailStyles.label}>Channel</span>
                <span className={detailStyles.value}>{detail.channel}</span>
              </div>
              <div className={detailStyles.field}>
                <span className={detailStyles.label}>Created</span>
                <span className={detailStyles.value}>
                  {detail.createdAt ? formatDate(detail.createdAt) : '—'}
                </span>
              </div>
              <div className={detailStyles.field}>
                <span className={detailStyles.label}>Ticket ID</span>
                <span className={`${detailStyles.value} ${ui.monoId}`}>
                  {detail.id}
                </span>
              </div>
            </div>
            <div className={detailStyles.field}>
              <span className={detailStyles.label}>Summary</span>
              <p className={detailStyles.summary}>
                {detail.summary || 'No summary recorded for this ticket.'}
              </p>
            </div>
            {detail.conversation?.messages?.length ? (
              <div className={detailStyles.thread}>
                <p className={detailStyles.threadTitle}>Recent conversation</p>
                {detail.conversation.messages.map((m) => (
                  <div
                    key={`${m.createdAt}-${m.role}`}
                    className={[
                      detailStyles.message,
                      m.role === 'user'
                        ? detailStyles.messageUser
                        : detailStyles.messageAi,
                    ].join(' ')}
                  >
                    <div className={detailStyles.messageRole}>{m.role}</div>
                    <p className={detailStyles.messageText}>{m.content}</p>
                  </div>
                ))}
              </div>
            ) : null}
          </div>
        ) : (
          <p className={ui.empty}>Could not load ticket.</p>
        )}
      </Modal>
    </>
  );
}