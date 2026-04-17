// ─────────────────────────────────────────────────────────────────────────────
// FILE: src/Ui/AdvancePayment/ViewDetailModal.jsx
// Supports both backend snake_case fields and normalized camelCase fields
// Supports File objects via URL.createObjectURL for local preview
// ─────────────────────────────────────────────────────────────────────────────
import { useState, useMemo, useEffect } from "react";
import {
  X,
  FileText,
  CheckCircle2,
  XCircle,
  Eye,
  ArrowRight,
  Calendar,
  FileImage,
  ZoomIn,
} from "lucide-react";

const fmt = (n) => `₹${Number(n).toLocaleString("en-IN")}`;

const PAYMENT_TYPES = {
  org_to_emp: {
    label: "Org → Employee",
    color: "#6366F1",
    lightBg: "#EEF2FF",
    borderColor: "#C7D2FE",
    textColor: "#4338CA",
  },
  emp_to_emp: {
    label: "Employee → Employee",
    color: "#0EA5E9",
    lightBg: "#E0F2FE",
    borderColor: "#BAE6FD",
    textColor: "#0369A1",
  },
  other: {
    label: "External / Vendor",
    color: "#8B5CF6",
    lightBg: "#F5F3FF",
    borderColor: "#DDD6FE",
    textColor: "#6D28D9",
  },
};

const STATUS_CONFIG = {
  pending: {
    bg: "bg-amber-50",
    text: "text-amber-700",
    ring: "ring-amber-200",
    dot: "bg-amber-400",
    label: "Pending",
  },
  approved: {
    bg: "bg-emerald-50",
    text: "text-emerald-700",
    ring: "ring-emerald-200",
    dot: "bg-emerald-500",
    label: "Approved",
  },
  rejected: {
    bg: "bg-red-50",
    text: "text-red-700",
    ring: "ring-red-200",
    dot: "bg-red-400",
    label: "Rejected",
  },
};

function StatusBadge({ status }) {
  const sc = STATUS_CONFIG[status] || STATUS_CONFIG.pending;
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ring-1 ${sc.bg} ${sc.text} ${sc.ring}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${sc.dot}`} />
      {sc.label}
    </span>
  );
}

function PaymentTypePill({ type }) {
  const pt = PAYMENT_TYPES[type] || PAYMENT_TYPES.org_to_emp;
  return (
    <span
      className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold"
      style={{
        background: pt.lightBg,
        color: pt.textColor,
        border: `1px solid ${pt.borderColor}`,
      }}
    >
      {pt.label}
    </span>
  );
}

function Avatar({ name = "", size = "md", colorKey = "indigo" }) {
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
  const sizeMap = {
    sm: "w-8 h-8 text-xs",
    md: "w-10 h-10 text-sm",
    lg: "w-11 h-11 text-sm",
  };
  const colorMap = {
    indigo: "bg-indigo-100 text-indigo-600",
    sky: "bg-sky-100 text-sky-600",
    purple: "bg-purple-100 text-purple-600",
  };
  return (
    <div
      className={`rounded-full flex items-center justify-center font-bold shrink-0 ${sizeMap[size]} ${colorMap[colorKey] || colorMap.indigo}`}
    >
      {initials || "?"}
    </div>
  );
}

function InfoTile({ label, value, mono = false }) {
  return (
    <div
      className="border rounded-xl px-3.5 py-2.5"
      style={{
        background: "rgba(219, 234, 254, 0.35)",
        borderColor: "rgba(191, 219, 254, 0.6)",
      }}
    >
      <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-0.5">
        {label}
      </p>
      <p
        className={`text-sm font-semibold text-slate-700 truncate ${mono ? "font-mono" : ""}`}
      >
        {value || <span className="text-slate-300">—</span>}
      </p>
    </div>
  );
}

// ── Image / document lightbox viewer ─────────────────────────────────────────
function DocViewer({ src, name, onClose }) {
  const isPdf = name?.toLowerCase().endsWith(".pdf");

  // Close on Escape key
  useEffect(() => {
    const handler = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 10000,
          background: "rgba(10,15,30,0.82)",
          backdropFilter: "blur(6px)",
          WebkitBackdropFilter: "blur(6px)",
        }}
      />
      {/* Viewer card */}
      <div
        style={{
          position: "fixed",
          top: "50%",
          left: "50%",
          transform: "translate(-50%,-50%)",
          zIndex: 10001,
          width: "calc(100% - 40px)",
          maxWidth: 620,
          maxHeight: "88vh",
          display: "flex",
          flexDirection: "column",
          borderRadius: 16,
          overflow: "hidden",
          boxShadow: "0 32px 80px rgba(0,0,0,0.5)",
          background: "#0f172a",
        }}
      >
        {/* Viewer header */}
        <div
          style={{
            padding: "12px 16px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            borderBottom: "1px solid rgba(255,255,255,0.08)",
            flexShrink: 0,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <FileImage size={15} color="rgba(255,255,255,0.6)" />
            <span
              style={{
                fontSize: 12,
                fontWeight: 600,
                color: "rgba(255,255,255,0.85)",
                maxWidth: 340,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {name}
            </span>
          </div>
          <button
            onClick={onClose}
            style={{
              width: 28,
              height: 28,
              borderRadius: 7,
              border: "1px solid rgba(255,255,255,0.15)",
              background: "rgba(255,255,255,0.08)",
              color: "rgba(255,255,255,0.6)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
            }}
          >
            <X size={13} />
          </button>
        </div>

        {/* Content */}
        <div
          style={{
            flex: 1,
            overflowY: "auto",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 16,
            background: "#0f172a",
          }}
        >
          {isPdf ? (
            <iframe
              src={src}
              title={name}
              style={{
                width: "100%",
                height: 480,
                border: "none",
                borderRadius: 8,
              }}
            />
          ) : (
            <img
              src={src}
              alt={name}
              style={{
                maxWidth: "100%",
                maxHeight: "70vh",
                borderRadius: 10,
                objectFit: "contain",
                boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
              }}
            />
          )}
        </div>
      </div>
    </>
  );
}

// ── Document card shown in the modal body ─────────────────────────────────────
// Accepts either:
//   url  — a pre-built URL string (server URL or previously created blob URL)
//   file — a raw File object (blob URL is created + revoked internally)
function DocCard({ label, name, url: urlProp, file, pt, badge }) {
  const [open, setOpen] = useState(false);

  // ── Create a blob URL if only a File object is provided ──────────────────
  const blobUrl = useMemo(() => {
    if (urlProp) return null; // use urlProp directly, no blob needed
    if (file instanceof File || file instanceof Blob) {
      return URL.createObjectURL(file);
    }
    return null;
  }, [urlProp, file]);

  // Revoke the blob URL on unmount to avoid memory leaks
  useEffect(() => {
    return () => {
      if (blobUrl) URL.revokeObjectURL(blobUrl);
    };
  }, [blobUrl]);

  // The resolved URL to use for preview
  const resolvedUrl = urlProp || blobUrl;

  // The resolved display name
  const displayName = name || file?.name;

  const isImage =
    displayName && /\.(png|jpg|jpeg|webp|gif)$/i.test(displayName);
  const isPdf = displayName && /\.pdf$/i.test(displayName);

  if (!displayName && !resolvedUrl) return null;

  return (
    <>
      <div>
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2.5">
          {label}
        </p>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            padding: "12px 14px",
            borderRadius: 12,
            border: `1px solid ${pt.borderColor}`,
            background: pt.lightBg,
            cursor: resolvedUrl ? "pointer" : "default",
            transition: "opacity 0.15s",
          }}
          onClick={() => resolvedUrl && setOpen(true)}
        >
          {/* Thumbnail or icon */}
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 9,
              overflow: "hidden",
              flexShrink: 0,
              background: "rgba(255,255,255,0.7)",
              border: `1px solid ${pt.borderColor}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {isImage && resolvedUrl ? (
              <img
                src={resolvedUrl}
                alt={displayName}
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
            ) : (
              <FileText size={18} color={pt.color} />
            )}
          </div>

          {/* Name + badge */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <p
              style={{
                margin: 0,
                fontSize: 12,
                fontWeight: 700,
                color: pt.textColor,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {displayName || "Attached file"}
            </p>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 5,
                marginTop: 3,
              }}
            >
              {badge && (
                <span
                  style={{
                    padding: "2px 7px",
                    borderRadius: 99,
                    fontSize: 9,
                    fontWeight: 700,
                    background: pt.color + "18",
                    color: pt.color,
                    textTransform: "uppercase",
                    letterSpacing: ".05em",
                  }}
                >
                  {badge}
                </span>
              )}
              <span style={{ fontSize: 10, color: pt.textColor, opacity: 0.6 }}>
                {isPdf ? "PDF document" : isImage ? "Image" : "Document"}
              </span>
            </div>
          </div>

          {/* View button */}
          {resolvedUrl && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setOpen(true);
              }}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 5,
                padding: "6px 11px",
                borderRadius: 8,
                border: `1px solid ${pt.color}44`,
                background: "#fff",
                color: pt.color,
                fontSize: 11,
                fontWeight: 700,
                cursor: "pointer",
                flexShrink: 0,
              }}
            >
              <ZoomIn size={11} /> View
            </button>
          )}
        </div>
      </div>

      {open && resolvedUrl && (
        <DocViewer
          src={resolvedUrl}
          name={displayName}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  );
}

function FlowDiagram({ req, pt }) {
  const paymentType = req.paymentType || req.payment_type_key;
  const empName = req.name || req.emp_name;
  const empId = req.empId || req.emp_id;
  const toEmpName = req.toEmpName || req.to_emp_name;
  const toEmpId = req.toEmpId || req.to_emp_id;
  const vendorName = req.vendorName || req.vendor_name;
  const vendorRef = req.vendorRef || req.vendor_ref;

  const FromBox = () => (
    <div className="flex flex-col items-center gap-1.5 min-w-0">
      <Avatar name={empName} size="lg" colorKey="indigo" />
      <div className="text-center">
        <p className="text-xs font-bold text-slate-700 truncate max-w-[90px]">
          {empName}
        </p>
        <p className="text-[10px] text-slate-400">{empId}</p>
      </div>
    </div>
  );

  const AmountArrow = () => (
    <div className="flex flex-col items-center gap-1 shrink-0 px-2">
      <div
        className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold"
        style={{ background: pt.lightBg, color: pt.textColor }}
      >
        {fmt(req.amount)}
      </div>
      <div className="flex items-center" style={{ color: pt.color }}>
        <div className="w-10 h-0.5" style={{ background: pt.color }} />
        <ArrowRight size={14} />
      </div>
    </div>
  );

  const ToBox = () => {
    if (paymentType === "emp_to_emp") {
      return (
        <div className="flex flex-col items-center gap-1.5 min-w-0">
          <Avatar name={toEmpName} size="lg" colorKey="sky" />
          <div className="text-center">
            <p className="text-xs font-bold text-slate-700 truncate max-w-[90px]">
              {toEmpName}
            </p>
            <p className="text-[10px] text-slate-400">{toEmpId}</p>
          </div>
        </div>
      );
    }
    if (paymentType === "other") {
      return (
        <div className="flex flex-col items-center gap-1.5 min-w-0">
          <div
            className="w-11 h-11 rounded-full flex items-center justify-center shrink-0"
            style={{ background: pt.lightBg }}
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke={pt.color}
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="10" />
              <path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
            </svg>
          </div>
          <div className="text-center">
            <p className="text-xs font-bold text-slate-700 truncate max-w-[90px]">
              {vendorName}
            </p>
            <p className="text-[10px] text-slate-400">
              {vendorRef || "External"}
            </p>
          </div>
        </div>
      );
    }
    return (
      <div className="flex flex-col items-center gap-1.5 min-w-0">
        <div
          className="w-11 h-11 rounded-full flex items-center justify-center shrink-0"
          style={{ background: pt.lightBg }}
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke={pt.color}
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect x="2" y="7" width="9" height="14" rx="1.5" />
            <path d="M16 3h5v18h-5" />
            <line x1="6" y1="11" x2="7" y2="11" />
            <line x1="6" y1="15" x2="7" y2="15" />
          </svg>
        </div>
        <div className="text-center">
          <p className="text-xs font-bold text-slate-700">Organization</p>
          <p className="text-[10px] text-slate-400">Company Account</p>
        </div>
      </div>
    );
  };

  if (paymentType === "org_to_emp") {
    return (
      <div
        className="flex items-center justify-center gap-3 rounded-2xl px-6 py-4 border"
        style={{ background: pt.lightBg, borderColor: pt.borderColor }}
      >
        <ToBox />
        <AmountArrow />
        <FromBox />
      </div>
    );
  }
  return (
    <div
      className="flex items-center justify-center gap-3 rounded-2xl px-6 py-4 border"
      style={{ background: pt.lightBg, borderColor: pt.borderColor }}
    >
      <FromBox />
      <AmountArrow />
      <ToBox />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Modal
// ─────────────────────────────────────────────────────────────────────────────
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
  const vendorName = req.vendorName || req.vendor_name;
  const vendorRef = req.vendorRef || req.vendor_ref;
  const adjustedIn = req.adjustedIn || req.adjusted_in;

  // ── Screenshot fields ──────────────────────────────────────────────────────
  // Supports: screenshotName/screenshotUrl (strings), screenshotFile (File object),
  //           legacy req.screenshot (string name), attachments array
  const screenshotName =
    req.screenshotName ||
    req.screenshot ||
    req.screenshotFile?.name ||
    req.attachments?.find((a) => a.role === "screenshot")?.name;

  const screenshotUrl =
    req.screenshotUrl ||
    req.attachments?.find((a) => a.role === "screenshot")?.url ||
    null;

  // Raw File object (for local uploads not yet sent to server)
  const screenshotFile =
    req.screenshotFile instanceof File || req.screenshotFile instanceof Blob
      ? req.screenshotFile
      : null;

  // ── Proof / supporting document fields ────────────────────────────────────
  const proofName =
    req.proofName ||
    req.proof ||
    req.proofFile?.name ||
    req.attachments?.find((a) => a.role === "proof")?.name;

  const proofUrl =
    req.proofUrl ||
    req.attachments?.find((a) => a.role === "proof")?.url ||
    null;

  const proofFile =
    req.proofFile instanceof File || req.proofFile instanceof Blob
      ? req.proofFile
      : null;

  const pt = PAYMENT_TYPES[paymentType] || PAYMENT_TYPES.org_to_emp;

  // Close on Escape
  useEffect(() => {
    const handler = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  const hasScreenshot = !!(screenshotName || screenshotFile);
  const hasProof = !!(proofName || proofFile);

  return (
    <>
      {/* ── LAYER 1: Full-screen blur/dim overlay ── */}
      <div
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 9998,
          backdropFilter: "blur(8px) brightness(0.6)",
          WebkitBackdropFilter: "blur(8px) brightness(0.6)",
          background: "rgba(15, 23, 42, 0.45)",
        }}
        onClick={onClose}
      />

      {/* ── LAYER 2: Modal card ── */}
      <div
        style={{
          position: "fixed",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          zIndex: 9999,
          width: "calc(100% - 32px)",
          maxWidth: 480,
          maxHeight: "90vh",
          display: "flex",
          flexDirection: "column",
          borderRadius: 20,
          background: "rgba(255, 255, 255, 0.96)",
          border: "1px solid rgba(255,255,255,0.8)",
          boxShadow:
            "0 32px 80px rgba(15,23,42,0.35), 0 0 0 1px rgba(255,255,255,0.6) inset",
        }}
      >
        {/* ── Header ── */}
        <div
          className="px-6 py-5 flex items-center justify-between shrink-0"
          style={{
            borderRadius: "20px 20px 0 0",
            background: "rgba(37, 99, 235, 0.85)",
            backdropFilter: "blur(20px) saturate(2) brightness(0.85)",
            WebkitBackdropFilter: "blur(20px) saturate(2) brightness(0.85)",
            borderBottom: "1px solid rgba(255,255,255,0.08)",
          }}
        >
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
              style={{
                background: "rgba(255,255,255,0.10)",
                border: "1px solid rgba(255,255,255,0.18)",
              }}
            >
              <Eye size={17} color="rgba(255,255,255,0.90)" />
            </div>
            <div>
              <h3
                className="font-bold text-base"
                style={{ color: "rgba(255,255,255,0.96)" }}
              >
                Request Details
              </h3>
              <p
                className="font-mono text-xs mt-0.5"
                style={{ color: "rgba(255,255,255,0.75)" }}
              >
                {req.request_code || req.id}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="flex items-center justify-center w-8 h-8 rounded-lg transition-all"
            style={{
              background: "rgba(255,255,255,0.08)",
              border: "1px solid rgba(255,255,255,0.15)",
              color: "rgba(255,255,255,0.55)",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "rgba(255,255,255,0.18)";
              e.currentTarget.style.color = "rgba(255,255,255,1)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "rgba(255,255,255,0.08)";
              e.currentTarget.style.color = "rgba(255,255,255,0.55)";
            }}
          >
            <X size={15} />
          </button>
        </div>

        {/* ── Meta strip ── */}
        <div
          className="px-6 py-3 flex items-center gap-3 shrink-0 flex-wrap"
          style={{
            background: "rgba(248,250,252,0.95)",
            borderBottom: "1px solid rgba(226,232,240,0.8)",
          }}
        >
          <PaymentTypePill type={paymentType} />
          <div className="w-px h-4 bg-slate-200" />
          <StatusBadge status={req.status} />
          <div className="ml-auto flex items-center gap-1.5 text-xs text-slate-400">
            <Calendar size={12} />
            {date}
          </div>
        </div>

        {/* ── Scrollable body ── */}
        <div
          className="overflow-y-auto flex-1 p-6 space-y-5"
          style={{ background: "rgba(255,255,255,0.98)" }}
        >
          <FlowDiagram req={req} pt={pt} />

          {/* Request Info */}
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2.5">
              Request Information
            </p>
            <div className="grid grid-cols-2 gap-2.5">
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
          </div>

          {/* Recipient employee */}
          {paymentType === "emp_to_emp" && (
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2.5">
                Recipient Employee
              </p>
              <div className="grid grid-cols-2 gap-2.5">
                <InfoTile label="Employee ID" value={toEmpId} mono />
                <InfoTile label="Name" value={toEmpName} />
                {toEmpDept && <InfoTile label="Department" value={toEmpDept} />}
              </div>
            </div>
          )}

          {/* Vendor details */}
          {paymentType === "other" && (
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2.5">
                External / Vendor Details
              </p>
              <div className="grid grid-cols-2 gap-2.5">
                <InfoTile label="Vendor Name" value={vendorName} />
                <InfoTile label="Reference No." value={vendorRef} mono />
              </div>
            </div>
          )}

          {/* Reason */}
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2.5">
              Reason
            </p>
            <div className="bg-slate-50 border border-slate-100 rounded-xl p-3.5">
              <p className="text-sm text-slate-700 leading-relaxed">
                {req.reason}
              </p>
            </div>
          </div>

          {/* ── Payment screenshot ── */}
          {hasScreenshot && (
            <DocCard
              label="Payment Screenshot"
              name={screenshotName}
              url={screenshotUrl}
              file={screenshotFile}
              pt={pt}
              badge="Mandatory"
            />
          )}

          {/* ── Proof / supporting document ── */}
          {hasProof && (
            <DocCard
              label="Supporting Document"
              name={proofName}
              url={proofUrl}
              file={proofFile}
              pt={pt}
              badge="Proof"
            />
          )}

          {/* Approved note */}
          {req.status === "approved" && adjustedIn && (
            <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-100 rounded-xl px-4 py-3">
              <CheckCircle2 size={16} className="text-emerald-500 shrink-0" />
              <p className="text-xs text-emerald-800">
                Amount will be deducted in the{" "}
                <span className="font-bold">{adjustedIn}</span> salary cycle.
              </p>
            </div>
          )}

          {/* Rejected note */}
          {req.status === "rejected" && (
            <div className="flex items-center gap-3 bg-red-50 border border-red-100 rounded-xl px-4 py-3">
              <XCircle size={16} className="text-red-400 shrink-0" />
              <p className="text-xs text-red-700">
                {req.rejection_reason ? (
                  <>
                    Rejection reason:{" "}
                    <span className="font-semibold">
                      {req.rejection_reason}
                    </span>
                  </>
                ) : (
                  "This request was rejected. No funds will be disbursed."
                )}
              </p>
            </div>
          )}
        </div>

        {/* ── Footer ── */}
        <div
          className="px-6 pb-5 pt-4 flex gap-3 shrink-0"
          style={{
            borderRadius: "0 0 20px 20px",
            background: "rgba(248,250,252,0.98)",
            borderTop: "1px solid rgba(226,232,240,0.8)",
          }}
        >
          {req.status === "pending" ? (
            <>
              <button
                onClick={() => onReject(req.id)}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-red-200 bg-red-50 text-red-700 text-sm font-semibold hover:bg-red-100 transition-colors"
              >
                <XCircle size={15} /> Reject
              </button>
              <button
                onClick={() => onApprove(req.id)}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 transition-colors"
              >
                <CheckCircle2 size={15} /> Approve
              </button>
            </>
          ) : (
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors"
              style={{
                background: "rgba(15,23,42,0.88)",
                color: "#fff",
                border: "1px solid rgba(255,255,255,0.08)",
              }}
            >
              Close
            </button>
          )}
        </div>
      </div>
    </>
  );
}
