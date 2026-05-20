// ─────────────────────────────────────────────────────────────────────────────
// FILE: src/pages/AdvancePayment.jsx
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
function fmtDate(raw) {
  if (!raw) return "—";
  const d = new Date(raw);
  if (isNaN(d)) return String(raw).slice(0, 10);
  return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

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

function buildExcel(requests) {
  const wb = XLSX.utils.book_new();
  const ws = {};
  const now = new Date().toLocaleString("en-IN", { dateStyle: "long", timeStyle: "short" });

  ws["A1"] = {
    v: "Advance Payment Report", t: "s",
    s: { font: { name: "Calibri", sz: 18, bold: true, color: { rgb: "FFFFFF" } }, fill: { patternType: "solid", fgColor: { rgb: "1E3A8A" } }, alignment: { horizontal: "center", vertical: "center" } },
  };
  ws["!merges"] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: COLUMNS.length - 1 } }];

  ws["A2"] = {
    v: `Generated: ${now}   |   Total Records: ${requests.length}   |   All statuses`, t: "s",
    s: { font: { name: "Calibri", sz: 9, italic: true, color: { rgb: "64748B" } }, fill: { patternType: "solid", fgColor: { rgb: "EFF6FF" } }, alignment: { horizontal: "center", vertical: "center" } },
  };
  ws["!merges"].push({ s: { r: 1, c: 0 }, e: { r: 1, c: COLUMNS.length - 1 } });

  COLUMNS.forEach((col, ci) => {
    ws[XLSX.utils.encode_cell({ r: 2, c: ci })] = {
      v: col.label, t: "s",
      s: { font: { name: "Calibri", sz: 10, bold: true, color: { rgb: "FFFFFF" } }, fill: { patternType: "solid", fgColor: { rgb: "2563EB" } }, alignment: { horizontal: "center", vertical: "center", wrapText: true }, border: { top: { style: "thin", color: { rgb: "1D4ED8" } }, bottom: { style: "medium", color: { rgb: "1D4ED8" } }, left: { style: "thin", color: { rgb: "1D4ED8" } }, right: { style: "thin", color: { rgb: "1D4ED8" } } } },
    };
  });

  requests.forEach((r, ri) => {
    const isEven = ri % 2 === 0;
    const rowFill = { patternType: "solid", fgColor: { rgb: isEven ? "F8FAFC" : "FFFFFF" } };
    const status  = (r.status ?? "pending").toLowerCase();
    const rowData = [
      r.request_code ?? "—", r.emp_id ?? "—", r.emp_name ?? "—", r.emp_dept ?? "—",
      Number(r.amount) || 0,
      r.payment_type_label ?? r.payment_type_short ?? "—",
      r.reason ?? "—",
      fmtDate(r.request_date), fmtDateTime(r.reviewed_at),
      r.adjusted_in ?? "—", r.reviewed_by_name ?? "—",
      r.status ? r.status.charAt(0).toUpperCase() + r.status.slice(1) : "—",
    ];
    const borderThin = { top: { style: "thin", color: { rgb: "E2E8F0" } }, bottom: { style: "thin", color: { rgb: "E2E8F0" } }, left: { style: "thin", color: { rgb: "E2E8F0" } }, right: { style: "thin", color: { rgb: "E2E8F0" } } };
    rowData.forEach((val, ci) => {
      const addr = XLSX.utils.encode_cell({ r: ri + 3, c: ci });
      const base = { font: { name: "Calibri", sz: 10, color: { rgb: "1E293B" } }, fill: rowFill, alignment: { vertical: "center", wrapText: false }, border: borderThin };
      if (ci === 0) { base.font = { ...base.font, bold: true, color: { rgb: "4F46E5" } }; base.alignment = { ...base.alignment, horizontal: "center" }; }
      if (ci === 4) { base.font = { ...base.font, bold: true, color: { rgb: "1E3A8A" } }; base.alignment = { ...base.alignment, horizontal: "right" }; }
      if (ci === 6) { base.alignment = { ...base.alignment, wrapText: true }; }
      if (ci === 7 || ci === 8 || ci === 9) { base.alignment = { ...base.alignment, horizontal: "center" }; }
      if (ci === 8 && val !== "—") { base.font = { ...base.font, color: { rgb: "065F46" }, bold: true }; }
      if (ci === 10 && val !== "—") { base.font = { ...base.font, color: { rgb: "0F766E" } }; }
      if (ci === 11) { base.fill = STATUS_FILL[status] ?? rowFill; base.font = { ...base.font, ...(STATUS_FONT[status] ?? {}) }; base.alignment = { ...base.alignment, horizontal: "center" }; }
      ws[addr] = { v: val, t: typeof val === "number" ? "n" : "s", s: base, ...(typeof val === "number" ? { z: "₹#,##0" } : {}) };
    });
  });

  const sRow = requests.length + 3;
  const approvedCnt = requests.filter(r => r.status === "approved").length;
  const pendingCnt  = requests.filter(r => r.status === "pending").length;
  const rejectedCnt = requests.filter(r => r.status === "rejected").length;
  const totalAmt    = requests.reduce((s, r) => s + (Number(r.amount) || 0), 0);
  const summaryBase = { font: { name: "Calibri", sz: 10, bold: true, color: { rgb: "FFFFFF" } }, fill: { patternType: "solid", fgColor: { rgb: "1E3A8A" } }, border: { top: { style: "medium", color: { rgb: "3B82F6" } }, bottom: { style: "medium", color: { rgb: "3B82F6" } }, left: { style: "thin", color: { rgb: "3B82F6" } }, right: { style: "thin", color: { rgb: "3B82F6" } } } };
  const summaryCells = { 3: { v: "TOTALS", align: "right" }, 4: { v: totalAmt, isNum: true, align: "right", color: "FCD34D", sz: 11 }, 7: { v: `Requested: ${requests.length}`, align: "center" }, 9: { v: `✓ ${approvedCnt} approved`, align: "center", color: "6EE7B7" }, 10: { v: `⏳ ${pendingCnt}  ✕ ${rejectedCnt}`, align: "center", color: "FCD34D" }, 11: { v: `Total: ${fmt(totalAmt)}`, align: "center", color: "FCD34D" } };
  [...Array(COLUMNS.length).keys()].forEach(ci => {
    const cell = summaryCells[ci];
    ws[XLSX.utils.encode_cell({ r: sRow, c: ci })] = { v: cell?.v ?? "", t: cell?.isNum ? "n" : "s", ...(cell?.isNum ? { z: "₹#,##0" } : {}), s: { ...summaryBase, font: { ...summaryBase.font, ...(cell?.color ? { color: { rgb: cell.color } } : {}), ...(cell?.sz ? { sz: cell.sz } : {}) }, alignment: { horizontal: cell?.align ?? "center", vertical: "center" } } };
  });

  ws["!ref"]    = XLSX.utils.encode_range({ s: { r: 0, c: 0 }, e: { r: sRow, c: COLUMNS.length - 1 } });
  ws["!cols"]   = COLUMNS.map(c => ({ wch: c.wch }));
  ws["!rows"]   = [{ hpt: 38 }, { hpt: 20 }, { hpt: 30 }, ...requests.map(() => ({ hpt: 22 })), { hpt: 26 }];
  ws["!freeze"] = { xSplit: 0, ySplit: 3, topLeftCell: "A4", activeCell: "A4" };
  XLSX.utils.book_append_sheet(wb, ws, "Advance Payments");

  const approvedAmt = requests.filter(r => r.status === "approved").reduce((s, r) => s + (Number(r.amount) || 0), 0);
  const ws2 = XLSX.utils.aoa_to_sheet([["Advance Payment Summary", ""], ["Generated", new Date().toLocaleString("en-IN")], [""], ["Total requests", requests.length], ["Total amount (₹)", totalAmt], [""], ["✓ Approved", approvedCnt], ["  Approved amount (₹)", approvedAmt], [""], ["⏳ Pending", pendingCnt], ["✕ Rejected", rejectedCnt]]);
  ws2["!cols"] = [{ wch: 24 }, { wch: 26 }];
  XLSX.utils.book_append_sheet(wb, ws2, "Summary");

  const dedRows = [];
  requests.forEach(r => { (r.deductions ?? []).forEach(d => { dedRows.push([r.request_code, r.emp_id, r.emp_name, r.emp_dept, d.month_label, Number(d.amount) || 0, d.status ?? "upcoming", d.deduction_date ? fmtDate(d.deduction_date) : "—"]); }); });
  if (dedRows.length) {
    const ws3 = XLSX.utils.aoa_to_sheet([["Request ID","Employee ID","Name","Dept","Month","Amount (₹)","Status","Due Date"], ...dedRows]);
    ws3["!cols"] = [16,14,26,18,14,14,12,14].map(wch => ({ wch }));
    XLSX.utils.book_append_sheet(wb, ws3, "Deduction Schedule");
  }
  return wb;
}

function fmt(n) { return `₹${Math.round(Number(n) || 0).toLocaleString("en-IN")}`; }

// ─────────────────────────────────────────────────────────────────────────────
export default function AdvancePayment() {
  const [showLink,    setShowLink]    = useState(false);
  const [showAdd,     setShowAdd]     = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [exporting,   setExporting]   = useState(false);

  const exportExcel = async () => {
    if (exporting) return;
    try {
      setExporting(true);
      const res = await advancePaymentService.getAllRequests();
      const all = res.data ?? [];
      if (!all.length) { alert("No requests to export."); return; }
      const enriched = await Promise.all(
        all.map(async r => {
          if (r.status !== "approved") return r;
          try { const dr = await advancePaymentService.getDeductions(r.id); return { ...r, deductions: dr.data ?? [] }; }
          catch { return r; }
        })
      );
      const wb = buildExcel(enriched);
      XLSX.writeFile(wb, `advance_payments_${new Date().toISOString().slice(0,10)}.xlsx`);
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
          <button onClick={() => setShowHistory(true)} className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 bg-white text-sm font-semibold hover:bg-slate-50 hover:border-slate-300 transition-all shadow-sm">
            <History size={15} />History
          </button>
          <button onClick={() => setShowLink(true)} className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 bg-white text-sm font-semibold hover:bg-slate-50 hover:border-slate-300 transition-all shadow-sm">
            <Link2 size={15} />Generate Link
          </button>
          <button onClick={exportExcel} disabled={exporting} className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 bg-white text-sm font-semibold hover:bg-slate-50 hover:border-slate-300 transition-all shadow-sm disabled:opacity-60 disabled:cursor-not-allowed">
            {exporting ? <Loader2 size={15} className="animate-spin" /> : <Download size={15} />}
            {exporting ? "Exporting…" : "Export Excel"}
          </button>
          <button onClick={() => setShowAdd(true)} className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 active:bg-indigo-800 transition-all shadow-sm shadow-indigo-200">
            <Plus size={15} />New Request
          </button>
        </div>
      </div>

      {/* ── Dashboard ── */}
      <AdvancePaymentDashboard />

      {/* ── Modals ── */}
      {showLink && <GenerateLinkModal onClose={() => setShowLink(false)} />}
      {showAdd  && <AddRequestModal   onClose={() => setShowAdd(false)}  />}

      {/* ── Payment History — renders its own overlay+card, no wrapper needed ── */}
      {showHistory && (
        <PaymentHistory onClose={() => setShowHistory(false)} />
      )}

    </div>
  );
}