import React from 'react';

/**
 * Outlined text field with a floating-style label, used across auth screens.
 */
export function OutlinedField({
  label,
  value,
  onChange,
  placeholder,
  type = 'text',
  error,
  leadingIcon,
  disabled = false,
  style,
  ...rest
}) {
  const [focused, setFocused] = React.useState(false);
  const borderColor = error
    ? 'var(--color-destructive)'
    : focused
    ? 'var(--color-primary)'
    : 'var(--color-border)';

  return (
    <label style={{ display: 'block', ...style }}>
      {label && (
        <span style={{ display: 'block', marginBottom: 'var(--space-sm)', fontFamily: 'var(--font-sans)',
          fontWeight: 'var(--weight-semibold)', fontSize: 'var(--size-label-sm)',
          letterSpacing: 'var(--tracking-label)', textTransform: 'uppercase', color: 'var(--text-secondary)' }}>
          {label}
        </span>
      )}
      <span style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)',
        background: 'var(--surface-base)', border: `1.5px solid ${borderColor}`,
        borderRadius: 'var(--radius-lg)', padding: '0 var(--space-lg)', height: 56,
        transition: 'border-color var(--dur-fast) var(--ease-out)', opacity: disabled ? 0.5 : 1 }}>
        {leadingIcon}
        <input
          type={type}
          value={value}
          placeholder={placeholder}
          disabled={disabled}
          onChange={(e) => onChange && onChange(e.target.value, e)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={{ flex: 1, border: 'none', outline: 'none', background: 'transparent',
            fontFamily: 'var(--font-sans)', fontSize: 'var(--size-body)', color: 'var(--text-primary)' }}
          {...rest}
        />
      </span>
      {error && (
        <span style={{ display: 'block', marginTop: 'var(--space-xs)', fontFamily: 'var(--font-sans)',
          fontSize: 'var(--size-caption)', color: 'var(--color-destructive)' }}>
          {error}
        </span>
      )}
    </label>
  );
}
