import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:careconnect/screens/dashboard_screen.dart';

import '../support/test_app.dart';

void main() {
  group('SignInScreen', () {
    testWidgets('submitting with empty fields shows validation errors', (tester) async {
      final state = seededTestState();
      await tester.pumpWidget(buildTestApp(state, initialRoute: '/signin'));
      await tester.pumpAndSettle();

      await tester.tap(find.text('→  Sign in'));
      await tester.pumpAndSettle();

      expect(find.text('Email is required.'), findsOneWidget);
      expect(find.text('Password is required.'), findsOneWidget);
    });

    testWidgets('a valid submission signs in and navigates to the dashboard', (tester) async {
      final state = seededTestState();
      await tester.pumpWidget(buildTestApp(state, initialRoute: '/signin'));
      await tester.pumpAndSettle();

      final fields = find.byType(TextField);
      await tester.enterText(fields.at(0), 'maria@example.com');
      await tester.enterText(fields.at(1), 'anypassword');
      await tester.tap(find.text('→  Sign in'));
      // Sign-in has a simulated 700ms network delay before navigating.
      await tester.pump(const Duration(milliseconds: 800));
      await tester.pumpAndSettle();

      expect(state.userName, 'maria');
      expect(find.byType(DashboardScreen), findsOneWidget);
    });

    testWidgets('the sign-up link navigates to SignUpScreen', (tester) async {
      final state = seededTestState();
      await tester.pumpWidget(buildTestApp(state, initialRoute: '/signin'));
      await tester.pumpAndSettle();

      // "Sign up for free" is a span inside a larger Text.rich ("Don't have
      // an account? Sign up for free"), not a standalone Text, so it needs
      // findRichText plus a containing match rather than an exact one.
      final signUpLink = find.textContaining('Sign up for free', findRichText: true);
      await tester.tap(signUpLink);
      await tester.pumpAndSettle();

      expect(find.text('Create your account'), findsOneWidget);
    });
  });

  group('SignUpScreen', () {
    testWidgets('a short password shows a length error', (tester) async {
      final state = seededTestState();
      await tester.pumpWidget(buildTestApp(state, initialRoute: '/signup'));
      await tester.pumpAndSettle();

      final fields = find.byType(TextField);
      // Order in SignUpScreen: name, email, password, confirm.
      await tester.enterText(fields.at(0), 'Dorothy Smith');
      await tester.enterText(fields.at(1), 'dorothy@example.com');
      await tester.enterText(fields.at(2), '123');
      await tester.enterText(fields.at(3), '123');
      await tester.ensureVisible(find.text('→  Create account'));
      await tester.tap(find.text('→  Create account'));
      await tester.pumpAndSettle();

      expect(find.text('Password must be at least 6 characters.'), findsOneWidget);
      expect(state.userName, isNot('Dorothy Smith'));
    });

    testWidgets('mismatched passwords show a confirmation error', (tester) async {
      final state = seededTestState();
      await tester.pumpWidget(buildTestApp(state, initialRoute: '/signup'));
      await tester.pumpAndSettle();

      final fields = find.byType(TextField);
      await tester.enterText(fields.at(0), 'Dorothy Smith');
      await tester.enterText(fields.at(1), 'dorothy@example.com');
      await tester.enterText(fields.at(2), 'abcdef');
      await tester.enterText(fields.at(3), 'ghijkl');
      await tester.ensureVisible(find.text('→  Create account'));
      await tester.tap(find.text('→  Create account'));
      await tester.pumpAndSettle();

      expect(find.text('Passwords do not match.'), findsOneWidget);
    });

    testWidgets('a valid submission signs up and navigates to the dashboard', (tester) async {
      final state = seededTestState();
      await tester.pumpWidget(buildTestApp(state, initialRoute: '/signup'));
      await tester.pumpAndSettle();

      final fields = find.byType(TextField);
      await tester.enterText(fields.at(0), 'Dorothy Smith');
      await tester.enterText(fields.at(1), 'dorothy@example.com');
      await tester.enterText(fields.at(2), 'abcdef');
      await tester.enterText(fields.at(3), 'abcdef');
      await tester.ensureVisible(find.text('→  Create account'));
      await tester.tap(find.text('→  Create account'));
      await tester.pump(const Duration(milliseconds: 800));
      await tester.pumpAndSettle();

      expect(state.userName, 'Dorothy Smith');
      expect(find.byType(DashboardScreen), findsOneWidget);
    });

    testWidgets('the sign-in link navigates to SignInScreen', (tester) async {
      final state = seededTestState();
      await tester.pumpWidget(buildTestApp(state, initialRoute: '/signup'));
      await tester.pumpAndSettle();

      // "Sign in" is a span inside a larger Text.rich ("Already have an
      // account? Sign in"), not a standalone Text.
      final signInLink = find.textContaining('Sign in', findRichText: true);
      await tester.ensureVisible(signInLink);
      await tester.tap(signInLink);
      await tester.pumpAndSettle();

      expect(find.text('Welcome back'), findsOneWidget);
    });
  });
}
