// ─────────────────────────────────────────────────────────────────────────────
// FILE: src/Ui/AdvancePayment/AdvancePaymentDashboard.jsx
// ─────────────────────────────────────────────────────────────────────────────
import { useState, useEffect, useCallback } from "react";
import {
  CheckCircle2, Clock, Eye, FileText,
  XCircle, Search, Users, TrendingUp, RefreshCw,
} from "lucide-react";

import advancePaymentService from "../../services/advancePaymentService";
import GenerateLinkModal  from "./GenerateLink";
import AddRequestModal    from "./AddRequest";
import ViewDetailModal    from "./ViewDetail";
import RejectReasonModal  from "./RejectReasonModal";   // ← NEW

// ─── Helpers ──────────────────────────────────────────────────────────────────
const fmt = (n) => `₹${Number(n).toLocaleString("en-IN")}`;

const statusColors = {
  pending:  { bg: "bg-amber-50",   text: "text-amber-700",   ring: "ring-amber-200",   dot: "bg-amber-400"   },
  approved: { bg: "bg-emerald-50", text: "text-emerald-700", ring: "ring-emerald-200", dot: "bg-emerald-400" },
  rejected: { bg: "bg-red-50",     text: "text-red-700",     ring: "ring-red-200",     dot: "bg-red-400"     },
};

// ─── Badge ────────────────────────────────────────────────────────────────────
function Badge({ status }) {
  const c = statusColors[status] || statusColors.pending;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ring-1 ${c.bg} ${c.text} ${c.ring}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${c.dot}`} />
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}

// ─── Stat Card ────────────────────────────────────────────────────────────────
function StatCard({ icon: Icon, label, value, subText, subColor, iconBg, iconColor, loading }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 flex flex-col gap-3 hover:shadow-md transition-shadow">
      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${iconBg}`}>
        <Icon size={22} className={iconColor} />
      </div>
      <div>
        <p className="text-2xl font-bold text-slate-800">
          {loading ? <span className="inline-block w-16 h-7 bg-slate-100 rounded animate-pulse" /> : value}
        </p>
        <p className="text-sm font-medium text-slate-600 mt-0.5">{label}</p>
        {subText && <p className={`text-xs mt-0.5 ${subColor}`}>{subText}</p>}
      </div>
    </div>
  );
}

// ─── Empty State ──────────────────────────────────────────────────────────────
function EmptyState({ message = "No requests found" }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center mb-3">
        <FileText size={24} className="text-slate-400" />
      </div>
      <p className="text-slate-600 font-semibold">{message}</p>
      <p className="text-slate-400 text-sm mt-1">Try adjusting your search</p>
    </div>
  );
}

// ─── Skeleton row ─────────────────────────────────────────────────────────────
function SkeletonRow() {
  return (
    <tr className="border-b border-slate-50">
      {Array.from({ length: 9 }).map((_, i) => (
        <td key={i} className="px-5 py-4">
          <div className="h-4 bg-slate-100 rounded animate-pulse" />
        </td>
      ))}
    </tr>
  );
}

// ─── Request Table ────────────────────────────────────────────────────────────
function RequestTable({ rows, onView, onApprove, onReject, showActions, showAdjusted, loading }) {
  if (!loading && !rows.length) return <EmptyState />;

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-100 bg-slate-50/60">
            {[
              "Request ID", "Employee", "Department", "Amount",
              "Date", "Reason",
              showAdjusted ? "Adjusted In" : "Proof",
              "Status", "Actions",
            ].map((h) => (
              <th key={h} className="text-left px-5 py-3.5 text-xs font-semibold text-slate-400 uppercase tracking-wide whitespace-nowrap">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {loading
            ? Array.from({ length: 4 }).map((_, i) => <SkeletonRow key={i} />)
            : rows.map((r) => (
              <tr key={r.id} className="border-b border-slate-50 hover:bg-slate-50/70 transition-colors">

                {/* Request Code */}
                <td className="px-5 py-4 font-mono text-xs font-bold text-slate-500 whitespace-nowrap">
                  {r.request_code}
                </td>

                {/* Employee */}
                <td className="px-5 py-4">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-xs font-bold text-indigo-600 shrink-0">
                      {r.emp_name.split(" ").map((n) => n[0]).slice(0, 2).join("")}
                    </div>
                    <div>
                      <p className="font-semibold text-slate-800 whitespace-nowrap">{r.emp_name}</p>
                      <p className="text-xs text-slate-400">{r.emp_id}</p>
                    </div>
                  </div>
                </td>

                <td className="px-5 py-4 text-slate-600 whitespace-nowrap">{r.emp_dept}</td>
                <td className="px-5 py-4 font-bold text-slate-800 whitespace-nowrap">{fmt(r.amount)}</td>
                <td className="px-5 py-4 text-slate-500 whitespace-nowrap">{r.request_date?.slice(0, 10)}</td>

                {/* Reason */}
                <td className="px-5 py-4 text-slate-600 max-w-[160px]">
                  <span className="truncate block" title={r.reason}>{r.reason}</span>
                </td>

                {/* Proof / Adjusted */}
                <td className="px-5 py-4">
                  {showAdjusted
                    ? <span className="text-xs bg-blue-50 text-blue-700 px-2.5 py-1 rounded-lg font-semibold">{r.adjusted_in || "—"}</span>
                    : r.attachments?.find(a => a.role === "screenshot")
                      ? <button className="flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-800 font-medium transition-colors">
                          <FileText size={13} />Screenshot
                        </button>
                      : <span className="text-slate-300 text-xs">—</span>
                  }
                </td>

                <td className="px-5 py-4"><Badge status={r.status} /></td>

                {/* Actions */}
                <td className="px-5 py-4">
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => onView(r)}
                      className="p-1.5 rounded-lg hover:bg-indigo-50 text-slate-400 hover:text-indigo-600 transition-colors"
                      title="View Details"
                    >
                      <Eye size={15} />
                    </button>
                    {showActions && r.status === "pending" && (
                      <>
                        <button
                          onClick={() => onApprove(r.id)}
                          className="p-1.5 rounded-lg hover:bg-emerald-50 text-slate-400 hover:text-emerald-600 transition-colors"
                          title="Approve"
                        >
                          <CheckCircle2 size={15} />
                        </button>
                        {/* Pass full row object to onReject */}
                        <button
                          onClick={() => onReject(r)}
                          className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors"
                          title="Reject"
                        >
                          <XCircle size={15} />
                        </button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))
          }
        </tbody>
      </table>
    </div>
  );
}

// ─── Main Dashboard ───────────────────────────────────────────────────────────
export default function AdvancePaymentDashboard() {
  const [activeTab,  setActiveTab]  = useState("pending");
  const [search,     setSearch]     = useState("");
  const [viewedReq,  setViewedReq]  = useState(null);

  // ── Reject modal state ─────────────────────────────────────────────────────
  const [rejectTarget,  setRejectTarget]  = useState(null);  // full request object
  const [rejectLoading, setRejectLoading] = useState(false);

  // ── API state ──────────────────────────────────────────────────────────────
  const [stats,        setStats]        = useState(null);
  const [requests,     setRequests]     = useState([]);
  const [loadingStats, setLoadingStats] = useState(true);
  const [loadingReqs,  setLoadingReqs]  = useState(true);
  const [error,        setError]        = useState(null);

  // ── Fetch stats ────────────────────────────────────────────────────────────
  const fetchStats = useCallback(async () => {
    try {
      setLoadingStats(true);
      const res = await advancePaymentService.getStats();
      setStats(res.data);
    } catch (err) {
      console.error("fetchStats:", err.message);
    } finally {
      setLoadingStats(false);
    }
  }, []);

  // ── Fetch requests ─────────────────────────────────────────────────────────
  const fetchRequests = useCallback(async () => {
    try {
      setLoadingReqs(true);
      setError(null);
      const res = await advancePaymentService.listRequests({
        status: activeTab,
        search: search || undefined,
        limit:  50,
      });
      setRequests(res.data || []);
    } catch (err) {
      console.error("fetchRequests:", err.message);
      setError("Failed to load requests. Please try again.");
    } finally {
      setLoadingReqs(false);
    }
  }, [activeTab, search]);

  useEffect(() => { fetchStats(); }, [fetchStats]);
  useEffect(() => {
    const t = setTimeout(fetchRequests, search ? 400 : 0);
    return () => clearTimeout(t);
  }, [fetchRequests]);

  // ── Approve ────────────────────────────────────────────────────────────────
  const approve = async (id) => {
    try {
      await advancePaymentService.approveRequest(id);
      await Promise.all([fetchStats(), fetchRequests()]);
      setViewedReq(null);
      setActiveTab("approved");
    } catch (err) {
      alert(err.message || "Failed to approve");
    }
  };

  // ── Reject (called by RejectReasonModal with id + reason) ─────────────────
  const reject = async (id, reason) => {
    try {
      setRejectLoading(true);
      await advancePaymentService.rejectRequest(id, reason);
      await Promise.all([fetchStats(), fetchRequests()]);
      setRejectTarget(null);
      setViewedReq(null);
      setActiveTab("rejected");
    } catch (err) {
      alert(err.message || "Failed to reject");
    } finally {
      setRejectLoading(false);
    }
  };

  // Called by AddRequestModal after a successful submit
  const handleNewRequest = async () => {
    await Promise.all([fetchStats(), fetchRequests()]);
  };

  return (
    <div className="space-y-5">

      {/* ── Stat Cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={Users}        label="Total Requests"
          value={stats?.total ?? 0}
          subText="All registered"    subColor="text-indigo-500"
          iconBg="bg-indigo-100"      iconColor="text-indigo-500"
          loading={loadingStats}
        />
        <StatCard
          icon={Clock}        label="Pending"
          value={stats?.pending ?? 0}
          subText="Awaiting approval"  subColor="text-amber-500"
          iconBg="bg-amber-100"        iconColor="text-amber-500"
          loading={loadingStats}
        />
        <StatCard
          icon={CheckCircle2} label="Approved"
          value={stats?.approved ?? 0}
          subText="Currently approved" subColor="text-emerald-500"
          iconBg="bg-emerald-100"      iconColor="text-emerald-500"
          loading={loadingStats}
        />
        <StatCard
          icon={TrendingUp}   label="Total Approved Amt"
          value={fmt(stats?.total_approved_amount ?? 0)}
          subText="This period"        subColor="text-blue-500"
          iconBg="bg-blue-100"         iconColor="text-blue-500"
          loading={loadingStats}
        />
      </div>

      {/* ── Requests Panel ── */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm">

        {/* Top bar */}
        <div className="px-5 py-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
          <div className="flex bg-slate-100 rounded-xl p-1 gap-1 w-fit">
            {[
              { key: "pending",  label: "Pending",  count: stats?.pending  ?? 0 },
              { key: "approved", label: "Approved", count: stats?.approved ?? 0 },
              { key: "rejected", label: "Rejected", count: stats?.rejected ?? 0 },
            ].map((t) => (
              <button
                key={t.key}
                onClick={() => setActiveTab(t.key)}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold transition-all whitespace-nowrap ${
                  activeTab === t.key
                    ? "bg-white text-slate-800 shadow-sm"
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                {t.label}
                <span className={`text-xs px-1.5 py-0.5 rounded-full font-bold ${
                  activeTab === t.key ? "bg-indigo-100 text-indigo-700" : "bg-slate-200 text-slate-500"
                }`}>
                  {t.count}
                </span>
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => { fetchStats(); fetchRequests(); }}
              className="p-2 rounded-xl border border-slate-200 text-slate-400 hover:text-indigo-600 hover:border-indigo-200 transition-colors"
              title="Refresh"
            >
              <RefreshCw size={15} />
            </button>
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                placeholder="Search name or ID..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-xl bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-200 w-56"
              />
            </div>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="px-5 py-3 bg-red-50 border-b border-red-100 text-sm text-red-600">
            {error}
          </div>
        )}

        {/* Table — note: onReject now receives the full row object */}
        <RequestTable
          rows={requests}
          loading={loadingReqs}
          onView={setViewedReq}
          onApprove={approve}
          onReject={setRejectTarget}       // ← pass full row, not just id
          showActions={activeTab === "pending"}
          showAdjusted={activeTab === "approved"}
        />
      </div>

      {/* ── ViewDetailModal ── */}
      {viewedReq && (
        <ViewDetailModal
          req={viewedReq}
          onClose={() => setViewedReq(null)}
          onApprove={approve}
          onReject={(req) => setRejectTarget(req ?? viewedReq)}  // ← opens RejectReasonModal
        />
      )}

      {/* ── RejectReasonModal ── */}
      {rejectTarget && (
        <RejectReasonModal
          request={rejectTarget}
          onConfirm={reject}
          onClose={() => setRejectTarget(null)}
          loading={rejectLoading}
        />
      )}
    </div>
  );
}

export { GenerateLinkModal, AddRequestModal, ViewDetailModal };