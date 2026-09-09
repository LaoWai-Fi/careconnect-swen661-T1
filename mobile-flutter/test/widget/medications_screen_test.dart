import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:careconnect/models/app_state.dart';
import 'package:careconnect/screens/medications_screen.dart';

/// Wraps the screen in a [ListenableBuilder] listening to [state] -- the
/// same trick `message_detail_screen.dart` uses internally. In the real
/// app, an AppState change is what triggers this rebuild via the root
/// `context.watch<AppState>()` in main.dart cascading down through the
/// Navigator; screens reached in isolation here (no Navigator, no
/// Provider ancestor) need the same rebuild trigger reproduced directly so
/// that actions like the "mark as taken" toggle -- which call a plain
/// `state.toggleMedTaken(...)` with no local `setState` of their own --
/// are reflected in the widget tree the way they are in the running app.
///
/// Wrapped in a bare [Scaffold] (rather than `MaterialApp(home: ...)`
/// directly) because a card's tap-to-open-detail area is an [InkWell],
/// which requires a [Material] ancestor to paint into -- in the real app
/// that's provided by AppShell's own Scaffold, which this isolated-screen
/// harness doesn't include otherwise.
Widget _wrap(AppState state) {
  return ListenableBuilder(
    listenable: state,
    builder: (context, _) => MaterialApp(home: Scaffold(body: MedicationsScreen(state: state))),
  );
}

void main() {
  group('MedicationsScreen — empty and list states', () {
    testWidgets('shows the empty state when there are no medications', (tester) async {
      final state = AppState();
      await tester.pumpWidget(_wrap(state));

      expect(find.text('No medications yet'), findsOneWidget);
    });

    testWidgets('renders a card per medication with its name and dose', (tester) async {
      final state = AppState()
        ..medications = [
          Medication(id: 'm1', name: 'Amlodipine', dose: '5 mg — 1 tablet', time: '8:30 am', notes: ''),
          Medication(id: 'm2', name: 'Metformin', dose: '500 mg — 1 tablet', time: '8:30 am', notes: '', taken: true),
        ];
      await tester.pumpWidget(_wrap(state));

      expect(find.text('Amlodipine'), findsOneWidget);
      expect(find.text('5 mg — 1 tablet'), findsOneWidget);
      expect(find.text('Metformin'), findsOneWidget);
      expect(find.text('No medications yet'), findsNothing);
    });
  });

  group('MedicationsScreen — add flow', () {
    testWidgets('tapping Add opens the form sheet', (tester) async {
      final state = AppState();
      await tester.pumpWidget(_wrap(state));

      await tester.tap(find.text('+ Add'));
      await tester.pumpAndSettle();

      expect(find.text('Add new medication'), findsOneWidget);
    });

    testWidgets('submitting with empty required fields shows validation errors and adds nothing', (tester) async {
      final state = AppState();
      await tester.pumpWidget(_wrap(state));

      await tester.tap(find.text('+ Add'));
      await tester.pumpAndSettle();
      await tester.ensureVisible(find.text('Add medication'));
      await tester.tap(find.text('Add medication'));
      await tester.pumpAndSettle();

      // Name and dose are both required and both empty -> two errors.
      expect(find.text('Required'), findsNWidgets(2));
      expect(state.medications, isEmpty);
    });

    testWidgets('filling the form and saving adds the medication and closes the sheet', (tester) async {
      final state = AppState();
      await tester.pumpWidget(_wrap(state));

      await tester.tap(find.text('+ Add'));
      await tester.pumpAndSettle();

      final fields = find.byType(TextField);
      // Order in _MedFormSheet: name, dose, time, notes.
      await tester.enterText(fields.at(0), 'Ibuprofen');
      await tester.enterText(fields.at(1), '200 mg — 1 tablet');
      await tester.pumpAndSettle();

      await tester.ensureVisible(find.text('Add medication'));
      await tester.tap(find.text('Add medication'));
      await tester.pumpAndSettle();

      expect(state.medications, hasLength(1));
      expect(state.medications.first.name, 'Ibuprofen');
      expect(find.text('Add new medication'), findsNothing);
      expect(find.text('Ibuprofen'), findsOneWidget);
    });
  });

  group('MedicationsScreen — edit flow', () {
    testWidgets('editing a medication updates its displayed dose', (tester) async {
      final state = AppState()
        ..medications = [
          Medication(id: 'm1', name: 'Amlodipine', dose: '5 mg — 1 tablet', time: '8:30 am', notes: ''),
        ];
      await tester.pumpWidget(_wrap(state));

      await tester.tap(find.text('✎ Edit'));
      await tester.pumpAndSettle();
      expect(find.text('Edit medication'), findsOneWidget);

      final doseField = find.byType(TextField).at(1);
      await tester.enterText(doseField, '10 mg — 1 tablet');
      await tester.ensureVisible(find.text('Save changes'));
      await tester.tap(find.text('Save changes'));
      await tester.pumpAndSettle();

      expect(state.medications, hasLength(1));
      expect(state.medications.first.dose, '10 mg — 1 tablet');
      expect(find.text('10 mg — 1 tablet'), findsOneWidget);
    });
  });

  group('MedicationsScreen — delete flow', () {
    testWidgets('delete asks for confirmation; Cancel keeps the medication', (tester) async {
      final state = AppState()
        ..medications = [Medication(id: 'm1', name: 'Amlodipine', dose: '5 mg', time: '8:30 am', notes: '')];
      await tester.pumpWidget(_wrap(state));

      await tester.tap(find.text('🗑 Delete'));
      await tester.pumpAndSettle();
      expect(find.text('Delete medication?'), findsOneWidget);

      await tester.tap(find.text('Cancel'));
      await tester.pumpAndSettle();

      expect(state.medications, hasLength(1));
      expect(find.text('Delete medication?'), findsNothing);
    });

    testWidgets('confirming delete removes the medication', (tester) async {
      final state = AppState()
        ..medications = [Medication(id: 'm1', name: 'Amlodipine', dose: '5 mg', time: '8:30 am', notes: '')];
      await tester.pumpWidget(_wrap(state));

      await tester.tap(find.text('🗑 Delete'));
      await tester.pumpAndSettle();
      await tester.tap(find.text('Delete'));
      await tester.pumpAndSettle();

      expect(state.medications, isEmpty);
      expect(find.text('No medications yet'), findsOneWidget);
    });
  });

  group('MedicationsScreen — mark taken', () {
    testWidgets('tapping the taken toggle flips AppState and the button tooltip', (tester) async {
      final state = AppState()
        ..medications = [Medication(id: 'm1', name: 'Amlodipine', dose: '5 mg', time: '8:30 am', notes: '')];
      await tester.pumpWidget(_wrap(state));

      expect(find.byTooltip('Mark as taken'), findsOneWidget);
      await tester.tap(find.byTooltip('Mark as taken'));
      await tester.pumpAndSettle();

      expect(state.medications.first.taken, isTrue);
      expect(find.byTooltip('Mark as not taken'), findsOneWidget);

      // Let the transient "✓ Taken!" confirmation's clear-timer finish so
      // no timer is pending when the test ends.
      await tester.pump(const Duration(seconds: 4));
      await tester.pumpAndSettle();
    });

    testWidgets('marking as taken shows a transient "✓ Taken!" confirmation that self-clears', (tester) async {
      final state = AppState()
        ..medications = [Medication(id: 'm1', name: 'Amlodipine', dose: '5 mg', time: '8:30 am', notes: '')];
      await tester.pumpWidget(_wrap(state));

      expect(find.text('✓ Taken!'), findsNothing);
      await tester.tap(find.byTooltip('Mark as taken'));
      await tester.pumpAndSettle();

      // Inline confirmation appears next to the action...
      expect(find.text('✓ Taken!'), findsOneWidget);

      // ...and clears itself after ~3s.
      await tester.pump(const Duration(seconds: 4));
      await tester.pumpAndSettle();
      expect(find.text('✓ Taken!'), findsNothing);
    });

    testWidgets('unmarking a taken medication shows no confirmation', (tester) async {
      final state = AppState()
        ..medications = [
          Medication(id: 'm1', name: 'Amlodipine', dose: '5 mg', time: '8:30 am', notes: '', taken: true),
        ];
      await tester.pumpWidget(_wrap(state));

      await tester.tap(find.byTooltip('Mark as not taken'));
      await tester.pumpAndSettle();

      expect(state.medications.first.taken, isFalse);
      expect(find.text('✓ Taken!'), findsNothing);
    });
  });
}
