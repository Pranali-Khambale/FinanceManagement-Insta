// src/Ui/Payroll/PayslipGenerator.js
// Supports two download formats:
//   1. PDF  (.pdf)  — downloadPayslipPDF(employee)
//   2. Excel (.xlsx) — downloadPayslipExcel(employee)

/* ─── shared data builder ─────────────────────────────────────────────────── */
function _buildData(employee) {
  const n = (val) => {
    const v = Number(val);
    return isFinite(v) ? v : 0;
  };

  // ── Format date: "2022-05-29T18:30:00.000Z" → "29-05-2022" ───────────────
  const fmtDate = (val) => {
    if (!val) return "";
    const d = new Date(val);
    if (isNaN(d.getTime())) return String(val);
    const dd = String(d.getUTCDate()).padStart(2, "0");
    const mm = String(d.getUTCMonth() + 1).padStart(2, "0");
    const yyyy = d.getUTCFullYear();
    return `${dd}-${mm}-${yyyy}`;
  };

  const basic = n(employee.basic);
  const hra = n(employee.hra);
  const organisationAllowance = n(employee.organisationAllowance);
  const performancePay = n(employee.performancePay);
  const monthDays = n(employee.monthDays) || 30;
  const pDays = employee.pDays != null ? n(employee.pDays) : monthDays;
  const aDays = n(employee.aDays);

  // PF — employee 12%, employer 13%
  const pfEmp =
    employee.pfDeduction != null
      ? n(employee.pfDeduction)
      : Math.round(basic * 0.12);
  const pfCo =
    employee.employerPfContribution != null
      ? n(employee.employerPfContribution)
      : Math.round(basic * 0.13);

  // PT
  const isFemale = /female|woman|f/i.test(employee.gender || "");
  const grossFull = basic + hra + organisationAllowance;
  let pt;
  if (employee.pt != null) {
    pt = n(employee.pt);
  } else if (isFemale && grossFull <= 25000) {
    pt = 0;
  } else {
    pt = /february/i.test(employee.forMonth || "") ? 300 : 200;
  }

  const gratuity =
    employee.gratuity != null
      ? n(employee.gratuity)
      : Math.round(basic * 0.0481 * 100) / 100;

  const tds = n(employee.tds);
  const otherDeduction = n(employee.otherDeduction);
  const advDed = n(employee.advanceDeduction);
  const advAdd = n(employee.advanceAddition);

  const ratio = monthDays > 0 ? pDays / monthDays : 1;
  const grossSalary = basic + hra + organisationAllowance;
  const grossSalaryD = grossSalary * ratio;
  const basicD = basic * ratio;
  const hraD = hra * ratio;
  const oaD = organisationAllowance * ratio;
  const perfD = performancePay * ratio;

  // totalDeduction = PF(emp+co) + PT + other
  const totalDeduction = pfEmp + pfCo + pt + otherDeduction;

  // netSalary = grossSalaryD − totalDeduction
  const netSalary = grossSalaryD - totalDeduction;

  // totalWithPerf = netSalary + perfD
  const totalWithPerf = netSalary + perfD;
  const totalEarning = grossSalary + performancePay;
  const totalEarningD = grossSalaryD + perfD;

  return {
    name: employee.name || "",
    employeeId: employee.employeeId || "",
    joiningDate: fmtDate(employee.joiningDate),
    currentLocation: employee.currentLocation || employee.circle || "",
    pDays,
    aDays,
    monthDays,
    project: employee.project || "",
    designation: employee.designation || "",
    grade: employee.grade || "",
    epfNo: employee.epfNo || "0",
    esicNo: employee.esicNo || "0",
    uanNo: employee.uanNo || "",
    aadharNo: employee.aadharNo || "",
    panNo: employee.panNo || "",
    forMonth: employee.forMonth || "",
    bankName: employee.bankName || "",
    bankAccountNo: employee.bankAccountNo || employee.accountNumber || "",
    ifscCode: employee.ifscCode || "",
    basic,
    hra,
    organisationAllowance,
    performancePay,
    pfEmp,
    pfCo,
    pt,
    gratuity,
    tds,
    otherDeduction,
    advDed,
    advAdd,
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
    gender: employee.gender || "",
  };
}

/* ─── INR formatter ──────────────────────────────────────────────────────────── */
const inr = (num) =>
  "Rs. " +
  Number(num || 0).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

/* ─── Load image as base64 data URL ─────────────────────────────────────────── */
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
   PDF PAYSLIP — pixel-perfect match to screenshot
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

  // ── Page & content area ───────────────────────────────────────────────────
  const PAGE_W = 210;
  const MARGIN_L = 10;
  const MARGIN_R = 10;
  const CONTENT_W = PAGE_W - MARGIN_L - MARGIN_R; // 190 mm

  // ── Column layout (5 logical zones, total = 190 mm) ───────────────────────
  //
  //  Zone  | Salary table role          | Emp-info role
  //  ──────┼────────────────────────────┼──────────────────────────
  //  A     | Earning Head               | Label-left
  //  B     | Gross Salary               | Value-left  ─┐ merged B+C
  //  C     | Gross Salary (d)           |              ─┘
  //  D     | Deduction Head             | Label-right ─┐ merged D+E
  //  E     |  ↑ continued               |              ─┘
  //  F     | Amount                     | Value-right
  //
  //  Proportions matching the screenshot exactly (total 190):
  //   A = 42 mm  (~22%)
  //   B = 30 mm  (~16%)
  //   C = 30 mm  (~16%)
  //   D = 38 mm  (~20%)
  //   E = 20 mm  (~10%)
  //   F = 30 mm  (~16%)

  const wA = 42;
  const wB = 30;
  const wC = 30;
  const wD = 38;
  const wE = 20;
  const wF = 30;
  // Total = 190 mm ✓

  // Derived spans
  const wBC = wB + wC; // emp value-left / (unused in salary table)
  const wDE = wD + wE; // Deduction Head / emp label-right
  const wAll = wA + wB + wC + wD + wE + wF; // 190 mm

  const xA = MARGIN_L;
  const xB = xA + wA;
  const xC = xB + wB;
  const xD = xC + wC;
  const xE = xD + wD;
  const xF = xE + wE;

  // ── Row heights (mm) ─────────────────────────────────────────────────────
  const H_HDR_PAD = 8.0; // inner top padding in header block
  const H_HDR_NAME = 8.5; // company name
  const H_HDR_ADDR = 7.5; // address
  const H_HDR_WEB = 12.0; // website line
  const H_HDR = H_HDR_PAD + H_HDR_NAME + H_HDR_ADDR + H_HDR_WEB; // 36 mm

  const H_BANNER = 11.0; // "Payslip: Month"
  const H_EMP = 8.5; // each employee info row
  const H_THDR = 9.0; // table header row
  const H_D1 = 8.5; // Basic
  const H_D2 = 8.5; // HRA
  const H_D3 = 9.5; // Organization Allowance
  const H_TOT = 8.5; // Total Earning / Total Deduction
  const H_PERF = 9.5; // Perf Pay / Net Salary
  const H_POT = 13.5; // Total Earning Potential
  const H_DARK = 8.5; // Total Earning (shaded)
  const H_SPC = 6.0; // spacer
  const H_FTR = 8.5; // footer

  // ── Colors ────────────────────────────────────────────────────────────────
  const cHdr = [172, 185, 202];
  const cWhite = [255, 255, 255];
  const cThin = [170, 170, 170];
  const cMed = [85, 85, 85];
  const cBlue = [26, 60, 110];
  const cLink = [5, 99, 193];
  const cBlack = [0, 0, 0];
  const cGray = [80, 80, 80];
  const cDark = [40, 40, 40];

  // ── Drawing primitives ────────────────────────────────────────────────────
  const fillR = (x, y, w, h, rgb) => {
    doc.setFillColor(...rgb);
    doc.rect(x, y, w, h, "F");
  };
  const boxR = (x, y, w, h, rgb, lw) => {
    doc.setDrawColor(...rgb);
    doc.setLineWidth(lw);
    doc.rect(x, y, w, h, "S");
  };
  const vLine = (x, y1, y2, rgb, lw) => {
    doc.setDrawColor(...rgb);
    doc.setLineWidth(lw);
    doc.line(x, y1, x, y2);
  };

  // cell = fill + border
  const cell = (x, y, w, h, bg, med = false) => {
    fillR(x, y, w, h, bg);
    boxR(x, y, w, h, med ? cMed : cThin, med ? 0.45 : 0.15);
  };

  // text inside a box  (auto-truncates via jsPDF)
  const txt = (s, x, y, w, h, bold, sz, col, align = "left") => {
    if (s === null || s === undefined) return;
    doc.setFont("helvetica", bold ? "bold" : "normal");
    doc.setFontSize(sz);
    doc.setTextColor(...col);
    const ty = y + h * 0.63;
    const str = String(s);
    if (align === "center") doc.text(str, x + w / 2, ty, { align: "center" });
    else if (align === "right")
      doc.text(str, x + w - 1.8, ty, { align: "right" });
    else doc.text(str, x + 2.2, ty);
  };

  // multiline text, vertically centred
  const mtxt = (lines, x, y, w, h, bold, sz, col, align = "left") => {
    doc.setFont("helvetica", bold ? "bold" : "normal");
    doc.setFontSize(sz);
    doc.setTextColor(...col);
    const lh = sz * 0.43;
    const tot = (lines.length - 1) * lh;
    let ty = y + (h - tot) / 2;
    lines.forEach((line) => {
      const s = String(line ?? "");
      if (align === "center") doc.text(s, x + w / 2, ty, { align: "center" });
      else if (align === "right")
        doc.text(s, x + w - 1.8, ty, { align: "right" });
      else doc.text(s, x + 2.2, ty);
      ty += lh;
    });
  };

  const inrTxt = (val, x, y, w, h, bold, sz) =>
    txt(inr(val), x, y, w, h, bold, sz, cDark, "center");

  // ── Start drawing ─────────────────────────────────────────────────────────
  let Y = 10;

  // ==========================================================================
  // HEADER BLOCK
  // White bg, medium outer border, thin vertical divider at xD
  // Left (A+B+C) = logo,  Right (D+E+F) = company info
  // ==========================================================================
  fillR(xA, Y, wAll, H_HDR, cWhite);
  boxR(xA, Y, wAll, H_HDR, cMed, 0.5);
  vLine(xD, Y, Y + H_HDR, cThin, 0.15);

  if (logoInfo) {
    const zone = wA + wBC; // logo zone width (A+B+C = 42+30+30 = 102)
    const maxW = zone - 6;
    const maxH = H_HDR - 6;
    const asp = logoInfo.w / logoInfo.h;
    let iw = maxW * 0.8,
      ih = iw / asp;
    if (ih > maxH * 0.9) {
      ih = maxH * 0.9;
      iw = ih * asp;
    }
    doc.addImage(
      logoInfo.dataUrl,
      "PNG",
      xA + (zone - iw) / 2,
      Y + (H_HDR - ih) / 2,
      iw,
      ih,
      undefined,
      "FAST",
    );
  } else {
    txt("LOGO", xA, Y, wA + wBC, H_HDR, true, 10, [180, 180, 180], "center");
  }

  const rxOff = xD + 3;
  const rxW = wDE + wF - 5;
  txt(
    "Insta ICT Solutions Pvt. Ltd.",
    rxOff,
    Y + H_HDR_PAD,
    rxW,
    H_HDR_NAME,
    true,
    11,
    cBlue,
    "left",
  );
  txt(
    "201 - 202, Imperial Plaza, Jijai Nagar, Kothrud, Pune - 411 038.",
    rxOff,
    Y + H_HDR_PAD + H_HDR_NAME,
    rxW,
    H_HDR_ADDR,
    false,
    8,
    cGray,
    "left",
  );
  txt(
    "Website: www.instagrp.com",
    rxOff,
    Y + H_HDR_PAD + H_HDR_NAME + H_HDR_ADDR,
    rxW,
    H_HDR_WEB,
    false,
    8,
    cLink,
    "left",
  );

  Y += H_HDR;

  // ==========================================================================
  // BANNER
  // ==========================================================================
  cell(xA, Y, wAll, H_BANNER, cWhite, true);
  txt(
    `Payslip: ${d.forMonth}`,
    xA,
    Y,
    wAll,
    H_BANNER,
    true,
    13,
    cBlack,
    "center",
  );
  Y += H_BANNER;

  // ==========================================================================
  // EMPLOYEE INFO ROWS (9 rows)
  //  A (label-left) | B+C (value-left, merged) | D+E (label-right, merged) | F (value-right)
  // ==========================================================================
  const empRows = [
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

  empRows.forEach(([l1, v1, l2, v2], i) => {
    const bg = i === 0 ? cHdr : cWhite;
    const vBold = i === 0;

    cell(xA, Y, wA, H_EMP, bg);
    txt(l1, xA, Y, wA, H_EMP, true, 8.5, cBlack, "left");

    cell(xB, Y, wBC, H_EMP, bg); // B+C merged
    txt(String(v1 ?? ""), xB, Y, wBC, H_EMP, vBold, 8.5, cDark, "center");

    cell(xD, Y, wDE, H_EMP, bg); // D+E merged
    txt(l2, xD, Y, wDE, H_EMP, true, 8.5, cBlack, "left");

    cell(xF, Y, wF, H_EMP, bg);
    txt(String(v2 ?? ""), xF, Y, wF, H_EMP, vBold, 8.5, cDark, "center");

    Y += H_EMP;
  });

  // ==========================================================================
  // TABLE HEADER ROW
  //  A=Earning Head | B=Gross Salary | C=Gross Salary(d) | D+E=Deduction Head | F=Amount
  // ==========================================================================
  cell(xA, Y, wA, H_THDR, cHdr, true);
  txt("Earning Head", xA, Y, wA, H_THDR, true, 8.5, cBlack, "center");

  cell(xB, Y, wB, H_THDR, cHdr, true);
  txt("Gross Salary", xB, Y, wB, H_THDR, true, 8.5, cBlack, "center");

  cell(xC, Y, wC, H_THDR, cHdr, true);
  txt("Gross Salary (d)", xC, Y, wC, H_THDR, true, 8, cBlack, "center");

  cell(xD, Y, wDE, H_THDR, cHdr, true);
  txt("Deduction Head", xD, Y, wDE, H_THDR, true, 8.5, cBlack, "center");

  cell(xF, Y, wF, H_THDR, cHdr, true);
  txt("Amount", xF, Y, wF, H_THDR, true, 8.5, cBlack, "center");

  Y += H_THDR;

  // ==========================================================================
  // DATA ROWS 1–3
  // ==========================================================================
  const earnRows = [
    ["Basic", d.basic, d.basicD, H_D1],
    ["HRA", d.hra, d.hraD, H_D2],
    ["Organization Allowance", d.organisationAllowance, d.oaD, H_D3],
  ];
  const dedRows = [
    ["PF (Employee + Employer)", d.pfEmp + d.pfCo],
    ["PT", d.pt],
    ["Other", d.otherDeduction],
  ];

  for (let i = 0; i < 3; i++) {
    const [eL, eG, eGd, hRow] = earnRows[i];
    const [dL, dA] = dedRows[i];

    cell(xA, Y, wA, hRow, cWhite);
    txt(eL, xA, Y, wA, hRow, false, 8.5, cBlack, "left");

    cell(xB, Y, wB, hRow, cWhite);
    inrTxt(eG, xB, Y, wB, hRow, false, 8.5);

    cell(xC, Y, wC, hRow, cWhite);
    inrTxt(eGd, xC, Y, wC, hRow, false, 8.5);

    cell(xD, Y, wDE, hRow, cWhite);
    txt(dL, xD, Y, wDE, hRow, false, 8.5, cBlack, "center");

    cell(xF, Y, wF, hRow, cWhite);
    inrTxt(dA, xF, Y, wF, hRow, false, 8.5);

    Y += hRow;
  }

  // ==========================================================================
  // TOTAL EARNING / TOTAL DEDUCTION
  // ==========================================================================
  cell(xA, Y, wA, H_TOT, cWhite);
  txt("Total Earning", xA, Y, wA, H_TOT, true, 8.5, cBlack, "left");

  cell(xB, Y, wB, H_TOT, cWhite);
  inrTxt(d.grossSalary, xB, Y, wB, H_TOT, true, 8.5);

  cell(xC, Y, wC, H_TOT, cWhite);
  inrTxt(d.grossSalaryD, xC, Y, wC, H_TOT, true, 8.5);

  cell(xD, Y, wDE, H_TOT, cWhite);
  txt("Total Deduction", xD, Y, wDE, H_TOT, false, 8.5, cBlack, "center");

  cell(xF, Y, wF, H_TOT, cWhite);
  inrTxt(d.totalDeduction, xF, Y, wF, H_TOT, false, 8.5);

  Y += H_TOT;

  // ==========================================================================
  // PERFORMANCE PAY / NET SALARY (Net Salary = medium border)
  // ==========================================================================
  cell(xA, Y, wA, H_PERF, cWhite);
  mtxt(
    ["Performance Pay /", "Variable pay"],
    xA,
    Y,
    wA,
    H_PERF,
    false,
    7.5,
    cBlack,
    "left",
  );

  cell(xB, Y, wB, H_PERF, cWhite);
  inrTxt(d.performancePay, xB, Y, wB, H_PERF, false, 8.5);

  cell(xC, Y, wC, H_PERF, cWhite);
  inrTxt(d.perfD, xC, Y, wC, H_PERF, false, 8.5);

  cell(xD, Y, wDE, H_PERF, cWhite, true);
  txt("Net Salary", xD, Y, wDE, H_PERF, true, 8.5, cBlack, "left");

  cell(xF, Y, wF, H_PERF, cWhite, true);
  inrTxt(d.netSalary, xF, Y, wF, H_PERF, true, 8.5);

  Y += H_PERF;

  // ==========================================================================
  // TOTAL EARNING POTENTIAL / PERFORMANCE PAY (Variable)
  // ==========================================================================
  cell(xA, Y, wA, H_POT, cWhite);
  mtxt(
    ["Total Earning", "Potential"],
    xA,
    Y,
    wA,
    H_POT,
    true,
    8.5,
    cBlack,
    "left",
  );

  cell(xB, Y, wB, H_POT, cWhite);
  inrTxt(d.totalEarning, xB, Y, wB, H_POT, true, 8.5);

  cell(xC, Y, wC, H_POT, cWhite);
  inrTxt(d.totalEarningD, xC, Y, wC, H_POT, true, 8.5);

  cell(xD, Y, wDE, H_POT, cWhite);
  mtxt(
    ["Performance Pay /", "Variable pay"],
    xD,
    Y,
    wDE,
    H_POT,
    false,
    7.5,
    cBlack,
    "center",
  );

  cell(xF, Y, wF, H_POT, cWhite);
  inrTxt(d.perfD, xF, Y, wF, H_POT, false, 8.5);

  Y += H_POT;

  // ==========================================================================
  // TOTAL EARNING (right side shaded, left side white)
  // totalWithPerf = netSalary + perfD
  // ==========================================================================
  cell(xA, Y, wA, H_DARK, cWhite);
  cell(xB, Y, wB, H_DARK, cWhite);
  cell(xC, Y, wC, H_DARK, cWhite);

  cell(xD, Y, wDE, H_DARK, cHdr, true);
  txt("Total Earning", xD, Y, wDE, H_DARK, true, 8.5, cBlack, "left");

  cell(xF, Y, wF, H_DARK, cHdr, true);
  inrTxt(d.totalWithPerf, xF, Y, wF, H_DARK, true, 8.5);

  Y += H_DARK;

  // ==========================================================================
  // SPACER (only outer left/right borders)
  // ==========================================================================
  fillR(xA, Y, wAll, H_SPC, cWhite);
  doc.setDrawColor(...cMed);
  doc.setLineWidth(0.5);
  doc.line(xA, Y, xA, Y + H_SPC);
  doc.line(xA + wAll, Y, xA + wAll, Y + H_SPC);
  Y += H_SPC;

  // ==========================================================================
  // FOOTER
  // ==========================================================================
  cell(xA, Y, wAll, H_FTR, cHdr, true);
  txt(
    '"This is computer generated payslip"',
    xA,
    Y,
    wAll,
    H_FTR,
    true,
    9,
    cBlack,
    "center",
  );

  doc.save(
    `Payslip_${d.name.replace(/\s+/g, "_")}_${
      d.forMonth?.replace(/\s+/g, "_") || "payslip"
    }.pdf`,
  );
};

/* =============================================================================
   EXCEL PAYSLIP — matches screenshot exactly
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

  ws.pageSetup = {
    horizontalCentered: true,
    verticalCentered: false,
    margins: {
      left: 0.5,
      right: 0.5,
      top: 0.5,
      bottom: 0.5,
      header: 0.3,
      footer: 0.3,
    },
  };
  ws.views = [{ showGridLines: false }];

  // ── Column widths ─────────────────────────────────────────────────────────
  // A=spacer | B=Earning Head | C=Gross Salary | D=Gross Salary(d)
  // E+F=Deduction Head | G+H+I=Amount
  ws.columns = [
    { width: 3.0 }, // A – left margin spacer
    { width: 22.0 }, // B – Earning Head / emp label-left
    { width: 16.0 }, // C – Gross Salary
    { width: 18.0 }, // D – Gross Salary (d)
    { width: 18.0 }, // E – Deduction Head pt1 / emp label-right pt1
    { width: 12.0 }, // F – Deduction Head pt2 / emp label-right pt2
    { width: 16.0 }, // G – Amount pt1 / emp value-right pt1
    { width: 5.0 }, // H – Amount pt2 / emp value-right pt2
    { width: 12.0 }, // I – Amount pt3 / emp value-right pt3
  ];

  // ── Row heights ───────────────────────────────────────────────────────────
  ws.getRow(1).height = 28.5; // spacer
  ws.getRow(2).height = 28.5; // header logo-pad
  ws.getRow(3).height = 28.5; // company name
  ws.getRow(4).height = 28.5; // address
  ws.getRow(5).height = 44.25; // website
  ws.getRow(6).height = 38.25; // banner
  for (let r = 7; r <= 15; r++) ws.getRow(r).height = 28.5; // 9 employee rows
  ws.getRow(16).height = 28.5; // table header
  ws.getRow(17).height = 28.5; // Basic
  ws.getRow(18).height = 28.5; // HRA
  ws.getRow(19).height = 32.25; // Org Allowance
  ws.getRow(20).height = 28.5; // Total Earning / Total Deduction
  ws.getRow(21).height = 31.2; // Perf Pay / Net Salary
  ws.getRow(22).height = 45.0; // Total Earning Potential
  ws.getRow(23).height = 28.5; // Total Earning (shaded)
  ws.getRow(24).height = 28.5; // Spacer
  ws.getRow(25).height = 28.5; // Footer

  // ── Style helpers ─────────────────────────────────────────────────────────
  const thin = { style: "thin", color: { argb: "FFAAAAAA" } };
  const medium = { style: "medium", color: { argb: "FF555555" } };
  const hair = { style: "hair", color: { argb: "FFEEEEEE" } };
  const white = { style: "thin", color: { argb: "FFFFFFFF" } };
  const thinB = { top: thin, left: thin, bottom: thin, right: thin };
  const medB = { top: medium, left: medium, bottom: medium, right: medium };

  const sf = (argb) => ({
    type: "pattern",
    pattern: "solid",
    fgColor: { argb },
  });
  const fillW = sf("FFFFFFFF");
  const fillHdr = sf("FFACB9CA");

  const lM = { horizontal: "left", vertical: "middle", wrapText: true };
  const cM = { horizontal: "center", vertical: "middle", wrapText: true };
  const numFmt = '"Rs. "#,##0.00';

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

  const fN = { size: 11, name: "Calibri" };
  const fB = { bold: true, size: 11, name: "Calibri" };
  const fB13 = { bold: true, size: 13, name: "Calibri" };
  const fBlue = {
    bold: true,
    size: 13,
    name: "Calibri",
    color: { argb: "FF1A3C6E" },
  };
  const fGray = { size: 11, name: "Calibri", color: { argb: "FF505050" } };
  const fWeb = { size: 11, name: "Calibri", color: { argb: "FF0563C1" } };

  // ==========================================================================
  // HEADER rows 2–5: logo on left (B+C+D), company info on right (E–I)
  // ==========================================================================
  const logoInfo = await loadImageBase64("/assets/Insta-logo1.png");
  if (logoInfo) {
    const b64 = logoInfo.dataUrl.split(",")[1];
    const imageId = wb.addImage({ base64: b64, extension: "png" });
    ws.addImage(imageId, {
      tl: { col: 1.3, row: 2.1 },
      br: { col: 3.8, row: 4.9 },
      editAs: "oneCell",
    });
  }

  // Border helper for header block
  for (let r = 2; r <= 5; r++) {
    // Logo side B, C, D
    ["B", "C", "D"].forEach((c) => {
      ws.getCell(`${c}${r}`).fill = fillW;
      ws.getCell(`${c}${r}`).border = {
        top: r === 2 ? medium : white,
        bottom: r === 5 ? medium : white,
        left: c === "B" ? medium : white,
        right: c === "D" ? hair : white,
      };
    });
    // Info side E–I
    ["E", "F", "G", "H", "I"].forEach((c) => {
      ws.getCell(`${c}${r}`).fill = fillW;
      ws.getCell(`${c}${r}`).border = {
        top: r === 2 ? medium : hair,
        bottom: r === 5 ? medium : hair,
        left: hair,
        right: c === "I" ? medium : hair,
      };
    });
  }

  // Company name row 3
  ws.mergeCells("E3:I3");
  set("E3", "Insta ICT Solutions Pvt. Ltd.", {
    font: fBlue,
    fill: fillW,
    alignment: { horizontal: "left", vertical: "middle" },
    border: { top: hair, bottom: hair, left: hair, right: medium },
  });
  // Address row 4
  ws.mergeCells("E4:I4");
  set(
    "E4",
    "201 - 202, Imperial Plaza, Jijai Nagar, Kothrud, Pune - 411 038.",
    {
      font: fGray,
      fill: fillW,
      alignment: { horizontal: "left", vertical: "middle" },
      border: { top: hair, bottom: hair, left: hair, right: medium },
    },
  );
  // Website row 5
  ws.mergeCells("E5:I5");
  set("E5", "\nWebsite: www.instagrp.com", {
    font: fWeb,
    fill: fillW,
    alignment: { horizontal: "left", vertical: "top", wrapText: true },
    border: { top: hair, bottom: medium, left: hair, right: medium },
  });

  // ==========================================================================
  // BANNER row 6
  // ==========================================================================
  ws.mergeCells("B6:I6");
  set("B6", `Payslip: ${d.forMonth}`, {
    font: fB13,
    fill: fillW,
    alignment: cM,
    border: medB,
  });

  // ==========================================================================
  // EMPLOYEE INFO rows 7–15 (9 rows)
  // B=label-left | C+D=value-left | E+F=label-right | G+H+I=value-right
  // ==========================================================================
  const empRows = [
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

  empRows.forEach(([l1, v1, l2, v2], i) => {
    const r = 7 + i;
    const bg = i === 0 ? fillHdr : fillW;
    const fv = i === 0 ? fB : fN;

    set(`B${r}`, l1, { font: fB, fill: bg, alignment: lM, border: thinB });
    ws.mergeCells(`C${r}:D${r}`);
    set(`C${r}`, v1 ?? "", {
      font: fv,
      fill: bg,
      alignment: cM,
      border: thinB,
    });
    ws.mergeCells(`E${r}:F${r}`);
    set(`E${r}`, l2, { font: fB, fill: bg, alignment: lM, border: thinB });
    ws.mergeCells(`G${r}:I${r}`);
    set(`G${r}`, v2 ?? "", {
      font: fv,
      fill: bg,
      alignment: cM,
      border: thinB,
    });
  });

  // ==========================================================================
  // TABLE HEADER row 16
  // B=Earning Head | C=Gross Salary | D=Gross Salary(d) | E+F=Deduction Head | G+H+I=Amount
  // ==========================================================================
  set("B16", "Earning Head", {
    font: fB,
    fill: fillHdr,
    alignment: cM,
    border: medB,
  });
  set("C16", "Gross Salary", {
    font: fB,
    fill: fillHdr,
    alignment: cM,
    border: medB,
  });
  set("D16", "Gross Salary (d)", {
    font: fB,
    fill: fillHdr,
    alignment: cM,
    border: medB,
  });
  ws.mergeCells("E16:F16");
  set("E16", "Deduction Head", {
    font: fB,
    fill: fillHdr,
    alignment: cM,
    border: medB,
  });
  ws.mergeCells("G16:I16");
  set("G16", "Amount", {
    font: fB,
    fill: fillHdr,
    alignment: cM,
    border: medB,
  });

  // ==========================================================================
  // DATA ROWS 17–19
  // ==========================================================================
  const earnData = [
    ["Basic", d.basic],
    ["HRA", d.hra],
    ["Organization Allowance", d.organisationAllowance],
  ];
  const dedData = [
    ["PF (Employee + Employer)", d.pfEmp + d.pfCo],
    ["PT", d.pt],
    ["Other", d.otherDeduction],
  ];

  for (let i = 0; i < 3; i++) {
    const r = 17 + i;
    const [eL, eG] = earnData[i];
    const [dL, dA] = dedData[i];

    set(`B${r}`, eL || null, {
      font: fN,
      fill: fillW,
      alignment: lM,
      border: thinB,
    });
    set(`C${r}`, eG || null, {
      font: fN,
      fill: fillW,
      alignment: cM,
      border: thinB,
      numFmt,
    });
    set(`D${r}`, eG ? { formula: `=C${r}/${d.monthDays}*${d.pDays}` } : null, {
      font: fN,
      fill: fillW,
      alignment: cM,
      border: thinB,
      numFmt,
    });
    ws.mergeCells(`E${r}:F${r}`);
    set(`E${r}`, dL || null, {
      font: fN,
      fill: fillW,
      alignment: cM,
      border: thinB,
    });
    ws.mergeCells(`G${r}:I${r}`);
    set(`G${r}`, dA != null ? dA : null, {
      font: fN,
      fill: fillW,
      alignment: cM,
      border: thinB,
      numFmt,
    });
  }

  // ==========================================================================
  // ROW 20: Total Earning / Total Deduction
  // ==========================================================================
  set("B20", "Total Earning", {
    font: fB,
    fill: fillW,
    alignment: lM,
    border: thinB,
  });
  set(
    "C20",
    { formula: "=C17+C18+C19" },
    { font: fB, fill: fillW, alignment: cM, border: thinB, numFmt },
  );
  set(
    "D20",
    { formula: "=D17+D18+D19" },
    { font: fB, fill: fillW, alignment: cM, border: thinB, numFmt },
  );
  ws.mergeCells("E20:F20");
  set("E20", "Total Deduction", {
    font: fN,
    fill: fillW,
    alignment: cM,
    border: thinB,
  });
  ws.mergeCells("G20:I20");
  set(
    "G20",
    { formula: "=G17+G18+G19" },
    { font: fN, fill: fillW, alignment: cM, border: thinB, numFmt },
  );

  // ==========================================================================
  // ROW 21: Performance Pay / Net Salary
  // Net Salary = D20 (grossSalaryD) − G20 (totalDeduction)
  // ==========================================================================
  set("B21", "Performance Pay / Variable pay", {
    font: fN,
    fill: fillW,
    alignment: lM,
    border: thinB,
  });
  set("C21", d.performancePay || null, {
    font: fN,
    fill: fillW,
    alignment: cM,
    border: thinB,
    numFmt,
  });
  set(
    "D21",
    { formula: `=C21/${d.monthDays}*${d.pDays}` },
    { font: fN, fill: fillW, alignment: cM, border: thinB, numFmt },
  );
  ws.mergeCells("E21:F21");
  set("E21", "Net Salary", {
    font: fB,
    fill: fillW,
    alignment: lM,
    border: medB,
  });
  ws.mergeCells("G21:I21");
  set(
    "G21",
    { formula: "=D20-G20" },
    { font: fB, fill: fillW, alignment: cM, border: medB, numFmt },
  );

  // ==========================================================================
  // ROW 22: Total Earning Potential / Performance Pay (Variable)
  // ==========================================================================
  set("B22", "Total Earning\n Potential", {
    font: fB,
    fill: fillW,
    alignment: lM,
    border: thinB,
  });
  set(
    "C22",
    { formula: "=C20+C21" },
    { font: fB, fill: fillW, alignment: cM, border: thinB, numFmt },
  );
  set(
    "D22",
    { formula: "=D20+D21" },
    { font: fB, fill: fillW, alignment: cM, border: thinB, numFmt },
  );
  ws.mergeCells("E22:F22");
  set("E22", "Performance Pay / Variable pay", {
    font: fN,
    fill: fillW,
    alignment: cM,
    border: thinB,
  });
  ws.mergeCells("G22:I22");
  set(
    "G22",
    { formula: "=D21" },
    { font: fN, fill: fillW, alignment: cM, border: thinB, numFmt },
  );

  // ==========================================================================
  // ROW 23: Total Earning shaded (Net Salary + Perf Pay = G21 + G22)
  // ==========================================================================
  ["B", "C", "D"].forEach((c) =>
    set(`${c}23`, null, { fill: fillW, border: thinB }),
  );
  ws.mergeCells("E23:F23");
  set("E23", "Total Earning", {
    font: fB,
    fill: fillHdr,
    alignment: lM,
    border: medB,
  });
  ws.mergeCells("G23:I23");
  set(
    "G23",
    { formula: "=G21+G22" },
    { font: fB, fill: fillHdr, alignment: cM, border: medB, numFmt },
  );

  // ==========================================================================
  // ROW 24: Spacer
  // ==========================================================================
  ["B", "C", "D", "E", "F", "G", "H", "I"].forEach((c) => {
    const b = {};
    if (c === "B") b.left = medium;
    if (c === "I") b.right = medium;
    set(`${c}24`, null, { fill: fillW, border: b });
  });

  // ==========================================================================
  // ROW 25: Footer
  // ==========================================================================
  ws.mergeCells("B25:I25");
  set("B25", '"This is computer generated payslip"', {
    font: fB,
    fill: fillHdr,
    alignment: cM,
    border: medB,
  });

  // ── Write & download ──────────────────────────────────────────────────────
  const buffer = await wb.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `Payslip_${d.name || "Employee"}_${
    d.forMonth?.replace(/\s+/g, "_") || "payslip"
  }.xlsx`;
  a.click();
  URL.revokeObjectURL(url);
};
