import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:careconnect/models/app_state.dart';
import 'package:careconnect/screens/activity_screen.dart';

Widget _wrap(AppState state) => MaterialApp(home: ActivityScreen(state: state));

void main() {
  group('ActivityScreen — empty and list states', () {
    testWidgets('shows the empty state when there is no activity', (tester) async {
      final state = AppState();
      await tester.pumpWidget(_wrap(state));

      expect(find.text('No activity yet'), findsOneWidget);
    });

    testWidgets('renders one tile per activity entry with its description', (tester) async {
      final state = AppState()
        ..activity = [
          ActivityEntry(
            id: '1',
            type: ActivityType.medicationTaken,
            description: 'Amlodipine marked as taken',
            timestamp: '8:30 am',
          ),
          ActivityEntry(id: '2', type: ActivityType.checkedIn, description: 'Margaret checked in', timestamp: '8:00 am'),
        ];
      await tester.pumpWidget(_wrap(state));

      expect(find.text('Amlodipine marked as taken'), findsOneWidget);
      expect(find.text('Margaret checked in'), findsOneWidget);
    });
  });

  group('ActivityScreen — filtering', () {
    testWidgets('the "Medication taken" pill filters out non-matching entries', (tester) async {
      final state = AppState()
        ..activity = [
          ActivityEntry(id: '1', type: ActivityType.medicationTaken, description: 'Amlodipine taken', timestamp: '8:30 am'),
          ActivityEntry(id: '2', type: ActivityType.checkedIn, description: 'Margaret checked in', timestamp: '8:00 am'),
        ];
      await tester.pumpWidget(_wrap(state));

      // "Medication taken" also appears as the entry tile's own label, so
      // two widgets match this text; the filter pill renders first in the
      // widget tree (above the entries list), hence `.first`.
      await tester.tap(find.text('Medication taken').first);
      await tester.pumpAndSettle();

      expect(find.text('Amlodipine taken'), findsOneWidget);
      expect(find.text('Margaret checked in'), findsNothing);

      await tester.tap(find.text('All'));
      await tester.pumpAndSettle();

      expect(find.text('Amlodipine taken'), findsOneWidget);
      expect(find.text('Margaret checked in'), findsOneWidget);
    });
  });

  group('ActivityScreen — refresh', () {
    testWidgets('refresh adds a new entry and shows temporary confirmation text', (tester) async {
      final state = AppState();
      await tester.pumpWidget(_wrap(state));

      expect(state.activity, isEmpty);
      await tester.tap(find.text('↺ Refresh'));
      await tester.pump();

      expect(state.activity, hasLength(1));
      expect(find.text('✓ Refreshed!'), findsOneWidget);
      expect(find.text('↺ Refresh'), findsNothing);

      // The confirmation reverts after 2 seconds.
      await tester.pump(const Duration(seconds: 3));
      expect(find.text('↺ Refresh'), findsOneWidget);
    });
  });
}
