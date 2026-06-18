import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import {
  Wallet,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Loader2,
  Search,
  X,
  ChevronDown,
  Calendar,
  Users,
  Activity,
  FileText,
  ArrowUpRight,
  ArrowDownRight,
  ShieldCheck,
  Timer,
  CircleDollarSign,
  TrendingUp,
  Building2,
  Hash,
  CreditCard,
  Clock,
  BadgeCheck,
  Ban,
  BarChart3,
  Info,
  ChevronRight,
  Download,
  Filter,
  SlidersHorizontal,
  Receipt,
  Briefcase,
  UserCheck,
  AlertTriangle,
} from "lucide-react";
import advancePaymentService from "../../services/advancePaymentService";

if (typeof document !== "undefined" && !document.getElementById("ph-fonts")) {
  const l = document.createElement("link");
  l.id = "ph-fonts";
  l.rel = "stylesheet";
  l.href =
    "https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:ital,wght@0,400;0,500;0,600;1,400&family=IBM+Plex+Mono:wght@400;500&display=swap";
  document.head.appendChild(l);
}

const T = {
  font: "'IBM Plex Sans',system-ui,sans-serif",
  mono: "'IBM Plex Mono',monospace",
  n0: "#FFFFFF",
  n50: "#F7F7F6",
  n100: "#EEEEEC",
  n150: "#E3E3E0",
  n200: "#CECEC9",
  n300: "#ADADAA",
  n400: "#888885",
  n500: "#65635F",
  n600: "#4A4845",
  n700: "#323130",
  n800: "#1E1D1C",
  n900: "#111110",
  t100: "#D0EDEE",
  t200: "#A2DADC",
  t400: "#3AABB0",
  t500: "#1E8F94",
  t600: "#14717A",
  t700: "#0C5560",
  g50: "#EEF8F2",
  g100: "#CEEEDD",
  g300: "#5FCA8D",
  g500: "#16A34A",
  g600: "#0F7A36",
  g700: "#0A5827",
  r50: "#FFF0F1",
  r100: "#FFE0E2",
  r300: "#F9A0A9",
  r500: "#E8384F",
  r600: "#BE2238",
  r700: "#95132B",
  a50: "#FFF8EC",
  a100: "#FDECC4",
  a500: "#E08A00",
  a600: "#B86D00",
  a700: "#8F5300",
  v100: "#E6E1FF",
  v500: "#7B61FF",
  v600: "#5A44D4",
  v700: "#4330B0",
  b1: "#2563EB",
  b2: "#1D4ED8",
  b3: "#1E40AF",
  p100: "#EDE9FE",
  p500: "#8B5CF6",
  p700: "#5B21B6",
};

const CSS = `
  @keyframes spin    { to{transform:rotate(360deg)} }
  @keyframes pulse   { 0%,100%{opacity:1} 50%{opacity:.25} }
  @keyframes fadeup  { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
  @keyframes shim    { 0%{background-position:-600px 0} 100%{background-position:600px 0} }
  @keyframes grow    { from{width:0} to{width:var(--w)} }
  @keyframes countup { from{opacity:0;transform:translateY(4px)} to{opacity:1;transform:translateY(0)} }

  .ph-root *{box-sizing:border-box;margin:0;padding:0}
  .ph-root{font-family:'IBM Plex Sans',system-ui,sans-serif;color:#323130;-webkit-font-smoothing:antialiased}

  .ph-overlay{
    position:fixed;top:0;left:0;right:0;bottom:0;z-index:9999;
    background:rgba(6,6,14,.65);
    backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px);
    display:flex;align-items:center;justify-content:center;
    padding:20px 28px;
    animation:fadeup .18s ease both;
  }

  .ph-card{
    position:relative;width:100%;max-width:1040px;
    height:calc(100vh - 40px);max-height:960px;
    background:#fff;border-radius:18px;
    display:flex;flex-direction:column;overflow:hidden;
    box-shadow:0 48px 120px rgba(0,0,0,.36),0 10px 32px rgba(0,0,0,.2);
    animation:fadeup .26s cubic-bezier(.16,1,.3,1) both;
  }

  .ph-hdr{flex-shrink:0;background:linear-gradient(135deg,#1D4ED8 0%,#2563EB 55%,#1E8F94 100%);padding:22px 26px 20px;}

  .ph-body{
    flex:1 1 0%;min-height:0;overflow-y:auto;overflow-x:hidden;
    background:#F2F2F0;padding:16px;
    display:flex;flex-direction:column;gap:10px;
  }
  .ph-body::-webkit-scrollbar{width:6px}
  .ph-body::-webkit-scrollbar-track{background:transparent}
  .ph-body::-webkit-scrollbar-thumb{background:#CECEC9;border-radius:99px}
  .ph-body::-webkit-scrollbar-thumb:hover{background:#ADADAA}

  .ph-footer{flex-shrink:0;padding:11px 22px;border-top:1px solid #E3E3E0;background:#fff;display:flex;align-items:center;justify-content:space-between;gap:12px;}

  .ph-stat{background:rgba(255,255,255,.14);border:1px solid rgba(255,255,255,.22);border-radius:11px;padding:10px 16px;min-width:120px;}
  .ph-stat:hover{background:rgba(255,255,255,.2);}

  .ph-shim{background:linear-gradient(90deg,#EEEEEC 25%,#E3E3E0 50%,#EEEEEC 75%);background-size:600px 100%;animation:shim 1.5s infinite linear;border-radius:4px;}

  .ph-up{animation:fadeup .2s cubic-bezier(.16,1,.3,1) both}
  .ph-btn{font-family:'IBM Plex Sans',system-ui,sans-serif;cursor:pointer;transition:opacity .12s,transform .1s;border:none;background:none;}
  .ph-btn:hover:not(:disabled){opacity:.72}
  .ph-btn:active:not(:disabled){transform:scale(.97)}
  .ph-btn:disabled{opacity:.35;cursor:not-allowed}

  .ph-kpi{transition:box-shadow .15s,transform .12s;cursor:default}
  .ph-kpi:hover{box-shadow:0 3px 12px rgba(0,0,0,.1)!important;transform:translateY(-1px)}

  .ph-row{transition:background .1s}
  .ph-row:hover{background:#F7F7F6!important}
  .ph-tab:hover:not(.on){background:#EEEEEC!important}
  .ph-chev{transition:transform .2s cubic-bezier(.4,0,.2,1)}
  .ph-chev.open{transform:rotate(180deg)}
  .ph-pbar{--w:0%;animation:grow .9s cubic-bezier(.4,0,.2,1) both;width:var(--w)}
  .ph-inp:focus{outline:none;border-color:#2563EB!important;box-shadow:0 0 0 2.5px rgba(37,99,235,.15);}
  .ph-sc::-webkit-scrollbar{width:4px}
  .ph-sc::-webkit-scrollbar-thumb{background:#CECEC9;border-radius:99px}
  .ph-sc::-webkit-scrollbar-thumb:hover{background:#ADADAA}

  .ph-tag{display:inline-flex;align-items:center;gap:3px;padding:3px 8px;border-radius:4px;font-size:10px;font-weight:600;letter-spacing:.05em;text-transform:uppercase;white-space:nowrap}
  .ph-divider{height:1px;background:#EEEEEC}
  .ph-section-hdr{display:flex;align-items:center;gap:7px;padding:9px 14px;background:#F7F7F6;border-bottom:1px solid #EEEEEC;}

  .ph-detail-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:0;}
  .ph-detail-cell{padding:9px 13px;border-right:1px solid #EEEEEC;}
  .ph-detail-cell:last-child{border-right:none}

  .ph-timeline{position:relative;padding:12px 14px 12px 38px}
  .ph-timeline::before{content:'';position:absolute;left:22px;top:0;bottom:0;width:1.5px;background:#EEEEEC}
  .ph-tl-dot{position:absolute;left:16px;width:13px;height:13px;border-radius:50%;border:2px solid #fff;display:flex;align-items:center;justify-content:center}

  .ph-badge-count{display:inline-flex;align-items:center;justify-content:center;min-width:20px;height:20px;padding:0 6px;border-radius:10px;font-size:10px;font-weight:700;line-height:1}

  /* ════════════════════════════════════════════════════════════════════
     RESPONSIVE LAYOUT — desktop defaults below, overridden at
     tablet (≤1023px) and mobile (≤640px) breakpoints further down.
     ════════════════════════════════════════════════════════════════════ */

  /* header */
  .ph-hdr-top{display:flex;align-items:center;justify-content:space-between;gap:10px}
  .ph-hdr-left{display:flex;align-items:center;gap:13px;min-width:0}
  .ph-hdr-icon{width:46px;height:46px;border-radius:12px;background:rgba(255,255,255,.18);border:1px solid rgba(255,255,255,.3);display:flex;align-items:center;justify-content:center;flex-shrink:0}
  .ph-hdr-textwrap{min-width:0}
  .ph-hdr-title{font-size:20px;font-weight:700;color:#fff;letter-spacing:-.03em;line-height:1.15;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
  .ph-hdr-sub{font-size:12px;color:rgba(255,255,255,.58);margin-top:5px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
  .ph-hdr-actions{display:flex;align-items:center;gap:8px;flex-shrink:0}
  .ph-hdr-btn{width:38px;height:38px;border-radius:9px;background:rgba(255,255,255,.12);border:1px solid rgba(255,255,255,.2);color:#fff;display:flex;align-items:center;justify-content:center;flex-shrink:0}

  /* kpi grid */
  .ph-kpi-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;flex-shrink:0}
  .ph-kpi-card{padding:14px 16px}
  .ph-kpi-icon-box{position:absolute;right:11px;top:11px;width:34px;height:34px;border-radius:8px}
  .ph-kpi-label{font-size:10px}
  .ph-kpi-value{font-size:24px}
  .ph-kpi-sub{font-size:10px}

  /* recovery tracker */
  .ph-tracker-hdr{display:flex;align-items:center;gap:8px;padding:11px 14px;border-bottom:1px solid #EEEEEC;flex-wrap:wrap}
  .ph-tracker-bar-wrap{flex:1 1 120px;margin-left:4px;min-width:80px}
  .ph-tracker-grid{display:grid;grid-template-columns:repeat(4,1fr)}

  /* dept breakdown */
  .ph-card-hdr{display:flex;align-items:center;gap:7px;padding:11px 14px;border-bottom:1px solid #E3E3E0}
  .ph-dept-list{padding:9px 14px;display:flex;flex-direction:column;gap:7px}
  .ph-dept-row{display:grid;grid-template-columns:140px 1fr auto;gap:10px;align-items:center}
  .ph-dept-name-col{min-width:0}
  .ph-dept-amt-col{min-width:64px}

  /* approved requests */
  .ph-req-section-hdr{display:flex;align-items:center;justify-content:space-between;padding:11px 14px;border-bottom:1px solid #E3E3E0;flex-wrap:wrap;gap:8px}
  .ph-req-hdr-row{padding:11px 14px}
  .ph-req-detail-grid{display:grid;grid-template-columns:repeat(3,1fr)}
  .ph-req-info-grid{display:grid;grid-template-columns:1fr 1fr;gap:8px;padding:11px 14px}

  /* ledger toolbar */
  .ph-toolbar{display:flex;align-items:center;justify-content:space-between;gap:8px;padding:10px 12px;background:#F7F7F6;border-bottom:1px solid #E3E3E0;flex-wrap:wrap}
  .ph-view-tabs{display:flex;background:#fff;border:1px solid #CECEC9;border-radius:7px;padding:2px;gap:1px}
  .ph-filter-tabs{display:flex;background:#fff;border:1px solid #CECEC9;border-radius:7px;padding:2px;gap:1px}
  .ph-search-wrap{position:relative;flex:1 1 180px;max-width:260px}
  .ph-toolbar-count{font-size:10px;color:#888885;white-space:nowrap}
  .ph-emp-list{padding:10px}

  /* month section */
  .ph-month-hdr{padding:10px 14px}
  .ph-month-icon{width:28px;height:28px}
  .ph-month-label{font-size:14px}

  /* employee card */
  .ph-emp-hdr{padding:13px 14px}
  .ph-emp-summary-grid{display:grid;grid-template-columns:repeat(5,1fr);background:#F7F7F6;border-bottom:1px solid #E3E3E0}

  /* event row */
  .ph-ev-row{grid-template-columns:auto 1fr auto;gap:10px;padding:12px 14px}
  .ph-ev-name{font-size:13px;max-width:140px}
  .ph-ev-type{font-size:11px}
  .ph-ev-amount{font-size:16px}
  .ph-ev-trail{gap:8px}
  .ph-ev-timeline-grid{display:grid;grid-template-columns:repeat(4,1fr);border-bottom:1px solid #EEEEEC}
  .ph-ev-info-grid{display:grid;grid-template-columns:1fr 1fr;border-bottom:1px solid #EEEEEC}

  /* footer */
  .ph-footer-left{display:flex;align-items:center;gap:10px;min-width:0;overflow:hidden}
  .ph-footer-divider{width:1px;height:14px;background:#E3E3E0;display:block;flex-shrink:0}
  .ph-close-btn{padding:7px 24px}

  /* generic helper hidden only on very small phones */
  .ph-hide-xs{display:inline-flex}

  /* ───────────────────────── TABLET (≤1023px) ───────────────────────── */
  @media (max-width:1023px){
    .ph-overlay{padding:12px}
    .ph-kpi-grid{grid-template-columns:repeat(2,1fr)}
    .ph-tracker-grid{grid-template-columns:repeat(2,1fr)}
    .ph-tracker-grid > div:nth-child(2n){border-right:none!important}
    .ph-tracker-grid > div:nth-child(-n+2){border-bottom:1px solid #EEEEEC}
    .ph-ev-timeline-grid{grid-template-columns:repeat(2,1fr)}
    .ph-ev-timeline-grid > div:nth-child(2n){border-right:none!important}
    .ph-ev-timeline-grid > div:nth-child(-n+2){border-bottom:1px solid #EEEEEC}
    .ph-emp-summary-grid{grid-template-columns:repeat(3,1fr)}
    .ph-emp-summary-grid > div:nth-child(3){border-right:none!important}
    .ph-emp-summary-grid > div:nth-child(-n+3){border-bottom:1px solid #E3E3E0}
    .ph-dept-row{grid-template-columns:110px 1fr auto}
    .ph-search-wrap{max-width:220px}
  }

  /* ───────────────────────── MOBILE (≤640px) ───────────────────────── */
  @media (max-width:640px){
    .ph-overlay{padding:0}
    .ph-card{border-radius:0;height:100vh;max-height:none;max-width:100%}
    .ph-hdr{padding:14px 14px 12px}
    .ph-hdr-left{gap:9px}
    .ph-hdr-icon{width:36px;height:36px;border-radius:9px}
    .ph-hdr-title{font-size:15px}
    .ph-hdr-sub{font-size:10px;margin-top:3px}
    .ph-hdr-btn{width:30px;height:30px;border-radius:7px}

    .ph-body{padding:8px;gap:8px}

    .ph-kpi-grid{grid-template-columns:repeat(2,1fr);gap:6px}
    .ph-kpi-card{padding:10px 11px}
    .ph-kpi-icon-box{width:26px;height:26px;right:8px;top:8px;border-radius:7px}
    .ph-kpi-label{font-size:8.5px}
    .ph-kpi-value{font-size:18px}
    .ph-kpi-sub{font-size:9px}

    .ph-tracker-hdr{padding:9px 11px}
    .ph-tracker-bar-wrap{flex-basis:100%;order:3;margin-left:0;margin-top:4px}
    .ph-tracker-grid{grid-template-columns:repeat(2,1fr)}
    .ph-tracker-grid > div{padding:9px 11px!important}
    .ph-tracker-grid > div p:first-child{font-size:8.5px!important}
    .ph-tracker-grid > div p:nth-child(2){font-size:14px!important}

    .ph-card-hdr{padding:9px 11px}
    .ph-dept-list{padding:8px 11px;gap:9px}
    .ph-dept-row{grid-template-columns:78px 1fr 52px;gap:7px}
    .ph-dept-name-col p:first-child{font-size:10px!important}

    .ph-req-section-hdr{padding:9px 11px}
    .ph-req-hdr-row{padding:9px 11px;gap:7px!important}
    .ph-req-detail-grid{grid-template-columns:1fr 1fr}
    .ph-req-detail-grid > div:nth-child(2n){border-right:none!important}
    .ph-req-detail-grid > div:nth-child(-n+2){border-bottom:1px solid #EEEEEC}
    .ph-req-info-grid{grid-template-columns:1fr;padding:9px 11px;gap:12px}

    .ph-toolbar{padding:8px}
    .ph-view-tabs,.ph-filter-tabs{width:100%}
    .ph-search-wrap{flex-basis:100%;max-width:none;order:3}
    .ph-toolbar-count{order:4;flex-basis:100%}
    .ph-emp-list{padding:7px}

    .ph-month-hdr{padding:8px 11px}
    .ph-month-icon{width:24px;height:24px}
    .ph-month-label{font-size:12.5px}

    .ph-emp-hdr{padding:10px 11px;gap:8px!important}
    .ph-emp-summary-grid{grid-template-columns:repeat(2,1fr)}
    .ph-emp-summary-grid > div:nth-child(2n){border-right:none!important}
    .ph-emp-summary-grid > div:nth-child(-n+4){border-bottom:1px solid #E3E3E0}
    .ph-emp-summary-grid > div:last-child{border-right:none!important}

    .ph-ev-row{padding:9px 11px;gap:7px}
    .ph-ev-name{font-size:12px;max-width:96px}
    .ph-ev-type-text{display:none}
    .ph-ev-amount{font-size:13.5px}
    .ph-ev-trail{gap:5px}
    .ph-ev-timeline-grid{grid-template-columns:1fr 1fr}
    .ph-ev-timeline-grid > div{padding:9px 11px!important}
    .ph-ev-info-grid{grid-template-columns:1fr}
    .ph-ev-info-grid > div{border-right:none!important;border-bottom:1px solid #EEEEEC;padding:9px 11px!important}
    .ph-ev-info-grid > div:last-child{border-bottom:none}

    .ph-footer{padding:9px 11px;flex-wrap:wrap;gap:8px}
    .ph-footer-left{flex-basis:100%;order:2}
    .ph-close-btn{flex:1;padding:9px 0;text-align:center}

    .ph-hide-xs{display:none!important}
  }

  /* ─────────────────────── EXTRA SMALL (≤380px) ─────────────────────── */
  @media (max-width:380px){
    .ph-kpi-grid{grid-template-columns:1fr 1fr;gap:5px}
    .ph-dept-row{grid-template-columns:64px 1fr 46px}
    .ph-ev-name{max-width:76px}
  }
`;

// helpers
const inr = (n) => `₹${Math.round(Number(n) || 0).toLocaleString("en-IN")}`;
const inrK = (n) => {
  const v = Math.round(Number(n) || 0);
  return v >= 10000000
    ? `₹${(v / 10000000).toFixed(2)}Cr`
    : v >= 100000
      ? `₹${(v / 100000).toFixed(2)}L`
      : v >= 1000
        ? `₹${(v / 1000).toFixed(1)}K`
        : inr(v);
};
const fmtD = (r) => {
  if (!r) return "—";
  const d = new Date(r);
  return isNaN(d)
    ? String(r).slice(0, 10)
    : d.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
};
const fmtDT = (r) => {
  if (!r) return "—";
  const d = new Date(r);
  return isNaN(d)
    ? String(r).slice(0, 16)
    : d.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }) +
        " " +
        d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
};
const fmtS = (r) => {
  if (!r) return "—";
  const d = new Date(r);
  return isNaN(d)
    ? String(r).slice(0, 10)
    : d.toLocaleDateString("en-IN", { day: "2-digit", month: "short" });
};
const ini = (s) =>
  (s || "?")
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0] || "")
    .join("")
    .toUpperCase();
const MMAP = {
  jan: "01",
  feb: "02",
  mar: "03",
  apr: "04",
  may: "05",
  jun: "06",
  jul: "07",
  aug: "08",
  sep: "09",
  oct: "10",
  nov: "11",
  dec: "12",
};
const mKey = (l) => {
  if (/^\d{4}-\d{2}$/.test(l)) return l;
  const [m = "", y = ""] = l.trim().split(/\s+/);
  const k = MMAP[m.slice(0, 3).toLowerCase()];
  return k ? `${y}-${k}` : l;
};
const sortM = (arr) =>
  [...new Set(arr)].sort((a, b) => mKey(a).localeCompare(mKey(b)));
const daysDiff = (d) => {
  if (!d) return null;
  const diff = Math.round((Date.now() - new Date(d)) / (1000 * 86400));
  return diff;
};

const AVP = [
  { bg: "#DBEAFE", fg: "#1E40AF" },
  { bg: "#D1FAE5", fg: "#065F46" },
  { bg: "#FEF3C7", fg: "#92400E" },
  { bg: "#EDE9FE", fg: "#5B21B6" },
  { bg: "#FCE7F3", fg: "#9D174D" },
  { bg: "#CCFBF1", fg: "#0F766E" },
  { bg: "#FFF7ED", fg: "#9A3412" },
  { bg: "#F0FDF4", fg: "#14532D" },
];

function Av({ name, size = 28 }) {
  const { bg, fg } = AVP[(name || "?").charCodeAt(0) % AVP.length];
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        background: bg,
        color: fg,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: size * 0.34,
        fontWeight: 600,
        flexShrink: 0,
        letterSpacing: "-.01em",
        userSelect: "none",
        border: `1.5px solid ${fg}22`,
      }}
    >
      {ini(name)}
    </div>
  );
}

const STATUS = {
  advance: {
    bg: "#D0EDEE",
    fg: "#0C5560",
    border: "#A2DADC",
    label: "Disbursed",
    dot: "#3AABB0",
  },
  done: {
    bg: "#CEEEDD",
    fg: "#0A5827",
    border: "#5FCA8D",
    label: "Recovered",
    dot: "#16A34A",
  },
  upcoming: {
    bg: "#E6E1FF",
    fg: "#4330B0",
    border: "#C4B5FD",
    label: "Upcoming",
    dot: "#7B61FF",
  },
  skipped: {
    bg: "#EEEEEC",
    fg: "#65635F",
    border: "#CECEC9",
    label: "Skipped",
    dot: "#888885",
  },
  partial: {
    bg: "#FFF8EC",
    fg: "#8F5300",
    border: "#FDECC4",
    label: "Partial",
    dot: "#E08A00",
  },
  pending: {
    bg: "#FFF7ED",
    fg: "#9A3412",
    border: "#FED7AA",
    label: "Pending",
    dot: "#F97316",
  },
};
function Chip({ type, size = "sm" }) {
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

function MiniBar({ pct, showPct = true, height = 4 }) {
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
            transition: "width .8s ease",
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

function KpiCard({
  label,
  value,
  sub,
  icon: Icon,
  color,
  loading,
  trend,
  trendLabel,
}) {
  return (
    <div
      className="ph-kpi ph-kpi-card"
      style={{
        background: "#fff",
        borderRadius: 10,
        border: "1px solid #E3E3E0",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <div
        className="ph-kpi-icon-box"
        style={{
          position: "absolute",
          background: `${color}18`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Icon size={15} style={{ color }} />
      </div>
      <p
        className="ph-kpi-label"
        style={{
          fontWeight: 600,
          color: "#888885",
          textTransform: "uppercase",
          letterSpacing: ".08em",
          marginBottom: 8,
        }}
      >
        {label}
      </p>
      {loading ? (
        <>
          <div
            className="ph-shim"
            style={{ height: 26, width: "60%", marginBottom: 5 }}
          />
          <div className="ph-shim" style={{ height: 10, width: "42%" }} />
        </>
      ) : (
        <>
          <p
            className="ph-kpi-value"
            style={{
              fontWeight: 600,
              color: "#111110",
              fontFamily: "'IBM Plex Mono',monospace",
              letterSpacing: "-.04em",
              lineHeight: 1,
              marginBottom: 5,
            }}
          >
            {value}
          </p>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              flexWrap: "wrap",
            }}
          >
            {sub && (
              <p className="ph-kpi-sub" style={{ color: "#888885" }}>
                {sub}
              </p>
            )}
            {trend !== undefined && (
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 600,
                  color: trend >= 0 ? T.g600 : T.r600,
                  display: "flex",
                  alignItems: "center",
                  gap: 2,
                }}
              >
                {trend >= 0 ? (
                  <ArrowUpRight size={10} />
                ) : (
                  <ArrowDownRight size={10} />
                )}
                {trendLabel}
              </span>
            )}
          </div>
        </>
      )}
    </div>
  );
}

function InfoRow({ label, value, mono = false, color }) {
  return (
    <div
      className="ph-info-row"
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        gap: 8,
        padding: "6px 0",
        borderBottom: "1px solid #F4F4F2",
      }}
    >
      <span style={{ fontSize: 11, color: "#888885", flexShrink: 0 }}>
        {label}
      </span>
      <span
        className="ph-info-row-value"
        style={{
          fontSize: 12,
          fontWeight: 500,
          color: color || "#323130",
          fontFamily: mono ? "'IBM Plex Mono',monospace" : undefined,
          textAlign: "right",
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
          maxWidth: 170,
        }}
      >
        {value || "—"}
      </span>
    </div>
  );
}

function EvCard({ r, expanded = false }) {
  const [open, setOpen] = useState(expanded);
  const isAdv = r.eventType === "advance";
  const statusType = isAdv ? "advance" : (r.deduction_status ?? "upcoming");
  const age = r.request_date ? daysDiff(r.request_date) : null;

  return (
    <div style={{ borderBottom: "1px solid #EEEEEC" }}>
      {/* main row */}
      <div
        className="ph-row ph-ev-row"
        style={{
          display: "grid",
          alignItems: "center",
          background: "#fff",
          cursor: "pointer",
        }}
        onClick={() => setOpen((o) => !o)}
      >
        <div className="ph-ev-id" style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <Av name={r.emp_name} size={32} />
          <div>
            <p
              className="ph-ev-name"
              style={{
                fontWeight: 600,
                color: "#111110",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {r.emp_name}
            </p>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 5,
                marginTop: 2,
              }}
            >
              <span
                style={{
                  fontSize: 10,
                  color: "#888885",
                  fontFamily: "'IBM Plex Mono',monospace",
                }}
              >
                {r.emp_id}
              </span>
              {r.emp_dept && (
                <span
                  className="ph-hide-xs"
                  style={{
                    fontSize: 10,
                    color: "#65635F",
                    padding: "1px 6px",
                    borderRadius: 3,
                    background: "#EEEEEC",
                    fontWeight: 500,
                  }}
                >
                  {r.emp_dept}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="ph-ev-mid" style={{ minWidth: 0 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 5,
              marginBottom: 5,
              flexWrap: "wrap",
            }}
          >
            <span
              className="ph-ev-type"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 3,
                fontWeight: 600,
                color: isAdv ? T.t600 : T.r600,
              }}
            >
              {isAdv ? (
                <ArrowUpRight size={11} />
              ) : (
                <ArrowDownRight size={11} />
              )}
              <span className="ph-ev-type-text">
                {isAdv ? "Advance Disbursed" : "Salary Deduction"}
              </span>
            </span>
            <Chip type={statusType} />
            {r.payment_type_label && (
              <span
                className="ph-tag ph-hide-xs"
                style={{
                  background: "#F0F4FF",
                  color: "#3730A3",
                  border: "1px solid #C7D2FE",
                  fontSize: 9,
                }}
              >
                {r.payment_type_label}
              </span>
            )}
          </div>
          <div
            className="ph-hide-xs"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              flexWrap: "wrap",
            }}
          >
            {r.request_code && (
              <span
                style={{
                  fontSize: 10,
                  color: T.t600,
                  fontFamily: "'IBM Plex Mono',monospace",
                  background: T.t100,
                  padding: "2px 6px",
                  borderRadius: 3,
                }}
              >
                {r.request_code}
              </span>
            )}
            {r.reason && (
              <span
                style={{
                  fontSize: 10,
                  color: "#65635F",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                  maxWidth: 170,
                }}
                title={r.reason}
              >
                {r.reason}
              </span>
            )}
          </div>
        </div>

        <div className="ph-ev-trail" style={{ display: "flex", alignItems: "center" }}>
          <div style={{ textAlign: "right", flexShrink: 0 }}>
            <p
              className="ph-ev-amount"
              style={{
                fontWeight: 700,
                fontFamily: "'IBM Plex Mono',monospace",
                color: isAdv ? T.t700 : T.r700,
                letterSpacing: "-.03em",
              }}
            >
              {isAdv ? "+" : "−"}
              {inr(r.amount)}
            </p>
            <p style={{ fontSize: 10, color: "#ADADAA", marginTop: 2 }}>
              {r.month}
            </p>
          </div>

          <ChevronDown
            size={13}
            className={`ph-chev${open ? " open" : ""}`}
            style={{ color: "#ADADAA", flexShrink: 0 }}
          />
        </div>
      </div>

      {/* expanded detail */}
      {open && (
        <div
          className="ph-up"
          style={{ background: "#FAFAF9", borderTop: "1px solid #EEEEEC" }}
        >
          {/* timeline row */}
          <div className="ph-ev-timeline-grid">
            {[
              {
                label: "Request Date",
                value: fmtD(r.request_date),
                icon: Calendar,
                color: T.b1,
              },
              {
                label: "Reviewed On",
                value: fmtD(r.reviewed_at),
                icon: BadgeCheck,
                color: T.g500,
              },
              {
                label: "Adjusted In",
                value: r.adjusted_in || "—",
                icon: CreditCard,
                color: T.a500,
              },
              {
                label: "Days Ago",
                value: age !== null ? `${age}d ago` : "—",
                icon: Clock,
                color: T.v500,
              },
            ].map(({ label, value, icon: Icon, color }, i) => (
              <div
                key={label}
                style={{
                  padding: "11px 14px",
                  borderRight: i < 3 ? "1px solid #EEEEEC" : "none",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 5,
                    marginBottom: 5,
                  }}
                >
                  <Icon size={11} style={{ color, flexShrink: 0 }} />
                  <span
                    style={{
                      fontSize: 9,
                      fontWeight: 600,
                      color: "#888885",
                      textTransform: "uppercase",
                      letterSpacing: ".08em",
                    }}
                  >
                    {label}
                  </span>
                </div>
                <p
                  style={{
                    fontSize: 13,
                    fontWeight: 600,
                    color: "#323130",
                    fontFamily:
                      label === "Days Ago"
                        ? "'IBM Plex Mono',monospace"
                        : undefined,
                  }}
                >
                  {value}
                </p>
              </div>
            ))}
          </div>

          {/* detail info */}
          <div className="ph-ev-info-grid">
            <div
              style={{ padding: "11px 14px", borderRight: "1px solid #EEEEEC" }}
            >
              <p
                style={{
                  fontSize: 9,
                  fontWeight: 600,
                  color: "#888885",
                  textTransform: "uppercase",
                  letterSpacing: ".08em",
                  marginBottom: 8,
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                }}
              >
                <Hash size={9} />
                Transaction Details
              </p>
              <InfoRow label="Request Code" value={r.request_code} mono />
              <InfoRow label="Employee ID" value={r.emp_id} mono />
              <InfoRow label="Department" value={r.emp_dept} />
              <InfoRow label="Payment Type" value={r.payment_type_label} />
            </div>
            <div style={{ padding: "11px 14px" }}>
              <p
                style={{
                  fontSize: 9,
                  fontWeight: 600,
                  color: "#888885",
                  textTransform: "uppercase",
                  letterSpacing: ".08em",
                  marginBottom: 8,
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                }}
              >
                <Receipt size={9} />
                Recovery Details
              </p>
              <InfoRow
                label="Status"
                value={<Chip type={statusType} size="lg" />}
              />
              <InfoRow
                label="Amount"
                value={inr(r.amount)}
                mono
                color={isAdv ? T.t700 : T.r700}
              />
              <InfoRow label="Month" value={r.month} />
              <InfoRow label="Reason" value={r.reason} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function MonthSec({ month, rows }) {
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
      <button
        className="ph-btn ph-row ph-month-hdr"
        onClick={() => setOpen((o) => !o)}
        style={{
          width: "100%",
          display: "flex",
          alignItems: "center",
          gap: 9,
          background: open ? "#F7F7F6" : "#fff",
          borderBottom: open ? "1px solid #EEEEEC" : "none",
          textAlign: "left",
          transition: "background .1s",
        }}
      >
        <div
          className="ph-month-icon"
          style={{
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
            <span className="ph-month-label" style={{ fontWeight: 600, color: "#1E1D1C" }}>
              {month}
            </span>
            <span
              style={{
                fontSize: 10,
                color: "#888885",
                background: "#EEEEEC",
                padding: "1px 6px",
                borderRadius: 3,
              }}
            >
              {rows.length} entries
            </span>
            {done > 0 && (
              <span
                className="ph-hide-xs"
                style={{
                  fontSize: 10,
                  color: T.g600,
                  background: T.g50,
                  padding: "1px 6px",
                  borderRadius: 3,
                  border: `1px solid ${T.g100}`,
                }}
              >
                {done} recovered
              </span>
            )}
            {upcoming > 0 && (
              <span
                className="ph-hide-xs"
                style={{
                  fontSize: 10,
                  color: T.v600,
                  background: T.v100,
                  padding: "1px 6px",
                  borderRadius: 3,
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
          style={{ color: "#888885" }}
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

function EmpCard({ empId, empName, empDept, rows }) {
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
      className="ph-emp-card"
      style={{
        background: "#fff",
        borderRadius: 10,
        border: "1px solid #E3E3E0",
        overflow: "hidden",
        marginBottom: 9,
        boxShadow: "0 1px 3px rgba(0,0,0,.04)",
      }}
    >
      <button
        className="ph-btn ph-row ph-emp-hdr"
        onClick={() => setOpen((o) => !o)}
        style={{
          width: "100%",
          display: "flex",
          alignItems: "center",
          gap: 10,
          background: "#fff",
          borderBottom: open ? "1px solid #E3E3E0" : "none",
          textAlign: "left",
          transition: "background .1s",
        }}
      >
        <Av name={empName} size={38} />
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
            <span style={{ fontSize: 14, fontWeight: 600, color: "#111110" }}>
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
                className="ph-hide-xs"
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
                className="ph-emp-stats-line"
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
                    className="ph-hide-xs"
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
                <span className="ph-hide-xs" style={{ fontSize: 10, color: "#888885" }}>
                  {doneInstallments}/{totalInstallments} EMIs
                </span>
                {upcomingInstallments > 0 && (
                  <span
                    className="ph-hide-xs"
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
          {/* summary strip */}
          {ta > 0 && (
            <div className="ph-emp-summary-grid">
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

function ReqRow({ req }) {
  const [open, setOpen] = useState(false);
  const age = req.request_date ? daysDiff(req.request_date) : null;
  return (
    <div style={{ borderBottom: "1px solid #EEEEEC" }}>
      <button
        className="ph-btn ph-row ph-req-hdr-row"
        onClick={() => setOpen((o) => !o)}
        style={{
          width: "100%",
          display: "flex",
          alignItems: "center",
          gap: 9,
          background: "transparent",
          textAlign: "left",
          transition: "background .1s",
          flexWrap: "wrap",
        }}
      >
        <Av name={req.emp_name} size={30} />
        <div className="ph-req-mid" style={{ flex: 1, minWidth: 0 }}>
          <p
            style={{
              fontSize: 13,
              fontWeight: 600,
              color: "#111110",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              marginBottom: 3,
            }}
          >
            {req.emp_name}
          </p>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 5,
              flexWrap: "wrap",
            }}
          >
            {req.request_code && (
              <span
                style={{
                  fontSize: 10,
                  color: T.t600,
                  fontFamily: "'IBM Plex Mono',monospace",
                  background: T.t100,
                  padding: "2px 6px",
                  borderRadius: 3,
                }}
              >
                {req.request_code}
              </span>
            )}
            {req.emp_dept && (
              <span
                className="ph-hide-xs"
                style={{
                  fontSize: 10,
                  color: "#65635F",
                  background: "#EEEEEC",
                  padding: "2px 6px",
                  borderRadius: 3,
                }}
              >
                {req.emp_dept}
              </span>
            )}
            {req.payment_type_label && (
              <span
                className="ph-hide-xs"
                style={{
                  fontSize: 10,
                  color: "#3730A3",
                  background: "#EEF2FF",
                  padding: "2px 6px",
                  borderRadius: 3,
                }}
              >
                {req.payment_type_label}
              </span>
            )}
          </div>
        </div>
        <div className="ph-req-trail" style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
          <div style={{ textAlign: "right" }}>
            <p
              style={{
                fontSize: 15,
                fontWeight: 700,
                color: "#111110",
                fontFamily: "'IBM Plex Mono',monospace",
                letterSpacing: "-.03em",
              }}
            >
              {inr(req.amount)}
            </p>
            {age !== null && (
              <p style={{ fontSize: 10, color: "#ADADAA" }}>{age}d ago</p>
            )}
          </div>
          <span className="ph-hide-xs">
            <Chip type="advance" />
          </span>
          <ChevronDown
            size={12}
            className={`ph-chev${open ? " open" : ""}`}
            style={{ color: "#ADADAA" }}
          />
        </div>
      </button>
      {open && (
        <div
          className="ph-up"
          style={{ background: "#FAFAF9", borderTop: "1px solid #EEEEEC" }}
        >
          <div className="ph-req-detail-grid">
            {[
              { l: "Requested", v: fmtD(req.request_date), icon: Calendar },
              { l: "Approved", v: fmtD(req.reviewed_at), icon: BadgeCheck },
              { l: "Adjusted In", v: req.adjusted_in || "—", icon: CreditCard },
            ].map(({ l, v, icon: Icon }, i) => (
              <div
                key={l}
                style={{
                  padding: "11px 14px",
                  borderRight: i < 2 ? "1px solid #EEEEEC" : "none",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 5,
                    marginBottom: 4,
                  }}
                >
                  <Icon size={10} style={{ color: "#888885" }} />
                  <p
                    style={{
                      fontSize: 9,
                      fontWeight: 600,
                      color: "#888885",
                      textTransform: "uppercase",
                      letterSpacing: ".08em",
                    }}
                  >
                    {l}
                  </p>
                </div>
                <p style={{ fontSize: 13, fontWeight: 600, color: "#323130" }}>
                  {v}
                </p>
              </div>
            ))}
          </div>
          <div className="ph-req-info-grid">
            <div>
              <p
                style={{
                  fontSize: 9,
                  fontWeight: 600,
                  color: "#888885",
                  textTransform: "uppercase",
                  letterSpacing: ".08em",
                  marginBottom: 5,
                }}
              >
                Reason
              </p>
              <p style={{ fontSize: 12, color: "#323130", lineHeight: 1.5 }}>
                {req.reason || "—"}
              </p>
            </div>
            <div>
              <p
                style={{
                  fontSize: 9,
                  fontWeight: 600,
                  color: "#888885",
                  textTransform: "uppercase",
                  letterSpacing: ".08em",
                  marginBottom: 5,
                }}
              >
                Employee
              </p>
              <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                <Av name={req.emp_name} size={24} />
                <div>
                  <p
                    style={{ fontSize: 12, fontWeight: 500, color: "#323130" }}
                  >
                    {req.emp_name}
                  </p>
                  <p
                    style={{
                      fontSize: 10,
                      color: "#888885",
                      fontFamily: "'IBM Plex Mono',monospace",
                    }}
                  >
                    {req.emp_id} · {req.emp_dept || "—"}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function DeptBreakdown({ empGroups, loading }) {
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

  if (loading) return null;
  if (!depts.length) return null;

  return (
    <div
      style={{
        background: "#fff",
        borderRadius: 10,
        border: "1px solid #E3E3E0",
        overflow: "hidden",
      }}
    >
      <div
        className="ph-card-hdr"
        style={{
          display: "flex",
          alignItems: "center",
          gap: 7,
          borderBottom: "1px solid #E3E3E0",
        }}
      >
        <Building2 size={13} style={{ color: T.b1 }} />
        <span style={{ fontSize: 12, fontWeight: 600, color: "#1E1D1C" }}>
          Department Breakdown
        </span>
        <span className="ph-hide-xs" style={{ fontSize: 10, color: "#888885", marginLeft: 2 }}>
          top 5 departments
        </span>
      </div>
      <div
        className="ph-dept-list"
        style={{
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
            <div
              key={d.dept}
              className="ph-dept-row"
              style={{
                display: "grid",
                alignItems: "center",
                gap: 10,
              }}
            >
              <div className="ph-dept-name-col">
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
              <div className="ph-dept-amt-col" style={{ textAlign: "right" }}>
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

function EmptyState({ search, onClear }) {
  return (
    <div style={{ padding: "60px 16px", textAlign: "center" }}>
      <div
        style={{
          width: 52,
          height: 52,
          borderRadius: 14,
          background: "#EEEEEC",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          margin: "0 auto 14px",
        }}
      >
        <FileText size={22} style={{ color: "#ADADAA" }} />
      </div>
      <p
        style={{
          fontSize: 15,
          fontWeight: 600,
          color: "#4A4845",
          marginBottom: 6,
        }}
      >
        No records found
      </p>
      <p style={{ fontSize: 13, color: "#888885", marginBottom: 18 }}>
        {search
          ? `No results for "${search}"`
          : "No salary advance history yet."}
      </p>
      {search && (
        <button
          className="ph-btn"
          onClick={onClear}
          style={{
            padding: "7px 20px",
            borderRadius: 6,
            background: "#EEEEEC",
            color: "#323130",
            border: "1px solid #CECEC9",
            fontSize: 12,
            fontWeight: 500,
          }}
        >
          Clear search
        </button>
      )}
    </div>
  );
}

function ErrState({ msg, onRetry }) {
  return (
    <div style={{ padding: "60px 16px", textAlign: "center" }}>
      <div
        style={{
          width: 52,
          height: 52,
          borderRadius: 14,
          background: T.r50,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          margin: "0 auto 14px",
        }}
      >
        <AlertTriangle size={22} style={{ color: T.r500 }} />
      </div>
      <p
        style={{
          fontSize: 15,
          fontWeight: 600,
          color: "#4A4845",
          marginBottom: 6,
        }}
      >
        Failed to load data
      </p>
      <p style={{ fontSize: 13, color: "#888885", marginBottom: 18 }}>{msg}</p>
      <button
        className="ph-btn"
        onClick={onRetry}
        style={{
          padding: "8px 24px",
          borderRadius: 6,
          background: T.t500,
          color: "#fff",
          border: "none",
          fontSize: 12,
          fontWeight: 600,
        }}
      >
        Retry
      </button>
    </div>
  );
}

function SkeletonRows({ n = 6 }) {
  return (
    <div
      style={{
        padding: "14px",
        display: "flex",
        flexDirection: "column",
        gap: 9,
      }}
    >
      {Array.from({ length: n }).map((_, i) => (
        <div
          key={i}
          className="ph-shim"
          style={{ height: 62, borderRadius: 8, animationDelay: `${i * 70}ms` }}
        />
      ))}
    </div>
  );
}

// ── MAIN EXPORT ───────────────────────────────────────────────────────────────
export default function PaymentHistory({ onClose }) {
  const [view, setView] = useState("month");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [hrows, setHrows] = useState([]);
  const [reqs, setReqs] = useState([]);
  const [filter, setFilter] = useState("all"); // all | advance | deduction
  const ref = useRef(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
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

  useEffect(() => {
    load();
  }, [load]);

  const reqMap = useMemo(() => {
    const m = {};
    reqs.forEach((r) => {
      m[r.id] = r;
    });
    return m;
  }, [reqs]);

  const ledger = useMemo(() => {
    const out = [];
    hrows.forEach((row) => {
      const p = reqMap[row.request_id] ?? {};
      out.push({
        eventType: "deduction",
        emp_id: row.emp_id,
        emp_name: row.emp_name,
        emp_dept: row.emp_dept,
        month: row.month_label,
        amount: Number(row.deduction_amount) || 0,
        deduction_status: row.deduction_status,
        request_code: row.request_code,
        reason: row.reason,
        payment_type_label: row.payment_type_label,
        request_date: p.request_date ?? null,
        reviewed_at: p.reviewed_at ?? null,
        adjusted_in: p.adjusted_in ?? null,
      });
    });
    reqs.forEach((r) => {
      if (!r.adjusted_in) return;
      out.push({
        eventType: "advance",
        emp_id: r.emp_id,
        emp_name: r.emp_name,
        emp_dept: r.emp_dept,
        month: r.adjusted_in,
        amount: Number(r.amount) || 0,
        deduction_status: null,
        request_code: r.request_code,
        reason: r.reason,
        payment_type_label: r.payment_type_label ?? r.payment_type_short,
        request_date: r.request_date,
        reviewed_at: r.reviewed_at,
        adjusted_in: r.adjusted_in,
      });
    });
    return out;
  }, [hrows, reqs, reqMap]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    let base = ledger;
    if (filter === "advance")
      base = base.filter((r) => r.eventType === "advance");
    if (filter === "deduction")
      base = base.filter((r) => r.eventType === "deduction");
    if (!q) return base;
    return base.filter(
      (r) =>
        r.emp_name?.toLowerCase().includes(q) ||
        r.emp_id?.toLowerCase().includes(q) ||
        r.emp_dept?.toLowerCase().includes(q) ||
        r.request_code?.toLowerCase().includes(q) ||
        r.reason?.toLowerCase().includes(q) ||
        r.month?.toLowerCase().includes(q),
    );
  }, [ledger, search, filter]);

  const monthGroups = useMemo(() => {
    const m = {};
    filtered.forEach((r) => {
      (m[r.month] = m[r.month] ?? []).push(r);
    });
    return sortM(Object.keys(m))
      .reverse()
      .map((mo) => ({ month: mo, rows: m[mo] }));
  }, [filtered]);

  const empGroups = useMemo(() => {
    const m = {};
    filtered.forEach((r) => {
      if (!m[r.emp_id])
        m[r.emp_id] = {
          empId: r.emp_id,
          empName: r.emp_name,
          empDept: r.emp_dept,
          rows: [],
        };
      m[r.emp_id].rows.push(r);
    });
    return Object.values(m).sort((a, b) =>
      (a.empName || "").localeCompare(b.empName || ""),
    );
  }, [filtered]);

  // KPI data
  const totalAdv = reqs.reduce((s, r) => s + (Number(r.amount) || 0), 0);
  const totalDed = hrows
    .filter((r) => r.deduction_status === "done")
    .reduce((s, r) => s + (Number(r.deduction_amount) || 0), 0);
  const outstanding = Math.max(0, totalAdv - totalDed);
  const uniqueEmps = new Set(reqs.map((r) => r.emp_id)).size;
  const upcoming = hrows.filter(
    (r) => r.deduction_status === "upcoming",
  ).length;
  const skipped = hrows.filter((r) => r.deduction_status === "skipped").length;
  const recPct =
    totalAdv > 0 ? Math.min(100, Math.round((totalDed / totalAdv) * 100)) : 0;
  const avgAdv = uniqueEmps > 0 ? Math.round(totalAdv / uniqueEmps) : 0;

  const handleOverlay = (e) => {
    if (e.target === e.currentTarget) onClose?.();
  };

  return (
    <div className="ph-root">
      <style>{CSS}</style>

      {/* ══ OVERLAY ══ */}
      <div className="ph-overlay" onClick={handleOverlay}>
        {/* ══ CARD ══ */}
        <div className="ph-card">
          {/* ── HEADER ── */}
          <div className="ph-hdr">
            {/* top bar */}
            <div className="ph-hdr-top">
              <div className="ph-hdr-left">
                <div className="ph-hdr-icon">
                  <Wallet size={22} style={{ color: "#fff" }} />
                </div>
                <div className="ph-hdr-textwrap">
                  <p className="ph-hdr-title">
                    Salary Advance History
                  </p>
                  <p className="ph-hdr-sub">
                    Advance disbursal &amp; EMI deduction recovery · all
                    employees
                  </p>
                </div>
              </div>
              <div className="ph-hdr-actions">
                <button
                  className="ph-btn ph-hdr-btn"
                  onClick={load}
                  disabled={loading}
                  title="Refresh"
                >
                  {loading ? (
                    <Loader2
                      size={15}
                      style={{ animation: "spin 1s linear infinite" }}
                    />
                  ) : (
                    <RefreshCw size={15} />
                  )}
                </button>
                <button
                  className="ph-btn ph-hdr-btn"
                  onClick={onClose}
                  title="Close"
                >
                  <X size={17} />
                </button>
              </div>
            </div>
          </div>

          {/* ── BODY ── */}
          <div className="ph-body">
            {/* error banner */}
            {error && (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "10px 14px",
                  background: T.r50,
                  border: `1px solid ${T.r300}`,
                  borderRadius: 8,
                  fontSize: 12,
                  color: T.r700,
                  flexShrink: 0,
                }}
              >
                <AlertCircle size={14} style={{ flexShrink: 0 }} />
                <span style={{ flex: 1 }}>{error}</span>
                <button
                  className="ph-btn"
                  onClick={load}
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    color: T.r700,
                    padding: "4px 11px",
                    borderRadius: 5,
                    background: T.r100,
                    border: `1px solid ${T.r300}`,
                  }}
                >
                  Retry
                </button>
              </div>
            )}

            {/* KPI grid */}
            <div className="ph-kpi-grid">
              <KpiCard
                label="Total Disbursed"
                icon={CircleDollarSign}
                value={inrK(totalAdv)}
                sub={`${uniqueEmps} employees · avg ${inrK(avgAdv)}`}
                color={T.a500}
                loading={loading}
              />
              <KpiCard
                label="Total Recovered"
                icon={ShieldCheck}
                value={inrK(totalDed)}
                sub={`${recPct}% recovery rate`}
                color={T.g500}
                loading={loading}
              />
              <KpiCard
                label="Outstanding"
                icon={Activity}
                value={inrK(outstanding)}
                sub={outstanding > 0 ? "Pending collection" : "All clear"}
                color={T.r500}
                loading={loading}
              />
              <KpiCard
                label="Upcoming EMIs"
                icon={Timer}
                value={upcoming}
                sub={skipped > 0 ? `${skipped} skipped` : "No skipped EMIs"}
                color={T.v500}
                loading={loading}
              />
            </div>

            {/* recovery tracker */}
            {!loading && !error && totalAdv > 0 && (
              <div
                style={{
                  background: "#fff",
                  borderRadius: 10,
                  border: "1px solid #E3E3E0",
                  overflow: "hidden",
                  flexShrink: 0,
                }}
              >
                <div className="ph-tracker-hdr">
                  <TrendingUp
                    size={14}
                    style={{ color: T.t500, flexShrink: 0 }}
                  />
                  <span
                    style={{ fontSize: 12, fontWeight: 600, color: "#1E1D1C" }}
                  >
                    Recovery Tracker
                  </span>
                  <div className="ph-tracker-bar-wrap">
                    <MiniBar pct={recPct} height={7} />
                  </div>
                  <span
                    style={{
                      fontSize: 12,
                      fontWeight: 700,
                      fontFamily: "'IBM Plex Mono',monospace",
                      color:
                        recPct >= 75 ? T.g600 : recPct >= 40 ? T.a600 : T.r600,
                    }}
                  >
                    {recPct}% recovered
                  </span>
                </div>
                <div className="ph-tracker-grid">
                  {[
                    {
                      l: "Total Disbursed",
                      v: inr(totalAdv),
                      sub: `${uniqueEmps} employees`,
                      c: T.a600,
                      bg: T.a50,
                    },
                    {
                      l: "Recovered",
                      v: inr(totalDed),
                      sub: `${hrows.filter((r) => r.deduction_status === "done").length} deductions`,
                      c: T.g600,
                      bg: T.g50,
                    },
                    {
                      l: "Outstanding",
                      v: inr(outstanding),
                      sub: "remaining balance",
                      c: outstanding > 0 ? T.r600 : T.g600,
                      bg: outstanding > 0 ? T.r50 : T.g50,
                    },
                    {
                      l: "Upcoming EMIs",
                      v: inr(
                        hrows
                          .filter((r) => r.deduction_status === "upcoming")
                          .reduce(
                            (s, r) => s + (Number(r.deduction_amount) || 0),
                            0,
                          ),
                      ),
                      sub: `${upcoming} scheduled`,
                      c: T.v600,
                      bg: T.v100,
                    },
                  ].map(({ l, v, sub, c, bg }, i) => (
                    <div
                      key={l}
                      style={{
                        padding: "11px 14px",
                        borderRight: i < 3 ? "1px solid #EEEEEC" : "none",
                        background: bg + "66",
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
                          fontSize: 17,
                          fontWeight: 700,
                          color: c,
                          fontFamily: "'IBM Plex Mono',monospace",
                          letterSpacing: "-.03em",
                        }}
                      >
                        {v}
                      </p>
                      <p
                        style={{ fontSize: 10, color: "#ADADAA", marginTop: 2 }}
                      >
                        {sub}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* dept breakdown */}
            {!loading && !error && (
              <DeptBreakdown empGroups={empGroups} loading={loading} />
            )}

            {/* approved requests */}
            {!loading && !error && reqs.length > 0 && (
              <div
                style={{
                  background: "#fff",
                  borderRadius: 10,
                  border: "1px solid #E3E3E0",
                  overflow: "hidden",
                  flexShrink: 0,
                }}
              >
                <div className="ph-req-section-hdr">
                  <div
                    style={{ display: "flex", alignItems: "center", gap: 8 }}
                  >
                    <CheckCircle2 size={14} style={{ color: T.g500 }} />
                    <span
                      style={{
                        fontSize: 13,
                        fontWeight: 600,
                        color: "#1E1D1C",
                      }}
                    >
                      Approved Requests
                    </span>
                    <span
                      className="ph-badge-count"
                      style={{ background: T.g100, color: T.g700 }}
                    >
                      {reqs.length}
                    </span>
                  </div>
                  <div
                    style={{ display: "flex", alignItems: "center", gap: 10 }}
                  >
                    <span className="ph-hide-xs" style={{ fontSize: 10, color: "#888885" }}>
                      Total approved amount
                    </span>
                    <span
                      style={{
                        fontSize: 15,
                        fontWeight: 700,
                        color: "#111110",
                        fontFamily: "'IBM Plex Mono',monospace",
                      }}
                    >
                      {inr(totalAdv)}
                    </span>
                  </div>
                </div>
                <div
                  className="ph-sc"
                  style={{ maxHeight: 220, overflowY: "auto" }}
                >
                  {reqs.map((r) => (
                    <ReqRow key={r.id} req={r} />
                  ))}
                </div>
              </div>
            )}

            {/* ledger */}
            <div
              style={{
                background: "#fff",
                borderRadius: 10,
                border: "1px solid #E3E3E0",
                overflow: "hidden",
                flexShrink: 0,
              }}
            >
              {/* toolbar */}
              <div className="ph-toolbar">
                {/* view tabs */}
                <div className="ph-view-tabs">
                  {[
                    { k: "month", label: "By Month", Icon: Calendar },
                    { k: "employee", label: "By Employee", Icon: Users },
                  ].map(({ k, label, Icon }) => {
                    const on = view === k;
                    return (
                      <button
                        key={k}
                        className={`ph-btn ph-tab${on ? " on" : ""}`}
                        onClick={() => setView(k)}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: 5,
                          padding: "6px 12px",
                          borderRadius: 5,
                          background: on ? "#111110" : "transparent",
                          color: on ? "#fff" : "#65635F",
                          fontSize: 11,
                          fontWeight: 500,
                          transition: "all .14s",
                          flex: "1 1 auto",
                        }}
                      >
                        <Icon size={11} />
                        {label}
                      </button>
                    );
                  })}
                </div>

                {/* type filter */}
                <div className="ph-filter-tabs">
                  {[
                    { k: "all", label: "All" },
                    { k: "advance", label: "Advance" },
                    { k: "deduction", label: "Deduction" },
                  ].map(({ k, label }) => {
                    const on = filter === k;
                    return (
                      <button
                        key={k}
                        className={`ph-btn ph-tab${on ? " on" : ""}`}
                        onClick={() => setFilter(k)}
                        style={{
                          padding: "6px 11px",
                          borderRadius: 5,
                          background: on ? T.b1 : "transparent",
                          color: on ? "#fff" : "#65635F",
                          fontSize: 11,
                          fontWeight: 500,
                          transition: "all .14s",
                          flex: "1 1 auto",
                        }}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>

                {/* search */}
                <div className="ph-search-wrap" style={{ position: "relative" }}>
                  <Search
                    size={11}
                    style={{
                      position: "absolute",
                      left: 9,
                      top: "50%",
                      transform: "translateY(-50%)",
                      color: "#888885",
                      pointerEvents: "none",
                    }}
                  />
                  <input
                    ref={ref}
                    className="ph-inp"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search name, ID, dept, ref…"
                    style={{
                      width: "100%",
                      paddingLeft: 27,
                      paddingRight: search ? 30 : 10,
                      paddingTop: 7,
                      paddingBottom: 7,
                      fontSize: 11.5,
                      border: "1px solid #CECEC9",
                      borderRadius: 6,
                      background: "#fff",
                      color: "#111110",
                      fontFamily: "'IBM Plex Sans',system-ui,sans-serif",
                      transition: "border-color .14s,box-shadow .14s",
                    }}
                  />
                  {search && (
                    <button
                      onClick={() => {
                        setSearch("");
                        ref.current?.focus();
                      }}
                      style={{
                        position: "absolute",
                        right: 7,
                        top: "50%",
                        transform: "translateY(-50%)",
                        background: "#E3E3E0",
                        border: "none",
                        borderRadius: 3,
                        width: 17,
                        height: 17,
                        cursor: "pointer",
                        color: "#4A4845",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        padding: 0,
                      }}
                    >
                      <X size={10} />
                    </button>
                  )}
                </div>

                {!loading && !error && (
                  <span className="ph-hide-xs ph-toolbar-count">
                    {filtered.length} event{filtered.length !== 1 ? "s" : ""}
                    {search && <em> · "{search}"</em>}
                  </span>
                )}
              </div>

              {/* ledger content */}
              {loading ? (
                <SkeletonRows />
              ) : error ? (
                <ErrState msg={error} onRetry={load} />
              ) : filtered.length === 0 ? (
                <EmptyState search={search} onClear={() => setSearch("")} />
              ) : view === "month" ? (
                monthGroups.map(({ month, rows }) => (
                  <MonthSec key={month} month={month} rows={rows} />
                ))
              ) : (
                <div className="ph-emp-list" style={{ background: "#F2F2F0" }}>
                  {empGroups.map((g) => (
                    <EmpCard
                      key={g.empId}
                      empId={g.empId}
                      empName={g.empName}
                      empDept={g.empDept}
                      rows={g.rows}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
          {/* end ph-body */}

          {/* ── FOOTER ── */}
          <div className="ph-footer">
            <div className="ph-footer-left">
              <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                <span
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: "50%",
                    background: T.g300,
                    display: "block",
                    animation: "pulse 2s ease-in-out infinite",
                  }}
                />
                <span
                  style={{
                    fontSize: 11,
                    color: "#888885",
                    fontFamily: "'IBM Plex Mono',monospace",
                  }}
                >
                  {filtered.length} event{filtered.length !== 1 ? "s" : ""}
                  {search && <em> · "{search}"</em>}
                </span>
              </div>
              <span className="ph-footer-divider" />
              <span className="ph-hide-xs" style={{ fontSize: 11, color: "#ADADAA" }}>
                {uniqueEmps} employees · {reqs.length} requests · refreshed{" "}
                {new Date().toLocaleTimeString("en-IN", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <button
                className="ph-btn ph-close-btn"
                onClick={onClose}
                style={{
                  borderRadius: 7,
                  border: "1px solid #CECEC9",
                  background: "#fff",
                  color: "#4A4845",
                  fontSize: 12,
                  fontWeight: 500,
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
        {/* end ph-card */}
      </div>
      {/* end ph-overlay */}
    </div>
  );
}