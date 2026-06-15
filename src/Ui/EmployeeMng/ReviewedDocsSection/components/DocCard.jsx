// src/Ui/EmployeeMng/ReviewedDocsSection/components/DocCard.jsx
import React, { useState, useEffect } from "react";
import { CheckCircle, Eye, Download, Upload, Trash2, FileText } from "lucide-react";
import { DOC_TYPE_META } from "../constants/docTypeMeta";
import { getFileType } from "../utils/fileHelpers";
import { getPresignedUrl } from "../utils/urlHelpers";

// ── Reusable doc card ─────────────────────────────────────────────────────────
const DocCard = ({ doc, index, onView, onEdit, onDelete }) => {
  const meta = DOC_TYPE_META[doc.document_type] || DOC_TYPE_META.other;
  const Icon = meta.icon;
  const mime = doc.mime_type || doc.mimeType || "";
  const ft = getFileType(doc.file_path, mime);
  const label = doc._regLabel || meta.label;
  const [url, setUrl] = useState(null);

  useEffect(() => {
    if (!doc.file_path) return;
    // FIX: getPresignedUrl handles both raw keys and full URLs internally
    getPresignedUrl(doc.file_path)
      .then(setUrl)
      .catch(() => {});
  }, [doc.file_path]);

  return (
    <div
      className="rounded-xl border overflow-hidden transition-all hover:shadow-sm"
      style={{ background: meta.bg, borderColor: meta.border }}
    >
      <div className="flex items-center gap-3 px-4 py-3">
        {/* Thumbnail */}
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

        {/* Info */}
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

        {/* Actions */}
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

export default DocCard;