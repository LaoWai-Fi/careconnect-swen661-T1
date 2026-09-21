// Labelled form field wrapper + styled text input — RN port of
// mobile-flutter/lib/widgets/form_field.dart.
//
// The label is always visible (never placeholder-only) so screen readers and
// users with cognitive load have an explicit association — WCAG 3.3.2.

import { cloneElement, isValidElement, useState } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';
import { ScaledText as Text } from './ScaledText';
import { palette, CCTokens } from '../theme/tokens';
import type { ColorScheme } from '../theme/tokens';

export interface FormFieldProps {
  label: string;
  children: React.ReactNode;
  required?: boolean;
  hint?: string;
  error?: string;
  scheme?: ColorScheme;
}

export function FormField({
  label,
  children,
  required = false,
  hint,
  error,
  scheme = 'light',
}: FormFieldProps) {
  const p = palette(scheme);
  // React Native does not automatically associate adjacent visible text with
  // a TextInput. Propagate this field's visible label and supporting message
  // to our Input so TalkBack and VoiceOver announce the same information a
  // sighted user receives (WCAG 1.3.1 and 3.3.2).
  const labelledChild = isValidElement<InputProps>(children)
    ? cloneElement(children, {
        accessibilityLabel: children.props.accessibilityLabel ?? label,
        accessibilityHint: children.props.accessibilityHint ?? error ?? hint,
      })
    : children;
  return (
    <View style={styles.field}>
      <Text style={[styles.label, { color: p.onSurface }]}>
        {label}
        {required ? <Text style={{ color: p.error }}> *</Text> : null}
      </Text>
      {labelledChild}
      {error ? (
        <Text accessibilityLiveRegion="polite" style={[styles.message, { color: p.error }]}>
          {error}
        </Text>
      ) : hint ? (
        <Text style={[styles.message, { color: p.onSurfaceVariant }]}>{hint}</Text>
      ) : null}
    </View>
  );
}

export interface InputProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  secureTextEntry?: boolean;
  multiline?: boolean;
  autoFocus?: boolean;
  hasError?: boolean;
  onSubmitEditing?: () => void;
  /** A meaningful control name, normally supplied by FormField from its
   * visible label. It must not rely on an example placeholder. */
  accessibilityLabel?: string;
  /** Guidance or the latest validation error announced after the label. */
  accessibilityHint?: string;
  scheme?: ColorScheme;
  testID?: string;
}

/** Styled text input matching the Figma `Input`: 52dp min height, 2px border,
 * 3px focus ring (rendered as a thicker primary border when focused). */
export function Input({
  value,
  onChangeText,
  placeholder,
  secureTextEntry = false,
  multiline = false,
  autoFocus = false,
  hasError = false,
  onSubmitEditing,
  accessibilityLabel,
  accessibilityHint,
  scheme = 'light',
  testID,
}: InputProps) {
  const [focused, setFocused] = useState(false);
  const p = palette(scheme);

  return (
    <TextInput
      testID={testID}
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      placeholderTextColor={p.onSurfaceVariant}
      secureTextEntry={secureTextEntry}
      multiline={multiline}
      autoFocus={autoFocus}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      onSubmitEditing={onSubmitEditing}
      accessibilityLabel={accessibilityLabel ?? placeholder ?? 'Text input'}
      accessibilityHint={accessibilityHint}
      style={[
        styles.input,
        {
          color: p.onSurface,
          backgroundColor: p.surface,
          borderColor: focused ? (hasError ? p.error : p.primary) : hasError ? p.error : p.outline,
          borderWidth: focused ? CCTokens.focusOutlineWidth : 2,
        },
      ]}
    />
  );
}

const styles = StyleSheet.create({
  field: {
    alignSelf: 'stretch',
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 6,
  },
  message: {
    fontSize: 14,
    marginTop: 4,
  },
  input: {
    minHeight: 52,
    borderRadius: CCTokens.radius,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    textAlignVertical: 'top',
  },
});
