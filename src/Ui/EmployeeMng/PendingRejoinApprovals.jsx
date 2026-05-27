// src/Ui/EmployeeMng/PendingRejoinApprovals.jsx
// ─────────────────────────────────────────────────────────────────────────────
// KEY CHANGES vs previous version:
//   ✅ Delete button WORKS — calls DELETE /api/employees/:id/pending-rejoin
//   ✅ ConfirmDialog before delete (safety prompt)
//   ✅ Fetches from GET /api/employees/pending-rejoin (dedicated endpoint)
//   ✅ Reject calls POST /api/registrations/:id/reject-rejoin
//   ✅ Approve calls POST /api/registrations/:id/approve
//   ✅ Cleanup cron trigger on mount
//   ✅ FARM-ToCli Certificate added to DOC_DEFS (shown for Telecom employees)
//   ✅ NEW: SubmittedDocsSection — after rejoin approval employee can upload
//          signed KYE, BGV form & email screenshot; HR reviews with Accept/Reject All
//   ✅ NEW: RejoinDocsPendingReviewSection — top-of-page section showing
//          approved rejoined employees who have submitted docs pending HR review
// ─────────────────────────────────────────────────────────────────────────────
import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  ArrowLeft, Loader, AlertCircle, UserCheck, XCircle, CheckCircle,
  RefreshCw, Eye, ChevronDown, ChevronUp, Phone, Mail,
  Building2, Calendar, Banknote, User, AlertTriangle, Clock, History,
  FileText, CreditCard, Shield, UserCircle, Building, FileCheck, Award,
  ZoomIn, ExternalLink, Download, ChevronLeft, ChevronRight,
  X as XIcon, Trash2, Radio, Upload, Check, Camera, File,
  CheckCheck, Bell, FolderOpen, Briefcase,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

import { BASE_URL } from "../../api/client";
const BASE_URL_NO_API = BASE_URL.replace("/api", "");


// ══════════════════════════════════════════════════════════════════════════════
// HELPERS
// ══════════════════════════════════════════════════════════════════════════════
const fmt = (v) => {
  if (!v) return "—";
  const d = new Date(v);
  return isNaN(d.getTime()) ? v : d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
};
const fmtDateTime = (v) => {
  if (!v) return "—";
  const d = new Date(v);
  return isNaN(d.getTime()) ? v : d.toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
};
const fmtDateShort = (v) => {
  if (!v) return "—";
  return new Date(v).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
};
const fullUrl = (path) =>
  !path ? null : path.startsWith("http") ? path : `${BASE_URL_NO_API}${path}`;
const getFileType = (path, mime) => {
  const p = (path || "").toLowerCase();
  const m = (mime || "").toLowerCase();
  if (m.includes("pdf") || p.endsWith(".pdf")) return "pdf";
  if (m.includes("image") || /\.(jpg|jpeg|png|gif|webp|bmp)$/.test(p)) return "image";
  return "other";
};
const isTelecomDept = (dept) =>
  (dept || "").toLowerCase() === "telecom";

const InfoField = ({ label, value }) =>
  value ? (
    <div>
      <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wide mb-0.5">{label}</p>
      <p className="text-sm text-gray-800 font-medium">{value}</p>
    </div>
  ) : null;

// ══════════════════════════════════════════════════════════════════════════════
// DOCUMENT DEFINITIONS (registration docs)
// ══════════════════════════════════════════════════════════════════════════════
const ALL_DOC_DEFS = [
  { type: "idPhoto",            label: "Employee Photo",         icon: <UserCircle className="w-4 h-4" />, telecomOnly: false },
  { type: "aadharCard",         label: "Aadhaar Card",           icon: <CreditCard className="w-4 h-4" />, telecomOnly: false },
  { type: "panCard",            label: "PAN Card",               icon: <FileCheck  className="w-4 h-4" />, telecomOnly: false },
  { type: "resume",             label: "Resume",                 icon: <FileText   className="w-4 h-4" />, telecomOnly: false },
  { type: "bankPassbook",       label: "Bank Passbook",          icon: <Building   className="w-4 h-4" />, telecomOnly: false },
  { type: "medicalCertificate", label: "Medical Certificate",    icon: <Shield     className="w-4 h-4" />, telecomOnly: false },
  { type: "academicRecords",    label: "Academic Records",       icon: <Award      className="w-4 h-4" />, telecomOnly: false },
  { type: "payslip",            label: "Pay Slip",               icon: <FileText   className="w-4 h-4" />, telecomOnly: false },
  { type: "otherCertificates",  label: "Other Certificates",     icon: <FileText   className="w-4 h-4" />, telecomOnly: false },
  { type: "farmToCli",          label: "FARM-ToCli Certificate", icon: <Radio      className="w-4 h-4" />, telecomOnly: true  },
];

const getDocDefs = (department) =>
  ALL_DOC_DEFS.filter((d) => !d.telecomOnly || isTelecomDept(department));

// ── Submitted-doc type metadata (for KYE/BGV/screenshot section) ─────────────
const SUBMITTED_DOC_META = {
  signed_kye:       { label: "Signed KYE Form",             icon: FileText, color: { bg: "#eff6ff", border: "#bfdbfe", text: "#1d4ed8", dot: "#3b82f6" } },
  bgv_form:         { label: "BGV Form",                    icon: Shield,   color: { bg: "#f5f3ff", border: "#ddd6fe", text: "#6d28d9", dot: "#7c3aed" } },
  email_screenshot: { label: "Approval Email Screenshot",   icon: Camera,   color: { bg: "#f0fdf4", border: "#bbf7d0", text: "#15803d", dot: "#22c55e" } },
  other:            { label: "Other Document",              icon: File,     color: { bg: "#f9fafb", border: "#e5e7eb", text: "#374151", dot: "#9ca3af" } },
};

// ══════════════════════════════════════════════════════════════════════════════
// CONFIRM DIALOG
// ══════════════════════════════════════════════════════════════════════════════
const ConfirmDialog = ({ title, message, confirmLabel = "Confirm", confirmClass = "bg-red-600 hover:bg-red-700", onConfirm, onCancel }) => (
  <div className="fixed inset-0 z-[9998] backdrop-blur-sm bg-black/40 flex items-center justify-center p-4">
    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
          <AlertTriangle className="w-5 h-5 text-red-600" />
        </div>
        <div>
          <p className="font-bold text-gray-900 text-sm">{title}</p>
          <p className="text-xs text-gray-500 mt-0.5">{message}</p>
        </div>
      </div>
      <div className="flex gap-3 justify-end">
        <button onClick={onCancel}
          className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium transition-colors">
          Cancel
        </button>
        <button onClick={onConfirm}
          className={`px-4 py-2 text-white rounded-lg text-sm font-semibold transition-colors ${confirmClass}`}>
          {confirmLabel}
        </button>
      </div>
    </div>
  </div>
);

// ══════════════════════════════════════════════════════════════════════════════
// LIGHTBOX (for registration docs)
// ══════════════════════════════════════════════════════════════════════════════
const Lightbox = ({ docs, startIndex = 0, onClose }) => {
  const [idx, setIdx]           = useState(startIndex);
  const [imgError, setImgError] = useState(false);
  const doc      = docs[idx];
  const url      = fullUrl(doc?.path);
  const fileType = getFileType(doc?.path, doc?.mime_type);

  useEffect(() => { setImgError(false); }, [idx]);
  useEffect(() => {
    const h = (e) => {
      if (e.key === "Escape")     onClose();
      if (e.key === "ArrowRight") setIdx(i => Math.min(i + 1, docs.length - 1));
      if (e.key === "ArrowLeft")  setIdx(i => Math.max(i - 1, 0));
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [docs.length, onClose]);

  if (!url) return null;
  return (
    <div className="fixed inset-0 z-[400] flex flex-col" style={{ background: "rgba(0,0,0,0.93)" }}>
      <div className="flex items-center justify-between px-6 py-3 flex-shrink-0"
        style={{ background: "linear-gradient(90deg,#312e81,#4f46e5)" }}>
        <div className="flex items-center gap-3">
          <FileText className="w-5 h-5 text-white/80" />
          <div>
            <p className="text-white font-semibold text-sm">{doc?.label}</p>
            <p className="text-indigo-200 text-xs">{idx + 1} of {docs.length} documents</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <a href={url} download target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white/15 hover:bg-white/25 text-white rounded-lg text-xs font-medium">
            <Download className="w-3.5 h-3.5" /> Download
          </a>
          <a href={url} target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white/15 hover:bg-white/25 text-white rounded-lg text-xs font-medium">
            <ExternalLink className="w-3.5 h-3.5" /> Open Tab
          </a>
          <button onClick={onClose}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white text-indigo-900 rounded-lg text-xs font-semibold hover:bg-indigo-50 ml-1">
            <XIcon className="w-3.5 h-3.5" /> Close
          </button>
        </div>
      </div>
      <div className="flex-1 flex items-center justify-center relative overflow-hidden p-6">
        {idx > 0 && (
          <button onClick={() => setIdx(i => i - 1)}
            className="absolute left-4 z-10 w-11 h-11 bg-white/20 hover:bg-white/40 rounded-full flex items-center justify-center text-white shadow-lg">
            <ChevronLeft className="w-6 h-6" />
          </button>
        )}
        {fileType === "pdf" && (
          <iframe src={url} title={doc?.label} className="w-full rounded-xl shadow-2xl bg-white"
            style={{ height: "calc(100vh - 140px)", maxWidth: "960px" }} />
        )}
        {fileType === "image" && !imgError && (
          <img src={url} alt={doc?.label} className="rounded-xl shadow-2xl object-contain border border-white/10"
            style={{ maxHeight: "calc(100vh - 140px)", maxWidth: "100%" }}
            onError={() => setImgError(true)} />
        )}
        {(fileType === "other" || (fileType === "image" && imgError)) && (
          <div className="text-center text-white space-y-4">
            <FileText className="w-10 h-10 opacity-60 mx-auto" />
            <p className="text-lg font-semibold opacity-80">Preview not available</p>
            <a href={url} target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 rounded-xl text-sm font-semibold">
              <ExternalLink className="w-4 h-4" /> Open in New Tab
            </a>
          </div>
        )}
        {idx < docs.length - 1 && (
          <button onClick={() => setIdx(i => i + 1)}
            className="absolute right-4 z-10 w-11 h-11 bg-white/20 hover:bg-white/40 rounded-full flex items-center justify-center text-white shadow-lg">
            <ChevronRight className="w-6 h-6" />
          </button>
        )}
      </div>
    </div>
  );
};

// ══════════════════════════════════════════════════════════════════════════════
// DOC LIGHTBOX (for submitted KYE/BGV/screenshot docs)
// ══════════════════════════════════════════════════════════════════════════════
const DocLightbox = ({ docs, startIndex = 0, onClose }) => {
  const [idx, setIdx]           = useState(startIndex);
  const [imgError, setImgError] = useState(false);

  const doc      = docs[idx];
  const url      = fullUrl(doc?.file_path || doc?.path);
  const fileType = getFileType(doc?.file_path || doc?.path, doc?.mime_type);

  useEffect(() => { setImgError(false); }, [idx]);
  useEffect(() => {
    const h = (e) => {
      if (e.key === "Escape")     onClose();
      if (e.key === "ArrowRight") setIdx(i => Math.min(i + 1, docs.length - 1));
      if (e.key === "ArrowLeft")  setIdx(i => Math.max(i - 1, 0));
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [docs.length, onClose]);

  const meta = SUBMITTED_DOC_META[doc?.document_type] || SUBMITTED_DOC_META.other;
  const Icon = meta.icon;

  return (
    <div className="fixed inset-0 z-[500] flex flex-col" style={{ background: "rgba(0,0,0,0.95)" }}>
      <div className="flex items-center justify-between px-6 py-3 flex-shrink-0"
        style={{ background: "linear-gradient(90deg,#312e81,#4f46e5)" }}>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: meta.color.bg }}>
            <Icon className="w-4 h-4" style={{ color: meta.color.text }} />
          </div>
          <div>
            <p className="text-white font-semibold text-sm">{meta.label}</p>
            <p className="text-indigo-300 text-xs">{idx + 1} of {docs.length}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {url && (
            <>
              <a href={url} download target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-lg text-xs font-medium border border-white/10">
                <Download className="w-3.5 h-3.5" /> Download
              </a>
              <a href={url} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-lg text-xs font-medium border border-white/10">
                <ExternalLink className="w-3.5 h-3.5" /> Open
              </a>
            </>
          )}
          <button onClick={onClose}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white text-indigo-900 rounded-lg text-xs font-bold hover:bg-indigo-50 ml-2">
            <XIcon className="w-3.5 h-3.5" /> Close
          </button>
        </div>
      </div>
      <div className="flex-1 flex items-center justify-center relative overflow-hidden p-6">
        {idx > 0 && (
          <button onClick={() => setIdx(i => i - 1)}
            className="absolute left-4 z-10 w-11 h-11 bg-white/10 hover:bg-white/25 rounded-full flex items-center justify-center text-white border border-white/10">
            <ChevronLeft className="w-6 h-6" />
          </button>
        )}
        {fileType === "pdf" && url && (
          <iframe src={url} title={meta.label} className="w-full rounded-xl shadow-2xl bg-white"
            style={{ height: "calc(100vh - 140px)", maxWidth: "960px" }} />
        )}
        {fileType === "image" && url && !imgError && (
          <img src={url} alt={meta.label} className="rounded-xl shadow-2xl object-contain"
            style={{ maxHeight: "calc(100vh - 140px)", maxWidth: "100%" }}
            onError={() => setImgError(true)} />
        )}
        {(fileType === "other" || (fileType === "image" && imgError) || !url) && (
          <div className="text-center text-white space-y-4">
            <div className="w-20 h-20 bg-white/10 rounded-2xl flex items-center justify-center mx-auto">
              <FileText className="w-10 h-10 opacity-50" />
            </div>
            <p className="text-lg font-semibold opacity-70">Preview not available</p>
            {url && (
              <a href={url} download
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-white/15 hover:bg-white/25 rounded-xl text-sm font-semibold">
                <Download className="w-4 h-4" /> Download File
              </a>
            )}
          </div>
        )}
        {idx < docs.length - 1 && (
          <button onClick={() => setIdx(i => i + 1)}
            className="absolute right-4 z-10 w-11 h-11 bg-white/10 hover:bg-white/25 rounded-full flex items-center justify-center text-white border border-white/10">
            <ChevronRight className="w-6 h-6" />
          </button>
        )}
      </div>
    </div>
  );
};

// ══════════════════════════════════════════════════════════════════════════════
// DOC VIEW ROW — view + download only (no per-doc accept/reject)
// ══════════════════════════════════════════════════════════════════════════════
const DocViewRow = ({ doc, onView }) => {
  const meta  = SUBMITTED_DOC_META[doc.document_type] || SUBMITTED_DOC_META.other;
  const Icon  = meta.icon;
  const url   = fullUrl(doc.file_path);
  const ft    = getFileType(doc.file_path, doc.mime_type);

  const isAccepted = doc.status === "accepted" || doc.reviewed === true;
  const isRejected = doc.status === "rejected";
  const isPending  = !isAccepted && !isRejected;

  return (
    <div className="rounded-xl border transition-all"
      style={{
        background:   isAccepted ? "#f0fdf4" : isRejected ? "#fef2f2" : meta.color.bg,
        borderColor:  isAccepted ? "#bbf7d0" : isRejected ? "#fecaca" : meta.color.border,
      }}>
      <div className="flex items-center gap-3 px-4 py-3">
        <div className="w-12 h-12 rounded-lg overflow-hidden border flex-shrink-0 flex items-center justify-center"
          style={{ borderColor: meta.color.border, background: ft === "image" ? "transparent" : meta.color.bg }}>
          {ft === "image" && url ? (
            <img src={url} alt={meta.label} className="w-full h-full object-cover"
              onError={(e) => { e.target.style.display = "none"; }} />
          ) : ft === "pdf" ? (
            <div className="w-full h-full flex flex-col items-center justify-center gap-0.5" style={{ background: meta.color.bg }}>
              <FileText className="w-5 h-5" style={{ color: meta.color.text }} />
              <span className="text-[8px] font-bold" style={{ color: meta.color.text }}>PDF</span>
            </div>
          ) : (
            <Icon className="w-5 h-5" style={{ color: meta.color.text }} />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <p className="text-sm font-bold text-gray-900 truncate">{meta.label}</p>
            {isPending && (
              <span className="flex-shrink-0 text-[9px] font-bold px-1.5 py-0.5 rounded-full"
                style={{ background: meta.color.dot, color: "#fff" }}>PENDING</span>
            )}
            {isAccepted && (
              <span className="flex-shrink-0 inline-flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-green-500 text-white">
                <Check className="w-2.5 h-2.5" style={{ strokeWidth: 3 }} /> ACCEPTED
              </span>
            )}
            {isRejected && (
              <span className="flex-shrink-0 inline-flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-red-500 text-white">
                <XIcon className="w-2.5 h-2.5" style={{ strokeWidth: 3 }} /> REJECTED
              </span>
            )}
          </div>
          <p className="text-xs text-gray-500 truncate">{doc.file_name}</p>
          <p className="text-[10px] text-gray-400 mt-0.5">
            {new Date(doc.uploaded_at).toLocaleString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
          </p>
          {isRejected && doc.rejection_reason && (
            <p className="text-[10px] text-red-500 mt-1 italic">Reason: {doc.rejection_reason}</p>
          )}
        </div>

        <div className="flex items-center gap-1.5 flex-shrink-0">
          {url && (
            <button onClick={() => onView(doc)}
              className="w-9 h-9 rounded-lg flex items-center justify-center border border-gray-200 bg-white hover:border-indigo-300 hover:bg-indigo-50 transition-all"
              title="View document">
              <Eye className="w-4 h-4 text-gray-500" />
            </button>
          )}
          {url && (
            <a href={url} download target="_blank" rel="noopener noreferrer"
              className="w-9 h-9 rounded-lg flex items-center justify-center border border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50 transition-all"
              title="Download">
              <Download className="w-4 h-4 text-gray-500" />
            </a>
          )}
        </div>
      </div>
    </div>
  );
};

// ══════════════════════════════════════════════════════════════════════════════
// BATCH ACTION BAR — Accept All / Reject All
// ══════════════════════════════════════════════════════════════════════════════
const BatchActionBar = ({ docs, onAcceptAll, onRejectAll, accepting, rejecting }) => {
  const [showRejectBox, setShowRejectBox] = useState(false);
  const [reason, setReason]               = useState("");

  const pendingCount = docs.filter(
    d => !d.reviewed && d.status !== "accepted" && d.status !== "rejected"
  ).length;
  const allDone = pendingCount === 0 && docs.length > 0;

  if (allDone) return null;

  const handleRejectConfirm = () => {
    onRejectAll(reason);
    setShowRejectBox(false);
    setReason("");
  };

  return (
    <div className="rounded-xl border mb-3 overflow-hidden"
      style={{ background: "linear-gradient(90deg,#f8fafc,#f1f5f9)", borderColor: "#e2e8f0" }}>
      <div className="flex items-center justify-between px-4 py-3 gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
          <p className="text-xs font-bold text-gray-700">
            {pendingCount} document{pendingCount !== 1 ? "s" : ""} pending review
          </p>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 font-semibold border border-amber-200">
            {docs.length} submitted
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={onAcceptAll} disabled={accepting || rejecting}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-white text-xs font-bold disabled:opacity-50 transition-all shadow-sm hover:shadow-md active:scale-[0.97]"
            style={{ background: "linear-gradient(135deg,#16a34a,#22c55e)" }}>
            {accepting ? <Loader className="w-3.5 h-3.5 animate-spin" /> : <CheckCheck className="w-3.5 h-3.5" />}
            Accept All
          </button>
          <button onClick={() => setShowRejectBox(p => !p)} disabled={accepting || rejecting}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg border border-red-200 bg-white text-red-600 hover:bg-red-50 hover:border-red-400 text-xs font-bold disabled:opacity-50 transition-all">
            <XCircle className="w-3.5 h-3.5" />
            {showRejectBox ? "Cancel" : "Reject All"}
          </button>
        </div>
      </div>

      {showRejectBox && (
        <div className="px-4 pb-4 border-t border-red-100" style={{ background: "#fff5f5" }}>
          <p className="text-xs font-semibold text-red-700 mb-2 mt-3">
            Reason for rejecting all documents <span className="text-red-400 font-normal">(optional)</span>
          </p>
          <textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={2}
            placeholder="e.g. Documents are blurry, wrong files uploaded, incomplete submission…"
            className="w-full px-3 py-2 rounded-lg border border-red-200 bg-white text-xs text-gray-800 resize-none outline-none focus:border-red-400 mb-3" />
          <div className="flex gap-2 justify-end">
            <button onClick={() => { setShowRejectBox(false); setReason(""); }} disabled={rejecting}
              className="px-3 py-1.5 rounded-lg border border-gray-200 bg-white text-xs font-semibold text-gray-600 hover:bg-gray-50 disabled:opacity-50">
              Cancel
            </button>
            <button onClick={handleRejectConfirm} disabled={rejecting}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-bold disabled:opacity-50">
              {rejecting ? <Loader className="w-3 h-3 animate-spin" /> : <XCircle className="w-3 h-3" />}
              Confirm Reject All
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// ══════════════════════════════════════════════════════════════════════════════
// SUBMITTED DOCS SECTION — inline in each pending-rejoin card
// Shows AFTER approval when employee uploads signed KYE / BGV / screenshot
// ══════════════════════════════════════════════════════════════════════════════
const SubmittedDocsSection = ({ empDbId, docsSubmitted, showToast }) => {
  const [docs,      setDocs]      = useState([]);
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState("");
  const [lightbox,  setLightbox]  = useState(null);
  const [accepting, setAccepting] = useState(false);
  const [rejecting, setRejecting] = useState(false);
  const [expanded,  setExpanded]  = useState(true);
  const hasFetched = useRef(false);

  const fetchDocs = useCallback(async () => {
    if (!empDbId) return;
    setLoading(true); setError("");
    try {
      const res  = await fetch(`${BASE_URL}/employee-docs/submissions/${empDbId}`);
      const data = await res.json();
      if (data.success) setDocs(data.data || []);
      else setError(data.message || "Failed to load documents");
    } catch { setError("Cannot connect to server"); }
    finally { setLoading(false); }
  }, [empDbId]);

  useEffect(() => {
    if (docsSubmitted && !hasFetched.current) {
      hasFetched.current = true;
      fetchDocs();
    }
  }, [docsSubmitted, fetchDocs]);

  const handleAcceptAll = async () => {
    const pending = docs.filter(d => !d.reviewed && d.status !== "accepted" && d.status !== "rejected");
    if (!pending.length) return;
    setAccepting(true);
    try {
      await Promise.all(
        pending.map(doc =>
          fetch(`${BASE_URL}/employee-docs/mark-reviewed/${doc.id}`, {
            method: "POST", headers: { "Content-Type": "application/json" },
          })
        )
      );
      setDocs(p => p.map(d => pending.find(pd => pd.id === d.id) ? { ...d, reviewed: true, status: "accepted" } : d));
      showToast?.(`All ${pending.length} document${pending.length > 1 ? "s" : ""} accepted`, "success");
    } catch { showToast?.("Failed to accept all documents", "error"); }
    finally { setAccepting(false); }
  };

  const handleRejectAll = async (reason) => {
    const pending = docs.filter(d => !d.reviewed && d.status !== "accepted" && d.status !== "rejected");
    if (!pending.length) return;
    setRejecting(true);
    try {
      await Promise.all(
        pending.map(doc =>
          fetch(`${BASE_URL}/employee-docs/reject-doc/${doc.id}`, {
            method: "POST", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ rejection_reason: reason }),
          })
        )
      );
      setDocs(p => p.map(d => pending.find(pd => pd.id === d.id) ? { ...d, status: "rejected", rejection_reason: reason } : d));
      showToast?.(`All ${pending.length} document${pending.length > 1 ? "s" : ""} rejected`, "success");
    } catch { showToast?.("Failed to reject all documents", "error"); }
    finally { setRejecting(false); }
  };

  const pending = docs.filter(d => !d.reviewed && d.status !== "rejected" && d.status !== "accepted").length;
  const allDone = docs.length > 0 && pending === 0;

  if (!docsSubmitted) {
    return (
      <div className="mx-5 mb-4 rounded-xl border border-dashed border-indigo-200 bg-indigo-50/40 px-4 py-3 flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-white border border-indigo-200 flex items-center justify-center flex-shrink-0">
          <Upload className="w-4 h-4 text-indigo-400" />
        </div>
        <div>
          <p className="text-xs font-semibold text-indigo-600">Awaiting Document Upload</p>
          <p className="text-[11px] text-indigo-400 mt-0.5">
            Employee will upload signed KYE, BGV form &amp; email screenshot after receiving approval email
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      {lightbox !== null && (
        <DocLightbox docs={docs} startIndex={lightbox} onClose={() => setLightbox(null)} />
      )}

      <div className="mx-5 mb-4">
        {/* Toggle header */}
        <button onClick={() => setExpanded(p => !p)}
          className="w-full flex items-center justify-between px-4 py-2.5 rounded-xl border transition-all mb-2"
          style={{
            background:   allDone ? "linear-gradient(90deg,#f0fdf4,#dcfce7)" : pending > 0 ? "linear-gradient(90deg,#fefce8,#fef9c3)" : "#f8fafc",
            borderColor:  allDone ? "#bbf7d0" : pending > 0 ? "#fde68a" : "#e2e8f0",
          }}>
          <div className="flex items-center gap-2.5">
            <div className="relative">
              <div className="w-2 h-2 rounded-full" style={{ background: allDone ? "#22c55e" : "#f59e0b" }} />
              {pending > 0 && (
                <div className="absolute inset-0 rounded-full animate-ping" style={{ background: "#f59e0b", opacity: 0.4 }} />
              )}
            </div>
            <span className="text-xs font-bold" style={{ color: allDone ? "#14532d" : "#92400e" }}>
              {allDone ? "All Documents Reviewed" : `${pending} Document${pending > 1 ? "s" : ""} Pending Review`}
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold"
              style={{ background: allDone ? "#bbf7d0" : "#fde68a", color: allDone ? "#14532d" : "#78350f" }}>
              {docs.length} submitted
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={(e) => { e.stopPropagation(); fetchDocs(); }} className="p-1 rounded-md hover:bg-white/60 transition-all">
              <RefreshCw className="w-3.5 h-3.5 text-gray-500" />
            </button>
            {expanded ? <ChevronUp className="w-4 h-4 text-gray-500" /> : <ChevronDown className="w-4 h-4 text-gray-500" />}
          </div>
        </button>

        {expanded && (
          <div className="space-y-2">
            {loading && (
              <div className="flex items-center justify-center py-6">
                <Loader className="w-5 h-5 text-indigo-500 animate-spin" />
                <span className="text-xs text-gray-500 ml-2">Loading documents…</span>
              </div>
            )}
            {error && !loading && (
              <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                <AlertCircle className="w-4 h-4 text-red-500" />
                <p className="text-xs text-red-700 flex-1">{error}</p>
                <button onClick={fetchDocs} className="text-xs text-red-600 underline font-medium">Retry</button>
              </div>
            )}
            {!loading && !error && docs.length > 0 && (
              <BatchActionBar
                docs={docs}
                onAcceptAll={handleAcceptAll}
                onRejectAll={handleRejectAll}
                accepting={accepting}
                rejecting={rejecting}
              />
            )}
            {!loading && !error && docs.map((doc) => (
              <DocViewRow key={doc.id} doc={doc} onView={(d) => setLightbox(docs.indexOf(d))} />
            ))}
            {!loading && !error && docs.length > 0 && allDone && (
              <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-green-50 border border-green-200">
                <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                <p className="text-xs font-semibold text-green-700">
                  All {docs.length} document{docs.length > 1 ? "s" : ""} reviewed — rejoining complete
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
};

// ══════════════════════════════════════════════════════════════════════════════
// REJOIN DOC REVIEW CARD — for approved rejoined employees with pending docs
// ══════════════════════════════════════════════════════════════════════════════
const RejoinDocReviewCard = ({ emp, onAllReviewed, showToast }) => {
  const [docs,      setDocs]      = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState("");
  const [lightbox,  setLightbox]  = useState(null);
  const [accepting, setAccepting] = useState(false);
  const [rejecting, setRejecting] = useState(false);
  const [expanded,  setExpanded]  = useState(true);

  const fetchDocs = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const res  = await fetch(`${BASE_URL}/employee-docs/submissions/${emp.id}`);
      const data = await res.json();
      if (data.success) setDocs(data.data || []);
      else setError(data.message || "Failed to load");
    } catch { setError("Cannot connect to server"); }
    finally { setLoading(false); }
  }, [emp.id]);

  useEffect(() => { fetchDocs(); }, [fetchDocs]);

  const handleAcceptAll = async () => {
    const pending = docs.filter(d => !d.reviewed && d.status !== "accepted" && d.status !== "rejected");
    if (!pending.length) return;
    setAccepting(true);
    try {
      await Promise.all(
        pending.map(doc =>
          fetch(`${BASE_URL}/employee-docs/mark-reviewed/${doc.id}`, {
            method: "POST", headers: { "Content-Type": "application/json" },
          })
        )
      );
      const updated = docs.map(d =>
        pending.find(pd => pd.id === d.id) ? { ...d, reviewed: true, status: "accepted" } : d
      );
      setDocs(updated);
      showToast?.(`All ${pending.length} document${pending.length > 1 ? "s" : ""} accepted`, "success");
      const allNowDone = updated.every(d => d.reviewed || d.status === "accepted" || d.status === "rejected");
      if (allNowDone) setTimeout(() => onAllReviewed?.(emp.id), 800);
    } catch { showToast?.("Failed to accept all documents", "error"); }
    finally { setAccepting(false); }
  };

  const handleRejectAll = async (reason) => {
    const pending = docs.filter(d => !d.reviewed && d.status !== "accepted" && d.status !== "rejected");
    if (!pending.length) return;
    setRejecting(true);
    try {
      await Promise.all(
        pending.map(doc =>
          fetch(`${BASE_URL}/employee-docs/reject-doc/${doc.id}`, {
            method: "POST", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ rejection_reason: reason }),
          })
        )
      );
      const updated = docs.map(d =>
        pending.find(pd => pd.id === d.id) ? { ...d, status: "rejected", rejection_reason: reason } : d
      );
      setDocs(updated);
      showToast?.(`All ${pending.length} document${pending.length > 1 ? "s" : ""} rejected`, "success");
      const allNowDone = updated.every(d => d.reviewed || d.status === "accepted" || d.status === "rejected");
      if (allNowDone) setTimeout(() => onAllReviewed?.(emp.id), 800);
    } catch { showToast?.("Failed to reject all documents", "error"); }
    finally { setRejecting(false); }
  };

  const pending = docs.filter(d => !d.reviewed && d.status !== "accepted" && d.status !== "rejected").length;
  const allDone = docs.length > 0 && pending === 0;

  return (
    <>
      {lightbox !== null && (
        <DocLightbox docs={docs} startIndex={lightbox} onClose={() => setLightbox(null)} />
      )}

      <div className={`bg-white rounded-2xl border shadow-sm hover:shadow-md transition-all overflow-hidden ${
        allDone ? "border-green-200" : "border-amber-200"
      }`}>
        <div className="h-0.5 w-full" style={{
          background: allDone
            ? "linear-gradient(90deg,#22c55e,#16a34a)"
            : "linear-gradient(90deg,#f59e0b,#fbbf24,#fcd34d)",
        }} />

        {/* Header */}
        <div className="px-5 pt-4 pb-3 border-b border-gray-100">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3.5">
              <div className="relative">
                <div className="w-12 h-12 rounded-full flex items-center justify-center text-indigo-700 font-bold text-base flex-shrink-0"
                  style={{ background: "linear-gradient(135deg,#c7d2fe,#a5b4fc)" }}>
                  {emp.first_name?.[0] || "?"}{emp.last_name?.[0] || ""}
                </div>
                <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full border-2 border-white flex items-center justify-center"
                  style={{ background: allDone ? "#22c55e" : "#f59e0b" }}>
                  {allDone
                    ? <CheckCheck className="w-2.5 h-2.5 text-white" style={{ strokeWidth: 3 }} />
                    : <Bell className="w-2.5 h-2.5 text-white" style={{ strokeWidth: 3 }} />}
                </div>
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-sm font-bold text-gray-900">{emp.first_name} {emp.last_name}</h3>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border"
                    style={{ background: "#ede9fe", color: "#6d28d9", borderColor: "#c4b5fd" }}>
                    <History className="w-2.5 h-2.5" /> Rejoined
                  </span>
                  {!allDone && pending > 0 && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border"
                      style={{ background: "#fffbeb", color: "#92400e", borderColor: "#fcd34d" }}>
                      <Bell className="w-2.5 h-2.5" /> {pending} Doc{pending > 1 ? "s" : ""} Pending
                    </span>
                  )}
                  {allDone && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border"
                      style={{ background: "#f0fdf4", color: "#15803d", borderColor: "#bbf7d0" }}>
                      <CheckCheck className="w-2.5 h-2.5" /> All Reviewed
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1.5 text-xs text-gray-500 mt-0.5 flex-wrap">
                  <Briefcase className="w-3 h-3" />
                  <span>{emp.position || "Not specified"}</span>
                  <span className="text-gray-300">•</span>
                  <Building2 className="w-3 h-3" />
                  <span>{emp.department || "Not specified"}</span>
                  {emp.employee_id && (
                    <><span className="text-gray-300">•</span>
                    <span className="font-mono text-[10px] font-semibold text-indigo-600">{emp.employee_id}</span></>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button onClick={fetchDocs}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-gray-200 bg-white text-gray-500 hover:border-indigo-300 hover:text-indigo-600 text-xs">
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
              <button onClick={() => setExpanded(p => !p)}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-gray-200 bg-white text-gray-500 text-xs">
                {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Info row */}
        <div className="px-5 py-3 border-b border-gray-50">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
            {[
              { icon: <Mail className="w-3.5 h-3.5 text-indigo-500" />,     label: "Email",          value: emp.email },
              { icon: <Phone className="w-3.5 h-3.5 text-indigo-500" />,    label: "Phone",          value: emp.phone },
              { icon: <Calendar className="w-3.5 h-3.5 text-indigo-500" />, label: "Docs Submitted", value: fmtDateShort(emp.docs_submitted_at) },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-indigo-50/50 border border-indigo-100">
                <div className="w-6 h-6 bg-indigo-100 rounded-md flex items-center justify-center flex-shrink-0">{item.icon}</div>
                <div className="min-w-0">
                  <p className="text-[9px] font-medium text-indigo-400 uppercase tracking-wide leading-none mb-0.5">{item.label}</p>
                  <p className="text-xs font-semibold text-gray-800 truncate">{item.value || "—"}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Documents */}
        {expanded && (
          <div className="px-5 py-4">
            {loading && (
              <div className="flex items-center justify-center py-8">
                <Loader className="w-5 h-5 text-indigo-500 animate-spin" />
                <span className="text-xs text-gray-500 ml-2">Loading submitted documents…</span>
              </div>
            )}
            {error && !loading && (
              <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
                <AlertCircle className="w-4 h-4 text-red-500" />
                <p className="text-xs text-red-700 flex-1">{error}</p>
                <button onClick={fetchDocs} className="text-xs text-red-600 underline font-medium">Retry</button>
              </div>
            )}
            {!loading && !error && docs.length === 0 && (
              <div className="text-center py-6 text-gray-400 text-xs">No documents found</div>
            )}
            {!loading && !error && docs.length > 0 && (
              <div className="space-y-2">
                <BatchActionBar
                  docs={docs}
                  onAcceptAll={handleAcceptAll}
                  onRejectAll={handleRejectAll}
                  accepting={accepting}
                  rejecting={rejecting}
                />
                {docs.map((doc) => (
                  <DocViewRow key={doc.id} doc={doc} onView={(d) => setLightbox(docs.indexOf(d))} />
                ))}
                {allDone && (
                  <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-green-50 border border-green-200 mt-1">
                    <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                      <CheckCheck className="w-4 h-4 text-green-600" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-green-800">All documents reviewed</p>
                      <p className="text-[10px] text-green-600 mt-0.5">Rejoin onboarding is complete for this employee</p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
};

// ══════════════════════════════════════════════════════════════════════════════
// REJOIN DOCS PENDING REVIEW SECTION — top of page
// Shows approved rejoined employees who uploaded docs pending HR review
// ══════════════════════════════════════════════════════════════════════════════
const RejoinDocsPendingReviewSection = ({ showToast }) => {
  const [employees, setEmployees] = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState("");
  const [collapsed, setCollapsed] = useState(false);

  const fetchPendingDocs = useCallback(async () => {
    setLoading(true); setError("");
    try {
      // Re-use the same /employee-docs/pending endpoint — it returns all employees
      // with pending docs regardless of how they were onboarded.
      // We filter client-side to only show employees whose previous_employee_id is set
      // (meaning they are rejoined employees), OR we can rely on the endpoint as-is.
      // The endpoint already returns only employees with docs_submitted=true and unreviewed docs.
      const res  = await fetch(`${BASE_URL}/employee-docs/pending`);
      const data = await res.json();
      if (data.success) {
        // Filter to only employees who went through rejoin (have previous_employee_id or active status after rejoin)
        // Since the endpoint doesn't return previous_employee_id, we show all pending doc employees here.
        // HR can distinguish them by the "Rejoined" badge on each card.
        setEmployees(data.data || []);
      } else {
        setError(data.message || "Failed to load");
      }
    } catch { setError("Cannot connect to server"); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchPendingDocs(); }, [fetchPendingDocs]);

  const handleAllReviewed = (empId) => setEmployees(prev => prev.filter(e => e.id !== empId));

  const totalUnreviewed = employees.reduce((sum, e) => sum + (parseInt(e.unreviewed_count) || 0), 0);

  if (!loading && !error && employees.length === 0) return null;

  return (
    <div className="mb-8">
      {/* Section header */}
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center relative"
            style={{ background: "linear-gradient(135deg,#4f46e5,#7c3aed)" }}>
            <FolderOpen className="w-5 h-5 text-white" />
            {totalUnreviewed > 0 && (
              <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center border-2 border-white">
                <span className="text-[9px] font-bold text-white">{totalUnreviewed > 9 ? "9+" : totalUnreviewed}</span>
              </div>
            )}
          </div>
          <div>
          
            
          </div>
        </div>
      
      </div>

      {!collapsed && (
        <>
        

          {loading && (
            <div className="flex items-center justify-center py-12 bg-white rounded-2xl border border-indigo-100">
              <Loader className="w-6 h-6 text-indigo-500 animate-spin" />
              <span className="text-sm text-gray-500 ml-3">Loading submitted documents…</span>
            </div>
          )}
          {error && !loading && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
              <p className="text-sm text-red-700 flex-1">{error}</p>
              <button onClick={fetchPendingDocs}
                className="px-3 py-1.5 bg-white border border-red-300 hover:bg-red-50 rounded-lg text-xs font-semibold text-red-600">
                Retry
              </button>
            </div>
          )}
          {!loading && !error && (
            <div className="space-y-4">
              {employees.map(emp => (
                <RejoinDocReviewCard
                  key={emp.id}
                  emp={emp}
                  onAllReviewed={handleAllReviewed}
                  showToast={showToast}
                />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};

// ══════════════════════════════════════════════════════════════════════════════
// FULL DETAIL MODAL
// ══════════════════════════════════════════════════════════════════════════════
const FullDetailModal = ({ sub, onClose }) => {
  const [lightbox, setLightbox] = useState(null);

  const docDefs = getDocDefs(sub.department);

  const uploadedDocs = docDefs.map(def => {
    const found = Array.isArray(sub.documents)
      ? sub.documents.find(d => d.type === def.type || d.document_type === def.type)
      : null;
    return { ...def, path: found?.path || found?.file_path || null };
  });
  const availableDocs = uploadedDocs.filter(d => d.path);
  const openLightbox  = (type) => {
    const i = availableDocs.findIndex(d => d.type === type);
    if (i >= 0) setLightbox({ docs: availableDocs, startIndex: i });
  };

  const SectionTitle = ({ num, title, icon }) => (
    <div className="flex items-center gap-3 mb-4 pb-3 border-b border-indigo-100">
      <div className="w-7 h-7 rounded-lg flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
        style={{ background: "linear-gradient(135deg,#4f46e5,#7c3aed)" }}>{num}</div>
      <div className="flex items-center gap-2">
        <span className="text-indigo-600">{icon}</span>
        <h4 className="font-semibold text-gray-900 text-sm">{title}</h4>
      </div>
    </div>
  );

  const Field = ({ label, value, span = 1 }) => (
    <div className={span === 2 ? "col-span-2" : ""}>
      <p className="text-xs font-medium text-gray-500 mb-1">{label}</p>
      <p className="text-sm text-gray-900 bg-white border border-gray-200 rounded-lg px-3 py-2 min-h-[36px] break-words">
        {value || <span className="text-gray-400 italic text-xs">Not provided</span>}
      </p>
    </div>
  );

  const name = `${sub.first_name || ""} ${sub.last_name || ""}`.trim();
  const isTelecom = isTelecomDept(sub.department);

  return (
    <>
      {lightbox && (
        <Lightbox docs={lightbox.docs} startIndex={lightbox.startIndex} onClose={() => setLightbox(null)} />
      )}
      <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 overflow-y-auto"
        style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)" }}>
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-7xl my-4 flex flex-col" style={{ maxHeight: "95vh" }}>
          <div className="flex items-center justify-between px-6 py-4 flex-shrink-0"
            style={{ background: "linear-gradient(90deg,#312e81 0%,#4f46e5 100%)", borderRadius: "16px 16px 0 0" }}>
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-xl flex items-center justify-center font-bold text-white text-lg flex-shrink-0 relative"
                style={{ background: "linear-gradient(135deg,#4f46e5,#7c3aed)" }}>
                {(sub.first_name?.[0] || "N").toUpperCase()}{(sub.last_name?.[0] || "A").toUpperCase()}
                <div className="absolute -top-1 -right-1 w-5 h-5 bg-amber-400 rounded-full flex items-center justify-center border-2 border-white">
                  <History className="w-2.5 h-2.5 text-white" style={{ strokeWidth: 3 }} />
                </div>
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h2 className="text-xl font-bold text-white">{name}</h2>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold"
                    style={{ background: "rgba(251,191,36,0.25)", color: "#fbbf24", border: "1px solid rgba(251,191,36,0.4)" }}>
                    RETURNING EMPLOYEE
                  </span>
                  {isTelecom && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold"
                      style={{ background: "rgba(99,102,241,0.25)", color: "#a5b4fc", border: "1px solid rgba(99,102,241,0.4)" }}>
                      TELECOM
                    </span>
                  )}
                </div>
                <p className="text-indigo-200 text-sm">
                  {sub.position || sub.designation || "Position not specified"} &bull; {sub.department || "Department not specified"}
                </p>
                {sub.employee_id && (
                  <p className="text-indigo-300 text-xs mt-0.5">Previous ID: {sub.employee_id}</p>
                )}
              </div>
            </div>
            <button onClick={onClose}
              className="px-4 py-2 bg-white rounded-lg text-sm font-semibold text-indigo-900 hover:bg-indigo-50">
              Close
            </button>
          </div>

          <div className="px-6 py-3 flex items-center gap-3 border-b border-indigo-100"
            style={{ background: "linear-gradient(90deg,#ede9fe,#e0e7ff)" }}>
            <div className="w-7 h-7 bg-indigo-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <History className="w-4 h-4 text-indigo-600" />
            </div>
            <p className="text-xs text-indigo-700">
              <span className="font-bold">Rejoin Request</span> — Previously inactive employee has submitted updated information.
              Approving will assign a <strong>new Employee ID</strong> and <strong>replace old data with submitted data</strong>.
              Declining will <strong>restore original data</strong> and return employee to Inactive.
            </p>
          </div>

          <div className="flex-1 overflow-y-auto p-6 bg-gray-50">
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              <div className="space-y-5">
                <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
                  <SectionTitle num="1" title="Personal Information" icon={<User className="w-4 h-4" />} />
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="First Name"                value={sub.first_name} />
                    <Field label="Last Name"                 value={sub.last_name} />
                    <Field label="Father / Husband Name"     value={sub.father_husband_name} />
                    <Field label="Date of Birth"             value={fmt(sub.date_of_birth)} />
                    <Field label="Gender"                    value={sub.gender} />
                    <Field label="Blood Group"               value={sub.blood_group} />
                    <Field label="Marital Status"            value={sub.marital_status} />
                    <Field label="Educational Qualification" value={sub.educational_qualification} />
                    <Field label="PAN Number"                value={sub.pan_number} />
                    <Field label="Aadhaar Number"            value={sub.aadhar_number} />
                  </div>
                </div>
                <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
                  <SectionTitle num="2" title="Contact Information" icon={<Mail className="w-4 h-4" />} />
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Email Address"   value={sub.email}     span={2} />
                    <Field label="Primary Phone"   value={sub.phone} />
                    <Field label="Alternate Phone" value={sub.alt_phone} />
                  </div>
                </div>
                <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
                  <SectionTitle num="3" title="Emergency Contact" icon={<Phone className="w-4 h-4" />} />
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Contact Name" value={sub.emergency_contact_name}      span={2} />
                    <Field label="Contact No"   value={sub.emergency_contact_no} />
                    <Field label="Relation"     value={sub.emergency_contact_relation} />
                    <Field label="Address"      value={sub.emergency_contact_address}   span={2} />
                  </div>
                </div>
                <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
                  <SectionTitle num="4" title="Address Details" icon={<Building2 className="w-4 h-4" />} />
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Permanent Address" value={sub.permanent_address} span={2} />
                    <Field label="Local Address"     value={sub.local_same_as_permanent ? "Same as permanent" : sub.local_address} span={2} />
                  </div>
                </div>
              </div>

              <div className="space-y-5">
                <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
                  <SectionTitle num="5" title="Employment Details" icon={<Banknote className="w-4 h-4" />} />
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Department"        value={sub.department} />
                    <Field label="Designation"       value={sub.position || sub.designation} />
                    <Field label="Employment Type"   value={sub.employment_type} />
                    <Field label="Joining Date"      value={fmt(sub.joining_date)} />
                    <Field label="Reporting Manager" value={sub.reporting_manager} />
                    <Field label="Bank Name"         value={sub.bank_name} />
                    <Field label="Account Number"    value={sub.account_number} />
                    <Field label="IFSC Code"         value={sub.ifsc_code} />
                    <Field label="Account Holder"    value={sub.account_holder_name} />
                  </div>
                </div>

                <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
                  <SectionTitle num="6" title="Uploaded Documents" icon={<Shield className="w-4 h-4" />} />
                  {isTelecom && (
                    <div className="flex items-center gap-2 mb-3 p-2.5 bg-indigo-50 border border-indigo-200 rounded-lg">
                      <Radio className="w-3.5 h-3.5 text-indigo-500 flex-shrink-0" />
                      <p className="text-xs text-indigo-700 font-medium">
                        FARM-ToCli Certificate is required for this Telecom employee.
                      </p>
                    </div>
                  )}
                  {availableDocs.length === 0 ? (
                    <p className="text-sm text-gray-400 italic text-center py-4">No documents uploaded</p>
                  ) : (
                    <div className="grid grid-cols-2 gap-3">
                      {uploadedDocs.map((doc) => {
                        const url = fullUrl(doc.path);
                        const ft  = getFileType(doc.path, doc.mime_type);
                        const isFarmToCli = doc.type === "farmToCli";
                        return (
                          <div key={doc.type}
                            className={`rounded-xl border overflow-hidden transition-all ${
                              url
                                ? "border-indigo-200 bg-white hover:border-indigo-400 hover:shadow-md cursor-pointer"
                                : isFarmToCli && isTelecom
                                ? "border-red-300 bg-red-50"
                                : "border-gray-200 bg-gray-50"
                            }`}
                            onClick={() => url && openLightbox(doc.type)}>
                            <div className="relative h-24 bg-gray-100 flex items-center justify-center overflow-hidden">
                              {ft === "image" && url ? (
                                <img src={url} alt={doc.label} className="w-full h-full object-cover"
                                  onError={(e) => { e.target.style.display = "none"; }} />
                              ) : ft === "pdf" ? (
                                <div className="flex flex-col items-center gap-1 w-full h-full bg-red-50 justify-center">
                                  <FileText className="w-7 h-7 text-red-400" />
                                  <span className="text-xs font-bold text-red-500">PDF</span>
                                </div>
                              ) : url ? (
                                <div className="flex flex-col items-center gap-1 w-full h-full bg-indigo-50 justify-center">
                                  <FileText className="w-7 h-7 text-indigo-400" />
                                  <span className="text-xs font-bold text-indigo-500">FILE</span>
                                </div>
                              ) : (
                                <div className="flex items-center justify-center w-full h-full bg-gray-100">
                                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                                    isFarmToCli && isTelecom ? "bg-red-100 text-red-400" : "bg-gray-200 text-gray-400"
                                  }`}>{doc.icon}</div>
                                </div>
                              )}
                              {url && (
                                <div className="absolute inset-0 bg-indigo-900/60 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
                                  <div className="flex items-center gap-1.5 text-white text-xs font-semibold">
                                    <ZoomIn className="w-4 h-4" /> View
                                  </div>
                                </div>
                              )}
                              <div className={`absolute top-1.5 right-1.5 px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                                url ? "bg-green-500 text-white" : "bg-gray-300 text-gray-600"
                              }`}>{url ? "✓" : "—"}</div>
                              {isFarmToCli && (
                                <div className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded text-[9px] font-bold bg-indigo-600 text-white">
                                  Telecom
                                </div>
                              )}
                            </div>
                            <div className="px-3 py-2 border-t border-gray-100">
                              <p className="text-xs font-semibold text-gray-800 truncate">{doc.label}</p>
                              <p className={`text-[10px] mt-0.5 ${
                                url
                                  ? "text-green-600"
                                  : isFarmToCli && isTelecom
                                  ? "text-red-500 font-semibold"
                                  : "text-gray-400"
                              }`}>
                                {url ? "Click to view" : isFarmToCli && isTelecom ? "⚠ Required — not uploaded" : "Not uploaded"}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                  {availableDocs.length > 0 && (
                    <button onClick={() => setLightbox({ docs: availableDocs, startIndex: 0 })}
                      className="w-full mt-3 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200">
                      <Eye className="w-3.5 h-3.5" />
                      View All Documents ({availableDocs.length} uploaded)
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

// ══════════════════════════════════════════════════════════════════════════════
// REJECT REASON MODAL
// ══════════════════════════════════════════════════════════════════════════════
const RejectModal = ({ submission, onConfirm, onCancel, isLoading }) => {
  const [reason, setReason] = useState("");
  const name = `${submission.first_name || ""} ${submission.last_name || ""}`.trim();

  return (
    <div className="fixed inset-0 z-[9999] backdrop-blur-sm bg-black/40 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        <div className="bg-red-600 px-6 py-4">
          <div className="flex items-center gap-3">
            <XCircle className="w-6 h-6 text-white" />
            <div>
              <h3 className="text-white font-bold text-base">Decline Rejoin Request</h3>
              <p className="text-red-200 text-xs mt-0.5">{name}</p>
            </div>
          </div>
        </div>
        <div className="px-6 py-5">
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-4">
            <p className="text-xs text-amber-700">
              <strong>Note:</strong> Declining will restore this employee's data to its pre-submission state
              and return their status to <strong>Inactive</strong>. HR can send a new rejoin invite later.
            </p>
          </div>
          <p className="text-sm text-gray-600 mb-4">The employee will be notified by email.</p>
          <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
            Reason for declining <span className="text-gray-400 font-normal normal-case">(optional)</span>
          </label>
          <textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={3}
            placeholder="e.g. Incomplete documents, information mismatch…"
            className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-red-400 focus:ring-2 focus:ring-red-100 outline-none resize-none text-sm text-gray-700" />
        </div>
        <div className="px-6 pb-5 flex gap-3 justify-end">
          <button onClick={onCancel} disabled={isLoading}
            className="px-5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-sm font-medium disabled:opacity-50">
            Cancel
          </button>
          <button onClick={() => onConfirm(reason.trim() || "Rejoin request declined by HR.")}
            disabled={isLoading}
            className="flex items-center gap-2 px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-sm font-semibold disabled:opacity-60">
            {isLoading ? <><Loader className="w-4 h-4 animate-spin" /> Declining…</> : "Confirm Decline"}
          </button>
        </div>
      </div>
    </div>
  );
};

// ══════════════════════════════════════════════════════════════════════════════
// SUBMISSION CARD
// ══════════════════════════════════════════════════════════════════════════════
const SubmissionCard = ({ sub, onApprove, onReject, onDelete, isProcessing, isDeleting, showToast }) => {
  const [expanded,    setExpanded]    = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  const name        = `${sub.first_name || ""} ${sub.last_name || ""}`.trim();
  const submittedAt = sub.rejoin_requested_at || sub.updated_at
    ? new Date(sub.rejoin_requested_at || sub.updated_at).toLocaleString("en-IN", {
        day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
      })
    : "—";
  const isTelecom    = isTelecomDept(sub.department);
  const docsSubmitted = !!(sub.docs_submitted);

  return (
    <>
      {showDetails && <FullDetailModal sub={sub} onClose={() => setShowDetails(false)} />}

      <div className={`bg-white rounded-2xl border shadow-sm overflow-hidden hover:shadow-md transition-all ${
        docsSubmitted ? "border-amber-200" : "border-indigo-200"
      }`}>
        <div className="h-0.5 w-full" style={{
          background: docsSubmitted
            ? "linear-gradient(90deg,#f59e0b,#fbbf24,#fcd34d)"
            : "linear-gradient(90deg,#4f46e5,#7c3aed,#a78bfa)",
        }} />

        {/* Card header */}
        <div className="flex items-center gap-4 p-5 bg-gradient-to-r from-indigo-50 to-violet-50">
          <div className="w-12 h-12 rounded-full flex items-center justify-center text-indigo-700 font-bold text-base flex-shrink-0 relative"
            style={{ background: "linear-gradient(135deg,#c7d2fe,#a5b4fc)" }}>
            {sub.first_name?.[0] || "?"}{sub.last_name?.[0] || ""}
            <div className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-amber-400 rounded-full flex items-center justify-center border-2 border-white">
              <History className="w-2 h-2 text-white" style={{ strokeWidth: 3 }} />
            </div>
          </div>

          <div className="flex-1 min-w-0">
            <p className="font-bold text-gray-900 text-base truncate">{name}</p>
            <div className="flex items-center gap-3 mt-0.5 flex-wrap">
              <span className="text-xs text-gray-500 flex items-center gap-1">
                <Mail className="w-3 h-3" /> {sub.email || "—"}
              </span>
              <span className="text-xs text-gray-500 flex items-center gap-1">
                <Phone className="w-3 h-3" /> {sub.phone || "—"}
              </span>
            </div>
            <div className="flex items-center gap-2 mt-1.5 flex-wrap">
              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-indigo-700 bg-indigo-100 px-2 py-0.5 rounded-full border border-indigo-200">
                <History className="w-2.5 h-2.5" /> Pending Rejoin
              </span>
              {isTelecom && (
                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-violet-700 bg-violet-100 px-2 py-0.5 rounded-full border border-violet-200">
                  <Radio className="w-2.5 h-2.5" /> Telecom — FARM-ToCli Required
                </span>
              )}
              {docsSubmitted && (
                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full border border-amber-200">
                  <Upload className="w-2.5 h-2.5" /> Docs Uploaded
                </span>
              )}
              <span className="text-[10px] text-gray-400 flex items-center gap-1">
                <Clock className="w-2.5 h-2.5" /> Requested: {submittedAt}
              </span>
              {sub.employee_id && (
                <span className="text-[10px] text-indigo-500 font-semibold bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-100">
                  Prev ID: {sub.employee_id}
                </span>
              )}
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2 flex-shrink-0 flex-wrap justify-end">
            <button onClick={() => setShowDetails(true)}
              className="flex items-center gap-1.5 px-3 py-2 bg-white border border-gray-200 hover:bg-indigo-50 hover:border-indigo-300 rounded-lg text-xs font-medium text-gray-600 hover:text-indigo-700">
              <Eye className="w-3.5 h-3.5" /> Full Details
            </button>
            <button onClick={() => setExpanded((p) => !p)}
              className="flex items-center gap-1 px-2.5 py-2 bg-white border border-gray-200 hover:bg-gray-50 rounded-lg text-xs font-medium text-gray-500">
              {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
            <button onClick={() => onDelete(sub)} disabled={isProcessing || isDeleting}
              title="Cancel rejoin request and restore employee to Inactive"
              className="flex items-center gap-1.5 px-3 py-2 bg-red-50 hover:bg-red-100 border border-red-200 hover:border-red-400 text-red-600 rounded-lg text-xs font-semibold disabled:opacity-40 disabled:cursor-not-allowed transition-all">
              {isDeleting
                ? <><Loader className="w-3.5 h-3.5 animate-spin" /> Deleting…</>
                : <><Trash2 className="w-3.5 h-3.5" /> Delete</>
              }
            </button>
            <button onClick={() => onReject(sub)} disabled={isProcessing || isDeleting}
              className="flex items-center gap-1.5 px-3 py-2 bg-orange-50 hover:bg-orange-100 border border-orange-200 text-orange-700 rounded-lg text-xs font-semibold disabled:opacity-40 disabled:cursor-not-allowed">
              <XCircle className="w-3.5 h-3.5" /> Decline
            </button>
            <button onClick={() => onApprove(sub)} disabled={isProcessing || isDeleting}
              className="flex items-center gap-2 px-4 py-2 text-white rounded-lg text-xs font-bold disabled:opacity-40 disabled:cursor-not-allowed shadow-sm"
              style={{ background: isProcessing ? "#5b21b6" : "linear-gradient(135deg,#4f46e5,#7c3aed)" }}>
              {isProcessing
                ? <><Loader className="w-3.5 h-3.5 animate-spin" /> Approving…</>
                : <><CheckCircle className="w-3.5 h-3.5" /> Approve &amp; Assign New ID</>
              }
            </button>
          </div>
        </div>

        {/* Quick summary row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 px-5 py-3 bg-white border-t border-indigo-50">
          {[
            { icon: <Building2 className="w-3.5 h-3.5 text-indigo-400" />, label: "Department", value: sub.department },
            { icon: <Banknote className="w-3.5 h-3.5 text-indigo-400" />,  label: "Designation", value: sub.position || sub.designation },
            { icon: <Calendar className="w-3.5 h-3.5 text-indigo-400" />,  label: "Joining Date", value: fmt(sub.joining_date) },
            { icon: <User className="w-3.5 h-3.5 text-indigo-400" />,      label: "Employment",  value: sub.employment_type },
          ].map((item, i) => (
            <div key={i} className="flex items-center gap-2">
              {item.icon}
              <div className="min-w-0">
                <p className="text-[9px] text-gray-400 uppercase tracking-wide">{item.label}</p>
                <p className="text-xs font-semibold text-gray-700 truncate">{item.value || "—"}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Expanded panel */}
        {expanded && (
          <div className="border-t border-indigo-100 p-5 bg-indigo-50/30">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider pb-1.5 border-b border-gray-200 flex items-center gap-2">
                  <User className="w-3.5 h-3.5" /> Personal
                </h4>
                <InfoField label="Full Name"           value={name} />
                <InfoField label="Father/Husband Name" value={sub.father_husband_name} />
                <InfoField label="Date of Birth"       value={fmt(sub.date_of_birth)} />
                <InfoField label="Blood Group"         value={sub.blood_group} />
                <InfoField label="PAN Number"          value={sub.pan_number} />
                <InfoField label="Aadhaar Number"      value={sub.aadhar_number} />
              </div>
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider pb-1.5 border-b border-gray-200 flex items-center gap-2">
                  <Building2 className="w-3.5 h-3.5" /> Employment
                </h4>
                <InfoField label="Department"        value={sub.department} />
                <InfoField label="Designation"       value={sub.position || sub.designation} />
                <InfoField label="Employment Type"   value={sub.employment_type} />
                <InfoField label="Joining Date"      value={fmt(sub.joining_date)} />
                <InfoField label="Reporting Manager" value={sub.reporting_manager} />
              </div>
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider pb-1.5 border-b border-gray-200 flex items-center gap-2">
                  <Banknote className="w-3.5 h-3.5" /> Bank Details
                </h4>
                <InfoField label="Bank Name"      value={sub.bank_name} />
                <InfoField label="Account Number" value={sub.account_number} />
                <InfoField label="IFSC Code"      value={sub.ifsc_code} />
                <InfoField label="Account Holder" value={sub.account_holder_name} />
              </div>
            </div>

            {Array.isArray(sub.documents) && sub.documents.length > 0 && (
              <div className="mt-4 pt-4 border-t border-indigo-100">
                <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Uploaded Documents</h4>
                <div className="flex flex-wrap gap-2">
                  {sub.documents.map((doc, i) => (
                    <a key={i} href={fullUrl(doc.path || doc.file_path)} target="_blank" rel="noreferrer"
                      className="flex items-center gap-2 px-3 py-2 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-lg text-xs font-medium text-indigo-700">
                      📄 {doc.type || doc.document_type}
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── SUBMITTED DOCS SECTION — shown when docs_submitted = true ── */}
        <div className="border-t border-indigo-100 pt-3">
          <SubmittedDocsSection
            empDbId={sub.id}
            docsSubmitted={docsSubmitted}
            showToast={showToast}
          />
        </div>
      </div>
    </>
  );
};

// ══════════════════════════════════════════════════════════════════════════════
// MAIN PAGE
// ══════════════════════════════════════════════════════════════════════════════
const PendingRejoinApprovals = () => {
  const navigate = useNavigate();

  const [submissions,   setSubmissions]   = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [error,         setError]         = useState("");
  const [processingId,  setProcessingId]  = useState(null);
  const [deletingId,    setDeletingId]    = useState(null);
  const [rejectModal,   setRejectModal]   = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [toast,         setToast]         = useState(null);

  const showToast = (message, type = "info") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4500);
  };

  const fetchSubmissions = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const res  = await fetch(`${BASE_URL}/employees/pending-rejoin`);
      const data = await res.json();
      if (data.success) {
        setSubmissions(data.data || []);
      } else {
        setError(data.message || "Failed to load rejoin submissions");
      }
    } catch (err) {
      setError(err.message || "Failed to load submissions");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSubmissions();
    fetch(`${BASE_URL}/employees/cleanup-expired-rejoin-invites`).catch(() => {});
  }, [fetchSubmissions]);

  const handleApprove = async (sub) => {
    setProcessingId(sub.id);
    try {
      const res  = await fetch(`${BASE_URL}/registrations/${sub.id}/approve`, { method: "POST" });
      const data = await res.json();
      if (data.success) {
        const newId = data.data?.employee_id || "—";
        showToast(`✅ Approved — New Employee ID: ${newId}. Approval email with KYE PDF & upload link sent.`, "success");
        setSubmissions((prev) => prev.filter((s) => s.id !== sub.id));
      } else {
        showToast(data.message || "Failed to approve", "error");
      }
    } catch (err) {
      showToast(err.message || "Network error", "error");
    } finally {
      setProcessingId(null);
    }
  };

  const handleRejectConfirm = async (reason) => {
    if (!rejectModal) return;
    const sub = rejectModal;
    setProcessingId(sub.id);
    setRejectModal(null);
    try {
      const res  = await fetch(`${BASE_URL}/registrations/${sub.id}/reject-rejoin`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rejection_reason: reason }),
      });
      const data = await res.json();
      if (data.success) {
        showToast("↩️ Rejoin declined — employee data restored to Inactive", "success");
        setSubmissions((prev) => prev.filter((s) => s.id !== sub.id));
      } else {
        showToast(data.message || "Failed to decline", "error");
      }
    } catch (err) {
      showToast(err.message || "Network error", "error");
    } finally {
      setProcessingId(null);
    }
  };

  const handleDeleteRequest  = (sub) => setDeleteConfirm(sub);

  const handleDeleteConfirm = async () => {
    const sub = deleteConfirm;
    setDeleteConfirm(null);
    if (!sub) return;
    setDeletingId(sub.id);
    try {
      const res  = await fetch(`${BASE_URL}/employees/${sub.id}/pending-rejoin`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
      });
      const data = await res.json();
      if (data.success) {
        showToast(`🗑️ Rejoin request deleted — ${sub.first_name} ${sub.last_name} restored to Inactive`, "success");
        setSubmissions((prev) => prev.filter((s) => s.id !== sub.id));
      } else {
        showToast(data.message || "Failed to delete", "error");
      }
    } catch (err) {
      showToast(err.message || "Network error", "error");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="p-8 min-h-screen bg-gray-50">

      {/* Toast */}
      {toast && (
        <div className={`fixed top-20 right-4 z-[9999] flex items-center gap-3 px-4 py-3 rounded-xl border shadow-lg text-sm font-medium min-w-[260px] max-w-[400px] ${
          toast.type === "success" ? "bg-green-50 border-green-200 text-green-800" :
          toast.type === "error"   ? "bg-red-50   border-red-200   text-red-800"   :
                                     "bg-blue-50  border-blue-200  text-blue-800"
        }`}>
          {toast.type === "success"
            ? <CheckCircle className="w-4 h-4 flex-shrink-0 text-green-600" />
            : <AlertCircle className="w-4 h-4 flex-shrink-0 text-red-500" />}
          <span className="flex-1">{toast.message}</span>
        </div>
      )}

      {rejectModal && (
        <RejectModal
          submission={rejectModal}
          onConfirm={handleRejectConfirm}
          onCancel={() => setRejectModal(null)}
          isLoading={processingId === rejectModal.id}
        />
      )}

      {deleteConfirm && (
        <ConfirmDialog
          title="Cancel Rejoin Request?"
          message={`This will cancel ${deleteConfirm.first_name} ${deleteConfirm.last_name}'s rejoin request, restore their original data, and return them to Inactive status. This cannot be undone.`}
          confirmLabel="Yes, Delete Request"
          confirmClass="bg-red-600 hover:bg-red-700"
          onConfirm={handleDeleteConfirm}
          onCancel={() => setDeleteConfirm(null)}
        />
      )}

      {/* Header */}
      <div className="mb-8 flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate("/employee/management")}
            className="p-2.5 bg-white border border-gray-200 rounded-xl hover:bg-indigo-50 hover:border-indigo-300">
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-gray-900">Pending Rejoin Approvals</h1>
              {submissions.length > 0 && (
                <span className="inline-flex items-center justify-center min-w-[28px] h-7 px-2 rounded-full text-white text-xs font-bold"
                  style={{ background: "linear-gradient(135deg,#4f46e5,#7c3aed)" }}>
                  {submissions.length}
                </span>
              )}
            </div>
            <p className="text-gray-500 text-sm mt-0.5">
              Review and approve employees requesting to rejoin the organisation
            </p>
          </div>
        </div>
        <button onClick={fetchSubmissions}
          className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-indigo-50 hover:border-indigo-300 shadow-sm">
          <RefreshCw className="w-4 h-4" /> Refresh
        </button>
      </div>

      {/* Stats bar */}
      {submissions.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
          {[
            { label: "Total Pending Rejoin",  value: submissions.length,                                                              color: "#5b21b6" },
            { label: "Latest Request",        value: fmtDateTime(submissions[0]?.rejoin_requested_at || submissions[0]?.updated_at), color: "#d97706" },
            { label: "Departments Involved",  value: [...new Set(submissions.map(s => s.department).filter(Boolean))].length || "—", color: "#0891b2" },
          ].map((stat, i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-200 px-5 py-4 shadow-sm">
              <p className="text-xs font-medium text-gray-500 mb-1">{stat.label}</p>
              <p className="text-lg font-bold" style={{ color: stat.color }}>{stat.value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Info banner */}
      <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4 mb-6 flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-indigo-500 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-semibold text-indigo-800">Before approving a rejoin request</p>
          <p className="text-xs text-indigo-600 mt-0.5">
            <strong>Approve</strong> → new submitted data is saved, a new Employee ID is assigned, approval email with KYE PDF &amp; upload link sent to employee. &nbsp;|&nbsp;
            <strong>Decline</strong> → original pre-submission data is restored, employee returns to Inactive. &nbsp;|&nbsp;
            <strong>Delete</strong> → same as Decline but without sending an email to the employee.
            &nbsp;|&nbsp;
            <strong className="text-violet-700">After approval</strong> → employee uploads signed KYE, BGV form &amp; email screenshot; HR reviews docs inline below each card.
            &nbsp;|&nbsp;
            <strong className="text-violet-700">Telecom employees</strong> → FARM-ToCli Certificate is mandatory; verify it is uploaded before approving.
          </p>
        </div>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-24">
          <Loader className="w-10 h-10 text-indigo-600 animate-spin" />
        </div>
      )}

      {!loading && error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
          <p className="text-sm text-red-800">{error}</p>
          <button onClick={fetchSubmissions} className="ml-auto text-xs text-red-600 underline">Retry</button>
        </div>
      )}

      {!loading && !error && (
        <>
          {/* ── REJOIN DOCS PENDING REVIEW SECTION ── */}
          <RejoinDocsPendingReviewSection showToast={showToast} />

          {/* ── PENDING REJOIN APPROVAL CARDS ── */}
          {submissions.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-16 text-center">
              <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4"
                style={{ background: "linear-gradient(135deg,#ede9fe,#c4b5fd)" }}>
                <UserCheck className="w-10 h-10 text-indigo-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No Pending Rejoin Requests</h3>
              <p className="text-gray-500 text-sm mb-6">All caught up! No employees have submitted rejoin requests yet.</p>
              <button onClick={() => navigate("/employee/management")}
                className="inline-flex items-center gap-2 px-5 py-2.5 text-white rounded-xl text-sm font-semibold"
                style={{ background: "linear-gradient(135deg,#4f46e5,#7c3aed)" }}>
                <ArrowLeft className="w-4 h-4" /> Back to Employee Management
              </button>
            </div>
          ) : (
            <>
              <div className="relative mb-5">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-dashed border-indigo-200" />
                </div>
                <div className="relative flex justify-center">
                  <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest"
                    style={{ background: "#ede9fe", color: "#4f46e5", border: "1px solid #c4b5fd" }}>
                    Rejoin Requests Awaiting Approval
                  </span>
                </div>
              </div>
              <div className="space-y-4">
                {submissions.map((sub) => (
                  <SubmissionCard
                    key={sub.id}
                    sub={sub}
                    onApprove={handleApprove}
                    onReject={(s) => setRejectModal(s)}
                    onDelete={handleDeleteRequest}
                    isProcessing={processingId === sub.id}
                    isDeleting={deletingId === sub.id}
                    showToast={showToast}
                  />
                ))}
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
};

export default PendingRejoinApprovals;