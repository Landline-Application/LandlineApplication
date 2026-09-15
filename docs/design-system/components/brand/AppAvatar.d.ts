import * as React from 'react';

export interface AppAvatarProps {
  /** App/source name — drives both the monogram and the tint. */
  name: string;
  /** Diameter in px. @default 28 */
  size?: number;
  /** Monogram text color. @default moss primary */
  color?: string;
  style?: React.CSSProperties;
}

/** Round monogram chip; background tint is hashed deterministically from the name. */
export function AppAvatar(props: AppAvatarProps): JSX.Element;
