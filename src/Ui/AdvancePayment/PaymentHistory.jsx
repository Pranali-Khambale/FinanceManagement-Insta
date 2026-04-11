// ─────────────────────────────────────────────────────────────────────────────
// FILE: src/Ui/AdvancePayment/PaymentHistory.jsx
// Enterprise-grade Finance UI — Salary Advance & Deduction Ledger
// ─────────────────────────────────────────────────────────────────────────────
import { useState, useEffect, useCallback, useMemo } from "react";
import {
  TrendingDown, TrendingUp, Search, Wallet, ArrowDownCircle,
  RefreshCw, AlertCircle, Loader2, Calendar, Users,
  CheckCircle2, Clock, ChevronRight, CalendarCheck,
  CalendarClock, FileText,
} from "lucide-react";
import advancePaymentService from "../../services/advancePaymentService";

// ─── Google Fonts ─────────────────────────────────────────────────────────────
if (typeof document !== "undefined" && !document.getElementById("ph-gf")) {
  const l = document.createElement("link");
  l.id = "ph-gf"; l.rel = "stylesheet";
  l.href = "https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap";
  document.head.appendChild(l);
}

// ─── Design Tokens ────────────────────────────────────────────────────────────
const T = {
  sans:      "'Plus Jakarta Sans', system-ui, sans-serif",
  mono:      "'JetBrains Mono', 'Courier New', monospace",
  ink:       "#0D1117",
  ink2:      "#1C2333",
  slate:     "#374151",
  muted:     "#6B7280",
  ghost:     "#9CA3AF",
  line:      "#E5E7EB",
  lineLt:    "#F3F4F6",
  surface:   "#FFFFFF",
  canvas:    "#F9FAFB",
  blue:      "#2563EB", blueLt: "#EFF6FF", blueBd: "#BFDBFE", blueDk: "#1D4ED8",
  green:     "#059669", greenLt: "#ECFDF5", greenBd: "#A7F3D0", greenDk: "#047857",
  red:       "#DC2626", redLt: "#FEF2F2",  redBd: "#FECACA",   redDk: "#B91C1C",
  amber:     "#D97706", amberLt: "#FFFBEB", amberBd: "#FDE68A", amberDk: "#B45309",
  violet:    "#7C3AED", violetLt: "#F5F3FF", violetBd: "#DDD6FE",
  r6: 6, r8: 8, r10: 10, r12: 12, r16: 16,
  shSm: "0 1px 3px rgba(0,0,0,.06), 0 1px 2px rgba(0,0,0,.04)",
  shMd: "0 4px 12px rgba(0,0,0,.08), 0 1px 3px rgba(0,0,0,.05)",
};

const CSS = `
  @keyframes ph-spin  { to { transform: rotate(360deg) } }
  @keyframes ph-pulse { 0%,100%{opacity:1} 50%{opacity:.4} }
  @keyframes ph-fade  { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:translateY(0)} }
  @keyframes ph-shim  { 0%{background-position:-600px 0} 100%{background-position:600px 0} }
  .ph-row:hover  { background: #F0F7FF !important; }
  .ph-grp:hover  { background: #F3F4F6 !important; }
  .ph-emph:hover { background: #F8FAFC !important; }
  .ph-kpi        { animation: ph-fade .35s ease both; }
  .ph-shimmer {
    background: linear-gradient(90deg,#F3F4F6 25%,#E9ECEF 50%,#F3F4F6 75%);
    background-size: 600px 100%;
    animation: ph-shim 1.6s infinite linear;
    border-radius: 8px;
  }
  .ph-input:focus {
    outline: none;
    border-color: #93C5FD !important;
    box-shadow: 0 0 0 3px rgba(59,130,246,.12) !important;
  }
  .ph-tab { transition: all .15s; }
  .ph-tab:hover:not(.active) { color: #374151 !important; background: #F3F4F6 !important; }
`;

// ─── Helpers ──────────────────────────────────────────────────────────────────
const fmt  = n => `₹${Math.round(Number(n) || 0).toLocaleString("en-IN")}`;
const fmtK = n => {
  const v = Math.round(Number(n) || 0);
  return v >= 100000 ? `₹${(v / 100000).toFixed(1)}L`
       : v >= 1000   ? `₹${(v / 1000).toFixed(1)}K`
       : fmt(v);
};
const ini  = name => (name || "?").split(" ").slice(0, 2).map(x => x[0]).join("").toUpperCase();
const fmtD = raw => {
  if (!raw) return "—";
  const d = new Date(raw);
  return isNaN(d) ? String(raw).slice(0, 10) : d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
};
const MMAP = { jan:"01",feb:"02",mar:"03",apr:"04",may:"05",jun:"06",jul:"07",aug:"08",sep:"09",oct:"10",nov:"11",dec:"12" };
const mKey = l => {
  if (/^\d{4}-\d{2}$/.test(l)) return l;
  const [m = "", y = ""] = l.trim().split(/\s+/);
  const k = MMAP[m.slice(0, 3).toLowerCase()];
  return k ? `${y}-${k}` : l;
};
const sortM = arr => [...new Set(arr)].sort((a, b) => mKey(a).localeCompare(mKey(b)));

const AV_PALETTE = [
  ["#DBEAFE", "#1D4ED8"], ["#D1FAE5", "#065F46"], ["#FEF3C7", "#92400E"],
  ["#FCE7F3", "#9D174D"], ["#EDE9FE", "#5B21B6"], ["#FFEDD5", "#9A3412"],
  ["#CFFAFE", "#164E63"], ["#F0FDF4", "#14532D"],
];

// ─── Avatar ───────────────────────────────────────────────────────────────────
function Av({ name, size = 30 }) {
  const [bg, fg] = AV_PALETTE[(name || "A").charCodeAt(0) % AV_PALETTE.length];
  return (
    <div style={{
      width: size, height: size, borderRadius: "50%",
      background: bg, color: fg,
      display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: size * 0.33, fontWeight: 700, flexShrink: 0,
      fontFamily: T.sans, border: `1.5px solid ${fg}22`, letterSpacing: "-.01em",
    }}>
      {ini(name)}
    </div>
  );
}

// ─── Status Badge ─────────────────────────────────────────────────────────────
const BADGE_MAP = {
  advance:  { bg: T.blueLt,   fg: T.blueDk,   bd: T.blueBd,   dot: "#60A5FA", lbl: "Disbursed" },
  done:     { bg: T.greenLt,  fg: T.greenDk,  bd: T.greenBd,  dot: "#34D399", lbl: "Deducted"  },
  upcoming: { bg: T.violetLt, fg: T.violet,   bd: T.violetBd, dot: "#A78BFA", lbl: "Upcoming"  },
  skipped:  { bg: T.canvas,   fg: T.muted,    bd: T.line,     dot: T.ghost,   lbl: "Skipped"   },
};
function Badge({ type }) {
  const b = BADGE_MAP[type] ?? BADGE_MAP.upcoming;
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 5,
      padding: "3px 9px", borderRadius: 999,
      fontSize: 11, fontWeight: 600, letterSpacing: ".01em",
      background: b.bg, color: b.fg, border: `1px solid ${b.bd}`,
      fontFamily: T.sans, whiteSpace: "nowrap",
    }}>
      <span style={{ width: 5, height: 5, borderRadius: "50%", background: b.dot, flexShrink: 0 }} />
      {b.lbl}
    </span>
  );
}

// ─── Summary Tag ──────────────────────────────────────────────────────────────
function Tag({ label, bg, fg, bd }) {
  return (
    <span style={{
      fontSize: 11, fontWeight: 600, padding: "2px 9px", borderRadius: 999,
      background: bg, color: fg, border: `1px solid ${bd}`,
      fontFamily: T.sans, whiteSpace: "nowrap",
    }}>
      {label}
    </span>
  );
}

// ─── KPI Card ─────────────────────────────────────────────────────────────────
function KpiCard({ label, value, sub, icon: Icon, accent, accentBg, loading, idx = 0 }) {
  return (
    <div className="ph-kpi" style={{
      background: T.surface, borderRadius: T.r12, border: `1px solid ${T.line}`,
      padding: "18px 20px", boxShadow: T.shSm, animationDelay: `${idx * 55}ms`,
      display: "flex", flexDirection: "column", gap: 10,
    }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{ fontSize: 11, fontWeight: 700, color: T.ghost, fontFamily: T.sans, textTransform: "uppercase", letterSpacing: ".07em" }}>
          {label}
        </span>
        <div style={{ width: 30, height: 30, borderRadius: T.r8, background: accentBg, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Icon size={14} style={{ color: accent }} />
        </div>
      </div>
      {loading
        ? <div className="ph-shimmer" style={{ height: 28, width: "55%" }} />
        : <p style={{ margin: 0, fontSize: 26, fontWeight: 800, color: T.ink, fontFamily: T.mono, letterSpacing: "-.04em", lineHeight: 1 }}>{value}</p>
      }
      {sub && !loading && (
        <p style={{ margin: 0, fontSize: 11, color: T.ghost, fontFamily: T.sans }}>{sub}</p>
      )}
    </div>
  );
}

// ─── Recovery Meter ───────────────────────────────────────────────────────────
function RecoveryMeter({ advanced, recovered, outstanding, pct }) {
  const clr = pct >= 80 ? T.green : pct >= 40 ? T.amber : T.red;
  const bgr = pct >= 80 ? T.greenLt : pct >= 40 ? T.amberLt : T.redLt;
  const bdr = pct >= 80 ? T.greenBd : pct >= 40 ? T.amberBd : T.redBd;
  return (
    <div style={{ background: T.surface, borderRadius: T.r12, border: `1px solid ${T.line}`, padding: "18px 22px", boxShadow: T.shSm }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 14, gap: 10, flexWrap: "wrap" }}>
        <div>
          <h3 style={{ margin: 0, fontSize: 13, fontWeight: 700, color: T.ink, fontFamily: T.sans }}>Recovery Tracker</h3>
          <p style={{ margin: "3px 0 0", fontSize: 11, color: T.ghost, fontFamily: T.sans }}>Overall advance recovery across all employees</p>
        </div>
        <div style={{ padding: "4px 12px", borderRadius: 999, background: bgr, border: `1px solid ${bdr}` }}>
          <span style={{ fontSize: 13, fontWeight: 700, fontFamily: T.mono, color: clr }}>{pct}% recovered</span>
        </div>
      </div>
      <div style={{ height: 6, borderRadius: 999, background: T.lineLt, overflow: "hidden", marginBottom: 14, position: "relative" }}>
        <div style={{ position: "absolute", left: 0, top: 0, height: "100%", width: `${pct}%`, borderRadius: 999, background: clr, transition: "width 1s cubic-bezier(.4,0,.2,1)" }} />
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10 }}>
        {[
          { label: "Total Disbursed",   val: fmt(advanced),    color: T.amber, bg: T.amberLt },
          { label: "Total Recovered",   val: fmt(recovered),   color: T.green, bg: T.greenLt },
          { label: "Still Outstanding", val: fmt(outstanding), color: T.red,   bg: T.redLt   },
        ].map(({ label, val, color, bg }) => (
          <div key={label} style={{ background: bg, borderRadius: T.r8, padding: "11px 13px", border: `1px solid ${color}22` }}>
            <p style={{ margin: "0 0 4px", fontSize: 9, fontWeight: 700, color: T.muted, fontFamily: T.sans, textTransform: "uppercase", letterSpacing: ".07em" }}>{label}</p>
            <p style={{ margin: 0, fontSize: 16, fontWeight: 700, color, fontFamily: T.mono, letterSpacing: "-.03em" }}>{val}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Table Head ───────────────────────────────────────────────────────────────
const MONTH_COLS = [
  { key: "emp",    label: "Employee",  w: 200 },
  { key: "event",  label: "Type",      w: 140 },
  { key: "amt",    label: "Amount",    w: 110 },
  { key: "req",    label: "Requested", w: 115 },
  { key: "appr",   label: "Approved",  w: 115 },
  { key: "status", label: "Status",    w: 105 },
  { key: "ref",    label: "Reference", w: 130 },
  { key: "rsn",    label: "Reason",    flex: true, minW: 130 },
];
const EMP_COLS = [
  { key: "month",  label: "Month",     w: 110 },
  { key: "event",  label: "Type",      w: 140 },
  { key: "amt",    label: "Amount",    w: 110 },
  { key: "req",    label: "Requested", w: 115 },
  { key: "appr",   label: "Approved",  w: 115 },
  { key: "status", label: "Status",    w: 105 },
  { key: "ref",    label: "Reference", w: 130 },
  { key: "ptype",  label: "Pay Type",  w: 130 },
  { key: "rsn",    label: "Reason",    flex: true, minW: 120 },
];

function THead({ cols }) {
  return (
    <div style={{ display: "flex", minWidth: "max-content", background: T.canvas, borderBottom: `1px solid ${T.line}`, position: "sticky", top: 0, zIndex: 4 }}>
      {cols.map(c => (
        <div key={c.key} style={{
          width: c.w, flexShrink: 0, ...(c.flex ? { flex: 1, minWidth: c.minW } : {}),
          padding: "8px 14px", fontSize: 10, fontWeight: 700, color: T.ghost,
          letterSpacing: ".08em", textTransform: "uppercase", fontFamily: T.sans,
        }}>
          {c.label}
        </div>
      ))}
    </div>
  );
}

function Cell({ w, flex, minW, children }) {
  return (
    <div style={{
      width: w, flexShrink: 0, ...(flex ? { flex: 1, minWidth: minW } : {}),
      padding: "10px 14px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
    }}>
      {children}
    </div>
  );
}

// ─── Shared Ledger Row ────────────────────────────────────────────────────────
function LRow({ r, cols }) {
  const adv = r.eventType === "advance";
  const map = {
    emp: (
      <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
        <Av name={r.emp_name} size={28} />
        <div style={{ minWidth: 0 }}>
          <p style={{ margin: 0, fontSize: 12, fontWeight: 600, color: T.ink, fontFamily: T.sans, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.emp_name}</p>
          <p style={{ margin: 0, fontSize: 10, color: T.ghost, fontFamily: T.mono }}>{r.emp_id}</p>
        </div>
      </div>
    ),
    month: (
      <span style={{ fontSize: 12, fontWeight: 600, color: T.slate, fontFamily: T.sans }}>{r.month}</span>
    ),
    event: (
      <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 11, fontWeight: 600, color: adv ? T.blue : T.red, fontFamily: T.sans }}>
        {adv ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
        {adv ? "Advance Given" : "Deduction"}
      </span>
    ),
    amt: (
      <span style={{ fontSize: 13, fontWeight: 700, color: adv ? T.blueDk : T.redDk, fontFamily: T.mono, letterSpacing: "-.02em" }}>
        {adv ? "+" : "−"}{fmt(r.amount)}
      </span>
    ),
    req: (
      <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, color: T.slate, fontFamily: T.sans }}>
        <CalendarClock size={10} style={{ color: T.ghost, flexShrink: 0 }} />
        {r.request_date ? fmtD(r.request_date) : "—"}
      </span>
    ),
    appr: (
      <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, fontFamily: T.sans, color: r.reviewed_at ? T.green : T.ghost, fontWeight: r.reviewed_at ? 600 : 400 }}>
        <CalendarCheck size={10} style={{ color: r.reviewed_at ? T.green : T.ghost, flexShrink: 0 }} />
        {r.reviewed_at ? fmtD(r.reviewed_at) : "—"}
      </span>
    ),
    status: <Badge type={adv ? "advance" : (r.deduction_status ?? "upcoming")} />,
    ref: (
      <span style={{ fontSize: 11, color: T.blue, fontFamily: T.mono, display: "block", overflow: "hidden", textOverflow: "ellipsis" }}>{r.request_code}</span>
    ),
    ptype: (
      <span style={{ fontSize: 11, color: T.muted, fontFamily: T.sans }}>{r.payment_type_label ?? "—"}</span>
    ),
    rsn: (
      <span style={{ fontSize: 11, color: T.muted, fontFamily: T.sans, display: "block", overflow: "hidden", textOverflow: "ellipsis" }} title={r.reason}>
        {r.reason || "—"}
      </span>
    ),
  };
  return (
    <div className="ph-row" style={{ display: "flex", alignItems: "center", minWidth: "max-content", borderBottom: `1px solid ${T.lineLt}`, background: T.surface, transition: "background .1s" }}>
      {cols.map(c => <Cell key={c.key} w={c.w} flex={c.flex} minW={c.minW}>{map[c.key]}</Cell>)}
    </div>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────
function Skeleton() {
  return (
    <div style={{ padding: 20, display: "flex", flexDirection: "column", gap: 10 }}>
      {[...Array(5)].map((_, i) => (
        <div key={i} className="ph-shimmer" style={{ height: 50, animationDelay: `${i * 80}ms` }} />
      ))}
    </div>
  );
}

// ─── Month Group Toggle ───────────────────────────────────────────────────────
function MonthGroup({ month, rows }) {
  const [open, setOpen] = useState(true);
  const adv = rows.filter(r => r.eventType === "advance").reduce((s, r) => s + r.amount, 0);
  const ded = rows.filter(r => r.eventType === "deduction").reduce((s, r) => s + r.amount, 0);
  return (
    <div style={{ borderBottom: `1px solid ${T.line}` }}>
      {/* Header */}
      <button
        className="ph-grp"
        onClick={() => setOpen(o => !o)}
        style={{
          width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "11px 20px", background: T.canvas, border: "none",
          borderBottom: open ? `1px solid ${T.line}` : "none",
          cursor: "pointer", textAlign: "left", transition: "background .15s", fontFamily: T.sans,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          <div style={{
            width: 26, height: 26, borderRadius: T.r6,
            background: T.blueLt, display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <Calendar size={13} style={{ color: T.blue }} />
          </div>
          <span style={{ fontSize: 13, fontWeight: 700, color: T.ink, fontFamily: T.sans }}>{month}</span>
          <Tag label={`${rows.length} event${rows.length !== 1 ? "s" : ""}`} bg={T.blueLt} fg={T.blueDk} bd={T.blueBd} />
          {adv > 0 && <Tag label={`+${fmt(adv)} disbursed`} bg={T.amberLt} fg={T.amberDk} bd={T.amberBd} />}
          {ded > 0 && <Tag label={`−${fmt(ded)} deducted`}  bg={T.redLt}   fg={T.redDk}   bd={T.redBd}   />}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12, flexShrink: 0 }}>
          <span style={{ fontSize: 11, color: T.ghost, fontFamily: T.sans }}>
            Net&nbsp;<strong style={{ color: T.ink, fontFamily: T.mono }}>{fmt(adv - ded)}</strong>
          </span>
          <ChevronRight size={14} style={{ color: T.ghost, transition: "transform .2s", transform: open ? "rotate(90deg)" : "rotate(0deg)" }} />
        </div>
      </button>
      {/* Rows */}
      {open && (
        <div style={{ overflowX: "auto" }}>
          <THead cols={MONTH_COLS} />
          {rows.map((r, i) => <LRow key={i} r={r} cols={MONTH_COLS} />)}
        </div>
      )}
    </div>
  );
}

// ─── Employee Recovery Strip ──────────────────────────────────────────────────
function RecoveryStrip({ totalAdv, totalDed, remaining, pct, dedCount }) {
  const clr = pct >= 80 ? T.green : pct >= 40 ? T.amber : T.red;
  return (
    <div style={{ padding: "14px 18px", background: T.canvas, borderTop: `1px solid ${T.lineLt}` }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
        <span style={{ fontSize: 10, fontWeight: 700, color: T.ghost, fontFamily: T.sans, textTransform: "uppercase", letterSpacing: ".07em" }}>
          Recovery Progress
        </span>
        <span style={{ fontSize: 12, fontWeight: 700, color: clr, fontFamily: T.mono }}>{pct}%</span>
      </div>
      <div style={{ height: 5, borderRadius: 999, background: T.lineLt, overflow: "hidden", marginBottom: 12 }}>
        <div style={{ height: "100%", width: `${pct}%`, borderRadius: 999, background: clr, transition: "width .8s cubic-bezier(.4,0,.2,1)" }} />
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 8 }}>
        {[
          { lbl: "Advanced",  val: fmt(totalAdv),  fg: T.amberDk },
          { lbl: "Recovered", val: fmt(totalDed),  fg: T.greenDk },
          { lbl: "Due",       val: fmt(remaining), fg: remaining > 0 ? T.redDk : T.greenDk },
          { lbl: "EMIs done", val: `${dedCount}`,  fg: T.blueDk  },
        ].map(({ lbl, val, fg }) => (
          <div key={lbl} style={{ background: T.surface, borderRadius: T.r8, padding: "9px 10px", border: `1px solid ${T.line}`, textAlign: "center", boxShadow: T.shSm }}>
            <p style={{ margin: "0 0 2px", fontSize: 13, fontWeight: 700, color: fg, fontFamily: T.mono, letterSpacing: "-.03em" }}>{val}</p>
            <p style={{ margin: 0, fontSize: 9, color: T.ghost, fontFamily: T.sans, textTransform: "uppercase", letterSpacing: ".06em" }}>{lbl}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Employee Group Card ──────────────────────────────────────────────────────
function EmployeeGroup({ empId, empName, empDept, rows }) {
  const [open, setOpen] = useState(true);
  const aRows = rows.filter(r => r.eventType === "advance");
  const dRows = rows.filter(r => r.eventType === "deduction");
  const ta  = aRows.reduce((s, r) => s + r.amount, 0);
  const td  = dRows.reduce((s, r) => s + r.amount, 0);
  const rem = Math.max(0, ta - td);
  const pct = ta > 0 ? Math.min(100, Math.round((td / ta) * 100)) : 0;
  const sorted = [...rows].sort((a, b) => mKey(a.month).localeCompare(mKey(b.month)));

  const pctColor = pct >= 80 ? T.greenDk : pct >= 40 ? T.amberDk : T.redDk;
  const pctBg    = pct >= 80 ? T.greenLt : pct >= 40 ? T.amberLt : T.redLt;
  const pctBd    = pct >= 80 ? T.greenBd : pct >= 40 ? T.amberBd : T.redBd;

  return (
    <div style={{
      background: T.surface,
      border: `1px solid ${T.line}`,
      borderRadius: T.r12,
      overflow: "hidden",
      boxShadow: T.shSm,
    }}>
      {/* Employee Header */}
      <button
        className="ph-emph"
        onClick={() => setOpen(o => !o)}
        style={{
          width: "100%", display: "flex", alignItems: "center",
          justifyContent: "space-between",
          padding: "14px 18px",
          background: T.surface, border: "none",
          borderBottom: open ? `1px solid ${T.line}` : "none",
          cursor: "pointer", textAlign: "left",
          transition: "background .15s", fontFamily: T.sans, gap: 12,
        }}
      >
        {/* Left: avatar + info + pills */}
        <div style={{ display: "flex", alignItems: "flex-start", gap: 12, minWidth: 0 }}>
          <Av name={empName} size={38} />
          <div style={{ minWidth: 0 }}>
            {/* Name + ID row */}
            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 5 }}>
              <span style={{ fontSize: 14, fontWeight: 700, color: T.ink, fontFamily: T.sans }}>{empName}</span>
              <span style={{ fontSize: 11, color: T.ghost, fontFamily: T.mono }}>{empId}</span>
              <span style={{ fontSize: 10, color: T.muted, fontFamily: T.sans, padding: "1px 7px", borderRadius: 4, background: T.lineLt }}>
                {empDept}
              </span>
            </div>
            {/* Summary pills row */}
            {ta > 0 && (
              <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                <Tag label={`Adv ${fmt(ta)}`}   bg={T.amberLt} fg={T.amberDk} bd={T.amberBd} />
                <Tag label={`Rec ${fmt(td)}`}   bg={T.greenLt} fg={T.greenDk} bd={T.greenBd} />
                {rem > 0 && <Tag label={`Due ${fmt(rem)}`} bg={T.redLt} fg={T.redDk} bd={T.redBd} />}
                <Tag label={`${pct}% cleared`}  bg={pctBg}     fg={pctColor}  bd={pctBd}    />
              </div>
            )}
          </div>
        </div>
        {/* Right: event count + chevron */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
          <span style={{ fontSize: 12, color: T.ghost, fontFamily: T.sans }}>
            {rows.length} event{rows.length !== 1 ? "s" : ""}
          </span>
          <ChevronRight size={15} style={{ color: T.ghost, transition: "transform .2s", transform: open ? "rotate(90deg)" : "rotate(0deg)" }} />
        </div>
      </button>

      {/* Table */}
      {open && (
        <>
          <div style={{ overflowX: "auto" }}>
            <THead cols={EMP_COLS} />
            {sorted.map((r, i) => <LRow key={i} r={r} cols={EMP_COLS} />)}
          </div>
          {ta > 0 && (
            <RecoveryStrip totalAdv={ta} totalDed={td} remaining={rem} pct={pct} dedCount={dRows.length} />
          )}
        </>
      )}
    </div>
  );
}

// ─── Employee Divider ─────────────────────────────────────────────────────────
function EmpDivider({ index }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "4px 0" }}>
      <div style={{ flex: 1, height: 1, background: T.line }} />
      <span style={{
        fontSize: 10, fontWeight: 600, color: T.ghost, fontFamily: T.sans,
        textTransform: "uppercase", letterSpacing: ".08em",
        padding: "3px 10px", borderRadius: 999,
        background: T.lineLt, border: `1px solid ${T.line}`,
        whiteSpace: "nowrap",
      }}>
        Employee {index + 1}
      </span>
      <div style={{ flex: 1, height: 1, background: T.line }} />
    </div>
  );
}

// ─── Approved Request Row ─────────────────────────────────────────────────────
function ReqRow({ req }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ borderBottom: `1px solid ${T.lineLt}` }}>
      <button
        className="ph-row"
        onClick={() => setOpen(o => !o)}
        style={{
          width: "100%", display: "flex", alignItems: "center", gap: 12,
          padding: "12px 18px", background: "transparent", border: "none",
          cursor: "pointer", textAlign: "left", transition: "background .1s", fontFamily: T.sans,
        }}
      >
        <Av name={req.emp_name} size={34} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 2 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: T.ink, fontFamily: T.sans }}>{req.emp_name}</span>
            <span style={{ fontSize: 10, color: T.ghost, fontFamily: T.mono }}>{req.emp_id}</span>
            <span style={{ fontSize: 10, color: T.muted, padding: "1px 7px", borderRadius: 4, background: T.lineLt }}>{req.emp_dept}</span>
          </div>
          <span style={{ fontSize: 10, color: T.blue, fontFamily: T.mono }}>{req.request_code}</span>
        </div>
        <div style={{ textAlign: "right", flexShrink: 0, marginRight: 6 }}>
          <p style={{ margin: "0 0 4px", fontSize: 15, fontWeight: 700, color: T.blueDk, fontFamily: T.mono, letterSpacing: "-.03em" }}>{fmt(req.amount)}</p>
          <Badge type="advance" />
        </div>
        <ChevronRight size={13} style={{ color: T.ghost, flexShrink: 0, transition: "transform .2s", transform: open ? "rotate(90deg)" : "rotate(0deg)" }} />
      </button>
      {open && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 10, padding: "10px 18px 14px", background: T.canvas, borderTop: `1px solid ${T.lineLt}` }}>
          {[
            { icon: CalendarClock, label: "Requested on", val: fmtD(req.request_date) },
            { icon: CalendarCheck, label: "Approved on",  val: fmtD(req.reviewed_at)  },
            { icon: Calendar,      label: "Adjusted in",  val: req.adjusted_in || "—" },
            { icon: FileText,      label: "Reason",       val: req.reason || "—"      },
          ].map(({ icon: Ic, label, val }) => (
            <div key={label} style={{ background: T.surface, borderRadius: T.r8, padding: "9px 13px", border: `1px solid ${T.line}`, boxShadow: T.shSm }}>
              <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 3 }}>
                <Ic size={10} style={{ color: T.ghost }} />
                <span style={{ fontSize: 9, color: T.ghost, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".07em", fontFamily: T.sans }}>{label}</span>
              </div>
              <p style={{ margin: 0, fontSize: 12, fontWeight: 600, color: T.slate, fontFamily: T.sans, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={val}>{val}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────
export default function PaymentHistory() {
  const [view,    setView]    = useState("timeline");
  const [search,  setSearch]  = useState("");
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);
  const [hrows,   setHrows]   = useState([]);
  const [reqs,    setReqs]    = useState([]);

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const [h, r] = await Promise.all([
        advancePaymentService.getSalaryHistory(),
        advancePaymentService.listRequests({ status: "approved", limit: 1000 }),
      ]);
      setHrows(h.data ?? []);
      setReqs(r.data ?? []);
    } catch (e) {
      setError(e.message || "Connection error.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const reqMap = useMemo(() => {
    const m = {};
    reqs.forEach(r => { m[r.id] = r; });
    return m;
  }, [reqs]);

  const ledger = useMemo(() => {
    const out = [];
    hrows.forEach(row => {
      const p = reqMap[row.request_id] ?? {};
      out.push({
        eventType: "deduction",
        emp_id: row.emp_id, emp_name: row.emp_name, emp_dept: row.emp_dept,
        month: row.month_label, amount: Number(row.deduction_amount) || 0,
        deduction_status: row.deduction_status, request_code: row.request_code,
        reason: row.reason, payment_type_label: row.payment_type_label,
        request_date: p.request_date ?? null, reviewed_at: p.reviewed_at ?? null,
      });
    });
    reqs.forEach(r => {
      if (!r.adjusted_in) return;
      out.push({
        eventType: "advance",
        emp_id: r.emp_id, emp_name: r.emp_name, emp_dept: r.emp_dept,
        month: r.adjusted_in, amount: Number(r.amount) || 0,
        deduction_status: null, request_code: r.request_code, reason: r.reason,
        payment_type_label: r.payment_type_label ?? r.payment_type_short,
        request_date: r.request_date, reviewed_at: r.reviewed_at,
      });
    });
    return out;
  }, [hrows, reqs, reqMap]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return ledger;
    return ledger.filter(r =>
      r.emp_name?.toLowerCase().includes(q) ||
      r.emp_id?.toLowerCase().includes(q) ||
      r.emp_dept?.toLowerCase().includes(q) ||
      r.request_code?.toLowerCase().includes(q) ||
      r.reason?.toLowerCase().includes(q)
    );
  }, [ledger, search]);

  const tGroups = useMemo(() => {
    const m = {};
    filtered.forEach(r => { (m[r.month] = m[r.month] ?? []).push(r); });
    return sortM(Object.keys(m)).map(mo => ({ month: mo, rows: m[mo] }));
  }, [filtered]);

  const eGroups = useMemo(() => {
    const m = {};
    filtered.forEach(r => {
      if (!m[r.emp_id]) m[r.emp_id] = { empId: r.emp_id, empName: r.emp_name, empDept: r.emp_dept, rows: [] };
      m[r.emp_id].rows.push(r);
    });
    return Object.values(m).sort((a, b) => a.empName.localeCompare(b.empName));
  }, [filtered]);

  const totalAdv    = reqs.reduce((s, r) => s + (Number(r.amount) || 0), 0);
  const totalDed    = hrows.filter(r => r.deduction_status === "done").reduce((s, r) => s + (Number(r.deduction_amount) || 0), 0);
  const outstanding = Math.max(0, totalAdv - totalDed);
  const uniqueEmps  = new Set(reqs.map(r => r.emp_id)).size;
  const upcoming    = hrows.filter(r => r.deduction_status === "upcoming").length;
  const recPct      = totalAdv > 0 ? Math.min(100, Math.round((totalDed / totalAdv) * 100)) : 0;
  const now         = new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18, fontFamily: T.sans }}>
      <style>{CSS}</style>

      {/* ── Page Header ───────────────────────────────────────────────────── */}
      <div style={{
        background: "linear-gradient(135deg,#0F172A 0%,#1E293B 100%)",
        borderRadius: T.r16, padding: "20px 24px", boxShadow: T.shMd,
        display: "flex", alignItems: "center", justifyContent: "space-between", gap: 14, flexWrap: "wrap",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{
            width: 40, height: 40, borderRadius: T.r10,
            background: "linear-gradient(135deg,#3B82F6,#1D4ED8)",
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: "0 2px 10px rgba(37,99,235,.55)",
          }}>
            <Wallet size={18} style={{ color: "#fff" }} />
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: 17, fontWeight: 800, color: "#fff", fontFamily: T.sans, letterSpacing: "-.025em" }}>
              Salary Payment History
            </h1>
            <p style={{ margin: 0, fontSize: 11, color: "#64748B", fontFamily: T.sans, marginTop: 2 }}>
              Advance disbursal &amp; deduction recovery ledger · All employees
            </p>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 7, padding: "5px 11px", borderRadius: 999, background: "rgba(255,255,255,.06)", border: "1px solid rgba(255,255,255,.1)" }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#34D399", animation: "ph-pulse 2s ease-in-out infinite", display: "block" }} />
            <span style={{ fontSize: 11, color: "#94A3B8", fontFamily: T.sans }}>Live · {now}</span>
          </div>
          <button
            onClick={load}
            disabled={loading}
            style={{
              display: "flex", alignItems: "center", gap: 6,
              padding: "7px 14px", borderRadius: T.r8,
              background: "rgba(255,255,255,.08)", border: "1px solid rgba(255,255,255,.14)",
              color: "#CBD5E1", fontSize: 12, fontWeight: 600,
              cursor: loading ? "not-allowed" : "pointer",
              fontFamily: T.sans, transition: "all .15s", opacity: loading ? 0.5 : 1,
            }}
          >
            {loading
              ? <Loader2 size={13} style={{ animation: "ph-spin 1s linear infinite" }} />
              : <RefreshCw size={13} />
            }
            {loading ? "Loading…" : "Refresh"}
          </button>
        </div>
      </div>

      {/* ── Error Banner ──────────────────────────────────────────────────── */}
      {error && (
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "11px 15px", background: T.redLt, border: `1px solid ${T.redBd}`, borderRadius: T.r8, fontSize: 13, color: T.red, fontFamily: T.sans }}>
          <AlertCircle size={14} style={{ flexShrink: 0 }} />
          <span style={{ flex: 1 }}>{error}</span>
          <button onClick={load} style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, fontWeight: 700, background: "none", border: "none", cursor: "pointer", color: T.red, fontFamily: T.sans }}>
            <RefreshCw size={11} /> Retry
          </button>
        </div>
      )}

      {/* ── KPI Cards ─────────────────────────────────────────────────────── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(175px,1fr))", gap: 12 }}>
        <KpiCard idx={0} icon={Wallet}          label="Total Advanced"      value={fmtK(totalAdv)}    sub={`${uniqueEmps} employee${uniqueEmps !== 1 ? "s" : ""}`} accent={T.amber}  accentBg={T.amberLt}  loading={loading} />
        <KpiCard idx={1} icon={CheckCircle2}    label="Total Recovered"     value={fmtK(totalDed)}    sub="Deductions completed"                                     accent={T.green}  accentBg={T.greenLt}  loading={loading} />
        <KpiCard idx={2} icon={ArrowDownCircle} label="Outstanding Balance" value={fmtK(outstanding)} sub="Remaining to recover"                                     accent={T.red}    accentBg={T.redLt}    loading={loading} />
        <KpiCard idx={3} icon={Clock}           label="Upcoming Deductions" value={upcoming}           sub="Scheduled instalments"                                   accent={T.violet} accentBg={T.violetLt} loading={loading} />
      </div>

      {/* ── Recovery Meter ────────────────────────────────────────────────── */}
      {!loading && !error && totalAdv > 0 && (
        <RecoveryMeter advanced={totalAdv} recovered={totalDed} outstanding={outstanding} pct={recPct} />
      )}

      {/* ── Approved Requests ─────────────────────────────────────────────── */}
      {!loading && !error && reqs.length > 0 && (
        <div style={{ background: T.surface, borderRadius: T.r12, border: `1px solid ${T.line}`, overflow: "hidden", boxShadow: T.shSm }}>
          <div style={{ padding: "13px 18px", borderBottom: `1px solid ${T.line}`, display: "flex", alignItems: "center", justifyContent: "space-between", background: T.surface }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ width: 28, height: 28, borderRadius: T.r6, background: T.greenLt, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <CheckCircle2 size={13} style={{ color: T.green }} />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: 13, fontWeight: 700, color: T.ink, fontFamily: T.sans }}>Approved Advance Requests</h3>
                <p style={{ margin: "1px 0 0", fontSize: 11, color: T.ghost, fontFamily: T.sans }}>{reqs.length} approved · tap row to see request &amp; approval dates</p>
              </div>
            </div>
            <div style={{ padding: "4px 12px", borderRadius: T.r6, background: T.greenLt, border: `1px solid ${T.greenBd}`, fontSize: 13, fontWeight: 700, color: T.greenDk, fontFamily: T.mono, letterSpacing: "-.02em" }}>
              {fmt(totalAdv)}
            </div>
          </div>
          <div style={{ maxHeight: 260, overflowY: "auto" }}>
            {reqs.map(r => <ReqRow key={r.id} req={r} />)}
          </div>
        </div>
      )}

      {/* ── Main Ledger ───────────────────────────────────────────────────── */}
      <div style={{ background: T.surface, borderRadius: T.r12, border: `1px solid ${T.line}`, overflow: "hidden", boxShadow: T.shSm }}>

        {/* Toolbar */}
        <div style={{ padding: "10px 16px", borderBottom: `1px solid ${T.line}`, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap", background: T.canvas }}>
          {/* Tab Switcher */}
          <div style={{ display: "flex", background: T.surface, border: `1px solid ${T.line}`, borderRadius: T.r8, padding: 3, gap: 2, boxShadow: T.shSm }}>
            {[
              { key: "timeline", label: "By Month",    Icon: Calendar },
              { key: "employee", label: "By Employee", Icon: Users    },
            ].map(({ key, label, Icon }) => (
              <button
                key={key}
                className="ph-tab"
                onClick={() => setView(key)}
                style={{
                  display: "flex", alignItems: "center", gap: 6,
                  padding: "6px 14px", borderRadius: T.r6,
                  border: "none", fontSize: 12, fontWeight: 600,
                  cursor: "pointer", transition: "all .15s",
                  background: view === key ? T.blue : "transparent",
                  color: view === key ? "#fff" : T.muted,
                  boxShadow: view === key ? `0 1px 4px ${T.blue}44` : "none",
                  fontFamily: T.sans,
                }}
              >
                <Icon size={12} /> {label}
              </button>
            ))}
          </div>

          {/* Search */}
          <div style={{ position: "relative" }}>
            <Search size={13} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: T.ghost, pointerEvents: "none" }} />
            <input
              className="ph-input"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search name, ID, ref, reason…"
              style={{
                paddingLeft: 30, paddingRight: search ? 32 : 12, paddingTop: 7, paddingBottom: 7,
                fontSize: 12, border: `1px solid ${T.line}`, borderRadius: T.r8,
                background: T.surface, color: T.ink, width: 220, fontFamily: T.sans,
                transition: "border-color .15s, box-shadow .15s",
              }}
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                style={{ position: "absolute", right: 9, top: "50%", transform: "translateY(-50%)", fontSize: 12, color: T.ghost, background: "none", border: "none", cursor: "pointer", lineHeight: 1 }}
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Legend */}
        {!loading && !error && filtered.length > 0 && (
          <div style={{ padding: "6px 18px", borderBottom: `1px solid ${T.lineLt}`, display: "flex", alignItems: "center", gap: 18, background: T.surface }}>
            {[
              { Icon: CalendarClock, label: "= Date Requested", color: T.ghost },
              { Icon: CalendarCheck, label: "= Date Approved",  color: T.green },
            ].map(({ Icon, label, color }) => (
              <span key={label} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 10, color: T.ghost, fontFamily: T.sans }}>
                <Icon size={10} style={{ color }} /> {label}
              </span>
            ))}
          </div>
        )}

        {/* Body */}
        {loading ? (
          <Skeleton />
        ) : error ? (
          <div style={{ padding: "50px 20px", textAlign: "center" }}>
            <div style={{ width: 48, height: 48, borderRadius: T.r12, background: T.redLt, border: `1px solid ${T.redBd}`, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px" }}>
              <AlertCircle size={20} style={{ color: T.red }} />
            </div>
            <p style={{ margin: "0 0 4px", fontSize: 14, fontWeight: 700, color: T.slate, fontFamily: T.sans }}>Failed to load data</p>
            <p style={{ margin: "0 0 16px", fontSize: 12, color: T.ghost, fontFamily: T.sans }}>{error}</p>
            <button onClick={load} style={{ padding: "8px 20px", borderRadius: T.r8, background: T.blue, color: "#fff", fontSize: 13, fontWeight: 600, border: "none", cursor: "pointer", fontFamily: T.sans }}>
              Try Again
            </button>
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: "56px 20px", textAlign: "center" }}>
            <div style={{ width: 48, height: 48, borderRadius: T.r12, background: T.canvas, border: `1px solid ${T.line}`, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px" }}>
              <FileText size={20} style={{ color: T.ghost }} />
            </div>
            <p style={{ margin: "0 0 4px", fontSize: 14, fontWeight: 700, color: T.slate, fontFamily: T.sans }}>No records found</p>
            <p style={{ margin: 0, fontSize: 12, color: T.ghost, fontFamily: T.sans }}>
              {search ? `No results for "${search}" — try a different term` : "No salary history recorded yet"}
            </p>
          </div>
        ) : view === "timeline" ? (
          tGroups.map(({ month, rows }) => (
            <MonthGroup key={month} month={month} rows={rows} />
          ))
        ) : (
          /* ── By Employee View ── */
          <div style={{ padding: "14px 16px", display: "flex", flexDirection: "column", gap: 0, background: T.canvas }}>
            {eGroups.map((g, idx) => (
              <div key={g.empId}>
                {/* Numbered divider between employees */}
                {idx > 0 && <EmpDivider index={idx} />}
                <div style={{ paddingBottom: idx < eGroups.length - 1 ? 10 : 0 }}>
                  <EmployeeGroup
                    empId={g.empId}
                    empName={g.empName}
                    empDept={g.empDept}
                    rows={g.rows}
                  />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Footer */}
        {!loading && !error && filtered.length > 0 && (
          <div style={{ padding: "9px 18px", borderTop: `1px solid ${T.line}`, display: "flex", alignItems: "center", justifyContent: "space-between", background: T.canvas }}>
            <span style={{ fontSize: 11, color: T.ghost, fontFamily: T.sans }}>
              Showing <strong style={{ color: T.slate }}>{filtered.length}</strong> event{filtered.length !== 1 ? "s" : ""}
              {search && <span style={{ color: T.ghost }}> for <em>"{search}"</em></span>}
            </span>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#34D399", display: "block", animation: "ph-pulse 2s ease-in-out infinite" }} />
              <span style={{ fontSize: 11, color: T.ghost, fontFamily: T.sans }}>Live · refreshed {now}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}