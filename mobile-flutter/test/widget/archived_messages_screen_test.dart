import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:careconnect/models/app_state.dart';
import 'package:careconnect/screens/archived_messages_screen.dart';
import 'package:careconnect/screens/message_detail_screen.dart';
import 'package:careconnect/screens/messages_screen.dart';

import '../support/test_app.dart';

/// Reaches the archived list the same way a user does: via the archive
/// icon button in the Messages screen's header, using buildTestApp's full
/// route table so Back and unarchive-triggered navigation have a real
/// back stack to work with.
Future<void> _openArchivedList(WidgetTester tester, AppState state) async {
  await tester.pumpWidget(buildTestApp(state, initialRoute: '/messages'));
  await tester.pumpAndSettle();
  await tester.tap(find.byIcon(Icons.archive_outlined));
  await tester.pumpAndSettle();
  expect(find.byType(ArchivedMessagesScreen), findsOneWidget);
}

void main() {
  group('ArchivedMessagesScreen — display', () {
    testWidgets('shows the empty state when nothing is archived', (tester) async {
      final state = seededTestState(); // seeded messages are not archived
      await _openArchivedList(tester, state);

      expect(find.text('No archived messages'), findsOneWidget);
    });

    testWidgets('lists only archived messages, not active ones', (tester) async {
      final state = AppState()
        ..messages = [
          Message(id: '1', from: 'Dr. Sharma', to: 'Maria', subject: 'Visible', body: 'b', timestamp: 't'),
          Message(id: '2', from: 'Dr. Sharma', to: 'Maria', subject: 'Hidden', body: 'b', timestamp: 't', archived: true),
        ];
      await _openArchivedList(tester, state);

      expect(find.text('Hidden'), findsOneWidget);
      expect(find.text('Visible'), findsNothing);
    });

    testWidgets('Back returns to the messages list', (tester) async {
      final state = AppState()
        ..messages = [
          Message(id: '1', from: 'Dr. Sharma', to: 'Maria', subject: 'Hidden', body: 'b', timestamp: 't', archived: true),
        ];
      await _openArchivedList(tester, state);

      await tester.tap(find.text('Back'));
      await tester.pumpAndSettle();

      expect(find.byType(ArchivedMessagesScreen), findsNothing);
      expect(find.byType(MessagesScreen), findsOneWidget);
    });
  });

  group('ArchivedMessagesScreen — unarchive', () {
    testWidgets('opening an archived message offers Unarchive, and it restores the message to the inbox', (tester) async {
      final state = AppState()
        ..messages = [
          Message(id: '1', from: 'Dr. Sharma', to: 'Maria', subject: 'Hidden', body: 'b', timestamp: 't', archived: true),
        ];
      await _openArchivedList(tester, state);

      await tester.tap(find.text('Hidden'));
      await tester.pumpAndSettle();

      expect(find.byType(MessageDetailScreen), findsOneWidget);
      expect(find.text('Unarchive'), findsOneWidget);
      expect(find.text('Archive'), findsNothing);

      await tester.tap(find.text('Unarchive'));
      await tester.pumpAndSettle();

      expect(state.messages.first.archived, isFalse);
      // Popped back to the archived list (now empty), not left on the
      // detail screen.
      expect(find.byType(ArchivedMessagesScreen), findsOneWidget);
      expect(find.text('No archived messages'), findsOneWidget);

      // And it's visible again from the main inbox.
      await tester.tap(find.text('Back'));
      await tester.pumpAndSettle();
      expect(find.byType(MessagesScreen), findsOneWidget);
      expect(find.text('Hidden'), findsOneWidget);
    });
  });
}
