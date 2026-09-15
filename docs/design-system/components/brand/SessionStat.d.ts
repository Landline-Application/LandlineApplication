import * as React from 'react';

export interface SessionStatProps {
  /** Uppercase caption above the value. */
  label: string;
  /** The metric — string or number, rendered big in Fraunces. */
  value: string | number;
  /** Accent for the value. @default "primary" */
  tone?: 'primary' | 'secondary';
  style?: React.CSSProperties;
}

/** A metric tile: big serif value over an uppercase label. Pairs two-up on the home screen. */
export function SessionStat(props: SessionStatProps): JSX.Element;
