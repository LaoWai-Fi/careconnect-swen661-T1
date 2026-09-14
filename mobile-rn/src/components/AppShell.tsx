// App shell — RN port of app_shell.dart.
//
// Header (logo, greeting bar with date/time, settings + sign-out), bottom
// tab nav with unread badge, SOS emergency button (tel: link behind a
// confirmation dialog), and left-hand-mode anchoring that flips the header
// icon order, the SOS corner, and the tab bar cluster so primary controls
// sit under the user's thumb.

import { useMemo, useState } from 'react';
import { Modal, Pressable, StyleSheet, View } from 'react-native';
import { ScaledText as Text } from './ScaledText';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Logo } from './Cards';
import { SettingsSheet } from './SettingsSheet';
import { TapButton } from './TapButton';
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
  const insets = useSafeAreaInsets();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [sosOpen, setSosOpen] = useState(false);
  const unread = state.messages.filter((m) => !m.read && !m.archived).length;
  const leftHanded = state.handMode === 'left';
  // Bottom nav cluster alignment is genuinely 3-way (Left / Right / Off);
  // header icon order and the SOS corner only flip for Left (see
  // app_shell.dart's _Header and _buildCompact — Right and Off share the
  // same default layout there).
  const navAlign =
    state.handMode === 'left' ? 'flex-start' : state.handMode === 'right' ? 'flex-end' : 'space-evenly';

  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  }, []);

  function handleSignOut() {
    dispatch({ type: 'signOut' });
  }

  function callEmergency() {
    // tel: link — opens the dialer. expo-linking is imported lazily to keep
    // this component testable without mocking the module at import time.
    import('expo-linking').then(({ openURL }) => openURL('tel:911'));
    setSosOpen(false);
  }

  const titleBlock = (
    <View style={{ flex: 1 }}>
      <Text style={{ fontWeight: '700', fontSize: 16, color: p.onSurface }}>CareConnect</Text>
      <Text style={{ fontSize: 12, color: p.onSurfaceVariant }}>
        Viewing Margaret&apos;s care plan
      </Text>
    </View>
  );

  const headerIcons = (
    <>
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
    </>
  );

  return (
    <View style={[styles.root, { backgroundColor: p.background }]}>
      <View
        style={[
          styles.header,
          { backgroundColor: p.surface, borderBottomColor: p.outline, paddingTop: 12 + insets.top },
        ]}
      >
        {leftHanded ? (
          <>
            {headerIcons}
            {titleBlock}
            <Logo size={36} />
          </>
        ) : (
          <>
            <Logo size={36} />
            {titleBlock}
            {headerIcons}
          </>
        )}
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
        onPress={() => setSosOpen(true)}
        style={[
          styles.sos,
          {
            backgroundColor: '#DC2626',
            borderColor: '#B91C1C',
            bottom: 96 + insets.bottom,
            ...(leftHanded ? { left: 20 } : { right: 20 }),
          },
        ]}
      >
        <Text style={{ color: '#FFFFFF', fontWeight: '800', fontSize: 15 }}>SOS</Text>
      </Pressable>

      <View
        testID="tab-bar"
        style={[
          styles.tabBar,
          {
            backgroundColor: p.surface,
            borderTopColor: p.outline,
            paddingBottom: 8 + insets.bottom,
            justifyContent: navAlign,
          },
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
                numberOfLines={1}
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

      {/* SOS confirmation — RN port of app_shell.dart's _showSosDialog: a red
          header block (emergency icon, title, description) over a full-width
          destructive "SOS Emergency Call" button and a ghost "Cancel" button,
          rather than a native Alert. */}
      <Modal visible={sosOpen} transparent animationType="fade" onRequestClose={() => setSosOpen(false)}>
        <Pressable
          style={styles.sosBackdrop}
          onPress={() => setSosOpen(false)}
          accessibilityLabel="Close emergency dialog"
        >
          <Pressable
            style={[styles.sosCard, { backgroundColor: p.surface }]}
            onPress={(e) => e.stopPropagation()}
          >
            <View style={styles.sosHeader}>
              <Text style={{ fontSize: 48 }}>🚨</Text>
              <Text style={styles.sosTitle}>Emergency</Text>
              <Text style={styles.sosBody}>
                Press the button below to call emergency services immediately.
              </Text>
            </View>
            <View style={styles.sosActions}>
              <TapButton
                label="📞 SOS Emergency Call"
                variant="destructive"
                size="lg"
                fullWidth
                onPress={callEmergency}
              />
              <TapButton
                label="Cancel"
                variant="ghost"
                size="md"
                fullWidth
                onPress={() => setSosOpen(false)}
              />
            </View>
          </Pressable>
        </Pressable>
      </Modal>
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
  tabItem: {
    minWidth: 64,
    maxWidth: 78,
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
  sosBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  sosCard: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 24,
    overflow: 'hidden',
  },
  sosHeader: {
    width: '100%',
    paddingVertical: 28,
    paddingHorizontal: 24,
    backgroundColor: '#B91C1C',
    alignItems: 'center',
    gap: 10,
  },
  sosTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  sosBody: {
    fontSize: 14,
    color: '#FECACA',
    textAlign: 'center',
  },
  sosActions: {
    padding: 20,
    gap: 12,
  },
});
