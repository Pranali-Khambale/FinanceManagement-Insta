import { Routes, Route, Navigate, Outlet } from "react-router-dom";
import { lazy, Suspense, useState } from "react";
import React from "react";

import { useAuth }        from "./context/AuthContext";
import ProtectedRoute     from "./components/layout/ProtectedRoute";
import Sidebar            from "./components/layout/Sidebar";
import Header             from "./components/layout/Header";
import Dashboard          from "./pages/Dashboard";
import AdminLogin         from "./pages/AdminLogin";
import AdminRegistration  from "./pages/AdminRegistration";
import ForgotPassword     from "./pages/forgotpass";
import EmployeeRoutes     from "./pages/EmployeeMngement";
import AdvancePayment     from "./pages/AdvancePayment";
import PayrollPage        from "./pages/PayrollPage";
import Reports            from "./pages/Reports";
import AdvanceRequestForm from "./Ui/AdvancePayment/AdvanceRequestLinkForm";
import AdvanceResubmitForm from "./pages/AdvanceResubmitForm";
import EmployeeDocUpload  from "./pages/EmployeeDocUpload";
import useAutoLogout      from "./Authontication/logauth";

const RegistrationForm = lazy(() => import("./Ui/EmployeeMng/Linkgen/RegistrationForm"));

// ─── Loading Spinner ──────────────────────────────────────────────────────────
const LoadingSpinner = () => (
  <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", flexDirection: "column", gap: 16 }}>
    <div style={{ width: 48, height: 48, border: "4px solid #dbeafe", borderTopColor: "#2563eb", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
    <p style={{ color: "#64748b", fontSize: 14 }}>Loading...</p>
    <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
  </div>
);

// ─── Main Layout ──────────────────────────────────────────────────────────────
const MainLayout = ({ children }) => {
  const [collapsed,  setCollapsed]  = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isMobile,   setIsMobile]   = useState(window.innerWidth < 1024);

  const { user } = useAuth();
  const displayUser = {
    name:     user?.fullName || user?.username || "Admin",
    email:    user?.email    || "",
    initials: (user?.fullName || user?.username || "A").charAt(0).toUpperCase(),
  };

  React.useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 1024);
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  useAutoLogout(15 * 60 * 1000);

  const handleToggle = () => {
    if (isMobile) setMobileOpen(p => !p);
    else          setCollapsed(p => !p);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh", width: "100vw", maxWidth: "100vw", overflow: "hidden" }}>
      <Header user={displayUser} onToggle={handleToggle} />
      <div style={{ display: "flex", flex: 1, overflow: "hidden", minWidth: 0 }}>

        {!isMobile && (
          <div style={{ width: collapsed ? 72 : 260, minWidth: collapsed ? 72 : 260, height: "100%", flexShrink: 0, transition: "width .3s, min-width .3s", overflow: "hidden" }}>
            <Sidebar collapsed={collapsed} setCollapsed={setCollapsed} isMobile={false} mobileOpen={false} setMobileOpen={setMobileOpen} />
          </div>
        )}

        {isMobile && (
          <>
            {mobileOpen && (
              <div onClick={() => setMobileOpen(false)} style={{ position: "fixed", inset: 0, top: 64, background: "rgba(0,0,0,.5)", zIndex: 40 }} />
            )}
            <div style={{ position: "fixed", top: 64, left: 0, width: 260, height: "calc(100vh - 64px)", zIndex: 50, transform: mobileOpen ? "translateX(0)" : "translateX(-100%)", transition: "transform .3s" }}>
              <Sidebar collapsed={false} setCollapsed={setCollapsed} isMobile mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} />
            </div>
          </>
        )}

        <main style={{ flex: 1, minWidth: 0, overflowY: "auto", overflowX: "hidden", background: "#f1f5f9", padding: "32px" }}>
          {children}
        </main>
      </div>
    </div>
  );
};

// ─── Protected wrapper ────────────────────────────────────────────────────────
const Protected = ({ children }) => (
  <ProtectedRoute>
    <MainLayout>{children}</MainLayout>
  </ProtectedRoute>
);

// ─── App ──────────────────────────────────────────────────────────────────────
// No <BrowserRouter> or <AuthProvider> here — both live in main.jsx
function App() {
  return (
    <Routes>

      {/* ── Public ── */}
      <Route path="/login"                 element={<AdminLogin />} />
      <Route path="/register"              element={<AdminRegistration />} />
      <Route path="/admin/forgot-password" element={<ForgotPassword />} />

      <Route path="/registration/:linkId"
        element={<Suspense fallback={<LoadingSpinner />}><RegistrationForm /></Suspense>} />
      <Route path="/registration/resubmit/:token"
        element={<Suspense fallback={<LoadingSpinner />}><RegistrationForm /></Suspense>} />

      <Route path="/upload-documents/:token"                element={<EmployeeDocUpload />} />
      <Route path="/advance-request/:paymentTypeKey/:token" element={<AdvanceRequestForm />} />
      <Route path="/advance-resubmit/:token"                element={<AdvanceResubmitForm />} />

      {/* ── Protected ── */}
      <Route path="/employee/dashboard" element={<Protected><Dashboard /></Protected>} />
      <Route path="/employee/payments"  element={<Protected><AdvancePayment /></Protected>} />
      <Route path="/employee/payroll"   element={<Protected><PayrollPage /></Protected>} />
      <Route path="/employee/reports"   element={<Protected><Reports /></Protected>} />
      <Route path="/employee/*"         element={<Protected><EmployeeRoutes /></Protected>} />

      {/* ── Fallback ── */}
      <Route path="/"  element={<Navigate to="/login" replace />} />
      <Route path="*"  element={<Navigate to="/login" replace />} />

    </Routes>
  );
}

export default App;