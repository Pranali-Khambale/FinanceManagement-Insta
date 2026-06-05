// src/Ui/EmployeeMng/ReviewedDocsSection.jsx
import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  CheckCircle,
  FileText,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  Eye,
  Download,
  ExternalLink,
  Loader,
  AlertCircle,
  CheckCheck,
  X as XIcon,
  ChevronLeft,
  ChevronRight,
  FileCheck,
  FolderOpen,
  Shield,
  Camera,
  File,
  Upload,
  Trash2,
  User,
  CreditCard,
  BookOpen,
  Landmark,
} from "lucide-react";

import { BASE_URL as BASE_API } from "../../api/client";
const BASE_URL = BASE_API.replace(/\/api$/, "");

// ── Document type metadata ────────────────────────────────────────────────────
const DOC_TYPE_META = {
  signed_kye: {
    label: "Signed KYE Form",
    icon: FileCheck,
    bg: "#eff6ff",
    border: "#bfdbfe",
    text: "#1d4ed8",
    dot: "#3b82f6",
    section: "kye",
  },
  bgv_form: {
    label: "BGV Form",
    icon: Shield,
    bg: "#f5f3ff",
    border: "#ddd6fe",
    text: "#6d28d9",
    dot: "#7c3aed",
    section: "hr",
  },
  email_screenshot: {
    label: "Approval Email Screenshot",
    icon: Camera,
    bg: "#f0fdf4",
    border: "#bbf7d0",
    text: "#15803d",
    dot: "#22c55e",
    section: "hr",
  },
  photo: {
    label: "Employee Photo",
    icon: User,
    bg: "#fff7ed",
    border: "#fed7aa",
    text: "#c2410c",
    dot: "#f97316",
    section: "reg",
  },
  idPhoto: {
    label: "Employee Photo",
    icon: User,
    bg: "#fff7ed",
    border: "#fed7aa",
    text: "#c2410c",
    dot: "#f97316",
    section: "reg",
  },
  aadharCard: {
    label: "Aadhaar Card",
    icon: CreditCard,
    bg: "#fefce8",
    border: "#fde68a",
    text: "#92400e",
    dot: "#f59e0b",
    section: "reg",
  },
  panCard: {
    label: "PAN Card",
    icon: CreditCard,
    bg: "#fdf4ff",
    border: "#e9d5ff",
    text: "#7e22ce",
    dot: "#a855f7",
    section: "reg",
  },
  bankPassbook: {
    label: "Bank Passbook",
    icon: Landmark,
    bg: "#f0fdfa",
    border: "#99f6e4",
    text: "#0f766e",
    dot: "#14b8a6",
    section: "reg",
  },
  resume: {
    label: "Resume",
    icon: BookOpen,
    bg: "#f8fafc",
    border: "#cbd5e1",
    text: "#334155",
    dot: "#64748b",
    section: "reg",
  },
  other: {
    label: "Other Document",
    icon: File,
    bg: "#f9fafb",
    border: "#e5e7eb",
    text: "#374151",
    dot: "#9ca3af",
    section: "other",
  },
};

const REG_DOC_LABELS = {
  photo: "Employee Photo",
  idPhoto: "Employee Photo",
  aadharCard: "Aadhaar Card",
  panCard: "PAN Card",
  bankPassbook: "Bank Passbook",
  resume: "Resume",
  medicalCertificate: "Medical Certificate",
  academicRecords: "Academic Records",
  payslip: "Payslip",
  farmToCli: "Farm to CLI",
  otherCertificates: "Other Certificates",
};

const HR_UPLOAD_TYPES = [
  {
    key: "bgv_form",
    label: "BGV Form",
    icon: Shield,
    accept: "image/*,application/pdf",
  },
  {
    key: "email_screenshot",
    label: "Approval Email Screenshot",
    icon: Camera,
    accept: "image/*,application/pdf",
  },
];

function fullUrl(path) {
  if (!path) return null;
  return path.startsWith("http") ? path : `${BASE_URL}${path}`;
}

function getFileType(path = "", mime = "") {
  const p = String(path || "").toLowerCase();
  const m = String(mime || "").toLowerCase();
  if (m.includes("pdf") || p.endsWith(".pdf")) return "pdf";
  if (m.includes("image") || /\.(jpg|jpeg|png|gif|webp|bmp|svg)$/.test(p))
    return "image";
  return "other";
}

// ── Image loading strategies ──────────────────────────────────────────────────
/**
 * Strategy 1: fetch() with credentials (requires proper CORS headers on backend)
 * Returns Uint8Array or throws.
 */
async function fetchImageBytes(url) {
  const resp = await fetch(url, {
    cache: "no-store",
    credentials: "include",
    mode: "cors",
  });
  if (!resp.ok) throw new Error(`HTTP ${resp.status} – ${resp.statusText}`);
  const buf = await resp.arrayBuffer();
  return new Uint8Array(buf);
}

/**
 * Strategy 2: Load via <img crossOrigin="anonymous"> → draw to canvas → get blob bytes.
 * Works when the server sends Access-Control-Allow-Origin: * or the matching origin
 * (without credentials). Falls back if server doesn't send CORS headers at all.
 */
function loadImageViaCanvas(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0);
        canvas.toBlob((blob) => {
          if (!blob) {
            reject(new Error("Canvas toBlob returned null"));
            return;
          }
          blob
            .arrayBuffer()
            .then((buf) => resolve(new Uint8Array(buf)))
            .catch(reject);
        }, "image/png");
      } catch (err) {
        // SecurityError: tainted canvas
        reject(err);
      }
    };
    img.onerror = () => reject(new Error("Image failed to load"));
    // Append cache-buster to avoid cached no-CORS response tainting the canvas
    img.src = url + (url.includes("?") ? "&" : "?") + "_cb=" + Date.now();
  });
}

/**
 * Strategy 3: Load image without CORS (no crossOrigin attr) → canvas → blob.
 * This will fail with SecurityError on toDataURL/toBlob if the server doesn't
 * allow CORS, but we can still get dimensions this way.
 * As a last resort, we embed a placeholder page instead of crashing.
 */
async function getImageBytesWithFallback(url) {
  // Try fetch first (needs credentials CORS)
  try {
    return await fetchImageBytes(url);
  } catch (fetchErr) {
    console.warn("[PDF] fetch failed, trying canvas:", fetchErr.message);
  }

  // Try canvas with crossOrigin=anonymous (needs wildcard or matching CORS)
  try {
    return await loadImageViaCanvas(url);
  } catch (canvasErr) {
    console.warn("[PDF] canvas failed:", canvasErr.message);
    throw new Error(
      "Cannot access image due to CORS restrictions. " +
        "Add Access-Control-Allow-Origin header to your /uploads route. " +
        "Original error: " +
        canvasErr.message,
    );
  }
}

/**
 * Fetch PDF bytes (always uses fetch + credentials).
 */
async function fetchPdfBytes(url) {
  const resp = await fetch(url, {
    cache: "no-store",
    credentials: "include",
    mode: "cors",
  });
  if (!resp.ok) throw new Error(`HTTP ${resp.status} – ${resp.statusText}`);
  return resp.arrayBuffer();
}

// ── PDF generation ────────────────────────────────────────────────────────────
async function downloadAllAsPdf(docs, emp) {
  const { PDFDocument, rgb, StandardFonts } =
    await import("https://cdn.jsdelivr.net/npm/pdf-lib@1.17.1/dist/pdf-lib.esm.min.js");

  const pdf = await PDFDocument.create();
  const BOLD = await pdf.embedFont(StandardFonts.HelveticaBold);
  const NORMAL = await pdf.embedFont(StandardFonts.Helvetica);

  const W = 595.28,
    H = 841.89;
  const WHITE = rgb(1, 1, 1);
  const DARK = rgb(0.071, 0.094, 0.133);
  const ACCENT = rgb(0.122, 0.365, 0.902);
  const LABEL = rgb(0.749, 0.796, 0.878);
  const NAME_C = rgb(1, 1, 1);
  const PAGEBG = rgb(0.98, 0.98, 0.984);
  const BAR = 38;

  const isObj = emp && typeof emp === "object";
  const fullName = isObj
    ? [emp.first_name, emp.father_husband_name, emp.last_name]
        .filter(Boolean)
        .join(" ")
    : String(emp || "Employee");
  const empId = isObj ? emp.emp_id || emp.employee_id || "" : "";

  const getMeta = (doc) =>
    DOC_TYPE_META?.[doc.document_type] || {
      section: "other",
      label: "Document",
    };
  const getLabel = (doc) => doc._regLabel || getMeta(doc).label || "Document";

  function trunc(text, font, size, maxW) {
    let t = String(text ?? "");
    while (t.length > 1 && font.widthOfTextAtSize(t, size) > maxW)
      t = t.slice(0, -1);
    if (t.length < String(text ?? "").length) t = t.slice(0, -1) + "…";
    return t;
  }

  const SEC_ACCENT = {
    kye: rgb(0.122, 0.365, 0.902),
    hr: rgb(0.412, 0.192, 0.843),
    reg: rgb(0.016, 0.6, 0.502),
    other: rgb(0.376, 0.408, 0.455),
  };

  function stampBar(page, doc) {
    const label = getLabel(doc);
    const section = getMeta(doc).section || "other";
    const pip = SEC_ACCENT[section] || SEC_ACCENT.other;

    page.drawRectangle({
      x: 0,
      y: H - BAR,
      width: W,
      height: BAR,
      color: DARK,
    });
    page.drawRectangle({ x: 0, y: H - BAR, width: 3, height: BAR, color: pip });
    page.drawRectangle({
      x: 0,
      y: H - BAR,
      width: W,
      height: 1,
      color: ACCENT,
    });

    const nameStr = trunc(
      fullName + (empId ? `  ·  ${empId}` : ""),
      BOLD,
      11,
      W * 0.55 - 24,
    );
    page.drawText(nameStr, {
      x: 14,
      y: H - BAR + 13,
      size: 11,
      font: BOLD,
      color: NAME_C,
    });

    const labelStr = trunc(label.toUpperCase(), BOLD, 7.5, W * 0.4);
    page.drawText(labelStr, {
      x: W - 14 - BOLD.widthOfTextAtSize(labelStr, 7.5),
      y: H - BAR + 14,
      size: 7.5,
      font: BOLD,
      color: LABEL,
      characterSpacing: 0.9,
    });
  }

  // ── Draw an error page with detailed message ────────────────────────────────
  function addErrorPage(doc, errorMsg) {
    const page = pdf.addPage([W, H]);
    page.drawRectangle({ x: 0, y: 0, width: W, height: H, color: WHITE });

    // Red warning box
    page.drawRectangle({
      x: 40,
      y: H / 2 - 60,
      width: W - 80,
      height: 100,
      color: rgb(1, 0.95, 0.95),
    });
    page.drawRectangle({
      x: 40,
      y: H / 2 - 60,
      width: 4,
      height: 100,
      color: rgb(0.85, 0.15, 0.15),
    });

    const errTitle = "Could not load this document";
    page.drawText(errTitle, {
      x: (W - BOLD.widthOfTextAtSize(errTitle, 13)) / 2,
      y: H / 2 + 20,
      size: 13,
      font: BOLD,
      color: rgb(0.75, 0.18, 0.18),
    });

    const hint = "Fix: Add CORS headers to your /uploads backend route";
    page.drawText(hint, {
      x: (W - NORMAL.widthOfTextAtSize(hint, 9)) / 2,
      y: H / 2 - 2,
      size: 9,
      font: NORMAL,
      color: rgb(0.5, 0.3, 0.3),
    });

    // Show truncated error detail
    const maxErrW = W - 100;
    const errDetail = trunc(
      String(errorMsg || "Unknown error"),
      NORMAL,
      7.5,
      maxErrW,
    );
    page.drawText(errDetail, {
      x: (W - NORMAL.widthOfTextAtSize(errDetail, 7.5)) / 2,
      y: H / 2 - 22,
      size: 7.5,
      font: NORMAL,
      color: rgb(0.6, 0.35, 0.35),
    });

    stampBar(page, doc);
  }

  const ORDER = ["kye", "hr", "reg", "other"];
  const validDocs = docs.filter((d) => d.file_path);
  const sorted = ORDER.flatMap((sKey) =>
    validDocs.filter((d) => (getMeta(d).section || "other") === sKey),
  );

  for (const doc of sorted) {
    const url = fullUrl(doc.file_path);
    const mime = doc.mime_type || doc.mimeType || "";
    const ft = getFileType(doc.file_path, mime);

    try {
      if (ft === "pdf") {
        // ── PDFs: fetch as ArrayBuffer ────────────────────────────────────
        const bytes = await fetchPdfBytes(url);
        const src = await PDFDocument.load(bytes, { ignoreEncryption: true });
        const copied = await pdf.copyPages(src, src.getPageIndices());
        for (const p of copied) {
          const { width: ow, height: oh } = p.getSize();
          if (Math.abs(ow - W) > 4 || Math.abs(oh - H) > 4) {
            const s = Math.min(W / ow, H / oh);
            p.setSize(W, H);
            p.scaleContent(s, s);
          }
          p.translateContent(0, -BAR);
          pdf.addPage(p);
          stampBar(p, doc);
        }
      } else if (ft === "image") {
        // ── Images: multi-strategy fetch ─────────────────────────────────
        // Strategy order: fetch+credentials → canvas+crossOrigin → error page
        let uint8;
        try {
          uint8 = await getImageBytesWithFallback(url);
        } catch (imgErr) {
          console.error(
            "[PDF] All image load strategies failed:",
            imgErr.message,
          );
          addErrorPage(doc, imgErr.message);
          continue;
        }

        // Detect format by magic bytes
        const isPng = uint8[0] === 0x89 && uint8[1] === 0x50; // \x89P
        const isJpeg = uint8[0] === 0xff && uint8[1] === 0xd8; // \xFF\xD8
        const isWebp = uint8[8] === 0x57 && uint8[9] === 0x45; // WEBP (bytes 8-11)

        let img;
        try {
          if (isPng) {
            img = await pdf.embedPng(uint8);
          } else if (isJpeg) {
            img = await pdf.embedJpg(uint8);
          } else if (isWebp) {
            // pdf-lib doesn't support WebP natively — convert via canvas
            const blob = new Blob([uint8], { type: "image/webp" });
            const blobUrl = URL.createObjectURL(blob);
            try {
              const pngBytes = await loadImageViaCanvas(blobUrl);
              img = await pdf.embedPng(pngBytes);
            } finally {
              URL.revokeObjectURL(blobUrl);
            }
          } else {
            // Unknown — try PNG first, then JPEG
            try {
              img = await pdf.embedPng(uint8);
            } catch {
              img = await pdf.embedJpg(uint8);
            }
          }
        } catch (embedErr) {
          console.error("[PDF] Failed to embed image:", embedErr.message);
          addErrorPage(doc, "Image embed failed: " + embedErr.message);
          continue;
        }

        const { width: iW, height: iH } = img;
        const PAD = 16;
        const availW = W - PAD * 2;
        const availH = H - BAR - PAD * 2;
        const scale = Math.min(availW / iW, availH / iH, 1);
        const page = pdf.addPage([W, H]);
        page.drawRectangle({ x: 0, y: 0, width: W, height: H, color: PAGEBG });
        page.drawImage(img, {
          x: (W - iW * scale) / 2,
          y: PAD + (availH - iH * scale) / 2,
          width: iW * scale,
          height: iH * scale,
        });
        stampBar(page, doc);
      } else {
        const page = pdf.addPage([W, H]);
        page.drawRectangle({ x: 0, y: 0, width: W, height: H, color: WHITE });
        const msg = "File preview not available";
        page.drawText(msg, {
          x: (W - BOLD.widthOfTextAtSize(msg, 13)) / 2,
          y: H / 2,
          size: 13,
          font: BOLD,
          color: rgb(0.55, 0.57, 0.62),
        });
        stampBar(page, doc);
      }
    } catch (err) {
      console.error("[PDF] Unexpected error for doc:", doc.file_path, err);
      addErrorPage(doc, err.message);
    }
  }

  const blob = new Blob([await pdf.save()], { type: "application/pdf" });
  const href = URL.createObjectURL(blob);
  const a = Object.assign(document.createElement("a"), {
    href,
    download: `${fullName.replace(/\s+/g, "_")}_Documents.pdf`,
  });
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(href);
}

// ── Tiny drop-zone ────────────────────────────────────────────────────────────
const HRDropZone = ({
  label,
  icon: Icon,
  accept,
  file,
  onChange,
  onRemove,
}) => {
  const inputRef = useRef(null);
  const [drag, setDrag] = useState(false);
  const preview = file?.type?.startsWith("image/")
    ? URL.createObjectURL(file)
    : null;

  const handleDrop = (e) => {
    e.preventDefault();
    setDrag(false);
    const f = e.dataTransfer.files[0];
    if (f) onChange(f);
  };

  if (file) {
    return (
      <div className="relative flex items-center gap-2 px-3 py-2 rounded-lg border-2 border-green-400 bg-green-50">
        <div className="w-8 h-8 rounded-md bg-green-100 flex items-center justify-center flex-shrink-0 overflow-hidden">
          {preview ? (
            <img src={preview} alt="" className="w-full h-full object-cover" />
          ) : (
            <FileText className="w-4 h-4 text-green-600" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-gray-800 truncate">
            {file.name}
          </p>
          <p className="text-[10px] text-gray-400">
            {(file.size / 1024).toFixed(1)} KB
          </p>
        </div>
        <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
        <button
          type="button"
          onClick={onRemove}
          className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-white hover:bg-red-600"
        >
          <XIcon size={10} />
        </button>
      </div>
    );
  }

  return (
    <div
      onClick={() => inputRef.current?.click()}
      onDragOver={(e) => {
        e.preventDefault();
        setDrag(true);
      }}
      onDragLeave={() => setDrag(false)}
      onDrop={handleDrop}
      className={`border-2 border-dashed rounded-lg px-4 py-4 text-center cursor-pointer transition-all ${
        drag
          ? "border-blue-500 bg-blue-50"
          : "border-gray-300 bg-gray-50 hover:border-blue-400 hover:bg-blue-50"
      }`}
    >
      <div className="w-8 h-8 mx-auto mb-1.5 rounded-lg flex items-center justify-center bg-blue-100">
        <Icon className="w-4 h-4 text-blue-600" />
      </div>
      <p className="text-xs font-semibold text-gray-600">
        Drop or <span className="text-blue-600 underline">browse</span>
      </p>
      <p className="text-[10px] text-gray-400 mt-0.5">
        PDF or image · max 10 MB
      </p>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={(e) => e.target.files[0] && onChange(e.target.files[0])}
      />
    </div>
  );
};

// ── Doc Lightbox ──────────────────────────────────────────────────────────────
const DocLightbox = ({ docs, startIndex = 0, onClose }) => {
  const [idx, setIdx] = useState(startIndex);
  const [imgError, setImgError] = useState(false);

  const doc = docs[idx];
  const mime = doc?.mime_type || doc?.mimeType || "";
  const url = fullUrl(doc?.file_path);
  const ft = getFileType(doc?.file_path, mime);
  const meta = DOC_TYPE_META[doc?.document_type] || DOC_TYPE_META.other;
  const label = doc?._regLabel || meta.label;

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
            const u = fullUrl(d.file_path);
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

// ── Reusable doc card ─────────────────────────────────────────────────────────
const DocCard = ({ doc, index, onView, onEdit, onDelete }) => {
  const meta = DOC_TYPE_META[doc.document_type] || DOC_TYPE_META.other;
  const Icon = meta.icon;
  const url = fullUrl(doc.file_path);
  const mime = doc.mime_type || doc.mimeType || "";
  const ft = getFileType(doc.file_path, mime);
  const label = doc._regLabel || meta.label;

  return (
    <div
      className="rounded-xl border overflow-hidden transition-all hover:shadow-sm"
      style={{ background: meta.bg, borderColor: meta.border }}
    >
      <div className="flex items-center gap-3 px-4 py-3">
        <div
          className="w-14 h-14 rounded-lg overflow-hidden border flex-shrink-0 flex items-center justify-center"
          style={{
            borderColor: meta.border,
            background: ft === "image" ? "transparent" : meta.bg,
          }}
        >
          {ft === "image" && url ? (
            <img
              src={url}
              alt={label}
              className="w-full h-full object-cover"
              onError={(e) => {
                e.target.style.display = "none";
              }}
            />
          ) : ft === "pdf" ? (
            <div
              className="w-full h-full flex flex-col items-center justify-center gap-0.5"
              style={{ background: meta.bg }}
            >
              <FileText size={18} style={{ color: meta.text }} />
              <span
                className="text-[8px] font-bold"
                style={{ color: meta.text }}
              >
                PDF
              </span>
            </div>
          ) : (
            <Icon size={20} style={{ color: meta.text }} />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <p className="text-sm font-bold text-gray-900 truncate">{label}</p>
            {doc._isHRUpload ? (
              <span className="flex-shrink-0 inline-flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-violet-500 text-white">
                HR
              </span>
            ) : doc._isHRKye ? (
              <span className="flex-shrink-0 inline-flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-blue-600 text-white">
                HR KYE
              </span>
            ) : doc._isRegDoc ? (
              <span className="flex-shrink-0 inline-flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-amber-500 text-white">
                REG
              </span>
            ) : (
              <span className="flex-shrink-0 inline-flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-green-500 text-white">
                <CheckCircle size={9} /> ACCEPTED
              </span>
            )}
          </div>
          <p className="text-xs text-gray-500 truncate">
            {doc.file_name || doc.name}
          </p>
          {doc.uploaded_at && (
            <p className="text-[10px] text-gray-400 mt-0.5">
              Uploaded:{" "}
              {new Date(doc.uploaded_at).toLocaleDateString("en-IN", {
                day: "numeric",
                month: "short",
                year: "numeric",
              })}
            </p>
          )}
          {doc.reviewed_at && (
            <p className="text-[10px] text-green-600 mt-0.5">
              Accepted:{" "}
              {new Date(doc.reviewed_at).toLocaleDateString("en-IN", {
                day: "numeric",
                month: "short",
                year: "numeric",
              })}
              {doc.reviewed_by ? ` by ${doc.reviewed_by}` : ""}
            </p>
          )}
        </div>

        <div className="flex items-center gap-1.5 flex-shrink-0">
          {url && onView && (
            <button
              onClick={() => onView(index)}
              title="View document"
              className="w-9 h-9 rounded-lg flex items-center justify-center border border-white/60 bg-white hover:border-blue-300 hover:bg-blue-50 transition-all shadow-sm"
            >
              <Eye size={15} className="text-gray-600" />
            </button>
          )}
          {url && (
            <a
              href={url}
              download
              target="_blank"
              rel="noopener noreferrer"
              title="Download"
              className="w-9 h-9 rounded-lg flex items-center justify-center border border-white/60 bg-white hover:border-gray-300 hover:bg-gray-50 transition-all shadow-sm"
            >
              <Download size={15} className="text-gray-600" />
            </a>
          )}
          {onEdit && (
            <button
              onClick={() => onEdit(doc)}
              title="Edit / replace file"
              className="w-9 h-9 rounded-lg flex items-center justify-center border border-amber-200 bg-amber-50 hover:bg-amber-100 transition-all shadow-sm"
            >
              <Upload size={15} className="text-amber-600" />
            </button>
          )}
          {onDelete && (
            <button
              onClick={() => onDelete(doc)}
              title="Delete"
              className="w-9 h-9 rounded-lg flex items-center justify-center border border-red-100 bg-red-50 hover:bg-red-100 transition-all shadow-sm"
            >
              <Trash2 size={15} className="text-red-500" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

// ── KYE Edit / Insert Modal ───────────────────────────────────────────────────
const KyeEditModal = ({ doc, empId, onClose, onSaved, onDeleted }) => {
  const [file, setFile] = useState(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");

  const isNew = !doc;

  const handleSave = async () => {
    if (isNew && !file) {
      setError("Please select a file to upload.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const fd = new FormData();
      if (file) fd.append("signed_kye", file, file.name);
      const url = isNew
        ? `${BASE_API}/employee-docs/hr-kye-upload/${empId}`
        : `${BASE_API}/employee-docs/kye/${doc.id}`;
      const method = isNew ? "POST" : "PUT";
      const res = await fetch(url, { method, body: fd });
      const data = await res.json();
      if (data.success) {
        onSaved(data.data);
      } else {
        setError(data.message || "Failed to save.");
      }
    } catch {
      setError("Cannot connect to server.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!doc?.id) return;
    if (
      !window.confirm(
        "Permanently delete this KYE document? This cannot be undone.",
      )
    )
      return;
    setDeleting(true);
    setError("");
    try {
      const res = await fetch(`${BASE_API}/employee-docs/kye/${doc.id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.success) {
        onDeleted(doc.id);
      } else {
        setError(data.message || "Failed to delete.");
      }
    } catch {
      setError("Cannot connect to server.");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[600] flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.60)", backdropFilter: "blur(4px)" }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full overflow-hidden"
        style={{ maxWidth: 420 }}
      >
        <div
          className="flex items-center gap-3 px-5 py-4 border-b border-gray-100"
          style={{ background: "linear-gradient(135deg,#0f172a,#1d4ed8)" }}
        >
          <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
            <FileCheck size={16} className="text-white" />
          </div>
          <p className="text-white font-bold text-sm flex-1">
            {isNew ? "Upload New KYE Document" : "Edit KYE Document"}
          </p>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-lg bg-white/15 hover:bg-white/25 flex items-center justify-center text-white transition-all"
          >
            <XIcon size={14} />
          </button>
        </div>
        <div className="p-5 space-y-4">
          {!isNew && doc.file_name && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg px-3 py-2.5">
              <p className="text-[10px] font-semibold text-blue-500 uppercase tracking-wide mb-0.5">
                Current file
              </p>
              <p className="text-xs font-medium text-gray-800 truncate">
                {doc.file_name}
              </p>
              {doc.uploaded_at && (
                <p className="text-[10px] text-gray-400 mt-0.5">
                  Uploaded{" "}
                  {new Date(doc.uploaded_at).toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </p>
              )}
            </div>
          )}
          <div>
            <p className="text-xs font-semibold text-gray-600 mb-1.5">
              {isNew ? "Select KYE file *" : "Replace with new file (optional)"}
            </p>
            <HRDropZone
              label="Signed KYE Form"
              icon={FileCheck}
              accept="image/*,application/pdf"
              file={file}
              onChange={setFile}
              onRemove={() => setFile(null)}
            />
          </div>
          {error && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              <AlertCircle size={13} className="text-red-500 flex-shrink-0" />
              <p className="text-xs text-red-700">{error}</p>
            </div>
          )}
          <div className="flex gap-2">
            <button
              onClick={handleSave}
              disabled={saving || deleting}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-bold text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90 active:scale-[0.98]"
              style={{ background: "linear-gradient(135deg,#0f172a,#1d4ed8)" }}
            >
              {saving ? (
                <>
                  <Loader size={14} className="animate-spin" /> Saving…
                </>
              ) : (
                <>
                  <Upload size={14} /> {isNew ? "Upload KYE" : "Save Changes"}
                </>
              )}
            </button>
            {!isNew && (
              <button
                onClick={handleDelete}
                disabled={saving || deleting}
                className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-lg text-sm font-bold bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {deleting ? (
                  <Loader size={14} className="animate-spin" />
                ) : (
                  <Trash2 size={14} />
                )}
                Delete
              </button>
            )}
            <button
              onClick={onClose}
              disabled={saving || deleting}
              className="px-4 py-2.5 rounded-lg text-sm font-medium bg-gray-100 hover:bg-gray-200 text-gray-600 transition-all disabled:opacity-50"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ── Registration Docs Section ─────────────────────────────────────────────────
const RegDocsSubSection = ({ regDocs, allViewableDocsRef, onView }) => {
  const [open, setOpen] = useState(true);

  if (!regDocs || regDocs.length === 0) {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 flex items-center gap-2">
        <AlertCircle size={14} className="text-amber-500 flex-shrink-0" />
        <p className="text-xs text-amber-700">
          No registration documents (photo, Aadhaar, PAN, passbook) found for
          this employee.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-amber-200 overflow-hidden">
      <button
        onClick={() => setOpen((p) => !p)}
        className="w-full flex items-center gap-2 px-4 py-3 border-b border-amber-200 text-left transition-colors hover:bg-amber-50"
        style={{ background: "linear-gradient(135deg,#92400e,#b45309)" }}
      >
        <User size={14} className="text-white flex-shrink-0" />
        <p className="text-white text-xs font-bold flex-1">
          Registration Documents
        </p>
        <span className="text-amber-200 text-[10px] font-semibold">
          {regDocs.length} file{regDocs.length !== 1 ? "s" : ""}
        </span>
        {open ? (
          <ChevronUp size={13} className="text-white" />
        ) : (
          <ChevronDown size={13} className="text-white" />
        )}
      </button>
      {open && (
        <div className="p-4 space-y-3 bg-amber-50">
          {regDocs.map((doc, i) => {
            const globalIdx =
              allViewableDocsRef?.findIndex((d) => d === doc) ?? -1;
            return (
              <DocCard
                key={doc.id || i}
                doc={doc}
                index={globalIdx >= 0 ? globalIdx : i}
                onView={globalIdx >= 0 ? onView : undefined}
              />
            );
          })}
        </div>
      )}
    </div>
  );
};

// ── Docs Modal ────────────────────────────────────────────────────────────────
export const DocsModal = ({ emp, onClose }) => {
  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [lightbox, setLightbox] = useState(null);
  const [pdfDownloading, setPdfDownloading] = useState(false);
  const [pdfError, setPdfError] = useState("");

  const [hrFiles, setHrFiles] = useState({
    bgv_form: null,
    email_screenshot: null,
  });
  const [hrUploading, setHrUploading] = useState(false);
  const [hrUploadErr, setHrUploadErr] = useState("");
  const [hrSavedDocs, setHrSavedDocs] = useState([]);
  const [hrDocsLoading, setHrDocsLoading] = useState(true);

  const [regDocs, setRegDocs] = useState([]);
  const [regDocsLoading, setRegDocsLoading] = useState(true);

  const [kyeEditDoc, setKyeEditDoc] = useState(undefined);

  const fetchKyeDocs = useCallback(() => {
    setLoading(true);
    fetch(`${BASE_API}/employee-docs/submissions/${emp.id}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.success) setDocs(data.data || []);
        else setError(data.message || "Failed to load");
      })
      .catch(() => setError("Cannot connect to server"))
      .finally(() => setLoading(false));
  }, [emp.id]);

  useEffect(() => {
    fetchKyeDocs();
  }, [fetchKyeDocs]);

  useEffect(() => {
    setHrDocsLoading(true);
    fetch(`${BASE_API}/employee-docs/hr-uploads/${emp.id}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.success) {
          setHrSavedDocs(
            (data.data || []).map((d) => ({ ...d, _isHRUpload: true })),
          );
        }
      })
      .catch(() => {})
      .finally(() => setHrDocsLoading(false));
  }, [emp.id]);

  useEffect(() => {
    setRegDocsLoading(true);
    fetch(`${BASE_API}/employees/${emp.id}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.success && data.data?.documents) {
          const mapped = (data.data.documents || [])
            .map((d) => {
              const filePath =
                d.file_path || d.filePath || d.path || d.url || "";
              const docType =
                d.document_type || d.documentType || d.type || "other";
              const fileName =
                d.file_name || d.fileName || d.name || d.filename || "";
              const mimeType = d.mime_type || d.mimeType || d.mime || "";
              const uploadedAt =
                d.uploaded_at ||
                d.uploadedAt ||
                d.createdAt ||
                d.created_at ||
                "";
              return {
                ...d,
                file_path: filePath,
                document_type: docType,
                file_name: fileName,
                mime_type: mimeType,
                uploaded_at: uploadedAt,
                _isRegDoc: true,
                _regLabel: REG_DOC_LABELS[docType] || "Document",
              };
            })
            .filter((d) => d.file_path);
          setRegDocs(mapped);
        }
      })
      .catch(() => {})
      .finally(() => setRegDocsLoading(false));
  }, [emp.id]);

  const kyeDocs = docs.filter(
    (d) =>
      (d.status === "accepted" || d.reviewed === true) &&
      d.document_type === "signed_kye",
  );

  const allViewableDocs = [
    ...kyeDocs,
    ...hrSavedDocs.filter((d) => d.file_path),
    ...regDocs,
  ];

  const employeeFullName =
    [emp.first_name, emp.father_husband_name, emp.last_name]
      .filter(Boolean)
      .join(" ") || "Employee";

  const handleDownloadAllPdf = async () => {
    if (allViewableDocs.length === 0) return;
    setPdfError("");
    setPdfDownloading(true);
    try {
      await downloadAllAsPdf(allViewableDocs, emp);
    } catch (err) {
      console.error("PDF generation error:", err);
      setPdfError("Failed to generate PDF. Please try again.");
    } finally {
      setPdfDownloading(false);
    }
  };

  const handleHRUpload = async () => {
    if (!hrFiles.bgv_form && !hrFiles.email_screenshot) {
      setHrUploadErr("Please select at least one document to upload.");
      return;
    }
    setHrUploadErr("");
    setHrUploading(true);
    try {
      const fd = new FormData();
      if (hrFiles.bgv_form)
        fd.append("bgv_form", hrFiles.bgv_form, hrFiles.bgv_form.name);
      if (hrFiles.email_screenshot)
        fd.append(
          "email_screenshot",
          hrFiles.email_screenshot,
          hrFiles.email_screenshot.name,
        );
      const res = await fetch(`${BASE_API}/employee-docs/hr-upload/${emp.id}`, {
        method: "POST",
        body: fd,
      });
      const data = await res.json();
      if (data.success) {
        const saved = (data.data || []).map((d) => ({
          ...d,
          _isHRUpload: true,
        }));
        setHrSavedDocs((prev) => [...prev, ...saved]);
        setHrFiles({ bgv_form: null, email_screenshot: null });
      } else {
        setHrUploadErr(data.message || "Upload failed.");
      }
    } catch {
      setHrUploadErr("Cannot connect to server.");
    } finally {
      setHrUploading(false);
    }
  };

  const handleDeleteHRDoc = async (doc) => {
    if (!doc.id) {
      setHrSavedDocs((prev) => prev.filter((d) => d !== doc));
      return;
    }
    try {
      const res = await fetch(
        `${BASE_API}/employee-docs/hr-uploads/${doc.id}`,
        { method: "DELETE" },
      );
      const data = await res.json();
      if (data.success)
        setHrSavedDocs((prev) => prev.filter((d) => d.id !== doc.id));
      else alert(data.message || "Failed to delete document.");
    } catch {
      alert("Cannot connect to server.");
    }
  };

  const handleKyeSaved = (_savedDoc) => {
    setKyeEditDoc(undefined);
    fetchKyeDocs();
  };
  const handleKyeDeleted = (deletedId) => {
    setKyeEditDoc(undefined);
    setDocs((prev) => prev.filter((d) => d.id !== deletedId));
  };

  const uploadedTypes = new Set(hrSavedDocs.map((d) => d.document_type));
  const pendingHRTypes = HR_UPLOAD_TYPES.filter(
    (t) => !uploadedTypes.has(t.key),
  );

  const firstName = emp.first_name || "";
  const lastName = emp.last_name || "";
  const initials = `${firstName[0] || "?"}${lastName[0] || ""}`.toUpperCase();
  const isAnyLoading = loading || hrDocsLoading || regDocsLoading;
  const totalDocCount = allViewableDocs.length;

  return (
    <>
      {kyeEditDoc !== undefined && (
        <KyeEditModal
          doc={kyeEditDoc}
          empId={emp.id}
          onClose={() => setKyeEditDoc(undefined)}
          onSaved={handleKyeSaved}
          onDeleted={handleKyeDeleted}
        />
      )}
      {lightbox !== null && (
        <DocLightbox
          docs={allViewableDocs}
          startIndex={lightbox}
          onClose={() => setLightbox(null)}
        />
      )}

      <div
        className="fixed inset-0 z-[500] flex items-center justify-center p-4"
        style={{ background: "rgba(0,0,0,0.55)", backdropFilter: "blur(4px)" }}
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose();
        }}
      >
        <div
          className="bg-white rounded-2xl shadow-2xl w-full overflow-hidden"
          style={{
            maxWidth: 640,
            maxHeight: "92vh",
            display: "flex",
            flexDirection: "column",
          }}
        >
          {/* Header */}
          <div
            className="flex items-center gap-4 px-5 py-4 border-b border-gray-100"
            style={{
              background: "linear-gradient(135deg, #0f172a 0%, #1d4ed8 100%)",
            }}
          >
            <div
              className="w-11 h-11 rounded-xl flex items-center justify-center font-bold text-sm text-white flex-shrink-0"
              style={{ background: "rgba(255,255,255,0.2)" }}
            >
              {initials}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-white font-bold text-base truncate">
                {employeeFullName}
              </h3>
              <p className="text-blue-200 text-xs mt-0.5">
                {emp.emp_id || emp.employee_id} · {emp.department || "—"} ·{" "}
                {emp.position || emp.designation || "—"}
              </p>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0 flex-wrap justify-end">
              <span
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold"
                style={{
                  background: "rgba(34,197,94,0.2)",
                  color: "#86efac",
                  border: "1px solid rgba(34,197,94,0.3)",
                }}
              >
                <CheckCheck size={11} /> {kyeDocs.length} KYE
              </span>
              {hrSavedDocs.length > 0 && (
                <span
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold"
                  style={{
                    background: "rgba(139,92,246,0.2)",
                    color: "#c4b5fd",
                    border: "1px solid rgba(139,92,246,0.3)",
                  }}
                >
                  <Shield size={11} /> {hrSavedDocs.length} HR
                </span>
              )}
              {regDocs.length > 0 && (
                <span
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold"
                  style={{
                    background: "rgba(245,158,11,0.2)",
                    color: "#fcd34d",
                    border: "1px solid rgba(245,158,11,0.3)",
                  }}
                >
                  <User size={11} /> {regDocs.length} Reg
                </span>
              )}
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-lg bg-white/15 hover:bg-white/25 flex items-center justify-center text-white transition-all"
              >
                <XIcon size={16} />
              </button>
            </div>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-5 space-y-5">
            {/* Section 1: KYE docs */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                  <FileCheck size={12} className="text-blue-500" /> Employee KYE
                  Form
                </p>
                <button
                  onClick={() => setKyeEditDoc(null)}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white transition-all"
                >
                  <Upload size={11} /> Add KYE
                </button>
              </div>
              {loading && (
                <div className="flex items-center justify-center py-8 gap-3">
                  <Loader size={18} className="animate-spin text-blue-500" />
                  <span className="text-sm text-gray-500">
                    Loading documents…
                  </span>
                </div>
              )}
              {error && !loading && (
                <div className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
                  <AlertCircle
                    size={16}
                    className="text-red-500 flex-shrink-0"
                  />
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              )}
              {!loading && !error && kyeDocs.length === 0 && (
                <div
                  onClick={() => setKyeEditDoc(null)}
                  className="text-center py-6 text-gray-400 bg-blue-50 rounded-xl border-2 border-dashed border-blue-300 hover:bg-blue-100 cursor-pointer transition-all"
                >
                  <Upload size={24} className="mx-auto mb-2 text-blue-400" />
                  <p className="text-sm font-semibold text-blue-600">
                    No KYE document yet — click to upload
                  </p>
                </div>
              )}
              {!loading && !error && kyeDocs.length > 0 && (
                <div className="space-y-3">
                  {kyeDocs.map((doc, i) => (
                    <DocCard
                      key={doc.id || i}
                      doc={doc}
                      index={i}
                      onView={(idx) => setLightbox(idx)}
                      onEdit={(d) => setKyeEditDoc(d)}
                      onDelete={(d) => {
                        if (
                          window.confirm(
                            "Delete this KYE document? This cannot be undone.",
                          )
                        ) {
                          fetch(`${BASE_API}/employee-docs/kye/${d.id}`, {
                            method: "DELETE",
                          })
                            .then((r) => r.json())
                            .then((data) => {
                              if (data.success)
                                setDocs((prev) =>
                                  prev.filter((x) => x.id !== d.id),
                                );
                              else alert(data.message || "Failed to delete.");
                            })
                            .catch(() => alert("Cannot connect to server."));
                        }
                      }}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Section 2: HR uploaded docs */}
            {hrDocsLoading ? (
              <div className="flex items-center gap-2 py-3 text-gray-400">
                <Loader size={14} className="animate-spin" />
                <span className="text-xs">Loading HR documents…</span>
              </div>
            ) : (
              hrSavedDocs.length > 0 && (
                <div>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                    <Upload size={12} className="text-violet-500" /> HR Uploaded
                    Documents
                  </p>
                  <div className="space-y-3">
                    {hrSavedDocs.map((doc, i) => (
                      <DocCard
                        key={doc.id || i}
                        doc={doc}
                        index={kyeDocs.length + i}
                        onView={(idx) => setLightbox(idx)}
                        onDelete={handleDeleteHRDoc}
                      />
                    ))}
                  </div>
                </div>
              )
            )}

            {/* Section 3: Registration docs */}
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                <User size={12} className="text-amber-500" /> Registration
                Documents
              </p>
              {regDocsLoading ? (
                <div className="flex items-center gap-2 py-3 text-gray-400">
                  <Loader size={14} className="animate-spin" />
                  <span className="text-xs">
                    Loading registration documents…
                  </span>
                </div>
              ) : (
                <RegDocsSubSection
                  regDocs={regDocs}
                  allViewableDocsRef={allViewableDocs}
                  onView={(idx) => setLightbox(idx)}
                />
              )}
            </div>

            {/* Section 4: HR upload panel */}
            {!hrDocsLoading && pendingHRTypes.length > 0 && (
              <div className="rounded-xl border border-violet-200 overflow-hidden">
                <div
                  className="flex items-center gap-2 px-4 py-3 border-b border-violet-200"
                  style={{
                    background: "linear-gradient(135deg,#5b21b6,#7c3aed)",
                  }}
                >
                  <Upload size={14} className="text-white" />
                  <p className="text-white text-xs font-bold">
                    HR — Upload Additional Documents
                  </p>
                  <span className="ml-auto text-violet-200 text-[10px] hidden sm:block">
                    {pendingHRTypes.map((t) => t.label).join(" & ")}
                  </span>
                </div>
                <div className="p-4 space-y-4 bg-violet-50">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {pendingHRTypes.map(({ key, label, icon, accept }) => (
                      <div key={key}>
                        <p className="text-[11px] font-semibold text-gray-600 mb-1.5">
                          {label}
                        </p>
                        <HRDropZone
                          label={label}
                          icon={icon}
                          accept={accept}
                          file={hrFiles[key]}
                          onChange={(f) =>
                            setHrFiles((prev) => ({ ...prev, [key]: f }))
                          }
                          onRemove={() =>
                            setHrFiles((prev) => ({ ...prev, [key]: null }))
                          }
                        />
                      </div>
                    ))}
                  </div>
                  {hrUploadErr && (
                    <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                      <AlertCircle
                        size={13}
                        className="text-red-500 flex-shrink-0"
                      />
                      <p className="text-xs text-red-700">{hrUploadErr}</p>
                    </div>
                  )}
                  <button
                    onClick={handleHRUpload}
                    disabled={
                      hrUploading ||
                      (!hrFiles.bgv_form && !hrFiles.email_screenshot)
                    }
                    className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-bold text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90 active:scale-[0.98]"
                    style={{
                      background: "linear-gradient(135deg,#5b21b6,#7c3aed)",
                    }}
                  >
                    {hrUploading ? (
                      <>
                        <Loader size={14} className="animate-spin" /> Uploading…
                      </>
                    ) : (
                      <>
                        <Upload size={14} /> Upload Selected Documents
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

            {!hrDocsLoading &&
              pendingHRTypes.length === 0 &&
              hrSavedDocs.length > 0 && (
                <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-xl px-4 py-3">
                  <CheckCheck
                    size={15}
                    className="text-green-500 flex-shrink-0"
                  />
                  <p className="text-xs text-green-700 font-medium">
                    All additional HR documents (BGV &amp; Approval Email) have
                    been uploaded and saved.
                  </p>
                </div>
              )}
          </div>

          {/* Footer */}
          <div className="px-5 py-3 border-t border-gray-100 flex items-center justify-between bg-gray-50 gap-3 flex-wrap">
            <div className="flex items-center gap-3 text-xs text-gray-500">
              <span>{kyeDocs.length} KYE</span>
              <span className="text-gray-300">·</span>
              <span>{hrSavedDocs.length} HR</span>
              <span className="text-gray-300">·</span>
              <span>{regDocs.length} Reg</span>
              <span className="text-gray-300">·</span>
              <span className="font-semibold text-gray-700">
                {totalDocCount} total
              </span>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              {pdfError && (
                <span className="text-xs text-red-600 flex items-center gap-1">
                  <AlertCircle size={12} /> {pdfError}
                </span>
              )}
              {!isAnyLoading && allViewableDocs.length > 0 && (
                <button
                  onClick={handleDownloadAllPdf}
                  disabled={pdfDownloading}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold text-white transition-all disabled:opacity-60 disabled:cursor-not-allowed hover:opacity-90 active:scale-[0.98]"
                  style={{
                    background: "linear-gradient(135deg, #0f172a, #1d4ed8)",
                  }}
                  title={`Download all ${allViewableDocs.length} document(s) as one PDF`}
                >
                  {pdfDownloading ? (
                    <>
                      <Loader size={14} className="animate-spin" /> Generating
                      PDF…
                    </>
                  ) : (
                    <>
                      <Download size={14} /> Download All as PDF (
                      {allViewableDocs.length})
                    </>
                  )}
                </button>
              )}
              <button
                onClick={onClose}
                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg text-sm font-medium transition-all"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

// ── Standalone reviewed section ───────────────────────────────────────────────
const ReviewedDocsSection = ({ showToast }) => {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [collapsed, setCollapsed] = useState(false);
  const [docsModalEmp, setDocsModalEmp] = useState(null);

  const fetchReviewed = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${BASE_API}/employee-docs/reviewed`);
      const data = await res.json();
      if (data.success) setEmployees(data.data || []);
      else setError(data.message || "Failed to load");
    } catch {
      setError("Cannot connect to server");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReviewed();
  }, [fetchReviewed]);

  if (!loading && !error && employees.length === 0) return null;

  return (
    <>
      {docsModalEmp && (
        <DocsModal emp={docsModalEmp} onClose={() => setDocsModalEmp(null)} />
      )}
      <div className="mt-8">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ background: "#dcfce7" }}
            >
              <CheckCheck size={18} style={{ color: "#16a34a" }} />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-lg font-semibold text-gray-900">
                  Document-Verified Employees
                </h2>
                {!loading && employees.length > 0 && (
                  <span
                    className="text-xs px-2.5 py-0.5 rounded-full font-semibold"
                    style={{ background: "#dcfce7", color: "#16a34a" }}
                  >
                    {employees.length} employee
                    {employees.length !== 1 ? "s" : ""}
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-500 mt-0.5">
                Employees whose signed KYE form has been accepted by HR
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={fetchReviewed}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:bg-gray-50 transition-all"
            >
              <RefreshCw size={13} /> Refresh
            </button>
            <button
              onClick={() => setCollapsed((p) => !p)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:bg-gray-50 transition-all"
            >
              {collapsed ? <ChevronDown size={13} /> : <ChevronUp size={13} />}
              {collapsed ? "Show" : "Hide"}
            </button>
          </div>
        </div>

        {!collapsed && (
          <>
            {loading && (
              <div className="flex items-center justify-center py-10 gap-3 bg-white rounded-xl border border-gray-200">
                <Loader size={18} className="animate-spin text-gray-400" />
                <span className="text-sm text-gray-500">
                  Loading verified employees…
                </span>
              </div>
            )}
            {error && !loading && (
              <div className="flex items-center gap-3 px-4 py-3 bg-red-50 border border-red-200 rounded-xl mb-3">
                <AlertCircle size={16} className="text-red-500 flex-shrink-0" />
                <p className="text-sm text-red-700 flex-1">{error}</p>
                <button
                  onClick={fetchReviewed}
                  className="text-xs text-red-600 underline font-medium"
                >
                  Retry
                </button>
              </div>
            )}
            {!loading && !error && employees.length > 0 && (
              <div className="space-y-2">
                {employees.map((emp) => {
                  const docs = Array.isArray(emp.docs) ? emp.docs : [];
                  const acceptedCount =
                    emp.accepted_docs ||
                    docs.filter(
                      (d) =>
                        (d.status === "accepted" || d.reviewed) &&
                        d.document_type === "signed_kye",
                    ).length ||
                    0;
                  const firstName = emp.first_name || "";
                  const lastName = emp.last_name || "";
                  const initials =
                    `${firstName[0] || "?"}${lastName[0] || ""}`.toUpperCase();

                  return (
                    <div
                      key={emp.id}
                      className="bg-white rounded-xl border border-gray-200 hover:border-green-300 hover:shadow-sm transition-all overflow-hidden"
                    >
                      <div className="flex items-center gap-3 px-4 py-3">
                        <div
                          className="w-10 h-10 rounded-full flex items-center justify-center font-semibold text-sm text-blue-700 flex-shrink-0"
                          style={{ background: "#dbeafe" }}
                        >
                          {initials}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-gray-900 truncate">
                            {firstName}{" "}
                            {emp.father_husband_name
                              ? emp.father_husband_name + " "
                              : ""}
                            {lastName}
                          </p>
                          <p className="text-xs text-gray-500 truncate">
                            {emp.emp_id || emp.employee_id} ·{" "}
                            {emp.department || "—"} · {emp.position || "—"}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <span
                            className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border"
                            style={{
                              background: "#f0fdf4",
                              color: "#16a34a",
                              borderColor: "#bbf7d0",
                            }}
                          >
                            <CheckCheck size={13} /> {acceptedCount} KYE
                            accepted
                          </span>
                          <button
                            onClick={() => setDocsModalEmp(emp)}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
                            style={{
                              background:
                                "linear-gradient(135deg, #1d4ed8, #3b82f6)",
                              color: "#fff",
                              border: "none",
                            }}
                          >
                            <FolderOpen size={13} /> View Docs
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
};

export default ReviewedDocsSection;

/*
 * ═══════════════════════════════════════════════════════════════════════════
 * ROOT CAUSE & FIX SUMMARY
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * THE PROBLEM:
 *   "SecurityError: Failed to execute 'toDataURL' on 'HTMLCanvasElement':
 *    Tainted canvases may not be exported."
 *
 *   This happens because the browser fetched the image without CORS headers,
 *   which "taints" the canvas. Once tainted, toDataURL() / toBlob() throw.
 *
 * THE FIX (frontend — this file):
 *   getImageBytesWithFallback() now tries two strategies in order:
 *
 *   1. fetch() + credentials:'include'  ← needs backend CORS fix below
 *   2. <img crossOrigin="anonymous"> → canvas → Blob
 *      ← needs Access-Control-Allow-Origin: * or matching origin (no credentials)
 *
 *   If both fail (server sends no CORS headers at all), an error page is
 *   embedded in the PDF instead of crashing the whole download.
 *   WebP images are also handled via canvas conversion since pdf-lib
 *   doesn't support WebP natively.
 *
 * THE FIX (backend — REQUIRED for strategy 1):
 *   In your Express app, add this BEFORE express.static for /uploads:
 *
 *   import { uploadsCorsMw } from './middleware/employeeMng/employeeDocMiddleware.js';
 *   app.use('/uploads', uploadsCorsMw);
 *   app.use('/uploads', express.static(path.join(PROJECT_ROOT, 'uploads')));
 *
 *   The uploadsCorsMw middleware is already written in employeeDocMiddleware.js.
 *   Just wire it up in your main server file. That's the only backend change needed.
 *
 * QUICK TEST:
 *   curl -I -H "Origin: http://localhost:3000" http://your-backend/uploads/some-image.jpg
 *   You should see: Access-Control-Allow-Origin: http://localhost:3000
 *                   Access-Control-Allow-Credentials: true
 * ═══════════════════════════════════════════════════════════════════════════
 */
