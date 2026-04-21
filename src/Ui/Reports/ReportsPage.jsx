// ─────────────────────────────────────────────────────────────────────────────
// FILE: src/Ui/Reports/ReportsPage.jsx
// Main reports layout — tab navigation + renders the active report
// ─────────────────────────────────────────────────────────────────────────────
import { useState } from "react";
import { BarChart3, CreditCard, Users, FileText } from "lucide-react";
import PayrollReport from "./PayrollReport.jsx";
import AdvancePaymentReport from "./AdvancePaymentReport.jsx";
import EmployeeReport from "./EmployeeReport.jsx";

const TABS = [
  {
    key: "payroll",
    label: "Payroll Report",
    icon: BarChart3,
    desc: "Monthly salary, deductions & payment status",
    color: "#6366f1",
    lightBg: "#eef2ff",
  },
  {
    key: "advance",
    label: "Advance Payment",
    icon: CreditCard,
    desc: "Requests, approvals & deduction schedule",
    color: "#0ea5e9",
    lightBg: "#e0f2fe",
  },
  {
    key: "employee",
    label: "Employee Report",
    icon: Users,
    desc: "Headcount, departments & salary summary",
    color: "#10b981",
    lightBg: "#dcfce7",
  },
];

export default function ReportsPage() {
  const [activeTab, setActiveTab] = useState("payroll");
  const active = TABS.find((t) => t.key === activeTab);

  return (
    <div
      style={{
        minHeight: "100vh",
        background:
          "linear-gradient(135deg, #f0f4ff 0%, #f8fafc 50%, #f0fdf4 100%)",
        padding: "28px 24px",
        fontFamily: "'Segoe UI', system-ui, sans-serif",
      }}
    >
      <div style={{ maxWidth: 1280, margin: "0 auto" }}>
        {/* ── Page Header ── */}
        <div
          style={{
            marginBottom: 28,
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 12,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: 14,
                background: "linear-gradient(135deg, #6366f1, #0ea5e9)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 4px 16px rgba(99,102,241,0.3)",
              }}
            >
              <FileText size={22} color="#fff" />
            </div>
            <div>
              <h1
                style={{
                  fontSize: 24,
                  fontWeight: 800,
                  color: "#0f172a",
                  margin: 0,
                  letterSpacing: "-0.02em",
                }}
              >
                Reports
              </h1>
              <p
                style={{
                  fontSize: 13,
                  color: "#64748b",
                  margin: "3px 0 0",
                  fontWeight: 500,
                }}
              >
                {active?.desc}
              </p>
            </div>
          </div>

          {/* Active tab badge */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "8px 16px",
              borderRadius: 12,
              background: active.lightBg,
              border: `1px solid ${active.color}30`,
            }}
          >
            <active.icon size={15} color={active.color} />
            <span
              style={{ fontSize: 13, fontWeight: 700, color: active.color }}
            >
              {active.label}
            </span>
          </div>
        </div>

        {/* ── Tab Navigation ── */}
        <div
          style={{
            display: "flex",
            gap: 4,
            marginBottom: 24,
            background: "#fff",
            borderRadius: 16,
            padding: 6,
            border: "1px solid #e2e8f0",
            boxShadow: "0 1px 4px rgba(0,0,0,0.05)",
            width: "fit-content",
          }}
        >
          {TABS.map((tab) => {
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "10px 20px",
                  borderRadius: 11,
                  border: "none",
                  cursor: "pointer",
                  transition: "all 0.18s",
                  background: isActive ? tab.color : "transparent",
                  color: isActive ? "#fff" : "#64748b",
                  fontWeight: isActive ? 700 : 500,
                  fontSize: 13,
                  boxShadow: isActive ? `0 4px 14px ${tab.color}40` : "none",
                }}
                onMouseEnter={(e) => {
                  if (!isActive) e.currentTarget.style.background = tab.lightBg;
                }}
                onMouseLeave={(e) => {
                  if (!isActive)
                    e.currentTarget.style.background = "transparent";
                }}
              >
                <tab.icon size={15} />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* ── Active Report ── */}
        <div
          style={{
            animation: "fadeSlideIn 0.22s cubic-bezier(.16,1,.3,1) both",
          }}
        >
          {activeTab === "payroll" && <PayrollReport />}
          {activeTab === "advance" && <AdvancePaymentReport />}
          {activeTab === "employee" && <EmployeeReport />}
        </div>
      </div>

      <style>{`
        @keyframes fadeSlideIn {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
        .animate-spin { animation: spin 1s linear infinite; }
        * { box-sizing: border-box; }
        input:focus, select:focus { box-shadow: 0 0 0 3px rgba(99,102,241,0.15) !important; border-color: #6366f1 !important; }
        button:active { transform: scale(0.97); }
        ::-webkit-scrollbar { width: 6px; height: 6px; }
        ::-webkit-scrollbar-track { background: #f1f5f9; border-radius: 99px; }
        ::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 99px; }
        ::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
      `}</style>
    </div>
  );
}
