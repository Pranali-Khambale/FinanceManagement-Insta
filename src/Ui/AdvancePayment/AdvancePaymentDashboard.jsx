import { useState, useEffect, useCallback } from "react";
import {
  CheckCircle2,
  Clock,
  Eye,
  FileText,
  XCircle,
  Search,
  Users,
  TrendingUp,
  RefreshCw,
} from "lucide-react";

import advancePaymentService from "../../services/advancePaymentService";
import GenerateLinkModal from "./GenerateLink";
import AddRequestModal from "./AddRequestModal";
import ViewDetailModal from "./ViewDetailModal";
import RejectReasonModal from "./RejectReasonModal";

const fmt = (n) => `₹${Number(n).toLocaleString("en-IN")}`;

const statusColors = {
  pending: {
    bg: "bg-amber-50",
    text: "text-amber-700",
    ring: "ring-amber-200",
    dot: "bg-amber-400",
  },
  approved: {
    bg: "bg-emerald-50",
    text: "text-emerald-700",
    ring: "ring-emerald-200",
    dot: "bg-emerald-400",
  },
  rejected: {
    bg: "bg-red-50",
    text: "text-red-700",
    ring: "ring-red-200",
    dot: "bg-red-400",
  },
};

// Column visibility by breakpoint:
//   Request ID   -> sm+
//   Employee     -> always
//   Department   -> md+
//   Amount       -> always
//   Date         -> sm+
//   Reason       -> lg+
//   Proof/Adj.   -> md+
//   Status       -> always
//   Actions      -> always
const columnVisibility = [
  "hidden sm:table-cell", // Request ID
  "", // Employee
  "hidden md:table-cell", // Department
  "", // Amount
  "hidden sm:table-cell", // Date
  "hidden lg:table-cell", // Reason
  "hidden md:table-cell", // Proof / Adjusted
  "", // Status
  "", // Actions
];

function Badge({ status }) {
  const c = statusColors[status] || statusColors.pending;
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full text-xs font-semibold ring-1 ${c.bg} ${c.text} ${c.ring}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${c.dot}`} />
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  subText,
  subColor,
  iconBg,
  iconColor,
  loading,
}) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-3 sm:p-5 flex flex-col gap-2 sm:gap-3 hover:shadow-md transition-shadow">
      <div
        className={`w-9 h-9 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl flex items-center justify-center flex-shrink-0 ${iconBg}`}
      >
        <Icon size={18} className={`sm:hidden ${iconColor}`} />
        <Icon size={22} className={`hidden sm:block ${iconColor}`} />
      </div>
      <div className="min-w-0">
        <p className="text-lg sm:text-2xl font-bold text-slate-800 truncate">
          {loading ? (
            <span className="inline-block w-14 h-5 sm:h-7 bg-slate-100 rounded animate-pulse" />
          ) : (
            value
          )}
        </p>
        <p className="text-[11px] sm:text-sm font-medium text-slate-600 mt-0.5 truncate">
          {label}
        </p>
        {subText && (
          <p className={`text-[10px] sm:text-xs mt-0.5 truncate ${subColor}`}>
            {subText}
          </p>
        )}
      </div>
    </div>
  );
}

function EmptyState({ message = "No requests found" }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 sm:py-16 text-center px-4">
      <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-slate-100 flex items-center justify-center mb-3">
        <FileText size={22} className="text-slate-400" />
      </div>
      <p className="text-slate-600 font-semibold text-sm sm:text-base">
        {message}
      </p>
      <p className="text-slate-400 text-xs sm:text-sm mt-1">
        Try adjusting your search
      </p>
    </div>
  );
}

function SkeletonRow() {
  return (
    <tr className="border-b border-slate-50">
      {Array.from({ length: 9 }).map((_, i) => (
        <td
          key={i}
          className={`px-3 sm:px-5 py-3 sm:py-4 ${columnVisibility[i]}`}
        >
          <div className="h-4 bg-slate-100 rounded animate-pulse" />
        </td>
      ))}
    </tr>
  );
}

function RequestTable({
  rows,
  onView,
  onApprove,
  onReject,
  showActions,
  showAdjusted,
  loading,
}) {
  if (!loading && !rows.length) return <EmptyState />;

  const headers = [
    "Request ID",
    "Employee",
    "Department",
    "Amount",
    "Date",
    "Reason",
    showAdjusted ? "Adjusted In" : "Proof",
    "Status",
    "Actions",
  ];

  return (
    <div className="overflow-x-auto -webkit-overflow-scrolling-touch">
      <table className="w-full text-sm min-w-[340px]">
        <thead>
          <tr className="border-b border-slate-100 bg-slate-50/60">
            {headers.map((h, i) => (
              <th
                key={h}
                className={`text-left px-3 sm:px-5 py-2.5 sm:py-3.5 text-[10px] sm:text-xs font-semibold text-slate-400 uppercase tracking-wide whitespace-nowrap ${columnVisibility[i]}`}
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {loading
            ? Array.from({ length: 4 }).map((_, i) => <SkeletonRow key={i} />)
            : rows.map((r) => {
                const empName = r.emp_name || "";
                const initials = empName
                  ? empName
                      .split(" ")
                      .map((n) => n[0])
                      .filter(Boolean)
                      .slice(0, 2)
                      .join("")
                  : "?";

                return (
                  <tr
                    key={r.id}
                    className="border-b border-slate-50 hover:bg-slate-50/70 transition-colors"
                  >
                    {/* Request ID */}
                    <td
                      className={`px-3 sm:px-5 py-3 sm:py-4 font-mono text-[10px] sm:text-xs font-bold text-slate-500 whitespace-nowrap ${columnVisibility[0]}`}
                    >
                      {r.request_code}
                    </td>

                    {/* Employee */}
                    <td className="px-3 sm:px-5 py-3 sm:py-4">
                      <div className="flex items-center gap-2 sm:gap-2.5">
                        <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-indigo-100 flex items-center justify-center text-[10px] sm:text-xs font-bold text-indigo-600 flex-shrink-0">
                          {initials}
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-slate-800 text-xs sm:text-sm whitespace-nowrap truncate max-w-[90px] sm:max-w-[140px]">
                            {empName || "—"}
                          </p>
                          <p className="text-[10px] sm:text-xs text-slate-400">
                            {r.emp_id}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Department */}
                    <td
                      className={`px-3 sm:px-5 py-3 sm:py-4 text-xs sm:text-sm text-slate-600 whitespace-nowrap ${columnVisibility[2]}`}
                    >
                      {r.emp_dept}
                    </td>

                    {/* Amount */}
                    <td className="px-3 sm:px-5 py-3 sm:py-4 font-bold text-xs sm:text-sm text-slate-800 whitespace-nowrap">
                      {fmt(r.amount)}
                    </td>

                    {/* Date */}
                    <td
                      className={`px-3 sm:px-5 py-3 sm:py-4 text-xs sm:text-sm text-slate-500 whitespace-nowrap ${columnVisibility[4]}`}
                    >
                      {r.request_date?.slice(0, 10)}
                    </td>

                    {/* Reason */}
                    <td
                      className={`px-3 sm:px-5 py-3 sm:py-4 text-slate-600 max-w-[160px] ${columnVisibility[5]}`}
                    >
                      <span
                        className="truncate block text-xs sm:text-sm"
                        title={r.reason}
                      >
                        {r.reason}
                      </span>
                    </td>

                    {/* Proof / Adjusted */}
                    <td
                      className={`px-3 sm:px-5 py-3 sm:py-4 ${columnVisibility[6]}`}
                    >
                      {showAdjusted ? (
                        <span className="text-[10px] sm:text-xs bg-blue-50 text-blue-700 px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-lg font-semibold">
                          {r.adjusted_in || "—"}
                        </span>
                      ) : r.attachments?.find(
                          (a) => a.role === "screenshot",
                        ) ? (
                        <button className="flex items-center gap-1 sm:gap-1.5 text-[10px] sm:text-xs text-blue-600 hover:text-blue-800 font-medium transition-colors">
                          <FileText size={12} />
                          Screenshot
                        </button>
                      ) : (
                        <span className="text-slate-300 text-xs">—</span>
                      )}
                    </td>

                    {/* Status */}
                    <td className="px-3 sm:px-5 py-3 sm:py-4">
                      <Badge status={r.status} />
                    </td>

                    {/* Actions */}
                    <td className="px-3 sm:px-5 py-3 sm:py-4">
                      <div className="flex items-center gap-0.5 sm:gap-1">
                        <button
                          onClick={() => onView(r)}
                          className="p-2 sm:p-1.5 rounded-lg hover:bg-indigo-50 text-slate-400 hover:text-indigo-600 transition-colors"
                          title="View Details"
                        >
                          <Eye size={15} />
                        </button>
                        {showActions && r.status === "pending" && (
                          <>
                            <button
                              onClick={() => onApprove(r.id)}
                              className="p-2 sm:p-1.5 rounded-lg hover:bg-emerald-50 text-slate-400 hover:text-emerald-600 transition-colors"
                              title="Approve"
                            >
                              <CheckCircle2 size={15} />
                            </button>
                            <button
                              onClick={() => onReject(r)}
                              className="p-2 sm:p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors"
                              title="Reject"
                            >
                              <XCircle size={15} />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
        </tbody>
      </table>
    </div>
  );
}

export default function AdvancePaymentDashboard() {
  const [activeTab, setActiveTab] = useState("pending");
  const [search, setSearch] = useState("");
  const [viewedReq, setViewedReq] = useState(null);
  const [rejectTarget, setRejectTarget] = useState(null);
  const [rejectLoading, setRejectLoading] = useState(false);
  const [stats, setStats] = useState(null);
  const [requests, setRequests] = useState([]);
  const [loadingStats, setLoadingStats] = useState(true);
  const [loadingReqs, setLoadingReqs] = useState(true);
  const [error, setError] = useState(null);

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

  const fetchRequests = useCallback(async () => {
    try {
      setLoadingReqs(true);
      setError(null);
      const res = await advancePaymentService.listRequests({
        status: activeTab,
        search: search || undefined,
        limit: 50,
      });
      setRequests(res.data || []);
    } catch (err) {
      console.error("fetchRequests:", err.message);
      setError("Failed to load requests. Please try again.");
    } finally {
      setLoadingReqs(false);
    }
  }, [activeTab, search]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  useEffect(() => {
    const t = setTimeout(fetchRequests, search ? 400 : 0);
    return () => clearTimeout(t);
  }, [fetchRequests]);

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

  const handleNewRequest = async () => {
    await Promise.all([fetchStats(), fetchRequests()]);
  };

  const tabs = [
    { key: "pending", label: "Pending", count: stats?.pending ?? 0 },
    { key: "approved", label: "Approved", count: stats?.approved ?? 0 },
    { key: "rejected", label: "Rejected", count: stats?.rejected ?? 0 },
  ];

  return (
    <div className="space-y-3 sm:space-y-5">
      {/* ── Stats grid: 2-col on mobile, 4-col on lg ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4">
        <StatCard
          icon={Users}
          label="Total Requests"
          value={stats?.total ?? 0}
          subText="All registered"
          subColor="text-indigo-500"
          iconBg="bg-indigo-100"
          iconColor="text-indigo-500"
          loading={loadingStats}
        />
        <StatCard
          icon={Clock}
          label="Pending"
          value={stats?.pending ?? 0}
          subText="Awaiting approval"
          subColor="text-amber-500"
          iconBg="bg-amber-100"
          iconColor="text-amber-500"
          loading={loadingStats}
        />
        <StatCard
          icon={CheckCircle2}
          label="Approved"
          value={stats?.approved ?? 0}
          subText="Currently approved"
          subColor="text-emerald-500"
          iconBg="bg-emerald-100"
          iconColor="text-emerald-500"
          loading={loadingStats}
        />
        <StatCard
          icon={TrendingUp}
          label="Total Approved Amt"
          value={fmt(stats?.total_approved_amount ?? 0)}
          subText="This period"
          subColor="text-blue-500"
          iconBg="bg-blue-100"
          iconColor="text-blue-500"
          loading={loadingStats}
        />
      </div>

      {/* ── Main card ── */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm">
        {/* Card header */}
        <div className="px-3 sm:px-5 py-3 sm:py-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center gap-3 sm:justify-between">
          {/* Tab bar — scrollable on very narrow screens */}
          <div className="overflow-x-auto -mx-1 px-1 pb-0.5 sm:overflow-visible sm:mx-0 sm:px-0 sm:pb-0">
            <div className="flex bg-slate-100 rounded-xl p-1 gap-1 w-fit min-w-0">
              {tabs.map((t) => (
                <button
                  key={t.key}
                  onClick={() => setActiveTab(t.key)}
                  className={`flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all whitespace-nowrap ${
                    activeTab === t.key
                      ? "bg-white text-slate-800 shadow-sm"
                      : "text-slate-500 hover:text-slate-700"
                  }`}
                >
                  {t.label}
                  <span
                    className={`text-[10px] sm:text-xs px-1.5 py-0.5 rounded-full font-bold ${
                      activeTab === t.key
                        ? "bg-indigo-100 text-indigo-700"
                        : "bg-slate-200 text-slate-500"
                    }`}
                  >
                    {t.count}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Toolbar: refresh + search */}
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={() => {
                fetchStats();
                fetchRequests();
              }}
              className="p-2 rounded-xl border border-slate-200 text-slate-400 hover:text-indigo-600 hover:border-indigo-200 transition-colors flex-shrink-0"
              title="Refresh"
            >
              <RefreshCw size={15} />
            </button>
            <div className="relative flex-1 sm:flex-initial">
              <Search
                size={13}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
              />
              <input
                placeholder="Search name or ID..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8 sm:pl-9 pr-4 py-2 text-xs sm:text-sm border border-slate-200 rounded-xl bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-200 w-full sm:w-56 transition-shadow"
              />
            </div>
          </div>
        </div>

        {/* Error banner */}
        {error && (
          <div className="px-3 sm:px-5 py-3 bg-red-50 border-b border-red-100 text-xs sm:text-sm text-red-600">
            {error}
          </div>
        )}

        {/* Table */}
        <RequestTable
          rows={requests}
          loading={loadingReqs}
          onView={setViewedReq}
          onApprove={approve}
          onReject={setRejectTarget}
          showActions={activeTab === "pending"}
          showAdjusted={activeTab === "approved"}
        />
      </div>

      {/* Modals */}
      {viewedReq && (
        <ViewDetailModal
          req={viewedReq}
          onClose={() => setViewedReq(null)}
          onApprove={approve}
          onReject={(req) => setRejectTarget(req ?? viewedReq)}
        />
      )}

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
