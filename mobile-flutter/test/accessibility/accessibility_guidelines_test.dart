import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:careconnect/theme/app_theme.dart';
import 'package:careconnect/widgets/tap_button.dart';

void main() {
  testWidgets('primary controls meet Flutter accessibility guidelines', (tester) async {
    final semantics = tester.ensureSemantics();
    addTearDown(semantics.dispose);

    await tester.pumpWidget(
      MaterialApp(
        theme: CCTheme.light(),
        home: Scaffold(
          body: Center(
            child: TapButton(
              label: 'Save medication',
              size: TapButtonSize.lg,
              onPressed: () {},
            ),
          ),
        ),
      ),
    );

    await expectLater(tester, meetsGuideline(androidTapTargetGuideline));
    await expectLater(tester, meetsGuideline(labeledTapTargetGuideline));
  });
}
