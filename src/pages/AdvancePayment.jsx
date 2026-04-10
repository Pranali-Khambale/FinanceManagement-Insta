// ─────────────────────────────────────────────────────────────────────────────
// FILE: src/pages/AdvancePayment.jsx
// ─────────────────────────────────────────────────────────────────────────────
import { useState } from "react";
import { Link2, Download, Plus, History } from "lucide-react";
import * as XLSX from "xlsx-js-style";
import { INITIAL_REQUESTS } from "../data/content";
import AdvancePaymentDashboard from "../Ui/AdvancePayment/AdvancePaymentDashboard";
import GenerateLinkModal       from "../Ui/AdvancePayment/GenerateLink";
import AddRequestModal         from "../Ui/AdvancePayment/AddRequest";
import PaymentHistory          from "../Ui/AdvancePayment/PaymentHistory";

const COLUMNS = [
  { key: "id",          label: "Request ID",   wch: 16 },
  { key: "empId",       label: "Employee ID",  wch: 14 },
  { key: "name",        label: "Name",         wch: 26 },
  { key: "dept",        label: "Department",   wch: 16 },
  { key: "amount",      label: "Amount (₹)",   wch: 15 },
  { key: "paymentType", label: "Payment Type", wch: 20 },
  { key: "reason",      label: "Reason",       wch: 32 },
  { key: "date",        label: "Date",         wch: 14 },
  { key: "status",      label: "Status",       wch: 13 },
  { key: "adjustedIn",  label: "Adjusted In",  wch: 15 },
];

const STATUS_FILLS = {
  approved: { fgColor: { rgb: "D1FAE5" } },
  pending:  { fgColor: { rgb: "FEF3C7" } },
  rejected: { fgColor: { rgb: "FEE2E2" } },
};
const STATUS_FONTS = {
  approved: { color: { rgb: "065F46" }, bold: true },
  pending:  { color: { rgb: "92400E" }, bold: true },
  rejected: { color: { rgb: "991B1B" }, bold: true },
};

export default function AdvancePayment() {
  const [showLink,    setShowLink]    = useState(false);
  const [showAdd,     setShowAdd]     = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [requests,    setRequests]    = useState(INITIAL_REQUESTS);

  const addRequest = (req) => setRequests((rs) => [req, ...rs]);

  const exportExcel = () => {
    const wb = XLSX.utils.book_new();
    const ws = {};

    ws["A1"] = {
      v: "Advance Payment Report",
      t: "s",
      s: {
        font:      { name: "Arial", sz: 16, bold: true, color: { rgb: "FFFFFF" } },
        fill:      { patternType: "solid", fgColor: { rgb: "1E3A8A" } },
        alignment: { horizontal: "center", vertical: "center" },
        border:    { bottom: { style: "medium", color: { rgb: "3B82F6" } } },
      },
    };
    ws["!merges"] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: COLUMNS.length - 1 } }];

    ws["A2"] = {
      v: `Generated: ${new Date().toLocaleString("en-IN", { dateStyle: "long", timeStyle: "short" })}   |   Total Records: ${requests.length}`,
      t: "s",
      s: {
        font:      { name: "Arial", sz: 9, italic: true, color: { rgb: "94A3B8" } },
        fill:      { patternType: "solid", fgColor: { rgb: "EFF6FF" } },
        alignment: { horizontal: "center", vertical: "center" },
      },
    };
    ws["!merges"].push({ s: { r: 1, c: 0 }, e: { r: 1, c: COLUMNS.length - 1 } });

    COLUMNS.forEach((col, ci) => {
      const addr = XLSX.utils.encode_cell({ r: 2, c: ci });
      ws[addr] = {
        v: col.label,
        t: "s",
        s: {
          font:      { name: "Arial", sz: 10, bold: true, color: { rgb: "FFFFFF" } },
          fill:      { patternType: "solid", fgColor: { rgb: "2563EB" } },
          alignment: { horizontal: "center", vertical: "center", wrapText: true },
          border: {
            top:    { style: "thin",   color: { rgb: "1D4ED8" } },
            bottom: { style: "medium", color: { rgb: "1D4ED8" } },
            left:   { style: "thin",   color: { rgb: "1D4ED8" } },
            right:  { style: "thin",   color: { rgb: "1D4ED8" } },
          },
        },
      };
    });

    requests.forEach((r, ri) => {
      const isEven  = ri % 2 === 0;
      const rowFill = isEven
        ? { patternType: "solid", fgColor: { rgb: "F8FAFC" } }
        : { patternType: "solid", fgColor: { rgb: "FFFFFF" } };
      const status  = r.status?.toLowerCase() ?? "pending";
      const rowData = [
        r.id          ?? "—",
        r.empId       ?? "—",
        r.name        ?? "—",
        r.dept        ?? "—",
        Number(r.amount) || 0,
        r.paymentType ?? "—",
        r.reason      ?? "—",
        r.date        ?? "—",
        r.status ? (r.status.charAt(0).toUpperCase() + r.status.slice(1)) : "—",
        r.adjustedIn  ?? "—",
      ];

      rowData.forEach((val, ci) => {
        const addr = XLSX.utils.encode_cell({ r: ri + 3, c: ci });
        let cellStyle = {
          font:      { name: "Arial", sz: 10, color: { rgb: "1E293B" } },
          fill:      rowFill,
          alignment: { vertical: "center", wrapText: ci === 6 },
          border: {
            top:    { style: "thin", color: { rgb: "E2E8F0" } },
            bottom: { style: "thin", color: { rgb: "E2E8F0" } },
            left:   { style: "thin", color: { rgb: "E2E8F0" } },
            right:  { style: "thin", color: { rgb: "E2E8F0" } },
          },
        };
        if (ci === 4) {
          cellStyle.alignment = { ...cellStyle.alignment, horizontal: "right" };
          cellStyle.font      = { ...cellStyle.font, bold: true, color: { rgb: "1E3A8A" } };
        }
        if (ci === 8) {
          cellStyle.fill      = { patternType: "solid", ...(STATUS_FILLS[status] ?? {}) };
          cellStyle.font      = { ...cellStyle.font, ...(STATUS_FONTS[status] ?? {}) };
          cellStyle.alignment = { ...cellStyle.alignment, horizontal: "center" };
        }
        if (ci === 0) {
          cellStyle.font      = { ...cellStyle.font, bold: true, color: { rgb: "4F46E5" } };
          cellStyle.alignment = { ...cellStyle.alignment, horizontal: "center" };
        }
        if (ci === 7) {
          cellStyle.alignment = { ...cellStyle.alignment, horizontal: "center" };
        }
        ws[addr] = {
          v: val,
          t: typeof val === "number" ? "n" : "s",
          s: cellStyle,
          ...(typeof val === "number" ? { z: "₹#,##0" } : {}),
        };
      });
    });

    const summaryRow = requests.length + 3;
    ["", "", "", "TOTAL", "", "", "", "", "Approved", "Pending"].forEach((v, ci) => {
      const addr = XLSX.utils.encode_cell({ r: summaryRow, c: ci });
      ws[addr] = {
        v, t: "s",
        s: {
          font:      { name: "Arial", sz: 10, bold: true, color: { rgb: "FFFFFF" } },
          fill:      { patternType: "solid", fgColor: { rgb: "1E3A8A" } },
          alignment: { horizontal: ci === 3 ? "right" : "center", vertical: "center" },
          border: {
            top:    { style: "medium", color: { rgb: "3B82F6" } },
            bottom: { style: "medium", color: { rgb: "3B82F6" } },
            left:   { style: "thin",   color: { rgb: "3B82F6" } },
            right:  { style: "thin",   color: { rgb: "3B82F6" } },
          },
        },
      };
    });

    const totalAmt = requests.reduce((s, r) => s + (Number(r.amount) || 0), 0);
    ws[XLSX.utils.encode_cell({ r: summaryRow, c: 4 })] = {
      v: totalAmt, t: "n", z: "₹#,##0",
      s: {
        font:      { name: "Arial", sz: 11, bold: true, color: { rgb: "FCD34D" } },
        fill:      { patternType: "solid", fgColor: { rgb: "1E3A8A" } },
        alignment: { horizontal: "right", vertical: "center" },
        border: {
          top:    { style: "medium", color: { rgb: "3B82F6" } },
          bottom: { style: "medium", color: { rgb: "3B82F6" } },
          left:   { style: "thin",   color: { rgb: "3B82F6" } },
          right:  { style: "thin",   color: { rgb: "3B82F6" } },
        },
      },
    };
    ws[XLSX.utils.encode_cell({ r: summaryRow, c: 8 })] = {
      v: requests.filter(r => r.status === "approved").length, t: "n",
      s: {
        font:      { name: "Arial", sz: 10, bold: true, color: { rgb: "6EE7B7" } },
        fill:      { patternType: "solid", fgColor: { rgb: "1E3A8A" } },
        alignment: { horizontal: "center", vertical: "center" },
        border: {
          top:    { style: "medium", color: { rgb: "3B82F6" } },
          bottom: { style: "medium", color: { rgb: "3B82F6" } },
          left:   { style: "thin",   color: { rgb: "3B82F6" } },
          right:  { style: "thin",   color: { rgb: "3B82F6" } },
        },
      },
    };
    ws[XLSX.utils.encode_cell({ r: summaryRow, c: 9 })] = {
      v: requests.filter(r => r.status === "pending").length, t: "n",
      s: {
        font:      { name: "Arial", sz: 10, bold: true, color: { rgb: "FCD34D" } },
        fill:      { patternType: "solid", fgColor: { rgb: "1E3A8A" } },
        alignment: { horizontal: "center", vertical: "center" },
        border: {
          top:    { style: "medium", color: { rgb: "3B82F6" } },
          bottom: { style: "medium", color: { rgb: "3B82F6" } },
          left:   { style: "thin",   color: { rgb: "3B82F6" } },
          right:  { style: "thin",   color: { rgb: "3B82F6" } },
        },
      },
    };

    ws["!ref"]  = XLSX.utils.encode_range({ s: { r: 0, c: 0 }, e: { r: summaryRow, c: COLUMNS.length - 1 } });
    ws["!cols"] = COLUMNS.map((c) => ({ wch: c.wch }));
    ws["!rows"] = [
      { hpt: 36 }, { hpt: 20 }, { hpt: 28 },
      ...requests.map(() => ({ hpt: 22 })),
      { hpt: 26 },
    ];
    ws["!freeze"] = { xSplit: 0, ySplit: 3, topLeftCell: "A4", activeCell: "A4" };

    XLSX.utils.book_append_sheet(wb, ws, "Advance Payments");
    XLSX.writeFile(wb, `advance_payments_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  return (
    <div className="space-y-6">

      {/* ── Page Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight leading-tight text-slate-900">
            Advance Payments
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Manage and approve advance payment requests across all payment types
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap shrink-0">

          {/* ── History Button ── */}
          <button
            onClick={() => setShowHistory(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 bg-white text-sm font-semibold hover:bg-slate-50 hover:border-slate-300 transition-all shadow-sm"
          >
            <History size={15} />
            History
          </button>

          <button
            onClick={() => setShowLink(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 bg-white text-sm font-semibold hover:bg-slate-50 hover:border-slate-300 transition-all shadow-sm"
          >
            <Link2 size={15} />
            Generate Link
          </button>

          <button
            onClick={exportExcel}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 bg-white text-sm font-semibold hover:bg-slate-50 hover:border-slate-300 transition-all shadow-sm"
          >
            <Download size={15} />
            Export Excel
          </button>

          <button
            onClick={() => setShowAdd(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 active:bg-indigo-800 transition-all shadow-sm shadow-indigo-200"
          >
            <Plus size={15} />
            New Request
          </button>
        </div>
      </div>

      <AdvancePaymentDashboard
        requests={requests}
        setRequests={setRequests}
      />

      {showLink    && <GenerateLinkModal onClose={() => setShowLink(false)} />}
      {showAdd     && (
        <AddRequestModal
          onClose={() => setShowAdd(false)}
          onAdd={addRequest}
        />
      )}

      {/* ── History Modal ── */}
      {showHistory && (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 backdrop-blur-sm overflow-y-auto py-6 px-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-7xl relative">

            {/* Modal close bar */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <History size={17} className="text-indigo-500" />
                <span className="text-base font-bold text-slate-800">Salary Payment History</span>
              </div>
              <button
                onClick={() => setShowHistory(false)}
                className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors text-lg font-bold"
              >
                ✕
              </button>
            </div>

            {/* PaymentHistory content rendered inside modal */}
            <div className="p-6">
              <PaymentHistory />
            </div>

          </div>
        </div>
      )}

    </div>
  );
}