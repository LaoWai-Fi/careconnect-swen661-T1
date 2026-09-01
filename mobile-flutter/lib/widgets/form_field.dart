import 'package:flutter/material.dart';

import '../theme/tokens.dart';

/// Labelled form field wrapper ported from the Figma `FormField` component.
///
/// The label is always visible (never placeholder-only) so screen readers and
/// users with cognitive load have an explicit association — WCAG 3.3.2.
class CCFormField extends StatelessWidget {
  const CCFormField({
    super.key,
    required this.label,
    required this.child,
    this.required = false,
    this.hint,
    this.error,
  });

  final String label;
  final Widget child;
  final bool required;
  final String? hint;
  final String? error;

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        RichText(
          text: TextSpan(
            style: TextStyle(
              fontSize: 14,
              fontWeight: FontWeight.w600,
              color: scheme.onSurface,
            ),
            children: [
              TextSpan(text: label),
              if (required)
                TextSpan(text: ' *', style: TextStyle(color: scheme.error)),
            ],
          ),
        ),
        const SizedBox(height: 6),
        child,
        if (error != null) ...[
          const SizedBox(height: 4),
          Text(
            error!,
            style: TextStyle(color: scheme.error, fontSize: 14, fontWeight: FontWeight.w500),
          ),
        ] else if (hint != null) ...[
          const SizedBox(height: 4),
          Text(hint!, style: TextStyle(color: scheme.onSurfaceVariant, fontSize: 14)),
        ],
      ],
    );
  }
}

/// Styled text input matching the Figma `Input`: 52dp min height, 2px border,
/// 3px focus ring.
class CCInput extends StatelessWidget {
  const CCInput({
    super.key,
    required this.controller,
    this.placeholder,
    this.obscure = false,
    this.keyboardType,
    this.minLines = 1,
    this.maxLines = 1,
    this.autofocus = false,
    this.error = false,
    this.onSubmitted,
  });

  final TextEditingController controller;
  final String? placeholder;
  final bool obscure;
  final TextInputType? keyboardType;
  final int minLines;
  final int maxLines;
  final bool autofocus;
  final bool error;
  final ValueChanged<String>? onSubmitted;

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    return TextField(
      controller: controller,
      obscureText: obscure,
      keyboardType: keyboardType,
      minLines: minLines,
      maxLines: maxLines,
      autofocus: autofocus,
      onSubmitted: onSubmitted,
      style: TextStyle(color: scheme.onSurface, fontSize: 16),
      decoration: InputDecoration(
        hintText: placeholder,
        hintStyle: TextStyle(color: scheme.onSurfaceVariant),
        filled: true,
        fillColor: scheme.surface,
        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
        enabledBorder: OutlineInputBorder(
          borderRadius: CCTokens.borderRadius,
          borderSide: BorderSide(
            color: error ? scheme.error : scheme.outline,
            width: 2,
          ),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: CCTokens.borderRadius,
          borderSide: BorderSide(
            color: error ? scheme.error : scheme.primary,
            width: 3,
          ),
        ),
      ),
    );
  }
}
