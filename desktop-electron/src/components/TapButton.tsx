import React from 'react';
import { useTapRipple } from '../useTapRipple';

interface TapButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'outline' | 'ghost' | 'destructive' | 'secondary';
  size?: 'xs' | 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
}

export default function TapButton({
  variant = 'primary',
  size = 'md',
  fullWidth,
  children,
  className = '',
  ...props
}: TapButtonProps) {
  const ripple = useTapRipple();

  const base =
    'inline-flex items-center justify-center gap-2 font-semibold rounded-xl transition-all duration-150 select-none cursor-pointer ' +
    'focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-[var(--ring)] ' +
    'active:scale-[0.97] ' +
    'disabled:opacity-40 disabled:cursor-not-allowed disabled:pointer-events-none';

  const sizeClass = {
    xs: 'px-2.5 py-1.5 text-xs min-h-8',
    sm: 'px-4 py-2.5 text-sm min-h-[44px]',
    md: 'px-5 py-3 text-base min-h-[52px]',
    lg: 'px-6 py-4 text-lg min-h-[60px]',
  }[size];

  const variantClass = {
    primary:
      'bg-[var(--primary)] text-[var(--primary-foreground)] hover:bg-[var(--primary-hover)] active:bg-[var(--primary-active)]',
    outline:
      'border-2 border-[var(--primary)] text-[var(--primary)] bg-[var(--card)] hover:bg-[var(--outline-hover)] active:bg-[var(--outline-active)]',
    ghost:
      'bg-transparent text-[var(--primary)] hover:bg-[var(--outline-hover)] active:bg-[var(--outline-active)]',
    destructive:
      'bg-[var(--destructive)] text-[var(--destructive-foreground)] hover:bg-[var(--destructive-hover)] active:bg-[var(--destructive-active)] focus-visible:outline-[var(--destructive)]',
    secondary:
      'bg-[var(--secondary)] text-[var(--secondary-foreground)] hover:bg-[var(--secondary-hover)] active:bg-[var(--secondary-active)]',
  }[variant];

  return (
    <button
      {...props}
      onPointerDown={ripple}
      className={`${base} ${sizeClass} ${variantClass} ${fullWidth ? 'w-full' : ''} ${className}`}
    >
      {children}
    </button>
  );
}
