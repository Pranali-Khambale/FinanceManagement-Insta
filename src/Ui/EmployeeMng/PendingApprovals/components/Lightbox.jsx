import React, { useState, useEffect } from "react";
import {
  FileText,
  Download,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Loader,
  X as XIcon,
} from "lucide-react";
import { getDocUrl } from "../../../../utils/presignCache";
import { getFileType } from "../../../../utils/docUtils";

/** Full-screen lightbox for registration-form document previews. */
const Lightbox = ({ docs, startIndex = 0, onClose }) => {
  const [idx, setIdx] = useState(startIndex);
  const [imgError, setImgError] = useState(false);
  const [resolvedUrl, setResolvedUrl] = useState(null);

  const doc = docs[idx];
  const rawPath = doc?.path;
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

  if (
    !url &&
    rawPath &&
    !rawPath.startsWith("http") &&
    !rawPath.startsWith("/")
  ) {
    return (
      <div
        className="fixed inset-0 z-[300] flex items-center justify-center"
        style={{ background: "rgba(0,0,0,0.92)" }}
      >
        <Loader className="w-8 h-8 text-blue-300 animate-spin" />
      </div>
    );
  }
  if (!url) return null;

  return (
    <div
      className="fixed inset-0 z-[300] flex flex-col"
      style={{ background: "rgba(0,0,0,0.92)" }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-3 sm:px-6 py-3 flex-shrink-0 gap-2"
        style={{ background: "linear-gradient(90deg,#1e3a5f,#1d4ed8)" }}
      >
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <FileText className="w-4 h-4 sm:w-5 sm:h-5 text-white/80 flex-shrink-0" />
          <div className="min-w-0">
            <p className="text-white font-semibold text-xs sm:text-sm truncate">
              {doc?.label}
            </p>
            <p className="text-blue-200 text-[10px] sm:text-xs">
              {idx + 1} of {docs.length} documents
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
          <a
            href={url}
            download
            target="_blank"
            rel="noopener noreferrer"
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-white/15 hover:bg-white/25 text-white rounded-lg text-xs font-medium"
          >
            <Download className="w-3.5 h-3.5" /> Download
          </a>
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1.5 bg-white/15 hover:bg-white/25 text-white rounded-lg text-xs font-medium"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Open Tab</span>
          </a>
          <button
            onClick={onClose}
            className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1.5 bg-white text-blue-900 rounded-lg text-xs font-semibold hover:bg-blue-50 ml-1"
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
            className="absolute left-2 sm:left-4 z-10 w-9 h-9 sm:w-11 sm:h-11 bg-white/20 hover:bg-white/40 rounded-full flex items-center justify-center text-white"
          >
            <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
        )}

        {fileType === "pdf" && (
          <iframe
            src={url}
            title={doc?.label}
            className="w-full rounded-xl shadow-2xl bg-white"
            style={{ height: "calc(100dvh - 130px)", maxWidth: "960px" }}
          />
        )}
        {fileType === "image" && !imgError && (
          <img
            src={url}
            alt={doc?.label}
            className="rounded-xl shadow-2xl object-contain"
            style={{ maxHeight: "calc(100dvh - 130px)", maxWidth: "100%" }}
            onError={() => setImgError(true)}
          />
        )}
        {(fileType === "other" || (fileType === "image" && imgError)) && (
          <div className="text-center text-white space-y-4 px-4">
            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-white/10 rounded-2xl flex items-center justify-center mx-auto">
              <FileText className="w-8 h-8 sm:w-10 sm:h-10 opacity-60" />
            </div>
            <p className="text-base sm:text-lg font-semibold opacity-80">
              Preview not available
            </p>
            <a
              href={url}
              download
              className="inline-flex items-center gap-2 px-4 sm:px-5 py-2.5 bg-white/15 hover:bg-white/25 rounded-xl text-sm font-semibold"
            >
              <Download className="w-4 h-4" /> Download
            </a>
          </div>
        )}

        {idx < docs.length - 1 && (
          <button
            onClick={() => setIdx((i) => i + 1)}
            className="absolute right-2 sm:right-4 z-10 w-9 h-9 sm:w-11 sm:h-11 bg-white/20 hover:bg-white/40 rounded-full flex items-center justify-center text-white"
          >
            <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
        )}
      </div>
    </div>
  );
};

export default Lightbox;
