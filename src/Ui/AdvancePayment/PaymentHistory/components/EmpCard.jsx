import { useState, useMemo } from "react";
import { ChevronDown, Calendar } from "lucide-react";
import { T } from "../constants/theme";
import { inr, sortM } from "../utils/formatters";
import Av from "./Av";
import MiniBar from "./MiniBar";
import EvCard from "./EvCard";


const EMP_RESPONSIVE_CSS = `
@media (max-width: 360px) {
  .ph-row { padding: 9px 8px !important; gap: 7px !important; }
  .ph-detail-5 {
    display: grid !important;
    grid-template-columns: 1fr !important;
  }
  .ph-detail-5 > div {
    border-right: none !important;
    border-bottom: 1px solid #E3E3E0;
    padding: 9px 10px !important;
  }
  .ph-detail-5 > div:last-child {
    border-bottom: none;
  }
}
@media (min-width: 361px) and (max-width: 640px) {
  .ph-detail-5 {
    display: grid !important;
    grid-template-columns: repeat(2, 1fr) !important;
  }
  .ph-detail-5 > div {
    border-right: none !important;
    border-bottom: 1px solid #E3E3E0;
  }
  .ph-detail-5 > div:nth-last-child(-n+2) {
    border-bottom: none;
  }
  .ph-row { padding: 11px 10px !important; gap: 8px !important; }
}
@media (max-width: 420px) {
  .ph-row { padding: 11px 10px !important; gap: 8px !important; }
}
@media (min-width: 641px) and (max-width: 900px) {
  .ph-detail-5 {
    display: grid !important;
    grid-template-columns: repeat(3, 1fr) !important;
  }
  .ph-detail-5 > div {
    border-right: none !important;
    border-bottom: 1px solid #E3E3E0;
  }
  .ph-detail-5 > div:nth-last-child(-n+2) {
    border-bottom: none;
  }
}
`;

export default function EmpCard({ empId, empName, empDept, rows }) {
  const [open, setOpen] = useState(false);

  const ta = rows
    .filter((r) => r.eventType === "advance")
    .reduce((s, r) => s + r.amount, 0);
  const td = rows
    .filter((r) => r.eventType === "deduction" && r.deduction_status === "done")
    .reduce((s, r) => s + r.amount, 0);
  const rem = Math.max(0, ta - td);
  const pct = ta > 0 ? Math.min(100, Math.round((td / ta) * 100)) : 0;
  const totalInstallments = rows.filter(
    (r) => r.eventType === "deduction",
  ).length;
  const doneInstallments = rows.filter(
    (r) => r.deduction_status === "done",
  ).length;
  const upcomingInstallments = rows.filter(
    (r) => r.deduction_status === "upcoming",
  ).length;

  const monthMap = useMemo(() => {
    const m = {};
    rows.forEach((r) => {
      (m[r.month] = m[r.month] ?? []).push(r);
    });
    return m;
  }, [rows]);

  const months = useMemo(() => sortM(Object.keys(monthMap)), [monthMap]);

  return (
    <div
      style={{
        background: "#fff",
        borderRadius: 10,
        border: "1px solid #E3E3E0",
        overflow: "hidden",
        marginBottom: 9,
        boxShadow: "0 1px 3px rgba(0,0,0,.04)",
      }}
    >
      <style>{EMP_RESPONSIVE_CSS}</style>
      <button
        className="ph-btn ph-row"
        onClick={() => setOpen((o) => !o)}
        style={{
          width: "100%",
          display: "flex",
          alignItems: "center",
          gap: 10,
          padding: "13px 14px",
          background: "#fff",
          borderBottom: open ? "1px solid #E3E3E0" : "none",
          textAlign: "left",
          transition: "background .1s",
        }}
      >
        <Av name={empName} size={{ base: 32, sm: 38 }} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 7,
              marginBottom: 5,
              flexWrap: "wrap",
            }}
          >
            <span
              style={{
                fontSize: 14,
                fontWeight: 600,
                color: "#111110",
                overflow: "hidden",
                textOverflow: "ellipsis",
                maxWidth: "100%",
              }}
            >
              {empName}
            </span>
            <span
              style={{
                fontSize: 10,
                color: "#888885",
                fontFamily: "'IBM Plex Mono',monospace",
                background: "#F2F2F0",
                padding: "2px 7px",
                borderRadius: 3,
              }}
            >
              {empId}
            </span>
            {empDept && (
              <span
                style={{
                  fontSize: 10,
                  color: "#65635F",
                  padding: "2px 8px",
                  borderRadius: 4,
                  background: "#EEEEEC",
                  fontWeight: 500,
                }}
              >
                {empDept}
              </span>
            )}
          </div>
          {ta > 0 && (
            <>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 7,
                  marginBottom: 6,
                  flexWrap: "wrap",
                }}
              >
                <span
                  style={{
                    fontSize: 10,
                    color: T.a600,
                    background: T.a50,
                    padding: "2px 7px",
                    borderRadius: 3,
                  }}
                >
                  Advance {inr(ta)}
                </span>
                <span
                  style={{
                    fontSize: 10,
                    color: T.g600,
                    background: T.g50,
                    padding: "2px 7px",
                    borderRadius: 3,
                  }}
                >
                  Recovered {inr(td)}
                </span>
                {rem > 0 && (
                  <span
                    style={{
                      fontSize: 10,
                      color: T.r600,
                      background: T.r50,
                      padding: "2px 7px",
                      borderRadius: 3,
                    }}
                  >
                    Due {inr(rem)}
                  </span>
                )}
                <span style={{ fontSize: 10, color: "#888885" }}>
                  {doneInstallments}/{totalInstallments} EMIs
                </span>
                {upcomingInstallments > 0 && (
                  <span
                    style={{
                      fontSize: 10,
                      color: T.v600,
                      background: T.v100,
                      padding: "2px 6px",
                      borderRadius: 3,
                    }}
                  >
                    {upcomingInstallments} upcoming
                  </span>
                )}
              </div>
              <MiniBar pct={pct} height={5} />
            </>
          )}
        </div>
        <ChevronDown
          size={12}
          className={`ph-chev${open ? " open" : ""}`}
          style={{ color: "#ADADAA", flexShrink: 0 }}
        />
      </button>

      {open && (
        <div className="ph-up">
          {ta > 0 && (
            <div
              className="ph-detail-5"
              style={{
                background: "#F7F7F6",
                borderBottom: "1px solid #E3E3E0",
              }}
            >
              {[
                { l: "Advanced", v: inr(ta), c: T.a600, sub: "total" },
                {
                  l: "Recovered",
                  v: inr(td),
                  c: T.g600,
                  sub: `${doneInstallments} EMIs`,
                },
                {
                  l: "Outstanding",
                  v: inr(rem),
                  c: rem > 0 ? T.r600 : T.g600,
                  sub: rem > 0 ? "to collect" : "cleared",
                },
                {
                  l: "Progress",
                  v: `${pct}%`,
                  c: pct >= 75 ? T.g600 : pct >= 40 ? T.a600 : T.r600,
                  sub: "recovery",
                },
                {
                  l: "Installments",
                  v: `${doneInstallments}/${totalInstallments}`,
                  c: T.v600,
                  sub: `${upcomingInstallments} pending`,
                },
              ].map(({ l, v, c, sub }, i) => (
                <div
                  key={l}
                  style={{
                    padding: "11px 13px",
                    borderRight: i < 4 ? "1px solid #E3E3E0" : "none",
                    minWidth: 0,
                  }}
                >
                  <p
                    style={{
                      fontSize: 9,
                      fontWeight: 600,
                      color: "#888885",
                      textTransform: "uppercase",
                      letterSpacing: ".08em",
                      marginBottom: 4,
                    }}
                  >
                    {l}
                  </p>
                  <p
                    style={{
                      fontSize: 16,
                      fontWeight: 700,
                      color: c,
                      fontFamily: "'IBM Plex Mono',monospace",
                      letterSpacing: "-.02em",
                      overflowWrap: "break-word",
                    }}
                  >
                    {v}
                  </p>
                  <p style={{ fontSize: 9, color: "#ADADAA", marginTop: 2 }}>
                    {sub}
                  </p>
                </div>
              ))}
            </div>
          )}

          {months.map((m) => (
            <div key={m} style={{ borderBottom: "1px solid #EEEEEC" }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "7px 14px",
                  background: "#F9F9F8",
                  borderBottom: "1px solid #EEEEEC",
                  flexWrap: "wrap",
                }}
              >
                <Calendar size={10} style={{ color: T.t400 }} />
                <span
                  style={{ fontSize: 11, fontWeight: 600, color: "#323130" }}
                >
                  {m}
                </span>
                <span style={{ fontSize: 10, color: "#888885" }}>
                  {monthMap[m].length} entries
                </span>
              </div>
              {monthMap[m].map((r, i) => (
                <EvCard key={i} r={r} />
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
