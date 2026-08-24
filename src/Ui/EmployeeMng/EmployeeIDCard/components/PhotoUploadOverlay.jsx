import React from "react";
import { Upload, Move, Loader } from "lucide-react";

// ─────────────────────────────────────────────────────────────────────────────
// PhotoUploadOverlay
//
// Hover overlay shown on top of the PhotoBox with "Upload" and "Edit" actions.
// ─────────────────────────────────────────────────────────────────────────────
const PhotoUploadOverlay = ({ onUpload, onEdit, uploading, hasPhoto }) => (
  <div
    className="photo-upload-overlay"
    style={{
      position: "absolute",
      inset: 0,
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      background: "rgba(0,0,0,0.55)",
      color: "#fff",
      fontSize: 9,
      gap: 4,
      opacity: 0,
      transition: "opacity 0.2s",
      borderRadius: 2,
    }}
  >
    {uploading ? (
      <Loader size={14} style={{ animation: "spin 1s linear infinite" }} />
    ) : (
      <div style={{ display: "flex", gap: 10 }}>
        <label
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 2,
            cursor: "pointer",
          }}
        >
          <Upload size={13} />
          <span style={{ fontSize: 9 }}>Upload</span>
          <input
            type="file"
            accept="image/*"
            style={{ display: "none" }}
            onChange={onUpload}
          />
        </label>
        {hasPhoto && (
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onEdit();
            }}
            style={{
              background: "none",
              border: "none",
              color: "#fff",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 2,
              cursor: "pointer",
              padding: 0,
            }}
          >
            <Move size={13} />
            <span style={{ fontSize: 9 }}>Edit</span>
          </button>
        )}
      </div>
    )}
  </div>
);

export default PhotoUploadOverlay;