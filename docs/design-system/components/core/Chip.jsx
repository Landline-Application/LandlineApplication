import React from 'react';

/**
 * Filter chip — pill toggle used in the notification feed filter bar.
 */
export function Chip({ children, label, active = false, onClick, style, ...rest }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        height: 32,
        padding: '0 14px',
        borderRadius: 'var(--radius-pill)',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'var(--font-sans)',
        fontWeight: 'var(--weight-semibold)',
        fontSize: 'var(--size-body-sm)',
        cursor: 'pointer',
        border: active ? '1px solid var(--color-primary)' : '1px solid var(--color-border)',
        background: active ? 'var(--color-primary)' : 'transparent',
        color: active ? 'var(--color-on-primary)' : 'var(--text-secondary)',
        transition: 'all var(--dur-fast) var(--ease-out)',
        ...style,
      }}
      {...rest}
    >
      {label ?? children}
    </button>
  );
}
