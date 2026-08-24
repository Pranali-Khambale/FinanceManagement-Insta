import React from "react";
import { fmtINR, formatDate } from "../utils";
import StatusBadge from "./StatusBadge";

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
      gap: 8,
    }}
  >
    <span style={{ fontSize: 12, color: "#64748b", flexShrink: 0 }}>
      {label}
    </span>
    <span
      style={{
        fontSize: 12,
        fontWeight: 600,
        color: "#334155",
        textAlign: "right",
        wordBreak: "break-all",
        ...valueStyle,
      }}
    >
      {value}
    </span>
  </div>
);

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
    ["Paid On", formatDate(rec.paidAt)],
  ];

  return (
    <div
      style={{
        background: "#f8fafc",
        borderTop: "1px solid #e2e8f0",
        padding: "16px 16px 20px",
        animation: "slideDown .2s ease",
      }}
    >
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
          gap: 14,
        }}
      >
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

        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <Card>
            <SectionTitle label="Employee Info" />
            {metaRows.map(([l, v]) => (
              <Row key={l} label={l} value={v || "—"} />
            ))}
          </Card>

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

export default DetailPanel;
