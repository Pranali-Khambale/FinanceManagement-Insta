import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  CreditCard,
  Wallet,
  FileText,
  X,
  ChevronLeft,
  ChevronRight,
  LogOut,
  ClipboardList,
} from "lucide-react";
import employeeService from "../../services/employeeService";

const Sidebar = ({
  collapsed,
  setCollapsed,
  isMobile,
  mobileOpen,
  setMobileOpen,
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [pendingCount, setPendingCount] = useState(0);
  const [logoutHovered, setLogoutHovered] = useState(false); // ← track hover with state

  const user = {
    name: localStorage.getItem("fullName") || "Admin User",
    email: localStorage.getItem("email") || "admin@company.com",
    initials: (localStorage.getItem("fullName") || "A").charAt(0).toUpperCase(),
  };

  useEffect(() => {
    const go = async () => {
      try {
        const r = await employeeService.getPendingSubmissions();
        if (r.success) setPendingCount(r.data?.length || 0);
      } catch {}
    };
    go();
    const t = setInterval(go, 30000);
    return () => clearInterval(t);
  }, [location.pathname]);

  const menu = [
    {
      id: "dashboard",
      label: "Dashboard",
      Icon: LayoutDashboard,
      path: "/employee/dashboard",
    },
    {
      id: "employees",
      label: "Employee Management",
      Icon: Users,
      path: "/employee/management",
    },
    {
      id: "pending",
      label: "Pending Approvals",
      Icon: ClipboardList,
      path: "/employee/pending",
      badge: pendingCount,
    },
    {
      id: "payments",
      label: "Advanced Payments",
      Icon: CreditCard,
      path: "/employee/payments",
    },
    {
      id: "payroll",
      label: "Payroll",
      Icon: Wallet,
      path: "/employee/payroll",
    },
    {
      id: "reports",
      label: "Reports",
      Icon: FileText,
      path: "/employee/reports",
    },
  ];

  const isActive = (p) =>
    location.pathname === p || location.pathname.startsWith(p);

  const handleNav = (path) => {
    navigate(path);
    if (isMobile) setMobileOpen(false);
  };

  const handleLogout = () => {
    if (window.confirm("Logout?")) {
      localStorage.clear();
      navigate("/login");
    }
  };

  const col = collapsed && !isMobile;

  // ── Logout button colors driven by state, not DOM manipulation ──
  const logoutColor = logoutHovered ? "#ffffff" : "#bfdbfe";
  const logoutBg = logoutHovered ? "#dc2626" : "transparent";

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        background: "linear-gradient(to bottom,#1d4ed8,#1e3a8a)",
        overflow: "hidden",
      }}
    >
      {/* ── Profile section ── */}
      <div
        style={{
          borderBottom: "1px solid rgba(255,255,255,.15)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          padding: col ? "16px 0" : "24px 16px",
          flexShrink: 0,
          position: "relative",
        }}
      >
        {/* Toggle button */}
        <button
          onClick={
            isMobile
              ? () => setMobileOpen(false)
              : () => setCollapsed((p) => !p)
          }
          style={{
            position: "absolute",
            top: 8,
            right: 8,
            background: "none",
            border: "none",
            cursor: "pointer",
            color: "#fff",
            display: "flex",
            padding: 6,
            borderRadius: 6,
          }}
        >
          {isMobile ? (
            <X size={18} />
          ) : col ? (
            <ChevronRight size={18} />
          ) : (
            <ChevronLeft size={18} />
          )}
        </button>

        {/* Avatar */}
        <div
          style={{
            width: col ? 40 : 56,
            height: col ? 40 : 56,
            borderRadius: "50%",
            background: "#fff",
            color: "#1d4ed8",
            fontWeight: 700,
            fontSize: col ? 14 : 22,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: col ? 0 : 8,
            transition: "all .3s",
          }}
        >
          {user.initials}
        </div>

        {/* Name + email */}
        {!col && (
          <>
            <p
              style={{
                color: "#fff",
                fontSize: 13,
                fontWeight: 600,
                margin: 0,
                textAlign: "center",
                width: "100%",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {user.name}
            </p>
            <p
              style={{
                color: "#bfdbfe",
                fontSize: 11,
                margin: "2px 0 0",
                textAlign: "center",
                width: "100%",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {user.email}
            </p>
          </>
        )}
      </div>

      {/* ── Nav ── */}
      <nav
        style={{
          flex: 1,
          padding: 12,
          overflowY: "auto",
          display: "flex",
          flexDirection: "column",
          gap: 4,
        }}
      >
        {menu.map(({ id, label, Icon, path, badge }) => {
          const on = isActive(path);
          return (
            <button
              key={id}
              onClick={() => handleNav(path)}
              style={{
                width: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: col ? "center" : "flex-start",
                gap: col ? 0 : 12,
                padding: col ? "10px 0" : "10px 16px",
                borderRadius: 12,
                border: "none",
                cursor: "pointer",
                background: on ? "#fff" : "transparent",
                color: on ? "#1d4ed8" : "#bfdbfe",
                fontWeight: on ? 600 : 400,
                fontSize: 14,
                transition: "background .2s, color .2s",
              }}
              onMouseEnter={(e) => {
                if (!on) {
                  e.currentTarget.style.background = "rgba(255,255,255,.15)";
                  e.currentTarget.style.color = "#ffffff";
                  const svg = e.currentTarget.querySelector("svg");
                  if (svg) svg.style.color = "#ffffff";
                }
              }}
              onMouseLeave={(e) => {
                if (!on) {
                  e.currentTarget.style.background = "transparent";
                  e.currentTarget.style.color = "#bfdbfe";
                  const svg = e.currentTarget.querySelector("svg");
                  if (svg) svg.style.color = "#bfdbfe";
                }
              }}
            >
              <div style={{ position: "relative", flexShrink: 0 }}>
                <Icon size={col ? 22 : 18} style={{ color: "inherit" }} />
                {col && badge > 0 && (
                  <span
                    style={{
                      position: "absolute",
                      top: -4,
                      right: -4,
                      width: 16,
                      height: 16,
                      borderRadius: "50%",
                      background: "#ef4444",
                      color: "#fff",
                      fontSize: 9,
                      fontWeight: 700,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    {badge > 9 ? "9+" : badge}
                  </span>
                )}
              </div>
              {!col && (
                <>
                  <span
                    style={{
                      flex: 1,
                      textAlign: "left",
                      whiteSpace: "nowrap",
                      color: "inherit",
                    }}
                  >
                    {label}
                  </span>
                  {badge > 0 && (
                    <span
                      style={{
                        padding: "2px 8px",
                        borderRadius: 999,
                        background: "#ef4444",
                        color: "#fff",
                        fontSize: 11,
                        fontWeight: 700,
                      }}
                    >
                      {badge > 99 ? "99+" : badge}
                    </span>
                  )}
                </>
              )}
            </button>
          );
        })}
      </nav>

      {/* ── Logout — hover state via React state so icon color updates ── */}
      <div
        style={{
          padding: 12,
          borderTop: "1px solid rgba(255,255,255,.15)",
          flexShrink: 0,
        }}
      >
        <button
          onClick={handleLogout}
          onMouseEnter={() => setLogoutHovered(true)}
          onMouseLeave={() => setLogoutHovered(false)}
          style={{
            width: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: col ? "center" : "flex-start",
            gap: 12,
            padding: col ? "10px 0" : "10px 16px",
            borderRadius: 12,
            border: "none",
            background: logoutBg, // ← driven by state
            color: logoutColor, // ← driven by state
            fontSize: 14,
            fontWeight: 500,
            cursor: "pointer",
            transition: "all .2s",
          }}
        >
          {/* ── Icon color driven by state — always correct ── */}
          <LogOut
            size={col ? 22 : 18}
            color={logoutColor} // ← explicit color prop, not currentColor
            style={{ flexShrink: 0 }}
          />
          {!col && <span style={{ color: logoutColor }}>Logout</span>}
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
