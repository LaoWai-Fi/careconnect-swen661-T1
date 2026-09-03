import 'package:flutter_test/flutter_test.dart';
import 'package:careconnect/models/app_state.dart';

void main() {
  group('AppState — medications', () {
    late AppState state;
    setUp(() => state = AppState());

    test('addMedication appends and logs activity', () {
      state.addMedication(Medication(id: 'm1', name: 'Amlodipine', dose: '5mg', time: '8am', notes: ''));
      expect(state.medications, hasLength(1));
      expect(state.medications.first.name, 'Amlodipine');
      expect(state.activity, hasLength(1));
      expect(state.activity.first.type, ActivityType.taskCompleted);
    });

    test('toggleMedTaken flips taken and logs the correct activity type', () {
      state.addMedication(Medication(id: 'm1', name: 'Amlodipine', dose: '5mg', time: '8am', notes: ''));
      state.toggleMedTaken('m1');
      expect(state.medications.first.taken, isTrue);
      expect(state.activity.first.type, ActivityType.medicationTaken);

      state.toggleMedTaken('m1');
      expect(state.medications.first.taken, isFalse);
      expect(state.activity.first.type, ActivityType.medicationUnmarked);
    });

    test('deleteMedication removes the matching medication only', () {
      state.addMedication(Medication(id: 'm1', name: 'A', dose: '', time: '', notes: ''));
      state.addMedication(Medication(id: 'm2', name: 'B', dose: '', time: '', notes: ''));
      state.deleteMedication('m1');
      expect(state.medications, hasLength(1));
      expect(state.medications.first.id, 'm2');
    });

    test('toggleMedTaken on an unknown id is a no-op', () {
      state.addMedication(Medication(id: 'm1', name: 'A', dose: '', time: '', notes: ''));
      state.toggleMedTaken('does-not-exist');
      expect(state.medications.first.taken, isFalse);
    });
  });

  group('AppState — appointments', () {
    late AppState state;
    setUp(() => state = AppState());

    test('addAppointment inserts at the front', () {
      state.addAppointment(Appointment(id: 'a1', title: 'First', dateTime: '', location: '', notes: ''));
      state.addAppointment(Appointment(id: 'a2', title: 'Second', dateTime: '', location: '', notes: ''));
      expect(state.appointments.first.id, 'a2');
    });

    test('updateAppointment replaces the matching entry', () {
      state.addAppointment(Appointment(id: 'a1', title: 'Old title', dateTime: '', location: '', notes: ''));
      state.updateAppointment('a1', Appointment(id: 'a1', title: 'New title', dateTime: '', location: '', notes: ''));
      expect(state.appointments.first.title, 'New title');
    });

    test('deleteAppointment removes the matching entry', () {
      state.addAppointment(Appointment(id: 'a1', title: 'A', dateTime: '', location: '', notes: ''));
      state.deleteAppointment('a1');
      expect(state.appointments, isEmpty);
    });
  });

  group('AppState — check-in and activity', () {
    late AppState state;
    setUp(() => state = AppState());

    test('checkIn logs an entry exactly once even if called twice', () {
      state.checkIn();
      state.checkIn();
      expect(state.checkedIn, isTrue);
      expect(state.activity.where((a) => a.type == ActivityType.checkedIn), hasLength(1));
    });
  });

  group('AppState — messages', () {
    late AppState state;
    setUp(() => state = AppState());

    test('sendMessage inserts a new, already-read message at the front', () {
      state.sendMessage(from: 'Maria Thompson', to: 'Dr. Sharma', subject: 'Hi', body: 'Body text');
      expect(state.messages, hasLength(1));
      final msg = state.messages.first;
      expect(msg.from, 'Maria Thompson');
      expect(msg.read, isTrue);
      expect(msg.archived, isFalse);
    });

    test('unreadMessageCount counts only unread, non-archived messages', () {
      state.messages.addAll([
        Message(id: '1', from: 'A', to: 'Me', subject: 's', body: 'b', timestamp: 't', read: false),
        Message(id: '2', from: 'B', to: 'Me', subject: 's', body: 'b', timestamp: 't', read: true),
        Message(id: '3', from: 'C', to: 'Me', subject: 's', body: 'b', timestamp: 't', read: false, archived: true),
      ]);
      expect(state.unreadMessageCount, 1);
    });

    test('markMessageRead only ever moves unread -> read, never read -> unread', () {
      state.messages.add(Message(id: '1', from: 'A', to: 'Me', subject: 's', body: 'b', timestamp: 't', read: false));
      state.markMessageRead('1');
      expect(state.messages.first.read, isTrue);

      // Calling it again on an already-read message must not flip it back.
      state.markMessageRead('1');
      expect(state.messages.first.read, isTrue);
    });

    test('toggleMessageRead flips read state in both directions', () {
      state.messages.add(Message(id: '1', from: 'A', to: 'Me', subject: 's', body: 'b', timestamp: 't', read: false));
      state.toggleMessageRead('1');
      expect(state.messages.first.read, isTrue);
      state.toggleMessageRead('1');
      expect(state.messages.first.read, isFalse);
    });

    test('archiveMessage removes the message from the unread count without deleting it', () {
      state.messages.add(Message(id: '1', from: 'A', to: 'Me', subject: 's', body: 'b', timestamp: 't', read: false));
      state.archiveMessage('1');
      expect(state.messages, hasLength(1));
      expect(state.messages.first.archived, isTrue);
      expect(state.unreadMessageCount, 0);
    });

    test('deleteMessage removes the message entirely', () {
      state.messages.add(Message(id: '1', from: 'A', to: 'Me', subject: 's', body: 'b', timestamp: 't'));
      state.deleteMessage('1');
      expect(state.messages, isEmpty);
    });
  });

  group('AppState — settings and auth', () {
    late AppState state;
    setUp(() => state = AppState());

    test('setHandMode / setTheme / setFontScale update fields and notify listeners', () {
      var notifications = 0;
      state.addListener(() => notifications++);

      state.setHandMode(HandMode.left);
      state.setTheme(ThemeModeSetting.dark);
      state.setFontScale(FontScale.large);

      expect(state.handMode, HandMode.left);
      expect(state.theme, ThemeModeSetting.dark);
      expect(state.fontSize, FontScale.large);
      expect(notifications, 3);
    });

    test('signIn sets the user name; signOut resets session flags but keeps app data', () {
      state.signIn('Maria Thompson');
      expect(state.userName, 'Maria Thompson');

      state.setHandMode(HandMode.left);
      state.checkIn();
      state.addMedication(Medication(id: 'm1', name: 'A', dose: '', time: '', notes: ''));

      state.signOut();
      expect(state.userName, '');
      expect(state.handMode, HandMode.off);
      expect(state.checkedIn, isFalse);
      // Signing out is not a data wipe — Margaret's records persist.
      expect(state.medications, hasLength(1));
    });

    test('toggleWidget flips a dashboard widget\'s enabled flag', () {
      state.dashboardWidgets = [DashboardWidget(id: 'w1', label: 'Widget', enabled: true)];
      state.toggleWidget('w1');
      expect(state.dashboardWidgets.first.enabled, isFalse);
    });
  });
}
