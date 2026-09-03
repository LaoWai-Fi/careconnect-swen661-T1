import 'package:flutter/material.dart';

import '../models/app_state.dart';
import '../theme/tokens.dart';
import '../widgets/tap_button.dart';

/// Activity log screen — ported from the Figma `ActivityPage`.
class ActivityScreen extends StatefulWidget {
  const ActivityScreen({super.key, required this.state});

  final AppState state;

  @override
  State<ActivityScreen> createState() => _ActivityScreenState();
}

class _ActivityScreenState extends State<ActivityScreen> {
  ActivityType? _filter;
  bool _refreshed = false;

  /// Equal-width columns on tablets, stacked on phones.
  static List<Widget> _spread(bool isWide, List<Widget> children) {
    if (!isWide) return children;
    return [
      for (var i = 0; i < children.length; i++) ...[
        Expanded(child: children[i]),
        if (i < children.length - 1) const SizedBox(width: 16),
      ],
    ];
  }

  void _handleRefresh() {
    setState(() => _refreshed = true);
    widget.state.addActivity(
      ActivityEntry(
        id: 'r${DateTime.now().millisecondsSinceEpoch}',
        type: ActivityType.checkedIn,
        description: 'Margaret checked in via dashboard',
        timestamp: _nowTimestamp(),
      ),
    );
    Future.delayed(const Duration(seconds: 2), () {
      if (mounted) setState(() => _refreshed = false);
    });
  }

  static String _nowTimestamp() {
    final now = DateTime.now();
    final h = now.hour % 12 == 0 ? 12 : now.hour % 12;
    return '$h:${now.minute.toString().padLeft(2, '0')} ${now.hour < 12 ? 'am' : 'pm'}';
  }

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    final isWide = MediaQuery.sizeOf(context).width >= 768;

    final entries =
        _filter == null
            ? widget.state.activity
            : widget.state.activity.where((e) => e.type == _filter).toList();

    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Center(
        child: Container(
          constraints: const BoxConstraints(maxWidth: 880),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text('Activity log', style: TextStyle(fontSize: 24, fontWeight: FontWeight.w700, color: scheme.onSurface)),
              Text(
                "Margaret's recent actions — medications taken, check-ins, and tasks",
                style: TextStyle(fontSize: 14, color: scheme.onSurfaceVariant),
              ),
              const SizedBox(height: 16),
              TapButton(
                label: _refreshed ? '✓ Refreshed!' : '↺ Refresh',
                variant: TapButtonVariant.outline,
                size: TapButtonSize.md,
                onPressed: _refreshed ? null : _handleRefresh,
              ),
              const SizedBox(height: 16),
              Wrap(
                spacing: 8,
                runSpacing: 8,
                children: [
                  _FilterPill(
                    label: 'All',
                    selected: _filter == null,
                    onTap: () => setState(() => _filter = null),
                  ),
                  for (final t in ActivityType.values)
                    _FilterPill(
                      label: switch (t) {
                        ActivityType.medicationTaken => 'Medication taken',
                        ActivityType.medicationUnmarked => 'Medication unmarked',
                        ActivityType.taskCompleted => 'Task completed',
                        ActivityType.checkedIn => 'Checked in',
                      },
                      selected: _filter == t,
                      onTap: () => setState(() => _filter = t),
                    ),
                ],
              ),
              const SizedBox(height: 20),
              if (entries.isEmpty)
                Container(
                  width: double.infinity,
                  padding: const EdgeInsets.all(36),
                  decoration: BoxDecoration(
                    color: scheme.surface,
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(color: scheme.outline),
                  ),
                  child: Column(
                    children: [
                      Icon(Icons.info_outline, size: 36, color: scheme.onSurfaceVariant),
                      const SizedBox(height: 10),
                      Text('No activity yet', style: TextStyle(fontWeight: FontWeight.w600, fontSize: 16, color: scheme.onSurface)),
                      const SizedBox(height: 4),
                      Text(
                        'Events will appear here when Margaret takes medications, completes tasks, or checks in.',
                        textAlign: TextAlign.center,
                        style: TextStyle(fontSize: 14, color: scheme.onSurfaceVariant),
                      ),
                    ],
                  ),
                )
              else
                Flex(
                  direction: isWide ? Axis.horizontal : Axis.vertical,
                  children: _spread(isWide, [for (final e in entries) _ActivityTile(entry: e)]),
                ),
            ],
          ),
        ),
      ),
    );
  }
}

class _ActivityTile extends StatelessWidget {
  const _ActivityTile({required this.entry});

  final ActivityEntry entry;

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    final isLight = Theme.of(context).brightness == Brightness.light;

    final (label, bg, border, dot) = switch (entry.type) {
      ActivityType.medicationTaken => (
        'Medication taken',
        isLight ? CCTokens.successBgLight : CCTokens.successBgDark,
        isLight ? CCTokens.successBorderLight : CCTokens.successBorderDark,
        Colors.green,
      ),
      ActivityType.medicationUnmarked => (
        'Medication unmarked',
        isLight ? CCTokens.warningBgLight : CCTokens.warningBgDark,
        isLight ? CCTokens.warningBorderLight : CCTokens.warningBorderDark,
        Colors.amber,
      ),
      ActivityType.taskCompleted => (
        'Task completed',
        isLight ? CCTokens.infoBgLight : CCTokens.infoBgDark,
        isLight ? CCTokens.infoBorderLight : CCTokens.infoBorderDark,
        scheme.primary,
      ),
      ActivityType.checkedIn => (
        'Checked in',
        isLight ? CCTokens.successBgLight : CCTokens.successBgDark,
        isLight ? CCTokens.successBorderLight : CCTokens.successBorderDark,
        Colors.green,
      ),
    };

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: bg,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: border),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(width: 10, height: 10, margin: const EdgeInsets.only(top: 6), decoration: BoxDecoration(color: dot, shape: BoxShape.circle)),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(label, style: TextStyle(fontSize: 14, fontWeight: FontWeight.w600, color: scheme.onSurface)),
                Text(entry.description, style: TextStyle(fontSize: 14, color: scheme.onSurfaceVariant)),
              ],
            ),
          ),
          Text(entry.timestamp, style: TextStyle(fontSize: 12, color: scheme.onSurfaceVariant)),
        ],
      ),
    );
  }
}

class _FilterPill extends StatelessWidget {
  const _FilterPill({required this.label, required this.selected, required this.onTap});

  final String label;
  final bool selected;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    return Semantics(
      button: true,
      selected: selected,
      child: Material(
        color: selected ? scheme.primary : scheme.surface,
        borderRadius: BorderRadius.circular(999),
        child: InkWell(
          onTap: onTap,
          borderRadius: BorderRadius.circular(999),
          child: Container(
            constraints: const BoxConstraints(minHeight: 44),
            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(999),
              border: Border.all(color: selected ? scheme.primary : scheme.outline),
            ),
            child: Text(
              label,
              style: TextStyle(
                fontSize: 13,
                fontWeight: FontWeight.w500,
                color: selected ? scheme.onPrimary : scheme.onSurface,
              ),
            ),
          ),
        ),
      ),
    );
  }
}
