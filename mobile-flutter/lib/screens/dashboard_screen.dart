import 'package:flutter/material.dart';

import '../models/app_state.dart';
import '../theme/tokens.dart';
import '../widgets/cards.dart';
import '../widgets/tap_button.dart';

/// Caregiver dashboard — ported from the Figma `DashboardPage`.
///
/// Widget sections render in the user-defined order (customizable via the
/// Customize sheet, which offers tap-based Move Up / Move Down as the
/// drag-free alternative required by WCAG 2.5.7).
class DashboardScreen extends StatefulWidget {
  const DashboardScreen({super.key, required this.state});

  final AppState state;

  @override
  State<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends State<DashboardScreen> {
  bool _customizing = false;
  String? _checkInFeedback;

  void _handleCheckIn() {
    if (widget.state.checkedIn) return;
    widget.state.checkIn();
    setState(() => _checkInFeedback = '✓ Check-in recorded!');
    Future.delayed(const Duration(seconds: 3), () {
      if (mounted) setState(() => _checkInFeedback = null);
    });
  }

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    final isLight = Theme.of(context).brightness == Brightness.light;
    final isWide = MediaQuery.sizeOf(context).width >= 768;
    final state = widget.state;

    final meds = state.medications;
    final takenCount = meds.where((m) => m.taken).length;
    final totalTasks = meds.length + 1;
    final doneTasks = takenCount + (state.checkedIn ? 1 : 0);
    final nextAppt = state.appointments.isNotEmpty ? state.appointments.first : null;

    final enabledWidgets =
        state.dashboardWidgets.where((w) => w.enabled).toList()
          ..sort((a, b) => a.order.compareTo(b.order));

    return Stack(
      children: [
        SingleChildScrollView(
          padding: const EdgeInsets.all(16),
          child: Center(
            child: Container(
              constraints: const BoxConstraints(maxWidth: 880),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Header
                  Row(
                    children: [
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              'Dashboard',
                              style: TextStyle(fontSize: 24, fontWeight: FontWeight.w700, color: scheme.onSurface),
                            ),
                            Text(
                              "Margaret's care overview",
                              style: TextStyle(fontSize: 14, color: scheme.onSurfaceVariant),
                            ),
                          ],
                        ),
                      ),
                      TapButton(
                        label: '✎',
                        variant: TapButtonVariant.outline,
                        size: TapButtonSize.sm,
                        onPressed: () => setState(() => _customizing = true),
                      ),
                    ],
                  ),
                  const SizedBox(height: 20),

                  // Task counter
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                    decoration: BoxDecoration(
                      color: scheme.surface,
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(color: scheme.outline),
                    ),
                    child: Row(
                      children: [
                        const Icon(Icons.checklist, size: 26),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                '$doneTasks of $totalTasks tasks done',
                                style: TextStyle(fontSize: 17, fontWeight: FontWeight.w700, color: scheme.onSurface),
                              ),
                              Text(
                                "today's care plan progress",
                                style: TextStyle(fontSize: 13, color: scheme.onSurfaceVariant),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 8),
                  ClipRRect(
                    borderRadius: BorderRadius.circular(999),
                    child: Semantics(
                      label: '$doneTasks of $totalTasks tasks done',
                      value: '${totalTasks > 0 ? ((doneTasks / totalTasks) * 100).round() : 0} percent',
                      child: LinearProgressIndicator(
                        value: totalTasks > 0 ? doneTasks / totalTasks : 0,
                        minHeight: 8,
                        backgroundColor: scheme.surfaceContainerHighest,
                        color: scheme.primary,
                      ),
                    ),
                  ),
                  const SizedBox(height: 24),

                  // Widget sections in user-defined order
                  for (final w in enabledWidgets) ..._buildWidget(
                    id: w.id,
                    scheme: scheme,
                    isLight: isLight,
                    isWide: isWide,
                    meds: meds,
                    takenCount: takenCount,
                    nextAppt: nextAppt,
                  ),
                ],
              ),
            ),
          ),
        ),
        if (_customizing)
          _CustomizeSheet(state: state, onClose: () => setState(() => _customizing = false)),
      ],
    );
  }

  /// Lays out children horizontally with equal widths on tablets, or stacked
  /// vertically on phones. (Expanded is only valid inside a Row/Flex main axis.)
  static List<Widget> _spread(bool isWide, List<Widget> children) {
    if (!isWide) return children;
    return [
      for (var i = 0; i < children.length; i++) ...[
        Expanded(child: children[i]),
        if (i < children.length - 1) const SizedBox(width: 12),
      ],
    ];
  }

  List<Widget> _buildWidget({
    required String id,
    required ColorScheme scheme,
    required bool isLight,
    required bool isWide,
    required List<Medication> meds,
    required int takenCount,
    Appointment? nextAppt,
  }) {
    final state = widget.state;
    switch (id) {
      case 'status':
        return [
          Text(
            "Margaret's status today",
            style: TextStyle(fontWeight: FontWeight.w700, fontSize: 16, color: scheme.onSurface),
          ),
          const SizedBox(height: 12),
          Flex(
            direction: isWide ? Axis.horizontal : Axis.vertical,
            children: _spread(
              isWide,
              [
                StatCard(
                  icon: Icons.medication_outlined,
                  label: 'Medications',
                  value: '$takenCount of ${meds.length}',
                  sub: 'taken today',
                  bg: isLight ? CCTokens.warningBgLight : CCTokens.warningBgDark,
                  borderColor: isLight ? CCTokens.warningBorderLight : CCTokens.warningBorderDark,
                  onTap: () => Navigator.of(context).pushReplacementNamed('/medications'),
                ),
                StatCard(
                  icon: Icons.person_outline,
                  label: 'Check-in',
                  value: state.checkedIn ? 'Done' : 'Not yet',
                  sub: state.checkedIn ? 'Completed' : 'Awaiting check-in',
                  bg: state.checkedIn
                      ? (isLight ? CCTokens.successBgLight : CCTokens.successBgDark)
                      : scheme.surfaceContainerHighest,
                  borderColor: state.checkedIn
                      ? (isLight ? CCTokens.successBorderLight : CCTokens.successBorderDark)
                      : scheme.outline,
                  onTap: _handleCheckIn,
                ),
                StatCard(
                  icon: Icons.event_outlined,
                  label: 'Next Appointment',
                  value: nextAppt != null ? nextAppt.title.split('—').first.trim() : 'None',
                  sub: nextAppt?.dateTime ?? '—',
                  bg: isLight ? CCTokens.infoBgLight : CCTokens.infoBgDark,
                  borderColor: isLight ? CCTokens.infoBorderLight : CCTokens.infoBorderDark,
                  onTap: () => Navigator.of(context).pushReplacementNamed('/appointments'),
                ),
              ],
            ),
          ),
          if (_checkInFeedback != null) ...[
            const SizedBox(height: 8),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
              decoration: BoxDecoration(
                color: isLight ? CCTokens.successBgLight : CCTokens.successBgDark,
                borderRadius: CCTokens.borderRadius,
                border: Border.all(color: isLight ? CCTokens.successBorderLight : CCTokens.successBorderDark),
              ),
              child: Text(
                _checkInFeedback!,
                style: TextStyle(
                  fontWeight: FontWeight.w600,
                  color: isLight ? CCTokens.successTextLight : CCTokens.successTextDark,
                ),
              ),
            ),
          ],
          const SizedBox(height: 24),
        ];

      case 'alerts':
        final untaken = meds.where((m) => !m.taken).toList();
        final alerts = <AlertCard>[
          if (nextAppt != null && nextAppt.dateTime.toLowerCase().contains('today'))
            AlertCard(
              icon: Icons.event_outlined,
              title: 'Appointment today',
              body:
                  '${nextAppt.title} at ${nextAppt.dateTime.split('—').length > 1 ? nextAppt.dateTime.split('—')[1].trim() : nextAppt.dateTime} — ${nextAppt.location.split('—').first.trim()}.',
            ),
          if (untaken.isNotEmpty)
            AlertCard(
              icon: Icons.medication_outlined,
              title: '${untaken.length} medication${untaken.length > 1 ? 's' : ''} not yet taken',
              body:
                  '${untaken.map((m) => '${m.name} ${m.dose}').join(', ')} — scheduled for ${untaken.first.time}.',
            ),
          if (!state.checkedIn)
            const AlertCard(
              icon: Icons.person_outline,
              title: 'No check-in yet',
              body: "Margaret hasn't checked in this morning. Tap the Check-in card above to record it.",
            ),
        ];
        if (alerts.isEmpty) return [const SizedBox.shrink()];
        return [
          Row(
            children: [
              Icon(Icons.warning_amber_outlined, size: 18, color: scheme.onSurface),
              const SizedBox(width: 6),
              Text('Alerts', style: TextStyle(fontWeight: FontWeight.w700, fontSize: 16, color: scheme.onSurface)),
              const SizedBox(width: 8),
              Container(
                width: 20,
                height: 20,
                alignment: Alignment.center,
                decoration: BoxDecoration(color: Colors.red, borderRadius: BorderRadius.circular(999)),
                child: Text(
                  '${alerts.length}',
                  style: const TextStyle(color: Colors.white, fontSize: 11, fontWeight: FontWeight.w700),
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          Flex(
            direction: isWide ? Axis.horizontal : Axis.vertical,
            children: _spread(isWide, alerts),
          ),
          const SizedBox(height: 24),
        ];

      case 'medications':
        return [
          Row(
            children: [
              Expanded(
                child: Text(
                  "Today's medications",
                  style: TextStyle(fontWeight: FontWeight.w700, fontSize: 16, color: scheme.onSurface),
                ),
              ),
              TextButton(
                onPressed: () => Navigator.of(context).pushReplacementNamed('/medications'),
                child: const Text('View all →'),
              ),
            ],
          ),
          const SizedBox(height: 8),
          Flex(
            direction: isWide ? Axis.horizontal : Axis.vertical,
            children: _spread(isWide, [for (final med in meds.take(3)) _MedTile(med: med, state: state)]),
          ),
          const SizedBox(height: 24),
        ];

      case 'appointments':
        if (nextAppt == null) return [const SizedBox.shrink()];
        return [
          Row(
            children: [
              Expanded(
                child: Text(
                  'Next appointment',
                  style: TextStyle(fontWeight: FontWeight.w700, fontSize: 16, color: scheme.onSurface),
                ),
              ),
              TextButton(
                onPressed: () => Navigator.of(context).pushReplacementNamed('/appointments'),
                child: const Text('View all →'),
              ),
            ],
          ),
          const SizedBox(height: 8),
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: scheme.surface,
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: scheme.outline),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(nextAppt.title, style: TextStyle(fontWeight: FontWeight.w700, fontSize: 16, color: scheme.onSurface)),
                const SizedBox(height: 4),
                Text('🕐 ${nextAppt.dateTime}', style: TextStyle(fontSize: 14, color: scheme.onSurfaceVariant)),
                Text('📍 ${nextAppt.location}', style: TextStyle(fontSize: 14, color: scheme.onSurfaceVariant)),
                const SizedBox(height: 4),
                Text(nextAppt.notes, style: TextStyle(fontSize: 14, color: scheme.onSurfaceVariant)),
              ],
            ),
          ),
          const SizedBox(height: 24),
        ];

      case 'messages':
        final unread = state.messages.where((m) => !m.read && !m.archived).toList();
        return [
          Row(
            children: [
              Expanded(
                child: Text(
                  'Unread messages',
                  style: TextStyle(fontWeight: FontWeight.w700, fontSize: 16, color: scheme.onSurface),
                ),
              ),
              TextButton(
                onPressed: () => Navigator.of(context).pushReplacementNamed('/messages'),
                child: const Text('View all →'),
              ),
            ],
          ),
          const SizedBox(height: 8),
          if (unread.isEmpty)
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                color: scheme.surface,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: scheme.outline),
              ),
              child: Text(
                'No new messages',
                textAlign: TextAlign.center,
                style: TextStyle(fontSize: 14, color: scheme.onSurfaceVariant),
              ),
            )
          else
            Flex(
              direction: isWide ? Axis.horizontal : Axis.vertical,
              children: _spread(isWide, [
                for (final msg in unread.take(3))
                  _MessageTile(
                    message: msg,
                    onTap: () {
                      state.markMessageRead(msg.id);
                      Navigator.of(context).pushNamed('/messages/detail', arguments: msg);
                    },
                  ),
              ]),
            ),
          const SizedBox(height: 24),
        ];

      default:
        return [const SizedBox.shrink()];
    }
  }
}

/// Compact tappable medication row on the dashboard.
class _MedTile extends StatelessWidget {
  const _MedTile({required this.med, required this.state});

  final Medication med;
  final AppState state;

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    final isLight = Theme.of(context).brightness == Brightness.light;
    return Semantics(
      button: true,
      label: '${med.name}, ${med.dose}, ${med.time}',
      value: med.taken ? 'Taken' : 'Not yet taken',
      child: Material(
      color: med.taken
          ? (isLight ? CCTokens.successBgLight : CCTokens.successBgDark)
          : scheme.surface,
      borderRadius: BorderRadius.circular(12),
      child: InkWell(
        onTap: () => state.toggleMedTaken(med.id),
        borderRadius: BorderRadius.circular(12),
        child: Container(
          constraints: const BoxConstraints(minHeight: 60),
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(12),
            border: Border.all(
              color: med.taken
                  ? (isLight ? CCTokens.successBorderLight : CCTokens.successBorderDark)
                  : scheme.outline,
            ),
          ),
          child: Row(
            children: [
              Icon(
                med.taken ? Icons.check_circle : Icons.radio_button_unchecked,
                size: 20,
                color: med.taken
                    ? (isLight ? CCTokens.successTextLight : CCTokens.successTextDark)
                    : scheme.onSurfaceVariant,
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(med.name, style: TextStyle(fontWeight: FontWeight.w600, fontSize: 14, color: scheme.onSurface)),
                    Text(
                      '${med.dose} · ${med.time}',
                      style: TextStyle(fontSize: 12, color: scheme.onSurfaceVariant),
                    ),
                  ],
                ),
              ),
              if (med.taken)
                Text(
                  'Taken',
                  style: TextStyle(
                    fontSize: 12,
                    fontWeight: FontWeight.w600,
                    color: isLight ? CCTokens.successTextLight : CCTokens.successTextDark,
                  ),
                ),
            ],
          ),
        ),
      ),
      ),
    );
  }
}

/// Compact tappable message row on the dashboard.
class _MessageTile extends StatelessWidget {
  const _MessageTile({required this.message, required this.onTap});

  final Message message;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    return Semantics(
      button: true,
      label: 'Unread message from ${message.from}: ${message.subject}',
      child: Material(
        color: scheme.surface,
        borderRadius: BorderRadius.circular(12),
        child: InkWell(
          onTap: onTap,
          borderRadius: BorderRadius.circular(12),
          child: Container(
            constraints: const BoxConstraints(minHeight: 60),
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: scheme.primary, width: 1.5),
            ),
            child: Row(
              children: [
                Container(
                  width: 8,
                  height: 8,
                  decoration: BoxDecoration(color: scheme.primary, shape: BoxShape.circle),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        message.from,
                        style: TextStyle(fontWeight: FontWeight.w700, fontSize: 14, color: scheme.onSurface),
                      ),
                      Text(
                        message.subject,
                        overflow: TextOverflow.ellipsis,
                        style: TextStyle(fontSize: 12, color: scheme.onSurfaceVariant),
                      ),
                    ],
                  ),
                ),
                Text(message.timestamp, style: TextStyle(fontSize: 11, color: scheme.onSurfaceVariant)),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

/// Customize Dashboard bottom sheet.
///
/// Accessibility: reordering works entirely with taps (Move Up / Move Down
/// buttons) — no drag gesture is required (WCAG 2.5.7 Dragging Movements).
/// Long-press drag is additionally supported as a convenience for users who
/// prefer it.
class _CustomizeSheet extends StatefulWidget {
  const _CustomizeSheet({required this.state, required this.onClose});

  final AppState state;
  final VoidCallback onClose;

  @override
  State<_CustomizeSheet> createState() => _CustomizeSheetState();
}

class _CustomizeSheetState extends State<_CustomizeSheet> {
  late List<DashboardWidget> _items;

  @override
  void initState() {
    super.initState();
    _items = [...widget.state.dashboardWidgets]..sort((a, b) => a.order.compareTo(b.order));
  }

  void _move(int from, int to) {
    if (to < 0 || to >= _items.length) return;
    setState(() {
      final moved = _items.removeAt(from);
      _items.insert(to, moved);
    });
    widget.state.reorderWidgets(_items);
  }

  /// `onReorderItem` (replacing the deprecated `onReorder`, Flutter
  /// 3.41+) already adjusts `newIndex` for the removed item at
  /// `oldIndex` before calling this, so unlike the old `onReorder`
  /// callback this must NOT also decrement newIndex itself.
  void _onReorderItem(int oldIndex, int newIndex) {
    setState(() {
      final moved = _items.removeAt(oldIndex);
      _items.insert(newIndex, moved);
    });
    widget.state.reorderWidgets(_items);
  }

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    return Positioned.fill(
      child: GestureDetector(
        onTap: widget.onClose,
        behavior: HitTestBehavior.opaque,
        child: Container(
          color: Colors.black.withValues(alpha: 0.4),
          alignment: Alignment.bottomCenter,
          child: GestureDetector(
            onTap: () {},
            child: Material(
              color: scheme.surface,
              borderRadius: const BorderRadius.vertical(top: Radius.circular(24)),
              child: SafeArea(
                top: false,
                child: ConstrainedBox(
                  constraints: BoxConstraints(
                    maxHeight: MediaQuery.sizeOf(context).height * 0.75,
                    maxWidth: 560,
                  ),
                  child: Padding(
                    padding: const EdgeInsets.all(24),
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Row(
                          children: [
                            Expanded(
                              child: Text(
                                'Customize Dashboard',
                                style: TextStyle(fontSize: 20, fontWeight: FontWeight.w700, color: scheme.onSurface),
                              ),
                            ),
                            TextButton(onPressed: widget.onClose, child: const Text('Done')),
                          ],
                        ),
                        const SizedBox(height: 4),
                        Align(
                          alignment: Alignment.centerLeft,
                          child: Text(
                            'Long-press and drag to reorder, or use ↑ ↓ buttons. Toggle to show or hide.',
                            style: TextStyle(fontSize: 13, color: scheme.onSurfaceVariant),
                          ),
                        ),
                        const SizedBox(height: 12),
                        Flexible(
                          child: ReorderableListView.builder(
                            shrinkWrap: true,
                            buildDefaultDragHandles: false,
                            onReorderItem: _onReorderItem,
                            itemCount: _items.length,
                            proxyDecorator: (child, index, animation) => Material(
                              color: scheme.surfaceContainerHighest,
                              borderRadius: BorderRadius.circular(12),
                              child: child,
                            ),
                            itemBuilder: (ctx, i) {
                              final w = _items[i];
                              return Container(
                                key: ValueKey(w.id),
                                padding: const EdgeInsets.symmetric(vertical: 4),
                                child: Row(
                                  children: [
                                    // Drag handle (optional convenience path)
                                    ReorderableDragStartListener(
                                      index: i,
                                      child: SizedBox(
                                        width: 48,
                                        height: 48,
                                        child: Icon(Icons.drag_indicator, color: scheme.onSurfaceVariant),
                                      ),
                                    ),
                                    Expanded(
                                      child: Text(
                                        w.label,
                                        style: TextStyle(fontSize: 14, fontWeight: FontWeight.w500, color: scheme.onSurface),
                                      ),
                                    ),
                                    // Tap-based Move Up / Move Down (WCAG 2.5.7)
                                    SizedBox(
                                      width: 48,
                                      height: 48,
                                      child: IconButton(
                                        icon: const Icon(Icons.arrow_upward, size: 18),
                                        tooltip: 'Move ${w.label} up',
                                        onPressed: i == 0 ? null : () => _move(i, i - 1),
                                      ),
                                    ),
                                    SizedBox(
                                      width: 48,
                                      height: 48,
                                      child: IconButton(
                                        icon: const Icon(Icons.arrow_downward, size: 18),
                                        tooltip: 'Move ${w.label} down',
                                        onPressed: i == _items.length - 1 ? null : () => _move(i, i + 1),
                                      ),
                                    ),
                                    // Visibility toggle
                                    _WidgetToggle(
                                      value: w.enabled,
                                      label: w.label,
                                      onChanged: (_) {
                                        setState(() => w.enabled = !w.enabled);
                                        widget.state.toggleWidget(w.id);
                                      },
                                    ),
                                  ],
                                ),
                              );
                            },
                          ),
                        ),
                      ],
                    ),
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

class _WidgetToggle extends StatelessWidget {
  const _WidgetToggle({required this.value, required this.label, required this.onChanged});

  final bool value;
  final String label;
  final ValueChanged<bool?> onChanged;

  @override
  Widget build(BuildContext context) {
    return Semantics(
      label: '$label — ${value ? 'visible' : 'hidden'}',
      toggled: value,
      child: Switch(value: value, onChanged: onChanged),
    );
  }
}
