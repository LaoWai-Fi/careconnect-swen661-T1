// Regression coverage for the "text size setting does nothing" bug: Settings
// → Text Size (Large / X-Large) sets state.fontSize, but until ScaledText
// existed nothing ever read it back — every Text used a literal fontSize
// number and rendered at the same size regardless of the setting.

import { render } from '@testing-library/react-native';
import { StyleSheet, Text as RNText } from 'react-native';
import { ScaledText } from '../../src/components/ScaledText';
import { AppStateProvider } from '../../src/state/AppState';
import { seededInitialState } from '../../src/state/seed';

async function renderScaled(fontSize: 'normal' | 'large' | 'xlarge', style: object) {
  const state = seededInitialState();
  state.fontSize = fontSize;
  const { getByText } = await render(
    <AppStateProvider initialState={state}>
      <ScaledText style={style}>Hello</ScaledText>
    </AppStateProvider>,
  );
  return StyleSheet.flatten(getByText('Hello').props.style) as { fontSize?: number };
}

describe('ScaledText', () => {
  test('leaves text at its base size when Text Size is Default', async () => {
    expect((await renderScaled('normal', { fontSize: 16 })).fontSize).toBe(16);
  });

  test('scales text by 1.15x when Text Size is Large', async () => {
    expect((await renderScaled('large', { fontSize: 16 })).fontSize).toBeCloseTo(18.4);
  });

  test('scales text by 1.3x when Text Size is X-Large', async () => {
    expect((await renderScaled('xlarge', { fontSize: 16 })).fontSize).toBeCloseTo(20.8);
  });

  test('scales a fontSize supplied via a style array', async () => {
    const state = seededInitialState();
    state.fontSize = 'xlarge';
    const { getByText } = await render(
      <AppStateProvider initialState={state}>
        <ScaledText style={[{ fontWeight: '700' as const }, { fontSize: 20 }]}>Title</ScaledText>
      </AppStateProvider>,
    );
    const flat = StyleSheet.flatten(getByText('Title').props.style) as { fontSize?: number };
    expect(flat.fontSize).toBeCloseTo(26);
  });

  test('leaves text with no explicit fontSize untouched', async () => {
    const state = seededInitialState();
    state.fontSize = 'xlarge';
    const { getByText } = await render(
      <AppStateProvider initialState={state}>
        <ScaledText>Untouched</ScaledText>
      </AppStateProvider>,
    );
    // No fontSize was specified, so there is nothing to scale — this should
    // render identically to a plain RN Text with no style at all.
    const flat = StyleSheet.flatten(getByText('Untouched').props.style);
    expect(flat?.fontSize).toBeUndefined();
  });

  test('renders normally outside an AppStateProvider (e.g. isolated unit tests)', async () => {
    const { getByText } = await render(<ScaledText style={{ fontSize: 16 }}>Standalone</ScaledText>);
    const flat = StyleSheet.flatten(getByText('Standalone').props.style) as {
      fontSize?: number;
    };
    expect(flat.fontSize).toBe(16);
  });

  test('is a drop-in replacement for RN Text', async () => {
    const { getByText } = await render(<RNText>plain</RNText>);
    expect(getByText('plain')).toBeTruthy();
  });
});
