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
  ArrowUpRight,
  ShieldCheck,
  Timer,
  CircleDollarSign,
  TrendingUp,
} from "lucide-react";
import advancePaymentService from "../../../services/advancePaymentService";
import { T, CSS } from "./constants/theme";
import { inr, inrK, sortM } from "./utils/formatters";
import KpiCard from "./components/KpiCard";
import MiniBar from "./components/MiniBar";
import DeptBreakdown from "./components/DeptBreakdown";
import ReqRow from "./components/ReqRow";
import MonthSec from "./components/MonthSec";
import EmpCard from "./components/EmpCard";
import { EmptyState, ErrState, SkeletonRows } from "./components/StateViews";

if (typeof document !== "undefined" && !document.getElementById("ph-fonts")) {
  const l = document.createElement("link");
  l.id = "ph-fonts";
  l.rel = "stylesheet";
  l.href =
    "https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:ital,wght@0,400;0,500;0,600;1,400&family=IBM+Plex+Mono:wght@400;500&display=swap";
  document.head.appendChild(l);
}

// Responsive overrides layered on top of the base CSS string from theme.js.
// Kept separate so the original theme file doesn't need to be touched —
// these rules win on cascade order since they're injected after CSS.
const RESPONSIVE_CSS = `
/* ---------- Tablet (<=900px) ---------- */
@media (max-width: 900px) {
  .ph-overlay { padding: 12px; }
  .ph-card { max-width: 100%; }
  .ph-kpi-grid { grid-template-columns: repeat(2, 1fr); gap: 10px; }
  .ph-tracker-grid { grid-template-columns: repeat(2, 1fr); }
  .ph-tracker-grid > div:nth-child(2) { border-right: none; }
  .ph-toolbar { flex-wrap: wrap; row-gap: 8px; }
  .ph-toolbar > div[style*="flex: 1"] { max-width: 100% !important; flex-basis: 100%; order: 4; }
  .ph-footer { flex-wrap: wrap; row-gap: 8px; }
}

/* ---------- Mobile (<=640px) ---------- */
@media (max-width: 640px) {
  .ph-overlay { padding: 0; align-items: flex-end; }
  .ph-card { max-width: 100%; max-height: 100vh; height: 100%; border-radius: 0; }
  .ph-hdr { padding: 14px 16px; }
  .ph-hdr-row { flex-wrap: wrap; row-gap: 10px; }
  .ph-hdr-title { font-size: 15px !important; }
  .ph-hdr-sub { display: none; }
  .ph-body { padding: 12px; gap: 10px; }
  .ph-kpi-grid { grid-template-columns: repeat(2, 1fr); gap: 8px; }
  .ph-tracker-grid { grid-template-columns: repeat(2, 1fr); }
  .ph-tracker-grid > div { border-right: none !important; border-bottom: 1px solid #EEEEEC; }
  .ph-tracker-grid > div:nth-last-child(-n+2) { border-bottom: none; }
  .ph-toolbar { padding: 10px; }
  .ph-toolbar > div { font-size: 11px; }
  .ph-tab { padding: 6px 9px !important; font-size: 10px !important; }
  .ph-sc { max-height: 160px !important; }
  .ph-footer { padding: 10px 12px; }
  .ph-footer-meta { display: none; }
  .ph-footer button { width: 100%; }
  .ph-footer > div:first-child { width: 100%; justify-content: space-between; }
}

/* ---------- Small mobile (<=400px) ---------- */
@media (max-width: 400px) {
  .ph-kpi-grid { grid-template-columns: 1fr; }
}
`;

export default function PaymentHistory({ onClose }) {
  const [view, setView] = useState("month");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [hrows, setHrows] = useState([]);
  const [reqs, setReqs] = useState([]);
  const [filter, setFilter] = useState("all");
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
  const upcomingAmt = hrows
    .filter((r) => r.deduction_status === "upcoming")
    .reduce((s, r) => s + (Number(r.deduction_amount) || 0), 0);
  const doneDedCount = hrows.filter(
    (r) => r.deduction_status === "done",
  ).length;

  const handleOverlay = (e) => {
    if (e.target === e.currentTarget) onClose?.();
  };

  return (
    <div className="ph-root">
      <style>{CSS}</style>
      <style>{RESPONSIVE_CSS}</style>

      <div className="ph-overlay" onClick={handleOverlay}>
        <div className="ph-card">
          {/* ── HEADER ── */}
          <div className="ph-hdr">
            <div
              className="ph-hdr-row"
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 13, minWidth: 0 }}>
                <div
                  style={{
                    width: 42,
                    height: 42,
                    borderRadius: 12,
                    background: "rgba(255,255,255,.18)",
                    border: "1px solid rgba(255,255,255,.3)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <Wallet size={20} style={{ color: "#fff" }} />
                </div>
                <div style={{ minWidth: 0 }}>
                  <p
                    className="ph-hdr-title"
                    style={{
                      fontSize: 18,
                      fontWeight: 700,
                      color: "#fff",
                      letterSpacing: "-.03em",
                      lineHeight: 1,
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    Salary Advance History
                  </p>
                  <p
                    className="ph-hdr-sub"
                    style={{
                      fontSize: 11,
                      color: "rgba(255,255,255,.58)",
                      marginTop: 4,
                    }}
                  >
                    Advance disbursal &amp; EMI deduction recovery · all
                    employees
                  </p>
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
                <button
                  className="ph-btn"
                  onClick={load}
                  disabled={loading}
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 9,
                    background: "rgba(255,255,255,.12)",
                    border: "1px solid rgba(255,255,255,.2)",
                    color: "#fff",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                  title="Refresh"
                >
                  {loading ? (
                    <Loader2
                      size={14}
                      style={{ animation: "spin 1s linear infinite" }}
                    />
                  ) : (
                    <RefreshCw size={14} />
                  )}
                </button>
                <button
                  className="ph-btn"
                  onClick={onClose}
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 9,
                    background: "rgba(255,255,255,.12)",
                    border: "1px solid rgba(255,255,255,.2)",
                    color: "#fff",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                  title="Close"
                >
                  <X size={16} />
                </button>
              </div>
            </div>
          </div>

          {/* ── BODY ── */}
          <div className="ph-body">
            {/* Error banner */}
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
            <div className="ph-kpi-grid" style={{ flexShrink: 0 }}>
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

            {/* Recovery tracker */}
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
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    padding: "11px 14px",
                    borderBottom: "1px solid #EEEEEC",
                    flexWrap: "wrap",
                  }}
                >
                  <TrendingUp
                    size={14}
                    style={{ color: T.t500, flexShrink: 0 }}
                  />
                  <span
                    style={{ fontSize: 12, fontWeight: 600, color: "#1E1D1C" }}
                  >
                    Recovery Tracker
                  </span>
                  <div style={{ flex: 1, marginLeft: 4, minWidth: 80 }}>
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
                      sub: `${doneDedCount} deductions`,
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
                      v: inr(upcomingAmt),
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
                          fontSize: 17,
                          fontWeight: 700,
                          color: c,
                          fontFamily: "'IBM Plex Mono',monospace",
                          letterSpacing: "-.03em",
                          overflowWrap: "break-word",
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

            {/* Dept breakdown */}
            {!loading && !error && (
              <DeptBreakdown empGroups={empGroups} loading={loading} />
            )}

            {/* Approved requests */}
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
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "11px 14px",
                    borderBottom: "1px solid #E3E3E0",
                    flexWrap: "wrap",
                    rowGap: 6,
                  }}
                >
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
                    <span style={{ fontSize: 10, color: "#888885" }}>
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

            {/* Ledger */}
            <div
              style={{
                background: "#fff",
                borderRadius: 10,
                border: "1px solid #E3E3E0",
                overflow: "hidden",
                flexShrink: 0,
              }}
            >
              {/* Toolbar */}
              <div className="ph-toolbar">
                {/* View tabs */}
                <div
                  style={{
                    display: "flex",
                    background: "#fff",
                    border: "1px solid #CECEC9",
                    borderRadius: 7,
                    padding: 2,
                    gap: 1,
                  }}
                >
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
                          gap: 5,
                          padding: "6px 12px",
                          borderRadius: 5,
                          background: on ? "#111110" : "transparent",
                          color: on ? "#fff" : "#65635F",
                          fontSize: 11,
                          fontWeight: 500,
                          transition: "all .14s",
                          whiteSpace: "nowrap",
                        }}
                      >
                        <Icon size={11} />
                        {label}
                      </button>
                    );
                  })}
                </div>

                {/* Type filter */}
                <div
                  style={{
                    display: "flex",
                    background: "#fff",
                    border: "1px solid #CECEC9",
                    borderRadius: 7,
                    padding: 2,
                    gap: 1,
                  }}
                >
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
                          whiteSpace: "nowrap",
                        }}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>

                {/* Search */}
                <div style={{ position: "relative", flex: 1, maxWidth: 260, minWidth: 140 }}>
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
                  <span
                    style={{
                      fontSize: 10,
                      color: "#888885",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {filtered.length} event{filtered.length !== 1 ? "s" : ""}
                    {search && <em> · "{search}"</em>}
                  </span>
                )}
              </div>

              {/* Ledger content */}
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
                <div style={{ padding: "10px", background: "#F2F2F0" }}>
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

          {/* ── FOOTER ── */}
          <div className="ph-footer">
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
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
                    whiteSpace: "nowrap",
                  }}
                >
                  {filtered.length} event{filtered.length !== 1 ? "s" : ""}
                  {search && <em> · "{search}"</em>}
                </span>
              </div>
              <span
                className="ph-footer-meta"
                style={{
                  width: 1,
                  height: 14,
                  background: "#E3E3E0",
                  display: "block",
                }}
              />
              <span className="ph-footer-meta" style={{ fontSize: 11, color: "#ADADAA" }}>
                {uniqueEmps} employees · {reqs.length} requests · refreshed{" "}
                {new Date().toLocaleTimeString("en-IN", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            </div>
            <button
              className="ph-btn"
              onClick={onClose}
              style={{
                padding: "7px 24px",
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
    </div>
  );
}