import 'package:flutter/gestures.dart';
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mocktail/mocktail.dart';

import 'package:careconnect/theme/app_theme.dart';
import 'package:careconnect/widgets/tap_button.dart';

/// A mockable callback so the test can verify *how many times* onPressed
/// was invoked, instead of only inferring it indirectly from a side effect
/// on some app state -- useful here since TapButton itself has no state of
/// its own to inspect.
class _MockCallback extends Mock {
  void call();
}

Widget _host(Widget child) => MaterialApp(
  theme: CCTheme.light(),
  home: Scaffold(body: Center(child: child)),
);

/// The TapButton's own [Material] (not the Scaffold's), so its color can be
/// asserted across hover/press states.
Finder _buttonMaterial() => find.descendant(
  of: find.byType(TapButton),
  matching: find.byType(Material),
);

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
        expect(renderBox.size.height, greaterThanOrEqualTo(48));
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
      await tester.pumpWidget(_host(const TapButton(label: 'Mine', onPressed: null)));

      final inkWell = tester.widget<InkWell>(find.byType(InkWell));
      expect(inkWell.onTap, isNull);
    });
  });

  group('TapButton — interaction states (Assignment 3 §6.3.1)', () {
    testWidgets('disabled renders at 40% opacity', (tester) async {
      await tester.pumpWidget(_host(const TapButton(label: 'Mine', onPressed: null)));

      final opacity = tester.widget<Opacity>(find.byType(Opacity).first);
      expect(opacity.opacity, 0.4);
    });

    testWidgets('enabled renders at full opacity', (tester) async {
      await tester.pumpWidget(_host(TapButton(label: 'Mine', onPressed: () {})));

      final opacity = tester.widget<Opacity>(find.byType(Opacity).first);
      expect(opacity.opacity, 1.0);
    });

    testWidgets('hover swaps in the variant hover color', (tester) async {
      await tester.pumpWidget(
        _host(TapButton(label: 'Save', variant: TapButtonVariant.primary, onPressed: () {})),
      );

      // Resting background is the primary token.
      Material rest = tester.widget<Material>(_buttonMaterial());
      expect(rest.color, const Color(0xFF1B6E7A));

      // Simulate pointer hover over the button's center.
      final gesture = await tester.createGesture(kind: PointerDeviceKind.mouse);
      await gesture.addPointer(location: tester.getCenter(find.byType(TapButton)));
      await tester.pump();

      rest = tester.widget<Material>(_buttonMaterial());
      expect(rest.color, const Color(0xFF155E6A)); // --primary-hover

      await gesture.removePointer();
    });

    testWidgets('press swaps in the variant active color', (tester) async {
      await tester.pumpWidget(
        _host(TapButton(label: 'Save', variant: TapButtonVariant.primary, onPressed: () {})),
      );

      // Press and hold without releasing, so onTapDown's active state shows.
      final gesture = await tester.startGesture(tester.getCenter(find.text('Save')));
      await tester.pump();

      final pressed = tester.widget<Material>(_buttonMaterial());
      expect(pressed.color, const Color(0xFF114F59)); // --primary-active

      await gesture.up();
      await tester.pump();
    });

    testWidgets('keyboard focus draws a 3px ring in the ring color', (tester) async {
      await tester.pumpWidget(
        _host(TapButton(label: 'Save', variant: TapButtonVariant.primary, autofocus: true, onPressed: () {})),
      );
      await tester.pump();

      // The focus ring is an AnimatedContainer border around the button.
      final ring = tester.widget<AnimatedContainer>(
        find.descendant(of: find.byType(TapButton), matching: find.byType(AnimatedContainer)),
      );
      final decoration = ring.decoration! as BoxDecoration;
      expect(decoration.border!.top.width, 3.0);
      expect(decoration.border!.top.color, const Color(0xFF1B6E7A)); // --ring
    });

    testWidgets('destructive variant focuses in the destructive color', (tester) async {
      await tester.pumpWidget(
        _host(
          TapButton(
            label: 'Delete',
            variant: TapButtonVariant.destructive,
            autofocus: true,
            onPressed: () {},
          ),
        ),
      );
      await tester.pump();

      final ring = tester.widget<AnimatedContainer>(
        find.descendant(of: find.byType(TapButton), matching: find.byType(AnimatedContainer)),
      );
      final decoration = ring.decoration! as BoxDecoration;
      expect(decoration.border!.top.color, const Color(0xFFB91C1C)); // --destructive
    });
  });
}
