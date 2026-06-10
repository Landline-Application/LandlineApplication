import * as React from 'react';

export interface StatusIndicatorProps {
  /** Active = colored + pulsing glow; inactive = dim grey. @default false */
  active?: boolean;
  /** Dot color when active. @default moss primary */
  color?: string;
  /** @default "md" */
  size?: 'sm' | 'md' | 'lg';
  /** Optional uppercase label rendered beside the dot. */
  label?: string;
  style?: React.CSSProperties;
}

/** The live session light — a small dot that pulses a moss glow when active. */
export function StatusIndicator(props: StatusIndicatorProps): JSX.Element;
