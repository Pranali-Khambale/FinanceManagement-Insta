import React, { useState, useEffect } from "react";
import PhotoUploadOverlay from "./PhotoUploadOverlay";

// ─────────────────────────────────────────────────────────────────────────────
// PhotoBox
//
// Uses the proxy URL (/api/employees/:id/photo) as the primary source.
// manualPhoto (freshly cropped data URL) always wins over the proxy URL.
// On error (e.g. employee has no photo yet), falls back to initials.
//
// The proxy URL never truly "expires" — each browser request hits the backend
// which issues a fresh S3 redirect on every load.
// ─────────────────────────────────────────────────────────────────────────────
const PhotoBox = ({
  photoProxyUrl, // /api/employees/:id/photo  — always fresh via backend redirect
  manualPhoto, // Just-cropped data URL — always takes priority
  firstName,
  onUpload,
  uploading,
  onEditClick,
  onPhotoMissing, // Called when proxy URL 404s (employee has no photo yet)
}) => {
  const [proxyFailed, setProxyFailed] = useState(false);

  // Reset failed state whenever the proxy URL changes (e.g. after upload)
  useEffect(() => {
    setProxyFailed(false);
  }, [photoProxyUrl]);

  // manualPhoto (fresh crop) always wins; then proxy; then initials
  const displayPhoto = manualPhoto || (!proxyFailed ? photoProxyUrl : null);

  return (
    <div
      className="photo-box"
      style={{
        width: 90,
        height: 108,
        border: "2px solid #aaa",
        borderRadius: 2,
        overflow: "hidden",
        background: "#f5f5f5",
        position: "relative",
      }}
    >
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        .photo-box:hover .photo-upload-overlay { opacity: 1 !important; }
      `}</style>

      {displayPhoto ? (
        <img
          key={displayPhoto}
          src={displayPhoto}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            display: "block",
          }}
          alt="Employee"
          onError={() => {
            if (manualPhoto) return; // data URL shouldn't fail; ignore
            setProxyFailed(true);
            if (onPhotoMissing) onPhotoMissing();
          }}
        />
      ) : (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            height: "100%",
            gap: 4,
          }}
        >
          <span style={{ fontSize: 28, fontWeight: "bold", color: "#bbb" }}>
            {(firstName?.[0] || "?").toUpperCase()}
          </span>
          <span
            style={{
              fontSize: 8,
              color: "#bbb",
              textAlign: "center",
              lineHeight: 1.3,
              padding: "0 4px",
            }}
          >
            Click to upload
          </span>
        </div>
      )}

      <PhotoUploadOverlay
        onUpload={onUpload}
        onEdit={onEditClick}
        uploading={uploading}
        hasPhoto={!!displayPhoto}
      />
    </div>
  );
};

export default PhotoBox;