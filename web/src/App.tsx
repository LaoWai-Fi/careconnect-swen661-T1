import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './auth/AuthContext';
import { AppProvider } from './context/AppContext';
import { ProtectedRoute, AuthRoute } from './components/ProtectedRoute';
import Layout from './components/Layout';
import RouteAccessibility, { SkipLink } from './components/RouteAccessibility';
import PwaStatus from './components/PwaStatus';

// Public pages (do not modify)
import Landing     from './pages/Landing';
import SignIn      from './pages/SignIn';
import SignUp      from './pages/SignUp';

// App pages (do not modify)
import Contacts     from './pages/Contacts';
import Caregiver    from './pages/Caregiver';
import CaregiverDashboard    from './pages/CaregiverDashboard';
import ActivityLog           from './pages/ActivityLog';
import ManageMedications     from './pages/ManageMedications';
import ManageAppointments    from './pages/ManageAppointments';

// ── Inner app shell ────────────────────────────────────────────────────────────

function AppShell() {
  const { signOut } = useAuth();

  return (
    <ProtectedRoute>
      <Layout onSignOut={signOut}>
        <Routes>
          <Route index                        element={<CaregiverDashboard />} />
          <Route path="contacts"              element={<Contacts />} />
          <Route path="caregiver"             element={<Caregiver />} />
          <Route path="activity"              element={<ActivityLog />} />
          <Route path="manage-medications"    element={<ManageMedications />} />
          <Route path="manage-appointments"   element={<ManageAppointments />} />
          <Route path="*"                     element={<Navigate to="/app" replace />} />
        </Routes>
      </Layout>
    </ProtectedRoute>
  );
}

// ── Route tree ─────────────────────────────────────────────────────────────────

function AppRoutes() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/"       element={<Landing />} />
      <Route path="/signin" element={<AuthRoute><SignIn /></AuthRoute>} />
      <Route path="/signup" element={<AuthRoute><SignUp /></AuthRoute>} />

      {/* Protected app */}
      <Route path="/app/*"  element={<AppShell />} />

      {/* Catch-all */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

// ── Root ───────────────────────────────────────────────────────────────────────

// Vite exposes the configured base ("/" or a sub-path such as "/repo/").
// React Router's basename must not end with a slash.
const ROUTER_BASENAME = import.meta.env.BASE_URL.replace(/\/$/, '');

export default function App() {
  return (
    <BrowserRouter basename={ROUTER_BASENAME}>
      <SkipLink />
      <PwaStatus />
      <AuthProvider>
        <AppProvider>
          <RouteAccessibility />
          <AppRoutes />
        </AppProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
