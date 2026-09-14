// A single message row — RN port of messages_screen.dart's MessageRow.
//
// Read/unread state has its own tap target (the leading dot button), kept
// separate from the row's "open message" tap target, consistent with the
// team's "No Drag-Only Actions" constraint (WCAG 2.5.7): nothing here
// depends on a swipe gesture.

import { Pressable, StyleSheet, View } from 'react-native';
import { ScaledText as Text } from './ScaledText';
import type { Message } from '../models/types';
import { useAppState } from '../state/AppState';
import { useAppTheme } from '../hooks/useAppTheme';

export interface MessageRowProps {
  message: Message;
  onToggleRead: () => void;
  onOpen: () => void;
}

export function MessageRow({ message, onToggleRead, onOpen }: MessageRowProps) {
  const { dispatch } = useAppState();
  const { p } = useAppTheme();
  const preview = message.body.replace(/\n/g, ' ');
  const previewText = preview.length > 90 ? `${preview.slice(0, 90)}…` : preview;

  return (
    <View style={[styles.row, { backgroundColor: p.surface, borderColor: p.outline }]}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={
          message.read
            ? `Mark message from ${message.from} as unread`
            : `Mark message from ${message.from} as read`
        }
        onPress={onToggleRead}
        style={styles.dotTarget}
      >
        <View
          style={
            message.read
              ? [styles.dot, { borderWidth: 2, borderColor: p.outline }]
              : [styles.dot, { backgroundColor: p.primary }]
          }
        />
      </Pressable>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${message.read ? 'Message' : 'Unread message'} from ${message.from}: ${message.subject}`}
        onPress={() => {
          // Mirrors Flutter: opening a message marks it read, then navigates.
          if (!message.read) dispatch({ type: 'markMessageRead', id: message.id });
          onOpen();
        }}
        style={styles.content}
      >
        <View style={styles.headerLine}>
          <Text
            numberOfLines={1}
            style={{
              flex: 1,
              fontSize: 14,
              fontWeight: message.read ? '400' : '700',
              color: message.read ? p.onSurfaceVariant : p.onSurface,
            }}
          >
            {message.from}
          </Text>
          <Text style={{ fontSize: 11, color: p.onSurfaceVariant }}>{message.timestamp}</Text>
        </View>
        <Text
          numberOfLines={1}
          style={{
            fontSize: 14,
            fontWeight: message.read ? '400' : '600',
            color: message.read ? p.onSurfaceVariant : p.onSurface,
          }}
        >
          {message.subject}
        </Text>
        <Text numberOfLines={1} style={{ fontSize: 12, color: p.onSurfaceVariant }}>
          {previewText}
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    minHeight: 72,
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  dotTarget: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  content: {
    flex: 1,
    paddingVertical: 10,
    paddingRight: 8,
    gap: 2,
  },
  headerLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
});
