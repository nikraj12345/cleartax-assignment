'use client';

import { FormEvent, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { homeForRole } from '@/lib/navigation';
import type { UserRole } from '@/lib/api';
import { Button } from '@/components/ui/button';
import styles from './login.module.css';

const DEMO_ACCOUNTS = [
  { role: 'Student', email: 'student.demo@brightpath.test' },
  { role: 'Support lead', email: 'support.demo@brightpath.test' },
  { role: 'Finance', email: 'finance.demo@brightpath.test' },
  { role: 'Admin', email: 'admin.demo@brightpath.test' },
];

function roleFromEmail(email: string): UserRole {
  if (email.includes('support')) return 'support_agent';
  if (email.includes('finance')) return 'finance_reviewer';
  if (email.includes('admin')) return 'admin';
  return 'student';
}

export default function LoginPage() {
  const { login, user, loading } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('demo1234');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && user) {
      router.replace(homeForRole(user.role as UserRole));
    }
  }, [loading, user, router]);

  async function finishLogin(targetEmail: string) {
    setSubmitting(true);
    setError(null);
    try {
      await login(targetEmail, password);
      router.push(homeForRole(roleFromEmail(targetEmail)));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setSubmitting(false);
    }
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    await finishLogin(email);
  }

  return (
    <div className={styles.page}>
      <div className={styles.panel}>
        <div className={styles.brand}>BrightPath</div>
        <p className={styles.lead}>Sign in to your workspace</p>

        <form onSubmit={onSubmit} className={styles.form}>
          <label className={styles.label}>
            Email
            <input
              className={styles.input}
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </label>
          <label className={styles.label}>
            Password
            <input
              className={styles.input}
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
            />
          </label>
          {error ? <p className={styles.error}>{error}</p> : null}
          <Button type="submit" disabled={submitting} className={styles.submit}>
            {submitting ? 'Signing in…' : 'Continue'}
          </Button>
        </form>

        <div className={styles.demo}>
          <p className={styles.demoTitle}>Demo accounts · password demo1234</p>
          <div className={styles.demoGrid}>
            {DEMO_ACCOUNTS.map((d) => (
              <button
                key={d.email}
                type="button"
                className={styles.demoBtn}
                onClick={() => {
                  setEmail(d.email);
                  finishLogin(d.email);
                }}
                disabled={submitting}
              >
                <span className={styles.demoRole}>{d.role}</span>
                <span className={styles.demoEmail}>{d.email}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}