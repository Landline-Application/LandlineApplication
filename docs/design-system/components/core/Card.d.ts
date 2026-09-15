import * as React from 'react';

export interface CardProps {
  children?: React.ReactNode;
  /** Surface tone. @default "base" */
  variant?: 'base' | 'card' | 'elevated' | 'outlined';
  /** Green-tinted drop shadow. @default "sm" */
  elevation?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  /** Use an asymmetric hand-thrown corner radius. Pass a number 0–3 to pick a variant. @default false */
  organic?: boolean | number;
  /** Inner padding. @default "lg" */
  padding?: 'none' | 'sm' | 'md' | 'lg';
  style?: React.CSSProperties;
}

/** Warm paper container with green-tinted elevation; the workhorse surface. */
export function Card(props: CardProps): JSX.Element;
