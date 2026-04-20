// src/Ui/Payroll/PayslipGenerator.js
// Supports two download formats:
//   1. PDF  (.pdf)  — downloadPayslipPDF(employee)   ← NEW
//   2. Excel (.xlsx) — downloadPayslipExcel(employee) ← unchanged

/* ─── shared data builder ─────────────────────────────────────────────────── */
function _buildData(employee) {
  const {
    name, employeeId, joiningDate, currentLocation,
    pDays = 0, aDays = 0, monthDays = 31,
    project, designation, grade,
    epfNo = "0", esicNo = "0", uanNo = "", aadharNo = "", panNo = "", forMonth = "",
    bankName = "", bankAccountNo = "",
    basic = 0, hra = 0, organisationAllowance = 0, medicalAllowance = 0, performancePay = 0,
    pfDeduction = 0, pt = 0, otherDeduction = 0, tds = 0, advance = 0,
  } = employee;

  const ratio         = monthDays > 0 ? pDays / monthDays : 1;
  const grossSalary   = basic + hra + organisationAllowance + medicalAllowance;
  const grossSalaryD  = grossSalary * ratio;
  const basicD        = basic * ratio;
  const hraD          = hra * ratio;
  const oaD           = organisationAllowance * ratio;
  const medD          = medicalAllowance * ratio;
  const perfD         = performancePay * ratio;
  const totalEarning  = grossSalary + performancePay;
  const totalEarningD = grossSalaryD + perfD;
  const totalDeduction = pfDeduction + pt + otherDeduction + tds + advance;
  const netSalary     = grossSalaryD - totalDeduction;
  const totalWithPerf = netSalary + perfD;

  return {
    name, employeeId, joiningDate, currentLocation,
    pDays, aDays, monthDays, project, designation, grade,
    epfNo, esicNo, uanNo, aadharNo, panNo, forMonth,
    bankName, bankAccountNo,
    basic, hra, organisationAllowance, medicalAllowance, performancePay,
    pfDeduction, pt, otherDeduction, tds, advance,
    grossSalary, grossSalaryD, basicD, hraD, oaD, medD, perfD,
    totalEarning, totalEarningD, totalDeduction, netSalary, totalWithPerf,
  };
}

const inr = (n) =>
  "Rs. " + Number(n || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

/* ─────────────────────────────────────────────────────────────────────────────
   PDF PAYSLIP  (uses jsPDF loaded from CDN)
   ───────────────────────────────────────────────────────────────────────────── */
export const downloadPayslipPDF = async (employee) => {
  // Load jsPDF from CDN if not present
  if (!window.jspdf) {
    await new Promise((resolve, reject) => {
      const s = document.createElement("script");
      s.src = "https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js";
      s.onload = resolve;
      s.onerror = reject;
      document.head.appendChild(s);
    });
  }

  const { jsPDF } = window.jspdf;
  const d = _buildData(employee);

  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

  const W  = 210;   // A4 width mm
  const M  = 12;    // margin
  const CW = W - 2 * M; // content width

  let y = M;

  /* ── helpers ── */
  const setFont = (bold, size, color = [30, 30, 30]) => {
    doc.setFont("helvetica", bold ? "bold" : "normal");
    doc.setFontSize(size);
    doc.setTextColor(...color);
  };
  const rect = (x, yy, w, h, fillColor, strokeColor) => {
    if (fillColor) { doc.setFillColor(...fillColor); doc.rect(x, yy, w, h, "F"); }
    if (strokeColor) { doc.setDrawColor(...strokeColor); doc.rect(x, yy, w, h, "S"); }
  };
  const line = (x1, yy, x2, strokeColor = [220, 220, 220]) => {
    doc.setDrawColor(...strokeColor);
    doc.setLineWidth(0.2);
    doc.line(x1, yy, x2, yy);
  };
  const text = (str, x, yy, opts = {}) => doc.text(String(str ?? "—"), x, yy, opts);

  /* ── HEADER banner ── */
  rect(0, 0, W, 28, [26, 60, 110]);
  setFont(true, 14, [255, 255, 255]);
  text("Insta ICT Solutions Pvt. Ltd.", M, 10);
  setFont(false, 8, [180, 210, 255]);
  text("201-202, Imperial Plaza, Jijai Nagar, Kothrud, Pune - 411 038", M, 16);
  text("www.instagrp.com", M, 21);

  // Month badge (right side)
  rect(W - 60, 5, 52, 16, [255, 255, 255, 0.1]);
  setFont(true, 9, [255, 255, 255]);
  text("SALARY PAYSLIP", W - 34, 12, { align: "center" });
  setFont(false, 8, [180, 210, 255]);
  text(d.forMonth || "—", W - 34, 18, { align: "center" });

  y = 34;

  /* ── Employee info grid ── */
  rect(M, y, CW, 7, [240, 245, 255]);
  setFont(true, 9, [26, 60, 110]);
  text("EMPLOYEE DETAILS", M + 2, y + 5);
  y += 9;

  const infoRows = [
    ["Employee ID", d.employeeId,       "Name",             d.name],
    ["Joining Date", d.joiningDate,     "Current Location", d.currentLocation],
    ["P Days",       d.pDays,           "A Days",           d.aDays],
    ["Month Days",   d.monthDays,       "Project",          d.project],
    ["Designation",  d.designation,     "Grade",            d.grade],
    ["EPF No",       d.epfNo,           "ESIC No",          d.esicNo],
    ["UAN No",       d.uanNo,           "Aadhar No",        d.aadharNo],
    ["PAN No",       d.panNo,           "Bank Name",        d.bankName],
    ["Bank A/c No",  d.bankAccountNo,   "For Month",        d.forMonth],
  ];

  const colW = CW / 4;
  infoRows.forEach((row, i) => {
    const rowY = y + i * 7;
    const bg   = i % 2 === 0 ? [248, 250, 252] : [255, 255, 255];
    rect(M, rowY, CW, 7, bg);

    setFont(false, 7.5, [100, 116, 139]);
    text(row[0], M + 2, rowY + 5);
    setFont(true,  8,   [30, 41, 59]);
    text(row[1] ?? "—", M + 2 + colW, rowY + 5);

    setFont(false, 7.5, [100, 116, 139]);
    text(row[2], M + 2 + colW * 2, rowY + 5);
    setFont(true,  8,   [30, 41, 59]);
    text(row[3] ?? "—", M + 2 + colW * 3, rowY + 5);

    // grid lines
    doc.setDrawColor(220, 225, 230);
    doc.setLineWidth(0.1);
    doc.rect(M, rowY, CW, 7, "S");
  });

  y += infoRows.length * 7 + 5;

  /* ── Earnings / Deductions header ── */
  const halfW = CW / 2 - 2;

  // Earnings
  rect(M, y, halfW, 7, [26, 60, 110]);
  setFont(true, 8.5, [255, 255, 255]);
  text("EARNINGS", M + halfW / 2, y + 5, { align: "center" });

  // Deductions
  rect(M + halfW + 4, y, halfW, 7, [153, 27, 27]);
  text("DEDUCTIONS", M + halfW + 4 + halfW / 2, y + 5, { align: "center" });

  y += 8;

  // Sub-header
  const drawSubHeader = (x, w) => {
    rect(x, y, w, 6, [241, 245, 249]);
    setFont(true, 7.5, [71, 85, 105]);
    text("Head",        x + 2, y + 4.5);
    text("Gross",       x + w * 0.5, y + 4.5, { align: "center" });
    text("Gross (d)",   x + w - 2, y + 4.5, { align: "right" });
    doc.setDrawColor(200, 210, 220);
    doc.setLineWidth(0.1);
    doc.rect(x, y, w, 6, "S");
  };
  drawSubHeader(M, halfW);

  // Deduction sub-header (2 cols)
  rect(M + halfW + 4, y, halfW, 6, [241, 245, 249]);
  setFont(true, 7.5, [71, 85, 105]);
  text("Head",         M + halfW + 6, y + 4.5);
  text("Amount",       M + halfW + 4 + halfW - 2, y + 4.5, { align: "right" });
  doc.setLineWidth(0.1);
  doc.rect(M + halfW + 4, y, halfW, 6, "S");

  y += 7;

  /* ── Data rows ── */
  const earningRows = [
    ["Basic",                  d.basic,                d.basicD],
    ["HRA",                    d.hra,                  d.hraD],
    ["Organisation Allowance", d.organisationAllowance,d.oaD],
    ["Medical Allowance",      d.medicalAllowance,     d.medD],
  ];

  const deductionRows = [
    ["PF (Emp + Employer)", d.pfDeduction],
    ["Professional Tax",    d.pt],
    ["TDS",                 d.tds],
    ["Advance",             d.advance],
    ["Other Deductions",    d.otherDeduction],
  ];

  const maxRows = Math.max(earningRows.length, deductionRows.length);

  for (let i = 0; i < maxRows; i++) {
    const rowBg = i % 2 === 0 ? [250, 252, 255] : [255, 255, 255];
    const rowY  = y + i * 7;

    // Earning row
    if (earningRows[i]) {
      const [label, gross, grossD] = earningRows[i];
      rect(M, rowY, halfW, 7, rowBg);
      setFont(false, 7.5, [51, 65, 85]);
      text(label, M + 2, rowY + 5);
      setFont(false, 7.5, [30, 41, 59]);
      text(inr(gross),  M + halfW * 0.5, rowY + 5, { align: "center" });
      text(inr(grossD), M + halfW - 2,   rowY + 5, { align: "right" });
      doc.setDrawColor(220, 225, 235);
      doc.setLineWidth(0.1);
      doc.rect(M, rowY, halfW, 7, "S");
    }

    // Deduction row
    if (deductionRows[i]) {
      const [label, amt] = deductionRows[i];
      rect(M + halfW + 4, rowY, halfW, 7, rowBg);
      setFont(false, 7.5, [51, 65, 85]);
      text(label, M + halfW + 6, rowY + 5);
      setFont(false, 7.5, [153, 27, 27]);
      text(inr(amt), M + halfW + 4 + halfW - 2, rowY + 5, { align: "right" });
      doc.setDrawColor(220, 225, 235);
      doc.setLineWidth(0.1);
      doc.rect(M + halfW + 4, rowY, halfW, 7, "S");
    }
  }

  y += maxRows * 7 + 1;

  /* ── Totals section ── */
  const totals = [
    { label: "Total Earning",           gs: d.grossSalary,  gsd: d.grossSalaryD,  isGreen: true  },
    { label: "Perf. Pay / Variable",    gs: d.performancePay, gsd: d.perfD,        isGreen: false, italic: true },
    { label: "Total Earning Potential", gs: d.totalEarning, gsd: d.totalEarningD, isDark: true   },
  ];

  const deductTotals = [
    { label: "Total Deduction",   amt: d.totalDeduction, isRed: true },
    { label: "Net Salary",        amt: d.netSalary,      isGreen: true },
    { label: "Perf. Pay",         amt: d.perfD,          isItalic: true },
    { label: "Total Earning",     amt: d.totalWithPerf,  isDark: true },
  ];

  totals.forEach((row, i) => {
    const rowY = y + i * 8;
    const bg   = row.isDark ? [26, 60, 110] : row.isGreen ? [240, 253, 244] : [248, 250, 252];
    const tc   = row.isDark ? [255, 255, 255] : row.isGreen ? [22, 101, 52] : [30, 41, 59];
    rect(M, rowY, halfW, 8, bg);
    setFont(true, 8, tc);
    text(row.label, M + 2, rowY + 5.5);
    text(inr(row.gs),  M + halfW * 0.5, rowY + 5.5, { align: "center" });
    text(inr(row.gsd), M + halfW - 2,   rowY + 5.5, { align: "right" });
    doc.setDrawColor(200, 210, 220);
    doc.setLineWidth(0.3);
    doc.rect(M, rowY, halfW, 8, "S");
  });

  deductTotals.forEach((row, i) => {
    const rowY = y + i * 8;
    const bg   = row.isDark ? [26, 60, 110] : row.isGreen ? [240, 253, 244] : row.isRed ? [254, 242, 242] : [248, 250, 252];
    const tc   = row.isDark ? [255, 255, 255] : row.isGreen ? [22, 101, 52] : row.isRed ? [153, 27, 27] : [30, 41, 59];
    rect(M + halfW + 4, rowY, halfW, 8, bg);
    setFont(true, 8, tc);
    text(row.label, M + halfW + 6, rowY + 5.5);
    text(inr(row.amt), M + halfW + 4 + halfW - 2, rowY + 5.5, { align: "right" });
    doc.setDrawColor(200, 210, 220);
    doc.setLineWidth(0.3);
    doc.rect(M + halfW + 4, rowY, halfW, 8, "S");
  });

  y += Math.max(totals.length, deductTotals.length) * 8 + 6;

  /* ── Footer ── */
  rect(0, y, W, 12, [26, 60, 110]);
  setFont(false, 7.5, [180, 210, 255]);
  text(
    '"This is a computer generated payslip" — No signature required.',
    W / 2,
    y + 7.5,
    { align: "center" }
  );

  /* ── Save ── */
  doc.save(`Payslip_${d.name.replace(/\s+/g, "_")}_${d.forMonth?.replace(/\s+/g, "_") || "payslip"}.pdf`);
};


/* ─────────────────────────────────────────────────────────────────────────────
   EXCEL PAYSLIP (unchanged from original)
   ───────────────────────────────────────────────────────────────────────────── */
export const downloadPayslipExcel = async (employee) => {
  if (!window.ExcelJS) {
    await new Promise((resolve, reject) => {
      const s = document.createElement("script");
      s.src = "https://cdnjs.cloudflare.com/ajax/libs/exceljs/4.4.0/exceljs.min.js";
      s.onload = resolve;
      s.onerror = reject;
      document.head.appendChild(s);
    });
  }

  const d = _buildData(employee);
  const wb = new window.ExcelJS.Workbook();
  const ws = wb.addWorksheet("Payslip");

  ws.columns = [
    { width: 26 }, { width: 14 }, { width: 18 }, { width: 30 }, { width: 16 },
  ];
  ws.getRow(2).height = 28;
  ws.getRow(6).height = 22;
  ws.getRow(13).height = 20;

  const thin = { style: "thin" };
  const border = { top: thin, left: thin, bottom: thin, right: thin };
  const center = { horizontal: "center", vertical: "middle" };
  const right  = { horizontal: "right" };
  const grey1  = { type: "pattern", pattern: "solid", fgColor: { argb: "FFD9D9D9" } };
  const grey2  = { type: "pattern", pattern: "solid", fgColor: { argb: "FFBFBFBF" } };

  for (let r = 2; r <= 25; r++) {
    ["A","B","C","D","E"].forEach(c => {
      ws.getCell(`${c}${r}`).border = border;
    });
  }

  ws.mergeCells("B2:E2");
  ws.getCell("B2").value = "Insta ICT Solutions Pvt. Ltd.";
  ws.getCell("B2").font  = { bold: true, size: 13 };
  ws.getCell("B2").alignment = center;

  ws.mergeCells("B3:E3");
  ws.getCell("B3").value = "201 - 202, Imperial Plaza, Jijai Nagar, Kothrud, Pune - 411 038.";
  ws.getCell("B3").alignment = center;

  ws.mergeCells("A6:E6");
  ws.getCell("A6").value = `Payslip: ${d.forMonth}`;
  ws.getCell("A6").fill  = grey1;
  ws.getCell("A6").font  = { bold: true };
  ws.getCell("A6").alignment = center;

  const empRows = [
    ["Employee Id",  d.employeeId,       "Name",             d.name],
    ["Joining Date", d.joiningDate,      "Current Location", d.currentLocation],
    ["P Days",       d.pDays,            "Project",          d.project],
    ["A Days",       d.aDays,            "Designation",      d.designation],
    ["Month Days",   d.monthDays,        "Grade",            d.grade],
  ];
  empRows.forEach((row, i) => {
    const r = 7 + i;
    ["A","B","C","D"].forEach((c, j) => {
      ws.getCell(`${c}${r}`).value = row[j];
    });
  });

  ["A","B","C","D","E"].forEach((c, i) => {
    const cell = ws.getCell(`${c}13`);
    cell.value = ["Earning Head","Gross Salary","Gross Salary (d)","Deduction Head","Amount"][i];
    cell.fill  = grey2;
    cell.font  = { bold: true };
    cell.alignment = center;
  });

  const dataRows = [
    ["Basic",                  d.basic,                 d.basicD, "PF (Employee + Employer)", d.pfDeduction],
    ["HRA",                    d.hra,                   d.hraD,   "PT",                       d.pt],
    ["Organization Allowance", d.organisationAllowance, d.oaD,    "Other",                    d.otherDeduction],
  ];
  dataRows.forEach((row, i) => {
    const r = 14 + i;
    row.forEach((v, j) => {
      const c = ["A","B","C","D","E"][j];
      const cell = ws.getCell(`${c}${r}`);
      cell.value = v;
      if (["B","C","E"].includes(c)) cell.alignment = right;
    });
  });

  const totals = [
    ["Total Earning",               d.grossSalary,   d.grossSalaryD,  "Total Deduction",              d.totalDeduction],
    ["Performance Pay Variable pay", d.performancePay, d.perfD,        "Net Salary",                   d.netSalary],
    ["Total Earning Potential",      d.totalEarning,  d.totalEarningD, "Performance Pay Variable pay", d.perfD],
    ["",                             "",              "",              "Total Earning",                 d.totalWithPerf],
  ];
  totals.forEach((row, i) => {
    const r = 17 + i;
    row.forEach((v, j) => {
      const c = ["A","B","C","D","E"][j];
      const cell = ws.getCell(`${c}${r}`);
      cell.value = v;
      cell.font  = { bold: true };
      if (["B","C","E"].includes(c)) cell.alignment = right;
    });
  });

  ws.mergeCells("A24:E24");
  ws.getCell("A24").value     = '"This is computer generated payslip"';
  ws.getCell("A24").fill      = grey1;
  ws.getCell("A24").alignment = center;

  const buffer = await wb.xlsx.writeBuffer();
  const blob   = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
  const url    = URL.createObjectURL(blob);
  const a      = document.createElement("a");
  a.href       = url;
  a.download   = `Payslip_${d.name}.xlsx`;
  a.click();
  URL.revokeObjectURL(url);
};