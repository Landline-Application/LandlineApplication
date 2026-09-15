import * as React from 'react';

export interface SwitchProps {
  /** On/off state. @default false */
  checked?: boolean;
  onChange?: (next: boolean) => void;
  disabled?: boolean;
  style?: React.CSSProperties;
}

/** Toggle switch — moss track when on, stone when off, paper thumb slides 300ms. */
export function Switch(props: SwitchProps): JSX.Element;
