'use client';

import { AppShell } from '@/components/shell/app-shell';
import { ScheduleTimetable } from '@/components/data/schedule-timetable';
import { useRequireAuth } from '@/lib/auth';

export default function StudentSchedulePage() {
  useRequireAuth(['student']);
  return (
    <AppShell
      title="Class timetable"
      subtitle="One month of live sessions for your enrolled courses"
    >
      <ScheduleTimetable days={30} />
    </AppShell>
  );
}