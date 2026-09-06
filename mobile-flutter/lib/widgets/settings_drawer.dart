import 'package:flutter/material.dart';

import '../models/app_state.dart';
import 'tap_button.dart';

/// Settings bottom-sheet: Appearance (theme), One-Handed Mode, Text Size.
///
/// One-Handed Mode is the team's assigned accessibility constraint —
/// Left mode anchors navigation and key actions to the left edge for
/// one-handed, left-thumb operation.
void showSettingsSheet(BuildContext context, AppState state) {
  showModalBottomSheet<void>(
    context: context,
    isScrollControlled: true,
    showDragHandle: true,
    builder: (ctx) => _SettingsSheet(state: state),
  );
}

class _SettingsSheet extends StatefulWidget {
  const _SettingsSheet({required this.state});

  final AppState state;

  @override
  State<_SettingsSheet> createState() => _SettingsSheetState();
}

class _SettingsSheetState extends State<_SettingsSheet> {
  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    final state = widget.state;

    return Padding(
      padding: EdgeInsets.fromLTRB(20, 0, 20, 24 + MediaQuery.viewInsetsOf(context).bottom),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('Settings', style: TextStyle(fontSize: 20, fontWeight: FontWeight.w700, color: scheme.onSurface)),
          const SizedBox(height: 20),

          _SectionLabel('Appearance', scheme),
          Row(
            children: [
              for (final t in ThemeModeSetting.values)
                Expanded(
                  child: Padding(
                    padding: const EdgeInsets.only(right: 8),
                    child: _ChoiceChip(
                      selected: state.theme == t,
                      label: switch (t) {
                        ThemeModeSetting.light => '☀ Light',
                        ThemeModeSetting.system => '💻 System',
                        ThemeModeSetting.dark => '🌙 Dark',
                      },
                      onTap: () => setState(() => state.setTheme(t)),
                    ),
                  ),
                ),
            ],
          ),
          const SizedBox(height: 20),

          _SectionLabel('One-Handed Mode', scheme),
          Text(
            'Shifts navigation toward your thumb for comfortable single-hand use.',
            style: TextStyle(fontSize: 14, color: scheme.onSurfaceVariant),
          ),
          const SizedBox(height: 10),
          Row(
            children: [
              for (final m in HandMode.values)
                Expanded(
                  child: Padding(
                    padding: const EdgeInsets.only(right: 8),
                    child: _ChoiceChip(
                      selected: state.handMode == m,
                      label: switch (m) {
                        HandMode.off => '⊕ Off',
                        HandMode.left => '👈 Left',
                        HandMode.right => '👉 Right',
                      },
                      onTap: () => setState(() => state.setHandMode(m)),
                    ),
                  ),
                ),
            ],
          ),
          const SizedBox(height: 20),

          _SectionLabel('Text Size', scheme),
          Row(
            children: [
              for (final f in FontScale.values)
                Expanded(
                  child: Padding(
                    padding: const EdgeInsets.only(right: 8),
                    child: _ChoiceChip(
                      selected: state.fontSize == f,
                      label: switch (f) {
                        FontScale.normal => 'Default',
                        FontScale.large => 'Large',
                        FontScale.xlarge => 'X-Large',
                      },
                      onTap: () => setState(() => state.setFontScale(f)),
                    ),
                  ),
                ),
            ],
          ),
          const SizedBox(height: 8),
          Text(
            'Changes text and button size across the whole app.',
            style: TextStyle(fontSize: 12, color: scheme.onSurfaceVariant),
          ),
          const SizedBox(height: 20),

          TapButton(
            label: 'Sign out',
            variant: TapButtonVariant.ghost,
            size: TapButtonSize.md,
            fullWidth: true,
            onPressed: () {
              Navigator.of(context).pop();
              state.signOut();
              Navigator.of(context).pushNamedAndRemoveUntil('/landing', (route) => false);
            },
          ),
        ],
      ),
    );
  }
}

class _SectionLabel extends StatelessWidget {
  const _SectionLabel(this.text, this.scheme);

  final String text;
  final ColorScheme scheme;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Text(
        text.toUpperCase(),
        style: TextStyle(
          fontSize: 12,
          fontWeight: FontWeight.w600,
          letterSpacing: 1,
          color: scheme.onSurfaceVariant,
        ),
      ),
    );
  }
}

/// Segmented choice chip — 44dp minimum tap target, clear selected state.
class _ChoiceChip extends StatelessWidget {
  const _ChoiceChip({
    required this.selected,
    required this.label,
    required this.onTap,
  });

  final bool selected;
  final String label;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    return Semantics(
      button: true,
      selected: selected,
      child: Material(
        color: selected ? scheme.primary : scheme.surface,
        borderRadius: BorderRadius.circular(12),
        child: InkWell(
          onTap: onTap,
          borderRadius: BorderRadius.circular(12),
          child: Container(
            constraints: const BoxConstraints(minHeight: 44),
            alignment: Alignment.center,
            padding: const EdgeInsets.symmetric(vertical: 10, horizontal: 6),
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(12),
              border: Border.all(
                color: selected ? scheme.primary : scheme.outline,
                width: 2,
              ),
            ),
            child: Text(
              label,
              textAlign: TextAlign.center,
              style: TextStyle(
                fontSize: 13,
                fontWeight: FontWeight.w600,
                color: selected ? scheme.onPrimary : scheme.onSurfaceVariant,
              ),
            ),
          ),
        ),
      ),
    );
  }
}
