// RNTL component tests for FormField / Input.

import { render, screen, fireEvent } from '@testing-library/react-native';
import { FormField, Input } from '../../src/components/FormField';

describe('FormField', () => {
  it('renders the label above the child', async () => {
    await render(
      <FormField label="Medication name">
        <Input value="" onChangeText={() => {}} />
      </FormField>,
    );
    expect(screen.getByText('Medication name')).toBeTruthy();
  });

  it('marks required fields with a red asterisk', async () => {
    await render(
      <FormField label="Name" required>
        <Input value="" onChangeText={() => {}} />
      </FormField>,
    );
    expect(screen.getByText('*')).toBeTruthy();
  });

  it('shows the error text and hides the hint when both are set', async () => {
    await render(
      <FormField label="Dose" hint="e.g. 5 mg" error="Dose is required">
        <Input value="" onChangeText={() => {}} hasError />
      </FormField>,
    );
    expect(screen.getByText('Dose is required')).toBeTruthy();
    expect(screen.queryByText('e.g. 5 mg')).toBeNull();
  });

  it('shows the hint when there is no error', async () => {
    await render(
      <FormField label="Dose" hint="e.g. 5 mg">
        <Input value="" onChangeText={() => {}} />
      </FormField>,
    );
    expect(screen.getByText('e.g. 5 mg')).toBeTruthy();
    expect(screen.queryByText('Dose is required')).toBeNull();
  });
});

describe('Input', () => {
  it('passes typing through to onChangeText', async () => {
    const onChange = jest.fn();
    await render(<Input value="" onChangeText={onChange} placeholder="Name" />);
    fireEvent.changeText(screen.getByPlaceholderText('Name'), 'Amlodipine');
    expect(onChange).toHaveBeenCalledWith('Amlodipine');
  });

  it('uses the visible FormField label rather than its example placeholder', async () => {
    await render(
      <FormField label="Medication name" hint="Enter the name on the prescription">
        <Input value="" onChangeText={() => {}} placeholder="e.g. Metformin" />
      </FormField>,
    );
    const input = screen.getByLabelText('Medication name');
    expect(input.props.accessibilityHint).toBe('Enter the name on the prescription');
  });

  it('announces validation feedback as the input hint', async () => {
    await render(
      <FormField label="Dose" error="Enter the dose.">
        <Input value="" onChangeText={() => {}} placeholder="e.g. 500 mg" hasError />
      </FormField>,
    );
    const input = screen.getByLabelText('Dose');
    expect(input.props.accessibilityHint).toBe('Enter the dose.');
  });
});
