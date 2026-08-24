import React, { useState, useEffect } from "react";
import {
  FileText,
  Download,
  ExternalLink,
  X as XIcon,
  ChevronLeft,
  ChevronRight,
  Loader,
} from "lucide-react";
import { DOC_TYPE_META } from "./constants";
import { getPresignedUrl, extractS3Key } from "@/utils/presignUtils";
import { getFileType } from "@/utils/fileUtils";
import { downloadFile, buildDownloadFilename } from "@/utils/downloadFile";

const DocLightbox = ({ docs, startIndex = 0, onClose }) => {
  const [idx, setIdx] = useState(startIndex);
  const [imgError, setImgError] = useState(false);
  const [presignedUrls, setPresignedUrls] = useState({});
  const [downloading, setDownloading] = useState(false);

  const doc = docs[idx];
  const mime = doc?.mime_type || doc?.mimeType || "";
  const cacheKey = doc?.file_path ? extractS3Key(doc.file_path) : null;
  const url = (cacheKey && presignedUrls[cacheKey]) || null;
  const ft = getFileType(doc?.file_path, mime);
  const meta = DOC_TYPE_META[doc?.document_type] || DOC_TYPE_META.other;
  const label = doc?._regLabel || meta.label;

  useEffect(() => {
    const unresolved = docs
      .map((d) => d?.file_path)
      .filter(Boolean)
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

  const handleDownload = async () => {
    if (!url || downloading) return;
    setDownloading(true);
    try {
      const filename = buildDownloadFilename(doc, label);
      await downloadFile(url, filename);
    } catch {
      window.open(url, "_blank", "noopener,noreferrer");
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[9999] flex flex-col"
      style={{ background: "rgba(0,0,0,0.93)" }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-3 py-2 sm:px-5 sm:py-3 flex-shrink-0 gap-2"
        style={{
          background: "rgba(15,23,42,0.97)",
          borderBottom: "1px solid rgba(255,255,255,0.08)",
        }}
      >
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <div
            className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ background: meta.bg }}
          >
            <FileText size={13} style={{ color: meta.text }} />
          </div>
          <div className="min-w-0">
            <p className="text-white font-semibold text-xs sm:text-sm truncate">
              {label}
            </p>
            <p className="text-blue-300 text-[10px] sm:text-xs">
              {idx + 1} / {docs.length}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 flex-shrink-0 flex-wrap justify-end">
          {url && (
            <>
              <button
                onClick={handleDownload}
                disabled={downloading}
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-lg text-xs font-medium border border-white/10 transition-all disabled:opacity-60 disabled:cursor-wait"
              >
                {downloading ? (
                  <Loader size={13} className="animate-spin" />
                ) : (
                  <Download size={13} />
                )}{" "}
                {downloading ? "Downloading…" : "Download"}
              </button>
              <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-lg text-xs font-medium border border-white/10 transition-all"
              >
                <ExternalLink size={13} /> Open
              </a>
              {/* Mobile icon-only */}
              <button
                onClick={handleDownload}
                disabled={downloading}
                className="sm:hidden w-8 h-8 flex items-center justify-center bg-white/10 hover:bg-white/20 text-white rounded-lg border border-white/10 transition-all disabled:opacity-60"
              >
                {downloading ? (
                  <Loader size={14} className="animate-spin" />
                ) : (
                  <Download size={14} />
                )}
              </button>
            </>
          )}
          <button
            onClick={onClose}
            className="flex items-center gap-1 sm:gap-1.5 px-2.5 py-1.5 sm:px-3 bg-white text-slate-900 rounded-lg text-xs font-bold hover:bg-blue-50 transition-all"
          >
            <XIcon size={13} /> <span className="hidden sm:inline">Close</span>
          </button>
        </div>
      </div>

      {/* Viewer */}
      <div className="flex-1 flex items-center justify-center relative p-3 sm:p-6 overflow-hidden">
        {idx > 0 && (
          <button
            onClick={() => setIdx((i) => i - 1)}
            className="absolute left-2 sm:left-4 z-10 w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-white/12 hover:bg-white/25 border border-white/15 flex items-center justify-center text-white transition-all"
          >
            <ChevronLeft size={18} />
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
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-white/10 flex items-center justify-center mx-auto">
              <FileText size={28} opacity={0.5} />
            </div>
            <p className="text-sm opacity-70">Preview not available</p>
            {url && (
              <button
                onClick={handleDownload}
                disabled={downloading}
                className="inline-flex items-center gap-2 px-4 py-2.5 sm:px-5 bg-white/15 hover:bg-white/25 rounded-xl text-sm font-semibold text-white transition-all disabled:opacity-60 disabled:cursor-wait"
              >
                {downloading ? (
                  <Loader size={16} className="animate-spin" />
                ) : (
                  <Download size={16} />
                )}{" "}
                {downloading ? "Downloading…" : "Download File"}
              </button>
            )}
          </div>
        )}
        {idx < docs.length - 1 && (
          <button
            onClick={() => setIdx((i) => i + 1)}
            className="absolute right-2 sm:right-4 z-10 w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-white/12 hover:bg-white/25 border border-white/15 flex items-center justify-center text-white transition-all"
          >
            <ChevronRight size={18} />
          </button>
        )}
      </div>

      {/* Thumbnails */}
      {docs.length > 1 && (
        <div
          className="flex-shrink-0 flex items-center gap-1.5 sm:gap-2 px-3 sm:px-5 py-2 sm:py-3 overflow-x-auto"
          style={{ background: "rgba(0,0,0,0.65)" }}
        >
          {docs.map((d, i) => {
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
                className="flex-shrink-0 w-11 h-11 sm:w-14 sm:h-14 rounded-lg overflow-hidden border-2 transition-all"
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
                    <FileText size={16} color="#64748b" />
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
