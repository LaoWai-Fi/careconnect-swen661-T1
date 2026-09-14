// App shell — RN port of app_shell.dart.
//
// Header (logo, greeting bar with date/time, settings + sign-out), bottom
// tab nav with unread badge, SOS emergency button (tel: link behind a
// confirmation dialog), and left-hand-mode anchoring that flips the tab bar
// alignment so primary controls sit under the user's thumb.

import { useMemo, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { Logo } from './Cards';
import { SettingsSheet } from './SettingsSheet';
import type { Appointment, Medication } from '../models/types';
import { useAppState } from '../state/AppState';
import { useAppTheme } from '../hooks/useAppTheme';

export type AppTab = 'dashboard' | 'medications' | 'appointments' | 'activity' | 'messages';

export interface AppShellProps {
  tab: AppTab;
  onTabChange: (tab: AppTab) => void;
  onOpenMedication: (med: Medication) => void;
  onOpenAppointment: (appt: Appointment) => void;
  onOpenMessage: (id: string) => void;
  onOpenArchive: () => void;
  children: React.ReactNode;
}

const NAV_ITEMS: { id: AppTab; icon: string; label: string }[] = [
  { id: 'dashboard', icon: '🏠', label: 'Dashboard' },
  { id: 'medications', icon: '💊', label: 'Meds' },
  { id: 'appointments', icon: '📅', label: 'Appointments' },
  { id: 'activity', icon: '📋', label: 'Activity' },
  { id: 'messages', icon: '✉️', label: 'Messages' },
];

export function AppShell({
  tab,
  onTabChange,
  onOpenMedication,
  onOpenAppointment,
  onOpenMessage,
  onOpenArchive,
  children,
}: AppShellProps) {
  const { state, dispatch } = useAppState();
  const { p } = useAppTheme();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const unread = state.messages.filter((m) => !m.read && !m.archived).length;
  const leftHanded = state.handMode === 'left';

  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  }, []);

  function handleSignOut() {
    dispatch({ type: 'signOut' });
  }

  function handleSOS() {
    Alert.alert(
      'Emergency SOS',
      'Call 911 now? This opens the phone dialer.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Call 911',
          style: 'destructive',
          onPress: () => {
            // tel: link — opens the dialer. expo-linking is imported lazily to
            // keep this component testable without mocking the module at
            // import time.
            import('expo-linking').then(({ openURL }) => openURL('tel:911'));
          },
        },
      ],
    );
  }

  return (
    <View style={[styles.root, { backgroundColor: p.background }]}>
      <View style={[styles.header, { backgroundColor: p.surface, borderBottomColor: p.outline }]}>
        <Logo size={36} />
        <View style={{ flex: 1 }}>
          <Text style={{ fontWeight: '700', fontSize: 16, color: p.onSurface }}>CareConnect</Text>
          <Text style={{ fontSize: 12, color: p.onSurfaceVariant }}>
            Viewing Margaret&apos;s care plan
          </Text>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Settings"
          onPress={() => setSettingsOpen(true)}
          style={styles.iconBtn}
        >
          <Text style={{ fontSize: 20 }}>⚙️</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Sign out"
          onPress={handleSignOut}
          style={styles.iconBtn}
        >
          <Text style={{ fontSize: 20 }}>🚪</Text>
        </Pressable>
      </View>

      <View style={[styles.greetingBar, { backgroundColor: p.surfaceHighest }]}>
        <Text style={{ fontSize: 13, color: p.onSurfaceVariant }}>
          {greeting}, {state.userName} · {new Date().toLocaleDateString(undefined, {
            weekday: 'long',
            month: 'long',
            day: 'numeric',
          })}
        </Text>
      </View>

      <View style={styles.body}>{children}</View>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Emergency SOS — call 911"
        onPress={handleSOS}
        style={[styles.sos, { backgroundColor: '#DC2626', borderColor: '#B91C1C' }]}
      >
        <Text style={{ color: '#FFFFFF', fontWeight: '800', fontSize: 15 }}>SOS</Text>
      </Pressable>

      <View
        style={[
          styles.tabBar,
          { backgroundColor: p.surface, borderTopColor: p.outline },
          leftHanded && styles.tabBarLeft,
        ]}
      >
        {NAV_ITEMS.map((item) => {
          const selected = tab === item.id;
          return (
            <Pressable
              key={item.id}
              accessibilityRole="tab"
              accessibilityState={{ selected }}
              accessibilityLabel={item.label}
              onPress={() => onTabChange(item.id)}
              style={styles.tabItem}
            >
              <Text style={{ fontSize: 20 }}>{item.icon}</Text>
              <Text
                style={{
                  fontSize: 11,
                  fontWeight: selected ? '700' : '500',
                  color: selected ? p.primary : p.onSurfaceVariant,
                }}
              >
                {item.label}
              </Text>
              {item.id === 'messages' && unread > 0 ? (
                <View style={styles.badge}>
                  <Text style={{ color: '#FFFFFF', fontSize: 10, fontWeight: '700' }}>{unread}</Text>
                </View>
              ) : null}
            </Pressable>
          );
        })}
      </View>

      <SettingsSheet
        visible={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        onSignOut={handleSignOut}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 10,
    borderBottomWidth: 1,
  },
  greetingBar: { paddingHorizontal: 16, paddingVertical: 6 },
  body: { flex: 1 },
  iconBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  sos: {
    position: 'absolute',
    right: 20,
    bottom: 96,
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 3,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
  },
  tabBar: {
    flexDirection: 'row',
    borderTopWidth: 1,
    paddingBottom: 8,
    paddingTop: 6,
  },
  tabBarLeft: {
    flexDirection: 'row-reverse',
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
    minHeight: 48,
    justifyContent: 'center',
  },
  badge: {
    position: 'absolute',
    top: 2,
    right: '38%',
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#DC2626',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
});
