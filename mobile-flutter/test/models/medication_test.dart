import 'package:flutter_test/flutter_test.dart';
import 'package:careconnect/models/app_state.dart';

void main() {
  group('Medication.copyWith', () {
    late Medication original;

    setUp(() {
      original = Medication(
        id: 'm1',
        name: 'Amlodipine',
        dose: '5 mg — 1 tablet',
        time: '8:30 am',
        notes: 'Take with food.',
        taken: false,
      );
    });

    test('with no arguments returns an equivalent medication with the same id', () {
      final copy = original.copyWith();
      expect(copy.id, original.id);
      expect(copy.name, original.name);
      expect(copy.dose, original.dose);
      expect(copy.time, original.time);
      expect(copy.notes, original.notes);
      expect(copy.taken, original.taken);
    });

    test('overrides only the fields that are passed', () {
      final copy = original.copyWith(dose: '10 mg — 1 tablet', taken: true);
      expect(copy.id, 'm1');
      expect(copy.name, 'Amlodipine');
      expect(copy.dose, '10 mg — 1 tablet');
      expect(copy.time, '8:30 am');
      expect(copy.taken, isTrue);
    });

    test('does not mutate the original medication', () {
      original.copyWith(name: 'Different name');
      expect(original.name, 'Amlodipine');
    });

    test('can override every field at once', () {
      final copy = original.copyWith(
        name: 'Metformin',
        dose: '500 mg',
        time: '6:00 pm',
        notes: 'New notes',
        taken: true,
      );
      expect(copy.id, 'm1'); // id is never changed by copyWith
      expect(copy.name, 'Metformin');
      expect(copy.dose, '500 mg');
      expect(copy.time, '6:00 pm');
      expect(copy.notes, 'New notes');
      expect(copy.taken, isTrue);
    });
  });
}
