// ─────────────────────────────────────────────────────────────────────────────
// FILE: src/Ui/Payroll/CarryForwardPanel.jsx
//
// PURPOSE:
//   Shows carry-forward status per employee for a given payroll month.
//   Appears as a collapsible panel inside PayrollTable or as a standalone modal.
//
//   Features:
//   • Lists all advance deductions that were carried forward (rolled over)
//   • Shows which month they moved TO
//   • Carry-forward count (how many times rolled)
//   • Status badge: original / carried-once / carried-multiple
//   • Full timeline of carry-forward history per request
// ─────────────────────────────────────────────────────────────────────────────

import React, { useState, useEffect, useCallback } from "react";
import payrollService from "../../services/payrollService";

// ── Helpers ───────────────────────────────────────────────────────────────────
function fmtINR(val) {
  return "₹" + Number(val || 0).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function nextMonthLabel(label) {
  const MONTHS = [
    "January","February","March","April","May","June",
    "July","August","September","October","November","December",
  ];
  if (!label) return null;
  const parts = label.trim().split(/\s+/);
  if (parts.length < 2) return null;
  const monthIdx = MONTHS.findIndex(m => m.toLowerCase() === parts[0].toLowerCase());
  if (monthIdx < 0) return null;
  const year = parseInt(parts[1], 10);
  if (isNaN(year)) return null;
  return monthIdx === 11 ? `January ${year + 1}` : `${MONTHS[monthIdx + 1]} ${year}`;
}

// ── Sub-components ────────────────────────────────────────────────────────────

const CarryBadge = ({ count }) => {
  if (!count || count === 0) return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-500 border border-slate-200">
      Original
    </span>
  );
  if (count === 1) return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
      ↻ Carried ×1
    </span>
  );
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-50 text-red-600 border border-red-200">
      ↻ Carried ×{count}
    </span>
  );
};

const TypePill = ({ label, color = "#6366f1" }) => (
  <span
    className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-semibold"
    style={{
      background: color + "18",
      color,
      border: `1px solid ${color}30`,
    }}
  >
    {label}
  </span>
);

// ── Timeline Item ──────────────────────────────────────────────────────────────
const TimelineItem = ({ item, isLast }) => (
  <div className="flex gap-3">
    <div className="flex flex-col items-center">
      <div
        className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
        style={{ background: "#1a3c6e" }}
      >
        {item.carry_forward_count || "O"}
      </div>
      {!isLast && <div className="w-0.5 flex-1 bg-slate-100 mt-1" />}
    </div>
    <div className={`pb-4 ${isLast ? "" : ""}`}>
      <p className="text-[12px] font-semibold text-slate-700">
        {item.from_month}
        <span className="mx-1.5 text-slate-400">→</span>
        <span className="text-indigo-600">{item.to_month}</span>
      </p>
      <p className="text-[11px] text-slate-500 mt-0.5">
        {fmtINR(item.amount)} · {item.payment_type_label}
        {item.triggered_by_name && (
          <span className="ml-1.5 text-slate-400">by {item.triggered_by_name}</span>
        )}
      </p>
      <p className="text-[10px] text-slate-400 mt-0.5">
        {new Date(item.created_at).toLocaleDateString("en-IN", {
          day: "2-digit", month: "short", year: "numeric",
          hour: "2-digit", minute: "2-digit",
        })}
      </p>
    </div>
  </div>
);

// ── Main Panel ─────────────────────────────────────────────────────────────────
export default function CarryForwardPanel({ forMonth, employeeId, employeeName, onClose }) {
  const [logs,    setLogs]    = useState([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);
  const [expanded, setExpanded] = useState({});

  const fetchLogs = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await payrollService.getCarryForwardLog({
        emp_id: employeeId,
        month:  forMonth,
      });
      setLogs(res.data || []);
    } catch (err) {
      setError(err.message || "Failed to load carry-forward history");
    } finally {
      setLoading(false);
    }
  }, [employeeId, forMonth]);

  useEffect(() => { fetchLogs(); }, [fetchLogs]);

  const grouped = logs.reduce((acc, item) => {
    const key = item.request_code;
    if (!acc[key]) acc[key] = [];
    acc[key].push(item);
    return acc;
  }, {});

  const totalCarried    = logs.reduce((s, l) => s + Number(l.amount), 0);
  const uniqueRequests  = Object.keys(grouped).length;
  const nextMonth       = nextMonthLabel(forMonth);

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col"
        style={{ maxHeight: "88vh" }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-6 py-5 flex-shrink-0"
          style={{
            background: "linear-gradient(135deg, #1a3c6e 0%, #2563eb 100%)",
          }}
        >
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center text-lg"
              style={{ background: "rgba(255,255,255,0.15)" }}
            >
              ↻
            </div>
            <div>
              <p className="text-white font-bold text-[15px]">Carry-Forward History</p>
              <p className="text-blue-200 text-[12px]">
                {employeeName} · {forMonth}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-white/70 hover:text-white hover:bg-white/10 transition-colors text-sm"
          >
            ✕
          </button>
        </div>

        {/* Summary strip */}
        {!loading && logs.length > 0 && (
          <div className="px-6 py-3 border-b border-slate-100 grid grid-cols-3 gap-4 bg-amber-50">
            <div>
              <p className="text-[10px] uppercase tracking-widest text-amber-500 font-semibold">
                Carried Forward
              </p>
              <p className="text-[18px] font-bold text-amber-700 mt-0.5">{fmtINR(totalCarried)}</p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-widest text-amber-500 font-semibold">
                Requests Affected
              </p>
              <p className="text-[18px] font-bold text-amber-700 mt-0.5">{uniqueRequests}</p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-widest text-amber-500 font-semibold">
                Moved To
              </p>
              <p className="text-[15px] font-bold text-amber-700 mt-0.5">{nextMonth}</p>
            </div>
          </div>
        )}

        {/* Explanation banner */}
        <div className="px-6 py-3 bg-blue-50 border-b border-blue-100 flex gap-2 items-start">
          <span className="text-blue-500 text-sm mt-0.5">ℹ️</span>
          <p className="text-[11px] text-blue-700 leading-relaxed">
            When a salary is marked <strong>Paid</strong> and an advance deduction is still
            pending for that month, it is automatically <strong>carried forward</strong> to the
            next month. This ensures no recovery is lost. The deduction appears automatically
            in {nextMonth || "the next month"}'s payroll.
          </p>
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1 px-6 py-5">
          {loading && (
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-20 bg-slate-50 rounded-xl animate-pulse" />
              ))}
            </div>
          )}

          {!loading && error && (
            <div className="py-10 text-center">
              <p className="text-red-500 text-sm">{error}</p>
              <button
                onClick={fetchLogs}
                className="mt-3 px-4 py-2 text-sm text-indigo-600 border border-indigo-200 rounded-xl hover:bg-indigo-50"
              >
                Retry
              </button>
            </div>
          )}

          {!loading && !error && logs.length === 0 && (
            <div className="py-16 text-center">
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4 text-2xl"
                style={{ background: "#f0f4fa" }}
              >
                ✓
              </div>
              <p className="text-slate-600 font-semibold">No Carry-Forwards</p>
              <p className="text-slate-400 text-sm mt-1">
                All advance deductions were processed on time in {forMonth}.
              </p>
            </div>
          )}

          {!loading && !error && Object.entries(grouped).map(([requestCode, items]) => {
            const isOpen = expanded[requestCode];
            const latest = items[0];
            return (
              <div key={requestCode} className="mb-4 border border-slate-100 rounded-xl overflow-hidden shadow-sm">
                {/* Request header row */}
                <button
                  onClick={() => setExpanded(prev => ({ ...prev, [requestCode]: !isOpen }))}
                  className="w-full flex items-center justify-between px-4 py-3.5 bg-slate-50 hover:bg-slate-100 transition-colors text-left"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold"
                      style={{ background: latest.payment_type_color || "#6366f1" }}
                    >
                      ↻
                    </div>
                    <div>
                      <p className="text-[13px] font-semibold text-slate-800">
                        {requestCode}
                      </p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <TypePill
                          label={latest.payment_type_label}
                          color={latest.payment_type_color}
                        />
                        <CarryBadge count={latest.carry_forward_count} />
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p className="text-[12px] font-bold text-amber-600">
                        {fmtINR(items.reduce((s, i) => s + Number(i.amount), 0))}
                      </p>
                      <p className="text-[10px] text-slate-400">{items.length} roll{items.length > 1 ? "s" : ""}</p>
                    </div>
                    <svg
                      className={`w-4 h-4 text-slate-400 transition-transform ${isOpen ? "rotate-180" : ""}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </button>

                {/* Timeline */}
                {isOpen && (
                  <div className="px-5 py-4 border-t border-slate-100 bg-white">
                    <p className="text-[10px] uppercase tracking-widest text-slate-400 font-semibold mb-3">
                      Roll-over timeline
                    </p>
                    {items.map((item, idx) => (
                      <TimelineItem
                        key={item.id}
                        item={item}
                        isLast={idx === items.length - 1}
                      />
                    ))}
                    {/* Next-month outcome */}
                    <div className="flex gap-3 mt-1">
                      <div className="flex flex-col items-center">
                        <div className="w-7 h-7 rounded-full flex items-center justify-center text-emerald-600 text-xs font-bold border-2 border-emerald-300 bg-emerald-50 flex-shrink-0">
                          ✓
                        </div>
                      </div>
                      <div>
                        <p className="text-[12px] font-semibold text-emerald-700">
                          Pending in {items[0].to_month}
                        </p>
                        <p className="text-[11px] text-slate-500">
                          Will deduct from salary automatically
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between flex-shrink-0 bg-slate-50">
          <p className="text-[11px] text-slate-400">
            Carry-forwards auto-appear in next month's payroll
          </p>
          <button
            onClick={onClose}
            className="px-5 py-2 text-sm font-semibold text-white rounded-xl"
            style={{ background: "#1a3c6e" }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}