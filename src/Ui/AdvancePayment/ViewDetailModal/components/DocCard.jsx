// ─────────────────────────────────────────────────────────────────────────────
// FILE: src/Ui/AdvancePayment/ViewDetailModal/components/DocCard.jsx
// ─────────────────────────────────────────────────────────────────────────────
import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import {
  FileText,
  Maximize2,
  Download,
  Loader,
  X,
  ZoomIn,
  ZoomOut,
  RotateCcw,
} from "lucide-react";
import {
  resolveFileUrl,
  triggerDownload,
  buildDownloadFilename,
} from "../utils";

const DOCCARD_CSS = `
/* ── DocCard responsive ── */
@media (max-width: 360px) {
  .ph-doccard-inner     { padding: 9px 10px !important; gap: 8px !important; }
  .ph-doccard-name      { font-size: 12px !important; }
  .ph-doccard-view-btn  { padding: 6px 8px !important; font-size: 11px !important; }
  .ph-doccard-label     { font-size: 9px !important; }
}
@media (min-width: 361px) and (max-width: 640px) {
  .ph-doccard-inner { padding: 10px 12px !important; gap: 10px !important; }
}

/* ── Lightbox overlay ── */
.ph-lb-overlay {
  position: fixed;
  inset: 0;
  z-index: 99999;
  display: flex;
  flex-direction: column;
  background: rgba(2,6,23,0.97);
  /* Ensure it covers the full screen including safe areas */
  padding-top: env(safe-area-inset-top);
  padding-bottom: env(safe-area-inset-bottom);
}

/* top bar */
.ph-lb-bar {
  flex-shrink: 0;
  height: 52px;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 0 14px;
  background: rgba(15,23,42,0.98);
  border-bottom: 1px solid rgba(255,255,255,0.08);
  z-index: 1;
}
.ph-lb-name {
  flex: 1;
  min-width: 0;
  font-size: 13px;
  font-weight: 600;
  color: rgba(255,255,255,0.88);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* zoom pill */
.ph-lb-zoom {
  display: flex;
  align-items: center;
  gap: 2px;
  background: rgba(255,255,255,0.05);
  border: 1px solid rgba(255,255,255,0.1);
  border-radius: 8px;
  padding: 2px 3px;
  flex-shrink: 0;
}
.ph-lb-zbtn {
  width: 28px; height: 28px;
  border-radius: 6px;
  border: none;
  background: transparent;
  color: rgba(255,255,255,0.7);
  cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  transition: background 0.12s;
}
.ph-lb-zbtn:hover   { background: rgba(255,255,255,0.08); }
.ph-lb-zbtn:disabled{ color: rgba(255,255,255,0.2); cursor: not-allowed; }
.ph-lb-zpct {
  min-width: 42px;
  height: 28px;
  padding: 0 6px;
  border: none;
  background: transparent;
  color: rgba(255,255,255,0.55);
  font-size: 11px; font-weight: 700;
  cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  user-select: none;
}

/* action icon buttons */
.ph-lb-actions { display: flex; gap: 6px; flex-shrink: 0; }
.ph-lb-btn {
  width: 34px; height: 34px;
  border-radius: 8px;
  border: 1px solid rgba(255,255,255,0.13);
  background: rgba(255,255,255,0.06);
  color: rgba(255,255,255,0.75);
  display: flex; align-items: center; justify-content: center;
  cursor: pointer;
  text-decoration: none;
  transition: background 0.15s;
  flex-shrink: 0;
}
.ph-lb-btn:hover { background: rgba(255,255,255,0.13); }
.ph-lb-btn-close {
  background: rgba(239,68,68,0.12);
  border-color: rgba(239,68,68,0.25);
  color: rgba(252,165,165,0.9);
}
.ph-lb-btn-close:hover { background: rgba(239,68,68,0.22); }

/* body — the scrollable canvas */
.ph-lb-body {
  flex: 1;
  /* Allow scrolling in both directions when zoomed */
  overflow: auto;
  /* Use a simple flex centering; when image is larger than viewport
     the overflow-auto lets user scroll */
  display: flex;
  align-items: center;
  justify-content: center;
  /* background subtly different from bar */
  background: rgba(2,6,23,0.97);
  /* Padding so image never sticks to edges */
  padding: 16px;
  box-sizing: border-box;
  position: relative;
}
.ph-lb-body.is-pdf {
  overflow: hidden;
  padding: 0;
  align-items: stretch;
  justify-content: stretch;
}

/* spinner */
.ph-lb-spin-wrap {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  position: absolute;
  inset: 0;
  pointer-events: none;
}
.ph-lb-spinner {
  width: 36px; height: 36px;
  border-radius: 50%;
  border: 3px solid rgba(99,102,241,0.2);
  border-top-color: #818CF8;
  animation: ph-lb-spin 0.7s linear infinite;
}
@keyframes ph-lb-spin { to { transform: rotate(360deg); } }

/* error box */
.ph-lb-error {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  padding: 32px 24px;
  border-radius: 14px;
  background: rgba(255,255,255,0.03);
  border: 1px solid rgba(255,255,255,0.07);
  color: rgba(255,255,255,0.45);
  text-align: center;
  max-width: 320px;
}
.ph-lb-error-title { color: rgba(255,255,255,0.75); font-size:15px; font-weight:700; margin:0; }
.ph-lb-error-sub   { font-size:12px; margin:0; }

/* 
  KEY FIX: The image wrapper.
  At zoom=1, image fills as much space as possible (fit-inside the viewport).
  When zoomed > 1, the image grows beyond the body and the body scrolls.
  We achieve this with a wrapper that has explicit pixel dimensions set via JS,
  so the image can actually overflow and be scrolled to.
*/
.ph-lb-img-wrap {
  display: flex;
  align-items: center;
  justify-content: center;
  /* transition for smooth zoom */
  transition: width 0.18s ease, height 0.18s ease;
}

/* The image itself: fills its wrapper, respects aspect ratio */
.ph-lb-img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: contain;
  border-radius: 6px;
  box-shadow: 0 8px 40px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.06);
  /* We do NOT put transitions here — the wrapper handles it */
}

/* pdf iframe */
.ph-lb-iframe {
  width: 100%;
  height: 100%;
  border: none;
  display: block;
}

/* Fit-to-screen hint badge */
.ph-lb-hint {
  position: absolute;
  bottom: 14px;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(0,0,0,0.55);
  color: rgba(255,255,255,0.6);
  font-size: 11px;
  padding: 5px 12px;
  border-radius: 99px;
  pointer-events: none;
  white-space: nowrap;
  opacity: 1;
  transition: opacity 0.4s;
}
.ph-lb-hint.fade { opacity: 0; }

/* responsive */
@media (max-width: 640px) {
  .ph-lb-bar   { height: 48px; padding: 0 10px; gap: 6px; }
  .ph-lb-name  { font-size: 12px; }
  .ph-lb-zoom  { gap: 0; }
  .ph-lb-zbtn  { width: 26px; height: 26px; }
  .ph-lb-zpct  { min-width: 36px; font-size: 10px; }
  .ph-lb-body  { padding: 8px; }
}
@media (max-width: 360px) {
  .ph-lb-bar  { height: 44px; padding: 0 8px; }
  .ph-lb-name { font-size: 11px; }
  .ph-lb-btn  { width: 30px; height: 30px; }
  .ph-lb-zoom { display: none; }
}
@media (min-width: 1024px) {
  .ph-lb-bar  { height: 56px; padding: 0 20px; }
  .ph-lb-body { padding: 24px; }
}
`;

// ── helpers ──────────────────────────────────────────────────────────────────
function isImageName(n) {
  return n && /\.(png|jpe?g|webp|gif|bmp|svg|avif)$/i.test(n);
}
function isPdfName(n) {
  return n && /\.pdf$/i.test(n);
}
function sniffType(name, url) {
  const base = url ? url.split("?")[0] : "";
  if (isImageName(name) || isImageName(base)) return "image";
  if (isPdfName(name) || isPdfName(base)) return "pdf";
  return "unknown";
}

// ── InlineLightbox ────────────────────────────────────────────────────────────
function InlineLightbox({ src, name, onClose, onDownload }) {
  const kind = sniffType(name, src);
  const isImg = kind === "image";
  const isPdf = kind === "pdf";

  const ZOOM_STEP = 0.25;
  const ZOOM_MIN = 0.5;
  const ZOOM_MAX = 4;

  const [zoom, setZoom] = useState(1);
  const [loading, setLoading] = useState(true);
  const [imgError, setImgError] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [hintFade, setHintFade] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const bodyRef = useRef(null);
  const imgRef = useRef(null);
  const hintTimer = useRef(null);

  // ── natural image dimensions ──
  const [naturalW, setNaturalH] = useState(0);
  const [naturalH, setNaturalW] = useState(0);

  // ── body dimensions (to compute fit size) ──
  const [bodySize, setBodySize] = useState({ w: 0, h: 0 });

  useEffect(() => {
    if (!bodyRef.current) return;
    const ro = new ResizeObserver((entries) => {
      for (const e of entries) {
        const { width, height } = e.contentRect;
        setBodySize({ w: width, h: height });
      }
    });
    ro.observe(bodyRef.current);
    return () => ro.disconnect();
  }, []);

  // "fit" size: largest size that fits inside the body with correct aspect ratio
  const fitSize = useMemo(() => {
    if (!naturalW || !naturalH || !bodySize.w || !bodySize.h) {
      return { w: bodySize.w || 300, h: bodySize.h || 300 };
    }
    const pad = 32; // 16px each side
    const maxW = bodySize.w - pad;
    const maxH = bodySize.h - pad;
    const ratio = naturalW / naturalH;
    let w = maxW,
      h = maxW / ratio;
    if (h > maxH) {
      h = maxH;
      w = maxH * ratio;
    }
    return { w: Math.round(w), h: Math.round(h) };
  }, [naturalW, naturalH, bodySize]);

  // actual rendered wrapper size
  const wrapW = Math.round(fitSize.w * zoom);
  const wrapH = Math.round(fitSize.h * zoom);

  const zoomIn = useCallback(
    () => setZoom((z) => Math.min(+(z + ZOOM_STEP).toFixed(2), ZOOM_MAX)),
    [],
  );
  const zoomOut = useCallback(
    () => setZoom((z) => Math.max(+(z - ZOOM_STEP).toFixed(2), ZOOM_MIN)),
    [],
  );
  const resetZ = useCallback(() => setZoom(1), []);

  // show hint for a moment after load
  const triggerHint = useCallback(() => {
    clearTimeout(hintTimer.current);
    setShowHint(true);
    setHintFade(false);
    hintTimer.current = setTimeout(() => {
      setHintFade(true);
      hintTimer.current = setTimeout(() => setShowHint(false), 400);
    }, 2000);
  }, []);

  // keyboard shortcuts
  useEffect(() => {
    const handler = (e) => {
      if (e.key === "Escape") {
        onClose();
        return;
      }
      if (!isImg) return;
      if (e.key === "+" || e.key === "=") {
        e.preventDefault();
        zoomIn();
      }
      if (e.key === "-") {
        e.preventDefault();
        zoomOut();
      }
      if (e.key === "0") {
        e.preventDefault();
        resetZ();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose, isImg, zoomIn, zoomOut, resetZ]);

  // cached-image detection
  useEffect(() => {
    if (!isImg) return;
    const img = imgRef.current;
    if (img && img.complete && img.naturalWidth > 0) {
      setLoading(false);
      setNaturalH(img.naturalWidth);
      setNaturalW(img.naturalHeight);
      triggerHint();
    }
  }, [isImg, triggerHint]);

  // prevent body scroll while lightbox is open
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  const handleImgLoad = (e) => {
    setLoading(false);
    setNaturalH(e.currentTarget.naturalWidth);
    setNaturalW(e.currentTarget.naturalHeight);
    triggerHint();
  };

  const handleDownload = async (e) => {
    e?.stopPropagation();
    if (!onDownload || downloading) return;
    setDownloading(true);
    try {
      await onDownload();
    } finally {
      setDownloading(false);
    }
  };

  const pct = Math.round(zoom * 100);

  return (
    <div className="ph-lb-overlay">
      {/* ── top bar ── */}
      <div className="ph-lb-bar">
        <span className="ph-lb-name" title={name || "Document"}>
          {name || "Document"}
        </span>

        {isImg && (
          <div className="ph-lb-zoom">
            <button
              className="ph-lb-zbtn"
              onClick={zoomOut}
              disabled={zoom <= ZOOM_MIN}
              title="Zoom out (−)"
            >
              <ZoomOut size={13} />
            </button>
            <button
              className="ph-lb-zpct"
              onClick={resetZ}
              title="Reset zoom (0)"
            >
              {pct}%
            </button>
            <button
              className="ph-lb-zbtn"
              onClick={zoomIn}
              disabled={zoom >= ZOOM_MAX}
              title="Zoom in (+)"
            >
              <ZoomIn size={13} />
            </button>
          </div>
        )}

        <div className="ph-lb-actions">
          {isImg && (
            <button
              className="ph-lb-btn"
              onClick={resetZ}
              title="Fit to screen"
            >
              <RotateCcw size={13} />
            </button>
          )}
          <button
            className="ph-lb-btn"
            onClick={handleDownload}
            disabled={downloading}
            title="Download"
          >
            {downloading ? (
              <Loader size={14} className="animate-spin" />
            ) : (
              <Download size={14} />
            )}
          </button>
          <button
            className="ph-lb-btn ph-lb-btn-close"
            onClick={onClose}
            title="Close (Esc)"
          >
            <X size={14} />
          </button>
        </div>
      </div>

      {/* ── body ── */}
      <div
        ref={bodyRef}
        className={`ph-lb-body${isPdf ? " is-pdf" : ""}`}
        /* Clicking the bare background (not the image) closes the lightbox */
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose();
        }}
      >
        {/* PDF — fills 100% of body */}
        {isPdf && (
          <>
            {loading && (
              <div className="ph-lb-spin-wrap">
                <div className="ph-lb-spinner" />
              </div>
            )}
            <iframe
              src={src}
              title={name}
              className="ph-lb-iframe"
              onLoad={() => setLoading(false)}
            />
          </>
        )}

        {/* Image */}
        {isImg && !imgError && (
          <>
            {loading && (
              <div className="ph-lb-spin-wrap">
                <div className="ph-lb-spinner" />
              </div>
            )}
            {/*
              CORE FIX:
              The wrapper has explicit pixel dimensions = fitSize * zoom.
              When zoom=1 it fits exactly inside body (no scrollbar needed).
              When zoom>1 it grows beyond the body and the body's overflow:auto
              shows scrollbars so the user can pan around.
              The image inside is width/height 100% of the wrapper.
            */}
            <div
              className="ph-lb-img-wrap"
              style={{
                width: wrapW,
                height: wrapH,
                minWidth: wrapW,
                minHeight: wrapH,
                opacity: loading ? 0 : 1,
                transition: "opacity 0.2s ease",
                cursor: zoom < ZOOM_MAX ? "zoom-in" : "zoom-out",
              }}
              onClick={() => (zoom < ZOOM_MAX ? zoomIn() : resetZ())}
            >
              <img
                ref={imgRef}
                src={src}
                alt={name || "image"}
                className="ph-lb-img"
                draggable={false}
                onLoad={handleImgLoad}
                onError={() => {
                  setLoading(false);
                  setImgError(true);
                }}
              />
            </div>
          </>
        )}

        {/* Unknown or image-error fallback */}
        {(imgError || kind === "unknown") && (
          <div className="ph-lb-error">
            <FileText size={44} strokeWidth={1} color="rgba(255,255,255,0.3)" />
            <p className="ph-lb-error-title">Cannot preview this file</p>
            <p className="ph-lb-error-sub">
              Use the download button above to save it.
            </p>
            <button
              className="ph-lb-btn"
              disabled={downloading}
              style={{
                width: "auto",
                padding: "9px 18px",
                borderRadius: 9,
                background: "rgba(99,102,241,0.15)",
                borderColor: "rgba(99,102,241,0.3)",
                color: "#818CF8",
                fontSize: 13,
                fontWeight: 700,
              }}
              onClick={handleDownload}
            >
              {downloading ? "Downloading…" : "Download file"}
            </button>
          </div>
        )}

        {/* Zoom hint */}
        {isImg && showHint && !loading && (
          <div className={`ph-lb-hint${hintFade ? " fade" : ""}`}>
            Click image to zoom · Scroll to pan · Esc to close
          </div>
        )}
      </div>
    </div>
  );
}

// ── DocCard ───────────────────────────────────────────────────────────────────
export default function DocCard({
  label,
  name,
  url: urlProp,
  filePath,
  file,
  pt,
  badge,
}) {
  const [open, setOpen] = useState(false);
  const [imgError, setImgError] = useState(false);
  const [downloading, setDownloading] = useState(false);

  // blob URL for local File objects
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

  // async-resolve S3 pre-signed URL
  const [resolvedUrl, setResolvedUrl] = useState(null);
  const [resolving, setResolving] = useState(false);

  useEffect(() => {
    setResolvedUrl(null);
    setImgError(false);

    if (blobUrl) {
      setResolvedUrl(blobUrl);
      return;
    }

    if (urlProp) {
      setResolving(true);
      resolveFileUrl(urlProp)
        .then((url) => setResolvedUrl(url || null))
        .finally(() => setResolving(false));
      return;
    }

    if (filePath) {
      setResolving(true);
      resolveFileUrl(filePath)
        .then((url) => setResolvedUrl(url || null))
        .finally(() => setResolving(false));
    }
  }, [urlProp, blobUrl, filePath]);

  const displayName =
    name || file?.name || (filePath ? filePath.split(/[\\/]/).pop() : null);

  const kind = sniffType(displayName, resolvedUrl);
  const resolvedIsImg = kind === "image";
  const resolvedIsPdf = kind === "pdf";

  if (!displayName && !resolvedUrl && !resolving) return null;

  const handleDownload = async (e) => {
    e?.stopPropagation();
    if (downloading) return;
    const filename = buildDownloadFilename(
      displayName,
      resolvedUrl,
      label || "document",
    );

    // Local (not-yet-uploaded) File — blobUrl is already a same-origin blob:
    // URL, so a plain download click works with no server round-trip.
    if (blobUrl) {
      triggerDownload(blobUrl, filename);
      return;
    }

    const rawSource = urlProp || filePath;
    if (!rawSource) return;

    setDownloading(true);
    try {
      // Request a FRESH presigned URL that includes the filename — this is
      // what makes S3 send Content-Disposition: attachment, so the browser
      // actually saves the file instead of opening it in a new tab. (The
      // `resolvedUrl` used for preview does NOT have this header, since we
      // want that one to display inline.)
      const dlUrl = await resolveFileUrl(rawSource, { filename });
      if (!dlUrl) throw new Error("Could not get download URL");
      triggerDownload(dlUrl, filename);
    } catch {
      // Fallback: at least open the preview URL so the user can save manually
      if (resolvedUrl)
        window.open(resolvedUrl, "_blank", "noopener,noreferrer");
    } finally {
      setDownloading(false);
    }
  };

  return (
    <>
      <style>{DOCCARD_CSS}</style>

      <div>
        <p className="ph-doccard-label text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2.5">
          {label}
        </p>

        <div
          className="ph-doccard-inner"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            padding: "12px 14px",
            borderRadius: 12,
            border: `1px solid ${pt.borderColor}`,
            background: pt.lightBg,
            cursor: resolvedUrl ? "pointer" : "default",
            transition: "box-shadow 0.15s",
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
              borderRadius: 10,
              overflow: "hidden",
              flexShrink: 0,
              background: "rgba(255,255,255,0.8)",
              border: `1px solid ${pt.borderColor}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
            className="w-20 h-20 sm:w-[120px] sm:h-[120px]"
          >
            {resolving ? (
              <Loader size={22} color={pt.color} className="animate-spin" />
            ) : resolvedIsImg && resolvedUrl && !imgError ? (
              <img
                src={resolvedUrl}
                alt={displayName}
                onError={() => setImgError(true)}
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
            ) : resolvedIsPdf ? (
              <svg
                width="32"
                height="32"
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
              <FileText size={30} color={pt.color} />
            )}
          </div>

          {/* Name + type */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <p
              className="ph-doccard-name"
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
                flexWrap: "wrap",
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
                {resolvedIsPdf
                  ? "PDF document"
                  : resolvedIsImg
                    ? "Image file"
                    : "Document"}
              </span>
            </div>
          </div>

          {/* Buttons */}
          {resolving ? (
            <span style={{ fontSize: 11, color: "#94a3b8", flexShrink: 0 }}>
              Loading…
            </span>
          ) : resolvedUrl ? (
            <div
              style={{ display: "flex", gap: 6, flexShrink: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* View */}
              <button
                className="ph-doccard-view-btn"
                onClick={() => setOpen(true)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 5,
                  padding: "7px 12px",
                  borderRadius: 9,
                  border: `1.5px solid ${pt.color}55`,
                  background: "#fff",
                  color: pt.color,
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: "pointer",
                  boxShadow: `0 2px 8px ${pt.color}15`,
                  whiteSpace: "nowrap",
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
                <Maximize2 size={12} />
                <span className="hidden sm:inline">View</span>
              </button>

              {/* Download */}
              <button
                onClick={handleDownload}
                disabled={downloading}
                title="Download"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 5,
                  padding: "7px 12px",
                  borderRadius: 9,
                  border: `1.5px solid ${pt.color}55`,
                  background: "#fff",
                  color: pt.color,
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: downloading ? "wait" : "pointer",
                  opacity: downloading ? 0.7 : 1,
                  boxShadow: `0 2px 8px ${pt.color}15`,
                  whiteSpace: "nowrap",
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
                {downloading ? (
                  <Loader size={12} className="animate-spin" />
                ) : (
                  <Download size={12} />
                )}
                <span className="hidden sm:inline">
                  {downloading ? "Downloading…" : "Download"}
                </span>
              </button>
            </div>
          ) : (
            <span style={{ fontSize: 11, color: "#94a3b8", flexShrink: 0 }}>
              No file
            </span>
          )}
        </div>
      </div>

      {open && resolvedUrl && (
        <InlineLightbox
          src={resolvedUrl}
          name={displayName}
          onClose={() => setOpen(false)}
          onDownload={handleDownload}
        />
      )}
    </>
  );
}
