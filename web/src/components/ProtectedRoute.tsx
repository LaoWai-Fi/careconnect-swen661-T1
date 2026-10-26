import { Navigate } from 'react-router-dom';
import type { ReactNode } from 'react';
import { useAuth } from '../auth/AuthContext';

// ── Loading spinner ────────────────────────────────────────────────────────────

function LoadingScreen() {
  return (
    <div
      className="min-h-screen flex items-center justify-center bg-neutral-50"
      role="status"
      aria-label="Loading, please wait"
    >
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 rounded-full border-4 border-calm-200 border-t-calm-600 animate-spin" />
        <p className="text-neutral-500 font-medium">Loading…</p>
      </div>
    </div>
  );
}

// ── Route guards ───────────────────────────────────────────────────────────────

/**
 * Protects app routes that require authentication.
 * - No user → redirect to landing "/"
 * - User → render children
 */
export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) return <LoadingScreen />;
  if (!user)   return <Navigate to="/" replace />;

  return <>{children}</>;
}

/**
 * Wraps public auth screens (sign in / sign up).
 * If the user is already authenticated, skip straight to the app.
 */
export function AuthRoute({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) return <LoadingScreen />;
  if (user)    return <Navigate to="/app" replace />;

  return <>{children}</>;
}
