import React, { useState } from "react";
import { TABS, STATUS_COLORS, DEFAULT_STATUS_COLOR } from "../constants";
import { avatarGradient, initials, n } from "../utils";
import { Divider } from "./Primitives";
import { useOverrides } from "../hooks/useOverrides";
import { usePayrollComputed } from "../hooks/usePayrollComputed";
import PersonalTab from "./PersonalTab";
import SalaryTab from "./SalaryTab";
import DeductionsTab from "./DeductionsTab";
import AttendanceTab from "./AttendanceTab";

const EmployeeDetailModal = ({ employee, onClose, onSave }) => {
  const [form, setForm] = useState({ ...employee });
  const [activeTab, setActiveTab] = useState("Personal");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);

  const overrides = useOverrides(employee);

  const resolvedEmpPf = overrides.getResolvedEmpPf(form);
  const resolvedCoEmpPf = overrides.getResolvedCoEmpPf(form);
  const resolvedPt = overrides.getResolvedPt(form);
  const resolvedGratuity = overrides.getResolvedGratuity(form);

  const computed = usePayrollComputed(
    form,
    resolvedEmpPf,
    resolvedCoEmpPf,
    resolvedPt,
    resolvedGratuity,
  );

  const summaryEmpPf =
    resolvedEmpPf != null ? resolvedEmpPf : computed.empPfDed;
  const summaryCoEmpPf =
    resolvedCoEmpPf != null ? resolvedCoEmpPf : computed.coPfDed;
  const summaryPt = resolvedPt != null ? resolvedPt : computed.pt;
  const summaryGratuity =
    resolvedGratuity != null ? resolvedGratuity : computed.gratuity;

  const handleChange = (name, value) =>
    setForm((prev) => ({ ...prev, [name]: value }));

  const handleSave = async () => {
    setSaving(true);
    setSaveError(null);
    try {
      await onSave?.(overrides.buildPayload(form));
    } catch (err) {
      setSaveError(err.message || "Save failed — please try again.");
    } finally {
      setSaving(false);
    }
  };

  const sc = STATUS_COLORS[form.employmentStatus] || DEFAULT_STATUS_COLOR;

  return (
    <>
      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes edmSlideUp { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        .edm-scroll::-webkit-scrollbar { width: 5px; }
        .edm-scroll::-webkit-scrollbar-track { background: transparent; }
        .edm-scroll::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 99px; }
        .edm-scroll::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
        /* ── Mobile: centred dialog (universal standard) ──
           16px margin on all sides, rounded corners all round,
           92dvh max-height so it never touches screen edges.    */
        @media (max-width: 640px) {
          .edm-overlay {
            align-items: center !important;
            justify-content: center !important;
            padding: 16px !important;
          }
          .edm-modal {
            border-radius: 16px !important;
            max-height: 92dvh !important;
            max-height: 92vh !important;
            width: 100% !important;
          }
          .edm-header  { padding: 12px 14px !important; }
          .edm-tabs    { padding: 0 14px !important; }
          .edm-body    { padding: 14px !important; }
          .edm-footer  {
            padding: 12px 14px !important;
            padding-bottom: max(12px, env(safe-area-inset-bottom, 12px)) !important;
          }
          /* Grids → single column on narrow screens */
          .edm-grid-2 { grid-template-columns: 1fr !important; }
          .edm-grid-3 { grid-template-columns: 1fr 1fr !important; }
          .edm-net-preview { flex-direction: column !important; gap: 6px !important; }
          /* Tab bar: equal-width tabs that fill row */
          .edm-tab-btn { flex: 1 !important; padding: 10px 6px !important; font-size: 12px !important; text-align: center !important; }
          /* Avatar row: hide "For Month" on very small screens */
          .edm-for-month { display: none !important; }
          /* Footer buttons: stretch full width */
          .edm-footer-btns { flex-direction: row !important; width: 100% !important; }
          .edm-footer-btns button { flex: 1 !important; justify-content: center !important; }
        }
        @media (max-width: 380px) {
          .edm-grid-3 { grid-template-columns: 1fr !important; }
          .edm-for-month { display: none !important; }
        }
      `}</style>

      <div
        className="edm-overlay"
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose();
        }}
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 200,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "rgba(0,0,0,.6)",
          backdropFilter: "blur(8px)",
          WebkitBackdropFilter: "blur(8px)",
          padding: "16px",
        }}
      >
        <div
          className="edm-modal"
          style={{
            background: "rgba(255,255,255,0.97)",
            backdropFilter: "blur(12px)",
            WebkitBackdropFilter: "blur(12px)",
            borderRadius: 16,
            width: "100%",
            maxWidth: 780,
            border: "1px solid rgba(255,255,255,0.6)",
            boxShadow: "0 25px 60px rgba(0,0,0,.22)",
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
            maxHeight: "90vh",
            animation: "edmSlideUp .22s ease",
          }}
        >
          {/* Header */}
          <div
            className="edm-header"
            style={{
              background: "linear-gradient(135deg,#1a3c6e,#1e56a0)",
              padding: "16px 20px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexShrink: 0,
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
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
              </div>
              <div>
                <h2
                  style={{
                    color: "#fff",
                    fontSize: 17,
                    fontWeight: 700,
                    margin: 0,
                  }}
                >
                  Employee Details
                </h2>
                <p
                  style={{
                    color: "rgba(255,255,255,.55)",
                    fontSize: 12,
                    margin: "2px 0 0",
                  }}
                >
                  Edit and save salary, deductions &amp; attendance
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              style={{
                width: 32,
                height: 32,
                borderRadius: 8,
                background: "rgba(255,255,255,.15)",
                border: "none",
                color: "#fff",
                cursor: "pointer",
                fontSize: 16,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              ✕
            </button>
          </div>

          {/* Tabs */}
          <div
            className="edm-tabs"
            style={{
              display: "flex",
              borderBottom: "1px solid #f1f5f9",
              padding: "0 20px",
              flexShrink: 0,
              overflowX: "auto",
              background: "rgba(255,255,255,.95)",
            }}
          >
            {TABS.map((tab) => (
              <button
                key={tab}
                className="edm-tab-btn"
                onClick={() => setActiveTab(tab)}
                style={{
                  padding: "10px 16px",
                  fontSize: 13,
                  fontWeight: 500,
                  color: activeTab === tab ? "#1a3c6e" : "#94a3b8",
                  borderBottom:
                    activeTab === tab
                      ? "2px solid #1a3c6e"
                      : "2px solid transparent",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                  transition: "color 0.15s",
                }}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Body */}
          <div
            className="edm-scroll edm-body"
            style={{ padding: "20px", overflowY: "auto", flex: 1 }}
          >
            {/* Avatar row */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 14,
                marginBottom: 16,
                flexWrap: "wrap",
              }}
            >
              <div
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 12,
                  background: avatarGradient(form.name),
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#fff",
                  fontWeight: 600,
                  fontSize: 17,
                  flexShrink: 0,
                }}
              >
                {initials(form.name)}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p
                  style={{
                    fontSize: 15,
                    fontWeight: 500,
                    color: "#1e293b",
                    margin: 0,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {form.name || "—"}
                </p>
                <p style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>
                  {form.employeeId} · {form.designation || "—"} ·{" "}
                  {form.department || "—"}
                </p>
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 5,
                    padding: "3px 9px",
                    borderRadius: 20,
                    fontSize: 11,
                    fontWeight: 600,
                    background: sc.bg,
                    color: sc.color,
                    border: `0.5px solid ${sc.border}`,
                    marginTop: 5,
                  }}
                >
                  <span
                    style={{
                      width: 6,
                      height: 6,
                      borderRadius: "50%",
                      background: sc.dot,
                    }}
                  />
                  {form.employmentStatus || "Active"}
                </span>
              </div>
              <div style={{ textAlign: "right", flexShrink: 0 }}>
                <p style={{ fontSize: 11, color: "#94a3b8", margin: 0 }}>
                  For Month
                </p>
                <p
                  style={{
                    fontSize: 13,
                    fontWeight: 500,
                    color: "#1e293b",
                    marginTop: 2,
                  }}
                >
                  {form.forMonth || "—"}
                </p>
                {n(form.advancePendingCount) > 0 && (
                  <span
                    style={{
                      display: "inline-block",
                      marginTop: 4,
                      padding: "2px 8px",
                      borderRadius: 20,
                      fontSize: 11,
                      fontWeight: 600,
                      background: "#fffbeb",
                      color: "#d97706",
                      border: "0.5px solid #fcd34d",
                    }}
                  >
                    {form.advancePendingCount} advance pending
                  </span>
                )}
              </div>
            </div>

            <Divider />

            {activeTab === "Personal" && (
              <PersonalTab form={form} handleChange={handleChange} />
            )}
            {activeTab === "Salary" && (
              <SalaryTab
                form={form}
                handleChange={handleChange}
                computed={computed}
              />
            )}
            {activeTab === "Attendance" && (
              <AttendanceTab
                form={form}
                handleChange={handleChange}
                computed={computed}
              />
            )}
            {activeTab === "Deductions" && (
              <DeductionsTab
                form={form}
                handleChange={handleChange}
                computed={computed}
                pfOverride={overrides.pfOverride}
                handlePfOverrideToggle={overrides.handlePfOverrideToggle}
                empPf={overrides.empPf}
                setEmpPf={overrides.setEmpPf}
                coEmpPf={overrides.coEmpPf}
                setCoEmpPf={overrides.setCoEmpPf}
                ptOverride={overrides.ptOverride}
                handlePtOverrideToggle={overrides.handlePtOverrideToggle}
                ptVal={overrides.ptVal}
                setPtVal={overrides.setPtVal}
                gratuityOverride={overrides.gratuityOverride}
                handleGratuityOverrideToggle={
                  overrides.handleGratuityOverrideToggle
                }
                gratuityVal={overrides.gratuityVal}
                setGratuityVal={overrides.setGratuityVal}
                summaryEmpPf={summaryEmpPf}
                summaryCoEmpPf={summaryCoEmpPf}
                summaryPt={summaryPt}
                summaryGratuity={summaryGratuity}
              />
            )}
          </div>

          {/* Footer */}
          <div
            className="edm-footer"
            style={{
              padding: "14px 20px",
              borderTop: "1px solid #f1f5f9",
              display: "flex",
              flexDirection: "column",
              gap: 8,
              flexShrink: 0,
              background: "rgba(255,255,255,.95)",
              backdropFilter: "blur(8px)",
              WebkitBackdropFilter: "blur(8px)",
            }}
          >
            {saveError && (
              <div
                style={{
                  padding: "8px 12px",
                  borderRadius: 8,
                  background: "#fef2f2",
                  border: "0.5px solid #fca5a5",
                  fontSize: 12,
                  color: "#dc2626",
                }}
              >
                {saveError}
              </div>
            )}
            <div
              className="edm-footer-btns"
              style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}
            >
              <button
                onClick={onClose}
                style={{
                  padding: "8px 18px",
                  borderRadius: 8,
                  border: "1px solid #e2e8f0",
                  background: "rgba(248,250,252,0.9)",
                  color: "#64748b",
                  fontSize: 13,
                  fontWeight: 500,
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                style={{
                  padding: "8px 20px",
                  borderRadius: 8,
                  border: "none",
                  background: saving
                    ? "#93a9c9"
                    : "linear-gradient(135deg,#1a3c6e,#1e56a0)",
                  color: "#fff",
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: saving ? "not-allowed" : "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  boxShadow: saving ? "none" : "0 2px 8px rgba(26,60,110,.35)",
                }}
              >
                {saving ? (
                  <>
                    <svg
                      style={{
                        width: 14,
                        height: 14,
                        animation: "spin 0.8s linear infinite",
                      }}
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                        style={{ opacity: 0.25 }}
                      />
                      <path
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8v8z"
                        style={{ opacity: 0.75 }}
                      />
                    </svg>
                    Saving…
                  </>
                ) : (
                  "Save Changes"
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default EmployeeDetailModal;
