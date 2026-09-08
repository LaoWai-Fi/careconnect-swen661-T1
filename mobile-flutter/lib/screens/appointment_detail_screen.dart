import 'package:flutter/material.dart';

import '../models/app_state.dart';
import '../theme/tokens.dart';
import '../widgets/tap_button.dart';
import 'appointments_screen.dart' show confirmDeleteAppointment, showApptFormSheet;

/// Appointment detail screen -- reached via a real `Navigator.pushNamed`
/// from the appointments list, with the selected [Appointment] handed
/// across as route arguments. Mirrors [MessageDetailScreen] and
/// [MedicationDetailScreen]'s structure: a genuine back stack, full item
/// details, and Edit/Delete actions that reuse the same form sheet the
/// list card offers.
class AppointmentDetailScreen extends StatelessWidget {
  const AppointmentDetailScreen({super.key, required this.state, required this.appointment});

  final AppState state;
  final Appointment appointment;

  @override
  Widget build(BuildContext context) {
    // Rebuild on state changes (edit, delete) so the screen stays correct
    // even when it isn't being rebuilt by an ancestor listening to [state]
    // -- see the same pattern in message_detail_screen.dart and
    // appointments_screen.dart.
    return ListenableBuilder(
      listenable: state,
      builder: (context, _) {
        // The appointment may have just been deleted (e.g. from this very
        // screen, which has no confirmation step). Guard against rendering
        // a stale item that's no longer in AppState -- pop back to the
        // list instead of crashing on a firstWhere with no match.
        Appointment? current;
        for (final a in state.appointments) {
          if (a.id == appointment.id) {
            current = a;
            break;
          }
        }
        if (current == null) {
          WidgetsBinding.instance.addPostFrameCallback((_) {
            if (Navigator.of(context).canPop()) Navigator.of(context).pop();
          });
          return const SizedBox.shrink();
        }
        return _buildScreen(context, current);
      },
    );
  }

  Widget _buildScreen(BuildContext context, Appointment appt) {
    final scheme = Theme.of(context).colorScheme;
    final isLight = Theme.of(context).brightness == Brightness.light;

    return Scaffold(
      backgroundColor: scheme.surfaceContainerHighest,
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(16),
          child: Center(
            child: Container(
              constraints: const BoxConstraints(maxWidth: 680),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  TextButton.icon(
                    onPressed: () => Navigator.of(context).pop(),
                    icon: const Icon(Icons.arrow_back, size: 18),
                    label: const Text('Back'),
                    style: TextButton.styleFrom(minimumSize: const Size(48, 48)),
                  ),
                  const SizedBox(height: 8),
                  Container(
                    width: double.infinity,
                    padding: const EdgeInsets.all(20),
                    decoration: BoxDecoration(
                      color: scheme.surface,
                      borderRadius: BorderRadius.circular(20),
                      border: Border.all(color: scheme.outline),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          appt.title,
                          style: TextStyle(fontSize: 20, fontWeight: FontWeight.w700, color: scheme.onSurface),
                        ),
                        const SizedBox(height: 12),
                        Row(
                          children: [
                            Icon(Icons.schedule, size: 18, color: scheme.onSurface),
                            const SizedBox(width: 8),
                            Expanded(
                              child: Text(appt.dateTime, style: TextStyle(fontSize: 15, fontWeight: FontWeight.w600, color: scheme.onSurface)),
                            ),
                          ],
                        ),
                        const SizedBox(height: 6),
                        Row(
                          children: [
                            Icon(Icons.place_outlined, size: 18, color: scheme.onSurfaceVariant),
                            const SizedBox(width: 8),
                            Expanded(
                              child: Text(appt.location, style: TextStyle(fontSize: 15, color: scheme.onSurfaceVariant)),
                            ),
                          ],
                        ),
                        if (appt.assignee.isNotEmpty) ...[
                          const SizedBox(height: 12),
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
                          const SizedBox(height: 12),
                          Divider(color: scheme.outline),
                          const SizedBox(height: 12),
                          Text(
                            appt.notes,
                            style: TextStyle(fontSize: 15, color: scheme.onSurface, height: 1.5),
                          ),
                        ],
                      ],
                    ),
                  ),
                  const SizedBox(height: 16),
                  Wrap(
                    spacing: 12,
                    runSpacing: 12,
                    children: [
                      SizedBox(
                        width: 200,
                        child: TapButton(
                          label: '✎ Edit',
                          variant: TapButtonVariant.outline,
                          onPressed: () => showApptFormSheet(context, state, initial: appt),
                        ),
                      ),
                      SizedBox(
                        width: 200,
                        child: TapButton(
                          label: '🗑 Delete',
                          variant: TapButtonVariant.destructive,
                          onPressed: () => confirmDeleteAppointment(context, state, appt),
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}
