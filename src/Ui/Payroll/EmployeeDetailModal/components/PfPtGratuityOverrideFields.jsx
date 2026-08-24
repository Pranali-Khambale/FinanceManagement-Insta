import React from "react";
import { SectionTitle, OverrideAmountInput } from "./Primitives";
import {
  pfFromBasic,
  employerPfFromBasic,
  gratuityFromBasic,
  fmt,
  n,
} from "../utils";

const fieldLabel = {
  fontSize: 11,
  fontWeight: 600,
  color: "#64748b",
  textTransform: "uppercase",
  letterSpacing: "0.04em",
};
const exemptTag = {
  marginLeft: 6,
  color: "#059669",
  fontWeight: 700,
  textTransform: "none",
};
const checkboxStyle = {
  width: 15,
  height: 15,
  accentColor: "#1a3c6e",
  cursor: "pointer",
};
const exemptBanner = (
  <p
    style={{
      fontSize: 11,
      background: "#ecfdf5",
      border: "0.5px solid #a7f3d0",
      color: "#059669",
      borderRadius: 8,
      padding: "8px 12px",
      margin: "8px 0 0",
    }}
  >
    ✓ Setting this to ₹0 marks this employee as exempt for this month.
  </p>
);

const PfPtGratuityOverrideFields = ({
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
  basicSalary,
}) => {
  const autoEmpPf = pfFromBasic(basicSalary);
  const autoCoEmpPf = employerPfFromBasic(basicSalary);
  const autoGratuity = gratuityFromBasic(basicSalary);

  return (
    <div
      style={{
        border: "0.5px solid #e2e8f0",
        borderRadius: 12,
        padding: 16,
        background: "#f8fafc",
        display: "flex",
        flexDirection: "column",
        gap: 18,
      }}
    >
      <p
        style={{
          fontSize: 11,
          fontWeight: 700,
          color: "#94a3b8",
          textTransform: "uppercase",
          letterSpacing: "0.06em",
          margin: 0,
        }}
      >
        PF, PT &amp; Gratuity Overrides
        <span
          style={{
            marginLeft: 8,
            fontWeight: 400,
            textTransform: "none",
            letterSpacing: 0,
          }}
        >
          (leave unchecked to use auto-calculation)
        </span>
      </p>

      {/* PF Override */}
      <div>
        <label
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            cursor: "pointer",
          }}
        >
          <input
            type="checkbox"
            style={checkboxStyle}
            checked={pfOverride}
            onChange={(e) =>
              handlePfOverrideToggle(e.target.checked, basicSalary)
            }
          />
          <span style={{ fontSize: 13, fontWeight: 500, color: "#334155" }}>
            Override PF amounts
          </span>
          {!pfOverride && (
            <span style={{ fontSize: 11, color: "#94a3b8" }}>
              (auto: Emp ₹{autoEmpPf.toLocaleString("en-IN")} + Co. ₹
              {autoCoEmpPf.toLocaleString("en-IN")} = ₹
              {(autoEmpPf + autoCoEmpPf).toLocaleString("en-IN")} total — 25%)
            </span>
          )}
        </label>

        {pfOverride && (
          <div
            style={{
              marginTop: 12,
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 10,
            }}
          >
            {[
              {
                label: "Employee PF (12% of Basic)",
                val: empPf,
                set: setEmpPf,
              },
              {
                label: "Employer PF (13% of Basic)",
                val: coEmpPf,
                set: setCoEmpPf,
              },
            ].map(({ label, val, set }) => (
              <div
                key={label}
                style={{ display: "flex", flexDirection: "column", gap: 4 }}
              >
                <label style={fieldLabel}>
                  {label} <span style={exemptTag}>Set 0 to exempt</span>
                </label>
                <OverrideAmountInput value={val} onChange={set} />
              </div>
            ))}
            <div
              style={{
                gridColumn: "1 / -1",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "8px 12px",
                borderRadius: 8,
                background: "#fef2f2",
                border: "0.5px solid #fca5a5",
              }}
            >
              <span style={{ fontSize: 12, color: "#b91c1c", fontWeight: 600 }}>
                Total PF deducted (25% combined)
              </span>
              <span style={{ fontSize: 14, color: "#b91c1c", fontWeight: 700 }}>
                {fmt(
                  (empPf !== "" ? Number(empPf) : 0) +
                    (coEmpPf !== "" ? Number(coEmpPf) : 0),
                )}
              </span>
            </div>
            {(empPf === "0" || coEmpPf === "0") && (
              <div style={{ gridColumn: "1 / -1" }}>
                <p
                  style={{
                    fontSize: 11,
                    background: "#ecfdf5",
                    border: "0.5px solid #a7f3d0",
                    color: "#059669",
                    borderRadius: 8,
                    padding: "8px 12px",
                    margin: 0,
                  }}
                >
                  ✓ Setting PF to ₹0 marks this employee as PF-exempt for this
                  month.
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* PT Override */}
      <div>
        <label
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            cursor: "pointer",
          }}
        >
          <input
            type="checkbox"
            style={checkboxStyle}
            checked={ptOverride}
            onChange={(e) => handlePtOverrideToggle(e.target.checked)}
          />
          <span style={{ fontSize: 13, fontWeight: 500, color: "#334155" }}>
            Override Professional Tax (PT)
          </span>
          {!ptOverride && (
            <span style={{ fontSize: 11, color: "#94a3b8" }}>
              (auto: ₹200/month, ₹300 in Feb; ₹0 for female gross ≤ ₹25K)
            </span>
          )}
        </label>
        {ptOverride && (
          <div style={{ marginTop: 12 }}>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 4,
                width: "calc(50% - 5px)",
              }}
            >
              <label style={fieldLabel}>
                PT Amount <span style={exemptTag}>Set 0 to exempt</span>
              </label>
              <OverrideAmountInput value={ptVal} onChange={setPtVal} />
            </div>
            {ptVal === "0" && exemptBanner}
          </div>
        )}
      </div>

      {/* Gratuity Override */}
      <div>
        <label
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            cursor: "pointer",
          }}
        >
          <input
            type="checkbox"
            style={checkboxStyle}
            checked={gratuityOverride}
            onChange={(e) =>
              handleGratuityOverrideToggle(e.target.checked, basicSalary)
            }
          />
          <span style={{ fontSize: 13, fontWeight: 500, color: "#334155" }}>
            Override Gratuity
          </span>
          {!gratuityOverride && (
            <span style={{ fontSize: 11, color: "#94a3b8" }}>
              (auto: 4.81% of Basic = ₹{autoGratuity.toLocaleString("en-IN")})
            </span>
          )}
        </label>
        {gratuityOverride && (
          <div style={{ marginTop: 12 }}>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 4,
                width: "calc(50% - 5px)",
              }}
            >
              <label style={fieldLabel}>
                Gratuity Amount <span style={exemptTag}>Set 0 to exempt</span>
              </label>
              <OverrideAmountInput
                value={gratuityVal}
                onChange={setGratuityVal}
              />
            </div>
            {gratuityVal === "0" && exemptBanner}
          </div>
        )}
      </div>
    </div>
  );
};

export default PfPtGratuityOverrideFields;
