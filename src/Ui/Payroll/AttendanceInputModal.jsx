// src/Ui/Payroll/AttendanceInputModal.jsx
import React, { useState } from "react";
import * as XLSX from "xlsx";

function getDaysInMonth(forMonth) {
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
  const monthName = parts[0];
  const year = parseInt(parts[1], 10);
  const monthNum = MONTHS[monthName];
  if (!monthNum || isNaN(year)) return 30;
  return new Date(year, monthNum, 0).getDate();
}

const AttendanceInputModal = ({ employees, forMonth, onClose, onSave }) => {
  const correctMonthDays = getDaysInMonth(forMonth);

  const [rows, setRows] = useState(
    employees.map((e) => {
      const monthDays =
        e.monthDays && e.monthDays > 0 ? e.monthDays : correctMonthDays;
      const pDays = Math.min(e.pDays ?? monthDays, monthDays);
      const aDays = Math.max(monthDays - pDays, 0);
      return {
        id: e.id,
        name: e.name,
        employeeId: e.employeeId,
        monthDays,
        pDays,
        aDays,
      };
    }),
  );

  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});
  const [importStatus, setImportStatus] = useState(null);
  const [flashIds, setFlashIds] = useState(new Set());

  const clamp = (v, min, max) => Math.min(max, Math.max(min, Number(v) || 0));

  const update = (id, field, raw) => {
    setRows((prev) =>
      prev.map((r) => {
        if (r.id !== id) return r;
        let value = clamp(raw, 0, 999);
        let updated = { ...r, [field]: value };
        if (field === "pDays") {
          updated.aDays = clamp(
            updated.monthDays - value,
            0,
            updated.monthDays,
          );
        } else if (field === "aDays") {
          updated.pDays = clamp(
            updated.monthDays - value,
            0,
            updated.monthDays,
          );
        } else if (field === "monthDays") {
          value = clamp(raw, 1, 31);
          updated = { ...r, monthDays: value };
          if (updated.pDays > value) updated.pDays = value;
          updated.aDays = clamp(value - updated.pDays, 0, value);
        }
        return updated;
      }),
    );
    setErrors((prev) => {
      const n = { ...prev };
      delete n[id];
      return n;
    });
  };

  const applyMonthDaysToAll = (days) => {
    const d = clamp(days, 1, 31);
    setRows((prev) =>
      prev.map((r) => {
        const pDays = Math.min(r.pDays, d);
        return { ...r, monthDays: d, pDays, aDays: d - pDays };
      }),
    );
  };

  const validate = () => {
    const errs = {};
    rows.forEach((r) => {
      if (r.pDays + r.aDays > r.monthDays)
        errs[r.id] =
          `P Days + A Days (${r.pDays + r.aDays}) exceeds Month Days (${r.monthDays})`;
    });
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSave = () => {
    if (!validate()) return;
    setSaving(true);
    setTimeout(() => {
      onSave(
        rows.map(({ id, pDays, aDays, monthDays }) => ({
          id,
          pDays,
          aDays,
          monthDays,
        })),
      );
      onClose();
    }, 600);
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const wb = XLSX.read(ev.target.result, { type: "binary" });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const data = XLSX.utils.sheet_to_json(ws, { defval: "" });
        if (!data.length) {
          setImportStatus({ msg: "File is empty.", type: "err" });
          return;
        }
        const norm = (k) => k.trim().toLowerCase().replace(/\s+/g, "");
        const findKey = (row, target) =>
          Object.keys(row).find((k) => norm(k) === norm(target));
        const sampleRow = data[0];
        const idKey = findKey(sampleRow, "Employee ID");
        const pKey = findKey(sampleRow, "Present Days");
        if (!idKey || !pKey) {
          setImportStatus({
            msg: "Missing columns. File must have: Employee ID, Present Days",
            type: "err",
          });
          return;
        }
        let matched = 0,
          skipped = 0;
        const updatedIds = [];
        const updated = rows.map((r) => {
          const dataRow = data.find(
            (d) => String(d[idKey]).trim() === String(r.employeeId).trim(),
          );
          if (!dataRow) {
            skipped++;
            return r;
          }
          const mKey = findKey(dataRow, "Month Days");
          const rawMDays = mKey ? Number(dataRow[mKey]) : NaN;
          const newMonthDays =
            !isNaN(rawMDays) && rawMDays > 0
              ? clamp(rawMDays, 1, 31)
              : correctMonthDays;
          const rawPDays = Number(dataRow[pKey]);
          const newPDays = isNaN(rawPDays)
            ? r.pDays
            : clamp(rawPDays, 0, newMonthDays);
          const newADays = clamp(newMonthDays - newPDays, 0, newMonthDays);
          matched++;
          updatedIds.push(r.id);
          return {
            ...r,
            monthDays: newMonthDays,
            pDays: newPDays,
            aDays: newADays,
          };
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
              (skipped
                ? ` · ${skipped} ID${skipped > 1 ? "s" : ""} not found`
                : "")
            : "No matching employee IDs found in the file.",
          type: matched ? "ok" : "err",
        });
      } catch {
        setImportStatus({
          msg: "Could not read file. Make sure it's a valid .xlsx or .csv.",
          type: "err",
        });
      }
    };
    reader.readAsBinaryString(file);
    e.target.value = "";
  };

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

  return (
    <>
      <style>{`
        @keyframes aimSlideUp {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .aim-scroll::-webkit-scrollbar { width: 5px; }
        .aim-scroll::-webkit-scrollbar-track { background: transparent; }
        .aim-scroll::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 99px; }
        .aim-scroll::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
      `}</style>

      {/* ── Overlay ── */}
      <div
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 200,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "rgba(0,0,0,.5)",
          backdropFilter: "blur(4px)",
          WebkitBackdropFilter: "blur(4px)",
          padding: "24px 16px",
        }}
      >
        {/* ── Modal card: fixed height, flex-column ── */}
        <div
          style={{
            background: "rgba(255,255,255,0.97)",
            backdropFilter: "blur(12px)",
            WebkitBackdropFilter: "blur(12px)",
            borderRadius: 16,
            boxShadow: "0 25px 60px rgba(0,0,0,.22)",
            border: "1px solid rgba(255,255,255,.6)",
            width: "100%",
            maxWidth: 900,
            maxHeight: "90vh" /* card never exceeds viewport */,
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            animation: "aimSlideUp .22s ease",
          }}
        >
          {/* ── HEADER — always visible ── */}
          <div
            style={{
              background: "linear-gradient(135deg,#1a3c6e,#1e56a0)",
              padding: "18px 24px",
              flexShrink: 0,
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 10,
                    background: "rgba(255,255,255,.15)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <svg
                    width="18"
                    height="18"
                    fill="none"
                    stroke="#fff"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                </div>
                <div>
                  <h2
                    style={{
                      margin: 0,
                      color: "#fff",
                      fontSize: 17,
                      fontWeight: 700,
                    }}
                  >
                    Attendance Entry
                  </h2>
                  <p
                    style={{
                      margin: "2px 0 0",
                      color: "rgba(255,255,255,.55)",
                      fontSize: 12,
                    }}
                  >
                    {forMonth ? (
                      <>
                        {`Month: `}
                        <strong style={{ color: "#93c5fd" }}>{forMonth}</strong>
                        {` · ${correctMonthDays} days`}
                      </>
                    ) : (
                      "Edit P Days / A Days / Month Days for each employee"
                    )}
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                style={{
                  background: "rgba(255,255,255,.15)",
                  border: "none",
                  cursor: "pointer",
                  color: "#fff",
                  width: 32,
                  height: 32,
                  borderRadius: 8,
                  fontSize: 16,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                ✕
              </button>
            </div>
          </div>

          {/* ── SCROLLABLE BODY ── */}
          <div
            className="aim-scroll"
            style={{ flex: 1, overflowY: "auto", overflowX: "hidden" }}
          >
            <div style={{ padding: "20px 24px 0" }}>
              {/* Info banner */}
              <div
                style={{
                  padding: "12px 16px",
                  borderRadius: 12,
                  background: "rgba(238,242,255,0.85)",
                  backdropFilter: "blur(6px)",
                  WebkitBackdropFilter: "blur(6px)",
                  border: "1px solid rgba(199,210,254,.6)",
                  fontSize: 12,
                  color: "#4338ca",
                  fontWeight: 500,
                  marginBottom: 14,
                }}
              >
                💡 Editing <strong>P Days</strong> auto-calculates Absent Days,
                and vice versa. Month Days auto-set to{" "}
                <strong>{correctMonthDays}</strong> for{" "}
                <strong>{forMonth || "this month"}</strong>. Gross (d) &amp; Net
                Salary will update instantly after saving.
              </div>

              {/* Quick month-days setter */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  flexWrap: "wrap",
                  marginBottom: 14,
                }}
              >
                <span
                  style={{ fontSize: 12, color: "#64748b", fontWeight: 500 }}
                >
                  Set month days for all:
                </span>
                {[28, 29, 30, 31].map((d) => (
                  <button
                    key={d}
                    onClick={() => applyMonthDaysToAll(d)}
                    style={{
                      padding: "6px 14px",
                      borderRadius: 8,
                      fontSize: 12,
                      fontWeight: 600,
                      cursor: "pointer",
                      transition: "all .15s",
                      border:
                        d === correctMonthDays ? "none" : "1px solid #e2e8f0",
                      background:
                        d === correctMonthDays
                          ? "#4f46e5"
                          : "rgba(248,250,252,0.9)",
                      color: d === correctMonthDays ? "#fff" : "#475569",
                    }}
                  >
                    {d} days{d === correctMonthDays ? " ✓" : ""}
                  </button>
                ))}
                <span style={{ fontSize: 11, color: "#94a3b8" }}>
                  (calendar correct: <strong>{correctMonthDays}</strong>)
                </span>
              </div>

              {/* Excel Import Zone */}
              <div
                style={{
                  border: "2px dashed #cbd5e1",
                  borderRadius: 12,
                  padding: "14px 18px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  flexWrap: "wrap",
                  gap: 12,
                  marginBottom: 6,
                  background: "rgba(248,250,252,0.7)",
                  backdropFilter: "blur(6px)",
                  WebkitBackdropFilter: "blur(6px)",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div
                    style={{
                      width: 38,
                      height: 38,
                      borderRadius: 10,
                      background: "rgba(209,250,229,0.8)",
                      flexShrink: 0,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <svg
                      width="18"
                      height="18"
                      fill="none"
                      stroke="#059669"
                      strokeWidth="1.8"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M9 17v-2m3 2v-4m3 4v-6M3 20h18M3 4h18M3 12h18"
                      />
                    </svg>
                  </div>
                  <div>
                    <p
                      style={{
                        margin: "0 0 2px",
                        fontSize: 13,
                        fontWeight: 600,
                        color: "#334155",
                      }}
                    >
                      Import from Excel
                    </p>
                    <p style={{ margin: 0, fontSize: 11, color: "#94a3b8" }}>
                      Required:{" "}
                      <code
                        style={{
                          background: "#f1f5f9",
                          padding: "1px 5px",
                          borderRadius: 4,
                          color: "#475569",
                        }}
                      >
                        Employee ID
                      </code>{" "}
                      &amp;{" "}
                      <code
                        style={{
                          background: "#f1f5f9",
                          padding: "1px 5px",
                          borderRadius: 4,
                          color: "#475569",
                        }}
                      >
                        Present Days
                      </code>
                      {" · "}Optional:{" "}
                      <code
                        style={{
                          background: "#f1f5f9",
                          padding: "1px 5px",
                          borderRadius: 4,
                          color: "#475569",
                        }}
                      >
                        Month Days
                      </code>{" "}
                      (defaults to {correctMonthDays})
                    </p>
                  </div>
                </div>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    flexShrink: 0,
                  }}
                >
                  <button
                    onClick={downloadTemplate}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 6,
                      padding: "7px 14px",
                      borderRadius: 8,
                      border: "1px solid #e2e8f0",
                      fontSize: 12,
                      fontWeight: 600,
                      color: "#475569",
                      background: "rgba(255,255,255,0.8)",
                      backdropFilter: "blur(4px)",
                      cursor: "pointer",
                    }}
                  >
                    <svg
                      width="13"
                      height="13"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                      />
                    </svg>
                    Download Template
                  </button>
                  <label
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 6,
                      padding: "7px 14px",
                      borderRadius: 8,
                      background: "#059669",
                      fontSize: 12,
                      fontWeight: 600,
                      color: "#fff",
                      cursor: "pointer",
                    }}
                  >
                    <svg
                      width="13"
                      height="13"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l4-4m0 0l4 4m-4-4v12"
                      />
                    </svg>
                    Upload Excel
                    <input
                      type="file"
                      accept=".xlsx,.xls,.csv"
                      onChange={handleFileUpload}
                      style={{ display: "none" }}
                    />
                  </label>
                </div>
              </div>

              {/* Import status */}
              {importStatus && (
                <p
                  style={{
                    fontSize: 12,
                    fontWeight: 500,
                    marginBottom: 10,
                    color: importStatus.type === "err" ? "#dc2626" : "#059669",
                  }}
                >
                  {importStatus.type === "ok" ? "✓" : "⚠"} {importStatus.msg}
                </p>
              )}
            </div>

            {/* Table */}
            <div style={{ overflowX: "auto", padding: "4px 24px 8px" }}>
              <table
                style={{
                  width: "100%",
                  borderCollapse: "collapse",
                  minWidth: 640,
                  fontSize: 13,
                }}
              >
                <thead>
                  <tr style={{ borderBottom: "1px solid #f1f5f9" }}>
                    {[
                      "Employee",
                      "Month Days",
                      "P Days (Present)",
                      "A Days (Absent)",
                      "Attendance",
                    ].map((h) => (
                      <th
                        key={h}
                        style={{
                          paddingBottom: 10,
                          paddingLeft: 8,
                          paddingRight: 8,
                          textAlign: "left",
                          fontSize: 10,
                          fontWeight: 700,
                          color: "#94a3b8",
                          textTransform: "uppercase",
                          letterSpacing: "0.08em",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => {
                    const hasError = !!errors[row.id];
                    const isFlashed = flashIds.has(row.id);
                    const pct =
                      row.monthDays > 0
                        ? Math.round((row.pDays / row.monthDays) * 100)
                        : 0;
                    const rowBg = isFlashed
                      ? "#f0fdf4"
                      : hasError
                        ? "rgba(254,242,242,.7)"
                        : "transparent";
                    return (
                      <React.Fragment key={row.id}>
                        <tr
                          style={{
                            borderBottom: "1px solid #f8fafc",
                            background: rowBg,
                            transition: "background .15s",
                          }}
                        >
                          <td style={{ padding: "12px 8px" }}>
                            <p
                              style={{
                                margin: 0,
                                fontWeight: 700,
                                color: "#1e293b",
                              }}
                            >
                              {row.name}
                            </p>
                            <p
                              style={{
                                margin: 0,
                                fontSize: 11,
                                color: "#94a3b8",
                              }}
                            >
                              {row.employeeId}
                            </p>
                          </td>
                          <td style={{ padding: "12px 8px" }}>
                            <input
                              type="number"
                              min={1}
                              max={31}
                              value={row.monthDays}
                              onChange={(e) =>
                                update(row.id, "monthDays", e.target.value)
                              }
                              style={{
                                width: 72,
                                borderRadius: 8,
                                padding: "6px 8px",
                                fontSize: 13,
                                textAlign: "center",
                                outline: "none",
                                border: `1px solid ${row.monthDays !== correctMonthDays ? "#f59e0b" : "#e2e8f0"}`,
                                background:
                                  row.monthDays !== correctMonthDays
                                    ? "rgba(255,251,235,0.9)"
                                    : "rgba(248,250,252,0.8)",
                                color:
                                  row.monthDays !== correctMonthDays
                                    ? "#92400e"
                                    : "#334155",
                              }}
                            />
                            {row.monthDays !== correctMonthDays && (
                              <p
                                style={{
                                  margin: "2px 0 0",
                                  fontSize: 10,
                                  color: "#f59e0b",
                                }}
                              >
                                calendar: {correctMonthDays}
                              </p>
                            )}
                          </td>
                          <td style={{ padding: "12px 8px" }}>
                            <input
                              type="number"
                              min={0}
                              max={row.monthDays}
                              value={row.pDays}
                              onChange={(e) =>
                                update(row.id, "pDays", e.target.value)
                              }
                              style={{
                                width: 72,
                                border: "1px solid #e2e8f0",
                                borderRadius: 8,
                                padding: "6px 8px",
                                fontSize: 13,
                                textAlign: "center",
                                background: "rgba(248,250,252,0.8)",
                                color: "#334155",
                                outline: "none",
                              }}
                            />
                          </td>
                          <td style={{ padding: "12px 8px" }}>
                            <input
                              type="number"
                              min={0}
                              max={row.monthDays}
                              value={row.aDays}
                              onChange={(e) =>
                                update(row.id, "aDays", e.target.value)
                              }
                              style={{
                                width: 72,
                                border: "1px solid #e2e8f0",
                                borderRadius: 8,
                                padding: "6px 8px",
                                fontSize: 13,
                                textAlign: "center",
                                background: "rgba(248,250,252,0.8)",
                                color: "#334155",
                                outline: "none",
                              }}
                            />
                          </td>
                          <td style={{ padding: "12px 8px", minWidth: 160 }}>
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 8,
                              }}
                            >
                              <div
                                style={{
                                  flex: 1,
                                  height: 6,
                                  borderRadius: 99,
                                  background: "rgba(226,232,240,0.7)",
                                  overflow: "hidden",
                                }}
                              >
                                <div
                                  style={{
                                    height: 6,
                                    borderRadius: 99,
                                    background:
                                      "linear-gradient(90deg,#34d399,#10b981)",
                                    width: `${pct}%`,
                                    transition: "width .3s ease",
                                  }}
                                />
                              </div>
                              <span
                                style={{
                                  fontSize: 11,
                                  color: "#64748b",
                                  whiteSpace: "nowrap",
                                  width: 32,
                                  textAlign: "right",
                                }}
                              >
                                {row.monthDays > 0 ? `${pct}%` : "—"}
                              </span>
                            </div>
                          </td>
                        </tr>
                        {hasError && (
                          <tr>
                            <td
                              colSpan={5}
                              style={{ padding: "0 8px 10px 8px" }}
                            >
                              <p
                                style={{
                                  margin: 0,
                                  fontSize: 11,
                                  color: "#ef4444",
                                  fontWeight: 500,
                                }}
                              >
                                ⚠ {errors[row.id]}
                              </p>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
          {/* end scrollable body */}

          {/* ── FOOTER — always visible ── */}
          <div
            style={{
              padding: "14px 24px",
              borderTop: "1px solid #f1f5f9",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              background: "rgba(255,255,255,0.95)",
              backdropFilter: "blur(8px)",
              WebkitBackdropFilter: "blur(8px)",
              flexShrink: 0,
            }}
          >
            <p style={{ margin: 0, fontSize: 12, color: "#94a3b8" }}>
              {rows.length} employees listed
            </p>
            <div style={{ display: "flex", gap: 10 }}>
              <button
                onClick={onClose}
                style={{
                  padding: "8px 20px",
                  borderRadius: 10,
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: "pointer",
                  border: "1px solid #e2e8f0",
                  background: "rgba(255,255,255,0.8)",
                  color: "#475569",
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                style={{
                  padding: "8px 20px",
                  borderRadius: 10,
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: saving ? "not-allowed" : "pointer",
                  border: "none",
                  background: saving
                    ? "#a5b4fc"
                    : "linear-gradient(135deg,#4f46e5,#3730a3)",
                  color: "#fff",
                  boxShadow: saving ? "none" : "0 2px 8px rgba(79,70,229,.35)",
                }}
              >
                {saving ? "Saving…" : "Save Attendance"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default AttendanceInputModal;
