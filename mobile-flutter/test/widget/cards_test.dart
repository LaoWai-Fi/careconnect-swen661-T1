import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mocktail/mocktail.dart';

import 'package:careconnect/widgets/cards.dart';

class _MockCallback extends Mock {
  void call();
}

Widget _host(Widget child) => MaterialApp(home: Scaffold(body: child));

void main() {
  group('CCLogo', () {
    testWidgets('renders at the requested size', (tester) async {
      await tester.pumpWidget(_host(const CCLogo(size: 40)));
      final box = tester.renderObject<RenderBox>(find.byType(CCLogo));
      expect(box.size, const Size(40, 40));
    });
  });

  group('StatCard', () {
    testWidgets('renders label, value, and sub text', (tester) async {
      await tester.pumpWidget(
        _host(
          const StatCard(
            icon: Icons.medication_outlined,
            label: 'Medications',
            value: '1 of 3',
            sub: 'taken today',
            bg: Colors.white,
            borderColor: Colors.black,
          ),
        ),
      );
      expect(find.text('MEDICATIONS'), findsOneWidget); // label is upper-cased
      expect(find.text('1 of 3'), findsOneWidget);
      expect(find.text('taken today'), findsOneWidget);
    });

    testWidgets('invokes onTap when tapped', (tester) async {
      final onTap = _MockCallback();
      await tester.pumpWidget(
        _host(
          StatCard(
            icon: Icons.event_outlined,
            label: 'Next appointment',
            value: 'Eye test',
            sub: 'Friday',
            bg: Colors.white,
            borderColor: Colors.black,
            onTap: onTap.call,
          ),
        ),
      );
      await tester.tap(find.byType(StatCard));
      await tester.pump();
      verify(() => onTap()).called(1);
    });
  });

  group('AlertCard', () {
    testWidgets('renders title and body, and invokes onDismiss when closed', (tester) async {
      // AlertCard itself no longer tracks a "dismissed" flag -- whether an
      // alert is showing lives on AppState (see app_state.dart's
      // dismissedAlertIds) so the Dashboard's count badge and the card's
      // visibility can never disagree, and so a dismissal survives
      // navigating away and back. This card is just a dumb display that
      // reports the tap; it's the caller's job to stop passing it in.
      final onDismiss = _MockCallback();
      await tester.pumpWidget(
        _host(
          AlertCard(
            icon: Icons.warning_amber_outlined,
            title: 'Appointment today',
            body: 'Blood pressure check at 10:30 am.',
            onDismiss: onDismiss.call,
          ),
        ),
      );

      expect(find.text('Appointment today'), findsOneWidget);
      expect(find.text('Blood pressure check at 10:30 am.'), findsOneWidget);

      await tester.tap(find.byTooltip('Dismiss alert'));
      await tester.pump();

      verify(() => onDismiss()).called(1);
    });
  });
}
