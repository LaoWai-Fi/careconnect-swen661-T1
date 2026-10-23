import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from 'react';
import type { ReactNode } from 'react';
import {
  getSession,
  persistSession,
  clearSession,
  signIn as mockSignIn,
  signUp as mockSignUp,
  signOut as mockSignOut,
} from './mockAuth';
import type { MockUser } from './mockAuth';

// ── Context shape ──────────────────────────────────────────────────────────────

interface AuthContextValue {
  user: MockUser | null;
  /** True only on the initial mount while reading localStorage */
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error?: string }>;
  signUp: (name: string, email: string, password: string) => Promise<{ error?: string }>;
  signOut: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

// ── Provider ───────────────────────────────────────────────────────────────────

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser]     = useState<MockUser | null>(null);
  const [loading, setLoading] = useState(true);

  // Rehydrate from localStorage on mount
  useEffect(() => {
    const session = getSession();
    if (session) {
      setUser(session.user);
    }
    setLoading(false);
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    const result = await mockSignIn(email, password);
    if (result.error) return { error: result.error };
    const user = result.user as MockUser;
    persistSession({ user });
    setUser(user);
    return {};
  }, []);

  const signUp = useCallback(async (name: string, email: string, password: string) => {
    const result = await mockSignUp(name, email, password);
    if (result.error) return { error: result.error };
    const user = result.user as MockUser;
    persistSession({ user });
    setUser(user);
    return {};
  }, []);

  const signOut = useCallback(() => {
    mockSignOut();
    clearSession();
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

// ── Hook ───────────────────────────────────────────────────────────────────────

// eslint-disable-next-line react-refresh/only-export-components -- Context hook intentionally shares its provider module.
export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
