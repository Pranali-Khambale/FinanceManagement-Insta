import React from "react";
import { Input, SectionTitle, Grid } from "./Primitives";
import { fmt, n } from "../utils";

const AttendanceTab = ({ form, handleChange, computed }) => {
  const p = n(form.pDays);
  const m = n(form.monthDays) || 30;
  const pct = m > 0 ? ((p / m) * 100).toFixed(1) : "0.0";
  const barW = m > 0 ? Math.min((p / m) * 100, 100) : 0;

  return (
    <>
      <SectionTitle>Attendance</SectionTitle>
      <Grid cols={3}>
        <Input
          label="Present Days (P Days)"
          name="pDays"
          value={form.pDays}
          onChange={handleChange}
          type="number"
          hint={`Max: ${n(form.monthDays) || 30}`}
        />
        <Input
          label="Absent Days (A Days)"
          name="aDays"
          value={form.aDays}
          onChange={handleChange}
          type="number"
        />
        <Input
          label="Total Month Days"
          name="monthDays"
          value={form.monthDays}
          onChange={handleChange}
          type="number"
        />
      </Grid>

      <SectionTitle>Attendance Ratio</SectionTitle>
      <div
        style={{
          background: "#f8fafc",
          borderRadius: 10,
          padding: 14,
          border: "0.5px solid #e2e8f0",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginBottom: 8,
          }}
        >
          <span style={{ fontSize: 13, color: "#64748b" }}>
            {p} of {m} days present
          </span>
          <span style={{ fontSize: 13, fontWeight: 600, color: "#1a3c6e" }}>
            {pct}%
          </span>
        </div>
        <div
          style={{
            height: 8,
            background: "#e2e8f0",
            borderRadius: 8,
            overflow: "hidden",
          }}
        >
          <div
            style={{
              height: "100%",
              width: `${barW}%`,
              background: "#1a3c6e",
              borderRadius: 8,
              transition: "width 0.4s",
            }}
          />
        </div>
        <p style={{ fontSize: 11, color: "#94a3b8", marginTop: 8 }}>
          Absent: {n(form.aDays)} days · This ratio is applied to gross salary
          when computing net.
        </p>
      </div>

      <SectionTitle>Salary Impact Preview</SectionTitle>
      <div
        style={{
          background: "#f8fafc",
          borderRadius: 10,
          padding: 14,
          border: "0.5px solid #e2e8f0",
        }}
      >
        {[
          ["Gross (full month)", computed.gross, "#64748b"],
          ["Gross (earned)", computed.grossD, "#1a3c6e"],
          ["PF (25% total)", computed.totalPf, "#dc2626"],
          ["Gratuity (4.81%)", computed.gratuity, "#d97706"],
          ["Total Deductions", computed.totalDed, "#dc2626"],
          ["Net Salary", computed.net, "#059669"],
        ].map(([label, val, color]) => (
          <div
            key={label}
            style={{
              display: "flex",
              justifyContent: "space-between",
              padding: "5px 0",
            }}
          >
            <span style={{ fontSize: 13, color: "#64748b" }}>{label}</span>
            <span style={{ fontSize: 13, fontWeight: 600, color }}>
              {fmt(val)}
            </span>
          </div>
        ))}
      </div>
    </>
  );
};

export default AttendanceTab;
