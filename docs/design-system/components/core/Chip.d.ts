import * as React from 'react';

export interface ChipProps {
  children?: React.ReactNode;
  label?: string;
  /** Selected state — fills with moss. @default false */
  active?: boolean;
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  style?: React.CSSProperties;
}

/** Pill-shaped filter toggle, as used in the notification feed filter bar. */
export function Chip(props: ChipProps): JSX.Element;
