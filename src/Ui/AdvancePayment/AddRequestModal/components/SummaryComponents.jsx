import { ArrowRight } from "lucide-react";

export function SRow({ label, value, mono }) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "6px 0",
        borderBottom: "0.5px dashed #e8edf2",
      }}
    >
      <span style={{ fontSize: 12, color: "#94a3b8", flexShrink: 0 }}>
        {label}
      </span>
      <span
        style={{
          fontSize: 12,
          fontWeight: 600,
          color: "#1e293b",
          fontFamily: mono ? "monospace" : "inherit",
          textAlign: "right",
          marginLeft: 12,
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
          maxWidth: "60%",
        }}
      >
        {value}
      </span>
    </div>
  );
}

export function SectionDivider({ label, color, icon }) {
  return (
    <div
      style={{ display: "flex", alignItems: "center", gap: 8, margin: "2px 0" }}
    >
      <div style={{ flex: 1, height: 1, background: "#f1f5f9" }} />
      <span
        style={{
          display: "flex",
          alignItems: "center",
          gap: 5,
          padding: "4px 10px",
          borderRadius: 99,
          fontSize: 11,
          fontWeight: 700,
          background: color + "12",
          color,
        }}
      >
        {icon ?? <ArrowRight size={10} />} {label}
      </span>
      <div style={{ flex: 1, height: 1, background: "#f1f5f9" }} />
    </div>
  );
}
