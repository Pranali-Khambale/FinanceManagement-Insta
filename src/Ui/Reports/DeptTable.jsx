// src/Ui/Reports/DeptTable.jsx
import React from "react";

const fmt = (n) =>
  n >= 1e6 ? `₹${(n / 1e6).toFixed(2)}M` : `₹${(n / 1e3).toFixed(1)}K`;

export function DeptTable({ data }) {
  const total = data.reduce((s, d) => s + d.payroll, 0);

  return (
    <div style={{ overflowX: "auto" }}>
      <table
        style={{
          width: "100%",
          borderCollapse: "collapse",
          fontFamily: "'DM Sans',sans-serif",
        }}
      >
        <thead>
          <tr style={{ borderBottom: "2px solid #f1f5f9" }}>
            {[
              "Department",
              "Headcount",
              "Payroll",
              "Advances",
              "% of Total",
            ].map((h) => (
              <th
                key={h}
                style={{
                  padding: "10px 14px",
                  textAlign: h === "Department" ? "left" : "right",
                  fontSize: 11,
                  fontWeight: 600,
                  color: "#6b7280",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                }}
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((d, i) => {
            const pct = ((d.payroll / total) * 100).toFixed(1);
            return (
              <tr
                key={i}
                style={{
                  borderBottom: "1px solid #f8fafc",
                  transition: "background .14s",
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.background = "#f8fafc")
                }
                onMouseLeave={(e) => (e.currentTarget.style.background = "")}
              >
                <td
                  style={{
                    padding: "12px 14px",
                    fontSize: 13,
                    fontWeight: 600,
                    color: "#111827",
                  }}
                >
                  <div
                    style={{ display: "flex", alignItems: "center", gap: 10 }}
                  >
                    <div
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: 2,
                        background: `hsl(${i * 55 + 210},70%,55%)`,
                      }}
                    />
                    {d.dept}
                  </div>
                </td>
                <td
                  style={{
                    padding: "12px 14px",
                    textAlign: "right",
                    fontSize: 13,
                    color: "#374151",
                  }}
                >
                  {d.headcount}
                </td>
                <td
                  style={{
                    padding: "12px 14px",
                    textAlign: "right",
                    fontSize: 13,
                    fontWeight: 600,
                    color: "#111827",
                  }}
                >
                  {fmt(d.payroll)}
                </td>
                <td
                  style={{
                    padding: "12px 14px",
                    textAlign: "right",
                    fontSize: 13,
                    color: "#8b5cf6",
                  }}
                >
                  {fmt(d.advances)}
                </td>
                <td style={{ padding: "12px 14px", textAlign: "right" }}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      justifyContent: "flex-end",
                    }}
                  >
                    <div
                      style={{
                        width: 60,
                        height: 5,
                        borderRadius: 3,
                        background: "#f1f5f9",
                        overflow: "hidden",
                      }}
                    >
                      <div
                        style={{
                          height: "100%",
                          width: `${pct}%`,
                          background: `hsl(${i * 55 + 210},70%,55%)`,
                          borderRadius: 3,
                          transition: "width .5s ease",
                        }}
                      />
                    </div>
                    <span
                      style={{
                        fontSize: 12,
                        fontWeight: 600,
                        color: "#374151",
                        minWidth: 36,
                      }}
                    >
                      {pct}%
                    </span>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
