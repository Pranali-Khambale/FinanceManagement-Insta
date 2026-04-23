// src/Ui/Payroll/PayslipGenerator.js
// Supports two download formats:
//   1. PDF  (.pdf)  — downloadPayslipPDF(employee)
//   2. Excel (.xlsx) — downloadPayslipExcel(employee)

/* ─── shared data builder ─────────────────────────────────────────────────── */
function _buildData(employee) {
  const {
    name,
    employeeId,
    joiningDate,
    currentLocation,
    pDays = 0,
    aDays = 0,
    monthDays = 31,
    project,
    designation,
    grade,
    epfNo = "0",
    esicNo = "0",
    uanNo = "",
    aadharNo = "",
    panNo = "",
    forMonth = "",
    bankName = "",
    bankAccountNo = "",
    basic = 0,
    hra = 0,
    organisationAllowance = 0,
    performancePay = 0,
    pfDeduction = 0,
    pt = 0,
    otherDeduction = 0,
  } = employee;

  const ratio = monthDays > 0 ? pDays / monthDays : 1;
  const grossSalary = basic + hra + organisationAllowance;
  const grossSalaryD = grossSalary * ratio;
  const basicD = basic * ratio;
  const hraD = hra * ratio;
  const oaD = organisationAllowance * ratio;
  const perfD = performancePay * ratio;
  const totalEarning = grossSalary + performancePay;
  const totalEarningD = grossSalaryD + perfD;
  const totalDeduction = pfDeduction + pt + otherDeduction;
  const netSalary = grossSalaryD - totalDeduction;
  const totalWithPerf = netSalary + perfD;

  return {
    name,
    employeeId,
    joiningDate,
    currentLocation,
    pDays,
    aDays,
    monthDays,
    project,
    designation,
    grade,
    epfNo,
    esicNo,
    uanNo,
    aadharNo,
    panNo,
    forMonth,
    bankName,
    bankAccountNo,
    basic,
    hra,
    organisationAllowance,
    performancePay,
    pfDeduction,
    pt,
    otherDeduction,
    grossSalary,
    grossSalaryD,
    basicD,
    hraD,
    oaD,
    perfD,
    totalEarning,
    totalEarningD,
    totalDeduction,
    netSalary,
    totalWithPerf,
  };
}

const inr = (n) =>
  "Rs. " +
  Number(n || 0).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

/* ─── Load image as base64 data URL ───────────────────────────────────────── */
const loadImageBase64 = (src) =>
  new Promise((res) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      canvas.getContext("2d").drawImage(img, 0, 0);
      res({
        dataUrl: canvas.toDataURL("image/png"),
        w: img.naturalWidth,
        h: img.naturalHeight,
      });
    };
    img.onerror = () => res(null);
    img.src = src;
  });

/* =============================================================================
   PDF PAYSLIP
   ============================================================================= */
export const downloadPayslipPDF = async (employee) => {
  if (!window.jspdf) {
    await new Promise((resolve, reject) => {
      const s = document.createElement("script");
      s.src =
        "https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js";
      s.onload = resolve;
      s.onerror = reject;
      document.head.appendChild(s);
    });
  }

  const { jsPDF } = window.jspdf;
  const d = _buildData(employee);
  const logoInfo = await loadImageBase64("/assets/Insta-logo1.png");
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

  // Column x-positions & widths (mm)
  const ML = 8;
  const wA = 6.5;
  const wB = 22.0;
  const wC = 16.0;
  const wD = 20.5;
  const wE = 15.0;
  const wF = 9.5;
  const wG = 17.5;
  const wH = 5.5;
  const wI = 18.5;

  const xA = ML;
  const xB = xA + wA;
  const xC = xB + wB;
  const xD = xC + wC;
  const xE = xD + wD;
  const xF = xE + wE;
  const xG = xF + wF;
  const xH = xG + wG;
  const xI = xH + wH;

  const wBC = wB + wC;
  const wDI = wD + wE + wF + wG + wH + wI;
  const wBI = wBC + wDI;
  const wCD = wC + wD;
  const wEF = wE + wF;
  const wEFG = wE + wF + wG;
  const wHI = wH + wI;

  const PT = 0.353;

  const rTopSpacer = 28.5 * PT;

  const hR1 = 28.5 * PT;
  const hR2 = 28.5 * PT;
  const hR3 = 28.5 * PT;
  const hR4 = 44.25 * PT;
  const hHdr = hR1 + hR2 + hR3 + hR4;

  const rBan = 38.25 * PT;
  const rEmp = 28.5 * PT;
  const rTbl = 28.5 * PT;
  const rD1 = 28.5 * PT;
  const rD2 = 28.5 * PT;
  const rD3 = 32.25 * PT;
  const datRowH = [rD1, rD2, rD3];

  const rTot = 28.5 * PT;
  const rPerf = 31.2 * PT;
  const rPot = 45.0 * PT;
  const rDark = 28.5 * PT;
  const rSpc = 28.5 * PT;
  const rFtr = 28.5 * PT;

  // ── Colour from screenshots: #ACB9CA (steel blue-grey)

  const cHeader = [172, 185, 202]; // #ACB9CA

  const cNetSal = [172, 185, 202]; // #ACB9CA

  const cTotEarn = [172, 185, 202]; // #ACB9CA

  const cFooter = [172, 185, 202]; // #ACB9CA

  // Drawing helpers
  const sf = (bold, size, color = [0, 0, 0]) => {
    doc.setFont("helvetica", bold ? "bold" : "normal");
    doc.setFontSize(size);
    doc.setTextColor(...color);
  };
  const fr = (x, y, w, h, rgb) => {
    doc.setFillColor(...rgb);
    doc.rect(x, y, w, h, "F");
  };
  const sr = (x, y, w, h, rgb, lw) => {
    doc.setDrawColor(...rgb);
    doc.setLineWidth(lw);
    doc.rect(x, y, w, h, "S");
  };
  const cell = (x, y, w, h, fillRgb, border = "thin") => {
    if (fillRgb) fr(x, y, w, h, fillRgb);
    sr(x, y, w, h, [150, 150, 150], border === "medium" ? 0.5 : 0.15);
  };
  const ct = (str, x, y, w, h, bold, size, color, align = "center") => {
    sf(bold, size, color);
    const ty = y + h * 0.62;
    const s = String(str ?? "");
    if (align === "center") doc.text(s, x + w / 2, ty, { align: "center" });
    else if (align === "right")
      doc.text(s, x + w - 1.5, ty, { align: "right" });
    else doc.text(s, x + 2.5, ty);
  };
  const ctMulti = (lines, x, y, w, h, bold, size, color, align = "center") => {
    sf(bold, size, color);
    const lh = size * 0.45;
    const tot = lines.length * lh;
    let ty = y + (h - tot) / 2 + lh * 0.85;
    lines.forEach((line) => {
      const s = String(line ?? "");
      if (align === "center") doc.text(s, x + w / 2, ty, { align: "center" });
      else if (align === "right")
        doc.text(s, x + w - 1.5, ty, { align: "right" });
      else doc.text(s, x + 2.5, ty);
      ty += lh;
    });
  };

  let Y = ML + rTopSpacer;

  // =========================================================================
  // HEADER BLOCK
  // =========================================================================
  fr(xB, Y, wBI, hHdr, [255, 255, 255]);
  doc.setDrawColor(80, 80, 80);
  doc.setLineWidth(0.6);
  doc.rect(xB, Y, wBI, hHdr, "S");
  fr(xB, Y, wBC, hHdr, [255, 255, 255]);
  doc.setDrawColor(180, 180, 180);
  doc.setLineWidth(0.2);
  doc.line(xD, Y, xD, Y + hHdr);

  if (logoInfo) {
    const lx = xB + 2;
    const ly = Y + hR1 + 2;
    const lmW = wBC - 4;
    const lmH = hR2 + hR3 + hR4 - 4;
    const asp = logoInfo.w / logoInfo.h;
    let iw = lmW * 0.55;
    let ih = iw / asp;
    if (ih > lmH * 0.9) {
      ih = lmH * 0.9;
      iw = ih * asp;
    }
    const logoX = lx + (lmW - iw) + 3;
    const logoY = ly + (lmH - ih) / 2;
    doc.addImage(
      logoInfo.dataUrl,
      "PNG",
      logoX,
      logoY,
      iw,
      ih,
      undefined,
      "FAST",
    );
  } else {
    ct("LOGO", xB, Y + hR1, wBC, hR2 + hR3 + hR4, true, 10, [180, 180, 180]);
  }

  ct(
    "Insta ICT Solutions Pvt. Ltd.",
    xD + 2,
    Y + hR1,
    wDI - 4,
    hR2,
    true,
    13,
    [26, 60, 110],
    "left",
  );
  ct(
    "201 - 202, Imperial Plaza, Jijai Nagar, Kothrud, Pune - 411 038.",
    xD + 2,
    Y + hR1 + hR2,
    wDI - 4,
    hR3,
    false,
    8,
    [50, 50, 50],
    "left",
  );
  ct(
    "Website: www.instagrp.com",
    xD + 2,
    Y + hR1 + hR2 + hR3,
    wDI - 4,
    hR4,
    false,
    8,
    [5, 99, 193],
    "left",
  );
  Y += hHdr;

  // =========================================================================
  // PAYSLIP BANNER
  // =========================================================================
  cell(xB, Y, wBI, rBan, [255, 255, 255], "medium");
  ct(`Payslip: ${d.forMonth}`, xB, Y, wBI, rBan, true, 13, [0, 0, 0]);
  Y += rBan;

  // =========================================================================
  // EMPLOYEE INFO ROWS
  // =========================================================================
  const empData = [
    ["Employee Id", d.employeeId, "Name", d.name],
    ["Joining Date", d.joiningDate, "Current Location", d.currentLocation],
    ["P Days", d.pDays, "Project", d.project],
    ["A Days", d.aDays, "Designation", d.designation],
    ["Month Days", d.monthDays, "Grade", d.grade],
    ["EPF No", d.epfNo, "ESIC No", d.esicNo],
    ["UAN No", d.uanNo, "Aadhar No", d.aadharNo],
    ["PAN No", d.panNo, "For Month", d.forMonth],
    ["Bank Name", d.bankName, "Bank A/c No", d.bankAccountNo],
  ];
  empData.forEach(([l1, v1, l2, v2], i) => {
    const bg = i === 0 ? cHeader : [255, 255, 255];
    cell(xB, Y, wB, rEmp, bg, "thin");
    ct(l1, xB, Y, wB, rEmp, true, 9, [0, 0, 0], "center");
    cell(xC, Y, wCD, rEmp, bg, "thin");
    ct(String(v1 ?? ""), xC, Y, wCD, rEmp, false, 9, [30, 30, 30], "left");
    cell(xE, Y, wEF, rEmp, bg, "thin");
    ct(l2, xE, Y, wEF, rEmp, true, 9, [0, 0, 0], "center");
    cell(xG, Y, wG + wHI, rEmp, bg, "thin");
    ct(String(v2 ?? ""), xG, Y, wG + wHI, rEmp, false, 9, [30, 30, 30], "left");
    Y += rEmp;
  });

  // =========================================================================
  // TABLE COLUMN HEADERS
  // =========================================================================
  cell(xB, Y, wB, rTbl, cHeader, "medium");
  ct("Earning Head", xB, Y, wB, rTbl, true, 9, [0, 0, 0]);
  cell(xC, Y, wC, rTbl, cHeader, "medium");
  ct("Gross Salary", xC, Y, wC, rTbl, true, 9, [0, 0, 0]);
  cell(xD, Y, wD, rTbl, cHeader, "medium");
  ct("Gross Salary (d)", xD, Y, wD, rTbl, true, 9, [0, 0, 0]);
  cell(xE, Y, wEFG, rTbl, cHeader, "medium");
  ct("Deduction Head", xE, Y, wEFG, rTbl, true, 9, [0, 0, 0]);
  cell(xH, Y, wHI, rTbl, cHeader, "medium");
  ct("Amount", xH, Y, wHI, rTbl, true, 9, [0, 0, 0]);
  Y += rTbl;

  // =========================================================================
  // DATA ROWS
  // =========================================================================
  const earnRows = [
    ["Basic", d.basic, d.basicD],
    ["HRA", d.hra, d.hraD],
    ["Organization Allowance", d.organisationAllowance, d.oaD],
  ];
  const dedRows = [
    ["PF (Employee + Employer)", d.pfDeduction],
    ["PT", d.pt],
    ["Other", d.otherDeduction],
  ];
  for (let i = 0; i < 3; i++) {
    const h = datRowH[i];
    const [eL, eG, eGd] = earnRows[i];
    const [dL, dA] = dedRows[i];
    cell(xB, Y, wB, h, [255, 255, 255], "thin");
    ct(eL, xB, Y, wB, h, false, 9, [0, 0, 0], "left");
    cell(xC, Y, wC, h, [255, 255, 255], "thin");
    ct(inr(eG), xC, Y, wC, h, false, 9, [0, 0, 0], "right");
    cell(xD, Y, wD, h, [255, 255, 255], "thin");
    ct(inr(eGd), xD, Y, wD, h, false, 9, [0, 0, 0], "right");
    cell(xE, Y, wEFG, h, [255, 255, 255], "thin");
    ct(dL, xE, Y, wEFG, h, false, 9, [0, 0, 0], "left");
    cell(xH, Y, wHI, h, [255, 255, 255], "thin");
    ct(inr(dA), xH, Y, wHI, h, false, 9, [0, 0, 0], "right");
    Y += h;
  }

  // =========================================================================
  // Total Earning / Total Deduction
  // =========================================================================
  cell(xB, Y, wB, rTot, [255, 255, 255], "thin");
  ct("Total Earning", xB, Y, wB, rTot, true, 9, [0, 0, 0], "left");
  cell(xC, Y, wC, rTot, [255, 255, 255], "thin");
  ct(inr(d.grossSalary), xC, Y, wC, rTot, true, 9, [0, 0, 0], "right");
  cell(xD, Y, wD, rTot, [255, 255, 255], "thin");
  ct(inr(d.grossSalaryD), xD, Y, wD, rTot, true, 9, [0, 0, 0], "right");
  cell(xE, Y, wEFG, rTot, [255, 255, 255], "thin");
  ct("Total Deduction", xE, Y, wEFG, rTot, false, 9, [0, 0, 0], "left");
  cell(xH, Y, wHI, rTot, [255, 255, 255], "thin");
  ct(inr(d.totalDeduction), xH, Y, wHI, rTot, false, 9, [0, 0, 0], "right");
  Y += rTot;

  // =========================================================================
  // Performance Pay / Variable pay + Net Salary (black bg → white text)
  // =========================================================================
  cell(xB, Y, wB, rPerf, [255, 255, 255], "thin");
  ct(
    "Performance Pay / Variable pay",
    xB,
    Y,
    wB,
    rPerf,
    false,
    8,
    [0, 0, 0],
    "center",
  );
  cell(xC, Y, wC, rPerf, [255, 255, 255], "thin");
  ct(inr(d.performancePay), xC, Y, wC, rPerf, false, 9, [0, 0, 0], "right");
  cell(xD, Y, wD, rPerf, [255, 255, 255], "thin");
  ct(inr(d.perfD), xD, Y, wD, rPerf, false, 9, [0, 0, 0], "right");
  cell(xE, Y, wEFG, rPerf, [255, 255, 255], "medium");
  ct("Net Salary", xE, Y, wEFG, rPerf, true, 9, [0, 0, 0], "left");
  cell(xH, Y, wHI, rPerf, [255, 255, 255], "medium");
  ct(inr(d.netSalary), xH, Y, wHI, rPerf, true, 9, [0, 0, 0], "right");
  Y += rPerf;

  // =========================================================================
  // Total Earning Potential + Performance Pay / Variable pay
  // =========================================================================
  cell(xB, Y, wB, rPot, [255, 255, 255], "thin");
  ctMulti(["Total Earning", "Potential"], xB, Y, wB, rPot, true, 9, [0, 0, 0]);
  cell(xC, Y, wC, rPot, [255, 255, 255], "thin");
  ct(inr(d.totalEarning), xC, Y, wC, rPot, true, 9, [0, 0, 0], "right");
  cell(xD, Y, wD, rPot, [255, 255, 255], "thin");
  ct(inr(d.totalEarningD), xD, Y, wD, rPot, true, 9, [0, 0, 0], "right");
  cell(xE, Y, wEFG, rPot, [255, 255, 255], "thin");
  ct(
    "Performance Pay / Variable pay",
    xE,
    Y,
    wEFG,
    rPot,
    false,
    8,
    [0, 0, 0],
    "center",
  );
  cell(xH, Y, wHI, rPot, [255, 255, 255], "thin");
  ct(inr(d.perfD), xH, Y, wHI, rPot, false, 9, [0, 0, 0], "right");
  Y += rPot;

  // =========================================================================
  // Total Earning (dark slate bg → white text)
  // =========================================================================
  cell(xB, Y, wB, rDark, [255, 255, 255], "thin");
  cell(xC, Y, wC, rDark, [255, 255, 255], "thin");
  cell(xD, Y, wD, rDark, [255, 255, 255], "thin");
  cell(xE, Y, wEFG, rDark, cTotEarn, "medium");
  ct("Total Earning", xE, Y, wEFG, rDark, true, 9, [0, 0, 0], "left");
  cell(xH, Y, wHI, rDark, cTotEarn, "medium");
  ct(inr(d.totalWithPerf), xH, Y, wHI, rDark, true, 9, [0, 0, 0], "right");
  Y += rDark;

  // =========================================================================
  // Blank spacer
  // =========================================================================
  fr(xB, Y, wBI, rSpc, [255, 255, 255]);
  doc.setDrawColor(150, 150, 150);
  doc.setLineWidth(0.5);
  doc.line(xB, Y, xB, Y + rSpc); // left border
  doc.line(xB + wBI, Y, xB + wBI, Y + rSpc); // right border
  Y += rSpc;

  // =========================================================================
  // Footer
  // =========================================================================
  cell(xB, Y, wBI, rFtr, cFooter, "medium");
  ct(
    '"This is computer generated payslip"',
    xB,
    Y,
    wBI,
    rFtr,
    true,
    9,
    [0, 0, 0],
  );

  doc.save(
    `Payslip_${d.name.replace(/\s+/g, "_")}_${d.forMonth?.replace(/\s+/g, "_") || "payslip"}.pdf`,
  );
};

/* =============================================================================
   EXCEL PAYSLIP — exactly matches Salary_slip_format.xlsx layout
   ============================================================================= */
export const downloadPayslipExcel = async (employee) => {
  if (!window.ExcelJS) {
    await new Promise((resolve, reject) => {
      const s = document.createElement("script");
      s.src =
        "https://cdnjs.cloudflare.com/ajax/libs/exceljs/4.4.0/exceljs.min.js";
      s.onload = resolve;
      s.onerror = reject;
      document.head.appendChild(s);
    });
  }

  const d = _buildData(employee);
  const wb = new window.ExcelJS.Workbook();
  const ws = wb.addWorksheet("Sheet");

  // Hide all sheet gridlines — only payslip borders will be visible
  ws.views = [{ showGridLines: false }];

  // ── Column widths ─────────────────────────────────────────────────────────
  ws.columns = [
    { width: 4.5546875 }, // A – spacer
    { width: 23.21875 }, // B
    { width: 16.44140625 }, // C
    { width: 20.77734375 }, // D
    { width: 15.0 }, // E
    { width: 9.44140625 }, // F
    { width: 17.44140625 }, // G
    { width: 5.44140625 }, // H
    { width: 18.44140625 }, // I
  ];

  // ── Row heights ───────────────────────────────────────────────────────────
  ws.getRow(1).height = 28.5;
  ws.getRow(2).height = 28.5;
  ws.getRow(3).height = 28.5;
  ws.getRow(4).height = 28.5;
  ws.getRow(5).height = 44.25;
  ws.getRow(6).height = 38.25;
  for (let r = 7; r <= 16; r++) ws.getRow(r).height = 28.5;
  ws.getRow(17).height = 28.5;
  ws.getRow(18).height = 28.5;
  ws.getRow(19).height = 32.25;
  ws.getRow(20).height = 28.5;
  ws.getRow(21).height = 31.2;
  ws.getRow(22).height = 45.0;
  ws.getRow(23).height = 28.5;
  ws.getRow(24).height = 28.5;
  ws.getRow(25).height = 28.5;

  // ── Style helpers ─────────────────────────────────────────────────────────
  const thin = { style: "thin", color: { argb: "FF999999" } };
  const medium = { style: "medium", color: { argb: "FF555555" } };
  const hair = { style: "hair", color: { argb: "FFEEEEEE" } };
  const thinB = { top: thin, left: thin, bottom: thin, right: thin };
  const medB = { top: medium, left: medium, bottom: medium, right: medium };

  const solidFill = (argb) => ({
    type: "pattern",
    pattern: "solid",
    fgColor: { argb },
  });

  // ── Exact colours read from xlsx theme fills ──────────────────────────────

  const fillWhite = solidFill("FFFFFFFF");
  const fillHdrRow = solidFill("FFACB9CA"); // #ACB9CA

  const fillNetSal = solidFill("FFACB9CA"); // #ACB9CA

  const fillTotEarn = solidFill("FFACB9CA"); // #ACB9CA

  const fillFooter = solidFill("FFACB9CA"); // #ACB9CA

  const centerM = { horizontal: "center", vertical: "middle", wrapText: true };
  const leftM = { horizontal: "left", vertical: "middle", wrapText: true };
  const rightM = { horizontal: "right", vertical: "middle" };
  const numFmt = "#,##0.00";

  const set = (coord, value, opts = {}) => {
    const c = ws.getCell(coord);
    if (value !== undefined && value !== null) c.value = value;
    if (opts.font) c.font = opts.font;
    if (opts.fill) c.fill = opts.fill;
    if (opts.alignment) c.alignment = opts.alignment;
    if (opts.border) c.border = opts.border;
    if (opts.numFmt) c.numFmt = opts.numFmt;
    return c;
  };

  // Font definitions
  const fNorm = { size: 12, name: "Calibri Light" };
  const fBold = { bold: true, size: 12, name: "Calibri Light" };
  const fBold14 = { bold: true, size: 14, name: "Calibri Light" };
  const fNorm14 = { size: 14, name: "Calibri Light" };
  // White bold — for dark/black backgrounds (Net Salary, Total Earning)
  const fWhiteB = {
    bold: true,
    size: 12,
    name: "Calibri Light",
    color: { argb: "FFFFFFFF" },
  };
  const fBlue14 = {
    bold: true,
    size: 14,
    name: "Calibri Light",
    color: { argb: "FF1A3C6E" },
  };
  const fWebsite = {
    size: 14,
    name: "Calibri Light",
    color: { argb: "FF0563C1" },
  };

  // ==========================================================================
  // HEADER — Rows 2–5
  // ==========================================================================
  const logoInfo = await loadImageBase64("/assets/Insta-logo1.png");
  if (logoInfo) {
    const logoBase64 = logoInfo.dataUrl.split(",")[1];
    const imageId = wb.addImage({ base64: logoBase64, extension: "png" });
    ws.addImage(imageId, {
      tl: { col: 1.55, row: 2.2 },
      br: { col: 2.15, row: 4.8 },
      editAs: "oneCell",
    });
  }

  const headerColsRight = ["D", "E", "F", "G", "H", "I"];
  for (let r = 2; r <= 5; r++) {
    const cellB = ws.getCell(`B${r}`);
    cellB.fill = fillWhite;
    cellB.border = {
      top: r === 2 ? medium : { style: "thin", color: { argb: "FFFFFFFF" } },
      bottom: r === 5 ? medium : { style: "thin", color: { argb: "FFFFFFFF" } },
      left: medium,
      right: { style: "thin", color: { argb: "FFFFFFFF" } },
    };
    const cellC = ws.getCell(`C${r}`);
    cellC.fill = fillWhite;
    cellC.border = {
      top: r === 2 ? medium : { style: "thin", color: { argb: "FFFFFFFF" } },
      bottom: r === 5 ? medium : { style: "thin", color: { argb: "FFFFFFFF" } },
      left: { style: "thin", color: { argb: "FFFFFFFF" } },
      right: hair,
    };
    for (const c of headerColsRight) {
      ws.getCell(`${c}${r}`).fill = fillWhite;
      ws.getCell(`${c}${r}`).border = {
        top: r === 2 ? medium : hair,
        bottom: r === 5 ? medium : hair,
        left: hair,
        right: c === "I" ? medium : hair,
      };
    }
  }

  ws.mergeCells("D3:I3");
  set("D3", "Insta ICT Solutions Pvt. Ltd.", {
    font: fBlue14,
    fill: fillWhite,
    alignment: { horizontal: "left", vertical: "middle" },
    border: { top: hair, bottom: hair, left: hair, right: medium },
  });

  ws.mergeCells("D4:I4");
  set(
    "D4",
    "201 - 202, Imperial Plaza, Jijai Nagar, Kothrud, Pune - 411 038.",
    {
      font: fNorm14,
      fill: fillWhite,
      alignment: { horizontal: "left", vertical: "middle" },
      border: { top: hair, bottom: hair, left: hair, right: medium },
    },
  );

  ws.mergeCells("D5:I5");
  set("D5", "\nWebsite: www.instagrp.com.", {
    font: fWebsite,
    fill: fillWhite,
    alignment: { horizontal: "left", vertical: "top", wrapText: true },
    border: { top: hair, bottom: medium, left: hair, right: medium },
  });

  // ==========================================================================
  // ROW 6: Payslip banner
  // ==========================================================================
  ws.mergeCells("B6:I6");
  set("B6", `Payslip: ${d.forMonth}`, {
    font: fBold14,
    fill: fillWhite,
    alignment: centerM,
    border: medB,
  });

  // ==========================================================================
  // ROWS 7–15: Employee info (9 rows)
  // ==========================================================================
  const empFields = [
    ["Employee Id", d.employeeId, "Name", d.name],
    ["Joining Date", d.joiningDate, "Current Location", d.currentLocation],
    ["P Days", d.pDays, "Project", d.project],
    ["A Days", d.aDays, "Designation", d.designation],
    ["Month Days", d.monthDays, "Grade", d.grade],
    ["EPF No", d.epfNo, "ESIC No", d.esicNo],
    ["UAN No", d.uanNo, "Aadhar No", d.aadharNo],
    ["PAN No", d.panNo, "For Month", d.forMonth],
    ["Bank Name", d.bankName, "Bank A/c No", d.bankAccountNo],
  ];
  empFields.forEach(([l1, v1, l2, v2], i) => {
    const r = 7 + i;
    const bg = i === 0 ? fillHdrRow : fillWhite;
    set(`B${r}`, l1, {
      font: fBold,
      fill: bg,
      alignment: centerM,
      border: thinB,
    });
    ws.mergeCells(`C${r}:D${r}`);
    set(`C${r}`, v1 ?? "", {
      font: fNorm,
      fill: bg,
      alignment: leftM,
      border: thinB,
    });
    ws.mergeCells(`E${r}:F${r}`);
    set(`E${r}`, l2, {
      font: fBold,
      fill: bg,
      alignment: centerM,
      border: thinB,
    });
    ws.mergeCells(`G${r}:I${r}`);
    set(`G${r}`, v2 ?? "", {
      font: fNorm,
      fill: bg,
      alignment: leftM,
      border: thinB,
    });
  });

  // ==========================================================================
  // ROW 16: Table column headers
  // ==========================================================================
  set("B16", "Earning Head", {
    font: fBold,
    fill: fillHdrRow,
    alignment: centerM,
    border: medB,
  });
  set("C16", "Gross Salary", {
    font: fBold,
    fill: fillHdrRow,
    alignment: centerM,
    border: medB,
  });
  set("D16", "Gross Salary (d)", {
    font: fBold,
    fill: fillHdrRow,
    alignment: centerM,
    border: medB,
  });
  ws.mergeCells("E16:G16");
  set("E16", "Deduction Head", {
    font: fBold,
    fill: fillHdrRow,
    alignment: centerM,
    border: medB,
  });
  ws.mergeCells("H16:I16");
  set("H16", "Amount", {
    font: fBold,
    fill: fillHdrRow,
    alignment: centerM,
    border: medB,
  });

  // ==========================================================================
  // ROWS 17–19: Earning + Deduction data
  // ==========================================================================
  const earningData = [
    ["Basic", d.basic],
    ["HRA", d.hra],
    ["Organization Allowance", d.organisationAllowance],
  ];
  const deductionData = [
    ["PF (Employee + Employer)", d.pfDeduction],
    ["PT", d.pt],
    ["Other", d.otherDeduction],
  ];
  for (let i = 0; i < 3; i++) {
    const r = 17 + i;
    const [eLabel, eGross] = earningData[i];
    const [dLabel, dAmt] = deductionData[i];
    set(`B${r}`, eLabel || null, {
      font: fNorm,
      fill: fillWhite,
      alignment: leftM,
      border: thinB,
    });
    set(`C${r}`, eGross || null, {
      font: fNorm,
      fill: fillWhite,
      alignment: rightM,
      border: thinB,
      numFmt,
    });
    set(
      `D${r}`,
      eGross ? { formula: `=C${r}/${d.monthDays}*${d.pDays}` } : null,
      {
        font: fNorm,
        fill: fillWhite,
        alignment: rightM,
        border: thinB,
        numFmt,
      },
    );
    ws.mergeCells(`E${r}:G${r}`);
    set(`E${r}`, dLabel || null, {
      font: fNorm,
      fill: fillWhite,
      alignment: leftM,
      border: thinB,
    });
    ws.mergeCells(`H${r}:I${r}`);
    set(`H${r}`, dAmt || null, {
      font: fNorm,
      fill: fillWhite,
      alignment: rightM,
      border: thinB,
      numFmt,
    });
  }

  // ==========================================================================
  // ROW 20: Total Earning / Total Deduction
  // ==========================================================================
  set("B20", "Total Earning", {
    font: fBold,
    fill: fillWhite,
    alignment: leftM,
    border: thinB,
  });
  set(
    "C20",
    { formula: "=C17+C18+C19" },
    { font: fBold, fill: fillWhite, alignment: rightM, border: thinB, numFmt },
  );
  set(
    "D20",
    { formula: "=D17+D18+D19" },
    { font: fBold, fill: fillWhite, alignment: rightM, border: thinB, numFmt },
  );
  ws.mergeCells("E20:G20");
  set("E20", "Total Deduction", {
    font: fNorm,
    fill: fillWhite,
    alignment: leftM,
    border: thinB,
  });
  ws.mergeCells("H20:I20");
  set(
    "H20",
    { formula: "=H17+H18+H19" },
    { font: fNorm, fill: fillWhite, alignment: rightM, border: thinB, numFmt },
  );

  // ==========================================================================
  // ROW 21: Performance Pay / Variable pay + Net Salary
  //         Net Salary → black bg (#000000), white bold text
  // ==========================================================================
  set("B21", "Performance Pay / Variable pay", {
    font: fNorm,
    fill: fillWhite,
    alignment: centerM,
    border: thinB,
  });
  set("C21", d.performancePay || null, {
    font: fNorm,
    fill: fillWhite,
    alignment: rightM,
    border: thinB,
    numFmt,
  });
  set(
    "D21",
    { formula: `=C21/${d.monthDays}*${d.pDays}` },
    { font: fNorm, fill: fillWhite, alignment: rightM, border: thinB, numFmt },
  );
  ws.mergeCells("E21:G21");
  set("E21", "Net Salary", {
    font: fBold,
    fill: fillWhite,
    alignment: centerM,
    border: medB,
  });
  ws.mergeCells("H21:I21");
  set(
    "H21",
    { formula: "=D20-H20" },
    { font: fBold, fill: fillWhite, alignment: rightM, border: medB, numFmt },
  );

  // ==========================================================================
  // ROW 22: Total Earning Potential + Performance Pay / Variable pay
  // ==========================================================================
  set("B22", "Total Earning\n Potential", {
    font: fBold,
    fill: fillWhite,
    alignment: centerM,
    border: thinB,
  });
  set(
    "C22",
    { formula: "=C20+C21" },
    { font: fBold, fill: fillWhite, alignment: rightM, border: thinB, numFmt },
  );
  set(
    "D22",
    { formula: "=D20+D21" },
    { font: fBold, fill: fillWhite, alignment: rightM, border: thinB, numFmt },
  );
  ws.mergeCells("E22:G22");
  set("E22", "Performance Pay / Variable pay", {
    font: fNorm,
    fill: fillWhite,
    alignment: centerM,
    border: thinB,
  });
  ws.mergeCells("H22:I22");
  set(
    "H22",
    { formula: "=D21" },
    { font: fNorm, fill: fillWhite, alignment: rightM, border: thinB, numFmt },
  );

  // ==========================================================================
  // ROW 23: Total Earning (dark slate bg #44546A, white bold text)
  // ==========================================================================
  ["B", "C", "D"].forEach((c) =>
    set(`${c}23`, null, { fill: fillWhite, border: thinB }),
  );
  ws.mergeCells("E23:G23");
  set("E23", "Total Earning", {
    font: fBold,
    fill: fillTotEarn,
    alignment: leftM,
    border: medB,
  });
  ws.mergeCells("H23:I23");
  set(
    "H23",
    { formula: "=H21+H22" },
    { font: fBold, fill: fillTotEarn, alignment: rightM, border: medB, numFmt },
  );

  // ==========================================================================
  // ROW 24: Blank spacer
  // ==========================================================================
  // ROW 24 spacer — left and right borders only, no top/bottom
  ["B", "C", "D", "E", "F", "G", "H", "I"].forEach((c) => {
    const b = {};
    if (c === "B") b.left = medium;
    if (c === "I") b.right = medium;
    set(`${c}24`, null, { fill: fillWhite, border: b });
  });

  // ==========================================================================
  // ROW 25: Footer
  // ==========================================================================
  ws.mergeCells("B25:I25");
  set("B25", '"This is computer generated payslip"', {
    font: fBold,
    fill: fillFooter,
    alignment: centerM,
    border: medB,
  });

  // Download
  const buffer = await wb.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `Payslip_${d.name || "Employee"}_${d.forMonth?.replace(/\s+/g, "_") || "payslip"}.xlsx`;
  a.click();
  URL.revokeObjectURL(url);
};
