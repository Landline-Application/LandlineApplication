import React from 'react';

/**
 * RolodexCard — the signature branded card: a clay tab header, paper body,
 * and two punch holes at the bottom edge (vintage Rolodex / index-card metaphor).
 */
export function RolodexCard({ title, children, style, ...rest }) {
  return (
    <div style={{ position: 'relative', width: '100%', ...style }} {...rest}>
      {/* Tab */}
      <div style={{
        alignSelf: 'center', width: 'fit-content', margin: '0 auto -1px',
        background: 'var(--color-secondary)', color: 'var(--color-on-secondary)',
        padding: '6px 24px', borderTopLeftRadius: 10, borderTopRightRadius: 10,
        border: '1px solid var(--color-muted)', borderBottom: 'none',
        fontFamily: 'var(--font-sans)', fontWeight: 800, fontSize: 'var(--size-caption-sm)',
        letterSpacing: 'var(--tracking-eyebrow)', textTransform: 'uppercase',
        position: 'relative', zIndex: 2, textAlign: 'center',
      }}>
        {title}
      </div>
      {/* Card body */}
      <div style={{
        background: 'var(--surface-card)', borderRadius: 'var(--radius-md)',
        border: '1px solid var(--color-border)', position: 'relative', zIndex: 1,
        overflow: 'hidden', boxShadow: 'var(--shadow-md)',
      }}>
        <div style={{ padding: 'var(--space-2xl) var(--space-2xl) 56px' }}>{children}</div>
        {/* Punch holes */}
        <div style={{ position: 'absolute', bottom: 14, left: 0, right: 0,
          display: 'flex', justifyContent: 'center', gap: 80 }}>
          <span style={{ width: 22, height: 22, borderRadius: '50%', background: 'var(--color-background)',
            boxShadow: 'var(--shadow-hole)', border: '1px solid rgba(0,0,0,0.08)' }} />
          <span style={{ width: 22, height: 22, borderRadius: '50%', background: 'var(--color-background)',
            boxShadow: 'var(--shadow-hole)', border: '1px solid rgba(0,0,0,0.08)' }} />
        </div>
      </div>
    </div>
  );
}
