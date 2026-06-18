import { FileText } from "lucide-react";
import { STATUS_CONFIG, PAYMENT_TYPES } from "../../data/content";

// ─── Status Badge ─────────────────────────────────────────────────────────────
export function StatusBadge({ status }) {
  const c = STATUS_CONFIG[status];
  if (!c) return null;
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2 sm:px-2.5 py-1 rounded-full text-[11px] sm:text-xs font-semibold ring-1 whitespace-nowrap ${c.twBg} ${c.twText} ${c.twRing}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${c.twDot}`} />
      {c.label}
    </span>
  );
}

// ─── Payment Type Pill ────────────────────────────────────────────────────────
export function PaymentTypePill({ type, size = "sm" }) {
  const pt = PAYMENT_TYPES[type];
  if (!pt) return null;

  const icons = {
    org_to_emp: (
      // Building → arrow → Person
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
        <rect x="2" y="7" width="9" height="14" rx="1"/><path d="M16 3h5v18h-5"/><path d="M6 11h1m0 4h1"/>
      </svg>
    ),
    emp_to_emp: (
      // Two persons
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
        <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
      </svg>
    ),
    other: (
      // Globe
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
        <circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
      </svg>
    ),
  };

  return (
    <span
      className="inline-flex items-center gap-1.5 px-2 sm:px-2.5 py-1 rounded-full text-[11px] sm:text-xs font-semibold border whitespace-nowrap"
      style={{
        background:   pt.pillBg,
        color:        pt.textColor,
        borderColor:  pt.borderColor,
      }}
    >
      <span style={{ color: pt.color }}>{icons[type]}</span>
      {size === "sm" ? pt.short : pt.label}
    </span>
  );
}

// ─── Avatar Initials ──────────────────────────────────────────────────────────
export function Avatar({ name, size = "md", colorKey = "indigo" }) {
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const palettes = {
    indigo: "bg-indigo-100 text-indigo-700",
    sky:    "bg-sky-100    text-sky-700",
    violet: "bg-violet-100 text-violet-700",
    amber:  "bg-amber-100  text-amber-700",
  };

  // Each size includes a slightly smaller mobile variant via responsive classes,
  // so avatars scale down a touch on narrow screens without changing call sites.
  const sizes = {
    sm:  "w-6 h-6 text-[11px] sm:w-7 sm:h-7 sm:text-xs",
    md:  "w-8 h-8 text-xs sm:w-9 sm:h-9 sm:text-sm",
    lg:  "w-9 h-9 text-sm sm:w-11 sm:h-11",
    xl:  "w-11 h-11 text-sm sm:w-14 sm:h-14 sm:text-base",
  };

  return (
    <div className={`rounded-full flex items-center justify-center font-bold shrink-0 ${palettes[colorKey]} ${sizes[size]}`}>
      {initials}
    </div>
  );
}

// ─── Empty State ──────────────────────────────────────────────────────────────
export function EmptyState({ message = "No requests found", sub = "Try adjusting your search or filters" }) {
  return (
    <div className="flex flex-col items-center justify-center px-4 py-10 sm:py-16 text-center">
      <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-slate-100 flex items-center justify-center mb-3 sm:mb-4">
        <FileText size={20} className="text-slate-350" />
      </div>
      <p className="text-slate-600 font-semibold text-sm">{message}</p>
      <p className="text-slate-400 text-xs mt-1 max-w-[260px] sm:max-w-none">{sub}</p>
    </div>
  );
}

// ─── Section Label ────────────────────────────────────────────────────────────
export function SectionLabel({ children }) {
  return (
    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
      {children}
    </p>
  );
}

// ─── Info Tile ────────────────────────────────────────────────────────────────
// `full` spans both columns at every breakpoint that uses a 2-col grid for the
// parent (sm:grid-cols-2). On a 1-col mobile grid it's a no-op since col-span-2
// has nothing to span, so it degrades safely instead of breaking layout.
export function InfoTile({ label, value, mono = false, full = false }) {
  return (
    <div className={`bg-slate-50 border border-slate-100 rounded-xl p-3 sm:p-3.5 ${full ? "col-span-2 sm:col-span-2" : ""}`}>
      <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-1">{label}</p>
      <p className={`text-sm font-semibold text-slate-800 break-words ${mono ? "font-mono" : ""}`}>{value || "—"}</p>
    </div>
  );
}