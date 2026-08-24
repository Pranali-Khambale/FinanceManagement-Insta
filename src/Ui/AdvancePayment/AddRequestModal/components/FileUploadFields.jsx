import { useState, useEffect } from "react";
import { Upload, CheckCircle2, FileImage, AlertCircle } from "lucide-react";

export function ScreenshotUpload({
  pt,
  screenshotName,
  screenshotPreview,
  errors,
  onChange,
}) {
  const [isMobile, setIsMobile] = useState(
    typeof window !== "undefined" && window.innerWidth <= 480,
  );
  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth <= 480);
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, []);

  return (
    <div>
      <p
        style={{
          margin: "0 0 6px",
          fontSize: 11,
          fontWeight: 700,
          color: "#64748b",
          textTransform: "uppercase",
          letterSpacing: ".06em",
          display: "flex",
          alignItems: "center",
          gap: 6,
          flexWrap: "wrap",
        }}
      >
        Payment screenshot <span style={{ color: "#ef4444" }}>*</span>
        <span
          style={{
            padding: "2px 7px",
            borderRadius: 99,
            fontSize: 9,
            fontWeight: 700,
            background: pt.color + "15",
            color: pt.color,
            textTransform: "uppercase",
            letterSpacing: ".06em",
          }}
        >
          Mandatory
        </span>
      </p>
      <label
        style={{
          display: "flex",
          alignItems: "center",
          gap: isMobile ? 8 : 12,
          padding: isMobile ? "10px 10px" : "12px 14px",
          borderRadius: 10,
          border: `1.5px ${screenshotName ? "solid" : "dashed"} ${errors.screenshot ? "#fca5a5" : screenshotName ? pt.color : "#cbd5e1"}`,
          background: screenshotName ? pt.color + "08" : "#fafafa",
          cursor: "pointer",
          transition: "all 0.15s",
        }}
      >
        {screenshotPreview ? (
          <img
            src={screenshotPreview}
            alt=""
            style={{
              width: isMobile ? 38 : 48,
              height: isMobile ? 38 : 48,
              borderRadius: 8,
              objectFit: "cover",
              flexShrink: 0,
              border: `1.5px solid ${pt.color}44`,
            }}
          />
        ) : (
          <div
            style={{
              width: isMobile ? 34 : 40,
              height: isMobile ? 34 : 40,
              borderRadius: 9,
              background: errors.screenshot ? "#fef2f2" : "#f1f5f9",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <FileImage
              size={isMobile ? 15 : 18}
              color={errors.screenshot ? "#ef4444" : "#94a3b8"}
            />
          </div>
        )}
        <div style={{ flex: 1, minWidth: 0 }}>
          {screenshotName ? (
            <>
              <p
                style={{
                  margin: 0,
                  fontSize: 12,
                  fontWeight: 700,
                  color: pt.color,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {screenshotName}
              </p>
              <p style={{ margin: "2px 0 0", fontSize: 11, color: "#64748b" }}>
                Screenshot attached · tap to change
              </p>
            </>
          ) : (
            <>
              <p
                style={{
                  margin: 0,
                  fontSize: isMobile ? 12 : 13,
                  fontWeight: 600,
                  color: "#64748b",
                }}
              >
                Upload payment screenshot
              </p>
              <p style={{ margin: "2px 0 0", fontSize: 11, color: "#94a3b8" }}>
                PNG, JPG, JPEG · Required to submit
              </p>
            </>
          )}
        </div>
        {screenshotName ? (
          <CheckCircle2 size={18} color={pt.color} style={{ flexShrink: 0 }} />
        ) : (
          <span
            style={{
              display: "flex",
              alignItems: "center",
              gap: 5,
              padding: isMobile ? "5px 8px" : "6px 10px",
              borderRadius: 7,
              border: `1px solid ${pt.color}44`,
              color: pt.color,
              fontSize: isMobile ? 11 : 12,
              fontWeight: 600,
              background: "#fff",
              flexShrink: 0,
              whiteSpace: "nowrap",
            }}
          >
            <Upload size={11} /> Browse
          </span>
        )}
        <input
          type="file"
          accept=".png,.jpg,.jpeg,.webp"
          onChange={onChange}
          style={{ display: "none" }}
        />
      </label>
      {errors.screenshot && (
        <p
          style={{
            display: "flex",
            alignItems: "center",
            gap: 4,
            margin: "4px 0 0",
            fontSize: 11,
            color: "#ef4444",
          }}
        >
          <AlertCircle size={10} /> {errors.screenshot}
        </p>
      )}
    </div>
  );
}

export function ProofUpload({ pt, proofName, onChange }) {
  const [isMobile, setIsMobile] = useState(
    typeof window !== "undefined" && window.innerWidth <= 480,
  );
  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth <= 480);
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, []);

  return (
    <div>
      <p
        style={{
          margin: "0 0 6px",
          fontSize: 11,
          fontWeight: 700,
          color: "#64748b",
          textTransform: "uppercase",
          letterSpacing: ".06em",
        }}
      >
        Supporting document{" "}
        <span
          style={{
            fontWeight: 400,
            textTransform: "none",
            letterSpacing: 0,
            color: "#cbd5e1",
          }}
        >
          optional
        </span>
      </p>
      <label
        style={{
          display: "flex",
          alignItems: "center",
          gap: isMobile ? 8 : 12,
          padding: isMobile ? "10px 10px" : "11px 14px",
          borderRadius: 10,
          border: `1.5px dashed ${proofName ? pt.color : "#e2e8f0"}`,
          background: "#fafafa",
          cursor: "pointer",
          transition: "border 0.15s",
        }}
      >
        <div
          style={{
            width: isMobile ? 30 : 36,
            height: isMobile ? 30 : 36,
            borderRadius: 8,
            background: proofName ? pt.color + "15" : "#f1f5f9",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <Upload
            size={isMobile ? 13 : 15}
            color={proofName ? pt.color : "#94a3b8"}
          />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          {proofName ? (
            <>
              <p
                style={{
                  margin: 0,
                  fontSize: 12,
                  fontWeight: 600,
                  color: pt.color,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {proofName}
              </p>
              <p style={{ margin: "2px 0 0", fontSize: 11, color: "#64748b" }}>
                Document attached · tap to change
              </p>
            </>
          ) : (
            <>
              <p
                style={{
                  margin: 0,
                  fontSize: isMobile ? 12 : 13,
                  fontWeight: 500,
                  color: "#64748b",
                }}
              >
                Upload proof document
              </p>
              <p style={{ margin: "2px 0 0", fontSize: 11, color: "#94a3b8" }}>
                PNG, JPG, PDF · Optional
              </p>
            </>
          )}
        </div>
        <input
          type="file"
          accept=".png,.jpg,.jpeg,.pdf"
          onChange={onChange}
          style={{ display: "none" }}
        />
      </label>
    </div>
  );
}
