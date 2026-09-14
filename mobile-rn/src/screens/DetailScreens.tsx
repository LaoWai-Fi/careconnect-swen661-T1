// Detail screens — RN ports of medication_detail_screen.dart,
// appointment_detail_screen.dart, message_detail_screen.dart, and
// archived_messages_screen.dart.
//
// Each detail screen guards against a stale item (deleted while open) by
// popping back. Message detail offers Reply / Archive / Unarchive / Delete.

import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useState } from 'react';
import { TapButton } from '../components/TapButton';
import { MessageRow } from '../components/MessageRow';
import { ComposeSheet } from './MessagesScreen';
import { useAppState } from '../state/AppState';
import { useAppTheme } from '../hooks/useAppTheme';
import { CCTokens } from '../theme/tokens';

export interface MedicationDetailScreenProps {
  medicationId: string;
  onBack: () => void;
}

export function MedicationDetailScreen({
  medicationId,
  onBack,
}: MedicationDetailScreenProps) {
  const { state, dispatch } = useAppState();
  const { p, scheme } = useAppTheme();
  const med = state.medications.find((m) => m.id === medicationId);

  if (!med) {
    // Stale item (deleted elsewhere) — pop back rather than render a blank page.
    onBack();
    return null;
  }

  return (
    <View style={[styles.root, { backgroundColor: p.background }]}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.bound}>
          <TapButton label="← Back" variant="ghost" scheme={scheme} onPress={onBack} />
          <View style={[styles.card, { backgroundColor: p.surface, borderColor: p.outline }]}>
            <Text style={{ fontSize: 36 }}>💊</Text>
            <Text style={[styles.title, { color: p.onSurface }]}>{med.name}</Text>
            <Row label="Dose" value={med.dose} />
            <Row label="Time" value={med.time} />
            <Row label="Notes" value={med.notes.length > 0 ? med.notes : '—'} />
            <Row
              label="Status"
              value={med.taken ? '✓ Taken today' : 'Not taken yet'}
              valueColor={
                med.taken
                  ? scheme === 'light'
                    ? CCTokens.successTextLight
                    : CCTokens.successTextDark
                  : undefined
              }
            />
          </View>
          <TapButton
            label={med.taken ? '✓ Taken' : 'Mark as taken'}
            variant={med.taken ? 'secondary' : 'primary'}
            size="lg"
            fullWidth
            scheme={scheme}
            onPress={() => dispatch({ type: 'toggleMedTaken', id: med.id })}
          />
        </View>
      </ScrollView>
    </View>
  );
}

export interface AppointmentDetailScreenProps {
  appointmentId: string;
  onBack: () => void;
}

export function AppointmentDetailScreen({
  appointmentId,
  onBack,
}: AppointmentDetailScreenProps) {
  const { state } = useAppState();
  const { p, scheme } = useAppTheme();
  const appt = state.appointments.find((a) => a.id === appointmentId);

  if (!appt) {
    onBack();
    return null;
  }

  return (
    <View style={[styles.root, { backgroundColor: p.background }]}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.bound}>
          <TapButton label="← Back" variant="ghost" scheme={scheme} onPress={onBack} />
          <View style={[styles.card, { backgroundColor: p.surface, borderColor: p.outline }]}>
            <Text style={{ fontSize: 36 }}>📅</Text>
            <Text style={[styles.title, { color: p.onSurface }]}>{appt.title}</Text>
            <Row label="When" value={appt.dateTime} />
            <Row label="Where" value={appt.location} />
            <Row label="Assignee" value={appt.assignee.length > 0 ? appt.assignee : '—'} />
            <Row label="Notes" value={appt.notes.length > 0 ? appt.notes : '—'} />
          </View>
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
                  fontWeight: '700',
                  color: scheme === 'light' ? CCTokens.successTextLight : CCTokens.successTextDark,
                }}
              >
                ✓ {appt.assignee} is assigned
              </Text>
            </View>
          ) : null}
        </View>
      </ScrollView>
    </View>
  );
}

export interface MessageDetailScreenProps {
  messageId: string;
  onBack: () => void;
}

export function MessageDetailScreen({ messageId, onBack }: MessageDetailScreenProps) {
  const { state, dispatch } = useAppState();
  const { p, scheme } = useAppTheme();
  const [replying, setReplying] = useState(false);
  const message = state.messages.find((m) => m.id === messageId);

  if (!message) {
    onBack();
    return null;
  }

  function confirmDelete() {
    Alert.alert(
      'Delete message',
      `Delete "${message!.subject}"? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            dispatch({ type: 'deleteMessage', id: message!.id });
            onBack();
          },
        },
      ],
    );
  }

  return (
    <View style={[styles.root, { backgroundColor: p.background }]}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.bound}>
          <TapButton label="← Back" variant="ghost" scheme={scheme} onPress={onBack} />
          <View style={[styles.card, { backgroundColor: p.surface, borderColor: p.outline }]}>
            <Text style={[styles.title, { color: p.onSurface }]}>{message.subject}</Text>
            <Row label="From" value={message.from} />
            <Row label="To" value={message.to} />
            <Row label="Date" value={message.timestamp} />
            <View style={{ height: 12 }} />
            <Text style={{ fontSize: 15, lineHeight: 22, color: p.onSurface }}>
              {message.body}
            </Text>
          </View>

          <TapButton
            label={message.read ? 'Mark as unread' : 'Mark as read'}
            variant="outline"
            scheme={scheme}
            onPress={() => dispatch({ type: 'toggleMessageRead', id: message.id })}
          />
          <TapButton
            label="↩ Reply"
            scheme={scheme}
            onPress={() => setReplying(true)}
          />
          {message.archived ? (
            <TapButton
              label="Unarchive"
              variant="outline"
              scheme={scheme}
              onPress={() => dispatch({ type: 'unarchiveMessage', id: message.id })}
            />
          ) : (
            <TapButton
              label="🗄 Archive"
              variant="outline"
              scheme={scheme}
              onPress={() => dispatch({ type: 'archiveMessage', id: message.id })}
            />
          )}
          <TapButton
            label="Delete"
            variant="destructive"
            scheme={scheme}
            onPress={confirmDelete}
          />
        </View>
      </ScrollView>

      <ComposeSheet visible={replying} replyTo={message} onClose={() => setReplying(false)} />
    </View>
  );
}

export interface ArchivedMessagesScreenProps {
  onOpenMessage: (id: string) => void;
  onBack: () => void;
}

export function ArchivedMessagesScreen({
  onOpenMessage,
  onBack,
}: ArchivedMessagesScreenProps) {
  const { state, dispatch } = useAppState();
  const { p, scheme } = useAppTheme();
  const archived = state.messages.filter((m) => m.archived);

  return (
    <View style={[styles.root, { backgroundColor: p.background }]}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.bound}>
          <TapButton label="← Back to messages" variant="ghost" scheme={scheme} onPress={onBack} />
          <Text style={[styles.title, { color: p.onSurface }]}>Archived messages</Text>
          {archived.length === 0 ? (
            <View style={[styles.empty, { backgroundColor: p.surface, borderColor: p.outline }]}>
              <Text style={{ fontSize: 40 }}>🗄</Text>
              <Text style={{ fontWeight: '700', fontSize: 16, color: p.onSurface }}>
                Nothing archived
              </Text>
              <Text style={{ fontSize: 13, color: p.onSurfaceVariant }}>
                Archived conversations will appear here.
              </Text>
            </View>
          ) : (
            <View style={{ gap: 8 }}>
              {archived.map((msg) => (
                <MessageRow
                  key={msg.id}
                  message={msg}
                  onToggleRead={() => dispatch({ type: 'toggleMessageRead', id: msg.id })}
                  onOpen={() => onOpenMessage(msg.id)}
                />
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

function Row({ label, value, valueColor }: { label: string; value: string; valueColor?: string }) {
  const { p } = useAppTheme();
  return (
    <View style={styles.row}>
      <Text style={{ width: 90, fontSize: 13, color: p.onSurfaceVariant }}>{label}</Text>
      <Text style={{ flex: 1, fontSize: 14, color: valueColor ?? p.onSurface }}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { padding: 16 },
  bound: { maxWidth: 720, alignSelf: 'stretch', gap: 12 },
  title: { fontSize: 22, fontWeight: '700' },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 20,
    gap: 8,
  },
  chip: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    borderWidth: 2,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  empty: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 32,
    alignItems: 'center',
    gap: 8,
  },
  row: { flexDirection: 'row', gap: 12 },
});
