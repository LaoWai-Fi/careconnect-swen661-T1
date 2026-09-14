// RNTL component tests for the cards module.

import { render, screen, fireEvent } from '@testing-library/react-native';
import { AlertCard, Logo, StatCard } from '../../src/components/Cards';

describe('Logo', () => {
  it('renders with an accessibility label', async () => {
    await render(<Logo />);
    expect(screen.getByLabelText('CareConnect logo')).toBeTruthy();
  });
});

describe('StatCard', () => {
  it('shows label, value and sub text', async () => {
    await render(
      <StatCard
        icon="💊"
        label="Medications"
        value="2 of 3"
        sub="taken today"
        bg="#FFFFFF"
        borderColor="#5D7B68"
      />,
    );
    expect(screen.getByText('MEDICATIONS')).toBeTruthy();
    expect(screen.getByText('2 of 3')).toBeTruthy();
    expect(screen.getByText('taken today')).toBeTruthy();
  });

  it('fires onPress when tappable', async () => {
    const onPress = jest.fn();
    await render(
      <StatCard
        icon="💊"
        label="Medications"
        value="2 of 3"
        sub=""
        bg="#FFFFFF"
        borderColor="#000"
        onPress={onPress}
      />,
    );
    fireEvent.press(screen.getByRole('button', { name: /Medications/ }));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('is not pressable without an onPress', async () => {
    await render(
      <StatCard icon="💊" label="Medications" value="1" sub="" bg="#FFF" borderColor="#000" />,
    );
    const card = screen.getByRole('button', { name: /Medications/ });
    expect(card.props.accessibilityState?.disabled).toBe(true);
  });
});

describe('AlertCard', () => {
  it('renders title and body', async () => {
    await render(
      <AlertCard
        icon="⚠️"
        title="Appointment today"
        body="Blood pressure check at 10:00 am"
        onDismiss={() => {}}
      />,
    );
    expect(screen.getByText('Appointment today')).toBeTruthy();
    expect(screen.getByText('Blood pressure check at 10:00 am')).toBeTruthy();
  });

  it('fires onDismiss from the dismiss button', async () => {
    const onDismiss = jest.fn();
    await render(<AlertCard icon="⚠️" title="Appointment today" body="..." onDismiss={onDismiss} />);
    fireEvent.press(screen.getByLabelText('Dismiss alert'));
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });
});
