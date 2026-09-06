import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:careconnect/models/app_state.dart';
import 'package:careconnect/screens/medication_detail_screen.dart';
import 'package:careconnect/screens/medications_screen.dart';

import '../support/test_app.dart';

/// Reaches the detail screen the same way a user does: tapping a card on
/// the medications list, via buildTestApp's full route table (so Back and
/// the delete-triggered auto-pop have a real back stack to work with).
Future<void> _openFirstMedication(WidgetTester tester, AppState state) async {
  await tester.pumpWidget(buildTestApp(state, initialRoute: '/medications'));
  await tester.pumpAndSettle();
  await tester.tap(find.text('Amlodipine'));
  await tester.pumpAndSettle();
  expect(find.byType(MedicationDetailScreen), findsOneWidget);
}

void main() {
  group('MedicationDetailScreen — display', () {
    testWidgets('shows the medication dose, time, and notes', (tester) async {
      final state = AppState()
        ..medications = [
          Medication(id: 'm1', name: 'Amlodipine', dose: '5 mg — 1 tablet', time: '8:30 am', notes: 'Take with food.'),
        ];
      await _openFirstMedication(tester, state);

      expect(find.text('5 mg — 1 tablet'), findsOneWidget);
      expect(find.text('8:30 am'), findsOneWidget);
      expect(find.text('Take with food.'), findsOneWidget);
    });

    testWidgets('Back returns to the medications list', (tester) async {
      final state = AppState()
        ..medications = [Medication(id: 'm1', name: 'Amlodipine', dose: '5 mg', time: '8:30 am', notes: '')];
      await _openFirstMedication(tester, state);

      await tester.tap(find.text('Back'));
      await tester.pumpAndSettle();

      expect(find.byType(MedicationDetailScreen), findsNothing);
      expect(find.byType(MedicationsScreen), findsOneWidget);
    });
  });

  group('MedicationDetailScreen — mark as taken', () {
    testWidgets('tapping the toggle flips AppState and the button label', (tester) async {
      final state = AppState()
        ..medications = [Medication(id: 'm1', name: 'Amlodipine', dose: '5 mg', time: '8:30 am', notes: '')];
      await _openFirstMedication(tester, state);

      expect(find.text('Mark as taken'), findsOneWidget);
      await tester.tap(find.text('Mark as taken'));
      await tester.pumpAndSettle();

      expect(state.medications.first.taken, isTrue);
      expect(find.text('Mark as not taken'), findsOneWidget);
    });
  });

  group('MedicationDetailScreen — edit', () {
    testWidgets('Edit opens the form sheet prefilled and saving updates the detail view in place', (tester) async {
      final state = AppState()
        ..medications = [Medication(id: 'm1', name: 'Amlodipine', dose: '5 mg — 1 tablet', time: '8:30 am', notes: '')];
      await _openFirstMedication(tester, state);

      await tester.tap(find.text('✎ Edit'));
      await tester.pumpAndSettle();
      expect(find.text('Edit medication'), findsOneWidget);

      final doseField = find.byType(TextField).at(1);
      await tester.enterText(doseField, '10 mg — 1 tablet');
      await tester.ensureVisible(find.text('Save changes'));
      await tester.tap(find.text('Save changes'));
      await tester.pumpAndSettle();

      // Still on the detail screen -- editing preserves the medication's id
      // rather than deleting and re-adding it under a new one.
      expect(find.byType(MedicationDetailScreen), findsOneWidget);
      expect(state.medications, hasLength(1));
      expect(state.medications.first.id, 'm1');
      expect(state.medications.first.dose, '10 mg — 1 tablet');
      expect(find.text('10 mg — 1 tablet'), findsOneWidget);
    });
  });

  group('MedicationDetailScreen — delete', () {
    testWidgets('Delete asks for confirmation, then returns to the medications list', (tester) async {
      final state = AppState()
        ..medications = [Medication(id: 'm1', name: 'Amlodipine', dose: '5 mg', time: '8:30 am', notes: '')];
      await _openFirstMedication(tester, state);

      await tester.tap(find.text('🗑 Delete'));
      await tester.pumpAndSettle();
      expect(find.text('Delete medication?'), findsOneWidget);

      await tester.tap(find.text('Delete').last); // the destructive action inside the dialog
      await tester.pumpAndSettle();

      expect(state.medications, isEmpty);
      expect(find.byType(MedicationDetailScreen), findsNothing);
      expect(find.byType(MedicationsScreen), findsOneWidget);
    });
  });
}
