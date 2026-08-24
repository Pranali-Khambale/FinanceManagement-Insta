import { EMP_TYPE_BUCKETS } from "../constants";

export const n = (val) => {
  const v = Number(val);
  return isFinite(v) ? v : 0;
};

export const fmtINR = (val) =>
  "₹" +
  n(val).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

export const getEmpTypeBucket = (emp) => {
  const haystack = [
    emp.employmentType || "",
    emp.department || "",
    emp.designation || "",
  ]
    .join(" ")
    .toLowerCase();

  if (EMP_TYPE_BUCKETS.IT.some((kw) => haystack.includes(kw))) return "IT";
  if (EMP_TYPE_BUCKETS.Telecom.some((kw) => haystack.includes(kw)))
    return "Telecom";
  return "Other";
};

export const ptFromGenderAndGross = (forMonth, gender, grossFull) => {
  const isFemale = /female|woman|f/i.test(gender || "");
  if (isFemale && n(grossFull) <= 25000) return 0;
  return /february/i.test(forMonth || "") ? 300 : 200;
};

export const pfFromBasic = (basic) => Math.round(n(basic) * 0.12);
export const employerPfFromBasic = (basic) => Math.round(n(basic) * 0.13);
export const gratuityFromBasic = (basic) =>
  Math.round(n(basic) * 0.0481 * 100) / 100;

export const getDaysInMonth = (forMonth) => {
  if (!forMonth) return 30;
  const MONTHS = {
    january: 1,
    february: 2,
    march: 3,
    april: 4,
    may: 5,
    june: 6,
    july: 7,
    august: 8,
    september: 9,
    october: 10,
    november: 11,
    december: 12,
  };
  const parts = forMonth.trim().toLowerCase().split(/\s+/);
  const monthNum = MONTHS[parts[0]];
  const year = parseInt(parts[1], 10);
  if (!monthNum || isNaN(year)) return 30;
  return new Date(year, monthNum, 0).getDate();
};

export const computePayslip = (emp) => {
  const monthDays = n(emp.monthDays) || 30;
  const pDays = emp.pDays != null ? n(emp.pDays) : monthDays;
  const ratio = monthDays > 0 ? pDays / monthDays : 1;

  const basic = n(emp.basic);
  const hra = n(emp.hra);
  const orgAllow = n(emp.organisationAllowance);
  const perfPay = n(emp.performancePay);
  const tds = n(emp.tds);
  const otherDed = n(emp.otherDeduction);
  const advDed = n(emp.advanceDeduction);
  const advAdd = n(emp.advanceAddition);

  const grossSalary = basic + hra + orgAllow;

  const empPfDed =
    emp.pfDeduction != null ? n(emp.pfDeduction) : pfFromBasic(basic);
  const employerPf =
    emp.employerPfContribution != null
      ? n(emp.employerPfContribution)
      : employerPfFromBasic(basic);
  const totalPf = empPfDed + employerPf;

  const ptDed =
    emp.pt != null
      ? n(emp.pt)
      : ptFromGenderAndGross(emp.forMonth, emp.gender, grossSalary);

  const gratuityAmt =
    emp.gratuity != null ? n(emp.gratuity) : gratuityFromBasic(basic);

  const grossEarned = grossSalary * ratio;
  const perfEarned = perfPay * ratio;

  const totalDeduction =
    empPfDed + employerPf + ptDed + tds + otherDed + advDed + gratuityAmt;
  const netSalary = grossEarned - totalDeduction + advAdd;
  const totalEarning = netSalary + perfEarned;

  return {
    grossSalary,
    grossEarned,
    perfEarned,
    empPfDeduction: empPfDed,
    employerPfContribution: employerPf,
    totalPfContribution: totalPf,
    ptDeduction: ptDed,
    gratuity: gratuityAmt,
    totalDeduction,
    advanceDeduction: advDed,
    advanceAddition: advAdd,
    netSalary,
    totalEarning,
  };
};

export const buildPayrollPayload = (emp, forMonth, correctMonthDays) => ({
  employee_id: emp.id,
  for_month: emp.forMonth || forMonth,
  basic: n(emp.basic),
  hra: n(emp.hra),
  other_allowances: n(emp.organisationAllowance),
  performance_pay: n(emp.performancePay),
  pf_deduction: emp.pfDeduction != null ? n(emp.pfDeduction) : undefined,
  employer_pf_contribution:
    emp.employerPfContribution != null
      ? n(emp.employerPfContribution)
      : undefined,
  pt: emp.pt != null ? n(emp.pt) : undefined,
  gratuity: emp.gratuity != null ? n(emp.gratuity) : undefined,
  tds: n(emp.tds),
  other_deduction: n(emp.otherDeduction),
  p_days: emp.pDays != null ? n(emp.pDays) : undefined,
  month_days: n(emp.monthDays) || correctMonthDays,
});
