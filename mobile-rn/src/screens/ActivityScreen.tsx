// Activity log — RN port of activity_screen.dart.
//
// Filter pills (All + the four event types) and a refresh button that
// re-checks for new activity. Tiles are color-coded per event type.

import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import type { ActivityEntry, ActivityType } from '../models/types';
import { useAppState } from '../state/AppState';
import { useAppTheme } from '../hooks/useAppTheme';
import { CCTokens } from '../theme/tokens';

type Filter = 'all' | ActivityType;

const FILTERS: { id: Filter; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'medicationTaken', label: 'Medication' },
  { id: 'taskCompleted', label: 'Tasks' },
  { id: 'checkedIn', label: 'Check-in' },
];

export function ActivityScreen() {
  const { state } = useAppState();
  const { p } = useAppTheme();
  const [filter, setFilter] = useState<Filter>('all');
  const [refreshedAt, setRefreshedAt] = useState<string | null>(null);

  const events =
    filter === 'all' ? state.activity : state.activity.filter((e) => e.type === filter);

  function refresh() {
    // The Flutter version logs "checked for new activity" with a timestamp;
    // here we surface it in the UI instead of console-only.
    setRefreshedAt(new Date().toLocaleTimeString());
  }

  return (
    <View style={styles.root}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.bound}>
          <View style={styles.headerRow}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.title, { color: p.onSurface }]}>Activity</Text>
              <Text style={{ fontSize: 14, color: p.onSurfaceVariant }}>
                Recent care events for Margaret
              </Text>
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Refresh activity"
              onPress={refresh}
              style={[styles.refreshBtn, { borderColor: p.outline }]}
            >
              <Text style={{ fontSize: 16, color: p.onSurface }}>↻</Text>
            </Pressable>
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.pills}>
            {FILTERS.map((f) => {
              const selected = filter === f.id;
              return (
                <Pressable
                  key={f.id}
                  accessibilityRole="tab"
                  accessibilityState={{ selected }}
                  onPress={() => setFilter(f.id)}
                  style={[
                    styles.pill,
                    {
                      backgroundColor: selected ? p.primary : p.surface,
                      borderColor: selected ? p.primary : p.outline,
                    },
                  ]}
                >
                  <Text
                    style={{
                      fontSize: 13,
                      fontWeight: '600',
                      color: selected ? p.onPrimary : p.onSurfaceVariant,
                    }}
                  >
                    {f.label}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>

          {refreshedAt ? (
            <Text style={{ fontSize: 12, color: p.onSurfaceVariant }}>
              Checked for new activity at {refreshedAt}
            </Text>
          ) : null}

          {events.length === 0 ? (
            <View style={[styles.empty, { backgroundColor: p.surface, borderColor: p.outline }]}>
              <Text style={{ fontSize: 40 }}>📋</Text>
              <Text style={{ fontWeight: '700', fontSize: 16, color: p.onSurface }}>
                No activity yet
              </Text>
              <Text style={{ fontSize: 13, color: p.onSurfaceVariant }}>
                Events will appear as the family records care.
              </Text>
            </View>
          ) : (
            <View style={styles.stack}>
              {events.map((event) => (
                <ActivityTile key={event.id} event={event} />
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

function ActivityTile({ event }: { event: ActivityEntry }) {
  const { p, scheme } = useAppTheme();
  const meta = ACTIVITY_META[event.type];
  return (
    <View style={[styles.tile, { backgroundColor: p.surface, borderColor: p.outline }]}>
      <View style={[styles.tileIcon, { backgroundColor: meta.bg(scheme) }]}>
        <Text style={{ fontSize: 18 }}>{meta.icon}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ fontWeight: '600', fontSize: 14, color: p.onSurface }}>
          {event.description}
        </Text>
        <Text style={{ fontSize: 12, color: p.onSurfaceVariant }}>
          {meta.label} · {event.timestamp}
        </Text>
      </View>
    </View>
  );
}

const ACTIVITY_META: Record<ActivityType, { icon: string; label: string; bg: (scheme: 'light' | 'dark') => string }> = {
  medicationTaken: {
    icon: '💊',
    label: 'Medication',
    bg: (s) => (s === 'light' ? CCTokens.warningBgLight : CCTokens.warningBgDark),
  },
  medicationUnmarked: {
    icon: '💊',
    label: 'Medication',
    bg: (s) => (s === 'light' ? CCTokens.warningBgLight : CCTokens.warningBgDark),
  },
  taskCompleted: {
    icon: '☑',
    label: 'Task',
    bg: (s) => (s === 'light' ? CCTokens.infoBgLight : CCTokens.infoBgDark),
  },
  checkedIn: {
    icon: '👤',
    label: 'Check-in',
    bg: (s) => (s === 'light' ? CCTokens.successBgLight : CCTokens.successBgDark),
  },
};

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  root: { flex: 1 },
  scroll: { padding: 16 },
  bound: { maxWidth: 880, alignSelf: 'stretch', gap: 16 },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  title: { fontSize: 24, fontWeight: '700' },
  refreshBtn: {
    width: 48,
    height: 48,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pills: { gap: 8 },
  pill: {
    borderRadius: 999,
    borderWidth: 1.5,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  stack: { gap: 8 },
  empty: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 32,
    alignItems: 'center',
    gap: 8,
  },
  tile: {
    minHeight: 60,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  tileIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
