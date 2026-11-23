'use client';
import { AppShell } from '@/components/shell/app-shell';
import { useRequireAuth } from '@/lib/auth';
import ui from '@/components/ui/ui.module.css';

const TEAM = [
  { role: 'Support Lead', email: 'support.demo@brightpath.test', scope: 'Tickets, escalations, payments lookup' },
  { role: 'Finance Reviewer', email: 'finance.demo@brightpath.test', scope: 'Refund approvals, transaction review' },
  { role: 'Administrator', email: 'admin.demo@brightpath.test', scope: 'Full platform configuration' },
];

export default function AdminTeamPage() {
  useRequireAuth(['admin']);
  return (
    <AppShell title="Team & roles" subtitle="RBAC enforced server-side on every API">
      <div className={ui.card}>
        <div className={ui.tableWrap}>
          <table className={ui.table}>
            <thead><tr><th>Role</th><th>Demo account</th><th>Permissions</th></tr></thead>
            <tbody>
              {TEAM.map((m) => (
                <tr key={m.email}><td>{m.role}</td><td>{m.email}</td><td>{m.scope}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AppShell>
  );
}
