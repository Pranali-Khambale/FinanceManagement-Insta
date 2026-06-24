import React, { useState, useEffect } from "react";
import {
  Eye,
  Download,
  FileText,
  Loader,
  Check,
  X as XIcon,
} from "lucide-react";
import { getDocUrl, fullUrl } from "../../../../utils/presignCache";
import { getFileType, DOC_META } from "../../../../utils/docUtils";

const DocViewRow = ({ doc, onView }) => {
  const meta = DOC_META[doc.document_type] || DOC_META.other;
  const ft = getFileType(doc.file_path, doc.mime_type);

  const [url, setUrl] = useState(() => fullUrl(doc.file_path));
  useEffect(() => {
    getDocUrl(doc.file_path).then(setUrl);
  }, [doc.file_path]);

  const isAccepted = doc.status === "accepted" || doc.reviewed === true;
  const isRejected = doc.status === "rejected";
  const isPending = !isAccepted && !isRejected;

  return (
    <div
      className="rounded-xl border transition-all"
      style={{
        background: isAccepted
          ? "#f0fdf4"
          : isRejected
            ? "#fef2f2"
            : meta.color.bg,
        borderColor: isAccepted
          ? "#bbf7d0"
          : isRejected
            ? "#fecaca"
            : meta.color.border,
      }}
    >
      <div className="flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-3">
        {/* Thumbnail */}
        <div
          className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg overflow-hidden border flex-shrink-0 flex items-center justify-center"
          style={{
            borderColor: meta.color.border,
            background: ft === "image" ? "transparent" : meta.color.bg,
          }}
        >
          {ft === "image" && url ? (
            <img
              src={url}
              alt={meta.label}
              className="w-full h-full object-cover"
              onError={(e) => {
                e.target.style.display = "none";
              }}
            />
          ) : ft === "pdf" ? (
            <div
              className="w-full h-full flex flex-col items-center justify-center gap-0.5"
              style={{ background: meta.color.bg }}
            >
              <FileText
                className="w-4 h-4 sm:w-5 sm:h-5"
                style={{ color: meta.color.text }}
              />
              <span
                className="text-[7px] sm:text-[8px] font-bold"
                style={{ color: meta.color.text }}
              >
                PDF
              </span>
            </div>
          ) : url ? (
            <div
              className="w-full h-full flex items-center justify-center"
              style={{ background: meta.color.bg }}
            >
              <FileText
                className="w-4 h-4 sm:w-5 sm:h-5"
                style={{ color: meta.color.text }}
              />
            </div>
          ) : (
            <div
              className="w-full h-full flex items-center justify-center"
              style={{ background: meta.color.bg }}
            >
              <Loader
                className="w-4 h-4 animate-spin"
                style={{ color: meta.color.text }}
              />
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 sm:gap-2 mb-0.5 flex-wrap">
            <p className="text-xs sm:text-sm font-bold text-gray-900 truncate">
              {meta.label}
            </p>
            {isPending && (
              <span
                className="flex-shrink-0 text-[8px] sm:text-[9px] font-bold px-1.5 py-0.5 rounded-full"
                style={{ background: meta.color.dot, color: "#fff" }}
              >
                PENDING
              </span>
            )}
            {isAccepted && (
              <span className="flex-shrink-0 inline-flex items-center gap-1 text-[8px] sm:text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-green-500 text-white">
                <Check
                  className="w-2 h-2 sm:w-2.5 sm:h-2.5"
                  style={{ strokeWidth: 3 }}
                />{" "}
                ACCEPTED
              </span>
            )}
            {isRejected && (
              <span className="flex-shrink-0 inline-flex items-center gap-1 text-[8px] sm:text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-red-500 text-white">
                <XIcon
                  className="w-2 h-2 sm:w-2.5 sm:h-2.5"
                  style={{ strokeWidth: 3 }}
                />{" "}
                REJECTED
              </span>
            )}
          </div>
          <p className="text-[10px] sm:text-xs text-gray-500 truncate">
            {doc.file_name}
          </p>
          <p className="text-[9px] sm:text-[10px] text-gray-400 mt-0.5">
            {new Date(doc.uploaded_at).toLocaleString("en-IN", {
              day: "numeric",
              month: "short",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </p>
          {isRejected && doc.rejection_reason && (
            <p className="text-[9px] sm:text-[10px] text-red-500 mt-1 italic">
              Reason: {doc.rejection_reason}
            </p>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 sm:gap-1.5 flex-shrink-0">
          {url ? (
            <>
              <button
                onClick={() => onView(doc)}
                className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg flex items-center justify-center border border-gray-200 bg-white hover:border-blue-300 hover:bg-blue-50 transition-all"
                title="View document"
              >
                <Eye className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-500" />
              </button>
              <a
                href={url}
                download
                target="_blank"
                rel="noopener noreferrer"
                className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg flex items-center justify-center border border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50 transition-all"
                title="Download"
              >
                <Download className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-500" />
              </a>
            </>
          ) : (
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg flex items-center justify-center border border-gray-100 bg-gray-50">
              <Loader className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-400 animate-spin" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DocViewRow;
