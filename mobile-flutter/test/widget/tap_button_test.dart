import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mocktail/mocktail.dart';

import 'package:careconnect/widgets/tap_button.dart';

/// A mockable callback so the test can verify *how many times* onPressed
/// was invoked, instead of only inferring it indirectly from a side effect
/// on some app state -- useful here since TapButton itself has no state of
/// its own to inspect.
class _MockCallback extends Mock {
  void call();
}

Widget _host(Widget child) => MaterialApp(home: Scaffold(body: Center(child: child)));

void main() {
  group('TapButton — rendering', () {
    testWidgets('renders its label text', (tester) async {
      await tester.pumpWidget(_host(TapButton(label: 'Save', onPressed: () {})));
      expect(find.text('Save'), findsOneWidget);
    });

    testWidgets('renders the icon when one is provided', (tester) async {
      await tester.pumpWidget(_host(TapButton(label: 'Call', icon: Icons.phone, onPressed: () {})));
      expect(find.byIcon(Icons.phone), findsOneWidget);
    });

    testWidgets('meets the ~48dp minimum touch target at every size', (tester) async {
      for (final size in TapButtonSize.values) {
        await tester.pumpWidget(_host(TapButton(label: 'Go', size: size, onPressed: () {})));
        final renderBox = tester.renderObject<RenderBox>(find.byType(TapButton));
        expect(renderBox.size.height, greaterThanOrEqualTo(44));
      }
    });
  });

  group('TapButton — interaction', () {
    testWidgets('invokes onPressed exactly once per tap', (tester) async {
      final onPressed = _MockCallback();
      await tester.pumpWidget(_host(TapButton(label: 'Save', onPressed: onPressed.call)));

      await tester.tap(find.text('Save'));
      await tester.pump();

      verify(() => onPressed()).called(1);
    });

    testWidgets('a null onPressed disables the underlying tap handler', (tester) async {
      await tester.pumpWidget(_host(const TapButton(label: 'Save', onPressed: null)));

      final inkWell = tester.widget<InkWell>(find.byType(InkWell));
      expect(inkWell.onTap, isNull);
    });
  });
}
