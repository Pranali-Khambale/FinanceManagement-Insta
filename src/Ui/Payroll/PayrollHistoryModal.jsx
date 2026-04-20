// src/Ui/Payroll/PayrollHistoryModal.jsx
// Full payroll run history with search, filter, export, and detail drill-down.

import React, { useState, useMemo } from "react";

// ── Helpers ───────────────────────────────────────────────────────────────────
const fmtINR = (n) =>
  "₹" + Number(n || 0).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

const MONTH_OPTIONS = [
  "All Months",
  "April 2026", "March 2026", "February 2026", "January 2026",
  "December 2025", "November 2025", "October 2025",
];

const STATUS_CFG = {
  Paid:     { pill: "bg-emerald-50 text-emerald-700 border-emerald-200", dot: "bg-emerald-500" },
  Pending:  { pill: "bg-amber-50 text-amber-700 border-amber-200",       dot: "bg-amber-400"  },
  Rejected: { pill: "bg-red-50 text-red-600 border-red-200",             dot: "bg-red-400"    },
};

const StatusBadge = ({ status }) => {
  const c = STATUS_CFG[status] || STATUS_CFG.Pending;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${c.pill}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${c.dot}`} />
      {status}
    </span>
  );
};

// ── Sample history data generator ────────────────────────────────────────────
// In production, replace this with a real API call e.g. payrollService.getHistory()
function generateSampleHistory(employees = []) {
  const months = ["February 2026", "January 2026", "December 2025", "November 2025"];
  const records = [];
  let id = 1;

  months.forEach((month, mi) => {
    (employees.length > 0 ? employees : DEMO_EMPLOYEES).forEach((emp) => {
      const basic = emp.basic || 25000;
      const hra   = emp.hra   || 10000;
      const org   = emp.organisationAllowance || 5000;
      const med   = emp.medicalAllowance || 1250;
      const gross = basic + hra + org + med;
      const pf    = emp.pfDeduction || Math.round(basic * 0.12);
      const pt    = emp.pt || 200;
      const tds   = emp.tds || 0;
      const net   = gross - pf - pt - tds;

      records.push({
        id: id++,
        runId: `PR-${2026 - Math.floor(mi / 12)}-${String(mi + 1).padStart(2, "0")}`,
        employeeId: emp.employeeId || `EMP00${id}`,
        name:       emp.name || `Employee ${id}`,
        department: emp.department || "General",
        designation: emp.designation || "Staff",
        forMonth:   month,
        grossSalary: gross,
        totalDeduction: pf + pt + tds,
        netSalary:  net,
        status:     mi === 0 ? "Paid" : mi === 1 ? "Paid" : "Paid",
        paidOn:     mi === 0
          ? "16 Mar 2026"
          : mi === 1
          ? "15 Feb 2026"
          : mi === 2
          ? "16 Jan 2026"
          : "15 Dec 2025",
        bankName:   emp.bankName || "State Bank of India",
        bankAccountNo: emp.bankAccountNo || "XXXX1234",
      });
    });
  });

  return records;
}

// Demo employees if none passed
const DEMO_EMPLOYEES = [
  { employeeId: "EMP001", name: "Seema Kokare",      department: "IGR",    designation: "Service Desk",    basic: 10275, hra: 4110, organisationAllowance: 2568, medicalAllowance: 1250, pfDeduction: 1233, pt: 200, tds: 0 },
  { employeeId: "EMP002", name: "Nitin Rajput",       department: "IGR",    designation: "Support Analyst", basic: 1000,  hra: 400,  organisationAllowance: 250,  medicalAllowance: 500,  pfDeduction: 120,  pt: 0,   tds: 0 },
  { employeeId: "EMP003", name: "Krushna Kapse",      department: "IGR",    designation: "Tech Lead",       basic: 10267, hra: 4107, organisationAllowance: 2566, medicalAllowance: 1250, pfDeduction: 1232, pt: 200, tds: 0 },
  { employeeId: "EMP004", name: "Ashwini Wadurkar",   department: "Admin",  designation: "HR Executive",    basic: 10267, hra: 4107, organisationAllowance: 2566, medicalAllowance: 1250, pfDeduction: 1232, pt: 200, tds: 0 },
];

// ── Run Summary card ──────────────────────────────────────────────────────────
const RunSummaryCard = ({ month, records }) => {
  const total   = records.length;
  const paid    = records.filter(r => r.status === "Paid").length;
  const netSum  = records.reduce((s, r) => s + r.netSalary, 0);
  const grossSum = records.reduce((s, r) => s + r.grossSalary, 0);

  return (
    <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
      <div className="flex items-center justify-between mb-3">
        <div>
          <p className="text-[13px] font-bold text-slate-800">{month}</p>
          <p className="text-[11px] text-slate-400 mt-0.5">{total} employees · {paid} paid</p>
        </div>
        <span className="px-2.5 py-1 rounded-lg bg-emerald-50 border border-emerald-100 text-emerald-700 text-[11px] font-semibold">
          Completed
        </span>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <p className="text-[10px] uppercase tracking-wider text-slate-400">Gross payout</p>
          <p className="text-[15px] font-bold text-slate-700 mt-0.5">{fmtINR(grossSum)}</p>
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-wider text-slate-400">Net disbursed</p>
          <p className="text-[15px] font-bold text-emerald-600 mt-0.5">{fmtINR(netSum)}</p>
        </div>
      </div>
      <div className="mt-3 bg-white rounded-lg overflow-hidden h-1.5">
        <div
          className="h-full rounded-lg bg-emerald-500 transition-all"
          style={{ width: `${total > 0 ? (paid / total) * 100 : 0}%` }}
        />
      </div>
    </div>
  );
};

// ── Detail Row Modal ──────────────────────────────────────────────────────────
const RecordDetailModal = ({ record, onClose }) => (
  <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
      <div className="flex items-center justify-between px-6 py-4" style={{ background: "#1a3c6e" }}>
        <div>
          <p className="text-white font-bold text-[15px]">{record.name}</p>
          <p className="text-blue-200 text-[12px] mt-0.5">{record.employeeId} · {record.forMonth}</p>
        </div>
        <button onClick={onClose}
          className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-sm"
          style={{ background: "rgba(255,255,255,0.15)" }}>✕</button>
      </div>

      <div className="p-6 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          {[
            ["Department",   record.department],
            ["Designation",  record.designation],
            ["Run ID",       record.runId],
            ["Paid On",      record.paidOn],
            ["Bank",         record.bankName],
            ["A/C",          record.bankAccountNo],
          ].map(([label, val]) => (
            <div key={label}>
              <p className="text-[10px] uppercase tracking-wider text-slate-400">{label}</p>
              <p className="text-[13px] text-slate-700 mt-0.5">{val || "—"}</p>
            </div>
          ))}
        </div>

        <div className="border-t border-slate-100 pt-4 space-y-2">
          {[
            ["Gross Salary",     record.grossSalary,     "text-slate-700"],
            ["Total Deductions", record.totalDeduction,  "text-red-500"],
            ["Net Salary",       record.netSalary,       "text-emerald-600 font-bold text-[16px]"],
          ].map(([label, val, cls]) => (
            <div key={label} className="flex justify-between items-center">
              <span className="text-[13px] text-slate-500">{label}</span>
              <span className={`text-[13px] ${cls}`}>{fmtINR(val)}</span>
            </div>
          ))}
        </div>

        <div className="flex justify-center pt-2">
          <StatusBadge status={record.status} />
        </div>
      </div>
    </div>
  </div>
);

// ── Main Modal ────────────────────────────────────────────────────────────────
const PayrollHistoryModal = ({ employees = [], onClose }) => {
  const allRecords = useMemo(() => generateSampleHistory(employees), [employees]);

  const [search,      setSearch]      = useState("");
  const [monthFilter, setMonthFilter] = useState("All Months");
  const [deptFilter,  setDeptFilter]  = useState("All");
  const [statusFilt,  setStatusFilt]  = useState("All");
  const [detailRec,   setDetailRec]   = useState(null);
  const [page,        setPage]        = useState(1);
  const PAGE_SIZE = 10;

  const departments = ["All", ...new Set(allRecords.map(r => r.department).filter(Boolean))];

  const filtered = useMemo(() => allRecords.filter(r => {
    const matchSearch = (r.name || "").toLowerCase().includes(search.toLowerCase()) ||
                        (r.employeeId || "").toLowerCase().includes(search.toLowerCase());
    const matchMonth  = monthFilter === "All Months" || r.forMonth === monthFilter;
    const matchDept   = deptFilter  === "All"        || r.department === deptFilter;
    const matchStatus = statusFilt  === "All"        || r.status === statusFilt;
    return matchSearch && matchMonth && matchDept && matchStatus;
  }), [allRecords, search, monthFilter, deptFilter, statusFilt]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated  = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  // Summary by month (only unique months from filtered)
  const monthGroups = useMemo(() => {
    const map = {};
    allRecords.forEach(r => {
      if (!map[r.forMonth]) map[r.forMonth] = [];
      map[r.forMonth].push(r);
    });
    return Object.entries(map).slice(0, 4); // show latest 4 months
  }, [allRecords]);

  // Totals for filtered records
  const totalNet   = filtered.reduce((s, r) => s + r.netSalary, 0);
  const totalGross = filtered.reduce((s, r) => s + r.grossSalary, 0);
  const totalDed   = filtered.reduce((s, r) => s + r.totalDeduction, 0);

  // Export filtered records to Excel
  const handleExport = async () => {
    try {
      const { utils, writeFile } = await import("https://cdn.sheetjs.com/xlsx-0.20.3/package/xlsx.mjs");
      const rows = filtered.map(r => ({
        "Run ID":           r.runId,
        "Employee ID":      r.employeeId,
        "Name":             r.name,
        "Department":       r.department,
        "Designation":      r.designation,
        "Month":            r.forMonth,
        "Gross Salary":     r.grossSalary,
        "Total Deductions": r.totalDeduction,
        "Net Salary":       r.netSalary,
        "Status":           r.status,
        "Paid On":          r.paidOn,
        "Bank":             r.bankName,
        "A/C No":           r.bankAccountNo,
      }));
      const ws = utils.json_to_sheet(rows);
      ws["!cols"] = [
        { wch: 12 }, { wch: 12 }, { wch: 22 }, { wch: 16 }, { wch: 20 },
        { wch: 16 }, { wch: 14 }, { wch: 16 }, { wch: 14 }, { wch: 10 },
        { wch: 14 }, { wch: 20 }, { wch: 18 },
      ];
      const wb = utils.book_new();
      utils.book_append_sheet(wb, ws, "Payroll History");
      writeFile(wb, `Payroll_History_${monthFilter.replace(" ", "_")}.xlsx`);
    } catch (e) {
      console.error("Export failed", e);
    }
  };

  return (
    <>
      {detailRec && (
        <RecordDetailModal record={detailRec} onClose={() => setDetailRec(null)} />
      )}

      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
        <div
          className="bg-white rounded-2xl shadow-2xl w-full overflow-hidden flex flex-col"
          style={{ maxWidth: "1000px", maxHeight: "92vh" }}
        >
          {/* ── Header ── */}
          <div className="flex items-center justify-between px-6 py-5 flex-shrink-0 border-b border-slate-100">
            <div>
              <h2 className="text-[17px] font-bold text-slate-800">Payroll History</h2>
              <p className="text-[12px] text-slate-400 mt-0.5">
                Complete payroll run records across all months
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleExport}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-emerald-600 text-white hover:bg-emerald-700 transition-colors"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/>
                </svg>
                Export Excel
              </button>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors text-sm"
              >
                ✕
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {/* ── Month Run Summaries ── */}
            <div className="px-6 pt-5 pb-4 border-b border-slate-100">
              <p className="text-[11px] uppercase tracking-widest text-slate-400 font-semibold mb-3">
                Recent Payroll Runs
              </p>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {monthGroups.map(([month, recs]) => (
                  <RunSummaryCard key={month} month={month} records={recs} />
                ))}
              </div>
            </div>

            {/* ── Totals Bar ── */}
            <div className="px-6 py-4 border-b border-slate-100 grid grid-cols-3 gap-4 bg-slate-50">
              <div>
                <p className="text-[10px] uppercase tracking-wider text-slate-400">Total Gross</p>
                <p className="text-[16px] font-bold text-slate-700 mt-0.5">{fmtINR(totalGross)}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wider text-slate-400">Total Deductions</p>
                <p className="text-[16px] font-bold text-red-500 mt-0.5">- {fmtINR(totalDed)}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wider text-slate-400">Total Net Paid</p>
                <p className="text-[16px] font-bold text-emerald-600 mt-0.5">{fmtINR(totalNet)}</p>
              </div>
            </div>

            {/* ── Filters ── */}
            <div className="px-6 py-3 border-b border-slate-100 flex items-center gap-2 flex-wrap">
              {/* Search */}
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search name or ID…"
                  value={search}
                  onChange={e => { setSearch(e.target.value); setPage(1); }}
                  className="pl-8 pr-3 py-1.5 text-sm border border-slate-200 rounded-lg bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-200 w-44"
                />
                <svg className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
                </svg>
              </div>

              {/* Month filter */}
              <select
                value={monthFilter}
                onChange={e => { setMonthFilter(e.target.value); setPage(1); }}
                className="text-xs border border-slate-200 rounded-lg px-2.5 py-1.5 bg-slate-50 focus:outline-none text-slate-600"
              >
                {MONTH_OPTIONS.map(m => <option key={m}>{m}</option>)}
              </select>

              {/* Dept filter */}
              <select
                value={deptFilter}
                onChange={e => { setDeptFilter(e.target.value); setPage(1); }}
                className="text-xs border border-slate-200 rounded-lg px-2.5 py-1.5 bg-slate-50 focus:outline-none text-slate-600"
              >
                {departments.map(d => <option key={d}>{d}</option>)}
              </select>

              {/* Status filter */}
              <select
                value={statusFilt}
                onChange={e => { setStatusFilt(e.target.value); setPage(1); }}
                className="text-xs border border-slate-200 rounded-lg px-2.5 py-1.5 bg-slate-50 focus:outline-none text-slate-600"
              >
                {["All", "Paid", "Pending", "Rejected"].map(s => <option key={s}>{s}</option>)}
              </select>

              <span className="text-[11px] text-slate-400 ml-auto">
                {filtered.length} record{filtered.length !== 1 ? "s" : ""}
              </span>
            </div>

            {/* ── Table ── */}
            <div className="overflow-x-auto">
              <table className="w-full text-sm" style={{ minWidth: "760px" }}>
                <thead>
                  <tr className="border-b border-slate-100 text-left">
                    {[
                      "Employee", "Month", "Gross Salary", "Deductions",
                      "Net Salary", "Status", "Paid On", ""
                    ].map(col => (
                      <th key={col} className="px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wide whitespace-nowrap">
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {paginated.map((rec) => (
                    <tr key={rec.id} className="border-b border-slate-50 hover:bg-slate-50/60 transition-colors">
                      {/* Employee */}
                      <td className="px-4 py-3">
                        <p className="font-semibold text-slate-800 text-[13px] whitespace-nowrap">{rec.name}</p>
                        <p className="text-[11px] text-slate-400">{rec.employeeId} · {rec.department}</p>
                      </td>

                      {/* Month */}
                      <td className="px-4 py-3 whitespace-nowrap text-[13px] text-slate-600">
                        {rec.forMonth}
                        <p className="text-[11px] text-slate-400">{rec.runId}</p>
                      </td>

                      {/* Gross */}
                      <td className="px-4 py-3 whitespace-nowrap text-[13px] font-semibold text-slate-700">
                        {fmtINR(rec.grossSalary)}
                      </td>

                      {/* Deductions */}
                      <td className="px-4 py-3 whitespace-nowrap text-[13px] text-red-500">
                        - {fmtINR(rec.totalDeduction)}
                      </td>

                      {/* Net */}
                      <td className="px-4 py-3 whitespace-nowrap text-[13px] font-extrabold text-emerald-600">
                        {fmtINR(rec.netSalary)}
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3">
                        <StatusBadge status={rec.status} />
                      </td>

                      {/* Paid On */}
                      <td className="px-4 py-3 whitespace-nowrap text-[12px] text-slate-500">
                        {rec.paidOn || "—"}
                      </td>

                      {/* Detail */}
                      <td className="px-4 py-3">
                        <button
                          onClick={() => setDetailRec(rec)}
                          className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-indigo-500 transition-colors"
                          title="View details"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                              d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
                          </svg>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {paginated.length === 0 && (
                <div className="py-14 text-center">
                  <p className="text-slate-400 text-sm">No history records match your filters.</p>
                </div>
              )}
            </div>
          </div>

          {/* ── Pagination ── */}
          {totalPages > 1 && (
            <div className="px-6 py-3 border-t border-slate-100 flex items-center justify-between flex-shrink-0">
              <p className="text-xs text-slate-400">
                Page {page} of {totalPages} · {filtered.length} records
              </p>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  ← Prev
                </button>
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  const pg = Math.max(1, Math.min(page - 2, totalPages - 4)) + i;
                  return (
                    <button
                      key={pg}
                      onClick={() => setPage(pg)}
                      className={`w-8 h-8 rounded-lg text-xs font-semibold border transition-colors ${
                        pg === page
                          ? "border-indigo-600 bg-indigo-600 text-white"
                          : "border-slate-200 text-slate-500 hover:bg-slate-50"
                      }`}
                    >
                      {pg}
                    </button>
                  );
                })}
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Next →
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default PayrollHistoryModal;