import React, { useMemo } from "react";
import AttendanceInputModal from "../AttendanceInputModal";
import EmployeeDetailModal from "../EmployeeDetailModal/components/EmployeeDetailModal";
import { usePayrollTable } from "./hooks/usePayrollTable";
import { n, fmtINR, computePayslip, getEmpTypeBucket } from "./utils";
import Toolbar from "./components/Toolbar";
import PayslipViewModal from "./components/PayslipViewModal";
import PayrollTableBody from "./components/PayrollTableBody";

const TAB_MAP = { pending: ["Pending"], paid: ["Paid"] };

const PayrollTable = ({
  employees: employeesProp,
  forMonth,
  onUpdateStatus,
  onUpdateEmployee,
  onRefresh,
}) => {
  const {
    employees,
    activeTab,
    setActiveTab,
    search,
    setSearch,
    deptFilter,
    setDeptFilter,
    circleFilter,
    setCircleFilter,
    empTypeFilter,
    setEmpTypeFilter,
    viewTarget,
    setViewTarget,
    editTarget,
    setEditTarget,
    toast,
    exporting,
    attendanceOpen,
    setAttendanceOpen,
    payingId,
    correctMonthDays,
    clearAllFilters,
    handlePay,
    handleAttendanceSave,
    handleEditSave,
    handleExport,
  } = usePayrollTable({
    employeesProp,
    forMonth,
    onUpdateStatus,
    onUpdateEmployee,
    onRefresh,
  });

  const departments = useMemo(
    () => [
      "All",
      ...new Set(employees.map((e) => e.department).filter(Boolean)),
    ],
    [employees],
  );

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return employees.filter((e) => {
      const matchTab = TAB_MAP[activeTab]?.includes(e.status);
      const matchSrch =
        !q ||
        (e.name || "").toLowerCase().includes(q) ||
        (e.employeeId || "").toLowerCase().includes(q) ||
        (e.currentLocation || "").toLowerCase().includes(q) ||
        (e.circle || "").toLowerCase().includes(q) ||
        (e.designation || "").toLowerCase().includes(q) ||
        (e.department || "").toLowerCase().includes(q);
      const matchDept = deptFilter === "All" || e.department === deptFilter;
      const empCircle = e.currentLocation || e.circle || "";
      const matchCircle = circleFilter === "All" || empCircle === circleFilter;
      const matchType =
        empTypeFilter === "All" || getEmpTypeBucket(e) === empTypeFilter;
      return matchTab && matchSrch && matchDept && matchCircle && matchType;
    });
  }, [employees, activeTab, search, deptFilter, circleFilter, empTypeFilter]);

  const pendingCount = useMemo(
    () => employees.filter((e) => e.status === "Pending").length,
    [employees],
  );
  const paidCount = useMemo(
    () => employees.filter((e) => e.status === "Paid").length,
    [employees],
  );

  const activeFiltersCount = [
    deptFilter !== "All",
    circleFilter !== "All",
    empTypeFilter !== "All",
    search.trim() !== "",
  ].filter(Boolean).length;

  const totals = useMemo(
    () =>
      filtered.reduce(
        (acc, emp) => {
          const c = computePayslip(emp);
          return {
            basic: acc.basic + n(emp.basic),
            hra: acc.hra + n(emp.hra),
            orgAllow: acc.orgAllow + n(emp.organisationAllowance),
            perfPay: acc.perfPay + n(emp.performancePay),
            grossSalary: acc.grossSalary + c.grossSalary,
            grossEarned: acc.grossEarned + c.grossEarned,
            empPfDed: acc.empPfDed + c.empPfDeduction,
            employerPf: acc.employerPf + c.employerPfContribution,
            totalPf: acc.totalPf + c.totalPfContribution,
            pt: acc.pt + c.ptDeduction,
            gratuity: acc.gratuity + c.gratuity,
            tds: acc.tds + n(emp.tds),
            otherDed: acc.otherDed + n(emp.otherDeduction),
            advDed: acc.advDed + c.advanceDeduction,
            advAdd: acc.advAdd + c.advanceAddition,
            totalDeduction: acc.totalDeduction + c.totalDeduction,
            netSalary: acc.netSalary + c.netSalary,
            totalEarning: acc.totalEarning + c.totalEarning,
          };
        },
        {
          basic: 0,
          hra: 0,
          orgAllow: 0,
          perfPay: 0,
          grossSalary: 0,
          grossEarned: 0,
          empPfDed: 0,
          employerPf: 0,
          totalPf: 0,
          pt: 0,
          gratuity: 0,
          tds: 0,
          otherDed: 0,
          advDed: 0,
          advAdd: 0,
          totalDeduction: 0,
          netSalary: 0,
          totalEarning: 0,
        },
      ),
    [filtered],
  );

  return (
    <>
      {/* ── Modals rendered at fragment root — outside ALL wrapper divs
          so `position: fixed` is always relative to the true viewport,
          never clipped or trapped by a parent's border-radius / overflow. ── */}
      {viewTarget && (
        <PayslipViewModal
          employee={viewTarget}
          onClose={() => setViewTarget(null)}
        />
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

      {/* ── Toast (also outside the card so it's never clipped) ── */}
      {toast && (
        <div
          className={`fixed top-4 right-4 z-50 px-4 sm:px-5 py-3 rounded-xl shadow-xl text-sm font-semibold border max-w-[calc(100vw-2rem)] sm:max-w-xs ${
            toast.type === "error"
              ? "bg-red-50 border-red-200 text-red-700"
              : "bg-white border-emerald-200 text-slate-800"
          }`}
        >
          {toast.msg}
        </div>
      )}

      {/* ── Main card ── */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100">
        <Toolbar
          forMonth={forMonth}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          pendingCount={pendingCount}
          paidCount={paidCount}
          search={search}
          setSearch={setSearch}
          deptFilter={deptFilter}
          setDeptFilter={setDeptFilter}
          departments={departments}
          empTypeFilter={empTypeFilter}
          setEmpTypeFilter={setEmpTypeFilter}
          circleFilter={circleFilter}
          setCircleFilter={setCircleFilter}
          activeFiltersCount={activeFiltersCount}
          clearAllFilters={clearAllFilters}
          filtered={filtered}
          employees={employees}
          tabMap={TAB_MAP}
          exporting={exporting}
          onAttendance={() => setAttendanceOpen(true)}
          onExport={() => handleExport(filtered)}
        />

        <PayrollTableBody
          filtered={filtered}
          forMonth={forMonth}
          correctMonthDays={correctMonthDays}
          payingId={payingId}
          totals={totals}
          activeTab={activeTab}
          activeFiltersCount={activeFiltersCount}
          clearAllFilters={clearAllFilters}
          onView={setViewTarget}
          onEdit={setEditTarget}
          onPay={handlePay}
        />

        {/* Footer */}
        <div className="px-3 sm:px-6 py-3 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <p className="text-[11px] sm:text-xs text-slate-400 leading-relaxed">
            Showing {filtered.length} of {employees.length} employees
            &nbsp;·&nbsp; {forMonth} · {correctMonthDays} days
            <span className="hidden sm:inline">
              &nbsp;·&nbsp; PF = 12% Emp + 13% Co. = 25% total &nbsp;·&nbsp;
              Gratuity = 4.81% of Basic &nbsp;·&nbsp; PT = ₹
              {/february/i.test(forMonth || "") ? "300 (Feb)" : "200"}/month
              &nbsp;·&nbsp; Female PT only if Gross &gt; ₹25,000 &nbsp;·&nbsp;
              Set any field to ₹0 to exempt
            </span>
          </p>
          {(circleFilter !== "All" || empTypeFilter !== "All") && (
            <p className="text-xs text-slate-500 font-medium flex items-center gap-2 flex-wrap">
              {empTypeFilter !== "All" && (
                <span className="px-2 py-0.5 rounded-full bg-violet-50 border border-violet-200 text-violet-700 text-[11px]">
                  {empTypeFilter}
                </span>
              )}
              {circleFilter !== "All" && (
                <span className="px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-[11px]">
                  {circleFilter}
                </span>
              )}
            </p>
          )}
        </div>
      </div>
    </>
  );
};

export default PayrollTable;
