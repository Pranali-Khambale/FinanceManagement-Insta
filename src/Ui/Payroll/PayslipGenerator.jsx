// src/Ui/Payroll/PayslipGenerator.js
//
// EXACT REPLICA of Salary_slip_format.xlsx
//
// Template structure (B:I, rows 2–26):
//   Col B  = Earning Head / emp label-left             (width 23.22)
//   Col C  = Gross Salary / emp value-left pt1         (width 16.44)
//   Col D  = Gross Salary (d) / emp value-left pt2     (width 20.78)  ← C:D merged for emp values
//   Col E  = Deduction Head pt1 / emp label-right pt1  (width 15.00)
//   Col F  = Deduction Head pt2 / emp label-right pt2  (width  9.44)  ← E:F merged for ded-head & emp labels
//   Col G  = Amount span / emp value-right pt1         (width 17.44)
//   Col H  = Amount pt1 / emp value-right pt2          (width  5.44)  ← G:I merged for emp values
//   Col I  = Amount pt2 / emp value-right pt3          (width 18.44)  ← H:I merged for amounts
//
// Row map:
//   1      = top spacer (28.5 pt)
//   2      = header logo + company name
//   3      = header address
//   4      = header website
//   5      = Payslip banner (B5:I5 merged)
//   6–14   = 9 employee info rows
//   15     = Table column header
//   16     = Basic          | PF (Employee + Employer)
//   17     = HRA            | PT
//   18     = Org Allowance  | Other
//   19     = Medical Allow. | TDS
//   20     = (blank earn.)  | Advance
//   21     = Total Earning  | Total Deduction
//   22     = Perf Pay       | Net Salary
//   23     = Total Earning Potential | Perf Pay (Variable)
//   24     = (blank B:D)    | Total Earning DARK (E:I)
//   25     = spacer row
//   26     = Footer

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

  const other = employee.other != null ? n(employee.other) : 0;
  const tds = employee.tds != null ? n(employee.tds) : 0;
  const advance = employee.advance != null ? n(employee.advance) : 0;

  const ratio = monthDays > 0 ? pDays / monthDays : 1;
  const grossSalary = basic + hra + organisationAllowance + medicalAllowance;
  const grossSalaryD = grossSalary * ratio;
  const basicD = basic * ratio;
  const hraD = hra * ratio;
  const oaD = organisationAllowance * ratio;
  const maD = medicalAllowance * ratio;
  const perfD = performancePay * ratio;

  // Deductions match template rows 16-20:
  // 16 = PF (Emp+Employer), 17 = PT, 18 = Other, 19 = TDS, 20 = Advance
  const totalDeduction = pfEmp + pfCo + pt + other + tds + advance;
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
    other,
    tds,
    advance,
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
   PDF PAYSLIP — A4 portrait, single-page
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
  const CONTENT_W = PAGE_W - MARGIN_L - MARGIN_R;

  const SCALE = 194 / 126.2;
  const wB = Math.round(23.22 * SCALE * 10) / 10;
  const wC = Math.round(16.44 * SCALE * 10) / 10;
  const wD = Math.round(20.78 * SCALE * 10) / 10;
  const wE = Math.round(15.0 * SCALE * 10) / 10;
  const wF = Math.round(9.44 * SCALE * 10) / 10;
  const wG = Math.round(17.44 * SCALE * 10) / 10;
  const wH = Math.round(5.44 * SCALE * 10) / 10;
  const wI = 194 - wB - wC - wD - wE - wF - wG - wH;

  const xB = MARGIN_L;
  const xC = xB + wB;
  const xD = xC + wC;
  const xE = xD + wD;
  const xF = xE + wE;
  const xG = xF + wF;
  const xH = xG + wG;
  const xI = xH + wH;

  const pt2mm = 0.3528;
  const H_HDR_ROW = 28.5 * pt2mm;
  const H_HDR = H_HDR_ROW * 3;
  const H_BANNER = 38.25 * pt2mm;
  const H_EMP = 28.5 * pt2mm;
  const H_R16 = 28.5 * pt2mm;
  const H_R17 = 28.5 * pt2mm;
  const H_R18 = 32.25 * pt2mm;
  const H_R19 = 31.5 * pt2mm;
  const H_R20 = 28.5 * pt2mm;
  const H_R21 = 28.5 * pt2mm;
  const H_R22 = 31.2 * pt2mm;
  const H_R23 = 45.0 * pt2mm;
  const H_R24 = 28.5 * pt2mm;
  const H_R25 = 28.5 * pt2mm;
  const H_R26 = 28.5 * pt2mm;

  const cHdr = [231, 230, 230];
  const cDarkBg = [68, 84, 106];
  const cWhite = [255, 255, 255];
  const cBlack = [0, 0, 0];
  const cThin = [110, 110, 110];
  const cMed = [50, 50, 50];
  const cBlue = [26, 60, 110];
  const cLink = [5, 99, 193];
  const cGray = [90, 90, 90];
  const cDark = [30, 30, 30];

  const fillR = (x, y, w, h, rgb) => {
    doc.setFillColor(...rgb);
    doc.rect(x, y, w, h, "F");
  };
  const strokeR = (x, y, w, h, rgb, lw) => {
    doc.setDrawColor(...rgb);
    doc.setLineWidth(lw);
    doc.rect(x, y, w, h, "S");
  };
  const thinBox = (x, y, w, h) => strokeR(x, y, w, h, cThin, 0.18);
  const medBox = (x, y, w, h) => strokeR(x, y, w, h, cMed, 0.5);

  const cell = (x, y, w, h, bg, isMed = false) => {
    fillR(x, y, w, h, bg);
    if (isMed) medBox(x, y, w, h);
    else thinBox(x, y, w, h);
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

  let Y = 8;

  // HEADER BLOCK (rows 2-4)
  const wLogoZone = wB + wC;
  const wInfoZone = wD + wE + wF + wG + wH + wI;

  fillR(xB, Y, CONTENT_W, H_HDR, cWhite);
  medBox(xB, Y, CONTENT_W, H_HDR);

  if (logoInfo) {
    const padX = 5,
      padY = 3;
    const maxW = wLogoZone - padX * 2;
    const maxH = H_HDR - padY * 2;
    const asp = logoInfo.w / logoInfo.h;
    let iw = maxW,
      ih = iw / asp;
    if (ih > maxH) {
      ih = maxH;
      iw = ih * asp;
    }
    const ix = xB + (wLogoZone - iw) / 2;
    const iy = Y + (H_HDR - ih) / 2;
    doc.addImage(logoInfo.dataUrl, "PNG", ix, iy, iw, ih, undefined, "FAST");
  } else {
    txt("LOGO", xB, Y, wLogoZone, H_HDR, true, 10, [180, 180, 180], "center");
  }

  const rxOff = xD + 2;
  const rxW = wInfoZone - 3;
  txt(
    "Insta ICT Solutions Pvt. Ltd.",
    rxOff,
    Y,
    rxW,
    H_HDR_ROW,
    true,
    10.5,
    cBlue,
    "left",
  );
  txt(
    "201 - 202, Imperial Plaza, Jijai Nagar, Kothrud, Pune - 411 038.",
    rxOff,
    Y + H_HDR_ROW,
    rxW,
    H_HDR_ROW,
    false,
    7.8,
    cGray,
    "left",
  );
  txt(
    "Website: www.instagrp.com.",
    rxOff,
    Y + H_HDR_ROW * 2,
    rxW,
    H_HDR_ROW,
    false,
    8.0,
    cLink,
    "left",
  );
  Y += H_HDR;

  // BANNER row 5
  fillR(xB, Y, CONTENT_W, H_BANNER, cWhite);
  medBox(xB, Y, CONTENT_W, H_BANNER);
  txt(
    `Payslip: ${d.forMonth}`,
    xB,
    Y,
    CONTENT_W,
    H_BANNER,
    true,
    11,
    cBlack,
    "center",
  );
  Y += H_BANNER;

  // EMPLOYEE INFO rows 6–14
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
    const isMed = i === 0;

    cell(xB, Y, wB, H_EMP, bg, isMed);
    txt(l1, xB, Y, wB, H_EMP, true, 8, cBlack, "center");
    cell(xC, Y, wC + wD, H_EMP, bg, isMed);
    txt(String(v1 ?? ""), xC, Y, wC + wD, H_EMP, vBold, 8, cDark, "center");
    cell(xE, Y, wE + wF, H_EMP, bg, isMed);
    txt(l2, xE, Y, wE + wF, H_EMP, true, 8, cBlack, "center");
    cell(xG, Y, wG + wH + wI, H_EMP, bg, isMed);
    txt(
      String(v2 ?? ""),
      xG,
      Y,
      wG + wH + wI,
      H_EMP,
      vBold,
      8,
      cDark,
      "center",
    );
    Y += H_EMP;
  });

  // TABLE HEADER row 15
  cell(xB, Y, wB, H_EMP, cHdr, true);
  txt("Earning Head", xB, Y, wB, H_EMP, true, 8, cBlack, "center");
  cell(xC, Y, wC, H_EMP, cHdr, true);
  txt("Gross Salary", xC, Y, wC, H_EMP, true, 8, cBlack, "center");
  cell(xD, Y, wD, H_EMP, cHdr, true);
  txt("Gross Salary (d)", xD, Y, wD, H_EMP, true, 7.5, cBlack, "center");
  cell(xE, Y, wE + wF + wG, H_EMP, cHdr, true);
  txt("Deduction Head", xE, Y, wE + wF + wG, H_EMP, true, 8, cBlack, "center");
  cell(xH, Y, wH + wI, H_EMP, cHdr, true);
  txt("Amount", xH, Y, wH + wI, H_EMP, true, 8, cBlack, "center");
  Y += H_EMP;

  // DATA ROWS 16–20
  const earnRows = [
    ["Basic", d.basic, d.basicD, H_R16],
    ["HRA", d.hra, d.hraD, H_R17],
    ["Organization Allowance", d.organisationAllowance, d.oaD, H_R18],
    ["Medical\nAllowance", d.medicalAllowance, d.maD, H_R19],
    ["", null, null, H_R20],
  ];
  const dedRows = [
    ["PF (Employee + Employer)", d.pfEmp + d.pfCo],
    ["PT", d.pt],
    ["Other", d.other],
    ["TDS", d.tds],
    ["Advance", d.advance],
  ];

  for (let i = 0; i < 5; i++) {
    const [eL, eG, eGd, hRow] = earnRows[i];
    const [dL, dA] = dedRows[i];

    cell(xB, Y, wB, hRow, cWhite);
    if (eL) {
      const lines = eL.split("\n");
      if (lines.length > 1)
        mtxt(lines, xB, Y, wB, hRow, false, 7.5, cBlack, "center");
      else txt(eL, xB, Y, wB, hRow, false, 7.5, cBlack, "center");
    }
    cell(xC, Y, wC, hRow, cWhite);
    if (eG !== null) inrTxt(eG, xC, Y, wC, hRow, false, 7.5);
    cell(xD, Y, wD, hRow, cWhite);
    if (eGd !== null) inrTxt(eGd, xD, Y, wD, hRow, false, 7.5);

    cell(xE, Y, wE + wF + wG, hRow, cWhite);
    if (dL) txt(dL, xE, Y, wE + wF + wG, hRow, false, 7.5, cBlack, "center");
    cell(xH, Y, wH + wI, hRow, cWhite);
    if (dA !== null) inrTxt(dA, xH, Y, wH + wI, hRow, false, 7.5);

    Y += hRow;
  }

  // ROW 21 — Total Earning / Total Deduction
  cell(xB, Y, wB, H_R21, cWhite);
  txt("Total Earning", xB, Y, wB, H_R21, true, 7.5, cBlack, "center");
  cell(xC, Y, wC, H_R21, cWhite);
  inrTxt(d.grossSalary, xC, Y, wC, H_R21, true, 7.5);
  cell(xD, Y, wD, H_R21, cWhite);
  inrTxt(d.grossSalaryD, xD, Y, wD, H_R21, true, 7.5);
  cell(xE, Y, wE + wF + wG, H_R21, cWhite);
  txt(
    "Total Deduction",
    xE,
    Y,
    wE + wF + wG,
    H_R21,
    false,
    7.5,
    cBlack,
    "center",
  );
  cell(xH, Y, wH + wI, H_R21, cWhite);
  inrTxt(d.totalDeduction, xH, Y, wH + wI, H_R21, false, 7.5);
  const Y_AFTER_R21 = Y + H_R21;
  Y += H_R21;

  // ROW 22 — Performance Pay / Net Salary
  cell(xB, Y, wB, H_R22, cWhite);
  mtxt(
    ["Performance Pay", "Variable pay"],
    xB,
    Y,
    wB,
    H_R22,
    false,
    7,
    cBlack,
    "center",
  );
  cell(xC, Y, wC, H_R22, cWhite);
  inrTxt(d.performancePay, xC, Y, wC, H_R22, false, 7.5);
  cell(xD, Y, wD, H_R22, cWhite);
  inrTxt(d.perfD, xD, Y, wD, H_R22, false, 7.5);
  cell(xE, Y, wE + wF + wG, H_R22, cWhite, true);
  txt("Net Salary", xE, Y, wE + wF + wG, H_R22, true, 8, cBlack, "center");
  cell(xH, Y, wH + wI, H_R22, cWhite, true);
  inrTxt(d.netSalary, xH, Y, wH + wI, H_R22, true, 7.5);
  Y += H_R22;

  // ROW 23 — Total Earning Potential / Performance Pay (Variable)
  cell(xB, Y, wB, H_R23, cWhite);
  mtxt(
    ["Total Earning", " Potential"],
    xB,
    Y,
    wB,
    H_R23,
    true,
    7.5,
    cBlack,
    "center",
  );
  cell(xC, Y, wC, H_R23, cWhite);
  inrTxt(d.totalEarning, xC, Y, wC, H_R23, true, 7.5);
  cell(xD, Y, wD, H_R23, cWhite);
  inrTxt(d.totalEarningD, xD, Y, wD, H_R23, true, 7.5);
  cell(xE, Y, wE + wF + wG, H_R23, cWhite);
  mtxt(
    ["Performance Pay", "Variable pay"],
    xE,
    Y,
    wE + wF + wG,
    H_R23,
    false,
    7,
    cBlack,
    "center",
  );
  cell(xH, Y, wH + wI, H_R23, cWhite);
  inrTxt(d.perfD, xH, Y, wH + wI, H_R23, false, 7.5);
  Y += H_R23;

  // ROW 24 — Total Earning DARK SECTION
  cell(xB, Y, wB, H_R24, cWhite);
  cell(xC, Y, wC, H_R24, cWhite);
  cell(xD, Y, wD, H_R24, cWhite);
  cell(xE, Y, wE + wF + wG, H_R24, cDarkBg, true);
  txt("Total Earning", xE, Y, wE + wF + wG, H_R24, true, 8, cWhite, "center");
  cell(xH, Y, wH + wI, H_R24, cDarkBg, true);
  inrTxt(d.totalWithPerf, xH, Y, wH + wI, H_R24, true, 7.5, cWhite);
  Y += H_R24;

  // ROW 25 — Spacer
  fillR(xB, Y, CONTENT_W, H_R25, cWhite);
  medBox(xB, Y, CONTENT_W, H_R25);
  Y += H_R25;

  // ROW 26 — Footer
  fillR(xB, Y, CONTENT_W, H_R26, cHdr);
  medBox(xB, Y, CONTENT_W, H_R26);
  txt(
    '"This is computer generated payslip"',
    xB,
    Y,
    CONTENT_W,
    H_R26,
    true,
    8.5,
    cBlack,
    "center",
  );

  // REDRAW KEY BORDER LINES last
  doc.setDrawColor(...cMed);
  doc.setLineWidth(0.6);
  doc.line(xB, Y_AFTER_R21, xB + CONTENT_W, Y_AFTER_R21);

  doc.save(
    `Payslip_${d.name.replace(/\s+/g, "_")}_${d.forMonth?.replace(/\s+/g, "_") || "payslip"}.pdf`,
  );
};

/* =============================================================================
   EXCEL PAYSLIP — exact replica of PDF / Salary_slip_format.xlsx
   All values, formulas, merges, borders, fonts, fills match the PDF line-by-line.
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
    paperSize: 9,
    orientation: "portrait",
    fitToPage: true,
    fitToWidth: 1,
    fitToHeight: 0,
    horizontalCentered: true,
    verticalCentered: false,
    margins: {
      left: 0.15,
      right: 0.15,
      top: 0.15,
      bottom: 0.15,
      header: 0.1,
      footer: 0.1,
    },
  };
  ws.views = [{ showGridLines: false, zoomScale: 70 }];

  // ── Column widths (exact from template) ──────────────────────────────────
  ws.columns = [
    { width: 4.55 }, // A spacer
    { width: 23.22 }, // B — Earning Head / emp label-left
    { width: 16.44 }, // C — Gross Salary / emp value-left pt1
    { width: 20.78 }, // D — Gross Salary (d) / emp value-left pt2
    { width: 15.0 }, // E — Deduction Head pt1 / emp label-right pt1
    { width: 9.44 }, // F — Deduction Head pt2 / emp label-right pt2
    { width: 17.44 }, // G — Amount span / emp value-right pt1
    { width: 5.44 }, // H — Amount pt1 / emp value-right pt2
    { width: 18.44 }, // I — Amount pt2 / emp value-right pt3
  ];

  // ── Row heights (exact from template in pt) ───────────────────────────────
  ws.getRow(1).height = 28.5; // top spacer
  ws.getRow(2).height = 28.5; // company name     — matches H_HDR_ROW
  ws.getRow(3).height = 28.5; // address          — matches H_HDR_ROW
  ws.getRow(4).height = 28.5; // website          — matches H_HDR_ROW (PDF uses H_HDR_ROW*3 total for rows 2-4)
  ws.getRow(5).height = 38.25; // banner           — matches H_BANNER
  for (let r = 6; r <= 15; r++) ws.getRow(r).height = 28.5; // emp rows + table hdr — matches H_EMP
  ws.getRow(16).height = 28.5; // Basic / PF       — matches H_R16
  ws.getRow(17).height = 28.5; // HRA / PT         — matches H_R17
  ws.getRow(18).height = 32.25; // Org Allow / Other — matches H_R18
  ws.getRow(19).height = 31.5; // Medical / TDS    — matches H_R19
  ws.getRow(20).height = 28.5; // blank / Advance  — matches H_R20
  ws.getRow(21).height = 28.5; // Total Earning / Total Deduction — matches H_R21
  ws.getRow(22).height = 31.2; // Perf Pay / Net Salary — matches H_R22
  ws.getRow(23).height = 45.0; // Total Earning Potential / Perf Pay Variable — matches H_R23
  ws.getRow(24).height = 28.5; // dark section     — matches H_R24
  ws.getRow(25).height = 28.5; // spacer           — matches H_R25
  ws.getRow(26).height = 28.5; // footer           — matches H_R26

  ws.pageSetup.printArea = "B2:I26";

  // ── Border / Fill / Alignment / Font constants ────────────────────────────
  // Matches PDF: cThin=[110,110,110] → ARGB FF6E6E6E; cMed=[50,50,50] → ARGB FF323232
  const thin = { style: "thin", color: { argb: "FF6E6E6E" } };
  const medium = { style: "medium", color: { argb: "FF323232" } };
  const thinB = { top: thin, left: thin, bottom: thin, right: thin };
  const medB = { top: medium, left: medium, bottom: medium, right: medium };

  // Matches PDF: cHdr=[231,230,230]=E7E6E6; cDarkBg=[68,84,106]=44546A; cWhite=FFFFFF
  const sf = (argb) => ({
    type: "pattern",
    pattern: "solid",
    fgColor: { argb },
  });
  const fillHdr = sf("FFE7E6E6"); // lt2 — header bg, table-header bg, row-6 bg, footer
  const fillDark = sf("FF44546A"); // dk2 — Total Earning dark row
  const fillW = sf("FFFFFFFF"); // white

  const cM = { horizontal: "center", vertical: "middle", wrapText: true };
  const lM = {
    horizontal: "left",
    vertical: "middle",
    wrapText: true,
    indent: 1,
  };

  // numFmt matches inr() function: "Rs. " prefix + Indian locale formatting
  const numFmt = '"Rs. "#,##0.00';

  // Fonts — match PDF font sizes and bold states
  // PDF uses helvetica; Excel uses Calibri (closest match)
  const fN = { size: 9, name: "Calibri" }; // normal — matches PDF sz 7.5–8, normal
  const fB = { bold: true, size: 9, name: "Calibri" }; // bold   — matches PDF bold cells
  const fB11 = { bold: true, size: 11, name: "Calibri" }; // banner
  const fB14 = { bold: true, size: 14, name: "Calibri" }; // company name
  const fGray = { size: 9, name: "Calibri", color: { argb: "FF5A5A5A" } }; // cGray=[90,90,90] — address
  const fWeb = { size: 9, name: "Calibri", color: { argb: "FF0563C1" } }; // cLink=[5,99,193] — website
  const fWht = {
    bold: true,
    size: 9,
    name: "Calibri",
    color: { argb: "FFFFFFFF" },
  }; // cWhite — dark row text
  const fBBlue = {
    bold: true,
    size: 14,
    name: "Calibri",
    color: { argb: "FF1A3C6E" },
  }; // cBlue=[26,60,110] — company name

  // ── Cell helper ───────────────────────────────────────────────────────────
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

  // ── Load logo ─────────────────────────────────────────────────────────────
  const logoInfo = await loadImageBase64("/assets/Insta-logo1.png");

  // ==========================================================================
  // HEADER BLOCK rows 2–4
  // PDF: one medBox around entire header block (rows 2–4 combined = H_HDR)
  // Excel replicates with per-cell medium borders on outer edges only.
  //
  // PDF structure: B:C = logo zone (wB+wC), D:I = company info (wD:wI)
  // Excel: rows 2,3,4 — B:C hold logo image, D:I merged per row for text
  // ==========================================================================
  for (let r = 2; r <= 4; r++) {
    for (const col of ["B", "C", "D", "E", "F", "G", "H", "I"]) {
      ws.getCell(`${col}${r}`).fill = fillW;
    }
    // Left edge: medium on B (left side of logo zone)
    ws.getCell(`B${r}`).border = {
      top: r === 2 ? medium : undefined,
      bottom: r === 4 ? medium : undefined,
      left: medium,
      right: undefined,
    };
    // C spans logo zone — no right divider inside logo zone
    ws.getCell(`C${r}`).border = {
      top: r === 2 ? medium : undefined,
      bottom: r === 4 ? medium : undefined,
      left: undefined,
      right: undefined,
    };
    // D–H interior — only top/bottom outer edges
    for (const col of ["D", "E", "F", "G", "H"]) {
      ws.getCell(`${col}${r}`).border = {
        top: r === 2 ? medium : undefined,
        bottom: r === 4 ? medium : undefined,
        left: undefined,
        right: undefined,
      };
    }
    // Right edge: medium on I
    ws.getCell(`I${r}`).border = {
      top: r === 2 ? medium : undefined,
      bottom: r === 4 ? medium : undefined,
      left: undefined,
      right: medium,
    };
  }

  // Logo image — same aspect-ratio logic as PDF, placed in B:C zone (cols 1–2 = indices 1.1–2.9)
  if (logoInfo) {
    const b64 = logoInfo.dataUrl.split(",")[1];
    const imgId = wb.addImage({ base64: b64, extension: "png" });
    ws.addImage(imgId, {
      tl: { col: 1.1, row: 1.45 },
      br: { col: 2.9, row: 3.55 },
      editAs: "absolute",
    });
  }

  // Row 2 — Company name: D2:I2 merged — matches PDF: fBBlue, bold, left-aligned
  ws.mergeCells("D2:I2");
  set("D2", "Insta ICT Solutions Pvt. Ltd.", {
    font: fBBlue,
    fill: fillW,
    alignment: lM,
    border: { top: medium, left: undefined, bottom: undefined, right: medium },
  });

  // Row 3 — Address: D3:I3 merged — matches PDF: fGray, normal, left-aligned
  ws.mergeCells("D3:I3");
  set(
    "D3",
    "201 - 202, Imperial Plaza, Jijai Nagar, Kothrud, Pune - 411 038.",
    {
      font: fGray,
      fill: fillW,
      alignment: lM,
      border: {
        top: undefined,
        left: undefined,
        bottom: undefined,
        right: medium,
      },
    },
  );

  // Row 4 — Website: D4:I4 merged — matches PDF: fWeb (blue link color), normal, left-aligned
  ws.mergeCells("D4:I4");
  set("D4", "Website: www.instagrp.com.", {
    font: fWeb,
    fill: fillW,
    alignment: lM,
    border: { top: undefined, left: undefined, bottom: medium, right: medium },
  });

  // ==========================================================================
  // BANNER row 5 — B5:I5 merged
  // PDF: fillW bg, medBox border, bold 11pt, center, "Payslip: {forMonth}"
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
  // PDF per row:
  //   B  = label-left  (bold, center, cBlack) — bg cHdr on row 0 else cWhite; isMed on row 0
  //   C:D merged = value-left (center, cDark) — bold only on row 0 (vBold)
  //   E:F merged = label-right (bold, center, cBlack)
  //   G:I merged = value-right (center, cDark) — bold only on row 0
  //
  // NOTE: PDF uses E:F for label-right (wE+wF), G:I for value-right (wG+wH+wI)
  // Excel: E:F merged = label-right, G:I merged = value-right
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
    // Row 6 (i=0): bg=cHdr, vBold=true, isMed=true — matches PDF exactly
    const bg = i === 0 ? fillHdr : fillW;
    const fv = i === 0 ? fB : fN; // value bold only on row 6
    const brd = i === 0 ? medB : thinB; // medium border on row 6, thin on rest

    // B = label-left — bold, center
    set(`B${r}`, l1, { font: fB, fill: bg, alignment: cM, border: brd });

    // C:D merged = value-left — center; bold on row 6 only
    ws.mergeCells(`C${r}:D${r}`);
    set(`C${r}`, v1 ?? "", { font: fv, fill: bg, alignment: cM, border: brd });

    // E:F merged = label-right — bold, center
    // PDF: xE to wE+wF (cols E and F merged)
    ws.mergeCells(`E${r}:F${r}`);
    set(`E${r}`, l2, { font: fB, fill: bg, alignment: cM, border: brd });

    // G:I merged = value-right — center; bold on row 6 only
    // PDF: xG to wG+wH+wI (cols G, H, I merged)
    ws.mergeCells(`G${r}:I${r}`);
    set(`G${r}`, v2 ?? "", { font: fv, fill: bg, alignment: cM, border: brd });
  });

  // ==========================================================================
  // TABLE HEADER row 15
  // PDF: B=Earning Head | C=Gross Salary | D=Gross Salary(d) | E:G=Deduction Head | H:I=Amount
  // All cells: fillHdr bg, bold, center, medB border
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
  // E:G merged = Deduction Head — matches PDF xE to wE+wF+wG
  ws.mergeCells("E15:G15");
  set("E15", "Deduction Head", {
    font: fB,
    fill: fillHdr,
    alignment: cM,
    border: medB,
  });
  // H:I merged = Amount — matches PDF xH to wH+wI
  ws.mergeCells("H15:I15");
  set("H15", "Amount", {
    font: fB,
    fill: fillHdr,
    alignment: cM,
    border: medB,
  });

  // ==========================================================================
  // DATA ROWS 16–20
  // PDF earning cols: B=label | C=grossSalary(full) | D=grossSalary(d)
  // PDF deduction cols: E:G merged=label | H:I merged=amount
  // All cells: fillW, thinB, fN (normal)
  //
  // Earning labels match PDF earnRows exactly:
  //   16=Basic | 17=HRA | 18=Organization Allowance | 19=Medical\nAllowance | 20=(blank)
  //
  // Deduction labels match PDF dedRows exactly:
  //   16=PF (Employee + Employer) | 17=PT | 18=Other | 19=TDS | 20=Advance
  //
  // Values match _buildData exactly:
  //   C col = gross (full month): basic, hra, oA, mA, null
  //   D col = gross (d, pro-rated): basicD, hraD, oaD, maD, null
  //   H col (deduction amount): pfEmp+pfCo, pt, other, tds, advance
  // ==========================================================================
  const earnData = [
    // [label, grossFull, grossD]
    ["Basic", d.basic, d.basicD], // row 16
    ["HRA", d.hra, d.hraD], // row 17
    ["Organization Allowance", d.organisationAllowance, d.oaD], // row 18
    ["Medical\nAllowance", d.medicalAllowance, d.maD], // row 19
    ["", null, null], // row 20 — blank earning
  ];
  const dedData = [
    // [label, amount] — matches PDF dedRows
    ["PF (Employee + Employer)", d.pfEmp + d.pfCo], // row 16
    ["PT", d.pt], // row 17
    ["Other", d.other], // row 18
    ["TDS", d.tds], // row 19
    ["Advance", d.advance], // row 20
  ];

  for (let i = 0; i < 5; i++) {
    const r = 16 + i;
    const [eL, eG, eGD] = earnData[i];
    const [dL, dA] = dedData[i];

    // B = earning label — matches PDF: normal, center, white bg, thin border
    set(`B${r}`, eL || "", {
      font: fN,
      fill: fillW,
      alignment: cM,
      border: thinB,
    });

    // C = gross salary (full month) — matches PDF inrTxt(eG, ...)
    // Use actual value (not formula) to match PDF computed values
    set(`C${r}`, eG !== null ? eG : null, {
      font: fN,
      fill: fillW,
      alignment: cM,
      border: thinB,
      numFmt,
    });

    // D = gross salary (pro-rated/d) — matches PDF inrTxt(eGd, ...)
    set(`D${r}`, eGD !== null ? eGD : null, {
      font: fN,
      fill: fillW,
      alignment: cM,
      border: thinB,
      numFmt,
    });

    // E:G merged = deduction label — matches PDF: xE to wE+wF+wG, center, normal
    ws.mergeCells(`E${r}:G${r}`);
    set(`E${r}`, dL || "", {
      font: fN,
      fill: fillW,
      alignment: cM,
      border: thinB,
    });

    // H:I merged = deduction amount — matches PDF: xH to wH+wI, inrTxt center
    ws.mergeCells(`H${r}:I${r}`);
    set(`H${r}`, dA !== null ? dA : null, {
      font: fN,
      fill: fillW,
      alignment: cM,
      border: thinB,
      numFmt,
    });
  }

  // ==========================================================================
  // ROW 21 — Total Earning / Total Deduction
  // PDF: B=bold "Total Earning" | C=grossSalary(bold) | D=grossSalaryD(bold)
  //      E:G merged=normal "Total Deduction" | H:I merged=totalDeduction(normal)
  // Medium bottom border (PDF redraws a thick line at Y_AFTER_R21)
  // ==========================================================================
  // Border: thin top/sides, medium bottom — matches PDF's medium redraw line after R21
  const r21bot = { top: thin, left: thin, bottom: medium, right: thin };
  const r21botL = { top: thin, left: medium, bottom: medium, right: thin }; // B21 left=medium (outer edge)
  const r21botR = { top: thin, left: thin, bottom: medium, right: medium }; // H21 right=medium (outer edge)

  // B21 — bold "Total Earning", matches PDF: txt("Total Earning", bold=true)
  set("B21", "Total Earning", {
    font: fB,
    fill: fillW,
    alignment: cM,
    border: r21botL,
  });
  // C21 — grossSalary (bold), matches PDF: inrTxt(d.grossSalary, bold=true)
  set("C21", d.grossSalary, {
    font: fB,
    fill: fillW,
    alignment: cM,
    border: r21bot,
    numFmt,
  });
  // D21 — grossSalaryD (bold), matches PDF: inrTxt(d.grossSalaryD, bold=true)
  set("D21", d.grossSalaryD, {
    font: fB,
    fill: fillW,
    alignment: cM,
    border: r21bot,
    numFmt,
  });
  // E:G merged — "Total Deduction" (normal), matches PDF: txt("Total Deduction", bold=false)
  ws.mergeCells("E21:G21");
  set("E21", "Total Deduction", {
    font: fN,
    fill: fillW,
    alignment: cM,
    border: r21bot,
  });
  // H:I merged — totalDeduction (normal), matches PDF: inrTxt(d.totalDeduction, bold=false)
  ws.mergeCells("H21:I21");
  set("H21", d.totalDeduction, {
    font: fN,
    fill: fillW,
    alignment: cM,
    border: r21botR,
    numFmt,
  });

  // ==========================================================================
  // ROW 22 — Performance Pay / Net Salary
  // PDF:
  //   B  = normal, mtxt(["Performance Pay","Variable pay"])
  //   C  = normal, inrTxt(d.performancePay)
  //   D  = normal, inrTxt(d.perfD)          ← perfD = performancePay * (pDays/monthDays)
  //   E:G merged = bold, "Net Salary", medB
  //   H:I merged = bold, inrTxt(d.netSalary) where netSalary = grossSalaryD - totalDeduction
  //
  // FIX vs original: D22 was formula with hardcoded monthDays/pDays — now uses d.perfD directly
  // FIX vs original: C22 was `d.performancePay || null` — now always shows value (matches PDF)
  // Net Salary cell: medB (medium all sides) — matches PDF isMed=true for that cell
  // ==========================================================================
  set("B22", "Performance Pay\nVariable pay", {
    font: fN,
    fill: fillW,
    alignment: cM,
    border: thinB,
  });
  // C22 — performancePay (full month), matches PDF: inrTxt(d.performancePay, bold=false)
  set("C22", d.performancePay, {
    font: fN,
    fill: fillW,
    alignment: cM,
    border: thinB,
    numFmt,
  });
  // D22 — perfD (pro-rated), matches PDF: inrTxt(d.perfD, bold=false)
  // perfD = performancePay * ratio = performancePay * (pDays/monthDays)
  set("D22", d.perfD, {
    font: fN,
    fill: fillW,
    alignment: cM,
    border: thinB,
    numFmt,
  });
  // E:G merged — "Net Salary", bold, medB — matches PDF: cell(... cWhite, true) + txt("Net Salary", bold=true)
  ws.mergeCells("E22:G22");
  set("E22", "Net Salary", {
    font: fB,
    fill: fillW,
    alignment: cM,
    border: medB,
  });
  // H:I merged — netSalary, bold, medB — matches PDF: cell(... cWhite, true) + inrTxt(d.netSalary, bold=true)
  // netSalary = grossSalaryD - totalDeduction = D21 - H21 in Excel terms
  ws.mergeCells("H22:I22");
  set("H22", d.netSalary, {
    font: fB,
    fill: fillW,
    alignment: cM,
    border: medB,
    numFmt,
  });

  // ==========================================================================
  // ROW 23 — Total Earning Potential / Performance Pay (Variable)
  // PDF:
  //   B  = bold, mtxt(["Total Earning"," Potential"])
  //   C  = bold, inrTxt(d.totalEarning)     ← totalEarning = grossSalary + performancePay
  //   D  = bold, inrTxt(d.totalEarningD)    ← totalEarningD = grossSalaryD + perfD
  //   E:G merged = normal, mtxt(["Performance Pay","Variable pay"])
  //   H:I merged = normal, inrTxt(d.perfD)  ← same perfD as D22
  // ==========================================================================
  set("B23", "Total Earning\n Potential", {
    font: fB,
    fill: fillW,
    alignment: cM,
    border: thinB,
  });
  // C23 — totalEarning = grossSalary + performancePay, matches PDF: inrTxt(d.totalEarning, bold=true)
  set("C23", d.totalEarning, {
    font: fB,
    fill: fillW,
    alignment: cM,
    border: thinB,
    numFmt,
  });
  // D23 — totalEarningD = grossSalaryD + perfD, matches PDF: inrTxt(d.totalEarningD, bold=true)
  set("D23", d.totalEarningD, {
    font: fB,
    fill: fillW,
    alignment: cM,
    border: thinB,
    numFmt,
  });
  // E:G merged — "Performance Pay / Variable pay" (normal), matches PDF: mtxt(["Performance Pay","Variable pay"], bold=false)
  ws.mergeCells("E23:G23");
  set("E23", "Performance Pay\nVariable pay", {
    font: fN,
    fill: fillW,
    alignment: cM,
    border: thinB,
  });
  // H:I merged — perfD (normal), matches PDF: inrTxt(d.perfD, bold=false)
  ws.mergeCells("H23:I23");
  set("H23", d.perfD, {
    font: fN,
    fill: fillW,
    alignment: cM,
    border: thinB,
    numFmt,
  });

  // ==========================================================================
  // ROW 24 — Total Earning DARK SECTION
  // PDF:
  //   B  = cell(cWhite) — white, thin border
  //   C  = cell(cWhite) — white, thin border
  //   D  = cell(cWhite) — white, thin border
  //   E:G merged = cDarkBg (44546A), bold white "Total Earning", medB
  //   H:I merged = cDarkBg (44546A), bold white inrTxt(d.totalWithPerf) where totalWithPerf = netSalary + perfD
  //
  // FIX vs original: B24 left border should be medium (outer edge), not mixed
  // ==========================================================================
  // B24 — white, outer left=medium
  set("B24", null, {
    fill: fillW,
    border: { top: thin, left: medium, bottom: thin, right: thin },
  });
  // C24, D24 — white, thin all sides
  set("C24", null, { fill: fillW, border: thinB });
  set("D24", null, { fill: fillW, border: thinB });
  // E:G merged — dark bg, white bold "Total Earning", matches PDF: cell(cDarkBg, true) + txt("Total Earning", bold=true, cWhite)
  ws.mergeCells("E24:G24");
  set("E24", "Total Earning", {
    font: fWht,
    fill: fillDark,
    alignment: cM,
    border: { top: thin, left: thin, bottom: thin, right: thin },
  });
  // H:I merged — dark bg, white bold totalWithPerf, matches PDF: cell(cDarkBg, true) + inrTxt(d.totalWithPerf, bold=true, cWhite)
  // totalWithPerf = netSalary + perfD = H22 + H23
  ws.mergeCells("H24:I24");
  set("H24", d.totalWithPerf, {
    font: fWht,
    fill: fillDark,
    alignment: cM,
    border: { top: thin, left: thin, bottom: thin, right: medium }, // right=medium (outer edge)
    numFmt,
  });

  // ==========================================================================
  // ROW 25 — Spacer
  // PDF: fillR(cWhite) + medBox — one clean empty box, no internal vertical lines
  // Excel: merge B25:I25 so there are zero internal vertical dividers, just outer medium border
  // ==========================================================================
  ws.mergeCells("B25:I25");
  set("B25", null, {
    fill: fillW,
    border: medB,
  });

  // ==========================================================================
  // ROW 26 — Footer
  // PDF: fillR(cHdr=E7E6E6) + medBox + bold center '"This is computer generated payslip"'
  // Excel: B26:I26 merged, fillHdr, medB, bold center — exact match
  // ==========================================================================
  ws.mergeCells("B26:I26");
  set("B26", '"This is computer generated payslip"', {
    font: fB,
    fill: fillHdr,
    alignment: cM,
    border: medB,
  });

  // ==========================================================================
  // OUTER BORDER PASS — enforce outermost medium edges without overwriting inner borders
  // Matches PDF's overall medBox drawn around the entire document
  // ==========================================================================
  for (let r = 2; r <= 26; r++) {
    for (let ci = 2; ci <= 9; ci++) {
      const cell = ws.getRow(r).getCell(ci);
      const b = Object.assign({}, cell.border || {});
      if (r === 2 && !b.top) b.top = medium;
      if (r === 26 && !b.bottom) b.bottom = medium;
      if (ci === 2 && !b.left) b.left = medium;
      if (ci === 9 && !b.right) b.right = medium;
      cell.border = b;
    }
  }

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
