import { CCTokens, palette } from '../../src/theme/tokens';

describe('CCTokens', () => {
  it('exposes the primary brand colors from the Flutter app', () => {
    expect(CCTokens.primaryLight).toBe('#1B6E7A');
    expect(CCTokens.primaryHoverLight).toBe('#155E6A');
    expect(CCTokens.primaryActiveLight).toBe('#114F59');
    expect(CCTokens.primaryDark).toBe('#4CC8D8');
  });

  it('keeps radius and sizing tokens in sync with the Flutter design system', () => {
    expect(CCTokens.radius).toBe(12);
    expect(CCTokens.minTarget).toBe(48);
    expect(CCTokens.buttonSm).toBe(48);
    expect(CCTokens.buttonMd).toBe(52);
    expect(CCTokens.buttonLg).toBe(60);
    expect(CCTokens.focusOutlineWidth).toBe(3);
    expect(CCTokens.focusOutlineOffset).toBe(2);
  });

  it('gives every color token a light and a dark value', () => {
    const colorKeys = Object.keys(CCTokens).filter(
      (key) => key.endsWith('Light') || key.endsWith('Dark'),
    );
    expect(colorKeys.length).toBeGreaterThan(40);
    for (const key of colorKeys) {
      expect(CCTokens[key as keyof typeof CCTokens]).toMatch(/^#[0-9A-Fa-f]{6}$/);
    }
  });
});

describe('palette', () => {
  it('resolves light scheme colors', () => {
    const light = palette('light');
    expect(light.primary).toBe('#1B6E7A');
    expect(light.onPrimary).toBe('#FFFFFF');
    expect(light.background).toBe('#F0F4F7');
    expect(light.surface).toBe('#FFFFFF');
    expect(light.onSurface).toBe('#1A2B35');
    expect(light.error).toBe('#B91C1C');
  });

  it('resolves dark scheme colors', () => {
    const dark = palette('dark');
    expect(dark.primary).toBe('#4CC8D8');
    expect(dark.onPrimary).toBe('#07141A');
    expect(dark.background).toBe('#0F1E25');
    expect(dark.surface).toBe('#162630');
    expect(dark.onSurface).toBe('#E6EFF4');
    expect(dark.error).toBe('#F87171');
  });

  it('uses higher-contrast surfaces in dark mode', () => {
    const light = palette('light');
    const dark = palette('dark');
    expect(dark.surfaceHighest).not.toBe(dark.surface);
    expect(dark.onSurfaceVariant).not.toBe(light.onSurfaceVariant);
    expect(dark.outline).not.toBe(light.outline);
  });
});
