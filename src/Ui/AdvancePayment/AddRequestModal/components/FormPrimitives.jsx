import { AlertCircle } from "lucide-react";

export function Field({ label, required, error, children }) {
  return (
    <div>
      <label
        style={{
          display: "block",
          fontSize: 11,
          fontWeight: 700,
          color: "#64748b",
          textTransform: "uppercase",
          letterSpacing: "0.06em",
          marginBottom: 6,
        }}
      >
        {label} {required && <span style={{ color: "#ef4444" }}>*</span>}
      </label>
      {children}
      {error && (
        <p
          style={{
            display: "flex",
            alignItems: "center",
            gap: 4,
            margin: "4px 0 0",
            fontSize: 11,
            color: "#ef4444",
          }}
        >
          <AlertCircle size={10} /> {error}
        </p>
      )}
    </div>
  );
}

export function Inp({ error, extraStyle, ...props }) {
  return (
    <input
      {...props}
      style={{
        width: "100%",
        padding: "9px 12px",
        borderRadius: 9,
        fontSize: 13,
        border: `1.5px solid ${error ? "#fca5a5" : "#e2e8f0"}`,
        background: error ? "#fff5f5" : "#fff",
        color: "#1e293b",
        outline: "none",
        fontFamily: "inherit",
        boxSizing: "border-box",
        ...extraStyle,
      }}
    />
  );
}
