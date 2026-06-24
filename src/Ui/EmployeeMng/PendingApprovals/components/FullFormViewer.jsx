import React, { useState, useEffect } from "react";
import {
  User,
  Mail,
  Briefcase,
  FileText,
  UserCircle,
  CreditCard,
  FileCheck,
  Building,
  Shield,
  Award,
  Eye,
  Loader,
  Printer,
} from "lucide-react";
import { getDocUrl } from "../../../../utils/presignCache";
import { getFileType, normalizeDocType } from "../../../../utils/docUtils";
import { formatDate, formatDateTime } from "../../../../utils/dateUtils";
import { printKYEForm } from "../../KYEPrintForm";
import Avatar from "./Avatar";
import Lightbox from "./Lightbox";

const DOC_DEFS = [
  {
    type: "idPhoto",
    label: "Employee Photo",
    icon: <UserCircle className="w-4 h-4" />,
  },
  {
    type: "aadharCard",
    label: "Aadhaar Card",
    icon: <CreditCard className="w-4 h-4" />,
  },
  {
    type: "panCard",
    label: "PAN Card",
    icon: <FileCheck className="w-4 h-4" />,
  },
  { type: "resume", label: "Resume", icon: <FileText className="w-4 h-4" /> },
  {
    type: "bankPassbook",
    label: "Bank Passbook",
    icon: <Building className="w-4 h-4" />,
  },
  {
    type: "medicalCertificate",
    label: "Medical Certificate",
    icon: <Shield className="w-4 h-4" />,
  },
  {
    type: "academicRecords",
    label: "Academic Records",
    icon: <Award className="w-4 h-4" />,
  },
  {
    type: "payslip",
    label: "Pay Slip",
    icon: <FileText className="w-4 h-4" />,
  },
  {
    type: "otherCertificates",
    label: "Other Certificates",
    icon: <FileText className="w-4 h-4" />,
  },
];

const SectionTitle = ({ num, title, icon }) => (
  <div className="flex items-center gap-3 mb-4 pb-3 border-b border-gray-100">
    <div
      className="w-7 h-7 rounded-lg flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
      style={{ background: "linear-gradient(135deg,#1d4ed8,#3b82f6)" }}
    >
      {num}
    </div>
    <div className="flex items-center gap-2">
      <span className="text-blue-600">{icon}</span>
      <h4 className="font-semibold text-gray-900 text-sm">{title}</h4>
    </div>
  </div>
);

const Field = ({ label, value, span = 1 }) => (
  <div className={span === 2 ? "col-span-2" : ""}>
    <p className="text-xs font-medium text-gray-500 mb-1">{label}</p>
    <p className="text-sm text-gray-900 bg-white border border-gray-200 rounded-lg px-3 py-2 min-h-[36px] break-words">
      {value || (
        <span className="text-gray-400 italic text-xs">Not provided</span>
      )}
    </p>
  </div>
);

const FullFormViewer = ({ employee, onClose }) => {
  const [lightbox, setLightbox] = useState(null);
  const [resolvedDocUrls, setResolvedDocUrls] = useState({});

  const uploadedDocs = DOC_DEFS.map((def) => {
    const found = Array.isArray(employee.documents)
      ? employee.documents.find(
          (d) =>
            normalizeDocType(d.type) === def.type ||
            normalizeDocType(d.document_type) === def.type,
        )
      : null;
    return { ...def, path: found?.path || found?.file_path || null };
  });
  const availableDocs = uploadedDocs.filter((d) => d.path);

  useEffect(() => {
    if (!availableDocs.length) return;
    Promise.all(
      availableDocs.map((d) => getDocUrl(d.path).then((url) => [d.type, url])),
    ).then((pairs) => {
      setResolvedDocUrls(Object.fromEntries(pairs.filter(([, url]) => url)));
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [employee.id]);

  const openLightbox = (type) => {
    const idx = availableDocs.findIndex((d) => d.type === type);
    if (idx >= 0) setLightbox({ docs: availableDocs, startIndex: idx });
  };

  return (
    <>
      {lightbox && (
        <Lightbox
          docs={lightbox.docs}
          startIndex={lightbox.startIndex}
          onClose={() => setLightbox(null)}
        />
      )}
      <div
        className="fixed inset-0 z-[100] flex items-start sm:items-center justify-center p-2 sm:p-4 overflow-y-auto"
        style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)" }}
      >
        <div
          className="bg-white rounded-2xl shadow-2xl w-full max-w-7xl my-2 sm:my-4 flex flex-col"
          style={{ maxHeight: "95dvh" }}
        >
          {/* Modal header */}
          <div
            className="flex items-center justify-between px-4 sm:px-6 py-4 border-b border-gray-100 flex-shrink-0 gap-3"
            style={{
              background: "linear-gradient(90deg,#1e3a5f 0%,#1d4ed8 100%)",
              borderRadius: "16px 16px 0 0",
            }}
          >
            <div className="flex items-center gap-3 sm:gap-4 min-w-0">
              <Avatar
                firstName={employee.first_name}
                lastName={employee.last_name}
                size="lg"
              />
              <div className="min-w-0">
                <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                  <h2 className="text-base sm:text-xl font-bold text-white truncate">
                    {employee.first_name} {employee.last_name}
                  </h2>
                  {employee.status === "pending_rejoin" && (
                    <span
                      className="px-2 py-0.5 rounded-full text-[10px] font-bold flex-shrink-0"
                      style={{
                        background: "rgba(251,191,36,0.25)",
                        color: "#fbbf24",
                        border: "1px solid rgba(251,191,36,0.4)",
                      }}
                    >
                      RETURNING
                    </span>
                  )}
                </div>
                <p className="text-blue-200 text-xs sm:text-sm truncate">
                  {employee.position || "Position not specified"} &bull;{" "}
                  {employee.department || "Department not specified"}
                </p>
                <p className="text-blue-300 text-[10px] sm:text-xs mt-1">
                  Applied: {formatDateTime(employee.created_at)}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
              <button
                onClick={() => printKYEForm(employee)}
                className="hidden sm:flex items-center gap-1.5 px-3.5 py-2 bg-white/15 hover:bg-white/25 text-white rounded-lg text-xs font-semibold border border-white/20"
              >
                <Printer className="w-3.5 h-3.5" /> Print
              </button>
              <button
                onClick={onClose}
                className="px-3 sm:px-4 py-2 bg-white rounded-lg text-xs sm:text-sm font-semibold text-blue-900 hover:bg-blue-50"
              >
                Close
              </button>
            </div>
          </div>

          {/* Modal body */}
          <div className="flex-1 overflow-y-auto p-3 sm:p-6 bg-gray-50">
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-6">
              {/* Left column */}
              <div className="space-y-4 sm:space-y-5">
                <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-5 shadow-sm">
                  <SectionTitle
                    num="1"
                    title="Personal Information"
                    icon={<User className="w-4 h-4" />}
                  />
                  <div className="grid grid-cols-2 gap-2 sm:gap-3">
                    <Field label="First Name" value={employee.first_name} />
                    <Field label="Last Name" value={employee.last_name} />
                    <Field
                      label="Father / Husband Name"
                      value={employee.father_husband_name}
                    />
                    <Field
                      label="Date of Birth"
                      value={formatDate(employee.date_of_birth)}
                    />
                    <Field label="Gender" value={employee.gender} />
                    <Field label="Blood Group" value={employee.blood_group} />
                    <Field
                      label="Marital Status"
                      value={employee.marital_status}
                    />
                    <Field
                      label="Educational Qualification"
                      value={employee.educational_qualification}
                    />
                    <Field label="PAN Number" value={employee.pan_number} />
                    <Field label="Name on PAN" value={employee.name_on_pan} />
                    <Field
                      label="Aadhaar Number"
                      value={employee.aadhar_number}
                    />
                    <Field
                      label="Name on Aadhaar"
                      value={employee.name_on_aadhar}
                    />
                  </div>
                </div>
                <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-5 shadow-sm">
                  <SectionTitle
                    num="2"
                    title="Contact Information"
                    icon={<Mail className="w-4 h-4" />}
                  />
                  <div className="grid grid-cols-2 gap-2 sm:gap-3">
                    <Field
                      label="Email Address"
                      value={employee.email}
                      span={2}
                    />
                    <Field label="Primary Phone" value={employee.phone} />
                    <Field label="Alternate Phone" value={employee.alt_phone} />
                  </div>
                </div>
              </div>

              {/* Right column */}
              <div className="space-y-4 sm:space-y-5">
                <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-5 shadow-sm">
                  <SectionTitle
                    num="3"
                    title="Employment Details"
                    icon={<Briefcase className="w-4 h-4" />}
                  />
                  <div className="grid grid-cols-2 gap-2 sm:gap-3">
                    <Field label="Department" value={employee.department} />
                    <Field label="Designation" value={employee.position} />
                    <Field
                      label="Employment Type"
                      value={employee.employment_type}
                    />
                    <Field
                      label="Joining Date"
                      value={formatDate(employee.joining_date)}
                    />
                    <Field
                      label="Reporting Manager"
                      value={employee.reporting_manager}
                    />
                  </div>
                </div>

                {availableDocs.length > 0 && (
                  <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-5 shadow-sm">
                    <SectionTitle
                      num="4"
                      title="Uploaded Documents"
                      icon={<FileText className="w-4 h-4" />}
                    />
                    <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-2 gap-2 sm:gap-3">
                      {uploadedDocs.map((doc) => {
                        const url = resolvedDocUrls[doc.type] || null;
                        const ft = getFileType(doc.path, null);
                        return (
                          <div
                            key={doc.type}
                            className={`rounded-xl border overflow-hidden transition-all ${
                              url
                                ? "border-indigo-200 bg-white hover:border-blue-400 hover:shadow-md cursor-pointer"
                                : "border-gray-200 bg-gray-50"
                            }`}
                            onClick={() => url && openLightbox(doc.type)}
                          >
                            <div className="relative h-20 sm:h-24 bg-gray-100 flex items-center justify-center overflow-hidden">
                              {ft === "image" && url ? (
                                <img
                                  src={url}
                                  alt={doc.label}
                                  className="w-full h-full object-cover"
                                  onError={(e) => {
                                    e.target.style.display = "none";
                                  }}
                                />
                              ) : ft === "pdf" && url ? (
                                <div className="flex flex-col items-center gap-1 w-full h-full bg-red-50 justify-center">
                                  <FileText className="w-6 h-6 sm:w-7 sm:h-7 text-red-400" />
                                  <span className="text-xs font-bold text-red-500">
                                    PDF
                                  </span>
                                </div>
                              ) : url ? (
                                <div className="flex flex-col items-center gap-1 w-full h-full bg-blue-50 justify-center">
                                  <FileText className="w-6 h-6 sm:w-7 sm:h-7 text-blue-400" />
                                  <span className="text-xs font-bold text-blue-500">
                                    FILE
                                  </span>
                                </div>
                              ) : doc.path ? (
                                <div className="flex items-center justify-center w-full h-full bg-gray-100">
                                  <Loader className="w-5 h-5 sm:w-6 sm:h-6 text-gray-400 animate-spin" />
                                </div>
                              ) : (
                                <div className="flex items-center justify-center w-full h-full bg-gray-100">
                                  <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gray-200 text-gray-400 flex items-center justify-center">
                                    {doc.icon}
                                  </div>
                                </div>
                              )}
                              {url && (
                                <div className="absolute inset-0 bg-blue-900/60 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
                                  <div className="flex items-center gap-1.5 text-white text-xs font-semibold">
                                    <Eye className="w-4 h-4" /> View
                                  </div>
                                </div>
                              )}
                              <div
                                className={`absolute top-1.5 right-1.5 px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                                  url
                                    ? "bg-green-500 text-white"
                                    : "bg-gray-300 text-gray-600"
                                }`}
                              >
                                {url ? "✓" : "—"}
                              </div>
                            </div>
                            <div className="px-2 sm:px-3 py-2 border-t border-gray-100">
                              <p className="text-xs font-semibold text-gray-800 truncate">
                                {doc.label}
                              </p>
                              <p
                                className={`text-[10px] mt-0.5 ${url ? "text-blue-500" : "text-gray-400"}`}
                              >
                                {url
                                  ? "Click to view"
                                  : doc.path
                                    ? "Loading…"
                                    : "Not uploaded"}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default FullFormViewer;
