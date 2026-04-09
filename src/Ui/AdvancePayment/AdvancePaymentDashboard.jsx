// ─────────────────────────────────────────────────────────────────────────────
// FILE: src/Ui/AdvancePayment/AdvancePaymentDashboard.jsx
// ─────────────────────────────────────────────────────────────────────────────
import { useState } from "react";
import {
  CheckCircle2, Clock, Eye, FileText,
  XCircle, Search, Users, TrendingUp,
} from "lucide-react";

import GenerateLinkModal from "./GenerateLink";
import AddRequestModal   from "./AddRequest";
import ViewDetailModal   from "./ViewDetail";

// ─── Helpers ──────────────────────────────────────────────────────────────────
const fmt = (n) => `₹${Number(n).toLocaleString("en-IN")}`;

const statusColors = {
  pending:  { bg: "bg-amber-50",   text: "text-amber-700",   ring: "ring-amber-200",   dot: "bg-amber-400"   },
  approved: { bg: "bg-emerald-50", text: "text-emerald-700", ring: "ring-emerald-200", dot: "bg-emerald-400" },
  rejected: { bg: "bg-red-50",     text: "text-red-700",     ring: "ring-red-200",     dot: "bg-red-400"     },
};

const INITIAL_REQUESTS = [
  { id: "ADV001", empId: "EMP012", name: "Aarav Ramesh Mehta", dept: "Engineering", amount: 15000, reason: "Medical emergency", date: "2026-03-28", status: "pending",  proof: "bill.pdf"     },
  { id: "ADV002", empId: "EMP013", name: "Priya Sharma",       dept: "HR",          amount: 8000,  reason: "Home renovation",  date: "2026-03-30", status: "pending",  proof: "quote.png"    },
  { id: "ADV003", empId: "EMP010", name: "Ravi Kumar",         dept: "IT",          amount: 20000, reason: "Education fee",    date: "2026-03-15", status: "approved", proof: "receipt.pdf",  adjustedIn: "April 2026" },
  { id: "ADV004", empId: "EMP008", name: "Sneha Patil",        dept: "Finance",     amount: 5000,  reason: "Travel",           date: "2026-03-10", status: "rejected", proof: null           },
];

// ─── Badge ────────────────────────────────────────────────────────────────────
function Badge({ status }) {
  const c = statusColors[status];
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ring-1 ${c.bg} ${c.text} ${c.ring}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${c.dot}`} />
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}

// ─── Stat Card (Dashboard-style coloured icon) ────────────────────────────────
function StatCard({ icon: Icon, label, value, subText, subColor, iconBg, iconColor }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 flex flex-col gap-3 hover:shadow-md transition-shadow">
      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${iconBg}`}>
        <Icon size={22} className={iconColor} />
      </div>
      <div>
        <p className="text-2xl font-bold text-slate-800">{value}</p>
        <p className="text-sm font-medium text-slate-600 mt-0.5">{label}</p>
        {subText && <p className={`text-xs mt-0.5 ${subColor}`}>{subText}</p>}
      </div>
    </div>
  );
}

// ─── Empty State ──────────────────────────────────────────────────────────────
function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center mb-3">
        <FileText size={24} className="text-slate-400" />
      </div>
      <p className="text-slate-600 font-semibold">No requests found</p>
      <p className="text-slate-400 text-sm mt-1">Try adjusting your search</p>
    </div>
  );
}

// ─── Request Table ────────────────────────────────────────────────────────────
function RequestTable({ rows, onView, onApprove, onReject, showActions, showAdjusted }) {
  if (!rows.length) return <EmptyState />;

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
          {rows.map((r) => (
            <tr key={r.id} className="border-b border-slate-50 hover:bg-slate-50/70 transition-colors">

              {/* Request ID */}
              <td className="px-5 py-4 font-mono text-xs font-bold text-slate-500 whitespace-nowrap">{r.id}</td>

              {/* Employee */}
              <td className="px-5 py-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-xs font-bold text-indigo-600 shrink-0">
                    {r.name.split(" ").map((n) => n[0]).slice(0, 2).join("")}
                  </div>
                  <div>
                    <p className="font-semibold text-slate-800 whitespace-nowrap">{r.name}</p>
                    <p className="text-xs text-slate-400">{r.empId}</p>
                  </div>
                </div>
              </td>

              {/* Dept */}
              <td className="px-5 py-4 text-slate-600 whitespace-nowrap">{r.dept}</td>

              {/* Amount */}
              <td className="px-5 py-4 font-bold text-slate-800 whitespace-nowrap">{fmt(r.amount)}</td>

              {/* Date */}
              <td className="px-5 py-4 text-slate-500 whitespace-nowrap">{r.date}</td>

              {/* Reason */}
              <td className="px-5 py-4 text-slate-600 max-w-[160px]">
                <span className="truncate block" title={r.reason}>{r.reason}</span>
              </td>

              {/* Proof / Adjusted */}
              <td className="px-5 py-4">
                {showAdjusted
                  ? <span className="text-xs bg-blue-50 text-blue-700 px-2.5 py-1 rounded-lg font-semibold">{r.adjustedIn || "—"}</span>
                  : r.proof
                    ? <button className="flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-800 font-medium transition-colors"><FileText size={13} />{r.proof}</button>
                    : <span className="text-slate-300 text-xs">—</span>
                }
              </td>

              {/* Status */}
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
                  {showActions && (
                    <>
                      <button
                        onClick={() => onApprove(r.id)}
                        className="p-1.5 rounded-lg hover:bg-emerald-50 text-slate-400 hover:text-emerald-600 transition-colors"
                        title="Approve"
                      >
                        <CheckCircle2 size={15} />
                      </button>
                      <button
                        onClick={() => onReject(r.id)}
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
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─── AdvancePaymentDashboard (default export) ─────────────────────────────────
// requests + setRequests come from AdvancePayment.jsx so header New Request reflects here
export default function AdvancePaymentDashboard({ requests = INITIAL_REQUESTS, setRequests = () => {} }) {
  const [activeTab, setActiveTab] = useState("pending");
  const [search,    setSearch]    = useState("");
  const [viewedReq, setViewedReq] = useState(null);

  // ── Stats ────────────────────────────────────────────────────────────────
  const total    = requests.length;
  const pending  = requests.filter((r) => r.status === "pending").length;
  const approved = requests.filter((r) => r.status === "approved").length;
  const totalAmt = requests
    .filter((r) => r.status === "approved")
    .reduce((s, r) => s + Number(r.amount), 0);

  // ── Actions ──────────────────────────────────────────────────────────────
  const approve = (id) => {
    setRequests((rs) => rs.map((r) => r.id === id ? { ...r, status: "approved", adjustedIn: "Next month" } : r));
    setViewedReq(null);
  };
  const reject = (id) => {
    setRequests((rs) => rs.map((r) => r.id === id ? { ...r, status: "rejected" } : r));
    setViewedReq(null);
  };

  // ── Filter ────────────────────────────────────────────────────────────────
  const filtered = (status) =>
    requests.filter((r) =>
      r.status === status &&
      (r.name.toLowerCase().includes(search.toLowerCase()) ||
       r.empId.toLowerCase().includes(search.toLowerCase()))
    );

  return (
    <div className="space-y-5">

      {/* ── Stat Cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={Users}        label="Total Requests"     value={total}
          subText="All registered"       subColor="text-indigo-500"
          iconBg="bg-indigo-100"         iconColor="text-indigo-500"
        />
        <StatCard
          icon={Clock}        label="Pending"            value={pending}
          subText="Awaiting approval"    subColor="text-amber-500"
          iconBg="bg-amber-100"          iconColor="text-amber-500"
        />
        <StatCard
          icon={CheckCircle2} label="Approved"           value={approved}
          subText="Currently approved"   subColor="text-emerald-500"
          iconBg="bg-emerald-100"        iconColor="text-emerald-500"
        />
        <StatCard
          icon={TrendingUp}   label="Total Approved Amt" value={fmt(totalAmt)}
          subText="This period"          subColor="text-blue-500"
          iconBg="bg-blue-100"           iconColor="text-blue-500"
        />
      </div>

      {/* ── Requests Panel ── */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm">

        {/* Top bar: Tabs + Search */}
        <div className="px-5 py-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
          <div className="flex bg-slate-100 rounded-xl p-1 gap-1 w-fit">
            {[
              { key: "pending",  label: "Pending Requests",  count: pending  },
              { key: "approved", label: "Approved Requests", count: approved },
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

          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              placeholder="Search by name or ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-xl bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-200 w-56"
            />
          </div>
        </div>

        {/* Table */}
        {activeTab === "pending" && (
          <RequestTable
            rows={filtered("pending")}
            onView={setViewedReq}
            onApprove={approve}
            onReject={reject}
            showActions
          />
        )}
        {activeTab === "approved" && (
          <RequestTable
            rows={filtered("approved")}
            onView={setViewedReq}
            showAdjusted
          />
        )}
      </div>

      {/* ViewDetailModal — triggered by eye button in table */}
      {viewedReq && (
        <ViewDetailModal
          req={viewedReq}
          onClose={() => setViewedReq(null)}
          onApprove={approve}
          onReject={reject}
        />
      )}

    </div>
  );
}

// Named exports so AdvancePayment.jsx can lift modal state up if needed
export { GenerateLinkModal, AddRequestModal, ViewDetailModal };