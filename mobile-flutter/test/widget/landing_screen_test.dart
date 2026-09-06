import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

import '../support/test_app.dart';

void main() {
  group('LandingScreen — navigation', () {
    testWidgets('"Get started" navigates to SignUpScreen', (tester) async {
      final state = seededTestState();
      await tester.pumpWidget(buildTestApp(state, initialRoute: '/landing'));
      await tester.pumpAndSettle();

      await tester.tap(find.text("Get started — it's free →"));
      await tester.pumpAndSettle();

      expect(find.text('Create your account'), findsOneWidget);
    });

    testWidgets('"I already have an account" navigates to SignInScreen', (tester) async {
      final state = seededTestState();
      await tester.pumpWidget(buildTestApp(state, initialRoute: '/landing'));
      await tester.pumpAndSettle();

      await tester.tap(find.text('I already have an account'));
      await tester.pumpAndSettle();

      expect(find.text('Welcome back'), findsOneWidget);
    });
  });

  group('LandingScreen — assistant chat', () {
    testWidgets('opening the chat bubble shows the greeting and replies to a sent message', (tester) async {
      final state = seededTestState();
      await tester.pumpWidget(buildTestApp(state, initialRoute: '/landing'));
      await tester.pumpAndSettle();

      await tester.tap(find.byTooltip('Open assistant chat'));
      await tester.pumpAndSettle();

      expect(find.textContaining("Hi! I'm the CareConnect assistant"), findsOneWidget);

      await tester.enterText(find.byType(TextField), 'What is CareConnect?');
      await tester.tap(find.byTooltip('Send message'));
      await tester.pumpAndSettle();

      expect(find.text('What is CareConnect?'), findsOneWidget);
      // The chat list is a lazy ListView.builder that doesn't auto-scroll
      // to newly added messages, so the newest reply isn't built into the
      // tree until something scrolls it into range.
      await tester.drag(find.byType(ListView), const Offset(0, -300));
      await tester.pumpAndSettle();
      expect(find.textContaining('Would you like to sign up or sign in?'), findsOneWidget);
    });

    testWidgets('closing the chat panel hides it', (tester) async {
      final state = seededTestState();
      await tester.pumpWidget(buildTestApp(state, initialRoute: '/landing'));
      await tester.pumpAndSettle();

      await tester.tap(find.byTooltip('Open assistant chat'));
      await tester.pumpAndSettle();
      expect(find.byTooltip('Close chat'), findsOneWidget);

      await tester.tap(find.byTooltip('Close chat'));
      await tester.pumpAndSettle();
      expect(find.byTooltip('Close chat'), findsNothing);
    });
  });
}
