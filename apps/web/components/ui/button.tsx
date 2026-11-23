import clsx from 'clsx';
import { ButtonHTMLAttributes } from 'react';

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md';
};

export function Button({
  className,
  variant = 'primary',
  size = 'md',
  ...props
}: Props) {
  return (
    <button
      className={clsx(
        'ui-btn',
        `ui-btn--${variant}`,
        `ui-btn--${size}`,
        className,
      )}
      {...props}
    />
  );
}