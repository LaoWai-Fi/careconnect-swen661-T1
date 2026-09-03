import 'package:flutter/foundation.dart';

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

/// A message in the caregiver's inbox — ported from the Figma Make `Message`
/// type (cc/bcc/attachments were dropped for the Flutter port; everything
/// that drives the read/unread + navigation behavior is kept).
class Message {
  Message({
    required this.id,
    required this.from,
    required this.to,
    required this.subject,
    required this.body,
    required this.timestamp,
    this.read = false,
    this.archived = false,
  });

  final String id;
  final String from;
  final String to;
  final String subject;
  final String body;
  final String timestamp;
  bool read;
  bool archived;
}

/// Root app state — mirrors the Figma Make `AppState` type so the Flutter
/// build behaves identically to the design prototype.
///
/// Navigation is NOT tracked here: which screen is showing is owned by the
/// Flutter `Navigator` (named routes, see `main.dart`), not by a page field
/// on this class. This class only holds app data and business logic.
class AppState with ChangeNotifier {
  HandMode handMode = HandMode.off;
  String userName = '';
  List<Medication> medications = [];
  List<Appointment> appointments = [];
  List<ActivityEntry> activity = [];
  List<DashboardWidget> dashboardWidgets = [];
  List<Message> messages = [];
  FontScale fontSize = FontScale.normal;
  bool checkedIn = false;
  ThemeModeSetting theme = ThemeModeSetting.system;

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

  /// Records the signed-in user's name. Does not change screens — the
  /// calling screen navigates to '/dashboard' itself once this returns.
  void signIn(String name) {
    userName = name;
    notifyListeners();
  }

  void signOut() {
    userName = '';
    handMode = HandMode.off;
    checkedIn = false;
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

  // ── Messages ──────────────────────────────────────────────────────────

  void sendMessage({required String from, required String to, required String subject, required String body}) {
    messages.insert(
      0,
      Message(id: _uid(), from: from, to: to, subject: subject, body: body, timestamp: _nowTimestamp(), read: true),
    );
    notifyListeners();
  }

  /// Marks a message read. Safe to call even if it's already read — used
  /// when a message is opened, so it never flips a manually-set unread
  /// state back on by accident.
  void markMessageRead(String id) {
    for (final m in messages) {
      if (m.id == id && !m.read) m.read = true;
    }
    notifyListeners();
  }

  /// Flips read/unread. Used by the explicit toggle controls (the list-row
  /// dot and the detail screen's "Mark as unread/read" button) so a message
  /// can be pushed back to unread on purpose.
  void toggleMessageRead(String id) {
    for (final m in messages) {
      if (m.id == id) m.read = !m.read;
    }
    notifyListeners();
  }

  void archiveMessage(String id) {
    for (final m in messages) {
      if (m.id == id) m.archived = true;
    }
    notifyListeners();
  }

  void deleteMessage(String id) {
    messages.removeWhere((m) => m.id == id);
    notifyListeners();
  }

  int get unreadMessageCount => messages.where((m) => !m.read && !m.archived).length;

  void _log(ActivityType type, String description) {
    activity.insert(
      0,
      ActivityEntry(id: _uid(), type: type, description: description, timestamp: _nowTimestamp()),
    );
  }
}

String _nowTimestamp() {
  final now = DateTime.now();
  return '${((now.hour % 12) == 0 ? 12 : now.hour % 12).toString()}:${now.minute.toString().padLeft(2, '0')} ${now.hour < 12 ? 'am' : 'pm'}';
}

int _counter = 0;
String _uid() => 'id${(_counter++).toString()}${DateTime.now().millisecondsSinceEpoch % 100000}';
