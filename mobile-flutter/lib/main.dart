import 'package:flutter/material.dart';

import 'models/app_state.dart';
import 'screens/activity_screen.dart';
import 'screens/appointments_screen.dart';
import 'screens/auth_screens.dart';
import 'screens/dashboard_screen.dart';
import 'screens/landing_screen.dart';
import 'screens/medications_screen.dart';
import 'screens/message_detail_screen.dart';
import 'screens/messages_screen.dart';
import 'theme/app_theme.dart';
import 'widgets/app_shell.dart';

void main() {
  runApp(const CareConnectApp());
}

class CareConnectApp extends StatefulWidget {
  const CareConnectApp({super.key});

  @override
  State<CareConnectApp> createState() => _CareConnectAppState();
}

class _CareConnectAppState extends State<CareConnectApp> {
  final AppState _state = AppState();

  @override
  void initState() {
    super.initState();
    _seedDemoData();
    _state.addListener(() => setState(() {}));
  }

  void _seedDemoData() {
    _state.dashboardWidgets = [
      DashboardWidget(id: 'status', label: "Margaret's status", enabled: true, order: 0),
      DashboardWidget(id: 'alerts', label: 'Alerts', enabled: true, order: 1),
      DashboardWidget(id: 'medications', label: "Today's medications", enabled: true, order: 2),
      DashboardWidget(id: 'appointments', label: 'Next appointment', enabled: true, order: 3),
      DashboardWidget(id: 'messages', label: 'Unread messages', enabled: true, order: 4),
    ];
    _state.medications = [
      Medication(
        id: 'm1',
        name: 'Amlodipine',
        dose: '5 mg — 1 tablet',
        time: '8:30 am',
        notes: 'Take with or without food.',
      ),
      Medication(
        id: 'm2',
        name: 'Metformin',
        dose: '500 mg — 1 tablet',
        time: '8:30 am',
        notes: 'Take with breakfast.',
        taken: true,
      ),
      Medication(
        id: 'm3',
        name: 'Vitamin D3',
        dose: '1000 IU — 1 capsule',
        time: '8:30 am',
        notes: 'Take with breakfast.',
      ),
    ];
    _state.appointments = [
      Appointment(
        id: 'a1',
        title: 'Blood pressure check — Dr. Sharma',
        dateTime: 'Today — 10:30 am',
        location: 'Greenfield Surgery — 12 Greenfield Road, Westfield',
        assignee: 'Maria Thompson',
        notes: 'Your blood pressure check. Dr. Sharma will review all your medicines.',
      ),
      Appointment(
        id: 'a2',
        title: 'Annual health review — Dr. Sharma',
        dateTime: 'Monday 22 June — 2:00 pm',
        location: 'Greenfield Surgery — 12 Greenfield Road, Westfield',
        assignee: 'Maria Thompson',
        notes: 'Your yearly health check. Dr. Sharma will review all your medicines. Maria will drive you.',
      ),
      Appointment(
        id: 'a3',
        title: 'Eye test',
        dateTime: 'Friday 18 July — 11:00 am',
        location: 'Vision Plus Opticians — 22 High Street, Westfield',
        notes: 'Routine yearly eye test. Your glasses prescription may be updated. No special preparation needed.',
      ),
    ];
    _state.messages = [
      Message(
        id: 'msg1',
        from: 'Dr. Sharma',
        to: 'Maria Thompson',
        subject: "Margaret's blood pressure results",
        body:
            "Hi Maria,\n\nI reviewed Margaret's blood pressure readings from this week. The numbers are slightly elevated but not concerning at this stage. Please ensure she takes her Amlodipine consistently at 8:30 am.\n\nI'll check again at her appointment on Thursday.\n\nBest regards,\nDr. Sharma",
        timestamp: '9:15 am',
      ),
      Message(
        id: 'msg2',
        from: 'Emma Thompson',
        to: 'Maria Thompson',
        subject: 'Cover this afternoon?',
        body:
            "Hi,\n\nCould you cover Margaret's afternoon visit today? I have a clash with another appointment. She needs her 2 pm medications checked.\n\nThanks,\nEmma",
        timestamp: 'Yesterday',
      ),
      Message(
        id: 'msg3',
        from: 'Vision Plus Opticians',
        to: 'Maria Thompson',
        subject: 'Appointment reminder',
        body:
            'This is a reminder that Margaret Thompson has an eye test booked for Friday 18 July at 11:00 am at Vision Plus Opticians, 22 High Street, Westfield. Please call us if you need to reschedule.',
        timestamp: 'Mon',
        read: true,
      ),
    ];
  }

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'CareConnect',
      debugShowCheckedModeBanner: false,
      theme: CCTheme.light(),
      darkTheme: CCTheme.dark(),
      themeMode: switch (_state.theme) {
        ThemeModeSetting.light => ThemeMode.light,
        ThemeModeSetting.system => ThemeMode.system,
        ThemeModeSetting.dark => ThemeMode.dark,
      },
      builder: (context, child) {
        // Text scaling: Default / Large / X-Large (accessibility setting).
        // Multiplies the user's system text size by the in-app factor.
        final scale = switch (_state.fontSize) {
          FontScale.normal => 1.0,
          FontScale.large => 1.19,
          FontScale.xlarge => 1.38,
        };
        final system = MediaQuery.textScalerOf(context);
        return MediaQuery(
          data: MediaQuery.of(context).copyWith(
            textScaler: TextScaler.linear(scale * system.scale(16) / 16),
          ),
          child: child!,
        );
      },
      initialRoute: '/landing',
      onGenerateRoute: _onGenerateRoute,
    );
  }

  /// Named-route navigation: every screen is reached through the Flutter
  /// `Navigator` by route name (`pushNamed` / `pushReplacementNamed` /
  /// `pushNamedAndRemoveUntil`), not a hand-rolled page-enum switch.
  ///
  /// The bottom-nav/sidebar tabs (dashboard/medications/appointments/
  /// activity/messages) use `pushReplacementNamed` so the back stack
  /// doesn't grow on every tab tap — the same pattern a native bottom-nav
  /// uses. Selecting a specific item (e.g. a message) genuinely pushes a
  /// detail screen with that item passed as route arguments, giving a real
  /// back stack and data hand-off for that flow (see '/messages/detail').
  Route<dynamic> _onGenerateRoute(RouteSettings settings) {
    final Widget page = switch (settings.name) {
      '/signin' => SignInScreen(state: _state),
      '/signup' => SignUpScreen(state: _state),
      '/dashboard' => AppShell(state: _state, activeTab: AppTab.dashboard, child: DashboardScreen(state: _state)),
      '/medications' => AppShell(
        state: _state,
        activeTab: AppTab.medications,
        child: MedicationsScreen(state: _state),
      ),
      '/appointments' => AppShell(
        state: _state,
        activeTab: AppTab.appointments,
        child: AppointmentsScreen(state: _state),
      ),
      '/activity' => AppShell(state: _state, activeTab: AppTab.activity, child: ActivityScreen(state: _state)),
      '/messages' => AppShell(state: _state, activeTab: AppTab.messages, child: MessagesScreen(state: _state)),
      '/messages/detail' => MessageDetailScreen(state: _state, message: settings.arguments as Message),
      _ => LandingScreen(state: _state),
    };
    return MaterialPageRoute<void>(builder: (_) => page, settings: settings);
  }
}
