// ─────────────────────────────────────────────────────────────────────────────
// FILE: src/Ui/AdvancePayment/ViewDetailModal/index.jsx
// ─────────────────────────────────────────────────────────────────────────────
import { useEffect } from "react";
import { createPortal } from "react-dom";
import { X, Eye, Calendar, CheckCircle2, XCircle } from "lucide-react";

import { PAYMENT_TYPES } from "./constants";
import { fmt } from "./utils";
import { StatusBadge, PaymentTypePill } from "./components/Badges";
import { InfoTile } from "./components/Primitives";

import DocCard from "./components/DocCard";

// ─────────────────────────────────────────────────────────────────────────────
// MobileInfoRow — compact label/value row (label left, value right).
// Used on mobile instead of tall InfoTile cards.
// ─────────────────────────────────────────────────────────────────────────────
function MobileInfoRow({ label, value, mono = false, last = false }) {
  if (!value && value !== 0) return null;
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 12,
        padding: "9px 0",
        borderBottom: last ? "none" : "1px solid rgba(226,232,240,0.7)",
      }}
    >
      <span
        style={{
          fontSize: 11,
          fontWeight: 600,
          color: "#94a3b8",
          letterSpacing: "0.03em",
          flexShrink: 0,
          textTransform: "uppercase",
        }}
      >
        {label}
      </span>
      <span
        style={{
          fontSize: 13,
          fontWeight: 500,
          color: "#1e293b",
          fontFamily: mono ? "ui-monospace,monospace" : "inherit",
          textAlign: "right",
          wordBreak: "break-all",
          maxWidth: "60%",
        }}
      >
        {value}
      </span>
    </div>
  );
}

function InfoGroup({ children }) {
  return (
    <div
      style={{
        background: "#f8fafc",
        border: "1px solid #e2e8f0",
        borderRadius: 12,
        padding: "0 14px",
      }}
    >
      {children}
    </div>
  );
}

export default function ViewDetailModal({ req, onClose, onApprove, onReject }) {
  if (!req) return null;

  const paymentType = req.paymentType || req.payment_type_key || "org_to_emp";
  const empName = req.name || req.emp_name;
  const empId = req.empId || req.emp_id;
  const dept = req.dept || req.emp_dept;
  const date = req.date || req.request_date?.slice(0, 10);
  const toEmpName = req.toEmpName || req.to_emp_name;
  const toEmpId = req.toEmpId || req.to_emp_id;
  const toEmpDept = req.toEmpDept || req.to_emp_dept;
  const vendorName = req.vendorName || req.vendor_name || req.to_vendor_name;
  const vendorRef = req.vendorRef || req.vendor_ref || req.to_vendor_ref;
  const vendorGst = req.to_vendor_gst;
  const adjustedIn = req.adjustedIn || req.adjusted_in;

  const screenshotAttachment = req.attachments?.find(
    (a) => a.role === "screenshot",
  );
  const proofAttachment = req.attachments?.find((a) => a.role === "proof");
  const receiptAttachment = req.attachments?.find((a) => a.role === "receipt");

  const screenshotName =
    req.screenshotName ||
    req.screenshot ||
    req.screenshotFile?.name ||
    screenshotAttachment?.name;
  const screenshotUrl = req.screenshotUrl || screenshotAttachment?.url || null;
  const screenshotFilePath =
    screenshotAttachment?.path ||
    screenshotAttachment?.file_path ||
    req.screenshotFilePath ||
    null;
  const screenshotFile =
    req.screenshotFile instanceof File ? req.screenshotFile : null;

  const proofName =
    req.proofName || req.proof || req.proofFile?.name || proofAttachment?.name;
  const proofUrl = req.proofUrl || proofAttachment?.url || null;
  const proofFilePath =
    proofAttachment?.path ||
    proofAttachment?.file_path ||
    req.proofFilePath ||
    null;
  const proofFile = req.proofFile instanceof File ? req.proofFile : null;

  const receiptName = receiptAttachment?.name;
  const receiptFilePath =
    receiptAttachment?.path || receiptAttachment?.file_path || null;

  const pt = PAYMENT_TYPES[paymentType] || PAYMENT_TYPES.org_to_emp;

  const hasScreenshot = !!(
    screenshotName ||
    screenshotFile ||
    screenshotFilePath
  );
  const hasProof = !!(proofName || proofFile || proofFilePath);
  const hasReceipt = !!(receiptName || receiptFilePath);

  // Close on Escape
  useEffect(() => {
    const handler = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  // Prevent body scroll while modal is open
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  const modalContent = (
    <>
      {/* ── Overlay — closes on tap ── */}
      <div
        onClick={onClose}
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 9998,
          backdropFilter: "blur(8px) brightness(0.6)",
          WebkitBackdropFilter: "blur(8px) brightness(0.6)",
          background: "rgba(15,23,42,0.5)",
        }}
      />

      {/*
        ══════════════════════════════════════════════════════════════
        MODAL CARD — CENTRED ON ALL SCREEN SIZES
        ─────────────────────────────────────────────────────────────
        • Mobile  (<640px) : centred floating card, 94vw, max 420px,
                             up to 88dvh, rounded-2xl on all corners,
                             safe-area padding at bottom.
        • sm      (≥640px) : same centred approach, max 520px
        • md      (≥768px) : max 560px
        • lg      (≥1024px): max 600px
        ══════════════════════════════════════════════════════════════
      */}
      <div
        style={{
          position: "fixed",
          zIndex: 9999,
          /* Centre on all screen sizes with translate trick */
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          /* Width: fluid with caps per breakpoint (handled via className) */
          display: "flex",
          flexDirection: "column",
          background: "#ffffff",
          borderRadius: 20,
          boxShadow:
            "0 24px 80px rgba(15,23,42,0.30), 0 0 0 1px rgba(255,255,255,0.5) inset",
          /* Safe-area bottom padding for notched phones */
          paddingBottom: "env(safe-area-inset-bottom, 0px)",
          overflow: "hidden",
        }}
        className="w-[94vw] max-w-[420px] max-h-[88dvh] sm:max-w-[520px] sm:max-h-[90dvh] md:max-w-[560px] md:max-h-[88dvh] lg:max-w-[600px] lg:max-h-[85dvh]"
      >
        {/* ════════ HEADER ════════ */}
        <div
          style={{
            background: "linear-gradient(135deg, #2563eb 0%, #4f46e5 100%)",
            padding: "13px 14px 13px 16px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 8,
            flexShrink: 0,
            borderBottom: "1px solid rgba(255,255,255,0.08)",
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
                width: 34,
                height: 34,
                borderRadius: 10,
                background: "rgba(255,255,255,0.15)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <Eye size={16} color="#fff" />
            </div>
            <div style={{ minWidth: 0 }}>
              <h3
                style={{
                  margin: 0,
                  fontWeight: 700,
                  fontSize: 15,
                  color: "#fff",
                  lineHeight: 1.25,
                  letterSpacing: "-0.01em",
                }}
              >
                Request Details
              </h3>
              <p
                style={{
                  margin: 0,
                  marginTop: 2,
                  fontFamily: "ui-monospace,monospace",
                  fontSize: 11,
                  color: "rgba(255,255,255,0.58)",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {req.request_code || req.id}
              </p>
            </div>
          </div>

          {/* 44×44 tap target close button */}
          <button
            onClick={onClose}
            aria-label="Close"
            style={{
              width: 34,
              height: 34,
              /* Expand tap area without moving visual */
              margin: "-5px",
              padding: 5,
              boxSizing: "content-box",
              borderRadius: 9,
              border: "1px solid rgba(255,255,255,0.22)",
              background: "rgba(255,255,255,0.1)",
              color: "rgba(255,255,255,0.8)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              flexShrink: 0,
            }}
          >
            <X size={15} />
          </button>
        </div>

        {/* ════════ META STRIP ════════
            Single non-wrapping row: pill | divider | badge … date  */}
        <div
          style={{
            background: "#f8fafc",
            borderBottom: "1px solid #e2e8f0",
            padding: "7px 16px",
            display: "flex",
            alignItems: "center",
            gap: 8,
            flexShrink: 0,
            overflow: "hidden",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 7,
              flexShrink: 0,
            }}
          >
            <PaymentTypePill type={paymentType} />
            <span
              style={{
                width: 1,
                height: 14,
                background: "#e2e8f0",
                flexShrink: 0,
              }}
            />
            <StatusBadge status={req.status} />
          </div>
          <div
            style={{
              marginLeft: "auto",
              display: "flex",
              alignItems: "center",
              gap: 4,
              color: "#94a3b8",
              fontSize: 11,
              flexShrink: 0,
              whiteSpace: "nowrap",
            }}
          >
            <Calendar size={11} />
            {date}
          </div>
        </div>

        {/* ════════ SCROLLABLE BODY ════════ */}
        <div
          style={{
            flex: 1,
            overflowY: "auto",
            overflowX: "hidden",
            WebkitOverflowScrolling: "touch",
            overscrollBehavior: "contain",
            padding: "14px 16px 8px",
            display: "flex",
            flexDirection: "column",
            gap: 14,
          }}
        >
          {/* ── REQUEST INFORMATION ── */}
          <section>
            <p
              style={{
                margin: 0,
                marginBottom: 8,
                fontSize: 10,
                fontWeight: 700,
                color: "#94a3b8",
                textTransform: "uppercase",
                letterSpacing: "0.08em",
              }}
            >
              Request Information
            </p>
            {/* Mobile: compact row list */}
            <div className="block sm:hidden">
              <InfoGroup>
                <MobileInfoRow
                  label="Request ID"
                  value={req.request_code || req.id}
                  mono
                />
                <MobileInfoRow label="Employee ID" value={empId} mono />
                <MobileInfoRow label="Full Name" value={empName} />
                <MobileInfoRow label="Department" value={dept} />
                <MobileInfoRow label="Amount" value={fmt(req.amount)} />
                <MobileInfoRow label="Date" value={date} last />
              </InfoGroup>
            </div>
            {/* sm+: tile grid */}
            <div className="hidden sm:grid sm:grid-cols-2 md:grid-cols-3 gap-2">
              <InfoTile
                label="Request ID"
                value={req.request_code || req.id}
                mono
              />
              <InfoTile label="Employee ID" value={empId} mono />
              <InfoTile label="Full Name" value={empName} />
              <InfoTile label="Department" value={dept} />
              <InfoTile label="Amount" value={fmt(req.amount)} />
              <InfoTile label="Date" value={date} />
            </div>
          </section>

          {/* ── RECIPIENT EMPLOYEE ── */}
          {paymentType === "emp_to_emp" && toEmpName && (
            <section>
              <p
                style={{
                  margin: 0,
                  marginBottom: 8,
                  fontSize: 10,
                  fontWeight: 700,
                  color: "#94a3b8",
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                }}
              >
                Recipient Employee
              </p>
              <div className="block sm:hidden">
                <InfoGroup>
                  <MobileInfoRow label="Employee ID" value={toEmpId} mono />
                  <MobileInfoRow label="Name" value={toEmpName} />
                  <MobileInfoRow label="Department" value={toEmpDept} last />
                </InfoGroup>
              </div>
              <div className="hidden sm:grid sm:grid-cols-2 md:grid-cols-3 gap-2">
                <InfoTile label="Employee ID" value={toEmpId} mono />
                <InfoTile label="Name" value={toEmpName} />
                {toEmpDept && <InfoTile label="Department" value={toEmpDept} />}
              </div>
            </section>
          )}

          {/* ── VENDOR DETAILS ── */}
          {(paymentType === "other" || paymentType === "org_to_vendor") &&
            vendorName && (
              <section>
                <p
                  style={{
                    margin: 0,
                    marginBottom: 8,
                    fontSize: 10,
                    fontWeight: 700,
                    color: "#94a3b8",
                    textTransform: "uppercase",
                    letterSpacing: "0.08em",
                  }}
                >
                  Vendor Details
                </p>
                <div className="block sm:hidden">
                  <InfoGroup>
                    <MobileInfoRow label="Vendor Name" value={vendorName} />
                    <MobileInfoRow
                      label="Reference No."
                      value={vendorRef}
                      mono
                    />
                    <MobileInfoRow
                      label="GST No."
                      value={vendorGst}
                      mono
                      last
                    />
                  </InfoGroup>
                </div>
                <div className="hidden sm:grid sm:grid-cols-2 md:grid-cols-3 gap-2">
                  <InfoTile label="Vendor Name" value={vendorName} />
                  <InfoTile label="Reference No." value={vendorRef} mono />
                  {vendorGst && (
                    <InfoTile label="GST No." value={vendorGst} mono />
                  )}
                </div>
              </section>
            )}

          {/* ── APPROVER ── */}
          {req.approver_name && (
            <section>
              <p
                style={{
                  margin: 0,
                  marginBottom: 8,
                  fontSize: 10,
                  fontWeight: 700,
                  color: "#94a3b8",
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                }}
              >
                Approver
              </p>
              <div className="block sm:hidden">
                <InfoGroup>
                  <MobileInfoRow label="Name" value={req.approver_name} />
                  <MobileInfoRow label="ID" value={req.approver_id} mono />
                  <MobileInfoRow
                    label="Designation"
                    value={req.approver_designation}
                    last
                  />
                </InfoGroup>
              </div>
              <div className="hidden sm:grid sm:grid-cols-2 md:grid-cols-3 gap-2">
                <InfoTile label="Name" value={req.approver_name} />
                <InfoTile label="ID" value={req.approver_id} mono />
                {req.approver_designation && (
                  <InfoTile
                    label="Designation"
                    value={req.approver_designation}
                  />
                )}
              </div>
            </section>
          )}

          {/* ── REASON ── */}
          <section>
            <p
              style={{
                margin: 0,
                marginBottom: 8,
                fontSize: 10,
                fontWeight: 700,
                color: "#94a3b8",
                textTransform: "uppercase",
                letterSpacing: "0.08em",
              }}
            >
              Reason
            </p>
            <div
              style={{
                background: "#f8fafc",
                border: "1px solid #e2e8f0",
                borderRadius: 12,
                padding: "11px 14px",
              }}
            >
              <p
                style={{
                  fontSize: 13,
                  color: "#334155",
                  lineHeight: 1.6,
                  margin: 0,
                }}
              >
                {req.reason}
              </p>
            </div>
          </section>

          {/* ── DOCUMENTS ── */}
          {hasScreenshot && (
            <DocCard
              label="Payment Screenshot"
              name={screenshotName}
              url={screenshotUrl}
              filePath={screenshotFilePath}
              file={screenshotFile}
              pt={pt}
              badge="Mandatory"
            />
          )}
          {hasProof && (
            <DocCard
              label="Supporting Document"
              name={proofName}
              url={proofUrl}
              filePath={proofFilePath}
              file={proofFile}
              pt={pt}
              badge="Proof"
            />
          )}
          {hasReceipt && (
            <DocCard
              label="Receipt"
              name={receiptName}
              filePath={receiptFilePath}
              pt={pt}
              badge="Receipt"
            />
          )}

          {/* ── STATUS NOTES ── */}
          {req.status === "approved" && adjustedIn && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                background: "#f0fdf4",
                border: "1px solid #bbf7d0",
                borderRadius: 12,
                padding: "11px 14px",
              }}
            >
              <CheckCircle2
                size={15}
                style={{ color: "#22c55e", flexShrink: 0 }}
              />
              <p
                style={{
                  fontSize: 12,
                  color: "#166534",
                  margin: 0,
                  lineHeight: 1.5,
                }}
              >
                Amount will be deducted in the <strong>{adjustedIn}</strong>{" "}
                salary cycle.
              </p>
            </div>
          )}
          {req.status === "rejected" && (
            <div
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: 10,
                background: "#fef2f2",
                border: "1px solid #fecaca",
                borderRadius: 12,
                padding: "11px 14px",
              }}
            >
              <XCircle
                size={15}
                style={{ color: "#f87171", flexShrink: 0, marginTop: 1 }}
              />
              <p
                style={{
                  fontSize: 12,
                  color: "#991b1b",
                  margin: 0,
                  lineHeight: 1.5,
                }}
              >
                {req.rejection_reason ? (
                  <>
                    Rejection reason: <strong>{req.rejection_reason}</strong>
                  </>
                ) : (
                  "This request was rejected. No funds will be disbursed."
                )}
              </p>
            </div>
          )}

          <div style={{ height: 4 }} />
        </div>

        {/* ════════ FOOTER ════════ */}
        <div
          style={{
            background: "#f8fafc",
            borderTop: "1px solid #e2e8f0",
            padding: "12px 16px",
            display: "flex",
            gap: 10,
            flexShrink: 0,
          }}
        >
          {req.status === "pending" ? (
            <>
              <button
                onClick={() => onReject(req)}
                style={{
                  flex: 1,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 7,
                  minHeight: 48,
                  borderRadius: 12,
                  border: "1.5px solid #fecaca",
                  background: "#fef2f2",
                  color: "#b91c1c",
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: "pointer",
                  transition: "background 0.15s",
                }}
                onMouseOver={(e) =>
                  (e.currentTarget.style.background = "#fee2e2")
                }
                onMouseOut={(e) =>
                  (e.currentTarget.style.background = "#fef2f2")
                }
              >
                <XCircle size={16} />
                Reject
              </button>
              <button
                onClick={() => onApprove(req.id)}
                style={{
                  flex: 1,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 7,
                  minHeight: 48,
                  borderRadius: 12,
                  border: "none",
                  background: "#059669",
                  color: "#fff",
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: "pointer",
                  transition: "background 0.15s",
                }}
                onMouseOver={(e) =>
                  (e.currentTarget.style.background = "#047857")
                }
                onMouseOut={(e) =>
                  (e.currentTarget.style.background = "#059669")
                }
              >
                <CheckCircle2 size={16} />
                Approve
              </button>
            </>
          ) : (
            <button
              onClick={onClose}
              style={{
                flex: 1,
                minHeight: 48,
                borderRadius: 12,
                border: "none",
                background: "rgba(15,23,42,0.88)",
                color: "#fff",
                fontSize: 14,
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Close
            </button>
          )}
        </div>
      </div>
    </>
  );

  return createPortal(modalContent, document.body);
}
