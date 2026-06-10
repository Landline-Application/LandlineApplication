import React from 'react';

const TINTS = [
  'var(--tint-primary-soft)',
  'var(--tint-clay-soft)',
  'rgba(93,112,82,0.13)',
  'rgba(193,140,93,0.13)',
];

function initials(name) {
  return (name || '')
    .split(/[\s._-]/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => (w[0] || '').toUpperCase())
    .join('');
}

/**
 * AppAvatar — round monogram chip with a tint derived from the app name.
 */
export function AppAvatar({ name, size = 28, color = 'var(--color-primary)', style, ...rest }) {
  let hash = 0;
  for (let i = 0; i < (name || '').length; i++) hash = (hash * 31 + name.charCodeAt(i)) & 0xffff;
  const bg = TINTS[hash % TINTS.length];
  return (
    <span style={{
      width: size, height: size, borderRadius: '50%', background: bg,
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, ...style,
    }} {...rest}>
      <span style={{ fontFamily: 'var(--font-sans)', fontWeight: 'var(--weight-bold)',
        fontSize: Math.round(size * 0.36), letterSpacing: 0.3, color }}>
        {initials(name)}
      </span>
    </span>
  );
}
