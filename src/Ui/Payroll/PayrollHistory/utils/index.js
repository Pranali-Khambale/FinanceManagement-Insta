import { AVATAR_PALETTE } from "../constants";

export const fmtINR = (n) =>
  "₹" +
  Number(n || 0).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

export const fmtCompact = (n) => {
  const v = Number(n || 0);
  if (v >= 100000) return "₹" + (v / 100000).toFixed(1) + "L";
  if (v >= 1000) return "₹" + (v / 1000).toFixed(1) + "K";
  return "₹" + v.toFixed(0);
};

export const avatarColor = (name = "") =>
  AVATAR_PALETTE[name.charCodeAt(0) % AVATAR_PALETTE.length];

export const initials = (name = "") =>
  name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();

export const buildMonths = () => {
  const list = ["All Months"];
  for (let i = 0; i < 12; i++) {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    list.push(d.toLocaleString("en-IN", { month: "long", year: "numeric" }));
  }
  return list;
};

export const timeAgoLabel = (paidAt) => {
  if (!paidAt) return null;
  const days = Math.floor((Date.now() - new Date(paidAt)) / 86400000);
  if (days === 0) return "Today";
  if (days < 30) return `${days}d ago`;
  return `${Math.floor(days / 30)}mo ago`;
};

export const formatDate = (dateStr) =>
  dateStr
    ? new Date(dateStr).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "—";

export const normalizeRecord = (emp, month) => ({
  id: emp.payrollRecordId,
  employeeId: emp.employeeId,
  name: emp.name,
  department: emp.department,
  designation: emp.designation,
  forMonth: month,
  basic: emp.basic,
  hra: emp.hra,
  organisationAllowance: emp.organisationAllowance,
  medicalAllowance: emp.medicalAllowance,
  performancePay: emp.performancePay,
  grossSalary: emp.grossSalary,
  grossEarned: emp.grossEarned,
  pfDeduction: emp.pfDeduction,
  employerPfContribution: emp.employerPfContribution,
  totalPfContribution: emp.totalPfContribution,
  pt: emp.pt,
  tds: emp.tds,
  otherDeduction: emp.otherDeduction,
  advanceDeduction: emp.advanceDeduction,
  advanceAddition: emp.advanceAddition,
  totalDeduction: emp.totalDeduction,
  netSalary: emp.netSalary,
  totalEarning: emp.totalEarning,
  pDays: emp.pDays,
  aDays: emp.aDays,
  monthDays: emp.monthDays,
  status: emp.status,
  paidAt: emp.paidAt,
  bankName: emp.bankName,
  accountNumber: emp.accountNumber,
  ifscCode: emp.ifscCode,
  panNo: emp.panNo,
});
