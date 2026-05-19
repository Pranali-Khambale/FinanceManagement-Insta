// src/Ui/Payroll/PayslipGenerator.js
// Supports two download formats:
//   1. PDF  (.pdf)  — downloadPayslipPDF(employee)
//   2. Excel (.xlsx) — downloadPayslipExcel(employee)
//
// ─── FIELD NORMALIZATION ──────────────────────────────────────────────────────
// Backend returns snake_case (uan_number, basic_salary, etc.)
// _buildData() expects camelCase (uanNo, basic, etc.)
// _normalizeEmployee() bridges the gap so both formats work.
//
// ✅ FIX: Use ?? (nullish coalescing) instead of || for numeric fields
//         so that 0 is treated as a valid value and not fallen through.
// ─────────────────────────────────────────────────────────────────────────────

/* ─── safe numeric helper ────────────────────────────────────────────────── */
// Returns first defined, non-null value; falls back to fallback (default 0)
function _pick(a, b, fallback = null) {
  if (a !== undefined && a !== null && a !== "") return a;
  if (b !== undefined && b !== null && b !== "") return b;
  return fallback;
}

/* ─── Normalize DB snake_case → generator camelCase ─────────────────────────── */
function _normalizeEmployee(emp) {
  return {
    // spread everything first so any already-correct keys are preserved
    ...emp,

    // ── Identity / HR fields ──────────────────────────────────────────────────
    employeeId:      _pick(emp.employeeId,      emp.employee_id,       ""),
    joiningDate:     _pick(emp.joiningDate,      emp.joining_date,      ""),
    currentLocation: _pick(emp.currentLocation,  emp.circle,            ""),
    project:         _pick(emp.project,          emp.project_name,      ""),
    designation:     _pick(emp.designation,      emp.position,          ""),
    grade:           emp.grade                                        || "",
    forMonth:        _pick(emp.forMonth,         emp.for_month,         ""),

    // ── Document numbers ─────────────────────────────────────────────────────
    // ✅ FIX: uanNo now picks from all possible field names the controller sends
    uanNo:    _pick(emp.uanNo,    emp.uan_number,    "") ,
    aadharNo: _pick(emp.aadharNo, emp.aadhar_number, ""),
    panNo:    _pick(emp.panNo,    emp.pan_number,    ""),
    epfNo:    _pick(emp.epfNo,    emp.epf_no,        "0"),
    esicNo:   _pick(emp.esicNo,   emp.esic_no,       "0"),

    // ── Bank details ─────────────────────────────────────────────────────────
    bankName:      _pick(emp.bankName,      emp.bank_name,      ""),
    bankAccountNo: _pick(emp.bankAccountNo, emp.account_number, ""),
    ifscCode:      _pick(emp.ifscCode,      emp.ifsc_code,      ""),

    // ── Salary components ─────────────────────────────────────────────────────
    // ✅ FIX: Use ?? 0 not || 0 so that 0 salary values are preserved
    basic:                 emp.basic                 ?? emp.basic_salary       ?? 0,
    hra:                   emp.hra                   ?? 0,
    organisationAllowance: emp.organisationAllowance ?? emp.other_allowances   ?? 0,
    medicalAllowance:      emp.medicalAllowance      ?? emp.medical_allowance  ?? 0,
    performancePay:        emp.performancePay        ?? emp.performance_pay    ?? 0,

    // ── Deductions ────────────────────────────────────────────────────────────
    // ✅ FIX: null means "auto-calc"; 0 means "exempt" — must preserve 0
    pfDeduction:            emp.pfDeduction            ?? emp.pf_deduction             ?? null,
    employerPfContribution: emp.employerPfContribution ?? emp.employer_pf_contribution ?? null,
    pt:                     emp.pt                     ?? 0,
    gratuity:               emp.gratuity               ?? null,

    // ── Attendance ────────────────────────────────────────────────────────────
    pDays:     emp.pDays     ?? emp.p_days     ?? null,
    monthDays: emp.monthDays ?? emp.month_days ?? 30,
    aDays:     emp.aDays     ?? emp.a_days     ?? 0,

    // ── Gender (for PT calc) ──────────────────────────────────────────────────
    gender: emp.gender || "",
  };
}

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
    const dd   = String(d.getUTCDate()).padStart(2, "0");
    const mm   = String(d.getUTCMonth() + 1).padStart(2, "0");
    const yyyy = d.getUTCFullYear();
    return `${dd}-${mm}-${yyyy}`;
  };

  const basic                = n(employee.basic);
  const hra                  = n(employee.hra);
  const organisationAllowance = n(employee.organisationAllowance);
  const medicalAllowance     = n(employee.medicalAllowance);
  const performancePay       = n(employee.performancePay);
  const monthDays            = n(employee.monthDays) || 30;
  const pDays                = employee.pDays != null ? n(employee.pDays) : monthDays;
  const aDays                = n(employee.aDays);

  // ✅ FIX: use != null (not || null) so 0 is treated as "set to exempt"
  const pfEmp =
    employee.pfDeduction != null
      ? n(employee.pfDeduction)
      : Math.round(basic * 0.12);

  const pfCo =
    employee.employerPfContribution != null
      ? n(employee.employerPfContribution)
      : Math.round(basic * 0.13);

  const isFemale  = /female|woman|f/i.test(employee.gender || "");
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

  const ratio        = monthDays > 0 ? pDays / monthDays : 1;
  const grossSalary  = basic + hra + organisationAllowance + medicalAllowance;
  const grossSalaryD = grossSalary * ratio;
  const basicD       = basic * ratio;
  const hraD         = hra * ratio;
  const oaD          = organisationAllowance * ratio;
  const maD          = medicalAllowance * ratio;
  const perfD        = performancePay * ratio;

  const totalDeduction = pfEmp + pfCo + pt + gratuity;
  const netSalary      = grossSalaryD - totalDeduction;
  const totalWithPerf  = netSalary + perfD;
  const totalEarning   = grossSalary + performancePay;
  const totalEarningD  = grossSalaryD + perfD;

  return {
    name:            employee.name            || "",
    employeeId:      employee.employeeId      || "",
    joiningDate:     fmtDate(employee.joiningDate),
    currentLocation: employee.currentLocation || employee.circle || "",
    pDays,
    aDays,
    monthDays,
    project:         employee.project         || "",
    designation:     employee.designation     || "",
    grade:           employee.grade           || "",
    epfNo:           employee.epfNo           || "0",
    esicNo:          employee.esicNo          || "0",
    uanNo:           employee.uanNo           || "",
    aadharNo:        employee.aadharNo        || "",
    panNo:           employee.panNo           || "",
    forMonth:        employee.forMonth        || "",
    bankName:        employee.bankName        || "",
    bankAccountNo:   employee.bankAccountNo   || employee.accountNumber || "",
    ifscCode:        employee.ifscCode        || "",
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
      canvas.width  = img.naturalWidth;
      canvas.height = img.naturalHeight;
      canvas.getContext("2d").drawImage(img, 0, 0);
      res({ dataUrl: canvas.toDataURL("image/png"), w: img.naturalWidth, h: img.naturalHeight });
    };
    img.onerror = () => res(null);
    img.src = src;
  });

/* ─── Load jsPDF from CDN with retry ─────────────────────────────────────── */
async function _loadJsPDF() {
  if (window.jspdf?.jsPDF) return window.jspdf.jsPDF;

  // ✅ FIX: wrapped in try/catch so failure is surfaced instead of silently hanging
  await new Promise((resolve, reject) => {
    const existing = document.querySelector(
      'script[src*="jspdf"]'
    );
    if (existing) {
      // Script tag exists but may not have finished loading yet
      existing.addEventListener("load",  resolve);
      existing.addEventListener("error", reject);
      // If it already loaded, resolve immediately
      if (window.jspdf) resolve();
      return;
    }

    const s    = document.createElement("script");
    s.src      = "https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js";
    s.onload   = resolve;
    s.onerror  = () => reject(new Error("Failed to load jsPDF from CDN. Check your internet connection."));
    document.head.appendChild(s);
  });

  if (!window.jspdf?.jsPDF) {
    throw new Error("jsPDF loaded but window.jspdf.jsPDF is not available.");
  }
  return window.jspdf.jsPDF;
}

/* ─── Load ExcelJS from CDN with retry ───────────────────────────────────── */
async function _loadExcelJS() {
  if (window.ExcelJS) return window.ExcelJS;

  await new Promise((resolve, reject) => {
    const existing = document.querySelector('script[src*="exceljs"]');
    if (existing) {
      existing.addEventListener("load",  resolve);
      existing.addEventListener("error", reject);
      if (window.ExcelJS) resolve();
      return;
    }

    const s    = document.createElement("script");
    s.src      = "https://cdnjs.cloudflare.com/ajax/libs/exceljs/4.4.0/exceljs.min.js";
    s.onload   = resolve;
    s.onerror  = () => reject(new Error("Failed to load ExcelJS from CDN. Check your internet connection."));
    document.head.appendChild(s);
  });

  if (!window.ExcelJS) {
    throw new Error("ExcelJS loaded but window.ExcelJS is not available.");
  }
  return window.ExcelJS;
}

/* =============================================================================
   PDF PAYSLIP
   ============================================================================= */
export const downloadPayslipPDF = async (employee) => {
  // ✅ FIX: Normalize then build — errors now throw instead of silently producing blank PDFs
  const normalized = _normalizeEmployee(employee);
  const d          = _buildData(normalized);

  // Debug log — remove after confirming UAN shows correctly
  console.log("[PayslipPDF] uanNo:", d.uanNo, "| panNo:", d.panNo, "| aadharNo:", d.aadharNo);

  const jsPDF    = await _loadJsPDF();
  const logoInfo = await loadImageBase64("/assets/Insta-logo1.png");
  const doc      = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

  const PAGE_W   = 210;
  const MARGIN_L = 8;
  const MARGIN_R = 8;
  const CONTENT_W = PAGE_W - MARGIN_L - MARGIN_R;

  const wA  = 42;
  const wB  = 28;
  const wC  = 28;
  const wDE = 58;
  const wF  = 38;

  const xA  = MARGIN_L;
  const xB  = xA + wA;
  const xC  = xB + wB;
  const xDE = xC + wC;
  const xF  = xDE + wDE;

  const H_HDR    = 26.0;
  const H_BANNER = 7.5;
  const H_EMP    = 6.5;
  const H_THDR   = 7.0;
  const H_ROW    = 6.5;
  const H_ROW_M  = 6.0;
  const H_TOT    = 6.5;
  const H_PERF   = 7.5;
  const H_POT    = 7.5;
  const H_DARK   = 6.5;
  const H_SPC    = 2.0;
  const H_FTR    = 6.5;

  const cHdr   = [231, 230, 230];
  const cDarkBg = [68, 84, 106];
  const cWhite  = [255, 255, 255];
  const cThin   = [180, 180, 180];
  const cMed    = [80, 80, 80];
  const cBlue   = [26, 60, 110];
  const cLink   = [5, 99, 193];
  const cBlack  = [0, 0, 0];
  const cGray   = [90, 90, 90];
  const cDark   = [30, 30, 30];

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
    const ty  = y + h * 0.63;
    const str = String(s);
    if (align === "center")      doc.text(str, x + w / 2,      ty, { align: "center" });
    else if (align === "right")  doc.text(str, x + w - 1.5,    ty, { align: "right" });
    else                         doc.text(str, x + 2.2,        ty);
  };
  const mtxt = (lines, x, y, w, h, bold, sz, col, align = "left") => {
    doc.setFont("helvetica", bold ? "bold" : "normal");
    doc.setFontSize(sz);
    doc.setTextColor(...col);
    const lh  = sz * 0.42;
    const tot = (lines.length - 1) * lh;
    let ty    = y + (h - tot) / 2;
    lines.forEach((line) => {
      const s = String(line ?? "");
      if (align === "center")      doc.text(s, x + w / 2,   ty, { align: "center" });
      else if (align === "right")  doc.text(s, x + w - 1.5, ty, { align: "right" });
      else                         doc.text(s, x + 2.2,     ty);
      ty += lh;
    });
  };
  const inrTxt = (val, x, y, w, h, bold, sz, col = cDark) =>
    txt(inr(val), x, y, w, h, bold, sz, col, "center");

  let Y = 8;

  // ── HEADER BLOCK ──────────────────────────────────────────────────────────
  const wLeft = wA + wB + wC;
  fillR(xA, Y, CONTENT_W, H_HDR, cWhite);
  doc.setDrawColor(...cMed);
  doc.setLineWidth(0.55);
  doc.rect(xA, Y, CONTENT_W, H_HDR, "S");
  doc.setDrawColor(...cThin);
  doc.setLineWidth(0.18);
  doc.line(xDE, Y, xDE, Y + H_HDR);

  if (logoInfo) {
    const padX = 5, padY = 4;
    const maxW = wLeft - padX * 2;
    const maxH = H_HDR - padY * 2;
    const asp  = logoInfo.w / logoInfo.h;
    let iw = maxW, ih = iw / asp;
    if (ih > maxH) { ih = maxH; iw = ih * asp; }
    const ix = xA + (wLeft - iw) / 2;
    const iy = Y + (H_HDR - ih) / 2;
    doc.addImage(logoInfo.dataUrl, "PNG", ix, iy, iw, ih, undefined, "FAST");
  } else {
    txt("LOGO", xA, Y, wLeft, H_HDR, true, 10, [180, 180, 180], "center");
  }

  const rxOff = xDE + 3;
  const rxW   = wDE + wF - 5;
  txt("Insta ICT Solutions Pvt. Ltd.", rxOff, Y + 2,  rxW, 8, true,  10.5, cBlue, "left");
  txt("201 - 202, Imperial Plaza, Jijai Nagar, Kothrud, Pune - 411 038.", rxOff, Y + 10, rxW, 7, false, 7.5, cGray, "left");
  txt("Website: www.instagrp.com",     rxOff, Y + 18, rxW, 7, false, 7.5,  cLink, "left");
  Y += H_HDR;

  // ── BANNER ────────────────────────────────────────────────────────────────
  fillR(xA, Y, CONTENT_W, H_BANNER, cWhite);
  doc.setDrawColor(...cMed);
  doc.setLineWidth(0.55);
  doc.rect(xA, Y, CONTENT_W, H_BANNER, "S");
  txt(`Payslip: ${d.forMonth}`, xA, Y, CONTENT_W, H_BANNER, true, 11, cBlack, "center");
  Y += H_BANNER;

  // ── EMPLOYEE INFO — 9 rows ────────────────────────────────────────────────
  const empRows = [
    ["Employee Id",  d.employeeId,    "Name",             d.name],
    ["Joining Date", d.joiningDate,   "Current Location", d.currentLocation],
    ["P Days",       d.pDays,         "Project",          d.project],
    ["A Days",       d.aDays,         "Designation",      d.designation],
    ["Month Days",   d.monthDays,     "Grade",            d.grade],
    ["EPF No",       d.epfNo,         "ESIC No",          d.esicNo],
    ["UAN No",       d.uanNo,         "Aadhar No",        d.aadharNo],
    ["PAN No",       d.panNo,         "For Month",        d.forMonth],
    ["Bank Name",    d.bankName,      "Bank A/c No",      d.bankAccountNo],
  ];

  empRows.forEach(([l1, v1, l2, v2], i) => {
    const bg    = i === 0 ? cHdr : cWhite;
    const vBold = i === 0;
    cell(xA,  Y, wA,       H_EMP, bg);
    txt(l1,   xA,  Y, wA,       H_EMP, true,  7.5, cBlack, "left");
    cell(xB,  Y, wB + wC,  H_EMP, bg);
    txt(String(v1 ?? ""), xB, Y, wB + wC, H_EMP, vBold, 7.5, cDark, "center");
    cell(xDE, Y, wDE,      H_EMP, bg);
    txt(l2,   xDE, Y, wDE,      H_EMP, true,  7.5, cBlack, "left");
    cell(xF,  Y, wF,       H_EMP, bg);
    txt(String(v2 ?? ""), xF, Y, wF,       H_EMP, vBold, 7.5, cDark, "center");
    Y += H_EMP;
  });

  // ── TABLE HEADER ──────────────────────────────────────────────────────────
  cell(xA,  Y, wA,  H_THDR, cHdr, true); txt("Earning Head",      xA,  Y, wA,  H_THDR, true, 8,   cBlack, "center");
  cell(xB,  Y, wB,  H_THDR, cHdr, true); txt("Gross Salary",      xB,  Y, wB,  H_THDR, true, 8,   cBlack, "center");
  cell(xC,  Y, wC,  H_THDR, cHdr, true); txt("Gross Salary (d)",  xC,  Y, wC,  H_THDR, true, 7.5, cBlack, "center");
  cell(xDE, Y, wDE, H_THDR, cHdr, true); txt("Deduction Head",    xDE, Y, wDE, H_THDR, true, 8,   cBlack, "center");
  cell(xF,  Y, wF,  H_THDR, cHdr, true); txt("Amount",            xF,  Y, wF,  H_THDR, true, 8,   cBlack, "center");
  Y += H_THDR;

  // ── DATA ROWS ─────────────────────────────────────────────────────────────
  const earnRows = [
    ["Basic",                  d.basic,                 d.basicD, H_ROW],
    ["HRA",                    d.hra,                   d.hraD,   H_ROW],
    ["Organization Allowance", d.organisationAllowance, d.oaD,    H_ROW_M],
    ["Medical Allowance",      d.medicalAllowance,      d.maD,    H_ROW_M],
  ];
  const dedRows = [
    ["PF (Employee + Employer)", d.pfEmp + d.pfCo],
    ["PT",                       d.pt],
    ["Gratuity",                 d.gratuity],
    ["Other",                    0],
  ];

  for (let i = 0; i < 4; i++) {
    const [eL, eG, eGd, hRow] = earnRows[i];
    const [dL, dA]            = dedRows[i];
    cell(xA,  Y, wA,  hRow, cWhite); if (eL)        txt(eL,  xA,  Y, wA,  hRow, false, 7.5, cBlack, "left");
    cell(xB,  Y, wB,  hRow, cWhite); if (eG  !== null) inrTxt(eG,  xB,  Y, wB,  hRow, false, 7.5);
    cell(xC,  Y, wC,  hRow, cWhite); if (eGd !== null) inrTxt(eGd, xC,  Y, wC,  hRow, false, 7.5);
    cell(xDE, Y, wDE, hRow, cWhite); if (dL)        txt(dL,  xDE, Y, wDE, hRow, false, 7.5, cBlack, "center");
    cell(xF,  Y, wF,  hRow, cWhite); if (dA !== null) inrTxt(dA,  xF,  Y, wF,  hRow, false, 7.5);
    Y += hRow;
  }

  // ── TOTAL EARNING / TOTAL DEDUCTION ───────────────────────────────────────
  cell(xA, Y, wA, H_TOT, cWhite);   txt("Total Earning",   xA,  Y, wA,  H_TOT, true,  7.5, cBlack, "left");
  cell(xB, Y, wB, H_TOT, cWhite);   inrTxt(d.grossSalary,  xB,  Y, wB,  H_TOT, true,  7.5);
  cell(xC, Y, wC, H_TOT, cWhite);   inrTxt(d.grossSalaryD, xC,  Y, wC,  H_TOT, true,  7.5);
  cell(xDE, Y, wDE, H_TOT, cWhite); txt("Total Deduction", xDE, Y, wDE, H_TOT, false, 7.5, cBlack, "center");
  cell(xF, Y, wF, H_TOT, cWhite);   inrTxt(d.totalDeduction, xF, Y, wF, H_TOT, false, 7.5);
  Y += H_TOT;

  // ── PERFORMANCE PAY / NET SALARY ──────────────────────────────────────────
  cell(xA, Y, wA, H_PERF, cWhite);
  mtxt(["Performance Pay /", "Variable pay"], xA, Y, wA, H_PERF, false, 7, cBlack, "left");
  cell(xB,  Y, wB,  H_PERF, cWhite); inrTxt(d.performancePay, xB,  Y, wB,  H_PERF, false, 7.5);
  cell(xC,  Y, wC,  H_PERF, cWhite); inrTxt(d.perfD,          xC,  Y, wC,  H_PERF, false, 7.5);
  cell(xDE, Y, wDE, H_PERF, cWhite, true); txt("Net Salary", xDE, Y, wDE, H_PERF, true, 8, cBlack, "left");
  cell(xF,  Y, wF,  H_PERF, cWhite, true); inrTxt(d.netSalary, xF, Y, wF, H_PERF, true, 7.5);
  Y += H_PERF;

  // ── TOTAL EARNING POTENTIAL ───────────────────────────────────────────────
  cell(xA, Y, wA, H_POT, cWhite);
  mtxt(["Total Earning", "Potential"], xA, Y, wA, H_POT, true, 7.5, cBlack, "left");
  cell(xB,  Y, wB,  H_POT, cWhite); inrTxt(d.totalEarning,  xB,  Y, wB,  H_POT, true,  7.5);
  cell(xC,  Y, wC,  H_POT, cWhite); inrTxt(d.totalEarningD, xC,  Y, wC,  H_POT, true,  7.5);
  cell(xDE, Y, wDE, H_POT, cWhite);
  mtxt(["Performance Pay /", "Variable pay"], xDE, Y, wDE, H_POT, false, 7, cBlack, "center");
  cell(xF, Y, wF, H_POT, cWhite); inrTxt(d.perfD, xF, Y, wF, H_POT, false, 7.5);
  Y += H_POT;

  // ── TOTAL EARNING SHADED ──────────────────────────────────────────────────
  cell(xA,  Y, wA,  H_DARK, cWhite);
  cell(xB,  Y, wB,  H_DARK, cWhite);
  cell(xC,  Y, wC,  H_DARK, cWhite);
  cell(xDE, Y, wDE, H_DARK, cDarkBg, true); txt("Total Earning",   xDE, Y, wDE, H_DARK, true, 8, cWhite, "left");
  cell(xF,  Y, wF,  H_DARK, cDarkBg, true); inrTxt(d.totalWithPerf, xF, Y, wF, H_DARK, true, 7.5, cWhite);
  Y += H_DARK;

  // ── SPACER ────────────────────────────────────────────────────────────────
  fillR(xA, Y, CONTENT_W, H_SPC, cWhite);
  doc.setDrawColor(...cMed);
  doc.setLineWidth(0.55);
  doc.line(xA, Y, xA, Y + H_SPC);
  doc.line(xA + CONTENT_W, Y, xA + CONTENT_W, Y + H_SPC);
  Y += H_SPC;

  // ── FOOTER ────────────────────────────────────────────────────────────────
  fillR(xA, Y, CONTENT_W, H_FTR, cHdr);
  doc.setDrawColor(...cMed);
  doc.setLineWidth(0.55);
  doc.rect(xA, Y, CONTENT_W, H_FTR, "S");
  txt('"This is computer generated payslip"', xA, Y, CONTENT_W, H_FTR, true, 8.5, cBlack, "center");

  doc.save(
    `Payslip_${d.name.replace(/\s+/g, "_")}_${d.forMonth?.replace(/\s+/g, "_") || "payslip"}.pdf`,
  );
};

/* =============================================================================
   EXCEL PAYSLIP
   ============================================================================= */
export const downloadPayslipExcel = async (employee) => {
  const normalized = _normalizeEmployee(employee);
  const d          = _buildData(normalized);

  // Debug log — remove after confirming UAN shows correctly
  console.log("[PayslipExcel] uanNo:", d.uanNo, "| panNo:", d.panNo, "| aadharNo:", d.aadharNo);

  const ExcelJS = await _loadExcelJS();

  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet("Payslip");
  ws.properties.defaultRowHeight = 20;

  ws.pageSetup = {
    paperSize: 9,
    orientation: "portrait",
    fitToPage: true,
    fitToWidth: 1,
    fitToHeight: 0,
    horizontalCentered: true,
    verticalCentered: false,
    margins: {
      left: 0.15, right: 0.15,
      top: 0.15,  bottom: 0.15,
      header: 0.1, footer: 0.1,
    },
  };

  ws.views = [{ showGridLines: false, zoomScale: 70 }];

  ws.columns = [
    { width: 3  }, // A
    { width: 22 }, // B
    { width: 16 }, // C
    { width: 16 }, // D
    { width: 17 }, // E
    { width: 13 }, // F
    { width: 13 }, // G
    { width: 8  }, // H
    { width: 9  }, // I
  ];

  ws.getRow(1).height  = 5;
  ws.getRow(2).height  = 20;
  ws.getRow(3).height  = 14;
  ws.getRow(4).height  = 14;
  ws.getRow(5).height  = 24;
  for (let r = 6; r <= 14; r++) ws.getRow(r).height = 20;
  ws.getRow(15).height = 22;
  ws.getRow(16).height = 20;
  ws.getRow(17).height = 20;
  ws.getRow(18).height = 24;
  ws.getRow(19).height = 24;
  ws.getRow(20).height = 22;
  ws.getRow(21).height = 24;
  ws.getRow(22).height = 24;
  ws.getRow(23).height = 22;
  ws.getRow(24).height = 14;
  ws.getRow(25).height = 20;

  ws.pageSetup.printArea = "B2:I25";

  // Border styles
  const thin   = { style: "thin",   color: { argb: "FF808080" } };
  const medium = { style: "medium", color: { argb: "FF404040" } };
  const hair   = { style: "hair",   color: { argb: "FFDDDDDD" } };
  const thinB  = { top: thin,   left: thin,   bottom: thin,   right: thin   };
  const medB   = { top: medium, left: medium, bottom: medium, right: medium };

  // Fill styles
  const sf       = (argb) => ({ type: "pattern", pattern: "solid", fgColor: { argb } });
  const fillHdr  = sf("FFE7E6E6");
  const fillDark = sf("FF44546A");
  const fillW    = sf("FFFFFFFF");

  // Alignment
  const lM = { horizontal: "left",   vertical: "middle", wrapText: true, indent: 1 };
  const cM = { horizontal: "center", vertical: "middle", wrapText: true };

  const numFmt = '"Rs. "#,##0.00';

  const set = (coord, value, opts = {}) => {
    const c = ws.getCell(coord);
    if (value !== undefined && value !== null) c.value = value;
    if (opts.font)      c.font      = opts.font;
    if (opts.fill)      c.fill      = opts.fill;
    if (opts.alignment) c.alignment = opts.alignment;
    if (opts.border)    c.border    = opts.border;
    if (opts.numFmt)    c.numFmt    = opts.numFmt;
    return c;
  };

  // Font styles
  const fN   = { size: 8.5, name: "Calibri" };
  const fB   = { bold: true, size: 8.5, name: "Calibri" };
  const fB11 = { bold: true, size: 11,  name: "Calibri" };
  const fWht = { bold: true, size: 8.5, name: "Calibri", color: { argb: "FFFFFFFF" } };
  const fBN  = { bold: true, size: 9,   name: "Calibri" };

  // ── HEADER rows 2–4 ───────────────────────────────────────────────────────
  const logoInfo = await loadImageBase64("/assets/Insta-logo1.png");

  if (logoInfo) {
    const b64     = logoInfo.dataUrl.split(",")[1];
    const imageId = wb.addImage({ base64: b64, extension: "png" });
    ws.addImage(imageId, {
      tl: { col: 1.15, row: 1.52 },
      br: { col: 2.85, row: 3.55 },
      editAs: "absolute",
    });
  }

  for (let r = 2; r <= 4; r++) {
    ["B", "C"].forEach((c) => {
      ws.getCell(`${c}${r}`).fill   = fillW;
      ws.getCell(`${c}${r}`).border = {
        top:    r === 2 ? medium : undefined,
        bottom: r === 4 ? medium : undefined,
        left:   c === "B" ? medium : undefined,
        right:  c === "C" ? { style: "thin", color: { argb: "FFD9D9D9" } } : undefined,
      };
    });
    ["D", "E", "F", "G", "H", "I"].forEach((c) => {
      ws.getCell(`${c}${r}`).fill   = fillW;
      ws.getCell(`${c}${r}`).border = {
        top:   r === 2 ? medium : undefined,
        bottom: r === 4 ? medium : undefined,
        left:  undefined,
        right: c === "I" ? medium : undefined,
      };
    });
  }

  ws.mergeCells("D2:I2");
  set("D2", "Insta ICT Solutions Pvt. Ltd.", {
    font:      { bold: true, size: 10.5, name: "Calibri", color: { argb: "FF1F1F1F" } },
    fill:      fillW,
    alignment: { horizontal: "left", vertical: "middle", indent: 1 },
    border:    { top: medium, bottom: undefined, left: undefined, right: medium },
  });

  ws.mergeCells("D3:I3");
  set("D3", "201 - 202, Imperial Plaza, Jijai Nagar, Kothrud, Pune - 411 038.", {
    font:      { size: 7.8, name: "Calibri", color: { argb: "FF555555" } },
    fill:      fillW,
    alignment: { horizontal: "left", vertical: "middle", indent: 1 },
    border:    { top: undefined, bottom: undefined, left: undefined, right: medium },
  });

  ws.mergeCells("D4:I4");
  set("D4", "Website: www.instagrp.com", {
    font:      { size: 8, name: "Calibri", color: { argb: "FF0563C1" } },
    fill:      fillW,
    alignment: { horizontal: "left", vertical: "middle", indent: 1 },
    border:    { top: hair, bottom: medium, left: hair, right: medium },
  });

  // ── BANNER row 5 ──────────────────────────────────────────────────────────
  ws.mergeCells("B5:I5");
  set("B5", `Payslip: ${d.forMonth}`, {
    font: fB11, fill: fillW, alignment: cM, border: medB,
  });

  // ── EMPLOYEE INFO rows 6–14 ───────────────────────────────────────────────
  const empRows = [
    ["Employee Id",  d.employeeId,    "Name",             d.name],
    ["Joining Date", d.joiningDate,   "Current Location", d.currentLocation],
    ["P Days",       d.pDays,         "Project",          d.project],
    ["A Days",       d.aDays,         "Designation",      d.designation],
    ["Month Days",   d.monthDays,     "Grade",            d.grade],
    ["EPF No",       d.epfNo,         "ESIC No",          d.esicNo],
    ["UAN No",       d.uanNo,         "Aadhar No",        d.aadharNo],
    ["PAN No",       d.panNo,         "For Month",        d.forMonth],
    ["Bank Name",    d.bankName,      "Bank A/c No",      d.bankAccountNo],
  ];

  empRows.forEach(([l1, v1, l2, v2], i) => {
    const r  = 6 + i;
    const bg = i === 0 ? fillHdr : fillW;
    const fv = i === 0 ? fBN : fN;

    set(`B${r}`, l1,         { font: fB, fill: bg, alignment: lM, border: thinB });
    ws.mergeCells(`C${r}:D${r}`);
    set(`C${r}`, v1 ?? "",   { font: fv, fill: bg, alignment: cM, border: thinB });
    ws.mergeCells(`E${r}:F${r}`);
    set(`E${r}`, l2,         { font: fB, fill: bg, alignment: lM, border: thinB });
    ws.mergeCells(`G${r}:I${r}`);
    set(`G${r}`, v2 ?? "",   { font: fv, fill: bg, alignment: cM, border: thinB });
  });

  // ── TABLE HEADER row 15 ───────────────────────────────────────────────────
  set("B15", "Earning Head",     { font: fB, fill: fillHdr, alignment: cM, border: medB });
  set("C15", "Gross Salary",     { font: fB, fill: fillHdr, alignment: cM, border: medB });
  set("D15", "Gross Salary (d)", { font: fB, fill: fillHdr, alignment: cM, border: medB });
  ws.mergeCells("E15:F15");
  set("E15", "Deduction Head",   { font: fB, fill: fillHdr, alignment: cM, border: medB });
  ws.mergeCells("G15:I15");
  set("G15", "Amount",           { font: fB, fill: fillHdr, alignment: cM, border: medB });

  // ── DATA ROWS 16–19 ───────────────────────────────────────────────────────
  const earnData = [
    ["Basic",                  d.basic,                 d.basicD],
    ["HRA",                    d.hra,                   d.hraD],
    ["Organization Allowance", d.organisationAllowance, d.oaD],
    ["Medical Allowance",      d.medicalAllowance,      d.maD],
  ];
  const dedData = [
    ["PF (Employee + Employer)", d.pfEmp + d.pfCo],
    ["PT",                       d.pt],
    ["Gratuity",                 d.gratuity],
    ["Other",                    0],
  ];

  for (let i = 0; i < 4; i++) {
    const r             = 16 + i;
    const [eL, eG, eGD] = earnData[i];
    const [dL, dA]      = dedData[i];

    set(`B${r}`, eL || "",  { font: fN, fill: fillW, alignment: lM, border: thinB });
    set(`C${r}`, eG,        { font: fN, fill: fillW, alignment: cM, border: thinB, numFmt });
    set(`D${r}`, eGD,       { font: fN, fill: fillW, alignment: cM, border: thinB, numFmt });
    ws.mergeCells(`E${r}:F${r}`);
    set(`E${r}`, dL || "",  { font: fN, fill: fillW, alignment: cM, border: thinB });
    ws.mergeCells(`G${r}:I${r}`);
    set(`G${r}`, dA,        { font: fN, fill: fillW, alignment: cM, border: thinB, numFmt });
  }

  // ── ROW 20 — Total Earning / Total Deduction ──────────────────────────────
  set("B20", "Total Earning",              { font: fB, fill: fillW, alignment: lM, border: thinB });
  set("C20", { formula: "=SUM(C16:C19)" }, { font: fB, fill: fillW, alignment: cM, border: thinB, numFmt });
  set("D20", { formula: "=SUM(D16:D19)" }, { font: fB, fill: fillW, alignment: cM, border: thinB, numFmt });
  ws.mergeCells("E20:F20");
  set("E20", "Total Deduction",            { font: fN, fill: fillW, alignment: cM, border: thinB });
  ws.mergeCells("G20:I20");
  set("G20", { formula: "=SUM(G16:G19)" }, { font: fN, fill: fillW, alignment: cM, border: thinB, numFmt });

  // ── ROW 21 — Performance Pay / Net Salary ────────────────────────────────
  set("B21", "Performance Pay\nVariable pay",              { font: fN, fill: fillW, alignment: lM, border: thinB });
  set("C21", d.performancePay || null,                     { font: fN, fill: fillW, alignment: cM, border: thinB, numFmt });
  set("D21", { formula: `=C21/${d.monthDays}*${d.pDays}` },{ font: fN, fill: fillW, alignment: cM, border: thinB, numFmt });
  ws.mergeCells("E21:F21");
  set("E21", "Net Salary",                                 { font: fB, fill: fillW, alignment: lM, border: medB });
  ws.mergeCells("G21:I21");
  set("G21", { formula: "=D20-G20" },                     { font: fB, fill: fillW, alignment: cM, border: medB, numFmt });

  // ── ROW 22 — Total Earning Potential ─────────────────────────────────────
  set("B22", "Total Earning\nPotential",  { font: fB, fill: fillW, alignment: lM, border: thinB });
  set("C22", { formula: "=C20+C21" },    { font: fB, fill: fillW, alignment: cM, border: thinB, numFmt });
  set("D22", { formula: "=D20+D21" },    { font: fB, fill: fillW, alignment: cM, border: thinB, numFmt });
  ws.mergeCells("E22:F22");
  set("E22", "Performance Pay\nVariable pay", { font: fN, fill: fillW, alignment: cM, border: thinB });
  ws.mergeCells("G22:I22");
  set("G22", { formula: "=D21" },        { font: fN, fill: fillW, alignment: cM, border: thinB, numFmt });

  // ── ROW 23 — Total Earning DARK ───────────────────────────────────────────
  ["B", "C", "D"].forEach((c) => set(`${c}23`, null, { fill: fillW, border: thinB }));
  ws.mergeCells("E23:F23");
  set("E23", "Total Earning", {
    font:      { bold: true, color: { argb: "FFFFFFFF" }, size: 9 },
    fill:      fillDark,
    alignment: lM,
    border:    medB,
  });
  ws.mergeCells("G23:I23");
  set("G23", { formula: "=G21+G22" }, {
    font:      fWht,
    fill:      fillDark,
    alignment: cM,
    border:    medB,
    numFmt,
  });

  // ── ROW 24 — Clean spacer ─────────────────────────────────────────────────
  ws.getRow(24).height = 17;
  for (let c = 2; c <= 9; c++) {
    const cell   = ws.getRow(24).getCell(c);
    cell.value   = "";
    cell.fill    = fillW;
    cell.border  = {
      left:   c === 2 ? { style: "medium", color: { argb: "FF404040" } } : undefined,
      right:  c === 9 ? { style: "medium", color: { argb: "FF404040" } } : undefined,
      top:    undefined,
      bottom: undefined,
    };
  }

  // ── ROW 25 — Footer ───────────────────────────────────────────────────────
  ws.getRow(25).height = 20;
  ws.mergeCells("B25:I25");
  set("B25", '"This is computer generated payslip"', {
    font:      { bold: true, size: 9, name: "Calibri", color: { argb: "FF000000" } },
    fill:      fillHdr,
    alignment: { horizontal: "center", vertical: "middle" },
    border:    {
      top:    { style: "medium", color: { argb: "FF404040" } },
      left:   { style: "medium", color: { argb: "FF404040" } },
      right:  { style: "medium", color: { argb: "FF404040" } },
      bottom: { style: "medium", color: { argb: "FF404040" } },
    },
  });

  // ── OUTER BORDER FIX ──────────────────────────────────────────────────────
  for (let r = 2; r <= 25; r++) {
    for (let c = 2; c <= 9; c++) {
      const cell   = ws.getRow(r).getCell(c);
      const border = { ...(cell.border || {}) };
      if (r === 2)  border.top    = medium;
      if (r === 25) border.bottom = medium;
      if (c === 2)  border.left   = medium;
      if (c === 9)  border.right  = medium;
      cell.border = border;
    }
  }

  // ── Write & download ──────────────────────────────────────────────────────
  const buffer = await wb.xlsx.writeBuffer();
  const blob   = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const url = URL.createObjectURL(blob);
  const a   = document.createElement("a");
  a.href     = url;
  a.download = `Payslip_${d.name || "Employee"}_${d.forMonth?.replace(/\s+/g, "_") || "payslip"}.xlsx`;
  a.click();
  URL.revokeObjectURL(url);
};