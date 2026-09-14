// Entry point registered in package.json ("main"). This is the one place the
// real app differs from what tests render (see __tests__/screens/App.test.tsx
// and src/testing/test-utils.tsx): tests mount <App> directly and supply
// their own SafeAreaProvider + initialState per-case, so those two concerns
// are wired up here instead of inside src/App.tsx, where adding them would
// double up with (and break, for SafeAreaProvider — see test-utils' comment
// on initialMetrics) the providers tests already supply.
import { AppRegistry } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import App from './src/App';
import { seededInitialState } from './src/state/seed';

function Root() {
  return (
    <SafeAreaProvider>
      <App initialState={seededInitialState()} />
    </SafeAreaProvider>
  );
}

AppRegistry.registerComponent('main', () => Root);
