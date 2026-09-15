import React from 'react';

/**
 * SessionStat — labeled metric tile. Big Fraunces value over an uppercase label.
 * Used on the home screen for session duration & notification count.
 */
export function SessionStat({ label, value, tone = 'primary', style, ...rest }) {
  const valueColor = tone === 'secondary' ? 'var(--color-secondary)' : 'var(--color-primary)';
  const bg = tone === 'secondary' ? 'var(--surface-base)' : 'var(--surface-elevated)';
  return (
    <div style={{
      background: bg, border: '1px solid var(--color-accent)',
      borderRadius: 'var(--radius-lg)', padding: 'var(--space-lg)',
      minHeight: 100, display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', gap: 'var(--space-sm)',
      boxShadow: 'var(--shadow-sm)', ...style,
    }} {...rest}>
      <span style={{ fontFamily: 'var(--font-sans)', fontWeight: 'var(--weight-semibold)',
        fontSize: 'var(--size-label-sm)', letterSpacing: 'var(--tracking-label)',
        textTransform: 'uppercase', color: 'var(--text-secondary)' }}>
        {label}
      </span>
      <span style={{ fontFamily: 'var(--font-serif-display)', fontWeight: 'var(--weight-bold)',
        fontSize: 28, lineHeight: 1, color: valueColor }}>
        {value}
      </span>
    </div>
  );
}
