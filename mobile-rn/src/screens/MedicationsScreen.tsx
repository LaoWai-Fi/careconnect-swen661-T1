// Medications list — RN port of medications_screen.dart.
//
// Includes the add-medication form sheet (client-side validation), the
// taken toggle with "✓ Taken!" feedback, and a confirmation dialog before
// deleting (destructive actions are never immediate — WCAG / usability).

import { useEffect, useRef, useState } from 'react';
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
import type { Medication } from '../models/types';
import { useAppState } from '../state/AppState';
import { useAppTheme } from '../hooks/useAppTheme';
import { CCTokens } from '../theme/tokens';

export interface MedicationsScreenProps {
  onOpenMedication: (med: Medication) => void;
}

export function MedicationsScreen({ onOpenMedication }: MedicationsScreenProps) {
  const { state, dispatch } = useAppState();
  const { p, scheme } = useAppTheme();
  const [adding, setAdding] = useState(false);
  const [takenFeedbackId, setTakenFeedbackId] = useState<string | null>(null);
  const feedbackTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Clear any in-flight feedback timer so it can't fire after unmount.
  useEffect(
    () => () => {
      if (feedbackTimer.current) clearTimeout(feedbackTimer.current);
    },
    [],
  );

  const meds = state.medications;

  function handleToggle(med: Medication) {
    dispatch({ type: 'toggleMedTaken', id: med.id });
    if (!med.taken) {
      setTakenFeedbackId(med.id);
      if (feedbackTimer.current) clearTimeout(feedbackTimer.current);
      feedbackTimer.current = setTimeout(() => setTakenFeedbackId(null), 2000);
    }
  }

  function confirmDelete(med: Medication) {
    Alert.alert(
      'Delete medication',
      `Delete ${med.name} ${med.dose}? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => dispatch({ type: 'deleteMedication', id: med.id }),
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
              <Text style={[styles.title, { color: p.onSurface }]}>Medications</Text>
              <Text style={{ fontSize: 14, color: p.onSurfaceVariant }}>
                {meds.filter((m) => m.taken).length} of {meds.length} taken today
              </Text>
            </View>
            <TapButton
              label="+ Add medication"
              scheme={scheme}
              onPress={() => setAdding(true)}
            />
          </View>

          {meds.length === 0 ? (
            <EmptyState
              icon="💊"
              title="No medications yet"
              body="Add Margaret's first medication to start tracking doses."
            />
          ) : (
            <View style={styles.stack}>
              {meds.map((med) => (
                <MedCard
                  key={med.id}
                  med={med}
                  feedback={takenFeedbackId === med.id}
                  onToggle={() => handleToggle(med)}
                  onDelete={() => confirmDelete(med)}
                  onOpen={() => onOpenMedication(med)}
                />
              ))}
            </View>
          )}
        </View>
      </ScrollView>

      <MedFormSheet visible={adding} onClose={() => setAdding(false)} />
    </View>
  );
}

function MedCard({
  med,
  feedback,
  onToggle,
  onDelete,
  onOpen,
}: {
  med: Medication;
  feedback: boolean;
  onToggle: () => void;
  onDelete: () => void;
  onOpen: () => void;
}) {
  const { p, scheme } = useAppTheme();
  return (
    <View
      style={[
        styles.card,
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
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${med.name}, ${med.dose}, ${med.time}`}
        onPress={onOpen}
        style={{ flex: 1 }}
      >
        <View style={styles.cardTop}>
          <Text style={{ fontSize: 22 }}>💊</Text>
          <View style={{ flex: 1 }}>
            <Text style={{ fontWeight: '700', fontSize: 16, color: p.onSurface }}>
              {med.name}
            </Text>
            <Text style={{ fontSize: 13, color: p.onSurfaceVariant }}>
              {med.dose} · 🕐 {med.time}
            </Text>
          </View>
          {feedback ? (
            <Text
              style={{
                fontSize: 13,
                fontWeight: '700',
                color: scheme === 'light' ? CCTokens.successTextLight : CCTokens.successTextDark,
              }}
            >
              ✓ Taken!
            </Text>
          ) : null}
        </View>
        {med.notes.length > 0 ? (
          <Text style={{ fontSize: 13, color: p.onSurfaceVariant }}>{med.notes}</Text>
        ) : null}
      </Pressable>
      <View style={styles.cardActions}>
        <TapButton
          label={med.taken ? '✓ Taken' : 'Mark as taken'}
          variant={med.taken ? 'secondary' : 'primary'}
          size="sm"
          scheme={scheme}
          onPress={onToggle}
        />
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
  name: string;
  dose: string;
  time: string;
  notes: string;
}

function MedFormSheet({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const { dispatch } = useAppState();
  const { p, scheme } = useAppTheme();
  const [draft, setDraft] = useState<FormDraft>({ name: '', dose: '', time: '', notes: '' });
  const [errors, setErrors] = useState<Partial<FormDraft>>({});

  function submit() {
    const next: Partial<FormDraft> = {};
    if (draft.name.trim().length === 0) next.name = 'Enter the medication name.';
    if (draft.dose.trim().length === 0) next.dose = 'Enter the dose, e.g. 100 mg.';
    if (draft.time.trim().length === 0) next.time = 'Enter the scheduled time.';
    setErrors(next);
    if (Object.keys(next).length > 0) return;
    dispatch({
      type: 'addMedication',
      med: {
        id: `med-${Date.now()}`,
        name: draft.name.trim(),
        dose: draft.dose.trim(),
        time: draft.time.trim(),
        notes: draft.notes.trim(),
        taken: false,
      },
    });
    setDraft({ name: '', dose: '', time: '', notes: '' });
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
            Add medication
          </Text>
          <ScrollView>
            <FormField label="Name" scheme={scheme} error={errors.name}>
              <Input
                value={draft.name}
                onChangeText={(name) => setDraft((d) => ({ ...d, name }))}
                placeholder="e.g. Metformin"
                hasError={Boolean(errors.name)}
                scheme={scheme}
              />
            </FormField>
            <FormField label="Dose" scheme={scheme} error={errors.dose}>
              <Input
                value={draft.dose}
                onChangeText={(dose) => setDraft((d) => ({ ...d, dose }))}
                placeholder="e.g. 500 mg"
                hasError={Boolean(errors.dose)}
                scheme={scheme}
              />
            </FormField>
            <FormField label="Time" scheme={scheme} error={errors.time}>
              <Input
                value={draft.time}
                onChangeText={(time) => setDraft((d) => ({ ...d, time }))}
                placeholder="e.g. 8:00 AM"
                hasError={Boolean(errors.time)}
                scheme={scheme}
              />
            </FormField>
            <FormField label="Notes (optional)" scheme={scheme}>
              <Input
                value={draft.notes}
                onChangeText={(notes) => setDraft((d) => ({ ...d, notes }))}
                placeholder="e.g. Take with food"
                scheme={scheme}
              />
            </FormField>
          </ScrollView>
          <View style={styles.sheetActions}>
            <TapButton label="Cancel" variant="ghost" scheme={scheme} onPress={onClose} />
            <TapButton label="Save medication" scheme={scheme} onPress={submit} />
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
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  cardActions: { flexDirection: 'row', gap: 8 },
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
