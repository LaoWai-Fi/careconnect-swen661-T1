// RNTL component tests for TapButton — the RN counterpart of the Flutter
// suite's tap_button_test.dart.

import { render, screen, fireEvent } from '@testing-library/react-native';
import { TapButton } from '../../src/components/TapButton';

// RNTL v14 renders concurrently: `render` returns a promise that must be
// awaited before querying.
async function renderButton(ui: React.ReactElement) {
  return render(ui);
}

describe('TapButton', () => {
  it('renders its label', async () => {
    await renderButton(<TapButton label="Save changes" onPress={() => {}} />);
    expect(screen.getByText('Save changes')).toBeTruthy();
  });

  it('exposes a button role and enabled state to accessibility', async () => {
    await renderButton(<TapButton label="Continue" onPress={() => {}} />);
    const btn = screen.getByRole('button', { name: 'Continue' });
    expect(btn.props.accessibilityState?.disabled).toBeFalsy();
  });

  it('marks itself disabled when no onPress is given', async () => {
    await renderButton(<TapButton label="Continue" />);
    const btn = screen.getByRole('button', { name: 'Continue' });
    expect(btn.props.accessibilityState?.disabled).toBe(true);
  });

  it('fires onPress when pressed', async () => {
    const onPress = jest.fn();
    await renderButton(<TapButton label="Check in" onPress={onPress} />);
    fireEvent.press(screen.getByRole('button', { name: 'Check in' }));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('does not fire onPress while loading', async () => {
    const onPress = jest.fn();
    await renderButton(<TapButton label="Saving" onPress={onPress} loading />);
    const btn = screen.getByRole('button', { name: 'Saving' });
    expect(btn.props.accessibilityState?.disabled).toBe(true);
    fireEvent.press(btn);
    expect(onPress).not.toHaveBeenCalled();
  });

  it('applies the destructive variant error background', async () => {
    await renderButton(
      <TapButton label="Delete" variant="destructive" onPress={() => {}} testID="del" />,
    );
    const btn = screen.getByTestId('del');
    // destructive rest background is the light-scheme error color
    expect(
      btn.props.style.some((s: Record<string, unknown>) => s.backgroundColor === '#B91C1C'),
    ).toBe(true);
  });

  it('meets the 48dp minimum touch target at sm size', async () => {
    await renderButton(<TapButton label="Ok" size="sm" onPress={() => {}} testID="ok" />);
    const btn = screen.getByTestId('ok');
    expect(btn.props.style.some((s: Record<string, unknown>) => s.minHeight === 48)).toBe(true);
  });

  it('grows the touch target with size (md 52, lg 60)', async () => {
    const view = await renderButton(
      <TapButton label="Ok" size="md" onPress={() => {}} testID="b" />,
    );
    expect(
      screen.getByTestId('b').props.style.some((s: Record<string, unknown>) => s.minHeight === 52),
    ).toBe(true);
    await view.rerender(<TapButton label="Ok" size="lg" onPress={() => {}} testID="b" />);
    expect(
      screen.getByTestId('b').props.style.some((s: Record<string, unknown>) => s.minHeight === 60),
    ).toBe(true);
  });
});
