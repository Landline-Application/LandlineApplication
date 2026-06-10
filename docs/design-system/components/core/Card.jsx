import React from 'react';

/**
 * Landline Card — warm paper surface with green-tinted elevation.
 * Set `organic` for a hand-thrown asymmetric corner radius.
 */
export function Card({
  children,
  variant = 'base',
  elevation = 'sm',
  organic = false,
  padding = 'lg',
  style,
  ...rest
}) {
  const surfaces = {
    base: { background: 'var(--surface-base)', border: '1px solid var(--color-border)' },
    card: { background: 'var(--surface-card)', border: '1px solid var(--color-accent)' },
    elevated: { background: 'var(--surface-elevated)', border: '1px solid var(--color-accent)' },
    outlined: { background: 'transparent', border: '1.5px solid var(--color-border)' },
  };
  const shadows = {
    none: 'none',
    sm: 'var(--shadow-sm)',
    md: 'var(--shadow-md)',
    lg: 'var(--shadow-lg)',
    xl: 'var(--shadow-xl)',
  };
  const pads = { none: 0, sm: 'var(--space-md)', md: 'var(--space-lg)', lg: 'var(--space-2xl)' };
  const organicCorners = ['var(--card-organic-a)', 'var(--card-organic-b)', 'var(--card-organic-c)', 'var(--card-organic-d)'];
  const radius = organic
    ? (typeof organic === 'number' ? organicCorners[organic % 4] : organicCorners[0])
    : 'var(--radius-2xl)';

  return (
    <div
      style={{
        borderRadius: radius,
        padding: pads[padding],
        boxShadow: shadows[elevation],
        ...surfaces[variant],
        ...style,
      }}
      {...rest}
    >
      {children}
    </div>
  );
}
