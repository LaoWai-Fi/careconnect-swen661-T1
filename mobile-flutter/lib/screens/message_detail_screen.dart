import 'package:flutter/material.dart';

import '../models/app_state.dart';
import '../widgets/tap_button.dart';
import 'messages_screen.dart' show showComposeSheet;

/// Message detail screen -- reached via a real `Navigator.pushNamed` from
/// the messages list (or the dashboard's unread-messages widget), with the
/// selected [Message] handed across as route arguments. This satisfies the
/// Week 4 rubric's "selecting a list item opens a detail screen with that
/// item's data" requirement, and gives a genuine back stack (Back returns
/// to the list, not just a re-render of it).
class MessageDetailScreen extends StatelessWidget {
  const MessageDetailScreen({super.key, required this.state, required this.message});

  final AppState state;
  final Message message;

  @override
  Widget build(BuildContext context) {
    // Rebuild on state changes (e.g. the "Mark as read/unread" toggle below)
    // so the screen stays correct even when it isn't being rebuilt by an
    // ancestor listening to [state].
    return ListenableBuilder(
      listenable: state,
      builder: (context, _) => _buildScreen(context),
    );
  }

  Widget _buildScreen(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;

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
                        onPressed: () => state.toggleMessageRead(message.id),
                        style: TextButton.styleFrom(minimumSize: const Size(48, 48)),
                        child: Text(message.read ? 'Mark as unread' : 'Mark as read'),
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
                      border: Border.all(color: scheme.outline),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          message.subject,
                          style: TextStyle(fontSize: 20, fontWeight: FontWeight.w700, color: scheme.onSurface),
                        ),
                        const SizedBox(height: 12),
                        _DetailRow(label: 'From', value: message.from),
                        _DetailRow(label: 'To', value: message.to),
                        _DetailRow(label: 'Date', value: message.timestamp),
                        const SizedBox(height: 12),
                        Divider(color: scheme.outline),
                        const SizedBox(height: 12),
                        Text(
                          message.body,
                          style: TextStyle(fontSize: 15, color: scheme.onSurface, height: 1.5),
                        ),
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
                          label: 'Reply',
                          icon: Icons.reply,
                          onPressed: () => showComposeSheet(context, state, replyTo: message),
                        ),
                      ),
                      SizedBox(
                        width: 200,
                        child: TapButton(
                          // Reached from either the main inbox (not yet
                          // archived) or the Archived messages screen
                          // (already archived) -- offer the opposite
                          // action of whichever screen sent us here, then
                          // pop back to it so the list there is correct.
                          label: message.archived ? 'Unarchive' : 'Archive',
                          variant: TapButtonVariant.secondary,
                          onPressed: () {
                            if (message.archived) {
                              state.unarchiveMessage(message.id);
                            } else {
                              state.archiveMessage(message.id);
                            }
                            Navigator.of(context).pop();
                          },
                        ),
                      ),
                      SizedBox(
                        width: 200,
                        child: TapButton(
                          label: 'Delete',
                          variant: TapButtonVariant.destructive,
                          onPressed: () => _confirmDelete(context),
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

  void _confirmDelete(BuildContext context) {
    showDialog<void>(
      context: context,
      builder: (ctx) {
        return AlertDialog(
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
          title: const Text('Delete message?'),
          content: const Text('This message will be permanently deleted. This cannot be undone.'),
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
                state.deleteMessage(message.id);
                Navigator.of(ctx).pop();
                Navigator.of(context).pop();
              },
            ),
          ],
        );
      },
    );
  }
}

class _DetailRow extends StatelessWidget {
  const _DetailRow({required this.label, required this.value});

  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    return Padding(
      padding: const EdgeInsets.only(bottom: 2),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(
            width: 44,
            child: Text(label, style: TextStyle(fontSize: 13, fontWeight: FontWeight.w600, color: scheme.onSurface)),
          ),
          Expanded(
            child: Text(value, style: TextStyle(fontSize: 13, color: scheme.onSurfaceVariant)),
          ),
        ],
      ),
    );
  }
}
