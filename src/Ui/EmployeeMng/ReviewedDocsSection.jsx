// src/Ui/EmployeeMng/ReviewedDocsSection.jsx
import React, { useState, useEffect, useCallback } from "react";
import {
  CheckCircle, FileText, ChevronDown, ChevronUp,
  RefreshCw, Eye, Download, ExternalLink, Loader,
  AlertCircle, CheckCheck, X as XIcon,
  ChevronLeft, ChevronRight, FileCheck, FolderOpen,
  Shield, Camera, File,
} from "lucide-react";

const BASE_URL =
  (typeof import.meta !== "undefined" && import.meta.env?.VITE_API_URL?.replace("/api", "")) ||
  "http://localhost:5000";

const BASE_API =
  (typeof import.meta !== "undefined" && import.meta.env?.VITE_API_URL) ||
  "http://localhost:5000/api";

const DOC_TYPE_META = {
  signed_kye: {
    label: "Signed KYE Form",
    icon: FileCheck,
    bg: "#eff6ff", border: "#bfdbfe", text: "#1d4ed8", dot: "#3b82f6",
  },
  bgv_form: {
    label: "BGV Form",
    icon: Shield,
    bg: "#f5f3ff", border: "#ddd6fe", text: "#6d28d9", dot: "#7c3aed",
  },
  email_screenshot: {
    label: "Approval Email Screenshot",
    icon: Camera,
    bg: "#f0fdf4", border: "#bbf7d0", text: "#15803d", dot: "#22c55e",
  },
  other: {
    label: "Other Document",
    icon: File,
    bg: "#f9fafb", border: "#e5e7eb", text: "#374151", dot: "#9ca3af",
  },
};

function fullUrl(path) {
  if (!path) return null;
  return path.startsWith("http") ? path : `${BASE_URL}${path}`;
}

function getFileType(path = "", mime = "") {
  const p = path.toLowerCase();
  const m = mime.toLowerCase();
  if (m.includes("pdf") || p.endsWith(".pdf")) return "pdf";
  if (m.includes("image") || /\.(jpg|jpeg|png|gif|webp|bmp)$/.test(p)) return "image";
  return "other";
}

// ── Doc Lightbox ──────────────────────────────────────────────────────────────
const DocLightbox = ({ docs, startIndex = 0, onClose }) => {
  const [idx, setIdx] = useState(startIndex);
  const [imgError, setImgError] = useState(false);

  const doc = docs[idx];
  const url = fullUrl(doc?.file_path);
  const ft  = getFileType(doc?.file_path, doc?.mime_type);
  const meta = DOC_TYPE_META[doc?.document_type] || DOC_TYPE_META.other;
  const label = meta.label;

  useEffect(() => { setImgError(false); }, [idx]);
  useEffect(() => {
    const h = (e) => {
      if (e.key === "Escape")     onClose();
      if (e.key === "ArrowRight") setIdx((i) => Math.min(i + 1, docs.length - 1));
      if (e.key === "ArrowLeft")  setIdx((i) => Math.max(i - 1, 0));
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [docs.length, onClose]);

  return (
    <div className="fixed inset-0 z-[9999] flex flex-col" style={{ background: "rgba(0,0,0,0.93)" }}>
      {/* Toolbar */}
      <div className="flex items-center justify-between px-5 py-3 flex-shrink-0"
        style={{ background: "rgba(15,23,42,0.97)", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: meta.bg }}>
            <FileText size={15} style={{ color: meta.text }} />
          </div>
          <div>
            <p className="text-white font-semibold text-sm">{label}</p>
            <p className="text-blue-300 text-xs">{idx + 1} / {docs.length}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {url && (
            <>
              <a href={url} download target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-lg text-xs font-medium border border-white/10 transition-all">
                <Download size={13} /> Download
              </a>
              <a href={url} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-lg text-xs font-medium border border-white/10 transition-all">
                <ExternalLink size={13} /> Open
              </a>
            </>
          )}
          <button onClick={onClose}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white text-slate-900 rounded-lg text-xs font-bold hover:bg-blue-50 transition-all ml-1">
            <XIcon size={13} /> Close
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex items-center justify-center relative p-6 overflow-hidden">
        {idx > 0 && (
          <button onClick={() => setIdx((i) => i - 1)}
            className="absolute left-4 z-10 w-10 h-10 rounded-full bg-white/12 hover:bg-white/25 border border-white/15 flex items-center justify-center text-white transition-all">
            <ChevronLeft size={22} />
          </button>
        )}
        {ft === "pdf" && url && (
          <iframe src={url} title={label}
            className="w-full rounded-xl shadow-2xl bg-white border-0"
            style={{ height: "calc(100vh - 120px)", maxWidth: 960 }} />
        )}
        {ft === "image" && url && !imgError && (
          <img src={url} alt={label}
            className="rounded-xl shadow-2xl object-contain"
            style={{ maxHeight: "calc(100vh - 120px)", maxWidth: "100%" }}
            onError={() => setImgError(true)} />
        )}
        {(ft === "other" || (ft === "image" && imgError) || !url) && (
          <div className="text-center text-white space-y-4">
            <div className="w-20 h-20 rounded-2xl bg-white/10 flex items-center justify-center mx-auto">
              <FileText size={36} opacity={0.5} />
            </div>
            <p className="text-base opacity-70">Preview not available</p>
            {url && (
              <a href={url} download
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-white/15 hover:bg-white/25 rounded-xl text-sm font-semibold text-white transition-all">
                <Download size={16} /> Download File
              </a>
            )}
          </div>
        )}
        {idx < docs.length - 1 && (
          <button onClick={() => setIdx((i) => i + 1)}
            className="absolute right-4 z-10 w-10 h-10 rounded-full bg-white/12 hover:bg-white/25 border border-white/15 flex items-center justify-center text-white transition-all">
            <ChevronRight size={22} />
          </button>
        )}
      </div>

      {/* Thumbnail strip */}
      {docs.length > 1 && (
        <div className="flex-shrink-0 flex items-center gap-2 px-5 py-3 overflow-x-auto"
          style={{ background: "rgba(0,0,0,0.65)" }}>
          {docs.map((d, i) => {
            const u  = fullUrl(d.file_path);
            const ft2 = getFileType(d.file_path, d.mime_type);
            return (
              <button key={i} onClick={() => setIdx(i)}
                className="flex-shrink-0 w-14 h-14 rounded-lg overflow-hidden border-2 transition-all"
                style={{
                  borderColor: i === idx ? "#60a5fa" : "rgba(255,255,255,0.2)",
                  opacity: i === idx ? 1 : 0.5,
                  transform: i === idx ? "scale(1.1)" : "scale(1)",
                  background: "#1e293b",
                }}>
                {ft2 === "image" && u
                  ? <img src={u} alt="" className="w-full h-full object-cover" />
                  : <div className="w-full h-full flex items-center justify-center">
                      <FileText size={18} color="#64748b" />
                    </div>}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

// ── Docs Modal — shows all accepted docs for one employee ─────────────────────
// Named export so EmployeeManagement.jsx can import and use it directly in the table
export const DocsModal = ({ emp, onClose }) => {
  const [docs, setDocs]       = useState(emp.docs || []);
  const [loading, setLoading] = useState(!emp.docs?.length);
  const [error, setError]     = useState("");
  const [lightbox, setLightbox] = useState(null);

  useEffect(() => {
    if (emp.docs && emp.docs.length > 0) {
      setDocs(emp.docs);
      setLoading(false);
      return;
    }
    setLoading(true);
    fetch(`${BASE_API}/employee-docs/submissions/${emp.id}`)
      .then(r => r.json())
      .then(data => {
        if (data.success) setDocs(data.data || []);
        else setError(data.message || "Failed to load");
      })
      .catch(() => setError("Cannot connect to server"))
      .finally(() => setLoading(false));
  }, [emp.id]);

  const acceptedDocs = docs.filter(d => d.status === "accepted" || d.reviewed === true);
  const firstName = emp.first_name || "";
  const lastName  = emp.last_name  || "";
  const initials  = `${firstName[0] || "?"}${lastName[0] || ""}`.toUpperCase();

  return (
    <>
      {lightbox !== null && (
        <DocLightbox
          docs={acceptedDocs}
          startIndex={lightbox}
          onClose={() => setLightbox(null)}
        />
      )}

      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[500] flex items-center justify-center p-4"
        style={{ background: "rgba(0,0,0,0.55)", backdropFilter: "blur(4px)" }}
        onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      >
        <div
          className="bg-white rounded-2xl shadow-2xl w-full overflow-hidden"
          style={{ maxWidth: 560, maxHeight: "90vh", display: "flex", flexDirection: "column" }}
        >
          {/* Header */}
          <div className="flex items-center gap-4 px-5 py-4 border-b border-gray-100"
            style={{ background: "linear-gradient(135deg, #0f172a 0%, #1d4ed8 100%)" }}>
            <div className="w-11 h-11 rounded-xl flex items-center justify-center font-bold text-sm text-white flex-shrink-0"
              style={{ background: "rgba(255,255,255,0.2)" }}>
              {initials}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-white font-bold text-base truncate">
                {firstName} {emp.father_husband_name ? emp.father_husband_name + " " : ""}{lastName}
              </h3>
              <p className="text-blue-200 text-xs mt-0.5">
                {emp.emp_id || emp.employee_id} · {emp.department || "—"} · {emp.position || emp.designation || "—"}
              </p>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold"
                style={{ background: "rgba(34,197,94,0.2)", color: "#86efac", border: "1px solid rgba(34,197,94,0.3)" }}>
                <CheckCheck size={11} />
                {acceptedDocs.length} Accepted
              </span>
              <button onClick={onClose}
                className="w-8 h-8 rounded-lg bg-white/15 hover:bg-white/25 flex items-center justify-center text-white transition-all">
                <XIcon size={16} />
              </button>
            </div>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-5">
            {loading && (
              <div className="flex items-center justify-center py-10 gap-3">
                <Loader size={18} className="animate-spin text-blue-500" />
                <span className="text-sm text-gray-500">Loading documents…</span>
              </div>
            )}
            {error && !loading && (
              <div className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
                <AlertCircle size={16} className="text-red-500 flex-shrink-0" />
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}
            {!loading && !error && acceptedDocs.length === 0 && (
              <div className="text-center py-10 text-gray-400">
                <FolderOpen size={36} className="mx-auto mb-3 opacity-40" />
                <p className="text-sm">No accepted documents found</p>
              </div>
            )}
            {!loading && !error && acceptedDocs.length > 0 && (
              <div className="space-y-3">
                {acceptedDocs.map((doc, i) => {
                  const meta  = DOC_TYPE_META[doc.document_type] || DOC_TYPE_META.other;
                  const Icon  = meta.icon;
                  const url   = fullUrl(doc.file_path);
                  const ft    = getFileType(doc.file_path, doc.mime_type);

                  return (
                    <div key={doc.id || i}
                      className="rounded-xl border overflow-hidden transition-all hover:shadow-sm"
                      style={{ background: meta.bg, borderColor: meta.border }}>
                      <div className="flex items-center gap-3 px-4 py-3">
                        {/* Thumbnail */}
                        <div className="w-14 h-14 rounded-lg overflow-hidden border flex-shrink-0 flex items-center justify-center"
                          style={{ borderColor: meta.border, background: ft === "image" ? "transparent" : meta.bg }}>
                          {ft === "image" && url ? (
                            <img src={url} alt={meta.label}
                              className="w-full h-full object-cover"
                              onError={(e) => { e.target.style.display = "none"; }} />
                          ) : ft === "pdf" ? (
                            <div className="w-full h-full flex flex-col items-center justify-center gap-0.5"
                              style={{ background: meta.bg }}>
                              <FileText size={18} style={{ color: meta.text }} />
                              <span className="text-[8px] font-bold" style={{ color: meta.text }}>PDF</span>
                            </div>
                          ) : (
                            <Icon size={20} style={{ color: meta.text }} />
                          )}
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="text-sm font-bold text-gray-900 truncate">{meta.label}</p>
                            <span className="flex-shrink-0 inline-flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-green-500 text-white">
                              <CheckCircle size={9} /> ACCEPTED
                            </span>
                          </div>
                          <p className="text-xs text-gray-500 truncate">{doc.file_name}</p>
                          <p className="text-[10px] text-gray-400 mt-0.5">
                            Uploaded: {new Date(doc.uploaded_at).toLocaleDateString("en-IN", {
                              day: "numeric", month: "short", year: "numeric",
                            })}
                          </p>
                          {doc.reviewed_at && (
                            <p className="text-[10px] text-green-600 mt-0.5">
                              Accepted: {new Date(doc.reviewed_at).toLocaleDateString("en-IN", {
                                day: "numeric", month: "short", year: "numeric",
                              })}
                              {doc.reviewed_by ? ` by ${doc.reviewed_by}` : ""}
                            </p>
                          )}
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-1.5 flex-shrink-0">
                          {url && (
                            <button
                              onClick={() => setLightbox(i)}
                              title="View document"
                              className="w-9 h-9 rounded-lg flex items-center justify-center border border-white/60 bg-white hover:border-blue-300 hover:bg-blue-50 transition-all shadow-sm"
                            >
                              <Eye size={15} className="text-gray-600" />
                            </button>
                          )}
                          {url && (
                            <a href={url} download target="_blank" rel="noopener noreferrer"
                              title="Download"
                              className="w-9 h-9 rounded-lg flex items-center justify-center border border-white/60 bg-white hover:border-gray-300 hover:bg-gray-50 transition-all shadow-sm">
                              <Download size={15} className="text-gray-600" />
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-5 py-3 border-t border-gray-100 flex items-center justify-between bg-gray-50">
            <p className="text-xs text-gray-500">
              All {acceptedDocs.length} document{acceptedDocs.length !== 1 ? "s" : ""} verified by HR
            </p>
            <button onClick={onClose}
              className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg text-sm font-medium transition-all">
              Close
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

// ── (Optional) Keep the standalone reviewed section if used elsewhere ─────────
// This component is no longer rendered inside EmployeeManagement.jsx
// but kept here in case it's needed in other parts of the app.
const ReviewedDocsSection = ({ showToast }) => {
  const [employees, setEmployees] = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState("");
  const [collapsed, setCollapsed] = useState(false);
  const [docsModalEmp, setDocsModalEmp] = useState(null);

  const fetchReviewed = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res  = await fetch(`${BASE_API}/employee-docs/reviewed`);
      const data = await res.json();
      if (data.success) {
        setEmployees(data.data || []);
      } else {
        setError(data.message || "Failed to load");
      }
    } catch {
      setError("Cannot connect to server");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchReviewed(); }, [fetchReviewed]);

  if (!loading && !error && employees.length === 0) return null;

  return (
    <>
      {docsModalEmp && (
        <DocsModal emp={docsModalEmp} onClose={() => setDocsModalEmp(null)} />
      )}
      <div className="mt-8">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "#dcfce7" }}>
              <CheckCheck size={18} style={{ color: "#16a34a" }} />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-lg font-semibold text-gray-900">Document-Verified Employees</h2>
                {!loading && employees.length > 0 && (
                  <span className="text-xs px-2.5 py-0.5 rounded-full font-semibold"
                    style={{ background: "#dcfce7", color: "#16a34a" }}>
                    {employees.length} employee{employees.length !== 1 ? "s" : ""}
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-500 mt-0.5">Employees whose submitted documents have all been accepted by HR</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={fetchReviewed}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:bg-gray-50 transition-all">
              <RefreshCw size={13} /> Refresh
            </button>
            <button onClick={() => setCollapsed((p) => !p)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:bg-gray-50 transition-all">
              {collapsed ? <ChevronDown size={13} /> : <ChevronUp size={13} />}
              {collapsed ? "Show" : "Hide"}
            </button>
          </div>
        </div>
        {!collapsed && (
          <>
            {loading && (
              <div className="flex items-center justify-center py-10 gap-3 bg-white rounded-xl border border-gray-200">
                <Loader size={18} className="animate-spin text-gray-400" />
                <span className="text-sm text-gray-500">Loading verified employees…</span>
              </div>
            )}
            {error && !loading && (
              <div className="flex items-center gap-3 px-4 py-3 bg-red-50 border border-red-200 rounded-xl mb-3">
                <AlertCircle size={16} className="text-red-500 flex-shrink-0" />
                <p className="text-sm text-red-700 flex-1">{error}</p>
                <button onClick={fetchReviewed} className="text-xs text-red-600 underline font-medium">Retry</button>
              </div>
            )}
            {!loading && !error && employees.length > 0 && (
              <div className="space-y-2">
                {employees.map((emp) => {
                  const docs = Array.isArray(emp.docs) ? emp.docs : [];
                  const acceptedCount = emp.accepted_docs || docs.filter(d => d.status === "accepted" || d.reviewed).length || 0;
                  const firstName = emp.first_name || "";
                  const lastName  = emp.last_name  || "";
                  const initials  = `${firstName[0] || "?"}${lastName[0] || ""}`.toUpperCase();
                  return (
                    <div key={emp.id} className="bg-white rounded-xl border border-gray-200 hover:border-green-300 hover:shadow-sm transition-all overflow-hidden">
                      <div className="flex items-center gap-3 px-4 py-3">
                        <div className="w-10 h-10 rounded-full flex items-center justify-center font-semibold text-sm text-blue-700 flex-shrink-0" style={{ background: "#dbeafe" }}>
                          {initials}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-gray-900 truncate">{firstName} {emp.father_husband_name ? emp.father_husband_name + " " : ""}{lastName}</p>
                          <p className="text-xs text-gray-500 truncate">{emp.emp_id || emp.employee_id} · {emp.department || "—"} · {emp.position || "—"}</p>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border"
                            style={{ background: "#f0fdf4", color: "#16a34a", borderColor: "#bbf7d0" }}>
                            <CheckCheck size={13} />
                            {acceptedCount} doc{acceptedCount !== 1 ? "s" : ""} accepted
                          </span>
                          <button
                            onClick={() => setDocsModalEmp(emp)}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
                            style={{ background: "linear-gradient(135deg, #1d4ed8, #3b82f6)", color: "#fff", border: "none" }}>
                            <FolderOpen size={13} /> Docs
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
};

export default ReviewedDocsSection;