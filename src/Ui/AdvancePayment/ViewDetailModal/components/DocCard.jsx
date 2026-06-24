// ─────────────────────────────────────────────────────────────────────────────
// FILE: src/Ui/AdvancePayment/ViewDetailModal/components/DocCard.jsx
// ─────────────────────────────────────────────────────────────────────────────
import { useState, useMemo, useEffect } from "react";
import { FileText, Maximize2 } from "lucide-react";
import DocViewer from "./DocViewer";
import { resolveFileUrl } from "../utils";

// DocCard thumbnail scales via Tailwind (w-20 sm:w-[120px]) already.
// Extra rules handle:
//  - ≤360px: tighter inner padding, smaller filename text, hide "View" label
//    even below sm (Tailwind's hidden sm:inline already hides it at <640px,
//    so this is a safety net for very small phones)
//  - 361–640px: moderate padding reduction
//  - 641–900px (tablet): comfortable mid-size layout, no changes needed beyond
//    what Tailwind already provides — kept as explicit no-op comment for clarity
const DOCCARD_RESPONSIVE_CSS = `
@media (max-width: 360px) {
  .ph-doccard-inner {
    padding: 9px 10px !important;
    gap: 8px !important;
  }
  .ph-doccard-name {
    font-size: 12px !important;
  }
  .ph-doccard-view-btn {
    padding: 6px 8px !important;
    font-size: 11px !important;
  }
  .ph-doccard-label {
    font-size: 9px !important;
  }
}
@media (min-width: 361px) and (max-width: 640px) {
  .ph-doccard-inner {
    padding: 10px 12px !important;
    gap: 10px !important;
  }
}
`;

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
      <style>{DOCCARD_RESPONSIVE_CSS}</style>
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
          {/* Thumbnail — scales between 80px (mobile) and 120px (sm+) */}
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
            {isImage && resolvedUrl && !imgError ? (
              <img
                src={resolvedUrl}
                alt={displayName}
                onError={() => setImgError(true)}
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
            ) : isPdf ? (
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
                {isPdf ? "PDF document" : isImage ? "Image file" : "Document"}
              </span>
            </div>
          </div>

          {/* View button */}
          {resolvedUrl ? (
            <button
              className="ph-doccard-view-btn"
              onClick={(e) => {
                e.stopPropagation();
                setOpen(true);
              }}
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
                flexShrink: 0,
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
