import React from 'react';

/**
 * Landline Button — rounded (24px), gentle press-shrink to 0.95.
 * Variants: primary (moss), secondary (clay), ghost (moss outline),
 * danger (rust), text (quiet link).
 */
export function Button({
  label,
  children,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  fullWidth = false,
  leadingIcon,
  onClick,
  style,
  ...rest
}) {
  const sizes = {
    sm: { height: 40, padding: '0 12px', font: 'var(--size-label-sm)' },
    md: { height: 48, padding: '0 16px', font: 'var(--size-label)' },
    lg: { height: 56, padding: '0 20px', font: 'var(--size-label)' },
    xl: { height: 64, padding: '0 24px', font: 'var(--size-body)' },
  };

  const variants = {
    primary: { background: 'var(--color-primary)', color: 'var(--color-on-primary)', border: 'none' },
    secondary: { background: 'var(--color-secondary)', color: 'var(--color-on-secondary)', border: 'none' },
    ghost: { background: 'transparent', color: 'var(--color-primary)', border: '1.5px solid var(--color-primary)' },
    danger: { background: 'var(--color-destructive)', color: '#fff', border: 'none' },
    text: { background: 'transparent', color: 'var(--text-secondary)', border: 'none' },
  };

  const s = sizes[size] || sizes.md;
  const v = variants[variant] || variants.primary;
  const isDisabled = disabled || loading;

  return (
    <button
      type="button"
      disabled={isDisabled}
      onClick={onClick}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 'var(--space-sm)',
        height: s.height,
        padding: s.padding,
        width: fullWidth ? '100%' : 'auto',
        borderRadius: 'var(--radius-xl)',
        fontFamily: 'var(--font-sans)',
        fontWeight: 'var(--weight-semibold)',
        fontSize: s.font,
        letterSpacing: 'var(--tracking-label)',
        cursor: isDisabled ? 'default' : 'pointer',
        opacity: isDisabled ? 0.4 : 1,
        transition: 'transform var(--dur-fast) var(--ease-out), filter var(--dur-fast) var(--ease-out)',
        ...v,
        ...style,
      }}
      onMouseDown={(e) => { if (!isDisabled) e.currentTarget.style.transform = 'scale(var(--scale-press))'; }}
      onMouseUp={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
      onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
      {...rest}
    >
      {loading ? '···' : (<>{leadingIcon}{label ?? children}</>)}
    </button>
  );
}
