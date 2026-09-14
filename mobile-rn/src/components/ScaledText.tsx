// Text-size accessibility wrapper — RN counterpart of Flutter's app-wide
// MediaQuery textScaler override (see main.dart's CareConnectApp, which
// wraps the whole tree in a MediaQuery that multiplies every rendered
// font size by the user's TEXT SIZE setting).
//
// RN has no equivalent root-level override: there's no single ancestor that
// can rescale every descendant Text the way Flutter's MediaQuery does. So
// instead, every file that renders visible text imports Text from here
// (aliased right back to the name `Text`, e.g.
// `import { ScaledText as Text } from '../components/ScaledText'`) instead
// of importing it from 'react-native' directly — one component reads the
// user's Settings → Text Size selection (via useAppTheme's textScale) and
// multiplies whatever fontSize each call site already specifies.
//
// Call sites that don't set an explicit fontSize are left at RN's platform
// default, same as before this existed — there's no base size to scale.

import { Text as RNText, StyleSheet } from 'react-native';
import type { TextProps } from 'react-native';
import { useAppStateSafe } from '../state/AppState';
import { textScaleFor } from '../hooks/useAppTheme';

export function ScaledText(props: TextProps) {
  // Non-throwing lookup: ScaledText stands in for every Text in the app, so
  // it also renders in unit tests that mount a single component (e.g.
  // Cards.test.tsx) without wrapping it in <AppStateProvider>. Outside the
  // provider — there is no real "no scaling has been chosen" — default to 1.
  const ctx = useAppStateSafe();
  const textScale = ctx ? textScaleFor(ctx.state.fontSize) : 1;

  if (textScale === 1) {
    return <RNText {...props} />;
  }

  const flat = StyleSheet.flatten(props.style) as { fontSize?: number } | undefined;
  if (!flat || typeof flat.fontSize !== 'number') {
    return <RNText {...props} />;
  }

  return <RNText {...props} style={[props.style, { fontSize: flat.fontSize * textScale }]} />;
}
