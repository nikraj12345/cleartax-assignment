'use client';

import { useEffect, useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, CalendarDays } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { apiGet } from '@/lib/api';
import { formatDate, formatTime } from '@/lib/format';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';
import ui from '@/components/ui/ui.module.css';
import styles from './schedule.module.css';

export type ScheduleEvent = {
  id: string;
  title: string;
  course: string;
  startsAt: string;
  description?: string | null;
};

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function startOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

function addMonths(d: Date, n: number) {
  return new Date(d.getFullYear(), d.getMonth() + n, 1);
}

function dayKey(iso: string | Date) {
  const d = typeof iso === 'string' ? new Date(iso) : iso;
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

function sameDay(a: Date, b: Date) {
  return dayKey(a) === dayKey(b);
}

type Props = {
  compact?: boolean;
  days?: number;
};

export function ScheduleTimetable({ compact = false, days = 30 }: Props) {
  const { token } = useAuth();
  const [events, setEvents] = useState<ScheduleEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMonth, setViewMonth] = useState(() => startOfMonth(new Date()));
  const [selected, setSelected] = useState<ScheduleEvent | null>(null);

  useEffect(() => {
    if (!token) return;
    const to = new Date();
    to.setDate(to.getDate() + days);
    const qs = new URLSearchParams({
      from: new Date().toISOString(),
      to: to.toISOString(),
    });
    apiGet<ScheduleEvent[]>(token, `/v1/student/schedule?${qs}`)
      .then(setEvents)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [token, days]);

  const byDay = useMemo(() => {
    const map = new Map<string, ScheduleEvent[]>();
    for (const ev of events) {
      const k = dayKey(ev.startsAt);
      const list = map.get(k) ?? [];
      list.push(ev);
      map.set(k, list);
    }
    for (const [, list] of map) {
      list.sort(
        (a, b) =>
          new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime(),
      );
    }
    return map;
  }, [events]);

  const calendarCells = useMemo(() => {
    const first = startOfMonth(viewMonth);
    const startPad = first.getDay();
    const gridStart = new Date(first);
    gridStart.setDate(gridStart.getDate() - startPad);
    const cells: { date: Date; inMonth: boolean }[] = [];
    for (let i = 0; i < 42; i++) {
      const date = new Date(gridStart);
      date.setDate(gridStart.getDate() + i);
      cells.push({
        date,
        inMonth: date.getMonth() === viewMonth.getMonth(),
      });
    }
    return cells;
  }, [viewMonth]);

  const today = new Date();
  const monthLabel = viewMonth.toLocaleDateString('en-IN', {
    month: 'long',
    year: 'numeric',
  });

  if (loading) {
    return (
      <div className={ui.loadingRow}>
        <div className={ui.spinner} />
        Loading timetable…
      </div>
    );
  }

  if (compact) {
    const upcoming = [...events]
      .sort(
        (a, b) =>
          new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime(),
      )
      .slice(0, 6);

    return (
      <div className={styles.wrap}>
        {error ? <div className={ui.error}>{error}</div> : null}
        <div className={styles.listView}>
          {upcoming.length ? (
            upcoming.map((ev) => {
              const d = new Date(ev.startsAt);
              return (
                <button
                  key={ev.id}
                  type="button"
                  className={styles.listRow}
                  onClick={() => setSelected(ev)}
                >
                  <div className={styles.dateBlock}>
                    <span className={styles.dateDay}>{d.getDate()}</span>
                    <span className={styles.dateMon}>
                      {d.toLocaleDateString('en-IN', { month: 'short' })}
                    </span>
                  </div>
                  <div className={styles.listBody}>
                    <p className={styles.listTitle}>{ev.title}</p>
                    <p className={styles.listMeta}>
                      {ev.course} · {formatTime(ev.startsAt)}
                    </p>
                  </div>
                </button>
              );
            })
          ) : (
            <p className={ui.empty}>No classes scheduled this month.</p>
          )}
        </div>
        <Modal
          open={!!selected}
          onClose={() => setSelected(null)}
          title={selected?.title ?? ''}
          subtitle={selected ? `${selected.course} · ${formatDate(selected.startsAt)}` : undefined}
        >
          {selected ? (
            <div className={styles.detailGrid}>
              <div className={styles.detailRow}>
                <span className={styles.detailLabel}>Starts</span>
                <span className={styles.detailValue}>{formatDate(selected.startsAt)}</span>
              </div>
              <p className={styles.description}>
                {selected.description ||
                  'Live interactive session with faculty Q&A. Join from your course dashboard link (sent 15 minutes before start).'}
              </p>
            </div>
          ) : null}
        </Modal>
      </div>
    );
  }

  return (
    <div className={ui.card}>
      <div className={styles.wrap}>
        {error ? <div className={ui.error}>{error}</div> : null}
        <div className={styles.toolbar}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <CalendarDays size={20} color="var(--accent)" />
            <span className={styles.monthLabel}>{monthLabel}</span>
          </div>
          <div className={styles.navBtns}>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setViewMonth((m) => addMonths(m, -1))}
              aria-label="Previous month"
            >
              <ChevronLeft size={16} />
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setViewMonth(startOfMonth(new Date()))}
            >
              Today
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setViewMonth((m) => addMonths(m, 1))}
              aria-label="Next month"
            >
              <ChevronRight size={16} />
            </Button>
          </div>
        </div>
        <div className={styles.legend}>
          <span>
            <span className={styles.legendDot} />
            {events.length} sessions in the next {days} days
          </span>
        </div>
        <div className={styles.calendar}>
          {WEEKDAYS.map((d) => (
            <div key={d} className={styles.weekday}>
              {d}
            </div>
          ))}
          {calendarCells.map(({ date, inMonth }) => {
            const items = byDay.get(dayKey(date)) ?? [];
            const isToday = sameDay(date, today);
            return (
              <div
                key={date.toISOString()}
                className={[
                  styles.day,
                  !inMonth ? styles.dayMuted : '',
                  isToday ? styles.dayToday : '',
                ].join(' ')}
              >
                <span
                  className={[styles.dayNum, isToday ? styles.dayNumToday : ''].join(' ')}
                >
                  {date.getDate()}
                </span>
                {items.slice(0, 2).map((ev) => (
                  <button
                    key={ev.id}
                    type="button"
                    className={styles.eventPill}
                    title={ev.title}
                    onClick={() => setSelected(ev)}
                  >
                    {formatTime(ev.startsAt)} {ev.title}
                  </button>
                ))}
                {items.length > 2 ? (
                  <span className={styles.more}>+{items.length - 2} more</span>
                ) : null}
              </div>
            );
          })}
        </div>
      </div>

      <Modal
        open={!!selected}
        onClose={() => setSelected(null)}
        title={selected?.title ?? ''}
        subtitle={selected ? `${selected.course} · ${formatDate(selected.startsAt)}` : undefined}
      >
        {selected ? (
          <div className={styles.detailGrid}>
            <div className={styles.detailRow}>
              <span className={styles.detailLabel}>Course</span>
              <span className={styles.detailValue}>{selected.course}</span>
            </div>
            <div className={styles.detailRow}>
              <span className={styles.detailLabel}>Starts</span>
              <span className={styles.detailValue}>{formatDate(selected.startsAt)}</span>
            </div>
            <p className={styles.description}>
              {selected.description ||
                'Live interactive session with faculty Q&A. Join from your course dashboard link (sent 15 minutes before start).'}
            </p>
          </div>
        ) : null}
      </Modal>
    </div>
  );
}