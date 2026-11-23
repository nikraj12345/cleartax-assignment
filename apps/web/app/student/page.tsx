'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import {
  Calendar,
  CreditCard,
  MessageSquare,
  Ticket,
  BookOpen,
} from 'lucide-react';
import { AppShell } from '@/components/shell/app-shell';
import { SupportChat } from '@/components/chat/support-chat';
import { ScheduleTimetable } from '@/components/data/schedule-timetable';
import { useRequireAuth } from '@/lib/auth';
import { apiGet } from '@/lib/api';
import ui from '@/components/ui/ui.module.css';
import { Button } from '@/components/ui/button';

type Overview = {
  enrollments: { name: string }[];
  upcomingSchedule: { title: string; course: string; startsAt: string }[];
  stats: {
    openTickets: number;
    conversationCount: number;
    pendingPayments: number;
  };
};

export default function StudentHomePage() {
  const { token, user } = useRequireAuth(['student']);
  const [data, setData] = useState<Overview | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    apiGet<Overview>(token, '/v1/student/overview')
      .then(setData)
      .catch((e) => setError(e.message));
  }, [token]);

  return (
    <AppShell title={`Hi, ${user?.displayName?.split(' ')[0] ?? 'there'}`} subtitle="Your learning and support hub">
      <div className={ui.pageHero}>
        <div>
          <h2 className={ui.pageHeroTitle}>This week at a glance</h2>
          <p className={ui.pageHeroSub}>
            Live classes, open support tickets, and payments — everything in one workspace. Timetable covers the next 30 days.
          </p>
        </div>
        <div className={ui.quickLinks}>
          <Link href="/student/schedule">
            <Button variant="secondary" size="sm">
              <Calendar size={16} />
              Full timetable
            </Button>
          </Link>
          <Link href="/student/chat">
            <Button size="sm">
              <MessageSquare size={16} />
              Open chat
            </Button>
          </Link>
        </div>
      </div>

      {error ? <div className={ui.error}>{error}</div> : null}
      {data ? (
        <div className={ui.statGrid}>
          <div className={ui.stat}>
            <div className={ui.statIcon}>
              <Ticket size={18} />
            </div>
            <div className={ui.statLabel}>Open tickets</div>
            <div className={ui.statValue}>{data.stats.openTickets}</div>
            <div className={ui.statHint}>Click any ticket for details</div>
          </div>
          <div className={ui.stat}>
            <div className={ui.statIcon}>
              <MessageSquare size={18} />
            </div>
            <div className={ui.statLabel}>Conversations</div>
            <div className={ui.statValue}>{data.stats.conversationCount}</div>
            <div className={ui.statHint}>AI support with tool grounding</div>
          </div>
          <div className={ui.stat}>
            <div className={ui.statIcon}>
              <CreditCard size={18} />
            </div>
            <div className={ui.statLabel}>Pending payments</div>
            <div className={ui.statValue}>{data.stats.pendingPayments}</div>
            <div className={ui.statHint}>Bank confirmation in progress</div>
          </div>
        </div>
      ) : null}

      <div className={ui.split}>
        <div>
          <div className={ui.card} style={{ marginBottom: '1rem' }}>
            <h2 className={ui.sectionTitle}>
              <BookOpen size={18} color="var(--accent)" />
              Enrolled courses
            </h2>
            <ul style={{ margin: 0, paddingLeft: '1.1rem', color: 'var(--text-secondary)' }}>
              {data?.enrollments.map((e) => (
                <li key={e.name} style={{ padding: '0.25rem 0' }}>
                  {e.name}
                </li>
              ))}
            </ul>
          </div>
          <div className={ui.card} style={{ marginBottom: '1rem' }}>
            <div className={ui.cardHeader}>
              <div>
                <h2 className={ui.cardTitle}>Upcoming classes</h2>
                <p className={ui.cardDescription}>
                  Tap a session for topic notes and timing.
                </p>
              </div>
              <Link href="/student/schedule">
                <Button variant="ghost" size="sm">
                  View all
                </Button>
              </Link>
            </div>
            <ScheduleTimetable compact days={30} />
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            <Link href="/student/tickets">
              <Button variant="secondary">My tickets</Button>
            </Link>
            <Link href="/student/payments">
              <Button variant="secondary">Payments</Button>
            </Link>
          </div>
        </div>
        <SupportChat />
      </div>
    </AppShell>
  );
}