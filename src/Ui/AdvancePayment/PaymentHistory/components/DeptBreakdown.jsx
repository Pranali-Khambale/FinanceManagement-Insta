import { useMemo } from "react";
import { Building2 } from "lucide-react";
import { T } from "../constants/theme";
import { inrK } from "../utils/formatters";

// Scoped responsive rules for this component only. `ph-dept-row` is assumed
// to be a 3-column grid/flex row defined in theme.js (label | bar | amount).
// On mobile we override it to stack into 2 rows: label+amount on top,
// the progress bar full-width below — so percentages and rupee figures
// never get squeezed into an unreadable sliver.
const DEPT_RESPONSIVE_CSS = `
@media (max-width: 640px) {
  .ph-dept-row {
    display: grid !important;
    grid-template-columns: 1fr auto !important;
    grid-template-areas: "label amount" "bar bar" !important;
    row-gap: 6px;
    column-gap: 8px;
    align-items: center !important;
  }
  .ph-dept-row > div:nth-child(1) { grid-area: label; min-width: 0; }
  .ph-dept-row > div:nth-child(2) { grid-area: bar; }
  .ph-dept-row > div:nth-child(3) { grid-area: amount; text-align: right !important; min-width: auto !important; }
}
`;

export default function DeptBreakdown({ empGroups, loading }) {
  const depts = useMemo(() => {
    const m = {};
    empGroups.forEach((g) => {
      const d = g.empDept || "Other";
      if (!m[d]) m[d] = { dept: d, count: 0, adv: 0, ded: 0 };
      m[d].count++;
      g.rows.forEach((r) => {
        if (r.eventType === "advance") m[d].adv += r.amount;
        if (r.eventType === "deduction" && r.deduction_status === "done")
          m[d].ded += r.amount;
      });
    });
    return Object.values(m)
      .sort((a, b) => b.adv - a.adv)
      .slice(0, 5);
  }, [empGroups]);

  const maxAdv = depts.reduce((m, d) => Math.max(m, d.adv), 1);

  if (loading || !depts.length) return null;

  return (
    <div
      style={{
        background: "#fff",
        borderRadius: 10,
        border: "1px solid #E3E3E0",
        overflow: "hidden",
      }}
    >
      <style>{DEPT_RESPONSIVE_CSS}</style>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 7,
          padding: "11px 14px",
          borderBottom: "1px solid #E3E3E0",
          flexWrap: "wrap",
        }}
      >
        <Building2 size={13} style={{ color: T.b1 }} />
        <span style={{ fontSize: 12, fontWeight: 600, color: "#1E1D1C" }}>
          Department Breakdown
        </span>
        <span style={{ fontSize: 10, color: "#888885", marginLeft: 2 }}>
          top 5 departments
        </span>
      </div>
      <div
        style={{
          padding: "9px 14px",
          display: "flex",
          flexDirection: "column",
          gap: 7,
        }}
      >
        {depts.map((d) => {
          const pct = Math.min(100, Math.round((d.adv / maxAdv) * 100));
          const recPct =
            d.adv > 0 ? Math.min(100, Math.round((d.ded / d.adv) * 100)) : 0;
          return (
            <div key={d.dept} className="ph-dept-row">
              <div style={{ minWidth: 0 }}>
                <p
                  style={{
                    fontSize: 11,
                    fontWeight: 500,
                    color: "#323130",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {d.dept}
                </p>
                <p style={{ fontSize: 10, color: "#888885" }}>
                  {d.count} emp{d.count !== 1 ? "s" : ""}
                </p>
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    height: 6,
                    borderRadius: 99,
                    background: "#EEEEEC",
                    overflow: "hidden",
                    position: "relative",
                  }}
                >
                  <div
                    className="ph-pbar"
                    style={{
                      "--w": `${pct}%`,
                      height: "100%",
                      borderRadius: 99,
                      background: "#BFDBFE",
                      position: "absolute",
                      top: 0,
                      left: 0,
                    }}
                  />
                  <div
                    className="ph-pbar"
                    style={{
                      "--w": `${Math.round((pct * recPct) / 100)}%`,
                      height: "100%",
                      borderRadius: 99,
                      background: T.g500,
                      position: "absolute",
                      top: 0,
                      left: 0,
                    }}
                  />
                </div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginTop: 3,
                  }}
                >
                  <span style={{ fontSize: 9, color: "#888885" }}>
                    Adv {inrK(d.adv)}
                  </span>
                  <span style={{ fontSize: 9, color: T.g600 }}>
                    Rec {recPct}%
                  </span>
                </div>
              </div>
              <div style={{ textAlign: "right", minWidth: 64 }}>
                <p
                  style={{
                    fontSize: 12,
                    fontWeight: 600,
                    color: "#111110",
                    fontFamily: "'IBM Plex Mono',monospace",
                  }}
                >
                  {inrK(d.adv)}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}