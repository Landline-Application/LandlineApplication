import React from 'react';

/**
 * Status indicator dot — the live "session active" light. Pulsing glow when active.
 */
export function StatusIndicator({ active = false, color = 'var(--color-primary)', size = 'md', label, style, ...rest }) {
  const sizes = { sm: 8, md: 12, lg: 16 };
  const d = sizes[size] || sizes.md;
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 'var(--space-sm)', ...style }} {...rest}>
      <span
        style={{
          position: 'relative',
          width: d,
          height: d,
          borderRadius: '50%',
          background: active ? color : 'var(--ink-5)',
          boxShadow: active ? `0 0 0 0 ${color}` : 'none',
          animation: active ? 'll-pulse 2.4s var(--ease-in-out) infinite' : 'none',
        }}
      />
      {label && (
        <span style={{ fontFamily: 'var(--font-sans)', fontWeight: 'var(--weight-semibold)',
          fontSize: 'var(--size-label-sm)', letterSpacing: 'var(--tracking-label)',
          textTransform: 'uppercase', color: active ? color : 'var(--text-muted)' }}>
          {label}
        </span>
      )}
      <style>{`@keyframes ll-pulse {0%,100%{box-shadow:0 0 0 0 ${typeof color === 'string' && color.startsWith('#') ? color : 'rgba(93,112,82,0.5)'};}50%{box-shadow:0 0 0 8px rgba(93,112,82,0);}}`}</style>
    </span>
  );
}
