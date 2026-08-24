// src/Ui/Payroll/AttendanceInputModal.jsx
// FIXED: responsive for all devices (320px → 4K)
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
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .aim-scroll::-webkit-scrollbar { width: 5px; }
        .aim-scroll::-webkit-scrollbar-track { background: transparent; }
        .aim-scroll::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 99px; }
        .aim-scroll::-webkit-scrollbar-thumb:hover { background: #94a3b8; }

        /* ─────────────────────────────────────────
           MOBILE  ≤ 640px  →  centred dialog
           Universal standard: modal is centred
           vertically & horizontally, 16px margin
           on all sides, rounded corners all round,
           max-height 92dvh so it never touches edges.
        ───────────────────────────────────────── */
        @media (max-width: 640px) {
          .aim-overlay {
            align-items: center !important;
            justify-content: center !important;
            padding: 16px !important;
          }
          .aim-card {
            border-radius: 16px !important;
            max-height: 92dvh !important;
            max-height: 92vh !important;
            max-width: 100% !important;
            width: 100% !important;
          }
          .aim-drag { display: none !important; }   /* no drag handle — centred modal */
          .aim-header { padding: 12px 16px !important; }
          .aim-body-pad { padding: 12px 16px 0 !important; }
          .aim-table-wrap { padding: 4px 0 8px !important; }
          .aim-footer {
            padding: 12px 16px !important;
            padding-bottom: max(12px, env(safe-area-inset-bottom, 12px)) !important;
          }

          /* ── Quick-day buttons: single scrollable row, no wrap ── */
          .aim-quick-days {
            flex-wrap: nowrap !important;
            overflow-x: auto !important;
            gap: 6px !important;
            padding-bottom: 4px !important;
            -webkit-overflow-scrolling: touch;
            scrollbar-width: none;
          }
          .aim-quick-days::-webkit-scrollbar { display: none; }
          .aim-quick-days .aim-day-label {
            white-space: nowrap;
            flex-shrink: 0;
          }
          .aim-quick-days .aim-day-btn {
            flex-shrink: 0 !important;
          }
          .aim-quick-days .hint { display: none; }

          /* ── Import zone: stack vertically ── */
          .aim-import-zone {
            flex-direction: column !important;
            align-items: stretch !important;
            gap: 10px !important;
          }
          .aim-import-btns {
            width: 100% !important;
            display: flex !important;
          }
          .aim-import-btns button,
          .aim-import-btns label {
            flex: 1 1 0 !important;
            justify-content: center !important;
          }

          /* ── Hide table, show cards ── */
          .aim-table { display: none !important; }
          .aim-card-list { display: block !important; }
        }

        /* ─────────────────────────────────────────
           TABLET / DESKTOP  ≥ 641px
        ───────────────────────────────────────── */
        @media (min-width: 641px) {
          .aim-card-list { display: none !important; }
          .aim-drag { display: none; }
        }

        /* ── Employee card (mobile) ── */
        .aim-employee-card {
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          padding: 12px;
          margin-bottom: 8px;
          background: rgba(248,250,252,0.9);
          transition: background .15s;
        }
        .aim-employee-card.flash  { background: #f0fdf4; border-color: #86efac; }
        .aim-employee-card.has-error { background: rgba(254,242,242,.7); border-color: #fca5a5; }

        /* 3-col input grid inside cards */
        .aim-input-row {
          display: grid;
          grid-template-columns: 1fr 1fr 1fr;
          gap: 8px;
          margin-top: 10px;
        }
        .aim-input-group label {
          display: block;
          font-size: 10px;
          font-weight: 700;
          color: #94a3b8;
          text-transform: uppercase;
          letter-spacing: 0.06em;
          margin-bottom: 4px;
        }
        .aim-input-group input {
          width: 100%;
          box-sizing: border-box;
          border-radius: 8px;
          padding: 9px 6px;
          font-size: 15px;
          text-align: center;
          outline: none;
          border: 1px solid #e2e8f0;
          background: rgba(255,255,255,0.9);
          color: #334155;
          -moz-appearance: textfield;
        }
        .aim-input-group input::-webkit-inner-spin-button,
        .aim-input-group input::-webkit-outer-spin-button { -webkit-appearance: none; margin: 0; }
        .aim-input-group input:focus { border-color: #6366f1; box-shadow: 0 0 0 2px rgba(99,102,241,.15); }

        /* Table input */
        .aim-tbl-input {
          width: 72px;
          border-radius: 8px;
          padding: 6px 8px;
          font-size: 13px;
          text-align: center;
          outline: none;
          border: 1px solid #e2e8f0;
          background: rgba(248,250,252,0.8);
          color: #334155;
          -moz-appearance: textfield;
        }
        .aim-tbl-input::-webkit-inner-spin-button,
        .aim-tbl-input::-webkit-outer-spin-button { -webkit-appearance: none; margin: 0; }
        .aim-tbl-input:focus { border-color: #6366f1; box-shadow: 0 0 0 2px rgba(99,102,241,.15); }

        /* Quick-day button */
        .aim-day-btn { transition: all .15s; }
        .aim-day-btn:hover  { filter: brightness(0.96); }
        .aim-day-btn:active { transform: scale(0.96); }
      `}</style>

      {/* ── Overlay ── */}
      <div
        className="aim-overlay"
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
        onClick={(e) => e.target === e.currentTarget && onClose?.()}
      >
        {/* ── Modal card ── */}
        <div
          className="aim-card"
          style={{
            background: "rgba(255,255,255,0.98)",
            backdropFilter: "blur(12px)",
            WebkitBackdropFilter: "blur(12px)",
            borderRadius: 16,
            boxShadow: "0 25px 60px rgba(0,0,0,.22)",
            border: "1px solid rgba(255,255,255,.6)",
            width: "100%",
            maxWidth: 900,
            maxHeight: "90vh",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            animation: "aimSlideUp .22s ease",
          }}
        >
          {/* ── HEADER ── */}
          <div
            className="aim-header"
            style={{
              background: "linear-gradient(135deg,#1a3c6e,#1e56a0)",
              padding: "16px 24px",
              flexShrink: 0,
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 12,
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  minWidth: 0,
                }}
              >
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 10,
                    background: "rgba(255,255,255,.15)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
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
                <div style={{ minWidth: 0 }}>
                  <h2
                    style={{
                      margin: 0,
                      color: "#fff",
                      fontSize: 16,
                      fontWeight: 700,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    Attendance Entry
                  </h2>
                  <p
                    style={{
                      margin: "2px 0 0",
                      color: "rgba(255,255,255,.6)",
                      fontSize: 12,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {forMonth ? (
                      <>
                        Month:{" "}
                        <strong style={{ color: "#93c5fd" }}>{forMonth}</strong>{" "}
                        · {correctMonthDays} days
                      </>
                    ) : (
                      "Edit P Days / A Days / Month Days for each employee"
                    )}
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                aria-label="Close"
                style={{
                  background: "rgba(255,255,255,.15)",
                  border: "none",
                  cursor: "pointer",
                  color: "#fff",
                  width: 44,
                  height: 44,
                  borderRadius: 8,
                  fontSize: 16,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                  touchAction: "manipulation",
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
            <div className="aim-body-pad" style={{ padding: "18px 24px 0" }}>
              {/* Info banner */}
              <div
                style={{
                  padding: "11px 14px",
                  borderRadius: 10,
                  background: "rgba(238,242,255,0.9)",
                  border: "1px solid rgba(199,210,254,.6)",
                  fontSize: 12,
                  color: "#4338ca",
                  fontWeight: 500,
                  marginBottom: 14,
                  lineHeight: 1.5,
                }}
              >
                💡 Editing <strong>P Days</strong> auto-calculates Absent Days,
                and vice versa. Month Days auto-set to{" "}
                <strong>{correctMonthDays}</strong> for{" "}
                <strong>{forMonth || "this month"}</strong>. Gross (d) &amp; Net
                Salary will update instantly after saving.
              </div>

              {/* ── Quick month-days setter ──
                  KEY FIX: on mobile this is a horizontally scrollable row (no wrap).
                  The label + 4 buttons stay in a single line. */}
              <div
                className="aim-quick-days"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  flexWrap: "wrap" /* overridden to nowrap on mobile via CSS */,
                  marginBottom: 14,
                }}
              >
                <span
                  className="aim-day-label"
                  style={{
                    fontSize: 12,
                    color: "#64748b",
                    fontWeight: 500,
                    flexShrink: 0,
                  }}
                >
                  Set month days for all:
                </span>
                {[28, 29, 30, 31].map((d) => {
                  const isActive = d === correctMonthDays;
                  return (
                    <button
                      key={d}
                      className="aim-day-btn"
                      onClick={() => applyMonthDaysToAll(d)}
                      style={{
                        padding: "6px 12px",
                        borderRadius: 8,
                        fontSize: 12,
                        fontWeight: 600,
                        cursor: "pointer",
                        border: isActive ? "none" : "1px solid #e2e8f0",
                        background: isActive
                          ? "#4f46e5"
                          : "rgba(248,250,252,0.9)",
                        color: isActive ? "#fff" : "#475569",
                        touchAction: "manipulation",
                        minHeight: 34,
                        whiteSpace: "nowrap",
                        flexShrink: 0,
                      }}
                    >
                      {d} days{isActive ? " ✓" : ""}
                    </button>
                  );
                })}
                <span
                  className="hint"
                  style={{ fontSize: 11, color: "#94a3b8", flexShrink: 0 }}
                >
                  (calendar: <strong>{correctMonthDays}</strong>)
                </span>
              </div>

              {/* ── Excel Import Zone ── */}
              <div
                className="aim-import-zone"
                style={{
                  border: "2px dashed #cbd5e1",
                  borderRadius: 12,
                  padding: "14px 16px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  flexWrap: "wrap",
                  gap: 12,
                  marginBottom: 6,
                  background: "rgba(248,250,252,0.7)",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    minWidth: 0,
                  }}
                >
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
                  <div style={{ minWidth: 0 }}>
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
                    <p
                      style={{
                        margin: 0,
                        fontSize: 11,
                        color: "#94a3b8",
                        lineHeight: 1.5,
                      }}
                    >
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
                      </code>
                      {" & "}
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
                      </code>
                    </p>
                  </div>
                </div>

                <div
                  className="aim-import-btns"
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
                      padding: "8px 14px",
                      borderRadius: 8,
                      border: "1px solid #e2e8f0",
                      fontSize: 12,
                      fontWeight: 600,
                      color: "#475569",
                      background: "rgba(255,255,255,0.9)",
                      cursor: "pointer",
                      touchAction: "manipulation",
                      minHeight: 38,
                      whiteSpace: "nowrap",
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
                    Template
                  </button>
                  <label
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 6,
                      padding: "8px 14px",
                      borderRadius: 8,
                      background: "#059669",
                      fontSize: 12,
                      fontWeight: 600,
                      color: "#fff",
                      cursor: "pointer",
                      touchAction: "manipulation",
                      minHeight: 38,
                      whiteSpace: "nowrap",
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

            {/* ── Desktop Table ── */}
            <div
              className="aim-table aim-table-wrap"
              style={{ overflowX: "auto", padding: "4px 24px 8px" }}
            >
              <table
                style={{
                  width: "100%",
                  borderCollapse: "collapse",
                  minWidth: 580,
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
                              inputMode="numeric"
                              min={1}
                              max={31}
                              value={row.monthDays}
                              onChange={(e) =>
                                update(row.id, "monthDays", e.target.value)
                              }
                              className="aim-tbl-input"
                              style={{
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
                              inputMode="numeric"
                              min={0}
                              max={row.monthDays}
                              value={row.pDays}
                              onChange={(e) =>
                                update(row.id, "pDays", e.target.value)
                              }
                              className="aim-tbl-input"
                            />
                          </td>
                          <td style={{ padding: "12px 8px" }}>
                            <input
                              type="number"
                              inputMode="numeric"
                              min={0}
                              max={row.monthDays}
                              value={row.aDays}
                              onChange={(e) =>
                                update(row.id, "aDays", e.target.value)
                              }
                              className="aim-tbl-input"
                            />
                          </td>
                          <td style={{ padding: "12px 8px", minWidth: 140 }}>
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

            {/* ── Mobile Card List ── */}
            <div className="aim-card-list" style={{ padding: "4px 14px 8px" }}>
              {rows.map((row) => {
                const hasError = !!errors[row.id];
                const isFlashed = flashIds.has(row.id);
                const pct =
                  row.monthDays > 0
                    ? Math.round((row.pDays / row.monthDays) * 100)
                    : 0;
                return (
                  <div
                    key={row.id}
                    className={`aim-employee-card${isFlashed ? " flash" : ""}${hasError ? " has-error" : ""}`}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "flex-start",
                      }}
                    >
                      <div style={{ minWidth: 0, flex: 1, paddingRight: 8 }}>
                        <p
                          style={{
                            margin: 0,
                            fontWeight: 700,
                            color: "#1e293b",
                            fontSize: 14,
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {row.name}
                        </p>
                        <p
                          style={{ margin: 0, fontSize: 11, color: "#94a3b8" }}
                        >
                          {row.employeeId}
                        </p>
                      </div>
                      <span
                        style={{
                          fontSize: 12,
                          fontWeight: 700,
                          flexShrink: 0,
                          color:
                            pct === 100
                              ? "#10b981"
                              : pct >= 80
                                ? "#f59e0b"
                                : "#ef4444",
                        }}
                      >
                        {row.monthDays > 0 ? `${pct}%` : "—"}
                      </span>
                    </div>

                    {/* Attendance bar */}
                    <div
                      style={{
                        marginTop: 8,
                        height: 5,
                        borderRadius: 99,
                        background: "#e2e8f0",
                        overflow: "hidden",
                      }}
                    >
                      <div
                        style={{
                          height: 5,
                          borderRadius: 99,
                          background: `linear-gradient(90deg,${pct >= 80 ? "#34d399,#10b981" : "#fbbf24,#f59e0b"})`,
                          width: `${pct}%`,
                          transition: "width .3s ease",
                        }}
                      />
                    </div>

                    {/* Input row */}
                    <div className="aim-input-row">
                      <div className="aim-input-group">
                        <label>Month Days</label>
                        <input
                          type="number"
                          inputMode="numeric"
                          min={1}
                          max={31}
                          value={row.monthDays}
                          onChange={(e) =>
                            update(row.id, "monthDays", e.target.value)
                          }
                          style={{
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
                      </div>
                      <div className="aim-input-group">
                        <label>P Days</label>
                        <input
                          type="number"
                          inputMode="numeric"
                          min={0}
                          max={row.monthDays}
                          value={row.pDays}
                          onChange={(e) =>
                            update(row.id, "pDays", e.target.value)
                          }
                        />
                      </div>
                      <div className="aim-input-group">
                        <label>A Days</label>
                        <input
                          type="number"
                          inputMode="numeric"
                          min={0}
                          max={row.monthDays}
                          value={row.aDays}
                          onChange={(e) =>
                            update(row.id, "aDays", e.target.value)
                          }
                        />
                      </div>
                    </div>

                    {hasError && (
                      <p
                        style={{
                          margin: "6px 0 0",
                          fontSize: 11,
                          color: "#ef4444",
                          fontWeight: 500,
                        }}
                      >
                        ⚠ {errors[row.id]}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
          {/* end scrollable body */}

          {/* ── FOOTER ── */}
          <div
            className="aim-footer"
            style={{
              padding: "14px 24px",
              paddingBottom: "max(14px, env(safe-area-inset-bottom, 14px))",
              borderTop: "1px solid #f1f5f9",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              background: "rgba(255,255,255,0.96)",
              backdropFilter: "blur(8px)",
              WebkitBackdropFilter: "blur(8px)",
              flexShrink: 0,
              gap: 10,
            }}
          >
            <p
              style={{
                margin: 0,
                fontSize: 12,
                color: "#94a3b8",
                flexShrink: 0,
              }}
            >
              {rows.length} employees listed
            </p>
            <div style={{ display: "flex", gap: 8 }}>
              <button
                onClick={onClose}
                style={{
                  padding: "9px 18px",
                  borderRadius: 10,
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: "pointer",
                  border: "1px solid #e2e8f0",
                  background: "rgba(255,255,255,0.9)",
                  color: "#475569",
                  touchAction: "manipulation",
                  minHeight: 42,
                  whiteSpace: "nowrap",
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                style={{
                  padding: "9px 18px",
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
                  touchAction: "manipulation",
                  minHeight: 42,
                  whiteSpace: "nowrap",
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
