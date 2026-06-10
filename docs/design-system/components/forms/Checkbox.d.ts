import * as React from 'react';

export interface CheckboxProps {
  checked?: boolean;
  onChange?: (next: boolean) => void;
  /** Optional inline label to the right of the box. */
  label?: string;
  disabled?: boolean;
  style?: React.CSSProperties;
}

/** Rounded-square checkbox; moss fill with a check when selected. */
export function Checkbox(props: CheckboxProps): JSX.Element;
