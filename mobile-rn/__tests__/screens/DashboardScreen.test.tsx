// Screen tests for DashboardScreen — task counter, ordered widget sections,
// alerts, check-in feedback, and the Customize sheet's tap-based reordering.
//
// RNTL v14's fireEvent helpers return promises — every call is awaited so no
// act() scope is left dangling across tests.

import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { DashboardScreen } from '../../src/screens/DashboardScreen';
import { seededInitialState } from '../../src/state/seed';
import { TestAppProviders } from '../../src/testing/test-utils';

function renderDashboard(
  props: Partial<React.ComponentProps<typeof DashboardScreen>> = {},
) {
  return render(
    <TestAppProviders initialState={seededInitialState()}>
      <DashboardScreen
        onNavigate={jest.fn()}
        onOpenAppointment={jest.fn()}
        onOpenMessage={jest.fn()}
        {...props}
      />
    </TestAppProviders>,
  );
}

describe('DashboardScreen', () => {
  test('renders the task counter from seed data (1 med taken of 3, no check-in)', async () => {
    await renderDashboard();
    expect(screen.getByText('1 of 4 tasks done')).toBeTruthy();
    expect(screen.getByText("today's care plan progress")).toBeTruthy();
  });

  test('renders every enabled widget section in user-defined order', async () => {
    await renderDashboard();
    expect(screen.getByText("Margaret's status today")).toBeTruthy();
    expect(screen.getByText('Alerts')).toBeTruthy();
    expect(screen.getByText("Today's medications")).toBeTruthy();
    expect(screen.getByText('Next appointment')).toBeTruthy();
    expect(screen.getByText('Unread messages')).toBeTruthy();
  });

  test('shows the three seed alerts (appointment today, meds untaken, no check-in)', async () => {
    await renderDashboard();
    expect(screen.getByText('Appointment today')).toBeTruthy();
    expect(screen.getByText('2 medications not yet taken')).toBeTruthy();
    expect(screen.getByText('No check-in yet')).toBeTruthy();
    // Badge counts all three.
    expect(screen.getByText('3')).toBeTruthy();
  });

  test('check-in card records the check-in and shows feedback', async () => {
    await renderDashboard();
    // StatCard composes its accessibility label as "{label} {value}".
    await fireEvent.press(screen.getByLabelText('Check-in Not yet'));
    await waitFor(() => {
      expect(screen.getByText('✓ Check-in recorded!')).toBeTruthy();
    });
  });

  test('dismissing an alert removes it from the list', async () => {
    await renderDashboard();
    // The first alert in the list is "Appointment today".
    await fireEvent.press(screen.getAllByLabelText('Dismiss alert')[0]);
    await waitFor(() => {
      expect(screen.queryByText('Appointment today')).toBeNull();
      // The other two alerts remain.
      expect(screen.getByText('2 medications not yet taken')).toBeTruthy();
      expect(screen.getByText('No check-in yet')).toBeTruthy();
    });
  });

  test('med tile toggles taken state', async () => {
    await renderDashboard();
    // Amlodipine is untaken in the seed.
    await fireEvent.press(screen.getByLabelText('Amlodipine, 5 mg — 1 tablet, 8:30 am'));
    await waitFor(() => {
      expect(screen.getByText('2 of 4 tasks done')).toBeTruthy();
    });
  });

  test('View all navigates to the requested tab', async () => {
    const onNavigate = jest.fn();
    await renderDashboard({ onNavigate });
    await fireEvent.press(screen.getAllByText('View all →')[0]);
    expect(onNavigate).toHaveBeenCalledWith('medications');
  });

  describe('CustomizeSheet', () => {
    test('opens from the edit button and lists widgets in order', async () => {
      await renderDashboard();
      await fireEvent.press(screen.getByText('✎'));
      expect(await screen.findByText('Customize Dashboard')).toBeTruthy();
      expect(screen.getByText("Margaret's status")).toBeTruthy();
      // The dashboard behind the sheet also shows an "Alerts" heading, so
      // there are two instances once the sheet is open.
      expect(screen.getAllByText('Alerts').length).toBeGreaterThanOrEqual(2);
    });

    test('Move Up reorders the list (tap-based, WCAG 2.5.7)', async () => {
      await renderDashboard();
      await fireEvent.press(screen.getByText('✎'));
      await screen.findByText('Customize Dashboard');
      // Alerts is second; move it up above Margaret's status.
      await fireEvent.press(screen.getByLabelText('Move Alerts up'));
      await waitFor(() => {
        const rows = screen.getAllByText(/status|Alerts/);
        // After the move, the Alerts row precedes the status row in the sheet.
        const alertsIdx = rows.findIndex((r) => r.props.children === 'Alerts');
        const statusIdx = rows.findIndex((r) => r.props.children?.includes?.('status'));
        expect(alertsIdx).toBeGreaterThanOrEqual(0);
        expect(statusIdx).toBeGreaterThan(alertsIdx);
      });
    });

    test('exposes a drag handle per row as a convenience alongside the tap buttons', async () => {
      // Regression test for "can't drag to re-order, was able to do this in
      // Flutter" — dashboard_screen.dart's ReorderableListView keeps its
      // Move Up/Down semantics AND offers a drag handle; this asserts the RN
      // port now offers both too. (The drag gesture itself is driven by
      // PanResponder's native touch-history tracking, which Jest can't
      // simulate meaningfully — this is covered by the tap-based Move
      // Up/Down test above and by manual verification in the running app.)
      await renderDashboard();
      await fireEvent.press(screen.getByText('✎'));
      await screen.findByText('Customize Dashboard');
      expect(screen.getByLabelText('Drag to reorder Alerts')).toBeTruthy();
      expect(screen.getByText(/Long-press and drag/)).toBeTruthy();
    });

    test('visibility toggle hides the section from the dashboard', async () => {
      await renderDashboard();
      await fireEvent.press(screen.getByText('✎'));
      await screen.findByText('Customize Dashboard');
      await fireEvent.press(screen.getByLabelText('Alerts visibility'));
      await fireEvent.press(screen.getByText('Done'));
      await waitFor(() => {
        expect(screen.queryByText('No check-in yet')).toBeNull();
      });
    });
  });
});
