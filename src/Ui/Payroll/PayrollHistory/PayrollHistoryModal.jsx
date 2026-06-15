import React, { useState, useMemo, useCallback } from "react";
import { usePayrollHistory } from "./hooks/usePayrollHistory";
import { buildMonths, fmtCompact } from "./utils";
import { PAGE_SIZE, STATUS_OPTIONS } from "./constants";
import ModalHeader from "./components/ModalHeader";
import FiltersBar from "./components/FiltersBar";
import PayrollRow from "./components/PayrollRow";
import Skeleton from "./components/Skeleton";
import ModalFooter from "./components/ModalFooter";

const MONTHS = buildMonths();

const PayrollHistoryModal = ({ onClose }) => {
  const { allRecords, loading, error } = usePayrollHistory();

  const [search, setSearch] = useState("");
  const [monthFilter, setMonthFilter] = useState("All Months");
  const [deptFilter, setDeptFilter] = useState("All Departments");
  const [statusFilt, setStatusFilt] = useState("All Statuses");
  const [expandedKey, setExpandedKey] = useState(null);
  const [page, setPage] = useState(1);

  const resetPage = useCallback(
    (setter) => (val) => {
      setter(val);
      setPage(1);
    },
    [],
  );

  const departments = useMemo(
    () => [
      "All Departments",
      ...new Set(allRecords.map((r) => r.department).filter(Boolean)),
    ],
    [allRecords],
  );

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return allRecords.filter(
      (r) =>
        ((r.name || "").toLowerCase().includes(q) ||
          (r.employeeId || "").toLowerCase().includes(q)) &&
        (monthFilter === "All Months" || r.forMonth === monthFilter) &&
        (deptFilter === "All Departments" || r.department === deptFilter) &&
        (statusFilt === "All Statuses" || r.status === statusFilt),
    );
  }, [allRecords, search, monthFilter, deptFilter, statusFilt]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const totalNet = filtered.reduce((s, r) => s + Number(r.netSalary || 0), 0);
  const totalGross = filtered.reduce(
    (s, r) => s + Number(r.grossSalary || 0),
    0,
  );
  const totalDed = filtered.reduce(
    (s, r) => s + Number(r.totalDeduction || 0),
    0,
  );

  const handleExport = async () => {
    try {
      const XLSX = await import("xlsx-js-style");
      const ws = XLSX.utils.json_to_sheet(
        filtered.map((r) => ({
          "Employee ID": r.employeeId,
          Name: r.name,
          Department: r.department,
          Designation: r.designation,
          Month: r.forMonth,
          "P Days": r.pDays,
          "Month Days": r.monthDays,
          "Gross Salary (₹)": Number(r.grossSalary || 0),
          "Gross Earned (₹)": Number(r.grossEarned || 0),
          "Total PF 24% (₹)": Number(r.totalPfContribution || 0),
          "PT (₹)": Number(r.pt || 0),
          "TDS (₹)": Number(r.tds || 0),
          "Adv. Deduction (₹)": Number(r.advanceDeduction || 0),
          "Adv. Addition (₹)": Number(r.advanceAddition || 0),
          "Total Deduction (₹)": Number(r.totalDeduction || 0),
          "Net Salary (₹)": Number(r.netSalary || 0),
          "Total Earning (₹)": Number(r.totalEarning || 0),
          Status: r.status,
          "Paid On": r.paidAt
            ? new Date(r.paidAt).toLocaleDateString("en-IN", {
                day: "2-digit",
                month: "short",
                year: "numeric",
              })
            : "—",
          Bank: r.bankName || "—",
          "A/C No": r.accountNumber || "—",
        })),
      );
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Payroll History");
      XLSX.writeFile(
        wb,
        `Payroll_History_${monthFilter.replace(/ /g, "_")}.xlsx`,
      );
    } catch {}
  };

  const handleToggleRow = useCallback(
    (key) => setExpandedKey((prev) => (prev === key ? null : key)),
    [],
  );

  return (
    <>
      <style>{`
        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        * { box-sizing: border-box; }
      `}</style>

      <div
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 200,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "rgba(0,0,0,.5)",
          backdropFilter: "blur(4px)",
          WebkitBackdropFilter: "blur(4px)",
          padding: 12,
        }}
      >
        <div
          style={{
            background: "#fff",
            borderRadius: 16,
            boxShadow: "0 25px 60px rgba(0,0,0,.2)",
            width: "100%",
            maxWidth: 860,
            maxHeight: "95vh",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
          }}
        >
          <ModalHeader
            loading={loading}
            allRecords={allRecords}
            filtered={filtered}
            totalGross={totalGross}
            totalDed={totalDed}
            totalNet={totalNet}
            onExport={handleExport}
            onClose={onClose}
          />

          <FiltersBar
            search={search}
            onSearchChange={resetPage(setSearch)}
            monthFilter={monthFilter}
            onMonthChange={resetPage(setMonthFilter)}
            months={MONTHS}
            deptFilter={deptFilter}
            onDeptChange={resetPage(setDeptFilter)}
            departments={departments}
            statusFilt={statusFilt}
            onStatusChange={resetPage(setStatusFilt)}
            statusOptions={STATUS_OPTIONS}
            loading={loading}
            filteredCount={filtered.length}
          />

          {error && (
            <div
              style={{
                margin: "12px 16px",
                padding: "10px 14px",
                borderRadius: 8,
                background: "#fee2e2",
                border: "1px solid #fca5a5",
                fontSize: 12,
                color: "#991b1b",
                flexShrink: 0,
              }}
            >
              ❌ {error}
            </div>
          )}

          <div style={{ flex: 1, overflowY: "auto" }}>
            {loading ? (
              [...Array(6)].map((_, i) => <Skeleton key={i} />)
            ) : paginated.length === 0 ? (
              <div style={{ padding: "48px 24px", textAlign: "center" }}>
                <p style={{ color: "#94a3b8", fontSize: 13 }}>
                  {allRecords.length === 0
                    ? "No saved payroll records found. Records appear here once salary is saved or paid."
                    : "No records match your filters."}
                </p>
              </div>
            ) : (
              paginated.map((rec) => {
                const key = `${rec.id}-${rec.forMonth}`;
                return (
                  <PayrollRow
                    key={key}
                    rec={rec}
                    expanded={expandedKey === key}
                    onToggle={() => handleToggleRow(key)}
                  />
                );
              })
            )}
          </div>

          <ModalFooter
            page={page}
            totalPages={totalPages}
            filtered={filtered}
            onPrev={() => setPage((p) => Math.max(1, p - 1))}
            onNext={() => setPage((p) => Math.min(totalPages, p + 1))}
            onPageSelect={setPage}
            onClose={onClose}
            PAGE_SIZE={PAGE_SIZE}
          />
        </div>
      </div>
    </>
  );
};

export default PayrollHistoryModal;
