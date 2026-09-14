// Screen tests for AppointmentsScreen — list, assignee chip, add form
// validation + save, delete confirmation.
//
// RNTL v14's fireEvent helpers return promises — every call is awaited so no
// act() scope is left dangling across tests.

import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { Alert } from 'react-native';
import { AppointmentsScreen } from '../../src/screens/AppointmentsScreen';
import { seededInitialState } from '../../src/state/seed';
import { flushReact, TestAppProviders } from '../../src/testing/test-utils';

jest.spyOn(Alert, 'alert').mockImplementation(() => {});

function renderAppts() {
  return render(
    <TestAppProviders initialState={seededInitialState()}>
      <AppointmentsScreen onOpenAppointment={jest.fn()} />
    </TestAppProviders>,
  );
}

describe('AppointmentsScreen', () => {
  test('renders the seed appointments with counts', async () => {
    await renderAppts();
    expect(screen.getByText('Blood pressure check — Dr. Sharma')).toBeTruthy();
    expect(screen.getByText('Annual health review — Dr. Sharma')).toBeTruthy();
    expect(screen.getByText('Eye test')).toBeTruthy();
    expect(screen.getByText('3 upcoming')).toBeTruthy();
  });

  test('shows the assignee chip for assigned appointments only', async () => {
    await renderAppts();
    // Both a1 and a2 have Maria Thompson assigned; the eye test has none.
    expect(screen.getAllByText('✓ Maria Thompson is assigned').length).toBe(2);
  });

  test('add form rejects empty fields with inline errors', async () => {
    await renderAppts();
    await fireEvent.press(screen.getByText('+ Add appointment'));
    expect(await screen.findByText('Add appointment')).toBeTruthy();
    await fireEvent.press(screen.getByText('Save appointment'));
    expect(await screen.findByText('Enter a short title.')).toBeTruthy();
    expect(screen.getByText('Enter the date and time.')).toBeTruthy();
    expect(screen.getByText('Enter the location.')).toBeTruthy();
    expect(screen.getByText('Enter who should handle it.')).toBeTruthy();
  });

  test('add form saves a valid appointment', async () => {
    await renderAppts();
    await fireEvent.press(screen.getByText('+ Add appointment'));
    await screen.findByText('Add appointment');
    await fireEvent.changeText(screen.getByLabelText('e.g. Cardiology follow-up'), 'Dentist');
    await fireEvent.changeText(
      screen.getByLabelText('e.g. Today — 2:30 PM'),
      'Tomorrow — 9:00 am',
    );
    await fireEvent.changeText(
      screen.getByLabelText('e.g. Rochester General — Cardiology'),
      'Westfield Dental',
    );
    await fireEvent.changeText(screen.getByLabelText('e.g. Sarah (daughter)'), 'Emma Thompson');
    await flushReact();
    await fireEvent.press(screen.getByText('Save appointment'));
    await waitFor(() => {
      expect(screen.getByText('Dentist')).toBeTruthy();
      expect(screen.getByText('4 upcoming')).toBeTruthy();
    });
  });

  test('delete asks for confirmation before removing', async () => {
    await renderAppts();
    await fireEvent.press(screen.getAllByText('Delete')[0]);
    expect(Alert.alert).toHaveBeenCalledWith(
      'Delete appointment',
      expect.stringContaining('Blood pressure check'),
      expect.anything(),
    );
    const buttons = (Alert.alert as jest.Mock).mock.calls[0][2] as {
      text: string;
      onPress?: () => void;
    }[];
    buttons.find((b) => b.text === 'Delete')!.onPress!();
    await waitFor(() => {
      expect(screen.queryByText('Blood pressure check — Dr. Sharma')).toBeNull();
      expect(screen.getByText('2 upcoming')).toBeTruthy();
    });
  });
});
