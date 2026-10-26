import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from '../../auth/AuthContext';
import { persistSession } from '../../auth/mockAuth';
import { ProtectedRoute, AuthRoute } from '../../components/ProtectedRoute';

function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<p>Landing page</p>} />
          <Route path="/signin" element={<AuthRoute><p>Sign in page</p></AuthRoute>} />
          <Route path="/app" element={<ProtectedRoute><p>Private app</p></ProtectedRoute>} />
        </Routes>
      </AuthProvider>
    </MemoryRouter>,
  );
}

const user = { id: 'u1', name: 'Joyce', email: 'joyce@example.com' };

describe('route guards', () => {
  it('sends a visitor without a session from the app back to the landing page', async () => {
    renderAt('/app');
    expect(await screen.findByText('Landing page')).toBeInTheDocument();
  });

  it('lets a signed-in caregiver into the app', async () => {
    persistSession({ user });
    renderAt('/app');
    expect(await screen.findByText('Private app')).toBeInTheDocument();
  });

  it('shows the sign-in page to a visitor', async () => {
    renderAt('/signin');
    expect(await screen.findByText('Sign in page')).toBeInTheDocument();
  });

  it('skips the sign-in page for a signed-in caregiver', async () => {
    persistSession({ user });
    renderAt('/signin');
    expect(await screen.findByText('Private app')).toBeInTheDocument();
  });
});
