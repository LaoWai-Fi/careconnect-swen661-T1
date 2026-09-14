// Root component — RN port of main.dart's CareConnectApp.
//
// Owns the global providers (AppState) and mounts the React Navigation root
// navigator. Route map mirrors the Flutter app's named routes:
//   landing, signin, signup, main (5 tabs), medicationDetail,
//   appointmentDetail, messageDetail, archivedMessages

import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View } from 'react-native';
import { RootNavigator } from './navigation/RootNavigator';
import { AppStateProvider, useAppState } from './state/AppState';
import type { AppStateData } from './state/AppState';
import { palette } from './theme/tokens';

function AppFrame() {
  const { state } = useAppState();
  const scheme = state.theme === 'dark' ? 'dark' : 'light';
  const p = palette(scheme);

  return (
    <View style={[styles.root, { backgroundColor: p.background }]}>
      <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
      <RootNavigator />
    </View>
  );
}

export default function App({ initialState }: { initialState?: AppStateData }) {
  return (
    <AppStateProvider initialState={initialState}>
      <AppFrame />
    </AppStateProvider>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
});
