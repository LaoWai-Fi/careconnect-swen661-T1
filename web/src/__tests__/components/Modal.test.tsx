import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Modal from '../../components/Modal';

describe('Modal', () => {
  it('is not shown when closed', () => {
    render(<Modal open={false} title="Details" onClose={() => {}}><p>Body</p></Modal>);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('shows a labelled, described dialog when open', () => {
    render(<Modal open title="Details" description="More information" onClose={() => {}}><p>Body</p></Modal>);
    const dialog = screen.getByRole('dialog', { name: 'Details' });
    expect(dialog).toHaveAccessibleDescription('More information');
    expect(dialog).toHaveAttribute('open');
  });

  it('closes from the close button', async () => {
    const onClose = jest.fn();
    render(<Modal open title="Details" onClose={onClose}><p>Body</p></Modal>);
    await userEvent.click(screen.getByRole('button', { name: 'Close dialog' }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('closes on Escape (native cancel event)', () => {
    const onClose = jest.fn();
    render(<Modal open title="Details" onClose={onClose}><p>Body</p></Modal>);
    screen.getByRole('dialog').dispatchEvent(new Event('cancel', { cancelable: true }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('keeps Tab focus inside the dialog', async () => {
    // jsdom has no layout, so report every control as rendered for the focus-trap check.
    const rects = jest.spyOn(Element.prototype, 'getClientRects')
      .mockReturnValue([{}] as unknown as DOMRectList);
    render(
      <Modal open title="Details" onClose={() => {}}>
        <button type="button" data-autofocus>First</button>
        <button type="button">Last</button>
      </Modal>,
    );
    const first = screen.getByRole('button', { name: 'First' });
    const last = screen.getByRole('button', { name: 'Last' });
    expect(first).toHaveFocus();
    last.focus();
    await userEvent.tab();
    expect(screen.getByRole('button', { name: 'Close dialog' })).toHaveFocus();
    rects.mockRestore();
  });
});
