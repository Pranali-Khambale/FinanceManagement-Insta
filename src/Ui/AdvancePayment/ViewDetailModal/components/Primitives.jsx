// ─────────────────────────────────────────────────────────────────────────────
// FILE: src/Ui/AdvancePayment/ViewDetailModal/components/Primitives.jsx
// ─────────────────────────────────────────────────────────────────────────────

// Avatar and InfoTile are general-purpose primitives used across the modal.
// Avatar already uses Tailwind size classes (w-8/w-10/w-11) — these scale
// via the sizeMap, so no media queries needed there.
// InfoTile uses px-3.5/py-2.5 which are fine at mobile widths, but at
// ≤360px the label and value text need a touch of compression so they
// don't overflow inside narrow grid cells (e.g. 2-column info grids).
const PRIMITIVE_RESPONSIVE_CSS = `
@media (max-width: 360px) {
  .ph-infotile {
    padding: 8px 10px !important;
    border-radius: 10px !important;
  }
  .ph-infotile-label {
    font-size: 9px !important;
  }
  .ph-infotile-value {
    font-size: 12px !important;
  }
}
@media (min-width: 361px) and (max-width: 480px) {
  .ph-infotile {
    padding: 9px 12px !important;
  }
  .ph-infotile-label {
    font-size: 9px !important;
  }
}
`;

export function Avatar({ name = "", size = "md", colorKey = "indigo" }) {
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const sizeMap = {
    sm: "w-8 h-8 text-xs",
    md: "w-10 h-10 text-sm",
    lg: "w-11 h-11 text-sm",
  };

  const colorMap = {
    indigo: "bg-indigo-100 text-indigo-600",
    sky: "bg-sky-100 text-sky-600",
    purple: "bg-purple-100 text-purple-600",
    emerald: "bg-emerald-100 text-emerald-600",
  };

  return (
    <div
      className={`rounded-full flex items-center justify-center font-bold shrink-0 ${sizeMap[size]} ${colorMap[colorKey] || colorMap.indigo}`}
    >
      {initials || "?"}
    </div>
  );
}

export function InfoTile({ label, value, mono = false }) {
  return (
    <>
      <style>{PRIMITIVE_RESPONSIVE_CSS}</style>
      <div
        className="ph-infotile border rounded-xl px-3.5 py-2.5"
        style={{
          background: "rgba(219,234,254,0.35)",
          borderColor: "rgba(191,219,254,0.6)",
        }}
      >
        <p className="ph-infotile-label text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-0.5">
          {label}
        </p>
        <p
          className={`ph-infotile-value text-sm font-semibold text-slate-700 truncate ${mono ? "font-mono" : ""}`}
        >
          {value ?? <span className="text-slate-300">—</span>}
        </p>
      </div>
    </>
  );
}
