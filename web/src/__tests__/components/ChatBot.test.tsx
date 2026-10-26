import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ChatBot from '../../components/ChatBot';

async function ask(text: string) {
  await userEvent.type(screen.getByPlaceholderText('Ask a question…'), `${text}{Enter}`);
}

describe('ChatBot', () => {
  beforeEach(async () => {
    render(<ChatBot />);
    await userEvent.click(screen.getByRole('button', { name: /open assistant/i }));
  });

  it('opens with a welcome message and closes with Escape, returning focus', async () => {
    expect(screen.getAllByText(/I'm the CareConnect assistant/).length).toBeGreaterThan(0);
    await userEvent.keyboard('{Escape}');
    const launcher = screen.getByRole('button', { name: /open assistant/i });
    expect(launcher).toHaveFocus();
  });

  it('closes from the close button', async () => {
    await userEvent.click(screen.getAllByRole('button', { name: 'Close assistant' })[0]);
    expect(screen.getByRole('button', { name: /open assistant/i })).toBeInTheDocument();
  });

  it.each([
    ['what dosage should I take', /not able to give medical/i],
    ['is my data private', /privacy matters/i],
    ['what is careconnect', /companion app for caregivers/i],
    ['who is this for', /CareConnect is for caregivers/i],
    ['I want to sign up', /click the 'Sign up'/i],
    ['I want to log in', /go straight to your dashboard/i],
    ['tell me the feature list', /caregiver dashboard/i],
    ['is it free', /free to use/i],
    ['hello', /Great to meet you/i],
    ['thanks', /very welcome/i],
    ['zzz', /here to help you learn/i],
  ])('answers "%s"', async (question, expected) => {
    await ask(question);
    expect((await screen.findAllByText(expected)).length).toBeGreaterThan(0);
  });

  it('never mentions a care recipient view', async () => {
    await ask('tell me the feature list');
    await screen.findAllByText(/caregiver dashboard/i);
    expect(document.body.textContent ?? '').not.toMatch(/choose your view|memory cards|My Day/i);
  });

  it('ignores empty input and sends via the button', async () => {
    await userEvent.click(screen.getByRole('button', { name: 'Send message' }));
    await userEvent.type(screen.getByPlaceholderText('Ask a question…'), 'is it free');
    await userEvent.click(screen.getByRole('button', { name: 'Send message' }));
    expect((await screen.findAllByText(/free to use/i)).length).toBeGreaterThan(0);
    expect(within(document.body).queryByRole('status', { name: 'Assistant is typing' })).not.toBeInTheDocument();
  });
});
