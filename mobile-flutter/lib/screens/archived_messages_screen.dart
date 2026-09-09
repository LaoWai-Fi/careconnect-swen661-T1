import 'package:flutter/material.dart';

import '../models/app_state.dart';
import 'messages_screen.dart' show MessageRow;

/// Archived messages screen -- lists messages the user has archived from
/// the main Messages inbox. Archiving (from [MessageDetailScreen]) marks a
/// message archived rather than deleting it, and the main inbox filters
/// those out; this screen is the one place they're still visible, reached
/// via a real `pushNamed('/messages/archived')` route from the Messages
/// screen's header, with its own Back button and a genuine back stack --
/// mirroring the other secondary screens in the app (e.g. the message/
/// medication/appointment detail screens).
class ArchivedMessagesScreen extends StatelessWidget {
  const ArchivedMessagesScreen({super.key, required this.state});

  final AppState state;

  @override
  Widget build(BuildContext context) {
    // Rebuild on state changes (unarchiving a message from the detail
    // screen and returning here) so the list stays correct even when this
    // screen isn't being rebuilt by an ancestor listening to [state] --
    // see the same pattern in messages_screen.dart.
    return ListenableBuilder(
      listenable: state,
      builder: (context, _) => _buildScreen(context),
    );
  }

  Widget _buildScreen(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    final archived = state.messages.where((m) => m.archived).toList();

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
                  Text(
                    'Archived messages',
                    style: TextStyle(fontSize: 24, fontWeight: FontWeight.w700, color: scheme.onSurface),
                  ),
                  Text(
                    "Messages you've archived from the inbox. They won't show up there until you unarchive them.",
                    style: TextStyle(fontSize: 14, color: scheme.onSurfaceVariant),
                  ),
                  const SizedBox(height: 20),
                  if (archived.isEmpty)
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
                          Icon(Icons.archive_outlined, size: 40, color: scheme.onSurfaceVariant),
                          const SizedBox(height: 12),
                          Text(
                            'No archived messages',
                            style: TextStyle(fontWeight: FontWeight.w600, fontSize: 16, color: scheme.onSurface),
                          ),
                          const SizedBox(height: 4),
                          Text(
                            'Messages you archive from the inbox will show up here.',
                            textAlign: TextAlign.center,
                            style: TextStyle(fontSize: 14, color: scheme.onSurfaceVariant),
                          ),
                        ],
                      ),
                    )
                  else
                    Column(
                      children: [
                        for (final msg in archived) ...[
                          MessageRow(
                            message: msg,
                            onToggleRead: () => state.toggleMessageRead(msg.id),
                            onOpen: () {
                              state.markMessageRead(msg.id);
                              Navigator.of(context).pushNamed('/messages/detail', arguments: msg);
                            },
                          ),
                          const SizedBox(height: 8),
                        ],
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
