// ─────────────────────────────────────────────────────────────────────────────
// FILE: src/Ui/Reports/EmployeeReport.jsx
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
  active: { bg: "#dcfce7", text: "#166534", label: "Active" },
  inactive: { bg: "#f1f5f9", text: "#475569", label: "Inactive" },
  terminated: { bg: "#fee2e2", text: "#991b1b", label: "Terminated" },
  on_leave: { bg: "#fef9c3", text: "#854d0e", label: "On Leave" },
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
      <div>
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

// Department bar chart
function DeptChart({ data }) {
  if (!data || data.length === 0) return null;
  const max = Math.max(...data.map((d) => d.count));
  const colors = [
    "#6366f1",
    "#0ea5e9",
    "#10b981",
    "#f59e0b",
    "#ef4444",
    "#8b5cf6",
    "#ec4899",
    "#14b8a6",
  ];
  return (
    <div
      style={{
        background: "#fff",
        borderRadius: 16,
        border: "1px solid #e2e8f0",
        padding: "20px 24px",
      }}
    >
      <p
        style={{
          fontSize: 12,
          fontWeight: 700,
          color: "#64748b",
          textTransform: "uppercase",
          letterSpacing: ".06em",
          marginBottom: 18,
        }}
      >
        Employees by Department
      </p>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {data.map((d, i) => (
          <div
            key={d.dept || i}
            style={{ display: "flex", alignItems: "center", gap: 12 }}
          >
            <div
              style={{
                width: 120,
                fontSize: 12,
                fontWeight: 600,
                color: "#475569",
                flexShrink: 0,
                textAlign: "right",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {d.dept || "Unknown"}
            </div>
            <div
              style={{
                flex: 1,
                background: "#f1f5f9",
                borderRadius: 99,
                height: 10,
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  width: `${(d.count / max) * 100}%`,
                  height: "100%",
                  background: colors[i % colors.length],
                  borderRadius: 99,
                  transition: "width 0.6s cubic-bezier(.16,1,.3,1)",
                }}
              />
            </div>
            <div
              style={{
                width: 30,
                fontSize: 12,
                fontWeight: 700,
                color: "#0f172a",
                flexShrink: 0,
              }}
            >
              {d.count}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function EmployeeReport() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [dept, setDept] = useState("");
  const [empStatus, setEmpStatus] = useState("");
  const [sortKey, setSortKey] = useState("name");
  const [sortDir, setSortDir] = useState("asc");
  const [depts, setDepts] = useState([]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiFetch("/employees", {
        search,
        department: dept,
        status: empStatus,
        limit: 200,
      });
      const rows = res.data || res.employees || [];
      setData(rows);
      // Build dept list
      const deptMap = {};
      rows.forEach((r) => {
        const d = r.department || r.emp_dept || "Unknown";
        deptMap[d] = (deptMap[d] || 0) + 1;
      });
      setDepts(
        Object.entries(deptMap)
          .map(([d, count]) => ({ dept: d, count }))
          .sort((a, b) => b.count - a.count),
      );
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [search, dept, empStatus]);

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

  // Derived stats
  const activeCount = data.filter(
    (r) => (r.status || r.employment_status) === "active",
  ).length;
  const totalSalary = data.reduce(
    (s, r) => s + Number(r.salary || r.basic_salary || 0),
    0,
  );
  const deptCount = depts.length;

  function handleExportCSV() {
    exportCSV(
      "employee-report.csv",
      [
        "Employee ID",
        "Name",
        "Email",
        "Phone",
        "Department",
        "Designation",
        "Salary",
        "Status",
        "Join Date",
      ],
      sorted.map((r) => [
        r.employee_id || r.emp_id,
        r.name || r.emp_name,
        r.email || "",
        r.phone || r.mobile || "",
        r.department || r.emp_dept || "",
        r.designation || r.position || "",
        r.salary || r.basic_salary || "",
        r.status || r.employment_status || "",
        fmtDate(r.joining_date || r.created_at),
      ]),
    );
  }

  const allDeptNames = [
    ...new Set(data.map((r) => r.department || r.emp_dept).filter(Boolean)),
  ].sort();

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
            placeholder="Search by name, ID, email…"
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
          value={dept}
          onChange={(e) => setDept(e.target.value)}
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
          <option value="">All Departments</option>
          {allDeptNames.map((d) => (
            <option key={d} value={d}>
              {d}
            </option>
          ))}
        </select>

        <select
          value={empStatus}
          onChange={(e) => setEmpStatus(e.target.value)}
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
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
          <option value="terminated">Terminated</option>
          <option value="on_leave">On Leave</option>
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
            onClick={() => printSection("emp-print-area", "Employee Report")}
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
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: 14,
        }}
      >
        <StatCard
          label="Total Employees"
          value={data.length}
          icon="👥"
          color="#6366f1"
        />
        <StatCard
          label="Active"
          value={activeCount}
          icon="✅"
          color="#10b981"
          sub={`${data.length ? Math.round((activeCount / data.length) * 100) : 0}% of total`}
        />
        <StatCard
          label="Departments"
          value={deptCount}
          icon="🏢"
          color="#0ea5e9"
        />
        <StatCard
          label="Total Salary Cost"
          value={fmtCurrency(totalSalary)}
          icon="💰"
          color="#f59e0b"
          sub="per month"
        />
      </div>

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

      {/* ── Dept chart ── */}
      {depts.length > 0 && <DeptChart data={depts} />}

      {/* ── Table ── */}
      <div
        id="emp-print-area"
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
                  { key: "employee_id", label: "Emp ID" },
                  { key: "name", label: "Name" },
                  { key: "email", label: "Email" },
                  { key: "department", label: "Department" },
                  { key: "designation", label: "Designation" },
                  { key: "salary", label: "Salary" },
                  { key: "status", label: "Status" },
                  { key: "joining_date", label: "Joined" },
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
                    No employees found
                  </td>
                </tr>
              ) : (
                sorted.map((row, i) => {
                  const st =
                    STATUS_STYLE[row.status || row.employment_status] ||
                    STATUS_STYLE.active;
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
                        {row.employee_id || row.emp_id || "—"}
                      </td>
                      <td
                        style={{
                          padding: "11px 14px",
                          fontWeight: 600,
                          color: "#0f172a",
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 9,
                          }}
                        >
                          <div
                            style={{
                              width: 30,
                              height: 30,
                              borderRadius: "50%",
                              background: "#eef2ff",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontSize: 11,
                              fontWeight: 800,
                              color: "#4338ca",
                              flexShrink: 0,
                            }}
                          >
                            {(row.name || row.emp_name || "?")
                              .slice(0, 2)
                              .toUpperCase()}
                          </div>
                          {row.name || row.emp_name || "—"}
                        </div>
                      </td>
                      <td
                        style={{
                          padding: "11px 14px",
                          color: "#64748b",
                          fontSize: 12,
                        }}
                      >
                        {row.email || "—"}
                      </td>
                      <td style={{ padding: "11px 14px", color: "#64748b" }}>
                        {row.department || row.emp_dept || "—"}
                      </td>
                      <td style={{ padding: "11px 14px", color: "#64748b" }}>
                        {row.designation || row.position || "—"}
                      </td>
                      <td
                        style={{
                          padding: "11px 14px",
                          fontWeight: 700,
                          color: "#0f172a",
                        }}
                      >
                        {fmtCurrency(row.salary || row.basic_salary)}
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
                        {fmtDate(row.joining_date || row.created_at)}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
