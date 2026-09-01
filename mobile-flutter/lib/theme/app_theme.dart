import 'package:flutter/material.dart';

import 'tokens.dart';

/// Builds the CareConnect light and dark themes from the Figma design tokens.
///
/// The type scale mirrors the Figma `.type-*` classes:
///   h1 32/800, h2 24/700, h3 20/700, h4 18/600, h5 16/600,
///   body 16/400, body-sm 14/400, caption 12/500, label 12/600 uppercase.
abstract final class CCTheme {
  static const String fontFamily = 'Inter';

  static ThemeData light() => _build(brightness: Brightness.light);
  static ThemeData dark() => _build(brightness: Brightness.dark);

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
        surfaceContainerHighest: muted,
        outline: border,
      ),
    );

    return base.copyWith(
      textTheme: base.textTheme.apply(
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
