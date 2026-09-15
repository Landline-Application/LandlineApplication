import React from 'react';

/**
 * Switch — moss when on, stone track when off. 0.95 thumb press not needed; smooth slide.
 */
export function Switch({ checked = false, onChange, disabled = false, style, ...rest }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange && onChange(!checked)}
      style={{
        width: 52,
        height: 32,
        borderRadius: 'var(--radius-pill)',
        border: 'none',
        padding: 3,
        cursor: disabled ? 'default' : 'pointer',
        background: checked ? 'var(--color-primary)' : 'var(--stone)',
        opacity: disabled ? 0.5 : 1,
        transition: 'background var(--dur-normal) var(--ease-out)',
        position: 'relative',
        display: 'inline-flex',
        ...style,
      }}
      {...rest}
    >
      <span
        style={{
          width: 26,
          height: 26,
          borderRadius: '50%',
          background: 'var(--paper)',
          boxShadow: 'var(--shadow-sm)',
          transform: checked ? 'translateX(20px)' : 'translateX(0)',
          transition: 'transform var(--dur-normal) var(--ease-out)',
        }}
      />
    </button>
  );
}
