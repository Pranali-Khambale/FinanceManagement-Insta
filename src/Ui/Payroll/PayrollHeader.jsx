// src/Ui/Payroll/PayrollHeader.jsx
import React, { useState } from "react";

// const RunPayrollModal = ({ onClose, onRun }) => {
//   const [month, setMonth] = useState("March");
//   const [year, setYear] = useState("2026");
//   const months = [
//     "January",
//     "February",
//     "March",
//     "April",
//     "May",
//     "June",
//     "July",
//     "August",
//     "September",
//     "October",
//     "November",
//     "December",
//   ];
//   return (
//     <div
//       className="fixed inset-0 z-50 flex items-center justify-center p-4"
//       style={{ background: "rgba(15,23,42,0.5)", backdropFilter: "blur(8px)" }}
//     >
//       <div
//         className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden"
//         style={{ animation: "slideUp 0.2s cubic-bezier(.22,1,.36,1)" }}
//       >
//         <style>{`@keyframes slideUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}`}</style>
//         <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
//           <h2 className="text-base font-bold text-slate-800">Run Payroll</h2>
//           <button
//             onClick={onClose}
//             className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-400 text-sm"
//           >
//             ✕
//           </button>
//         </div>
//         <div className="px-6 py-5 space-y-4">
//           <div>
//             <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
//               Month
//             </label>
//             <select
//               value={month}
//               onChange={(e) => setMonth(e.target.value)}
//               className="mt-1.5 w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
//             >
//               {months.map((m) => (
//                 <option key={m}>{m}</option>
//               ))}
//             </select>
//           </div>
//           <div>
//             <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
//               Year
//             </label>
//             <select
//               value={year}
//               onChange={(e) => setYear(e.target.value)}
//               className="mt-1.5 w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
//             >
//               {["2025", "2026", "2027"].map((y) => (
//                 <option key={y}>{y}</option>
//               ))}
//             </select>
//           </div>
//           <div className="bg-indigo-50 border border-indigo-100 rounded-xl px-4 py-3">
//             <p className="text-xs text-indigo-700 font-semibold">
//               ⚠️ This will initiate salary processing for all active employees
//               in the selected period.
//             </p>
//           </div>
//         </div>
//         <div className="px-6 py-4 bg-slate-50 flex gap-3 border-t border-slate-100">
//           <button
//             onClick={onClose}
//             className="flex-1 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-100 transition-all"
//           >
//             Cancel
//           </button>
//           <button
//             onClick={() => {
//               onRun(month, year);
//               onClose();
//             }}
//             className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 text-white text-sm font-bold shadow-md hover:from-indigo-700 hover:to-blue-700 transition-all"
//           >
//             🚀 Run Payroll
//           </button>
//         </div>
//       </div>
//     </div>
//   );
// };

const PayrollHeader = ({ onRunPayroll }) => {
  const [showModal, setShowModal] = useState(false);

  return (
    <>
      {showModal && (
        <RunPayrollModal
          onClose={() => setShowModal(false)}
          onRun={onRunPayroll}
        />
      )}
      <div className="flex flex-col gap-4 mb-6 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight">
            Payroll Management
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Manage salaries, payslips and payroll runs for all employees
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-600 text-sm font-medium shadow-sm hover:bg-slate-50 transition-all">
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            History
          </button>
         
          <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-600 text-sm font-medium shadow-sm hover:bg-slate-50 transition-all">
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
              />
            </svg>
            Export Excel
          </button>
          {/* <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 text-white text-sm font-bold shadow-md hover:from-indigo-700 hover:to-blue-700 transition-all"
          >
            <span className="text-base leading-none">▶</span> Run Payroll
          </button> */}
        </div>
      </div>
    </>
  );
};

export default PayrollHeader;
