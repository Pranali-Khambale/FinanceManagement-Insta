// src/Ui/EmployeeMng/ReviewedDocsSection.jsx
import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  CheckCircle, FileText, ChevronDown, ChevronUp,
  RefreshCw, Eye, Download, ExternalLink, Loader,
  AlertCircle, CheckCheck, X as XIcon,
  ChevronLeft, ChevronRight, FileCheck, FolderOpen,
  Shield, Camera, File, Upload, Trash2,
} from "lucide-react";

const BASE_URL =
  (typeof import.meta !== "undefined" && import.meta.env?.VITE_API_URL?.replace("/api", "")) ||
  "http://localhost:5000";

const BASE_API =
  (typeof import.meta !== "undefined" && import.meta.env?.VITE_API_URL) ||
  "http://localhost:5000/api";

const DOC_TYPE_META = {
  signed_kye: {
    label: "Signed KYE Form",
    icon: FileCheck,
    bg: "#eff6ff", border: "#bfdbfe", text: "#1d4ed8", dot: "#3b82f6",
  },
  bgv_form: {
    label: "BGV Form",
    icon: Shield,
    bg: "#f5f3ff", border: "#ddd6fe", text: "#6d28d9", dot: "#7c3aed",
  },
  email_screenshot: {
    label: "Approval Email Screenshot",
    icon: Camera,
    bg: "#f0fdf4", border: "#bbf7d0", text: "#15803d", dot: "#22c55e",
  },
  other: {
    label: "Other Document",
    icon: File,
    bg: "#f9fafb", border: "#e5e7eb", text: "#374151", dot: "#9ca3af",
  },
};

const HR_UPLOAD_TYPES = [
  { key: "bgv_form",         label: "BGV Form",                   icon: Shield,  accept: "image/*,application/pdf" },
  { key: "email_screenshot", label: "Approval Email Screenshot",  icon: Camera,  accept: "image/*,application/pdf" },
];

function fullUrl(path) {
  if (!path) return null;
  return path.startsWith("http") ? path : `${BASE_URL}${path}`;
}

function getFileType(path = "", mime = "") {
  const p = path.toLowerCase();
  const m = mime.toLowerCase();
  if (m.includes("pdf") || p.endsWith(".pdf")) return "pdf";
  if (m.includes("image") || /\.(jpg|jpeg|png|gif|webp|bmp)$/.test(p)) return "image";
  return "other";
}

// ── Download All Docs as a single PDF ────────────────────────────────────────
async function downloadAllAsPdf(docs, emp) {
  const { PDFDocument, rgb, StandardFonts } = await import(
    "https://cdn.jsdelivr.net/npm/pdf-lib@1.17.1/dist/pdf-lib.esm.min.js"
  );

  const mergedPdf  = await PDFDocument.create();
  const fontBold   = await mergedPdf.embedFont(StandardFonts.HelveticaBold);
  const fontNormal = await mergedPdf.embedFont(StandardFonts.Helvetica);

  const W = 595.28, H = 841.89, M = 46;

  const isObj    = emp && typeof emp === "object";
  const fullName = isObj
    ? [emp.first_name, emp.father_husband_name, emp.last_name].filter(Boolean).join(" ")
    : String(emp || "Employee");

  const empId = isObj ? (emp.emp_id || emp.employee_id || "—") : "—";
  const dept  = isObj ? (emp.department || "—")                 : "—";
  const desig = isObj ? (emp.position || emp.designation || "—"): "—";

  const NAVY   = rgb(0.051, 0.094, 0.161);
  const NAVY2  = rgb(0.031, 0.063, 0.125);
  const ACCENT = rgb(0.114, 0.302, 0.867);
  const WHITE  = rgb(1, 1, 1);
  const BLUE_L = rgb(0.78, 0.847, 0.973);
  const BLUE_M = rgb(0.231, 0.51, 0.965);
  const DIM    = rgb(0.239, 0.353, 0.502);
  const LIGHTER= rgb(0.353, 0.483, 0.627);
  const GREY_L = rgb(0.961, 0.965, 0.969);

  function trunc(text, font, size, maxW) {
    let t = String(text ?? "");
    while (t.length > 0 && font.widthOfTextAtSize(t, size) > maxW)
      t = t.slice(0, -1);
    if (t.length < String(text ?? "").length) t = t.slice(0, -2) + "…";
    return t;
  }

  const cover = mergedPdf.addPage([W, H]);
  cover.drawRectangle({ x: 0, y: 0, width: W, height: H, color: NAVY });
  cover.drawRectangle({ x: 0, y: 0, width: 5, height: H, color: ACCENT });
  cover.drawRectangle({ x: 0, y: H - 5, width: W, height: 5, color: ACCENT });
  cover.drawText("HR DOCUMENT PACKAGE", {
    x: M + 4, y: H - 52, size: 9, font: fontBold, color: BLUE_M, characterSpacing: 1.6,
  });
  const nameSize = fullName.length > 28 ? 24 : 30;
  cover.drawText(trunc(fullName, fontBold, nameSize, W - M * 2), {
    x: M + 4, y: H - 96, size: nameSize, font: fontBold, color: WHITE,
  });
  cover.drawRectangle({ x: M + 4, y: H - 112, width: W - M * 2, height: 0.75, color: DIM });

  const metaRows = [
    ["EMPLOYEE ID", empId],
    ["DEPARTMENT",  dept],
    ["DESIGNATION", desig],
    ["GENERATED",   new Date().toLocaleDateString("en-IN", { day:"numeric", month:"long", year:"numeric" })],
    ["TOTAL DOCS",  String(docs.filter(d => d.file_path).length)],
  ];

  let mY = H - 148;
  for (const [key, val] of metaRows) {
    cover.drawRectangle({ x: M + 4, y: mY - 4, width: 108, height: 17, color: NAVY2, borderRadius: 3 });
    cover.drawText(key, { x: M + 10, y: mY + 7, size: 8, font: fontBold, color: BLUE_M, characterSpacing: 0.5 });
    cover.drawText(trunc(val, fontBold, 12, W - M * 2 - 126), {
      x: M + 122, y: mY + 7, size: 12, font: fontBold, color: BLUE_L,
    });
    mY -= 29;
  }

  const validDocs = docs.filter(d => d.file_path);
  if (validDocs.length > 0) {
    let lY = mY - 20;
    cover.drawText("INCLUDED DOCUMENTS", {
      x: M + 4, y: lY, size: 8, font: fontBold, color: ACCENT, characterSpacing: 1.2,
    });
    lY -= 10;
    cover.drawRectangle({ x: M + 4, y: lY, width: W - M * 2, height: 0.5, color: DIM });
    lY -= 18;
    for (let i = 0; i < validDocs.length; i++) {
      const doc  = validDocs[i];
      const meta = DOC_TYPE_META[doc.document_type] || DOC_TYPE_META.other;
      if (i % 2 === 0) {
        cover.drawRectangle({ x: M, y: lY - 5, width: W - M * 2, height: 19, color: NAVY2 });
      }
      cover.drawText(String(i + 1).padStart(2, "0"), {
        x: M + 6, y: lY + 6, size: 9, font: fontBold, color: BLUE_M,
      });
      cover.drawText(trunc(meta.label, fontBold, 11, 210), {
        x: M + 28, y: lY + 6, size: 11, font: fontBold, color: WHITE,
      });
      const fn = trunc(doc.file_name || "", fontNormal, 9, W - M * 2 - 260);
      if (fn) {
        cover.drawText(fn, {
          x: W - M - fontNormal.widthOfTextAtSize(fn, 9),
          y: lY + 6, size: 9, font: fontNormal, color: LIGHTER,
        });
      }
      lY -= 21;
    }
  }

  cover.drawRectangle({ x: 0, y: 0, width: W, height: 30, color: NAVY2 });
  cover.drawRectangle({ x: 0, y: 30, width: W, height: 0.5, color: DIM });
  cover.drawText("CONFIDENTIAL — FOR INTERNAL HR USE ONLY", {
    x: M + 4, y: 11, size: 8, font: fontBold, color: DIM, characterSpacing: 0.5,
  });
  cover.drawText("Page 1", {
    x: W - M - fontNormal.widthOfTextAtSize("Page 1", 8),
    y: 11, size: 8, font: fontNormal, color: DIM,
  });

  let pageNum = 2;
  const docColors = {
    signed_kye:       { header: rgb(0.114, 0.302, 0.867) },
    bgv_form:         { header: rgb(0.486, 0.231, 0.867) },
    email_screenshot: { header: rgb(0.059, 0.463, 0.388) },
    other:            { header: rgb(0.373, 0.373, 0.373) },
  };
  const HEADER_H = 34, FOOTER_H = 24;

  const stampHeaderFooter = (page, meta) => {
    const col = (docColors[meta?.docType] || docColors.other).header;
    page.drawRectangle({ x: 0, y: H - HEADER_H, width: W, height: HEADER_H, color: NAVY });
    page.drawRectangle({ x: 0, y: H - HEADER_H - 0.5, width: W, height: 0.5, color: DIM });
    page.drawRectangle({ x: 0, y: H - HEADER_H, width: 4, height: HEADER_H, color: col });
    page.drawText(trunc(meta.label, fontBold, 10, 260), {
      x: 14, y: H - 13, size: 10, font: fontBold, color: BLUE_L,
    });
    const nameHdr = trunc(fullName, fontNormal, 9, 200);
    page.drawText(nameHdr, {
      x: W - M - fontNormal.widthOfTextAtSize(nameHdr, 9),
      y: H - 13, size: 9, font: fontNormal, color: BLUE_M,
    });
    const idStr = trunc(empId, fontNormal, 8, 160);
    page.drawText(idStr, {
      x: W - M - fontNormal.widthOfTextAtSize(idStr, 8),
      y: H - 25, size: 8, font: fontNormal, color: DIM,
    });
    page.drawRectangle({ x: 0, y: 0, width: W, height: FOOTER_H, color: NAVY2 });
    page.drawRectangle({ x: 0, y: FOOTER_H, width: W, height: 0.5, color: DIM });
    page.drawText("Confidential — HR use only", {
      x: M + 4, y: 8, size: 8, font: fontNormal, color: DIM,
    });
    page.drawText(`Page ${pageNum}`, {
      x: W - M - fontNormal.widthOfTextAtSize(`Page ${pageNum}`, 8),
      y: 8, size: 8, font: fontNormal, color: DIM,
    });
    pageNum++;
  };

  for (const doc of validDocs) {
    const url  = fullUrl(doc.file_path);
    const ft   = getFileType(doc.file_path, doc.mime_type || "");
    const meta = { ...(DOC_TYPE_META[doc.document_type] || DOC_TYPE_META.other), docType: doc.document_type };
    try {
      const resp  = await fetch(url, { cache: "no-store" });
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const bytes = await resp.arrayBuffer();
      if (ft === "pdf") {
        const src    = await PDFDocument.load(bytes, { ignoreEncryption: true });
        const copied = await mergedPdf.copyPages(src, src.getPageIndices());
        for (const p of copied) {
          const { width: ow, height: oh } = p.getSize();
          const scale = Math.min(W / ow, H / oh);
          if (Math.abs(ow - W) > 5 || Math.abs(oh - H) > 5) {
            p.setSize(W, H);
            p.scaleContent(scale, scale);
          }
          mergedPdf.addPage(p);
          stampHeaderFooter(p, meta);
        }
      } else if (ft === "image") {
        const lp    = doc.file_path.toLowerCase();
        const mime  = (doc.mime_type || "").toLowerCase();
        const isPng = lp.endsWith(".png") || mime.includes("png");
        let img;
        try { img = isPng ? await mergedPdf.embedPng(bytes) : await mergedPdf.embedJpg(bytes); }
        catch { img = isPng ? await mergedPdf.embedJpg(bytes) : await mergedPdf.embedPng(bytes); }
        const { width: iW, height: iH } = img;
        const availW = W - 32, availH = H - HEADER_H - FOOTER_H - 32;
        const scale  = Math.min(availW / iW, availH / iH, 1);
        const page   = mergedPdf.addPage([W, H]);
        page.drawRectangle({ x: 0, y: FOOTER_H, width: W, height: H - HEADER_H - FOOTER_H, color: GREY_L });
        page.drawImage(img, {
          x: (W - iW * scale) / 2,
          y: FOOTER_H + (availH - iH * scale) / 2 + 16,
          width: iW * scale, height: iH * scale,
        });
        stampHeaderFooter(page, meta);
      } else {
        const page = mergedPdf.addPage([W, H]);
        page.drawRectangle({ x: 0, y: 0, width: W, height: H, color: GREY_L });
        page.drawText("Preview unavailable for this file type.", {
          x: M, y: H / 2 + 10, size: 13, font: fontNormal, color: rgb(0.45, 0.45, 0.55),
        });
        page.drawText(trunc(doc.file_name || doc.file_path || "", fontNormal, 10, W - M * 2), {
          x: M, y: H / 2 - 12, size: 10, font: fontNormal, color: rgb(0.6, 0.6, 0.68),
        });
        stampHeaderFooter(page, meta);
      }
    } catch (err) {
      const page = mergedPdf.addPage([W, H]);
      page.drawRectangle({ x: 0, y: 0, width: W, height: H, color: rgb(0.995, 0.96, 0.96) });
      page.drawText("Failed to load document", {
        x: M, y: H / 2 + 20, size: 14, font: fontBold, color: rgb(0.75, 0.18, 0.18),
      });
      page.drawText(trunc(String(err), fontNormal, 10, W - M * 2), {
        x: M, y: H / 2 - 8, size: 10, font: fontNormal, color: rgb(0.6, 0.3, 0.3),
      });
      stampHeaderFooter(page, meta);
    }
  }

  const blob = new Blob([await mergedPdf.save()], { type: "application/pdf" });
  const href = URL.createObjectURL(blob);
  const a = Object.assign(document.createElement("a"), {
    href, download: `${fullName.replace(/\s+/g, "_")}_HR_Documents.pdf`,
  });
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(href);
}

// ── Tiny drop-zone ────────────────────────────────────────────────────────────
const HRDropZone = ({ label, icon: Icon, accept, file, onChange, onRemove }) => {
  const inputRef = useRef(null);
  const [drag, setDrag] = useState(false);
  const preview = file?.type?.startsWith("image/") ? URL.createObjectURL(file) : null;

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
          {preview
            ? <img src={preview} alt="" className="w-full h-full object-cover" />
            : <FileText className="w-4 h-4 text-green-600" />}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-gray-800 truncate">{file.name}</p>
          <p className="text-[10px] text-gray-400">{(file.size / 1024).toFixed(1)} KB</p>
        </div>
        <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
        <button type="button" onClick={onRemove}
          className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-white hover:bg-red-600">
          <XIcon size={10} />
        </button>
      </div>
    );
  }

  return (
    <div
      onClick={() => inputRef.current?.click()}
      onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
      onDragLeave={() => setDrag(false)}
      onDrop={handleDrop}
      className={`border-2 border-dashed rounded-lg px-4 py-4 text-center cursor-pointer transition-all ${
        drag ? "border-blue-500 bg-blue-50" : "border-gray-300 bg-gray-50 hover:border-blue-400 hover:bg-blue-50"
      }`}
    >
      <div className="w-8 h-8 mx-auto mb-1.5 rounded-lg flex items-center justify-center bg-blue-100">
        <Icon className="w-4 h-4 text-blue-600" />
      </div>
      <p className="text-xs font-semibold text-gray-600">
        Drop or <span className="text-blue-600 underline">browse</span>
      </p>
      <p className="text-[10px] text-gray-400 mt-0.5">PDF or image · max 10 MB</p>
      <input ref={inputRef} type="file" accept={accept} className="hidden"
        onChange={(e) => e.target.files[0] && onChange(e.target.files[0])} />
    </div>
  );
};

// ── Doc Lightbox ──────────────────────────────────────────────────────────────
const DocLightbox = ({ docs, startIndex = 0, onClose }) => {
  const [idx, setIdx]         = useState(startIndex);
  const [imgError, setImgError] = useState(false);

  const doc   = docs[idx];
  const url   = fullUrl(doc?.file_path);
  const ft    = getFileType(doc?.file_path, doc?.mime_type);
  const meta  = DOC_TYPE_META[doc?.document_type] || DOC_TYPE_META.other;
  const label = meta.label;

  useEffect(() => { setImgError(false); }, [idx]);
  useEffect(() => {
    const h = (e) => {
      if (e.key === "Escape")     onClose();
      if (e.key === "ArrowRight") setIdx((i) => Math.min(i + 1, docs.length - 1));
      if (e.key === "ArrowLeft")  setIdx((i) => Math.max(i - 1, 0));
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [docs.length, onClose]);

  return (
    <div className="fixed inset-0 z-[9999] flex flex-col" style={{ background: "rgba(0,0,0,0.93)" }}>
      <div className="flex items-center justify-between px-5 py-3 flex-shrink-0"
        style={{ background: "rgba(15,23,42,0.97)", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: meta.bg }}>
            <FileText size={15} style={{ color: meta.text }} />
          </div>
          <div>
            <p className="text-white font-semibold text-sm">{label}</p>
            <p className="text-blue-300 text-xs">{idx + 1} / {docs.length}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {url && (
            <>
              <a href={url} download target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-lg text-xs font-medium border border-white/10 transition-all">
                <Download size={13} /> Download
              </a>
              <a href={url} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-lg text-xs font-medium border border-white/10 transition-all">
                <ExternalLink size={13} /> Open
              </a>
            </>
          )}
          <button onClick={onClose}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white text-slate-900 rounded-lg text-xs font-bold hover:bg-blue-50 transition-all ml-1">
            <XIcon size={13} /> Close
          </button>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center relative p-6 overflow-hidden">
        {idx > 0 && (
          <button onClick={() => setIdx(i => i - 1)}
            className="absolute left-4 z-10 w-10 h-10 rounded-full bg-white/12 hover:bg-white/25 border border-white/15 flex items-center justify-center text-white transition-all">
            <ChevronLeft size={22} />
          </button>
        )}
        {ft === "pdf" && url && (
          <iframe src={url} title={label} className="w-full rounded-xl shadow-2xl bg-white border-0"
            style={{ height: "calc(100vh - 120px)", maxWidth: 960 }} />
        )}
        {ft === "image" && url && !imgError && (
          <img src={url} alt={label} className="rounded-xl shadow-2xl object-contain"
            style={{ maxHeight: "calc(100vh - 120px)", maxWidth: "100%" }}
            onError={() => setImgError(true)} />
        )}
        {(ft === "other" || (ft === "image" && imgError) || !url) && (
          <div className="text-center text-white space-y-4">
            <div className="w-20 h-20 rounded-2xl bg-white/10 flex items-center justify-center mx-auto">
              <FileText size={36} opacity={0.5} />
            </div>
            <p className="text-base opacity-70">Preview not available</p>
            {url && (
              <a href={url} download
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-white/15 hover:bg-white/25 rounded-xl text-sm font-semibold text-white transition-all">
                <Download size={16} /> Download File
              </a>
            )}
          </div>
        )}
        {idx < docs.length - 1 && (
          <button onClick={() => setIdx(i => i + 1)}
            className="absolute right-4 z-10 w-10 h-10 rounded-full bg-white/12 hover:bg-white/25 border border-white/15 flex items-center justify-center text-white transition-all">
            <ChevronRight size={22} />
          </button>
        )}
      </div>

      {docs.length > 1 && (
        <div className="flex-shrink-0 flex items-center gap-2 px-5 py-3 overflow-x-auto"
          style={{ background: "rgba(0,0,0,0.65)" }}>
          {docs.map((d, i) => {
            const u   = fullUrl(d.file_path);
            const ft2 = getFileType(d.file_path, d.mime_type);
            return (
              <button key={i} onClick={() => setIdx(i)}
                className="flex-shrink-0 w-14 h-14 rounded-lg overflow-hidden border-2 transition-all"
                style={{
                  borderColor: i === idx ? "#60a5fa" : "rgba(255,255,255,0.2)",
                  opacity:     i === idx ? 1 : 0.5,
                  transform:   i === idx ? "scale(1.1)" : "scale(1)",
                  background:  "#1e293b",
                }}>
                {ft2 === "image" && u
                  ? <img src={u} alt="" className="w-full h-full object-cover" />
                  : <div className="w-full h-full flex items-center justify-center">
                      <FileText size={18} color="#64748b" />
                    </div>}
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
  const url  = fullUrl(doc.file_path);
  const ft   = getFileType(doc.file_path, doc.mime_type);

  return (
    <div className="rounded-xl border overflow-hidden transition-all hover:shadow-sm"
      style={{ background: meta.bg, borderColor: meta.border }}>
      <div className="flex items-center gap-3 px-4 py-3">

        {/* Thumbnail */}
        <div className="w-14 h-14 rounded-lg overflow-hidden border flex-shrink-0 flex items-center justify-center"
          style={{ borderColor: meta.border, background: ft === "image" ? "transparent" : meta.bg }}>
          {ft === "image" && url ? (
            <img src={url} alt={meta.label} className="w-full h-full object-cover"
              onError={(e) => { e.target.style.display = "none"; }} />
          ) : ft === "pdf" ? (
            <div className="w-full h-full flex flex-col items-center justify-center gap-0.5" style={{ background: meta.bg }}>
              <FileText size={18} style={{ color: meta.text }} />
              <span className="text-[8px] font-bold" style={{ color: meta.text }}>PDF</span>
            </div>
          ) : (
            <Icon size={20} style={{ color: meta.text }} />
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <p className="text-sm font-bold text-gray-900 truncate">{meta.label}</p>
            {doc._isHRUpload ? (
              <span className="flex-shrink-0 inline-flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-violet-500 text-white">
                HR UPLOADED
              </span>
            ) : doc._isHRKye ? (
              <span className="flex-shrink-0 inline-flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-blue-600 text-white">
                HR KYE
              </span>
            ) : (
              <span className="flex-shrink-0 inline-flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-green-500 text-white">
                <CheckCircle size={9} /> ACCEPTED
              </span>
            )}
          </div>
          <p className="text-xs text-gray-500 truncate">{doc.file_name || doc.name}</p>
          {doc.uploaded_at && (
            <p className="text-[10px] text-gray-400 mt-0.5">
              Uploaded: {new Date(doc.uploaded_at).toLocaleDateString("en-IN", {
                day: "numeric", month: "short", year: "numeric",
              })}
            </p>
          )}
          {doc.reviewed_at && (
            <p className="text-[10px] text-green-600 mt-0.5">
              Accepted: {new Date(doc.reviewed_at).toLocaleDateString("en-IN", {
                day: "numeric", month: "short", year: "numeric",
              })}
              {doc.reviewed_by ? ` by ${doc.reviewed_by}` : ""}
            </p>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1.5 flex-shrink-0">
          {url && onView && (
            <button onClick={() => onView(index)} title="View document"
              className="w-9 h-9 rounded-lg flex items-center justify-center border border-white/60 bg-white hover:border-blue-300 hover:bg-blue-50 transition-all shadow-sm">
              <Eye size={15} className="text-gray-600" />
            </button>
          )}
          {url && (
            <a href={url} download target="_blank" rel="noopener noreferrer" title="Download"
              className="w-9 h-9 rounded-lg flex items-center justify-center border border-white/60 bg-white hover:border-gray-300 hover:bg-gray-50 transition-all shadow-sm">
              <Download size={15} className="text-gray-600" />
            </a>
          )}
          {onEdit && (
            <button onClick={() => onEdit(doc)} title="Edit / replace file"
              className="w-9 h-9 rounded-lg flex items-center justify-center border border-amber-200 bg-amber-50 hover:bg-amber-100 transition-all shadow-sm">
              <Upload size={15} className="text-amber-600" />
            </button>
          )}
          {onDelete && (
            <button onClick={() => onDelete(doc)} title="Delete"
              className="w-9 h-9 rounded-lg flex items-center justify-center border border-red-100 bg-red-50 hover:bg-red-100 transition-all shadow-sm">
              <Trash2 size={15} className="text-red-500" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

// ── KYE Edit / Insert Modal ───────────────────────────────────────────────────
// doc = null  → insert new KYE doc for this employee
// doc = obj   → edit (replace file) or delete existing KYE doc
const KyeEditModal = ({ doc, empId, onClose, onSaved, onDeleted }) => {
  const [file,     setFile]     = useState(null);
  const [saving,   setSaving]   = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error,    setError]    = useState("");

  const isNew = !doc;

  const handleSave = async () => {
    if (isNew && !file) { setError("Please select a file to upload."); return; }
    setSaving(true);
    setError("");
    try {
      const fd = new FormData();
      if (file) fd.append("signed_kye", file, file.name);

      const url    = isNew
        ? `${BASE_API}/employee-docs/hr-kye-upload/${empId}`
        : `${BASE_API}/employee-docs/kye/${doc.id}`;
      const method = isNew ? "POST" : "PUT";

      const res  = await fetch(url, { method, body: fd });
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
    if (!window.confirm("Permanently delete this KYE document? This cannot be undone.")) return;
    setDeleting(true);
    setError("");
    try {
      const res  = await fetch(`${BASE_API}/employee-docs/kye/${doc.id}`, { method: "DELETE" });
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
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full overflow-hidden" style={{ maxWidth: 420 }}>

        {/* Header */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100"
          style={{ background: "linear-gradient(135deg,#0f172a,#1d4ed8)" }}>
          <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
            <FileCheck size={16} className="text-white" />
          </div>
          <p className="text-white font-bold text-sm flex-1">
            {isNew ? "Upload New KYE Document" : "Edit KYE Document"}
          </p>
          <button onClick={onClose}
            className="w-7 h-7 rounded-lg bg-white/15 hover:bg-white/25 flex items-center justify-center text-white transition-all">
            <XIcon size={14} />
          </button>
        </div>

        <div className="p-5 space-y-4">

          {/* Current file info (edit mode) */}
          {!isNew && doc.file_name && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg px-3 py-2.5">
              <p className="text-[10px] font-semibold text-blue-500 uppercase tracking-wide mb-0.5">Current file</p>
              <p className="text-xs font-medium text-gray-800 truncate">{doc.file_name}</p>
              {doc.uploaded_at && (
                <p className="text-[10px] text-gray-400 mt-0.5">
                  Uploaded {new Date(doc.uploaded_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                </p>
              )}
            </div>
          )}

          {/* Drop zone */}
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

          {/* Error */}
          {error && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              <AlertCircle size={13} className="text-red-500 flex-shrink-0" />
              <p className="text-xs text-red-700">{error}</p>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex gap-2">
            <button
              onClick={handleSave}
              disabled={saving || deleting}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-bold text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90 active:scale-[0.98]"
              style={{ background: "linear-gradient(135deg,#0f172a,#1d4ed8)" }}
            >
              {saving
                ? <><Loader size={14} className="animate-spin" /> Saving…</>
                : <><Upload size={14} /> {isNew ? "Upload KYE" : "Save Changes"}</>}
            </button>

            {!isNew && (
              <button
                onClick={handleDelete}
                disabled={saving || deleting}
                className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-lg text-sm font-bold bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {deleting
                  ? <Loader size={14} className="animate-spin" />
                  : <Trash2 size={14} />}
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

// ── Docs Modal ────────────────────────────────────────────────────────────────
export const DocsModal = ({ emp, onClose }) => {
  const [docs,           setDocs]           = useState([]);
  const [loading,        setLoading]        = useState(true);
  const [error,          setError]          = useState("");
  const [lightbox,       setLightbox]       = useState(null);
  const [pdfDownloading, setPdfDownloading] = useState(false);
  const [pdfError,       setPdfError]       = useState("");

  // HR BGV/email upload state
  const [hrFiles,       setHrFiles]       = useState({ bgv_form: null, email_screenshot: null });
  const [hrUploading,   setHrUploading]   = useState(false);
  const [hrUploadErr,   setHrUploadErr]   = useState("");
  const [hrSavedDocs,   setHrSavedDocs]   = useState([]);
  const [hrDocsLoading, setHrDocsLoading] = useState(true);

  // KYE edit/insert modal:
  // undefined = closed | null = insert new | object = edit existing
  const [kyeEditDoc, setKyeEditDoc] = useState(undefined);

  // ── Load employee's accepted KYE docs ──────────────────────────────────────
  const fetchKyeDocs = useCallback(() => {
    setLoading(true);
    fetch(`${BASE_API}/employee-docs/submissions/${emp.id}`)
      .then(r => r.json())
      .then(data => {
        if (data.success) setDocs(data.data || []);
        else setError(data.message || "Failed to load");
      })
      .catch(() => setError("Cannot connect to server"))
      .finally(() => setLoading(false));
  }, [emp.id]);

  useEffect(() => { fetchKyeDocs(); }, [fetchKyeDocs]);

  // ── Load existing HR-uploaded BGV/email docs ───────────────────────────────
  useEffect(() => {
    setHrDocsLoading(true);
    fetch(`${BASE_API}/employee-docs/hr-uploads/${emp.id}`)
      .then(r => r.json())
      .then(data => {
        if (data.success) {
          setHrSavedDocs((data.data || []).map(d => ({ ...d, _isHRUpload: true })));
        }
      })
      .catch(() => {})
      .finally(() => setHrDocsLoading(false));
  }, [emp.id]);

  // Accepted KYE docs (employee-submitted)
  const kyeDocs = docs.filter(
    d => (d.status === "accepted" || d.reviewed === true) && d.document_type === "signed_kye"
  );

  // Combined list for lightbox and PDF
  const allViewableDocs = [...kyeDocs, ...hrSavedDocs.filter(d => d.file_path)];

  const employeeFullName = [emp.first_name, emp.father_husband_name, emp.last_name]
    .filter(Boolean).join(" ") || "Employee";

  // ── Download All as PDF ────────────────────────────────────────────────────
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

  // ── HR BGV/email upload ────────────────────────────────────────────────────
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
        fd.append("email_screenshot", hrFiles.email_screenshot, hrFiles.email_screenshot.name);

      const res  = await fetch(`${BASE_API}/employee-docs/hr-upload/${emp.id}`, { method: "POST", body: fd });
      const data = await res.json();
      if (data.success) {
        const saved = (data.data || []).map(d => ({ ...d, _isHRUpload: true }));
        setHrSavedDocs(prev => [...prev, ...saved]);
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

  // ── Delete HR-uploaded BGV/email doc ──────────────────────────────────────
  const handleDeleteHRDoc = async (doc) => {
    if (!doc.id) { setHrSavedDocs(prev => prev.filter(d => d !== doc)); return; }
    try {
      const res  = await fetch(`${BASE_API}/employee-docs/hr-uploads/${doc.id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) setHrSavedDocs(prev => prev.filter(d => d.id !== doc.id));
      else alert(data.message || "Failed to delete document.");
    } catch {
      alert("Cannot connect to server.");
    }
  };

  // ── KYE edit/insert callbacks ──────────────────────────────────────────────
  const handleKyeSaved = (_savedDoc) => {
    setKyeEditDoc(undefined);
    fetchKyeDocs(); // re-fetch to get latest
  };

  const handleKyeDeleted = (deletedId) => {
    setKyeEditDoc(undefined);
    setDocs(prev => prev.filter(d => d.id !== deletedId));
  };

  const uploadedTypes  = new Set(hrSavedDocs.map(d => d.document_type));
  const pendingHRTypes = HR_UPLOAD_TYPES.filter(t => !uploadedTypes.has(t.key));

  const firstName = emp.first_name || "";
  const lastName  = emp.last_name  || "";
  const initials  = `${firstName[0] || "?"}${lastName[0] || ""}`.toUpperCase();
  const isAnyLoading = loading || hrDocsLoading;

  return (
    <>
      {/* KYE edit / insert modal (rendered above DocsModal) */}
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

      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[500] flex items-center justify-center p-4"
        style={{ background: "rgba(0,0,0,0.55)", backdropFilter: "blur(4px)" }}
        onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      >
        <div className="bg-white rounded-2xl shadow-2xl w-full overflow-hidden"
          style={{ maxWidth: 600, maxHeight: "92vh", display: "flex", flexDirection: "column" }}>

          {/* ── Header ──────────────────────────────────────────────────── */}
          <div className="flex items-center gap-4 px-5 py-4 border-b border-gray-100"
            style={{ background: "linear-gradient(135deg, #0f172a 0%, #1d4ed8 100%)" }}>
            <div className="w-11 h-11 rounded-xl flex items-center justify-center font-bold text-sm text-white flex-shrink-0"
              style={{ background: "rgba(255,255,255,0.2)" }}>
              {initials}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-white font-bold text-base truncate">{employeeFullName}</h3>
              <p className="text-blue-200 text-xs mt-0.5">
                {emp.emp_id || emp.employee_id} · {emp.department || "—"} · {emp.position || emp.designation || "—"}
              </p>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold"
                style={{ background: "rgba(34,197,94,0.2)", color: "#86efac", border: "1px solid rgba(34,197,94,0.3)" }}>
                <CheckCheck size={11} />
                {kyeDocs.length} KYE Accepted
              </span>
              {hrSavedDocs.length > 0 && (
                <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold"
                  style={{ background: "rgba(139,92,246,0.2)", color: "#c4b5fd", border: "1px solid rgba(139,92,246,0.3)" }}>
                  <Upload size={11} />
                  {hrSavedDocs.length} HR Doc{hrSavedDocs.length !== 1 ? "s" : ""}
                </span>
              )}
              <button onClick={onClose}
                className="w-8 h-8 rounded-lg bg-white/15 hover:bg-white/25 flex items-center justify-center text-white transition-all">
                <XIcon size={16} />
              </button>
            </div>
          </div>

          {/* ── Body ────────────────────────────────────────────────────── */}
          <div className="flex-1 overflow-y-auto p-5 space-y-5">

            {/* ── Section 1: Employee's accepted KYE docs ──────────────── */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                  <FileCheck size={12} className="text-blue-500" /> Employee Submitted KYE Form
                </p>
                {/* Insert new KYE doc button */}
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
                  <span className="text-sm text-gray-500">Loading documents…</span>
                </div>
              )}
              {error && !loading && (
                <div className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
                  <AlertCircle size={16} className="text-red-500 flex-shrink-0" />
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              )}

              {!loading && !error && kyeDocs.length === 0 && (
                <div
                  onClick={() => setKyeEditDoc(null)}
                  className="text-center py-6 text-gray-400 bg-blue-50 rounded-xl border-2 border-dashed border-blue-300 hover:bg-blue-100 cursor-pointer transition-all"
                >
                  <Upload size={24} className="mx-auto mb-2 text-blue-400" />
                  <p className="text-sm font-semibold text-blue-600">No KYE document yet — click to upload</p>
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
                        if (window.confirm("Delete this KYE document? This cannot be undone.")) {
                          fetch(`${BASE_API}/employee-docs/kye/${d.id}`, { method: "DELETE" })
                            .then(r => r.json())
                            .then(data => {
                              if (data.success) setDocs(prev => prev.filter(x => x.id !== d.id));
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

            {/* ── Section 2: Already HR-uploaded BGV/email docs ────────── */}
            {hrDocsLoading ? (
              <div className="flex items-center gap-2 py-3 text-gray-400">
                <Loader size={14} className="animate-spin" />
                <span className="text-xs">Loading HR documents…</span>
              </div>
            ) : hrSavedDocs.length > 0 && (
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                  <Upload size={12} className="text-violet-500" /> HR Uploaded Documents
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
            )}

            {/* ── Section 3: HR upload panel for pending BGV/email types ── */}
            {!hrDocsLoading && pendingHRTypes.length > 0 && (
              <div className="rounded-xl border border-violet-200 overflow-hidden">
                <div className="flex items-center gap-2 px-4 py-3 border-b border-violet-200"
                  style={{ background: "linear-gradient(135deg,#5b21b6,#7c3aed)" }}>
                  <Upload size={14} className="text-white" />
                  <p className="text-white text-xs font-bold">HR — Upload Additional Documents</p>
                  <span className="ml-auto text-violet-200 text-[10px] hidden sm:block">
                    {pendingHRTypes.map(t => t.label).join(" & ")}
                  </span>
                </div>
                <div className="p-4 space-y-4 bg-violet-50">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {pendingHRTypes.map(({ key, label, icon, accept }) => (
                      <div key={key}>
                        <p className="text-[11px] font-semibold text-gray-600 mb-1.5">{label}</p>
                        <HRDropZone
                          label={label} icon={icon} accept={accept}
                          file={hrFiles[key]}
                          onChange={(f) => setHrFiles(prev => ({ ...prev, [key]: f }))}
                          onRemove={() => setHrFiles(prev => ({ ...prev, [key]: null }))}
                        />
                      </div>
                    ))}
                  </div>
                  {hrUploadErr && (
                    <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                      <AlertCircle size={13} className="text-red-500 flex-shrink-0" />
                      <p className="text-xs text-red-700">{hrUploadErr}</p>
                    </div>
                  )}
                  <button
                    onClick={handleHRUpload}
                    disabled={hrUploading || (!hrFiles.bgv_form && !hrFiles.email_screenshot)}
                    className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-bold text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90 active:scale-[0.98]"
                    style={{ background: "linear-gradient(135deg,#5b21b6,#7c3aed)" }}
                  >
                    {hrUploading
                      ? <><Loader size={14} className="animate-spin" /> Uploading…</>
                      : <><Upload size={14} /> Upload Selected Documents</>}
                  </button>
                </div>
              </div>
            )}

            {/* All done notice */}
            {!hrDocsLoading && pendingHRTypes.length === 0 && hrSavedDocs.length > 0 && (
              <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-xl px-4 py-3">
                <CheckCheck size={15} className="text-green-500 flex-shrink-0" />
                <p className="text-xs text-green-700 font-medium">
                  All additional HR documents (BGV &amp; Approval Email) have been uploaded and saved.
                </p>
              </div>
            )}
          </div>

          {/* ── Footer ──────────────────────────────────────────────────── */}
          <div className="px-5 py-3 border-t border-gray-100 flex items-center justify-between bg-gray-50 gap-3 flex-wrap">
            <p className="text-xs text-gray-500">
              {kyeDocs.length} KYE doc{kyeDocs.length !== 1 ? "s" : ""} · {hrSavedDocs.length} HR doc{hrSavedDocs.length !== 1 ? "s" : ""} uploaded
            </p>
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
                  style={{ background: "linear-gradient(135deg, #0f172a, #1d4ed8)" }}
                  title={`Download all ${allViewableDocs.length} document(s) as one PDF`}
                >
                  {pdfDownloading
                    ? <><Loader size={14} className="animate-spin" /> Generating PDF…</>
                    : <><Download size={14} /> Download All as PDF ({allViewableDocs.length})</>}
                </button>
              )}
              <button onClick={onClose}
                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg text-sm font-medium transition-all">
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
  const [employees,    setEmployees]    = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [error,        setError]        = useState("");
  const [collapsed,    setCollapsed]    = useState(false);
  const [docsModalEmp, setDocsModalEmp] = useState(null);

  const fetchReviewed = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res  = await fetch(`${BASE_API}/employee-docs/reviewed`);
      const data = await res.json();
      if (data.success) setEmployees(data.data || []);
      else setError(data.message || "Failed to load");
    } catch {
      setError("Cannot connect to server");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchReviewed(); }, [fetchReviewed]);

  if (!loading && !error && employees.length === 0) return null;

  return (
    <>
      {docsModalEmp && (
        <DocsModal emp={docsModalEmp} onClose={() => setDocsModalEmp(null)} />
      )}
      <div className="mt-8">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "#dcfce7" }}>
              <CheckCheck size={18} style={{ color: "#16a34a" }} />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-lg font-semibold text-gray-900">Document-Verified Employees</h2>
                {!loading && employees.length > 0 && (
                  <span className="text-xs px-2.5 py-0.5 rounded-full font-semibold"
                    style={{ background: "#dcfce7", color: "#16a34a" }}>
                    {employees.length} employee{employees.length !== 1 ? "s" : ""}
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-500 mt-0.5">
                Employees whose signed KYE form has been accepted by HR
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={fetchReviewed}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:bg-gray-50 transition-all">
              <RefreshCw size={13} /> Refresh
            </button>
            <button onClick={() => setCollapsed(p => !p)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:bg-gray-50 transition-all">
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
                <span className="text-sm text-gray-500">Loading verified employees…</span>
              </div>
            )}
            {error && !loading && (
              <div className="flex items-center gap-3 px-4 py-3 bg-red-50 border border-red-200 rounded-xl mb-3">
                <AlertCircle size={16} className="text-red-500 flex-shrink-0" />
                <p className="text-sm text-red-700 flex-1">{error}</p>
                <button onClick={fetchReviewed} className="text-xs text-red-600 underline font-medium">Retry</button>
              </div>
            )}
            {!loading && !error && employees.length > 0 && (
              <div className="space-y-2">
                {employees.map((emp) => {
                  const docs = Array.isArray(emp.docs) ? emp.docs : [];
                  const acceptedCount = emp.accepted_docs || docs.filter(d =>
                    (d.status === "accepted" || d.reviewed) && d.document_type === "signed_kye"
                  ).length || 0;
                  const firstName = emp.first_name || "";
                  const lastName  = emp.last_name  || "";
                  const initials  = `${firstName[0] || "?"}${lastName[0] || ""}`.toUpperCase();

                  return (
                    <div key={emp.id}
                      className="bg-white rounded-xl border border-gray-200 hover:border-green-300 hover:shadow-sm transition-all overflow-hidden">
                      <div className="flex items-center gap-3 px-4 py-3">
                        <div className="w-10 h-10 rounded-full flex items-center justify-center font-semibold text-sm text-blue-700 flex-shrink-0"
                          style={{ background: "#dbeafe" }}>
                          {initials}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-gray-900 truncate">
                            {firstName} {emp.father_husband_name ? emp.father_husband_name + " " : ""}{lastName}
                          </p>
                          <p className="text-xs text-gray-500 truncate">
                            {emp.emp_id || emp.employee_id} · {emp.department || "—"} · {emp.position || "—"}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border"
                            style={{ background: "#f0fdf4", color: "#16a34a", borderColor: "#bbf7d0" }}>
                            <CheckCheck size={13} />
                            {acceptedCount} KYE doc{acceptedCount !== 1 ? "s" : ""} accepted
                          </span>
                          <button onClick={() => setDocsModalEmp(emp)}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
                            style={{ background: "linear-gradient(135deg, #1d4ed8, #3b82f6)", color: "#fff", border: "none" }}>
                            <FolderOpen size={13} /> Docs
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