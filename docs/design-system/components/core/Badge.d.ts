import * as React from 'react';

export interface BadgeProps {
  children?: React.ReactNode;
  label?: string;
  /** Color tone. @default "primary" */
  tone?: 'primary' | 'secondary' | 'neutral' | 'success' | 'warning' | 'danger';
  /** Soft tinted fill (default) vs solid. @default true */
  soft?: boolean;
  style?: React.CSSProperties;
}

/** Small pill for counts, status, and tags. */
export function Badge(props: BadgeProps): JSX.Element;
