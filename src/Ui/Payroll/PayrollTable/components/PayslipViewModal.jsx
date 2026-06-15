import React, { useState } from "react";
import {
  downloadPayslipExcel,
  downloadPayslipPDF,
} from "../../PayslipGenerator.jsx";
import { n, fmtINR, computePayslip } from "../utils";

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

const SpinnerIcon = () => (
  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
    <circle
      className="opacity-25"
      cx="12"
      cy="12"
      r="10"
      stroke="currentColor"
      strokeWidth="4"
    />
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
  </svg>
);

const PayslipViewModal = ({ employee, onClose }) => {
  const [excelLoading, setExcelLoading] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);

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
  } = computePayslip(employee);

  const monthDays = n(employee.monthDays) || 30;
  const pDays = employee.pDays != null ? n(employee.pDays) : monthDays;
  const ratio = monthDays > 0 ? pDays / monthDays : 1;
  const isFemale = /female|woman|f/i.test(employee.gender || "");
  const ptNotApplicable = isFemale && grossSalary <= 25000;

  const initials = (employee.name || "?")
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();

  const handleExcel = async () => {
    setExcelLoading(true);
    try {
      await downloadPayslipExcel(employee);
    } finally {
      setExcelLoading(false);
    }
  };

  const handlePdf = async () => {
    setPdfLoading(true);
    try {
      await downloadPayslipPDF(employee);
    } finally {
      setPdfLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center p-3 sm:p-4"
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
          className="flex items-center justify-between px-4 sm:px-6 py-4 sm:py-5 flex-shrink-0"
          style={{ background: "#1a3c6e" }}
        >
          <div className="flex items-center gap-3 min-w-0">
            <div
              className="w-10 h-10 sm:w-11 sm:h-11 rounded-full flex items-center justify-center text-sm font-semibold text-white flex-shrink-0"
              style={{ background: "rgba(255,255,255,0.15)" }}
            >
              {initials}
            </div>
            <div className="min-w-0">
              <p className="text-white font-semibold text-[14px] sm:text-[15px] leading-tight truncate">
                {employee.name}
              </p>
              <p className="text-blue-200 text-[11px] sm:text-[12px] mt-0.5 truncate">
                {employee.employeeId} · {employee.designation}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 flex-shrink-0">
            <div className="text-right hidden sm:block">
              <p className="text-[10px] uppercase tracking-wider text-blue-300">
                Payslip for
              </p>
              <p className="text-white text-[13px] font-semibold mt-0.5">
                {employee.forMonth}
              </p>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-sm flex-shrink-0"
              style={{ background: "rgba(255,255,255,0.15)" }}
            >
              ✕
            </button>
          </div>
        </div>

        {/* Company banner */}
        <div
          className="text-center px-4 sm:px-6 py-2.5 border-b border-slate-100 flex-shrink-0"
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
          {/* Meta grid */}
          <div className="px-4 sm:px-6 py-4 grid grid-cols-2 sm:grid-cols-3 gap-x-4 sm:gap-x-6 gap-y-3 border-b border-slate-100">
            <MetaField label="Joining date" value={employee.joiningDate} />
            <MetaField
              label="Location"
              value={employee.currentLocation || employee.circle}
            />
            <MetaField
              label="P days / Month"
              value={`${pDays} / ${monthDays}`}
            />
            <MetaField label="Absent days" value={n(employee.aDays)} />
            <MetaField label="Bank" value={employee.bankName} />
            <MetaField
              label="A/C no"
              value={employee.accountNumber || employee.bankAccountNo}
            />
            <MetaField label="IFSC" value={employee.ifscCode} />
            <MetaField label="PAN" value={employee.panNo} />
            <MetaField label="Aadhar" value={employee.aadharNo} />
          </div>

          {/* Earnings & Deductions */}
          <div className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-slate-100 border-b border-slate-100">
            <div className="px-4 sm:px-5 py-4">
              <p className="text-[10px] uppercase tracking-widest text-slate-400 font-semibold mb-3">
                Earnings
              </p>
              <div className="overflow-x-auto">
                <table
                  className="w-full border-collapse"
                  style={{ minWidth: 240 }}
                >
                  <thead>
                    <tr>
                      <th className="text-left pb-1.5 text-[10px] text-slate-400 font-normal">
                        Head
                      </th>
                      <th className="text-right pb-1.5 text-[10px] text-slate-400 font-normal">
                        Gross
                      </th>
                      <th className="text-right pb-1.5 text-[10px] text-slate-400 font-normal">
                        Earned
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    <EarningRow
                      label="Basic"
                      gross={n(employee.basic)}
                      earned={n(employee.basic) * ratio}
                    />
                    <EarningRow
                      label="HRA"
                      gross={n(employee.hra)}
                      earned={n(employee.hra) * ratio}
                    />
                    <EarningRow
                      label="Org. allowance"
                      gross={n(employee.organisationAllowance)}
                      earned={n(employee.organisationAllowance) * ratio}
                    />
                    {advanceAddition > 0 && (
                      <tr className="text-[12px]">
                        <td className="py-1 text-emerald-600 font-medium">
                          Advance (addition)
                        </td>
                        <td className="py-1 text-right text-emerald-600">—</td>
                        <td className="py-1 text-right text-emerald-600">
                          + {fmtINR(advanceAddition)}
                        </td>
                      </tr>
                    )}
                    <tr className="border-t border-slate-100 text-[12px]">
                      <td
                        className="py-1.5 font-semibold"
                        style={{ color: "#1a3c6e" }}
                      >
                        Subtotal
                      </td>
                      <td
                        className="py-1.5 text-right font-semibold"
                        style={{ color: "#1a3c6e" }}
                      >
                        {fmtINR(grossSalary)}
                      </td>
                      <td
                        className="py-1.5 text-right font-semibold"
                        style={{ color: "#1a3c6e" }}
                      >
                        {fmtINR(grossEarned + advanceAddition)}
                      </td>
                    </tr>
                    <tr className="text-[12px]">
                      <td className="py-1 text-slate-400 italic">Perf. pay</td>
                      <td className="py-1 text-right text-slate-400 italic">
                        {fmtINR(n(employee.performancePay))}
                      </td>
                      <td className="py-1 text-right text-slate-400 italic">
                        {fmtINR(perfEarned)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <div className="px-4 sm:px-5 py-4">
              <p className="text-[10px] uppercase tracking-widest text-slate-400 font-semibold mb-3">
                Deductions
              </p>
              <div className="overflow-x-auto">
                <table
                  className="w-full border-collapse"
                  style={{ minWidth: 200 }}
                >
                  <thead>
                    <tr>
                      <th className="text-left pb-1.5 text-[10px] text-slate-400 font-normal">
                        Head
                      </th>
                      <th className="text-right pb-1.5 text-[10px] text-slate-400 font-normal">
                        Amount
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    <DeductRow
                      label={`PF – Employee (12% of ₹${n(employee.basic).toLocaleString("en-IN")})`}
                      amount={empPfDeduction}
                    />
                    <DeductRow
                      label={`PF – Employer (13% of ₹${n(employee.basic).toLocaleString("en-IN")})`}
                      amount={employerPfContribution}
                    />
                    <tr className="text-[12px] bg-red-50/50">
                      <td className="py-1 text-red-600 font-semibold">
                        Total PF (25%)
                      </td>
                      <td className="py-1 text-right font-bold text-red-600">
                        - {fmtINR(totalPfContribution)}
                      </td>
                    </tr>
                    <tr className="text-[12px]">
                      <td className="py-1 text-slate-600">
                        PT
                        {/february/i.test(employee.forMonth || "")
                          ? " (Feb)"
                          : ""}
                        {ptNotApplicable && (
                          <span className="ml-1 text-[10px] text-emerald-600 font-semibold">
                            N/A (gross ≤ ₹25K)
                          </span>
                        )}
                      </td>
                      <td
                        className={`py-1 text-right font-medium ${ptDeduction > 0 ? "text-red-500" : "text-slate-400"}`}
                      >
                        {ptDeduction > 0
                          ? `- ${fmtINR(ptDeduction)}`
                          : fmtINR(0)}
                      </td>
                    </tr>
                    <DeductRow
                      label={`Gratuity (4.81% of ₹${n(employee.basic).toLocaleString("en-IN")})`}
                      amount={gratuity}
                    />
                    <DeductRow label="TDS" amount={n(employee.tds)} />
                    <DeductRow
                      label="Other"
                      amount={n(employee.otherDeduction)}
                    />
                    {advanceDeduction > 0 && (
                      <DeductRow
                        label="Advance recovery"
                        amount={advanceDeduction}
                      />
                    )}
                    <tr className="border-t border-slate-100 text-[12px]">
                      <td className="py-1.5 font-semibold text-red-500">
                        Total deductions
                      </td>
                      <td className="py-1.5 text-right font-semibold text-red-500">
                        - {fmtINR(totalDeduction)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* PF summary */}
          <div className="px-4 sm:px-6 py-3 bg-red-50 border-b border-red-100">
            <p className="text-[10px] uppercase tracking-widest text-red-400 font-semibold mb-2">
              PF Summary — Both Shares Deducted from Employee Salary
            </p>
            <div className="grid grid-cols-3 gap-2 sm:gap-4">
              {[
                { label: "Employee Share (12%)", value: empPfDeduction },
                {
                  label: "Employer Share (13%)",
                  value: employerPfContribution,
                },
                {
                  label: "Total PF Deducted (25%)",
                  value: totalPfContribution,
                  bold: true,
                },
              ].map(({ label, value, bold }) => (
                <div key={label}>
                  <p className="text-[10px] text-red-400">{label}</p>
                  <p
                    className={`text-[13px] sm:text-[14px] ${bold ? "font-bold text-red-700" : "font-semibold text-red-500"}`}
                  >
                    - {fmtINR(value)}
                  </p>
                </div>
              ))}
            </div>
            {empPfDeduction === 0 && employerPfContribution === 0 && (
              <p className="mt-2 text-[11px] font-semibold text-emerald-600">
                ✓ PF exempt — both shares set to ₹0
              </p>
            )}
          </div>

          {/* Gratuity summary */}
          <div className="px-4 sm:px-6 py-3 bg-amber-50 border-b border-amber-100">
            <p className="text-[10px] uppercase tracking-widest text-amber-500 font-semibold mb-1">
              Gratuity
            </p>
            <div className="flex items-center gap-4 sm:gap-6 flex-wrap">
              <div>
                <p className="text-[10px] text-amber-400">Rate</p>
                <p className="text-[13px] sm:text-[14px] font-semibold text-amber-600">
                  4.81% of Basic
                </p>
              </div>
              <div>
                <p className="text-[10px] text-amber-400">This Month</p>
                <p className="text-[13px] sm:text-[14px] font-bold text-amber-700">
                  - {fmtINR(gratuity)}
                </p>
              </div>
              {gratuity === 0 && (
                <p className="text-[11px] font-semibold text-emerald-600">
                  ✓ Gratuity exempt — set to ₹0
                </p>
              )}
            </div>
          </div>

          {/* Net summary */}
          <div className="px-4 sm:px-6 py-4 grid grid-cols-3 gap-3 sm:gap-6 bg-slate-50 border-b border-slate-100">
            <div className="flex flex-col gap-1">
              <span className="text-[10px] uppercase tracking-widest text-slate-400">
                Gross earned
              </span>
              <span
                className="text-[15px] sm:text-[18px] font-semibold"
                style={{ color: "#1a3c6e" }}
              >
                {fmtINR(grossEarned)}
              </span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-[10px] uppercase tracking-widest text-slate-400">
                Total deductions
              </span>
              <span className="text-[15px] sm:text-[18px] font-semibold text-red-500">
                - {fmtINR(totalDeduction)}
              </span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-[10px] uppercase tracking-widest text-slate-400">
                Net salary
              </span>
              <span className="text-[18px] sm:text-[22px] font-bold text-emerald-600">
                {fmtINR(netSalary)}
              </span>
            </div>
          </div>

          <p className="px-4 sm:px-6 pt-2 text-[11px] text-slate-400 leading-relaxed">
            ℹ️ PF: 12% Basic (employee) + 13% Basic (employer) = 25% total —
            both deducted from employee salary | Gratuity: 4.81% of Basic | PT =
            ₹200/month · ₹300 in February | PT for Female: applicable only if
            Gross &gt; ₹25,000 | Any field can be set to ₹0 to exempt the
            employee
          </p>
          <p className="text-center text-[11px] text-slate-400 italic px-4 sm:px-6 py-3">
            Computer-generated payslip — no signature required.
          </p>
        </div>

        {/* Actions */}
        <div className="px-4 sm:px-6 py-4 border-t border-slate-100 flex gap-3 flex-shrink-0">
          <button
            onClick={handlePdf}
            disabled={pdfLoading}
            className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white transition-all flex items-center justify-center gap-2 disabled:opacity-60"
            style={{ background: "#c0392b" }}
          >
            {pdfLoading ? (
              <>
                <SpinnerIcon /> Generating…
              </>
            ) : (
              <>
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
                    d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 13h6M9 17h4"
                  />
                </svg>
                Download PDF
              </>
            )}
          </button>

          <button
            onClick={handleExcel}
            disabled={excelLoading}
            className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white transition-all flex items-center justify-center gap-2 disabled:opacity-60"
            style={{ background: "#1a3c6e" }}
          >
            {excelLoading ? (
              <>
                <SpinnerIcon /> Generating…
              </>
            ) : (
              <>
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
                    d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                  />
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

export default PayslipViewModal;
