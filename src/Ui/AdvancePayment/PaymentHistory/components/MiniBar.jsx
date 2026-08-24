const MINIBAR_RESPONSIVE_CSS = `
@media (max-width: 360px) {
  .ph-minibar { gap: 4px !important; }
  .ph-minibar span { font-size: 9px !important; min-width: 24px !important; }
}
`;

export default function MiniBar({ pct, showPct = true, height = 4 }) {
  const clamped = Math.max(0, Math.min(100, pct));
  const fg = clamped >= 75 ? "#16A34A" : clamped >= 40 ? "#E08A00" : "#E8384F";
  return (
    <>
      <style>{MINIBAR_RESPONSIVE_CSS}</style>
      <div
        className="ph-minibar"
        style={{ display: "flex", alignItems: "center", gap: 6, width: "100%" }}
      >
        <div
          style={{
            flex: 1,
            height,
            borderRadius: 99,
            background: "#EEEEEC",
            overflow: "hidden",
            minWidth: 0,
          }}
        >
          <div
            className="ph-pbar"
            style={{
              "--w": `${clamped}%`,
              height: "100%",
              borderRadius: 99,
              background: fg,
            }}
          />
        </div>
        {showPct && (
          <span
            style={{
              fontSize: 10,
              fontWeight: 600,
              fontFamily: "'IBM Plex Mono',monospace",
              color: fg,
              minWidth: 28,
              textAlign: "right",
              flexShrink: 0,
            }}
          >
            {clamped}%
          </span>
        )}
      </div>
    </>
  );
}
