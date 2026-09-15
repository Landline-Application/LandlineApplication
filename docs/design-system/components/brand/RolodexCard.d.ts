import * as React from 'react';

/**
 * The signature Landline card: a clay index-card tab, paper body, and two
 * punch holes at the bottom. Use to frame auth and "card" moments.
 */
export interface RolodexCardProps {
  /** Uppercase label shown in the clay tab. */
  title: string;
  children?: React.ReactNode;
  style?: React.CSSProperties;
}

/**
 * The signature Landline card: a clay index-card tab, paper body, and two
 * punch holes at the bottom.
 */
export function RolodexCard(props: RolodexCardProps): JSX.Element;
