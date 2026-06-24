import React, { useState, useEffect } from "react";
import {
  Download,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  FileText,
  Loader,
  X as XIcon,
} from "lucide-react";
import { getDocUrl, fullUrl } from "../../../../utils/presignCache";
import { getFileType } from "../../../../utils/docUtils";
import { DOC_META } from "../../../../utils/docUtils";

/** Full-screen lightbox for submitted documents (signed KYE, BGV, screenshot). */
const DocLightbox = ({ docs, startIndex = 0, onClose }) => {
  const [idx, setIdx] = useState(startIndex);
  const [imgError, setImgError] = useState(false);
  const [resolvedUrl, setResolvedUrl] = useState(null);

  const doc = docs[idx];
  const rawPath = doc?.file_path || doc?.path;
  const fileType = getFileType(rawPath, doc?.mime_type);

  useEffect(() => {
    setImgError(false);
    setResolvedUrl(null);
    getDocUrl(rawPath).then(setResolvedUrl);
  }, [idx, rawPath]);

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

  const url = resolvedUrl;

  // Spinner while presigning
  if (
    !url &&
    rawPath &&
    !rawPath.startsWith("http") &&
    !rawPath.startsWith("/")
  ) {
    return (
      <div
        className="fixed inset-0 z-[400] flex items-center justify-center"
        style={{ background: "rgba(0,0,0,0.93)" }}
      >
        <Loader className="w-8 h-8 text-blue-300 animate-spin" />
      </div>
    );
  }
  if (!url) return null;

  const meta = DOC_META[doc?.document_type] || DOC_META.other;

  return (
    <div
      className="fixed inset-0 z-[400] flex flex-col"
      style={{ background: "rgba(0,0,0,0.95)" }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-3 sm:px-6 py-3 flex-shrink-0 gap-2"
        style={{ background: "linear-gradient(90deg,#0f172a,#1e3a5f)" }}
      >
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <div
            className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ background: meta.color.bg }}
          >
            <FileText
              className="w-3.5 h-3.5 sm:w-4 sm:h-4"
              style={{ color: meta.color.text }}
            />
          </div>
          <div className="min-w-0">
            <p className="text-white font-semibold text-xs sm:text-sm truncate">
              {meta.label}
            </p>
            <p className="text-blue-300 text-[10px] sm:text-xs">
              {idx + 1} of {docs.length}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
          <a
            href={url}
            download
            target="_blank"
            rel="noopener noreferrer"
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-lg text-xs font-medium border border-white/10"
          >
            <Download className="w-3.5 h-3.5" /> Download
          </a>
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-lg text-xs font-medium border border-white/10"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Open</span>
          </a>
          <button
            onClick={onClose}
            className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1.5 bg-white text-slate-900 rounded-lg text-xs font-bold hover:bg-blue-50 ml-1"
          >
            <XIcon className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Close</span>
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex items-center justify-center relative overflow-hidden p-3 sm:p-6">
        {idx > 0 && (
          <button
            onClick={() => setIdx((i) => i - 1)}
            className="absolute left-2 sm:left-4 z-10 w-9 h-9 sm:w-11 sm:h-11 bg-white/10 hover:bg-white/25 rounded-full flex items-center justify-center text-white border border-white/10"
          >
            <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
        )}

        {fileType === "pdf" && (
          <iframe
            src={url}
            title={meta.label}
            className="w-full rounded-xl shadow-2xl bg-white"
            style={{ height: "calc(100dvh - 130px)", maxWidth: "960px" }}
          />
        )}
        {fileType === "image" && !imgError && (
          <img
            src={url}
            alt={meta.label}
            className="rounded-xl shadow-2xl object-contain"
            style={{ maxHeight: "calc(100dvh - 130px)", maxWidth: "100%" }}
            onError={() => setImgError(true)}
          />
        )}
        {(fileType === "other" || (fileType === "image" && imgError)) && (
          <div className="text-center text-white space-y-4 px-4">
            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-white/10 rounded-2xl flex items-center justify-center mx-auto">
              <FileText className="w-8 h-8 sm:w-10 sm:h-10 opacity-50" />
            </div>
            <p className="text-base sm:text-lg font-semibold opacity-70">
              Preview not available
            </p>
            <a
              href={url}
              download
              className="inline-flex items-center gap-2 px-4 sm:px-5 py-2.5 bg-white/15 hover:bg-white/25 rounded-xl text-sm font-semibold"
            >
              <Download className="w-4 h-4" /> Download File
            </a>
          </div>
        )}

        {idx < docs.length - 1 && (
          <button
            onClick={() => setIdx((i) => i + 1)}
            className="absolute right-2 sm:right-4 z-10 w-9 h-9 sm:w-11 sm:h-11 bg-white/10 hover:bg-white/25 rounded-full flex items-center justify-center text-white border border-white/10"
          >
            <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
        )}
      </div>

      {/* Thumbnail strip */}
      {docs.length > 1 && (
        <div
          className="flex-shrink-0 flex items-center gap-2 px-4 py-2 overflow-x-auto"
          style={{ background: "rgba(0,0,0,0.7)" }}
        >
          {docs.map((d, i) => {
            const m = DOC_META[d.document_type] || DOC_META.other;
            const thumbUrl = fullUrl(d.file_path || d.path);
            const ft = getFileType(d.file_path || d.path, d.mime_type);
            return (
              <button
                key={i}
                onClick={() => setIdx(i)}
                className={`flex-shrink-0 w-12 h-12 sm:w-16 sm:h-16 rounded-lg overflow-hidden border-2 transition-all ${
                  i === idx
                    ? "border-blue-400 scale-110"
                    : "border-white/20 opacity-50 hover:opacity-80"
                }`}
              >
                {ft === "image" && thumbUrl ? (
                  <img
                    src={thumbUrl}
                    alt=""
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.style.display = "none";
                    }}
                  />
                ) : (
                  <div className="w-full h-full bg-slate-800 flex items-center justify-center">
                    <FileText className="w-4 h-4 text-slate-400" />
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
