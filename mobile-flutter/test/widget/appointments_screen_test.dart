import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:careconnect/models/app_state.dart';
import 'package:careconnect/screens/appointments_screen.dart';
import 'package:careconnect/widgets/tap_button.dart';

/// See the identical helper in medications_screen_test.dart for why this
/// ListenableBuilder wrapper is needed: some actions here (deleting an
/// appointment) call `state.xxx()` with no local `setState` of their own,
/// and rely on an ancestor listening to AppState to trigger the rebuild --
/// normally the root Provider watcher in main.dart, reproduced here for a
/// screen tested in isolation. Also wrapped in a bare [Scaffold] so the
/// card's tap-to-open-detail [InkWell] has the [Material] ancestor it
/// requires (AppShell's own Scaffold provides this in the real app).
Widget _wrap(AppState state) {
  return ListenableBuilder(
    listenable: state,
    builder: (context, _) => MaterialApp(home: Scaffold(body: AppointmentsScreen(state: state))),
  );
}

void main() {
  group('AppointmentsScreen — empty and list states', () {
    testWidgets('shows the empty state when there are no appointments', (tester) async {
      final state = AppState();
      await tester.pumpWidget(_wrap(state));

      expect(find.text('No appointments yet'), findsOneWidget);
    });

    testWidgets('renders a card per appointment with its title and location', (tester) async {
      final state = AppState()
        ..appointments = [
          Appointment(
            id: 'a1',
            title: 'Blood pressure check — Dr. Sharma',
            dateTime: 'Today — 10:30 am',
            location: 'Greenfield Surgery',
            notes: '',
          ),
        ];
      await tester.pumpWidget(_wrap(state));

      expect(find.text('Blood pressure check — Dr. Sharma'), findsOneWidget);
      expect(find.text('Greenfield Surgery'), findsOneWidget);
    });

    testWidgets('shows the assigned caregiver banner only when one is set', (tester) async {
      final state = AppState()
        ..appointments = [
          Appointment(id: 'a1', title: 'Eye test', dateTime: 'Fri', location: 'Vision Plus', notes: ''),
          Appointment(
            id: 'a2',
            title: 'Annual review',
            dateTime: 'Mon',
            location: 'Greenfield Surgery',
            notes: '',
            assignee: 'Maria Thompson',
          ),
        ];
      await tester.pumpWidget(_wrap(state));

      expect(find.text('Maria Thompson is assigned'), findsOneWidget);
    });
  });

  group('AppointmentsScreen — add flow', () {
    testWidgets('submitting with empty required fields shows validation errors', (tester) async {
      final state = AppState();
      await tester.pumpWidget(_wrap(state));

      await tester.tap(find.text('+ Add'));
      await tester.pumpAndSettle();
      // 'Add appointment' matches both the sheet's header and its submit
      // button; .last is the button, which is declared after the header.
      await tester.ensureVisible(find.text('Add appointment').last);
      await tester.tap(find.text('Add appointment').last);
      await tester.pumpAndSettle();

      // Title, date/time, and location are all required.
      expect(find.text('Required'), findsNWidgets(3));
      expect(state.appointments, isEmpty);
    });

    testWidgets('filling the required fields adds the appointment', (tester) async {
      final state = AppState();
      await tester.pumpWidget(_wrap(state));

      await tester.tap(find.text('+ Add'));
      await tester.pumpAndSettle();

      final fields = find.byType(TextField);
      // Order in _ApptFormSheet: title, dateTime, location, assignee, notes.
      await tester.enterText(fields.at(0), 'Eye test');
      await tester.enterText(fields.at(1), 'Friday 18 July — 11:00 am');
      await tester.enterText(fields.at(2), 'Vision Plus Opticians');
      await tester.pumpAndSettle();

      // 'Add appointment' matches both the sheet's header and its submit
      // button; .last is the button, which is declared after the header.
      await tester.ensureVisible(find.text('Add appointment').last);
      await tester.tap(find.text('Add appointment').last);
      await tester.pumpAndSettle();

      expect(state.appointments, hasLength(1));
      expect(state.appointments.first.title, 'Eye test');
      expect(find.text('Eye test'), findsOneWidget);
    });
  });

  group('AppointmentsScreen — edit flow', () {
    testWidgets('editing an appointment updates its displayed title', (tester) async {
      final state = AppState()
        ..appointments = [
          Appointment(id: 'a1', title: 'Old title', dateTime: 'Mon', location: 'Clinic', notes: ''),
        ];
      await tester.pumpWidget(_wrap(state));

      await tester.tap(find.text('✎ Edit'));
      await tester.pumpAndSettle();
      expect(find.text('Edit appointment'), findsOneWidget);

      await tester.enterText(find.byType(TextField).at(0), 'New title');
      await tester.ensureVisible(find.text('Save changes'));
      await tester.tap(find.text('Save changes'));
      await tester.pumpAndSettle();

      expect(state.appointments.first.title, 'New title');
      expect(find.text('New title'), findsOneWidget);
      expect(find.text('Old title'), findsNothing);
    });
  });

  group('AppointmentsScreen — delete', () {
    testWidgets('deleting an appointment asks for confirmation first, then removes it', (tester) async {
      final state = AppState()
        ..appointments = [
          Appointment(id: 'a1', title: 'Eye test', dateTime: 'Fri', location: 'Vision Plus', notes: ''),
        ];
      await tester.pumpWidget(_wrap(state));

      await tester.tap(find.text('🗑 Delete'));
      await tester.pumpAndSettle();

      // The confirm dialog is showing; nothing deleted yet.
      expect(state.appointments, isNotEmpty);
      expect(find.text('Delete appointment?'), findsOneWidget);

      await tester.tap(find.widgetWithText(TapButton, 'Delete'));
      await tester.pumpAndSettle();

      expect(state.appointments, isEmpty);
      expect(find.text('Eye test'), findsNothing);
      expect(find.text('No appointments yet'), findsOneWidget);
    });

    testWidgets('cancelling the delete confirmation keeps the appointment', (tester) async {
      final state = AppState()
        ..appointments = [
          Appointment(id: 'a1', title: 'Eye test', dateTime: 'Fri', location: 'Vision Plus', notes: ''),
        ];
      await tester.pumpWidget(_wrap(state));

      await tester.tap(find.text('🗑 Delete'));
      await tester.pumpAndSettle();

      await tester.tap(find.widgetWithText(TapButton, 'Cancel'));
      await tester.pumpAndSettle();

      expect(state.appointments, isNotEmpty);
      expect(find.text('Eye test'), findsOneWidget);
    });
  });
}
