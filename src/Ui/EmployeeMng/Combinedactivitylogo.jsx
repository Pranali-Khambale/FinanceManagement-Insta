// src/Ui/EmployeeMng/CombinedActivityLog.jsx
// ─────────────────────────────────────────────────────────────────────────────
// Global HR Activity Log — Professional Light Theme (no black)
// ─────────────────────────────────────────────────────────────────────────────
import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  X, Clock, CheckCircle, XCircle, AlertTriangle, RefreshCw,
  Activity, Loader, AlertCircle, ArrowRight, User, Search,
  Users, UserPlus, Building2, ChevronLeft, ChevronRight,
  DatabaseZap, RotateCcw, Zap,
} from "lucide-react";
import { DownloadMenu, DownloadSuccessModal } from "./EmployeeHistoryDownload";

const BASE_URL =
  (typeof import.meta !== "undefined" && import.meta.env?.VITE_API_URL) ||
  "http://localhost:5000/api";

// ── Status config ─────────────────────────────────────────────────────────────
const STATUS_CONFIG = {
  active:         { label: "Active",         Icon: CheckCircle,   color: "#059669", bg: "#ecfdf5", border: "#a7f3d0", dot: "#10b981" },
  approved:       { label: "Active",         Icon: CheckCircle,   color: "#059669", bg: "#ecfdf5", border: "#a7f3d0", dot: "#10b981" },
  pending:        { label: "Pending",        Icon: Clock,         color: "#d97706", bg: "#fffbeb", border: "#fcd34d", dot: "#f59e0b" },
  pending_rejoin: { label: "Pending Rejoin", Icon: RefreshCw,     color: "#6d28d9", bg: "#f5f3ff", border: "#c4b5fd", dot: "#8b5cf6" },
  inactive:       { label: "Inactive",       Icon: XCircle,       color: "#dc2626", bg: "#fef2f2", border: "#fca5a5", dot: "#ef4444" },
  rejected:       { label: "Rejected",       Icon: XCircle,       color: "#be123c", bg: "#fff1f2", border: "#fda4af", dot: "#f43f5e" },
  blacklist:      { label: "Blacklisted",    Icon: AlertTriangle, color: "#c2410c", bg: "#fff7ed", border: "#fdba74", dot: "#f97316" },
  blacklisted:    { label: "Blacklisted",    Icon: AlertTriangle, color: "#c2410c", bg: "#fff7ed", border: "#fdba74", dot: "#f97316" },
};

function getCfg(status) {
  return STATUS_CONFIG[status?.toLowerCase()] || {
    label: status || "Unknown", Icon: Activity,
    color: "#64748b", bg: "#f8fafc", border: "#cbd5e1", dot: "#94a3b8",
  };
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function relTime(d) {
  if (!d) return "—";
  const diff = Date.now() - new Date(d);
  const m  = Math.floor(diff / 60000);
  const h  = Math.floor(diff / 3600000);
  const dy = Math.floor(diff / 86400000);
  if (m < 1)  return "Just now";
  if (m < 60) return `${m}m ago`;
  if (h < 24) return `${h}h ago`;
  if (dy < 7) return `${dy}d ago`;
  return new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}
function absTime(d) {
  if (!d) return "—";
  return new Date(d).toLocaleString("en-IN", {
    day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
  });
}
function initials(fn, ln) {
  return `${(fn || "")[0] || ""}${(ln || "")[0] || ""}`.toUpperCase() || "?";
}

export function resolveDisplayEmpId(event) {
  const meta = event.metadata
    ? (typeof event.metadata === "string" ? JSON.parse(event.metadata) : event.metadata)
    : {};
  const toStatus = event.to_status?.toLowerCase();
  const isActive = toStatus === "active" || toStatus === "approved";
  return isActive
    ? (event.employee_id || meta.employee_id || "")
    : (meta.employee_id || event.employee_id || "");
}

// ── Avatar ────────────────────────────────────────────────────────────────────
const AVATAR_PALETTES = [
  { bg: "#dbeafe", text: "#1d4ed8", ring: "#93c5fd" },
  { bg: "#dcfce7", text: "#15803d", ring: "#86efac" },
  { bg: "#f3e8ff", text: "#7e22ce", ring: "#d8b4fe" },
  { bg: "#fef3c7", text: "#92400e", ring: "#fcd34d" },
  { bg: "#cffafe", text: "#0e7490", ring: "#67e8f9" },
  { bg: "#ffe4e6", text: "#be123c", ring: "#fda4af" },
];
function avatarPalette(name) {
  let h = 0;
  for (let i = 0; i < (name || "").length; i++) h = name.charCodeAt(i) + ((h << 5) - h);
  return AVATAR_PALETTES[Math.abs(h) % AVATAR_PALETTES.length];
}

function Avatar({ firstName, lastName, size = 36 }) {
  const ini = initials(firstName, lastName);
  const pal = avatarPalette(ini);
  return (
    <div style={{
      width: size, height: size, borderRadius: "50%", flexShrink: 0,
      background: pal.bg, color: pal.text,
      display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: size * 0.33, fontWeight: 800, letterSpacing: "0.03em",
      border: `2px solid ${pal.ring}`,
      boxShadow: `0 1px 4px ${pal.ring}60`,
    }}>
      {ini}
    </div>
  );
}

// ── StatusPill ────────────────────────────────────────────────────────────────
function StatusPill({ status }) {
  const { label, color, bg, border, dot } = getCfg(status);
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 5, padding: "3px 9px",
      borderRadius: 6, fontSize: 11, fontWeight: 600,
      background: bg, color: color, border: `1px solid ${border}`,
      whiteSpace: "nowrap", letterSpacing: "0.02em",
    }}>
      <span style={{ width: 5, height: 5, borderRadius: "50%", background: dot, flexShrink: 0 }} />
      {label}
    </span>
  );
}

// ── StatsBar ──────────────────────────────────────────────────────────────────
function StatsBar({ events }) {
  const c = events.reduce(
    (acc, ev) => {
      const s = ev.to_status?.toLowerCase();
      if (s === "active" || s === "approved")             acc.active++;
      else if (s === "inactive" || s === "rejected")      acc.inactive++;
      else if (s === "blacklist" || s === "blacklisted")  acc.blacklist++;
      else if (s === "pending" || s === "pending_rejoin") acc.pending++;
      return acc;
    },
    { active: 0, inactive: 0, blacklist: 0, pending: 0 }
  );

  const stats = [
    { label: "Active",      count: c.active,    numColor: "#90f0d1", bg: "rgba(255,255,255,0.22)", border: "rgba(255,255,255,0.3)" },
    { label: "Inactive",    count: c.inactive,  numColor: "#b46266", bg: "rgba(255,255,255,0.15)", border: "rgba(255,255,255,0.25)" },
    { label: "Blacklisted", count: c.blacklist, numColor: "#fdba74", bg: "rgba(255,255,255,0.15)", border: "rgba(255,255,255,0.25)" },
    { label: "Pending",     count: c.pending,   numColor: "#fde68a", bg: "rgba(255,255,255,0.15)", border: "rgba(255,255,255,0.25)" },
  ];

  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 10, marginBottom: 16 }}>
      {stats.map((s) => (
        <div key={s.label} style={{
          background: s.bg,
          border: `1px solid ${s.border}`,
          borderRadius: 10, padding: "12px 14px",
          display: "flex", flexDirection: "column", gap: 3,
          backdropFilter: "blur(4px)",
        }}>
          <div style={{ fontSize: 26, fontWeight: 800, color: s.numColor, lineHeight: 1 }}>
            {s.count}
          </div>
          <div style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.7)", textTransform: "uppercase", letterSpacing: "0.07em" }}>
            {s.label}
          </div>
        </div>
      ))}
    </div>
  );
}

// ── EventRow ──────────────────────────────────────────────────────────────────
function EventRow({ event, index }) {
  const { dot } = getCfg(event.to_status);
  const isFirst = !event.from_status;
  const displayEmpId = resolveDisplayEmpId(event);
  const meta = event.metadata
    ? (typeof event.metadata === "string" ? JSON.parse(event.metadata) : event.metadata)
    : {};
  const displayDept = event.emp_department || meta.department || "";
  const fullName = [event.emp_first_name, event.emp_father_name, event.emp_last_name].filter(Boolean).join(" ");

  return (
    <div
      style={{
        display: "flex", alignItems: "flex-start", gap: 12, padding: "13px 20px",
        borderBottom: "1px solid #f1f5f9",
        background: "#ffffff",
        transition: "background 0.15s",
        animationName: "rowSlide",
        animationDuration: "0.28s",
        animationFillMode: "both",
        animationTimingFunction: "cubic-bezier(0.22,1,0.36,1)",
        animationDelay: `${Math.min(index * 16, 280)}ms`,
      }}
      onMouseEnter={e => e.currentTarget.style.background = "#f5f8ff"}
      onMouseLeave={e => e.currentTarget.style.background = "#ffffff"}
    >
      {/* Dot */}
      <div style={{ paddingTop: 7, flexShrink: 0 }}>
        <div style={{
          width: 8, height: 8, borderRadius: "50%",
          background: dot, boxShadow: `0 0 0 3px ${dot}25`,
        }} />
      </div>

      <Avatar firstName={event.emp_first_name} lastName={event.emp_last_name} size={34} />

      <div style={{ flex: 1, minWidth: 0 }}>
        {/* Name row */}
        <div style={{ display: "flex", alignItems: "center", gap: 7, flexWrap: "wrap", marginBottom: 5 }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: "#1e293b", letterSpacing: "-0.01em" }}>
            {fullName || "—"}
          </span>
          {displayEmpId && (
            <span style={{
              fontFamily: "'JetBrains Mono','Fira Code',monospace",
              fontSize: 10, padding: "1px 7px", borderRadius: 4,
              background: "#f1f5f9", color: "#475569",
              border: "1px solid #e2e8f0", letterSpacing: "0.04em",
            }}>
              {displayEmpId}
            </span>
          )}
          {displayDept && (
            <span style={{ display: "flex", alignItems: "center", gap: 3, fontSize: 10, color: "#94a3b8" }}>
              <Building2 size={9} />{displayDept}
            </span>
          )}
        </div>

        {/* Status transition */}
        <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap", marginBottom: event.reason ? 5 : 0 }}>
          {isFirst ? (
            <span style={{
              display: "inline-flex", alignItems: "center", gap: 4, padding: "3px 9px",
              borderRadius: 6, fontSize: 11, fontWeight: 600,
              background: "#eff6ff", color: "#2563eb", border: "1px solid #bfdbfe",
            }}>
              <UserPlus size={10} strokeWidth={2.5} /> Registered
            </span>
          ) : (
            <>
              <StatusPill status={event.from_status} />
              <ArrowRight size={11} color="#cbd5e1" strokeWidth={2} />
            </>
          )}
          <StatusPill status={event.to_status} />
        </div>

        {event.reason && event.reason !== "Initial status — employee joined" && (
          <p style={{ fontSize: 11, color: "#64748b", margin: "4px 0 0", lineHeight: 1.5 }}>
            <span style={{ fontWeight: 600, color: "#475569" }}>Reason: </span>
            {event.reason}
          </p>
        )}

        {event.changed_by_name && !["System", "System (backfill)"].includes(event.changed_by_name) && (
          <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 4 }}>
            <User size={9} color="#94a3b8" />
            <span style={{ fontSize: 10, color: "#94a3b8" }}>
              by <strong style={{ color: "#64748b" }}>{event.changed_by_name}</strong>
            </span>
          </div>
        )}
      </div>

      {/* Timestamp */}
      <div style={{ flexShrink: 0, textAlign: "right", minWidth: 90 }}>
        <div style={{ fontSize: 11, fontWeight: 600, color: "#334155", display: "flex", alignItems: "center", gap: 3, justifyContent: "flex-end" }}>
          <Clock size={9} color="#94a3b8" />{relTime(event.created_at)}
        </div>
        <div style={{ fontSize: 10, color: "#94a3b8", marginTop: 2, whiteSpace: "nowrap" }}>
          {absTime(event.created_at)}
        </div>
      </div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
const CombinedActivityLog = ({ onClose }) => {
  const [events,         setEvents]         = useState([]);
  const [loading,        setLoading]        = useState(true);
  const [error,          setError]          = useState("");
  const [search,         setSearch]         = useState("");
  const [filterStatus,   setFilterStatus]   = useState("all");
  const [filterDept,     setFilterDept]     = useState("all");
  const [page,           setPage]           = useState(1);
  const [downloadResult, setDownloadResult] = useState(null);
  const [backfilling,    setBackfilling]    = useState(false);
  const [backfillMsg,    setBackfillMsg]    = useState("");
  const bodyRef = useRef(null);
  const PER_PAGE = 30;

  const fetchAll = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const res  = await fetch(`${BASE_URL}/employees/activity-log`);
      const json = await res.json();
      if (json.success) {
        setEvents(json.data || []);
      } else {
        const empRes  = await fetch(`${BASE_URL}/employees`);
        const empJson = await empRes.json();
        if (!empJson.success) throw new Error(empJson.message || "Failed to fetch employees");
        const allEvents = [];
        await Promise.allSettled(
          (empJson.data || []).slice(0, 100).map(async (emp) => {
            try {
              const hRes  = await fetch(`${BASE_URL}/employees/${emp.id}/history`);
              const hJson = await hRes.json();
              if (hJson.success) {
                (hJson.history?.all || []).forEach((ev) => {
                  allEvents.push({
                    ...ev,
                    emp_first_name:  emp.first_name,
                    emp_father_name: emp.father_husband_name || "",
                    emp_last_name:   emp.last_name,
                    emp_department:  emp.department,
                    employee_id:     emp.employee_id || emp.id,
                  });
                });
              }
            } catch (_) {}
          })
        );
        allEvents.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        setEvents(allEvents);
      }
    } catch (err) {
      setError(err.message || "Failed to load activity log");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, [fetchAll]);

  useEffect(() => { setPage(1); }, [search, filterStatus, filterDept]);

  async function handleBackfill() {
    setBackfilling(true); setBackfillMsg("");
    try {
      const res  = await fetch(`${BASE_URL}/employees/backfill-history`);
      const json = await res.json();
      setBackfillMsg(
        json.success
          ? json.backfilled > 0
            ? `✅ Backfilled ${json.backfilled} employee(s). Refreshing…`
            : "✅ All employees already have history records."
          : `❌ ${json.message}`
      );
      if (json.success && json.backfilled > 0) {
        setTimeout(() => { fetchAll(); setBackfillMsg(""); }, 1500);
      } else {
        setTimeout(() => setBackfillMsg(""), 3000);
      }
    } catch (err) {
      setBackfillMsg(`❌ ${err.message}`);
      setTimeout(() => setBackfillMsg(""), 3000);
    } finally {
      setBackfilling(false);
    }
  }

  const departments = [...new Set(events.map((e) => e.emp_department).filter(Boolean))].sort();

  const filtered = events.filter((ev) => {
    const q = search.toLowerCase();
    const meta = ev.metadata
      ? (typeof ev.metadata === "string" ? JSON.parse(ev.metadata) : ev.metadata)
      : {};
    const displayEmpId = resolveDisplayEmpId(ev);
    const matchSearch =
      !q ||
      `${ev.emp_first_name} ${ev.emp_last_name}`.toLowerCase().includes(q) ||
      displayEmpId.toLowerCase().includes(q) ||
      (ev.emp_department || meta.department || "").toLowerCase().includes(q) ||
      (ev.reason || "").toLowerCase().includes(q);
    const s = ev.to_status?.toLowerCase() || "";
    const matchStatus =
      filterStatus === "all" ||
      (filterStatus === "active"    && (s === "active"    || s === "approved")) ||
      (filterStatus === "inactive"  && (s === "inactive"  || s === "rejected")) ||
      (filterStatus === "blacklist" && (s === "blacklist" || s === "blacklisted")) ||
      (filterStatus === "pending"   && (s === "pending"   || s === "pending_rejoin"));
    const matchDept = filterDept === "all" || ev.emp_department === filterDept;
    return matchSearch && matchStatus && matchDept;
  });

  const totalPages = Math.ceil(filtered.length / PER_PAGE);
  const paginated  = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);
  const start      = filtered.length > 0 ? (page - 1) * PER_PAGE + 1 : 0;
  const end        = Math.min(page * PER_PAGE, filtered.length);

  function pageNumbers() {
    if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);
    const s = Math.max(1, Math.min(page - 3, totalPages - 6));
    return Array.from({ length: 7 }, (_, i) => s + i);
  }
  function goPage(p) { setPage(p); bodyRef.current?.scrollTo(0, 0); }

  const today = new Date().toISOString().slice(0, 10);
  const downloadMeta = {
    title:    "HR Activity Log",
    subtitle: `${filterStatus !== "all" ? `Filter: ${filterStatus} · ` : ""}${filterDept !== "all" ? `Dept: ${filterDept} · ` : ""}Combined Status History`,
    filename: `hr-activity-log-${today}`,
  };

  const selectStyle = {
    padding: "8px 28px 8px 10px", border: "1px solid #e2e8f0", borderRadius: 8,
    fontSize: 12, fontFamily: "inherit", color: "#475569", background: "#ffffff",
    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6'%3E%3Cpath d='M0 0l5 6 5-6z' fill='%2394a3b8'/%3E%3C/svg%3E")`,
    backgroundRepeat: "no-repeat", backgroundPosition: "right 9px center",
    appearance: "none", outline: "none", cursor: "pointer",
    boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap');

        @keyframes rowSlide {
          from { opacity: 0; transform: translateX(-6px); }
          to   { opacity: 1; transform: translateX(0); }
        }
        @keyframes modalDrop {
          from { opacity: 0; transform: translateY(18px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes spin { to { transform: rotate(360deg); } }

        .cal-root * { font-family: 'Inter', system-ui, sans-serif; box-sizing: border-box; }

        .cal-search::placeholder { color: #94a3b8; }
        .cal-search:focus { border-color: #3b82f6 !important; outline: none; box-shadow: 0 0 0 3px rgba(59,130,246,0.1) !important; }
        .cal-select:focus { border-color: #3b82f6 !important; outline: none; box-shadow: 0 0 0 3px rgba(59,130,246,0.1) !important; }

        .hdr-ghost { transition: all 0.15s ease; }
        .hdr-ghost:hover { background: rgba(255,255,255,0.28) !important; }

        .backfill-btn { transition: all 0.15s ease; }
        .backfill-btn:hover:not(:disabled) { background: rgba(255,255,255,0.25) !important; }
        .backfill-btn:disabled { opacity: 0.5; cursor: wait; }

        .pg-btn { transition: all 0.12s ease; }
        .pg-btn:hover:not(:disabled) { background: #2563eb !important; color: #fff !important; border-color: #2563eb !important; }
        .pg-btn:disabled { opacity: 0.35; cursor: not-allowed; }
        .pg-num { transition: all 0.12s ease; }
        .pg-num:hover:not(.pg-active) { background: #eff6ff !important; color: #2563eb !important; border-color: #bfdbfe !important; }
        .pg-active { background: #2563eb !important; color: #fff !important; border-color: #2563eb !important; box-shadow: 0 2px 8px rgba(37,99,235,0.35) !important; }

        .close-btn { transition: all 0.15s; }
        .close-btn:hover { background: #fef2f2 !important; color: #ef4444 !important; border-color: #fca5a5 !important; }

        ::-webkit-scrollbar { width: 5px; }
        ::-webkit-scrollbar-track { background: #f8fafc; }
        ::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
        ::-webkit-scrollbar-thumb:hover { background: #cbd5e1; }
      `}</style>

      {/* Backdrop */}
      <div
        className="cal-root"
        onClick={(e) => e.target === e.currentTarget && onClose()}
        style={{
          position: "fixed", inset: 0, zIndex: 9999,
          display: "flex", alignItems: "center", justifyContent: "center",
          padding: 20,
          background: "rgba(15,23,42,0.4)",
          backdropFilter: "blur(10px)",
        }}
      >
        <div style={{
          width: "100%", maxWidth: 860, maxHeight: "94vh",
          borderRadius: 18, overflow: "hidden",
          display: "flex", flexDirection: "column",
          background: "#f8fafc",
          border: "1px solid #e2e8f0",
          boxShadow: "0 24px 60px -8px rgba(15,23,42,0.20), 0 4px 16px -4px rgba(15,23,42,0.08)",
          animation: "modalDrop 0.32s cubic-bezier(0.22,1,0.36,1) both",
        }}>

          {/* ══ HEADER ══ */}
          <div style={{
            background: "linear-gradient(135deg, #1e40af 0%, #2563eb 60%, #3b82f6 100%)",
            padding: "20px 24px 18px",
            flexShrink: 0,
            position: "relative",
            overflow: "hidden",
          }}>
            {/* Decorative orb */}
            <div style={{
              position: "absolute", top: -30, right: -30,
              width: 120, height: 120, borderRadius: "50%",
              background: "rgba(255,255,255,0.07)", pointerEvents: "none",
            }} />

            {/* Title row */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{
                  width: 42, height: 42, borderRadius: 11, flexShrink: 0,
                  background: "rgba(255,255,255,0.2)",
                  border: "1px solid rgba(255,255,255,0.35)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.12)",
                }}>
                  <Activity size={19} color="white" strokeWidth={2} />
                </div>
                <div>
                  <div style={{ color: "#ffffff", fontWeight: 800, fontSize: 17, letterSpacing: "-0.02em" }}>
                    HR Activity Log
                  </div>
                  <div style={{ color: "rgba(255,255,255,0.6)", fontSize: 11, marginTop: 2, fontWeight: 500 }}>
                    Combined employee status history · live view
                  </div>
                </div>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                {/* <button
                  className="backfill-btn"
                  onClick={handleBackfill}
                  disabled={backfilling}
                  style={{
                    display: "flex", alignItems: "center", gap: 6,
                    padding: "7px 13px", borderRadius: 8, cursor: "pointer",
                    background: "rgba(255,255,255,0.16)",
                    border: "1px solid rgba(255,255,255,0.3)",
                    color: "#ffffff", fontSize: 11, fontWeight: 600, fontFamily: "inherit",
                  }}
                >
                  {backfilling ? <Loader size={12} style={{ animation: "spin 1s linear infinite" }} /> : <DatabaseZap size={12} />}
                  {backfilling ? "Recovering…" : "Recover History"}
                </button> */}

                <button
                  className="hdr-ghost"
                  onClick={fetchAll}
                  disabled={loading}
                  style={{
                    width: 34, height: 34, borderRadius: 8,
                    border: "1px solid rgba(255,255,255,0.28)",
                    background: "rgba(255,255,255,0.14)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    cursor: "pointer", color: "#ffffff",
                  }}
                >
                  <RotateCcw size={13} style={loading ? { animation: "spin 1s linear infinite" } : {}} />
                </button>

                <button
                  className="hdr-ghost"
                  onClick={onClose}
                  style={{
                    width: 34, height: 34, borderRadius: 8,
                    border: "1px solid rgba(255,255,255,0.28)",
                    background: "rgba(255,255,255,0.14)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    cursor: "pointer", color: "#ffffff",
                  }}
                >
                  <X size={14} />
                </button>
              </div>
            </div>

            {/* Backfill message */}
            {backfillMsg && (
              <div style={{
                marginBottom: 14, padding: "9px 13px", borderRadius: 8,
                background: "rgba(255,255,255,0.18)", border: "1px solid rgba(255,255,255,0.3)",
                fontSize: 12, color: "#ffffff", fontWeight: 500,
              }}>
                {backfillMsg}
              </div>
            )}

            {/* No history hint */}
            {!loading && !error && events.length === 0 && (
              <div style={{
                marginBottom: 14, padding: "10px 13px", borderRadius: 8,
                background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.25)",
                fontSize: 12, color: "#ffffff", display: "flex", alignItems: "center", gap: 8, fontWeight: 500,
              }}>
                <DatabaseZap size={13} />
                No history found. Click <strong>Recover History</strong> to auto-backfill from existing employee data.
              </div>
            )}

            {/* Stats */}
            {!loading && !error && events.length > 0 && <StatsBar events={events} />}

            {/* Search + Filters */}
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
              <div style={{ position: "relative", flex: 1, minWidth: 200 }}>
                <Search size={13} color="#94a3b8" style={{ position: "absolute", left: 11, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
                <input
                  className="cal-search"
                  type="text"
                  placeholder="Search name, ID, department, reason…"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  style={{
                    width: "100%", padding: "8px 10px 8px 33px",
                    border: "1px solid #e2e8f0", borderRadius: 8,
                    background: "#ffffff", color: "#1e293b",
                    fontSize: 12, fontFamily: "inherit", boxSizing: "border-box",
                    boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
                    transition: "border-color 0.2s, box-shadow 0.2s",
                  }}
                />
              </div>

              <select className="cal-select" value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={selectStyle}>
                <option value="all">All Statuses</option>
                <option value="active">● Active</option>
                <option value="inactive">● Inactive</option>
                <option value="blacklist">● Blacklisted</option>
                <option value="pending">● Pending</option>
              </select>

              {departments.length > 0 && (
                <select className="cal-select" value={filterDept} onChange={e => setFilterDept(e.target.value)} style={selectStyle}>
                  <option value="all">All Departments</option>
                  {departments.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              )}

              <div style={{
                background: "rgba(255,255,255,0.18)", border: "1px solid rgba(255,255,255,0.3)",
                borderRadius: 8, padding: "8px 12px",
                fontSize: 12, color: "#ffffff", fontWeight: 700,
                whiteSpace: "nowrap", display: "flex", alignItems: "center", gap: 5,
              }}>
                <Zap size={11} /> {filtered.length} events
              </div>

              {!loading && !error && filtered.length > 0 && (
                <DownloadMenu
                  events={filtered}
                  meta={downloadMeta}
                  onDownloadComplete={setDownloadResult}
                />
              )}
            </div>
          </div>

          {/* ══ BODY ══ */}
          <div ref={bodyRef} style={{ flex: 1, overflowY: "auto", background: "#f8fafc" }}>

            {loading && (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 80, gap: 14, textAlign: "center" }}>
                <div style={{
                  width: 52, height: 52, borderRadius: 14,
                  background: "linear-gradient(135deg,#2563eb,#3b82f6)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  boxShadow: "0 8px 24px rgba(37,99,235,0.28)",
                }}>
                  <Loader size={22} color="white" style={{ animation: "spin 1s linear infinite" }} />
                </div>
                <div style={{ fontSize: 14, fontWeight: 700, color: "#334155" }}>Loading activity log…</div>
                <div style={{ fontSize: 12, color: "#94a3b8" }}>Fetching all employee status events</div>
              </div>
            )}

            {!loading && error && (
              <div style={{ margin: 20, padding: 16, borderRadius: 12, background: "#fef2f2", border: "1px solid #fecaca", display: "flex", gap: 12 }}>
                <AlertCircle size={17} color="#dc2626" style={{ flexShrink: 0, marginTop: 1 }} />
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#991b1b" }}>Could not load activity log</div>
                  <div style={{ fontSize: 11, color: "#b91c1c", marginTop: 2 }}>{error}</div>
                  <button onClick={fetchAll} style={{ marginTop: 8, fontSize: 11, fontWeight: 600, color: "#dc2626", background: "none", border: "none", cursor: "pointer", textDecoration: "underline", padding: 0, fontFamily: "inherit" }}>
                    Retry
                  </button>
                </div>
              </div>
            )}

            {!loading && !error && filtered.length === 0 && events.length > 0 && (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 80, gap: 12, textAlign: "center" }}>
                <div style={{ width: 50, height: 50, borderRadius: 14, background: "#f1f5f9", border: "1px solid #e2e8f0", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Search size={22} color="#94a3b8" />
                </div>
                <div style={{ fontSize: 14, fontWeight: 700, color: "#475569" }}>No events found</div>
                <div style={{ fontSize: 12, color: "#94a3b8" }}>Try adjusting your search or filters</div>
              </div>
            )}

            {!loading && !error && paginated.length > 0 && (
              <div style={{
                background: "#ffffff", margin: "12px 12px 0",
                borderRadius: "12px 12px 0 0", overflow: "hidden",
                border: "1px solid #e8ecf4", borderBottom: "none",
                boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
              }}>
                {paginated.map((ev, i) => (
                  <EventRow key={ev.id || `${ev.employee_id}-${i}`} event={ev} index={i} />
                ))}
              </div>
            )}
          </div>

          {/* ══ FOOTER ══ */}
          <div style={{
            flexShrink: 0, padding: "12px 20px",
            background: "#ffffff", borderTop: "1px solid #e8ecf4",
            display: "flex", alignItems: "center",
            justifyContent: "space-between", gap: 12, flexWrap: "wrap",
          }}>

            <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: "#64748b", fontWeight: 500 }}>
              <Users size={12} color="#94a3b8" />
              {filtered.length > 0
                ? <span>Showing <strong style={{ color: "#334155" }}>{start}–{end}</strong> of <strong style={{ color: "#334155" }}>{filtered.length}</strong> events</span>
                : "No results"
              }
            </div>

            {totalPages > 1 && (
              <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
                <button className="pg-btn" disabled={page === 1} onClick={() => goPage(page - 1)}
                  style={{ height: 30, padding: "0 10px", borderRadius: 7, fontSize: 12, fontWeight: 600, fontFamily: "inherit", cursor: "pointer", border: "1px solid #e2e8f0", background: "#f8fafc", color: "#475569", display: "flex", alignItems: "center", gap: 3 }}>
                  <ChevronLeft size={12} /> Prev
                </button>
                {pageNumbers().map(p => (
                  <button key={p} className={`pg-num${p === page ? " pg-active" : ""}`} onClick={() => goPage(p)}
                    style={{ width: 30, height: 30, borderRadius: 7, fontSize: 12, fontWeight: 600, fontFamily: "inherit", cursor: "pointer", border: "1px solid #e2e8f0", background: "#f8fafc", color: "#475569", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    {p}
                  </button>
                ))}
                <button className="pg-btn" disabled={page === totalPages} onClick={() => goPage(page + 1)}
                  style={{ height: 30, padding: "0 10px", borderRadius: 7, fontSize: 12, fontWeight: 600, fontFamily: "inherit", cursor: "pointer", border: "1px solid #e2e8f0", background: "#f8fafc", color: "#475569", display: "flex", alignItems: "center", gap: 3 }}>
                  Next <ChevronRight size={12} />
                </button>
              </div>
            )}

            <button className="close-btn" onClick={onClose}
              style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12, fontWeight: 600, fontFamily: "inherit", color: "#64748b", background: "#f8fafc", border: "1px solid #e2e8f0", padding: "7px 14px", borderRadius: 8, cursor: "pointer" }}>
              <X size={12} /> Close
            </button>
          </div>

        </div>
      </div>

      {downloadResult && (
        <DownloadSuccessModal result={downloadResult} onClose={() => setDownloadResult(null)} />
      )}
    </>
  );
};

export default CombinedActivityLog;