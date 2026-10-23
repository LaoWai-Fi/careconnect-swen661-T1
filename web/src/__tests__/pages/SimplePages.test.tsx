import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import Caregiver from '../../pages/Caregiver';
import Contacts from '../../pages/Contacts';

describe('Contacts', () => {
  it('separates emergency contacts from other contacts and offers call links', () => {
    render(<MemoryRouter><Contacts /></MemoryRouter>);
    expect(screen.getByRole('heading', { level: 1, name: 'Contacts' })).toBeInTheDocument();
    expect(screen.getByRole('region', { name: 'Emergency contacts' })).toBeInTheDocument();
    expect(screen.getByRole('region', { name: 'Other contacts' })).toBeInTheDocument();
    expect(screen.getAllByRole('link', { name: /^Call / }).length).toBeGreaterThan(0);
  });
});

describe('Caregiver notes', () => {
  it('lists existing notes grouped by date', () => {
    render(<MemoryRouter><Caregiver /></MemoryRouter>);
    expect(screen.getByRole('heading', { level: 1, name: 'Caregiver Notes' })).toBeInTheDocument();
    expect(screen.getAllByRole('region', { name: /^Notes for/ }).length).toBeGreaterThan(0);
  });

  it('adds a note with a chosen priority and can cancel composing', async () => {
    render(<MemoryRouter><Caregiver /></MemoryRouter>);
    await userEvent.click(screen.getByRole('button', { name: 'Add note' }));
    const save = screen.getByRole('button', { name: 'Save note' });
    expect(save).toBeDisabled();
    const buttons = screen.getAllByRole('button', { pressed: false });
    await userEvent.click(buttons.find((b) => b.className.includes('btn-secondary'))!);
    await userEvent.type(screen.getByLabelText('Note'), 'Ate well at lunch');
    await userEvent.click(save);
    expect(await screen.findByText('Ate well at lunch')).toBeInTheDocument();
    expect(screen.queryByRole('region', { name: 'Add a new caregiver note' })).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Add note' }));
    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(screen.queryByRole('region', { name: 'Add a new caregiver note' })).not.toBeInTheDocument();
  });
});
