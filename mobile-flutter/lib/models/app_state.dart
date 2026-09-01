import 'package:flutter/foundation.dart';

/// Which screen is showing. Mirrors the Figma Make `Page` type.
enum CCPage {
  landing,
  signin,
  signup,
  role,
  dashboard,
  medications,
  appointments,
  activity,
}

/// One-Handed Mode: off / left / right. The team's assigned accessibility
/// constraint is the `left` mode — it anchors navigation and key actions to
/// the left edge for left-thumb reach.
enum HandMode { off, left, right }

enum FontScale { normal, large, xlarge }

enum ThemeModeSetting { light, system, dark }

class Medication {
  Medication({
    required this.id,
    required this.name,
    required this.dose,
    required this.time,
    required this.notes,
    this.taken = false,
  });

  final String id;
  String name;
  String dose;
  String time;
  String notes;
  bool taken;

  Medication copyWith({String? name, String? dose, String? time, String? notes, bool? taken}) =>
      Medication(
        id: id,
        name: name ?? this.name,
        dose: dose ?? this.dose,
        time: time ?? this.time,
        notes: notes ?? this.notes,
        taken: taken ?? this.taken,
      );
}

class Appointment {
  Appointment({
    required this.id,
    required this.title,
    required this.dateTime,
    required this.location,
    required this.notes,
    this.assignee = '',
  });

  final String id;
  String title;
  String dateTime;
  String location;
  String assignee;
  String notes;
}

enum ActivityType { medicationTaken, medicationUnmarked, taskCompleted, checkedIn }

class ActivityEntry {
  ActivityEntry({
    required this.id,
    required this.type,
    required this.description,
    required this.timestamp,
  });

  final String id;
  final ActivityType type;
  final String description;
  final String timestamp;
}

class DashboardWidget {
  DashboardWidget({required this.id, required this.label, this.enabled = true, this.order = 0});

  final String id;
  final String label;
  bool enabled;
  int order;
}

/// Root app state — mirrors the Figma Make `AppState` type so the Flutter
/// build behaves identically to the design prototype.
class AppState with ChangeNotifier {
  CCPage page = CCPage.landing;
  HandMode handMode = HandMode.off;
  String userName = '';
  String? role; // 'caregiver' | 'recipient'
  List<Medication> medications = [];
  List<Appointment> appointments = [];
  List<ActivityEntry> activity = [];
  List<DashboardWidget> dashboardWidgets = [];
  FontScale fontSize = FontScale.normal;
  bool checkedIn = false;
  ThemeModeSetting theme = ThemeModeSetting.system;

  void navigate(CCPage p) {
    page = p;
    notifyListeners();
  }

  void setHandMode(HandMode m) {
    handMode = m;
    notifyListeners();
  }

  void setTheme(ThemeModeSetting t) {
    theme = t;
    notifyListeners();
  }

  void setFontScale(FontScale s) {
    fontSize = s;
    notifyListeners();
  }

  void signIn(String name) {
    userName = name;
    page = CCPage.role;
    notifyListeners();
  }

  void signOut() {
    page = CCPage.landing;
    userName = '';
    role = null;
    handMode = HandMode.off;
    checkedIn = false;
    notifyListeners();
  }

  void chooseRole(String r) {
    role = r;
    page = CCPage.dashboard;
    notifyListeners();
  }

  void checkIn() {
    if (checkedIn) return;
    checkedIn = true;
    _log(ActivityType.checkedIn, 'Margaret checked in');
    notifyListeners();
  }

  void toggleWidget(String id) {
    for (final w in dashboardWidgets) {
      if (w.id == id) w.enabled = !w.enabled;
    }
    notifyListeners();
  }

  void reorderWidgets(List<DashboardWidget> ordered) {
    for (var i = 0; i < ordered.length; i++) {
      ordered[i].order = i;
    }
    dashboardWidgets = ordered;
    notifyListeners();
  }

  void addMedication(Medication med) {
    medications.add(med);
    _log(ActivityType.taskCompleted, "Added ${med.name} to Margaret's medications");
    notifyListeners();
  }

  void deleteMedication(String id) {
    medications.removeWhere((m) => m.id == id);
    notifyListeners();
  }

  void toggleMedTaken(String id) {
    for (final m in medications) {
      if (m.id == id) {
        m.taken = !m.taken;
        _log(
          m.taken ? ActivityType.medicationTaken : ActivityType.medicationUnmarked,
          "${m.name} ${m.taken ? 'marked as taken' : 'unmarked'}",
        );
      }
    }
    notifyListeners();
  }

  void addAppointment(Appointment appt) {
    appointments.insert(0, appt);
    notifyListeners();
  }

  void updateAppointment(String id, Appointment updated) {
    for (var i = 0; i < appointments.length; i++) {
      if (appointments[i].id == id) appointments[i] = updated;
    }
    notifyListeners();
  }

  void deleteAppointment(String id) {
    appointments.removeWhere((a) => a.id == id);
    notifyListeners();
  }

  void addActivity(ActivityEntry entry) {
    activity.insert(0, entry);
    notifyListeners();
  }

  void _log(ActivityType type, String description) {
    final now = DateTime.now();
    final ts =
        '${((now.hour % 12) == 0 ? 12 : now.hour % 12).toString()}:${now.minute.toString().padLeft(2, '0')} ${now.hour < 12 ? 'am' : 'pm'}';
    activity.insert(
      0,
      ActivityEntry(id: _uid(), type: type, description: description, timestamp: ts),
    );
  }
}

int _counter = 0;
String _uid() => 'id${(_counter++).toString()}${DateTime.now().millisecondsSinceEpoch % 100000}';
