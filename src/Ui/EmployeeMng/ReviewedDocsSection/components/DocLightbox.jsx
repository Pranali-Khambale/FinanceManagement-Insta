// src/Ui/EmployeeMng/ReviewedDocsSection/components/DocLightbox.jsx
import React, { useState, useEffect } from "react";
import {
  FileText,
  Download,
  ExternalLink,
  X as XIcon,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { DOC_TYPE_META } from "../constants/docTypeMeta";
import { getFileType } from "../utils/fileHelpers";
import { getPresignedUrl, extractS3Key } from "../utils/urlHelpers";

// ── Doc Lightbox ──────────────────────────────────────────────────────────────
const DocLightbox = ({ docs, startIndex = 0, onClose }) => {
  const [idx, setIdx] = useState(startIndex);
  const [imgError, setImgError] = useState(false);
  const [presignedUrls, setPresignedUrls] = useState({});

  const doc = docs[idx];
  const mime = doc?.mime_type || doc?.mimeType || "";
  // FIX: use extractS3Key as the cache key so we don't double-cache
  // the same file under both its raw key and full URL forms
  const cacheKey = doc?.file_path ? extractS3Key(doc.file_path) : null;
  const url = (cacheKey && presignedUrls[cacheKey]) || null;
  const ft = getFileType(doc?.file_path, mime);
  const meta = DOC_TYPE_META[doc?.document_type] || DOC_TYPE_META.other;
  const label = doc?._regLabel || meta.label;

  useEffect(() => {
    // FIX: normalise all file_path values to raw keys for consistent caching
    const unresolved = docs
      .map((d) => d?.file_path)
      .filter((k) => k)
      .map((k) => extractS3Key(k))
      .filter((k) => k && !presignedUrls[k]);

    if (!unresolved.length) return;
    Promise.all(unresolved.map((k) => getPresignedUrl(k).then((u) => [k, u])))
      .then((pairs) => {
        const entries = Object.fromEntries(pairs.filter(([, u]) => u));
        if (Object.keys(entries).length)
          setPresignedUrls((prev) => ({ ...prev, ...entries }));
      })
      .catch(() => {});
  }, [docs]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    setImgError(false);
  }, [idx]);

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
      className="fixed inset-0 z-[9999] flex flex-col"
      style={{ background: "rgba(0,0,0,0.93)" }}
    >
      <div
        className="flex items-center justify-between px-5 py-3 flex-shrink-0"
        style={{
          background: "rgba(15,23,42,0.97)",
          borderBottom: "1px solid rgba(255,255,255,0.08)",
        }}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ background: meta.bg }}
          >
            <FileText size={15} style={{ color: meta.text }} />
          </div>
          <div>
            <p className="text-white font-semibold text-sm">{label}</p>
            <p className="text-blue-300 text-xs">
              {idx + 1} / {docs.length}
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
                className="flex items-center gap-1.5 px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-lg text-xs font-medium border border-white/10 transition-all"
              >
                <Download size={13} /> Download
              </a>
              <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-lg text-xs font-medium border border-white/10 transition-all"
              >
                <ExternalLink size={13} /> Open
              </a>
            </>
          )}
          <button
            onClick={onClose}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white text-slate-900 rounded-lg text-xs font-bold hover:bg-blue-50 transition-all ml-1"
          >
            <XIcon size={13} /> Close
          </button>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center relative p-6 overflow-hidden">
        {idx > 0 && (
          <button
            onClick={() => setIdx((i) => i - 1)}
            className="absolute left-4 z-10 w-10 h-10 rounded-full bg-white/12 hover:bg-white/25 border border-white/15 flex items-center justify-center text-white transition-all"
          >
            <ChevronLeft size={22} />
          </button>
        )}
        {ft === "pdf" && url && (
          <iframe
            src={url}
            title={label}
            className="w-full rounded-xl shadow-2xl bg-white border-0"
            style={{ height: "calc(100vh - 120px)", maxWidth: 960 }}
          />
        )}
        {ft === "image" && url && !imgError && (
          <img
            src={url}
            alt={label}
            className="rounded-xl shadow-2xl object-contain"
            style={{ maxHeight: "calc(100vh - 120px)", maxWidth: "100%" }}
            onError={() => setImgError(true)}
          />
        )}
        {(ft === "other" || (ft === "image" && imgError) || !url) && (
          <div className="text-center text-white space-y-4">
            <div className="w-20 h-20 rounded-2xl bg-white/10 flex items-center justify-center mx-auto">
              <FileText size={36} opacity={0.5} />
            </div>
            <p className="text-base opacity-70">Preview not available</p>
            {url && (
              <a
                href={url}
                download
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-white/15 hover:bg-white/25 rounded-xl text-sm font-semibold text-white transition-all"
              >
                <Download size={16} /> Download File
              </a>
            )}
          </div>
        )}
        {idx < docs.length - 1 && (
          <button
            onClick={() => setIdx((i) => i + 1)}
            className="absolute right-4 z-10 w-10 h-10 rounded-full bg-white/12 hover:bg-white/25 border border-white/15 flex items-center justify-center text-white transition-all"
          >
            <ChevronRight size={22} />
          </button>
        )}
      </div>

      {docs.length > 1 && (
        <div
          className="flex-shrink-0 flex items-center gap-2 px-5 py-3 overflow-x-auto"
          style={{ background: "rgba(0,0,0,0.65)" }}
        >
          {docs.map((d, i) => {
            // FIX: use the extracted key as cache key for thumbnail lookup
            const thumbKey = d.file_path ? extractS3Key(d.file_path) : null;
            const u = (thumbKey && presignedUrls[thumbKey]) || null;
            const ft2 = getFileType(
              d.file_path,
              d.mime_type || d.mimeType || "",
            );
            return (
              <button
                key={i}
                onClick={() => setIdx(i)}
                className="flex-shrink-0 w-14 h-14 rounded-lg overflow-hidden border-2 transition-all"
                style={{
                  borderColor: i === idx ? "#60a5fa" : "rgba(255,255,255,0.2)",
                  opacity: i === idx ? 1 : 0.5,
                  transform: i === idx ? "scale(1.1)" : "scale(1)",
                  background: "#1e293b",
                }}
              >
                {ft2 === "image" && u ? (
                  <img src={u} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <FileText size={18} color="#64748b" />
                  </div>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default DocLightbox;