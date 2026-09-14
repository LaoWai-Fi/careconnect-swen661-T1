// CareConnect design tokens — ported 1:1 from the team's Week 3 Figma design
// system (and mobile-flutter/lib/theme/tokens.dart). Light-mode values come
// straight from the Figma CSS custom properties; dark-mode values mirror the
// `.dark` token block. Contrast ratios were verified against WCAG 2.2 AA.

export const CCTokens = {
  // ── Brand / primary ────────────────────────────────────────────────────
  primaryLight: '#1B6E7A',
  primaryDark: '#4CC8D8',
  primaryForegroundLight: '#FFFFFF',
  primaryForegroundDark: '#07141A',
  primaryHoverLight: '#155E6A',
  primaryActiveLight: '#114F59',
  primaryHoverDark: '#5DD4E2',
  primaryActiveDark: '#3AB4C4',

  // ── Surfaces ────────────────────────────────────────────────────────────
  backgroundLight: '#F0F4F7',
  backgroundDark: '#0F1E25',
  cardLight: '#FFFFFF',
  cardDark: '#162630',
  foregroundLight: '#1A2B35',
  foregroundDark: '#E6EFF4',
  mutedLight: '#E2EAF0',
  mutedDark: '#1D3040',
  mutedForegroundLight: '#4A6270', // WCAG 5.4:1 on light bg
  mutedForegroundDark: '#8FB2BF', // 7.5:1 on dark bg
  borderLight: '#7C848A',
  borderDark: '#547E9A',
  accentLight: '#227B88',
  accentDark: '#60D4E4',

  // ── Semantic ────────────────────────────────────────────────────────────
  destructiveLight: '#B91C1C', // 6.1:1 w/ white
  destructiveDark: '#F87171',
  destructiveHoverLight: '#991B1B',
  destructiveActiveLight: '#7F1D1D',
  destructiveHoverDark: '#FCA5A5',
  destructiveActiveDark: '#FBBABA',
  secondaryLight: '#A6512E',
  secondaryDark: '#E08A5C',
  secondaryHoverLight: '#8F4427',
  secondaryActiveLight: '#7A3920',
  secondaryHoverDark: '#E89970',
  secondaryActiveDark: '#D47A4A',
  outlineHoverLight: '#E8F4F6',
  outlineActiveLight: '#CEE9EC',
  outlineHoverDark: '#1A3040',
  outlineActiveDark: '#152838',

  // ── Status surfaces ─────────────────────────────────────────────────────
  successBgLight: '#EDFBF2',
  successBgDark: '#052E14',
  successBorderLight: '#5D7B68',
  successBorderDark: '#249551',
  successTextLight: '#166534',
  successTextDark: '#86EFAC',
  warningBgLight: '#FFFBEA',
  warningBgDark: '#211300',
  warningBorderLight: '#8B7E4B',
  warningBorderDark: '#B4641C',
  warningTextLight: '#92400E',
  warningTextDark: '#FCD34D',
  infoBgLight: '#EDF6F8',
  infoBgDark: '#051E26',
  infoBorderLight: '#5A767B',
  infoBorderDark: '#367CAC',
  infoTextLight: '#1B6E7A',
  infoTextDark: '#4CC8D8',

  // ── Shape ───────────────────────────────────────────────────────────────
  radius: 12,

  // ── Tap target sizes (WCAG 2.5.8 Target Size – AA) ─────────────────────
  minTarget: 48,
  buttonSm: 48,
  buttonMd: 52,
  buttonLg: 60,

  // ── Focus ring (WCAG 2.4.7 Focus Visible – AA) ──────────────────────────
  focusOutlineWidth: 3,
  focusOutlineOffset: 2,
} as const;

export type ColorScheme = 'light' | 'dark';

/** Resolved palette for one color scheme — the RN counterpart of Flutter's
 * Theme.of(context).colorScheme lookups. */
export interface Palette {
  primary: string;
  onPrimary: string;
  background: string;
  surface: string;
  surfaceHighest: string;
  onSurface: string;
  onSurfaceVariant: string;
  outline: string;
  error: string;
}

export function palette(scheme: ColorScheme): Palette {
  return scheme === 'light'
    ? {
        primary: CCTokens.primaryLight,
        onPrimary: CCTokens.primaryForegroundLight,
        background: CCTokens.backgroundLight,
        surface: CCTokens.cardLight,
        surfaceHighest: CCTokens.mutedLight,
        onSurface: CCTokens.foregroundLight,
        onSurfaceVariant: CCTokens.mutedForegroundLight,
        outline: CCTokens.borderLight,
        error: CCTokens.destructiveLight,
      }
    : {
        primary: CCTokens.primaryDark,
        onPrimary: CCTokens.primaryForegroundDark,
        background: CCTokens.backgroundDark,
        surface: CCTokens.cardDark,
        surfaceHighest: CCTokens.mutedDark,
        onSurface: CCTokens.foregroundDark,
        onSurfaceVariant: CCTokens.mutedForegroundDark,
        outline: CCTokens.borderDark,
        error: CCTokens.destructiveDark,
      };
}
