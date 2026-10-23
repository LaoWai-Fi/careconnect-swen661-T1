import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Field } from '../../components';

describe('Field', () => {
  it('associates the visible label with the input', async () => {
    render(<Field label="Email address" type="email" />);
    const input = screen.getByLabelText(/email address/i);
    await userEvent.type(input, 'joyce@example.com');
    expect(input).toHaveValue('joyce@example.com');
  });

  it('describes the input with its hint', () => {
    render(<Field label="Dosage" hint="For example 5 mg" />);
    expect(screen.getByLabelText(/dosage/i)).toHaveAccessibleDescription(/for example 5 mg/i);
  });

  it('marks the input invalid and exposes the error message', () => {
    render(<Field label="Email address" error="Enter a valid email address" />);
    const input = screen.getByLabelText(/email address/i);
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(input).toHaveAccessibleDescription(/enter a valid email address/i);
  });

  it('marks required fields', () => {
    render(<Field label="Name" required />);
    expect(screen.getByLabelText(/name/i)).toBeRequired();
  });

  it('renders a textarea when multiline', () => {
    render(<Field label="Notes" multiline />);
    expect(screen.getByLabelText(/notes/i).tagName).toBe('TEXTAREA');
  });
});
