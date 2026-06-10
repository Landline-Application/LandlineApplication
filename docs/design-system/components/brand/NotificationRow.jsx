import React from 'react';
import { AppAvatar } from './AppAvatar.jsx';
import { Badge } from '../core/Badge.jsx';

/**
 * NotificationRow — a captured notification entry: title (serif), supporting text,
 * relative time, and an optional auto-reply pill. Mirrors the Landline log feed.
 */
export function NotificationRow({
  appName,
  title,
  text,
  time,
  autoReplied = false,
  showAvatar = false,
  divider = false,
  style,
  ...rest
}) {
  return (
    <div style={{
      display: 'flex', alignItems: 'flex-start', gap: 'var(--space-md)',
      padding: 'var(--space-md) var(--space-lg)',
      borderBottom: divider ? '1px solid var(--color-muted)' : 'none',
      background: 'var(--surface-base)', ...style,
    }} {...rest}>
      {showAvatar && <AppAvatar name={appName} size={32} />}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 3 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--space-sm)' }}>
          <span style={{ flex: 1, fontFamily: 'var(--font-serif-display)', fontWeight: 'var(--weight-semibold)',
            fontSize: 15, lineHeight: '21px', color: 'var(--text-primary)' }}>
            {title}
          </span>
          {time && <span style={{ flexShrink: 0, fontFamily: 'var(--font-sans)', fontSize: 11,
            lineHeight: '18px', color: 'var(--text-muted)' }}>{time}</span>}
        </div>
        {text && <span style={{ fontFamily: 'var(--font-sans)', fontSize: 13, lineHeight: '18px',
          color: 'var(--text-secondary)' }}>{text}</span>}
        {autoReplied && (
          <span style={{ marginTop: 3 }}>
            <Badge tone="primary" soft>↩ Auto Replied</Badge>
          </span>
        )}
      </div>
    </div>
  );
}
