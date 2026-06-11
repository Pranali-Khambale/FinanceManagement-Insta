// src/Ui/EmployeeMng/SubmittedDocsPanel.jsx
// ─────────────────────────────────────────────────────────────────────────────
// FIX: "Download All as PDF" no longer clears the docs list.
//
// ROOT CAUSE: The download button was calling fetchDocs() after generating
// the zip/pdf, which re-ran the async fetch and set docs=[] momentarily
// (the loading state wiped the UI), OR the presigned URL fetch was failing
// on the second call because the S3 keys were being fetched again without
// a cache.
//
// FIXES APPLIED:
//  1. Inline presign cache (module-level Map) — URLs are cached 50 min so
//     re-renders never hit the network again for the same key.
//  2. resolveUrl() is async and used via a useEffect that populates a
//     resolvedUrls state map — docs list stays visible at all times.
//  3. "Download All as PDF" opens each doc in a new tab instead of
//     refetching or calling fetchDocs(). No loading flicker.
//  4. fetchDocs() no longer resets docs to [] before the response arrives
//     (it keeps stale data visible while refreshing).
// ─────────────────────────────────────────────────────────────────────────────
import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  FileText,
  Shield,
  Camera,
  CheckCircle,
  Clock,
  Eye,
  Download,
  ExternalLink,
  Loader,
  AlertCircle,
  RefreshCw,
  File,
  ChevronLeft,
  ChevronRight,
  X as XIcon,
  Check,
} from "lucide-react";

import { BASE_URL } from "../../api/client";

// ── Module-level presign cache (shared across all panel instances) ─────────────
// key = S3 object key, value = { url, expiresAt }
const _presignCache = new Map();

async function resolveUrl(keyOrPath) {
  if (!keyOrPath) return null;
  if (keyOrPath.startsWith("http://") || keyOrPath.startsWith("https://"))
    return keyOrPath;
  if (keyOrPath.startsWith("/"))
    return `${BASE_URL.replace("/api", "")}${keyOrPath}`;

  // S3 key — check cache first
  const now = Date.now();
  const cached = _presignCache.get(keyOrPath);
  if (cached && cached.expiresAt > now) return cached.url;

  try {
    const res = await fetch(
      `${BASE_URL}/employees/s3/presign?key=${encodeURIComponent(keyOrPath)}`,
    );
    const data = await res.json();
    if (data.success && data.url) {
      _presignCache.set(keyOrPath, {
        url: data.url,
        expiresAt: now + 50 * 60 * 1000, // cache 50 min
      });
      return data.url;
    }
  } catch (e) {
    console.warn("[SubmittedDocsPanel] presign failed:", e.message);
  }
  return null;
}

// ── Doc type metadata ─────────────────────────────────────────────────────────
const DOC_META = {
  signed_kye: {
    label: "Signed KYE Form",
    icon: <FileText className="w-5 h-5 text-blue-600" />,
    color: "blue",
    required: true,
  },
  bgv_form: {
    label: "BGV Form",
    icon: <Shield className="w-5 h-5 text-indigo-600" />,
    color: "indigo",
    required: false,
  },
  email_screenshot: {
    label: "Approval Email Screenshot",
    icon: <Camera className="w-5 h-5 text-green-600" />,
    color: "green",
    required: false,
  },
  other: {
    label: "Other Document",
    icon: <File className="w-5 h-5 text-gray-500" />,
    color: "gray",
    required: false,
  },
};

const colorMap = {
  blue: { bg: "bg-blue-50", border: "border-blue-200", text: "text-blue-700" },
  indigo: {
    bg: "bg-indigo-50",
    border: "border-indigo-200",
    text: "text-indigo-700",
  },
  green: {
    bg: "bg-green-50",
    border: "border-green-200",
    text: "text-green-700",
  },
  gray: { bg: "bg-gray-50", border: "border-gray-200", text: "text-gray-700" },
};

const getFileType = (path, mime) => {
  const p = (path || "").toLowerCase();
  const m = (mime || "").toLowerCase();
  if (m.includes("pdf") || p.endsWith(".pdf")) return "pdf";
  if (m.includes("image") || /\.(jpg|jpeg|png|gif|webp|bmp)$/.test(p))
    return "image";
  return "other";
};

// ── Doc Lightbox ──────────────────────────────────────────────────────────────
const DocLightbox = ({ docs, resolvedUrls, startIndex, onClose }) => {
  const [idx, setIdx] = useState(startIndex || 0);
  const doc = docs[idx];
  const url = resolvedUrls[doc?.file_path] || null;
  const ft = getFileType(doc?.file_path, doc?.mime_type);
  const meta = DOC_META[doc?.document_type] || DOC_META.other;

  useEffect(() => {
    const h = (e) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight")
        setIdx((i) => Math.min(i + 1, docs.length - 1));
      if (e.key === "ArrowLeft") setIdx((i) => Math.max(i - 1, 0));
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [docs.length, onClose]);

  return (
    <div
      className="fixed inset-0 z-[300] flex flex-col"
      style={{ background: "rgba(0,0,0,0.92)" }}
    >
      <div
        className="flex items-center justify-between px-6 py-3 flex-shrink-0"
        style={{ background: "linear-gradient(90deg,#1e3a5f,#1d4ed8)" }}
      >
        <div className="flex items-center gap-3">
          <div className="text-white/80">{meta.icon}</div>
          <div>
            <p className="text-white font-semibold text-sm">{meta.label}</p>
            <p className="text-blue-200 text-xs">
              {idx + 1} of {docs.length}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {url && (
            <>
              <a
                href={url}
                download
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-3 py-1.5 bg-white/15 hover:bg-white/25 text-white rounded-lg text-xs font-medium transition-all"
              >
                <Download className="w-3.5 h-3.5" /> Download
              </a>
              <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-3 py-1.5 bg-white/15 hover:bg-white/25 text-white rounded-lg text-xs font-medium transition-all"
              >
                <ExternalLink className="w-3.5 h-3.5" /> Open
              </a>
            </>
          )}
          <button
            onClick={onClose}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white text-blue-900 rounded-lg text-xs font-semibold hover:bg-blue-50 transition-all ml-1"
          >
            <XIcon className="w-3.5 h-3.5" /> Close
          </button>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center relative overflow-hidden p-6">
        {idx > 0 && (
          <button
            onClick={() => setIdx((i) => i - 1)}
            className="absolute left-4 z-10 w-11 h-11 bg-white/20 hover:bg-white/40 rounded-full flex items-center justify-center text-white transition-all"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
        )}
        {ft === "pdf" && url && (
          <iframe
            src={url}
            title={meta.label}
            className="w-full rounded-xl shadow-2xl bg-white"
            style={{ height: "calc(100vh - 140px)", maxWidth: "960px" }}
          />
        )}
        {ft === "image" && url && (
          <img
            src={url}
            alt={meta.label}
            className="rounded-xl shadow-2xl object-contain border border-white/10"
            style={{ maxHeight: "calc(100vh - 140px)", maxWidth: "100%" }}
          />
        )}
        {(ft === "other" || !url) && (
          <div className="text-center text-white space-y-4">
            <div className="w-20 h-20 bg-white/10 rounded-2xl flex items-center justify-center mx-auto">
              <FileText className="w-10 h-10 opacity-60" />
            </div>
            <p className="text-lg font-semibold opacity-80">
              Preview not available
            </p>
            {url && (
              <a
                href={url}
                download
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-white/15 hover:bg-white/25 rounded-xl text-sm font-semibold transition-all"
              >
                <Download className="w-4 h-4" /> Download File
              </a>
            )}
          </div>
        )}
        {idx < docs.length - 1 && (
          <button
            onClick={() => setIdx((i) => i + 1)}
            className="absolute right-4 z-10 w-11 h-11 bg-white/20 hover:bg-white/40 rounded-full flex items-center justify-center text-white transition-all"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        )}
      </div>
    </div>
  );
};

// ── Submitted Docs Panel ──────────────────────────────────────────────────────
export const SubmittedDocsPanel = ({ empDbId, employeeName, showToast }) => {
  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [lightbox, setLightbox] = useState(null);
  const [marking, setMarking] = useState({});
  const [downloading, setDownloading] = useState(false);

  // resolvedUrls: { [file_path]: presignedUrl }
  // Populated async after docs load — never cleared on re-fetch
  const [resolvedUrls, setResolvedUrls] = useState({});
  const resolveInProgress = useRef(new Set());

  const fetchDocs = useCallback(async () => {
    if (!empDbId) return;
    try {
      // ✅ FIX: Don't set loading=true here if we already have docs —
      // this prevents the panel from flashing blank while refreshing.
      setError("");
      if (docs.length === 0) setLoading(true);

      const res = await fetch(
        `${BASE_URL}/employee-docs/submissions/${empDbId}`,
      );
      const data = await res.json();
      if (data.success) {
        setDocs(data.data || []);
      } else {
        setError(data.message || "Failed to load documents");
      }
    } catch {
      setError("Cannot connect to server");
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [empDbId]);

  useEffect(() => {
    fetchDocs();
  }, [fetchDocs]);

  // ✅ FIX: Resolve presigned URLs in a separate effect that NEVER clears
  // existing resolved URLs — it only adds new ones. This means after
  // "Download All" (which doesn't call fetchDocs), all URLs stay valid.
  useEffect(() => {
    if (!docs.length) return;

    const unresolvedKeys = docs
      .map((d) => d.file_path)
      .filter(
        (k) => k && !resolvedUrls[k] && !resolveInProgress.current.has(k),
      );

    if (!unresolvedKeys.length) return;

    unresolvedKeys.forEach((k) => resolveInProgress.current.add(k));

    Promise.all(
      unresolvedKeys.map((k) => resolveUrl(k).then((url) => [k, url])),
    ).then((pairs) => {
      const newEntries = Object.fromEntries(pairs.filter(([, url]) => url));
      if (Object.keys(newEntries).length > 0) {
        setResolvedUrls((prev) => ({ ...prev, ...newEntries }));
      }
      unresolvedKeys.forEach((k) => resolveInProgress.current.delete(k));
    });
  }, [docs]); // eslint-disable-line react-hooks/exhaustive-deps

  // ✅ FIX: "Download All" opens each doc in a new tab using already-resolved
  // URLs. No fetchDocs() call, no state reset, no flicker.
  const handleDownloadAll = async () => {
    if (!docs.length) return;
    setDownloading(true);
    try {
      for (const doc of docs) {
        // Use cached URL or fetch a fresh presign
        const url =
          resolvedUrls[doc.file_path] || (await resolveUrl(doc.file_path));
        if (url) {
          // Open in new tab — browser will download if Content-Disposition is attachment
          const a = document.createElement("a");
          a.href = url;
          a.target = "_blank";
          a.rel = "noopener noreferrer";
          const meta = DOC_META[doc.document_type] || DOC_META.other;
          a.download = doc.file_name || `${meta.label}.pdf`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          // Small delay between downloads so browser doesn't block them
          await new Promise((r) => setTimeout(r, 300));
        }
      }
      showToast?.(
        `${docs.length} document${docs.length > 1 ? "s" : ""} download started`,
        "success",
      );
    } catch (e) {
      showToast?.("Download failed: " + e.message, "error");
    } finally {
      setDownloading(false);
      // ✅ Explicitly NOT calling fetchDocs() here — that was the bug.
    }
  };

  const handleMarkReviewed = async (docId) => {
    setMarking((prev) => ({ ...prev, [docId]: true }));
    try {
      const res = await fetch(
        `${BASE_URL}/employee-docs/mark-reviewed/${docId}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
        },
      );
      const data = await res.json();
      if (data.success) {
        // ✅ Update state in-place — no need to re-fetch all docs
        setDocs((prev) =>
          prev.map((d) =>
            d.id === docId ? { ...d, reviewed: true, status: "accepted" } : d,
          ),
        );
        showToast?.("Document marked as reviewed", "success");
      } else {
        showToast?.(data.message || "Failed to mark as reviewed", "error");
      }
    } catch {
      showToast?.("Failed to mark as reviewed", "error");
    } finally {
      setMarking((prev) => ({ ...prev, [docId]: false }));
    }
  };

  if (loading && docs.length === 0) {
    return (
      <div className="flex items-center justify-center py-10">
        <Loader className="w-6 h-6 text-blue-500 animate-spin" />
      </div>
    );
  }

  if (error && docs.length === 0) {
    return (
      <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
        <AlertCircle className="w-4 h-4 text-red-500" />
        <p className="text-sm text-red-700">{error}</p>
        <button
          onClick={fetchDocs}
          className="ml-auto text-xs text-red-600 underline"
        >
          Retry
        </button>
      </div>
    );
  }

  if (docs.length === 0) {
    return (
      <div className="text-center py-8 border-2 border-dashed border-gray-200 rounded-xl">
        <Clock className="w-8 h-8 text-gray-300 mx-auto mb-2" />
        <p className="text-sm font-medium text-gray-500">
          No documents submitted yet
        </p>
        <p className="text-xs text-gray-400 mt-1">
          Employee will upload after receiving their approval email
        </p>
      </div>
    );
  }

  const unreviewed = docs.filter((d) => !d.reviewed).length;

  return (
    <>
      {lightbox !== null && (
        <DocLightbox
          docs={docs}
          resolvedUrls={resolvedUrls}
          startIndex={lightbox}
          onClose={() => setLightbox(null)}
        />
      )}

      <div className="space-y-3">
        {/* Summary bar */}
        <div className="flex items-center justify-between px-4 py-2.5 bg-blue-50 border border-blue-100 rounded-xl flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-blue-600" />
            <span className="text-sm font-semibold text-blue-800">
              {docs.length} document{docs.length !== 1 ? "s" : ""} submitted
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* ✅ Download All button — uses resolvedUrls, never calls fetchDocs */}
            <button
              onClick={handleDownloadAll}
              disabled={downloading}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-blue-300 bg-white text-blue-700 hover:bg-blue-50 text-xs font-semibold disabled:opacity-50 transition-all"
              title="Download all documents"
            >
              {downloading ? (
                <Loader className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Download className="w-3.5 h-3.5" />
              )}
              {downloading ? "Downloading…" : "Download All"}
            </button>

            {unreviewed > 0 ? (
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-700">
                {unreviewed} unreviewed
              </span>
            ) : (
              <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-green-100 text-green-700">
                <CheckCircle className="w-3 h-3" /> All reviewed
              </span>
            )}

            <button
              onClick={fetchDocs}
              disabled={loading}
              className="text-blue-500 hover:text-blue-700 disabled:opacity-40"
              title="Refresh"
            >
              <RefreshCw
                className={`w-4 h-4 ${loading ? "animate-spin" : ""}`}
              />
            </button>
          </div>
        </div>

        {/* Doc cards */}
        {docs.map((doc, i) => {
          const meta = DOC_META[doc.document_type] || DOC_META.other;
          const colors = colorMap[meta.color] || colorMap.gray;
          const url = resolvedUrls[doc.file_path] || null;
          const ft = getFileType(doc.file_path, doc.mime_type);

          return (
            <div
              key={doc.id}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl border transition-all ${
                doc.reviewed
                  ? "border-gray-200 bg-white"
                  : `${colors.border} ${colors.bg}`
              }`}
            >
              {/* File thumbnail */}
              <div className="w-12 h-12 rounded-lg overflow-hidden border border-gray-200 flex-shrink-0 bg-gray-100 flex items-center justify-center">
                {ft === "image" && url ? (
                  <img
                    src={url}
                    alt={meta.label}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.style.display = "none";
                    }}
                  />
                ) : ft === "pdf" ? (
                  <div className="flex flex-col items-center justify-center w-full h-full bg-red-50">
                    <FileText className="w-5 h-5 text-red-400" />
                    <span className="text-[8px] font-bold text-red-400">
                      PDF
                    </span>
                  </div>
                ) : (
                  <File className="w-5 h-5 text-gray-400" />
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <p className="text-sm font-semibold text-gray-900 truncate">
                    {meta.label}
                  </p>
                  {!doc.reviewed && (
                    <span
                      className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${colors.bg} ${colors.text} border ${colors.border}`}
                    >
                      NEW
                    </span>
                  )}
                  {doc.status === "rejected" && (
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-red-50 text-red-600 border border-red-200">
                      REJECTED
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-500 truncate">
                  {doc.file_name}
                </p>
                <p className="text-[10px] text-gray-400">
                  {new Date(doc.uploaded_at).toLocaleString("en-IN", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1.5 flex-shrink-0">
                {/* Show spinner while URL is being resolved */}
                {!url && (
                  <div className="p-1.5 rounded-lg border border-gray-200 text-gray-400">
                    <Loader className="w-4 h-4 animate-spin" />
                  </div>
                )}
                {url && (
                  <button
                    onClick={() => setLightbox(i)}
                    className="p-1.5 rounded-lg border border-gray-200 text-gray-500 hover:text-blue-600 hover:border-blue-300 hover:bg-blue-50 transition-all"
                    title="View document"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                )}
                {url && (
                  <a
                    href={url}
                    download
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1.5 rounded-lg border border-gray-200 text-gray-500 hover:text-green-600 hover:border-green-300 hover:bg-green-50 transition-all"
                    title="Download"
                  >
                    <Download className="w-4 h-4" />
                  </a>
                )}
                {!doc.reviewed ? (
                  <button
                    onClick={() => handleMarkReviewed(doc.id)}
                    disabled={marking[doc.id]}
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-green-600 hover:bg-green-700 text-white text-xs font-semibold disabled:opacity-50 transition-all"
                    title="Mark as reviewed"
                  >
                    {marking[doc.id] ? (
                      <Loader className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <>
                        <Check className="w-3.5 h-3.5" /> Review
                      </>
                    )}
                  </button>
                ) : (
                  <div className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-gray-100 text-gray-500 text-xs font-medium">
                    <CheckCircle className="w-3.5 h-3.5 text-green-500" />{" "}
                    Reviewed
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
};

// ── Submitted Docs Badge ──────────────────────────────────────────────────────
export const SubmittedDocsBadge = ({ empDbId, docsSubmitted }) => {
  const [unreviewed, setUnreviewed] = useState(null);

  useEffect(() => {
    if (!empDbId || !docsSubmitted) return;
    fetch(`${BASE_URL}/employee-docs/submissions/${empDbId}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.success) {
          setUnreviewed((d.data || []).filter((x) => !x.reviewed).length);
        }
      })
      .catch(() => {});
  }, [empDbId, docsSubmitted]);

  if (!docsSubmitted || unreviewed === null) return null;

  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${
        unreviewed > 0
          ? "bg-amber-100 text-amber-700 border-amber-300"
          : "bg-green-100 text-green-700 border-green-200"
      }`}
    >
      {unreviewed > 0 ? (
        <>
          <FileText className="w-2.5 h-2.5" /> {unreviewed} doc
          {unreviewed !== 1 ? "s" : ""} pending
        </>
      ) : (
        <>
          <CheckCircle className="w-2.5 h-2.5" /> Docs reviewed
        </>
      )}
    </span>
  );
};

export default SubmittedDocsPanel;
