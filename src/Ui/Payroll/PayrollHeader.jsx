// src/Ui/Payroll/PayrollHeader.jsx
import React, { useState } from 'react';
import * as XLSX from 'https://cdn.sheetjs.com/xlsx-0.20.3/package/xlsx.mjs';
import PayrollHistoryModal from './PayrollHistoryModal';

const NEFT_DATA = [
  { NEFT:'N', Amount:1233, Date:'16/03/2026', 'Employee Name':'Seema Kokare',    'Employee AC Num':'22911020213',    Blank1:'', Blank2:'', 'Default Number':'920020004612264', Narration:'IGRServiceHdeskSalSeemaFeb26',   'IFSC Code':'SCBL0036050', 'Default Number2':10 },
  { NEFT:'N', Amount:122,  Date:'16/03/2026', 'Employee Name':'Nitin Rajput',    'Employee AC Num':'36027034160',    Blank1:'', Blank2:'', 'Default Number':'920020004612264', Narration:'IGRServiceHdeskSalNitinFeb26',   'IFSC Code':'SBIN0012707', 'Default Number2':10 },
  { NEFT:'N', Amount:1232, Date:'16/03/2026', 'Employee Name':'Krushna Kapse',   'Employee AC Num':'80063662295',    Blank1:'', Blank2:'', 'Default Number':'920020004612264', Narration:'IGRServiceHdeskSalKrushnaFeb26', 'IFSC Code':'MAHG0005122', 'Default Number2':10 },
  { NEFT:'N', Amount:1232, Date:'16/03/2026', 'Employee Name':'Ashwini Wadurkar','Employee AC Num':'967710110004528',Blank1:'', Blank2:'', 'Default Number':'920020004612264', Narration:'IGRServiceHdeskSalAshwiniFeb26', 'IFSC Code':'BKID0009677', 'Default Number2':10 },
];

const handleExportExcel = () => {
  const wb = XLSX.utils.book_new();
  const headers = ['NEFT','Amount','Date','Employee Name','Employee AC Num','Blank','Blank','Default Number','Narration for what reason','IFSC Code','Default Number'];
  const rows = NEFT_DATA.map(r => [r.NEFT,r.Amount,r.Date,r['Employee Name'],r['Employee AC Num'],r.Blank1,r.Blank2,r['Default Number'],r.Narration,r['IFSC Code'],r['Default Number2']]);
  const ws = XLSX.utils.aoa_to_sheet([...rows, [], headers]);
  ws['!cols'] = [{wch:6},{wch:10},{wch:14},{wch:20},{wch:20},{wch:8},{wch:8},{wch:20},{wch:35},{wch:14},{wch:16}];
  XLSX.utils.book_append_sheet(wb, ws, 'Sample Records');
  XLSX.writeFile(wb, 'NEFT_Salary_IGR_Team.xlsx');
};

const PayrollHeader = ({ onRunPayroll }) => {
  const [historyOpen, setHistoryOpen] = useState(false);

  return (
    <>
      {historyOpen && <PayrollHistoryModal onClose={() => setHistoryOpen(false)} />}

      <div className="flex flex-col gap-4 mb-6 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight">Payroll Management</h1>
          <p className="text-sm text-slate-400 mt-1">Manage salaries, payslips and payroll runs for all employees</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setHistoryOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 bg-white text-slate-600 text-xs font-semibold shadow-sm hover:bg-slate-50 transition-all"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
            History
          </button>
          <button
            onClick={handleExportExcel}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 bg-white text-slate-600 text-xs font-semibold shadow-sm hover:bg-slate-50 transition-all"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/>
            </svg>
            NEFT Excel
          </button>
        </div>
      </div>
    </>
  );
};

export default PayrollHeader;