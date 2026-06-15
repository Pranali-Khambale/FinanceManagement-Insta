import { useState, useEffect, useCallback } from "react";
import payrollService from "../../../../services/payrollService.js";
import {
  n,
  computePayslip,
  buildPayrollPayload,
  getDaysInMonth,
} from "../utils";
import { exportPayrollToExcel } from "../../../Payroll/ExportPayrollExcel";

const TOAST_DURATION = 3200;

export const usePayrollTable = ({
  employeesProp,
  forMonth,
  onUpdateStatus,
  onUpdateEmployee,
  onRefresh,
}) => {
  const [employees, setEmployees] = useState(employeesProp);
  const [activeTab, setActiveTab] = useState("pending");
  const [search, setSearch] = useState("");
  const [deptFilter, setDeptFilter] = useState("All");
  const [circleFilter, setCircleFilter] = useState("All");
  const [empTypeFilter, setEmpTypeFilter] = useState("All");
  const [viewTarget, setViewTarget] = useState(null);
  const [editTarget, setEditTarget] = useState(null);
  const [toast, setToast] = useState(null);
  const [exporting, setExporting] = useState(false);
  const [attendanceOpen, setAttendanceOpen] = useState(false);
  const [payingId, setPayingId] = useState(null);

  const correctMonthDays = getDaysInMonth(forMonth);

  useEffect(() => {
    setEmployees(employeesProp);
  }, [employeesProp]);

  const showToast = useCallback((msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), TOAST_DURATION);
  }, []);

  const clearAllFilters = useCallback(() => {
    setSearch("");
    setDeptFilter("All");
    setCircleFilter("All");
    setEmpTypeFilter("All");
  }, []);

  const handlePay = useCallback(
    async (emp) => {
      setPayingId(emp.id);
      try {
        let recordId = emp.payrollRecordId;

        if (!recordId) {
          const payload = buildPayrollPayload(emp, forMonth, correctMonthDays);
          const result = await payrollService.upsertRecord(payload);
          recordId = result?.data?.id;

          if (!recordId) {
            showToast(
              "❌ Could not create payroll record before paying.",
              "error",
            );
            return;
          }

          setEmployees((prev) =>
            prev.map((e) =>
              e.id === emp.id ? { ...e, payrollRecordId: recordId } : e,
            ),
          );
        }

        await payrollService.markAsPaid(recordId);
        setEmployees((prev) =>
          prev.map((e) => (e.id === emp.id ? { ...e, status: "Paid" } : e)),
        );
        onUpdateStatus?.(emp.id, "Paid");
        showToast(`💸 Salary disbursed for ${emp.name}!`);
      } catch (err) {
        showToast(`❌ ${err.message}`, "error");
      } finally {
        setPayingId(null);
      }
    },
    [forMonth, correctMonthDays, onUpdateStatus, showToast],
  );

  const handleAttendanceSave = useCallback(
    async (updatedRows) => {
      setEmployees((prev) =>
        prev.map((e) => {
          const found = updatedRows.find((r) => r.id === e.id);
          return found ? { ...e, ...found } : e;
        }),
      );

      updatedRows.forEach(({ id, pDays, aDays, monthDays }) => {
        onUpdateEmployee?.(id, { pDays, aDays, monthDays });
      });

      try {
        const result = await payrollService.saveAttendance(
          updatedRows.map((r) => ({ ...r, forMonth })),
        );
        if (result.failed > 0) {
          showToast(
            `📅 Attendance updated (${result.saved} saved, ${result.failed} failed)`,
            "error",
          );
        } else {
          showToast(`📅 Attendance updated for ${result.saved} employees!`);
        }
      } catch (err) {
        showToast(`❌ Attendance save error: ${err.message}`, "error");
      }
    },
    [forMonth, onUpdateEmployee, showToast],
  );

  const handleEditSave = useCallback(
    async (updated) => {
      const payload = buildPayrollPayload(updated, forMonth, correctMonthDays);
      const result = await payrollService.upsertRecord(payload);
      const serverData = result?.data || {};

      const safeServerVal = (serverVal, fallback) =>
        serverVal != null ? Number(serverVal) : fallback;

      const merged = {
        ...updated,
        basic: n(updated.basic),
        hra: n(updated.hra),
        organisationAllowance: n(updated.organisationAllowance),
        performancePay: n(updated.performancePay),
        tds: n(updated.tds),
        otherDeduction: n(updated.otherDeduction),
        pDays: updated.pDays,
        aDays: updated.aDays,
        monthDays: updated.monthDays || correctMonthDays,
        pfDeduction: safeServerVal(
          serverData.pf_deduction,
          n(updated.pfDeduction),
        ),
        employerPfContribution: safeServerVal(
          serverData.employer_pf_contribution,
          n(updated.employerPfContribution),
        ),
        pt: safeServerVal(serverData.pt, n(updated.pt)),
        gratuity: safeServerVal(serverData.gratuity, n(updated.gratuity)),
        grossSalary:
          serverData.gross_full != null
            ? Number(serverData.gross_full)
            : undefined,
        grossEarned:
          serverData.gross_earned != null
            ? Number(serverData.gross_earned)
            : undefined,
        totalDeduction:
          serverData.total_deduction != null
            ? Number(serverData.total_deduction)
            : undefined,
        netSalary:
          serverData.net_salary != null
            ? Number(serverData.net_salary)
            : undefined,
        totalEarning:
          serverData.total_earning != null
            ? Number(serverData.total_earning)
            : undefined,
        advanceDeduction: safeServerVal(
          serverData.advance_deduction,
          n(updated.advanceDeduction),
        ),
        advanceAddition: safeServerVal(
          serverData.advance_addition,
          n(updated.advanceAddition),
        ),
        payrollRecordId: serverData.id || updated.payrollRecordId,
      };

      setEmployees((prev) =>
        prev.map((e) => (e.id === updated.id ? { ...e, ...merged } : e)),
      );
      onUpdateEmployee?.(updated.id, merged);
      setEditTarget(null);
      showToast(`✅ ${updated.name}'s details saved!`);
      onRefresh?.();
    },
    [forMonth, correctMonthDays, onUpdateEmployee, onRefresh, showToast],
  );

  const handleExport = useCallback(
    async (filtered) => {
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
    },
    [exporting, activeTab, deptFilter, showToast],
  );

  return {
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
  };
};
