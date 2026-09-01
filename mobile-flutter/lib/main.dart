import 'package:flutter/material.dart';

import 'models/app_state.dart';
import 'screens/activity_screen.dart';
import 'screens/appointments_screen.dart';
import 'screens/auth_screens.dart';
import 'screens/dashboard_screen.dart';
import 'screens/landing_screen.dart';
import 'screens/medications_screen.dart';
import 'theme/app_theme.dart';
import 'widgets/app_shell.dart';
import 'widgets/settings_drawer.dart';

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
      home: _buildPage(),
    );
  }

  Widget _buildPage() {
    switch (_state.page) {
      case CCPage.landing:
        return LandingScreen(state: _state);
      case CCPage.signin:
        return SignInScreen(state: _state);
      case CCPage.signup:
        return SignUpScreen(state: _state);
      case CCPage.role:
        return RoleChooserScreen(state: _state);
      case CCPage.dashboard:
      case CCPage.medications:
      case CCPage.appointments:
      case CCPage.activity:
        return AppShell(
          state: _state,
          onOpenSettings: () => showSettingsSheet(context, _state),
          child: switch (_state.page) {
            CCPage.dashboard => DashboardScreen(state: _state),
            CCPage.medications => MedicationsScreen(state: _state),
            CCPage.appointments => AppointmentsScreen(state: _state),
            CCPage.activity => ActivityScreen(state: _state),
            _ => const SizedBox.shrink(),
          },
        );
    }
  }
}
