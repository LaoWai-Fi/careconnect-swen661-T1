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
///
/// The optional [now] clock is injected (defaulting to real [DateTime.now])
/// so activity/message timestamps are deterministic and testable without
/// depending on the wall clock — tests pass a fixed `() => DateTime(...)`
/// to assert exact "8:30 am"-style output.
class AppState with ChangeNotifier {
  AppState({DateTime Function()? now}) : _now = now ?? DateTime.now;

  final DateTime Function() _now;

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

  /// Ids of dashboard Alert cards the user has dismissed (the card's "x"
  /// button). This lives here, on the one long-lived [AppState] instance,
  /// rather than as local widget state on the alert card itself: a local
  /// `State.dismissed` flag gets torn down and rebuilt from scratch every
  /// time the Dashboard route is pushed again (e.g. switching tabs and
  /// back), which is why a dismissed alert used to reappear on
  /// navigation, and it's invisible to the Alerts section header, which is
  /// why the count badge didn't drop when a card was dismissed. Dashboard
  /// screen filters its alert list by this set before both building the
  /// cards and counting the badge, so the two always agree.
  Set<String> dismissedAlertIds = {};

  /// Stable ids for the Alerts section's cards (see dashboard_screen.dart's
  /// 'alerts' case). Shared constants so a dismissal recorded under one of
  /// these ids can be found and cleared again from here when the
  /// underlying condition changes enough that a fresh occurrence shouldn't
  /// stay hidden just because an old one was dismissed.
  static const alertAppointmentToday = 'appointment-today';
  static const alertMedsUntaken = 'meds-untaken';
  static const alertNoCheckIn = 'no-checkin';

  void dismissAlert(String id) {
    dismissedAlertIds.add(id);
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

  /// The name baked into the demo/seed data created in main.dart before
  /// anyone has signed in. Any record still carrying it once a real name is
  /// known belongs to whoever just signed in, not literally to "Maria
  /// Thompson" -- see the relabeling in [signIn].
  static const _demoUserPlaceholder = 'Maria Thompson';

  /// Records the signed-in user's name. Does not change screens — the
  /// calling screen navigates to '/dashboard' itself once this returns.
  void signIn(String name) {
    userName = name;
    // The seed data in main.dart is created once at app startup, before
    // anyone has signed in, so it has to hardcode a placeholder name for
    // "the person using this app" (appointments assigned to them, messages
    // addressed to them). Relabel anything still carrying that placeholder
    // to whoever actually just signed in/up, so the app doesn't keep
    // showing "Maria Thompson" no matter who signs in.
    for (final appt in appointments) {
      if (appt.assignee == _demoUserPlaceholder) appt.assignee = name;
    }
    messages = [
      for (final m in messages)
        if (m.to == _demoUserPlaceholder)
          Message(
            id: m.id,
            from: m.from,
            to: name,
            subject: m.subject,
            body: m.body,
            timestamp: m.timestamp,
            read: m.read,
            archived: m.archived,
          )
        else
          m,
    ];
    notifyListeners();
  }

  void signOut() {
    userName = '';
    handMode = HandMode.off;
    checkedIn = false;
    dismissedAlertIds = {};
    notifyListeners();
  }

  void checkIn() {
    if (checkedIn) return;
    checkedIn = true;
    dismissedAlertIds.remove(alertNoCheckIn);
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
    // A newly added medication may itself be untaken, which should surface
    // as a fresh "not yet taken" alert even if an earlier one (for
    // different medications) was already dismissed.
    dismissedAlertIds.remove(alertMedsUntaken);
    _log(ActivityType.taskCompleted, "Added ${med.name} to Margaret's medications");
    notifyListeners();
  }

  void updateMedication(String id, Medication updated) {
    for (var i = 0; i < medications.length; i++) {
      if (medications[i].id == id) medications[i] = updated;
    }
    dismissedAlertIds.remove(alertMedsUntaken);
    notifyListeners();
  }

  void deleteMedication(String id) {
    medications.removeWhere((m) => m.id == id);
    dismissedAlertIds.remove(alertMedsUntaken);
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
    // Marking one taken can still leave others untaken (the alert just
    // shows a different count), and unmarking one can turn the alert back
    // on -- either way this is a new state worth surfacing again, not the
    // same occurrence the user already dismissed.
    dismissedAlertIds.remove(alertMedsUntaken);
    notifyListeners();
  }

  void addAppointment(Appointment appt) {
    appointments.insert(0, appt);
    dismissedAlertIds.remove(alertAppointmentToday);
    notifyListeners();
  }

  void updateAppointment(String id, Appointment updated) {
    for (var i = 0; i < appointments.length; i++) {
      if (appointments[i].id == id) appointments[i] = updated;
    }
    dismissedAlertIds.remove(alertAppointmentToday);
    notifyListeners();
  }

  void deleteAppointment(String id) {
    appointments.removeWhere((a) => a.id == id);
    dismissedAlertIds.remove(alertAppointmentToday);
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
      Message(id: _uid(), from: from, to: to, subject: subject, body: body, timestamp: _formatClockTime(_now()), read: true),
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

  /// Restores an archived message to the main inbox. Used by the Archived
  /// messages screen's detail view.
  void unarchiveMessage(String id) {
    for (final m in messages) {
      if (m.id == id) m.archived = false;
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
      ActivityEntry(id: _uid(), type: type, description: description, timestamp: _formatClockTime(_now())),
    );
  }
}

/// Formats a [DateTime] as CareConnect's "8:30 am" clock-time style —
/// shared by activity-log entries and message timestamps. Pulled out as a
/// standalone, side-effect-free function so it can be unit tested directly
/// against fixed [DateTime] values (midnight/noon/AM/PM boundaries) without
/// needing a widget or the wall clock.
String _formatClockTime(DateTime now) {
  final hour12 = (now.hour % 12) == 0 ? 12 : now.hour % 12;
  return '$hour12:${now.minute.toString().padLeft(2, '0')} ${now.hour < 12 ? 'am' : 'pm'}';
}

int _counter = 0;
String _uid() => 'id${(_counter++).toString()}${DateTime.now().millisecondsSinceEpoch % 100000}';
