import * as React from 'react';

export interface NotificationRowProps {
  /** Source app name (used by the optional leading avatar). */
  appName: string;
  /** Headline — rendered in serif. */
  title: string;
  /** Supporting body text. */
  text?: string;
  /** Relative time string, e.g. "3m ago". */
  time?: string;
  /** Show the moss "Auto Replied" pill. @default false */
  autoReplied?: boolean;
  /** Render a leading AppAvatar. @default false */
  showAvatar?: boolean;
  /** Hairline divider below the row (for stacked rows in a card). @default false */
  divider?: boolean;
  style?: React.CSSProperties;
}

/** A single captured-notification entry from the Landline log feed. */
export function NotificationRow(props: NotificationRowProps): JSX.Element;
