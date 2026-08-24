import { useState } from "react";
import { createPortal } from "react-dom";
import { X, AlertTriangle } from "lucide-react";

const QUICK_REASONS = [
  "Insufficient supporting documentation provided.",
  "Amount exceeds the approved advance limit for this category.",
  "Duplicate request — a similar request is already pending or approved.",
  "Policy violation — this type of payment is not covered under the advance policy.",
  "Please resubmit with a clearer payment screenshot.",
];

const css = `
  *, *::before, *::after { box-sizing: border-box; }

  @keyframes rr-fadeIn  { from { opacity:0; }                              to { opacity:1; } }
  @keyframes rr-modalIn { from { opacity:0; transform:translateY(-10px) scale(.98); } to { opacity:1; transform:translateY(0) scale(1); } }

  /* Prevent iOS auto-zoom */
  .rr-modal textarea { font-size: 16px !important; -webkit-appearance: none; }
  .rr-modal button   { -webkit-tap-highlight-color: transparent; touch-action: manipulation; }

  /* ── Overlay — centered on ALL devices ── */
  .rr-overlay {
    position: fixed;
    inset: 0;
    z-index: 9999;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(0,0,0,.45);
    backdrop-filter: blur(4px);
    -webkit-backdrop-filter: blur(4px);
    padding: 16px;
    overflow-y: auto;
    animation: rr-fadeIn 0.18s ease;
  }

  /* ── Modal shell — fully rounded on ALL devices ── */
  .rr-modal {
    background: #fff;
    border-radius: 18px;
    border: 1px solid #e2e8f0;
    box-shadow: 0 20px 60px rgba(0,0,0,.18);
    width: 100%;
    max-width: 460px;
    max-height: calc(100dvh - 32px);
    display: flex;
    flex-direction: column;
    overflow: hidden;
    animation: rr-modalIn 0.22s ease both;
    margin: auto;
  }

  /* ── Sections ── */
  .rr-header {
    background: #b91c1c;
    padding: 16px 20px;
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 12px;
    flex-shrink: 0;
  }

  .rr-body {
    padding: 18px 20px;
    display: flex;
    flex-direction: column;
    gap: 16px;
    overflow-y: auto;
    -webkit-overflow-scrolling: touch;
    flex: 1;
  }

  .rr-footer {
    padding: 12px 20px 14px;
    background: #f8fafc;
    border-top: 1px solid #f1f5f9;
    display: flex;
    gap: 8px;
    justify-content: flex-end;
    align-items: center;
    flex-shrink: 0;
  }

  /* ── Quick-reason chips ── */
  .rr-chip {
    font-size: 12px;
    padding: 7px 11px;
    border-radius: 99px;
    border: 1px solid #e2e8f0;
    background: #fff;
    color: #64748b;
    cursor: pointer;
    transition: all 0.15s;
    line-height: 1.3;
    text-align: left;
  }
  .rr-chip:hover    { border-color: #fca5a5; color: #b91c1c; background: #fef2f2; }
  .rr-chip.selected { border-color: #fca5a5; background: #fef2f2; color: #b91c1c; font-weight: 600; }

  /* ── Mobile (≤ 480px) — still centered, just tighter padding ── */
  @media (max-width: 480px) {
    .rr-overlay {
      padding: 12px;
    }
    .rr-modal {
      max-width: 100%;
      max-height: calc(100dvh - 24px);
    }
    .rr-header  { padding: 14px 16px; }
    .rr-body    { padding: 14px 16px; gap: 14px; }
    .rr-footer  {
      padding: 10px 16px 14px;
      flex-direction: column-reverse;
    }
    .rr-footer > * {
      width: 100% !important;
      justify-content: center !important;
    }
    .rr-chip { padding: 8px 12px; }
  }

  /* ── Tablet (481–768px) ── */
  @media (min-width: 481px) and (max-width: 768px) {
    .rr-modal { max-width: 480px; }
  }
`;

export default function RejectReasonModal({
  request,
  onConfirm,
  onClose,
  loading,
}) {
  const [reason, setReason] = useState("");

  const handleConfirm = () => {
    if (!reason.trim()) return;
    onConfirm(request.id, reason.trim());
  };

  const modalContent = (
    <>
      <style>{css}</style>

      <div
        className="rr-overlay"
        onClick={(e) => e.target === e.currentTarget && onClose()}
      >
        <div className="rr-modal">
          {/* ── Header ── */}
          <div className="rr-header">
            <div style={{ flex: 1, minWidth: 0 }}>
              <h2
                style={{
                  margin: 0,
                  color: "#fff",
                  fontWeight: 700,
                  fontSize: 15,
                }}
              >
                Reject request
              </h2>
              <p
                style={{
                  margin: "3px 0 0",
                  color: "#fecaca",
                  fontSize: 12,
                  lineHeight: 1.4,
                }}
              >
                This action cannot be undone. The employee will be notified by
                email.
              </p>
            </div>
            <button
              onClick={onClose}
              style={{
                border: "none",
                background: "none",
                cursor: "pointer",
                color: "#fecaca",
                padding: "6px",
                lineHeight: 1,
                flexShrink: 0,
                borderRadius: 8,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <X size={18} />
            </button>
          </div>

          {/* ── Body ── */}
          <div className="rr-body">
            {/* Request pill */}
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                alignItems: "center",
                gap: "4px 8px",
                padding: "8px 14px",
                borderRadius: 99,
                background: "#f1f5f9",
                border: "1px solid #e2e8f0",
              }}
            >
              <span
                style={{
                  fontFamily: "monospace",
                  fontWeight: 700,
                  fontSize: 12,
                  color: "#334155",
                }}
              >
                {request.request_code}
              </span>
              <span style={{ color: "#cbd5e1", fontSize: 12 }}>·</span>
              <span
                style={{
                  fontSize: 12,
                  color: "#64748b",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                  maxWidth: "160px",
                }}
              >
                {request.emp_name}
              </span>
              <span style={{ color: "#cbd5e1", fontSize: 12 }}>·</span>
              <span style={{ fontSize: 12, fontWeight: 700, color: "#334155" }}>
                ₹{Number(request.amount).toLocaleString("en-IN")}
              </span>
            </div>

            {/* Textarea */}
            <div>
              <label
                style={{
                  display: "block",
                  fontSize: 11,
                  fontWeight: 700,
                  color: "#94a3b8",
                  textTransform: "uppercase",
                  letterSpacing: "0.07em",
                  marginBottom: 8,
                }}
              >
                Rejection reason <span style={{ color: "#ef4444" }}>*</span>
              </label>
              <textarea
                rows={4}
                value={reason}
                onChange={(e) => setReason(e.target.value.slice(0, 500))}
                placeholder="Explain why this request is being rejected…"
                style={{
                  width: "100%",
                  padding: "11px 13px",
                  borderRadius: 10,
                  border: "1.5px solid #e2e8f0",
                  background: "#fafafa",
                  fontSize: 14,
                  color: "#1e293b",
                  fontFamily: "inherit",
                  resize: "vertical",
                  lineHeight: 1.65,
                  outline: "none",
                  transition: "border-color 0.15s",
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = "#fca5a5";
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = "#e2e8f0";
                }}
              />
              <p
                style={{
                  textAlign: "right",
                  fontSize: 11,
                  color: "#cbd5e1",
                  marginTop: 4,
                }}
              >
                {reason.length} / 500
              </p>
            </div>

            {/* Quick reasons */}
            <div>
              <p
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: "#94a3b8",
                  textTransform: "uppercase",
                  letterSpacing: "0.07em",
                  marginBottom: 8,
                }}
              >
                Quick reasons
              </p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {QUICK_REASONS.map((r) => (
                  <button
                    key={r}
                    onClick={() => setReason(r)}
                    className={`rr-chip${reason === r ? " selected" : ""}`}
                  >
                    {r.split("—")[0].trim().replace(/\.$/, "")}
                  </button>
                ))}
              </div>
            </div>

            {/* Warning banner */}
            <div
              style={{
                display: "flex",
                gap: 10,
                padding: "11px 13px",
                borderRadius: 10,
                background: "#fffbeb",
                border: "1px solid #fde68a",
              }}
            >
              <AlertTriangle
                size={14}
                color="#b45309"
                style={{ flexShrink: 0, marginTop: 1 }}
              />
              <p
                style={{
                  margin: 0,
                  fontSize: 12,
                  color: "#92400e",
                  lineHeight: 1.65,
                }}
              >
                A rejection email will be sent to the employee with this reason
                included.
              </p>
            </div>
          </div>

          {/* ── Footer ── */}
          <div className="rr-footer">
            <button
              onClick={onClose}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "10px 18px",
                borderRadius: 10,
                border: "1.5px solid #e2e8f0",
                background: "#fff",
                color: "#475569",
                fontSize: 13,
                fontWeight: 600,
                cursor: "pointer",
                whiteSpace: "nowrap",
              }}
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              disabled={!reason.trim() || loading}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "10px 18px",
                borderRadius: 10,
                border: "none",
                background: !reason.trim() || loading ? "#fca5a5" : "#b91c1c",
                color: "#fff",
                fontSize: 13,
                fontWeight: 700,
                cursor: !reason.trim() || loading ? "not-allowed" : "pointer",
                opacity: !reason.trim() || loading ? 0.6 : 1,
                transition: "all 0.15s",
                whiteSpace: "nowrap",
                boxShadow:
                  !reason.trim() || loading
                    ? "none"
                    : "0 4px 12px rgba(185,28,28,0.3)",
              }}
            >
              {loading ? "Rejecting…" : "Reject request"}
            </button>
          </div>
        </div>
      </div>
    </>
  );

  return createPortal(modalContent, document.body);
}
