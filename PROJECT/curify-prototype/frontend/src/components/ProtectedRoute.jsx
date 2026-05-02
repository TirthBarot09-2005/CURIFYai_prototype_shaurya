import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({ children, allowedRole }) {
  const { role, profileCompleted, loading, isSignedIn } = useAuth();

  // CRITICAL: Do nothing until auth is fully resolved
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  // 1. Force login if not signed in
  if (!isSignedIn) {
    return <Navigate to="/auth" replace />;
  }

  // 2. Force onboarding if profile is not completed
  if (!profileCompleted && window.location.pathname !== '/onboarding') {
    return <Navigate to="/onboarding" replace />;
  }

  // 3. Force role selection if authenticated but no role (legacy fallback)
  if (!role) {
    return <Navigate to="/auth/role" replace />;
  }

  // 3. Check specific role permissions
  if (allowedRole && role !== allowedRole) {
    return <Navigate to={role === 'patient' ? '/patient' : '/lender/dashboard'} replace />;
  }

  return children;
}
