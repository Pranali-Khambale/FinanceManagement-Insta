import React, { useState } from "react";
import {
  FileCheck,
  X as XIcon,
  Upload,
  Loader,
  AlertCircle,
  Trash2,
} from "lucide-react";
import { BASE_URL as BASE_API } from "@/api/client";
import { getAuthHeaders } from "@/utils/presignUtils";
import HRDropZone from "./HRDropZone";

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
      const res = await fetch(url, {
        method: isNew ? "POST" : "PUT",
        body: fd,
        headers: getAuthHeaders(),
      });
      const data = await res.json();
      if (data.success) onSaved(data.data);
      else setError(data.message || "Failed to save.");
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
        headers: getAuthHeaders(),
      });
      const data = await res.json();
      if (data.success) onDeleted(doc.id);
      else setError(data.message || "Failed to delete.");
    } catch {
      setError("Cannot connect to server.");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[600] flex items-end sm:items-center justify-center p-0 sm:p-4"
      style={{ background: "rgba(0,0,0,0.60)", backdropFilter: "blur(4px)" }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl w-full overflow-hidden"
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
                <span className="hidden sm:inline">Delete</span>
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

export default KyeEditModal;
