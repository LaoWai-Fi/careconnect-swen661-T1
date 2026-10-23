import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Button } from '../../components';

describe('Button', () => {
  it('calls onClick for a primary button', async () => {
    const onClick = jest.fn();
    render(<Button onClick={onClick}>Save</Button>);
    await userEvent.click(screen.getByRole('button', { name: 'Save' }));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('does not call onClick when disabled', async () => {
    const onClick = jest.fn();
    render(<Button disabled onClick={onClick}>Save</Button>);
    const button = screen.getByRole('button', { name: 'Save' });
    expect(button).toBeDisabled();
    await userEvent.click(button);
    expect(onClick).not.toHaveBeenCalled();
  });

  it('uses the aria-label as the accessible name and hides the icon', () => {
    render(<Button aria-label="Mark Aspirin as taken" icon={<svg data-testid="icon" />}>Mark</Button>);
    expect(screen.getByRole('button', { name: 'Mark Aspirin as taken' })).toBeInTheDocument();
    expect(screen.getByTestId('icon').parentElement).toHaveAttribute('aria-hidden', 'true');
  });

  it('asks for confirmation before running a danger action', async () => {
    const onClick = jest.fn();
    render(
      <Button variant="danger" onClick={onClick} confirmTitle="Delete it?" confirmLabel="Yes, delete">
        Delete
      </Button>,
    );
    await userEvent.click(screen.getByRole('button', { name: 'Delete' }));
    expect(onClick).not.toHaveBeenCalled();
    expect(screen.getByRole('dialog', { name: 'Delete it?' })).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Yes, delete' }));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('cancels a danger action without running it', async () => {
    const onClick = jest.fn();
    render(<Button variant="danger" onClick={onClick}>Delete</Button>);
    await userEvent.click(screen.getByRole('button', { name: 'Delete' }));
    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(onClick).not.toHaveBeenCalled();
  });
});
