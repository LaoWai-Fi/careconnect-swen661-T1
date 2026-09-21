import 'package:careconnect/main.dart';
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:integration_test/integration_test.dart';

void main() {
  IntegrationTestWidgetsFlutterBinding.ensureInitialized();

  testWidgets('sign in and record a daily check-in', (tester) async {
    await tester.pumpWidget(const CareConnectApp());
    await tester.pumpAndSettle();

    await tester.tap(find.text('I already have an account'));
    await tester.pumpAndSettle();

    final fields = find.byType(TextField);
    await tester.enterText(fields.at(0), 'wiliss@example.com');
    await tester.enterText(fields.at(1), 'secure-demo-password');
    await tester.tap(find.text('→  Sign in'));
    await tester.pump(const Duration(milliseconds: 800));
    await tester.pumpAndSettle();

    expect(find.textContaining('of'), findsWidgets);
    await tester.tap(find.text('Not yet'));
    await tester.pump();
    expect(find.text('✓ Check-in recorded!'), findsOneWidget);
  });
}
