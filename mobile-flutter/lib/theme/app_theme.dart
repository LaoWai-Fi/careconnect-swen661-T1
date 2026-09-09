import 'package:flutter/material.dart';

import 'tokens.dart';

/// Builds the CareConnect light and dark themes from the Figma design tokens.
///
/// The type scale mirrors the Figma `.type-*` classes (Assignment 3 §6.2):
///   h1 32/800 lh1.2 ls-0.02em, h2 24/700 lh1.25, h3 20/700 lh1.3,
///   h4 18/600 lh1.35, h5 16/600 lh1.4, label 12/600 uppercase ls0.06em,
///   body 16/400 lh1.6, body-sm 14/400 lh1.5, caption 12/500 lh1.4.
abstract final class CCTheme {
  static const String fontFamily = 'Inter';

  static ThemeData light() => _build(brightness: Brightness.light);
  static ThemeData dark() => _build(brightness: Brightness.dark);

  /// The CareConnect type scale as a standalone [TextTheme], so screens can
  /// use `Theme.of(context).textTheme` (or `CCTheme.textTheme(context)`)
  /// instead of hand-rolled ad-hoc `TextStyle`s that drift from the system.
  ///
  /// Colors are applied per-brightness by [_build]; this returns the raw
  /// scale with no color, matching how Figma defines the sizes/weights.
  static TextTheme get textScale => const TextTheme(
    // H1 — page-level title, one per screen at most.
    displaySmall: TextStyle(
      fontSize: 32,
      fontWeight: FontWeight.w800,
      height: 1.2,
      letterSpacing: -0.64,
    ),
    // H2 — screen heading inside the app shell ("Dashboard", "Manage
    // medications").
    headlineMedium: TextStyle(
      fontSize: 24,
      fontWeight: FontWeight.w700,
      height: 1.25,
    ),
    // H3 — card / section title, dialog heading.
    titleLarge: TextStyle(fontSize: 20, fontWeight: FontWeight.w700, height: 1.3),
    // H4 — sub-section heading within a card or panel.
    titleMedium: TextStyle(
      fontSize: 18,
      fontWeight: FontWeight.w600,
      height: 1.35,
    ),
    // H5 — minor heading / emphasized list header.
    titleSmall: TextStyle(fontSize: 16, fontWeight: FontWeight.w600, height: 1.4),
    // Body — default paragraph / UI text (16px / 1.6 line-height minimum).
    bodyMedium: TextStyle(fontSize: 16, fontWeight: FontWeight.w400, height: 1.6),
    // Body – Emphasized.
    bodyLarge: TextStyle(fontSize: 16, fontWeight: FontWeight.w600, height: 1.6),
    // Body – Small — secondary/supporting text.
    bodySmall: TextStyle(fontSize: 14, fontWeight: FontWeight.w400, height: 1.5),
    // Caption — timestamps, fine print, helper captions.
    labelSmall: TextStyle(fontSize: 12, fontWeight: FontWeight.w500, height: 1.4),
    // H6 / Label — small all-caps section labels ("APPEARANCE", "MEDICATIONS").
    labelLarge: TextStyle(
      fontSize: 12,
      fontWeight: FontWeight.w600,
      height: 1.4,
      letterSpacing: 0.72,
    ),
  );

  static ThemeData _build({required Brightness brightness}) {
    final isLight = brightness == Brightness.light;
    final primary = isLight ? CCTokens.primaryLight : CCTokens.primaryDark;
    final onPrimary =
        isLight
            ? CCTokens.primaryForegroundLight
            : CCTokens.primaryForegroundDark;
    final background =
        isLight ? CCTokens.backgroundLight : CCTokens.backgroundDark;
    final foreground =
        isLight ? CCTokens.foregroundLight : CCTokens.foregroundDark;
    final card = isLight ? CCTokens.cardLight : CCTokens.cardDark;
    final muted = isLight ? CCTokens.mutedLight : CCTokens.mutedDark;
    final mutedForeground =
        isLight ? CCTokens.mutedForegroundLight : CCTokens.mutedForegroundDark;
    final border = isLight ? CCTokens.borderLight : CCTokens.borderDark;

    final base = ThemeData(
      useMaterial3: true,
      brightness: brightness,
      fontFamily: fontFamily,
      scaffoldBackgroundColor: background,
      colorScheme: ColorScheme(
        brightness: brightness,
        primary: primary,
        onPrimary: onPrimary,
        secondary: isLight ? CCTokens.secondaryLight : CCTokens.secondaryDark,
        onSecondary: onPrimary,
        error: isLight ? CCTokens.destructiveLight : CCTokens.destructiveDark,
        onError: Colors.white,
        surface: card,
        onSurface: foreground,
        onSurfaceVariant: mutedForeground,
        surfaceContainerHighest: muted,
        outline: border,
      ),
    );

    return base.copyWith(
      textTheme: textScale.apply(
        bodyColor: foreground,
        displayColor: foreground,
        fontFamily: fontFamily,
      ),
      dividerTheme: DividerThemeData(color: border, thickness: 1),
      dialogTheme: DialogThemeData(
        backgroundColor: card,
        shape: RoundedRectangleBorder(borderRadius: CCTokens.borderRadius),
      ),
      snackBarTheme: SnackBarThemeData(
        backgroundColor: foreground,
        contentTextStyle: TextStyle(color: background, fontSize: 14),
        behavior: SnackBarBehavior.floating,
      ),
    );
  }
}
