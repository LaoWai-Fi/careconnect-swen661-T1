// RNTL component tests for the settings sheet.

import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import { SettingsSheet } from '../../src/components/SettingsSheet';
import { TestAppProviders } from '../../src/testing/test-utils';

function renderSheet(props: Partial<React.ComponentProps<typeof SettingsSheet>> = {}) {
  return render(
    <TestAppProviders>
      <SettingsSheet visible onClose={() => {}} {...props} />
    </TestAppProviders>,
  );
}

describe('SettingsSheet', () => {
  it('renders the three setting sections', async () => {
    await renderSheet();
    expect(screen.getByText('Settings')).toBeTruthy();
    expect(screen.getByText('APPEARANCE')).toBeTruthy();
    expect(screen.getByText('ONE-HANDED MODE')).toBeTruthy();
    expect(screen.getByText('TEXT SIZE')).toBeTruthy();
  });

  it('switches One-Handed Mode to Left (chip becomes selected)', async () => {
    await renderSheet();
    expect(screen.getByText('👈 Left').parent?.props.accessibilityState?.selected).toBeFalsy();
    fireEvent.press(screen.getByText('👈 Left'));
    await waitFor(() =>
      expect(screen.getByText('👈 Left').parent?.props.accessibilityState?.selected).toBe(true),
    );
  });

  it('switches Text Size to Large (chip becomes selected)', async () => {
    await renderSheet();
    fireEvent.press(screen.getByText('Large'));
    await waitFor(() =>
      expect(screen.getByText('Large').parent?.props.accessibilityState?.selected).toBe(true),
    );
  });

  it('closes via the backdrop', async () => {
    const onClose = jest.fn();
    await renderSheet({ onClose });
    fireEvent.press(screen.getByLabelText('Close settings'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('signs out from the sheet', async () => {
    const onSignOut = jest.fn();
    const onClose = jest.fn();
    await renderSheet({ onSignOut, onClose });
    fireEvent.press(screen.getByRole('button', { name: 'Sign out' }));
    expect(onClose).toHaveBeenCalled();
    expect(onSignOut).toHaveBeenCalled();
  });
});
