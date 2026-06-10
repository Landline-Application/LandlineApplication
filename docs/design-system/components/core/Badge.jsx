import React from 'react';

/**
 * Badge / pill — small status or count token. Tones map to brand + category colors.
 */
export function Badge({ children, label, tone = 'primary', soft = true, style, ...rest }) {
  const tones = {
    primary: 'var(--color-primary)',
    secondary: 'var(--color-secondary)',
    neutral: 'var(--ink-4)',
    success: 'var(--ok)',
    warning: 'var(--warn)',
    danger: 'var(--danger)',
  };
  const c = tones[tone] || tones.primary;
  const solid = { background: c, color: '#fff' };
  const softStyle = { background: `color-mix(in srgb, ${c} 14%, transparent)`, color: c, border: `1px solid color-mix(in srgb, ${c} 30%, transparent)` };

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
        padding: '2px 10px',
        borderRadius: 'var(--radius-pill)',
        fontFamily: 'var(--font-sans)',
        fontWeight: 'var(--weight-semibold)',
        fontSize: 'var(--size-caption-sm)',
        letterSpacing: 'var(--tracking-label)',
        lineHeight: 1.4,
        ...(soft ? softStyle : solid),
        ...style,
      }}
      {...rest}
    >
      {label ?? children}
    </span>
  );
}
