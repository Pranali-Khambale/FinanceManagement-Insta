// src/Ui/Payroll/PayslipGenerator.js
// PDF  → downloadPayslipPDF(employee)
// Excel → downloadPayslipExcel(employee)

/* ─── Normalize DB snake_case → camelCase ───────────────────────────────── */
function _normalizeEmployee(emp) {
  return {
    ...emp,
    employeeId:             emp.employeeId            || emp.employee_id             || "",
    joiningDate:            emp.joiningDate           || emp.joining_date             || "",
    currentLocation:        emp.currentLocation       || emp.circle                   || "",
    project:                emp.project               || emp.project_name             || "",
    designation:            emp.designation           || emp.position                 || "",
    grade:                  emp.grade                 || "",
    forMonth:               emp.forMonth              || emp.for_month                || "",
    uanNo:                  emp.uanNo                 || emp.uan_number               || "",
    aadharNo:               emp.aadharNo              || emp.aadhar_number            || "",
    panNo:                  emp.panNo                 || emp.pan_number               || "",
    bankName:               emp.bankName              || emp.bank_name                || "",
    bankAccountNo:          emp.bankAccountNo         || emp.account_number           || "",
    ifscCode:               emp.ifscCode              || emp.ifsc_code                || "",
    basic:                  emp.basic                 || emp.basic_salary             || 0,
    hra:                    emp.hra                   || 0,
    organisationAllowance:  emp.organisationAllowance || emp.other_allowances         || 0,
    performancePay:         emp.performancePay        || emp.performance_pay          || 0,
    pfDeduction:            emp.pfDeduction           || emp.pf_deduction             || null,
    employerPfContribution: emp.employerPfContribution|| emp.employer_pf_contribution || null,
    pt:                     emp.pt                    || 0,
    gratuity:               emp.gratuity              || null,
    pDays:                  emp.pDays                 || emp.p_days                   || null,
    monthDays:              emp.monthDays             || emp.month_days               || 30,
    aDays:                  emp.aDays                 || emp.a_days                   || 0,
    gender:                 emp.gender                || "",
  };
}

/* ─── Build computed data ───────────────────────────────────────────────── */
function _buildData(emp) {
  const n = (v) => { const x = Number(v); return isFinite(x) ? x : 0; };
  const fmtDate = (v) => {
    if (!v) return "";
    const d = new Date(v);
    if (isNaN(d.getTime())) return String(v);
    return `${String(d.getUTCDate()).padStart(2,"0")}-${String(d.getUTCMonth()+1).padStart(2,"0")}-${d.getUTCFullYear()}`;
  };

  const basic                 = n(emp.basic);
  const hra                   = n(emp.hra);
  const organisationAllowance = n(emp.organisationAllowance);
  const performancePay        = n(emp.performancePay);
  const monthDays             = n(emp.monthDays) || 30;
  const pDays                 = emp.pDays != null ? n(emp.pDays) : monthDays;
  const aDays                 = n(emp.aDays);

  const pfEmp = emp.pfDeduction != null            ? n(emp.pfDeduction)            : Math.round(basic * 0.12);
  const pfCo  = emp.employerPfContribution != null ? n(emp.employerPfContribution) : Math.round(basic * 0.13);
  const isFemale  = /female|woman|^f$/i.test(emp.gender || "");
  const grossFull = basic + hra + organisationAllowance;
  const pt = (emp.pt != null && n(emp.pt) !== 0) ? n(emp.pt)
           : (isFemale && grossFull <= 25000) ? 0
           : /february/i.test(emp.forMonth || "") ? 300 : 200;
  const gratuity = emp.gratuity != null ? n(emp.gratuity) : Math.round(basic * 0.0481 * 100) / 100;

  const ratio        = monthDays > 0 ? pDays / monthDays : 1;
  const grossSalary  = basic + hra + organisationAllowance;
  const basicD       = basic * ratio;
  const hraD         = hra   * ratio;
  const oaD          = organisationAllowance * ratio;
  const grossSalaryD = grossSalary * ratio;
  const perfD        = performancePay * ratio;

  const totalDeduction = pfEmp + pfCo + pt + gratuity;
  const netSalary      = grossSalaryD - totalDeduction;
  const totalWithPerf  = netSalary + perfD;
  const totalEarning   = grossSalary + performancePay;
  const totalEarningD  = grossSalaryD + perfD;

  return {
    name: emp.name || "", employeeId: emp.employeeId || "",
    joiningDate: fmtDate(emp.joiningDate),
    currentLocation: emp.currentLocation || "", project: emp.project || "",
    designation: emp.designation || "", grade: emp.grade || "",
    uanNo: emp.uanNo || "", aadharNo: emp.aadharNo || "", panNo: emp.panNo || "",
    forMonth: emp.forMonth || "", bankName: emp.bankName || "",
    bankAccountNo: emp.bankAccountNo || "", ifscCode: emp.ifscCode || "",
    pDays, aDays, monthDays,
    basic, hra, organisationAllowance, performancePay,
    pfEmp, pfCo, pt, gratuity,
    grossSalary, grossSalaryD, basicD, hraD, oaD, perfD,
    totalEarning, totalEarningD, totalDeduction, netSalary, totalWithPerf,
  };
}

/* ─── INR formatter ─────────────────────────────────────────────────────── */
const inr = (num) =>
  "Rs. " + Number(num || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

/* ─── Load logo as base64 ────────────────────────────────────────────────── */
const loadImageBase64 = (src) =>
  new Promise((res) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const c = document.createElement("canvas");
      c.width = img.naturalWidth; c.height = img.naturalHeight;
      c.getContext("2d").drawImage(img, 0, 0);
      res({ dataUrl: c.toDataURL("image/png"), w: img.naturalWidth, h: img.naturalHeight });
    };
    img.onerror = () => res(null);
    img.src = src;
  });

/* =============================================================================
   PDF PAYSLIP
   ============================================================================= */
export const downloadPayslipPDF = async (employee) => {
  const d = _buildData(_normalizeEmployee(employee));

  if (!window.jspdf) {
    await new Promise((res, rej) => {
      const s = document.createElement("script");
      s.src = "https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js";
      s.onload = res; s.onerror = rej;
      document.head.appendChild(s);
    });
  }

  const { jsPDF } = window.jspdf;
  const logoInfo  = await loadImageBase64("/assets/Insta-logo1.png");
  const doc       = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

  // ── Page geometry ─────────────────────────────────────────────────────────
  const ML = 14;              // left margin
  const MR = 14;              // right margin
  const PW = 210 - ML - MR;  // printable width = 182 mm

  // ── 5-column body widths (matches screenshot proportions exactly) ──────────
  const cA = 40;                          // Earning Head
  const cB = 30;                          // Gross Salary
  const cC = 30;                          // Gross Salary (d)
  const cD = 54;                          // Deduction Head
  const cE = PW - cA - cB - cC - cD;     // Amount ≈ 28 mm
  const xA = ML;
  const xB = xA + cA;
  const xC = xB + cB;
  const xD = xC + cC;
  const xE = xD + cD;

  // ── Header: 1/3 logo | 2/3 company info ───────────────────────────────────
  const HDR_LW = Math.round(PW * 0.34);  // logo block width ≈ 62 mm
  const HDR_RW = PW - HDR_LW;            // company info width ≈ 120 mm
  const HDR_RX = ML + HDR_LW;

  // ── Row heights ───────────────────────────────────────────────────────────
  const RH = {
    hdr:    32,
    banner:  8,
    emp:     6.8,
    thdr:    7.5,
    row:     7,
    tot:     7,
    perf:    8,
    pot:     8,
    dark:    7,
    spc:     2,
    ftr:     7,
  };

  // ── Colours ───────────────────────────────────────────────────────────────
  const cWHITE  = [255, 255, 255];
  const cLGREY  = [231, 230, 230];
  const cDARK   = [68,  84,  106];
// Professional soft borders
const cOUTER = [70, 70, 70];     // outer frame
const cSECT  = [110, 110, 110];  // section borders
const cINNER = [160, 160, 160];  // inner cell borders
const cDIV   = [140, 140, 140];  // header divider
  const cBLUE   = [26,  60,  110];
  const cGREY   = [100, 100, 100];
  const cLINK   = [5,   99,  193];
  const cBLACK  = [0,   0,   0];
  const cTXT    = [40,  40,  40];
  const cWHT    = [255, 255, 255];

  // ── Drawing helpers ───────────────────────────────────────────────────────
  const fillR  = (x, y, w, h, rgb) => { doc.setFillColor(...rgb); doc.rect(x, y, w, h, "F"); };
  const strokeR = (x, y, w, h, rgb, lw) => { doc.setDrawColor(...rgb); doc.setLineWidth(lw); doc.rect(x, y, w, h, "S"); };

 const cell = (x, y, w, h, bg, borderC = cINNER, lw = 0.55) => {
  // Background
  doc.setFillColor(...bg);
  doc.rect(x, y, w, h, "F");

  // Border settings
  doc.setDrawColor(...borderC);
  doc.setLineWidth(lw);

  // Draw all borders properly
  doc.line(x, y, x + w, y);           // top
  doc.line(x, y + h, x + w, y + h);  // bottom
  doc.line(x, y, x, y + h);          // left
  doc.line(x + w, y, x + w, y + h);  // right
};

  const txt = (s, x, y, w, h, bold, sz, col, align = "left", pad = 2.2) => {
    if (s == null || s === "") return;
    doc.setFont("helvetica", bold ? "bold" : "normal");
    doc.setFontSize(sz);
    doc.setTextColor(...col);
    const ty = y + h * 0.64;
    const st = String(s);
    if (align === "center") doc.text(st, x + w / 2, ty, { align: "center" });
    else if (align === "right") doc.text(st, x + w - 1.5, ty, { align: "right" });
    else doc.text(st, x + pad, ty);
  };

  const mtxt = (lines, x, y, w, h, bold, sz, col, align = "left") => {
    doc.setFont("helvetica", bold ? "bold" : "normal");
    doc.setFontSize(sz);
    doc.setTextColor(...col);
    const lh  = sz * 0.44;
    const tot = (lines.length - 1) * lh;
    let ty    = y + (h - tot) / 2 + sz * 0.18;
    for (const ln of lines) {
      const st = String(ln ?? "");
      if (align === "center") doc.text(st, x + w / 2, ty, { align: "center" });
      else if (align === "right") doc.text(st, x + w - 1.5, ty, { align: "right" });
      else doc.text(st, x + 2.2, ty);
      ty += lh;
    }
  };

  const inrT = (v, x, y, w, h, bold, sz, col = cTXT) =>
    txt(inr(v), x, y, w, h, bold, sz, col, "center");

  let Y = 10;
  const YTOP = Y;

  /* ── HEADER ──────────────────────────────────────────────────────────────── */
  fillR(ML, Y, PW, RH.hdr, cWHITE);

  // outer header box
  strokeR(ML, Y, PW, RH.hdr, cOUTER, 0.45);
  // vertical divider between logo and company info
  doc.setDrawColor(...cDIV);
  doc.setLineWidth(0.35);
  doc.line(HDR_RX, Y, HDR_RX, Y + RH.hdr);

  // LOGO — aspect-ratio fit, centred in left block with padding
  if (logoInfo) {
    const px = 4, py = 3;
    const mw = HDR_LW - px * 2;
    const mh = RH.hdr - py * 2;
    const asp = logoInfo.w / logoInfo.h;
    let iw = mw, ih = iw / asp;
    if (ih > mh) { ih = mh; iw = ih * asp; }
    const ix = ML + (HDR_LW - iw) / 2;
    const iy = Y  + (RH.hdr - ih) / 2;
    doc.addImage(logoInfo.dataUrl, "PNG", ix, iy, iw, ih, undefined, "FAST");
  } else {
    txt("LOGO", ML, Y, HDR_LW, RH.hdr, true, 9, [180, 180, 180], "center");
  }

  // COMPANY INFO — 3 lines evenly spaced in right 2/3 block
  const rx  = HDR_RX + 4;
  const ly1 = Y + RH.hdr * 0.23;
  const ly2 = Y + RH.hdr * 0.52;
  const ly3 = Y + RH.hdr * 0.79;

  doc.setFont("helvetica", "bold");   doc.setFontSize(11);  doc.setTextColor(...cBLUE);
  doc.text("Insta ICT Solutions Pvt. Ltd.", rx, ly1);

  doc.setFont("helvetica", "normal"); doc.setFontSize(8);   doc.setTextColor(...cGREY);
  doc.text("201 - 202, Imperial Plaza, Jijai Nagar, Kothrud, Pune - 411 038.", rx, ly2);

  doc.setFont("helvetica", "normal"); doc.setFontSize(8);   doc.setTextColor(...cLINK);
  doc.text("Website: www.instagrp.com", rx, ly3);

  Y += RH.hdr;

  /* ── BANNER ──────────────────────────────────────────────────────────────── */
  cell(ML, Y, PW, RH.banner, cWHITE, cSECT, 0.5);
  txt(`Payslip: ${d.forMonth}`, ML, Y, PW, RH.banner, true, 11, cBLACK, "center");
  Y += RH.banner;

  /* ── EMPLOYEE INFO ───────────────────────────────────────────────────────── */
  // cols: label1=40, value1=51, label2=50, value2=41
  const eL1 = 40, eV1 = 51, eL2 = 50, eV2 = PW - eL1 - eV1 - eL2;
  const eX1 = ML, eX2 = eX1 + eL1, eX3 = eX2 + eV1, eX4 = eX3 + eL2;

  const empInfo = [
    ["Employee Id",  d.employeeId,    "Name",             d.name],
    ["Joining Date", d.joiningDate,   "Current Location", d.currentLocation],
    ["P Days",       d.pDays,         "Project",          d.project],
    ["A Days",       d.aDays,         "Designation",      d.designation],
    ["Month Days",   d.monthDays,     "Grade",            d.grade],
    ["UAN No",       d.uanNo,         "Aadhar No",        d.aadharNo],
    ["PAN No",       d.panNo,         "For Month",        d.forMonth],
    ["Bank Name",    d.bankName,      "Bank A/c No",      d.bankAccountNo],
  ];

  empInfo.forEach(([l1, v1, l2, v2], i) => {
    const bg = i === 0 ? cLGREY : cWHITE;
    const bc = i === 0 ? cSECT  : cINNER;
    const bw = i === 0 ? 0.4    : 0.4;
    cell(eX1, Y, eL1, RH.emp, bg, bc, bw); txt(l1,            eX1, Y, eL1, RH.emp, true,  7.5, cBLACK, "left");
    cell(eX2, Y, eV1, RH.emp, bg, bc, bw); txt(String(v1??""),eX2, Y, eV1, RH.emp, i===0, 7.5, cTXT,   "center");
    cell(eX3, Y, eL2, RH.emp, bg, bc, bw); txt(l2,            eX3, Y, eL2, RH.emp, true,  7.5, cBLACK, "left");
    cell(eX4, Y, eV2, RH.emp, bg, bc, bw); txt(String(v2??""),eX4, Y, eV2, RH.emp, i===0, 7.5, cTXT,   "center");
    Y += RH.emp;
  });

  /* ── TABLE COLUMN HEADERS ────────────────────────────────────────────────── */
  cell(xA, Y, cA, RH.thdr, cLGREY, cSECT, 0.5); txt("Earning Head",     xA, Y, cA, RH.thdr, true, 8,   cBLACK, "center");
  cell(xB, Y, cB, RH.thdr, cLGREY, cSECT, 0.5); txt("Gross Salary",     xB, Y, cB, RH.thdr, true, 8,   cBLACK, "center");
  cell(xC, Y, cC, RH.thdr, cLGREY, cSECT, 0.5); txt("Gross Salary (d)", xC, Y, cC, RH.thdr, true, 7.5, cBLACK, "center");
  cell(xD, Y, cD, RH.thdr, cLGREY, cSECT, 0.5); txt("Deduction Head",   xD, Y, cD, RH.thdr, true, 8,   cBLACK, "center");
  cell(xE, Y, cE, RH.thdr, cLGREY, cSECT, 0.5); txt("Amount",           xE, Y, cE, RH.thdr, true, 8,   cBLACK, "center");
  Y += RH.thdr;

  /* ── DATA ROWS ───────────────────────────────────────────────────────────── */
  const earnRows = [
    ["Basic",                  d.basic,                d.basicD],
    ["HRA",                    d.hra,                  d.hraD],
    ["Organization Allowance", d.organisationAllowance,d.oaD],
  ];
  const dedRows = [
    ["PF (Employee + Employer)", d.pfEmp + d.pfCo],
    ["PT",                       d.pt],
    ["Gratuity",                 d.gratuity],
  ];

  for (let i = 0; i < 3; i++) {
    const [eL, eG, eGd] = earnRows[i];
    const [dL, dA]      = dedRows[i];
    cell(xA, Y, cA, RH.row, cWHITE, cINNER, 0.25); txt(eL,     xA, Y, cA, RH.row, false, 7.5, cBLACK, "left");
    cell(xB, Y, cB, RH.row, cWHITE, cINNER, 0.25); inrT(eG,    xB, Y, cB, RH.row, false, 7.5);
    cell(xC, Y, cC, RH.row, cWHITE, cINNER, 0.25); inrT(eGd,   xC, Y, cC, RH.row, false, 7.5);
    cell(xD, Y, cD, RH.row, cWHITE, cINNER, 0.25); txt(dL,     xD, Y, cD, RH.row, false, 7.5, cBLACK, "center");
    cell(xE, Y, cE, RH.row, cWHITE, cINNER, 0.25); inrT(dA,    xE, Y, cE, RH.row, false, 7.5);
    Y += RH.row;
  }

  /* ── TOTAL EARNING / TOTAL DEDUCTION ─────────────────────────────────────── */
  cell(xA, Y, cA, RH.tot, cLGREY, cSECT, 0.5); txt("Total Earning",     xA, Y, cA, RH.tot, true, 7.5, cBLACK, "left");
  cell(xB, Y, cB, RH.tot, cLGREY, cSECT, 0.5); inrT(d.grossSalary,     xB, Y, cB, RH.tot, true, 7.5);
  cell(xC, Y, cC, RH.tot, cLGREY, cSECT, 0.5); inrT(d.grossSalaryD,    xC, Y, cC, RH.tot, true, 7.5);
  cell(xD, Y, cD, RH.tot, cLGREY, cSECT, 0.5); txt("Total Deduction",  xD, Y, cD, RH.tot, true, 7.5, cBLACK, "center");
  cell(xE, Y, cE, RH.tot, cLGREY, cSECT, 0.5); inrT(d.totalDeduction,  xE, Y, cE, RH.tot, true, 7.5);
  Y += RH.tot;

  /* ── PERFORMANCE PAY / NET SALARY ────────────────────────────────────────── */
  cell(xA, Y, cA, RH.perf, cWHITE, cINNER, 0.25);
  mtxt(["Performance Pay /", "Variable pay"], xA, Y, cA, RH.perf, false, 7, cBLACK);
  cell(xB, Y, cB, RH.perf, cWHITE, cINNER, 0.25); inrT(d.performancePay, xB, Y, cB, RH.perf, false, 7.5);
  cell(xC, Y, cC, RH.perf, cWHITE, cINNER, 0.25); inrT(d.perfD,          xC, Y, cC, RH.perf, false, 7.5);
  cell(xD, Y, cD, RH.perf, cWHITE, cSECT,  0.5);  txt("Net Salary",       xD, Y, cD, RH.perf, true, 9, cBLACK, "left");
  cell(xE, Y, cE, RH.perf, cWHITE, cSECT,  0.5);  inrT(d.netSalary,       xE, Y, cE, RH.perf, true, 7.5);
  Y += RH.perf;

  /* ── TOTAL EARNING POTENTIAL ──────────────────────────────────────────────── */
  cell(xA, Y, cA, RH.pot, cWHITE, cINNER, 0.25);
  mtxt(["Total Earning", "Potential"], xA, Y, cA, RH.pot, true, 7.5, cBLACK);
  cell(xB, Y, cB, RH.pot, cWHITE, cINNER, 0.25); inrT(d.totalEarning,  xB, Y, cB, RH.pot, true, 7.5);
  cell(xC, Y, cC, RH.pot, cWHITE, cINNER, 0.25); inrT(d.totalEarningD, xC, Y, cC, RH.pot, true, 7.5);
  cell(xD, Y, cD, RH.pot, cWHITE, cINNER, 0.25);
  mtxt(["Performance Pay /", "Variable pay"], xD, Y, cD, RH.pot, false, 7, cBLACK, "center");
  cell(xE, Y, cE, RH.pot, cWHITE, cINNER, 0.25); inrT(d.perfD,         xE, Y, cE, RH.pot, false, 7.5);
  Y += RH.pot;

  /* ── DARK "TOTAL EARNING" ROW ────────────────────────────────────────────── */
  cell(xA, Y, cA, RH.dark, cWHITE, cINNER, 0.25);
  cell(xB, Y, cB, RH.dark, cWHITE, cINNER, 0.25);
  cell(xC, Y, cC, RH.dark, cWHITE, cINNER, 0.25);
  cell(xD, Y, cD, RH.dark, cDARK,  cSECT,  0.5);  txt("Total Earning",    xD, Y, cD, RH.dark, true, 8, cWHT, "left");
  cell(xE, Y, cE, RH.dark, cDARK,  cSECT,  0.5);  inrT(d.totalWithPerf,   xE, Y, cE, RH.dark, true, 7.5, cWHT);
  Y += RH.dark;

  /* ── SPACER ──────────────────────────────────────────────────────────────── */
  fillR(ML, Y, PW, RH.spc, cWHITE);
  Y += RH.spc;

  /* ── FOOTER ──────────────────────────────────────────────────────────────── */
  cell(ML, Y, PW, RH.ftr, cLGREY, cSECT, 0.5);
  txt('"This is computer generated payslip"', ML, Y, PW, RH.ftr, true, 9, cBLACK, "center");
  Y += RH.ftr;

  /* ── OUTER FRAME — drawn last, sits over everything ─────────────────────── */
doc.setDrawColor(...cOUTER);
doc.setLineWidth(0.45);
doc.rect(ML, YTOP, PW, Y - YTOP, "S");

  doc.save(`Payslip_${d.name.replace(/\s+/g,"_")}_${(d.forMonth||"payslip").replace(/\s+/g,"_")}.pdf`);
};

/* =============================================================================
   EXCEL PAYSLIP — mirrors PDF layout
   ============================================================================= */
export const downloadPayslipExcel = async (employee) => {
  const d = _buildData(_normalizeEmployee(employee));

  if (!window.ExcelJS) {
    await new Promise((res, rej) => {
      const s = document.createElement("script");
      s.src = "https://cdnjs.cloudflare.com/ajax/libs/exceljs/4.4.0/exceljs.min.js";
      s.onload = res; s.onerror = rej;
      document.head.appendChild(s);
    });
  }

  const wb = new window.ExcelJS.Workbook();
  const ws = wb.addWorksheet("Payslip");

  ws.pageSetup = {
    paperSize: 9, orientation: "portrait",
    fitToPage: true, fitToWidth: 1, fitToHeight: 0,
    horizontalCentered: true,
    margins: { left: 0.2, right: 0.2, top: 0.2, bottom: 0.2, header: 0.1, footer: 0.1 },
  };
  ws.views = [{ showGridLines: false, zoomScale: 80 }];

  // ─── Column layout ─────────────────────────────────────────────────────────
  //  A  = gutter (hidden)
  //  B  = Earning Head label      [logo col 1/3]
  //  C  = Gross Salary            [logo col 2/3]
  //  D  = Gross Salary (d)        [logo col 3/3 — end of 1/3 logo block]
  //  E  = Deduction Head          [company info — wider]
  //  F  = Amount                  [company info]
  //  G  = company info
  //  H  = company info
  //  I  = company info
  //
  // Header: B:D merged = logo, E:I = company info (3 rows)
  // Body: B=label, C=gross, D=gross(d), E:F merged=ded label, G:I merged=amount
  ws.columns = [
    { width: 1   }, // A gutter
    { width: 22  }, // B
    { width: 15  }, // C
    { width: 15  }, // D  ← end of logo 1/3
    { width: 28  }, // E  (deduction head / company info — wider for long text)
    { width: 13  }, // F
    { width: 13  }, // G
    { width: 13  }, // H
    { width: 13  }, // I
  ];

  // ─── Row heights ───────────────────────────────────────────────────────────
  ws.getRow(1).height  = 4;
  ws.getRow(2).height  = 44;  // logo / company name
  ws.getRow(3).height  = 26;  // address
  ws.getRow(4).height  = 26;  // website
  ws.getRow(5).height  = 22;  // banner
  for (let r = 6;  r <= 13; r++) ws.getRow(r).height = 20;
  ws.getRow(14).height = 22;
  for (let r = 15; r <= 17; r++) ws.getRow(r).height = 20;
  ws.getRow(18).height = 22;
  ws.getRow(19).height = 22;
  ws.getRow(20).height = 22;
  ws.getRow(21).height = 22;
  ws.getRow(22).height = 6;
  ws.getRow(23).height = 20;

  ws.pageSetup.printArea = "B2:I23";

  // ─── Border definitions ────────────────────────────────────────────────────
  const OUTER = { style: "medium", color: { argb: "FF1E1E1E" } };
  const SECT  = { style: "medium", color: { argb: "FF3C3C3C" } };
  const INNER = { style: "thin",   color: { argb: "FF707070" } };
  const HDIV  = { style: "thin",   color: { argb: "FFAAAAAA" } };

  const bOuter = { top: OUTER, left: OUTER, bottom: OUTER, right: OUTER };
  const bSect  = { top: SECT,  left: SECT,  bottom: SECT,  right: SECT  };
  const bInner = { top: INNER, left: INNER, bottom: INNER, right: INNER };

  // ─── Fill definitions ──────────────────────────────────────────────────────
  const sf    = (a) => ({ type: "pattern", pattern: "solid", fgColor: { argb: a } });
  const fW    = sf("FFFFFFFF");
  const fG    = sf("FFE7E6E6");
  const fDark = sf("FF44546A");

  // ─── Alignment ─────────────────────────────────────────────────────────────
  const aL = { horizontal: "left",   vertical: "middle", wrapText: true, indent: 1 };
  const aC = { horizontal: "center", vertical: "middle", wrapText: true };

  // ─── Fonts ─────────────────────────────────────────────────────────────────
  const fN    = { name: "Calibri", size: 9 };
  const fB    = { name: "Calibri", size: 9,  bold: true };
  const fB11  = { name: "Calibri", size: 11, bold: true };
  const fWht  = { name: "Calibri", size: 9,  bold: true, color: { argb: "FFFFFFFF" } };
  const numFmt = '"Rs. "#,##0.00';

  // ─── Helpers ───────────────────────────────────────────────────────────────
  const SC = (addr, val, o = {}) => {
    const c = ws.getCell(addr);
    if (val !== undefined && val !== null) c.value = val;
    if (o.font)      c.font      = o.font;
    if (o.fill)      c.fill      = o.fill;
    if (o.alignment) c.alignment = o.alignment;
    if (o.border)    c.border    = o.border;
    if (o.numFmt)    c.numFmt    = o.numFmt;
    return c;
  };

  const MC = (rng, val, o = {}) => {
    try { ws.mergeCells(rng); } catch(_) {}
    return SC(rng.split(":")[0], val, o);
  };

  // ─── Load logo ─────────────────────────────────────────────────────────────
  const logoInfo = await loadImageBase64("/assets/Insta-logo1.png");

  /* ════════════════════════════════════════════════════
     ROWS 2–4: HEADER  (logo left 1/3, company info right 2/3)
  ════════════════════════════════════════════════════ */

  // Logo block — B2:D4
  MC("B2:D4", null, {
    fill:   fW,
    border: { top: OUTER, left: OUTER, bottom: OUTER, right: HDIV },
  });

  if (logoInfo) {
    const b64   = logoInfo.dataUrl.split(",")[1];
    const imgId = wb.addImage({ base64: b64, extension: "png" });
    ws.addImage(imgId, {
      tl:     { col: 1.12, row: 1.12 },  // B2 + inset (col index 0-based: B=1)
      br:     { col: 3.88, row: 3.88 },  // D4 − inset
      editAs: "oneCell",
    });
  }

  // Company name — E2:I2
  MC("E2:I2", "Insta ICT Solutions Pvt. Ltd.", {
    font:      { name: "Calibri", bold: true, size: 11.5, color: { argb: "FF1A3C6E" } },
    fill:      fW,
    alignment: aL,
    border:    { top: OUTER, left: HDIV, bottom: HDIV, right: OUTER },
  });

  // Address — E3:I3
  MC("E3:I3", "201 - 202, Imperial Plaza, Jijai Nagar, Kothrud, Pune - 411 038.", {
    font:      { name: "Calibri", size: 8.5, color: { argb: "FF555555" } },
    fill:      fW,
    alignment: aL,
    border:    { top: HDIV, left: HDIV, bottom: HDIV, right: OUTER },
  });

  // Website — E4:I4
  MC("E4:I4", "Website: www.instagrp.com", {
    font:      { name: "Calibri", size: 8.5, color: { argb: "FF0563C1" } },
    fill:      fW,
    alignment: aL,
    border:    { top: HDIV, left: HDIV, bottom: OUTER, right: OUTER },
  });

  /* ════════════════════════════════════════════════════
     ROW 5: BANNER
  ════════════════════════════════════════════════════ */
  MC("B5:I5", `Payslip: ${d.forMonth}`, {
    font: fB11, fill: fW, alignment: aC, border: bSect,
  });

  /* ════════════════════════════════════════════════════
     ROWS 6–13: EMPLOYEE INFO
     B = label1 | C:D = value1 | E:F = label2 | G:I = value2
  ════════════════════════════════════════════════════ */
  const empInfo = [
    ["Employee Id",  d.employeeId,    "Name",             d.name],
    ["Joining Date", d.joiningDate,   "Current Location", d.currentLocation],
    ["P Days",       d.pDays,         "Project",          d.project],
    ["A Days",       d.aDays,         "Designation",      d.designation],
    ["Month Days",   d.monthDays,     "Grade",            d.grade],
    ["UAN No",       d.uanNo,         "Aadhar No",        d.aadharNo],
    ["PAN No",       d.panNo,         "For Month",        d.forMonth],
    ["Bank Name",    d.bankName,      "Bank A/c No",      d.bankAccountNo],
  ];

  empInfo.forEach(([l1, v1, l2, v2], i) => {
    const r  = 6 + i;
    const bg = i === 0 ? fG  : fW;
    const fv = i === 0 ? fB  : fN;
    SC(`B${r}`,        l1,        { font: fB, fill: bg, alignment: aL, border: bInner });
    MC(`C${r}:D${r}`,  v1 ?? "",  { font: fv, fill: bg, alignment: aC, border: bInner });
    MC(`E${r}:F${r}`,  l2,        { font: fB, fill: bg, alignment: aL, border: bInner });
    MC(`G${r}:I${r}`,  v2 ?? "",  { font: fv, fill: bg, alignment: aC, border: bInner });
  });

  /* ════════════════════════════════════════════════════
     ROW 14: TABLE COLUMN HEADERS
  ════════════════════════════════════════════════════ */
  SC("B14",     "Earning Head",     { font: fB, fill: fG, alignment: aC, border: bSect });
  SC("C14",     "Gross Salary",     { font: fB, fill: fG, alignment: aC, border: bSect });
  SC("D14",     "Gross Salary (d)", { font: fB, fill: fG, alignment: aC, border: bSect });
  MC("E14:F14", "Deduction Head",   { font: fB, fill: fG, alignment: aC, border: bSect });
  MC("G14:I14", "Amount",           { font: fB, fill: fG, alignment: aC, border: bSect });

  /* ════════════════════════════════════════════════════
     ROWS 15–17: DATA ROWS
  ════════════════════════════════════════════════════ */
  const earnData = [
    ["Basic",                  d.basic,                d.basicD],
    ["HRA",                    d.hra,                  d.hraD],
    ["Organization Allowance", d.organisationAllowance,d.oaD],
  ];
  const dedData = [
    ["PF (Employee + Employer)", d.pfEmp + d.pfCo],
    ["PT",                       d.pt],
    ["Gratuity",                 d.gratuity],
  ];

  for (let i = 0; i < 3; i++) {
    const r = 15 + i;
    const [eL, eG, eGD] = earnData[i];
    const [dL, dA]      = dedData[i];
    SC(`B${r}`,    eL,  { font: fN, fill: fW, alignment: aL, border: bInner });
    SC(`C${r}`,    eG,  { font: fN, fill: fW, alignment: aC, border: bInner, numFmt });
    SC(`D${r}`,    eGD, { font: fN, fill: fW, alignment: aC, border: bInner, numFmt });
    MC(`E${r}:F${r}`, dL, { font: fN, fill: fW, alignment: aC, border: bInner });
    MC(`G${r}:I${r}`, dA, { font: fN, fill: fW, alignment: aC, border: bInner, numFmt });
  }

  /* ════════════════════════════════════════════════════
     ROW 18: TOTAL EARNING / TOTAL DEDUCTION
  ════════════════════════════════════════════════════ */
  SC("B18",     "Total Earning",    { font: fB, fill: fG, alignment: aL, border: bSect });
  SC("C18",     d.grossSalary,      { font: fB, fill: fG, alignment: aC, border: bSect, numFmt });
  SC("D18",     d.grossSalaryD,     { font: fB, fill: fG, alignment: aC, border: bSect, numFmt });
  MC("E18:F18", "Total Deduction",  { font: fB, fill: fG, alignment: aC, border: bSect });
  MC("G18:I18", d.totalDeduction,   { font: fB, fill: fG, alignment: aC, border: bSect, numFmt });

  /* ════════════════════════════════════════════════════
     ROW 19: PERFORMANCE PAY / NET SALARY
  ════════════════════════════════════════════════════ */
  SC("B19",     "Performance Pay\nVariable pay", { font: fN, fill: fW, alignment: aL, border: bInner });
  SC("C19",     d.performancePay || 0,           { font: fN, fill: fW, alignment: aC, border: bInner, numFmt });
  SC("D19",     d.perfD,                         { font: fN, fill: fW, alignment: aC, border: bInner, numFmt });
  MC("E19:F19", "Net Salary",                    { font: fB, fill: fW, alignment: aL, border: bSect });
  MC("G19:I19", d.netSalary,                     { font: fB, fill: fW, alignment: aC, border: bSect, numFmt });

  /* ════════════════════════════════════════════════════
     ROW 20: TOTAL EARNING POTENTIAL
  ════════════════════════════════════════════════════ */
  SC("B20",     "Total Earning\nPotential",       { font: fB, fill: fW, alignment: aL, border: bInner });
  SC("C20",     d.totalEarning,                   { font: fB, fill: fW, alignment: aC, border: bInner, numFmt });
  SC("D20",     d.totalEarningD,                  { font: fB, fill: fW, alignment: aC, border: bInner, numFmt });
  MC("E20:F20", "Performance Pay\nVariable pay",  { font: fN, fill: fW, alignment: aC, border: bInner });
  MC("G20:I20", d.perfD,                          { font: fN, fill: fW, alignment: aC, border: bInner, numFmt });

  /* ════════════════════════════════════════════════════
     ROW 21: DARK TOTAL EARNING
  ════════════════════════════════════════════════════ */
  SC("B21",     null, { fill: fW, border: bInner });
  SC("C21",     null, { fill: fW, border: bInner });
  SC("D21",     null, { fill: fW, border: bInner });
  MC("E21:F21", "Total Earning",   { font: fWht, fill: fDark, alignment: aL, border: bSect });
  MC("G21:I21", d.totalWithPerf,   { font: fWht, fill: fDark, alignment: aC, border: bSect, numFmt });

  /* ════════════════════════════════════════════════════
     ROW 22: SPACER
  ════════════════════════════════════════════════════ */
  for (let c = 2; c <= 9; c++) {
    const cel = ws.getRow(22).getCell(c);
    cel.fill   = fW;
    cel.border = bInner;
  }

  /* ════════════════════════════════════════════════════
     ROW 23: FOOTER
  ════════════════════════════════════════════════════ */
  MC("B23:I23", '"This is computer generated payslip"', {
    font:      { name: "Calibri", size: 9.5, bold: true },
    fill:      fG,
    alignment: aC,
    border:    bSect,
  });

  /* ════════════════════════════════════════════════════
     FINAL PASS — Re-stamp OUTER (medium dark) border on all boundary cells
     Rows 2–23, cols B(2)–I(9)  — runs last, cannot be overridden
  ════════════════════════════════════════════════════ */
  for (let r = 2; r <= 23; r++) {
    for (let c = 2; c <= 9; c++) {
      const cel = ws.getRow(r).getCell(c);
      // Deep-copy to avoid mutating the ExcelJS border object reference
      const b = JSON.parse(JSON.stringify(cel.border || {}));
      if (r === 2)  b.top    = OUTER;
      if (r === 23) b.bottom = OUTER;
      if (c === 2)  b.left   = OUTER;
      if (c === 9)  b.right  = OUTER;
      cel.border = b;
    }
  }

  /* ── Write & download ─────────────────────────────────────────────────────── */
  const buffer = await wb.xlsx.writeBuffer();
  const blob   = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const url = URL.createObjectURL(blob);
  const a   = document.createElement("a");
  a.href     = url;
  a.download = `Payslip_${d.name||"Employee"}_${(d.forMonth||"payslip").replace(/\s+/g,"_")}.xlsx`;
  a.click();
  URL.revokeObjectURL(url);
};

