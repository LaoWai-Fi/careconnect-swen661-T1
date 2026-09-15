// Messages inbox — RN port of messages_screen.dart.
//
// Reuses MessageRow for each thread. The compose sheet prefills "Re: subject"
// and quotes the original body when replying. Archived messages live behind
// the archive entry point.

import { useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { ScaledText as Text } from '../components/ScaledText';
import { MessageRow } from '../components/MessageRow';
import { TapButton } from '../components/TapButton';
import { FormField, Input } from '../components/FormField';
import type { Message } from '../models/types';
import { useAppState } from '../state/AppState';
import { useAppTheme } from '../hooks/useAppTheme';

export interface MessagesScreenProps {
  onOpenMessage: (id: string) => void;
  onOpenArchive: () => void;
}

export function MessagesScreen({ onOpenMessage, onOpenArchive }: MessagesScreenProps) {
  const { state, dispatch } = useAppState();
  const { p, scheme } = useAppTheme();
  const [composing, setComposing] = useState(false);
  const [replyTo, setReplyTo] = useState<Message | null>(null);

  const active = state.messages.filter((m) => !m.archived);

  return (
    <View style={styles.root}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.bound}>
          <View style={styles.headerRow}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.title, { color: p.onSurface }]}>Messages</Text>
              <Text style={{ fontSize: 14, color: p.onSurfaceVariant }}>
                {active.filter((m) => !m.read).length} unread
              </Text>
            </View>
            {/* Stacked (New Message above Archive), matching
                messages_screen.dart's _buildScreen — two buttons side by
                side here left too little room for "Messages" next to them. */}
            <View style={styles.headerActions}>
              <TapButton
                label="✉️ New Message"
                size="sm"
                scheme={scheme}
                onPress={() => {
                  setReplyTo(null);
                  setComposing(true);
                }}
              />
              <TapButton
                label="🗄 Archive"
                variant="outline"
                size="sm"
                scheme={scheme}
                onPress={onOpenArchive}
              />
            </View>
          </View>

          {active.length === 0 ? (
            <View style={[styles.empty, { backgroundColor: p.surface, borderColor: p.outline }]}>
              <Text style={{ fontSize: 40 }}>✉️</Text>
              <Text style={{ fontWeight: '700', fontSize: 16, color: p.onSurface }}>
                No messages
              </Text>
              <Text style={{ fontSize: 13, color: p.onSurfaceVariant }}>
                New family messages will appear here.
              </Text>
            </View>
          ) : (
            <View style={styles.stack}>
              {active.map((msg) => (
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

      <ComposeSheet
        visible={composing}
        replyTo={replyTo}
        onClose={() => {
          setComposing(false);
          setReplyTo(null);
        }}
      />
    </View>
  );
}

interface ComposeDraft {
  to: string;
  subject: string;
  body: string;
}

export function ComposeSheet({
  visible,
  replyTo,
  onClose,
}: {
  visible: boolean;
  replyTo: Message | null;
  onClose: () => void;
}) {
  const { dispatch } = useAppState();
  const { p, scheme } = useAppTheme();
  const [draft, setDraft] = useState<ComposeDraft>({ to: '', subject: '', body: '' });
  const [errors, setErrors] = useState<Partial<ComposeDraft>>({});

  // Prefill when opened as a reply (mirrors showComposeSheet(replyTo: ...)).
  const effectiveTo = replyTo ? replyTo.from : draft.to;
  const effectiveSubject = replyTo ? `Re: ${replyTo.subject}` : draft.subject;

  function submit() {
    const next: Partial<ComposeDraft> = {};
    if (effectiveTo.trim().length === 0) next.to = 'Enter who should receive this.';
    if (draft.subject.trim().length === 0 && !replyTo) next.subject = 'Enter a subject.';
    if (draft.body.trim().length === 0) next.body = 'Write a short message first.';
    setErrors(next);
    if (Object.keys(next).length > 0) return;
    dispatch({
      type: 'sendMessage',
      from: 'You',
      to: effectiveTo.trim(),
      subject: effectiveSubject.trim(),
      body: draft.body.trim(),
    });
    setDraft({ to: '', subject: '', body: '' });
    onClose();
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.sheetBackdrop} onPress={onClose} accessibilityLabel="Close compose">
        <Pressable
          style={[styles.sheet, { backgroundColor: p.surface }]}
          onPress={(e) => e.stopPropagation()}
        >
          <Text style={{ fontSize: 20, fontWeight: '700', color: p.onSurface }}>
            {replyTo ? 'Reply' : 'New message'}
          </Text>
          {replyTo ? (
            <View style={[styles.quote, { borderColor: p.outline }]}>
              <Text style={{ fontSize: 12, color: p.onSurfaceVariant }}>
                {replyTo.from} wrote: {replyTo.body}
              </Text>
            </View>
          ) : null}
          <ScrollView>
            <FormField label="To" scheme={scheme} error={errors.to}>
              <Input
                value={effectiveTo}
                onChangeText={(to) => setDraft((d) => ({ ...d, to }))}
                placeholder="e.g. Sarah (daughter)"
                hasError={Boolean(errors.to)}
                scheme={scheme}
              />
            </FormField>
            {!replyTo ? (
              <FormField label="Subject" scheme={scheme} error={errors.subject}>
                <Input
                  value={draft.subject}
                  onChangeText={(subject) => setDraft((d) => ({ ...d, subject }))}
                  placeholder="e.g. Margaret's visit summary"
                  hasError={Boolean(errors.subject)}
                  scheme={scheme}
                />
              </FormField>
            ) : null}
            <FormField label="Message" scheme={scheme} error={errors.body}>
              <Input
                value={draft.body}
                onChangeText={(body) => setDraft((d) => ({ ...d, body }))}
                placeholder="Write your update…"
                multiline
                hasError={Boolean(errors.body)}
                scheme={scheme}
              />
            </FormField>
          </ScrollView>
          <View style={styles.sheetActions}>
            <TapButton label="Cancel" variant="ghost" scheme={scheme} onPress={onClose} />
            <TapButton label="Send" scheme={scheme} onPress={submit} />
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
  headerRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  headerActions: { alignItems: 'flex-end', gap: 8 },
  title: { fontSize: 24, fontWeight: '700' },
  stack: { gap: 8 },
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
  quote: {
    borderLeftWidth: 3,
    paddingLeft: 12,
    paddingVertical: 4,
  },
  sheetActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 8 },
});
