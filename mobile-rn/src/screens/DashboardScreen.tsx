// Caregiver dashboard — RN port of dashboard_screen.dart.
//
// Widget sections render in the user-defined order (customizable via the
// Customize sheet, which offers tap-based Move Up / Move Down as the
// drag-free alternative required by WCAG 2.5.7).

import { Fragment, useEffect, useMemo, useRef, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { AlertCard, StatCard } from '../components/Cards';
import { TapButton } from '../components/TapButton';
import {
  ALERT_APPOINTMENT_TODAY,
  ALERT_MEDS_UNTAKEN,
  ALERT_NO_CHECK_IN,
} from '../models/types';
import type { Appointment, DashboardWidget, Medication } from '../models/types';
import { useAppState } from '../state/AppState';
import { useAppTheme } from '../hooks/useAppTheme';
import { CCTokens } from '../theme/tokens';

export interface DashboardScreenProps {
  onNavigate: (tab: 'medications' | 'appointments' | 'messages') => void;
  onOpenAppointment: (appt: Appointment) => void;
  onOpenMessage: (id: string) => void;
}

export function DashboardScreen({
  onNavigate,
  onOpenAppointment,
  onOpenMessage,
}: DashboardScreenProps) {
  const { state, dispatch } = useAppState();
  const { p, scheme } = useAppTheme();
  const [customizing, setCustomizing] = useState(false);
  const [checkInFeedback, setCheckInFeedback] = useState(false);
  const feedbackTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Clear any in-flight feedback timer so it can't fire after unmount.
  useEffect(
    () => () => {
      if (feedbackTimer.current) clearTimeout(feedbackTimer.current);
    },
    [],
  );

  const meds = state.medications;
  const takenCount = meds.filter((m) => m.taken).length;
  const totalTasks = meds.length + 1;
  const doneTasks = takenCount + (state.checkedIn ? 1 : 0);
  const nextAppt = state.appointments.length > 0 ? state.appointments[0] : null;

  const enabledWidgets = useMemo(
    () =>
      state.dashboardWidgets
        .filter((w) => w.enabled)
        .slice()
        .sort((a, b) => a.order - b.order),
    [state.dashboardWidgets],
  );

  function handleCheckIn() {
    if (state.checkedIn) return;
    dispatch({ type: 'checkIn' });
    setCheckInFeedback(true);
    if (feedbackTimer.current) clearTimeout(feedbackTimer.current);
    feedbackTimer.current = setTimeout(() => setCheckInFeedback(false), 3000);
  }

  return (
    <View style={styles.root}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.bound}>
          <View style={styles.headerRow}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.title, { color: p.onSurface }]}>Dashboard</Text>
              <Text style={[styles.subtitle, { color: p.onSurfaceVariant }]}>
                Margaret&apos;s care overview
              </Text>
            </View>
            <TapButton
              label="✎"
              variant="outline"
              size="sm"
              scheme={scheme}
              onPress={() => setCustomizing(true)}
            />
          </View>

          <View style={[styles.taskBar, { backgroundColor: p.surface, borderColor: p.outline }]}>
            <Text style={{ fontSize: 26 }}>☑</Text>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 17, fontWeight: '700', color: p.onSurface }}>
                {doneTasks} of {totalTasks} tasks done
              </Text>
              <Text style={{ fontSize: 13, color: p.onSurfaceVariant }}>
                today&apos;s care plan progress
              </Text>
            </View>
          </View>
          <View
            accessibilityLabel={`${doneTasks} of ${totalTasks} tasks done`}
            style={[styles.progressTrack, { backgroundColor: p.surfaceHighest }]}
          >
            <View
              style={[
                styles.progressFill,
                {
                  backgroundColor: p.primary,
                  width: `${totalTasks > 0 ? (doneTasks / totalTasks) * 100 : 0}%`,
                },
              ]}
            />
          </View>

          {enabledWidgets.map((w) => (
            <DashboardWidgetSection
              key={w.id}
              widget={w}
              meds={meds}
              takenCount={takenCount}
              nextAppt={nextAppt}
              onNavigate={onNavigate}
              onOpenAppointment={onOpenAppointment}
              onOpenMessage={onOpenMessage}
              onCheckIn={handleCheckIn}
              checkInFeedback={checkInFeedback}
            />
          ))}
        </View>
      </ScrollView>

      <CustomizeSheet visible={customizing} onClose={() => setCustomizing(false)} />
    </View>
  );
}

function DashboardWidgetSection(props: {
  widget: DashboardWidget;
  meds: Medication[];
  takenCount: number;
  nextAppt: Appointment | null;
  onNavigate: (tab: 'medications' | 'appointments' | 'messages') => void;
  onOpenAppointment: (appt: Appointment) => void;
  onOpenMessage: (id: string) => void;
  onCheckIn: () => void;
  checkInFeedback: boolean;
}) {
  const { state, dispatch } = useAppState();
  const { p, scheme } = useAppTheme();
  const { widget, meds, takenCount, nextAppt, checkInFeedback } = props;

  switch (widget.id) {
    case 'status': {
      const checkedIn = state.checkedIn;
      return (
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: p.onSurface }]}>
            Margaret&apos;s status today
          </Text>
          <View style={styles.stack}>
            <StatCard
              icon="💊"
              label="Medications"
              value={`${takenCount} of ${meds.length}`}
              sub="taken today"
              bg={scheme === 'light' ? CCTokens.warningBgLight : CCTokens.warningBgDark}
              borderColor={scheme === 'light' ? CCTokens.warningBorderLight : CCTokens.warningBorderDark}
              scheme={scheme}
              onPress={() => props.onNavigate('medications')}
            />
            <StatCard
              icon="👤"
              label="Check-in"
              value={checkedIn ? 'Done' : 'Not yet'}
              sub={checkedIn ? 'Completed' : 'Awaiting check-in'}
              bg={
                checkedIn
                  ? scheme === 'light'
                    ? CCTokens.successBgLight
                    : CCTokens.successBgDark
                  : p.surfaceHighest
              }
              borderColor={
                checkedIn
                  ? scheme === 'light'
                    ? CCTokens.successBorderLight
                    : CCTokens.successBorderDark
                  : p.outline
              }
              scheme={scheme}
              onPress={props.onCheckIn}
            />
            <StatCard
              icon="📅"
              label="Next Appointment"
              value={nextAppt ? nextAppt.title.split('—')[0].trim() : 'None'}
              sub={nextAppt?.dateTime ?? '—'}
              bg={scheme === 'light' ? CCTokens.infoBgLight : CCTokens.infoBgDark}
              borderColor={scheme === 'light' ? CCTokens.infoBorderLight : CCTokens.infoBorderDark}
              scheme={scheme}
              onPress={() => props.onNavigate('appointments')}
            />
          </View>
          {checkInFeedback ? (
            <View
              style={[
                styles.feedback,
                {
                  backgroundColor:
                    scheme === 'light' ? CCTokens.successBgLight : CCTokens.successBgDark,
                  borderColor:
                    scheme === 'light'
                      ? CCTokens.successBorderLight
                      : CCTokens.successBorderDark,
                },
              ]}
            >
              <Text
                style={{
                  fontWeight: '600',
                  color: scheme === 'light' ? CCTokens.successTextLight : CCTokens.successTextDark,
                }}
              >
                ✓ Check-in recorded!
              </Text>
            </View>
          ) : null}
        </View>
      );
    }

    case 'alerts': {
      const untaken = meds.filter((m) => !m.taken);
      const candidates: { id: string; card: React.ReactNode }[] = [];
      if (nextAppt && nextAppt.dateTime.toLowerCase().includes('today')) {
        const timePart =
          nextAppt.dateTime.split('—').length > 1
            ? nextAppt.dateTime.split('—')[1].trim()
            : nextAppt.dateTime;
        candidates.push({
          id: ALERT_APPOINTMENT_TODAY,
          card: (
            <AlertCard
              icon="📅"
              title="Appointment today"
              body={`${nextAppt.title} at ${timePart} — ${nextAppt.location.split('—')[0].trim()}.`}
              scheme={scheme}
              onDismiss={() => dispatch({ type: 'dismissAlert', id: ALERT_APPOINTMENT_TODAY })}
            />
          ),
        });
      }
      if (untaken.length > 0) {
        candidates.push({
          id: ALERT_MEDS_UNTAKEN,
          card: (
            <AlertCard
              icon="💊"
              title={`${untaken.length} medication${untaken.length > 1 ? 's' : ''} not yet taken`}
              body={`${untaken.map((m) => `${m.name} ${m.dose}`).join(', ')} — scheduled for ${untaken[0].time}.`}
              scheme={scheme}
              onDismiss={() => dispatch({ type: 'dismissAlert', id: ALERT_MEDS_UNTAKEN })}
            />
          ),
        });
      }
      if (!state.checkedIn) {
        candidates.push({
          id: ALERT_NO_CHECK_IN,
          card: (
            <AlertCard
              icon="👤"
              title="No check-in yet"
              body="Margaret hasn't checked in this morning. Tap the Check-in card above to record it."
              scheme={scheme}
              onDismiss={() => dispatch({ type: 'dismissAlert', id: ALERT_NO_CHECK_IN })}
            />
          ),
        });
      }
      const alerts = candidates.filter((c) => !state.dismissedAlertIds.includes(c.id));
      if (alerts.length === 0) return null;
      return (
        <View style={styles.section}>
          <View style={styles.alertsHeader}>
            <Text style={{ fontSize: 18, color: p.onSurface }}>⚠️</Text>
            <Text style={[styles.sectionTitle, { color: p.onSurface }]}>Alerts</Text>
            <View style={styles.alertBadge}>
              <Text style={{ color: '#FFFFFF', fontSize: 11, fontWeight: '700' }}>
                {alerts.length}
              </Text>
            </View>
          </View>
          <View style={styles.stack}>
            {alerts.map((a) => (
              <Fragment key={a.id}>{a.card}</Fragment>
            ))}
          </View>
        </View>
      );
    }

    case 'medications':
      return (
        <View style={styles.section}>
          <View style={styles.linkHeader}>
            <Text style={[styles.sectionTitle, { color: p.onSurface, flex: 1 }]}>
              Today&apos;s medications
            </Text>
            <TapButton
              label="View all →"
              variant="ghost"
              size="sm"
              scheme={scheme}
              onPress={() => props.onNavigate('medications')}
            />
          </View>
          <View style={styles.stack}>
            {meds.slice(0, 3).map((med) => (
              <MedTile key={med.id} med={med} />
            ))}
          </View>
        </View>
      );

    case 'appointments':
      if (!nextAppt) return null;
      return (
        <View style={styles.section}>
          <View style={styles.linkHeader}>
            <Text style={[styles.sectionTitle, { color: p.onSurface, flex: 1 }]}>
              Next appointment
            </Text>
            <TapButton
              label="View all →"
              variant="ghost"
              size="sm"
              scheme={scheme}
              onPress={() => props.onNavigate('appointments')}
            />
          </View>
          <Pressable
            accessibilityRole="button"
            onPress={() => props.onOpenAppointment(nextAppt)}
            style={[styles.apptCard, { backgroundColor: p.surface, borderColor: p.outline }]}
          >
            <Text style={{ fontWeight: '700', fontSize: 16, color: p.onSurface }}>
              {nextAppt.title}
            </Text>
            <Text style={{ fontSize: 14, color: p.onSurfaceVariant }}>🕐 {nextAppt.dateTime}</Text>
            <Text style={{ fontSize: 14, color: p.onSurfaceVariant }}>📍 {nextAppt.location}</Text>
            <Text style={{ fontSize: 14, color: p.onSurfaceVariant, marginTop: 4 }}>
              {nextAppt.notes}
            </Text>
          </Pressable>
        </View>
      );

    case 'messages': {
      const unread = state.messages.filter((m) => !m.read && !m.archived);
      return (
        <View style={styles.section}>
          <View style={styles.linkHeader}>
            <Text style={[styles.sectionTitle, { color: p.onSurface, flex: 1 }]}>
              Unread messages
            </Text>
            <TapButton
              label="View all →"
              variant="ghost"
              size="sm"
              scheme={scheme}
              onPress={() => props.onNavigate('messages')}
            />
          </View>
          {unread.length === 0 ? (
            <View style={[styles.emptyInline, { backgroundColor: p.surface, borderColor: p.outline }]}>
              <Text style={{ fontSize: 14, color: p.onSurfaceVariant }}>No new messages</Text>
            </View>
          ) : (
            <View style={styles.stack}>
              {unread.slice(0, 3).map((msg) => (
                <MessageTile
                  key={msg.id}
                  messageId={msg.id}
                  onOpen={() => props.onOpenMessage(msg.id)}
                />
              ))}
            </View>
          )}
        </View>
      );
    }

    default:
      return null;
  }
}

function MedTile({ med }: { med: Medication }) {
  const { dispatch } = useAppState();
  const { p, scheme } = useAppTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${med.name}, ${med.dose}, ${med.time}`}
      accessibilityState={{
        selected: false,
        expanded: undefined,
        disabled: false,
        busy: false,
        checked: med.taken,
      }}
      onPress={() => dispatch({ type: 'toggleMedTaken', id: med.id })}
      style={[
        styles.medTile,
        {
          backgroundColor: med.taken
            ? scheme === 'light'
              ? CCTokens.successBgLight
              : CCTokens.successBgDark
            : p.surface,
          borderColor: med.taken
            ? scheme === 'light'
              ? CCTokens.successBorderLight
              : CCTokens.successBorderDark
            : p.outline,
        },
      ]}
    >
      <Text style={{ fontSize: 20, color: med.taken ? CCTokens.successTextLight : p.onSurfaceVariant }}>
        {med.taken ? '✓' : '○'}
      </Text>
      <View style={{ flex: 1 }}>
        <Text style={{ fontWeight: '600', fontSize: 14, color: p.onSurface }}>{med.name}</Text>
        <Text style={{ fontSize: 12, color: p.onSurfaceVariant }}>
          {med.dose} · {med.time}
        </Text>
      </View>
      {med.taken ? (
        <Text
          style={{
            fontSize: 12,
            fontWeight: '600',
            color: scheme === 'light' ? CCTokens.successTextLight : CCTokens.successTextDark,
          }}
        >
          Taken
        </Text>
      ) : null}
    </Pressable>
  );
}

function MessageTile({ messageId, onOpen }: { messageId: string; onOpen: () => void }) {
  const { state, dispatch } = useAppState();
  const { p } = useAppTheme();
  const message = state.messages.find((m) => m.id === messageId);
  if (!message) return null;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Unread message from ${message.from}: ${message.subject}`}
      onPress={() => {
        dispatch({ type: 'markMessageRead', id: message.id });
        onOpen();
      }}
      style={[styles.msgTile, { backgroundColor: p.surface, borderColor: p.primary }]}
    >
      <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: p.primary }} />
      <View style={{ flex: 1 }}>
        <Text style={{ fontWeight: '700', fontSize: 14, color: p.onSurface }}>{message.from}</Text>
        <Text numberOfLines={1} style={{ fontSize: 12, color: p.onSurfaceVariant }}>
          {message.subject}
        </Text>
      </View>
      <Text style={{ fontSize: 11, color: p.onSurfaceVariant }}>{message.timestamp}</Text>
    </Pressable>
  );
}

/// Customize Dashboard bottom sheet.
///
/// Accessibility: reordering works entirely with taps (Move Up / Move Down
/// buttons) — no drag gesture is required (WCAG 2.5.7 Dragging Movements).
function CustomizeSheet({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const { state, dispatch } = useAppState();
  const { p } = useAppTheme();
  // Local copy so Move Up/Down reorders feel instant; committed to the store
  // on every change, same as the Flutter version.
  const [items, setItems] = useState(() =>
    state.dashboardWidgets.slice().sort((a, b) => a.order - b.order),
  );

  function move(from: number, to: number) {
    if (to < 0 || to >= items.length) return;
    const next = items.slice();
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    setItems(next);
    dispatch({ type: 'reorderWidgets', ordered: next });
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.sheetBackdrop} onPress={onClose} accessibilityLabel="Close customize">
        <Pressable
          style={[styles.sheet, { backgroundColor: p.surface }]}
          onPress={(e) => e.stopPropagation()}
        >
          <View style={styles.sheetHeader}>
            <Text style={{ flex: 1, fontSize: 20, fontWeight: '700', color: p.onSurface }}>
              Customize Dashboard
            </Text>
            <TapButton label="Done" variant="ghost" size="sm" onPress={onClose} />
          </View>
          <Text style={{ fontSize: 13, color: p.onSurfaceVariant }}>
            Use ↑ ↓ buttons to reorder. Toggle to show or hide.
          </Text>
          <ScrollView>
            {items.map((w, i) => (
              <View key={w.id} style={styles.customRow}>
                <Text style={{ flex: 1, fontSize: 14, color: p.onSurface }}>{w.label}</Text>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`Move ${w.label} up`}
                  disabled={i === 0}
                  onPress={() => move(i, i - 1)}
                  style={styles.moveBtn}
                >
                  <Text style={{ color: i === 0 ? p.outline : p.onSurface }}>↑</Text>
                </Pressable>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`Move ${w.label} down`}
                  disabled={i === items.length - 1}
                  onPress={() => move(i, i + 1)}
                  style={styles.moveBtn}
                >
                  <Text style={{ color: i === items.length - 1 ? p.outline : p.onSurface }}>↓</Text>
                </Pressable>
                <Pressable
                  accessibilityRole="switch"
                  accessibilityLabel={`${w.label} visibility`}
                  accessibilityState={{ checked: w.enabled }}
                  onPress={() => dispatch({ type: 'toggleWidget', id: w.id })}
                  style={[styles.switchBtn, { borderColor: w.enabled ? p.primary : p.outline }]}
                >
                  <Text style={{ color: w.enabled ? p.primary : p.onSurfaceVariant }}>
                    {w.enabled ? 'On' : 'Off'}
                  </Text>
                </Pressable>
              </View>
            ))}
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { padding: 16 },
  bound: { maxWidth: 880, alignSelf: 'stretch', gap: 24 },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  title: { fontSize: 24, fontWeight: '700' },
  subtitle: { fontSize: 14 },
  taskBar: {
    borderRadius: 16,
    borderWidth: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  progressTrack: {
    height: 8,
    borderRadius: 999,
    overflow: 'hidden',
  },
  progressFill: { height: '100%', borderRadius: 999 },
  section: { gap: 12 },
  sectionTitle: { fontWeight: '700', fontSize: 16 },
  stack: { gap: 8 },
  feedback: {
    borderRadius: CCTokens.radius,
    borderWidth: 2,
    paddingHorizontal: 16,
    paddingVertical: 10,
    alignSelf: 'flex-start',
  },
  alertsHeader: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  alertBadge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#DC2626',
    alignItems: 'center',
    justifyContent: 'center',
  },
  linkHeader: { flexDirection: 'row', alignItems: 'center' },
  apptCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    gap: 4,
  },
  emptyInline: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 20,
    alignItems: 'center',
  },
  medTile: {
    minHeight: 60,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  msgTile: {
    minHeight: 60,
    borderRadius: 12,
    borderWidth: 1.5,
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  sheetBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  sheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    maxHeight: '75%',
    gap: 12,
  },
  sheetHeader: { flexDirection: 'row', alignItems: 'center' },
  customRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    gap: 4,
  },
  moveBtn: { width: 48, height: 48, alignItems: 'center', justifyContent: 'center' },
  switchBtn: {
    width: 56,
    height: 48,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
