// Shared RNTL helpers. SafeAreaProvider only renders its children once the
// native insets arrive, which never happens under Jest — every test that
// needs the provider must pass these initialMetrics.

import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AppStateProvider } from '../state/AppState';
import type { AppStateData } from '../state/AppState';

export const testInitialMetrics = {
  frame: { x: 0, y: 0, width: 320, height: 640 },
  insets: { top: 0, left: 0, right: 0, bottom: 0 },
};

/** Wraps children in SafeAreaProvider (with test metrics) + AppStateProvider. */
export function TestAppProviders({
  children,
  initialState,
}: {
  children: React.ReactNode;
  initialState?: AppStateData;
}) {
  return (
    <SafeAreaProvider initialMetrics={testInitialMetrics}>
      <AppStateProvider initialState={initialState}>{children}</AppStateProvider>
    </SafeAreaProvider>
  );
}

/** Flushes React 19's concurrent render queue so a state update triggered by
 * fireEvent.changeText/press is visible to the very next query. Without this,
 * back-to-back changeText calls read stale props (the update is still
 * scheduled when the next line runs). */
export async function flushReact() {
  await new Promise<void>((resolve) => setTimeout(resolve, 0));
}
