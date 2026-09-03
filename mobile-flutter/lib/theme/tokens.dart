import 'package:flutter/material.dart';

/// CareConnect design tokens — ported 1:1 from the team's Week 3 Figma
/// design system (see docs/week3-design-notes.md).
///
/// Light-mode values come straight from the Figma CSS custom properties;
/// dark-mode values mirror the `.dark` token block. Contrast ratios noted in
/// comments were verified against WCAG 2.2 AA.
abstract final class CCTokens {
  // ── Brand / primary ──────────────────────────────────────────────────────
  static const Color primaryLight = Color(0xFF1B6E7A);
  static const Color primaryDark = Color(0xFF4CC8D8);

  static const Color primaryForegroundLight = Color(0xFFFFFFFF);
  static const Color primaryForegroundDark = Color(0xFF07141A);

  static const Color primaryHoverLight = Color(0xFF155E6A);
  static const Color primaryActiveLight = Color(0xFF114F59);

  // ── Surfaces ────────────────────────────────────────────────────────────
  static const Color backgroundLight = Color(0xFFF0F4F7);
  static const Color backgroundDark = Color(0xFF0F1E25);

  static const Color cardLight = Color(0xFFFFFFFF);
  static const Color cardDark = Color(0xFF162630);

  static const Color foregroundLight = Color(0xFF1A2B35);
  static const Color foregroundDark = Color(0xFFE6EFF4);

  static const Color mutedLight = Color(0xFFE2EAF0);
  static const Color mutedDark = Color(0xFF1D3040);

  /// WCAG 5.4:1 on light background / 7.5:1 on dark background.
  static const Color mutedForegroundLight = Color(0xFF4A6270);
  static const Color mutedForegroundDark = Color(0xFF8FB2BF);

  static const Color borderLight = Color(0xFF7C848A);
  static const Color borderDark = Color(0xFF547E9A);

  static const Color accentLight = Color(0xFF227B88);
  static const Color accentDark = Color(0xFF60D4E4);

  // ── Semantic ────────────────────────────────────────────────────────────
  static const Color destructiveLight = Color(0xFFB91C1C); // 6.1:1 w/ white
  static const Color destructiveDark = Color(0xFFF87171);

  static const Color secondaryLight = Color(0xFFA6512E);
  static const Color secondaryDark = Color(0xFFE08A5C);

  static const Color outlineHoverLight = Color(0xFFE8F4F6);
  static const Color outlineActiveLight = Color(0xFFCEE9EC);
  static const Color outlineHoverDark = Color(0xFF1A3040);
  static const Color outlineActiveDark = Color(0xFF152838);

  // ── Status surfaces ─────────────────────────────────────────────────────
  static const Color successBgLight = Color(0xFFEDFBF2);
  static const Color successBgDark = Color(0xFF052E14);
  static const Color successBorderLight = Color(0xFF5D7B68);
  static const Color successBorderDark = Color(0xFF249551);
  static const Color successTextLight = Color(0xFF166534);
  static const Color successTextDark = Color(0xFF86EFAC);

  static const Color warningBgLight = Color(0xFFFFFBEA);
  static const Color warningBgDark = Color(0xFF211300);
  static const Color warningBorderLight = Color(0xFF8B7E4B);
  static const Color warningBorderDark = Color(0xFFB4641C);
  static const Color warningTextLight = Color(0xFF92400E);
  static const Color warningTextDark = Color(0xFFFCD34D);

  static const Color infoBgLight = Color(0xFFEDF6F8);
  static const Color infoBgDark = Color(0xFF051E26);
  static const Color infoBorderLight = Color(0xFF5A767B);
  static const Color infoBorderDark = Color(0xFF367CAC);
  static const Color infoTextLight = Color(0xFF1B6E7A);
  static const Color infoTextDark = Color(0xFF4CC8D8);

  // ── Shape ───────────────────────────────────────────────────────────────
  /// --radius: 0.75rem → 12 dp.
  static const double radius = 12.0;
  static final BorderRadius borderRadius = BorderRadius.circular(radius);

  // ── Tap target sizes (WCAG 2.5.8 Target Size – AA, and the Week 4
  // ~48x48dp baseline) ─────────────────────────────────────────────────
  /// Minimum interactive size anywhere in the app.
  static const double minTarget = 48.0;

  /// TapButton size scale: sm 48, md 52, lg 60.
  static const double buttonSm = 48.0;
  static const double buttonMd = 52.0;
  static const double buttonLg = 60.0;

  // ── Focus ring (WCAG 2.4.7 Focus Visible – AA) ──────────────────────────
  /// 3px focus outline with offset, contrast-checked against both adjacent
  /// states in light and dark themes.
  static const double focusOutlineWidth = 3.0;
  static const double focusOutlineOffset = 2.0;
}
