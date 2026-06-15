import React from "react";

export const Label = ({ children }) => (
  <label
    style={{
      fontSize: 11,
      fontWeight: 600,
      color: "var(--color-text-secondary, #64748b)",
      textTransform: "uppercase",
      letterSpacing: "0.04em",
    }}
  >
    {children}
  </label>
);

export const Input = ({
  label,
  name,
  value,
  onChange,
  type = "text",
  readOnly = false,
  prefix,
  hint,
}) => (
  <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
    <Label>{label}</Label>
    <div
      style={{ position: "relative", display: "flex", alignItems: "center" }}
    >
      {prefix && (
        <span
          style={{
            position: "absolute",
            left: 10,
            fontSize: 13,
            color: "var(--color-text-secondary, #64748b)",
            pointerEvents: "none",
          }}
        >
          {prefix}
        </span>
      )}
      <input
        type={type}
        name={name}
        value={value ?? ""}
        readOnly={readOnly}
        onChange={(e) => !readOnly && onChange(name, e.target.value)}
        style={{
          width: "100%",
          border: "0.5px solid var(--color-border-tertiary, #e2e8f0)",
          borderRadius: 8,
          padding: prefix ? "7px 10px 7px 22px" : "7px 10px",
          fontSize: 13,
          color: readOnly ? "#94a3b8" : "var(--color-text-primary, #1e293b)",
          background: readOnly
            ? "var(--color-background-secondary, #f8fafc)"
            : "#fff",
          outline: "none",
          cursor: readOnly ? "not-allowed" : "text",
          boxSizing: "border-box",
        }}
        onFocus={(e) => {
          if (!readOnly) e.target.style.borderColor = "#6366f1";
        }}
        onBlur={(e) => {
          e.target.style.borderColor = "var(--color-border-tertiary, #e2e8f0)";
        }}
      />
    </div>
    {hint && (
      <p style={{ fontSize: 10, color: "#94a3b8", margin: 0 }}>{hint}</p>
    )}
  </div>
);

export const SectionTitle = ({ children }) => (
  <p
    style={{
      fontSize: 11,
      fontWeight: 700,
      color: "#94a3b8",
      textTransform: "uppercase",
      letterSpacing: "0.06em",
      marginBottom: 10,
      marginTop: 18,
    }}
  >
    {children}
  </p>
);

export const Grid = ({ children, cols = 2 }) => (
  <div
    style={{
      display: "grid",
      gridTemplateColumns: `repeat(${cols}, minmax(0,1fr))`,
      gap: 10,
    }}
  >
    {children}
  </div>
);

export const Divider = () => (
  <div style={{ height: "0.5px", background: "#e2e8f0", margin: "14px 0" }} />
);

export const OverrideAmountInput = ({ value, onChange }) => (
  <div style={{ position: "relative" }}>
    <span
      style={{
        position: "absolute",
        left: 10,
        top: "50%",
        transform: "translateY(-50%)",
        fontSize: 13,
        color: "#64748b",
        pointerEvents: "none",
      }}
    >
      ₹
    </span>
    <input
      type="number"
      min="0"
      step="1"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      style={{
        width: "100%",
        border: "0.5px solid #e2e8f0",
        borderRadius: 8,
        padding: "7px 10px 7px 22px",
        fontSize: 13,
        color: "#1e293b",
        background: "#fff",
        outline: "none",
        boxSizing: "border-box",
      }}
      onFocus={(e) => {
        e.target.style.borderColor = "#6366f1";
      }}
      onBlur={(e) => {
        e.target.style.borderColor = "#e2e8f0";
      }}
    />
  </div>
);
