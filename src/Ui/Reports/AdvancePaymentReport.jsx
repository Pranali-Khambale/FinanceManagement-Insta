// ─────────────────────────────────────────────────────────────────────────────
// FILE: src/Ui/Reports/AdvancePaymentReport.jsx
// ─────────────────────────────────────────────────────────────────────────────
import { useState, useEffect, useCallback } from "react";
import {
  Download,
  Printer,
  RefreshCw,
  ChevronUp,
  ChevronDown,
  Search,
} from "lucide-react";
import {
  apiFetch,
  fmtCurrency,
  fmtDate,
  exportCSV,
  printSection,
} from "./reportUtils.js";

const STATUS_STYLE = {
  pending: { bg: "#fef9c3", text: "#854d0e", label: "Pending" },
  approved: { bg: "#dcfce7", text: "#166534", label: "Approved" },
  rejected: { bg: "#fee2e2", text: "#991b1b", label: "Rejected" },
};

const TYPE_STYLE = {
  org_to_emp: { bg: "#eef2ff", text: "#4338ca", label: "Org → Emp" },
  emp_to_emp: { bg: "#e0f2fe", text: "#0369a1", label: "Emp → Emp" },
  other: { bg: "#f5f3ff", text: "#6d28d9", label: "External" },
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

export default function AdvancePaymentReport() {
  const [data, setData] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [status, setStatus] = useState("");
  const [payType, setPayType] = useState("");
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState("created_at");
  const [sortDir, setSortDir] = useState("desc");
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [reqRes, statsRes] = await Promise.all([
        apiFetch("/advance-payment/requests", {
          status,
          payment_type: payType,
          search,
          page,
          limit: 50,
          sort: sortKey,
          order: sortDir,
        }),
        apiFetch("/advance-payment/stats"),
      ]);
      setData(reqRes.data || []);
      setPagination(reqRes.pagination || null);
      setStats(statsRes.data || null);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [status, payType, search, sortKey, sortDir, page]);

  useEffect(() => {
    load();
  }, [load]);

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
      `advance-payment-report.csv`,
      [
        "Request Code",
        "Employee ID",
        "Name",
        "Department",
        "Type",
        "Amount",
        "Status",
        "Date",
        "Adjusted In",
        "Reason",
      ],
      data.map((r) => [
        r.request_code,
        r.emp_id,
        r.emp_name,
        r.emp_dept,
        r.payment_type_key,
        r.amount,
        r.status,
        fmtDate(r.request_date || r.created_at),
        r.adjusted_in || "—",
        r.reason,
      ]),
    );
  }

  const statCards = stats
    ? [
        {
          label: "Total Requests",
          value: stats.total || 0,
          icon: "📋",
          color: "#6366f1",
        },
        {
          label: "Pending",
          value: stats.pending || 0,
          icon: "⏳",
          color: "#f59e0b",
          sub: fmtCurrency(stats.total_pending_amount),
        },
        {
          label: "Approved",
          value: stats.approved || 0,
          icon: "✅",
          color: "#10b981",
          sub: fmtCurrency(stats.total_approved_amount),
        },
        {
          label: "Rejected",
          value: stats.rejected || 0,
          icon: "❌",
          color: "#ef4444",
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
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Search by name, ID, code…"
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
          value={status}
          onChange={(e) => {
            setStatus(e.target.value);
            setPage(1);
          }}
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
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
        </select>

        <select
          value={payType}
          onChange={(e) => {
            setPayType(e.target.value);
            setPage(1);
          }}
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
          <option value="">All Types</option>
          <option value="org_to_emp">Org → Employee</option>
          <option value="emp_to_emp">Employee → Employee</option>
          <option value="other">External / Vendor</option>
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
            <RefreshCw size={14} /> Refresh
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
              printSection("adv-print-area", "Advance Payment Report")
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

      {/* ── Stat Cards ── */}
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
        id="adv-print-area"
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
                  { key: "request_code", label: "Request Code" },
                  { key: "emp_id", label: "Emp ID" },
                  { key: "emp_name", label: "Name" },
                  { key: "emp_dept", label: "Dept" },
                  { key: "payment_type_key", label: "Type" },
                  { key: "amount", label: "Amount" },
                  { key: "status", label: "Status" },
                  { key: "request_date", label: "Date" },
                  { key: "adjusted_in", label: "Adjusted In" },
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
                    colSpan={9}
                    style={{
                      padding: 40,
                      textAlign: "center",
                      color: "#94a3b8",
                    }}
                  >
                    Loading…
                  </td>
                </tr>
              ) : data.length === 0 ? (
                <tr>
                  <td
                    colSpan={9}
                    style={{
                      padding: 40,
                      textAlign: "center",
                      color: "#94a3b8",
                      fontSize: 14,
                    }}
                  >
                    No advance payment requests found
                  </td>
                </tr>
              ) : (
                data.map((row, i) => {
                  const st = STATUS_STYLE[row.status] || STATUS_STYLE.pending;
                  const pt =
                    TYPE_STYLE[row.payment_type_key] || TYPE_STYLE.org_to_emp;
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
                          fontWeight: 700,
                          color: "#6366f1",
                        }}
                      >
                        {row.request_code}
                      </td>
                      <td
                        style={{
                          padding: "11px 14px",
                          fontFamily: "monospace",
                          fontSize: 12,
                          color: "#475569",
                        }}
                      >
                        {row.emp_id}
                      </td>
                      <td
                        style={{
                          padding: "11px 14px",
                          fontWeight: 600,
                          color: "#0f172a",
                        }}
                      >
                        {row.emp_name}
                      </td>
                      <td style={{ padding: "11px 14px", color: "#64748b" }}>
                        {row.emp_dept || "—"}
                      </td>
                      <td style={{ padding: "11px 14px" }}>
                        <span
                          style={{
                            background: pt.bg,
                            color: pt.text,
                            padding: "3px 9px",
                            borderRadius: 99,
                            fontSize: 11,
                            fontWeight: 700,
                          }}
                        >
                          {pt.label}
                        </span>
                      </td>
                      <td
                        style={{
                          padding: "11px 14px",
                          fontWeight: 700,
                          color: "#0f172a",
                        }}
                      >
                        {fmtCurrency(row.amount)}
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
                        {fmtDate(row.request_date || row.created_at)}
                      </td>
                      <td
                        style={{
                          padding: "11px 14px",
                          color: "#64748b",
                          fontSize: 12,
                        }}
                      >
                        {row.adjusted_in || "—"}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
            {data.length > 0 && (
              <tfoot>
                <tr
                  style={{
                    background: "#f8fafc",
                    borderTop: "2px solid #e2e8f0",
                  }}
                >
                  <td
                    colSpan={5}
                    style={{
                      padding: "11px 14px",
                      fontWeight: 700,
                      color: "#475569",
                    }}
                  >
                    Total ({data.length} records)
                  </td>
                  <td
                    style={{
                      padding: "11px 14px",
                      fontWeight: 800,
                      color: "#0f172a",
                      fontSize: 14,
                    }}
                  >
                    {fmtCurrency(
                      data.reduce((s, r) => s + Number(r.amount || 0), 0),
                    )}
                  </td>
                  <td colSpan={3} />
                </tr>
              </tfoot>
            )}
          </table>
        </div>

        {/* Pagination */}
        {pagination && pagination.totalPages > 1 && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              padding: "14px 20px",
              borderTop: "1px solid #f1f5f9",
            }}
          >
            <button
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
              style={{
                padding: "6px 14px",
                borderRadius: 8,
                border: "1px solid #e2e8f0",
                background: page <= 1 ? "#f8fafc" : "#fff",
                cursor: page <= 1 ? "not-allowed" : "pointer",
                fontSize: 13,
                color: page <= 1 ? "#94a3b8" : "#0f172a",
              }}
            >
              ← Prev
            </button>
            <span style={{ fontSize: 13, color: "#64748b" }}>
              Page {page} of {pagination.totalPages}
            </span>
            <button
              disabled={page >= pagination.totalPages}
              onClick={() => setPage((p) => p + 1)}
              style={{
                padding: "6px 14px",
                borderRadius: 8,
                border: "1px solid #e2e8f0",
                background: page >= pagination.totalPages ? "#f8fafc" : "#fff",
                cursor:
                  page >= pagination.totalPages ? "not-allowed" : "pointer",
                fontSize: 13,
                color: page >= pagination.totalPages ? "#94a3b8" : "#0f172a",
              }}
            >
              Next →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
