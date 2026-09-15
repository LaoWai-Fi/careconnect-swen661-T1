// Theme hooks — resolve the current color scheme and text-scale multiplier
// from AppState (the RN counterpart of Flutter's Theme.of(context) lookups).

import { useColorScheme } from 'react-native';
import { useAppState } from '../state/AppState';
import { palette } from '../theme/tokens';
import type { ColorScheme, Palette } from '../theme/tokens';

export interface AppTheme {
  scheme: ColorScheme;
  p: Palette;
  /** Multiplier applied to text sizes (normal 1, large 1.15, xlarge 1.3). */
  textScale: number;
}

/** Shared with ScaledText so the two never drift apart. */
export function textScaleFor(fontSize: 'normal' | 'large' | 'xlarge'): number {
  return fontSize === 'xlarge' ? 1.3 : fontSize === 'large' ? 1.15 : 1;
}

export function useAppTheme(): AppTheme {
  const { state } = useAppState();
  const system = useColorScheme();
  const scheme: ColorScheme =
    state.theme === 'dark' || (state.theme === 'system' && system === 'dark')
      ? 'dark'
      : 'light';
  return {
    scheme,
    p: palette(scheme),
    textScale: textScaleFor(state.fontSize),
  };
}
