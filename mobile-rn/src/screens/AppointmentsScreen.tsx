// Appointments list — RN port of appointments_screen.dart.
//
// ApptCard shows the assignee success chip when the appointment is
// confirmed; the form sheet validates title / date & time / location /
// assignee before adding; deletes confirm first.

import { useState } from 'react';
import {
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { TapButton } from '../components/TapButton';
import { FormField, Input } from '../components/FormField';
import type { Appointment } from '../models/types';
import { useAppState } from '../state/AppState';
import { useAppTheme } from '../hooks/useAppTheme';
import { CCTokens } from '../theme/tokens';

export interface AppointmentsScreenProps {
  onOpenAppointment: (appt: Appointment) => void;
}

export function AppointmentsScreen({ onOpenAppointment }: AppointmentsScreenProps) {
  const { state, dispatch } = useAppState();
  const { p, scheme } = useAppTheme();
  const [adding, setAdding] = useState(false);

  const appts = state.appointments;

  function confirmDelete(appt: Appointment) {
    Alert.alert(
      'Delete appointment',
      `Delete "${appt.title}"? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => dispatch({ type: 'deleteAppointment', id: appt.id }),
        },
      ],
    );
  }

  return (
    <View style={styles.root}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.bound}>
          <View style={styles.headerRow}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.title, { color: p.onSurface }]}>Appointments</Text>
              <Text style={{ fontSize: 14, color: p.onSurfaceVariant }}>
                {appts.length} upcoming
              </Text>
            </View>
            <TapButton
              label="+ Add appointment"
              scheme={scheme}
              onPress={() => setAdding(true)}
            />
          </View>

          {appts.length === 0 ? (
            <EmptyState
              icon="📅"
              title="No appointments yet"
              body="Schedule Margaret's next visit or check-up."
            />
          ) : (
            <View style={styles.stack}>
              {appts.map((appt) => (
                <ApptCard
                  key={appt.id}
                  appt={appt}
                  onOpen={() => onOpenAppointment(appt)}
                  onDelete={() => confirmDelete(appt)}
                />
              ))}
            </View>
          )}
        </View>
      </ScrollView>

      <ApptFormSheet visible={adding} onClose={() => setAdding(false)} />
    </View>
  );
}

function ApptCard({
  appt,
  onOpen,
  onDelete,
}: {
  appt: Appointment;
  onOpen: () => void;
  onDelete: () => void;
}) {
  const { p, scheme } = useAppTheme();
  return (
    <View style={[styles.card, { backgroundColor: p.surface, borderColor: p.outline }]}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${appt.title}, ${appt.dateTime}, ${appt.location}`}
        onPress={onOpen}
        style={{ gap: 4 }}
      >
        <View style={styles.cardTop}>
          <Text style={{ fontSize: 22 }}>📅</Text>
          <View style={{ flex: 1 }}>
            <Text style={{ fontWeight: '700', fontSize: 16, color: p.onSurface }}>
              {appt.title}
            </Text>
            <Text style={{ fontSize: 13, color: p.onSurfaceVariant }}>🕐 {appt.dateTime}</Text>
            <Text style={{ fontSize: 13, color: p.onSurfaceVariant }}>📍 {appt.location}</Text>
          </View>
        </View>
        {appt.notes.length > 0 ? (
          <Text style={{ fontSize: 13, color: p.onSurfaceVariant }}>{appt.notes}</Text>
        ) : null}
        {appt.assignee.length > 0 ? (
          <View
            style={[
              styles.chip,
              {
                backgroundColor:
                  scheme === 'light' ? CCTokens.successBgLight : CCTokens.successBgDark,
                borderColor:
                  scheme === 'light' ? CCTokens.successBorderLight : CCTokens.successBorderDark,
              },
            ]}
          >
            <Text
              style={{
                fontSize: 12,
                fontWeight: '700',
                color: scheme === 'light' ? CCTokens.successTextLight : CCTokens.successTextDark,
              }}
            >
              ✓ {appt.assignee} is assigned
            </Text>
          </View>
        ) : null}
      </Pressable>
      <View style={styles.cardActions}>
        <TapButton label="Delete" variant="ghost" size="sm" scheme={scheme} onPress={onDelete} />
      </View>
    </View>
  );
}

function EmptyState({ icon, title, body }: { icon: string; title: string; body: string }) {
  const { p } = useAppTheme();
  return (
    <View style={[styles.empty, { backgroundColor: p.surface, borderColor: p.outline }]}>
      <Text style={{ fontSize: 40 }}>{icon}</Text>
      <Text style={{ fontWeight: '700', fontSize: 16, color: p.onSurface }}>{title}</Text>
      <Text style={{ fontSize: 13, color: p.onSurfaceVariant, textAlign: 'center' }}>{body}</Text>
    </View>
  );
}

interface FormDraft {
  title: string;
  dateTime: string;
  location: string;
  assignee: string;
  notes: string;
}

function ApptFormSheet({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const { dispatch } = useAppState();
  const { p, scheme } = useAppTheme();
  const [draft, setDraft] = useState<FormDraft>({
    title: '',
    dateTime: '',
    location: '',
    assignee: '',
    notes: '',
  });
  const [errors, setErrors] = useState<Partial<FormDraft>>({});

  function submit() {
    const next: Partial<FormDraft> = {};
    if (draft.title.trim().length === 0) next.title = 'Enter a short title.';
    if (draft.dateTime.trim().length === 0) next.dateTime = 'Enter the date and time.';
    if (draft.location.trim().length === 0) next.location = 'Enter the location.';
    if (draft.assignee.trim().length === 0) next.assignee = 'Enter who should handle it.';
    setErrors(next);
    if (Object.keys(next).length > 0) return;
    dispatch({
      type: 'addAppointment',
      appt: {
        id: `appt-${Date.now()}`,
        title: draft.title.trim(),
        dateTime: draft.dateTime.trim(),
        location: draft.location.trim(),
        assignee: draft.assignee.trim(),
        notes: draft.notes.trim(),
      },
    });
    setDraft({ title: '', dateTime: '', location: '', assignee: '', notes: '' });
    onClose();
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.sheetBackdrop} onPress={onClose} accessibilityLabel="Close form">
        <Pressable
          style={[styles.sheet, { backgroundColor: p.surface }]}
          onPress={(e) => e.stopPropagation()}
        >
          <Text style={{ fontSize: 20, fontWeight: '700', color: p.onSurface }}>
            Add appointment
          </Text>
          <ScrollView>
            <FormField label="Title" scheme={scheme} error={errors.title}>
              <Input
                value={draft.title}
                onChangeText={(title) => setDraft((d) => ({ ...d, title }))}
                placeholder="e.g. Cardiology follow-up"
                hasError={Boolean(errors.title)}
                scheme={scheme}
              />
            </FormField>
            <FormField label="Date & time" scheme={scheme} error={errors.dateTime}>
              <Input
                value={draft.dateTime}
                onChangeText={(dateTime) => setDraft((d) => ({ ...d, dateTime }))}
                placeholder="e.g. Today — 2:30 PM"
                hasError={Boolean(errors.dateTime)}
                scheme={scheme}
              />
            </FormField>
            <FormField label="Location" scheme={scheme} error={errors.location}>
              <Input
                value={draft.location}
                onChangeText={(location) => setDraft((d) => ({ ...d, location }))}
                placeholder="e.g. Rochester General — Cardiology"
                hasError={Boolean(errors.location)}
                scheme={scheme}
              />
            </FormField>
            <FormField label="Assign to" scheme={scheme} error={errors.assignee}>
              <Input
                value={draft.assignee}
                onChangeText={(assignee) => setDraft((d) => ({ ...d, assignee }))}
                placeholder="e.g. Sarah (daughter)"
                hasError={Boolean(errors.assignee)}
                scheme={scheme}
              />
            </FormField>
            <FormField label="Notes (optional)" scheme={scheme}>
              <Input
                value={draft.notes}
                onChangeText={(notes) => setDraft((d) => ({ ...d, notes }))}
                placeholder="Extra details for the family"
                scheme={scheme}
              />
            </FormField>
          </ScrollView>
          <View style={styles.sheetActions}>
            <TapButton label="Cancel" variant="ghost" scheme={scheme} onPress={onClose} />
            <TapButton label="Save appointment" scheme={scheme} onPress={submit} />
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { padding: 16 },
  bound: { maxWidth: 880, alignSelf: 'stretch', gap: 16 },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  title: { fontSize: 24, fontWeight: '700' },
  stack: { gap: 12 },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    gap: 12,
  },
  cardTop: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  chip: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    borderWidth: 2,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  cardActions: { flexDirection: 'row', justifyContent: 'flex-end' },
  empty: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 32,
    alignItems: 'center',
    gap: 8,
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
    maxHeight: '85%',
    gap: 12,
  },
  sheetActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 8 },
});
