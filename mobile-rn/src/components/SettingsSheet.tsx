// Settings bottom-sheet — RN port of
// mobile-flutter/lib/widgets/settings_drawer.dart.
//
// One-Handed Mode is the team's assigned accessibility constraint — Left mode
// anchors navigation and key actions to the left edge for one-handed,
// left-thumb operation.

import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { palette } from '../theme/tokens';
import type { ColorScheme } from '../theme/tokens';
import { TapButton } from './TapButton';
import type { FontScale, HandMode, ThemeModeSetting } from '../models/types';
import { useAppState } from '../state/AppState';

const THEME_OPTIONS: { value: ThemeModeSetting; label: string }[] = [
  { value: 'light', label: '☀ Light' },
  { value: 'system', label: '💻 System' },
  { value: 'dark', label: '🌙 Dark' },
];

const HAND_OPTIONS: { value: HandMode; label: string }[] = [
  { value: 'off', label: '⊕ Off' },
  { value: 'left', label: '👈 Left' },
  { value: 'right', label: '👉 Right' },
];

const FONT_OPTIONS: { value: FontScale; label: string }[] = [
  { value: 'normal', label: 'Default' },
  { value: 'large', label: 'Large' },
  { value: 'xlarge', label: 'X-Large' },
];

export interface SettingsSheetProps {
  visible: boolean;
  onClose: () => void;
  onSignOut?: () => void;
}

export function SettingsSheet({ visible, onClose, onSignOut }: SettingsSheetProps) {
  const { state, dispatch } = useAppState();
  const insets = useSafeAreaInsets();
  const scheme: ColorScheme = state.theme === 'dark' ? 'dark' : 'light';
  const p = palette(scheme);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} accessibilityLabel="Close settings">
        <Pressable
          style={[styles.sheet, { backgroundColor: p.surface, paddingBottom: 24 + insets.bottom }]}
          onPress={(e) => e.stopPropagation()}
        >
          <View style={[styles.handle, { backgroundColor: p.outline }]} />
          <Text style={[styles.title, { color: p.onSurface }]}>Settings</Text>

          <Text style={[styles.sectionLabel, { color: p.onSurfaceVariant }]}>APPEARANCE</Text>
          <View style={styles.chipRow}>
            {THEME_OPTIONS.map((t) => (
              <ChoiceChip
                key={t.value}
                label={t.label}
                selected={state.theme === t.value}
                scheme={scheme}
                onPress={() => dispatch({ type: 'setTheme', theme: t.value })}
              />
            ))}
          </View>

          <Text style={[styles.sectionLabel, { color: p.onSurfaceVariant }]}>ONE-HANDED MODE</Text>
          <Text style={[styles.sectionHelp, { color: p.onSurfaceVariant }]}>
            Shifts navigation toward your thumb for comfortable single-hand use.
          </Text>
          <View style={styles.chipRow}>
            {HAND_OPTIONS.map((m) => (
              <ChoiceChip
                key={m.value}
                label={m.label}
                selected={state.handMode === m.value}
                scheme={scheme}
                onPress={() => dispatch({ type: 'setHandMode', mode: m.value })}
              />
            ))}
          </View>

          <Text style={[styles.sectionLabel, { color: p.onSurfaceVariant }]}>TEXT SIZE</Text>
          <View style={styles.chipRow}>
            {FONT_OPTIONS.map((f) => (
              <ChoiceChip
                key={f.value}
                label={f.label}
                selected={state.fontSize === f.value}
                scheme={scheme}
                onPress={() => dispatch({ type: 'setFontScale', scale: f.value })}
              />
            ))}
          </View>
          <Text style={[styles.sectionHelp, { color: p.onSurfaceVariant }]}>
            Changes text and button size across the whole app.
          </Text>

          <TapButton
            label="Sign out"
            variant="ghost"
            size="md"
            fullWidth
            scheme={scheme}
            onPress={() => {
              onClose();
              onSignOut?.();
            }}
          />
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function ChoiceChip({
  label,
  selected,
  onPress,
  scheme,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
  scheme: ColorScheme;
}) {
  const p = palette(scheme);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={[
        styles.chip,
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
          textAlign: 'center',
        }}
      >
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  sheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 8,
    gap: 10,
  },
  handle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    marginBottom: 6,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 10,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 1,
  },
  sectionHelp: {
    fontSize: 14,
    marginBottom: 2,
  },
  chipRow: {
    flexDirection: 'row',
    gap: 8,
  },
  chip: {
    flex: 1,
    minHeight: 44,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 6,
  },
});
