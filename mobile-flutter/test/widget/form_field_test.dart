import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:careconnect/widgets/form_field.dart';

Widget _host(Widget child) => MaterialApp(home: Scaffold(body: child));

void main() {
  group('CCFormField', () {
    // The label is a raw RichText (not a Text/Text.rich), so plain
    // find.text()/find.textContaining() -- which only look at Text widgets
    // unless told otherwise -- won't see it. Matching the RichText's own
    // resolved plain text is the direct, unambiguous way to check it
    // (find.byType(RichText) alone would also match the RichText every
    // plain Text widget builds internally elsewhere in the tree).
    testWidgets('shows a required asterisk only when required is true', (tester) async {
      await tester.pumpWidget(
        _host(CCFormField(label: 'Email', required: true, child: TextField(controller: TextEditingController()))),
      );
      final match = find.byWidgetPredicate((w) => w is RichText && w.text.toPlainText() == 'Email *');
      expect(match, findsOneWidget);
    });

    testWidgets('does not show an asterisk when not required', (tester) async {
      await tester.pumpWidget(
        _host(CCFormField(label: 'Notes', child: TextField(controller: TextEditingController()))),
      );
      final withAsterisk = find.byWidgetPredicate((w) => w is RichText && w.text.toPlainText().contains('*'));
      expect(withAsterisk, findsNothing);
      final plainLabel = find.byWidgetPredicate((w) => w is RichText && w.text.toPlainText() == 'Notes');
      expect(plainLabel, findsOneWidget);
    });

    testWidgets('shows the error text instead of the hint when both are set', (tester) async {
      await tester.pumpWidget(
        _host(
          CCFormField(
            label: 'Email',
            hint: 'you@example.com',
            error: 'Email is required.',
            child: TextField(controller: TextEditingController()),
          ),
        ),
      );
      expect(find.text('Email is required.'), findsOneWidget);
      expect(find.text('you@example.com'), findsNothing);
    });

    testWidgets('falls back to the hint when there is no error', (tester) async {
      await tester.pumpWidget(
        _host(CCFormField(label: 'Email', hint: 'you@example.com', child: TextField(controller: TextEditingController()))),
      );
      expect(find.text('you@example.com'), findsOneWidget);
    });
  });

  group('CCInput', () {
    testWidgets('obscures text when obscure is true', (tester) async {
      await tester.pumpWidget(_host(CCInput(controller: TextEditingController(), obscure: true)));
      final field = tester.widget<TextField>(find.byType(TextField));
      expect(field.obscureText, isTrue);
    });

    testWidgets('shows the placeholder as hint text', (tester) async {
      await tester.pumpWidget(_host(CCInput(controller: TextEditingController(), placeholder: 'e.g. Amlodipine')));
      expect(find.text('e.g. Amlodipine'), findsOneWidget);
    });

    testWidgets('calls onSubmitted with the current text', (tester) async {
      String? submitted;
      await tester.pumpWidget(
        _host(CCInput(controller: TextEditingController(), onSubmitted: (value) => submitted = value)),
      );
      await tester.enterText(find.byType(TextField), 'Amlodipine');
      await tester.testTextInput.receiveAction(TextInputAction.done);
      await tester.pump();

      expect(submitted, 'Amlodipine');
    });
  });
}
