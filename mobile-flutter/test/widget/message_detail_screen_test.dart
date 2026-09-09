import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:careconnect/models/app_state.dart';
import 'package:careconnect/screens/message_detail_screen.dart';
import 'package:careconnect/screens/messages_screen.dart';

import '../support/test_app.dart';

/// Archive and Delete both call `Navigator.of(context).pop()`, so the
/// detail screen needs a real back stack under it (a bare
/// `MaterialApp(home: MessageDetailScreen(...))` has nowhere to pop to).
/// Each test below reaches the detail screen the same way a user does: from
/// the messages list, via buildTestApp's full route table.
Future<void> _openFirstMessage(WidgetTester tester, AppState state) async {
  await tester.pumpWidget(buildTestApp(state, initialRoute: '/messages'));
  await tester.pumpAndSettle();
  await tester.tap(find.text('Blood pressure results'));
  await tester.pumpAndSettle();
  expect(find.byType(MessageDetailScreen), findsOneWidget);
}

void main() {
  group('MessageDetailScreen — reply', () {
    testWidgets('Reply opens a compose sheet prefilled with the sender and subject', (tester) async {
      final state = seededTestState();
      await _openFirstMessage(tester, state);

      await tester.tap(find.text('Reply'));
      await tester.pumpAndSettle();

      final toField = tester.widget<TextField>(find.byType(TextField).at(0));
      final subjectField = tester.widget<TextField>(find.byType(TextField).at(1));
      expect(toField.controller!.text, 'Dr. Sharma');
      expect(subjectField.controller!.text, 'Re: Blood pressure results');

      await tester.tap(find.text('Send'));
      await tester.pumpAndSettle();

      expect(state.messages, hasLength(3)); // 2 seeded + the reply
      expect(state.messages.first.subject, 'Re: Blood pressure results');
    });
  });

  group('MessageDetailScreen — archive', () {
    testWidgets('Archive marks the message archived and returns to the list', (tester) async {
      final state = seededTestState();
      await _openFirstMessage(tester, state);

      await tester.tap(find.text('Archive'));
      await tester.pumpAndSettle();

      expect(find.byType(MessagesScreen), findsOneWidget);
      expect(find.byType(MessageDetailScreen), findsNothing);
      expect(state.messages.firstWhere((m) => m.id == 'msg1').archived, isTrue);
      // Archived messages don't show in the active list.
      expect(find.text('Blood pressure results'), findsNothing);
    });
  });

  group('MessageDetailScreen — delete', () {
    testWidgets('Delete asks for confirmation before removing the message', (tester) async {
      final state = seededTestState();
      await _openFirstMessage(tester, state);

      await tester.tap(find.text('Delete'));
      await tester.pumpAndSettle();
      expect(find.text('Delete message?'), findsOneWidget);

      // Cancel keeps the message and stays on the detail screen.
      await tester.tap(find.text('Cancel'));
      await tester.pumpAndSettle();
      expect(state.messages, hasLength(2));
      expect(find.byType(MessageDetailScreen), findsOneWidget);

      await tester.tap(find.text('Delete'));
      await tester.pumpAndSettle();
      await tester.tap(find.text('Delete').last); // the destructive action inside the dialog
      await tester.pumpAndSettle();

      expect(state.messages, hasLength(1));
      expect(find.byType(MessagesScreen), findsOneWidget);
    });
  });
}
