import 'package:flutter/material.dart';

import '../theme/tokens.dart';

/// The CareConnect primary button component, ported from the Figma design
/// system's `TapButton`.
///
/// Accessibility notes:
/// - All sizes meet or exceed WCAG 2.5.8 Target Size – AA (sm 44 / md 52 /
///   lg 60 dp minimum heights).
/// - A 3px focus outline (WCAG 2.4.7 Focus Visible – AA) is drawn via
///   [FocusableActionDetector] so it also shows for keyboard/dpad users.
enum TapButtonVariant { primary, outline, ghost, destructive, secondary }
enum TapButtonSize { sm, md, lg }

class TapButton extends StatelessWidget {
  const TapButton({
    super.key,
    required this.label,
    required this.onPressed,
    this.variant = TapButtonVariant.primary,
    this.size = TapButtonSize.md,
    this.icon,
    this.fullWidth = false,
    this.autofocus = false,
  });

  final String label;
  final VoidCallback? onPressed;
  final TapButtonVariant variant;
  final TapButtonSize size;
  final IconData? icon;
  final bool fullWidth;
  final bool autofocus;

  double get minHeight => switch (size) {
    TapButtonSize.sm => CCTokens.buttonSm,
    TapButtonSize.md => CCTokens.buttonMd,
    TapButtonSize.lg => CCTokens.buttonLg,
  };

  double get fontSize => switch (size) {
    TapButtonSize.sm => 14.0,
    TapButtonSize.md => 16.0,
    TapButtonSize.lg => 18.0,
  };

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    final isLight = Theme.of(context).brightness == Brightness.light;

    final (bg, fg, border) = switch (variant) {
      TapButtonVariant.primary => (
        scheme.primary,
        scheme.onPrimary,
        Colors.transparent,
      ),
      TapButtonVariant.outline => (
        scheme.surface,
        scheme.primary,
        scheme.primary,
      ),
      TapButtonVariant.ghost => (
        Colors.transparent,
        scheme.primary,
        Colors.transparent,
      ),
      TapButtonVariant.destructive => (
        scheme.error,
        Colors.white,
        Colors.transparent,
      ),
      TapButtonVariant.secondary => (
        isLight ? CCTokens.secondaryLight : CCTokens.secondaryDark,
        isLight ? Colors.white : CCTokens.primaryForegroundDark,
        Colors.transparent,
      ),
    };

    final content = Row(
      mainAxisSize: fullWidth ? MainAxisSize.max : MainAxisSize.min,
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        if (icon != null) ...[Icon(icon, size: fontSize + 4), const SizedBox(width: 8)],
        Flexible(
          child: Text(
            label,
            overflow: TextOverflow.ellipsis,
            style: TextStyle(
              fontSize: fontSize,
              fontWeight: FontWeight.w600,
              color: fg,
            ),
          ),
        ),
      ],
    );

    return FocusableActionDetector(
      autofocus: autofocus,
      mouseCursor: SystemMouseCursors.click,
      child: Semantics(
        button: true,
        enabled: onPressed != null,
        child: Material(
          color: bg,
          borderRadius: CCTokens.borderRadius,
          child: InkWell(
            onTap: onPressed,
            borderRadius: CCTokens.borderRadius,
            child: Container(
              constraints: BoxConstraints(minHeight: minHeight),
              padding: EdgeInsets.symmetric(
                horizontal: size == TapButtonSize.sm ? 16 : 20,
                vertical: 12,
              ),
              decoration: BoxDecoration(
                borderRadius: CCTokens.borderRadius,
                border: Border.all(color: border, width: variant == TapButtonVariant.outline ? 2 : 0),
              ),
              child: Center(child: content),
            ),
          ),
        ),
      ),
    );
  }
}
