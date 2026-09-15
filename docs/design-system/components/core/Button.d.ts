import * as React from 'react';

/**
 * Primary call-to-action button. Rounded 24px corners, moss/clay fills,
 * tap shrinks to 0.95.
 */
export interface ButtonProps {
  /** Text label (or use children) */
  label?: string;
  children?: React.ReactNode;
  /** Visual style. @default "primary" */
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'text';
  /** Height/padding step. @default "md" */
  size?: 'sm' | 'md' | 'lg' | 'xl';
  disabled?: boolean;
  /** Shows a loading affordance and blocks interaction. */
  loading?: boolean;
  /** Stretch to container width. */
  fullWidth?: boolean;
  /** Optional element rendered before the label (e.g. a Material icon). */
  leadingIcon?: React.ReactNode;
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  style?: React.CSSProperties;
}

/**
 * Primary call-to-action button. Rounded 24px corners, moss/clay fills,
 * tap shrinks to 0.95.
 */
export function Button(props: ButtonProps): JSX.Element;
