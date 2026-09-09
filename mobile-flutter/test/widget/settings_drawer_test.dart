import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:careconnect/models/app_state.dart';
import 'package:careconnect/screens/landing_screen.dart';
import 'package:careconnect/widgets/settings_drawer.dart';

import '../support/test_app.dart';

/// Minimal harness for showSettingsSheet: a single button that opens it,
/// which is all the sheet itself needs (it doesn't navigate on its own,
/// except for Sign out -- see the separate group below that uses the full
/// app instead).
Widget _wrap(AppState state) {
  return MaterialApp(
    home: Scaffold(
      body: Builder(
        builder: (context) => TextButton(
          onPressed: () => showSettingsSheet(context, state),
          child: const Text('Open Settings'),
        ),
      ),
    ),
  );
}

void main() {
  group('Settings sheet — appearance, hand mode, text size', () {
    testWidgets('selecting Dark updates AppState.theme', (tester) async {
      final state = AppState();
      await tester.pumpWidget(_wrap(state));
      await tester.tap(find.text('Open Settings'));
      await tester.pumpAndSettle();

      expect(state.theme, ThemeModeSetting.system);
      await tester.tap(find.text('🌙 Dark'));
      await tester.pumpAndSettle();

      expect(state.theme, ThemeModeSetting.dark);
    });

    testWidgets('selecting Left updates AppState.handMode', (tester) async {
      final state = AppState();
      await tester.pumpWidget(_wrap(state));
      await tester.tap(find.text('Open Settings'));
      await tester.pumpAndSettle();

      expect(state.handMode, HandMode.off);
      await tester.tap(find.text('👈 Left'));
      await tester.pumpAndSettle();

      expect(state.handMode, HandMode.left);
    });

    testWidgets('selecting Large updates AppState.fontSize', (tester) async {
      final state = AppState();
      await tester.pumpWidget(_wrap(state));
      await tester.tap(find.text('Open Settings'));
      await tester.pumpAndSettle();

      expect(state.fontSize, FontScale.normal);
      await tester.tap(find.text('Large'));
      await tester.pumpAndSettle();

      expect(state.fontSize, FontScale.large);
    });
  });

  group('Settings sheet — sign out', () {
    testWidgets('signing out from the dashboard settings sheet returns to the landing screen', (tester) async {
      final state = seededTestState();
      await tester.pumpWidget(buildTestApp(state, initialRoute: '/dashboard'));
      await tester.pumpAndSettle();

      await tester.tap(find.byTooltip('Open settings'));
      await tester.pumpAndSettle();

      await tester.tap(find.text('Sign out'));
      await tester.pumpAndSettle();

      expect(state.userName, '');
      expect(find.byType(LandingScreen), findsOneWidget);
    });
  });
}
