// src/Ui/Payroll/ExportPayrollExcel.js
// Exports the filtered payroll table data to a formatted Excel (.xlsx) file

function computePayslip(emp) {
  const ratio          = (emp.monthDays || 31) > 0 ? (emp.pDays || 0) / (emp.monthDays || 31) : 1;
  const grossSalary    = (emp.basic || 0) + (emp.hra || 0) + (emp.organisationAllowance || 0) + (emp.medicalAllowance || 0);
  const grossSalaryD   = grossSalary * ratio;
  const perfD          = (emp.performancePay || 0) * ratio;
  const totalDeduction = (emp.pfDeduction || 0) + (emp.pt || 0) + (emp.otherDeduction || 0) + (emp.tds || 0) + (emp.advance || 0);
  const netSalary      = grossSalaryD - totalDeduction;
  const totalWithPerf  = netSalary + perfD;
  return { grossSalary, grossSalaryD, perfD, totalDeduction, netSalary, totalWithPerf };
}

export const exportPayrollToExcel = async (employees, label = "Payroll") => {
  // Dynamically load ExcelJS if not already present
  if (!window.ExcelJS) {
    await new Promise((resolve, reject) => {
      const s = document.createElement("script");
      s.src = "https://cdnjs.cloudflare.com/ajax/libs/exceljs/4.4.0/exceljs.min.js";
      s.onload = resolve;
      s.onerror = reject;
      document.head.appendChild(s);
    });
  }

  const wb = new window.ExcelJS.Workbook();
  wb.creator  = "Insta ICT Solutions Pvt. Ltd.";
  wb.created  = new Date();

  const ws = wb.addWorksheet("Payroll Report");

  // ── Column definitions ───────────────────────────────────────────────────
  ws.columns = [
    { header: "",                        key: "sr",               width: 5  },
    { header: "Employee ID",             key: "employeeId",       width: 14 },
    { header: "Name",                    key: "name",             width: 22 },
    { header: "Department",              key: "department",       width: 16 },
    { header: "Designation",             key: "designation",      width: 20 },
    { header: "Grade",                   key: "grade",            width: 8  },
    { header: "Joining Date",            key: "joiningDate",      width: 13 },
    { header: "Location",                key: "currentLocation",  width: 14 },
    { header: "Bank Name",               key: "bankName",         width: 18 },
    { header: "Bank A/c No",             key: "bankAccountNo",    width: 18 },
    { header: "P Days",                  key: "pDays",            width: 8  },
    { header: "A Days",                  key: "aDays",            width: 8  },
    { header: "Month Days",              key: "monthDays",        width: 10 },
    { header: "Basic (₹)",              key: "basic",            width: 13 },
    { header: "HRA (₹)",               key: "hra",              width: 13 },
    { header: "Org. Allowance (₹)",    key: "orgAllow",         width: 17 },
    { header: "Medical Allowance (₹)", key: "medAllow",         width: 18 },
    { header: "Perf. Pay (₹)",         key: "performancePay",   width: 13 },
    { header: "Gross Salary (₹)",      key: "grossSalary",      width: 15 },
    { header: "Gross Salary (d) (₹)",  key: "grossSalaryD",     width: 17 },
    { header: "PF (₹)",                key: "pfDeduction",      width: 13 },
    { header: "PT (₹)",                key: "pt",               width: 10 },
    { header: "TDS (₹)",               key: "tds",              width: 11 },
    { header: "Advance (₹)",           key: "advance",          width: 13 },
    { header: "Other Ded. (₹)",        key: "otherDeduction",   width: 14 },
    { header: "Total Deduction (₹)",   key: "totalDeduction",   width: 16 },
    { header: "Net Salary (₹)",        key: "netSalary",        width: 15 },
    { header: "Total Earning (₹)",     key: "totalWithPerf",    width: 16 },
    { header: "Status",                  key: "status",           width: 10 },
  ];

  const thin   = { style: "thin", color: { argb: "FFD0D5DD" } };
  const border = { top: thin, left: thin, bottom: thin, right: thin };

  const DARK_BLUE = "FF1A3C6E";
  const LIGHT_BLUE = "FFD6E4F7";
  const HEADER_GREEN = "FF166534";
  const LIGHT_GREEN = "FFD1FAE5";
  const LIGHT_RED   = "FFFEE2E2";
  const LIGHT_GREY  = "FFF8FAFC";
  const WHITE       = "FFFFFFFF";

  // ── Title row ─────────────────────────────────────────────────────────────
  ws.mergeCells("A1:AC1");
  const titleCell = ws.getCell("A1");
  titleCell.value     = "Insta ICT Solutions Pvt. Ltd. — Payroll Report";
  titleCell.font      = { name: "Arial", bold: true, size: 14, color: { argb: WHITE } };
  titleCell.fill      = { type: "pattern", pattern: "solid", fgColor: { argb: DARK_BLUE } };
  titleCell.alignment = { horizontal: "center", vertical: "middle" };
  ws.getRow(1).height = 32;

  // ── Sub-title row ─────────────────────────────────────────────────────────
  ws.mergeCells("A2:AC2");
  const subCell = ws.getCell("A2");
  subCell.value     = `${label}  |  Exported on: ${new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}  |  Total Employees: ${employees.length}`;
  subCell.font      = { name: "Arial", size: 10, color: { argb: WHITE }, italic: true };
  subCell.fill      = { type: "pattern", pattern: "solid", fgColor: { argb: DARK_BLUE } };
  subCell.alignment = { horizontal: "center", vertical: "middle" };
  ws.getRow(2).height = 20;

  // ── Column group labels (row 3) ───────────────────────────────────────────
  const groupStyle = (argb) => ({
    fill: { type: "pattern", pattern: "solid", fgColor: { argb } },
    font: { name: "Arial", bold: true, size: 9, color: { argb: WHITE } },
    alignment: { horizontal: "center", vertical: "middle" },
    border,
  });

  // Employee info: A3:M3
  ws.mergeCells("A3:M3");
  Object.assign(ws.getCell("A3"), groupStyle("FF334155"));
  ws.getCell("A3").value = "Employee Information";

  // Earnings: N3:T3
  ws.mergeCells("N3:T3");
  Object.assign(ws.getCell("N3"), groupStyle("FF166534"));
  ws.getCell("N3").value = "Earnings";

  // Deductions: U3:AC3
  ws.mergeCells("U3:AC3"); // up to status
  Object.assign(ws.getCell("U3"), groupStyle("FF991B1B"));
  ws.getCell("U3").value = "Deductions & Net";

  ws.getRow(3).height = 18;

  // ── Header row (row 4) ────────────────────────────────────────────────────
  const headerRow = ws.getRow(4);
  headerRow.height = 22;

  // Insert Sr. No header manually at A4
  ws.getCell("A4").value = "Sr.";

  ws.columns.forEach((col, idx) => {
    const colLetter = ws.getColumn(idx + 1).letter;
    const cell = ws.getCell(`${colLetter}4`);
    if (!cell.value) cell.value = col.header;

    cell.font      = { name: "Arial", bold: true, size: 9, color: { argb: WHITE } };
    cell.fill      = { type: "pattern", pattern: "solid", fgColor: { argb: "FF1E3A5F" } };
    cell.alignment = { horizontal: "center", vertical: "middle", wrapText: true };
    cell.border    = border;
  });

  // ── Data rows (starting row 5) ────────────────────────────────────────────
  const currFmt = '₹#,##0.00';
  const numFmt  = '#,##0';

  employees.forEach((emp, i) => {
    const { grossSalary, grossSalaryD, perfD, totalDeduction, netSalary, totalWithPerf } = computePayslip(emp);
    const isEven = i % 2 === 0;
    const rowBg  = isEven ? WHITE : LIGHT_GREY;
    const rowNum = 5 + i;

    const row = ws.addRow({
      sr:              i + 1,
      employeeId:      emp.employeeId      || "",
      name:            emp.name            || "",
      department:      emp.department      || "",
      designation:     emp.designation     || "",
      grade:           emp.grade           || "",
      joiningDate:     emp.joiningDate     || "",
      currentLocation: emp.currentLocation || "",
      bankName:        emp.bankName        || "",
      bankAccountNo:   emp.bankAccountNo   || "",
      pDays:           emp.pDays           || 0,
      aDays:           emp.aDays           || 0,
      monthDays:       emp.monthDays       || 31,
      basic:           emp.basic           || 0,
      hra:             emp.hra             || 0,
      orgAllow:        emp.organisationAllowance || 0,
      medAllow:        emp.medicalAllowance      || 0,
      performancePay:  emp.performancePay        || 0,
      grossSalary,
      grossSalaryD,
      pfDeduction:     emp.pfDeduction    || 0,
      pt:              emp.pt             || 0,
      tds:             emp.tds            || 0,
      advance:         emp.advance        || 0,
      otherDeduction:  emp.otherDeduction || 0,
      totalDeduction,
      netSalary,
      totalWithPerf,
      status:          emp.status         || "Pending",
    });

    row.height = 18;

    row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
      cell.border    = border;
      cell.font      = { name: "Arial", size: 9 };
      cell.alignment = { vertical: "middle" };

      // Currency columns: 14–20, 21–28
      const currCols = [14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28];
      const numCols  = [11, 12, 13];

      if (currCols.includes(colNumber)) {
        cell.numFmt    = currFmt;
        cell.alignment = { horizontal: "right", vertical: "middle" };
      } else if (numCols.includes(colNumber)) {
        cell.numFmt    = numFmt;
        cell.alignment = { horizontal: "center", vertical: "middle" };
      } else if (colNumber === 1) {
        cell.alignment = { horizontal: "center", vertical: "middle" };
      }

      // Earning columns: green tint
      if ([14, 15, 16, 17, 18, 19, 20].includes(colNumber)) {
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: isEven ? "FFF0FDF4" : LIGHT_GREY } };
      }
      // Deduction columns: red tint
      else if ([21, 22, 23, 24, 25, 26].includes(colNumber)) {
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: isEven ? "FFFFF1F1" : LIGHT_GREY } };
        cell.font = { name: "Arial", size: 9, color: { argb: "FF991B1B" } };
      }
      // Net Salary: bold green
      else if (colNumber === 27) {
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: LIGHT_GREEN } };
        cell.font = { name: "Arial", size: 9, bold: true, color: { argb: "FF166534" } };
      }
      // Total Earning: bold dark blue
      else if (colNumber === 28) {
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: LIGHT_BLUE } };
        cell.font = { name: "Arial", size: 9, bold: true, color: { argb: DARK_BLUE } };
      }
      // Status pill
      else if (colNumber === 29) {
        cell.alignment = { horizontal: "center", vertical: "middle" };
        if (emp.status === "Paid") {
          cell.font = { name: "Arial", size: 9, bold: true, color: { argb: "FF166534" } };
          cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: LIGHT_GREEN } };
        } else {
          cell.font = { name: "Arial", size: 9, bold: true, color: { argb: "FF92400E" } };
          cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFFEF3C7" } };
        }
      } else {
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: rowBg } };
      }
    });
  });

  // ── Summary row ───────────────────────────────────────────────────────────
  const summaryRowNum = 5 + employees.length;
  const dataStart     = 5;
  const dataEnd       = summaryRowNum - 1;

  const summaryRow = ws.getRow(summaryRowNum);
  summaryRow.height = 22;

  // Label spanning A–M
  ws.mergeCells(`A${summaryRowNum}:M${summaryRowNum}`);
  const sumLabel = ws.getCell(`A${summaryRowNum}`);
  sumLabel.value     = `TOTALS  (${employees.length} employees)`;
  sumLabel.font      = { name: "Arial", bold: true, size: 10, color: { argb: WHITE } };
  sumLabel.fill      = { type: "pattern", pattern: "solid", fgColor: { argb: DARK_BLUE } };
  sumLabel.alignment = { horizontal: "center", vertical: "middle" };
  sumLabel.border    = border;

  // Currency sum columns
  const sumColMap = {
    N: "basic",
    O: "hra",
    P: "orgAllow",
    Q: "medAllow",
    R: "performancePay",
    S: "grossSalary",
    T: "grossSalaryD",
    U: "pfDeduction",
    V: "pt",
    W: "tds",
    X: "advance",
    Y: "otherDeduction",
    Z: "totalDeduction",
    AA: "netSalary",
    AB: "totalWithPerf",
  };

  Object.entries(sumColMap).forEach(([col]) => {
    const cell = ws.getCell(`${col}${summaryRowNum}`);
    cell.value     = { formula: `SUM(${col}${dataStart}:${col}${dataEnd})` };
    cell.numFmt    = currFmt;
    cell.font      = { name: "Arial", bold: true, size: 9, color: { argb: WHITE } };
    cell.fill      = { type: "pattern", pattern: "solid", fgColor: { argb: DARK_BLUE } };
    cell.alignment = { horizontal: "right", vertical: "middle" };
    cell.border    = border;
  });

  // Status cell (AC)
  const statusSumCell = ws.getCell(`AC${summaryRowNum}`);
  statusSumCell.value     = `${employees.filter(e => e.status === "Paid").length} Paid / ${employees.filter(e => e.status === "Pending").length} Pending`;
  statusSumCell.font      = { name: "Arial", bold: true, size: 9, color: { argb: WHITE } };
  statusSumCell.fill      = { type: "pattern", pattern: "solid", fgColor: { argb: DARK_BLUE } };
  statusSumCell.alignment = { horizontal: "center", vertical: "middle" };
  statusSumCell.border    = border;

  // ── Freeze top rows & header ───────────────────────────────────────────────
  ws.views = [{ state: "frozen", xSplit: 3, ySplit: 4 }];

  // ── Footer note ───────────────────────────────────────────────────────────
  const footerRowNum = summaryRowNum + 2;
  ws.mergeCells(`A${footerRowNum}:AC${footerRowNum}`);
  const footerCell = ws.getCell(`A${footerRowNum}`);
  footerCell.value     = '"This is a computer generated payroll report" — Insta ICT Solutions Pvt. Ltd.';
  footerCell.font      = { name: "Arial", size: 9, italic: true, color: { argb: "FF94A3B8" } };
  footerCell.alignment = { horizontal: "center", vertical: "middle" };

  // ── Download ───────────────────────────────────────────────────────────────
  const buffer = await wb.xlsx.writeBuffer();
  const blob   = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const url = URL.createObjectURL(blob);
  const a   = document.createElement("a");
  a.href     = url;
  a.download = `Payroll_Export_${label.replace(/\s+/g, "_")}_${new Date().toISOString().slice(0, 10)}.xlsx`;
  a.click();
  URL.revokeObjectURL(url);
};