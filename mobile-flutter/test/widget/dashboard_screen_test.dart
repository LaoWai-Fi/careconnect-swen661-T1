import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:careconnect/models/app_state.dart';
import 'package:careconnect/screens/appointment_detail_screen.dart';
import 'package:careconnect/screens/medications_screen.dart';
import 'package:careconnect/widgets/cards.dart';

import '../support/test_app.dart';

/// DashboardScreen navigates with `Navigator.of(context).pushReplacementNamed`
/// (e.g. the "View all" links), so it needs a real route table to be
/// testable, not just `MaterialApp(home: ...)`. It also has interactions
/// (the medication tile tap) that call `state.toggleMedTaken` with no local
/// `setState`, so this is wrapped in a ListenableBuilder too -- see the note
/// in medications_screen_test.dart.
Widget _wrap(AppState state) {
  return ListenableBuilder(
    listenable: state,
    builder: (context, _) => buildTestApp(state, initialRoute: '/dashboard'),
  );
}

void main() {
  group('DashboardScreen — header and task counter', () {
    testWidgets('shows the task counter reflecting taken meds and check-in', (tester) async {
      final state = seededTestState();
      await tester.pumpWidget(_wrap(state));
      await tester.pumpAndSettle();

      // 2 medications seeded (1 taken), check-in not done -> 1 of 3.
      expect(find.text('1 of 3 tasks done'), findsOneWidget);
    });
  });

  group('DashboardScreen — check-in', () {
    testWidgets('tapping the Check-in card records the check-in and shows temporary feedback', (tester) async {
      final state = seededTestState();
      await tester.pumpWidget(_wrap(state));
      await tester.pumpAndSettle();

      expect(state.checkedIn, isFalse);
      await tester.tap(find.text('Not yet'));
      await tester.pump();

      expect(state.checkedIn, isTrue);
      expect(find.text('✓ Check-in recorded!'), findsOneWidget);

      // The feedback message clears after 3 seconds, but the check-in itself
      // sticks.
      await tester.pump(const Duration(seconds: 4));
      expect(find.text('✓ Check-in recorded!'), findsNothing);
      expect(state.checkedIn, isTrue);
    });

    testWidgets('checking in again is a no-op', (tester) async {
      final state = seededTestState();
      state.checkIn();
      await tester.pumpWidget(_wrap(state));
      await tester.pumpAndSettle();

      final activityBefore = state.activity.length;
      await tester.tap(find.text('Done'));
      await tester.pump();

      expect(state.activity.length, activityBefore);
    });
  });

  group('DashboardScreen — alerts', () {
    testWidgets('shows an alert badge counting untaken medications and missing check-in', (tester) async {
      final state = seededTestState();
      await tester.pumpWidget(_wrap(state));
      await tester.pumpAndSettle();

      // The seeded appointment is "Today — 10:30 am" (matches the "today"
      // alert), plus 1 untaken medication, plus no check-in yet = 3 alerts.
      expect(find.text('Alerts'), findsOneWidget);
      expect(find.text('3'), findsWidgets);
    });

    /// Finds the dismiss ("x") button on the AlertCard identified by its
    /// title text, regardless of how many alert cards are showing or what
    /// order they're in.
    Finder dismissButtonFor(String alertTitle) => find.descendant(
      of: find.ancestor(of: find.text(alertTitle), matching: find.byType(AlertCard)),
      matching: find.byTooltip('Dismiss alert'),
    );

    testWidgets('dismissing an alert removes its card and drops the badge count', (tester) async {
      final state = seededTestState();
      await tester.pumpWidget(_wrap(state));
      await tester.pumpAndSettle();

      expect(find.text('No check-in yet'), findsOneWidget);

      await tester.ensureVisible(dismissButtonFor('No check-in yet'));
      await tester.tap(dismissButtonFor('No check-in yet'));
      await tester.pumpAndSettle();

      // One fewer alert card, and the header's count badge reflects it --
      // dismissing used to hide the card without ever updating this count.
      expect(find.text('No check-in yet'), findsNothing);
      expect(find.text('2'), findsWidgets);
      expect(find.text('3'), findsNothing);
    });

    testWidgets('a dismissed alert stays dismissed after leaving and returning to the dashboard', (tester) async {
      final state = seededTestState();
      await tester.pumpWidget(_wrap(state));
      await tester.pumpAndSettle();

      await tester.ensureVisible(dismissButtonFor('No check-in yet'));
      await tester.tap(dismissButtonFor('No check-in yet'));
      await tester.pumpAndSettle();
      expect(find.text('No check-in yet'), findsNothing);

      // Leave the Dashboard tab and come back -- this tears down and
      // rebuilds DashboardScreen's own State, which is exactly what used
      // to bring a dismissed alert back (it was tracked on the card's own
      // widget state, not on AppState).
      await tester.tap(find.text('Medications'));
      await tester.pumpAndSettle();
      await tester.tap(find.text('Dashboard'));
      await tester.pumpAndSettle();

      expect(find.text('No check-in yet'), findsNothing);
    });
  });

  group('DashboardScreen — medication tile', () {
    testWidgets('tapping a medication tile toggles it taken', (tester) async {
      final state = seededTestState();
      await tester.pumpWidget(_wrap(state));
      await tester.pumpAndSettle();

      expect(state.medications.firstWhere((m) => m.id == 'm1').taken, isFalse);
      await tester.ensureVisible(find.text('Amlodipine'));
      await tester.tap(find.text('Amlodipine'));
      await tester.pump();

      expect(state.medications.firstWhere((m) => m.id == 'm1').taken, isTrue);
    });
  });

  group('DashboardScreen — navigation', () {
    testWidgets('"View all" under Today\'s medications navigates to the Medications screen', (tester) async {
      final state = seededTestState();
      await tester.pumpWidget(_wrap(state));
      await tester.pumpAndSettle();

      await tester.ensureVisible(find.text('View all →').first);
      await tester.tap(find.text('View all →').first);
      await tester.pumpAndSettle();

      expect(find.byType(MedicationsScreen), findsOneWidget);
      expect(find.text('Manage medications'), findsOneWidget);
    });

    testWidgets('tapping the Next appointment card opens that appointment\'s detail screen', (tester) async {
      final state = seededTestState();
      await tester.pumpWidget(_wrap(state));
      await tester.pumpAndSettle();

      // Invoke the card's InkWell directly instead of a coordinate-based
      // tap. This card sits inside a scrollable dashboard body, under a
      // Scaffold that also has a floating SOS button, on a layout that
      // switches between phone and tablet chrome by width -- depending on
      // scroll position and screen size a tap-by-coordinate can land on the
      // wrong widget (or the FAB) even after ensureVisible. Finding the
      // InkWell and calling its own onTap exercises the exact same
      // navigation logic without depending on where it lands on screen.
      final cardFinder = find.ancestor(
        of: find.text('Blood pressure check — Dr. Sharma'),
        matching: find.byType(InkWell),
      );
      expect(cardFinder, findsOneWidget);
      tester.widget<InkWell>(cardFinder).onTap!();
      await tester.pumpAndSettle();

      expect(find.byType(AppointmentDetailScreen), findsOneWidget);
      // Proof the specific tapped appointment's own data made the trip.
      expect(find.text('Greenfield Surgery — 12 Greenfield Road'), findsOneWidget);
    });
  });

  group('DashboardScreen — customize sheet', () {
    testWidgets('opening Customize and hiding a widget updates AppState', (tester) async {
      final state = seededTestState();
      await tester.pumpWidget(_wrap(state));
      await tester.pumpAndSettle();

      await tester.tap(find.text('✎'));
      await tester.pumpAndSettle();
      expect(find.text('Customize Dashboard'), findsOneWidget);

      // Sheet items are sorted by `order`; seededTestState's first item
      // (order 0) is 'status', so the first Switch belongs to it.
      expect(state.dashboardWidgets.firstWhere((w) => w.id == 'status').enabled, isTrue);

      await tester.tap(find.byType(Switch).first);
      await tester.pumpAndSettle();

      expect(state.dashboardWidgets.firstWhere((w) => w.id == 'status').enabled, isFalse);

      await tester.tap(find.text('Done'));
      await tester.pumpAndSettle();
      expect(find.text('Customize Dashboard'), findsNothing);
    });

    testWidgets('the reorder list reserves scroll room below the last item, clear of the fixed SOS button', (tester) async {
      // The Customize sheet lives inside the Dashboard's own Scaffold, so
      // the SOS button floats on top of it rather than being pushed out of
      // the way -- without room to scroll past the last row, its Move
      // Up/Down and toggle controls (all right-aligned, same side as the
      // button in Right and Off hand modes) end up stuck underneath it.
      final state = seededTestState();
      await tester.pumpWidget(_wrap(state));
      await tester.pumpAndSettle();

      await tester.tap(find.text('✎'));
      await tester.pumpAndSettle();

      final list = tester.widget<ReorderableListView>(find.byType(ReorderableListView));
      expect((list.padding as EdgeInsets).bottom, greaterThanOrEqualTo(64));
    });
  });
}
