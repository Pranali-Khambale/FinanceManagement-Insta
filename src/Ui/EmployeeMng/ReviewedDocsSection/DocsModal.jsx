import React, { useState, useEffect, useCallback } from "react";
import {
  CheckCircle,
  Shield,
  Upload,
  Loader,
  AlertCircle,
  CheckCheck,
  X as XIcon,
  FileCheck,
  FolderOpen,
  User,
  Download,
} from "lucide-react";
import { BASE_URL as BASE_API } from "@/api/client";
import { getAuthHeaders } from "@/utils/presignUtils";
import { downloadAllAsPdf } from "@/utils/fileUtils";
import { HR_UPLOAD_TYPES, REG_DOC_LABELS } from "./constants";
import DocCard from "./DocCard";
import DocLightbox from "./DocLightbox";
import KyeEditModal from "./KyeEditModal";
import RegDocsSubSection from "./RegDocsSubSection";
import HRDropZone from "./HRDropZone";

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
    fetch(`${BASE_API}/employee-docs/submissions/${emp.id}`, {
      headers: getAuthHeaders(),
    })
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
    fetch(`${BASE_API}/employee-docs/hr-uploads/${emp.id}`, {
      headers: getAuthHeaders(),
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.success)
          setHrSavedDocs(
            (data.data || []).map((d) => ({ ...d, _isHRUpload: true })),
          );
      })
      .catch(() => {})
      .finally(() => setHrDocsLoading(false));
  }, [emp.id]);

  useEffect(() => {
    setRegDocsLoading(true);
    fetch(`${BASE_API}/employees/${emp.id}`, { headers: getAuthHeaders() })
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

  const uploadedHRTypes = new Set(hrSavedDocs.map((d) => d.document_type));
  const stagedHRDocs = HR_UPLOAD_TYPES.filter(
    ({ key }) => hrFiles[key] && !uploadedHRTypes.has(key),
  ).map(({ key, label }) => ({
    _stagedFile: hrFiles[key],
    document_type: key,
    file_path: null,
    file_name: hrFiles[key].name,
    mime_type: hrFiles[key].type,
    _isHRUpload: true,
    _regLabel: label,
  }));

  const allViewableDocs = [
    ...kyeDocs,
    ...hrSavedDocs.filter((d) => d.file_path),
    ...stagedHRDocs,
    ...regDocs,
  ];

  const employeeFullName =
    [emp.first_name, emp.father_husband_name, emp.last_name]
      .filter(Boolean)
      .join(" ") || "Employee";

  const handleDownloadAllPdf = async () => {
    if (!allViewableDocs.length) return;
    setPdfError("");
    setPdfDownloading(true);
    try {
      await downloadAllAsPdf(allViewableDocs, emp);
    } catch {
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
        headers: getAuthHeaders(),
      });
      const data = await res.json();
      if (data.success) {
        setHrSavedDocs((prev) => [
          ...prev,
          ...(data.data || []).map((d) => ({ ...d, _isHRUpload: true })),
        ]);
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
        {
          method: "DELETE",
          headers: getAuthHeaders(),
        },
      );
      const data = await res.json();
      if (data.success)
        setHrSavedDocs((prev) => prev.filter((d) => d.id !== doc.id));
      else alert(data.message || "Failed to delete document.");
    } catch {
      alert("Cannot connect to server.");
    }
  };

  const handleKyeSaved = () => {
    setKyeEditDoc(undefined);
    fetchKyeDocs();
  };
  const handleKyeDeleted = (delId) => {
    setKyeEditDoc(undefined);
    setDocs((prev) => prev.filter((d) => d.id !== delId));
  };

  const pendingHRTypes = HR_UPLOAD_TYPES.filter(
    (t) => !uploadedHRTypes.has(t.key),
  );
  const firstName = emp.first_name || "";
  const lastName = emp.last_name || "";
  const initials = `${firstName[0] || "?"}${lastName[0] || ""}`.toUpperCase();
  const isAnyLoading = loading || hrDocsLoading || regDocsLoading;
  const stagedCount = stagedHRDocs.length;
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
        className="fixed inset-0 z-[500] flex items-end sm:items-center justify-center p-0 sm:p-4"
        style={{ background: "rgba(0,0,0,0.55)", backdropFilter: "blur(4px)" }}
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose();
        }}
      >
        <div
          className="bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl w-full overflow-hidden flex flex-col"
          style={{ maxWidth: 640, maxHeight: "95vh" }}
        >
          {/* Header */}
          <div
            className="flex items-center gap-3 px-4 py-3 sm:px-5 sm:py-4 border-b border-gray-100 flex-shrink-0"
            style={{
              background: "linear-gradient(135deg, #0f172a 0%, #1d4ed8 100%)",
            }}
          >
            <div
              className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl flex items-center justify-center font-bold text-sm text-white flex-shrink-0"
              style={{ background: "rgba(255,255,255,0.2)" }}
            >
              {initials}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-white font-bold text-sm sm:text-base truncate">
                {employeeFullName}
              </h3>
              <p className="text-blue-200 text-[10px] sm:text-xs mt-0.5 truncate">
                {emp.emp_id || emp.employee_id} · {emp.department || "—"} ·{" "}
                {emp.position || emp.designation || "—"}
              </p>
            </div>
            <div className="flex items-center gap-1.5 flex-shrink-0 flex-wrap justify-end">
              <span
                className="flex items-center gap-1 sm:gap-1.5 px-2 py-1 rounded-full text-[10px] sm:text-xs font-bold"
                style={{
                  background: "rgba(34,197,94,0.2)",
                  color: "#86efac",
                  border: "1px solid rgba(34,197,94,0.3)",
                }}
              >
                <CheckCheck size={10} /> {kyeDocs.length} KYE
              </span>
              {(hrSavedDocs.length > 0 || stagedCount > 0) && (
                <span
                  className="flex items-center gap-1 sm:gap-1.5 px-2 py-1 rounded-full text-[10px] sm:text-xs font-bold"
                  style={{
                    background: "rgba(139,92,246,0.2)",
                    color: "#c4b5fd",
                    border: "1px solid rgba(139,92,246,0.3)",
                  }}
                >
                  <Shield size={10} /> {hrSavedDocs.length + stagedCount} HR
                  {stagedCount > 0 && (
                    <span className="text-amber-300 ml-1">+{stagedCount}</span>
                  )}
                </span>
              )}
              {regDocs.length > 0 && (
                <span
                  className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold"
                  style={{
                    background: "rgba(245,158,11,0.2)",
                    color: "#fcd34d",
                    border: "1px solid rgba(245,158,11,0.3)",
                  }}
                >
                  <User size={10} /> {regDocs.length} Reg
                </span>
              )}
              <button
                onClick={onClose}
                className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-white/15 hover:bg-white/25 flex items-center justify-center text-white transition-all"
              >
                <XIcon size={15} />
              </button>
            </div>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-5">
            {/* KYE docs */}
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
                            headers: getAuthHeaders(),
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

            {/* HR uploaded docs */}
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

            {/* Registration docs */}
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

            {/* HR upload panel */}
            {!hrDocsLoading && pendingHRTypes.length > 0 && (
              <div className="rounded-xl border border-violet-200 overflow-hidden">
                <div
                  className="flex items-center gap-2 px-4 py-3 border-b border-violet-200"
                  style={{
                    background: "linear-gradient(135deg,#5b21b6,#7c3aed)",
                  }}
                >
                  <Upload size={14} className="text-white" />
                  <p className="text-white text-xs font-bold flex-1 truncate">
                    HR — Upload Additional Documents
                  </p>
                  <span className="text-violet-200 text-[10px] hidden sm:block flex-shrink-0">
                    {pendingHRTypes.map((t) => t.label).join(" & ")}
                  </span>
                </div>
                <div className="p-3 sm:p-4 space-y-4 bg-violet-50">
                  {stagedCount > 0 && (
                    <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                      <AlertCircle
                        size={13}
                        className="text-amber-500 flex-shrink-0 mt-0.5"
                      />
                      <p className="text-xs text-amber-700">
                        <strong>
                          {stagedCount} staged file{stagedCount > 1 ? "s" : ""}
                        </strong>{" "}
                        will be included in the PDF even before uploading. Click{" "}
                        <strong>"Upload Selected Documents"</strong> to save
                        permanently.
                      </p>
                    </div>
                  )}
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
          <div className="px-4 py-3 sm:px-5 border-t border-gray-100 flex items-center justify-between bg-gray-50 gap-2 flex-wrap flex-shrink-0">
            <div className="flex items-center gap-2 text-xs text-gray-500 flex-wrap">
              <span>{kyeDocs.length} KYE</span>
              <span className="text-gray-300">·</span>
              <span>
                {hrSavedDocs.length} HR
                {stagedCount > 0 && (
                  <span className="text-amber-500 font-semibold ml-1">
                    +{stagedCount}
                  </span>
                )}
              </span>
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
                  className="flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold text-white transition-all disabled:opacity-60 disabled:cursor-not-allowed hover:opacity-90 active:scale-[0.98]"
                  style={{
                    background: "linear-gradient(135deg, #0f172a, #1d4ed8)",
                  }}
                  title={`Download all ${allViewableDocs.length} document(s) as one PDF`}
                >
                  {pdfDownloading ? (
                    <>
                      <Loader size={13} className="animate-spin" />{" "}
                      <span className="hidden sm:inline">Generating PDF…</span>
                      <span className="sm:hidden">PDF…</span>
                    </>
                  ) : (
                    <>
                      <Download size={13} />{" "}
                      <span className="hidden sm:inline">
                        Download All as PDF ({allViewableDocs.length})
                      </span>
                      <span className="sm:hidden">
                        PDF ({allViewableDocs.length})
                      </span>
                    </>
                  )}
                </button>
              )}
              <button
                onClick={onClose}
                className="px-3 sm:px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg text-xs sm:text-sm font-medium transition-all"
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

export default DocsModal;
