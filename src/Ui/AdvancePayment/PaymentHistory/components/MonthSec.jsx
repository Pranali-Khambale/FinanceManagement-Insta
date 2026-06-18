import { useState } from "react";
import { ChevronDown, Calendar } from "lucide-react";
import { T } from "../constants/theme";
import { inr } from "../utils/formatters";
import EvCard from "./EvCard";

const MONTH_RESPONSIVE_CSS = `
@media (max-width: 480px) {
  .ph-month-hdr-btn { padding: 9px 10px !important; gap: 7px !important; }
}
`;

export default function MonthSec({ month, rows }) {
  const [open, setOpen] = useState(true);
  const adv = rows
    .filter((r) => r.eventType === "advance")
    .reduce((s, r) => s + r.amount, 0);
  const ded = rows
    .filter((r) => r.eventType === "deduction")
    .reduce((s, r) => s + r.amount, 0);
  const done = rows.filter((r) => r.deduction_status === "done").length;
  const upcoming = rows.filter((r) => r.deduction_status === "upcoming").length;
  const net = adv - ded;

  return (
    <div style={{ borderBottom: "1px solid #EEEEEC" }}>
      <style>{MONTH_RESPONSIVE_CSS}</style>
      <button
        className="ph-btn ph-row ph-month-hdr-btn"
        onClick={() => setOpen((o) => !o)}
        style={{
          width: "100%",
          display: "flex",
          alignItems: "center",
          gap: 9,
          padding: "10px 14px",
          background: open ? "#F7F7F6" : "#fff",
          borderBottom: open ? "1px solid #EEEEEC" : "none",
          textAlign: "left",
          transition: "background .1s",
        }}
      >
        <div
          style={{
            width: 28,
            height: 28,
            borderRadius: 6,
            background: T.t100,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <Calendar size={12} style={{ color: T.t600 }} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 7,
              marginBottom: 2,
              flexWrap: "wrap",
            }}
          >
            <span style={{ fontSize: 14, fontWeight: 600, color: "#1E1D1C" }}>
              {month}
            </span>
            <span
              style={{
                fontSize: 10,
                color: "#888885",
                background: "#EEEEEC",
                padding: "1px 6px",
                borderRadius: 3,
                whiteSpace: "nowrap",
              }}
            >
              {rows.length} entries
            </span>
            {done > 0 && (
              <span
                style={{
                  fontSize: 10,
                  color: T.g600,
                  background: T.g50,
                  padding: "1px 6px",
                  borderRadius: 3,
                  border: `1px solid ${T.g100}`,
                  whiteSpace: "nowrap",
                }}
              >
                {done} recovered
              </span>
            )}
            {upcoming > 0 && (
              <span
                style={{
                  fontSize: 10,
                  color: T.v600,
                  background: T.v100,
                  padding: "1px 6px",
                  borderRadius: 3,
                  whiteSpace: "nowrap",
                }}
              >
                {upcoming} upcoming
              </span>
            )}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
            {adv > 0 && (
              <span
                style={{
                  fontSize: 10,
                  color: T.a600,
                  fontFamily: "'IBM Plex Mono',monospace",
                  whiteSpace: "nowrap",
                }}
              >
                ↑ {inr(adv)}
              </span>
            )}
            {ded > 0 && (
              <span
                style={{
                  fontSize: 10,
                  color: T.r600,
                  fontFamily: "'IBM Plex Mono',monospace",
                  whiteSpace: "nowrap",
                }}
              >
                ↓ {inr(ded)}
              </span>
            )}
            <span
              style={{
                fontSize: 10,
                fontWeight: 600,
                color: net >= 0 ? T.a700 : T.g600,
                fontFamily: "'IBM Plex Mono',monospace",
                whiteSpace: "nowrap",
              }}
            >
              Net {net >= 0 ? "+" : "−"}
              {inr(Math.abs(net))}
            </span>
          </div>
        </div>
        <ChevronDown
          size={12}
          className={`ph-chev${open ? " open" : ""}`}
          style={{ color: "#888885", flexShrink: 0 }}
        />
      </button>
      {open && (
        <div className="ph-up">
          {rows.map((r, i) => (
            <EvCard key={i} r={r} />
          ))}
        </div>
      )}
    </div>
  );
}