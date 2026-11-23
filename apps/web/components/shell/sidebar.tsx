'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import clsx from 'clsx';
import { LogOut } from 'lucide-react';
import type { NavItem } from '@/lib/navigation';
import styles from './sidebar.module.css';

type Props = {
  nav: NavItem[];
  roleLabel: string;
  userName: string;
  userEmail: string;
  onLogout: () => void;
};

export function Sidebar({
  nav,
  roleLabel,
  userName,
  userEmail,
  onLogout,
}: Props) {
  const pathname = usePathname();

  return (
    <aside className={styles.sidebar}>
      <div className={styles.brand}>
        <div className={styles.logoMark}>BP</div>
        <div>
          <div className={styles.brandName}>BrightPath</div>
          <div className={styles.brandSub}>Support Platform</div>
        </div>
      </div>

      <p className={styles.workspace}>{roleLabel}</p>

      <nav className={styles.nav}>
        {nav.map((item) => {
          const active =
            pathname === item.href ||
            (item.href !== '/' && pathname?.startsWith(item.href + '/'));
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={clsx(styles.navLink, active && styles.navLinkActive)}
            >
              <Icon size={18} strokeWidth={1.75} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className={styles.footer}>
        <div className={styles.user}>
          <div className={styles.avatar}>{userName.charAt(0)}</div>
          <div className={styles.userMeta}>
            <span className={styles.userName}>{userName}</span>
            <span className={styles.userEmail}>{userEmail}</span>
          </div>
        </div>
        <button type="button" className={styles.logout} onClick={onLogout}>
          <LogOut size={16} />
          Sign out
        </button>
      </div>
    </aside>
  );
}