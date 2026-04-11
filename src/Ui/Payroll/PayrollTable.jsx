// src/Ui/Payroll/PayrollTable.jsx
import React, { useState } from "react";
import { downloadPayslip } from "./PayslipGenerator";
import PaySalaryModal from "./PaySalaryModel";

const AVATAR_COLORS = [
  "from-indigo-400 to-indigo-600",
  "from-violet-400 to-violet-600",
  "from-blue-400 to-blue-600",
  "from-emerald-400 to-teal-600",
  "from-rose-400 to-pink-600",
  "from-amber-400 to-orange-500",
  "from-cyan-400 to-cyan-600",
];

const STATUS_CFG = {
  Paid: {
    pill: "bg-emerald-50 text-emerald-700 border-emerald-200",
    dot: "bg-emerald-500",
  },
  Pending: {
    pill: "bg-amber-50   text-amber-700   border-amber-200",
    dot: "bg-amber-400",
  },
};

const StatusBadge = ({ status }) => {
  const c = STATUS_CFG[status] || STATUS_CFG.Pending;
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${c.pill}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${c.dot}`} />
      {status}
    </span>
  );
};

/* ── Advance Modal ─────────────────────────────────────────────────────────── */
const AdvanceModal = ({ employee, onClose, onSuccess }) => {
  const [type, setType] = useState("advance"); // "advance" | "cut"
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = () => {
    if (!amount || isNaN(amount) || Number(amount) <= 0) return;
    setSubmitting(true);
    setTimeout(() => {
      onSuccess(employee.id, type, Number(amount));
      onClose();
    }, 1000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-800">
              Advance / Cut Salary
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              {employee.name} · {employee.employeeId}
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-600"
          >
            ✕
          </button>
        </div>

        <div className="px-6 py-5 space-y-4">
          {/* Type toggle */}
          <div className="flex rounded-xl border border-slate-200 overflow-hidden">
            <button
              onClick={() => setType("advance")}
              className={`flex-1 py-2.5 text-sm font-semibold transition-all ${
                type === "advance"
                  ? "bg-indigo-600 text-white"
                  : "bg-white text-slate-500 hover:bg-slate-50"
              }`}
            >
              💰 Advance Salary
            </button>
            <button
              onClick={() => setType("cut")}
              className={`flex-1 py-2.5 text-sm font-semibold transition-all border-l border-slate-200 ${
                type === "cut"
                  ? "bg-red-500 text-white"
                  : "bg-white text-slate-500 hover:bg-slate-50"
              }`}
            >
              ✂️ Cut Salary
            </button>
          </div>

          {/* Info banner */}
          <div
            className={`rounded-xl px-4 py-3 text-xs font-medium ${
              type === "advance"
                ? "bg-indigo-50 text-indigo-700 border border-indigo-100"
                : "bg-red-50 text-red-700 border border-red-100"
            }`}
          >
            {type === "advance"
              ? "An advance will be disbursed to the employee and recovered from upcoming payroll."
              : "A salary cut will be deducted from the employee's current or next payroll cycle."}
          </div>

          {/* Amount */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5">
              Amount (₹)
            </label>
            <input
              type="number"
              placeholder="e.g. 5000"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200"
            />
          </div>

          {/* Reason */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5">
              Reason{" "}
              <span className="font-normal text-slate-400">(optional)</span>
            </label>
            <textarea
              rows={2}
              placeholder="e.g. Medical emergency, Disciplinary action..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200 resize-none"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 pb-5 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-all"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!amount || submitting}
            className={`flex-1 py-2.5 rounded-xl text-sm font-semibold text-white transition-all ${
              type === "advance"
                ? "bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300"
                : "bg-red-500 hover:bg-red-600 disabled:bg-red-300"
            }`}
          >
            {submitting
              ? "Processing..."
              : type === "advance"
                ? "Disburse Advance"
                : "Apply Cut"}
          </button>
        </div>
      </div>
    </div>
  );
};

/* ── Payslip View Modal ─────────────────────────────────────────────────────── */
const PayslipViewModal = ({ employee, onClose }) => {
  const net =
    employee.salary + employee.bonus - employee.tax - employee.deductions;
  const fmtINR = (n) => "₹" + Number(n).toLocaleString("en-IN");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-5 bg-indigo-600 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-white">Payslip</h2>
            <p className="text-xs text-indigo-200 mt-0.5">{employee.payDate}</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-white/20 hover:bg-white/30 flex items-center justify-center text-white text-sm"
          >
            ✕
          </button>
        </div>

        <div className="px-6 py-5 space-y-4">
          {/* Employee info */}
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-400 to-indigo-600 flex items-center justify-center text-white text-lg font-bold">
              {employee.avatar}
            </div>
            <div>
              <p className="font-bold text-slate-800">{employee.name}</p>
              <p className="text-xs text-slate-400">
                {employee.employeeId} · {employee.department}
              </p>
            </div>
          </div>

          <hr className="border-slate-100" />

          {/* Earnings */}
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">
              Earnings
            </p>
            <div className="space-y-1.5">
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">Basic Salary</span>
                <span className="font-semibold text-slate-800">
                  {fmtINR(employee.salary)}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">Bonus</span>
                <span className="font-semibold text-emerald-600">
                  +{fmtINR(employee.bonus)}
                </span>
              </div>
            </div>
          </div>

          {/* Deductions */}
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">
              Deductions
            </p>
            <div className="space-y-1.5">
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">Tax</span>
                <span className="font-semibold text-red-500">
                  -{fmtINR(employee.tax)}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">Other Deductions</span>
                <span className="font-semibold text-red-500">
                  -{fmtINR(employee.deductions)}
                </span>
              </div>
            </div>
          </div>

          <hr className="border-slate-100" />

          {/* Net pay */}
          <div className="flex justify-between items-center bg-slate-50 rounded-xl px-4 py-3">
            <span className="text-sm font-bold text-slate-700">Net Pay</span>
            <span className="text-lg font-extrabold text-indigo-600">
              {fmtINR(net)}
            </span>
          </div>

          <div className="flex justify-between items-center text-xs text-slate-400">
            <span>Status</span>
            <StatusBadge status={employee.status} />
          </div>
        </div>

        <div className="px-6 pb-5">
          <button
            onClick={() => {
              downloadPayslip(employee);
            }}
            className="w-full py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 transition-all"
          >
            Download Payslip
          </button>
        </div>
      </div>
    </div>
  );
};

/* ── Main Table ─────────────────────────────────────────────────────────────── */
const PayrollTable = ({ employees, onUpdateStatus }) => {
  const [activeTab, setActiveTab] = useState("pending");
  const [search, setSearch] = useState("");
  const [deptFilter, setDeptFilter] = useState("All");
  const [payTarget, setPayTarget] = useState(null);
  const [advanceTarget, setAdvanceTarget] = useState(null);
  const [viewTarget, setViewTarget] = useState(null);
  const [toast, setToast] = useState(null);

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3200);
  };

  const departments = ["All", ...new Set(employees.map((e) => e.department))];

  const tabMap = { pending: ["Pending"], paid: ["Paid"] };

  const filtered = employees.filter((e) => {
    const matchTab = tabMap[activeTab].includes(e.status);
    const matchSrch =
      e.name.toLowerCase().includes(search.toLowerCase()) ||
      e.employeeId.toLowerCase().includes(search.toLowerCase()) ||
      e.id.toLowerCase().includes(search.toLowerCase());
    const matchDept = deptFilter === "All" || e.department === deptFilter;
    return matchTab && matchSrch && matchDept;
  });

  const pendingCount = employees.filter((e) => e.status === "Pending").length;
  const paidCount = employees.filter((e) => e.status === "Paid").length;

  const handlePaySuccess = (id) => {
    onUpdateStatus(id, "Paid");
    showToast("💸 Salary disbursed successfully!");
  };

  const handleAdvanceSuccess = (id, type, amount) => {
    const fmtINR = (n) => "₹" + Number(n).toLocaleString("en-IN");
    showToast(
      type === "advance"
        ? `💰 Advance of ${fmtINR(amount)} disbursed!`
        : `✂️ Salary cut of ${fmtINR(amount)} applied!`,
      type === "cut" ? "error" : "success",
    );
  };

  const fmtINR = (n) => "₹" + Number(n).toLocaleString("en-IN");

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100">
      {/* Toast */}
      {toast && (
        <div
          className={`fixed top-5 right-5 z-50 px-5 py-3 rounded-xl shadow-xl text-sm font-semibold border transition-all ${
            toast.type === "error"
              ? "bg-red-50 border-red-200 text-red-700"
              : "bg-white border-emerald-200 text-slate-800"
          }`}
          style={{ animation: "slideUp 0.2s ease" }}
        >
          {toast.msg}
        </div>
      )}

      {/* Pay Modal */}
      {payTarget && (
        <PaySalaryModal
          employee={payTarget}
          onClose={() => setPayTarget(null)}
          onSuccess={handlePaySuccess}
        />
      )}

      {/* Advance / Cut Modal */}
      {advanceTarget && (
        <AdvanceModal
          employee={advanceTarget}
          onClose={() => setAdvanceTarget(null)}
          onSuccess={handleAdvanceSuccess}
        />
      )}

      {/* Payslip View Modal */}
      {viewTarget && (
        <PayslipViewModal
          employee={viewTarget}
          onClose={() => setViewTarget(null)}
        />
      )}

      {/* ── Tabs + Search ── */}
      <div className="px-6 pt-5 pb-0 flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2">
          {[
            { key: "pending", label: "Pending", count: pendingCount },
            { key: "paid", label: "Paid", count: paidCount },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all border ${
                activeTab === tab.key
                  ? "bg-white border-slate-200 text-slate-800 shadow-sm"
                  : "border-transparent text-slate-400 hover:text-slate-600"
              }`}
            >
              {tab.label}
              <span
                className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                  activeTab === tab.key
                    ? "bg-slate-100 text-slate-700"
                    : "bg-slate-100 text-slate-400"
                }`}
              >
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          {/* Department filter */}
          <select
            value={deptFilter}
            onChange={(e) => setDeptFilter(e.target.value)}
            className="text-sm border border-slate-200 rounded-xl px-3 py-2 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-200 text-slate-600"
          >
            {departments.map((d) => (
              <option key={d}>{d}</option>
            ))}
          </select>

          {/* Search */}
          <div className="relative">
            <input
              type="text"
              placeholder="Search by name or ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-xl bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-200 w-52"
            />
            <svg
              className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>
        </div>
      </div>

      {/* ── Table ── */}
      <div className="overflow-x-auto mt-2">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 text-left">
              {[
                "Pay ID",
                "Employee",
                "Department",
                "Gross Salary",
                "Bonus",
                "Tax",
                "Net Pay",
                "Pay Date",
                "Status",
                "Actions",
              ].map((col) => (
                <th
                  key={col}
                  className="px-5 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wide whitespace-nowrap"
                >
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((emp, i) => {
              const net = emp.salary + emp.bonus - emp.tax - emp.deductions;
              return (
                <tr
                  key={emp.id}
                  className="border-b border-slate-50 hover:bg-slate-50/70 transition-colors"
                >
                  {/* Pay ID */}
                  <td className="px-5 py-4 text-xs font-mono font-semibold text-slate-400">
                    {emp.id}
                  </td>

                  {/* Employee */}
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-8 h-8 rounded-lg bg-gradient-to-br ${AVATAR_COLORS[i % AVATAR_COLORS.length]} flex items-center justify-center text-white text-xs font-bold flex-shrink-0`}
                      >
                        {emp.avatar}
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-slate-800 whitespace-nowrap">
                          {emp.name}
                        </p>
                        <p className="text-xs text-slate-400">
                          {emp.employeeId}
                        </p>
                      </div>
                    </div>
                  </td>

                  {/* Department */}
                  <td className="px-5 py-4 text-slate-600 whitespace-nowrap">
                    {emp.department}
                  </td>

                  {/* Gross */}
                  <td className="px-5 py-4 font-semibold text-slate-700 whitespace-nowrap">
                    {fmtINR(emp.salary)}
                  </td>

                  {/* Bonus */}
                  <td className="px-5 py-4 text-emerald-600 font-semibold whitespace-nowrap">
                    +{fmtINR(emp.bonus)}
                  </td>

                  {/* Tax */}
                  <td className="px-5 py-4 text-red-400 font-semibold whitespace-nowrap">
                    -{fmtINR(emp.tax)}
                  </td>

                  {/* Net Pay */}
                  <td className="px-5 py-4 font-extrabold text-slate-800 whitespace-nowrap">
                    {fmtINR(net)}
                  </td>

                  {/* Pay Date */}
                  <td className="px-5 py-4 text-slate-500 whitespace-nowrap">
                    {emp.payDate}
                  </td>

                  {/* Status */}
                  <td className="px-5 py-4">
                    <StatusBadge status={emp.status} />
                  </td>

                  {/* Actions */}
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-1">
                      {/* View Payslip */}
                      <button
                        onClick={() => setViewTarget(emp)}
                        title="View Payslip"
                        className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
                      >
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                          />
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                          />
                        </svg>
                      </button>

                      {/* Pay Salary button (only non-paid) */}
                      {emp.status !== "Paid" && (
                        <button
                          onClick={() => setPayTarget(emp)}
                          title="Pay Salary"
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-600 text-xs font-semibold transition-colors border border-emerald-100"
                        >
                          <svg
                            className="w-3.5 h-3.5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                          </svg>
                          Pay
                        </button>
                      )}

                      {/* Advance / Cut button */}
                      <button
                        onClick={() => setAdvanceTarget(emp)}
                        title="Advance / Cut Salary"
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-600 text-xs font-semibold transition-colors border border-indigo-100"
                      >
                        <svg
                          className="w-3.5 h-3.5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                        Advance
                      </button>

                      {/* Reject / Cancel (only for non-paid) */}
                      {emp.status !== "Paid" && (
                        <button
                          onClick={() => {
                            onUpdateStatus(emp.id, "Rejected");
                            showToast(
                              `❌ ${emp.name} payment cancelled.`,
                              "error",
                            );
                          }}
                          title="Cancel Payment"
                          className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-400 transition-colors"
                        >
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <circle cx="12" cy="12" r="10" strokeWidth={2} />
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M15 9l-6 6M9 9l6 6"
                            />
                          </svg>
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {filtered.length === 0 && (
          <div className="py-16 text-center">
            <p className="text-slate-400 text-sm">
              No {activeTab} records found.
            </p>
          </div>
        )}
      </div>

      {/* Pagination stub */}
      <div className="px-6 py-3 border-t border-slate-100 flex items-center justify-between">
        <p className="text-xs text-slate-400">
          Showing {filtered.length} of {employees.length} employees
        </p>
        <div className="flex items-center gap-1">
          {[1, 2, 3].map((p) => (
            <button
              key={p}
              className={`w-7 h-7 rounded-lg text-xs font-medium ${p === 1 ? "bg-indigo-600 text-white" : "text-slate-500 hover:bg-slate-100"}`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default PayrollTable;


