import { useState } from 'react';
import Logo from '../components/Logo';
import TapButton from '../components/TapButton';
import FormField, { Input } from '../components/FormField';
import type { Page } from '../types';

interface Props {
  navigate: (p: Page) => void;
  onSignUp: (name: string) => void;
}

export default function SignUpPage({ navigate, onSignUp }: Props) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  function validate() {
    const e: Record<string, string> = {};
    if (!name.trim()) e.name = 'Name is required.';
    if (!email.trim()) e.email = 'Email is required.';
    if (password.length < 6) e.password = 'Password must be at least 6 characters.';
    if (password !== confirm) e.confirm = 'Passwords do not match.';
    return e;
  }

  function handleSubmit(ev: React.FormEvent) {
    ev.preventDefault();
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    setLoading(true);
    setTimeout(() => onSignUp(name.trim() || 'Joyce'), 700);
  }

  return (
    <div className="min-h-full flex flex-col bg-[var(--background)]">
      <header className="flex items-center gap-2 px-4 pb-3 bg-[var(--card)] border-b border-[var(--border)]" style={{ paddingTop: 'max(env(safe-area-inset-top), 72px)' }}>
        <Logo size={32} />
        <span className="font-bold text-lg">
          <span className="text-[var(--primary)]">Care</span>Connect
        </span>
      </header>

      <main className="flex-1 flex items-start justify-center px-4 py-8">
        <div className="w-full max-w-md bg-[var(--card)] rounded-2xl shadow-sm border border-[var(--border)] p-6 sm:p-8">
          <h1 className="text-2xl font-bold text-[var(--foreground)] text-center mb-1">Create your account</h1>
          <p className="text-[var(--muted-foreground)] text-center mb-6">Free, private, and takes under two minutes.</p>

          <form onSubmit={handleSubmit} noValidate className="space-y-5">
            <FormField label="Your name" required hint="This is how CareConnect will greet you." error={errors.name}>
              <Input
                type="text"
                placeholder="e.g. Dorothy Smith"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoComplete="name"
                error={!!errors.name}
              />
            </FormField>

            <FormField label="Email address" required error={errors.email}>
              <Input
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                error={!!errors.email}
              />
            </FormField>

            <FormField label="Password" required hint="At least 6 characters." error={errors.password}>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="new-password"
                error={!!errors.password}
              />
            </FormField>

            <FormField label="Confirm password" required error={errors.confirm}>
              <Input
                type="password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                autoComplete="new-password"
                error={!!errors.confirm}
              />
            </FormField>

            <TapButton type="submit" variant="primary" size="lg" fullWidth disabled={loading}>
              {loading ? 'Creating account…' : 'Create account →'}
            </TapButton>
          </form>

          <p className="text-center text-[var(--muted-foreground)] mt-5 text-sm">
            Already have an account?{' '}
            <button
              onClick={() => navigate('signin')}
              className="text-[var(--primary)] font-semibold underline underline-offset-2 focus-visible:outline-2 focus-visible:outline-[var(--ring)]"
            >
              Sign in
            </button>
          </p>
        </div>
      </main>
    </div>
  );
}
