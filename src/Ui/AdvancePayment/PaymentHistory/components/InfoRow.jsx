export default function InfoRow({ label, value, mono = false, color }) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        gap: 8,
        padding: "6px 0",
        borderBottom: "1px solid #F4F4F2",
      }}
    >
      <span style={{ fontSize: 11, color: "#888885", flexShrink: 0 }}>
        {label}
      </span>
      <span
        style={{
          fontSize: 12,
          fontWeight: 500,
          color: color || "#323130",
          fontFamily: mono ? "'IBM Plex Mono',monospace" : undefined,
          textAlign: "right",
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
          maxWidth: 170,
        }}
      >
        {value || "—"}
      </span>
    </div>
  );
}
