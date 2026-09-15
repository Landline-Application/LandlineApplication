import * as React from 'react';

export interface OutlinedFieldProps {
  /** Uppercase eyebrow label above the field. */
  label?: string;
  value?: string;
  onChange?: (value: string, e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  type?: string;
  /** Error message — turns the border rust and shows below. */
  error?: string;
  /** Optional element inside the field, before the input. */
  leadingIcon?: React.ReactNode;
  disabled?: boolean;
  style?: React.CSSProperties;
}

/** Outlined text input with an uppercase label; moss focus ring, rust error state. */
export function OutlinedField(props: OutlinedFieldProps): JSX.Element;
