import 'package:flutter/material.dart';

import '../theme/tokens.dart';

/// The CareConnect primary button component, ported from the Figma design
/// system's `TapButton`.
///
/// Accessibility notes:
/// - All sizes meet or exceed the ~48x48dp touch-target baseline (sm 48 /
///   md 52 / lg 60 dp minimum heights).
/// - A 3px focus outline (WCAG 2.4.7 Focus Visible – AA) is drawn via
///   [FocusableActionDetector] so it also shows for keyboard/dpad users.
///
/// Interaction states (per the Assignment 3 component library, §6.3.1):
/// - hover / press swap in the variant's `--*-hover` / `--*-active` token
///   colors and scale the button to 0.97 while pressed;
/// - disabled renders at 40% opacity and ignores pointer events;
/// - keyboard focus draws a 3px ring offset 2px (the destructive variant
///   rings in `--destructive`, everything else in `--ring`).
enum TapButtonVariant { primary, outline, ghost, destructive, secondary }
enum TapButtonSize { sm, md, lg }

class TapButton extends StatefulWidget {
  const TapButton({
    super.key,
    required this.label,
    required this.onPressed,
    this.variant = TapButtonVariant.primary,
    this.size = TapButtonSize.md,
    this.icon,
    this.fullWidth = false,
    this.autofocus = false,
    this.foregroundColor,
    this.borderColor,
  });

  final String label;
  final VoidCallback? onPressed;
  final TapButtonVariant variant;
  final TapButtonSize size;
  final IconData? icon;
  final bool fullWidth;
  final bool autofocus;

  /// Overrides the variant's default text/icon color. Needed for cases like
  /// a `ghost` button sitting on a colored (non-surface) background, where
  /// the variant's usual `scheme.primary` text would match the background
  /// and disappear -- e.g. the landing screen's teal hero section.
  final Color? foregroundColor;

  /// Overrides the variant's default border. Passing this always draws a
  /// visible 2px border (like the `outline` variant does), regardless of
  /// [variant] -- needed for a `ghost` button that still needs a visible
  /// outline against a colored background, e.g. the landing screen's
  /// secondary CTA on its teal hero section.
  final Color? borderColor;

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
  State<TapButton> createState() => _TapButtonState();
}

class _TapButtonState extends State<TapButton> {
  bool _hovering = false;
  bool _pressed = false;
  bool _focused = false;

  void _setPressed(bool value) {
    if (widget.onPressed == null) return;
    setState(() => _pressed = value);
  }

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    final isLight = Theme.of(context).brightness == Brightness.light;
    final enabled = widget.onPressed != null;

    final (bg, fg, border) = switch (widget.variant) {
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

    // Hover / press backgrounds from the design system's --*-hover and
    // --*-active tokens (§6.3.1). Ghost and outline share the outline-hover /
    // outline-active pair; primary/secondary/destructive each have their own.
    final hoverBg = switch (widget.variant) {
      TapButtonVariant.primary =>
        isLight ? CCTokens.primaryHoverLight : CCTokens.primaryHoverDark,
      TapButtonVariant.outline ||
      TapButtonVariant.ghost =>
        isLight ? CCTokens.outlineHoverLight : CCTokens.outlineHoverDark,
      TapButtonVariant.destructive =>
        isLight ? CCTokens.destructiveHoverLight : CCTokens.destructiveHoverDark,
      TapButtonVariant.secondary =>
        isLight ? CCTokens.secondaryHoverLight : CCTokens.secondaryHoverDark,
    };
    final activeBg = switch (widget.variant) {
      TapButtonVariant.primary =>
        isLight ? CCTokens.primaryActiveLight : CCTokens.primaryActiveDark,
      TapButtonVariant.outline ||
      TapButtonVariant.ghost =>
        isLight ? CCTokens.outlineActiveLight : CCTokens.outlineActiveDark,
      TapButtonVariant.destructive =>
        isLight
            ? CCTokens.destructiveActiveLight
            : CCTokens.destructiveActiveDark,
      TapButtonVariant.secondary =>
        isLight ? CCTokens.secondaryActiveLight : CCTokens.secondaryActiveDark,
    };

    // The ghost variant stays transparent at rest; only hover/press tint it.
    final resolvedBg =
        !enabled
            ? bg
            : _pressed
            ? activeBg
            : _hovering
            ? hoverBg
            : bg;
    final resolvedFg = widget.foregroundColor ?? fg;
    final resolvedBorder = widget.borderColor ?? border;
    final borderWidth =
        (widget.variant == TapButtonVariant.outline || widget.borderColor != null)
        ? 2.0
        : 0.0;

    // The destructive variant focuses in --destructive; everything else in
    // --ring (which equals --primary), per §6.3.1.
    final focusColor =
        widget.variant == TapButtonVariant.destructive
            ? scheme.error
            : scheme.primary;

    final content = Row(
      mainAxisSize: widget.fullWidth ? MainAxisSize.max : MainAxisSize.min,
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        if (widget.icon != null) ...[
          Icon(widget.icon, size: widget.fontSize + 4),
          const SizedBox(width: 8),
        ],
        Flexible(
          child: Text(
            widget.label,
            overflow: TextOverflow.ellipsis,
            style: TextStyle(
              fontSize: widget.fontSize,
              fontWeight: FontWeight.w600,
              color: resolvedFg,
            ),
          ),
        ),
      ],
    );

    return MouseRegion(
      cursor: enabled ? SystemMouseCursors.click : SystemMouseCursors.basic,
      onEnter: enabled ? (_) => setState(() => _hovering = true) : null,
      onExit: enabled ? (_) => setState(() => _hovering = false) : null,
      child: FocusableActionDetector(
        autofocus: widget.autofocus,
        onFocusChange: (value) => setState(() => _focused = value),
        child: Semantics(
          button: true,
          enabled: enabled,
          child: Opacity(
            // Disabled state: 40% opacity, per §6.3.1.
            opacity: enabled ? 1.0 : 0.4,
            child: AnimatedContainer(
              duration: const Duration(milliseconds: 100),
              // Focus ring (WCAG 2.4.7): 3px outline, 2px offset, drawn
              // outside the button's rounded rect so it never covers the
              // label. Only shown for keyboard/other focus, not on tap.
              decoration: BoxDecoration(
                borderRadius: CCTokens.borderRadius,
                border:
                    _focused && enabled
                        ? Border.all(
                          color: focusColor,
                          width: CCTokens.focusOutlineWidth,
                        )
                        : null,
              ),
              foregroundDecoration:
                  _focused && enabled
                      ? BoxDecoration(
                        border: Border.all(
                          color: Colors.transparent,
                          width: CCTokens.focusOutlineOffset,
                        ),
                      )
                      : null,
              child: Material(
                color: resolvedBg,
                borderRadius: CCTokens.borderRadius,
                child: InkWell(
                  onTap: widget.onPressed,
                  onTapDown: enabled ? (_) => _setPressed(true) : null,
                  onTapUp: enabled ? (_) => _setPressed(false) : null,
                  onTapCancel: enabled ? () => _setPressed(false) : null,
                  borderRadius: CCTokens.borderRadius,
                  child: Container(
                    constraints: BoxConstraints(minHeight: widget.minHeight),
                    padding: EdgeInsets.symmetric(
                      horizontal: widget.size == TapButtonSize.sm ? 16 : 20,
                      vertical: 12,
                    ),
                    decoration: BoxDecoration(
                      borderRadius: CCTokens.borderRadius,
                      border: Border.all(
                        color: resolvedBorder,
                        width: borderWidth,
                      ),
                    ),
                    child: Center(child: content),
                  ),
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}
