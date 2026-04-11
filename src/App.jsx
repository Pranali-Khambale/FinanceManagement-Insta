// ─────────────────────────────────────────────────────────────────────────────
// FILE: src/App.jsx  — add 2 things: 1) import, 2) public route
// ─────────────────────────────────────────────────────────────────────────────
import React, { useState, lazy, Suspense } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

import Sidebar        from "./components/layout/Sidebar";
import Header         from "./components/layout/Header";
import Dashboard      from "./pages/Dashboard";
import AdminLogin     from "./pages/AdminLogin";
import AdminRegistration from "./pages/AdminRegistration";
import ForgotPassword from "./pages/forgotpass";
import EmployeeRoutes from "./pages/EmployeeMngement";
import useAutoLogout  from "./Authontication/logauth";
import AdvancePayment from "./pages/AdvancePayment";
import PayrollPage from "./pages/PayrollPage";

// ✅ 1. Import AdvanceRequestForm — from Ui folder (NOT pages)
import AdvanceRequestForm from "./Ui/AdvancePayment/AdvanceRequestLinkForm";

const RegistrationForm = lazy(
  () => import("./Ui/EmployeeMng/Linkgen/RegistrationForm"),
);

// ... LoadingSpinner, ProtectedRoute, MainLayout stay exactly the same ...

const LoadingSpinner = () => (
  <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
    <div className="text-center">
      <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
      <p className="text-gray-600">Loading...</p>
    </div>
  </div>
);

const ProtectedRoute = ({ children }) => {
  const isAuthenticated = localStorage.getItem("isAuthenticated") === "true";
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return children;
};

const MainLayout = ({ children }) => {
  const [collapsed,   setCollapsed]  = useState(false);
  const [mobileOpen,  setMobileOpen] = useState(false);
  const [isMobile,    setIsMobile]   = useState(window.innerWidth < 1024);

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
    else          setCollapsed((p)  => !p);
  };

  return (
    <div style={{ display:"flex", flexDirection:"column", height:"100vh", width:"100vw", maxWidth:"100vw", overflow:"hidden" }}>
      <Header user={user} onToggle={handleToggle} />
      <div style={{ display:"flex", flex:1, overflow:"hidden", minWidth:0 }}>
        {!isMobile && (
          <div style={{ width: collapsed ? 72 : 260, minWidth: collapsed ? 72 : 260, height:"100%", flexShrink:0, transition:"width .3s, min-width .3s", overflow:"hidden" }}>
            <Sidebar collapsed={collapsed} setCollapsed={setCollapsed} isMobile={false} mobileOpen={false} setMobileOpen={setMobileOpen} />
          </div>
        )}
        {isMobile && (
          <>
            {mobileOpen && (
              <div onClick={() => setMobileOpen(false)} style={{ position:"fixed", top:64, left:0, right:0, bottom:0, background:"rgba(0,0,0,.5)", zIndex:40 }} />
            )}
            <div style={{ position:"fixed", top:64, left:0, width:260, height:"calc(100vh - 64px)", zIndex:50, transform: mobileOpen ? "translateX(0)" : "translateX(-100%)", transition:"transform .3s" }}>
              <Sidebar collapsed={false} setCollapsed={setCollapsed} isMobile={true} mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} />
            </div>
          </>
        )}
        <main style={{ flex:1, minWidth:0, overflowY:"auto", overflowX:"hidden", background:"#f1f5f9", padding:"32px" }}>
          {children}
        </main>
      </div>
    </div>
  );
};

function App() {
  return (
    <Router>
      <Routes>

        {/* ── Public routes ──────────────────────────────────────────────── */}
        <Route path="/login"                 element={<AdminLogin />} />
        <Route path="/register"              element={<AdminRegistration />} />
        <Route path="/admin/forgot-password" element={<ForgotPassword />} />

        {/* Employee registration links */}
        <Route
          path="/registration/:linkId"
          element={<Suspense fallback={<LoadingSpinner />}><RegistrationForm /></Suspense>}
        />
        <Route
          path="/registration/resubmit/:token"
          element={<Suspense fallback={<LoadingSpinner />}><RegistrationForm /></Suspense>}
        />

        {/* ✅ 2. Advance payment form — PUBLIC (no ProtectedRoute, no MainLayout)
               Employee opens this link without being logged in.
               Must sit ABOVE the /employee/* wildcard.
               URL shape: /advance-request/salary/eyJhbGci...  */}
        <Route
          path="/advance-request/:paymentTypeKey/:token"
          element={<AdvanceRequestForm />}
        />

        {/* ── Protected routes ───────────────────────────────────────────── */}
        <Route
          path="/employee/dashboard"
          element={<ProtectedRoute><MainLayout><Dashboard /></MainLayout></ProtectedRoute>}
        />

        {/* Advance Payments admin page — must be BEFORE /employee/* wildcard */}
        <Route
          path="/employee/payments"
          element={<ProtectedRoute><MainLayout><AdvancePayment /></MainLayout></ProtectedRoute>}
        />

       

        {/* ✅ Payroll route (MOVE HERE) */}
        <Route
          path="/employee/payroll"
          element={
            <ProtectedRoute>
              <MainLayout>
                <PayrollPage />
              </MainLayout>
            </ProtectedRoute>
          }
        />

        
        <Route
          path="/employee/*"
          element={<ProtectedRoute><MainLayout><EmployeeRoutes /></MainLayout></ProtectedRoute>}
        />
        {/* Fallback */}
        <Route path="/"  element={<Navigate to="/login" replace />} />
        <Route path="*"  element={<Navigate to="/login" replace />} />

      </Routes>
    </Router>
  );
}

export default App;