import React from "react";
import { Input, SectionTitle, Grid } from "./Primitives";
import PfPtGratuityOverrideFields from "./PfPtGratuityOverrideFields";
import { fmt, n } from "../utils";

const DeductionsTab = ({
  form,
  handleChange,
  computed,
  pfOverride,
  handlePfOverrideToggle,
  empPf,
  setEmpPf,
  coEmpPf,
  setCoEmpPf,
  ptOverride,
  handlePtOverrideToggle,
  ptVal,
  setPtVal,
  gratuityOverride,
  handleGratuityOverrideToggle,
  gratuityVal,
  setGratuityVal,
  summaryEmpPf,
  summaryCoEmpPf,
  summaryPt,
  summaryGratuity,
}) => (
  <>
    <SectionTitle>PF, PT &amp; Gratuity Overrides</SectionTitle>
    <PfPtGratuityOverrideFields
      pfOverride={pfOverride}
      handlePfOverrideToggle={handlePfOverrideToggle}
      empPf={empPf}
      setEmpPf={setEmpPf}
      coEmpPf={coEmpPf}
      setCoEmpPf={setCoEmpPf}
      ptOverride={ptOverride}
      handlePtOverrideToggle={handlePtOverrideToggle}
      ptVal={ptVal}
      setPtVal={setPtVal}
      gratuityOverride={gratuityOverride}
      handleGratuityOverrideToggle={handleGratuityOverrideToggle}
      gratuityVal={gratuityVal}
      setGratuityVal={setGratuityVal}
      basicSalary={form.basic}
    />

    <SectionTitle>Other Deductions</SectionTitle>
    <Grid>
      <Input
        label="TDS"
        name="tds"
        value={form.tds}
        onChange={handleChange}
        type="number"
        prefix="₹"
      />
      <Input
        label="Other Deductions"
        name="otherDeduction"
        value={form.otherDeduction}
        onChange={handleChange}
        type="number"
        prefix="₹"
      />
    </Grid>

    <SectionTitle>Advance Payment Effects (auto-calculated)</SectionTitle>
    <div
      style={{
        background: "#f8fafc",
        borderRadius: 10,
        padding: 14,
        border: "0.5px solid #e2e8f0",
        marginBottom: 12,
      }}
    >
      <p style={{ fontSize: 11, color: "#94a3b8", marginBottom: 8 }}>
        These values are calculated automatically from approved advance payment
        requests. They cannot be edited here.
      </p>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          padding: "7px 0",
          borderBottom: "0.5px solid #e2e8f0",
        }}
      >
        <span style={{ fontSize: 13, color: "#64748b" }}>
          Advance Deduction (recovery)
        </span>
        <span style={{ fontSize: 13, fontWeight: 600, color: "#dc2626" }}>
          {n(form.advanceDeduction) > 0
            ? `- ${fmt(form.advanceDeduction)}`
            : "₹ 0.00"}
        </span>
      </div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          padding: "7px 0",
        }}
      >
        <span style={{ fontSize: 13, color: "#64748b" }}>Advance Addition</span>
        <span style={{ fontSize: 13, fontWeight: 600, color: "#059669" }}>
          {n(form.advanceAddition) > 0
            ? `+ ${fmt(form.advanceAddition)}`
            : "₹ 0.00"}
        </span>
      </div>
    </div>

    <SectionTitle>Complete Deduction Breakdown</SectionTitle>

    {/* PF section */}
    <div
      style={{
        borderRadius: 10,
        overflow: "hidden",
        border: "0.5px solid #fca5a5",
        marginBottom: 10,
      }}
    >
      <div
        style={{
          background: "#fef2f2",
          padding: "10px 14px",
          borderBottom: "0.5px solid #fca5a5",
        }}
      >
        <p
          style={{
            fontSize: 11,
            fontWeight: 700,
            color: "#b91c1c",
            textTransform: "uppercase",
            letterSpacing: "0.05em",
            margin: 0,
          }}
        >
          Provident Fund (PF)
        </p>
      </div>
      <div style={{ padding: "4px 14px", background: "#fff" }}>
        {[
          {
            label: "Employee PF",
            tag: "12% of Basic",
            val: summaryEmpPf,
            overridden: pfOverride,
          },
          {
            label: "Employer PF",
            tag: "13% of Basic",
            val: summaryCoEmpPf,
            overridden: pfOverride,
          },
        ].map(({ label, tag, val, overridden }) => (
          <div
            key={label}
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "7px 0",
              borderBottom: "0.5px solid #fee2e2",
            }}
          >
            <div>
              <span style={{ fontSize: 13, color: "#991b1b" }}>{label}</span>
              <span
                style={{
                  fontSize: 11,
                  color: "#b91c1c",
                  marginLeft: 8,
                  background: "#fef2f2",
                  padding: "1px 6px",
                  borderRadius: 4,
                }}
              >
                {tag}
              </span>
              {overridden && (
                <span style={{ fontSize: 10, color: "#6366f1", marginLeft: 6 }}>
                  ● overridden
                </span>
              )}
            </div>
            <span style={{ fontSize: 13, fontWeight: 600, color: "#dc2626" }}>
              - {fmt(val)}
            </span>
          </div>
        ))}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "8px 0",
            background: "#fff7f7",
            margin: "0 -14px",
            paddingLeft: 14,
            paddingRight: 14,
          }}
        >
          <span style={{ fontSize: 13, fontWeight: 700, color: "#b91c1c" }}>
            Total PF (25% of Basic)
          </span>
          <span style={{ fontSize: 14, fontWeight: 700, color: "#b91c1c" }}>
            - {fmt(summaryEmpPf + summaryCoEmpPf)}
          </span>
        </div>
        {summaryEmpPf === 0 && summaryCoEmpPf === 0 && (
          <p
            style={{
              fontSize: 11,
              color: "#059669",
              padding: "6px 0",
              margin: 0,
              fontWeight: 600,
            }}
          >
            ✓ Employee is PF-exempt this month
          </p>
        )}
      </div>
    </div>

    {/* Statutory & Other */}
    <div
      style={{
        borderRadius: 10,
        border: "0.5px solid #e2e8f0",
        overflow: "hidden",
        marginBottom: 10,
      }}
    >
      <div
        style={{
          background: "#f1f5f9",
          padding: "10px 14px",
          borderBottom: "0.5px solid #e2e8f0",
        }}
      >
        <p
          style={{
            fontSize: 11,
            fontWeight: 700,
            color: "#475569",
            textTransform: "uppercase",
            letterSpacing: "0.05em",
            margin: 0,
          }}
        >
          Statutory &amp; Other Deductions
        </p>
      </div>
      <div style={{ padding: "4px 14px", background: "#fff" }}>
        {/* PT */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "7px 0",
            borderBottom: "0.5px solid #f1f5f9",
          }}
        >
          <div>
            <span style={{ fontSize: 13, color: "#475569" }}>
              Professional Tax (PT)
            </span>
            <span
              style={{
                fontSize: 11,
                color: "#64748b",
                marginLeft: 8,
                background: "#f1f5f9",
                padding: "1px 6px",
                borderRadius: 4,
              }}
            >
              {/february/i.test(form.forMonth || "")
                ? "₹300 (Feb)"
                : "₹200/month"}
            </span>
            {ptOverride && (
              <span style={{ fontSize: 10, color: "#6366f1", marginLeft: 6 }}>
                ● overridden
              </span>
            )}
            {summaryPt === 0 && (
              <span
                style={{
                  fontSize: 10,
                  color: "#059669",
                  marginLeft: 6,
                  fontWeight: 600,
                }}
              >
                Exempt
              </span>
            )}
          </div>
          <span
            style={{
              fontSize: 13,
              fontWeight: 600,
              color: summaryPt > 0 ? "#dc2626" : "#94a3b8",
            }}
          >
            {summaryPt > 0 ? `- ${fmt(summaryPt)}` : "₹ 0.00"}
          </span>
        </div>

        {/* Gratuity */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "7px 0",
            borderBottom: "0.5px solid #f1f5f9",
            background: "#fffcf0",
          }}
        >
          <div>
            <span style={{ fontSize: 13, color: "#92400e" }}>Gratuity</span>
            <span
              style={{
                fontSize: 11,
                color: "#b45309",
                marginLeft: 8,
                background: "#fef9c3",
                padding: "1px 6px",
                borderRadius: 4,
              }}
            >
              4.81% of Basic
            </span>
            {gratuityOverride && (
              <span style={{ fontSize: 10, color: "#6366f1", marginLeft: 6 }}>
                ● overridden
              </span>
            )}
            {summaryGratuity === 0 && (
              <span
                style={{
                  fontSize: 10,
                  color: "#059669",
                  marginLeft: 6,
                  fontWeight: 600,
                }}
              >
                Exempt
              </span>
            )}
          </div>
          <span
            style={{
              fontSize: 13,
              fontWeight: 600,
              color: summaryGratuity > 0 ? "#b45309" : "#94a3b8",
            }}
          >
            {summaryGratuity > 0 ? `- ${fmt(summaryGratuity)}` : "₹ 0.00"}
          </span>
        </div>

        {/* TDS */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "7px 0",
            borderBottom: "0.5px solid #f1f5f9",
          }}
        >
          <span style={{ fontSize: 13, color: "#475569" }}>
            TDS (Income Tax)
          </span>
          <span
            style={{
              fontSize: 13,
              fontWeight: 600,
              color: n(form.tds) > 0 ? "#dc2626" : "#94a3b8",
            }}
          >
            {n(form.tds) > 0 ? `- ${fmt(form.tds)}` : "₹ 0.00"}
          </span>
        </div>

        {/* Other Deductions */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "7px 0",
            borderBottom: "0.5px solid #f1f5f9",
          }}
        >
          <span style={{ fontSize: 13, color: "#475569" }}>
            Other Deductions
          </span>
          <span
            style={{
              fontSize: 13,
              fontWeight: 600,
              color: n(form.otherDeduction) > 0 ? "#dc2626" : "#94a3b8",
            }}
          >
            {n(form.otherDeduction) > 0
              ? `- ${fmt(form.otherDeduction)}`
              : "₹ 0.00"}
          </span>
        </div>

        {/* Advance Deduction */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "7px 0",
            borderBottom: "0.5px solid #f1f5f9",
          }}
        >
          <span style={{ fontSize: 13, color: "#475569" }}>
            Advance Recovery
          </span>
          <span
            style={{
              fontSize: 13,
              fontWeight: 600,
              color: n(form.advanceDeduction) > 0 ? "#dc2626" : "#94a3b8",
            }}
          >
            {n(form.advanceDeduction) > 0
              ? `- ${fmt(form.advanceDeduction)}`
              : "₹ 0.00"}
          </span>
        </div>

        {/* Advance Addition */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "7px 0",
          }}
        >
          <span style={{ fontSize: 13, color: "#475569" }}>
            Advance Addition
          </span>
          <span
            style={{
              fontSize: 13,
              fontWeight: 600,
              color: n(form.advanceAddition) > 0 ? "#059669" : "#94a3b8",
            }}
          >
            {n(form.advanceAddition) > 0
              ? `+ ${fmt(form.advanceAddition)}`
              : "₹ 0.00"}
          </span>
        </div>
      </div>
    </div>

    {/* Net Deduction Summary */}
    <div
      style={{
        borderRadius: 10,
        border: "1px solid #fca5a5",
        background: "#fef2f2",
        overflow: "hidden",
      }}
    >
      <div
        style={{ padding: "10px 14px", borderBottom: "0.5px solid #fca5a5" }}
      >
        <p
          style={{
            fontSize: 11,
            fontWeight: 700,
            color: "#b91c1c",
            textTransform: "uppercase",
            letterSpacing: "0.05em",
            margin: 0,
          }}
        >
          Net Deduction Summary
        </p>
      </div>
      <div style={{ padding: "4px 14px 8px" }}>
        {[
          ["PF — Employee (12%)", summaryEmpPf],
          ["PF — Employer (13%)", summaryCoEmpPf],
          ["Total PF (25%)", summaryEmpPf + summaryCoEmpPf],
          ["Professional Tax (PT)", summaryPt],
          ["Gratuity (4.81%)", summaryGratuity],
          ["TDS", n(form.tds)],
          ["Other Deductions", n(form.otherDeduction)],
          ["Advance Deduction", n(form.advanceDeduction)],
          ["Advance Addition (−)", -n(form.advanceAddition)],
        ].map(([label, val], i, arr) => {
          const isTotalPf = label.includes("Total PF");
          return (
            <div
              key={label}
              style={{
                display: "flex",
                justifyContent: "space-between",
                padding: "5px 0",
                borderBottom:
                  i < arr.length - 1 ? "0.5px solid #fca5a5" : "none",
                background: isTotalPf ? "rgba(185,28,28,0.06)" : "transparent",
                marginLeft: isTotalPf ? -14 : 0,
                marginRight: isTotalPf ? -14 : 0,
                paddingLeft: isTotalPf ? 14 : 0,
                paddingRight: isTotalPf ? 14 : 0,
              }}
            >
              <span
                style={{
                  fontSize: 13,
                  color: isTotalPf ? "#b91c1c" : "#991b1b",
                  fontWeight: isTotalPf ? 700 : 400,
                }}
              >
                {label}
              </span>
              <span
                style={{
                  fontSize: 13,
                  color: isTotalPf ? "#b91c1c" : "#991b1b",
                  fontWeight: isTotalPf ? 700 : 500,
                }}
              >
                {fmt(Math.abs(val))}
              </span>
            </div>
          );
        })}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            paddingTop: 10,
            borderTop: "1.5px solid #f87171",
            marginTop: 4,
          }}
        >
          <span style={{ fontSize: 14, fontWeight: 700, color: "#dc2626" }}>
            Net Total Deduction
          </span>
          <span style={{ fontSize: 16, fontWeight: 700, color: "#dc2626" }}>
            {fmt(computed.totalDed)}
          </span>
        </div>
      </div>
    </div>

    {/* Net Salary Preview */}
    <div
      style={{
        marginTop: 10,
        borderRadius: 10,
        border: "0.5px solid #a7f3d0",
        background: "#ecfdf5",
        padding: "12px 14px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
      }}
    >
      <div>
        <p
          style={{
            fontSize: 11,
            color: "#059669",
            fontWeight: 700,
            textTransform: "uppercase",
            letterSpacing: "0.04em",
            margin: 0,
          }}
        >
          Estimated Net Salary (prorated)
        </p>
        <p style={{ fontSize: 11, color: "#6ee7b7", margin: "2px 0 0" }}>
          Gross ₹
          {n(computed.grossD).toLocaleString("en-IN", {
            maximumFractionDigits: 0,
          })}{" "}
          − Deductions ₹
          {n(computed.totalDed).toLocaleString("en-IN", {
            maximumFractionDigits: 0,
          })}{" "}
          + Adv. Add. ₹
          {n(form.advanceAddition).toLocaleString("en-IN", {
            maximumFractionDigits: 0,
          })}
        </p>
      </div>
      <span style={{ fontSize: 22, fontWeight: 700, color: "#059669" }}>
        {fmt(computed.net)}
      </span>
    </div>
  </>
);

export default DeductionsTab;
