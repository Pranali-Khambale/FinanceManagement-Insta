import React from "react";
import { n, fmtINR, computePayslip, getEmpTypeBucket } from "../utils";
import { AVATAR_COLORS, TABLE_COLS } from "../constants";
import StatusBadge from "./StatusBadge";

const SpinnerSmall = () => (
  <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
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

const PayrollTableBody = ({
  filtered,
  forMonth,
  correctMonthDays,
  payingId,
  totals,
  activeTab,
  activeFiltersCount,
  clearAllFilters,
  onView,
  onEdit,
  onPay,
}) => (
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
          const c = computePayslip(emp);
          const isPayingThis = payingId === emp.id;
          const isFemale = /female|woman|f/i.test(emp.gender || "");
          const ptNA = isFemale && c.grossSalary <= 25000;
          const pfExempt =
            emp.pfDeduction != null &&
            n(emp.pfDeduction) === 0 &&
            emp.employerPfContribution != null &&
            n(emp.employerPfContribution) === 0;
          const typeBucket = getEmpTypeBucket(emp);
          const circleVal = emp.circle || emp.currentLocation || "—";

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
                    <p className="font-semibold text-slate-800 whitespace-nowrap">
                      {emp.name}
                    </p>
                    <p className="text-xs text-slate-400">{emp.employeeId}</p>
                    <span
                      className={`inline-block text-[10px] font-semibold px-1.5 py-0.5 rounded-full mt-0.5 ${
                        typeBucket === "IT"
                          ? "bg-blue-50 text-blue-600 border border-blue-100"
                          : typeBucket === "Telecom"
                            ? "bg-violet-50 text-violet-600 border border-violet-100"
                            : "bg-slate-50 text-slate-500 border border-slate-100"
                      }`}
                    >
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

              <td className="px-4 py-4 whitespace-nowrap">
                <span className="text-slate-600 text-sm">{circleVal}</span>
              </td>

              <td className="px-4 py-4 whitespace-nowrap text-slate-600">
                <span className="font-semibold">
                  {n(emp.pDays) || n(emp.monthDays) || correctMonthDays}
                </span>
                <span className="text-slate-400">
                  {" "}
                  / {n(emp.monthDays) || correctMonthDays}
                </span>
                <p className="text-xs text-slate-400">Absent: {n(emp.aDays)}</p>
              </td>

              <td className="px-4 py-4 whitespace-nowrap text-slate-700">
                {fmtINR(emp.basic)}
              </td>
              <td className="px-4 py-4 whitespace-nowrap text-slate-700">
                {fmtINR(emp.hra)}
              </td>
              <td className="px-4 py-4 whitespace-nowrap text-slate-700">
                {fmtINR(emp.organisationAllowance)}
              </td>
              <td className="px-4 py-4 whitespace-nowrap text-emerald-600 italic">
                {fmtINR(emp.performancePay)}
              </td>

              <td className="px-4 py-4 whitespace-nowrap font-semibold text-slate-700">
                {fmtINR(c.grossSalary)}
              </td>
              <td className="px-4 py-4 whitespace-nowrap font-semibold text-indigo-600">
                {fmtINR(c.grossEarned)}
              </td>

              <td className="px-4 py-4 whitespace-nowrap">
                {pfExempt ? (
                  <span className="text-emerald-500 text-xs font-semibold">
                    Exempt
                  </span>
                ) : (
                  <span className="text-red-400">
                    {fmtINR(c.empPfDeduction)}
                  </span>
                )}
                <p className="text-[10px] text-slate-400">emp 12%</p>
              </td>

              <td className="px-4 py-4 whitespace-nowrap">
                {pfExempt ? (
                  <span className="text-emerald-500 text-xs font-semibold">
                    Exempt
                  </span>
                ) : (
                  <span className="text-red-400">
                    {fmtINR(c.employerPfContribution)}
                  </span>
                )}
                <p className="text-[10px] text-red-300">co. 13%</p>
              </td>

              <td className="px-4 py-4 whitespace-nowrap">
                {pfExempt ? (
                  <span className="text-emerald-500 text-xs font-bold">
                    ₹0 (Exempt)
                  </span>
                ) : (
                  <span className="text-red-600 font-bold">
                    {fmtINR(c.totalPfContribution)}
                  </span>
                )}
                <p className="text-[10px] text-red-400">total 25%</p>
              </td>

              <td className="px-4 py-4 whitespace-nowrap">
                {ptNA || (emp.pt != null && n(emp.pt) === 0) ? (
                  <span className="text-slate-300 text-xs">N/A</span>
                ) : (
                  <span className="text-red-400">{fmtINR(c.ptDeduction)}</span>
                )}
                {/february/i.test(emp.forMonth || "") &&
                  !ptNA &&
                  !(emp.pt != null && n(emp.pt) === 0) && (
                    <p className="text-[10px] text-amber-500">Feb rate</p>
                  )}
                {ptNA && (
                  <p className="text-[10px] text-emerald-500">gross ≤₹25K</p>
                )}
              </td>

              <td className="px-4 py-4 whitespace-nowrap">
                {emp.gratuity != null && n(emp.gratuity) === 0 ? (
                  <span className="text-emerald-500 text-xs font-semibold">
                    Exempt
                  </span>
                ) : (
                  <span className="text-amber-600">{fmtINR(c.gratuity)}</span>
                )}
                <p className="text-[10px] text-amber-400">4.81% basic</p>
              </td>

              <td className="px-4 py-4 whitespace-nowrap text-red-400">
                {fmtINR(emp.tds)}
              </td>
              <td className="px-4 py-4 whitespace-nowrap text-red-400">
                {fmtINR(emp.otherDeduction)}
              </td>

              <td className="px-4 py-4 whitespace-nowrap">
                {c.advanceDeduction > 0 ? (
                  <span className="text-red-500 font-medium">
                    - {fmtINR(c.advanceDeduction)}
                  </span>
                ) : (
                  <span className="text-slate-300">—</span>
                )}
              </td>
              <td className="px-4 py-4 whitespace-nowrap">
                {c.advanceAddition > 0 ? (
                  <span className="text-emerald-600 font-medium">
                    + {fmtINR(c.advanceAddition)}
                  </span>
                ) : (
                  <span className="text-slate-300">—</span>
                )}
              </td>

              <td className="px-4 py-4 whitespace-nowrap font-semibold text-red-500">
                {fmtINR(c.totalDeduction)}
              </td>
              <td className="px-4 py-4 whitespace-nowrap font-extrabold text-emerald-600">
                {fmtINR(c.netSalary)}
              </td>
              <td className="px-4 py-4 whitespace-nowrap font-extrabold text-slate-800">
                {fmtINR(c.totalEarning)}
              </td>

              <td className="px-4 py-4">
                <StatusBadge status={emp.status} />
              </td>

              <td className="px-4 py-4">
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => onView(emp)}
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

                  <button
                    onClick={() => onEdit(emp)}
                    title="Edit"
                    className="p-1.5 rounded-lg hover:bg-indigo-50 text-slate-400 hover:text-indigo-500 transition-colors"
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
                        d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                      />
                    </svg>
                  </button>

                  {emp.status !== "Paid" && (
                    <button
                      onClick={() => onPay(emp)}
                      disabled={isPayingThis}
                      title="Pay Salary"
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-600 text-xs font-semibold transition-colors border border-emerald-100 disabled:opacity-60"
                    >
                      {isPayingThis ? (
                        <SpinnerSmall />
                      ) : (
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
            <td
              className="px-4 py-3 text-xs uppercase tracking-wide text-slate-500"
              colSpan={4}
            >
              Totals ({filtered.length} employees)
            </td>
            <td className="px-4 py-3 whitespace-nowrap">
              {fmtINR(totals.basic)}
            </td>
            <td className="px-4 py-3 whitespace-nowrap">
              {fmtINR(totals.hra)}
            </td>
            <td className="px-4 py-3 whitespace-nowrap">
              {fmtINR(totals.orgAllow)}
            </td>
            <td className="px-4 py-3 whitespace-nowrap text-emerald-600">
              {fmtINR(totals.perfPay)}
            </td>
            <td className="px-4 py-3 whitespace-nowrap">
              {fmtINR(totals.grossSalary)}
            </td>
            <td className="px-4 py-3 whitespace-nowrap text-indigo-600">
              {fmtINR(totals.grossEarned)}
            </td>
            <td className="px-4 py-3 whitespace-nowrap text-red-400">
              {fmtINR(totals.empPfDed)}
            </td>
            <td className="px-4 py-3 whitespace-nowrap text-red-400">
              {fmtINR(totals.employerPf)}
            </td>
            <td className="px-4 py-3 whitespace-nowrap text-red-600 font-bold">
              {fmtINR(totals.totalPf)}
            </td>
            <td className="px-4 py-3 whitespace-nowrap text-red-400">
              {fmtINR(totals.pt)}
            </td>
            <td className="px-4 py-3 whitespace-nowrap text-amber-600">
              {fmtINR(totals.gratuity)}
            </td>
            <td className="px-4 py-3 whitespace-nowrap text-red-400">
              {fmtINR(totals.tds)}
            </td>
            <td className="px-4 py-3 whitespace-nowrap text-red-400">
              {fmtINR(totals.otherDed)}
            </td>
            <td className="px-4 py-3 whitespace-nowrap text-red-500">
              {totals.advDed > 0 ? `- ${fmtINR(totals.advDed)}` : "—"}
            </td>
            <td className="px-4 py-3 whitespace-nowrap text-emerald-600">
              {totals.advAdd > 0 ? `+ ${fmtINR(totals.advAdd)}` : "—"}
            </td>
            <td className="px-4 py-3 whitespace-nowrap text-red-500">
              {fmtINR(totals.totalDeduction)}
            </td>
            <td className="px-4 py-3 whitespace-nowrap text-emerald-600 text-base">
              {fmtINR(totals.netSalary)}
            </td>
            <td className="px-4 py-3 whitespace-nowrap text-slate-800 text-base">
              {fmtINR(totals.totalEarning)}
            </td>
            <td colSpan={2} />
          </tr>
        )}
      </tbody>
    </table>

    {filtered.length === 0 && (
      <div className="py-16 text-center">
        <p className="text-slate-400 text-sm">
          No {activeTab} records match the current filters.
        </p>
        {activeFiltersCount > 0 && (
          <button
            onClick={clearAllFilters}
            className="mt-3 text-xs text-indigo-500 underline hover:text-indigo-700"
          >
            Clear all filters
          </button>
        )}
      </div>
    )}
  </div>
);

export default PayrollTableBody;
