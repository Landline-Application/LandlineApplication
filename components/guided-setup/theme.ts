import { COLORS } from '@/constants/colors';

/**
 * Shared palette for guided setup — matches auth FormLayout + RolodexCard (brown / cream).
 */
export const G = {
  screen: COLORS.background,
  /** Large titles on dark screen */
  headline: COLORS.cardBg,
  /** Muted lines on dark screen */
  subOnDark: COLORS.cardBorder,
  progress: COLORS.tabBg,
  /** Main content panel (Rolodex “card” body) */
  panel: COLORS.cardBg,
  panelBorder: COLORS.cardBorder,
  primary: COLORS.textPrimary,
  onPrimary: COLORS.cardBg,
  secondarySurface: COLORS.tabBg,
  secondaryBorder: COLORS.tabBorder,
  outlineOnDark: COLORS.cardBg,
  muted: COLORS.textSecondary,
  text: COLORS.textPrimary,
  well: COLORS.inputBg,
  wellBorder: COLORS.cardBorder,
  switchTrackOff: COLORS.cardBorder,
  switchTrackOn: COLORS.activeBorder,
  success: '#5a7a52',
  bullet: COLORS.activeBorder,
  modalOverlay: 'rgba(0,0,0,0.45)',
  modalSheet: COLORS.cardBg,
} as const;
