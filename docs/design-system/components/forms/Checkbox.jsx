import React from 'react';

/**
 * Checkbox — rounded square, moss fill + check when checked. Used in terms gate.
 */
export function Checkbox({ checked = false, onChange, label, disabled = false, style, ...rest }) {
  return (
    <label style={{ display: 'inline-flex', alignItems: 'center', gap: 'var(--space-md)',
      cursor: disabled ? 'default' : 'pointer', opacity: disabled ? 0.5 : 1, ...style }} {...rest}>
      <button
        type="button"
        role="checkbox"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange && onChange(!checked)}
        style={{
          width: 24, height: 24, flexShrink: 0,
          borderRadius: 'var(--radius-sm)',
          border: checked ? 'none' : '2px solid var(--color-border)',
          background: checked ? 'var(--color-primary)' : 'transparent',
          color: 'var(--color-on-primary)',
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'inherit', padding: 0,
          transition: 'all var(--dur-fast) var(--ease-out)',
        }}
      >
        {checked && (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        )}
      </button>
      {label && (
        <span style={{ fontFamily: 'var(--font-sans)', fontSize: 'var(--size-body-sm)', color: 'var(--text-primary)' }}>
          {label}
        </span>
      )}
    </label>
  );
}
