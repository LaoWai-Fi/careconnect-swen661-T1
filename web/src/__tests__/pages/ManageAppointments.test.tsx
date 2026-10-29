import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ManageAppointments from '../../pages/ManageAppointments';
import { getAppointments } from '../../data/apptStore';

async function openAddForm() {
  await userEvent.click(screen.getByRole('button', { name: 'Add new appointment' }));
  return screen.findByRole('heading', { name: 'Add new appointment' });
}

describe('ManageAppointments', () => {
  it('lists appointments with edit and delete actions', () => {
    render(<ManageAppointments />);
    expect(screen.getByRole('heading', { level: 1, name: /manage appointments/i })).toBeInTheDocument();
    getAppointments().forEach((appt) => {
      expect(screen.getByRole('button', { name: `Edit: ${appt.title}` })).toBeInTheDocument();
    });
  });

  it('validates required fields', async () => {
    render(<ManageAppointments />);
    await openAddForm();
    await userEvent.click(screen.getByRole('button', { name: /^add appointment$|^save appointment$/i }));
    expect((await screen.findAllByText('Appointment title is required.')).length).toBeGreaterThan(0);
    expect(screen.getAllByText('Date is required.').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Time is required.').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Location name is required.').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Location type is required.').length).toBeGreaterThan(0);
  });

  it('adds an appointment', async () => {
    render(<ManageAppointments />);
    const before = getAppointments().length;
    await openAddForm();
    await userEvent.type(screen.getByLabelText(/appointment title/i), 'Eye test');
    await userEvent.type(screen.getByLabelText(/^date/i), '2030-01-15');
    await userEvent.type(screen.getByLabelText(/^time/i), '14:00');
    await userEvent.selectOptions(screen.getByLabelText(/location type/i), 'clinic');
    await userEvent.type(screen.getByLabelText(/location name/i), 'Vision Centre');
    await userEvent.click(screen.getByRole('button', { name: /^add appointment$|^save appointment$/i }));
    expect(await screen.findByRole('button', { name: 'Edit: Eye test' })).toBeInTheDocument();
    expect(getAppointments()).toHaveLength(before + 1);
  });

  it('edits an appointment and cancels another form', async () => {
    render(<ManageAppointments />);
    const [appt] = getAppointments();
    await userEvent.click(screen.getByRole('button', { name: `Edit: ${appt.title}` }));
    const title = await screen.findByLabelText(/appointment title/i);
    await userEvent.clear(title);
    await userEvent.type(title, 'Renamed visit');
    await userEvent.click(screen.getByRole('button', { name: /save/i }));
    expect(await screen.findByRole('button', { name: 'Edit: Renamed visit' })).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Add new appointment' }));
    await userEvent.click(await screen.findByRole('button', { name: 'Cancel' }));
    expect(screen.queryByRole('heading', { name: 'Add new appointment' })).not.toBeInTheDocument();
  });

  it('deletes an appointment after confirmation', async () => {
    render(<ManageAppointments />);
    const [appt] = getAppointments();
    await userEvent.click(screen.getByRole('button', { name: `Delete: ${appt.title}` }));
    await userEvent.click(await screen.findByRole('button', { name: 'Yes, delete' }));
    expect(screen.queryByRole('button', { name: `Edit: ${appt.title}` })).not.toBeInTheDocument();
    // a polite status message tells screen reader users the delete happened
    await waitFor(() => expect(screen.getByRole('status', { name: 'Appointment updates' })).toHaveTextContent(`${appt.title} deleted.`));
  });
});
