export default function MiniBar({ pct, showPct = true, height = 4 }) {
  const fg = pct >= 75 ? "#16A34A" : pct >= 40 ? "#E08A00" : "#E8384F";
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
      <div
        style={{
          flex: 1,
          height,
          borderRadius: 99,
          background: "#EEEEEC",
          overflow: "hidden",
          minWidth: 50,
        }}
      >
        <div
          className="ph-pbar"
          style={{
            "--w": `${pct}%`,
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
            minWidth: 30,
            textAlign: "right",
          }}
        >
          {pct}%
        </span>
      )}
    </div>
  );
}
