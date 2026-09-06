import 'package:flutter/material.dart';

import '../models/app_state.dart';
import '../theme/tokens.dart';
import '../widgets/form_field.dart';
import '../widgets/tap_button.dart';

/// Medication management screen — ported from the Figma `MedicationsPage`.
class MedicationsScreen extends StatefulWidget {
  const MedicationsScreen({super.key, required this.state});

  final AppState state;

  @override
  State<MedicationsScreen> createState() => _MedicationsScreenState();
}

class _MedicationsScreenState extends State<MedicationsScreen> {
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

  @override
  Widget build(BuildContext context) {
    // Rebuild on state changes (the "mark as taken" toggle, add/edit/delete)
    // so this screen stays correct even when it isn't being rebuilt by an
    // ancestor listening to [state] -- see the same pattern in
    // message_detail_screen.dart and messages_screen.dart. Without this,
    // MedicationsScreen reached via a named route (as it always is in the
    // real app) doesn't reflect the change even though AppState did --
    // this is exactly why "mark as taken" looked unresponsive.
    return ListenableBuilder(
      listenable: widget.state,
      builder: (context, _) => _buildScreen(context),
    );
  }

  Widget _buildScreen(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    final isWide = MediaQuery.sizeOf(context).width >= 768;

    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Center(
        child: Container(
          constraints: const BoxConstraints(maxWidth: 880),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'Manage medications',
                          style: TextStyle(fontSize: 24, fontWeight: FontWeight.w700, color: scheme.onSurface),
                        ),
                        Text(
                          "Add, edit, or remove Margaret's prescriptions",
                          style: TextStyle(fontSize: 14, color: scheme.onSurfaceVariant),
                        ),
                      ],
                    ),
                  ),
                  TapButton(
                    label: '+ Add',
                    size: TapButtonSize.md,
                    onPressed: () => showMedFormSheet(context, widget.state),
                  ),
                ],
              ),
              const SizedBox(height: 20),
              if (widget.state.medications.isEmpty)
                const _EmptyState(
                  icon: Icons.medication_outlined,
                  title: 'No medications yet',
                  body: 'Tap "Add" to add Margaret\'s first prescription.',
                )
              else
                Flex(
                  direction: isWide ? Axis.horizontal : Axis.vertical,
                  children: _spread(isWide, [
                    for (final med in widget.state.medications) _MedCard(med: med, state: widget.state),
                  ]),
                ),
            ],
          ),
        ),
      ),
    );
  }
}

/// Shows the add/edit medication form as a real modal route, so it can be
/// triggered from both this list screen and [MedicationDetailScreen].
void showMedFormSheet(BuildContext context, AppState state, {Medication? initial}) {
  final scheme = Theme.of(context).colorScheme;
  showModalBottomSheet<void>(
    context: context,
    isScrollControlled: true,
    backgroundColor: scheme.surface,
    shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(24))),
    builder: (ctx) => _MedFormSheet(
      initial: initial,
      onSave: (name, dose, time, notes) {
        if (initial != null) {
          // Update in place, preserving the id -- needed so a caller like
          // MedicationDetailScreen (which holds onto the id across the
          // edit) keeps showing the same medication afterwards instead of
          // being treated as "deleted".
          state.updateMedication(initial.id, initial.copyWith(name: name, dose: dose, time: time, notes: notes));
        } else {
          state.addMedication(Medication(id: 'm${DateTime.now().millisecondsSinceEpoch}', name: name, dose: dose, time: time, notes: notes));
        }
        Navigator.of(ctx).pop();
      },
      onCancel: () => Navigator.of(ctx).pop(),
    ),
  );
}

/// Confirms and performs deleting a medication -- shared by the card's
/// inline Delete button and [MedicationDetailScreen]'s Delete action, so
/// both offer the exact same confirm step.
void confirmDeleteMedication(BuildContext context, AppState state, Medication med) {
  showDialog<void>(
    context: context,
    builder: (ctx) {
      final scheme = Theme.of(ctx).colorScheme;
      return AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        title: Text('Delete medication?', style: TextStyle(color: scheme.onSurface)),
        content: const Text("This will remove the medication from Margaret's plan. This cannot be undone."),
        actions: [
          TapButton(
            label: 'Cancel',
            variant: TapButtonVariant.outline,
            size: TapButtonSize.sm,
            onPressed: () => Navigator.of(ctx).pop(),
          ),
          TapButton(
            label: 'Delete',
            variant: TapButtonVariant.destructive,
            size: TapButtonSize.sm,
            onPressed: () {
              state.deleteMedication(med.id);
              Navigator.of(ctx).pop();
            },
          ),
        ],
      );
    },
  );
}

class _MedCard extends StatelessWidget {
  const _MedCard({required this.med, required this.state});

  final Medication med;
  final AppState state;

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    final isLight = Theme.of(context).brightness == Brightness.light;
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: scheme.surface,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: med.taken
              ? (isLight ? CCTokens.successBorderLight : CCTokens.successBorderDark)
              : scheme.outline,
          width: 2,
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Everything except the "mark as taken" toggle and the
              // Edit/Delete row opens the detail screen. Kept as a sibling
              // of the toggle button (not a parent wrapping it) so the two
              // tap targets never nest -- nesting an IconButton inside an
              // InkWell risks the outer tap swallowing the inner one.
              Expanded(
                child: InkWell(
                  borderRadius: BorderRadius.circular(8),
                  onTap: () => Navigator.of(context).pushNamed('/medications/detail', arguments: med),
                  child: Padding(
                    padding: const EdgeInsets.symmetric(vertical: 2, horizontal: 4),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(med.name, style: TextStyle(fontSize: 17, fontWeight: FontWeight.w700, color: scheme.onSurface)),
                        Text(med.dose, style: TextStyle(fontSize: 14, color: scheme.onSurfaceVariant)),
                        const SizedBox(height: 8),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
                          decoration: BoxDecoration(
                            color: isLight ? CCTokens.infoBgLight : CCTokens.infoBgDark,
                            borderRadius: BorderRadius.circular(999),
                          ),
                          child: Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Icon(Icons.schedule, size: 14, color: isLight ? CCTokens.infoTextLight : CCTokens.infoTextDark),
                              const SizedBox(width: 4),
                              Text(
                                med.time,
                                style: TextStyle(
                                  fontSize: 13,
                                  fontWeight: FontWeight.w600,
                                  color: isLight ? CCTokens.infoTextLight : CCTokens.infoTextDark,
                                ),
                              ),
                            ],
                          ),
                        ),
                        if (med.notes.isNotEmpty) ...[
                          const SizedBox(height: 8),
                          Text(med.notes, style: TextStyle(fontSize: 13, fontStyle: FontStyle.italic, color: scheme.onSurfaceVariant)),
                        ],
                      ],
                    ),
                  ),
                ),
              ),
              SizedBox(
                width: 48,
                height: 48,
                child: IconButton(
                  icon: Icon(
                    med.taken ? Icons.check_circle : Icons.radio_button_unchecked,
                    size: 26,
                    color: med.taken
                        ? (isLight ? CCTokens.successTextLight : CCTokens.successTextDark)
                        : scheme.onSurfaceVariant,
                  ),
                  tooltip: med.taken ? 'Mark as not taken' : 'Mark as taken',
                  onPressed: () => state.toggleMedTaken(med.id),
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          Row(
            children: [
              Expanded(
                child: TapButton(
                  label: '✎ Edit',
                  variant: TapButtonVariant.outline,
                  size: TapButtonSize.sm,
                  onPressed: () => showMedFormSheet(context, state, initial: med),
                ),
              ),
              const SizedBox(width: 8),
              Expanded(
                child: TapButton(
                  label: '🗑 Delete',
                  variant: TapButtonVariant.destructive,
                  size: TapButtonSize.sm,
                  onPressed: () => confirmDeleteMedication(context, state, med),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

/// Add / edit medication bottom-sheet form. Shown via [showMedFormSheet].
class _MedFormSheet extends StatefulWidget {
  const _MedFormSheet({this.initial, required this.onSave, required this.onCancel});

  final Medication? initial;
  final void Function(String name, String dose, String time, String notes) onSave;
  final VoidCallback onCancel;

  @override
  State<_MedFormSheet> createState() => _MedFormSheetState();
}

class _MedFormSheetState extends State<_MedFormSheet> {
  late final TextEditingController _name;
  late final TextEditingController _dose;
  late final TextEditingController _time;
  late final TextEditingController _notes;
  String? _nameError;
  String? _doseError;

  @override
  void initState() {
    super.initState();
    _name = TextEditingController(text: widget.initial?.name ?? '');
    _dose = TextEditingController(text: widget.initial?.dose ?? '');
    _time = TextEditingController(text: widget.initial?.time ?? '08:30');
    _notes = TextEditingController(text: widget.initial?.notes ?? '');
  }

  @override
  void dispose() {
    _name.dispose();
    _dose.dispose();
    _time.dispose();
    _notes.dispose();
    super.dispose();
  }

  void _save() {
    setState(() {
      _nameError = _name.text.trim().isEmpty ? 'Required' : null;
      _doseError = _dose.text.trim().isEmpty ? 'Required' : null;
    });
    if (_nameError != null || _doseError != null) return;
    widget.onSave(_name.text.trim(), _dose.text.trim(), _time.text.trim(), _notes.text.trim());
  }

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    final isEdit = widget.initial != null;
    return SafeArea(
      top: false,
      child: Center(
        child: ConstrainedBox(
          constraints: BoxConstraints(
            maxHeight: MediaQuery.sizeOf(context).height * 0.85,
            maxWidth: 560,
          ),
          child: SingleChildScrollView(
            padding: const EdgeInsets.all(24),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Expanded(
                      child: Text(
                        isEdit ? 'Edit medication' : 'Add new medication',
                        style: TextStyle(fontSize: 20, fontWeight: FontWeight.w700, color: scheme.onSurface),
                      ),
                    ),
                    SizedBox(
                      width: 48,
                      height: 48,
                      child: IconButton(icon: const Icon(Icons.close), tooltip: 'Close', onPressed: widget.onCancel),
                    ),
                  ],
                ),
                const SizedBox(height: 16),
                CCFormField(
                  label: 'Medication name',
                  required: true,
                  error: _nameError,
                  child: CCInput(controller: _name, placeholder: 'e.g. Amlodipine', error: _nameError != null),
                ),
                const SizedBox(height: 16),
                CCFormField(
                  label: 'Dose',
                  required: true,
                  hint: 'Include strength, form, and quantity.',
                  error: _doseError,
                  child: CCInput(controller: _dose, placeholder: 'e.g. 5 mg — 1 tablet', error: _doseError != null),
                ),
                const SizedBox(height: 16),
                CCFormField(
                  label: 'Schedule time',
                  required: true,
                  child: CCInput(controller: _time, placeholder: 'e.g. 8:30 am'),
                ),
                const SizedBox(height: 16),
                CCFormField(
                  label: 'Notes (optional)',
                  child: CCInput(controller: _notes, placeholder: 'e.g. Take with food', minLines: 3, maxLines: 5),
                ),
                const SizedBox(height: 20),
                Row(
                  children: [
                    Expanded(child: TapButton(label: 'Cancel', variant: TapButtonVariant.outline, size: TapButtonSize.lg, onPressed: widget.onCancel)),
                    const SizedBox(width: 12),
                    Expanded(child: TapButton(label: isEdit ? 'Save changes' : 'Add medication', size: TapButtonSize.lg, onPressed: _save)),
                  ],
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class _EmptyState extends StatelessWidget {
  const _EmptyState({required this.icon, required this.title, required this.body});

  final IconData icon;
  final String title;
  final String body;

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(32),
      decoration: BoxDecoration(
        color: scheme.surface,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: scheme.outline),
      ),
      child: Column(
        children: [
          Icon(icon, size: 40, color: scheme.onSurfaceVariant),
          const SizedBox(height: 12),
          Text(title, style: TextStyle(fontWeight: FontWeight.w600, fontSize: 16, color: scheme.onSurface)),
          const SizedBox(height: 4),
          Text(body, textAlign: TextAlign.center, style: TextStyle(fontSize: 14, color: scheme.onSurfaceVariant)),
        ],
      ),
    );
  }
}
