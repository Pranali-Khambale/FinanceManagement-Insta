// src/Ui/Payroll/PayslipGenerator.js

export const downloadPayslip = (employee) => {
  const month = new Date().toLocaleString("default", {
    month: "long",
    year: "numeric",
  });
  const gross = employee.salary + employee.bonus;
  const totalDed = employee.tax + employee.deductions;
  const net = gross - totalDed;
  const fmtINR = (n) => "₹" + Number(n).toLocaleString("en-IN");

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<title>Payslip — ${employee.name}</title>
<style>
  *{margin:0;padding:0;box-sizing:border-box}
  body{font-family:'Segoe UI',sans-serif;background:#EEF2FF;min-height:100vh;display:flex;align-items:center;justify-content:center;padding:40px 16px}
  .card{background:#fff;width:700px;border-radius:20px;overflow:hidden;box-shadow:0 20px 60px rgba(79,110,245,.15)}
  .hdr{background:linear-gradient(135deg,#4F6EF5 0%,#3B5BDB 100%);padding:36px 40px;color:#fff;display:flex;align-items:center;justify-content:space-between}
  .hdr-left h1{font-size:22px;font-weight:800;letter-spacing:-.5px}
  .hdr-left p{font-size:13px;opacity:.75;margin-top:4px}
  .hdr-right{text-align:right}
  .hdr-right .chip{display:inline-block;background:rgba(255,255,255,.2);border-radius:20px;padding:5px 14px;font-size:11px;font-weight:700}
  .hdr-right p{font-size:12px;opacity:.7;margin-top:6px}
  .meta{display:grid;grid-template-columns:1fr 1fr 1fr;border-bottom:1px solid #F1F5F9}
  .meta-cell{padding:20px 24px;border-right:1px solid #F1F5F9}
  .meta-cell:last-child{border-right:none}
  .meta-cell label{font-size:10px;color:#94A3B8;text-transform:uppercase;letter-spacing:.06em;font-weight:700}
  .meta-cell p{font-size:14px;color:#1E293B;font-weight:700;margin-top:4px}
  .body{display:grid;grid-template-columns:1fr 1fr;border-bottom:1px solid #F1F5F9}
  .col{padding:24px 28px}
  .col:first-child{border-right:1px solid #F1F5F9}
  .col h2{font-size:11px;color:#64748B;text-transform:uppercase;letter-spacing:.07em;font-weight:700;margin-bottom:14px}
  .row{display:flex;justify-content:space-between;align-items:center;padding:9px 0;border-bottom:1px solid #F8FAFC}
  .row:last-child{border-bottom:none}
  .row span{font-size:13px;color:#475569}
  .earn strong{font-size:13px;color:#059669;font-weight:700}
  .ded  strong{font-size:13px;color:#DC2626;font-weight:700}
  .net-bar{margin:0 28px 28px;background:linear-gradient(135deg,#EEF2FF,#E0E7FF);border-radius:14px;padding:20px 24px;display:flex;justify-content:space-between;align-items:center}
  .net-bar .lbl{font-size:13px;color:#4F6EF5;font-weight:700}
  .net-bar .amt{font-size:28px;color:#1E293B;font-weight:800}
  .foot{background:#F8FAFC;padding:16px 40px;display:flex;align-items:center;justify-content:space-between}
  .foot p{font-size:11px;color:#94A3B8}
  .foot .stamp{font-size:11px;font-weight:700;color:#4F6EF5;border:1.5px solid #C7D2FE;border-radius:6px;padding:3px 10px}
</style>
</head>
<body>
<div class="card">
  <div class="hdr">
    <div class="hdr-left"><h1>FinanceApp</h1><p>Employee Salary Payslip — ${month}</p></div>
    <div class="hdr-right"><div class="chip">OFFICIAL DOCUMENT</div><p>Generated ${new Date().toLocaleDateString("en-IN")}</p></div>
  </div>
  <div class="meta">
    <div class="meta-cell"><label>Employee Name</label><p>${employee.name}</p></div>
    <div class="meta-cell"><label>Employee ID</label><p>${employee.employeeId}</p></div>
    <div class="meta-cell"><label>Designation</label><p>${employee.designation}</p></div>
    <div class="meta-cell"><label>Department</label><p>${employee.department}</p></div>
    <div class="meta-cell"><label>Bank</label><p>${employee.bankName}</p></div>
    <div class="meta-cell"><label>Account No.</label><p>${employee.accountNo}</p></div>
  </div>
  <div class="body">
    <div class="col">
      <h2>Earnings</h2>
      <div class="row earn"><span>Basic Salary</span><strong>${fmtINR(employee.salary)}</strong></div>
      <div class="row earn"><span>Performance Bonus</span><strong>+ ${fmtINR(employee.bonus)}</strong></div>
      <div class="row earn" style="margin-top:8px;border-top:2px solid #D1FAE5;padding-top:10px"><span style="font-weight:700;color:#1E293B">Gross Total</span><strong style="font-size:15px">${fmtINR(gross)}</strong></div>
    </div>
    <div class="col">
      <h2>Deductions</h2>
      <div class="row ded"><span>Income Tax (TDS)</span><strong>- ${fmtINR(employee.tax)}</strong></div>
      <div class="row ded"><span>Other Deductions</span><strong>- ${fmtINR(employee.deductions)}</strong></div>
      <div class="row ded" style="margin-top:8px;border-top:2px solid #FEE2E2;padding-top:10px"><span style="font-weight:700;color:#1E293B">Total Deductions</span><strong style="font-size:15px">- ${fmtINR(totalDed)}</strong></div>
    </div>
  </div>
  <div class="net-bar"><div class="lbl">💰 Net Take-Home Pay</div><div class="amt">${fmtINR(net)}</div></div>
  <div class="foot"><p>Computer-generated payslip — No signature required. FinanceApp © 2026</p><div class="stamp">VERIFIED ✓</div></div>
</div>
</body>
</html>`;

  const blob = new Blob([html], { type: "text/html" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `Payslip_${employee.name.replace(/\s+/g, "_")}_${month.replace(/\s+/g, "_")}.html`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};
