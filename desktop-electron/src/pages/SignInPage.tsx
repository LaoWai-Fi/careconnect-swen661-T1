import { useState } from 'react';
import Logo from '../components/Logo';
import TapButton from '../components/TapButton';
import FormField, { Input } from '../components/FormField';
import type { Page } from '../types';

interface Props {
  navigate: (p: Page) => void;
  onSignIn: (name: string) => void;
}

export default function SignInPage({ navigate, onSignIn }: Props) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  function validate() {
    const e: Record<string, string> = {};
    if (!email.trim()) e.email = 'Email is required.';
    if (!password) e.password = 'Password is required.';
    return e;
  }

  function handleSubmit(ev: React.FormEvent) {
    ev.preventDefault();
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    setLoading(true);
    setTimeout(() => {
      onSignIn(email.split('@')[0] || 'Joyce');
    }, 700);
  }

  return (
    <div className="min-h-full flex flex-col bg-[var(--background)]">
      <header className="flex items-center gap-2 px-4 pb-3 bg-[var(--card)] border-b border-[var(--border)]" style={{ paddingTop: 'max(env(safe-area-inset-top), 72px)' }}>
        <Logo size={32} />
        <span className="font-bold text-lg">
          <span className="text-[var(--primary)]">Care</span>Connect
        </span>
      </header>

      <main className="flex-1 flex items-start justify-center px-4 py-10">
        <div className="w-full max-w-md bg-[var(--card)] rounded-2xl shadow-sm border border-[var(--border)] p-6 sm:p-8">
          <h1 className="text-2xl font-bold text-[var(--foreground)] text-center mb-1">Welcome back</h1>
          <p className="text-[var(--muted-foreground)] text-center mb-6">Sign in to your CareConnect account.</p>

          <form onSubmit={handleSubmit} noValidate className="space-y-5">
            <FormField label="Email address" required error={errors.email}>
              <Input
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                error={!!errors.email}
                aria-required="true"
              />
            </FormField>

            <FormField label="Password" required hint="Any password works — this is a demonstration app." error={errors.password}>
              <Input
                type="password"
                placeholder=""
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                error={!!errors.password}
                aria-required="true"
              />
            </FormField>

            <TapButton type="submit" variant="primary" size="lg" fullWidth disabled={loading}>
              {loading ? 'Signing in…' : '→  Sign in'}
            </TapButton>
          </form>

          <p className="text-center text-[var(--muted-foreground)] mt-5 text-sm">
            Don't have an account?{' '}
            <button
              onClick={() => navigate('signup')}
              className="text-[var(--primary)] font-semibold underline underline-offset-2 focus-visible:outline-2 focus-visible:outline-[var(--ring)]"
            >
              Sign up for free
            </button>
          </p>
        </div>
      </main>
    </div>
  );
}
