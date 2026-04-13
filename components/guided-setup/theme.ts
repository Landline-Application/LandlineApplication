/**
 * Rolodex / auth-style palette for guided setup (brown on dark screen).
 * Kept local so we do not depend on removed `constants/colors`.
 */
const LEGACY = {
  activeBorder: '#5d4e37',
  background: '#2b2b2b',
  cardBg: '#f5f1e8',
  cardBorder: '#d4c5a0',
  inputBg: '#ffffff',
  tabBg: '#c8b88a',
  tabBorder: '#a89968',
  textPrimary: '#5d4e37',
  textSecondary: '#7a6a4a',
} as const;

/**
 * Shared palette for guided setup — matches auth FormLayout + RolodexCard (brown / cream).
 */
export const G = {
  screen: LEGACY.background,
  /** Large titles on dark screen */
  headline: LEGACY.cardBg,
  /** Muted lines on dark screen */
  subOnDark: LEGACY.cardBorder,
  progress: LEGACY.tabBg,
  /** Main content panel (Rolodex “card” body) */
  panel: LEGACY.cardBg,
  panelBorder: LEGACY.cardBorder,
  primary: LEGACY.textPrimary,
  onPrimary: LEGACY.cardBg,
  secondarySurface: LEGACY.tabBg,
  secondaryBorder: LEGACY.tabBorder,
  outlineOnDark: LEGACY.cardBg,
  muted: LEGACY.textSecondary,
  text: LEGACY.textPrimary,
  well: LEGACY.inputBg,
  wellBorder: LEGACY.cardBorder,
  switchTrackOff: LEGACY.cardBorder,
  switchTrackOn: LEGACY.activeBorder,
  success: '#5a7a52',
  bullet: LEGACY.activeBorder,
  modalOverlay: 'rgba(0,0,0,0.45)',
  modalSheet: LEGACY.cardBg,
} as const;
