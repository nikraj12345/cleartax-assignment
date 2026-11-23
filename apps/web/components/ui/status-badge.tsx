import clsx from 'clsx';
import styles from './ui.module.css';

const toneMap: Record<string, string> = {
  open: styles.badgeWarning,
  in_progress: styles.badgeAccent,
  resolved: styles.badgeSuccess,
  closed: styles.badgeNeutral,
  escalated: styles.badgeDanger,
  pending: styles.badgeWarning,
  succeeded: styles.badgeSuccess,
  failed: styles.badgeDanger,
  reversed: styles.badgeNeutral,
  pending_approval: styles.badgeWarning,
  approved: styles.badgeAccent,
  processed: styles.badgeSuccess,
  rejected: styles.badgeDanger,
};

export function StatusBadge({ status }: { status: string }) {
  const tone = toneMap[status] ?? styles.badgeNeutral;
  const label = status.replace(/_/g, ' ');
  return <span className={clsx(styles.badge, tone)}>{label}</span>;
}