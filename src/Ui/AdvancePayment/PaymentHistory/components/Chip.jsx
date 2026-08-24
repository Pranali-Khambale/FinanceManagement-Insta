import { STATUS } from "../constants/theme";

const CHIP_RESPONSIVE_CSS = `
@media (max-width: 360px) {
  .ph-tag {
    font-size: 9px !important;
    padding: 2px 6px !important;
  }
}
`;

export default function Chip({ type, size = "sm" }) {
  const c = STATUS[type] ?? STATUS.upcoming;
  const p = size === "lg" ? "4px 11px" : "3px 8px";
  const fs = size === "lg" ? 11 : 10;
  return (
    <>
      <style>{CHIP_RESPONSIVE_CSS}</style>
      <span
        className="ph-tag"
        style={{
          background: c.bg,
          color: c.fg,
          border: `1px solid ${c.border}`,
          padding: p,
          fontSize: fs,
          whiteSpace: "nowrap",
          display: "inline-flex",
          alignItems: "center",
          gap: 5,
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
    </>
  );
}
