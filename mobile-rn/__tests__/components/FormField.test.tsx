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

  it('exposes the placeholder as an accessibility label', async () => {
    await render(<Input value="" onChangeText={() => {}} placeholder="Medication name" />);
    expect(screen.getByLabelText('Medication name')).toBeTruthy();
  });
});
