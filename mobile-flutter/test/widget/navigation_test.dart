import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:careconnect/models/app_state.dart';
import 'package:careconnect/screens/dashboard_screen.dart';
import 'package:careconnect/screens/medications_screen.dart';
import 'package:careconnect/screens/appointments_screen.dart';
import 'package:careconnect/screens/activity_screen.dart';
import 'package:careconnect/screens/messages_screen.dart';
import 'package:careconnect/screens/message_detail_screen.dart';
import 'package:careconnect/widgets/app_shell.dart';
import 'package:careconnect/widgets/cards.dart' show CCLogo;

/// A trimmed copy of main.dart's route table, wired only for the routes
/// each test below actually exercises, so these tests can pump a full
/// `Navigator`-driven app without dragging in every screen.
Widget _testApp(AppState state, {String initialRoute = '/dashboard'}) {
  return MaterialApp(
    initialRoute: initialRoute,
    onGenerateRoute: (settings) {
      final Widget page = switch (settings.name) {
        '/dashboard' => AppShell(state: state, activeTab: AppTab.dashboard, child: DashboardScreen(state: state)),
        '/medications' => AppShell(state: state, activeTab: AppTab.medications, child: MedicationsScreen(state: state)),
        '/appointments' => AppShell(state: state, activeTab: AppTab.appointments, child: AppointmentsScreen(state: state)),
        '/activity' => AppShell(state: state, activeTab: AppTab.activity, child: ActivityScreen(state: state)),
        '/messages' => AppShell(state: state, activeTab: AppTab.messages, child: MessagesScreen(state: state)),
        '/messages/detail' => MessageDetailScreen(state: state, message: settings.arguments as Message),
        _ => AppShell(state: state, activeTab: AppTab.dashboard, child: DashboardScreen(state: state)),
      };
      return MaterialPageRoute<void>(builder: (_) => page, settings: settings);
    },
  );
}

AppState _seededState() {
  final state = AppState();
  state.userName = 'Maria Thompson';
  state.dashboardWidgets = [
    DashboardWidget(id: 'status', label: "Margaret's status"),
    DashboardWidget(id: 'medications', label: "Today's medications"),
    DashboardWidget(id: 'appointments', label: 'Next appointment'),
    DashboardWidget(id: 'messages', label: 'Unread messages'),
  ];
  state.messages = [
    Message(id: 'msg1', from: 'Dr. Sharma', to: 'Maria Thompson', subject: 'Blood pressure results', body: 'Details here.', timestamp: '9:15 am'),
    Message(id: 'msg2', from: 'Emma Thompson', to: 'Maria Thompson', subject: 'Cover this afternoon?', body: 'Can you cover?', timestamp: 'Yesterday'),
  ];
  return state;
}

void main() {
  group('Bottom-nav / sidebar navigation', () {
    testWidgets('tapping the Medications nav item replaces the dashboard with the medications screen', (tester) async {
      final state = _seededState();
      await tester.pumpWidget(_testApp(state));
      await tester.pumpAndSettle();

      expect(find.text('Manage medications'), findsNothing);

      // There are two "Medications" nav buttons rendered in the widget tree
      // at once on some layouts (bottom nav item + any sidebar item that
      // might be present) -- tap the first one found.
      await tester.tap(find.text('Medications').first);
      await tester.pumpAndSettle();

      expect(find.text('Manage medications'), findsOneWidget);
    });

    testWidgets('the Messages nav item shows an unread-count badge that matches AppState', (tester) async {
      final state = _seededState();
      await tester.pumpWidget(_testApp(state));
      await tester.pumpAndSettle();

      expect(state.unreadMessageCount, 2);
      expect(find.text('2'), findsWidgets);
    });
  });

  group('Left-Hand Mode', () {
    testWidgets('the SOS button anchors to the start (left) when Left-Hand Mode is on', (tester) async {
      final state = _seededState();
      state.handMode = HandMode.left;
      await tester.pumpWidget(_testApp(state));
      await tester.pumpAndSettle();

      final scaffold = tester.widget<Scaffold>(find.byType(Scaffold).first);
      expect(scaffold.floatingActionButtonLocation, FloatingActionButtonLocation.startFloat);
    });

    testWidgets('the SOS button anchors to the end (right) when Hand Mode is off', (tester) async {
      final state = _seededState();
      state.handMode = HandMode.off;
      await tester.pumpWidget(_testApp(state));
      await tester.pumpAndSettle();

      final scaffold = tester.widget<Scaffold>(find.byType(Scaffold).first);
      expect(scaffold.floatingActionButtonLocation, FloatingActionButtonLocation.endFloat);
    });

    testWidgets('switching to Left in the settings sheet immediately updates the already-open shell', (tester) async {
      // Regression test: AppShell is built inline inside an already-pushed
      // route (see main.dart's _onGenerateRoute), so a state change made
      // from a *different*, newly-pushed route (the settings sheet) needs
      // AppShell to rebuild itself -- the root Provider watcher rebuilding
      // main.dart does not reliably reach back down into it. Covers both
      // the FAB and the header's settings/sign-out icons, which swap sides
      // with the logo in Left-Hand Mode.
      final state = _seededState();
      await tester.pumpWidget(_testApp(state));
      await tester.pumpAndSettle();

      // Off by default: logo sits left of the settings icon, and the FAB
      // anchors to the end (right).
      final logoBefore = tester.getTopLeft(find.byType(CCLogo)).dx;
      final settingsBefore = tester.getTopLeft(find.byTooltip('Open settings')).dx;
      expect(logoBefore, lessThan(settingsBefore));
      var scaffold = tester.widget<Scaffold>(find.byType(Scaffold).first);
      expect(scaffold.floatingActionButtonLocation, FloatingActionButtonLocation.endFloat);

      await tester.tap(find.byTooltip('Open settings'));
      await tester.pumpAndSettle();
      await tester.tap(find.text('👈 Left'));
      await tester.pumpAndSettle();
      await tester.tapAt(const Offset(20, 20)); // dismiss the settings sheet
      await tester.pumpAndSettle();

      expect(state.handMode, HandMode.left);
      // Left mode: settings/sign-out move to the left edge, pushing the
      // logo to the right.
      final logoAfter = tester.getTopLeft(find.byType(CCLogo)).dx;
      final settingsAfter = tester.getTopLeft(find.byTooltip('Open settings')).dx;
      expect(settingsAfter, lessThan(logoAfter));
      scaffold = tester.widget<Scaffold>(find.byType(Scaffold).first);
      expect(scaffold.floatingActionButtonLocation, FloatingActionButtonLocation.startFloat);
    });
  });

  group('Messages list -> detail navigation (real data hand-off)', () {
    testWidgets('opening a message pushes a detail screen showing that message\'s own data, and marks it read', (tester) async {
      final state = _seededState();
      await tester.pumpWidget(_testApp(state, initialRoute: '/messages'));
      await tester.pumpAndSettle();

      expect(find.text('Blood pressure results'), findsOneWidget);
      expect(state.messages.firstWhere((m) => m.id == 'msg1').read, isFalse);

      await tester.tap(find.text('Blood pressure results'));
      await tester.pumpAndSettle();

      // The detail screen renders the same subject and the message body --
      // proof the specific tapped item's data made the trip, not just a
      // generic re-render of the list.
      expect(find.text('Blood pressure results'), findsOneWidget);
      expect(find.text('Details here.'), findsOneWidget);
      expect(state.messages.firstWhere((m) => m.id == 'msg1').read, isTrue);

      // Back returns to the list -- a real back stack, not a re-navigate.
      // Check for a label unique to the detail screen (not the message's own
      // body text, which can coincidentally also appear as the list row's
      // preview snippet when the body is short).
      await tester.tap(find.text('Back'));
      await tester.pumpAndSettle();
      expect(find.text('From'), findsNothing);
      // Back on the list screen (its own widget), not the detail screen.
      // "Messages" text alone is ambiguous -- the sidebar nav item also
      // renders it in the wide test layout.
      expect(find.byType(MessagesScreen), findsOneWidget);
    });

    testWidgets('the detail screen\'s read/unread toggle updates AppState', (tester) async {
      final state = _seededState();
      final msg = state.messages.first;
      // Drive the screen directly with its route arguments rather than
      // through initialRoute (which carries no arguments channel).
      await tester.pumpWidget(MaterialApp(home: MessageDetailScreen(state: state, message: msg)));
      await tester.pumpAndSettle();

      // The seeded message starts unread, so the screen offers to mark it
      // read (not unread).
      expect(msg.read, isFalse);
      expect(find.text('Mark as read'), findsOneWidget);
      await tester.tap(find.text('Mark as read'));
      await tester.pumpAndSettle();

      expect(msg.read, isTrue);
      expect(find.text('Mark as unread'), findsOneWidget);
    });
  });
}
