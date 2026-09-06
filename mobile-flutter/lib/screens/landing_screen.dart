import 'package:flutter/material.dart';

import '../models/app_state.dart';
import '../theme/tokens.dart';
import '../widgets/form_field.dart';
import '../widgets/tap_button.dart';

/// Landing / marketing screen with the assistant chat bubble — ported from
/// the Figma `LandingPage`.
class LandingScreen extends StatefulWidget {
  const LandingScreen({super.key, required this.state});

  final AppState state;

  @override
  State<LandingScreen> createState() => _LandingScreenState();
}

class _LandingScreenState extends State<LandingScreen> {
  bool _chatOpen = false;
  final _chatInput = TextEditingController();
  final List<({bool fromBot, String text})> _messages = [
    (
      fromBot: true,
      text:
          "Hi! I'm the CareConnect assistant. I can tell you what CareConnect does and help you get started with signing up or signing in. What would you like to know?",
    ),
  ];

  @override
  void dispose() {
    _chatInput.dispose();
    super.dispose();
  }

  void _send() {
    final text = _chatInput.text.trim();
    if (text.isEmpty) return;
    setState(() {
      _messages.add((fromBot: false, text: text));
      _messages.add((
        fromBot: true,
        text:
            "Great question! CareConnect helps caregivers and care recipients stay connected through medication reminders, appointment tracking, and daily check-ins. Would you like to sign up or sign in?",
      ));
      _chatInput.clear();
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: CCTokens.primaryLight,
      body: Stack(
        children: [
          SafeArea(
            child: Center(
              child: SingleChildScrollView(
                padding: const EdgeInsets.all(24),
                child: Container(
                  constraints: const BoxConstraints(maxWidth: 520),
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
                        decoration: BoxDecoration(
                          color: Colors.white.withValues(alpha: 0.15),
                          borderRadius: BorderRadius.circular(999),
                        ),
                        child: const Text(
                          '🤍 CareConnect',
                          style: TextStyle(color: Colors.white, fontSize: 14, fontWeight: FontWeight.w500),
                        ),
                      ),
                      const SizedBox(height: 16),
                      const Text(
                        'Your daily companion for calm, confident care.',
                        style: TextStyle(
                          fontSize: 38,
                          fontWeight: FontWeight.w800,
                          color: Colors.white,
                          height: 1.15,
                        ),
                      ),
                      const SizedBox(height: 16),
                      Text(
                        'For people who need a little help remembering, and the people who care for them.',
                        style: TextStyle(fontSize: 17, color: Colors.white.withValues(alpha: 0.85)),
                      ),
                      const SizedBox(height: 28),
                      TapButton(
                        label: "Get started — it's free →",
                        variant: TapButtonVariant.secondary,
                        size: TapButtonSize.lg,
                        fullWidth: true,
                        onPressed: () => Navigator.of(context).pushNamed('/signup'),
                      ),
                      const SizedBox(height: 12),
                      TapButton(
                        label: 'I already have an account',
                        variant: TapButtonVariant.ghost,
                        // Ghost buttons default to scheme.primary text, which
                        // is the exact teal this hero section's background
                        // is painted in -- without this override the button
                        // is fully invisible (correct tap target, no visible
                        // label). White reads correctly against the teal.
                        foregroundColor: Colors.white,
                        // Ghost buttons also have no border by default, which
                        // left this secondary CTA with no visible outline at
                        // all against the hero background -- add one so it
                        // reads as a tappable button, matching the design.
                        borderColor: Colors.white,
                        size: TapButtonSize.lg,
                        fullWidth: true,
                        onPressed: () => Navigator.of(context).pushNamed('/signin'),
                      ),
                    ],
                  ),
                ),
              ),
            ),
          ),
          // Chat trigger bubble
          Positioned(
            right: 20,
            bottom: 24,
            child: SizedBox(
              width: 56,
              height: 56,
              child: FloatingActionButton(
                backgroundColor: Theme.of(context).colorScheme.onSurface,
                foregroundColor: Colors.white,
                tooltip: 'Open assistant chat',
                onPressed: () => setState(() => _chatOpen = true),
                child: const Icon(Icons.chat_bubble_outline, size: 26),
              ),
            ),
          ),
          if (_chatOpen) _buildChatPanel(),
        ],
      ),
    );
  }

  Widget _buildChatPanel() {
    final scheme = Theme.of(context).colorScheme;
    return Positioned(
      left: 16,
      right: 16,
      bottom: 16,
      child: Material(
        color: scheme.surface,
        borderRadius: BorderRadius.circular(16),
        elevation: 8,
        child: Container(
          constraints: const BoxConstraints(maxHeight: 420),
          padding: const EdgeInsets.all(12),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Row(
                children: [
                  CircleAvatar(
                    radius: 14,
                    backgroundColor: scheme.primary,
                    child: const Icon(Icons.smart_toy_outlined, size: 16, color: Colors.white),
                  ),
                  const SizedBox(width: 8),
                  const Expanded(
                    child: Text('CareConnect Assistant', style: TextStyle(fontWeight: FontWeight.w600, fontSize: 14)),
                  ),
                  IconButton(
                    icon: const Icon(Icons.close, size: 18),
                    tooltip: 'Close chat',
                    onPressed: () => setState(() => _chatOpen = false),
                  ),
                ],
              ),
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 4),
                child: Align(
                  alignment: Alignment.centerLeft,
                  child: Text(
                    'I can explain CareConnect and help you get started. I cannot give medical advice.',
                    style: TextStyle(fontSize: 11, color: scheme.onSurfaceVariant),
                  ),
                ),
              ),
              Flexible(
                child: ListView.builder(
                  shrinkWrap: true,
                  itemCount: _messages.length,
                  itemBuilder: (ctx, i) {
                    final m = _messages[i];
                    return Align(
                      alignment: m.fromBot ? Alignment.centerLeft : Alignment.centerRight,
                      child: Container(
                        margin: const EdgeInsets.symmetric(vertical: 4, horizontal: 4),
                        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                        constraints: const BoxConstraints(maxWidth: 300),
                        decoration: BoxDecoration(
                          color: m.fromBot ? scheme.surfaceContainerHighest : scheme.primary,
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: Text(
                          m.text,
                          style: TextStyle(fontSize: 13, color: m.fromBot ? scheme.onSurface : scheme.onPrimary),
                        ),
                      ),
                    );
                  },
                ),
              ),
              const SizedBox(height: 8),
              Row(
                children: [
                  Expanded(
                    child: CCInput(
                      controller: _chatInput,
                      placeholder: 'Ask a question...',
                      onSubmitted: (_) => _send(),
                    ),
                  ),
                  const SizedBox(width: 8),
                  SizedBox(
                    width: 48,
                    height: 48,
                    child: IconButton.filled(
                      icon: const Icon(Icons.send, size: 18),
                      tooltip: 'Send message',
                      onPressed: _send,
                    ),
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
