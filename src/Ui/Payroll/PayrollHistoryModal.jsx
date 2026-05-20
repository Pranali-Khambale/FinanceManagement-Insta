// src/Ui/Payroll/PayrollHistoryModal.jsx

import React, { useState, useEffect, useMemo } from "react";
import payrollService from "../../services/payrollService";

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────
const fmtINR = (n) =>
  "₹" +
  Number(n || 0).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

const fmtCompact = (n) => {
  const v = Number(n || 0);
  if (v >= 100000) return "₹" + (v / 100000).toFixed(1) + "L";
  if (v >= 1000) return "₹" + (v / 1000).toFixed(1) + "K";
  return "₹" + v.toFixed(0);
};

const AVATAR_PALETTE = [
  { bg: "#dbeafe", color: "#1d4ed8" },
  { bg: "#fce7f3", color: "#be185d" },
  { bg: "#d1fae5", color: "#065f46" },
  { bg: "#fef3c7", color: "#92400e" },
  { bg: "#ede9fe", color: "#5b21b6" },
  { bg: "#fee2e2", color: "#991b1b" },
  { bg: "#e0f2fe", color: "#0369a1" },
  { bg: "#f3f4f6", color: "#374151" },
];

const avatarColor = (name = "") =>
  AVATAR_PALETTE[name.charCodeAt(0) % AVATAR_PALETTE.length];

const initials = (name = "") =>
  name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();

const STATUS = {
  Paid: { bg: "#d1fae5", color: "#065f46", dot: "#10b981" },
  Pending: { bg: "#fef3c7", color: "#92400e", dot: "#f59e0b" },
  Rejected: { bg: "#fee2e2", color: "#991b1b", dot: "#ef4444" },
};

function buildMonths() {
  const list = ["All Months"];
  for (let i = 0; i < 12; i++) {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    list.push(d.toLocaleString("en-IN", { month: "long", year: "numeric" }));
  }
  return list;
}

// ─────────────────────────────────────────────
// StatusBadge
// ─────────────────────────────────────────────
const StatusBadge = ({ status }) => {
  const s = STATUS[status] || STATUS.Pending;
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 5,
        padding: "3px 10px",
        borderRadius: 20,
        background: s.bg,
        color: s.color,
        fontSize: 11,
        fontWeight: 600,
      }}
    >
      <span
        style={{ width: 6, height: 6, borderRadius: "50%", background: s.dot }}
      />
      {status}
    </span>
  );
};

// ─────────────────────────────────────────────
// Skeleton
// ─────────────────────────────────────────────
const Skeleton = () => (
  <div
    style={{
      padding: "16px 24px",
      borderBottom: "1px solid #f1f5f9",
      display: "flex",
      gap: 14,
    }}
  >
    <div
      style={{
        width: 40,
        height: 40,
        borderRadius: "50%",
        background: "#f1f5f9",
      }}
    />
    <div style={{ flex: 1 }}>
      <div
        style={{
          height: 12,
          width: 150,
          background: "#f1f5f9",
          borderRadius: 6,
          marginBottom: 8,
        }}
      />
      <div
        style={{
          height: 11,
          width: 220,
          background: "#f1f5f9",
          borderRadius: 6,
        }}
      />
    </div>
  </div>
);

// ─────────────────────────────────────────────
// DetailPanel  (inline expanded below each row)
// ─────────────────────────────────────────────
const DetailPanel = ({ rec }) => {
  const earningsRows = [
    ["Basic", rec.basic],
    ["HRA", rec.hra],
    ["Org. Allowance", rec.organisationAllowance],
    ["Medical Allowance", rec.medicalAllowance],
    ["Performance Pay", rec.performancePay],
    ["Gross Salary", rec.grossSalary],
    ["Gross Earned", rec.grossEarned],
  ];

  const deductionRows = [
    ["PF Employee (12%)", rec.pfDeduction],
    ["PF Employer (12%)", rec.employerPfContribution],
    ["Total PF (24%)", rec.totalPfContribution],
    ["PT", rec.pt],
    ["TDS", rec.tds],
    ["Other Deduction", rec.otherDeduction],
    ...(Number(rec.advanceDeduction) > 0
      ? [["Advance Recovery", rec.advanceDeduction]]
      : []),
    ["Total Deductions", rec.totalDeduction],
  ];

  const metaRows = [
    ["Department", rec.department],
    ["Designation", rec.designation],
    [
      "Present Days",
      rec.pDays != null ? `${rec.pDays} / ${rec.monthDays || 30}` : "—",
    ],
    ["Bank", rec.bankName],
    ["Account No.", rec.accountNumber || "—"],
    ["IFSC", rec.ifscCode || "—"],
    ["PAN", rec.panNo || "—"],
    [
      "Paid On",
      rec.paidAt
        ? new Date(rec.paidAt).toLocaleDateString("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric",
          })
        : "—",
    ],
  ];

  const Card = ({ children }) => (
    <div
      style={{
        background: "#fff",
        borderRadius: 10,
        border: "1px solid #e2e8f0",
        padding: "16px 18px",
      }}
    >
      {children}
    </div>
  );

  const SectionTitle = ({ label }) => (
    <p
      style={{
        margin: "0 0 12px",
        fontSize: 10,
        fontWeight: 700,
        color: "#94a3b8",
        textTransform: "uppercase",
        letterSpacing: "0.08em",
      }}
    >
      {label}
    </p>
  );

  const Row = ({ label, value, valueStyle }) => (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        paddingBottom: 7,
        borderBottom: "1px solid #f8fafc",
      }}
    >
      <span style={{ fontSize: 12, color: "#64748b" }}>{label}</span>
      <span
        style={{
          fontSize: 12,
          fontWeight: 600,
          color: "#334155",
          ...valueStyle,
        }}
      >
        {value}
      </span>
    </div>
  );

  return (
    <div
      style={{
        background: "#f8fafc",
        borderTop: "1px solid #e2e8f0",
        padding: "20px 24px 24px",
        animation: "slideDown .2s ease",
      }}
    >
      <div
        style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14 }}
      >
        {/* Earnings */}
        <Card>
          <SectionTitle label="Earnings" />
          {earningsRows.map(([l, v]) => (
            <Row
              key={l}
              label={l}
              value={fmtINR(v)}
              valueStyle={
                l === "Gross Earned"
                  ? { color: "#4f46e5" }
                  : l === "Gross Salary"
                    ? { color: "#1e293b" }
                    : {}
              }
            />
          ))}
        </Card>

        {/* Deductions */}
        <Card>
          <SectionTitle label="Deductions" />
          {deductionRows.map(([l, v]) => (
            <Row
              key={l}
              label={l}
              value={`− ${fmtINR(v)}`}
              valueStyle={
                l === "Total Deductions"
                  ? { color: "#dc2626", fontSize: 13 }
                  : { color: "#ef4444" }
              }
            />
          ))}
          {Number(rec.advanceAddition) > 0 && (
            <Row
              label="Advance Addition"
              value={`+ ${fmtINR(rec.advanceAddition)}`}
              valueStyle={{ color: "#059669" }}
            />
          )}
        </Card>

        {/* Info + Net */}
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <Card>
            <SectionTitle label="Employee Info" />
            {metaRows.map(([l, v]) => (
              <Row key={l} label={l} value={v || "—"} />
            ))}
          </Card>

          {/* Net salary box */}
          <div
            style={{
              background: "linear-gradient(135deg,#1a3c6e,#1e56a0)",
              borderRadius: 10,
              padding: "16px 18px",
            }}
          >
            <p
              style={{
                margin: "0 0 2px",
                fontSize: 10,
                color: "rgba(255,255,255,.55)",
                textTransform: "uppercase",
                letterSpacing: "0.08em",
              }}
            >
              Net Salary
            </p>
            <p
              style={{
                margin: "0 0 10px",
                fontSize: 22,
                fontWeight: 800,
                color: "#fff",
              }}
            >
              {fmtINR(rec.netSalary)}
            </p>
            <div
              style={{
                borderTop: "1px solid rgba(255,255,255,.15)",
                paddingTop: 10,
                display: "flex",
                justifyContent: "space-between",
                marginBottom: 6,
              }}
            >
              <span style={{ fontSize: 11, color: "rgba(255,255,255,.55)" }}>
                Total Earning
              </span>
              <span style={{ fontSize: 13, fontWeight: 700, color: "#fff" }}>
                {fmtINR(rec.totalEarning)}
              </span>
            </div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <span style={{ fontSize: 11, color: "rgba(255,255,255,.55)" }}>
                Status
              </span>
              <StatusBadge status={rec.status} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────
// PayrollRow
// ─────────────────────────────────────────────
const PayrollRow = ({ rec, expanded, onToggle }) => {
  const av = avatarColor(rec.name);

  const timeAgo = rec.paidAt
    ? (() => {
        const days = Math.floor((Date.now() - new Date(rec.paidAt)) / 86400000);
        if (days === 0) return "Today";
        if (days < 30) return `${days}d ago`;
        return `${Math.floor(days / 30)}mo ago`;
      })()
    : null;

  return (
    <div style={{ borderBottom: "1px solid #f1f5f9" }}>
      {/* Row */}
      <div
        onClick={onToggle}
        style={{
          display: "flex",
          alignItems: "flex-start",
          gap: 14,
          padding: "14px 24px",
          cursor: "pointer",
          background: expanded ? "#f8fafc" : "transparent",
          transition: "background .15s",
        }}
        onMouseEnter={(e) => {
          if (!expanded) e.currentTarget.style.background = "#fafbfc";
        }}
        onMouseLeave={(e) => {
          if (!expanded) e.currentTarget.style.background = "transparent";
        }}
      >
        {/* Avatar */}
        <div
          style={{
            width: 40,
            height: 40,
            borderRadius: "50%",
            flexShrink: 0,
            background: av.bg,
            color: av.color,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 13,
            fontWeight: 700,
          }}
        >
          {initials(rec.name)}
        </div>

        {/* Content */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {/* Name + ID + dept */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              flexWrap: "wrap",
              marginBottom: 5,
            }}
          >
            <span style={{ fontSize: 13, fontWeight: 700, color: "#1e293b" }}>
              {rec.name}
            </span>
            <span
              style={{
                background: "#f1f5f9",
                color: "#64748b",
                fontSize: 11,
                padding: "1px 7px",
                borderRadius: 4,
                fontFamily: "monospace",
              }}
            >
              {rec.employeeId}
            </span>
            {rec.department && (
              <span style={{ fontSize: 11, color: "#94a3b8" }}>
                🏢 {rec.department}
              </span>
            )}
          </div>

          {/* Pills */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 7,
              flexWrap: "wrap",
              marginBottom: 6,
            }}
          >
            <StatusBadge status={rec.status} />
            <span
              style={{
                background: "#eff6ff",
                color: "#1d4ed8",
                fontSize: 11,
                padding: "3px 10px",
                borderRadius: 20,
                fontWeight: 600,
              }}
            >
              {rec.forMonth}
            </span>
            {rec.pDays != null && (
              <span
                style={{
                  background: "#f0fdf4",
                  color: "#166534",
                  fontSize: 11,
                  padding: "3px 10px",
                  borderRadius: 20,
                  fontWeight: 600,
                }}
              >
                {rec.pDays}/{rec.monthDays || 30} days
              </span>
            )}
          </div>

          {/* Figures */}
          <p style={{ margin: 0, fontSize: 12, color: "#64748b" }}>
            Gross Earned:{" "}
            <strong style={{ color: "#4f46e5" }}>
              {fmtINR(rec.grossEarned)}
            </strong>
            {"  ·  "}
            Deductions:{" "}
            <strong style={{ color: "#ef4444" }}>
              −{fmtINR(rec.totalDeduction)}
            </strong>
            {"  ·  "}
            Net:{" "}
            <strong style={{ color: "#059669" }}>
              {fmtINR(rec.netSalary)}
            </strong>
          </p>
        </div>

        {/* Right meta */}
        <div
          style={{
            flexShrink: 0,
            textAlign: "right",
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-end",
            gap: 4,
          }}
        >
          {timeAgo && (
            <span style={{ fontSize: 11, color: "#94a3b8" }}>⏱ {timeAgo}</span>
          )}
          {rec.paidAt && (
            <span style={{ fontSize: 11, color: "#94a3b8" }}>
              {new Date(rec.paidAt).toLocaleDateString("en-IN", {
                day: "2-digit",
                month: "short",
                year: "numeric",
              })}
            </span>
          )}
          <span
            style={{
              fontSize: 13,
              fontWeight: 700,
              color: "#1e293b",
              marginTop: 2,
            }}
          >
            {fmtCompact(rec.totalEarning)}
          </span>
          <span
            style={{
              fontSize: 11,
              color: "#94a3b8",
              display: "inline-block",
              transform: expanded ? "rotate(180deg)" : "rotate(0deg)",
              transition: "transform .2s",
            }}
          >
            ▾
          </span>
        </div>
      </div>

      {/* Inline detail panel */}
      {expanded && <DetailPanel rec={rec} />}
    </div>
  );
};

// ─────────────────────────────────────────────
// Main Modal
// ─────────────────────────────────────────────
const PayrollHistoryModal = ({ onClose }) => {
  const [allRecords, setAllRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [monthFilter, setMonthFilter] = useState("All Months");
  const [deptFilter, setDeptFilter] = useState("All Departments");
  const [statusFilt, setStatusFilt] = useState("All Statuses");
  const [expandedKey, setExpandedKey] = useState(null);
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 15;

  const MONTHS = useMemo(buildMonths, []);

  // ── Fetch last 12 months ──
  useEffect(() => {
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const monthLabels = Array.from({ length: 12 }, (_, i) => {
          const d = new Date();
          d.setMonth(d.getMonth() - i);
          return d.toLocaleString("en-IN", { month: "long", year: "numeric" });
        });

        const results = await Promise.allSettled(
          monthLabels.map((m) =>
            payrollService.getPayrollData({ month: m, limit: 500 }),
          ),
        );

        const records = [];
        results.forEach((res, idx) => {
          if (res.status !== "fulfilled") return;
          const month = monthLabels[idx];
          (res.value?.data?.employees || []).forEach((emp) => {
            if (!emp.payrollRecordId) return;
            records.push({
              id: emp.payrollRecordId,
              employeeId: emp.employeeId,
              name: emp.name,
              department: emp.department,
              designation: emp.designation,
              forMonth: month,
              basic: emp.basic,
              hra: emp.hra,
              organisationAllowance: emp.organisationAllowance,
              medicalAllowance: emp.medicalAllowance,
              performancePay: emp.performancePay,
              grossSalary: emp.grossSalary,
              grossEarned: emp.grossEarned,
              pfDeduction: emp.pfDeduction,
              employerPfContribution: emp.employerPfContribution,
              totalPfContribution: emp.totalPfContribution,
              pt: emp.pt,
              tds: emp.tds,
              otherDeduction: emp.otherDeduction,
              advanceDeduction: emp.advanceDeduction,
              advanceAddition: emp.advanceAddition,
              totalDeduction: emp.totalDeduction,
              netSalary: emp.netSalary,
              totalEarning: emp.totalEarning,
              pDays: emp.pDays,
              aDays: emp.aDays,
              monthDays: emp.monthDays,
              status: emp.status,
              paidAt: emp.paidAt,
              bankName: emp.bankName,
              accountNumber: emp.accountNumber,
              ifscCode: emp.ifscCode,
              panNo: emp.panNo,
            });
          });
        });

        setAllRecords(records);
      } catch (err) {
        setError(err.message || "Failed to load history");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // ── Derived state ──
  const departments = useMemo(
    () => [
      "All Departments",
      ...new Set(allRecords.map((r) => r.department).filter(Boolean)),
    ],
    [allRecords],
  );

  const filtered = useMemo(
    () =>
      allRecords.filter((r) => {
        const q = search.toLowerCase();
        return (
          ((r.name || "").toLowerCase().includes(q) ||
            (r.employeeId || "").toLowerCase().includes(q)) &&
          (monthFilter === "All Months" || r.forMonth === monthFilter) &&
          (deptFilter === "All Departments" || r.department === deptFilter) &&
          (statusFilt === "All Statuses" || r.status === statusFilt)
        );
      }),
    [allRecords, search, monthFilter, deptFilter, statusFilt],
  );

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const totalNet = filtered.reduce((s, r) => s + Number(r.netSalary || 0), 0);
  const totalGross = filtered.reduce(
    (s, r) => s + Number(r.grossSalary || 0),
    0,
  );
  const totalDed = filtered.reduce(
    (s, r) => s + Number(r.totalDeduction || 0),
    0,
  );

  // ── Export ──
  const handleExport = async () => {
    try {
      const XLSX = await import("xlsx-js-style");
      const ws = XLSX.utils.json_to_sheet(
        filtered.map((r) => ({
          "Employee ID": r.employeeId,
          Name: r.name,
          Department: r.department,
          Designation: r.designation,
          Month: r.forMonth,
          "P Days": r.pDays,
          "Month Days": r.monthDays,
          "Gross Salary (₹)": Number(r.grossSalary || 0),
          "Gross Earned (₹)": Number(r.grossEarned || 0),
          "Total PF 24% (₹)": Number(r.totalPfContribution || 0),
          "PT (₹)": Number(r.pt || 0),
          "TDS (₹)": Number(r.tds || 0),
          "Adv. Deduction (₹)": Number(r.advanceDeduction || 0),
          "Adv. Addition (₹)": Number(r.advanceAddition || 0),
          "Total Deduction (₹)": Number(r.totalDeduction || 0),
          "Net Salary (₹)": Number(r.netSalary || 0),
          "Total Earning (₹)": Number(r.totalEarning || 0),
          Status: r.status,
          "Paid On": r.paidAt
            ? new Date(r.paidAt).toLocaleDateString("en-IN", {
                day: "2-digit",
                month: "short",
                year: "numeric",
              })
            : "—",
          Bank: r.bankName || "—",
          "A/C No": r.accountNumber || "—",
        })),
      );
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Payroll History");
      XLSX.writeFile(
        wb,
        `Payroll_History_${monthFilter.replace(/ /g, "_")}.xlsx`,
      );
    } catch (e) {
      console.error("Export failed", e);
    }
  };

  // ── Render ──
  return (
    <>
      <style>{`
        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      <div
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 200,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "rgba(0,0,0,.5)",
          backdropFilter: "blur(4px)",
          WebkitBackdropFilter: "blur(4px)",
          padding: 16,
        }}
      >
        <div
          style={{
            background: "#fff",
            borderRadius: 16,
            boxShadow: "0 25px 60px rgba(0,0,0,.2)",
            width: "100%",
            maxWidth: 820,
            maxHeight: "92vh",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
          }}
        >
          {/* ══ HEADER ══════════════════════════════════════════════ */}
          <div
            style={{
              background: "linear-gradient(135deg,#1a3c6e,#1e56a0)",
              padding: "20px 24px 0",
              flexShrink: 0,
            }}
          >
            {/* Title row */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 20,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 10,
                    background: "rgba(255,255,255,.15)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <svg
                    width="18"
                    height="18"
                    fill="none"
                    stroke="#fff"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                    />
                  </svg>
                </div>
                <div>
                  <h2
                    style={{
                      margin: 0,
                      color: "#fff",
                      fontSize: 17,
                      fontWeight: 700,
                    }}
                  >
                    Payroll History
                  </h2>
                  <p
                    style={{
                      margin: "2px 0 0",
                      color: "rgba(255,255,255,.55)",
                      fontSize: 12,
                    }}
                  >
                    Combined salary run history · live view
                  </p>
                </div>
              </div>

              <div style={{ display: "flex", gap: 8 }}>
                <button
                  onClick={handleExport}
                  disabled={loading || filtered.length === 0}
                  style={{
                    background: "rgba(255,255,255,.15)",
                    border: "none",
                    cursor: "pointer",
                    color: "#fff",
                    borderRadius: 8,
                    padding: "7px 14px",
                    fontSize: 12,
                    fontWeight: 600,
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    opacity: loading || filtered.length === 0 ? 0.5 : 1,
                  }}
                >
                  <svg
                    width="13"
                    height="13"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                    />
                  </svg>
                  Export{" "}
                  {!loading && filtered.length > 0 ? filtered.length : ""}
                </button>
                <button
                  onClick={onClose}
                  style={{
                    background: "rgba(255,255,255,.15)",
                    border: "none",
                    cursor: "pointer",
                    color: "#fff",
                    width: 32,
                    height: 32,
                    borderRadius: 8,
                    fontSize: 16,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Stat cards */}
            {!loading && (
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(4,1fr)",
                  gap: 10,
                  paddingBottom: 20,
                }}
              >
                {[
                  {
                    label: "TOTAL",
                    value: allRecords.length,
                    accent: "#93c5fd",
                  },
                  {
                    label: "PAID",
                    value: allRecords.filter((r) => r.status === "Paid").length,
                    accent: "#6ee7b7",
                  },
                  {
                    label: "PENDING",
                    value: allRecords.filter((r) => r.status === "Pending")
                      .length,
                    accent: "#fcd34d",
                  },
                  {
                    label: "REJECTED",
                    value: allRecords.filter((r) => r.status === "Rejected")
                      .length,
                    accent: "#fca5a5",
                  },
                ].map(({ label, value, accent }) => (
                  <div
                    key={label}
                    style={{
                      background: "rgba(255,255,255,.08)",
                      border: "1px solid rgba(255,255,255,.1)",
                      borderRadius: 10,
                      padding: "12px 14px",
                    }}
                  >
                    <p
                      style={{
                        margin: "0 0 4px",
                        fontSize: 24,
                        fontWeight: 800,
                        color: accent,
                      }}
                    >
                      {value}
                    </p>
                    <p
                      style={{
                        margin: 0,
                        fontSize: 10,
                        fontWeight: 700,
                        color: "rgba(255,255,255,.45)",
                        letterSpacing: "0.08em",
                      }}
                    >
                      {label}
                    </p>
                  </div>
                ))}
              </div>
            )}

            {/* Totals strip */}
            {!loading && filtered.length > 0 && (
              <div
                style={{
                  display: "flex",
                  margin: "0 -24px",
                  background: "rgba(0,0,0,.2)",
                  padding: "10px 24px",
                }}
              >
                {[
                  {
                    label: "GROSS",
                    value: fmtCompact(totalGross),
                    color: "rgba(255,255,255,.9)",
                  },
                  {
                    label: "DEDUCTIONS",
                    value: `− ${fmtCompact(totalDed)}`,
                    color: "#fca5a5",
                  },
                  {
                    label: "NET PAID",
                    value: fmtCompact(totalNet),
                    color: "#6ee7b7",
                  },
                ].map(({ label, value, color }, i) => (
                  <div
                    key={label}
                    style={{
                      flex: 1,
                      textAlign: "center",
                      borderRight:
                        i < 2 ? "1px solid rgba(255,255,255,.1)" : "none",
                    }}
                  >
                    <p
                      style={{
                        margin: 0,
                        fontSize: 10,
                        color: "rgba(255,255,255,.4)",
                        letterSpacing: "0.06em",
                      }}
                    >
                      {label}
                    </p>
                    <p
                      style={{
                        margin: 0,
                        fontSize: 14,
                        fontWeight: 700,
                        color,
                      }}
                    >
                      {value}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ══ FILTERS ══════════════════════════════════════════════ */}
          <div
            style={{
              padding: "12px 24px",
              borderBottom: "1px solid #f1f5f9",
              display: "flex",
              alignItems: "center",
              gap: 8,
              flexWrap: "wrap",
              flexShrink: 0,
              background: "#fff",
            }}
          >
            {/* Search */}
            <div style={{ position: "relative" }}>
              <svg
                style={{
                  position: "absolute",
                  left: 9,
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: "#94a3b8",
                  pointerEvents: "none",
                }}
                width="13"
                height="13"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
              <input
                type="text"
                placeholder="Search name or ID…"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                style={{
                  paddingLeft: 30,
                  paddingRight: 10,
                  height: 32,
                  fontSize: 12,
                  border: "1px solid #e2e8f0",
                  borderRadius: 8,
                  background: "#f8fafc",
                  color: "#374151",
                  outline: "none",
                  width: 170,
                }}
              />
            </div>

            {/* Select filters */}
            {[
              { value: monthFilter, set: setMonthFilter, opts: MONTHS },
              { value: deptFilter, set: setDeptFilter, opts: departments },
              {
                value: statusFilt,
                set: setStatusFilt,
                opts: ["All Statuses", "Paid", "Pending", "Rejected"],
              },
            ].map((sel, i) => (
              <select
                key={i}
                value={sel.value}
                onChange={(e) => {
                  sel.set(e.target.value);
                  setPage(1);
                }}
                style={{
                  height: 32,
                  fontSize: 12,
                  border: "1px solid #e2e8f0",
                  borderRadius: 8,
                  padding: "0 10px",
                  background: "#f8fafc",
                  color: "#374151",
                  outline: "none",
                }}
              >
                {sel.opts.map((o) => (
                  <option key={o}>{o}</option>
                ))}
              </select>
            ))}

            <span
              style={{ marginLeft: "auto", fontSize: 11, color: "#94a3b8" }}
            >
              {loading
                ? "Loading…"
                : `${filtered.length} event${filtered.length !== 1 ? "s" : ""}`}
            </span>
          </div>

          {/* ══ ERROR ════════════════════════════════════════════════ */}
          {error && (
            <div
              style={{
                margin: "12px 24px",
                padding: "10px 14px",
                borderRadius: 8,
                background: "#fee2e2",
                border: "1px solid #fca5a5",
                fontSize: 12,
                color: "#991b1b",
              }}
            >
              ❌ {error}
            </div>
          )}

          {/* ══ FEED ════════════════════════════════════════════════ */}
          <div style={{ flex: 1, overflowY: "auto" }}>
            {loading ? (
              [...Array(6)].map((_, i) => <Skeleton key={i} />)
            ) : paginated.length === 0 ? (
              <div style={{ padding: "48px 24px", textAlign: "center" }}>
                <p style={{ color: "#94a3b8", fontSize: 13 }}>
                  {allRecords.length === 0
                    ? "No saved payroll records found. Records appear here once salary is saved or paid."
                    : "No records match your filters."}
                </p>
              </div>
            ) : (
              paginated.map((rec) => {
                const key = `${rec.id}-${rec.forMonth}`;
                return (
                  <PayrollRow
                    key={key}
                    rec={rec}
                    expanded={expandedKey === key}
                    onToggle={() =>
                      setExpandedKey(expandedKey === key ? null : key)
                    }
                  />
                );
              })
            )}
          </div>

          {/* ══ FOOTER ══════════════════════════════════════════════ */}
          <div
            style={{
              padding: "12px 24px",
              borderTop: "1px solid #f1f5f9",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexShrink: 0,
              background: "#fff",
            }}
          >
            <span style={{ fontSize: 12, color: "#94a3b8" }}>
              Showing{" "}
              <strong style={{ color: "#374151" }}>
                {filtered.length === 0 ? 0 : (page - 1) * PAGE_SIZE + 1}–
                {Math.min(page * PAGE_SIZE, filtered.length)}
              </strong>{" "}
              of <strong style={{ color: "#374151" }}>{filtered.length}</strong>{" "}
              events
            </span>

            <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
              {totalPages > 1 && (
                <>
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    style={{
                      padding: "5px 10px",
                      fontSize: 11,
                      fontWeight: 600,
                      cursor: "pointer",
                      border: "1px solid #e2e8f0",
                      borderRadius: 6,
                      background: "#fff",
                      color: page === 1 ? "#d1d5db" : "#374151",
                    }}
                  >
                    ← Prev
                  </button>

                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    const pg =
                      Math.max(1, Math.min(page - 2, totalPages - 4)) + i;
                    return (
                      <button
                        key={pg}
                        onClick={() => setPage(pg)}
                        style={{
                          width: 28,
                          height: 28,
                          fontSize: 11,
                          fontWeight: 600,
                          cursor: "pointer",
                          border: pg === page ? "none" : "1px solid #e2e8f0",
                          borderRadius: 6,
                          background: pg === page ? "#1a3c6e" : "#fff",
                          color: pg === page ? "#fff" : "#374151",
                        }}
                      >
                        {pg}
                      </button>
                    );
                  })}

                  <button
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    style={{
                      padding: "5px 10px",
                      fontSize: 11,
                      fontWeight: 600,
                      cursor: "pointer",
                      border: "1px solid #e2e8f0",
                      borderRadius: 6,
                      background: "#fff",
                      color: page === totalPages ? "#d1d5db" : "#374151",
                    }}
                  >
                    Next →
                  </button>
                </>
              )}

              <button
                onClick={onClose}
                style={{
                  padding: "6px 16px",
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: "pointer",
                  border: "1px solid #e2e8f0",
                  borderRadius: 8,
                  background: "#fff",
                  color: "#374151",
                  marginLeft: 4,
                }}
              >
                ✕ Close
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default PayrollHistoryModal;
