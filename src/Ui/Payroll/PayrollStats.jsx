// src/Ui/Payroll/PayrollStats.jsx
import React from "react";

const StatCard = ({ iconBg, icon, value, label, sub, subColor }) => (
  <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 flex flex-col gap-4 hover:shadow-md transition-shadow">
    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${iconBg}`}>{icon}</div>
    <div>
      <p className="text-3xl font-extrabold text-slate-800 tracking-tight">{value}</p>
      <p className="text-sm text-slate-600 font-medium mt-1">{label}</p>
      <p className={`text-xs font-semibold mt-1 ${subColor}`}>{sub}</p>
    </div>
  </div>
);

const PayrollStats = ({ summary }) => {
  const fmtL = (n) => "₹" + (n / 100000).toFixed(2) + "L";

  return (
    <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
      <StatCard
        iconBg="bg-indigo-100"
        icon={<svg className="w-6 h-6 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"/></svg>}
        value={summary.totalEmployees}
        label="Total Employees"
        sub="All registered"
        subColor="text-indigo-500"
      />
      <StatCard
        iconBg="bg-amber-100"
        icon={<svg className="w-6 h-6 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>}
        value={summary.pending}
        label="Pending"
        sub="Awaiting payment"
        subColor="text-amber-500"
      />
      <StatCard
        iconBg="bg-emerald-100"
        icon={<svg className="w-6 h-6 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>}
        value={summary.paid}
        label="Paid"
        sub="Successfully processed"
        subColor="text-emerald-500"
      />
      <StatCard
        iconBg="bg-blue-100"
        icon={<svg className="w-6 h-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>}
        value={fmtL(summary.totalPayroll)}
        label="Total Payroll"
        sub="Net salaries this period"
        subColor="text-blue-500"
      />
    </div>
  );
};

export default PayrollStats;