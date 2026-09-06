import 'package:flutter/material.dart';

import '../models/app_state.dart';
import '../theme/tokens.dart';
import '../widgets/form_field.dart';
import '../widgets/tap_button.dart';

/// Appointment management screen — ported from the Figma `AppointmentsPage`.
class AppointmentsScreen extends StatefulWidget {
  const AppointmentsScreen({super.key, required this.state});

  final AppState state;

  @override
  State<AppointmentsScreen> createState() => _AppointmentsScreenState();
}

class _AppointmentsScreenState extends State<AppointmentsScreen> {
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
    // Rebuild on state changes (add/edit/delete) so this screen stays
    // correct even when it isn't being rebuilt by an ancestor listening to
    // [state] -- see the same pattern in message_detail_screen.dart and
    // messages_screen.dart. Without this, AppointmentsScreen reached via a
    // named route (as it always is in the real app) doesn't reflect the
    // change even though AppState did.
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
                          'Manage Appointments',
                          style: TextStyle(fontSize: 24, fontWeight: FontWeight.w700, color: scheme.onSurface),
                        ),
                        Text(
                          "Add, edit, or remove Margaret's upcoming appointments",
                          style: TextStyle(fontSize: 14, color: scheme.onSurfaceVariant),
                        ),
                      ],
                    ),
                  ),
                  TapButton(
                    label: '+ Add',
                    size: TapButtonSize.md,
                    onPressed: () => showApptFormSheet(context, widget.state),
                  ),
                ],
              ),
              const SizedBox(height: 20),
              if (widget.state.appointments.isEmpty)
                Container(
                  width: double.infinity,
                  padding: const EdgeInsets.all(32),
                  decoration: BoxDecoration(
                    color: scheme.surface,
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(color: scheme.outline),
                  ),
                  child: Column(
                    children: [
                      Icon(Icons.event_outlined, size: 40, color: scheme.onSurfaceVariant),
                      const SizedBox(height: 12),
                      Text('No appointments yet', style: TextStyle(fontWeight: FontWeight.w600, fontSize: 16, color: scheme.onSurface)),
                      const SizedBox(height: 4),
                      Text(
                        'Tap "+ Add" to schedule Margaret\'s first appointment.',
                        textAlign: TextAlign.center,
                        style: TextStyle(fontSize: 14, color: scheme.onSurfaceVariant),
                      ),
                    ],
                  ),
                )
              else
                Flex(
                  direction: isWide ? Axis.horizontal : Axis.vertical,
                  children: _spread(isWide, [
                    for (final appt in widget.state.appointments) _ApptCard(appt: appt, state: widget.state),
                  ]),
                ),
            ],
          ),
        ),
      ),
    );
  }
}

/// Shows the add/edit appointment form as a real modal route, so it can be
/// triggered from both this list screen and [AppointmentDetailScreen].
void showApptFormSheet(BuildContext context, AppState state, {Appointment? initial}) {
  final scheme = Theme.of(context).colorScheme;
  showModalBottomSheet<void>(
    context: context,
    isScrollControlled: true,
    backgroundColor: scheme.surface,
    shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(24))),
    builder: (ctx) => _ApptFormSheet(
      initial: initial,
      onSave: (title, dateTime, location, assignee, notes) {
        if (initial != null) {
          state.updateAppointment(
            initial.id,
            Appointment(id: initial.id, title: title, dateTime: dateTime, location: location, assignee: assignee, notes: notes),
          );
        } else {
          state.addAppointment(
            Appointment(id: 'a${DateTime.now().millisecondsSinceEpoch}', title: title, dateTime: dateTime, location: location, assignee: assignee, notes: notes),
          );
        }
        Navigator.of(ctx).pop();
      },
      onCancel: () => Navigator.of(ctx).pop(),
    ),
  );
}

class _ApptCard extends StatelessWidget {
  const _ApptCard({required this.appt, required this.state});

  final Appointment appt;
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
        border: Border.all(color: scheme.outline, width: 2),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Everything above the Edit/Delete row opens the detail screen.
          // Kept as its own InkWell rather than wrapping the whole card so
          // it never nests inside/around the action buttons below.
          InkWell(
            borderRadius: BorderRadius.circular(8),
            onTap: () => Navigator.of(context).pushNamed('/appointments/detail', arguments: appt),
            child: Padding(
              padding: const EdgeInsets.symmetric(vertical: 2, horizontal: 4),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(appt.title, style: TextStyle(fontSize: 17, fontWeight: FontWeight.w700, color: scheme.onSurface)),
                  const SizedBox(height: 8),
                  Row(
                    children: [
                      Icon(Icons.schedule, size: 16, color: scheme.onSurface),
                      const SizedBox(width: 6),
                      Expanded(child: Text(appt.dateTime, style: TextStyle(fontSize: 14, fontWeight: FontWeight.w600, color: scheme.onSurface))),
                    ],
                  ),
                  const SizedBox(height: 4),
                  Row(
                    children: [
                      Icon(Icons.place_outlined, size: 16, color: scheme.onSurfaceVariant),
                      const SizedBox(width: 6),
                      Expanded(child: Text(appt.location, style: TextStyle(fontSize: 14, color: scheme.onSurfaceVariant))),
                    ],
                  ),
                  if (appt.assignee.isNotEmpty) ...[
                    const SizedBox(height: 8),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                      decoration: BoxDecoration(
                        color: isLight ? CCTokens.successBgLight : CCTokens.successBgDark,
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(color: isLight ? CCTokens.successBorderLight : CCTokens.successBorderDark),
                      ),
                      child: Row(
                        children: [
                          Icon(Icons.person_outline, size: 16, color: isLight ? CCTokens.successTextLight : CCTokens.successTextDark),
                          const SizedBox(width: 6),
                          Expanded(
                            child: Text(
                              '${appt.assignee} is assigned',
                              overflow: TextOverflow.ellipsis,
                              style: TextStyle(fontSize: 13, fontWeight: FontWeight.w600, color: isLight ? CCTokens.successTextLight : CCTokens.successTextDark),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                  if (appt.notes.isNotEmpty) ...[
                    const SizedBox(height: 8),
                    Container(
                      width: double.infinity,
                      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                      decoration: BoxDecoration(
                        color: scheme.surfaceContainerHighest,
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: Row(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Icon(Icons.info_outline, size: 16, color: scheme.onSurfaceVariant),
                          const SizedBox(width: 6),
                          Expanded(child: Text(appt.notes, style: TextStyle(fontSize: 13, color: scheme.onSurfaceVariant))),
                        ],
                      ),
                    ),
                  ],
                ],
              ),
            ),
          ),
          const SizedBox(height: 12),
          Row(
            children: [
              Expanded(
                child: TapButton(
                  label: '✎ Edit',
                  variant: TapButtonVariant.outline,
                  size: TapButtonSize.sm,
                  onPressed: () => showApptFormSheet(context, state, initial: appt),
                ),
              ),
              const SizedBox(width: 8),
              Expanded(
                child: TapButton(
                  label: '🗑 Delete',
                  variant: TapButtonVariant.destructive,
                  size: TapButtonSize.sm,
                  onPressed: () => state.deleteAppointment(appt.id),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

/// Add / edit appointment bottom-sheet form. Shown via [showApptFormSheet].
class _ApptFormSheet extends StatefulWidget {
  const _ApptFormSheet({this.initial, required this.onSave, required this.onCancel});

  final Appointment? initial;
  final void Function(String title, String dateTime, String location, String assignee, String notes) onSave;
  final VoidCallback onCancel;

  @override
  State<_ApptFormSheet> createState() => _ApptFormSheetState();
}

class _ApptFormSheetState extends State<_ApptFormSheet> {
  late final TextEditingController _title;
  late final TextEditingController _dateTime;
  late final TextEditingController _location;
  late final TextEditingController _assignee;
  late final TextEditingController _notes;
  String? _titleError;
  String? _dateTimeError;
  String? _locationError;

  @override
  void initState() {
    super.initState();
    _title = TextEditingController(text: widget.initial?.title ?? '');
    _dateTime = TextEditingController(text: widget.initial?.dateTime ?? '');
    _location = TextEditingController(text: widget.initial?.location ?? '');
    _assignee = TextEditingController(text: widget.initial?.assignee ?? '');
    _notes = TextEditingController(text: widget.initial?.notes ?? '');
  }

  @override
  void dispose() {
    _title.dispose();
    _dateTime.dispose();
    _location.dispose();
    _assignee.dispose();
    _notes.dispose();
    super.dispose();
  }

  void _save() {
    setState(() {
      _titleError = _title.text.trim().isEmpty ? 'Required' : null;
      _dateTimeError = _dateTime.text.trim().isEmpty ? 'Required' : null;
      _locationError = _location.text.trim().isEmpty ? 'Required' : null;
    });
    if (_titleError != null || _dateTimeError != null || _locationError != null) return;
    widget.onSave(_title.text.trim(), _dateTime.text.trim(), _location.text.trim(), _assignee.text.trim(), _notes.text.trim());
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
                        isEdit ? 'Edit appointment' : 'Add appointment',
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
                  label: 'Appointment title',
                  required: true,
                  error: _titleError,
                  child: CCInput(controller: _title, placeholder: 'e.g. Blood pressure check — Dr. Sharma', error: _titleError != null),
                ),
                const SizedBox(height: 16),
                CCFormField(
                  label: 'Date and time',
                  required: true,
                  hint: "Type a date like 'Monday 22 June — 2:00 pm'.",
                  error: _dateTimeError,
                  child: CCInput(controller: _dateTime, placeholder: 'e.g. Monday 22 June — 2:00 pm', error: _dateTimeError != null),
                ),
                const SizedBox(height: 16),
                CCFormField(
                  label: 'Location',
                  required: true,
                  error: _locationError,
                  child: CCInput(controller: _location, placeholder: 'e.g. Greenfield Surgery — 12 Greenfield Road', error: _locationError != null),
                ),
                const SizedBox(height: 16),
                CCFormField(
                  label: 'Assigned caregiver (optional)',
                  child: CCInput(controller: _assignee, placeholder: 'e.g. Maria Thompson'),
                ),
                const SizedBox(height: 16),
                CCFormField(
                  label: 'Notes (optional)',
                  child: CCInput(controller: _notes, placeholder: 'Preparation instructions, reminders, etc.', minLines: 3, maxLines: 5),
                ),
                const SizedBox(height: 20),
                Row(
                  children: [
                    Expanded(child: TapButton(label: 'Cancel', variant: TapButtonVariant.outline, size: TapButtonSize.lg, onPressed: widget.onCancel)),
                    const SizedBox(width: 12),
                    Expanded(child: TapButton(label: isEdit ? 'Save changes' : 'Add appointment', size: TapButtonSize.lg, onPressed: _save)),
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
