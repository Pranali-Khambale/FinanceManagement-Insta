// src/Ui/Payroll/AttendanceInputModal.jsx
import React, { useState } from "react";
import * as XLSX from "xlsx";

// ─────────────────────────────────────────────────────────────────────────────
// getDaysInMonth
//
// Parses a "Month YYYY" string like "February 2026" or "April 2026" and
// returns the exact number of calendar days for that month.
// Falls back to 30 if the string is missing / unrecognised.
// ─────────────────────────────────────────────────────────────────────────────
function getDaysInMonth(forMonth) {
  if (!forMonth) return 30;

  const MONTHS = {
    january: 1, february: 2, march: 3,     april: 4,
    may: 5,     june: 6,     july: 7,       august: 8,
    september: 9, october: 10, november: 11, december: 12,
  };

  const parts     = forMonth.trim().toLowerCase().split(/\s+/);
  const monthName = parts[0];
  const year      = parseInt(parts[1], 10);
  const monthNum  = MONTHS[monthName];

  if (!monthNum || isNaN(year)) return 30;

  // new Date(year, monthNum, 0) → last day of monthNum in that year
  return new Date(year, monthNum, 0).getDate();
}

/**
 * AttendanceInputModal
 *
 * Props:
 *  - employees   : array of employee objects
 *  - forMonth    : string, e.g. "April 2026"  ← NEW (passed from PayrollTable)
 *  - onClose     : () => void
 *  - onSave      : (updatedRows) => void
 *                  updatedRows = [{ id, pDays, aDays, monthDays }, ...]
 */
const AttendanceInputModal = ({ employees, forMonth, onClose, onSave }) => {
  // Derive the correct number of days for this month once on mount
  const correctMonthDays = getDaysInMonth(forMonth);

  const [rows, setRows] = useState(
    employees.map((e) => {
      // Use the server-provided monthDays if it looks valid, else use the
      // calendar-correct value for the current payroll month.
      const monthDays =
        e.monthDays && e.monthDays > 0 ? e.monthDays : correctMonthDays;
      const pDays     = Math.min(e.pDays ?? monthDays, monthDays);
      const aDays     = Math.max(monthDays - pDays, 0);
      return {
        id:         e.id,
        name:       e.name,
        employeeId: e.employeeId,
        monthDays,
        pDays,
        aDays,
      };
    })
  );

  const [saving,       setSaving]       = useState(false);
  const [errors,       setErrors]       = useState({});
  const [importStatus, setImportStatus] = useState(null);
  const [flashIds,     setFlashIds]     = useState(new Set());

  // ── helpers ───────────────────────────────────────────────────────────────
  const clamp = (v, min, max) => Math.min(max, Math.max(min, Number(v) || 0));

  const update = (id, field, raw) => {
    setRows((prev) =>
      prev.map((r) => {
        if (r.id !== id) return r;
        let value   = clamp(raw, 0, 999);
        let updated = { ...r, [field]: value };

        if (field === "pDays") {
          updated.aDays = clamp(updated.monthDays - value, 0, updated.monthDays);
        } else if (field === "aDays") {
          updated.pDays = clamp(updated.monthDays - value, 0, updated.monthDays);
        } else if (field === "monthDays") {
          // Cap monthDays to valid calendar max for this forMonth (or 31 as hard cap)
          value         = clamp(raw, 1, 31);
          updated       = { ...r, monthDays: value };
          if (updated.pDays > value) updated.pDays = value;
          updated.aDays = clamp(value - updated.pDays, 0, value);
        }
        return updated;
      })
    );
    setErrors((prev) => { const n = { ...prev }; delete n[id]; return n; });
  };

  // ── "Set all month days" shortcut ─────────────────────────────────────────
  const applyMonthDaysToAll = (days) => {
    const d = clamp(days, 1, 31);
    setRows((prev) =>
      prev.map((r) => {
        const pDays = Math.min(r.pDays, d);
        return { ...r, monthDays: d, pDays, aDays: d - pDays };
      })
    );
  };

  const validate = () => {
    const errs = {};
    rows.forEach((r) => {
      if (r.pDays + r.aDays > r.monthDays)
        errs[r.id] = `P Days + A Days (${r.pDays + r.aDays}) exceeds Month Days (${r.monthDays})`;
    });
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSave = () => {
    if (!validate()) return;
    setSaving(true);
    setTimeout(() => {
      onSave(rows.map(({ id, pDays, aDays, monthDays }) => ({ id, pDays, aDays, monthDays })));
      onClose();
    }, 600);
  };

  // ── Excel import ──────────────────────────────────────────────────────────
  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const wb   = XLSX.read(ev.target.result, { type: "binary" });
        const ws   = wb.Sheets[wb.SheetNames[0]];
        const data = XLSX.utils.sheet_to_json(ws, { defval: "" });

        if (!data.length) {
          setImportStatus({ msg: "File is empty.", type: "err" });
          return;
        }

        const norm    = (k) => k.trim().toLowerCase().replace(/\s+/g, "");
        const findKey = (row, target) =>
          Object.keys(row).find((k) => norm(k) === norm(target));

        const sampleRow = data[0];
        const idKey     = findKey(sampleRow, "Employee ID");
        const pKey      = findKey(sampleRow, "Present Days");

        if (!idKey || !pKey) {
          setImportStatus({
            msg:  "Missing columns. File must have: Employee ID, Present Days",
            type: "err",
          });
          return;
        }

        let matched = 0;
        let skipped = 0;
        const updatedIds = [];

        const updated = rows.map((r) => {
          const dataRow = data.find(
            (d) => String(d[idKey]).trim() === String(r.employeeId).trim()
          );
          if (!dataRow) { skipped++; return r; }

          const mKey = findKey(dataRow, "Month Days");

          // If Excel provides Month Days, honour it; otherwise use the
          // calendar-correct value for this payroll month.
          const rawMDays     = mKey ? Number(dataRow[mKey]) : NaN;
          const newMonthDays = !isNaN(rawMDays) && rawMDays > 0
            ? clamp(rawMDays, 1, 31)
            : correctMonthDays;           // ← use calendar-correct days

          const rawPDays = Number(dataRow[pKey]);
          const newPDays = isNaN(rawPDays) ? r.pDays : clamp(rawPDays, 0, newMonthDays);
          const newADays = clamp(newMonthDays - newPDays, 0, newMonthDays);

          matched++;
          updatedIds.push(r.id);
          return { ...r, monthDays: newMonthDays, pDays: newPDays, aDays: newADays };
        });

        setRows(updated);
        setErrors((prev) => {
          const next = { ...prev };
          updatedIds.forEach((id) => delete next[id]);
          return next;
        });

        setFlashIds(new Set(updatedIds));
        setTimeout(() => setFlashIds(new Set()), 1400);

        setImportStatus({
          msg: matched
            ? `${matched} employee${matched > 1 ? "s" : ""} updated from Excel` +
              (skipped ? ` · ${skipped} ID${skipped > 1 ? "s" : ""} not found` : "")
            : "No matching employee IDs found in the file.",
          type: matched ? "ok" : "err",
        });
      } catch {
        setImportStatus({
          msg:  "Could not read file. Make sure it's a valid .xlsx or .csv.",
          type: "err",
        });
      }
    };
    reader.readAsBinaryString(file);
    e.target.value = "";
  };

  // ── Template download ─────────────────────────────────────────────────────
  const downloadTemplate = () => {
    const ws = XLSX.utils.aoa_to_sheet([
      ["Employee ID", "Present Days", "Month Days"],
      ...rows.map((r) => [r.employeeId, r.pDays, r.monthDays]),
    ]);
    ws["!cols"] = [{ wch: 14 }, { wch: 14 }, { wch: 12 }];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Attendance");
    XLSX.writeFile(wb, "attendance_template.xlsx");
    setImportStatus({ msg: "Template downloaded.", type: "ok" });
  };

  // ── render ────────────────────────────────────────────────────────────────
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 backdrop-blur-sm overflow-y-auto py-8">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl mx-4 overflow-hidden">

        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white z-10">
          <div>
            <h2 className="text-base font-bold text-slate-800">Attendance Entry</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              {forMonth
                ? <>Month: <span className="font-semibold text-indigo-600">{forMonth}</span> · {correctMonthDays} days</>
                : "Edit P Days / A Days / Month Days for each employee"}
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-600"
          >✕</button>
        </div>

        {/* Info banner */}
        <div className="mx-6 mt-4 px-4 py-3 rounded-xl bg-indigo-50 border border-indigo-100 text-xs text-indigo-700 font-medium">
          💡 Editing <span className="font-bold">P Days</span> auto-calculates Absent Days, and vice versa.
          Month Days auto-set to <span className="font-bold">{correctMonthDays}</span> for{" "}
          <span className="font-bold">{forMonth || "this month"}</span>.
          Gross (d) &amp; Net Salary will update instantly after saving.
        </div>

        {/* ── Quick month-days setter ── */}
        <div className="mx-6 mt-3 flex items-center gap-3 flex-wrap">
          <span className="text-xs text-slate-500 font-medium">Set month days for all:</span>
          {[28, 29, 30, 31].map((d) => (
            <button
              key={d}
              onClick={() => applyMonthDaysToAll(d)}
              className={`px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all ${
                d === correctMonthDays
                  ? "bg-indigo-600 text-white border-indigo-600"
                  : "border-slate-200 text-slate-600 hover:bg-slate-50"
              }`}
            >
              {d} days{d === correctMonthDays ? " ✓" : ""}
            </button>
          ))}
          <span className="text-[10px] text-slate-400 ml-1">
            (calendar correct: <strong>{correctMonthDays}</strong>)
          </span>
        </div>

        {/* ── Excel Import Zone ── */}
        <div className="mx-6 mt-3 border-2 border-dashed border-slate-200 rounded-xl px-4 py-3 flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-emerald-50 flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                  d="M9 17v-2m3 2v-4m3 4v-6M3 20h18M3 4h18M3 12h18" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-700">Import from Excel</p>
              <p className="text-xs text-slate-400">
                Required:{" "}
                <code className="bg-slate-100 px-1 rounded text-slate-600">Employee ID</code>
                {" "}&amp;{" "}
                <code className="bg-slate-100 px-1 rounded text-slate-600">Present Days</code>
                {" · "}Optional:{" "}
                <code className="bg-slate-100 px-1 rounded text-slate-600">Month Days</code>
                {" "}(defaults to {correctMonthDays})
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={downloadTemplate}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-all"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Download Template
            </button>
            <label className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-xs font-semibold text-white cursor-pointer transition-all">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l4-4m0 0l4 4m-4-4v12" />
              </svg>
              Upload Excel
              <input
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>
          </div>
        </div>

        {/* Import status */}
        {importStatus && (
          <p className={`mx-6 mt-1.5 text-xs font-medium ${
            importStatus.type === "err" ? "text-red-500" : "text-emerald-700"
          }`}>
            {importStatus.type === "ok" ? "✓" : "⚠"} {importStatus.msg}
          </p>
        )}

        {/* Table */}
        <div className="overflow-x-auto mt-4 px-6 pb-2">
          <table className="w-full text-sm" style={{ minWidth: "640px" }}>
            <thead>
              <tr className="border-b border-slate-100 text-left">
                {["Employee", "Month Days", "P Days (Present)", "A Days (Absent)", "Attendance"].map((h) => (
                  <th key={h} className="pb-2 px-2 text-xs font-semibold text-slate-400 uppercase tracking-wide whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => {
                const hasError  = !!errors[row.id];
                const isFlashed = flashIds.has(row.id);
                const pct       = row.monthDays > 0 ? Math.round((row.pDays / row.monthDays) * 100) : 0;
                return (
                  <React.Fragment key={row.id}>
                    <tr className={`border-b border-slate-50 transition-colors ${
                      isFlashed ? "bg-emerald-50" : hasError ? "bg-red-50/60" : "hover:bg-slate-50/60"
                    }`}>
                      <td className="px-2 py-3">
                        <p className="font-semibold text-slate-800">{row.name}</p>
                        <p className="text-xs text-slate-400">{row.employeeId}</p>
                      </td>

                      {/* Month Days — highlighted if it differs from calendar-correct value */}
                      <td className="px-2 py-3">
                        <input
                          type="number" min={1} max={31} value={row.monthDays}
                          onChange={(e) => update(row.id, "monthDays", e.target.value)}
                          className={`w-20 border rounded-lg px-2 py-1.5 text-sm text-center focus:outline-none focus:ring-2 focus:ring-indigo-200 ${
                            row.monthDays !== correctMonthDays
                              ? "border-amber-400 bg-amber-50 text-amber-800"
                              : "border-slate-200"
                          }`}
                        />
                        {row.monthDays !== correctMonthDays && (
                          <p className="text-[10px] text-amber-500 mt-0.5">
                            calendar: {correctMonthDays}
                          </p>
                        )}
                      </td>

                      <td className="px-2 py-3">
                        <input type="number" min={0} max={row.monthDays} value={row.pDays}
                          onChange={(e) => update(row.id, "pDays", e.target.value)}
                          className="w-20 border border-slate-200 rounded-lg px-2 py-1.5 text-sm text-center focus:outline-none focus:ring-2 focus:ring-indigo-200" />
                      </td>
                      <td className="px-2 py-3">
                        <input type="number" min={0} max={row.monthDays} value={row.aDays}
                          onChange={(e) => update(row.id, "aDays", e.target.value)}
                          className="w-20 border border-slate-200 rounded-lg px-2 py-1.5 text-sm text-center focus:outline-none focus:ring-2 focus:ring-indigo-200" />
                      </td>
                      <td className="px-2 py-3 min-w-[160px]">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-2 rounded-full bg-slate-100 overflow-hidden">
                            <div className="h-2 rounded-full bg-emerald-400 transition-all" style={{ width: `${pct}%` }} />
                          </div>
                          <span className="text-xs text-slate-500 whitespace-nowrap w-8 text-right">
                            {row.monthDays > 0 ? `${pct}%` : "—"}
                          </span>
                        </div>
                      </td>
                    </tr>
                    {hasError && (
                      <tr>
                        <td colSpan={5} className="px-4 pb-2">
                          <p className="text-xs text-red-500 font-medium">⚠ {errors[row.id]}</p>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between bg-white">
          <p className="text-xs text-slate-400">{rows.length} employees listed</p>
          <div className="flex gap-3">
            <button onClick={onClose}
              className="px-5 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50">
              Cancel
            </button>
            <button onClick={handleSave} disabled={saving}
              className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white text-sm font-semibold transition-all">
              {saving ? "Saving…" : "Save Attendance"}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

export default AttendanceInputModal;