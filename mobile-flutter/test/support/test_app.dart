import 'package:flutter/material.dart';

import 'package:careconnect/models/app_state.dart';
import 'package:careconnect/screens/activity_screen.dart';
import 'package:careconnect/screens/archived_messages_screen.dart';
import 'package:careconnect/screens/appointment_detail_screen.dart';
import 'package:careconnect/screens/appointments_screen.dart';
import 'package:careconnect/screens/auth_screens.dart';
import 'package:careconnect/screens/dashboard_screen.dart';
import 'package:careconnect/screens/landing_screen.dart';
import 'package:careconnect/screens/medication_detail_screen.dart';
import 'package:careconnect/screens/medications_screen.dart';
import 'package:careconnect/screens/message_detail_screen.dart';
import 'package:careconnect/screens/messages_screen.dart';
import 'package:careconnect/widgets/app_shell.dart';

/// Shared test harness for widget tests that need real `Navigator`
/// push/pop/replace behavior (not just a single screen in isolation).
///
/// This mirrors lib/main.dart's `_onGenerateRoute` route table exactly, but
/// takes a pre-built [AppState] directly instead of pulling one from a
/// `ChangeNotifierProvider` -- tests construct their own [AppState] (often
/// with a fixed clock, see [seededTestState]) and don't need to stand up
/// the provider wiring to exercise navigation end to end.
Widget buildTestApp(AppState state, {String initialRoute = '/dashboard'}) {
  return MaterialApp(
    initialRoute: initialRoute,
    onGenerateRoute: (settings) {
      final Widget page = switch (settings.name) {
        '/landing' => LandingScreen(state: state),
        '/signin' => SignInScreen(state: state),
        '/signup' => SignUpScreen(state: state),
        '/dashboard' => AppShell(state: state, activeTab: AppTab.dashboard, child: DashboardScreen(state: state)),
        '/medications' => AppShell(
          state: state,
          activeTab: AppTab.medications,
          child: MedicationsScreen(state: state),
        ),
        '/appointments' => AppShell(
          state: state,
          activeTab: AppTab.appointments,
          child: AppointmentsScreen(state: state),
        ),
        '/activity' => AppShell(state: state, activeTab: AppTab.activity, child: ActivityScreen(state: state)),
        '/messages' => AppShell(state: state, activeTab: AppTab.messages, child: MessagesScreen(state: state)),
        '/messages/detail' => MessageDetailScreen(state: state, message: settings.arguments as Message),
        '/messages/archived' => ArchivedMessagesScreen(state: state),
        '/medications/detail' => MedicationDetailScreen(state: state, medication: settings.arguments as Medication),
        '/appointments/detail' => AppointmentDetailScreen(state: state, appointment: settings.arguments as Appointment),
        _ => LandingScreen(state: state),
      };
      return MaterialPageRoute<void>(builder: (_) => page, settings: settings);
    },
  );
}

/// A small, deterministic seed shared across widget tests -- enough data to
/// exercise list/empty states and every dashboard widget section without
/// depending on `main.dart`'s full demo copy (which is UI content, not test
/// fixture data, and can change independently of what these tests check).
AppState seededTestState({DateTime Function()? now}) {
  final state = AppState(now: now);
  state.userName = 'Maria Thompson';
  state.dashboardWidgets = [
    DashboardWidget(id: 'status', label: "Margaret's status", order: 0),
    DashboardWidget(id: 'alerts', label: 'Alerts', order: 1),
    DashboardWidget(id: 'medications', label: "Today's medications", order: 2),
    DashboardWidget(id: 'appointments', label: 'Next appointment', order: 3),
    DashboardWidget(id: 'messages', label: 'Unread messages', order: 4),
  ];
  state.medications = [
    Medication(id: 'm1', name: 'Amlodipine', dose: '5 mg — 1 tablet', time: '8:30 am', notes: 'Take with food.'),
    Medication(id: 'm2', name: 'Metformin', dose: '500 mg — 1 tablet', time: '8:30 am', notes: '', taken: true),
  ];
  state.appointments = [
    Appointment(
      id: 'a1',
      title: 'Blood pressure check — Dr. Sharma',
      dateTime: 'Today — 10:30 am',
      location: 'Greenfield Surgery — 12 Greenfield Road',
      assignee: 'Maria Thompson',
      notes: 'Routine check.',
    ),
  ];
  state.messages = [
    Message(
      id: 'msg1',
      from: 'Dr. Sharma',
      to: 'Maria Thompson',
      subject: 'Blood pressure results',
      body: 'Details here.',
      timestamp: '9:15 am',
    ),
    Message(
      id: 'msg2',
      from: 'Emma Thompson',
      to: 'Maria Thompson',
      subject: 'Cover this afternoon?',
      body: 'Can you cover?',
      timestamp: 'Yesterday',
    ),
  ];
  return state;
}
