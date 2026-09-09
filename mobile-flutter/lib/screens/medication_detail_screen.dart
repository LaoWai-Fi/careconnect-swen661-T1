import 'package:flutter/material.dart';

import '../models/app_state.dart';
import '../theme/tokens.dart';
import '../widgets/tap_button.dart';
import 'medications_screen.dart' show confirmDeleteMedication, showMedFormSheet;

/// Medication detail screen -- reached via a real `Navigator.pushNamed` from
/// the medications list, with the selected [Medication] handed across as
/// route arguments. Mirrors [MessageDetailScreen]'s structure: a genuine
/// back stack, full item details, and Edit/Delete actions that reuse the
/// exact same form sheet and confirmation dialog the list card offers.
class MedicationDetailScreen extends StatelessWidget {
  const MedicationDetailScreen({super.key, required this.state, required this.medication});

  final AppState state;
  final Medication medication;

  @override
  Widget build(BuildContext context) {
    // Rebuild on state changes (mark as taken, edit, delete) so the screen
    // stays correct even when it isn't being rebuilt by an ancestor
    // listening to [state] -- see the same pattern in
    // message_detail_screen.dart and medications_screen.dart.
    return ListenableBuilder(
      listenable: state,
      builder: (context, _) {
        // The medication may have just been deleted (e.g. from this very
        // screen). Guard against rendering a stale item that's no longer in
        // AppState -- pop back to the list instead of crashing on a
        // firstWhere with no match.
        Medication? current;
        for (final m in state.medications) {
          if (m.id == medication.id) {
            current = m;
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

  Widget _buildScreen(BuildContext context, Medication med) {
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
                  Row(
                    children: [
                      TextButton.icon(
                        onPressed: () => Navigator.of(context).pop(),
                        icon: const Icon(Icons.arrow_back, size: 18),
                        label: const Text('Back'),
                        style: TextButton.styleFrom(minimumSize: const Size(48, 48)),
                      ),
                      const Spacer(),
                      TextButton(
                        onPressed: () => state.toggleMedTaken(med.id),
                        style: TextButton.styleFrom(minimumSize: const Size(48, 48)),
                        child: Text(med.taken ? 'Mark as not taken' : 'Mark as taken'),
                      ),
                    ],
                  ),
                  const SizedBox(height: 8),
                  Container(
                    width: double.infinity,
                    padding: const EdgeInsets.all(20),
                    decoration: BoxDecoration(
                      color: scheme.surface,
                      borderRadius: BorderRadius.circular(20),
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
                            Expanded(
                              child: Text(
                                med.name,
                                style: TextStyle(fontSize: 20, fontWeight: FontWeight.w700, color: scheme.onSurface),
                              ),
                            ),
                            if (med.taken)
                              Icon(Icons.check_circle, color: isLight ? CCTokens.successTextLight : CCTokens.successTextDark),
                          ],
                        ),
                        const SizedBox(height: 4),
                        Text(med.dose, style: TextStyle(fontSize: 15, color: scheme.onSurfaceVariant)),
                        const SizedBox(height: 12),
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
                          const SizedBox(height: 12),
                          Divider(color: scheme.outline),
                          const SizedBox(height: 12),
                          Text(
                            med.notes,
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
                          onPressed: () => showMedFormSheet(context, state, initial: med),
                        ),
                      ),
                      SizedBox(
                        width: 200,
                        child: TapButton(
                          label: '🗑 Delete',
                          variant: TapButtonVariant.destructive,
                          onPressed: () => confirmDeleteMedication(context, state, med),
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
