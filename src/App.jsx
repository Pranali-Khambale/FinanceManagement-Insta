// ─────────────────────────────────────────────────────────────────────────────
// FILE: src/App.jsx
// ─────────────────────────────────────────────────────────────────────────────
import React, { useState, lazy, Suspense } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

import Sidebar            from "./components/layout/Sidebar";
import Header             from "./components/layout/Header";
import Dashboard          from "./pages/Dashboard";
import AdminLogin         from "./pages/AdminLogin";
import AdminRegistration  from "./pages/AdminRegistration";
import ForgotPassword     from "./pages/forgotpass";
import EmployeeRoutes     from "./pages/EmployeeMngement";
import useAutoLogout      from "./Authontication/logauth";
import AdvancePayment     from "./pages/AdvancePayment";
import PayrollPage        from "./pages/PayrollPage";
import Reports            from "./pages/Reports";
import AdvanceRequestForm from "./Ui/AdvancePayment/AdvanceRequestLinkForm";
import AdvanceResubmitForm from "./pages/AdvanceResubmitForm";

const RegistrationForm = lazy(
  () => import("./Ui/EmployeeMng/Linkgen/RegistrationForm"),
);

// ─── Loading Spinner ──────────────────────────────────────────────────────────
const LoadingSpinner = () => (
  <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
    <div className="text-center">
      <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
      <p className="text-gray-600">Loading...</p>
    </div>
  </div>
);

// ─── Protected Route ──────────────────────────────────────────────────────────
const ProtectedRoute = ({ children }) => {
  const isAuthenticated = localStorage.getItem("isAuthenticated") === "true";
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return children;
};

// ─── Main Layout ──────────────────────────────────────────────────────────────
const MainLayout = ({ children }) => {
  const [collapsed,  setCollapsed]  = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isMobile,   setIsMobile]   = useState(window.innerWidth < 1024);

  const user = {
    name:     localStorage.getItem("fullName") || "Admin User",
    email:    localStorage.getItem("email")    || "admin@company.com",
    initials: (localStorage.getItem("fullName") || "A").charAt(0).toUpperCase(),
  };

  React.useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 1024);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  useAutoLogout(15 * 60 * 1000);

  const handleToggle = () => {
    if (isMobile) setMobileOpen((p) => !p);
    else          setCollapsed((p) => !p);
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100vh",
        width: "100vw",
        maxWidth: "100vw",
        overflow: "hidden",
      }}
    >
      <Header user={user} onToggle={handleToggle} />

      <div style={{ display: "flex", flex: 1, overflow: "hidden", minWidth: 0 }}>

        {/* ── Desktop Sidebar ── */}
        {!isMobile && (
          <div
            style={{
              width:    collapsed ? 72 : 260,
              minWidth: collapsed ? 72 : 260,
              height: "100%",
              flexShrink: 0,
              transition: "width .3s, min-width .3s",
              overflow: "hidden",
            }}
          >
            <Sidebar
              collapsed={collapsed}
              setCollapsed={setCollapsed}
              isMobile={false}
              mobileOpen={false}
              setMobileOpen={setMobileOpen}
            />
          </div>
        )}

        {/* ── Mobile Sidebar ── */}
        {isMobile && (
          <>
            {mobileOpen && (
              <div
                onClick={() => setMobileOpen(false)}
                style={{
                  position: "fixed",
                  top: 64, left: 0, right: 0, bottom: 0,
                  background: "rgba(0,0,0,.5)",
                  zIndex: 40,
                }}
              />
            )}
            <div
              style={{
                position: "fixed",
                top: 64, left: 0,
                width: 260,
                height: "calc(100vh - 64px)",
                zIndex: 50,
                transform: mobileOpen ? "translateX(0)" : "translateX(-100%)",
                transition: "transform .3s",
              }}
            >
              <Sidebar
                collapsed={false}
                setCollapsed={setCollapsed}
                isMobile={true}
                mobileOpen={mobileOpen}
                setMobileOpen={setMobileOpen}
              />
            </div>
          </>
        )}

        {/* ── Page Content ── */}
        <main
          style={{
            flex: 1,
            minWidth: 0,
            overflowY: "auto",
            overflowX: "hidden",
            background: "#f1f5f9",
            padding: "32px",
          }}
        >
          {children}
        </main>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// APP
// ─────────────────────────────────────────────────────────────────────────────
function App() {
  return (
    <Router>
      <Routes>

        {/* ══════════════════════════════════════════════════════════════
            PUBLIC ROUTES — no auth, no layout
        ══════════════════════════════════════════════════════════════ */}

        <Route path="/login"                  element={<AdminLogin />} />
        <Route path="/register"               element={<AdminRegistration />} />
        <Route path="/admin/forgot-password"  element={<ForgotPassword />} />

        {/* Employee registration via invite link */}
        <Route
          path="/registration/:linkId"
          element={
            <Suspense fallback={<LoadingSpinner />}>
              <RegistrationForm />
            </Suspense>
          }
        />
        <Route
          path="/registration/resubmit/:token"
          element={
            <Suspense fallback={<LoadingSpinner />}>
              <RegistrationForm />
            </Suspense>
          }
        />

        {/*
          Advance payment request form — sent via generated link.
          Backend must produce links like:
            https://yourdomain.com/advance-request/emp_to_emp/TOKEN
        */}
        <Route
          path="/advance-request/:paymentTypeKey/:token"
          element={<AdvanceRequestForm />}
        />

        {/*
          Advance payment resubmit form — sent via rejection email.
          Backend must produce links like:
            https://yourdomain.com/advance-resubmit/TOKEN
          Without this route the React Router * catch-all redirects to /login.
        */}
        <Route
          path="/advance-resubmit/:token"
          element={<AdvanceResubmitForm />}
        />

        {/* ══════════════════════════════════════════════════════════════
            PROTECTED ROUTES — require auth + MainLayout
        ══════════════════════════════════════════════════════════════ */}

        <Route
          path="/employee/dashboard"
          element={
            <ProtectedRoute>
              <MainLayout><Dashboard /></MainLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/employee/payments"
          element={
            <ProtectedRoute>
              <MainLayout><AdvancePayment /></MainLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/employee/payroll"
          element={
            <ProtectedRoute>
              <MainLayout><PayrollPage /></MainLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/employee/reports"
          element={
            <ProtectedRoute>
              <MainLayout><Reports /></MainLayout>
            </ProtectedRoute>
          }
        />

        {/* Catch-all for remaining /employee/* sub-routes */}
        <Route
          path="/employee/*"
          element={
            <ProtectedRoute>
              <MainLayout><EmployeeRoutes /></MainLayout>
            </ProtectedRoute>
          }
        />

        {/* ══════════════════════════════════════════════════════════════
            FALLBACK
        ══════════════════════════════════════════════════════════════ */}
        <Route path="/"  element={<Navigate to="/login" replace />} />
        <Route path="*"  element={<Navigate to="/login" replace />} />

      </Routes>
    </Router>
  );
}

export default App;