import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ManageMedications from '../../pages/ManageMedications';
import { getMedications } from '../../data/medsStore';
import { getActivityLog } from '../../data/caregiverStore';

async function openAddForm() {
  await userEvent.click(screen.getByRole('button', { name: 'Add new medication' }));
  return screen.findByRole('heading', { name: 'Add new medication' });
}

describe('ManageMedications', () => {
  it('lists the seeded medications with edit and delete actions', () => {
    render(<ManageMedications />);
    expect(screen.getByRole('heading', { level: 1, name: /manage medications/i })).toBeInTheDocument();
    getMedications().forEach((med) => {
      expect(screen.getByRole('article', { name: `${med.name} prescription` })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: `Edit ${med.name}` })).toBeInTheDocument();
    });
  });

  it('validates required fields and moves focus to the error summary', async () => {
    render(<ManageMedications />);
    await openAddForm();
    await userEvent.click(screen.getByRole('button', { name: 'Add medication' }));
    expect((await screen.findAllByText('Medication name is required.')).length).toBeGreaterThan(0);
    expect(screen.getAllByText('Dosage is required.').length).toBeGreaterThan(0);
    expect(screen.getAllByText('At least one scheduled time is required.').length).toBeGreaterThan(0);
  });

  it('adds a medication, confirms it and logs the activity', async () => {
    render(<ManageMedications />);
    await openAddForm();
    await userEvent.type(screen.getByLabelText(/medication name/i), 'Lisinopril');
    await userEvent.type(screen.getByLabelText(/^dose/i), '10 mg');
    await userEvent.type(screen.getByLabelText('Time'), '09:30');
    await userEvent.type(screen.getByLabelText(/instructions/i), 'Take with water');
    await userEvent.click(screen.getByRole('button', { name: 'Add medication' }));

    const card = await screen.findByRole('article', { name: 'Lisinopril prescription' });
    expect(within(card).getByText('9:30 am')).toBeInTheDocument();
    expect(within(card).getByText('Take with water')).toBeInTheDocument();
    expect(screen.getByRole('status', { name: 'Medication updates' })).toHaveTextContent('Lisinopril saved');
    expect(getMedications().some((m) => m.name === 'Lisinopril')).toBe(true);
    expect(getActivityLog()[0].label).toBe("Added Lisinopril to Margaret's medications");
  });

  it('supports several schedule times and removing one', async () => {
    render(<ManageMedications />);
    await openAddForm();
    await userEvent.click(screen.getByRole('button', { name: 'Add another time to the schedule' }));
    expect(screen.getByLabelText('Time 1')).toBeInTheDocument();
    expect(screen.getByLabelText('Time 2')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Remove time 2' }));
    expect(screen.getByLabelText('Time')).toBeInTheDocument();
  });

  it('edits an existing medication', async () => {
    render(<ManageMedications />);
    const [med] = getMedications();
    await userEvent.click(screen.getByRole('button', { name: `Edit ${med.name}` }));
    expect(await screen.findByRole('heading', { name: 'Edit medication' })).toBeInTheDocument();
    const dose = screen.getByLabelText(/^dose/i);
    await userEvent.clear(dose);
    await userEvent.type(dose, '99 mg');
    await userEvent.click(screen.getByRole('button', { name: 'Save changes' }));
    expect(await screen.findByText('99 mg')).toBeInTheDocument();
    expect(getMedications()[0].dosage).toBe('99 mg');
  });

  it('cancels the form without saving', async () => {
    render(<ManageMedications />);
    const before = getMedications().length;
    await openAddForm();
    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(screen.queryByRole('heading', { name: 'Add new medication' })).not.toBeInTheDocument();
    expect(getMedications()).toHaveLength(before);
  });

  it('asks for confirmation before deleting a medication', async () => {
    render(<ManageMedications />);
    const [med] = getMedications();
    const before = getMedications().length;
    await userEvent.click(screen.getByRole('button', { name: `Delete ${med.name}` }));
    await userEvent.click(await screen.findByRole('button', { name: 'Yes, delete' }));
    expect(screen.queryByRole('article', { name: `${med.name} prescription` })).not.toBeInTheDocument();
    expect(getMedications()).toHaveLength(before - 1);
  });

  it('shows an empty state when every medication is removed', async () => {
    render(<ManageMedications />);
    for (const med of getMedications()) {
      await userEvent.click(screen.getByRole('button', { name: `Delete ${med.name}` }));
      await userEvent.click(await screen.findByRole('button', { name: 'Yes, delete' }));
    }
    expect(await screen.findByText('No medications added yet')).toBeInTheDocument();
  });
});
