// ─────────────────────────────────────────────────────────────────────────────
// FILE: src/pages/AdvancePayment.jsx
// Excel export fetches ALL requests from the API and includes:
//   • Request date, Approval date (reviewed_at), Adjusted-in month
//   • Approved by name
//   • Full status colouring
// ─────────────────────────────────────────────────────────────────────────────
import { useState } from "react";
import { Link2, Download, Plus, History, Loader2 } from "lucide-react";
import * as XLSX from "xlsx-js-style";

import advancePaymentService from "../services/advancePaymentService";
import AdvancePaymentDashboard from "../Ui/AdvancePayment/AdvancePaymentDashboard";
import GenerateLinkModal       from "../Ui/AdvancePayment/GenerateLink";
import AddRequestModal         from "../Ui/AdvancePayment/AddRequest";
import PaymentHistory          from "../Ui/AdvancePayment/PaymentHistory";

// ─── Date helpers ─────────────────────────────────────────────────────────────
/** "2026-04-10T..." → "10 Apr 2026" */
function fmtDate(raw) {
  if (!raw) return "—";
  const d = new Date(raw);
  if (isNaN(d)) return String(raw).slice(0, 10);
  return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

/** "2026-04-10T09:35:00" → "10 Apr 2026, 9:35 AM" */
function fmtDateTime(raw) {
  if (!raw) return "—";
  const d = new Date(raw);
  if (isNaN(d)) return "—";
  return d.toLocaleString("en-IN", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

// ─── Excel column schema ──────────────────────────────────────────────────────
const COLUMNS = [
  { label: "Request ID",     wch: 18 },
  { label: "Employee ID",    wch: 14 },
  { label: "Employee Name",  wch: 26 },
  { label: "Department",     wch: 18 },
  { label: "Amount (₹)",     wch: 16 },
  { label: "Payment Type",   wch: 22 },
  { label: "Reason",         wch: 34 },
  { label: "Request Date",   wch: 16 },
  { label: "Approval Date",  wch: 20 },
  { label: "Adjusted In",    wch: 16 },
  { label: "Approved By",    wch: 22 },
  { label: "Status",         wch: 13 },
];

// ─── Colour maps ──────────────────────────────────────────────────────────────
const STATUS_FILL = {
  approved: { patternType: "solid", fgColor: { rgb: "D1FAE5" } },
  pending:  { patternType: "solid", fgColor: { rgb: "FEF3C7" } },
  rejected: { patternType: "solid", fgColor: { rgb: "FEE2E2" } },
};
const STATUS_FONT = {
  approved: { color: { rgb: "065F46" }, bold: true },
  pending:  { color: { rgb: "92400E" }, bold: true },
  rejected: { color: { rgb: "991B1B" }, bold: true },
};

// ─── Excel workbook builder ───────────────────────────────────────────────────
function buildExcel(requests) {
  const wb = XLSX.utils.book_new();
  const ws = {};

  const now = new Date().toLocaleString("en-IN", {
    dateStyle: "long", timeStyle: "short",
  });

  // ── Row 0: Title ────────────────────────────────────────────────────────────
  ws["A1"] = {
    v: "Advance Payment Report",
    t: "s",
    s: {
      font:      { name: "Calibri", sz: 18, bold: true, color: { rgb: "FFFFFF" } },
      fill:      { patternType: "solid", fgColor: { rgb: "1E3A8A" } },
      alignment: { horizontal: "center", vertical: "center" },
    },
  };
  ws["!merges"] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: COLUMNS.length - 1 } }];

  // ── Row 1: Sub-title ────────────────────────────────────────────────────────
  ws["A2"] = {
    v: `Generated: ${now}   |   Total Records: ${requests.length}   |   All statuses`,
    t: "s",
    s: {
      font:      { name: "Calibri", sz: 9, italic: true, color: { rgb: "64748B" } },
      fill:      { patternType: "solid", fgColor: { rgb: "EFF6FF" } },
      alignment: { horizontal: "center", vertical: "center" },
    },
  };
  ws["!merges"].push({ s: { r: 1, c: 0 }, e: { r: 1, c: COLUMNS.length - 1 } });

  // ── Row 2: Column headers ───────────────────────────────────────────────────
  COLUMNS.forEach((col, ci) => {
    ws[XLSX.utils.encode_cell({ r: 2, c: ci })] = {
      v: col.label,
      t: "s",
      s: {
        font:      { name: "Calibri", sz: 10, bold: true, color: { rgb: "FFFFFF" } },
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

  // ── Rows 3+: Data ───────────────────────────────────────────────────────────
  requests.forEach((r, ri) => {
    const isEven  = ri % 2 === 0;
    const rowFill = { patternType: "solid", fgColor: { rgb: isEven ? "F8FAFC" : "FFFFFF" } };
    const status  = (r.status ?? "pending").toLowerCase();

    const rowData = [
      /* 0  Request ID     */ r.request_code                                                            ?? "—",
      /* 1  Employee ID    */ r.emp_id                                                                   ?? "—",
      /* 2  Name           */ r.emp_name                                                                 ?? "—",
      /* 3  Dept           */ r.emp_dept                                                                 ?? "—",
      /* 4  Amount         */ Number(r.amount) || 0,
      /* 5  Payment type   */ r.payment_type_label ?? r.payment_type_short                              ?? "—",
      /* 6  Reason         */ r.reason                                                                   ?? "—",
      /* 7  Request date   */ fmtDate(r.request_date),
      /* 8  Approval date  */ fmtDateTime(r.reviewed_at),
      /* 9  Adjusted in    */ r.adjusted_in                                                              ?? "—",
      /* 10 Approved by    */ r.reviewed_by_name                                                         ?? "—",
      /* 11 Status         */ r.status ? r.status.charAt(0).toUpperCase() + r.status.slice(1)           : "—",
    ];

    const borderThin = {
      top:   { style: "thin", color: { rgb: "E2E8F0" } },
      bottom:{ style: "thin", color: { rgb: "E2E8F0" } },
      left:  { style: "thin", color: { rgb: "E2E8F0" } },
      right: { style: "thin", color: { rgb: "E2E8F0" } },
    };

    rowData.forEach((val, ci) => {
      const addr = XLSX.utils.encode_cell({ r: ri + 3, c: ci });
      const base = {
        font:      { name: "Calibri", sz: 10, color: { rgb: "1E293B" } },
        fill:      rowFill,
        alignment: { vertical: "center", wrapText: false },
        border:    borderThin,
      };

      // Col-specific overrides
      if (ci === 0) {
        // Request ID — indigo bold mono
        base.font      = { ...base.font, bold: true, color: { rgb: "4F46E5" } };
        base.alignment = { ...base.alignment, horizontal: "center" };
      }
      if (ci === 4) {
        // Amount — right-aligned bold blue
        base.font      = { ...base.font, bold: true, color: { rgb: "1E3A8A" } };
        base.alignment = { ...base.alignment, horizontal: "right" };
      }
      if (ci === 6) {
        // Reason — wrap text
        base.alignment = { ...base.alignment, wrapText: true };
      }
      if (ci === 7 || ci === 8 || ci === 9) {
        // Date columns — centred
        base.alignment = { ...base.alignment, horizontal: "center" };
      }
      if (ci === 8 && val !== "—") {
        // Approval date — highlight green text
        base.font = { ...base.font, color: { rgb: "065F46" }, bold: true };
      }
      if (ci === 10 && val !== "—") {
        // Approved by — subtle teal
        base.font = { ...base.font, color: { rgb: "0F766E" } };
      }
      if (ci === 11) {
        // Status — coloured pill
        base.fill      = STATUS_FILL[status] ?? rowFill;
        base.font      = { ...base.font, ...(STATUS_FONT[status] ?? {}) };
        base.alignment = { ...base.alignment, horizontal: "center" };
      }

      ws[addr] = {
        v: val,
        t: typeof val === "number" ? "n" : "s",
        s: base,
        ...(typeof val === "number" ? { z: '₹#,##0' } : {}),
      };
    });
  });

  // ── Summary row ─────────────────────────────────────────────────────────────
  const sRow        = requests.length + 3;
  const approvedCnt = requests.filter((r) => r.status === "approved").length;
  const pendingCnt  = requests.filter((r) => r.status === "pending").length;
  const rejectedCnt = requests.filter((r) => r.status === "rejected").length;
  const totalAmt    = requests.reduce((s, r) => s + (Number(r.amount) || 0), 0);

  const summaryBase = {
    font:   { name: "Calibri", sz: 10, bold: true, color: { rgb: "FFFFFF" } },
    fill:   { patternType: "solid", fgColor: { rgb: "1E3A8A" } },
    border: {
      top:   { style: "medium", color: { rgb: "3B82F6" } },
      bottom:{ style: "medium", color: { rgb: "3B82F6" } },
      left:  { style: "thin",   color: { rgb: "3B82F6" } },
      right: { style: "thin",   color: { rgb: "3B82F6" } },
    },
  };
  const summaryCells = {
    3:  { v: "TOTALS",                         align: "right"  },
    4:  { v: totalAmt,      isNum: true,        align: "right", color: "FCD34D", sz: 11 },
    7:  { v: `Requested: ${requests.length}`,   align: "center" },
    9:  { v: `✓ ${approvedCnt} approved`,       align: "center", color: "6EE7B7" },
    10: { v: `⏳ ${pendingCnt}  ✕ ${rejectedCnt}`, align: "center", color: "FCD34D" },
    11: { v: `Total: ${fmt(totalAmt)}`,         align: "center", color: "FCD34D" },
  };
  [...Array(COLUMNS.length).keys()].forEach((ci) => {
    const cell = summaryCells[ci];
    ws[XLSX.utils.encode_cell({ r: sRow, c: ci })] = {
      v:  cell?.v ?? "",
      t:  cell?.isNum ? "n" : "s",
      ...(cell?.isNum ? { z: "₹#,##0" } : {}),
      s: {
        ...summaryBase,
        font:      { ...summaryBase.font, ...(cell?.color ? { color: { rgb: cell.color } } : {}), ...(cell?.sz ? { sz: cell.sz } : {}) },
        alignment: { horizontal: cell?.align ?? "center", vertical: "center" },
      },
    };
  });

  // ── Sheet metadata ──────────────────────────────────────────────────────────
  ws["!ref"]    = XLSX.utils.encode_range({ s: { r: 0, c: 0 }, e: { r: sRow, c: COLUMNS.length - 1 } });
  ws["!cols"]   = COLUMNS.map((c) => ({ wch: c.wch }));
  ws["!rows"]   = [
    { hpt: 38 }, { hpt: 20 }, { hpt: 30 },
    ...requests.map(() => ({ hpt: 22 })),
    { hpt: 26 },
  ];
  ws["!freeze"] = { xSplit: 0, ySplit: 3, topLeftCell: "A4", activeCell: "A4" };

  XLSX.utils.book_append_sheet(wb, ws, "Advance Payments");

  // ── Summary sheet ───────────────────────────────────────────────────────────
  const counts = {
    approved: approvedCnt, pending: pendingCnt, rejected: rejectedCnt,
  };
  const approvedAmt = requests
    .filter((r) => r.status === "approved")
    .reduce((s, r) => s + (Number(r.amount) || 0), 0);

  const ws2 = XLSX.utils.aoa_to_sheet([
    ["Advance Payment Summary", ""],
    ["Generated",               new Date().toLocaleString("en-IN")],
    [""],
    ["Total requests",          requests.length],
    ["Total amount (₹)",        totalAmt],
    [""],
    ["✓ Approved",              approvedCnt],
    ["  Approved amount (₹)",   approvedAmt],
    [""],
    ["⏳ Pending",              pendingCnt],
    ["✕ Rejected",              rejectedCnt],
  ]);
  ws2["!cols"] = [{ wch: 24 }, { wch: 26 }];
  XLSX.utils.book_append_sheet(wb, ws2, "Summary");

  // ── Deductions sheet (upcoming) ─────────────────────────────────────────────
  // One row per request showing all deduction months from the attached object
  const dedRows = [];
  requests.forEach((r) => {
    (r.deductions ?? []).forEach((d) => {
      dedRows.push([
        r.request_code, r.emp_id, r.emp_name, r.emp_dept,
        d.month_label,
        Number(d.amount) || 0,
        d.status ?? "upcoming",
        d.deduction_date ? fmtDate(d.deduction_date) : "—",
      ]);
    });
  });
  if (dedRows.length) {
    const ws3 = XLSX.utils.aoa_to_sheet([
      ["Request ID","Employee ID","Name","Dept","Month","Amount (₹)","Status","Due Date"],
      ...dedRows,
    ]);
    ws3["!cols"] = [16,14,26,18,14,14,12,14].map((wch) => ({ wch }));
    XLSX.utils.book_append_sheet(wb, ws3, "Deduction Schedule");
  }

  return wb;
}

// helper for summary sheet
function fmt(n) {
  return `₹${Math.round(Number(n) || 0).toLocaleString("en-IN")}`;
}

// ─────────────────────────────────────────────────────────────────────────────
export default function AdvancePayment() {
  const [showLink,    setShowLink]    = useState(false);
  const [showAdd,     setShowAdd]     = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [exporting,   setExporting]   = useState(false);

  // ── Excel export — fetches ALL requests from API ──────────────────────────
  const exportExcel = async () => {
    if (exporting) return;
    try {
      setExporting(true);
      // getAllRequests fetches up to 1 000; also fetch each approved request's
      // deduction schedule so we can include the deduction sheet.
      const res = await advancePaymentService.getAllRequests();
      const all = res.data ?? [];

      if (!all.length) {
        alert("No requests to export.");
        return;
      }

      // Enrich approved requests with their deduction schedules (batch, 5 at a time)
      const enriched = await Promise.all(
        all.map(async (r) => {
          if (r.status !== "approved") return r;
          try {
            const dr = await advancePaymentService.getDeductions(r.id);
            return { ...r, deductions: dr.data ?? [] };
          } catch {
            return r; // non-fatal
          }
        })
      );

      const wb       = buildExcel(enriched);
      const date     = new Date().toISOString().slice(0, 10);   // e.g. 2026-04-10
      const fileName = `advance_payments_${date}.xlsx`;
      XLSX.writeFile(wb, fileName);
    } catch (err) {
      alert(`Export failed: ${err.message}`);
    } finally {
      setExporting(false);
    }
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

          {/* History */}
          <button
            onClick={() => setShowHistory(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 bg-white text-sm font-semibold hover:bg-slate-50 hover:border-slate-300 transition-all shadow-sm"
          >
            <History size={15} />
            History
          </button>

          {/* Generate Link */}
          <button
            onClick={() => setShowLink(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 bg-white text-sm font-semibold hover:bg-slate-50 hover:border-slate-300 transition-all shadow-sm"
          >
            <Link2 size={15} />
            Generate Link
          </button>

          {/* Export Excel */}
          <button
            onClick={exportExcel}
            disabled={exporting}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 bg-white text-sm font-semibold hover:bg-slate-50 hover:border-slate-300 transition-all shadow-sm disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {exporting
              ? <Loader2 size={15} className="animate-spin" />
              : <Download size={15} />}
            {exporting ? "Exporting…" : "Export Excel"}
          </button>

          {/* New Request */}
          <button
            onClick={() => setShowAdd(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 active:bg-indigo-800 transition-all shadow-sm shadow-indigo-200"
          >
            <Plus size={15} />
            New Request
          </button>
        </div>
      </div>

      {/* ── Dashboard ── */}
      <AdvancePaymentDashboard />

      {/* ── Modals ── */}
      {showLink && <GenerateLinkModal onClose={() => setShowLink(false)} />}
      {showAdd  && <AddRequestModal   onClose={() => setShowAdd(false)}  />}

      {/* History modal */}
      {showHistory && (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 backdrop-blur-sm overflow-y-auto py-6 px-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-7xl relative">

            {/* Modal header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 sticky top-0 bg-white z-10 rounded-t-2xl shadow-sm">
              <div className="flex items-center gap-2">
                <History size={17} className="text-indigo-500" />
                <span className="text-base font-bold text-slate-800">Salary Payment History</span>
              </div>
              <button
                onClick={() => setShowHistory(false)}
                className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors font-bold text-lg"
                aria-label="Close"
              >
                ✕
              </button>
            </div>

            <div className="p-6">
              <PaymentHistory />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}