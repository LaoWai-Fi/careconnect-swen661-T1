// Root navigator — React Navigation wiring for the whole app.
//
// Structure (mirrors the Flutter app's named routes):
//   RootStack (native stack)
//     landing / signin / signup          — auth flow
//     main                               — AppShell + nested tab navigator
//       dashboard / medications / appointments / activity / messages
//     medicationDetail / appointmentDetail / messageDetail / archivedMessages
//
// Screens stay pure prop-driven components; the wrappers below adapt
// navigation/route props to those component props, so every screen remains
// unit-testable without a navigator in the tree (see __tests__/screens).

import {
  DarkTheme,
  DefaultTheme,
  NavigationContainer,
  useNavigation,
} from '@react-navigation/native';
import type { NavigationProp } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View } from 'react-native';
import { AppShell, type AppTab } from '../components/AppShell';
import type { Appointment, Medication } from '../models/types';
import { ActivityScreen } from '../screens/ActivityScreen';
import { AppointmentsScreen } from '../screens/AppointmentsScreen';
import { SignInScreen, SignUpScreen } from '../screens/AuthScreens';
import { DashboardScreen } from '../screens/DashboardScreen';
import {
  AppointmentDetailScreen,
  ArchivedMessagesScreen,
  MedicationDetailScreen,
  MessageDetailScreen,
} from '../screens/DetailScreens';
import { LandingScreen } from '../screens/LandingScreen';
import { MedicationsScreen } from '../screens/MedicationsScreen';
import { MessagesScreen } from '../screens/MessagesScreen';
import { useAppState } from '../state/AppState';
import { palette } from '../theme/tokens';
import type { MainTabsParamList, RootStackParamList } from './types';

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tabs = createBottomTabNavigator<MainTabsParamList>();

/** Watches auth state and resets the stack the way the Flutter app used
 * Navigator.pushReplacementNamed: signing in leaves the auth flow, signing
 * out returns to landing. Rendered inside NavigationContainer so it can use
 * useNavigation. */
function AuthGate({ ready }: { ready: boolean }) {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const { state } = useAppState();
  const signedIn = state.userName.length > 0;

  useEffect(() => {
    // AuthGate is a plain child of NavigationContainer, not a registered
    // screen, so useNavigation() resolves to the container ref rather than a
    // screen-scoped navigation prop. That ref isn't attached until
    // NavigationContainer's onReady fires, and calling .getState()/.reset()
    // on it before then just logs "hasn't been initialized yet" and no-ops.
    // Skip until the parent tells us the container is ready.
    if (!ready) return;
    const navState = navigation.getState();
    const current = navState?.routes[navState.index ?? 0]?.name;
    if (signedIn && (current === 'landing' || current === 'signin' || current === 'signup')) {
      navigation.reset({ index: 0, routes: [{ name: 'main' }] });
    } else if (!signedIn && current !== 'landing') {
      navigation.reset({ index: 0, routes: [{ name: 'landing' }] });
    }
  }, [ready, signedIn, navigation]);

  return null;
}

/** The signed-in shell: AppShell chrome (header, SOS, custom tab bar) around
 * a bottom-tabs navigator that owns which tab is showing. The default tab bar
 * is hidden — AppShell renders its own, driven through onTabChange. */
function MainScreen() {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const [tab, setTab] = useState<AppTab>('dashboard');

  function goTab(next: AppTab) {
    setTab(next);
    // Navigate the nested tab navigator through the root stack:
    // navigate('main', { screen: <tab> }) focuses the shell then the tab.
    navigation.navigate('main', { screen: next });
  }

  return (
    <AppShell
      tab={tab}
      onTabChange={goTab}
      onOpenMedication={(med: Medication) =>
        navigation.navigate('medicationDetail', { id: med.id })
      }
      onOpenAppointment={(appt: Appointment) =>
        navigation.navigate('appointmentDetail', { id: appt.id })
      }
      onOpenMessage={(id: string) => navigation.navigate('messageDetail', { id })}
      onOpenArchive={() => navigation.navigate('archivedMessages')}
    >
      <Tabs.Navigator
        screenOptions={{ headerShown: false }}
        tabBar={() => null}
        initialRouteName="dashboard"
      >
        <Tabs.Screen name="dashboard">
          {() => (
            <DashboardScreen
              onNavigate={goTab}
              onOpenAppointment={(appt) =>
                navigation.navigate('appointmentDetail', { id: appt.id })
              }
              onOpenMessage={(id) => navigation.navigate('messageDetail', { id })}
            />
          )}
        </Tabs.Screen>
        <Tabs.Screen name="medications">
          {() => (
            <MedicationsScreen
              onOpenMedication={(med) => navigation.navigate('medicationDetail', { id: med.id })}
            />
          )}
        </Tabs.Screen>
        <Tabs.Screen name="appointments">
          {() => (
            <AppointmentsScreen
              onOpenAppointment={(appt) =>
                navigation.navigate('appointmentDetail', { id: appt.id })
              }
            />
          )}
        </Tabs.Screen>
        <Tabs.Screen name="activity">{() => <ActivityScreen />}</Tabs.Screen>
        <Tabs.Screen name="messages">
          {() => (
            <MessagesScreen
              onOpenMessage={(id) => navigation.navigate('messageDetail', { id })}
              onOpenArchive={() => navigation.navigate('archivedMessages')}
            />
          )}
        </Tabs.Screen>
      </Tabs.Navigator>
    </AppShell>
  );
}

export function RootNavigator() {
  const { state } = useAppState();
  const signedIn = state.userName.length > 0;
  const scheme = state.theme === 'dark' ? 'dark' : 'light';
  const p = palette(scheme);
  const [navReady, setNavReady] = useState(false);

  return (
    <View style={[styles.root, { backgroundColor: p.background }]}>
      <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
      <NavigationContainer
        theme={scheme === 'dark' ? DarkTheme : DefaultTheme}
        documentTitle={{ enabled: false }}
        onReady={() => setNavReady(true)}
      >
        <AuthGate ready={navReady} />
        <Stack.Navigator
          initialRouteName={signedIn ? 'main' : 'landing'}
          screenOptions={{ headerShown: false }}
        >
          <Stack.Screen name="landing">
            {({ navigation }) => (
              <LandingScreen
                onGetStarted={() => navigation.navigate('signup')}
                onSignIn={() => navigation.navigate('signin')}
              />
            )}
          </Stack.Screen>
          <Stack.Screen name="signin">
            {({ navigation }) => <SignInScreen onBack={() => navigation.goBack()} />}
          </Stack.Screen>
          <Stack.Screen name="signup">
            {({ navigation }) => <SignUpScreen onBack={() => navigation.goBack()} />}
          </Stack.Screen>
          <Stack.Screen name="main" options={{ gestureEnabled: false }}>
            {() => <MainScreen />}
          </Stack.Screen>
          <Stack.Screen name="medicationDetail">
            {({ route, navigation }) => (
              <MedicationDetailScreen
                medicationId={route.params.id}
                onBack={() => navigation.goBack()}
              />
            )}
          </Stack.Screen>
          <Stack.Screen name="appointmentDetail">
            {({ route, navigation }) => (
              <AppointmentDetailScreen
                appointmentId={route.params.id}
                onBack={() => navigation.goBack()}
              />
            )}
          </Stack.Screen>
          <Stack.Screen name="messageDetail">
            {({ route, navigation }) => (
              <MessageDetailScreen messageId={route.params.id} onBack={() => navigation.goBack()} />
            )}
          </Stack.Screen>
          <Stack.Screen name="archivedMessages">
            {({ navigation }) => (
              <ArchivedMessagesScreen
                onOpenMessage={(id) => navigation.navigate('messageDetail', { id })}
                onBack={() => navigation.goBack()}
              />
            )}
          </Stack.Screen>
        </Stack.Navigator>
      </NavigationContainer>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
});
