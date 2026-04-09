import React, { useState, useRef, useEffect } from "react";
import {
  X, Save, Loader, User, Users, Phone, Home, Building2, FileText, Copy,
  Upload, Trash2, Eye, Image, File, CheckCircle, AlertCircle, Paperclip,
  ZoomIn, ZoomOut, RotateCw, Download, ChevronLeft, ChevronRight,
  Heart, BookOpen, Banknote, Award, Radio, CreditCard, Shield,
} from "lucide-react";
import employeeService from "../../services/employeeService";

const maritalStatuses = ["Married", "Unmarried"];
const bloodGroups = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

// ── All 10 document types, grouped into sections ─────────────────────────────
const DOC_SECTIONS = [
  {
    label: "Identity & Personal",
    color: "blue",
    docs: [
      { key: "photo",        label: "Employee Photo",        accept: "image/*",      icon: User,      required: true,  description: "Passport-size photo" },
      { key: "aadharCard",   label: "Aadhaar Card",          accept: "image/*,.pdf", icon: CreditCard, required: true,  description: "Front and back sides" },
      { key: "panCard",      label: "PAN Card",              accept: "image/*,.pdf", icon: FileText,  required: false, description: "Optional — if available" },
      { key: "resume",       label: "Resume (Signed Copy)",  accept: "image/*,.pdf", icon: FileText,  required: true,  description: "Signed latest resume" },
    ],
  },
  {
    label: "KYE Form Documents",
    color: "indigo",
    docs: [
      { key: "medicalCertificate", label: "Medical Certificate",         accept: "image/*,.pdf", icon: Heart,     required: false, description: "Medical fitness certificate" },
      { key: "academicRecords",    label: "Academic Records",            accept: "image/*,.pdf", icon: BookOpen,  required: false, description: "SSC, ITI, HSC, Diploma, Degree" },
      { key: "bankPassbook",       label: "Bank Passbook / Cheque",      accept: "image/*,.pdf", icon: Building2, required: true,  description: "For bank account verification" },
      { key: "payslip",            label: "Pay Slip / Bank Statement",   accept: "image/*,.pdf", icon: Banknote,  required: false, description: "Last drawn salary proof" },
      { key: "farmToCli",          label: "FARM-ToCli Certificate",      accept: "image/*,.pdf", icon: Radio,     required: false, description: "Telecom — FARM-ToCli compliance", badge: "Telecom Only" },
      { key: "otherCertificates",  label: "Other Certificates",          accept: "image/*,.pdf", icon: Award,     required: false, description: "Any other relevant certificates" },
    ],
  },
];

// Flat list for lookups
const ALL_DOC_TYPES = DOC_SECTIONS.flatMap((s) => s.docs);

// ── Resolve API base URL ──────────────────────────────────────────────────────
const API_BASE =
  (typeof import.meta !== "undefined" && import.meta.env?.VITE_API_URL) ||
  "http://localhost:5000/api";

const SERVER_ROOT = API_BASE.replace(/\/api\/?$/, "");

function resolveFilePath(filePath) {
  if (!filePath) return "";
  if (filePath.startsWith("http://") || filePath.startsWith("https://")) return filePath;
  return `${SERVER_ROOT}${filePath.startsWith("/") ? "" : "/"}${filePath}`;
}

const g = (obj, snake, camel, fallback = "") => obj[snake] ?? obj[camel] ?? fallback;
const sliceDate = (v) => (v ? String(v).slice(0, 10) : "");

/* ═══════════════════════════════════════════════════════════════
   DocViewer — full-screen lightbox
═══════════════════════════════════════════════════════════════ */
const DocViewer = ({ docs, initialKey, onClose }) => {
  const uploaded = ALL_DOC_TYPES.filter((dt) => docs[dt.key]).map((dt) => ({
    ...dt,
    doc: docs[dt.key],
  }));

  const [idx, setIdx]       = useState(() => Math.max(0, uploaded.findIndex((u) => u.key === initialKey)));
  const [zoom, setZoom]     = useState(1);
  const [rotate, setRotate] = useState(0);

  useEffect(() => { setZoom(1); setRotate(0); }, [idx]);

  useEffect(() => {
    const h = (e) => {
      if (e.key === "Escape")     onClose();
      if (e.key === "ArrowLeft")  setIdx((i) => Math.max(0, i - 1));
      if (e.key === "ArrowRight") setIdx((i) => Math.min(uploaded.length - 1, i + 1));
      if (e.key === "+" || e.key === "=") setZoom((z) => Math.min(3, +(z + 0.25).toFixed(2)));
      if (e.key === "-")          setZoom((z) => Math.max(0.5, +(z - 0.25).toFixed(2)));
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [uploaded.length, onClose]);

  if (!uploaded.length) return null;
  const current = uploaded[idx];
  const isPdf   = current?.doc?.mime_type === "application/pdf";
  const isImage = current?.doc?.mime_type?.startsWith("image/");
  const fileUrl = resolveFilePath(current?.doc?.file_path);

  return (
    <div
      className="fixed inset-0 z-[1300] bg-black/85 flex flex-col"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="flex items-center justify-between px-4 py-2.5 bg-gray-950/95 border-b border-white/10 shrink-0 gap-3">
        <div className="flex items-center gap-1 overflow-x-auto min-w-0" style={{ scrollbarWidth: "none" }}>
          {uploaded.map((u, i) => (
            <button key={u.key} onClick={() => setIdx(i)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors shrink-0 ${
                i === idx ? "bg-blue-600 text-white" : "text-gray-400 hover:text-white hover:bg-white/10"
              }`}>
              {u.doc.mime_type?.startsWith("image/") ? <Image className="w-3 h-3" /> : <File className="w-3 h-3" />}
              {u.label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-0.5 shrink-0">
          {isImage && (
            <>
              <button onClick={() => setZoom((z) => Math.max(0.5, +(z - 0.25).toFixed(2)))} title="Zoom out"
                className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors">
                <ZoomOut className="w-4 h-4" />
              </button>
              <span className="text-xs text-gray-400 w-11 text-center select-none tabular-nums">
                {Math.round(zoom * 100)}%
              </span>
              <button onClick={() => setZoom((z) => Math.min(3, +(z + 0.25).toFixed(2)))} title="Zoom in"
                className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors">
                <ZoomIn className="w-4 h-4" />
              </button>
              <button onClick={() => setRotate((r) => (r + 90) % 360)} title="Rotate"
                className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors">
                <RotateCw className="w-4 h-4" />
              </button>
              <div className="w-px h-5 bg-white/20 mx-1.5" />
            </>
          )}
          <a href={fileUrl} download={current.doc.file_name} target="_blank" rel="noreferrer" title="Download"
            className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors">
            <Download className="w-4 h-4" />
          </a>
          <button onClick={onClose} title="Close (Esc)"
            className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-red-600 transition-colors ml-1">
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="flex-1 relative overflow-hidden flex items-center justify-center min-h-0">
        {idx > 0 && (
          <button onClick={() => setIdx((i) => i - 1)}
            className="absolute left-3 z-10 p-2.5 rounded-full bg-black/60 text-white hover:bg-black/90 transition-colors shadow-lg">
            <ChevronLeft className="w-5 h-5" />
          </button>
        )}
        {isImage && (
          <div className="w-full h-full flex items-center justify-center overflow-auto p-8">
            <img src={fileUrl} alt={current.label} draggable={false}
              style={{
                transform: `scale(${zoom}) rotate(${rotate}deg)`,
                transformOrigin: "center center",
                transition: "transform 0.18s ease",
                maxWidth: zoom <= 1 ? "100%" : "none",
                maxHeight: zoom <= 1 ? "100%" : "none",
                objectFit: "contain",
                userSelect: "none",
              }}
            />
          </div>
        )}
        {isPdf && (
          <iframe key={fileUrl} src={`${fileUrl}#toolbar=1&navpanes=0&scrollbar=1`}
            title={current.label} className="w-full h-full border-0" style={{ minHeight: 0 }} />
        )}
        {!isImage && !isPdf && (
          <div className="flex flex-col items-center gap-4 text-gray-400 p-8 text-center">
            <File className="w-16 h-16 opacity-30" />
            <p className="text-sm text-gray-300">Preview not available for this file type.</p>
            <a href={fileUrl} download={current.doc.file_name} target="_blank" rel="noreferrer"
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg transition-colors">
              <Download className="w-4 h-4" /> Download file
            </a>
          </div>
        )}
        {idx < uploaded.length - 1 && (
          <button onClick={() => setIdx((i) => i + 1)}
            className="absolute right-3 z-10 p-2.5 rounded-full bg-black/60 text-white hover:bg-black/90 transition-colors shadow-lg">
            <ChevronRight className="w-5 h-5" />
          </button>
        )}
      </div>

      <div className="px-4 py-2.5 bg-gray-950/95 border-t border-white/10 flex items-center justify-between shrink-0">
        <div className="min-w-0">
          <p className="text-sm font-medium text-white truncate">{current.label}</p>
          <p className="text-xs text-gray-400 truncate max-w-sm">{current.doc.file_name}</p>
        </div>
        <div className="flex items-center gap-1.5 ml-4 shrink-0">
          {uploaded.map((_, i) => (
            <button key={i} onClick={() => setIdx(i)}
              className={`w-2 h-2 rounded-full transition-all ${
                i === idx ? "bg-blue-500 scale-125" : "bg-gray-600 hover:bg-gray-400"
              }`}
            />
          ))}
          <span className="ml-2 text-xs text-gray-500 tabular-nums">{idx + 1} / {uploaded.length}</span>
        </div>
      </div>
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════════
   Field helpers
═══════════════════════════════════════════════════════════════ */
const iCls = (errors, name) =>
  `w-full px-3 py-2.5 rounded-lg border text-sm outline-none transition-all ${
    errors[name]
      ? "border-red-400 bg-red-50"
      : "border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
  }`;

const Label = ({ text, name, required, errors }) => (
  <label className="block text-xs font-medium text-gray-600 mb-1">
    {text}{required && <span className="text-red-500"> *</span>}
    {errors[name] && <span className="text-red-500 ml-2 font-normal">{errors[name]}</span>}
  </label>
);

const Input = ({ label, name, type = "text", required, colSpan = "", form, errors, onChange }) => (
  <div className={colSpan}>
    <Label text={label} name={name} required={required} errors={errors} />
    <input type={type} name={name} value={form[name] ?? ""} onChange={onChange} className={iCls(errors, name)} />
  </div>
);

const Select = ({ label, name, options, required, colSpan = "", form, errors, onChange }) => (
  <div className={colSpan}>
    <Label text={label} name={name} required={required} errors={errors} />
    <select name={name} value={form[name] ?? ""} onChange={onChange}
      className={`${iCls(errors, name)} appearance-none bg-white cursor-pointer`}>
      <option value="">Select…</option>
      {options.map((o) => <option key={o} value={o}>{o}</option>)}
    </select>
  </div>
);

const Textarea = ({ label, name, required, rows = 2, disabled = false, colSpan = "", form, errors, onChange }) => (
  <div className={colSpan}>
    <Label text={label} name={name} required={required} errors={errors} />
    <textarea name={name} value={form[name] ?? ""} onChange={onChange} rows={rows} disabled={disabled}
      className={`${iCls(errors, name)} resize-none ${disabled ? "opacity-50 cursor-not-allowed" : ""}`} />
  </div>
);

const PhoneInput = ({ label, name, required, disabled = false, colSpan = "", form, errors, onPhoneChange }) => (
  <div className={colSpan}>
    <Label text={label} name={name} required={required} errors={errors} />
    <div className="relative">
      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-xs font-medium">+91</span>
      <input type="tel" name={name} value={form[name] ?? ""} onChange={(ev) => onPhoneChange(ev, name)}
        disabled={disabled} placeholder="9876543210"
        className={`w-full pl-10 pr-3 py-2.5 rounded-lg border text-sm outline-none font-mono transition-all ${
          errors[name] ? "border-red-400 bg-red-50" : "border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
        } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`} />
    </div>
  </div>
);

const SecHead = ({ icon: Icon, color = "blue", text }) => (
  <div className={`col-span-2 mt-5 mb-1 pb-1.5 border-b-2 border-${color}-100 flex items-center gap-2`}>
    {Icon && <Icon className={`w-4 h-4 text-${color}-500`} />}
    <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wide">{text}</h3>
  </div>
);

/* ═══════════════════════════════════════════════════════════════
   DocCard — shows uploaded or empty state, admin can always upload
═══════════════════════════════════════════════════════════════ */
const DocCard = ({ docType, existingDoc, onUpload, onDelete, onView, uploading, uploadStatus }) => {
  const fileInputRef = useRef(null);
  const Icon    = docType.icon;
  const isImage = existingDoc?.mime_type?.startsWith("image/");
  const hasDoc  = !!existingDoc;
  const isMe    = uploadStatus?.key === docType.key && uploadStatus?.type === "loading";
  const fileUrl = hasDoc ? resolveFilePath(existingDoc.file_path) : null;

  return (
    <div className={`flex flex-col gap-2 p-3 rounded-xl border-2 transition-all ${
      hasDoc
        ? "border-green-200 bg-gradient-to-br from-green-50 to-emerald-50"
        : "border-dashed border-gray-200 bg-white hover:border-blue-200 hover:bg-blue-50/30"
    }`}>
      {/* Header */}
      <div className="flex items-start justify-between gap-1">
        <div className="flex items-center gap-1.5 min-w-0">
          <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${hasDoc ? "bg-green-100" : "bg-gray-100"}`}>
            <Icon className={`w-3.5 h-3.5 ${hasDoc ? "text-green-600" : "text-gray-400"}`} />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-semibold text-gray-700 leading-tight truncate">
              {docType.label}
              {docType.required && <span className="text-red-400 ml-0.5">*</span>}
            </p>
            {docType.badge && (
              <span className="inline-block text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-indigo-100 text-indigo-700 leading-none mt-0.5">
                {docType.badge}
              </span>
            )}
          </div>
        </div>
        {hasDoc
          ? <span className="flex items-center gap-0.5 text-[10px] text-green-600 font-semibold shrink-0"><CheckCircle className="w-3 h-3" />Saved</span>
          : <span className="text-[10px] text-gray-400 shrink-0">Not uploaded</span>}
      </div>

      {/* Preview / drop area */}
      {hasDoc ? (
        <button type="button" onClick={() => onView(docType.key)}
          className="relative rounded-lg overflow-hidden border border-green-200 bg-white group focus:outline-none"
          style={{ height: 80 }} title={`View ${docType.label}`}>
          {isImage ? (
            <img src={fileUrl} alt={docType.label}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
              onError={(e) => { e.target.style.display = "none"; e.target.nextSibling.style.display = "flex"; }}
            />
          ) : null}
          <div className={`flex-col items-center justify-center h-full gap-1 px-2 ${isImage ? "hidden" : "flex"}`}>
            <File className="w-6 h-6 text-red-400" />
            <span className="text-[10px] text-gray-500 truncate w-full text-center">{existingDoc.file_name}</span>
          </div>
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
            <span className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 bg-white/95 text-gray-800 text-xs font-semibold px-2 py-1 rounded-lg shadow">
              <Eye className="w-3 h-3 text-indigo-600" /> View
            </span>
          </div>
        </button>
      ) : (
        <button type="button" onClick={() => fileInputRef.current?.click()}
          className="rounded-lg border border-dashed border-gray-200 bg-gray-50 flex flex-col items-center justify-center gap-1 hover:border-blue-300 hover:bg-blue-50 transition-colors"
          style={{ height: 80 }}>
          <Upload className="w-4 h-4 text-gray-300" />
          <span className="text-[10px] text-gray-400">{docType.description}</span>
        </button>
      )}

      {/* Status pill */}
      {uploadStatus?.key === docType.key && (
        <div className={`flex items-center gap-1 text-xs rounded-md px-2 py-1 ${
          uploadStatus.type === "success" ? "bg-green-50 text-green-700"
          : uploadStatus.type === "error"  ? "bg-red-50 text-red-700"
          : "bg-blue-50 text-blue-700"
        }`}>
          {uploadStatus.type === "loading" && <Loader className="w-3 h-3 animate-spin" />}
          {uploadStatus.type === "success" && <CheckCircle className="w-3 h-3" />}
          {uploadStatus.type === "error"   && <AlertCircle className="w-3 h-3" />}
          <span className="truncate">{uploadStatus.message}</span>
        </div>
      )}

      {/* Action buttons */}
      <div className="flex gap-1 mt-auto">
        {hasDoc && (
          <button type="button" onClick={() => onView(docType.key)}
            className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 text-xs font-medium rounded-lg border border-indigo-200 text-indigo-700 bg-indigo-50 hover:bg-indigo-100 transition-colors">
            <Eye className="w-3 h-3" /> View
          </button>
        )}
        <button type="button" onClick={() => fileInputRef.current?.click()} disabled={isMe}
          className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 text-xs font-medium rounded-lg border border-blue-200 text-blue-700 bg-blue-50 hover:bg-blue-100 transition-colors disabled:opacity-50">
          {isMe ? <Loader className="w-3 h-3 animate-spin" /> : <Upload className="w-3 h-3" />}
          {hasDoc ? "Replace" : "Upload"}
        </button>
        {hasDoc && (
          <button type="button" onClick={() => onDelete(docType.key, existingDoc.id)} disabled={isMe}
            className="flex items-center justify-center px-2 py-1.5 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50">
            <Trash2 className="w-3 h-3" />
          </button>
        )}
      </div>

      <input ref={fileInputRef} type="file" accept={docType.accept} className="hidden"
        onChange={(e) => {
          const f = e.target.files[0];
          if (f) onUpload(docType.key, f);
          e.target.value = "";
        }}
      />
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════════
   EditEmployee — main component
═══════════════════════════════════════════════════════════════ */
const EditEmployee = ({ employee, onClose, onSave, showToast }) => {
  if (!employee) return null;
  const e = employee;

  const empId = (e.id !== undefined && e.id !== null && e.id !== "") ? e.id : (e.employee_id ?? null);

  // Build docs map from all 10 document types
  const buildDocsMap = () => {
    const map = {};
    ALL_DOC_TYPES.forEach(({ key }) => { map[key] = null; });
    (Array.isArray(e.documents) ? e.documents : []).forEach((doc) => {
      const typeKey = doc.document_type;
      // Map legacy "idPhoto" → "photo" if needed
      const normalizedKey = typeKey === "idPhoto" ? "photo" : typeKey;
      if (Object.prototype.hasOwnProperty.call(map, normalizedKey)) {
        map[normalizedKey] = {
          id:            doc.id,
          document_type: normalizedKey,
          file_path:     doc.file_path,
          file_name:     doc.file_name,
          mime_type:     doc.mime_type,
        };
      }
    });
    return map;
  };

  const [form, setForm] = useState({
    firstName:                g(e, "first_name", "firstName"),
    lastName:                 g(e, "last_name", "lastName"),
    fatherHusbandName:        g(e, "father_husband_name", "fatherHusbandName"),
    dob:                      sliceDate(e.date_of_birth || e.dob),
    gender:                   g(e, "gender", "gender"),
    maritalStatus:            g(e, "marital_status", "maritalStatus"),
    educationalQualification: g(e, "educational_qualification", "educationalQualification"),
    bloodGroup:               g(e, "blood_group", "bloodGroup"),
    email:                    g(e, "email", "email"),
    phone:                    g(e, "phone", "phone"),
    altPhone:                 g(e, "alt_phone", "altPhone"),
    panNumber:                g(e, "pan_number", "panNumber"),
    nameOnPan:                g(e, "name_on_pan", "nameOnPan"),
    aadhar:                   g(e, "aadhar_number", "aadhar"),
    nameOnAadhar:             g(e, "name_on_aadhar", "nameOnAadhar"),
    familyMemberName:         g(e, "family_member_name", "familyMemberName"),
    familyContactNo:          g(e, "family_contact_no", "familyContactNo"),
    familyWorkingStatus:      g(e, "family_working_status", "familyWorkingStatus"),
    familyEmployerName:       g(e, "family_employer_name", "familyEmployerName"),
    familyEmployerContact:    g(e, "family_employer_contact", "familyEmployerContact"),
    emergencyContactName:     g(e, "emergency_contact_name", "emergencyContactName"),
    emergencyContactNo:       g(e, "emergency_contact_no", "emergencyContactNo"),
    emergencyContactAddress:  g(e, "emergency_contact_address", "emergencyContactAddress"),
    emergencyContactRelation: g(e, "emergency_contact_relation", "emergencyContactRelation"),
    permanentAddress:         g(e, "permanent_address", "permanentAddress"),
    permanentPhone:           g(e, "permanent_phone", "permanentPhone"),
    permanentLandmark:        g(e, "permanent_landmark", "permanentLandmark"),
    permanentLatLong:         g(e, "permanent_lat_long", "permanentLatLong"),
    localSameAsPermanent:     false,
    localAddress:             g(e, "local_address", "localAddress"),
    localPhone:               g(e, "local_phone", "localPhone"),
    localLandmark:            g(e, "local_landmark", "localLandmark"),
    localLatLong:             g(e, "local_lat_long", "localLatLong"),
    ref1Name:         g(e, "ref1_name", "ref1Name"),
    ref1Designation:  g(e, "ref1_designation", "ref1Designation"),
    ref1Organization: g(e, "ref1_organization", "ref1Organization"),
    ref1Address:      g(e, "ref1_address", "ref1Address"),
    ref1CityStatePin: g(e, "ref1_city_state_pin", "ref1CityStatePin"),
    ref1ContactNo:    g(e, "ref1_contact_no", "ref1ContactNo"),
    ref1Email:        g(e, "ref1_email", "ref1Email"),
    ref2Name:         g(e, "ref2_name", "ref2Name"),
    ref2Designation:  g(e, "ref2_designation", "ref2Designation"),
    ref2Organization: g(e, "ref2_organization", "ref2Organization"),
    ref2Address:      g(e, "ref2_address", "ref2Address"),
    ref2CityStatePin: g(e, "ref2_city_state_pin", "ref2CityStatePin"),
    ref2ContactNo:    g(e, "ref2_contact_no", "ref2ContactNo"),
    ref2Email:        g(e, "ref2_email", "ref2Email"),
    ref3Name:         g(e, "ref3_name", "ref3Name"),
    ref3Designation:  g(e, "ref3_designation", "ref3Designation"),
    ref3Organization: g(e, "ref3_organization", "ref3Organization"),
    ref3Address:      g(e, "ref3_address", "ref3Address"),
    ref3CityStatePin: g(e, "ref3_city_state_pin", "ref3CityStatePin"),
    ref3ContactNo:    g(e, "ref3_contact_no", "ref3ContactNo"),
    ref3Email:        g(e, "ref3_email", "ref3Email"),
    employeeId:       g(e, "employee_id", "employeeId"),
    joiningDate:      sliceDate(e.joining_date || e.joiningDate),
    department:       g(e, "department", "department"),
    designation:      g(e, "designation", "designation") || g(e, "position", "position"),
    employmentType:   g(e, "employment_type", "employmentType"),
    circle:           g(e, "circle", "circle"),
    projectName:      g(e, "project_name", "projectName"),
    reportingManager: g(e, "reporting_manager", "reportingManager"),
    status:           g(e, "status", "status") || "Active",
    basicSalary:      g(e, "basic_salary", "basicSalary"),
    hra:              g(e, "hra", "hra"),
    otherAllowances:  g(e, "other_allowances", "otherAllowances"),
    bankName:         g(e, "bank_name", "bankName"),
    accountNumber:    g(e, "account_number", "accountNumber"),
    ifscCode:         g(e, "ifsc_code", "ifscCode"),
    accountHolderName: g(e, "account_holder_name", "accountHolderName"),
    bankBranch:       g(e, "bank_branch", "bankBranch") || g(e, "branch", "branch"),
  });

  const [saving, setSaving]             = useState(false);
  const [errors, setErrors]             = useState({});
  const [docs, setDocs]                 = useState(buildDocsMap);
  const [docUploading, setDocUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState(null);
  const [viewerKey, setViewerKey]       = useState(null);

  const handleChange = (ev) => {
    const { name, value } = ev.target;
    setForm((p) => ({ ...p, [name]: value }));
    if (errors[name]) setErrors((p) => ({ ...p, [name]: "" }));
  };

  const handlePhone = (ev, name) => {
    const v = ev.target.value;
    if (/^\d*$/.test(v) && v.length <= 10) {
      setForm((p) => ({ ...p, [name]: v }));
      if (errors[name]) setErrors((p) => ({ ...p, [name]: "" }));
    }
  };

  const handleSameAsPermanent = (ev) => {
    const checked = ev.target.checked;
    setForm((p) => ({
      ...p,
      localSameAsPermanent: checked,
      localAddress:  checked ? p.permanentAddress  : "",
      localPhone:    checked ? p.permanentPhone     : "",
      localLandmark: checked ? p.permanentLandmark  : "",
      localLatLong:  checked ? p.permanentLatLong   : "",
    }));
  };

  // ── Document upload ────────────────────────────────────────────────────────
  const handleDocUpload = async (docTypeKey, file) => {
    if (empId === null || empId === undefined || empId === "") {
      showToast?.("Cannot upload: employee ID is missing. Save the employee first.", "error");
      return;
    }

    setDocUploading(true);
    setUploadStatus({ key: docTypeKey, type: "loading", message: "Uploading…" });

    try {
      const fd = new FormData();
      let endpoint;

      if (docTypeKey === "photo") {
        fd.append("photo", file);
        endpoint = `${API_BASE}/employees/${empId}/upload-photo`;
      } else {
        fd.append(docTypeKey, file);
        fd.append("documentType", docTypeKey);
        endpoint = `${API_BASE}/employees/${empId}/upload-document`;
      }

      let token = "";
      try { token = localStorage.getItem("token") || sessionStorage.getItem("token") || ""; } catch (_) {}

      const response = await fetch(endpoint, {
        method: "POST",
        body: fd,
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      let result;
      try { result = await response.json(); } catch (_) {
        throw new Error(`Server error ${response.status}: Invalid response`);
      }

      if (!response.ok || !result.success) {
        throw new Error(result?.message || `Server error ${response.status}`);
      }

      const savedDoc = result.data;
      setDocs((prev) => ({
        ...prev,
        [docTypeKey]: {
          id:            savedDoc?.id ?? `tmp-${Date.now()}`,
          document_type: docTypeKey,
          file_path:     savedDoc?.file_path ?? "",
          file_name:     savedDoc?.file_name ?? file.name,
          mime_type:     savedDoc?.mime_type ?? file.type,
        },
      }));

      setUploadStatus({ key: docTypeKey, type: "success", message: "Uploaded successfully!" });
      showToast?.(`${ALL_DOC_TYPES.find((d) => d.key === docTypeKey)?.label} uploaded!`, "success");
    } catch (err) {
      setUploadStatus({ key: docTypeKey, type: "error", message: err.message || "Upload failed" });
      showToast?.(err.message || "Failed to upload document", "error");
    } finally {
      setDocUploading(false);
      setTimeout(() => setUploadStatus(null), 4000);
    }
  };

  // ── Document delete ────────────────────────────────────────────────────────
  const handleDocDelete = async (docTypeKey, docId) => {
    if (empId === null || empId === undefined || empId === "") {
      showToast?.("Cannot delete: employee ID is missing.", "error");
      return;
    }

    if (!docId || String(docId).startsWith("tmp-")) {
      setDocs((prev) => ({ ...prev, [docTypeKey]: null }));
      showToast?.("Document removed.", "success");
      return;
    }

    if (!window.confirm(`Remove this ${ALL_DOC_TYPES.find((d) => d.key === docTypeKey)?.label}?`)) return;

    setDocUploading(true);
    setUploadStatus({ key: docTypeKey, type: "loading", message: "Deleting…" });

    try {
      const endpoint = `${API_BASE}/employees/${empId}/documents/${docId}`;
      let token = "";
      try { token = localStorage.getItem("token") || sessionStorage.getItem("token") || ""; } catch (_) {}

      const response = await fetch(endpoint, {
        method: "DELETE",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      let result;
      try { result = await response.json(); } catch (_) {
        throw new Error(`Server error ${response.status}: Invalid response`);
      }

      if (!response.ok || !result.success) throw new Error(result?.message || `Server error ${response.status}`);

      setDocs((prev) => ({ ...prev, [docTypeKey]: null }));
      setUploadStatus({ key: docTypeKey, type: "success", message: "Removed." });
      showToast?.("Document removed.", "success");
    } catch (err) {
      setUploadStatus({ key: docTypeKey, type: "error", message: err.message });
      showToast?.(err.message || "Failed to delete document", "error");
    } finally {
      setDocUploading(false);
      setTimeout(() => setUploadStatus(null), 4000);
    }
  };

  // ── Validation ─────────────────────────────────────────────────────────────
  const validate = () => {
    const err = {};
    if (!form.firstName?.trim())   err.firstName   = "Required";
    if (!form.lastName?.trim())    err.lastName    = "Required";
    if (!form.email?.trim())       err.email       = "Required";
    if (!form.phone?.trim())       err.phone       = "Required";
    if (!form.department?.trim())  err.department  = "Required";
    if (!form.designation?.trim()) err.designation = "Required";
    if (!form.joiningDate)         err.joiningDate = "Required";
    return err;
  };

  // ── Save employee ──────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    const err = validate();
    if (Object.keys(err).length) { setErrors(err); return; }
    setSaving(true);
    try {
      const res = await employeeService.updateEmployee(empId, {
        ...form,
        basicSalary:     parseFloat(form.basicSalary)     || 0,
        hra:             parseFloat(form.hra)             || 0,
        otherAllowances: parseFloat(form.otherAllowances) || 0,
      });
      if (res.success) {
        showToast?.("Employee updated successfully!", "success");
        onSave?.(res.data);
        onClose();
      } else {
        throw new Error(res.message || "Update failed");
      }
    } catch (err) {
      showToast?.(err.message || "Failed to update employee", "error");
    } finally {
      setSaving(false);
    }
  };

  const fp       = { form, errors, onChange: handleChange, onPhoneChange: handlePhone };
  const sameAddr = !!form.localSameAsPermanent;

  const uploadedCount = Object.values(docs).filter(Boolean).length;
  const totalDocs     = ALL_DOC_TYPES.length;

  const refBlocks = [
    { key: "ref1", label: "Reference 1", sub: "Relevant Industry" },
    { key: "ref2", label: "Reference 2", sub: "Local Area" },
    { key: "ref3", label: "Reference 3", sub: "Other than Relative" },
  ];

  // Color mapping for section headers
  const sectionColorMap = { blue: "blue", indigo: "indigo" };

  return (
    <>
      {viewerKey !== null && (
        <DocViewer docs={docs} initialKey={viewerKey} onClose={() => setViewerKey(null)} />
      )}

      <div
        className="fixed inset-0 z-[1100] backdrop-blur-sm bg-black/40 flex items-start justify-center p-4 pt-10 overflow-y-auto"
        onClick={(ev) => ev.target === ev.currentTarget && onClose()}
      >
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl flex flex-col my-4">

          {/* ── Header ── */}
          <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Edit Employee</h2>
              <p className="text-sm text-gray-500 mt-0.5">
                {form.firstName} {form.lastName} · {e.employee_id || e.id}
              </p>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          {/* ── Body ── */}
          <div className="p-6 overflow-y-auto max-h-[74vh]" style={{ scrollbarWidth: "thin" }}>
            <div className="grid grid-cols-2 gap-4">

              {/* 1. Personal Details */}
              <SecHead icon={User} color="blue" text="1. Personal Details" />
              <Input label="First Name"  name="firstName"  required {...fp} />
              <Input label="Last Name"   name="lastName"   required {...fp} />
              <Input label="Father / Husband Name" name="fatherHusbandName" required {...fp} />
              <Input label="Date of Birth" name="dob" type="date" {...fp} />
              <Select label="Gender" name="gender" options={["Male", "Female", "Other"]} {...fp} />
              <Select label="Marital Status" name="maritalStatus" options={maritalStatuses} {...fp} />
              <Input label="Educational Qualification" name="educationalQualification" colSpan="col-span-2" {...fp} />
              <Select label="Blood Group" name="bloodGroup" options={bloodGroups} {...fp} />
              <Input label="Email" name="email" type="email" required colSpan="col-span-2" {...fp} />
              <PhoneInput label="Phone"           name="phone"    required {...fp} />
              <PhoneInput label="Alternate Phone" name="altPhone"          {...fp} />
              <Input label="PAN Number"       name="panNumber"   {...fp} />
              <Input label="Name on PAN"      name="nameOnPan"   {...fp} />
              <Input label="Aadhaar Number"   name="aadhar"      {...fp} />
              <Input label="Name on Aadhaar Card" name="nameOnAadhar" {...fp} />

              {/* 2. Family Details */}
              <SecHead icon={Users} color="purple" text="2. Family Details" />
              <Input label="Father / Mother / Spouse Name" name="familyMemberName" required colSpan="col-span-2" {...fp} />
              <PhoneInput label="Contact No." name="familyContactNo" required {...fp} />
              <Select label="Working Status" name="familyWorkingStatus"
                options={["Working", "Not Working", "Retired", "Self Employed"]} {...fp} />
              <Input label="Employer Name" name="familyEmployerName" colSpan="col-span-2" {...fp} />
              <PhoneInput label="Employer Contact No." name="familyEmployerContact" {...fp} />

              {/* 3. Emergency Contact */}
              <SecHead icon={Phone} color="red" text="3. Emergency Contact Details" />
              <Input label="Contact Person Name" name="emergencyContactName" required colSpan="col-span-2" {...fp} />
              <PhoneInput label="Contact No." name="emergencyContactNo" required {...fp} />
              <Select label="Relation with Employee" name="emergencyContactRelation"
                options={["Father", "Mother", "Spouse", "Sibling", "Friend", "Other"]} {...fp} />
              <Textarea label="Contact Person Address" name="emergencyContactAddress" required colSpan="col-span-2" rows={2} {...fp} />

              {/* 4. Address Details */}
              <SecHead icon={Home} color="green" text="4. Address Details" />
              <div className="col-span-2 p-4 rounded-xl border-2 border-gray-200 bg-gray-50 space-y-3">
                <h5 className="text-xs font-bold text-gray-600 flex items-center gap-1.5">
                  <Home className="w-3.5 h-3.5 text-green-500" /> A) Permanent Address
                </h5>
                <div className="grid grid-cols-2 gap-4">
                  <Textarea label="Address" name="permanentAddress" required colSpan="col-span-2" rows={2} {...fp} />
                  <PhoneInput label="Phone"    name="permanentPhone"    required {...fp} />
                  <Input      label="Landmark" name="permanentLandmark"          {...fp} />
                  <Input      label="Lat-Long" name="permanentLatLong" colSpan="col-span-2" {...fp} />
                </div>
              </div>

              <div className="col-span-2 p-4 rounded-xl border-2 border-gray-200 bg-gray-50 space-y-3">
                <div className="flex items-center justify-between">
                  <h5 className="text-xs font-bold text-gray-600 flex items-center gap-1.5">
                    <Home className="w-3.5 h-3.5 text-green-500" /> B) Local Address
                  </h5>
                  <label className="flex items-center gap-2 cursor-pointer select-none group">
                    <div className="relative">
                      <input type="checkbox" checked={sameAddr} onChange={handleSameAsPermanent} className="sr-only" />
                      <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
                        sameAddr ? "bg-blue-600 border-blue-600" : "border-gray-400 bg-white group-hover:border-blue-400"
                      }`}>
                        {sameAddr && (
                          <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </div>
                    </div>
                    <span className="text-xs font-medium text-gray-600 flex items-center gap-1">
                      <Copy className="w-3 h-3 text-blue-500" /> Same as Permanent Address
                    </span>
                  </label>
                </div>
                <div className={`grid grid-cols-2 gap-4 transition-opacity duration-200 ${sameAddr ? "opacity-50 pointer-events-none" : ""}`}>
                  <Textarea label="Address" name="localAddress" required colSpan="col-span-2" rows={2} disabled={sameAddr} {...fp} />
                  <PhoneInput label="Phone"    name="localPhone"    required disabled={sameAddr} {...fp} />
                  <Input      label="Landmark" name="localLandmark"                              {...fp} />
                  <Input      label="Lat-Long" name="localLatLong" colSpan="col-span-2"          {...fp} />
                </div>
              </div>

              {/* 5. Reference Details */}
              <SecHead icon={FileText} color="orange" text="5. Reference Details" />
              {refBlocks.map(({ key, label, sub }) => (
                <div key={key} className="col-span-2 p-4 rounded-xl border-2 border-gray-200 bg-gray-50 space-y-3">
                  <div className="pb-1.5 border-b border-gray-200">
                    <p className="text-xs font-bold text-blue-700">
                      {label} <span className="text-gray-400 font-normal">({sub})</span>
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <Input label="Name"                name={`${key}Name`}         {...fp} />
                    <Input label="Designation"         name={`${key}Designation`}  {...fp} />
                    <Input label="Name of Organization" name={`${key}Organization`} colSpan="col-span-2" {...fp} />
                    <Textarea label="Address"          name={`${key}Address`}      colSpan="col-span-2" rows={2} {...fp} />
                    <Input label="City, State, Pin Code" name={`${key}CityStatePin`} {...fp} />
                    <PhoneInput label="Contact No."    name={`${key}ContactNo`}    {...fp} />
                    <Input label="Email ID"            name={`${key}Email`}        type="email" colSpan="col-span-2" {...fp} />
                  </div>
                </div>
              ))}

              {/* 6. Employment Details */}
              <SecHead icon={Building2} color="blue" text="6. Employment Details" />
              <Input label="Employee ID"   name="employeeId"   {...fp} />
              <Input label="Joining Date"  name="joiningDate"  type="date" required {...fp} />
              <Input label="Department"    name="department"   required {...fp} />
              <Input label="Designation"   name="designation"  required {...fp} />
              <Select label="Employment Type" name="employmentType"
                options={["Full-time", "Part-time", "Contract", "Intern"]} {...fp} />
              <Select label="Status" name="status" options={["Active", "Inactive", "Pending"]} {...fp} />
              <Input label="Circle"            name="circle"          {...fp} />
              <Input label="Project Name"      name="projectName"     {...fp} />
              <Input label="Reporting Manager" name="reportingManager" colSpan="col-span-2" {...fp} />

              {/* 7. Salary Details */}
              <SecHead color="yellow" text="7. Salary Details" />
              <Input label="Basic Salary"      name="basicSalary"      type="number" {...fp} />
              <Input label="HRA"               name="hra"              type="number" {...fp} />
              <Input label="Other Allowances"  name="otherAllowances"  type="number" colSpan="col-span-2" {...fp} />

              {/* 8. Bank Details */}
              <SecHead color="green" text="8. Bank Details" />
              <Input label="Bank Name"           name="bankName"          {...fp} />
              <Input label="Account Number"      name="accountNumber"     {...fp} />
              <Input label="IFSC Code"           name="ifscCode"          {...fp} />
              <Input label="Account Holder Name" name="accountHolderName" {...fp} />
              <Input label="Bank Branch"         name="bankBranch"        colSpan="col-span-2" {...fp} />

              {/* 9. Documents — all 10 types in 2 sections */}
              <div className="col-span-2 mt-5 mb-1 pb-1.5 border-b-2 border-indigo-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Paperclip className="w-4 h-4 text-indigo-500" />
                  <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wide">9. Documents</h3>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-gray-500 font-medium">
                    {uploadedCount} / {totalDocs} uploaded
                  </span>
                  {uploadedCount > 0 && (
                    <button type="button"
                      onClick={() => {
                        const firstKey = ALL_DOC_TYPES.find((dt) => docs[dt.key])?.key ?? null;
                        setViewerKey(firstKey);
                      }}
                      className="flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white transition-colors">
                      <Eye className="w-3 h-3" /> View All
                    </button>
                  )}
                </div>
              </div>

              <div className="col-span-2">
                {/* Overall progress bar */}
                <div className="mb-5 space-y-1">
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>Document completion</span>
                    <span className="font-semibold text-indigo-600">{Math.round((uploadedCount / totalDocs) * 100)}%</span>
                  </div>
                  <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-indigo-500 to-blue-400 rounded-full transition-all duration-500"
                      style={{ width: `${(uploadedCount / totalDocs) * 100}%` }} />
                  </div>
                </div>

                {/* Missing document alert */}
                {uploadedCount < totalDocs && (
                  <div className="mb-4 flex items-start gap-2 px-3 py-2 bg-amber-50 border border-amber-200 rounded-lg">
                    <AlertCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                    <p className="text-xs text-amber-700">
                      <span className="font-semibold">{totalDocs - uploadedCount} document{totalDocs - uploadedCount > 1 ? "s" : ""} missing.</span>{" "}
                      As admin, you can upload on behalf of the employee. Documents save immediately.
                    </p>
                  </div>
                )}

                {/* Doc sections */}
                {DOC_SECTIONS.map((section) => {
                  const sectionUploaded = section.docs.filter((dt) => docs[dt.key]).length;
                  return (
                    <div key={section.label} className="mb-6">
                      {/* Section sub-header */}
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <Shield className={`w-3.5 h-3.5 text-${section.color}-500`} />
                          <h4 className="text-xs font-bold text-gray-600 uppercase tracking-wide">
                            {section.label}
                          </h4>
                        </div>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                          sectionUploaded === section.docs.length
                            ? "bg-green-100 text-green-700"
                            : "bg-gray-100 text-gray-500"
                        }`}>
                          {sectionUploaded}/{section.docs.length}
                        </span>
                      </div>

                      {/* Cards grid — 2 cols on mobile, 4-5 on wider */}
                      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                        {section.docs.map((dt) => (
                          <DocCard
                            key={dt.key}
                            docType={dt}
                            existingDoc={docs[dt.key]}
                            onUpload={handleDocUpload}
                            onDelete={handleDocDelete}
                            onView={(key) => setViewerKey(key)}
                            uploading={docUploading}
                            uploadStatus={uploadStatus}
                          />
                        ))}
                      </div>
                    </div>
                  );
                })}

                {/* Warning when empId missing */}
                {(empId === null || empId === undefined || empId === "") && (
                  <div className="mt-3 flex items-center gap-2 px-3 py-2 bg-red-50 border border-red-200 rounded-lg">
                    <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
                    <p className="text-xs text-red-600 font-medium">
                      Employee ID not found — document uploads are disabled. Save the employee record first.
                    </p>
                  </div>
                )}

                <p className="mt-3 text-xs text-gray-400">
                  Accepted: JPG, PNG, GIF, WEBP, PDF · Max 5 MB per file.
                  Documents save immediately — no need to click Save Changes.
                </p>
              </div>

            </div>
          </div>

          {/* ── Footer ── */}
          <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-end gap-3">
            <button onClick={onClose} disabled={saving}
              className="px-5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium transition-colors disabled:opacity-50">
              Cancel
            </button>
            <button onClick={handleSubmit} disabled={saving}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2 disabled:opacity-60">
              {saving ? <Loader className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {saving ? "Saving…" : "Save Changes"}
            </button>
          </div>

        </div>
      </div>
    </>
  );
};

export default EditEmployee;