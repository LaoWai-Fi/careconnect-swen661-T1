import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:careconnect/models/app_state.dart';
import 'package:careconnect/screens/appointment_detail_screen.dart';
import 'package:careconnect/screens/appointments_screen.dart';
import 'package:careconnect/widgets/tap_button.dart';

import '../support/test_app.dart';

/// Reaches the detail screen the same way a user does: tapping a card on
/// the appointments list, via buildTestApp's full route table (so Back and
/// the delete-triggered auto-pop have a real back stack to work with).
Future<void> _openFirstAppointment(WidgetTester tester, AppState state) async {
  await tester.pumpWidget(buildTestApp(state, initialRoute: '/appointments'));
  await tester.pumpAndSettle();
  await tester.tap(find.text('Eye test'));
  await tester.pumpAndSettle();
  expect(find.byType(AppointmentDetailScreen), findsOneWidget);
}

void main() {
  group('AppointmentDetailScreen — display', () {
    testWidgets('shows the date/time, location, assignee, and notes', (tester) async {
      final state = AppState()
        ..appointments = [
          Appointment(
            id: 'a1',
            title: 'Eye test',
            dateTime: 'Friday 18 July — 11:00 am',
            location: 'Vision Plus Opticians',
            assignee: 'Maria Thompson',
            notes: 'Routine yearly eye test.',
          ),
        ];
      await _openFirstAppointment(tester, state);

      expect(find.text('Friday 18 July — 11:00 am'), findsOneWidget);
      expect(find.text('Vision Plus Opticians'), findsOneWidget);
      expect(find.text('Maria Thompson is assigned'), findsOneWidget);
      expect(find.text('Routine yearly eye test.'), findsOneWidget);
    });

    testWidgets('Back returns to the appointments list', (tester) async {
      final state = AppState()
        ..appointments = [Appointment(id: 'a1', title: 'Eye test', dateTime: 'Fri', location: 'Vision Plus', notes: '')];
      await _openFirstAppointment(tester, state);

      await tester.tap(find.text('Back'));
      await tester.pumpAndSettle();

      expect(find.byType(AppointmentDetailScreen), findsNothing);
      expect(find.byType(AppointmentsScreen), findsOneWidget);
    });
  });

  group('AppointmentDetailScreen — edit', () {
    testWidgets('Edit opens the form sheet prefilled and saving updates the detail view in place', (tester) async {
      final state = AppState()
        ..appointments = [Appointment(id: 'a1', title: 'Eye test', dateTime: 'Fri', location: 'Vision Plus', notes: '')];
      await _openFirstAppointment(tester, state);

      await tester.tap(find.text('✎ Edit'));
      await tester.pumpAndSettle();
      expect(find.text('Edit appointment'), findsOneWidget);

      await tester.enterText(find.byType(TextField).at(0), 'Eye test — follow up');
      await tester.ensureVisible(find.text('Save changes'));
      await tester.tap(find.text('Save changes'));
      await tester.pumpAndSettle();

      expect(find.byType(AppointmentDetailScreen), findsOneWidget);
      expect(state.appointments, hasLength(1));
      expect(state.appointments.first.id, 'a1');
      expect(find.text('Eye test — follow up'), findsOneWidget);
    });
  });

  group('AppointmentDetailScreen — delete', () {
    testWidgets('Delete asks for confirmation, then removes the appointment and returns to the list', (tester) async {
      final state = AppState()
        ..appointments = [Appointment(id: 'a1', title: 'Eye test', dateTime: 'Fri', location: 'Vision Plus', notes: '')];
      await _openFirstAppointment(tester, state);

      await tester.tap(find.text('🗑 Delete'));
      await tester.pumpAndSettle();

      // Confirm dialog showing; nothing deleted yet.
      expect(state.appointments, isNotEmpty);
      expect(find.text('Delete appointment?'), findsOneWidget);

      await tester.tap(find.widgetWithText(TapButton, 'Delete'));
      await tester.pumpAndSettle();

      expect(state.appointments, isEmpty);
      expect(find.byType(AppointmentDetailScreen), findsNothing);
      expect(find.byType(AppointmentsScreen), findsOneWidget);
    });
  });
}
