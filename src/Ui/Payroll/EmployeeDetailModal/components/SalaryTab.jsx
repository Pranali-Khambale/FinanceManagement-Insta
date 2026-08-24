import React from "react";
import { Input, SectionTitle, Grid } from "./Primitives";
import { fmt } from "../utils";

const SalaryTab = ({ form, handleChange, computed }) => (
  <>
    <SectionTitle>Earnings</SectionTitle>
    <Grid>
      <Input
        label="Basic Salary"
        name="basic"
        value={form.basic}
        onChange={handleChange}
        type="number"
        prefix="₹"
      />
      <Input
        label="HRA"
        name="hra"
        value={form.hra}
        onChange={handleChange}
        type="number"
        prefix="₹"
      />
      <Input
        label="Organisation Allowance"
        name="organisationAllowance"
        value={form.organisationAllowance}
        onChange={handleChange}
        type="number"
        prefix="₹"
      />
      <Input
        label="Performance Pay"
        name="performancePay"
        value={form.performancePay}
        onChange={handleChange}
        type="number"
        prefix="₹"
      />
    </Grid>

    <SectionTitle>Live Preview (updates as you type)</SectionTitle>
    <div
      style={{
        background: "#f8fafc",
        borderRadius: 10,
        padding: 14,
        border: "0.5px solid #e2e8f0",
      }}
    >
      {[
        ["Gross Salary (full month)", computed.gross, "#1a3c6e"],
        ["Gross Salary (prorated)", computed.grossD, "#1a3c6e"],
        ["PF — Employee (12% of Basic)", computed.empPfDed, "#dc2626"],
        ["PF — Employer (13% of Basic)", computed.coPfDed, "#dc2626"],
        ["Total PF (25%)", computed.totalPf, "#b91c1c"],
        ["PT", computed.pt, "#dc2626"],
        ["Gratuity (4.81% of Basic)", computed.gratuity, "#d97706"],
        ["Total Deductions", computed.totalDed, "#dc2626"],
        ["Net Salary", computed.net, "#059669"],
        ["Total with Perf Pay", computed.totalEarn, "#1e293b"],
      ].map(([label, val, color], i, arr) => (
        <div
          key={label}
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: label.includes("Total PF") ? "7px 6px" : "7px 0",
            borderBottom: i < arr.length - 1 ? "0.5px solid #e2e8f0" : "none",
            background: label.includes("Total PF")
              ? "#fef2f2"
              : label.includes("Gratuity")
                ? "#fffbeb"
                : "transparent",
            borderRadius:
              label.includes("Total PF") || label.includes("Gratuity") ? 6 : 0,
            marginLeft: label.includes("Total PF") ? -6 : 0,
            marginRight: label.includes("Total PF") ? -6 : 0,
          }}
        >
          <span style={{ fontSize: 13, color: "#64748b" }}>{label}</span>
          <span style={{ fontSize: 13, fontWeight: 600, color }}>
            {fmt(val)}
          </span>
        </div>
      ))}
    </div>

    <div
      style={{
        marginTop: 10,
        padding: "10px 12px",
        borderRadius: 8,
        background: "#fef2f2",
        border: "0.5px solid #fca5a5",
      }}
    >
      <p style={{ fontSize: 11, color: "#b91c1c", margin: 0 }}>
        <strong>PF rule:</strong> Employee share (12%) + Employer share (13%) =
        25% of Basic — both deducted from employee's net salary. You can
        override either value in the Deductions tab.
      </p>
    </div>
    <div
      style={{
        marginTop: 8,
        padding: "10px 12px",
        borderRadius: 8,
        background: "#fffbeb",
        border: "0.5px solid #fcd34d",
      }}
    >
      <p style={{ fontSize: 11, color: "#92400e", margin: 0 }}>
        <strong>Gratuity:</strong> 4.81% of Basic salary is deducted each month
        as gratuity provision. You can override this in the Deductions tab.
      </p>
    </div>
  </>
);

export default SalaryTab;
