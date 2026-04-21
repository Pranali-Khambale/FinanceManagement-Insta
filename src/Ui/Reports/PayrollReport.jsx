// ─────────────────────────────────────────────────────────────────────────────
// FILE: src/Ui/Reports/PayrollReport.jsx
// ─────────────────────────────────────────────────────────────────────────────
import { useState, useEffect, useCallback } from "react";
import {
  Download,
  Printer,
  RefreshCw,
  ChevronUp,
  ChevronDown,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  XCircle,
  IndianRupee,
} from "lucide-react";
import {
  apiFetch,
  fmtCurrency,
  fmtDate,
  exportCSV,
  printSection,
} from "./reportUtils.js";

// ── Month options (current month + last 11) ───────────────────────────────────
function getMonthOptions() {
  const opts = [];
  const now = new Date();
  for (let i = 0; i < 12; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    opts.push(d.toLocaleString("en-IN", { month: "long", year: "numeric" }));
  }
  return opts;
}

const MONTHS = getMonthOptions();

const STATUS_STYLE = {
  paid: { bg: "#dcfce7", text: "#166534", label: "Paid" },
  pending: { bg: "#fef9c3", text: "#854d0e", label: "Pending" },
  hold: { bg: "#fee2e2", text: "#991b1b", label: "Hold" },
};

function StatCard({ label, value, sub, color, icon }) {
  return (
    <div
      style={{
        background: "#fff",
        borderRadius: 16,
        padding: "20px 22px",
        border: "1px solid #e2e8f0",
        boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
        display: "flex",
        alignItems: "flex-start",
        gap: 14,
      }}
    >
      <div
        style={{
          width: 44,
          height: 44,
          borderRadius: 12,
          flexShrink: 0,
          background: color + "18",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 20,
        }}
      >
        {icon}
      </div>
      <div style={{ minWidth: 0 }}>
        <p
          style={{
            fontSize: 11,
            fontWeight: 600,
            color: "#94a3b8",
            textTransform: "uppercase",
            letterSpacing: ".06em",
            marginBottom: 4,
          }}
        >
          {label}
        </p>
        <p
          style={{
            fontSize: 22,
            fontWeight: 800,
            color: "#0f172a",
            lineHeight: 1,
          }}
        >
          {value}
        </p>
        {sub && (
          <p style={{ fontSize: 11, color: "#64748b", marginTop: 4 }}>{sub}</p>
        )}
      </div>
    </div>
  );
}

export default function PayrollReport() {
  const [data, setData] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [month, setMonth] = useState(MONTHS[0]);
  const [status, setStatus] = useState("");
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState("emp_name");
  const [sortDir, setSortDir] = useState("asc");

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [payrollRes, statsRes] = await Promise.all([
        apiFetch("/payroll", { month, status, search }),
        apiFetch("/payroll/stats", { month }),
      ]);
      setData(payrollRes.data || []);
      setStats(statsRes.data || null);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [month, status, search]);

  useEffect(() => {
    load();
  }, [load]);

  const sorted = [...data].sort((a, b) => {
    const av = a[sortKey] ?? "";
    const bv = b[sortKey] ?? "";
    return sortDir === "asc"
      ? String(av).localeCompare(String(bv), undefined, { numeric: true })
      : String(bv).localeCompare(String(av), undefined, { numeric: true });
  });

  const toggleSort = (key) => {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  const SortIcon = ({ k }) =>
    sortKey === k ? (
      sortDir === "asc" ? (
        <ChevronUp size={13} />
      ) : (
        <ChevronDown size={13} />
      )
    ) : (
      <ChevronUp size={13} style={{ opacity: 0.25 }} />
    );

  function handleExportCSV() {
    exportCSV(
      `payroll-${month.replace(/\s/g, "-")}.csv`,
      [
        "Employee ID",
        "Name",
        "Department",
        "Basic Salary",
        "Advance Deduction",
        "Net Salary",
        "Status",
        "Paid At",
      ],
      sorted.map((r) => [
        r.emp_id || r.employee_id,
        r.emp_name || r.name,
        r.emp_dept || r.department,
        r.basic_salary || r.salary,
        r.advance_deduction || 0,
        r.net_salary || r.basic_salary || r.salary,
        r.status || "pending",
        r.paid_at ? fmtDate(r.paid_at) : "—",
      ]),
    );
  }

  const statCards = stats
    ? [
        {
          label: "Total Employees",
          value: stats.total_employees || data.length,
          icon: "👥",
          color: "#6366f1",
        },
        {
          label: "Total Payroll",
          value: fmtCurrency(stats.total_salary || stats.total_payroll),
          icon: "💰",
          color: "#10b981",
          sub: month,
        },
        {
          label: "Paid",
          value: stats.paid_count || 0,
          icon: "✅",
          color: "#22c55e",
          sub: fmtCurrency(stats.paid_amount),
        },
        {
          label: "Pending",
          value: stats.pending_count || 0,
          icon: "⏳",
          color: "#f59e0b",
          sub: fmtCurrency(stats.pending_amount),
        },
      ]
    : [];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* ── Filters ── */}
      <div
        style={{
          background: "#fff",
          borderRadius: 16,
          padding: "16px 20px",
          border: "1px solid #e2e8f0",
          display: "flex",
          flexWrap: "wrap",
          gap: 12,
          alignItems: "center",
        }}
      >
        <div style={{ position: "relative", flex: "1 1 200px" }}>
          <Search
            size={14}
            style={{
              position: "absolute",
              left: 11,
              top: "50%",
              transform: "translateY(-50%)",
              color: "#94a3b8",
            }}
          />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search employee…"
            style={{
              width: "100%",
              paddingLeft: 34,
              paddingRight: 12,
              paddingTop: 9,
              paddingBottom: 9,
              borderRadius: 10,
              border: "1px solid #e2e8f0",
              fontSize: 13,
              outline: "none",
              background: "#f8fafc",
              color: "#0f172a",
            }}
          />
        </div>

        <select
          value={month}
          onChange={(e) => setMonth(e.target.value)}
          style={{
            padding: "9px 12px",
            borderRadius: 10,
            border: "1px solid #e2e8f0",
            fontSize: 13,
            background: "#f8fafc",
            color: "#0f172a",
            outline: "none",
          }}
        >
          {MONTHS.map((m) => (
            <option key={m} value={m}>
              {m}
            </option>
          ))}
        </select>

        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          style={{
            padding: "9px 12px",
            borderRadius: 10,
            border: "1px solid #e2e8f0",
            fontSize: 13,
            background: "#f8fafc",
            color: "#0f172a",
            outline: "none",
          }}
        >
          <option value="">All Status</option>
          <option value="paid">Paid</option>
          <option value="pending">Pending</option>
          <option value="hold">Hold</option>
        </select>

        <div style={{ display: "flex", gap: 8, marginLeft: "auto" }}>
          <button
            onClick={load}
            disabled={loading}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "9px 14px",
              borderRadius: 10,
              border: "1px solid #e2e8f0",
              background: "#f8fafc",
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
              color: "#475569",
            }}
          >
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />{" "}
            Refresh
          </button>
          <button
            onClick={handleExportCSV}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "9px 14px",
              borderRadius: 10,
              border: "none",
              background: "#0f172a",
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
              color: "#fff",
            }}
          >
            <Download size={14} /> Export CSV
          </button>
          <button
            onClick={() =>
              printSection("payroll-print-area", `Payroll Report — ${month}`)
            }
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "9px 14px",
              borderRadius: 10,
              border: "1px solid #e2e8f0",
              background: "#f8fafc",
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
              color: "#475569",
            }}
          >
            <Printer size={14} /> Print
          </button>
        </div>
      </div>

      {/* ── Stat cards ── */}
      {statCards.length > 0 && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: 14,
          }}
        >
          {statCards.map((c) => (
            <StatCard key={c.label} {...c} />
          ))}
        </div>
      )}

      {/* ── Error ── */}
      {error && (
        <div
          style={{
            background: "#fee2e2",
            border: "1px solid #fecaca",
            borderRadius: 12,
            padding: "12px 16px",
            color: "#991b1b",
            fontSize: 13,
          }}
        >
          ⚠️ {error}
        </div>
      )}

      {/* ── Table ── */}
      <div
        id="payroll-print-area"
        style={{
          background: "#fff",
          borderRadius: 16,
          border: "1px solid #e2e8f0",
          overflow: "hidden",
        }}
      >
        <div style={{ overflowX: "auto" }}>
          <table
            style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}
          >
            <thead>
              <tr
                style={{
                  background: "#f8fafc",
                  borderBottom: "2px solid #e2e8f0",
                }}
              >
                {[
                  { key: "emp_id", label: "Emp ID" },
                  { key: "emp_name", label: "Name" },
                  { key: "emp_dept", label: "Department" },
                  { key: "basic_salary", label: "Basic Salary" },
                  { key: "advance_deduction", label: "Adv. Deduction" },
                  { key: "net_salary", label: "Net Salary" },
                  { key: "status", label: "Status" },
                  { key: "paid_at", label: "Paid At" },
                ].map((col) => (
                  <th
                    key={col.key}
                    onClick={() => toggleSort(col.key)}
                    style={{
                      padding: "11px 14px",
                      textAlign: "left",
                      fontSize: 11,
                      fontWeight: 700,
                      textTransform: "uppercase",
                      letterSpacing: ".06em",
                      color: "#64748b",
                      cursor: "pointer",
                      userSelect: "none",
                      whiteSpace: "nowrap",
                    }}
                  >
                    <span
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 4,
                      }}
                    >
                      {col.label} <SortIcon k={col.key} />
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td
                    colSpan={8}
                    style={{
                      padding: 40,
                      textAlign: "center",
                      color: "#94a3b8",
                    }}
                  >
                    <RefreshCw
                      size={20}
                      style={{
                        animation: "spin 1s linear infinite",
                        display: "inline",
                      }}
                    />{" "}
                    Loading…
                  </td>
                </tr>
              ) : sorted.length === 0 ? (
                <tr>
                  <td
                    colSpan={8}
                    style={{
                      padding: 40,
                      textAlign: "center",
                      color: "#94a3b8",
                      fontSize: 14,
                    }}
                  >
                    No payroll records found for {month}
                  </td>
                </tr>
              ) : (
                sorted.map((row, i) => {
                  const st = STATUS_STYLE[row.status] || STATUS_STYLE.pending;
                  const netSalary =
                    row.net_salary ??
                    (row.basic_salary || row.salary || 0) -
                      (row.advance_deduction || 0);
                  return (
                    <tr
                      key={row.id || i}
                      style={{ borderBottom: "1px solid #f1f5f9" }}
                      onMouseEnter={(e) =>
                        (e.currentTarget.style.background = "#f8fafc")
                      }
                      onMouseLeave={(e) =>
                        (e.currentTarget.style.background = "")
                      }
                    >
                      <td
                        style={{
                          padding: "11px 14px",
                          fontFamily: "monospace",
                          fontSize: 12,
                          color: "#475569",
                        }}
                      >
                        {row.emp_id || row.employee_id || "—"}
                      </td>
                      <td
                        style={{
                          padding: "11px 14px",
                          fontWeight: 600,
                          color: "#0f172a",
                        }}
                      >
                        {row.emp_name || row.name || "—"}
                      </td>
                      <td style={{ padding: "11px 14px", color: "#64748b" }}>
                        {row.emp_dept || row.department || "—"}
                      </td>
                      <td
                        style={{
                          padding: "11px 14px",
                          fontWeight: 600,
                          color: "#0f172a",
                        }}
                      >
                        {fmtCurrency(row.basic_salary || row.salary)}
                      </td>
                      <td
                        style={{
                          padding: "11px 14px",
                          color:
                            row.advance_deduction > 0 ? "#dc2626" : "#94a3b8",
                          fontWeight: 600,
                        }}
                      >
                        {row.advance_deduction > 0
                          ? `− ${fmtCurrency(row.advance_deduction)}`
                          : "—"}
                      </td>
                      <td
                        style={{
                          padding: "11px 14px",
                          fontWeight: 800,
                          color: "#0f172a",
                          fontSize: 14,
                        }}
                      >
                        {fmtCurrency(netSalary)}
                      </td>
                      <td style={{ padding: "11px 14px" }}>
                        <span
                          style={{
                            background: st.bg,
                            color: st.text,
                            padding: "3px 10px",
                            borderRadius: 99,
                            fontSize: 11,
                            fontWeight: 700,
                          }}
                        >
                          {st.label}
                        </span>
                      </td>
                      <td
                        style={{
                          padding: "11px 14px",
                          color: "#64748b",
                          fontSize: 12,
                        }}
                      >
                        {row.paid_at ? fmtDate(row.paid_at) : "—"}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
            {sorted.length > 0 && (
              <tfoot>
                <tr
                  style={{
                    background: "#f8fafc",
                    borderTop: "2px solid #e2e8f0",
                  }}
                >
                  <td
                    colSpan={3}
                    style={{
                      padding: "11px 14px",
                      fontWeight: 700,
                      fontSize: 13,
                      color: "#475569",
                    }}
                  >
                    Total ({sorted.length} employees)
                  </td>
                  <td
                    style={{
                      padding: "11px 14px",
                      fontWeight: 800,
                      color: "#0f172a",
                    }}
                  >
                    {fmtCurrency(
                      sorted.reduce(
                        (s, r) => s + Number(r.basic_salary || r.salary || 0),
                        0,
                      ),
                    )}
                  </td>
                  <td
                    style={{
                      padding: "11px 14px",
                      fontWeight: 800,
                      color: "#dc2626",
                    }}
                  >
                    −{" "}
                    {fmtCurrency(
                      sorted.reduce(
                        (s, r) => s + Number(r.advance_deduction || 0),
                        0,
                      ),
                    )}
                  </td>
                  <td
                    style={{
                      padding: "11px 14px",
                      fontWeight: 800,
                      color: "#0f172a",
                      fontSize: 15,
                    }}
                  >
                    {fmtCurrency(
                      sorted.reduce(
                        (s, r) =>
                          s +
                          Number(
                            r.net_salary ??
                              (r.basic_salary || r.salary || 0) -
                                (r.advance_deduction || 0),
                          ),
                        0,
                      ),
                    )}
                  </td>
                  <td colSpan={2} />
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>
    </div>
  );
}
