// Screen tests for MedicationsScreen — list rendering, taken toggle with
// feedback, add form validation, and delete confirmation.
//
// RNTL v14's fireEvent helpers return promises — every call is awaited so no
// act() scope is left dangling across tests.

import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { Alert } from 'react-native';
import { MedicationsScreen } from '../../src/screens/MedicationsScreen';
import { seededInitialState } from '../../src/state/seed';
import { flushReact, TestAppProviders } from '../../src/testing/test-utils';

jest.spyOn(Alert, 'alert').mockImplementation(() => {});

function renderMeds() {
  return render(
    <TestAppProviders initialState={seededInitialState()}>
      <MedicationsScreen onOpenMedication={jest.fn()} />
    </TestAppProviders>,
  );
}

describe('MedicationsScreen', () => {
  test('renders the seed medications with taken counts', async () => {
    await renderMeds();
    expect(screen.getByText('Amlodipine')).toBeTruthy();
    expect(screen.getByText('Metformin')).toBeTruthy();
    expect(screen.getByText('Vitamin D3')).toBeTruthy();
    expect(screen.getByText('1 of 3 taken today')).toBeTruthy();
  });

  test('marking a medication taken shows ✓ Taken! feedback', async () => {
    await renderMeds();
    await fireEvent.press(screen.getAllByText('Mark as taken')[0]);
    await waitFor(() => {
      expect(screen.getByText('✓ Taken!')).toBeTruthy();
    });
  });

  test('add form rejects empty fields with inline errors', async () => {
    await renderMeds();
    await fireEvent.press(screen.getByText('+ Add medication'));
    expect(await screen.findByText('Add medication')).toBeTruthy();
    await fireEvent.press(screen.getByText('Save medication'));
    expect(await screen.findByText('Enter the medication name.')).toBeTruthy();
    expect(screen.getByText('Enter the dose, e.g. 100 mg.')).toBeTruthy();
    expect(screen.getByText('Enter the scheduled time.')).toBeTruthy();
  });

  test('add form saves a valid medication to the list', async () => {
    await renderMeds();
    await fireEvent.press(screen.getByText('+ Add medication'));
    await screen.findByText('Add medication');
    await fireEvent.changeText(screen.getByLabelText('e.g. Metformin'), 'Lisinopril');
    await fireEvent.changeText(screen.getByLabelText('e.g. 500 mg'), '10 mg — 1 tablet');
    await fireEvent.changeText(screen.getByLabelText('e.g. 8:00 AM'), '9:00 pm');
    await flushReact();
    await fireEvent.press(screen.getByText('Save medication'));
    await waitFor(() => {
      expect(screen.getByText('Lisinopril')).toBeTruthy();
      // The new med starts untaken: still 1 taken, now out of 4 total.
      expect(screen.getByText('1 of 4 taken today')).toBeTruthy();
    });
  });

  test('delete asks for confirmation before removing', async () => {
    await renderMeds();
    await fireEvent.press(screen.getAllByText('Delete')[0]);
    expect(Alert.alert).toHaveBeenCalledWith(
      'Delete medication',
      expect.stringContaining('Amlodipine'),
      expect.anything(),
    );
    const buttons = (Alert.alert as jest.Mock).mock.calls[0][2] as {
      text: string;
      onPress?: () => void;
    }[];
    buttons.find((b) => b.text === 'Delete')!.onPress!();
    await waitFor(() => {
      expect(screen.queryByText('Amlodipine')).toBeNull();
      expect(screen.getByText('1 of 2 taken today')).toBeTruthy();
    });
  });
});
