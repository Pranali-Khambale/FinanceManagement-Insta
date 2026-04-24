// ─────────────────────────────────────────────────────────────────────────────
// FILE: src/Ui/AdvancePayment/ViewDetailModal.jsx
// ─────────────────────────────────────────────────────────────────────────────
import { useState, useMemo, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
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
  Download,
  ChevronLeft,
  ChevronRight,
  Maximize2,
} from "lucide-react";

// ── Resolve base API URL ──────────────────────────────────────────────────────
const API_BASE =
  (typeof import.meta !== "undefined" && import.meta.env?.VITE_API_URL) ||
  "http://localhost:5000/api";

const SERVER_ROOT = API_BASE.replace(/\/api\/?$/, "");

function resolveFileUrl(filePath) {
  if (!filePath) return null;
  if (/^(blob:|https?:\/\/)/.test(filePath)) return filePath;
  const normalised = filePath.replace(/\\/g, "/");
  const uploadsIdx = normalised.indexOf("uploads/");
  const relativePart =
    uploadsIdx !== -1
      ? normalised.slice(uploadsIdx)
      : normalised.replace(/^\/+/, "");
  return `${SERVER_ROOT}/${relativePart}`;
}

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
  org_to_vendor: {
    label: "Org → Vendor",
    color: "#10B981",
    lightBg: "#ECFDF5",
    borderColor: "#A7F3D0",
    textColor: "#065F46",
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
    emerald: "bg-emerald-100 text-emerald-600",
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
        background: "rgba(219,234,254,0.35)",
        borderColor: "rgba(191,219,254,0.6)",
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

// ═════════════════════════════════════════════════════════════════════════════
// FULL SCREEN DOCUMENT VIEWER
// ═════════════════════════════════════════════════════════════════════════════
function DocViewer({ src, name, onClose }) {
  const isPdf = name?.toLowerCase().endsWith(".pdf");
  const [zoom, setZoom] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const zoomIn = () => setZoom((z) => Math.min(z + 0.25, 3));
  const zoomOut = () => setZoom((z) => Math.max(z - 0.25, 0.5));
  const reset = () => setZoom(1);

  useEffect(() => {
    setLoading(true);
    setError(false);
    setZoom(1);
  }, [src]);

  useEffect(() => {
    const handler = (e) => {
      if (e.key === "Escape") onClose();
      if (e.key === "+" || e.key === "=") zoomIn();
      if (e.key === "-") zoomOut();
      if (e.key === "0") reset();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  return (
    // Full screen overlay
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 99999,
        background: "rgba(2, 6, 23, 0.97)",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* ── Top bar ── */}
      <div
        style={{
          height: 56,
          flexShrink: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 16px",
          background: "rgba(15, 23, 42, 0.95)",
          borderBottom: "1px solid rgba(255,255,255,0.08)",
          gap: 12,
        }}
      >
        {/* File name */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            minWidth: 0,
            flex: 1,
          }}
        >
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              flexShrink: 0,
              background: "rgba(99,102,241,0.2)",
              border: "1px solid rgba(99,102,241,0.3)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <FileImage size={15} color="#818CF8" />
          </div>
          <span
            style={{
              fontSize: 13,
              fontWeight: 600,
              color: "rgba(255,255,255,0.9)",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {name || "Document"}
          </span>
        </div>

        {/* Zoom controls (images only) */}
        {!isPdf && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 4,
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: 8,
              padding: "2px 4px",
              flexShrink: 0,
            }}
          >
            <button
              onClick={zoomOut}
              disabled={zoom <= 0.5}
              style={{
                width: 28,
                height: 28,
                borderRadius: 6,
                border: "none",
                background: "transparent",
                color:
                  zoom <= 0.5
                    ? "rgba(255,255,255,0.25)"
                    : "rgba(255,255,255,0.7)",
                cursor: zoom <= 0.5 ? "not-allowed" : "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 16,
                fontWeight: 700,
              }}
              title="Zoom out ( - )"
            >
              −
            </button>
            <button
              onClick={reset}
              style={{
                padding: "0 8px",
                height: 28,
                borderRadius: 6,
                border: "none",
                background: "transparent",
                color: "rgba(255,255,255,0.6)",
                cursor: "pointer",
                fontSize: 11,
                fontWeight: 700,
                minWidth: 44,
              }}
              title="Reset zoom (0)"
            >
              {Math.round(zoom * 100)}%
            </button>
            <button
              onClick={zoomIn}
              disabled={zoom >= 3}
              style={{
                width: 28,
                height: 28,
                borderRadius: 6,
                border: "none",
                background: "transparent",
                color:
                  zoom >= 3
                    ? "rgba(255,255,255,0.25)"
                    : "rgba(255,255,255,0.7)",
                cursor: zoom >= 3 ? "not-allowed" : "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 16,
                fontWeight: 700,
              }}
              title="Zoom in ( + )"
            >
              +
            </button>
          </div>
        )}

        {/* Action buttons */}
        <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
          <a
            href={src}
            download={name}
            target="_blank"
            rel="noreferrer"
            style={{
              height: 34,
              padding: "0 14px",
              borderRadius: 8,
              border: "1px solid rgba(255,255,255,0.15)",
              background: "rgba(255,255,255,0.07)",
              color: "rgba(255,255,255,0.8)",
              display: "flex",
              alignItems: "center",
              gap: 6,
              cursor: "pointer",
              textDecoration: "none",
              fontSize: 12,
              fontWeight: 600,
              transition: "background 0.15s",
            }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.background = "rgba(255,255,255,0.12)")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.background = "rgba(255,255,255,0.07)")
            }
            title="Download"
          >
            <Download size={13} /> Download
          </a>
          <button
            onClick={onClose}
            style={{
              width: 34,
              height: 34,
              borderRadius: 8,
              border: "1px solid rgba(255,255,255,0.15)",
              background: "rgba(239,68,68,0.12)",
              color: "rgba(252,165,165,0.9)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              transition: "background 0.15s",
            }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.background = "rgba(239,68,68,0.28)")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.background = "rgba(239,68,68,0.12)")
            }
            title="Close (Esc)"
          >
            <X size={15} />
          </button>
        </div>
      </div>

      {/* ── Document area ── */}
      <div
        style={{
          flex: 1,
          overflow: "auto",
          display: "flex",
          alignItems: isPdf ? "flex-start" : "center",
          justifyContent: "center",
          padding: isPdf ? 0 : 24,
          background: isPdf
            ? "rgba(30, 41, 59, 0.5)"
            : "radial-gradient(ellipse at center, rgba(30,41,59,0.8) 0%, rgba(2,6,23,0.95) 100%)",
        }}
      >
        {isPdf ? (
          /* PDF — full height iframe */
          <iframe
            src={src}
            title={name}
            style={{
              width: "100%",
              height: "100%",
              border: "none",
              display: "block",
            }}
            onLoad={() => setLoading(false)}
          />
        ) : (
          /* Image — zoomable */
          <div style={{ position: "relative", display: "inline-flex" }}>
            {loading && !error && (
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  zIndex: 2,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  background: "rgba(2,6,23,0.6)",
                  borderRadius: 12,
                  minWidth: 200,
                  minHeight: 150,
                }}
              >
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: "50%",
                    border: "3px solid rgba(99,102,241,0.3)",
                    borderTopColor: "#818CF8",
                    animation: "spin 0.7s linear infinite",
                  }}
                />
                <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
              </div>
            )}

            {!error ? (
              <img
                src={src}
                alt={name}
                onLoad={() => setLoading(false)}
                onError={() => {
                  setLoading(false);
                  setError(true);
                }}
                style={{
                  maxWidth: `min(${zoom * 90}vw, ${zoom * 1200}px)`,
                  maxHeight: `${zoom * 80}vh`,
                  width: "auto",
                  height: "auto",
                  borderRadius: 12,
                  objectFit: "contain",
                  boxShadow:
                    "0 24px 80px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.06)",
                  transition: "max-width 0.2s ease, max-height 0.2s ease",
                  display: loading ? "none" : "block",
                  cursor: zoom < 3 ? "zoom-in" : "zoom-out",
                }}
                onClick={() => (zoom < 3 ? zoomIn() : reset())}
              />
            ) : (
              /* Error state */
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 16,
                  padding: 48,
                  borderRadius: 16,
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  color: "rgba(255,255,255,0.5)",
                }}
              >
                <FileText size={48} strokeWidth={1} />
                <p style={{ fontSize: 14, margin: 0, fontWeight: 500 }}>
                  Cannot preview this file
                </p>
                <a
                  href={src}
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    padding: "10px 20px",
                    borderRadius: 10,
                    background: "rgba(99,102,241,0.15)",
                    color: "#818CF8",
                    fontSize: 13,
                    fontWeight: 600,
                    textDecoration: "none",
                    border: "1px solid rgba(99,102,241,0.3)",
                  }}
                >
                  Open in new tab ↗
                </a>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Bottom hint ── */}
      {!isPdf && !error && (
        <div
          style={{
            height: 36,
            flexShrink: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 20,
            fontSize: 11,
            color: "rgba(255,255,255,0.2)",
            background: "rgba(15,23,42,0.8)",
            borderTop: "1px solid rgba(255,255,255,0.05)",
          }}
        >
          <span>Click image to zoom</span>
          <span>•</span>
          <span>Keyboard: + / − to zoom, 0 to reset, Esc to close</span>
        </div>
      )}
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// DOCUMENT CARD (thumbnail + view button)
// ═════════════════════════════════════════════════════════════════════════════
function DocCard({ label, name, url: urlProp, filePath, file, pt, badge }) {
  const [open, setOpen] = useState(false);
  const [imgError, setImgError] = useState(false);

  const blobUrl = useMemo(() => {
    if (urlProp || filePath) return null;
    if (file instanceof File || file instanceof Blob)
      return URL.createObjectURL(file);
    return null;
  }, [urlProp, filePath, file]);

  useEffect(
    () => () => {
      if (blobUrl) URL.revokeObjectURL(blobUrl);
    },
    [blobUrl],
  );

  const resolvedUrl =
    urlProp || (filePath ? resolveFileUrl(filePath) : null) || blobUrl;

  const displayName =
    name || file?.name || (filePath ? filePath.split(/[\\/]/).pop() : null);
  const isImage =
    displayName && /\.(png|jpe?g|webp|gif|bmp|svg)$/i.test(displayName);
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
            transition: "all 0.15s",
          }}
          onClick={() => resolvedUrl && setOpen(true)}
          onMouseEnter={(e) => {
            if (resolvedUrl)
              e.currentTarget.style.boxShadow = `0 4px 20px ${pt.color}22`;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.boxShadow = "none";
          }}
        >
          {/* Thumbnail */}
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: 10,
              overflow: "hidden",
              flexShrink: 0,
              background: "rgba(255,255,255,0.8)",
              border: `1px solid ${pt.borderColor}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              position: "relative",
            }}
          >
            {isImage && resolvedUrl && !imgError ? (
              <img
                src={resolvedUrl}
                alt={displayName}
                onError={() => setImgError(true)}
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
            ) : isPdf ? (
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke={pt.color}
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="9" y1="15" x2="15" y2="15" />
                <line x1="9" y1="11" x2="11" y2="11" />
              </svg>
            ) : (
              <FileText size={22} color={pt.color} />
            )}
          </div>

          {/* Name + type */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <p
              style={{
                margin: 0,
                fontSize: 13,
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
                gap: 6,
                marginTop: 4,
              }}
            >
              {badge && (
                <span
                  style={{
                    padding: "2px 8px",
                    borderRadius: 99,
                    fontSize: 9,
                    fontWeight: 700,
                    background: `${pt.color}22`,
                    color: pt.color,
                    textTransform: "uppercase",
                    letterSpacing: ".06em",
                  }}
                >
                  {badge}
                </span>
              )}
              <span
                style={{ fontSize: 11, color: pt.textColor, opacity: 0.55 }}
              >
                {isPdf ? "PDF document" : isImage ? "Image file" : "Document"}
              </span>
            </div>
          </div>

          {/* View button */}
          {resolvedUrl ? (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setOpen(true);
              }}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                padding: "7px 14px",
                borderRadius: 9,
                border: `1.5px solid ${pt.color}55`,
                background: "#fff",
                color: pt.color,
                fontSize: 12,
                fontWeight: 700,
                cursor: "pointer",
                flexShrink: 0,
                transition: "all 0.15s",
                boxShadow: `0 2px 8px ${pt.color}15`,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = pt.lightBg;
                e.currentTarget.style.borderColor = pt.color;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "#fff";
                e.currentTarget.style.borderColor = `${pt.color}55`;
              }}
            >
              <Maximize2 size={12} /> View
            </button>
          ) : (
            <span style={{ fontSize: 11, color: "#94a3b8", flexShrink: 0 }}>
              No file
            </span>
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

// ── Flow diagram ──────────────────────────────────────────────────────────────
function FlowDiagram({ req, pt }) {
  const paymentType = req.paymentType || req.payment_type_key;
  const empName = req.name || req.emp_name;
  const empId = req.empId || req.emp_id;
  const toEmpName = req.toEmpName || req.to_emp_name;
  const toEmpId = req.toEmpId || req.to_emp_id;
  const vendorName = req.vendorName || req.vendor_name || req.to_vendor_name;
  const vendorRef = req.vendorRef || req.vendor_ref || req.to_vendor_ref;

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
  const OrgBox = () => (
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
  const VendorBox = () => (
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
          {vendorName || "Vendor"}
        </p>
        <p className="text-[10px] text-slate-400">{vendorRef || "External"}</p>
      </div>
    </div>
  );

  if (paymentType === "org_to_emp")
    return (
      <div
        className="flex items-center justify-center gap-3 rounded-2xl px-6 py-4 border"
        style={{ background: pt.lightBg, borderColor: pt.borderColor }}
      >
        <OrgBox />
        <AmountArrow />
        <FromBox />
      </div>
    );
  if (paymentType === "org_to_vendor")
    return (
      <div
        className="flex items-center justify-center gap-3 rounded-2xl px-6 py-4 border"
        style={{ background: pt.lightBg, borderColor: pt.borderColor }}
      >
        <OrgBox />
        <AmountArrow />
        <VendorBox />
      </div>
    );
  if (paymentType === "emp_to_emp") {
    const ToEmpBox = () => (
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
    return (
      <div
        className="flex items-center justify-center gap-3 rounded-2xl px-6 py-4 border"
        style={{ background: pt.lightBg, borderColor: pt.borderColor }}
      >
        <FromBox />
        <AmountArrow />
        <ToEmpBox />
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
      <VendorBox />
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// MAIN MODAL
// ═════════════════════════════════════════════════════════════════════════════
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

  // Resolve attachments
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

  useEffect(() => {
    const handler = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  const modalContent = (
    <>
      {/* Overlay */}
      <div
        onClick={onClose}
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 9998,
          backdropFilter: "blur(8px) brightness(0.6)",
          WebkitBackdropFilter: "blur(8px) brightness(0.6)",
          background: "rgba(15,23,42,0.45)",
        }}
      />

      {/* Modal card */}
      <div
        style={{
          position: "fixed",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          zIndex: 9999,
          width: "calc(100% - 32px)",
          maxWidth: 500,
          maxHeight: "92vh",
          display: "flex",
          flexDirection: "column",
          borderRadius: 20,
          background: "rgba(255,255,255,0.97)",
          border: "1px solid rgba(255,255,255,0.8)",
          boxShadow:
            "0 32px 80px rgba(15,23,42,0.35), 0 0 0 1px rgba(255,255,255,0.6) inset",
        }}
      >
        {/* Header */}
        <div
          className="px-6 py-4 flex items-center justify-between shrink-0"
          style={{
            borderRadius: "20px 20px 0 0",
            background:
              "linear-gradient(135deg, rgba(37,99,235,0.92) 0%, rgba(79,70,229,0.92) 100%)",
            borderBottom: "1px solid rgba(255,255,255,0.08)",
          }}
        >
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: "rgba(255,255,255,0.12)" }}
            >
              <Eye size={17} color="rgba(255,255,255,0.95)" />
            </div>
            <div>
              <h3 className="font-bold text-base" style={{ color: "#fff" }}>
                Request Details
              </h3>
              <p
                className="font-mono text-xs mt-0.5"
                style={{ color: "rgba(255,255,255,0.65)" }}
              >
                {req.request_code || req.id}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              width: 32,
              height: 32,
              borderRadius: 9,
              border: "1px solid rgba(255,255,255,0.2)",
              background: "rgba(255,255,255,0.1)",
              color: "rgba(255,255,255,0.7)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
            }}
          >
            <X size={15} />
          </button>
        </div>

        {/* Meta strip */}
        <div
          className="px-5 py-2.5 flex items-center gap-3 shrink-0 flex-wrap"
          style={{
            background: "rgba(248,250,252,0.98)",
            borderBottom: "1px solid rgba(226,232,240,0.8)",
          }}
        >
          <PaymentTypePill type={paymentType} />
          <div className="w-px h-4 bg-slate-200" />
          <StatusBadge status={req.status} />
          <div className="ml-auto flex items-center gap-1.5 text-xs text-slate-400">
            <Calendar size={11} />
            {date}
          </div>
        </div>

        {/* Scrollable body */}
        <div
          className="overflow-y-auto flex-1 p-5 space-y-5"
          style={{ background: "#fff" }}
        >
          <FlowDiagram req={req} pt={pt} />

          {/* Request info */}
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2.5">
              Request Information
            </p>
            <div className="grid grid-cols-2 gap-2">
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
          {paymentType === "emp_to_emp" && toEmpName && (
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2.5">
                Recipient Employee
              </p>
              <div className="grid grid-cols-2 gap-2">
                <InfoTile label="Employee ID" value={toEmpId} mono />
                <InfoTile label="Name" value={toEmpName} />
                {toEmpDept && <InfoTile label="Department" value={toEmpDept} />}
              </div>
            </div>
          )}

          {/* Vendor */}
          {(paymentType === "other" || paymentType === "org_to_vendor") &&
            vendorName && (
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2.5">
                  Vendor Details
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <InfoTile label="Vendor Name" value={vendorName} />
                  <InfoTile label="Reference No." value={vendorRef} mono />
                  {vendorGst && (
                    <InfoTile label="GST No." value={vendorGst} mono />
                  )}
                </div>
              </div>
            )}

          {/* Approver */}
          {req.approver_name && (
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2.5">
                Approver
              </p>
              <div className="grid grid-cols-2 gap-2">
                <InfoTile label="Name" value={req.approver_name} />
                <InfoTile label="ID" value={req.approver_id} mono />
                {req.approver_designation && (
                  <InfoTile
                    label="Designation"
                    value={req.approver_designation}
                  />
                )}
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

          {/* Documents */}
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

          {/* Status notes */}
          {req.status === "approved" && adjustedIn && (
            <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-100 rounded-xl px-4 py-3">
              <CheckCircle2 size={16} className="text-emerald-500 shrink-0" />
              <p className="text-xs text-emerald-800">
                Amount will be deducted in the{" "}
                <span className="font-bold">{adjustedIn}</span> salary cycle.
              </p>
            </div>
          )}
          {req.status === "rejected" && (
            <div className="flex items-start gap-3 bg-red-50 border border-red-100 rounded-xl px-4 py-3">
              <XCircle size={16} className="text-red-400 shrink-0 mt-0.5" />
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

        {/* Footer */}
        <div
          className="px-5 pb-4 pt-3.5 flex gap-3 shrink-0"
          style={{
            borderRadius: "0 0 20px 20px",
            background: "rgba(248,250,252,0.98)",
            borderTop: "1px solid rgba(226,232,240,0.8)",
          }}
        >
          {req.status === "pending" ? (
            <>
              <button
                onClick={() => onReject(req)}
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
              className="flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold"
              style={{ background: "rgba(15,23,42,0.88)", color: "#fff" }}
            >
              Close
            </button>
          )}
        </div>
      </div>
    </>
  );

  // ✅ Portal renders directly into <body>, escaping any parent stacking context
  return createPortal(modalContent, document.body);
}
