// ─────────────────────────────────────────────────────────────────────────────
// FILE: src/Ui/AdvancePayment/ViewDetailModal/components/DocViewer.jsx
// ─────────────────────────────────────────────────────────────────────────────
import { useState, useEffect } from "react";
import { X, FileText, FileImage, Download } from "lucide-react";

// DocViewer is a fullscreen overlay so almost everything is viewport-relative.
// Extra breakpoints needed:
//  - ≤360px: shrink top-bar height, icon size, filename, action buttons
//  - 361–480px: moderate height/gap reduction
//  - Touch devices: zoom controls are hidden at <sm already (className="hidden sm:flex")
//    so no extra rules needed for those; the bottom hint bar is already minimal.
const DOCVIEWER_RESPONSIVE_CSS = `
@media (max-width: 360px) {
  .ph-dv-topbar {
    height: 48px !important;
    padding: 0 8px !important;
    gap: 6px !important;
  }
  .ph-dv-file-icon {
    width: 26px !important;
    height: 26px !important;
  }
  .ph-dv-filename {
    font-size: 11px !important;
  }
  .ph-dv-dl-btn {
    height: 28px !important;
    padding: 0 7px !important;
    font-size: 11px !important;
    border-radius: 6px !important;
  }
  .ph-dv-close-btn {
    width: 28px !important;
    height: 28px !important;
    border-radius: 6px !important;
  }
  .ph-dv-doc-area {
    padding: 10px !important;
  }
}
@media (min-width: 361px) and (max-width: 480px) {
  .ph-dv-topbar {
    height: 52px !important;
    padding: 0 10px !important;
  }
  .ph-dv-filename {
    font-size: 12px !important;
  }
  .ph-dv-dl-btn {
    height: 30px !important;
    padding: 0 8px !important;
  }
  .ph-dv-close-btn {
    width: 30px !important;
    height: 30px !important;
  }
  .ph-dv-doc-area {
    padding: 12px !important;
  }
}
`;

export default function DocViewer({ src, name, onClose }) {
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
      <style>{DOCVIEWER_RESPONSIVE_CSS}</style>

      {/* ── Top bar ── */}
      <div
        className="ph-dv-topbar"
        style={{
          height: 56,
          flexShrink: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 12px",
          background: "rgba(15, 23, 42, 0.95)",
          borderBottom: "1px solid rgba(255,255,255,0.08)",
          gap: 8,
        }}
      >
        {/* File name */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            minWidth: 0,
            flex: 1,
          }}
        >
          <div
            className="ph-dv-file-icon"
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
            className="ph-dv-filename"
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

        {/* Zoom controls — images only, hidden on very small screens */}
        {!isPdf && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 2,
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: 8,
              padding: "2px 4px",
              flexShrink: 0,
            }}
            className="hidden sm:flex"
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

        {/* Actions */}
        <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
          <a
            href={src}
            download={name}
            target="_blank"
            rel="noreferrer"
            className="ph-dv-dl-btn"
            style={{
              height: 34,
              padding: "0 10px",
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
            }}
            title="Download"
          >
            <Download size={13} />
            <span className="hidden sm:inline">Download</span>
          </a>
          <button
            onClick={onClose}
            className="ph-dv-close-btn"
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
            }}
            title="Close (Esc)"
          >
            <X size={15} />
          </button>
        </div>
      </div>

      {/* ── Document area ── */}
      <div
        className="ph-dv-doc-area"
        style={{
          flex: 1,
          overflow: isPdf ? "hidden" : "auto",
          display: "flex",
          alignItems: isPdf ? "flex-start" : "center",
          justifyContent: "center",
          padding: isPdf ? 0 : "16px",
          background: isPdf
            ? "rgba(30, 41, 59, 0.5)"
            : "radial-gradient(ellipse at center, rgba(30,41,59,0.8) 0%, rgba(2,6,23,0.95) 100%)",
        }}
      >
        {isPdf ? (
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
                  minWidth: 120,
                  minHeight: 100,
                }}
              >
                <div
                  style={{
                    width: 32,
                    height: 32,
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
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 16,
                  padding: "32px 24px",
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
            height: 32,
            flexShrink: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "rgba(15,23,42,0.8)",
            borderTop: "1px solid rgba(255,255,255,0.05)",
          }}
        />
      )}
    </div>
  );
}
