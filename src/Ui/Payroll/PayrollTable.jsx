// src/Ui/Payroll/PayrollTable.jsx
// ─────────────────────────────────────────────────────────────────────────────
// CHANGES IN THIS VERSION:
//
//  1. employerPfFromBasic: 12% → 13%  (total PF now 25% of basic)
//  2. medical_allowance removed from computePayslip, table columns,
//     payslip modal, totals row, handleEditSave payload
//  3. gratuity added at 4.81% of basic — auto-calc with saved override support
//     shown in payslip modal, table column, totals row
//  4. NEW: Employment Type filter (IT / Telecom / All Types)
//  5. FIX: Circle / Location filter now uses hardcoded list (synced with
//     EmploymentDetailsStep) instead of dynamic population from employee data
//  6. NEW: Search now also matches against circle and designation
// ─────────────────────────────────────────────────────────────────────────────

import React, { useState, useCallback } from "react";
import { downloadPayslipExcel } from "./PayslipGenerator.jsx";
import { exportPayrollToExcel } from "./ExportPayrollExcel";
import AttendanceInputModal from "./AttendanceInputModal";
import EmployeeDetailModal from "./EmployeeDetailModal";
import payrollService from "../../services/payrollService";

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
  Rejected: {
    pill: "bg-red-50     text-red-700     border-red-200",
    dot: "bg-red-400",
  },
  Cancelled: {
    pill: "bg-slate-50   text-slate-500   border-slate-200",
    dot: "bg-slate-400",
  },
};

// ─── Hardcoded circles list — synced with EmploymentDetailsStep ────────────
const CIRCLES = [
  "Gujarat",
  "HP (Himachal Pradesh)",
  "MH (Maharashtra)",
  "MH (Pune Office)",
  "MH Nagpur",
  "MH_Ahilyanagar",
  "MH_Nagpur",
  "MH_Pen",
  "MPCG",
  "Mumbai",
  "Punjab",
  "Pune",
  "Other",
];

// ─── Employment type buckets ───────────────────────────────────────────────────
const EMP_TYPE_BUCKETS = {
  IT: [
    "it", "information technology", "software", "developer", "tech",
    "engineering", "data", "devops", "qa", "testing", "cloud",
  ],
  Telecom: [
    "telecom", "telecommunications", "network", "noc", "bss", "oss",
    "rf", "transmission", "fiber", "broadband", "isp", "circle",
  ],
};

function getEmpTypeBucket(emp) {
  const haystack = [
    emp.employmentType || "",
    emp.department      || "",
    emp.designation     || "",
  ]
    .join(" ")
    .toLowerCase();

  if (EMP_TYPE_BUCKETS.IT.some((kw) => haystack.includes(kw)))      return "IT";
  if (EMP_TYPE_BUCKETS.Telecom.some((kw) => haystack.includes(kw))) return "Telecom";
  return "Other";
}

function n(val) {
  const v = Number(val);
  return isFinite(v) ? v : 0;
}

function fmtINR(val) {
  return (
    "₹" +
    n(val).toLocaleString("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
  );
}

function ptFromGenderAndGross(forMonth, gender, grossFull) {
  const isFemale = /female|woman|f/i.test(gender || "");
  if (isFemale && n(grossFull) <= 25000) return 0;
  return /february/i.test(forMonth || "") ? 300 : 200;
}

function pfFromBasic(basic) {
  return Math.round(n(basic) * 0.12);
}

function employerPfFromBasic(basic) {
  return Math.round(n(basic) * 0.13);
}

function gratuityFromBasic(basic) {
  return Math.round(n(basic) * 0.0481 * 100) / 100;
}

function getDaysInMonth(forMonth) {
  if (!forMonth) return 30;
  const MONTHS = {
    january: 1, february: 2,  march: 3,      april: 4,
    may: 5,     june: 6,      july: 7,        august: 8,
    september: 9, october: 10, november: 11,  december: 12,
  };
  const parts    = forMonth.trim().toLowerCase().split(/\s+/);
  const monthNum = MONTHS[parts[0]];
  const year     = parseInt(parts[1], 10);
  if (!monthNum || isNaN(year)) return 30;
  return new Date(year, monthNum, 0).getDate();
}

function computePayslip(emp) {
  const monthDays = n(emp.monthDays) || 30;
  const pDays     = emp.pDays != null ? n(emp.pDays) : monthDays;
  const ratio     = monthDays > 0 ? pDays / monthDays : 1;

  const basic      = n(emp.basic);
  const hra        = n(emp.hra);
  const orgAllow   = n(emp.organisationAllowance);
  const perfPay    = n(emp.performancePay);
  const tds        = n(emp.tds);
  const otherDed   = n(emp.otherDeduction);
  const advDed     = n(emp.advanceDeduction);
  const advAdd     = n(emp.advanceAddition);

  const grossSalary = basic + hra + orgAllow;

  const empPfDed =
    emp.pfDeduction != null ? n(emp.pfDeduction) : pfFromBasic(basic);

  const employerPf =
    emp.employerPfContribution != null
      ? n(emp.employerPfContribution)
      : employerPfFromBasic(basic);

  const totalPf = empPfDed + employerPf;

  const ptDed =
    emp.pt != null
      ? n(emp.pt)
      : ptFromGenderAndGross(emp.forMonth, emp.gender, grossSalary);

  const gratuityAmt =
    emp.gratuity != null ? n(emp.gratuity) : gratuityFromBasic(basic);

  const grossEarned   = grossSalary * ratio;
  const perfEarned    = perfPay * ratio;

  const totalDeduction =
    empPfDed + employerPf + ptDed + tds + otherDed + advDed + gratuityAmt;
  const netSalary   = grossEarned - totalDeduction + advAdd;
  const totalEarning = netSalary + perfEarned;

  return {
    grossSalary,
    grossEarned,
    perfEarned,
    empPfDeduction: empPfDed,
    employerPfContribution: employerPf,
    totalPfContribution: totalPf,
    ptDeduction: ptDed,
    gratuity: gratuityAmt,
    totalDeduction,
    advanceDeduction: advDed,
    advanceAddition: advAdd,
    netSalary,
    totalEarning,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────────────────────────────────────

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

// ─────────────────────────────────────────────────────────────────────────────
// Payslip View Modal
// ─────────────────────────────────────────────────────────────────────────────
const PayslipViewModal = ({ employee, onClose }) => {
  const [excelLoading, setExcelLoading] = useState(false);

  const {
    grossSalary,
    grossEarned,
    perfEarned,
    empPfDeduction,
    employerPfContribution,
    totalPfContribution,
    ptDeduction,
    gratuity,
    totalDeduction,
    advanceDeduction,
    advanceAddition,
    netSalary,
    totalEarning,
  } = computePayslip(employee);

  const monthDays = n(employee.monthDays) || 30;
  const pDays     = employee.pDays != null ? n(employee.pDays) : monthDays;
  const ratio     = monthDays > 0 ? pDays / monthDays : 1;

  const isFemale       = /female|woman|f/i.test(employee.gender || "");
  const ptNotApplicable = isFemale && grossSalary <= 25000;

  const handleExcel = async () => {
    setExcelLoading(true);
    try {
      await downloadPayslipExcel(employee);
    } finally {
      setExcelLoading(false);
    }
  };

  const initials = (employee.name || "?")
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();

  const MetaField = ({ label, value }) => (
    <div className="flex flex-col gap-0.5">
      <span className="text-[10px] uppercase tracking-widest text-slate-400">
        {label}
      </span>
      <span className="text-[13px] text-slate-700">{value ?? "—"}</span>
    </div>
  );

  const EarningRow = ({ label, gross, earned }) => (
    <tr className="text-[12px]">
      <td className="py-1 text-slate-600">{label}</td>
      <td className="py-1 text-right text-slate-700">{fmtINR(gross)}</td>
      <td className="py-1 text-right text-slate-700">{fmtINR(earned)}</td>
    </tr>
  );

  const DeductRow = ({ label, amount, isPositive, subdued }) => (
    <tr className="text-[12px]">
      <td
        className={`py-1 ${subdued ? "text-slate-400 italic" : "text-slate-600"}`}
      >
        {label}
      </td>
      <td
        className={`py-1 text-right font-medium ${
          isPositive
            ? "text-emerald-600"
            : subdued
              ? "text-slate-400 italic"
              : "text-red-500"
        }`}
      >
        {isPositive
          ? `+ ${fmtINR(amount)}`
          : n(amount) > 0
            ? `- ${fmtINR(amount)}`
            : fmtINR(0)}
      </td>
    </tr>
  );

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center p-4"
      style={{
        background: "rgba(0,0,0,.5)",
        backdropFilter: "blur(8px)",
        WebkitBackdropFilter: "blur(8px)",
      }}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden"
        style={{ maxHeight: "92vh", display: "flex", flexDirection: "column" }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-6 py-5 flex-shrink-0"
          style={{ background: "#1a3c6e" }}
        >
          <div className="flex items-center gap-3">
            <div
              className="w-11 h-11 rounded-full flex items-center justify-center text-sm font-semibold text-white flex-shrink-0"
              style={{ background: "rgba(255,255,255,0.15)" }}
            >
              {initials}
            </div>
            <div>
              <p className="text-white font-semibold text-[15px] leading-tight">
                {employee.name}
              </p>
              <p className="text-blue-200 text-[12px] mt-0.5">
                {employee.employeeId} · {employee.designation}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-[10px] uppercase tracking-wider text-blue-300">
                Payslip for
              </p>
              <p className="text-white text-[13px] font-semibold mt-0.5">
                {employee.forMonth}
              </p>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-sm"
              style={{ background: "rgba(255,255,255,0.15)" }}
            >
              ✕
            </button>
          </div>
        </div>

        {/* Company banner */}
        <div
          className="text-center px-6 py-2.5 border-b border-slate-100 flex-shrink-0"
          style={{ background: "#f0f4fa" }}
        >
          <p className="text-[13px] font-semibold" style={{ color: "#1a3c6e" }}>
            Insta ICT Solutions Pvt. Ltd.
          </p>
          <p className="text-[11px] text-slate-500 mt-0.5">
            201–202, Imperial Plaza, Jijai Nagar, Kothrud, Pune – 411 038
          </p>
        </div>

        {/* Scrollable body */}
        <div className="overflow-y-auto flex-1">
          {/* Employee meta */}
          <div className="px-6 py-4 grid grid-cols-3 gap-x-6 gap-y-3 border-b border-slate-100">
            <MetaField label="Joining date"  value={employee.joiningDate} />
            <MetaField label="Location"      value={employee.currentLocation || employee.circle} />
            <MetaField label="P days / Month" value={`${pDays} / ${monthDays}`} />
            <MetaField label="Absent days"   value={n(employee.aDays)} />
            <MetaField label="Bank"          value={employee.bankName} />
            <MetaField label="A/C no"        value={employee.accountNumber || employee.bankAccountNo} />
            <MetaField label="IFSC"          value={employee.ifscCode} />
            <MetaField label="PAN"           value={employee.panNo} />
            <MetaField label="Aadhar"        value={employee.aadharNo} />
          </div>

          {/* Earnings & Deductions */}
          <div className="grid grid-cols-2 divide-x divide-slate-100 border-b border-slate-100">
            {/* Earnings */}
            <div className="px-5 py-4">
              <p className="text-[10px] uppercase tracking-widest text-slate-400 font-semibold mb-3">
                Earnings
              </p>
              <table className="w-full border-collapse">
                <thead>
                  <tr>
                    <th className="text-left pb-1.5 text-[10px] text-slate-400 font-normal">Head</th>
                    <th className="text-right pb-1.5 text-[10px] text-slate-400 font-normal">Gross</th>
                    <th className="text-right pb-1.5 text-[10px] text-slate-400 font-normal">Earned</th>
                  </tr>
                </thead>
                <tbody>
                  <EarningRow label="Basic"          gross={n(employee.basic)}                   earned={n(employee.basic) * ratio} />
                  <EarningRow label="HRA"            gross={n(employee.hra)}                     earned={n(employee.hra) * ratio} />
                  <EarningRow label="Org. allowance" gross={n(employee.organisationAllowance)}   earned={n(employee.organisationAllowance) * ratio} />
                  {advanceAddition > 0 && (
                    <tr className="text-[12px]">
                      <td className="py-1 text-emerald-600 font-medium">Advance (addition)</td>
                      <td className="py-1 text-right text-emerald-600">—</td>
                      <td className="py-1 text-right text-emerald-600">+ {fmtINR(advanceAddition)}</td>
                    </tr>
                  )}
                  <tr className="border-t border-slate-100 text-[12px]">
                    <td className="py-1.5 font-semibold" style={{ color: "#1a3c6e" }}>Subtotal</td>
                    <td className="py-1.5 text-right font-semibold" style={{ color: "#1a3c6e" }}>{fmtINR(grossSalary)}</td>
                    <td className="py-1.5 text-right font-semibold" style={{ color: "#1a3c6e" }}>{fmtINR(grossEarned + advanceAddition)}</td>
                  </tr>
                  <tr className="text-[12px]">
                    <td className="py-1 text-slate-400 italic">Perf. pay</td>
                    <td className="py-1 text-right text-slate-400 italic">{fmtINR(n(employee.performancePay))}</td>
                    <td className="py-1 text-right text-slate-400 italic">{fmtINR(perfEarned)}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Deductions */}
            <div className="px-5 py-4">
              <p className="text-[10px] uppercase tracking-widest text-slate-400 font-semibold mb-3">
                Deductions
              </p>
              <table className="w-full border-collapse">
                <thead>
                  <tr>
                    <th className="text-left pb-1.5 text-[10px] text-slate-400 font-normal">Head</th>
                    <th className="text-right pb-1.5 text-[10px] text-slate-400 font-normal">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  <DeductRow label={`PF – Employee (12% of ₹${n(employee.basic).toLocaleString("en-IN")})`} amount={empPfDeduction} />
                  <DeductRow label={`PF – Employer (13% of ₹${n(employee.basic).toLocaleString("en-IN")})`} amount={employerPfContribution} />
                  <tr className="text-[12px] bg-red-50/50">
                    <td className="py-1 text-red-600 font-semibold">Total PF (25%)</td>
                    <td className="py-1 text-right font-bold text-red-600">- {fmtINR(totalPfContribution)}</td>
                  </tr>
                  <tr className="text-[12px]">
                    <td className="py-1 text-slate-600">
                      PT{/february/i.test(employee.forMonth || "") ? " (Feb)" : ""}
                      {ptNotApplicable && (
                        <span className="ml-1 text-[10px] text-emerald-600 font-semibold">N/A (gross ≤ ₹25K)</span>
                      )}
                    </td>
                    <td className={`py-1 text-right font-medium ${ptDeduction > 0 ? "text-red-500" : "text-slate-400"}`}>
                      {ptDeduction > 0 ? `- ${fmtINR(ptDeduction)}` : fmtINR(0)}
                    </td>
                  </tr>
                  <DeductRow label={`Gratuity (4.81% of ₹${n(employee.basic).toLocaleString("en-IN")})`} amount={gratuity} />
                  <DeductRow label="TDS"   amount={n(employee.tds)} />
                  <DeductRow label="Other" amount={n(employee.otherDeduction)} />
                  {advanceDeduction > 0 && (
                    <DeductRow label="Advance recovery" amount={advanceDeduction} />
                  )}
                  <tr className="border-t border-slate-100 text-[12px]">
                    <td className="py-1.5 font-semibold text-red-500">Total deductions</td>
                    <td className="py-1.5 text-right font-semibold text-red-500">- {fmtINR(totalDeduction)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* PF summary bar */}
          <div className="px-6 py-3 bg-red-50 border-b border-red-100">
            <p className="text-[10px] uppercase tracking-widest text-red-400 font-semibold mb-2">
              PF Summary — Both Shares Deducted from Employee Salary
            </p>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <p className="text-[10px] text-red-400">Employee Share (12%)</p>
                <p className="text-[14px] font-semibold text-red-500">- {fmtINR(empPfDeduction)}</p>
              </div>
              <div>
                <p className="text-[10px] text-red-400">Employer Share (13%)</p>
                <p className="text-[14px] font-semibold text-red-500">- {fmtINR(employerPfContribution)}</p>
              </div>
              <div>
                <p className="text-[10px] text-red-400">Total PF Deducted (25%)</p>
                <p className="text-[14px] font-bold text-red-700">- {fmtINR(totalPfContribution)}</p>
              </div>
            </div>
            {empPfDeduction === 0 && employerPfContribution === 0 && (
              <p className="mt-2 text-[11px] font-semibold text-emerald-600">
                ✓ PF exempt — both shares set to ₹0
              </p>
            )}
          </div>

          {/* Gratuity summary bar */}
          <div className="px-6 py-3 bg-amber-50 border-b border-amber-100">
            <p className="text-[10px] uppercase tracking-widest text-amber-500 font-semibold mb-1">
              Gratuity
            </p>
            <div className="flex items-center gap-6">
              <div>
                <p className="text-[10px] text-amber-400">Rate</p>
                <p className="text-[14px] font-semibold text-amber-600">4.81% of Basic</p>
              </div>
              <div>
                <p className="text-[10px] text-amber-400">This Month</p>
                <p className="text-[14px] font-bold text-amber-700">- {fmtINR(gratuity)}</p>
              </div>
              {gratuity === 0 && (
                <p className="text-[11px] font-semibold text-emerald-600">
                  ✓ Gratuity exempt — set to ₹0
                </p>
              )}
            </div>
          </div>

          {/* Net summary bar */}
          <div className="px-6 py-4 grid grid-cols-3 gap-6 bg-slate-50 border-b border-slate-100">
            <div className="flex flex-col gap-1">
              <span className="text-[10px] uppercase tracking-widest text-slate-400">Gross earned</span>
              <span className="text-[18px] font-semibold" style={{ color: "#1a3c6e" }}>{fmtINR(grossEarned)}</span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-[10px] uppercase tracking-widest text-slate-400">Total deductions</span>
              <span className="text-[18px] font-semibold text-red-500">- {fmtINR(totalDeduction)}</span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-[10px] uppercase tracking-widest text-slate-400">Net salary</span>
              <span className="text-[22px] font-bold text-emerald-600">{fmtINR(netSalary)}</span>
            </div>
          </div>

          <p className="px-6 pt-2 text-[11px] text-slate-400">
            ℹ️ PF: 12% Basic (employee) + 13% Basic (employer) = 25% total — both deducted from
            employee salary &nbsp;|&nbsp; Gratuity: 4.81% of Basic &nbsp;|&nbsp;
            PT = ₹200/month · ₹300 in February &nbsp;|&nbsp; PT for Female: applicable only if
            Gross &gt; ₹25,000 &nbsp;|&nbsp; Any field can be set to ₹0 to exempt the employee
          </p>

          <p className="text-center text-[11px] text-slate-400 italic px-6 py-3">
            Computer-generated payslip — no signature required.
          </p>
        </div>

        {/* Actions */}
        <div className="px-6 py-4 border-t border-slate-100 flex gap-3 flex-shrink-0">
          <button
            onClick={handleExcel}
            disabled={excelLoading}
            className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white transition-all flex items-center justify-center gap-2 disabled:opacity-60"
            style={{ background: "#1a3c6e" }}
          >
            {excelLoading ? (
              <>
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                </svg>
                Generating…
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Download Excel
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Main PayrollTable
// ─────────────────────────────────────────────────────────────────────────────
const PayrollTable = ({
  employees: employeesProp,
  forMonth,
  onUpdateStatus,
  onUpdateEmployee,
  onRefresh,
}) => {
  const [employees,      setEmployees]      = useState(employeesProp);
  const [activeTab,      setActiveTab]      = useState("pending");
  const [search,         setSearch]         = useState("");
  const [deptFilter,     setDeptFilter]     = useState("All");
  const [circleFilter,   setCircleFilter]   = useState("All");
  const [empTypeFilter,  setEmpTypeFilter]  = useState("All");
  const [viewTarget,     setViewTarget]     = useState(null);
  const [editTarget,     setEditTarget]     = useState(null);
  const [toast,          setToast]          = useState(null);
  const [exporting,      setExporting]      = useState(false);
  const [attendanceOpen, setAttendanceOpen] = useState(false);
  const [payingId,       setPayingId]       = useState(null);

  const correctMonthDays = getDaysInMonth(forMonth);

  React.useEffect(() => {
    setEmployees(employeesProp);
  }, [employeesProp]);

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3200);
  };

  // ── Derived filter options ────────────────────────────────────────────────
  const departments = [
    "All",
    ...new Set(employees.map((e) => e.department).filter(Boolean)),
  ];

  // ── Circles: use hardcoded list (same as EmploymentDetailsStep) ───────────
  // "All Circles" is prepended; the list is always complete regardless of
  // which employees are currently loaded.
  const circles = ["All", ...CIRCLES];

  const tabMap = { pending: ["Pending"], paid: ["Paid"] };

  // ── Filtering logic ───────────────────────────────────────────────────────
  const filtered = employees.filter((e) => {
    const matchTab  = tabMap[activeTab]?.includes(e.status);

    // Search: name, employee ID, circle/location, designation, department
    const q = search.toLowerCase();
    const matchSrch =
      !q ||
      (e.name            || "").toLowerCase().includes(q) ||
      (e.employeeId      || "").toLowerCase().includes(q) ||
      (e.currentLocation || "").toLowerCase().includes(q) ||
      (e.circle          || "").toLowerCase().includes(q) ||
      (e.designation     || "").toLowerCase().includes(q) ||
      (e.department      || "").toLowerCase().includes(q);

    const matchDept = deptFilter === "All" || e.department === deptFilter;

    // Circle filter — match against both currentLocation and circle fields
    const empCircle   = e.currentLocation || e.circle || "";
    const matchCircle = circleFilter === "All" || empCircle === circleFilter;

    // Employment type bucket filter
    const matchType =
      empTypeFilter === "All" || getEmpTypeBucket(e) === empTypeFilter;

    return matchTab && matchSrch && matchDept && matchCircle && matchType;
  });

  const pendingCount = employees.filter((e) => e.status === "Pending").length;
  const paidCount    = employees.filter((e) => e.status === "Paid").length;

  // ── Pay ───────────────────────────────────────────────────────────────────
  const handlePay = async (emp) => {
    setPayingId(emp.id);
    try {
      let recordId = emp.payrollRecordId;

      if (!recordId) {
        const payload = {
          employee_id:              emp.id,
          for_month:                emp.forMonth || forMonth,
          basic:                    n(emp.basic),
          hra:                      n(emp.hra),
          other_allowances:         n(emp.organisationAllowance),
          performance_pay:          n(emp.performancePay),
          pf_deduction:             emp.pfDeduction != null ? n(emp.pfDeduction) : undefined,
          employer_pf_contribution: emp.employerPfContribution != null ? n(emp.employerPfContribution) : undefined,
          pt:                       emp.pt != null ? n(emp.pt) : undefined,
          gratuity:                 emp.gratuity != null ? n(emp.gratuity) : undefined,
          tds:                      n(emp.tds),
          other_deduction:          n(emp.otherDeduction),
          p_days:                   emp.pDays != null ? n(emp.pDays) : undefined,
          month_days:               n(emp.monthDays) || correctMonthDays,
        };

        const result = await payrollService.upsertRecord(payload);
        recordId = result?.data?.id;

        if (!recordId) {
          showToast("❌ Could not create payroll record before paying.", "error");
          return;
        }

        setEmployees((prev) =>
          prev.map((e) => (e.id === emp.id ? { ...e, payrollRecordId: recordId } : e))
        );
      }

      await payrollService.markAsPaid(recordId);
      setEmployees((prev) =>
        prev.map((e) => (e.id === emp.id ? { ...e, status: "Paid" } : e))
      );
      onUpdateStatus?.(emp.id, "Paid");
      showToast(`💸 Salary disbursed for ${emp.name}!`);
    } catch (err) {
      showToast(`❌ ${err.message}`, "error");
    } finally {
      setPayingId(null);
    }
  };

  // ── Attendance saved ──────────────────────────────────────────────────────
  const handleAttendanceSave = useCallback(
    async (updatedRows) => {
      setEmployees((prev) =>
        prev.map((e) => {
          const found = updatedRows.find((r) => r.id === e.id);
          return found ? { ...e, ...found } : e;
        })
      );

      updatedRows.forEach(({ id, pDays, aDays, monthDays }) => {
        onUpdateEmployee?.(id, { pDays, aDays, monthDays });
      });

      try {
        const result = await payrollService.saveAttendance(
          updatedRows.map((r) => ({ ...r, forMonth }))
        );
        if (result.failed > 0) {
          showToast(
            `📅 Attendance updated (${result.saved} saved, ${result.failed} failed)`,
            "error"
          );
        } else {
          showToast(`📅 Attendance updated for ${result.saved} employees!`);
        }
      } catch (err) {
        showToast(`❌ Attendance save error: ${err.message}`, "error");
      }
    },
    [forMonth, onUpdateEmployee]
  );

  // ── Edit saved ────────────────────────────────────────────────────────────
  const handleEditSave = useCallback(
    async (updated) => {
      try {
        const payload = {
          employee_id:              updated.id,
          for_month:                updated.forMonth || forMonth,
          basic:                    n(updated.basic),
          hra:                      n(updated.hra),
          other_allowances:         n(updated.organisationAllowance),
          performance_pay:          n(updated.performancePay),
          pf_deduction:             updated.pfDeduction != null ? n(updated.pfDeduction) : undefined,
          employer_pf_contribution: updated.employerPfContribution != null ? n(updated.employerPfContribution) : undefined,
          pt:                       updated.pt != null ? n(updated.pt) : undefined,
          gratuity:                 updated.gratuity != null ? n(updated.gratuity) : undefined,
          tds:                      n(updated.tds),
          other_deduction:          n(updated.otherDeduction),
          p_days:                   updated.pDays != null ? n(updated.pDays) : undefined,
          month_days:               n(updated.monthDays) || correctMonthDays,
        };

        const result     = await payrollService.upsertRecord(payload);
        const serverData = result?.data || {};

        const safeServerVal = (serverVal, fallback) =>
          serverVal != null ? Number(serverVal) : fallback;

        const merged = {
          ...updated,
          basic:                 n(updated.basic),
          hra:                   n(updated.hra),
          organisationAllowance: n(updated.organisationAllowance),
          performancePay:        n(updated.performancePay),
          tds:                   n(updated.tds),
          otherDeduction:        n(updated.otherDeduction),
          pDays:                 updated.pDays,
          aDays:                 updated.aDays,
          monthDays:             updated.monthDays || correctMonthDays,
          pfDeduction:           safeServerVal(serverData.pf_deduction, n(updated.pfDeduction)),
          employerPfContribution: safeServerVal(serverData.employer_pf_contribution, n(updated.employerPfContribution)),
          pt:                    safeServerVal(serverData.pt, n(updated.pt)),
          gratuity:              safeServerVal(serverData.gratuity, n(updated.gratuity)),
          grossSalary:           serverData.gross_full    != null ? Number(serverData.gross_full)    : undefined,
          grossEarned:           serverData.gross_earned  != null ? Number(serverData.gross_earned)  : undefined,
          totalDeduction:        serverData.total_deduction != null ? Number(serverData.total_deduction) : undefined,
          netSalary:             serverData.net_salary    != null ? Number(serverData.net_salary)    : undefined,
          totalEarning:          serverData.total_earning != null ? Number(serverData.total_earning) : undefined,
          advanceDeduction:      safeServerVal(serverData.advance_deduction, n(updated.advanceDeduction)),
          advanceAddition:       safeServerVal(serverData.advance_addition,  n(updated.advanceAddition)),
          payrollRecordId:       serverData.id || updated.payrollRecordId,
        };

        setEmployees((prev) =>
          prev.map((e) => (e.id === updated.id ? { ...e, ...merged } : e))
        );
        onUpdateEmployee?.(updated.id, merged);
        setEditTarget(null);
        showToast(`✅ ${updated.name}'s details saved!`);
        onRefresh?.();
      } catch (err) {
        throw err;
      }
    },
    [forMonth, correctMonthDays, onUpdateEmployee, onRefresh]
  );

  // ── Export ────────────────────────────────────────────────────────────────
  const handleExport = async () => {
    if (exporting || filtered.length === 0) return;
    setExporting(true);
    try {
      const label = `${activeTab === "paid" ? "Paid" : "Pending"}_${
        deptFilter !== "All" ? deptFilter : "All_Depts"
      }`;
      await exportPayrollToExcel(filtered, label);
      showToast(`📊 Exported ${filtered.length} records!`);
    } catch {
      showToast("❌ Export failed.", "error");
    } finally {
      setExporting(false);
    }
  };

  // ── Totals ────────────────────────────────────────────────────────────────
  const totals = filtered.reduce(
    (acc, emp) => {
      const c = computePayslip(emp);
      return {
        basic:          acc.basic          + n(emp.basic),
        hra:            acc.hra            + n(emp.hra),
        orgAllow:       acc.orgAllow       + n(emp.organisationAllowance),
        perfPay:        acc.perfPay        + n(emp.performancePay),
        grossSalary:    acc.grossSalary    + c.grossSalary,
        grossEarned:    acc.grossEarned    + c.grossEarned,
        empPfDed:       acc.empPfDed       + c.empPfDeduction,
        employerPf:     acc.employerPf     + c.employerPfContribution,
        totalPf:        acc.totalPf        + c.totalPfContribution,
        pt:             acc.pt             + c.ptDeduction,
        gratuity:       acc.gratuity       + c.gratuity,
        tds:            acc.tds            + n(emp.tds),
        otherDed:       acc.otherDed       + n(emp.otherDeduction),
        advDed:         acc.advDed         + c.advanceDeduction,
        advAdd:         acc.advAdd         + c.advanceAddition,
        totalDeduction: acc.totalDeduction + c.totalDeduction,
        netSalary:      acc.netSalary      + c.netSalary,
        totalEarning:   acc.totalEarning   + c.totalEarning,
      };
    },
    {
      basic: 0, hra: 0, orgAllow: 0, perfPay: 0,
      grossSalary: 0, grossEarned: 0,
      empPfDed: 0, employerPf: 0, totalPf: 0,
      pt: 0, gratuity: 0, tds: 0, otherDed: 0,
      advDed: 0, advAdd: 0,
      totalDeduction: 0, netSalary: 0, totalEarning: 0,
    }
  );

  const TABLE_COLS = [
    "Employee",
    "Designation",
    "Circle / Location",
    "P Days / Month",
    "Basic",
    "HRA",
    "Org Allow.",
    "Perf Pay",
    "Gross",
    "Gross (days)",
    "PF Emp (12%)",
    "PF Co. (13%)",
    "Total PF (25%)",
    "PT",
    "Gratuity (4.81%)",
    "TDS",
    "Other Ded.",
    "Adv Ded.",
    "Adv Add.",
    "Total Ded.",
    "Net Salary",
    "Total Earning",
    "Status",
    "Actions",
  ];

  // ── Active filter count badge helper ─────────────────────────────────────
  const activeFiltersCount = [
    deptFilter    !== "All",
    circleFilter  !== "All",
    empTypeFilter !== "All",
    search.trim() !== "",
  ].filter(Boolean).length;

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100">
      {/* Toast */}
      {toast && (
        <div
          className={`fixed top-5 right-5 z-50 px-5 py-3 rounded-xl shadow-xl text-sm font-semibold border ${
            toast.type === "error"
              ? "bg-red-50 border-red-200 text-red-700"
              : "bg-white border-emerald-200 text-slate-800"
          }`}
        >
          {toast.msg}
        </div>
      )}

      {/* Modals */}
      {viewTarget && (
        <PayslipViewModal employee={viewTarget} onClose={() => setViewTarget(null)} />
      )}
      {editTarget && (
        <EmployeeDetailModal
          employee={editTarget}
          onClose={() => setEditTarget(null)}
          onSave={handleEditSave}
        />
      )}
      {attendanceOpen && (
        <AttendanceInputModal
          employees={employees}
          forMonth={forMonth}
          onClose={() => setAttendanceOpen(false)}
          onSave={handleAttendanceSave}
        />
      )}

      {/* ── Tabs + Toolbar ─────────────────────────────────────────────────── */}
      <div className="px-6 pt-5 pb-0 flex flex-col gap-3">

        {/* Row 1: Tabs + action buttons */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          {/* Tabs */}
          <div className="flex items-center gap-2">
            {[
              { key: "pending", label: "Pending", count: pendingCount },
              { key: "paid",    label: "Paid",    count: paidCount    },
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

          {/* Action buttons */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-xl bg-amber-50 border border-amber-200 text-xs font-semibold text-amber-700">
              PT: {/february/i.test(forMonth || "") ? "₹300 (Feb)" : "₹200"}
            </div>

            <button
              onClick={() => setAttendanceOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold border bg-indigo-600 text-white border-indigo-600 hover:bg-indigo-700"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              Attendance
            </button>

            <button
              onClick={handleExport}
              disabled={exporting || filtered.length === 0}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold border bg-emerald-600 text-white border-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {exporting ? (
                <>
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                  </svg>
                  Exporting…
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M12 10v6m0 0l-3-3m3 3l3-3M3 17V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
                  </svg>
                  Export Excel
                </>
              )}
            </button>
          </div>
        </div>

        {/* Row 2: Filter bar */}
        <div className="flex items-center gap-2 flex-wrap pb-3 border-b border-slate-100">

          {/* Search */}
          <div className="relative">
            <input
              type="text"
              placeholder="Search name, ID, circle, designation…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 pr-8 py-2 text-sm border border-slate-200 rounded-xl bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-200 w-64"
            />
            <svg
              className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2"
              fill="none" stroke="currentColor" viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-lg leading-none"
              >
                ×
              </button>
            )}
          </div>

          {/* Department filter */}
          <div className="relative">
            <select
              value={deptFilter}
              onChange={(e) => setDeptFilter(e.target.value)}
              className="text-sm border border-slate-200 rounded-xl pl-8 pr-3 py-2 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-200 text-slate-600 appearance-none"
            >
              {departments.map((d) => (
                <option key={d}>{d}</option>
              ))}
            </select>
            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs pointer-events-none">🏢</span>
          </div>

          {/* Employment Type filter */}
          <div className="relative">
            <select
              value={empTypeFilter}
              onChange={(e) => setEmpTypeFilter(e.target.value)}
              className={`text-sm border rounded-xl pl-8 pr-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-200 appearance-none transition-colors ${
                empTypeFilter !== "All"
                  ? "border-indigo-300 bg-indigo-50 text-indigo-700 font-semibold"
                  : "border-slate-200 bg-slate-50 text-slate-600"
              }`}
            >
              <option value="All">All Types</option>
              <option value="IT">IT</option>
              <option value="Telecom">Telecom</option>
              <option value="Other">Other</option>
            </select>
            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs pointer-events-none">⚙️</span>
          </div>

          {/* Circle / Location filter — hardcoded list */}
          <div className="relative">
            <select
              value={circleFilter}
              onChange={(e) => setCircleFilter(e.target.value)}
              className={`text-sm border rounded-xl pl-8 pr-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-200 appearance-none transition-colors ${
                circleFilter !== "All"
                  ? "border-emerald-300 bg-emerald-50 text-emerald-700 font-semibold"
                  : "border-slate-200 bg-slate-50 text-slate-600"
              }`}
            >
              {circles.map((c) => (
                <option key={c} value={c}>
                  {c === "All" ? "All Circles" : c}
                </option>
              ))}
            </select>
            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs pointer-events-none">📍</span>
          </div>

          {/* Active filters badge + clear button */}
          {activeFiltersCount > 0 && (
            <button
              onClick={() => {
                setSearch("");
                setDeptFilter("All");
                setCircleFilter("All");
                setEmpTypeFilter("All");
              }}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-red-50 border border-red-200 text-xs font-semibold text-red-600 hover:bg-red-100 transition-colors"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              Clear filters
              <span className="bg-red-200 text-red-700 rounded-full px-1.5 py-0.5 text-[10px] font-bold">
                {activeFiltersCount}
              </span>
            </button>
          )}

          {/* Result count */}
          <span className="ml-auto text-xs text-slate-400 font-medium">
            {filtered.length} of {employees.filter((e) => tabMap[activeTab]?.includes(e.status)).length} employees
          </span>
        </div>
      </div>

      {/* ── Table ────────────────────────────────────────────────────────────── */}
      <div className="overflow-x-auto mt-2">
        <table className="w-full text-sm" style={{ minWidth: "2400px" }}>
          <thead>
            <tr className="border-b border-slate-100 text-left">
              {TABLE_COLS.map((col) => (
                <th
                  key={col}
                  className="px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wide whitespace-nowrap"
                >
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((emp, i) => {
              const c             = computePayslip(emp);
              const isPayingThis  = payingId === emp.id;
              const isFemale      = /female|woman|f/i.test(emp.gender || "");
              const ptNA          = isFemale && c.grossSalary <= 25000;
              const pfExempt      =
                emp.pfDeduction != null &&
                n(emp.pfDeduction) === 0 &&
                emp.employerPfContribution != null &&
                n(emp.employerPfContribution) === 0;
              const typeBucket    = getEmpTypeBucket(emp);
              // Prefer circle field (set during onboarding) then currentLocation
              const circleVal     = emp.circle || emp.currentLocation || "—";

              return (
                <tr
                  key={emp.id}
                  className="border-b border-slate-50 hover:bg-slate-50/70 transition-colors"
                >
                  {/* Employee */}
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-8 h-8 rounded-lg bg-gradient-to-br ${AVATAR_COLORS[i % AVATAR_COLORS.length]} flex items-center justify-center text-white text-xs font-bold flex-shrink-0`}
                      >
                        {emp.name?.[0] || "?"}
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-slate-800 whitespace-nowrap">{emp.name}</p>
                        <p className="text-xs text-slate-400">{emp.employeeId}</p>
                        {/* Employment type chip */}
                        <span className={`inline-block text-[10px] font-semibold px-1.5 py-0.5 rounded-full mt-0.5 ${
                          typeBucket === "IT"
                            ? "bg-blue-50 text-blue-600 border border-blue-100"
                            : typeBucket === "Telecom"
                              ? "bg-violet-50 text-violet-600 border border-violet-100"
                              : "bg-slate-50 text-slate-500 border border-slate-100"
                        }`}>
                          {typeBucket}
                        </span>
                        {emp.advancePendingCount > 0 && (
                          <span className="ml-1 text-[10px] bg-amber-50 text-amber-600 border border-amber-200 rounded-full px-2 py-0.5 font-semibold">
                            {emp.advancePendingCount} advance
                          </span>
                        )}
                      </div>
                    </div>
                  </td>

                  <td className="px-4 py-4 whitespace-nowrap">
                    <p className="text-slate-700">{emp.designation}</p>
                    <p className="text-xs text-slate-400">{emp.department}</p>
                  </td>

                  {/* Circle / Location */}
                  <td className="px-4 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-1">
                      <span className="text-[11px]">📍</span>
                      <span className="text-slate-600 text-sm">{circleVal}</span>
                    </div>
                  </td>

                  <td className="px-4 py-4 whitespace-nowrap text-slate-600">
                    <span className="font-semibold">
                      {n(emp.pDays) || n(emp.monthDays) || correctMonthDays}
                    </span>
                    <span className="text-slate-400"> / {n(emp.monthDays) || correctMonthDays}</span>
                    <p className="text-xs text-slate-400">Absent: {n(emp.aDays)}</p>
                  </td>

                  <td className="px-4 py-4 whitespace-nowrap text-slate-700">{fmtINR(emp.basic)}</td>
                  <td className="px-4 py-4 whitespace-nowrap text-slate-700">{fmtINR(emp.hra)}</td>
                  <td className="px-4 py-4 whitespace-nowrap text-slate-700">{fmtINR(emp.organisationAllowance)}</td>
                  <td className="px-4 py-4 whitespace-nowrap text-emerald-600 italic">{fmtINR(emp.performancePay)}</td>

                  <td className="px-4 py-4 whitespace-nowrap font-semibold text-slate-700">{fmtINR(c.grossSalary)}</td>
                  <td className="px-4 py-4 whitespace-nowrap font-semibold text-indigo-600">{fmtINR(c.grossEarned)}</td>

                  {/* Employee PF */}
                  <td className="px-4 py-4 whitespace-nowrap">
                    {pfExempt ? (
                      <span className="text-emerald-500 text-xs font-semibold">Exempt</span>
                    ) : (
                      <span className="text-red-400">{fmtINR(c.empPfDeduction)}</span>
                    )}
                    <p className="text-[10px] text-slate-400">emp 12%</p>
                  </td>

                  {/* Employer PF */}
                  <td className="px-4 py-4 whitespace-nowrap">
                    {pfExempt ? (
                      <span className="text-emerald-500 text-xs font-semibold">Exempt</span>
                    ) : (
                      <span className="text-red-400">{fmtINR(c.employerPfContribution)}</span>
                    )}
                    <p className="text-[10px] text-red-300">co. 13% ↓</p>
                  </td>

                  {/* Total PF */}
                  <td className="px-4 py-4 whitespace-nowrap">
                    {pfExempt ? (
                      <span className="text-emerald-500 text-xs font-bold">₹0 (Exempt)</span>
                    ) : (
                      <span className="text-red-600 font-bold">{fmtINR(c.totalPfContribution)}</span>
                    )}
                    <p className="text-[10px] text-red-400">total 25%</p>
                  </td>

                  {/* PT */}
                  <td className="px-4 py-4 whitespace-nowrap">
                    {ptNA || (emp.pt != null && n(emp.pt) === 0) ? (
                      <span className="text-slate-300 text-xs">N/A</span>
                    ) : (
                      <span className="text-red-400">{fmtINR(c.ptDeduction)}</span>
                    )}
                    {/february/i.test(emp.forMonth || "") && !ptNA && !(emp.pt != null && n(emp.pt) === 0) && (
                      <p className="text-[10px] text-amber-500">Feb rate</p>
                    )}
                    {ptNA && <p className="text-[10px] text-emerald-500">gross ≤₹25K</p>}
                  </td>

                  {/* Gratuity */}
                  <td className="px-4 py-4 whitespace-nowrap">
                    {emp.gratuity != null && n(emp.gratuity) === 0 ? (
                      <span className="text-emerald-500 text-xs font-semibold">Exempt</span>
                    ) : (
                      <span className="text-amber-600">{fmtINR(c.gratuity)}</span>
                    )}
                    <p className="text-[10px] text-amber-400">4.81% basic</p>
                  </td>

                  <td className="px-4 py-4 whitespace-nowrap text-red-400">{fmtINR(emp.tds)}</td>
                  <td className="px-4 py-4 whitespace-nowrap text-red-400">{fmtINR(emp.otherDeduction)}</td>

                  <td className="px-4 py-4 whitespace-nowrap">
                    {c.advanceDeduction > 0 ? (
                      <span className="text-red-500 font-medium">- {fmtINR(c.advanceDeduction)}</span>
                    ) : (
                      <span className="text-slate-300">—</span>
                    )}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    {c.advanceAddition > 0 ? (
                      <span className="text-emerald-600 font-medium">+ {fmtINR(c.advanceAddition)}</span>
                    ) : (
                      <span className="text-slate-300">—</span>
                    )}
                  </td>

                  <td className="px-4 py-4 whitespace-nowrap font-semibold text-red-500">{fmtINR(c.totalDeduction)}</td>
                  <td className="px-4 py-4 whitespace-nowrap font-extrabold text-emerald-600">{fmtINR(c.netSalary)}</td>
                  <td className="px-4 py-4 whitespace-nowrap font-extrabold text-slate-800">{fmtINR(c.totalEarning)}</td>

                  <td className="px-4 py-4">
                    <StatusBadge status={emp.status} />
                  </td>

                  <td className="px-4 py-4">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setViewTarget(emp)}
                        title="View Payslip"
                        className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      </button>

                      <button
                        onClick={() => setEditTarget(emp)}
                        title="Edit"
                        className="p-1.5 rounded-lg hover:bg-indigo-50 text-slate-400 hover:text-indigo-500 transition-colors"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>

                      {emp.status !== "Paid" && (
                        <button
                          onClick={() => handlePay(emp)}
                          disabled={isPayingThis}
                          title="Pay Salary"
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-600 text-xs font-semibold transition-colors border border-emerald-100 disabled:opacity-60"
                        >
                          {isPayingThis ? (
                            <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                            </svg>
                          ) : (
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          )}
                          Pay
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}

            {/* Totals row */}
            {filtered.length > 0 && (
              <tr className="border-t-2 border-slate-200 bg-slate-50 font-semibold text-slate-700">
                <td className="px-4 py-3 text-xs uppercase tracking-wide text-slate-500" colSpan={4}>
                  Totals ({filtered.length} employees)
                </td>
                <td className="px-4 py-3 whitespace-nowrap">{fmtINR(totals.basic)}</td>
                <td className="px-4 py-3 whitespace-nowrap">{fmtINR(totals.hra)}</td>
                <td className="px-4 py-3 whitespace-nowrap">{fmtINR(totals.orgAllow)}</td>
                <td className="px-4 py-3 whitespace-nowrap text-emerald-600">{fmtINR(totals.perfPay)}</td>
                <td className="px-4 py-3 whitespace-nowrap">{fmtINR(totals.grossSalary)}</td>
                <td className="px-4 py-3 whitespace-nowrap text-indigo-600">{fmtINR(totals.grossEarned)}</td>
                <td className="px-4 py-3 whitespace-nowrap text-red-400">{fmtINR(totals.empPfDed)}</td>
                <td className="px-4 py-3 whitespace-nowrap text-red-400">{fmtINR(totals.employerPf)}</td>
                <td className="px-4 py-3 whitespace-nowrap text-red-600 font-bold">{fmtINR(totals.totalPf)}</td>
                <td className="px-4 py-3 whitespace-nowrap text-red-400">{fmtINR(totals.pt)}</td>
                <td className="px-4 py-3 whitespace-nowrap text-amber-600">{fmtINR(totals.gratuity)}</td>
                <td className="px-4 py-3 whitespace-nowrap text-red-400">{fmtINR(totals.tds)}</td>
                <td className="px-4 py-3 whitespace-nowrap text-red-400">{fmtINR(totals.otherDed)}</td>
                <td className="px-4 py-3 whitespace-nowrap text-red-500">
                  {totals.advDed > 0 ? `- ${fmtINR(totals.advDed)}` : "—"}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-emerald-600">
                  {totals.advAdd > 0 ? `+ ${fmtINR(totals.advAdd)}` : "—"}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-red-500">{fmtINR(totals.totalDeduction)}</td>
                <td className="px-4 py-3 whitespace-nowrap text-emerald-600 text-base">{fmtINR(totals.netSalary)}</td>
                <td className="px-4 py-3 whitespace-nowrap text-slate-800 text-base">{fmtINR(totals.totalEarning)}</td>
                <td colSpan={2} />
              </tr>
            )}
          </tbody>
        </table>

        {filtered.length === 0 && (
          <div className="py-16 text-center">
            <p className="text-slate-400 text-sm">No {activeTab} records match the current filters.</p>
            {activeFiltersCount > 0 && (
              <button
                onClick={() => {
                  setSearch("");
                  setDeptFilter("All");
                  setCircleFilter("All");
                  setEmpTypeFilter("All");
                }}
                className="mt-3 text-xs text-indigo-500 underline hover:text-indigo-700"
              >
                Clear all filters
              </button>
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-6 py-3 border-t border-slate-100 flex items-center justify-between flex-wrap gap-2">
        <p className="text-xs text-slate-400">
          Showing {filtered.length} of {employees.length} employees
          &nbsp;·&nbsp;
          {forMonth} · {correctMonthDays} days &nbsp;·&nbsp;
          PF = 12% Emp + 13% Co. = 25% total &nbsp;·&nbsp;
          Gratuity = 4.81% of Basic &nbsp;·&nbsp;
          PT = ₹{/february/i.test(forMonth || "") ? "300 (Feb)" : "200"}/month
          &nbsp;·&nbsp; ♀ PT only if Gross &gt; ₹25,000 &nbsp;·&nbsp;
          Set any field to ₹0 to exempt
        </p>
        {/* Active filter summary */}
        {(circleFilter !== "All" || empTypeFilter !== "All") && (
          <p className="text-xs text-slate-500 font-medium">
            {empTypeFilter !== "All" && (
              <span className="mr-2">
                {empTypeFilter === "IT" ? "💻" : "📡"} {empTypeFilter}
              </span>
            )}
            {circleFilter !== "All" && <span>📍 {circleFilter}</span>}
          </p>
        )}
      </div>
    </div>
  );
};

export default PayrollTable;