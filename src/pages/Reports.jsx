// src/pages/Reports.jsx
// This file acts as the page entry-point AND re-exports everything from the
// Ui/Reports barrel so other pages can do:
//   import { PayrollReport, AdvancePaymentReport } from "../pages/Reports";

export { default } from "../Ui/Reports/ReportsPage";
export { default as PayrollReport } from "../Ui/Reports/PayrollReport";
export { default as AdvancePaymentReport } from "../Ui/Reports/AdvancePaymentReport";
export { default as EmployeeReport } from "../Ui/Reports/EmployeeReport";
export * from "../Ui/Reports/reportUtils";
