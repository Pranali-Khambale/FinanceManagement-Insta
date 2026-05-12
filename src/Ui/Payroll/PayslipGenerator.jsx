// src/Ui/Payroll/PayslipGenerator.js
// Supports two download formats:
//   1. PDF  (.pdf)  — downloadPayslipPDF(employee)
//   2. Excel (.xlsx) — downloadPayslipExcel(employee)
//
// Layout matches Salary_slip_format.xlsx exactly:
//   - Same column proportions & structure
//   - Same logo zone (left of header)
//   - Same rows: Medical Allowance, blank earning row, Gratuity deduction
//   - Same theme colors: hdr=E7E6E6, netSalaryBg=FFFFFF (black text + medium border),
//                        totalEarningBg=44546A (white text)
//   - Full A4 proportioned sizing, no clipping

/* ─── shared data builder ─────────────────────────────────────────────────── */
function _buildData(employee) {
  const n = (val) => {
    const v = Number(val);
    return isFinite(v) ? v : 0;
  };

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
  const medicalAllowance = n(employee.medicalAllowance);
  const performancePay = n(employee.performancePay);
  const monthDays = n(employee.monthDays) || 30;
  const pDays = employee.pDays != null ? n(employee.pDays) : monthDays;
  const aDays = n(employee.aDays);

  const pfEmp =
    employee.pfDeduction != null
      ? n(employee.pfDeduction)
      : Math.round(basic * 0.12);
  const pfCo =
    employee.employerPfContribution != null
      ? n(employee.employerPfContribution)
      : Math.round(basic * 0.13);

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

  const ratio = monthDays > 0 ? pDays / monthDays : 1;
  const grossSalary = basic + hra + organisationAllowance + medicalAllowance;
  const grossSalaryD = grossSalary * ratio;
  const basicD = basic * ratio;
  const hraD = hra * ratio;
  const oaD = organisationAllowance * ratio;
  const maD = medicalAllowance * ratio;
  const perfD = performancePay * ratio;

  const totalDeduction = pfEmp + pfCo + pt + gratuity;
  const netSalary = grossSalaryD - totalDeduction;
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
    medicalAllowance,
    performancePay,
    pfEmp,
    pfCo,
    pt,
    gratuity,
    grossSalary,
    grossSalaryD,
    basicD,
    hraD,
    oaD,
    maD,
    perfD,
    totalEarning,
    totalEarningD,
    totalDeduction,
    netSalary,
    totalWithPerf,
    gender: employee.gender || "",
  };
}

/* ─── INR formatter ─────────────────────────────────────────────────────── */
const inr = (num) =>
  "Rs. " +
  Number(num || 0).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

/* ─── Load image as base64 data URL ──────────────────────────────────────── */
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
   - A4 portrait, one-page fit
   - 6-column structure: A(EarningHead) | B(GrossSal) | C(GrossSalD) | DE(DedHead) | F(Amount)
   - Colors: hdr=E7E6E6, netSalary=white bg + black text + medium border,
             totalEarning shaded=44546A + white text
   - Row heights tuned for single-page A4 fit
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

  const PAGE_W = 210;
  const MARGIN_L = 8;
  const MARGIN_R = 8;
  const CONTENT_W = PAGE_W - MARGIN_L - MARGIN_R; // 194 mm

  // ── Column widths (total = 194 mm) ────────────────────────────────────────
  // A=EarningHead, B=GrossSal, C=GrossSalD, DE=DedHead(merged), F=Amount
  const wA = 42; // Earning Head
  const wB = 28; // Gross Salary
  const wC = 28; // Gross Salary (d)
  const wDE = 58; // Deduction Head
  const wF = 38; // Amount
  // Total = 42+28+28+58+38 = 194 ✓

  const xA = MARGIN_L;
  const xB = xA + wA;
  const xC = xB + wB;
  const xDE = xC + wC;
  const xF = xDE + wDE;

  // ── Row heights tuned for A4 single-page fit ──────────────────────────────
  const H_HDR = 26.0; // header block (logo + company info)
  const H_BANNER = 7.5; // Payslip banner
  const H_EMP = 6.5; // each of 9 employee info rows
  const H_THDR = 7.0; // table column header
  const H_ROW = 6.5; // standard data row
  const H_ROW_M = 7.0; // org allowance / medical (wrap text rows)
  const H_TOT = 6.5; // Total Earning / Total Deduction
  const H_PERF = 7.5; // Perf Pay / Net Salary
  const H_POT = 9.0; // Total Earning Potential
  const H_DARK = 6.5; // Total Earning shaded
  const H_SPC = 4.5; // spacer
  const H_FTR = 6.5; // footer

  // ── Colors ────────────────────────────────────────────────────────────────
  const cHdr = [231, 230, 230]; // E7E6E6 — header / table-header bg
  const cDarkBg = [68, 84, 106]; // 44546A — Total Earning shaded
  const cWhite = [255, 255, 255];
  const cThin = [180, 180, 180];
  const cMed = [80, 80, 80];
  const cBlue = [26, 60, 110];
  const cLink = [5, 99, 193];
  const cBlack = [0, 0, 0];
  const cGray = [90, 90, 90];
  const cDark = [30, 30, 30];

  // ── Drawing helpers ───────────────────────────────────────────────────────
  const fillR = (x, y, w, h, rgb) => {
    doc.setFillColor(...rgb);
    doc.rect(x, y, w, h, "F");
  };
  const boxR = (x, y, w, h, rgb, lw) => {
    doc.setDrawColor(...rgb);
    doc.setLineWidth(lw);
    doc.rect(x, y, w, h, "S");
  };
  const cell = (x, y, w, h, bg, med = false) => {
    fillR(x, y, w, h, bg);
    boxR(x, y, w, h, med ? cMed : cThin, med ? 0.5 : 0.18);
  };
  const txt = (s, x, y, w, h, bold, sz, col, align = "left") => {
    if (s === null || s === undefined) return;
    doc.setFont("helvetica", bold ? "bold" : "normal");
    doc.setFontSize(sz);
    doc.setTextColor(...col);
    const ty = y + h * 0.63;
    const str = String(s);
    if (align === "center") doc.text(str, x + w / 2, ty, { align: "center" });
    else if (align === "right")
      doc.text(str, x + w - 1.5, ty, { align: "right" });
    else doc.text(str, x + 2.2, ty);
  };
  const mtxt = (lines, x, y, w, h, bold, sz, col, align = "left") => {
    doc.setFont("helvetica", bold ? "bold" : "normal");
    doc.setFontSize(sz);
    doc.setTextColor(...col);
    const lh = sz * 0.42;
    const tot = (lines.length - 1) * lh;
    let ty = y + (h - tot) / 2;
    lines.forEach((line) => {
      const s = String(line ?? "");
      if (align === "center") doc.text(s, x + w / 2, ty, { align: "center" });
      else if (align === "right")
        doc.text(s, x + w - 1.5, ty, { align: "right" });
      else doc.text(s, x + 2.2, ty);
      ty += lh;
    });
  };
  const inrTxt = (val, x, y, w, h, bold, sz, col = cDark) =>
    txt(inr(val), x, y, w, h, bold, sz, col, "center");

  // ── Start drawing ─────────────────────────────────────────────────────────
  let Y = 8;

  // ==========================================================================
  // HEADER BLOCK: logo zone = A+B+C, company info zone = DE+F
  // ==========================================================================
  const wLeft = wA + wB + wC; // 98 mm – logo zone

  // Outer medium border around entire header
  fillR(xA, Y, CONTENT_W, H_HDR, cWhite);
  doc.setDrawColor(...cMed);
  doc.setLineWidth(0.55);
  doc.rect(xA, Y, CONTENT_W, H_HDR, "S");

  // Vertical divider between logo zone and company info zone
  doc.setDrawColor(...cThin);
  doc.setLineWidth(0.18);
  doc.line(xDE, Y, xDE, Y + H_HDR);

  // Logo — aspect-ratio-constrained, perfectly centred in left zone
  if (logoInfo) {
    const padX = 5,
      padY = 4;
    const maxW = wLeft - padX * 2;
    const maxH = H_HDR - padY * 2;
    const asp = logoInfo.w / logoInfo.h;

    // Fit by width, then clamp by height
    let iw = maxW,
      ih = iw / asp;
    if (ih > maxH) {
      ih = maxH;
      iw = ih * asp;
    }

    const ix = xA + (wLeft - iw) / 2; // horizontally centred in logo zone
    const iy = Y + (H_HDR - ih) / 2; // vertically centred in header block

    doc.addImage(logoInfo.dataUrl, "PNG", ix, iy, iw, ih, undefined, "FAST");
  } else {
    txt("LOGO", xA, Y, wLeft, H_HDR, true, 10, [180, 180, 180], "center");
  }

  // Company info — right zone
  const rxOff = xDE + 3;
  const rxW = wDE + wF - 5;
  txt(
    "Insta ICT Solutions Pvt. Ltd.",
    rxOff,
    Y + 2,
    rxW,
    8,
    true,
    10.5,
    cBlue,
    "left",
  );
  txt(
    "201 - 202, Imperial Plaza, Jijai Nagar, Kothrud, Pune - 411 038.",
    rxOff,
    Y + 10,
    rxW,
    7,
    false,
    7.5,
    cGray,
    "left",
  );
  txt(
    "Website: www.instagrp.com",
    rxOff,
    Y + 18,
    rxW,
    7,
    false,
    7.5,
    cLink,
    "left",
  );
  Y += H_HDR;

  // ==========================================================================
  // BANNER — Payslip: Month
  // ==========================================================================
  fillR(xA, Y, CONTENT_W, H_BANNER, cWhite);
  doc.setDrawColor(...cMed);
  doc.setLineWidth(0.55);
  doc.rect(xA, Y, CONTENT_W, H_BANNER, "S");
  txt(
    `Payslip: ${d.forMonth}`,
    xA,
    Y,
    CONTENT_W,
    H_BANNER,
    true,
    11,
    cBlack,
    "center",
  );
  Y += H_BANNER;

  // ==========================================================================
  // EMPLOYEE INFO — 9 rows
  // Labels in col A (wA wide) and DE (wDE wide), values span B+C and F
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
    // left label
    cell(xA, Y, wA, H_EMP, bg);
    txt(l1, xA, Y, wA, H_EMP, true, 7.5, cBlack, "left");
    // left value (spans B+C)
    cell(xB, Y, wB + wC, H_EMP, bg);
    txt(String(v1 ?? ""), xB, Y, wB + wC, H_EMP, vBold, 7.5, cDark, "center");
    // right label
    cell(xDE, Y, wDE, H_EMP, bg);
    txt(l2, xDE, Y, wDE, H_EMP, true, 7.5, cBlack, "left");
    // right value
    cell(xF, Y, wF, H_EMP, bg);
    txt(String(v2 ?? ""), xF, Y, wF, H_EMP, vBold, 7.5, cDark, "center");
    Y += H_EMP;
  });

  // ==========================================================================
  // TABLE HEADER
  // ==========================================================================
  cell(xA, Y, wA, H_THDR, cHdr, true);
  txt("Earning Head", xA, Y, wA, H_THDR, true, 8, cBlack, "center");
  cell(xB, Y, wB, H_THDR, cHdr, true);
  txt("Gross Salary", xB, Y, wB, H_THDR, true, 8, cBlack, "center");
  cell(xC, Y, wC, H_THDR, cHdr, true);
  txt("Gross Salary (d)", xC, Y, wC, H_THDR, true, 7.5, cBlack, "center");
  cell(xDE, Y, wDE, H_THDR, cHdr, true);
  txt("Deduction Head", xDE, Y, wDE, H_THDR, true, 8, cBlack, "center");
  cell(xF, Y, wF, H_THDR, cHdr, true);
  txt("Amount", xF, Y, wF, H_THDR, true, 8, cBlack, "center");
  Y += H_THDR;

  // ==========================================================================
  // DATA ROWS 1–5
  // Earning: Basic | HRA | Org Allowance | Medical Allowance | (blank)
  // Deduction: PF (Emp+Emp) | PT | (blank) | Gratuity | (blank)
  // ==========================================================================
  const earnRows = [
    ["Basic", d.basic, d.basicD, H_ROW],
    ["HRA", d.hra, d.hraD, H_ROW],
    ["Organization Allowance", d.organisationAllowance, d.oaD, H_ROW_M],
    ["Medical Allowance", d.medicalAllowance, d.maD, H_ROW_M],
    ["", null, null, H_ROW],
  ];
  const dedRows = [
    ["PF (Employee + Employer)", d.pfEmp + d.pfCo],
    ["PT", d.pt],
    ["", null], // blank row (was Gratuity)
    ["Gratuity", d.gratuity], // Gratuity replaces "Other 0"
    ["", null],
  ];

  for (let i = 0; i < 5; i++) {
    const [eL, eG, eGd, hRow] = earnRows[i];
    const [dL, dA] = dedRows[i];
    cell(xA, Y, wA, hRow, cWhite);
    if (eL) txt(eL, xA, Y, wA, hRow, false, 7.5, cBlack, "left");
    cell(xB, Y, wB, hRow, cWhite);
    if (eG !== null) inrTxt(eG, xB, Y, wB, hRow, false, 7.5);
    cell(xC, Y, wC, hRow, cWhite);
    if (eGd !== null) inrTxt(eGd, xC, Y, wC, hRow, false, 7.5);
    cell(xDE, Y, wDE, hRow, cWhite);
    if (dL) txt(dL, xDE, Y, wDE, hRow, false, 7.5, cBlack, "center");
    cell(xF, Y, wF, hRow, cWhite);
    if (dA !== null) inrTxt(dA, xF, Y, wF, hRow, false, 7.5);
    Y += hRow;
  }

  // ==========================================================================
  // TOTAL EARNING / TOTAL DEDUCTION
  // ==========================================================================
  cell(xA, Y, wA, H_TOT, cWhite);
  txt("Total Earning", xA, Y, wA, H_TOT, true, 7.5, cBlack, "left");
  cell(xB, Y, wB, H_TOT, cWhite);
  inrTxt(d.grossSalary, xB, Y, wB, H_TOT, true, 7.5);
  cell(xC, Y, wC, H_TOT, cWhite);
  inrTxt(d.grossSalaryD, xC, Y, wC, H_TOT, true, 7.5);
  cell(xDE, Y, wDE, H_TOT, cWhite);
  txt("Total Deduction", xDE, Y, wDE, H_TOT, false, 7.5, cBlack, "center");
  cell(xF, Y, wF, H_TOT, cWhite);
  inrTxt(d.totalDeduction, xF, Y, wF, H_TOT, false, 7.5);
  Y += H_TOT;

  // ==========================================================================
  // PERFORMANCE PAY / NET SALARY
  // Net Salary cell: white bg + medium border (matches template)
  // ==========================================================================
  cell(xA, Y, wA, H_PERF, cWhite);
  mtxt(
    ["Performance Pay /", "Variable pay"],
    xA,
    Y,
    wA,
    H_PERF,
    false,
    7,
    cBlack,
    "left",
  );
  cell(xB, Y, wB, H_PERF, cWhite);
  inrTxt(d.performancePay, xB, Y, wB, H_PERF, false, 7.5);
  cell(xC, Y, wC, H_PERF, cWhite);
  inrTxt(d.perfD, xC, Y, wC, H_PERF, false, 7.5);
  // Net Salary — medium border, white bg, bold black text
  cell(xDE, Y, wDE, H_PERF, cWhite, true);
  txt("Net Salary", xDE, Y, wDE, H_PERF, true, 8, cBlack, "left");
  cell(xF, Y, wF, H_PERF, cWhite, true);
  inrTxt(d.netSalary, xF, Y, wF, H_PERF, true, 7.5);
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
    7.5,
    cBlack,
    "left",
  );
  cell(xB, Y, wB, H_POT, cWhite);
  inrTxt(d.totalEarning, xB, Y, wB, H_POT, true, 7.5);
  cell(xC, Y, wC, H_POT, cWhite);
  inrTxt(d.totalEarningD, xC, Y, wC, H_POT, true, 7.5);
  cell(xDE, Y, wDE, H_POT, cWhite);
  mtxt(
    ["Performance Pay /", "Variable pay"],
    xDE,
    Y,
    wDE,
    H_POT,
    false,
    7,
    cBlack,
    "center",
  );
  cell(xF, Y, wF, H_POT, cWhite);
  inrTxt(d.perfD, xF, Y, wF, H_POT, false, 7.5);
  Y += H_POT;

  // ==========================================================================
  // TOTAL EARNING shaded — 44546A bg, white bold text
  // Left three cells blank white; DE+F shaded
  // ==========================================================================
  cell(xA, Y, wA, H_DARK, cWhite);
  cell(xB, Y, wB, H_DARK, cWhite);
  cell(xC, Y, wC, H_DARK, cWhite);
  cell(xDE, Y, wDE, H_DARK, cDarkBg, true);
  txt("Total Earning", xDE, Y, wDE, H_DARK, true, 8, cWhite, "left");
  cell(xF, Y, wF, H_DARK, cDarkBg, true);
  inrTxt(d.totalWithPerf, xF, Y, wF, H_DARK, true, 7.5, cWhite);
  Y += H_DARK;

  // ==========================================================================
  // SPACER
  // ==========================================================================
  fillR(xA, Y, CONTENT_W, H_SPC, cWhite);
  doc.setDrawColor(...cMed);
  doc.setLineWidth(0.55);
  doc.line(xA, Y, xA, Y + H_SPC);
  doc.line(xA + CONTENT_W, Y, xA + CONTENT_W, Y + H_SPC);
  Y += H_SPC;

  // ==========================================================================
  // FOOTER
  // ==========================================================================
  fillR(xA, Y, CONTENT_W, H_FTR, cHdr);
  doc.setDrawColor(...cMed);
  doc.setLineWidth(0.55);
  doc.rect(xA, Y, CONTENT_W, H_FTR, "S");
  txt(
    '"This is computer generated payslip"',
    xA,
    Y,
    CONTENT_W,
    H_FTR,
    true,
    8.5,
    cBlack,
    "center",
  );

  doc.save(
    `Payslip_${d.name.replace(/\s+/g, "_")}_${d.forMonth?.replace(/\s+/g, "_") || "payslip"}.pdf`,
  );
};

/* =============================================================================
   EXCEL PAYSLIP — matches Salary_slip_format.xlsx exactly

   Column mapping:
     A = left margin spacer
     B = Earning Head / emp label-left
     C = Gross Salary / emp value-left pt1  ─┐ merged C:D for emp values
     D = Gross Salary (d) / emp value-left pt2 ─┘
     E = Deduction Head pt1 / emp label-right pt1 ─┐ merged E:F
     F = Deduction Head pt2 / emp label-right pt2  ─┘
     G = Amount pt1 / emp value-right pt1  ─┐
     H = Amount pt2 / emp value-right pt2  ─┤ merged G:I for emp values
     I = Amount pt3 / emp value-right pt3  ─┘

   Row mapping:
     1       = top spacer
     2       = header row 1 (logo + company name)
     3       = header row 2 (address)
     4       = header row 3 (website)
     5       = banner (Payslip: Month) — B5:I5 merged
     6–14    = 9 employee info rows
     15      = table column header
     16      = Basic
     17      = HRA
     18      = Organization Allowance
     19      = Medical Allowance
     20      = (blank earning row)
     21      = Total Earning / Total Deduction
     22      = Perf Pay / Net Salary
     23      = Total Earning Potential / Perf Pay (Variable)
     24      = Total Earning shaded (dark)
     25      = spacer
     26      = footer

   Deduction column (rows 16–20):
     16 = PF (Employee + Employer)
     17 = PT
     18 = (blank)           ← was Gratuity, now blank
     19 = Gratuity          ← replaces "Other 0"
     20 = (blank)

   Theme colors:
     Header/table-hdr bg = E7E6E6
     Net Salary bg       = FFFFFF (white), bold, medium border
     Total Earning bg    = 44546A (dark), text = white
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
  const ws = wb.addWorksheet("Payslip");

  ws.pageSetup = {
    paperSize: 9, // A4
    orientation: "portrait",
    fitToPage: true,
    fitToWidth: 1,
    fitToHeight: 1,
    horizontalCentered: true,
    margins: {
      left: 0.35,
      right: 0.35,
      top: 0.35,
      bottom: 0.35,
      header: 0.2,
      footer: 0.2,
    },
  };
  ws.views = [{ showGridLines: false }];

  // ── Column widths ─────────────────────────────────────────────────────────
  ws.columns = [
    { width: 2.0 }, // A – left margin spacer
    { width: 21.0 }, // B – Earning Head / emp label-left
    { width: 15.0 }, // C – Gross Salary
    { width: 17.0 }, // D – Gross Salary (d)
    { width: 18.0 }, // E – Deduction Head pt1 / emp label-right pt1
    { width: 8.0 }, // F – Deduction Head pt2
    { width: 14.0 }, // G – Amount pt1
    { width: 4.5 }, // H – Amount pt2
    { width: 10.5 }, // I – Amount pt3
  ];

  // ── Row heights ───────────────────────────────────────────────────────────
  ws.getRow(1).height = 5.0; // top spacer
  ws.getRow(2).height = 24.0; // header row 1 – company name
  ws.getRow(3).height = 22.0; // header row 2 – address
  ws.getRow(4).height = 32.0; // header row 3 – website
  ws.getRow(5).height = 28.0; // banner
  for (let r = 6; r <= 14; r++) ws.getRow(r).height = 21.0; // 9 emp info rows
  ws.getRow(15).height = 22.0; // table column header
  ws.getRow(16).height = 21.0; // Basic
  ws.getRow(17).height = 21.0; // HRA
  ws.getRow(18).height = 25.0; // Org Allowance
  ws.getRow(19).height = 25.0; // Medical Allowance
  ws.getRow(20).height = 21.0; // blank earning row
  ws.getRow(21).height = 21.0; // Total Earning / Total Deduction
  ws.getRow(22).height = 26.0; // Perf Pay / Net Salary
  ws.getRow(23).height = 34.0; // Total Earning Potential
  ws.getRow(24).height = 22.0; // Total Earning shaded
  ws.getRow(25).height = 16.0; // spacer
  ws.getRow(26).height = 22.0; // footer

  // ── Border style objects ──────────────────────────────────────────────────
  const thin = { style: "thin", color: { argb: "FFAAAAAA" } };
  const medium = { style: "medium", color: { argb: "FF505050" } };
  const hair = { style: "hair", color: { argb: "FFDDDDDD" } };
  const white = { style: "thin", color: { argb: "FFFFFFFF" } };
  const thinB = { top: thin, left: thin, bottom: thin, right: thin };
  const medB = { top: medium, left: medium, bottom: medium, right: medium };

  // ── Fill objects ──────────────────────────────────────────────────────────
  const sf = (argb) => ({
    type: "pattern",
    pattern: "solid",
    fgColor: { argb },
  });
  const fillW = sf("FFFFFFFF");
  const fillHdr = sf("FFE7E6E6"); // E7E6E6 — header / table-header
  const fillDark = sf("FF44546A"); // 44546A — Total Earning shaded
  // Net Salary uses fillW (white bg) with medium border

  // ── Alignment objects ─────────────────────────────────────────────────────
  const lM = { horizontal: "left", vertical: "middle", wrapText: true };
  const cM = { horizontal: "center", vertical: "middle", wrapText: true };

  // ── Number format ─────────────────────────────────────────────────────────
  const numFmt = '"Rs. "#,##0.00';

  // ── Cell setter helper ────────────────────────────────────────────────────
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

  // ── Font objects ──────────────────────────────────────────────────────────
  const fN = { size: 9, name: "Calibri" };
  const fB = { bold: true, size: 9, name: "Calibri" };
  const fB11 = { bold: true, size: 11, name: "Calibri" };
  const fBlue = {
    bold: true,
    size: 11,
    name: "Calibri",
    color: { argb: "FF1A3C6E" },
  };
  const fGray = { size: 9, name: "Calibri", color: { argb: "FF5A5A5A" } };
  const fWeb = { size: 9, name: "Calibri", color: { argb: "FF0563C1" } };
  const fWht = {
    bold: true,
    size: 9,
    name: "Calibri",
    color: { argb: "FFFFFFFF" },
  };
  const fBN = { bold: true, size: 9, name: "Calibri" }; // bold normal (for emp row 1 values)

  // ==========================================================================
  // HEADER rows 2–4: logo zone = B:D merged, company info = E:I
  // ==========================================================================
  const logoInfo = await loadImageBase64("/assets/Insta-logo1.png");
  if (logoInfo) {
    const b64 = logoInfo.dataUrl.split(",")[1];
    const imageId = wb.addImage({ base64: b64, extension: "png" });

    // Logo zone: cols B–D (col indices 1–4), rows 2–4 (row indices 1–4).
    // Use uniform padding so the image is centred with breathing room on all sides.
    const padCol = 0.22;
    const padRow = 0.18;
    ws.addImage(imageId, {
      tl: { col: 1.0 + padCol, row: 1.0 + padRow },
      br: { col: 4.0 - padCol, row: 4.0 - padRow },
      editAs: "oneCell",
    });
  }

  // Header block borders & fills
  for (let r = 2; r <= 4; r++) {
    ["B", "C", "D"].forEach((c) => {
      ws.getCell(`${c}${r}`).fill = fillW;
      ws.getCell(`${c}${r}`).border = {
        top: r === 2 ? medium : white,
        bottom: r === 4 ? medium : white,
        left: c === "B" ? medium : white,
        right: c === "D" ? hair : white,
      };
    });
    ["E", "F", "G", "H", "I"].forEach((c) => {
      ws.getCell(`${c}${r}`).fill = fillW;
      ws.getCell(`${c}${r}`).border = {
        top: r === 2 ? medium : hair,
        bottom: r === 4 ? medium : hair,
        left: hair,
        right: c === "I" ? medium : hair,
      };
    });
  }

  // Company name — row 2
  ws.mergeCells("E2:I2");
  set("E2", "Insta ICT Solutions Pvt. Ltd.", {
    font: fBlue,
    fill: fillW,
    alignment: lM,
    border: { top: medium, bottom: hair, left: hair, right: medium },
  });

  // Address — row 3
  ws.mergeCells("E3:I3");
  set(
    "E3",
    "201 - 202, Imperial Plaza, Jijai Nagar, Kothrud, Pune - 411 038.",
    {
      font: fGray,
      fill: fillW,
      alignment: lM,
      border: { top: hair, bottom: hair, left: hair, right: medium },
    },
  );

  // Website — row 4
  ws.mergeCells("E4:I4");
  set("E4", "Website: www.instagrp.com", {
    font: fWeb,
    fill: fillW,
    alignment: { horizontal: "left", vertical: "bottom", wrapText: true },
    border: { top: hair, bottom: medium, left: hair, right: medium },
  });

  // ==========================================================================
  // BANNER row 5 — B5:I5 merged
  // ==========================================================================
  ws.mergeCells("B5:I5");
  set("B5", `Payslip: ${d.forMonth}`, {
    font: fB11,
    fill: fillW,
    alignment: cM,
    border: medB,
  });

  // ==========================================================================
  // EMPLOYEE INFO rows 6–14 (9 rows)
  // B=label-left | C:D=value-left merged | E:F=label-right merged | G:I=value-right merged
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
    const r = 6 + i;
    const bg = i === 0 ? fillHdr : fillW;
    const fv = i === 0 ? fBN : fN;

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
  // TABLE HEADER row 15
  // ==========================================================================
  set("B15", "Earning Head", {
    font: fB,
    fill: fillHdr,
    alignment: cM,
    border: medB,
  });
  set("C15", "Gross Salary", {
    font: fB,
    fill: fillHdr,
    alignment: cM,
    border: medB,
  });
  set("D15", "Gross Salary (d)", {
    font: fB,
    fill: fillHdr,
    alignment: cM,
    border: medB,
  });
  ws.mergeCells("E15:F15");
  set("E15", "Deduction Head", {
    font: fB,
    fill: fillHdr,
    alignment: cM,
    border: medB,
  });
  ws.mergeCells("G15:I15");
  set("G15", "Amount", {
    font: fB,
    fill: fillHdr,
    alignment: cM,
    border: medB,
  });

  // ==========================================================================
  // DATA ROWS 16–20
  // Earning: Basic | HRA | Organization Allowance | Medical Allowance | blank
  // Deduction: PF (Emp+Emp) | PT | blank | Gratuity | blank
  // ==========================================================================
  const earnData = [
    ["Basic", d.basic],
    ["HRA", d.hra],
    ["Organization Allowance", d.organisationAllowance],
    ["Medical\nAllowance", d.medicalAllowance],
    ["", null],
  ];
  const dedData = [
    ["PF (Employee + Employer)", d.pfEmp + d.pfCo],
    ["PT", d.pt],
    ["", null], // blank row
    ["Gratuity", d.gratuity],
    ["", null],
  ];

  for (let i = 0; i < 5; i++) {
    const r = 16 + i;
    const [eL, eG] = earnData[i];
    const [dL, dA] = dedData[i];

    // Earning label (col B)
    set(`B${r}`, eL !== "" ? eL : null, {
      font: fN,
      fill: fillW,
      alignment: lM,
      border: thinB,
    });
    // Gross Salary (col C)
    set(`C${r}`, eG != null ? eG : null, {
      font: fN,
      fill: fillW,
      alignment: cM,
      border: thinB,
      numFmt,
    });
    // Gross Salary (d) (col D) — formula only when earning exists
    set(
      `D${r}`,
      eG != null ? { formula: `=C${r}/${d.monthDays}*${d.pDays}` } : null,
      {
        font: fN,
        fill: fillW,
        alignment: cM,
        border: thinB,
        numFmt,
      },
    );

    // Deduction label (cols E:F merged)
    ws.mergeCells(`E${r}:F${r}`);
    set(`E${r}`, dL !== "" ? dL : null, {
      font: fN,
      fill: fillW,
      alignment: cM,
      border: thinB,
    });

    // Deduction amount (cols G:I merged)
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
  // ROW 21 — Total Earning / Total Deduction
  // ==========================================================================
  set("B21", "Total Earning", {
    font: fB,
    fill: fillW,
    alignment: lM,
    border: thinB,
  });
  set(
    "C21",
    { formula: "=C16+C17+C18+C19+C20" },
    {
      font: fB,
      fill: fillW,
      alignment: cM,
      border: thinB,
      numFmt,
    },
  );
  set(
    "D21",
    { formula: "=D16+D17+D18+D19+D20" },
    {
      font: fB,
      fill: fillW,
      alignment: cM,
      border: thinB,
      numFmt,
    },
  );
  ws.mergeCells("E21:F21");
  set("E21", "Total Deduction", {
    font: fN,
    fill: fillW,
    alignment: cM,
    border: thinB,
  });
  ws.mergeCells("G21:I21");
  set(
    "G21",
    { formula: "=G16+G17+G18+G19+G20" },
    {
      font: fN,
      fill: fillW,
      alignment: cM,
      border: thinB,
      numFmt,
    },
  );

  // ==========================================================================
  // ROW 22 — Performance Pay / Net Salary
  // Net Salary: white bg, medium border, bold — matches template exactly
  // ==========================================================================
  set("B22", "Performance Pay\nVariable pay", {
    font: fN,
    fill: fillW,
    alignment: lM,
    border: thinB,
  });
  set("C22", d.performancePay || null, {
    font: fN,
    fill: fillW,
    alignment: cM,
    border: thinB,
    numFmt,
  });
  set(
    "D22",
    { formula: `=C22/${d.monthDays}*${d.pDays}` },
    {
      font: fN,
      fill: fillW,
      alignment: cM,
      border: thinB,
      numFmt,
    },
  );
  ws.mergeCells("E22:F22");
  set("E22", "Net Salary", {
    font: fB,
    fill: fillW,
    alignment: lM,
    border: medB,
  });
  ws.mergeCells("G22:I22");
  set(
    "G22",
    { formula: "=D21-G21" },
    {
      font: fB,
      fill: fillW,
      alignment: cM,
      border: medB,
      numFmt,
    },
  );

  // ==========================================================================
  // ROW 23 — Total Earning Potential / Performance Pay (Variable)
  // ==========================================================================
  set("B23", "Total Earning\nPotential", {
    font: fB,
    fill: fillW,
    alignment: lM,
    border: thinB,
  });
  set(
    "C23",
    { formula: "=C21+C22" },
    {
      font: fB,
      fill: fillW,
      alignment: cM,
      border: thinB,
      numFmt,
    },
  );
  set(
    "D23",
    { formula: "=D21+D22" },
    {
      font: fB,
      fill: fillW,
      alignment: cM,
      border: thinB,
      numFmt,
    },
  );
  ws.mergeCells("E23:F23");
  set("E23", "Performance Pay\nVariable pay", {
    font: fN,
    fill: fillW,
    alignment: cM,
    border: thinB,
  });
  ws.mergeCells("G23:I23");
  set(
    "G23",
    { formula: "=D22" },
    {
      font: fN,
      fill: fillW,
      alignment: cM,
      border: thinB,
      numFmt,
    },
  );

  // ==========================================================================
  // ROW 24 — Total Earning shaded (44546A bg, white text)
  // Left three cells (B:D) remain white; E:F and G:I shaded dark
  // ==========================================================================
  ["B", "C", "D"].forEach((c) =>
    set(`${c}24`, null, { fill: fillW, border: thinB }),
  );
  ws.mergeCells("E24:F24");
  set("E24", "Total Earning", {
    font: fWht,
    fill: fillDark,
    alignment: lM,
    border: medB,
  });
  ws.mergeCells("G24:I24");
  set(
    "G24",
    { formula: "=G22+G23" },
    {
      font: fWht,
      fill: fillDark,
      alignment: cM,
      border: medB,
      numFmt,
    },
  );

  // ==========================================================================
  // ROW 25 — Spacer (outer vertical border lines only)
  // ==========================================================================
  ["B", "C", "D", "E", "F", "G", "H", "I"].forEach((c) => {
    const b = {};
    if (c === "B") b.left = medium;
    if (c === "I") b.right = medium;
    set(`${c}25`, null, { fill: fillW, border: b });
  });

  // ==========================================================================
  // ROW 26 — Footer
  // ==========================================================================
  ws.mergeCells("B26:I26");
  set("B26", '"This is computer generated payslip"', {
    font: fB,
    fill: fillHdr,
    alignment: cM,
    border: medB,
  });

  // ── Write & trigger download ──────────────────────────────────────────────
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
