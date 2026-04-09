// ─────────────────────────────────────────────────────────────────────────────
// EmployeeHistoryDownload.jsx
// Download utilities + DownloadToast for HR Activity Log & Employee History
// Supports: Direct PDF (jsPDF + autoTable) and Excel (SheetJS with styling)
//
// ✅ FIX: Employee full name now uses First + Father/Husband + Last in all exports
// ✅ FIX: Employee ID shown in exports now follows the same rule as the UI:
//   Active/Approved  → current live ID from DB (event.employee_id)
//   Inactive/Rejected/Blacklisted/Pending → old ID from metadata snapshot
// ✅ NEW: DownloadToast — clean green success toast, non-blocking, bottom-right
//        Auto-dismisses with live progress bar. Hover to pause.
//
// Install dependencies:
//   npm install jspdf jspdf-autotable xlsx-js-style lucide-react
// ─────────────────────────────────────────────────────────────────────────────

import React, { useState, useEffect, useRef } from "react";
import {
  Download,
  FileText,
  FileSpreadsheet,
  CheckCircle2,
  X,
  ArrowDownToLine,
} from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx-js-style";

// ── Status label helper ───────────────────────────────────────────────────────
const STATUS_LABELS = {
  active: "Active",
  approved: "Active",
  pending: "Pending",
  pending_rejoin: "Pending Rejoin",
  inactive: "Inactive",
  rejected: "Rejected",
  blacklist: "Blacklisted",
  blacklisted: "Blacklisted",
};

function statusLabel(s) {
  return STATUS_LABELS[s?.toLowerCase()] || s || "-";
}

function fmtDateTime(d) {
  if (!d) return "-";
  return new Date(d).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function fmtDate(d) {
  if (!d) return "-";
  return new Date(d).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

// ── Arrow-safe transition label (ASCII only — avoids jsPDF encoding glitch) ──
function transitionLabel(from, to) {
  if (!from) return "Registered";
  return `${statusLabel(from)} -> ${statusLabel(to)}`;
}

// ── Resolve correct employee ID for a history event ───────────────────────────
function resolveDisplayEmpId(event) {
  const meta = event.metadata
    ? typeof event.metadata === "string"
      ? JSON.parse(event.metadata)
      : event.metadata
    : {};
  const toStatus = event.to_status?.toLowerCase();
  const isActive = toStatus === "active" || toStatus === "approved";
  return isActive
    ? event.employee_id || meta.employee_id || ""
    : meta.employee_id || event.employee_id || "";
}

// ── Full name helper: First + Father/Husband + Last ───────────────────────────
function resolveFullName(event) {
  const firstName = event.emp_first_name || event.first_name || "";
  const fatherName =
    event.emp_father_name || event.father_husband_name || "";
  const lastName = event.emp_last_name || event.last_name || "";
  return [firstName, fatherName, lastName]
    .map((s) => String(s || "").trim())
    .filter(Boolean)
    .join(" ");
}

// ══════════════════════════════════════════════════════════════════════════════
// PDF Download
// ══════════════════════════════════════════════════════════════════════════════
export function downloadPDFReport(events, meta = {}) {
  const {
    title = "HR Activity Log",
    subtitle = "Employee Status History Report",
    employeeName = null,
    employeeId = null,
    department = null,
    joiningDate = null,
    filename = "activity-log.pdf",
  } = meta;

  const generatedAt = new Date().toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const doc = new jsPDF({ orientation: "landscape", unit: "pt", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();

  // Header background
  doc.setFillColor(15, 23, 42);
  doc.rect(0, 0, pageW, 70, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text(title, 30, 28);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(148, 163, 184);
  doc.text(subtitle, 30, 42);

  if (employeeName) {
    doc.setTextColor(226, 232, 240);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    const empLine = [
      employeeName,
      employeeId ? `[${employeeId}]` : null,
      department ? `| ${department}` : null,
    ]
      .filter(Boolean)
      .join("  ");
    doc.text(empLine, 30, 58);
  }

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(148, 163, 184);
  doc.text(`Generated: ${generatedAt}`, pageW - 30, 28, { align: "right" });
  if (joiningDate) {
    doc.text(`Joined: ${fmtDate(joiningDate)}`, pageW - 30, 40, {
      align: "right",
    });
  }

  // Stats bar
  const stats = events.reduce(
    (acc, ev) => {
      const s = ev.to_status?.toLowerCase() || "";
      if (s === "active" || s === "approved") acc.active++;
      else if (s === "inactive" || s === "rejected") acc.inactive++;
      else if (s === "blacklist" || s === "blacklisted") acc.blacklist++;
      else if (s === "pending" || s === "pending_rejoin") acc.pending++;
      return acc;
    },
    { active: 0, inactive: 0, blacklist: 0, pending: 0 }
  );

  const statItems = [
    { label: "ACTIVE", n: stats.active, r: 22, g: 163, b: 74 },
    { label: "INACTIVE", n: stats.inactive, r: 220, g: 38, b: 38 },
    { label: "BLACKLISTED", n: stats.blacklist, r: 194, g: 65, b: 12 },
    { label: "PENDING", n: stats.pending, r: 79, g: 70, b: 229 },
  ];
  const statW = pageW / 4;
  statItems.forEach((s, i) => {
    const x = i * statW;
    doc.setFillColor(248, 250, 252);
    doc.rect(x, 70, statW, 36, "F");
    doc.setDrawColor(226, 232, 240);
    if (i < 3) doc.line(x + statW, 70, x + statW, 106);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.setTextColor(s.r, s.g, s.b);
    doc.text(String(s.n), x + 14, 90);

    doc.setFontSize(7);
    doc.text(`-> ${s.label}`, x + 14, 101);
  });

  // Table
  const rows = events.map((ev) => {
    const name = resolveFullName(ev);
    const dept = ev.emp_department || ev.department || "";
    const empId = resolveDisplayEmpId(ev);
    const empCell = [name, empId, dept].filter(Boolean).join("\n");
    return [
      empCell,
      transitionLabel(ev.from_status, ev.to_status),
      ev.reason || "-",
      ev.changed_by_name || "-",
      fmtDateTime(ev.created_at),
    ];
  });

  autoTable(doc, {
    startY: 112,
    head: [["Employee", "Transition", "Reason", "Changed By", "Date & Time"]],
    body: rows,
    margin: { left: 20, right: 20 },
    styles: {
      fontSize: 8,
      cellPadding: { top: 6, bottom: 6, left: 8, right: 8 },
      overflow: "linebreak",
      lineColor: [226, 232, 240],
      lineWidth: 0.5,
      font: "helvetica",
    },
    headStyles: {
      fillColor: [15, 23, 42],
      textColor: [148, 163, 184],
      fontStyle: "bold",
      fontSize: 7,
    },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    columnStyles: {
      0: { cellWidth: 120 },
      1: { cellWidth: 110 },
      2: { cellWidth: "auto" },
      3: { cellWidth: 90 },
      4: { cellWidth: 110 },
    },
    didParseCell(data) {
      if (data.section === "body" && data.column.index === 1) {
        const val = String(data.cell.raw || "");
        if (val === "Registered") {
          data.cell.styles.textColor = [29, 78, 216];
          data.cell.styles.fontStyle = "bold";
        } else if (val.includes("->")) {
          data.cell.styles.textColor = [79, 70, 229];
          data.cell.styles.fontStyle = "bold";
        }
      }
    },
  });

  // Footer
  const finalY = doc.lastAutoTable?.finalY || pageH - 30;
  doc.setDrawColor(241, 245, 249);
  doc.line(20, finalY + 14, pageW - 20, finalY + 14);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.setTextColor(148, 163, 184);
  doc.text(`Confidential HR Document  |  ${title}`, 20, finalY + 24);
  doc.text(`Generated on ${generatedAt}`, pageW - 20, finalY + 24, {
    align: "right",
  });

  doc.save(filename);
  return { filename, rows: events.length, format: "pdf" };
}

// ══════════════════════════════════════════════════════════════════════════════
// Excel colour palette
// ══════════════════════════════════════════════════════════════════════════════
const XL = {
  hdrBg: { rgb: "0F172A" },
  hdrFg: { rgb: "E2E8F0" },
  subBg: { rgb: "1E293B" },
  subFg: { rgb: "94A3B8" },
  colBg: { rgb: "334155" },
  colFg: { rgb: "F8FAFC" },
  rowAlt: { rgb: "F8FAFC" },
  rowBase: { rgb: "FFFFFF" },
  rowFg: { rgb: "1E293B" },
  active: { rgb: "15803D" },
  inactive: { rgb: "DC2626" },
  pending: { rgb: "7C3AED" },
  blacklist: { rgb: "C2410C" },
  registered: { rgb: "1D4ED8" },
  transition: { rgb: "4F46E5" },
  statActive: { rgb: "DCFCE7" },
  statInactive: { rgb: "FEE2E2" },
  statBlack: { rgb: "FFEDD5" },
  statPending: { rgb: "EDE9FE" },
  border: { rgb: "CBD5E1" },
  metaBg: { rgb: "F1F5F9" },
  metaFg: { rgb: "475569" },
  metaVal: { rgb: "0F172A" },
};

function cell(value, style = {}) {
  return { v: value, s: style };
}
function makeFont(
  bold = false,
  size = 10,
  color = { rgb: "000000" },
  name = "Calibri"
) {
  return { bold, sz: size, color, name };
}
function makeFill(fgColor) {
  return { patternType: "solid", fgColor };
}
function makeBorder(color = XL.border) {
  const s = { style: "thin", color };
  return { top: s, bottom: s, left: s, right: s };
}
function makeAlignment(
  horizontal = "left",
  vertical = "center",
  wrapText = true
) {
  return { horizontal, vertical, wrapText };
}

function statusColor(s) {
  const lower = s?.toLowerCase() || "";
  if (lower === "active" || lower === "approved") return XL.active;
  if (lower === "inactive" || lower === "rejected") return XL.inactive;
  if (lower === "blacklist" || lower === "blacklisted") return XL.blacklist;
  if (lower === "pending" || lower === "pending_rejoin") return XL.pending;
  return XL.rowFg;
}

// ══════════════════════════════════════════════════════════════════════════════
// Excel Download
// ══════════════════════════════════════════════════════════════════════════════
export function downloadExcelReport(events, meta = {}) {
  const {
    title = "HR Activity Log",
    employeeName = null,
    employeeId = null,
    department = null,
    filename = "activity-log.xlsx",
  } = meta;

  const generatedAt = new Date().toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const stats = events.reduce(
    (acc, ev) => {
      const s = ev.to_status?.toLowerCase() || "";
      if (s === "active" || s === "approved") acc.active++;
      else if (s === "inactive" || s === "rejected") acc.inactive++;
      else if (s === "blacklist" || s === "blacklisted") acc.blacklist++;
      else if (s === "pending" || s === "pending_rejoin") acc.pending++;
      return acc;
    },
    { active: 0, inactive: 0, blacklist: 0, pending: 0 }
  );

  // ── ACTIVITY LOG SHEET ──
  const ws = {};
  let r = 0;

  function writeRow(cells) {
    cells.forEach((c, ci) => {
      ws[XLSX.utils.encode_cell({ r, c: ci })] = c;
    });
    r++;
  }
  function emptyRow() {
    ws[XLSX.utils.encode_cell({ r, c: 0 })] = {
      v: "",
      s: { fill: makeFill({ rgb: "FFFFFF" }) },
    };
    r++;
  }

  writeRow([
    cell(title, {
      font: makeFont(true, 16, XL.hdrFg),
      fill: makeFill(XL.hdrBg),
      alignment: makeAlignment("left", "center", false),
    }),
    ...Array(8).fill(cell("", { fill: makeFill(XL.hdrBg) })),
  ]);

  writeRow([
    cell("Employee Status History Report", {
      font: makeFont(false, 9, { rgb: "94A3B8" }),
      fill: makeFill(XL.subBg),
      alignment: makeAlignment("left", "center", false),
    }),
    ...Array(5).fill(cell("", { fill: makeFill(XL.subBg) })),
    cell(`Generated: ${generatedAt}`, {
      font: makeFont(false, 8, { rgb: "94A3B8" }),
      fill: makeFill(XL.subBg),
      alignment: makeAlignment("right", "center", false),
    }),
    cell("", { fill: makeFill(XL.subBg) }),
    cell("", { fill: makeFill(XL.subBg) }),
  ]);

  const empInfo = [
    employeeName ? `Employee: ${employeeName}` : "All Employees",
    employeeId ? `ID: ${employeeId}` : null,
    department ? `Dept: ${department}` : null,
  ]
    .filter(Boolean)
    .join("   |   ");
  writeRow([
    cell(empInfo, {
      font: makeFont(true, 9, XL.hdrFg),
      fill: makeFill({ rgb: "1E3A5F" }),
      alignment: makeAlignment("left", "center", false),
    }),
    ...Array(8).fill(cell("", { fill: makeFill({ rgb: "1E3A5F" }) })),
  ]);

  emptyRow();

  const statDefs = [
    {
      label: "Active",
      n: stats.active,
      bg: XL.statActive,
      fg: XL.active,
    },
    {
      label: "Inactive",
      n: stats.inactive,
      bg: XL.statInactive,
      fg: XL.inactive,
    },
    {
      label: "Blacklisted",
      n: stats.blacklist,
      bg: XL.statBlack,
      fg: XL.blacklist,
    },
    {
      label: "Pending",
      n: stats.pending,
      bg: XL.statPending,
      fg: XL.pending,
    },
    {
      label: "Total Events",
      n: events.length,
      bg: { rgb: "F1F5F9" },
      fg: { rgb: "0F172A" },
    },
  ];

  writeRow(
    statDefs
      .flatMap((s) => [
        cell(s.n, {
          font: makeFont(true, 20, s.fg),
          fill: makeFill(s.bg),
          alignment: makeAlignment("center", "center", false),
          border: makeBorder({ rgb: "E2E8F0" }),
        }),
        cell("", {
          fill: makeFill(s.bg),
          border: makeBorder({ rgb: "E2E8F0" }),
        }),
      ])
      .slice(0, 9)
  );

  writeRow(
    statDefs
      .flatMap((s) => [
        cell(`-> ${s.label.toUpperCase()}`, {
          font: makeFont(true, 8, s.fg),
          fill: makeFill(s.bg),
          alignment: makeAlignment("center", "center", false),
          border: makeBorder({ rgb: "E2E8F0" }),
        }),
        cell("", {
          fill: makeFill(s.bg),
          border: makeBorder({ rgb: "E2E8F0" }),
        }),
      ])
      .slice(0, 9)
  );

  emptyRow();

  const COL_HEADERS = [
    "Employee Name",
    "Employee ID",
    "Department",
    "Transition",
    "From Status",
    "To Status",
    "Reason",
    "Changed By",
    "Date & Time",
  ];
  writeRow(
    COL_HEADERS.map((h) =>
      cell(h, {
        font: makeFont(true, 9, XL.colFg),
        fill: makeFill(XL.colBg),
        alignment: makeAlignment("center", "center", false),
        border: makeBorder({ rgb: "475569" }),
      })
    )
  );

  events.forEach((ev, idx) => {
    const isAlt = idx % 2 === 1;
    const rowBg = isAlt ? makeFill(XL.rowAlt) : makeFill(XL.rowBase);
    const bdr = makeBorder();
    const from = ev.from_status;
    const to = ev.to_status;
    const trans = transitionLabel(from, to);
    const isReg = !from;

    const name = resolveFullName(ev);
    const displayEmpId = resolveDisplayEmpId(ev);

    const baseStyle = (bold = false, color = XL.rowFg) => ({
      font: makeFont(bold, 9, color),
      fill: rowBg,
      alignment: makeAlignment("left", "center"),
      border: bdr,
    });

    writeRow([
      cell(name, {
        ...baseStyle(true),
        alignment: makeAlignment("left", "center", false),
      }),
      cell(displayEmpId || "-", {
        ...baseStyle(false, { rgb: "64748B" }),
        alignment: makeAlignment("center", "center", false),
      }),
      cell(ev.emp_department || ev.department || "-", baseStyle()),
      cell(trans, {
        font: makeFont(true, 9, isReg ? XL.registered : XL.transition),
        fill: isReg ? makeFill({ rgb: "EFF6FF" }) : makeFill({ rgb: "EEF2FF" }),
        alignment: makeAlignment("center", "center", false),
        border: bdr,
      }),
      cell(from ? statusLabel(from) : "-", {
        font: makeFont(false, 9, from ? statusColor(from) : { rgb: "94A3B8" }),
        fill: rowBg,
        alignment: makeAlignment("center", "center", false),
        border: bdr,
      }),
      cell(statusLabel(to), {
        font: makeFont(true, 9, statusColor(to)),
        fill: rowBg,
        alignment: makeAlignment("center", "center", false),
        border: bdr,
      }),
      cell(ev.reason || "-", baseStyle()),
      cell(ev.changed_by_name || "-", {
        ...baseStyle(false, { rgb: "475569" }),
        alignment: makeAlignment("center", "center", false),
      }),
      cell(fmtDateTime(ev.created_at), {
        ...baseStyle(false, { rgb: "64748B" }),
        alignment: makeAlignment("center", "center", false),
      }),
    ]);
  });

  ws["!ref"] = XLSX.utils.encode_range(
    { r: 0, c: 0 },
    { r: r - 1, c: 8 }
  );
  ws["!merges"] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: 8 } },
    { s: { r: 1, c: 0 }, e: { r: 1, c: 5 } },
    { s: { r: 1, c: 6 }, e: { r: 1, c: 8 } },
    { s: { r: 2, c: 0 }, e: { r: 2, c: 8 } },
    { s: { r: 4, c: 0 }, e: { r: 4, c: 1 } },
    { s: { r: 4, c: 2 }, e: { r: 4, c: 3 } },
    { s: { r: 4, c: 4 }, e: { r: 4, c: 5 } },
    { s: { r: 4, c: 6 }, e: { r: 4, c: 7 } },
    { s: { r: 5, c: 0 }, e: { r: 5, c: 1 } },
    { s: { r: 5, c: 2 }, e: { r: 5, c: 3 } },
    { s: { r: 5, c: 4 }, e: { r: 5, c: 5 } },
    { s: { r: 5, c: 6 }, e: { r: 5, c: 7 } },
  ];
  ws["!cols"] = [
    { wch: 28 },
    { wch: 13 },
    { wch: 16 },
    { wch: 26 },
    { wch: 14 },
    { wch: 14 },
    { wch: 32 },
    { wch: 18 },
    { wch: 22 },
  ];
  ws["!rows"] = [
    { hpt: 36 },
    { hpt: 20 },
    { hpt: 22 },
    { hpt: 8 },
    { hpt: 40 },
    { hpt: 18 },
    { hpt: 8 },
    { hpt: 24 },
    ...events.map(() => ({ hpt: 22 })),
  ];

  // ── SUMMARY SHEET ──
  const wsSummary = {};
  let sr = 0;

  function writeSummaryRow(cells) {
    cells.forEach((c, ci) => {
      wsSummary[XLSX.utils.encode_cell({ r: sr, c: ci })] = c;
    });
    sr++;
  }

  writeSummaryRow([
    cell("Summary", {
      font: makeFont(true, 14, XL.hdrFg),
      fill: makeFill(XL.hdrBg),
      alignment: makeAlignment("left", "center", false),
    }),
    cell("", { fill: makeFill(XL.hdrBg) }),
    cell("", { fill: makeFill(XL.hdrBg) }),
  ]);
  writeSummaryRow([
    cell("Status Transition Summary", {
      font: makeFont(false, 9, { rgb: "94A3B8" }),
      fill: makeFill(XL.subBg),
      alignment: makeAlignment("left", "center", false),
    }),
    cell("", { fill: makeFill(XL.subBg) }),
    cell("", { fill: makeFill(XL.subBg) }),
  ]);
  writeSummaryRow([cell("", {}), cell("", {}), cell("", {})]);
  writeSummaryRow([
    cell("Status", {
      font: makeFont(true, 10, XL.colFg),
      fill: makeFill(XL.colBg),
      alignment: makeAlignment("center", "center", false),
      border: makeBorder(),
    }),
    cell("Count", {
      font: makeFont(true, 10, XL.colFg),
      fill: makeFill(XL.colBg),
      alignment: makeAlignment("center", "center", false),
      border: makeBorder(),
    }),
    cell("Visual", {
      font: makeFont(true, 10, XL.colFg),
      fill: makeFill(XL.colBg),
      alignment: makeAlignment("center", "center", false),
      border: makeBorder(),
    }),
  ]);

  const summaryRows = [
    {
      label: "Active",
      n: stats.active,
      bg: XL.statActive,
      fg: XL.active,
    },
    {
      label: "Inactive",
      n: stats.inactive,
      bg: XL.statInactive,
      fg: XL.inactive,
    },
    {
      label: "Blacklisted",
      n: stats.blacklist,
      bg: XL.statBlack,
      fg: XL.blacklist,
    },
    {
      label: "Pending",
      n: stats.pending,
      bg: XL.statPending,
      fg: XL.pending,
    },
    {
      label: "Total Events",
      n: events.length,
      bg: { rgb: "F1F5F9" },
      fg: { rgb: "0F172A" },
    },
  ];

  summaryRows.forEach((row) => {
    const bar = "#".repeat(
      Math.min(Math.round((row.n / Math.max(events.length, 1)) * 20), 20)
    );
    writeSummaryRow([
      cell(`-> ${row.label}`, {
        font: makeFont(true, 11, row.fg),
        fill: makeFill(row.bg),
        alignment: makeAlignment("left", "center", false),
        border: makeBorder(),
      }),
      cell(row.n, {
        font: makeFont(true, 14, row.fg),
        fill: makeFill(row.bg),
        alignment: makeAlignment("center", "center", false),
        border: makeBorder(),
      }),
      cell(bar || "-", {
        font: makeFont(false, 10, row.fg),
        fill: makeFill(row.bg),
        alignment: makeAlignment("left", "center", false),
        border: makeBorder(),
      }),
    ]);
  });

  wsSummary["!ref"] = XLSX.utils.encode_range(
    { r: 0, c: 0 },
    { r: sr - 1, c: 2 }
  );
  wsSummary["!merges"] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: 2 } },
    { s: { r: 1, c: 0 }, e: { r: 1, c: 2 } },
  ];
  wsSummary["!cols"] = [{ wch: 20 }, { wch: 10 }, { wch: 24 }];
  wsSummary["!rows"] = [
    { hpt: 34 },
    { hpt: 18 },
    { hpt: 8 },
    { hpt: 22 },
    ...summaryRows.map(() => ({ hpt: 30 })),
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Activity Log");
  XLSX.utils.book_append_sheet(wb, wsSummary, "Summary");
  XLSX.writeFile(wb, filename);
  return { filename, rows: events.length, format: "excel" };
}

// ══════════════════════════════════════════════════════════════════════════════
// DownloadToast
// Clean green success toast — slides in from bottom-right, auto-dismisses.
// Hover over the toast to pause the countdown timer.
// Props:
//   result   — { filename, rows, format: 'pdf' | 'excel' }
//   onClose  — called when toast should be removed from the tree
// ══════════════════════════════════════════════════════════════════════════════
const TOAST_DURATION = 6000; // ms before auto-dismiss

export function DownloadToast({ result, onClose }) {
  const [progress, setProgress] = useState(100);
  const [exiting, setExiting] = useState(false);
  const [hovered, setHovered] = useState(false);

  const intervalRef = useRef(null);
  const startedAt = useRef(Date.now());
  const remaining = useRef(TOAST_DURATION);

  // ── helpers ──
  function triggerExit() {
    setExiting(true);
    setTimeout(onClose, 350);
  }

  function startCountdown() {
    startedAt.current = Date.now();
    intervalRef.current = setInterval(() => {
      const elapsed = Date.now() - startedAt.current;
      const pct = Math.max(0, 100 - (elapsed / remaining.current) * 100);
      setProgress(pct);
      if (pct <= 0) {
        clearInterval(intervalRef.current);
        triggerExit();
      }
    }, 40);
  }

  function pauseCountdown() {
    clearInterval(intervalRef.current);
    remaining.current = Math.max(
      0,
      remaining.current - (Date.now() - startedAt.current)
    );
  }

  // start on mount
  useEffect(() => {
    if (!result) return;
    startCountdown();
    return () => clearInterval(intervalRef.current);
  }, [result]);

  // pause / resume on hover
  useEffect(() => {
    if (!result) return;
    if (hovered) {
      pauseCountdown();
    } else {
      if (remaining.current > 0) startCountdown();
    }
    return () => clearInterval(intervalRef.current);
  }, [hovered]);

  if (!result) return null;

  const isPDF = result.format === "pdf";

  // ── inline styles ──
  const toastStyle = {
    position: "fixed",
    bottom: 24,
    right: 24,
    zIndex: 999999,
    width: 400,
    fontFamily:
      "'Segoe UI', -apple-system, BlinkMacSystemFont, system-ui, sans-serif",
    animation: exiting
      ? "dlToastOut 0.35s cubic-bezier(0.4,0,1,1) both"
      : "dlToastIn 0.45s cubic-bezier(0.22,1,0.36,1) both",
  };

  const cardStyle = {
    background: "#ffffff",
    border: "0.5px solid #bbf7d0",
    borderLeft: "3.5px solid #16a34a",
    borderRadius: 12,
    overflow: "hidden",
    boxShadow:
      "0 8px 32px -4px rgba(22,163,74,0.12), 0 2px 8px -2px rgba(0,0,0,0.06)",
  };

  const innerStyle = {
    display: "flex",
    alignItems: "center",
    gap: 12,
    padding: "13px 14px 15px 14px",
  };

  const iconWrapStyle = {
    width: 34,
    height: 34,
    borderRadius: 8,
    background: "#f0fdf4",
    border: "0.5px solid #bbf7d0",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  };

  const bodyStyle = { flex: 1, minWidth: 0 };

  const msgStyle = {
    fontSize: 13,
    fontWeight: 600,
    color: "#0f172a",
    lineHeight: 1.35,
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  };

  const subStyle = {
    fontSize: 11,
    color: "#64748b",
    marginTop: 2,
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  };

  const rightStyle = {
    display: "flex",
    alignItems: "center",
    gap: 8,
    flexShrink: 0,
  };

  const badgeStyle = {
    fontSize: 10,
    fontWeight: 500,
    padding: "3px 9px",
    borderRadius: 99,
    background: "#f0fdf4",
    color: "#15803d",
    border: "0.5px solid #bbf7d0",
    whiteSpace: "nowrap",
  };

  const xBtnStyle = {
    width: 24,
    height: 24,
    borderRadius: 6,
    border: "0.5px solid #e2e8f0",
    background: "transparent",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#94a3b8",
    fontSize: 11,
    lineHeight: 1,
    fontFamily: "inherit",
    padding: 0,
    transition: "background 0.12s",
  };

  const progressTrackStyle = {
    height: 2,
    background: "#e7f5ec",
    position: "relative",
  };

  const progressFillStyle = {
    position: "absolute",
    left: 0,
    top: 0,
    height: "100%",
    width: `${progress}%`,
    background: "#16a34a",
    borderRadius: "0 99px 99px 0",
    transition: hovered ? "none" : "width 0.04s linear",
  };

  const hintStyle = {
    display: "flex",
    alignItems: "center",
    gap: 5,
    fontSize: 10,
    color: "#94a3b8",
    padding: "0 14px 11px 14px",
  };

  const message = isPDF
    ? "Employee history exported successfully"
    : "Employee history downloaded as Excel";

  const subMessage = `${result.filename} · ${result.rows} record${
    result.rows !== 1 ? "s" : ""
  } · saved to Downloads`;

  return (
    <>
      <style>{`
        @keyframes dlToastIn {
          0%   { opacity: 0; transform: translateX(calc(100% + 28px)) scale(0.94); }
          60%  { opacity: 1; transform: translateX(-4px) scale(1.01); }
          100% { opacity: 1; transform: translateX(0) scale(1); }
        }
        @keyframes dlToastOut {
          0%   { opacity: 1; transform: translateX(0) scale(1); }
          100% { opacity: 0; transform: translateX(calc(100% + 28px)) scale(0.94); }
        }
        .__dl-xbtn:hover { background: #f1f5f9 !important; color: #475569 !important; }
      `}</style>

      <div
        style={toastStyle}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        <div style={cardStyle}>
          {/* ── Main row ── */}
          <div style={innerStyle}>
            {/* Icon */}
            <div style={iconWrapStyle}>
              {isPDF ? (
                <FileText size={16} color="#16a34a" strokeWidth={1.8} />
              ) : (
                <FileSpreadsheet size={16} color="#16a34a" strokeWidth={1.8} />
              )}
            </div>

            {/* Text */}
            <div style={bodyStyle}>
              <div style={msgStyle}>{message}</div>
              <div style={subStyle}>{subMessage}</div>
            </div>

            {/* Right: badge + close */}
            <div style={rightStyle}>
              <span style={badgeStyle}>Downloaded</span>
              <button
                className="__dl-xbtn"
                style={xBtnStyle}
                onClick={() => {
                  clearInterval(intervalRef.current);
                  triggerExit();
                }}
                title="Dismiss"
              >
                <X size={11} strokeWidth={2.5} />
              </button>
            </div>
          </div>

          {/* ── Downloads hint ── */}
          <div style={hintStyle}>
            <ArrowDownToLine size={10} color="#94a3b8" strokeWidth={2} />
            <span>
              File saved to{" "}
              <strong style={{ color: "#64748b", fontWeight: 600 }}>
                Downloads
              </strong>{" "}
              automatically
              {hovered && (
                <span
                  style={{
                    marginLeft: 8,
                    fontSize: 9,
                    color: "#94a3b8",
                    fontWeight: 500,
                    letterSpacing: "0.04em",
                  }}
                >
                  · PAUSED
                </span>
              )}
            </span>
          </div>

          {/* ── Progress bar ── */}
          <div style={progressTrackStyle}>
            <div style={progressFillStyle} />
          </div>
        </div>
      </div>
    </>
  );
}

// Backwards-compat alias
export const DownloadSuccessModal = DownloadToast;

// ══════════════════════════════════════════════════════════════════════════════
// DownloadMenu — PDF + Excel split-button with dropdown
// Usage:
//   <DownloadMenu
//     events={historyEvents}
//     meta={{ title: "HR Log", employeeName: "Rahul Sharma", filename: "rahul-sharma" }}
//     onDownloadComplete={(result) => setToastResult(result)}
//   />
// ══════════════════════════════════════════════════════════════════════════════
export function DownloadMenu({
  events,
  meta = {},
  onDownloadComplete,
  buttonStyle = {},
}) {
  const [busy, setBusy] = useState(null); // null | 'pdf' | 'excel'
  const [open, setOpen] = useState(false);
  const menuRef = useRef(null);

  // close dropdown on outside click
  useEffect(() => {
    function handler(e) {
      if (menuRef.current && !menuRef.current.contains(e.target))
        setOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  async function handlePDF() {
    setOpen(false);
    setBusy("pdf");
    await new Promise((r) => setTimeout(r, 200));
    const pdfMeta = {
      ...meta,
      filename:
        (meta.filename || "activity-log").replace(
          /\.(html|pdf|xlsx)$/,
          ""
        ) + ".pdf",
    };
    const result = downloadPDFReport(events, pdfMeta);
    setBusy(null);
    if (onDownloadComplete) onDownloadComplete(result);
  }

  async function handleExcel() {
    setOpen(false);
    setBusy("excel");
    await new Promise((r) => setTimeout(r, 200));
    const excelMeta = {
      ...meta,
      filename:
        (meta.filename || "activity-log").replace(
          /\.(html|pdf|xlsx)$/,
          ""
        ) + ".xlsx",
    };
    const result = downloadExcelReport(events, excelMeta);
    setBusy(null);
    if (onDownloadComplete) onDownloadComplete(result);
  }

  const count = events?.length || 0;
  const isBusy = !!busy;

  return (
    <div ref={menuRef} style={{ position: "relative", display: "inline-flex" }}>
      <style>{`
        @keyframes dlSpin    { to { transform: rotate(360deg); } }
        @keyframes dlDropIn  {
          from { opacity: 0; transform: translateY(-6px) scale(0.97); }
          to   { opacity: 1; transform: none; }
        }
        .__dl-pdf-opt:hover  { background: #fef2f2 !important; }
        .__dl-xlsx-opt:hover { background: #f0fdf4 !important; }
        .__dl-trigger:hover:not(:disabled) {
          background: rgba(255,255,255,0.18) !important;
          border-color: rgba(255,255,255,0.28) !important;
        }
        .__dl-trigger:disabled { opacity: 0.7; cursor: wait; }
      `}</style>

      {/* Trigger button */}
      <button
        className="__dl-trigger"
        onClick={() => setOpen((v) => !v)}
        disabled={isBusy}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          padding: "7px 14px",
          borderRadius: 9,
          border: "1px solid rgba(255,255,255,0.18)",
          background: "rgba(255,255,255,0.1)",
          color: "#e2e8f0",
          fontSize: 12,
          fontWeight: 600,
          cursor: isBusy ? "wait" : "pointer",
          fontFamily: "inherit",
          transition: "all 0.14s ease",
          ...buttonStyle,
        }}
      >
        {isBusy ? (
          <div
            style={{
              width: 13,
              height: 13,
              border: "2px solid",
              borderColor:
                "rgba(255,255,255,0.3) white white white",
              borderRadius: "50%",
              animation: "dlSpin 0.7s linear infinite",
            }}
          />
        ) : (
          <Download size={13} strokeWidth={2} />
        )}
        {busy === "pdf"
          ? "Generating PDF…"
          : busy === "excel"
          ? "Generating Excel…"
          : "Export"}
        {!isBusy && (
          <span
            style={{
              background: "rgba(255,255,255,0.15)",
              borderRadius: 4,
              padding: "1px 5px",
              fontSize: 10,
              fontWeight: 700,
            }}
          >
            {count}
          </span>
        )}
        {!isBusy && (
          <svg
            width="10"
            height="10"
            viewBox="0 0 10 10"
            fill="none"
            style={{ marginLeft: 1, opacity: 0.7 }}
          >
            <path
              d="M2 3.5L5 6.5L8 3.5"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 7px)",
            right: 0,
            background: "white",
            borderRadius: 13,
            border: "1px solid #e2e8f0",
            boxShadow:
              "0 16px 48px -8px rgba(2,6,23,0.18), 0 4px 12px -4px rgba(2,6,23,0.08)",
            minWidth: 196,
            zIndex: 9999,
            animation: "dlDropIn 0.18s cubic-bezier(0.22,1,0.36,1) both",
            overflow: "hidden",
          }}
        >
          <div style={{ padding: "5px 5px" }}>
            {/* PDF option */}
            <button
              className="__dl-pdf-opt"
              onClick={handlePDF}
              style={{
                width: "100%",
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "10px 12px",
                borderRadius: 9,
                border: "none",
                background: "transparent",
                cursor: "pointer",
                fontFamily: "inherit",
                textAlign: "left",
                transition: "background 0.12s",
              }}
            >
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 8,
                  background: "#fef2f2",
                  border: "1px solid #fecaca",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <FileText size={15} color="#dc2626" strokeWidth={1.8} />
              </div>
              <div>
                <div
                  style={{
                    fontSize: 12.5,
                    fontWeight: 700,
                    color: "#0f172a",
                    marginBottom: 1,
                  }}
                >
                  Download PDF
                </div>
                <div style={{ fontSize: 10, color: "#94a3b8" }}>
                  Formatted report · Print-ready
                </div>
              </div>
            </button>

            {/* Divider */}
            <div
              style={{ height: 1, background: "#f1f5f9", margin: "3px 0" }}
            />

            {/* Excel option */}
            <button
              className="__dl-xlsx-opt"
              onClick={handleExcel}
              style={{
                width: "100%",
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "10px 12px",
                borderRadius: 9,
                border: "none",
                background: "transparent",
                cursor: "pointer",
                fontFamily: "inherit",
                textAlign: "left",
                transition: "background 0.12s",
              }}
            >
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 8,
                  background: "#f0fdf4",
                  border: "1px solid #bbf7d0",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <FileSpreadsheet
                  size={15}
                  color="#16a34a"
                  strokeWidth={1.8}
                />
              </div>
              <div>
                <div
                  style={{
                    fontSize: 12.5,
                    fontWeight: 700,
                    color: "#0f172a",
                    marginBottom: 1,
                  }}
                >
                  Download Excel
                </div>
                <div style={{ fontSize: 10, color: "#94a3b8" }}>
                  XLSX · Coloured · With summary sheet
                </div>
              </div>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// Default export (named exports preferred — use those in your app)
// ══════════════════════════════════════════════════════════════════════════════
export default {
  downloadPDFReport,
  downloadExcelReport,
  DownloadToast,
  DownloadSuccessModal,
  DownloadMenu,
};

// ══════════════════════════════════════════════════════════════════════════════
// Example usage in your page component:
//
//   import { DownloadMenu, DownloadToast } from "./EmployeeHistoryDownload";
//
//   function EmployeeHistoryPage() {
//     const [toastResult, setToastResult] = useState(null);
//
//     return (
//       <div>
//         <DownloadMenu
//           events={historyEvents}
//           meta={{
//             title: "Employee History",
//             employeeName: "Rahul Sharma",
//             employeeId: "EMP-001",
//             department: "Engineering",
//             filename: "rahul-sharma-history",
//           }}
//           onDownloadComplete={(result) => setToastResult(result)}
//         />
//
//         {toastResult && (
//           <DownloadToast
//             result={toastResult}
//             onClose={() => setToastResult(null)}
//           />
//         )}
//       </div>
//     );
//   }
// ══════════════════════════════════════════════════════════════════════════════