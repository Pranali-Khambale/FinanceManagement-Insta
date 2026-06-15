import { STATUS } from "../constants/theme";

export default function Chip({ type, size = "sm" }) {
  const c = STATUS[type] ?? STATUS.upcoming;
  const p = size === "lg" ? "4px 11px" : "3px 8px";
  const fs = size === "lg" ? 11 : 10;
  return (
    <span
      className="ph-tag"
      style={{
        background: c.bg,
        color: c.fg,
        border: `1px solid ${c.border}`,
        padding: p,
        fontSize: fs,
      }}
    >
      <span
        style={{
          width: 5,
          height: 5,
          borderRadius: "50%",
          background: c.dot,
          display: "block",
          flexShrink: 0,
        }}
      />
      {c.label}
    </span>
  );
}
