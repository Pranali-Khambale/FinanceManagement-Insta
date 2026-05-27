// src/components/auth/ProtectedRoute.jsx
import { Navigate, Outlet } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';

export default function ProtectedRoute({ children }) {
  const { isAuthenticated, isInitializing, verifySession } = useAuth();
  const [isVerifying, setIsVerifying] = useState(!isAuthenticated);

  useEffect(() => {
    // Skip network verification if AuthContext already confirmed the session
    // during its own startup — avoids a redundant /auth/me call.
    if (!isInitializing && isAuthenticated) {
      setIsVerifying(false);
      return;
    }

    // If context is still initializing, wait for it instead of firing our own
    // verifySession — prevents two simultaneous /auth/me requests on cold load.
    if (isInitializing) {
      setIsVerifying(false);
      return;
    }

    // Context says not authenticated — run verifySession as a last check
    // (covers the case where AuthContext hasn't wired verifySession yet).
    const run = async () => {
      if (typeof verifySession === 'function') await verifySession();
      setIsVerifying(false);
    };
    run();
  }, [isInitializing, isAuthenticated, verifySession]);

  // Show spinner while either AuthContext is initializing OR we are verifying
  if (isInitializing || isVerifying) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
      }}>
        <div style={{
          width: 36,
          height: 36,
          border: '3px solid #dbeafe',
          borderTopColor: '#2563eb',
          borderRadius: '50%',
          animation: 'spin 0.8s linear infinite',
        }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Supports BOTH usage patterns:
  //   1. <ProtectedRoute><Dashboard /></ProtectedRoute>   → children pattern (App.jsx)
  //   2. <Route element={<ProtectedRoute />}>             → Outlet pattern (nested routes)
  return children ?? <Outlet />;
}