// Sign in / Sign up — RN port of auth_screens.dart.
//
// Client-side validation with inline errors, a fake 700ms network delay on
// submit (mirrors the Flutter version's Future.delayed), and the shared
// AuthHeader (logo + wordmark). Sign-in derives the display name from the
// email local-part.

import { useCallback, useEffect, useRef, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { ScaledText as Text } from '../components/ScaledText';
import { Logo } from '../components/Cards';
import { TapButton } from '../components/TapButton';
import { FormField, Input } from '../components/FormField';
import { useAppState, type AppAction } from '../state/AppState';
import { useAppTheme } from '../hooks/useAppTheme';

export interface SignInScreenProps {
  onBack: () => void;
}

/** Shared fake-network-delay sign-in. The timer is tracked so it can be
 * cleared on unmount (tests re-render frequently; a stray timer would fire
 * into an unmounted component). */
function useFakeSignIn() {
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );
  return useCallback((name: string, dispatch: (a: AppAction) => void) => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => dispatch({ type: 'signIn', name }), 700);
  }, []);
}

export function SignInScreen({ onBack }: SignInScreenProps) {
  const { dispatch } = useAppState();
  const { p, scheme } = useAppTheme();
  const signInAfterDelay = useFakeSignIn();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [busy, setBusy] = useState(false);

  function submit() {
    const next: { email?: string; password?: string } = {};
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) next.email = 'Email is required.';
    if (password.length < 6) next.password = 'Password must be at least 6 characters.';
    setErrors(next);
    if (Object.keys(next).length > 0 || busy) return;
    setBusy(true);
    const name = email.split('@')[0] || 'Caregiver';
    signInAfterDelay(name, dispatch);
  }

  return (
    <View style={[styles.root, { backgroundColor: p.background }]}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <AuthHeader />
        <Text style={[styles.title, { color: p.onSurface }]}>Welcome back</Text>
        <Text style={{ fontSize: 14, color: p.onSurfaceVariant }}>
          Sign in to coordinate Margaret&apos;s care.
        </Text>

        <FormField label="Email" scheme={scheme} error={errors.email}>
          <Input
            value={email}
            onChangeText={setEmail}
            placeholder="you@example.com"
            hasError={Boolean(errors.email)}
            scheme={scheme}
          />
        </FormField>
        <FormField label="Password" scheme={scheme} error={errors.password}>
          <Input
            value={password}
            onChangeText={setPassword}
            placeholder="Your password"
            secureTextEntry
            hasError={Boolean(errors.password)}
            scheme={scheme}
          />
        </FormField>

        <TapButton
          label="Sign in"
          size="lg"
          fullWidth
          scheme={scheme}
          loading={busy}
          onPress={submit}
        />
        <TapButton label="← Back" variant="ghost" scheme={scheme} onPress={onBack} />
      </ScrollView>
    </View>
  );
}

export interface SignUpScreenProps {
  onBack: () => void;
}

export function SignUpScreen({ onBack }: SignUpScreenProps) {
  const { dispatch } = useAppState();
  const { p, scheme } = useAppTheme();
  const signInAfterDelay = useFakeSignIn();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [errors, setErrors] = useState<{
    name?: string;
    email?: string;
    password?: string;
    confirm?: string;
  }>({});
  const [busy, setBusy] = useState(false);

  function submit() {
    const next: typeof errors = {};
    if (name.trim().length === 0) next.name = 'Name is required.';
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) next.email = 'Email is required.';
    if (password.length < 6) next.password = 'Password must be at least 6 characters.';
    if (confirm !== password) next.confirm = 'Passwords do not match.';
    setErrors(next);
    if (Object.keys(next).length > 0 || busy) return;
    setBusy(true);
    signInAfterDelay(name.trim(), dispatch);
  }

  return (
    <View style={[styles.root, { backgroundColor: p.background }]}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <AuthHeader />
        <Text style={[styles.title, { color: p.onSurface }]}>Create your account</Text>
        <Text style={{ fontSize: 14, color: p.onSurfaceVariant }}>
          Join Margaret&apos;s care circle.
        </Text>

        <FormField label="Name" scheme={scheme} error={errors.name}>
          <Input
            value={name}
            onChangeText={setName}
            placeholder="e.g. Sarah Chen"
            hasError={Boolean(errors.name)}
            scheme={scheme}
          />
        </FormField>
        <FormField label="Email" scheme={scheme} error={errors.email}>
          <Input
            value={email}
            onChangeText={setEmail}
            placeholder="you@example.com"
            hasError={Boolean(errors.email)}
            scheme={scheme}
          />
        </FormField>
        <FormField label="Password" scheme={scheme} error={errors.password}>
          <Input
            value={password}
            onChangeText={setPassword}
            placeholder="At least 6 characters"
            secureTextEntry
            hasError={Boolean(errors.password)}
            scheme={scheme}
          />
        </FormField>
        <FormField label="Confirm password" scheme={scheme} error={errors.confirm}>
          <Input
            value={confirm}
            onChangeText={setConfirm}
            placeholder="Repeat your password"
            secureTextEntry
            hasError={Boolean(errors.confirm)}
            scheme={scheme}
          />
        </FormField>

        <TapButton
          label="Create account"
          size="lg"
          fullWidth
          scheme={scheme}
          loading={busy}
          onPress={submit}
        />
        <TapButton label="← Back" variant="ghost" scheme={scheme} onPress={onBack} />
      </ScrollView>
    </View>
  );
}

function AuthHeader() {
  return (
    <View style={styles.header}>
      <Logo size={48} />
      <Text style={styles.wordmark}>CareConnect</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { padding: 24, gap: 12, justifyContent: 'center' },
  header: { alignItems: 'center', gap: 10, paddingVertical: 24 },
  wordmark: {
    color: '#1B6E7A',
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  title: { fontSize: 26, fontWeight: '700', marginTop: 8 },
});
