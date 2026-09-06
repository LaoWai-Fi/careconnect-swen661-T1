import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:careconnect/models/app_state.dart';
import 'package:careconnect/screens/archived_messages_screen.dart';
import 'package:careconnect/screens/message_detail_screen.dart';

import '../support/test_app.dart';

/// MessagesScreen pushes a named route ('/messages/detail') to open a
/// message, so it needs the full route table from buildTestApp. The
/// read/unread dot toggle also calls `state.toggleMessageRead` with no
/// local `setState`, hence the ListenableBuilder -- see the note in
/// medications_screen_test.dart for why that's needed when testing a
/// screen in isolation from the app's root Provider watcher.
Widget _wrap(AppState state) {
  return ListenableBuilder(
    listenable: state,
    builder: (context, _) => buildTestApp(state, initialRoute: '/messages'),
  );
}

void main() {
  group('MessagesScreen — empty and list states', () {
    testWidgets('shows the empty state when there are no messages', (tester) async {
      final state = AppState();
      await tester.pumpWidget(_wrap(state));

      expect(find.text('No messages yet'), findsOneWidget);
    });

    testWidgets('archived messages are excluded from the list', (tester) async {
      final state = AppState()
        ..messages = [
          Message(id: '1', from: 'Dr. Sharma', to: 'Maria', subject: 'Visible', body: 'b', timestamp: 't'),
          Message(id: '2', from: 'Dr. Sharma', to: 'Maria', subject: 'Hidden', body: 'b', timestamp: 't', archived: true),
        ];
      await tester.pumpWidget(_wrap(state));

      expect(find.text('Visible'), findsOneWidget);
      expect(find.text('Hidden'), findsNothing);
    });
  });

  group('MessagesScreen — read/unread toggle', () {
    testWidgets('tapping the dot flips read state without opening the message', (tester) async {
      // The read-dot's tap target is exposed only via a Semantics label (no
      // visible text, no Tooltip), so this needs the semantics tree enabled
      // to find it by that label. Disposed explicitly at the end of the
      // test rather than via addTearDown: the test framework's "no leaked
      // SemanticsHandle" check runs before addTearDown callbacks fire, so
      // addTearDown alone reports a false leak here.
      final handle = tester.ensureSemantics();

      final state = seededTestState();
      await tester.pumpWidget(_wrap(state));
      await tester.pumpAndSettle();

      expect(state.messages.firstWhere((m) => m.id == 'msg1').read, isFalse);
      await tester.tap(find.bySemanticsLabel('Mark message from Dr. Sharma as read'));
      await tester.pump();

      expect(state.messages.firstWhere((m) => m.id == 'msg1').read, isTrue);
      // Still on the list -- toggling the dot must not navigate away.
      expect(find.byType(MessageDetailScreen), findsNothing);

      handle.dispose();
    });
  });

  group('MessagesScreen — compose', () {
    testWidgets('New Message: filling To and Body and sending adds it to the list', (tester) async {
      final state = AppState()..userName = 'Dom Puller';
      await tester.pumpWidget(_wrap(state));

      await tester.tap(find.text('New Message'));
      await tester.pumpAndSettle();
      expect(find.text('Send'), findsOneWidget); // confirms the compose sheet opened

      final fields = find.byType(TextField);
      // Order in _ComposeSheet: to, subject, body.
      await tester.enterText(fields.at(0), 'Dr. Sharma');
      await tester.enterText(fields.at(1), 'Question about dosage');
      await tester.enterText(fields.at(2), 'Should Margaret take this before or after food?');
      await tester.pumpAndSettle();

      await tester.tap(find.text('Send'));
      await tester.pumpAndSettle();

      expect(state.messages, hasLength(1));
      expect(state.messages.first.to, 'Dr. Sharma');
      expect(state.messages.first.subject, 'Question about dosage');
      // The sender is whoever is actually signed in, not a hardcoded demo
      // name.
      expect(state.messages.first.from, 'Dom Puller');
      expect(find.text('Question about dosage'), findsOneWidget);
    });

    testWidgets('sending with empty To and Body shows validation errors', (tester) async {
      final state = AppState();
      await tester.pumpWidget(_wrap(state));

      await tester.tap(find.text('New Message'));
      await tester.pumpAndSettle();
      await tester.tap(find.text('Send'));
      await tester.pumpAndSettle();

      expect(find.text('Required'), findsNWidgets(2));
      expect(state.messages, isEmpty);
    });
  });

  group('MessagesScreen — opening a message', () {
    testWidgets('tapping a row navigates to the detail screen and marks it read', (tester) async {
      final state = seededTestState();
      await tester.pumpWidget(_wrap(state));
      await tester.pumpAndSettle();

      expect(state.messages.firstWhere((m) => m.id == 'msg1').read, isFalse);
      await tester.tap(find.text('Blood pressure results'));
      await tester.pumpAndSettle();

      expect(find.byType(MessageDetailScreen), findsOneWidget);
      expect(state.messages.firstWhere((m) => m.id == 'msg1').read, isTrue);
    });
  });

  group('MessagesScreen — archived messages entry point', () {
    testWidgets('the archive button has no count badge and opens the archived list', (tester) async {
      final state = AppState()
        ..messages = [
          Message(id: '1', from: 'Dr. Sharma', to: 'Maria', subject: 'Visible', body: 'b', timestamp: 't'),
          Message(id: '2', from: 'Dr. Sharma', to: 'Maria', subject: 'Hidden', body: 'b', timestamp: 't', archived: true),
        ];
      await tester.pumpWidget(_wrap(state));
      await tester.pumpAndSettle();

      // Unlike the unread-message count, an archived count can't be
      // "cleared" by the user, so the archive button intentionally has no
      // Badge -- just a plain icon.
      expect(
        find.descendant(of: find.byWidgetPredicate((w) => w is IconButton && w.tooltip == 'View archived messages'), matching: find.byType(Badge)),
        findsNothing,
      );

      await tester.tap(find.byIcon(Icons.archive_outlined));
      await tester.pumpAndSettle();

      expect(find.byType(ArchivedMessagesScreen), findsOneWidget);
      expect(find.text('Hidden'), findsOneWidget);
      expect(find.text('Visible'), findsNothing);
    });
  });
}
