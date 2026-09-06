import 'package:flutter/material.dart';

import '../models/app_state.dart';
import '../widgets/form_field.dart';
import '../widgets/tap_button.dart';

/// Messages inbox screen -- ported from the Figma `MessagesPage` list view.
///
/// Read/unread state has its own tap target (the leading dot button), kept
/// separate from the row's "open message" tap target, consistent with the
/// team's "No Drag-Only Actions" constraint (WCAG 2.5.7): nothing here
/// depends on a swipe gesture.
class MessagesScreen extends StatelessWidget {
  const MessagesScreen({super.key, required this.state});

  final AppState state;

  @override
  Widget build(BuildContext context) {
    // Rebuild on state changes (sending a message, archiving one from the
    // detail screen and returning here, toggling read/unread) so the list
    // stays correct even when this screen isn't being rebuilt by an
    // ancestor listening to [state] -- see the same pattern in
    // message_detail_screen.dart.
    return ListenableBuilder(
      listenable: state,
      builder: (context, _) => _buildScreen(context),
    );
  }

  Widget _buildScreen(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    final active = state.messages.where((m) => !m.archived).toList();

    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Center(
        child: Container(
          constraints: const BoxConstraints(maxWidth: 680),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Expanded(
                    child: Text(
                      'Messages',
                      style: TextStyle(fontSize: 24, fontWeight: FontWeight.w700, color: scheme.onSurface),
                    ),
                  ),
                  // Stacked (New Message above, the archive entry point
                  // below) rather than side by side -- two buttons sharing
                  // this row with the title left too little room for
                  // "Messages" and wrapped it onto two lines.
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.end,
                    children: [
                      TapButton(
                        label: 'New Message',
                        icon: Icons.mail_outline,
                        size: TapButtonSize.sm,
                        onPressed: () => showComposeSheet(context, state),
                      ),
                      const SizedBox(height: 8),
                      // Archiving a message (from the detail screen) hides
                      // it from this inbox rather than deleting it -- this
                      // is the entry point to see and, from there,
                      // unarchive them. No count badge here -- unlike an
                      // unread count, there's no way for a user to "clear"
                      // how many messages are archived, so a persistent
                      // number would just be a permanent, meaningless
                      // notification.
                      SizedBox(
                        width: 48,
                        height: 48,
                        child: IconButton(
                          icon: const Icon(Icons.archive_outlined),
                          tooltip: 'View archived messages',
                          onPressed: () => Navigator.of(context).pushNamed('/messages/archived'),
                        ),
                      ),
                    ],
                  ),
                ],
              ),
              const SizedBox(height: 20),
              if (active.isEmpty)
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
                      Icon(Icons.mail_outline, size: 40, color: scheme.onSurfaceVariant),
                      const SizedBox(height: 12),
                      Text('No messages yet', style: TextStyle(fontWeight: FontWeight.w600, fontSize: 16, color: scheme.onSurface)),
                      const SizedBox(height: 4),
                      Text(
                        'Tap "New Message" to send your first message to the care team.',
                        textAlign: TextAlign.center,
                        style: TextStyle(fontSize: 14, color: scheme.onSurfaceVariant),
                      ),
                    ],
                  ),
                )
              else
                Column(
                  children: [
                    for (final msg in active) ...[
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
    );
  }
}

/// A single message row -- public (not file-private) so it can be reused
/// by [ArchivedMessagesScreen], which lists the same kind of row for
/// archived messages instead of active ones.
class MessageRow extends StatelessWidget {
  const MessageRow({super.key, required this.message, required this.onToggleRead, required this.onOpen});

  final Message message;
  final VoidCallback onToggleRead;
  final VoidCallback onOpen;

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    final preview = message.body.replaceAll('\n', ' ');
    final previewText = preview.length > 90 ? '${preview.substring(0, 90)}…' : preview;

    return Container(
      constraints: const BoxConstraints(minHeight: 72),
      decoration: BoxDecoration(
        color: scheme.surface,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: scheme.outline),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.center,
        children: [
          Semantics(
            button: true,
            label: message.read ? 'Mark message from ${message.from} as unread' : 'Mark message from ${message.from} as read',
            child: Material(
              color: Colors.transparent,
              shape: const CircleBorder(),
              child: InkWell(
                onTap: onToggleRead,
                customBorder: const CircleBorder(),
                child: SizedBox(
                  width: 48,
                  height: 48,
                  child: _ReadDot(read: message.read),
                ),
              ),
            ),
          ),
          Expanded(
            child: Semantics(
              button: true,
              label: '${message.read ? "Message" : "Unread message"} from ${message.from}: ${message.subject}',
              child: Material(
                color: Colors.transparent,
                child: InkWell(
                  onTap: onOpen,
                  borderRadius: BorderRadius.circular(12),
                  child: Padding(
                    padding: const EdgeInsets.symmetric(vertical: 10, horizontal: 4),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Row(
                          children: [
                            Expanded(
                              child: Text(
                                message.from,
                                overflow: TextOverflow.ellipsis,
                                style: TextStyle(
                                  fontSize: 14,
                                  fontWeight: message.read ? FontWeight.w400 : FontWeight.w700,
                                  color: message.read ? scheme.onSurfaceVariant : scheme.onSurface,
                                ),
                              ),
                            ),
                            const SizedBox(width: 8),
                            Text(message.timestamp, style: TextStyle(fontSize: 11, color: scheme.onSurfaceVariant)),
                          ],
                        ),
                        const SizedBox(height: 2),
                        Text(
                          message.subject,
                          overflow: TextOverflow.ellipsis,
                          style: TextStyle(
                            fontSize: 14,
                            fontWeight: message.read ? FontWeight.w400 : FontWeight.w600,
                            color: message.read ? scheme.onSurfaceVariant : scheme.onSurface,
                          ),
                        ),
                        const SizedBox(height: 2),
                        Text(
                          previewText,
                          overflow: TextOverflow.ellipsis,
                          style: TextStyle(fontSize: 12, color: scheme.onSurfaceVariant),
                        ),
                      ],
                    ),
                  ),
                ),
              ),
            ),
          ),
          const SizedBox(width: 8),
        ],
      ),
    );
  }
}

/// Filled dot = unread, outlined dot = read -- matches the Figma design's
/// read/unread indicator.
class _ReadDot extends StatelessWidget {
  const _ReadDot({required this.read});

  final bool read;

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    return Center(
      child: Container(
        width: 10,
        height: 10,
        decoration: BoxDecoration(
          shape: BoxShape.circle,
          color: read ? Colors.transparent : scheme.primary,
          border: read ? Border.all(color: scheme.outline, width: 2) : null,
        ),
      ),
    );
  }
}

/// Opens the compose/reply bottom sheet. Pass [replyTo] to prefill a reply.
void showComposeSheet(BuildContext context, AppState state, {Message? replyTo}) {
  showModalBottomSheet<void>(
    context: context,
    isScrollControlled: true,
    showDragHandle: true,
    builder: (ctx) => _ComposeSheet(state: state, replyTo: replyTo),
  );
}

class _ComposeSheet extends StatefulWidget {
  const _ComposeSheet({required this.state, this.replyTo});

  final AppState state;
  final Message? replyTo;

  @override
  State<_ComposeSheet> createState() => _ComposeSheetState();
}

class _ComposeSheetState extends State<_ComposeSheet> {
  late final TextEditingController _to;
  late final TextEditingController _subject;
  late final TextEditingController _body;
  String? _toError;
  String? _bodyError;

  @override
  void initState() {
    super.initState();
    final reply = widget.replyTo;
    _to = TextEditingController(text: reply?.from ?? '');
    _subject = TextEditingController(text: reply != null ? 'Re: ${reply.subject}' : '');
    _body = TextEditingController(
      text: reply != null ? '\n\n— On ${reply.timestamp}, ${reply.from} wrote:\n\n${reply.body}' : '',
    );
  }

  @override
  void dispose() {
    _to.dispose();
    _subject.dispose();
    _body.dispose();
    super.dispose();
  }

  void _send() {
    setState(() {
      _toError = _to.text.trim().isEmpty ? 'Required' : null;
      _bodyError = _body.text.trim().isEmpty ? 'Required' : null;
    });
    if (_toError != null || _bodyError != null) return;
    widget.state.sendMessage(
      from: widget.state.userName,
      to: _to.text.trim(),
      subject: _subject.text.trim().isEmpty ? '(no subject)' : _subject.text.trim(),
      body: _body.text.trim(),
    );
    Navigator.of(context).pop();
  }

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    return Padding(
      padding: EdgeInsets.only(bottom: MediaQuery.viewInsetsOf(context).bottom),
      child: ConstrainedBox(
        constraints: BoxConstraints(maxHeight: MediaQuery.sizeOf(context).height * 0.85),
        child: SingleChildScrollView(
          padding: const EdgeInsets.fromLTRB(24, 8, 24, 24),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text('New Message', style: TextStyle(fontSize: 20, fontWeight: FontWeight.w700, color: scheme.onSurface)),
              const SizedBox(height: 16),
              CCFormField(
                label: 'To',
                required: true,
                error: _toError,
                child: CCInput(controller: _to, placeholder: 'Recipient name', error: _toError != null),
              ),
              const SizedBox(height: 16),
              CCFormField(
                label: 'Subject',
                child: CCInput(controller: _subject, placeholder: 'Subject'),
              ),
              const SizedBox(height: 16),
              CCFormField(
                label: 'Body',
                required: true,
                error: _bodyError,
                child: CCInput(controller: _body, placeholder: 'Write your message…', minLines: 6, maxLines: 10, error: _bodyError != null),
              ),
              const SizedBox(height: 20),
              Row(
                children: [
                  Expanded(
                    child: TapButton(
                      label: 'Cancel',
                      variant: TapButtonVariant.outline,
                      size: TapButtonSize.lg,
                      onPressed: () => Navigator.of(context).pop(),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: TapButton(label: 'Send', size: TapButtonSize.lg, onPressed: _send),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}
