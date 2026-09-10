// CareConnect cards — RN port of mobile-flutter/lib/widgets/cards.dart.

import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { palette, CCTokens } from '../theme/tokens';
import type { ColorScheme } from '../theme/tokens';

/** CareConnect logo — rounded teal square with a white heart glyph. The
 * Flutter version paints the heart with a CustomPainter; here a text glyph
 * keeps it dependency-free and testable. */
export function Logo({ size = 36, testID }: { size?: number; testID?: string }) {
  return (
    <View
      testID={testID}
      accessibilityLabel="CareConnect logo"
      style={[
        styles.logo,
        {
          width: size,
          height: size,
          borderRadius: size * 0.22,
          backgroundColor: CCTokens.primaryLight,
        },
      ]}
    >
      <Text style={{ fontSize: size * 0.55, lineHeight: size * 0.6, color: '#FFFFFF' }}>♥</Text>
    </View>
  );
}

export interface StatCardProps {
  icon: string;
  label: string;
  value: string;
  sub: string;
  bg: string;
  borderColor: string;
  onPress?: () => void;
  scheme?: ColorScheme;
  testID?: string;
}

/** Status card used on the Dashboard — icon + label + value + sub, tappable. */
export function StatCard({
  icon,
  label,
  value,
  sub,
  bg,
  borderColor,
  onPress,
  scheme = 'light',
  testID,
}: StatCardProps) {
  const p = palette(scheme);
  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={`${label} ${value}`}
      onPress={onPress}
      disabled={!onPress}
      style={[
        styles.statCard,
        { backgroundColor: bg, borderColor },
      ]}
    >
      <View style={styles.statHeader}>
        <Text style={[styles.statIcon, { color: p.onSurfaceVariant }]}>{icon}</Text>
        <Text style={[styles.statLabel, { color: p.onSurfaceVariant }]} numberOfLines={1}>
          {label.toUpperCase()}
        </Text>
      </View>
      <Text style={[styles.statValue, { color: p.onSurface }]}>{value}</Text>
      <Text style={[styles.statSub, { color: p.onSurfaceVariant }]}>{sub}</Text>
    </Pressable>
  );
}

export interface AlertCardProps {
  icon: string;
  title: string;
  body: string;
  onDismiss: () => void;
  scheme?: ColorScheme;
  testID?: string;
}

/** Dismissible warning alert card (Dashboard "Alerts" section). Whether a
 * given alert is dismissed lives in AppState.dismissedAlertIds, not here —
 * same rationale as the Flutter version. */
export function AlertCard({
  icon,
  title,
  body,
  onDismiss,
  scheme = 'light',
  testID,
}: AlertCardProps) {
  const p = palette(scheme);
  return (
    <View
      testID={testID}
      style={[
        styles.alertCard,
        {
          backgroundColor:
            scheme === 'light' ? CCTokens.warningBgLight : CCTokens.warningBgDark,
          borderColor:
            scheme === 'light' ? CCTokens.warningBorderLight : CCTokens.warningBorderDark,
        },
      ]}
    >
      <Text style={[styles.alertIcon, { color: p.onSurface }]}>{icon}</Text>
      <View style={styles.alertBody}>
        <Text style={[styles.alertTitle, { color: p.onSurface }]}>{title}</Text>
        <Text style={[styles.alertText, { color: p.onSurfaceVariant }]}>{body}</Text>
      </View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Dismiss alert"
        onPress={onDismiss}
        style={styles.alertDismiss}
      >
        <Text style={{ color: p.onSurface, fontSize: 18 }}>✕</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  logo: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  statCard: {
    borderRadius: 16,
    borderWidth: 2,
    padding: 16,
    alignSelf: 'stretch',
  },
  statHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statIcon: {
    fontSize: 14,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
    flexShrink: 1,
  },
  statValue: {
    fontSize: 22,
    fontWeight: '700',
    marginTop: 4,
  },
  statSub: {
    fontSize: 12,
  },
  alertCard: {
    borderRadius: CCTokens.radius,
    borderWidth: 2,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  alertIcon: {
    fontSize: 20,
  },
  alertBody: {
    flex: 1,
  },
  alertTitle: {
    fontWeight: '600',
    fontSize: 16,
  },
  alertText: {
    fontSize: 14,
    marginTop: 2,
  },
  alertDismiss: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
