// CareConnect primary button — RN port of mobile-flutter/lib/widgets/tap_button.dart.
//
// Accessibility notes (mirrored from the Flutter component):
// - All sizes meet or exceed the 48dp touch-target baseline (sm 48 / md 52 /
//   lg 60 dp minimum heights) — WCAG 2.5.8 Target Size – AA.
// - Press swaps in the variant's `--*-active` token color; disabled renders at
//   40% opacity and ignores touches — §6.3.1 of the Assignment 3 library.
// - accessibilityRole="button" + accessibilityState({ disabled }) replace
//   Flutter's Semantics(button:, enabled:).

import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { palette, CCTokens } from '../theme/tokens';
import type { ColorScheme } from '../theme/tokens';

export type TapButtonVariant = 'primary' | 'outline' | 'ghost' | 'destructive' | 'secondary';
export type TapButtonSize = 'sm' | 'md' | 'lg';

export interface TapButtonProps {
  label: string;
  onPress?: () => void;
  variant?: TapButtonVariant;
  size?: TapButtonSize;
  /** Shows a leading loading spinner instead of an icon. */
  loading?: boolean;
  fullWidth?: boolean;
  /** Overrides the variant's default text color — e.g. a ghost button on a
   * colored hero background where the default would disappear. */
  foregroundColor?: string;
  /** Always draws a visible 2px border regardless of variant. */
  borderColor?: string;
  scheme?: ColorScheme;
  testID?: string;
}

const SIZES: Record<TapButtonSize, { minHeight: number; fontSize: number; paddingH: number }> = {
  sm: { minHeight: CCTokens.buttonSm, fontSize: 14, paddingH: 16 },
  md: { minHeight: CCTokens.buttonMd, fontSize: 16, paddingH: 20 },
  lg: { minHeight: CCTokens.buttonLg, fontSize: 18, paddingH: 20 },
};

export function TapButton({
  label,
  onPress,
  variant = 'primary',
  size = 'md',
  loading = false,
  fullWidth = false,
  foregroundColor,
  borderColor,
  scheme = 'light',
  testID,
}: TapButtonProps) {
  const p = palette(scheme);
  const s = SIZES[size];
  const enabled = !!onPress && !loading;

  // Rest / hover / press backgrounds from the design system's --*-hover and
  // --*-active tokens (§6.3.1). Ghost and outline share the outline-hover /
  // outline-active pair; primary/secondary/destructive each have their own.
  const restBg =
    variant === 'primary'
      ? p.primary
      : variant === 'outline'
        ? p.surface
        : variant === 'ghost'
          ? 'transparent'
          : variant === 'destructive'
            ? p.error
            : scheme === 'light'
              ? CCTokens.secondaryLight
              : CCTokens.secondaryDark;

  const activeBg =
    variant === 'primary'
      ? scheme === 'light'
        ? CCTokens.primaryActiveLight
        : CCTokens.primaryActiveDark
      : variant === 'outline' || variant === 'ghost'
        ? scheme === 'light'
          ? CCTokens.outlineActiveLight
          : CCTokens.outlineActiveDark
        : variant === 'destructive'
          ? scheme === 'light'
            ? CCTokens.destructiveActiveLight
            : CCTokens.destructiveActiveDark
          : scheme === 'light'
            ? CCTokens.secondaryActiveLight
            : CCTokens.secondaryActiveDark;

  const fg =
    foregroundColor ??
    (variant === 'primary'
      ? p.onPrimary
      : variant === 'outline' || variant === 'ghost'
        ? p.primary
        : variant === 'destructive'
          ? '#FFFFFF'
          : scheme === 'light'
            ? '#FFFFFF'
            : CCTokens.primaryForegroundDark);

  const border = borderColor ?? (variant === 'outline' ? p.primary : 'transparent');
  const borderWidth = variant === 'outline' || borderColor ? 2 : 0;

  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityState={{ disabled: !enabled }}
      disabled={!enabled}
      onPress={onPress}
      style={({ pressed: isPressed }) => [
        styles.base,
        {
          minHeight: s.minHeight,
          paddingHorizontal: s.paddingH,
          borderRadius: CCTokens.radius,
          backgroundColor: !enabled ? restBg : isPressed ? activeBg : restBg,
          borderWidth,
          borderColor: border,
          opacity: enabled ? 1 : 0.4,
          alignSelf: fullWidth ? 'stretch' : 'flex-start',
        },
      ]}
    >
      <View style={[styles.row, fullWidth && styles.rowFull]}>
        {loading ? (
          <ActivityIndicator size="small" color={fg} />
        ) : null}
        <Text
          style={{
            fontSize: s.fontSize,
            fontWeight: '600',
            color: fg,
            textAlign: 'center',
          }}
          numberOfLines={1}
        >
          {label}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    justifyContent: 'center',
    paddingVertical: 12,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  rowFull: {
    width: '100%',
  },
});
