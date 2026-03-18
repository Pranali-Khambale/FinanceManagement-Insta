// src/Ui/EmployeeMng/PendingApprovals.jsx
import React, { useState, useEffect, useCallback } from 'react';
import {
  CheckCircle, XCircle, Eye, Loader, AlertCircle, RefreshCw,
  User, Mail, Phone, Building2, Calendar, FileText, Clock, Users,
  Briefcase, MapPin, CreditCard, Shield, UserCircle, Building, FileCheck,
  Award, ZoomIn, ExternalLink, Printer, Download, ChevronLeft, ChevronRight,
  X as XIcon
} from 'lucide-react';
import employeeService from '../../services/employeeService';
import { printKYEForm } from './KYEPrintForm';

const BASE_URL =
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_URL?.replace('/api', '')) ||
  'http://localhost:5000';

// ─── Utilities ────────────────────────────────────────────────────────────────
const formatDate = (d) => {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
};
const formatDateTime = (d) => {
  if (!d) return '—';
  return new Date(d).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
};
const formatDateShort = (d) => {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
};
const fullUrl = (path) =>
  !path ? null : path.startsWith('http') ? path : `${BASE_URL}${path}`;

// ─── Avatar ───────────────────────────────────────────────────────────────────
const Avatar = ({ firstName, lastName, size = 'md' }) => {
  const initials = `${(firstName?.[0] || 'N').toUpperCase()}${(lastName?.[0] || 'A').toUpperCase()}`;
  const sizes = { sm: 'w-9 h-9 text-sm', md: 'w-12 h-12 text-base', lg: 'w-16 h-16 text-xl' };
  return (
    <div className={`${sizes[size]} rounded-xl flex items-center justify-center font-bold text-white flex-shrink-0`}
      style={{ background: 'linear-gradient(135deg,#1d4ed8 0%,#3b82f6 60%,#60a5fa 100%)', boxShadow: '0 4px 14px rgba(59,130,246,0.4)' }}>
      {initials}
    </div>
  );
};

// ─── Detect file type from path or mime ──────────────────────────────────────
const getFileType = (path, mime) => {
  const p = (path || '').toLowerCase();
  const m = (mime || '').toLowerCase();
  if (m.includes('pdf') || p.endsWith('.pdf'))  return 'pdf';
  if (m.includes('image') || /\.(jpg|jpeg|png|gif|webp|bmp)$/.test(p)) return 'image';
  return 'other';
};

// ─── Lightbox — full-screen document viewer ───────────────────────────────────
const Lightbox = ({ docs, startIndex = 0, onClose }) => {
  const [idx, setIdx]         = useState(startIndex);
  const [imgError, setImgError] = useState(false);

  const doc      = docs[idx];
  const url      = fullUrl(doc?.path);
  const fileType = getFileType(doc?.path, doc?.mime_type);

  // Reset image error when doc changes
  useEffect(() => { setImgError(false); }, [idx]);

  // Keyboard navigation
  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'Escape')     onClose();
      if (e.key === 'ArrowRight') setIdx(i => Math.min(i + 1, docs.length - 1));
      if (e.key === 'ArrowLeft')  setIdx(i => Math.max(i - 1, 0));
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [docs.length, onClose]);

  if (!url) return null;

  return (
    <div className="fixed inset-0 z-[300] flex flex-col" style={{ background: 'rgba(0,0,0,0.92)' }}>

      {/* ── Top bar ── */}
      <div className="flex items-center justify-between px-6 py-3 flex-shrink-0"
        style={{ background: 'linear-gradient(90deg,#1e3a5f,#1d4ed8)' }}>
        <div className="flex items-center gap-3">
          <FileText className="w-5 h-5 text-white/80" />
          <div>
            <p className="text-white font-semibold text-sm">{doc?.label}</p>
            <p className="text-blue-200 text-xs">
              {idx + 1} of {docs.length} documents
              <span className="ml-2 opacity-60 font-mono text-[10px]">{url}</span>
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <a href={url} download target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white/15 hover:bg-white/25 text-white rounded-lg text-xs font-medium transition-all">
            <Download className="w-3.5 h-3.5" /> Download
          </a>
          <a href={url} target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white/15 hover:bg-white/25 text-white rounded-lg text-xs font-medium transition-all">
            <ExternalLink className="w-3.5 h-3.5" /> Open Tab
          </a>
          <button onClick={onClose}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white text-blue-900 rounded-lg text-xs font-semibold hover:bg-blue-50 transition-all ml-1">
            <XIcon className="w-3.5 h-3.5" /> Close
          </button>
        </div>
      </div>

      {/* ── Viewer area ── */}
      <div className="flex-1 flex items-center justify-center relative overflow-hidden p-6">
        {/* Prev arrow */}
        {idx > 0 && (
          <button onClick={() => setIdx(i => i - 1)}
            className="absolute left-4 z-10 w-11 h-11 bg-white/20 hover:bg-white/40 rounded-full flex items-center justify-center text-white transition-all shadow-lg">
            <ChevronLeft className="w-6 h-6" />
          </button>
        )}

        {/* ── PDF ── */}
        {fileType === 'pdf' && (
          <iframe
            src={url}
            title={doc?.label}
            className="w-full rounded-xl shadow-2xl bg-white"
            style={{ height: 'calc(100vh - 140px)', maxWidth: '960px' }}
          />
        )}

        {/* ── Image ── */}
        {fileType === 'image' && !imgError && (
          <img
            src={url}
            alt={doc?.label}
            className="rounded-xl shadow-2xl object-contain border border-white/10"
            style={{ maxHeight: 'calc(100vh - 140px)', maxWidth: '100%' }}
            onError={() => setImgError(true)}
          />
        )}

        {/* ── Image failed to load ── */}
        {fileType === 'image' && imgError && (
          <div className="text-center text-white space-y-4">
            <div className="w-20 h-20 bg-white/10 rounded-2xl flex items-center justify-center mx-auto">
              <FileText className="w-10 h-10 opacity-60" />
            </div>
            <p className="text-lg font-semibold opacity-80">Image could not be loaded</p>
            <p className="text-sm opacity-50 font-mono break-all max-w-lg">{url}</p>
            <div className="flex items-center justify-center gap-3 mt-2">
              <a href={url} target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 rounded-xl text-sm font-semibold transition-all">
                <ExternalLink className="w-4 h-4" /> Open in New Tab
              </a>
              <a href={url} download
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-white/15 hover:bg-white/25 rounded-xl text-sm font-semibold transition-all">
                <Download className="w-4 h-4" /> Download
              </a>
            </div>
          </div>
        )}

        {/* ── Unknown type ── */}
        {fileType === 'other' && (
          <div className="text-center text-white space-y-4">
            <div className="w-20 h-20 bg-white/10 rounded-2xl flex items-center justify-center mx-auto">
              <FileText className="w-10 h-10 opacity-60" />
            </div>
            <p className="text-lg font-semibold opacity-80">Preview not available</p>
            <p className="text-sm opacity-50 font-mono break-all max-w-lg">{url}</p>
            <div className="flex items-center justify-center gap-3 mt-2">
              <a href={url} target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 rounded-xl text-sm font-semibold transition-all">
                <ExternalLink className="w-4 h-4" /> Open in New Tab
              </a>
              <a href={url} download
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-white/15 hover:bg-white/25 rounded-xl text-sm font-semibold transition-all">
                <Download className="w-4 h-4" /> Download
              </a>
            </div>
          </div>
        )}

        {/* Next arrow */}
        {idx < docs.length - 1 && (
          <button onClick={() => setIdx(i => i + 1)}
            className="absolute right-4 z-10 w-11 h-11 bg-white/20 hover:bg-white/40 rounded-full flex items-center justify-center text-white transition-all shadow-lg">
            <ChevronRight className="w-6 h-6" />
          </button>
        )}
      </div>

      {/* ── Thumbnail strip ── */}
      {docs.length > 1 && (
        <div className="flex-shrink-0 flex items-center gap-2 px-6 py-3 overflow-x-auto"
          style={{ background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(8px)' }}>
          {docs.map((d, i) => {
            const u  = fullUrl(d.path);
            const ft = getFileType(d.path, d.mime_type);
            return (
              <button key={i} onClick={() => setIdx(i)}
                title={d.label}
                className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all ${
                  i === idx
                    ? 'border-blue-400 shadow-lg scale-110'
                    : 'border-white/20 opacity-55 hover:opacity-90 hover:scale-105'
                }`}>
                {ft === 'pdf' ? (
                  <div className="w-full h-full bg-red-950/80 flex flex-col items-center justify-center gap-0.5">
                    <FileText className="w-5 h-5 text-red-400" />
                    <span className="text-[9px] text-red-400 font-bold">PDF</span>
                  </div>
                ) : ft === 'image' && u ? (
                  <img src={u} alt={d.label} className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.style.display = 'none';
                      e.target.parentElement.innerHTML = '<div style="width:100%;height:100%;background:#1e293b;display:flex;align-items:center;justify-content:center;font-size:9px;color:#94a3b8">IMG</div>';
                    }} />
                ) : (
                  <div className="w-full h-full bg-slate-800 flex items-center justify-center">
                    <FileText className="w-5 h-5 text-slate-400" />
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

// ─── Full Form Viewer Modal ───────────────────────────────────────────────────
const FullFormViewer = ({ employee, onClose }) => {
  const [lightbox, setLightbox] = useState(null); // { docs, startIndex }

  // Build uploaded docs list from backend array
  const DOC_DEFS = [
    { type: 'idPhoto',            label: 'Employee Photo',      icon: <UserCircle className="w-4 h-4" /> },
    { type: 'aadharCard',         label: 'Aadhaar Card',        icon: <CreditCard className="w-4 h-4" /> },
    { type: 'panCard',            label: 'PAN Card',            icon: <FileCheck className="w-4 h-4" /> },
    { type: 'resume',             label: 'Resume',              icon: <FileText className="w-4 h-4" /> },
    { type: 'bankPassbook',       label: 'Bank Passbook',       icon: <Building className="w-4 h-4" /> },
    { type: 'medicalCertificate', label: 'Medical Certificate', icon: <Shield className="w-4 h-4" /> },
    { type: 'academicRecords',    label: 'Academic Records',    icon: <Award className="w-4 h-4" /> },
    { type: 'payslip',            label: 'Pay Slip',            icon: <FileText className="w-4 h-4" /> },
    { type: 'otherCertificates',  label: 'Other Certificates',  icon: <FileText className="w-4 h-4" /> },
  ];

  // Map backend documents array to { type, label, path, icon }
  const uploadedDocs = DOC_DEFS.map(def => {
    const found = Array.isArray(employee.documents)
      ? employee.documents.find(d => d.type === def.type || d.document_type === def.type)
      : null;
    return { ...def, path: found?.path || found?.file_path || null };
  });

  // Only docs that actually have a file
  const availableDocs = uploadedDocs.filter(d => d.path);

  const openLightbox = (type) => {
    const idx = availableDocs.findIndex(d => d.type === type);
    if (idx >= 0) setLightbox({ docs: availableDocs, startIndex: idx });
  };

  // ── Print — delegates to EmployeePrintView.jsx ──────────────────────────────
  const handlePrint = () => printKYEForm(employee);


  const SectionTitle = ({ num, title, icon }) => (
    <div className="flex items-center gap-3 mb-4 pb-3 border-b border-gray-100">
      <div className="w-7 h-7 rounded-lg flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
        style={{ background: 'linear-gradient(135deg,#1d4ed8,#3b82f6)' }}>{num}</div>
      <div className="flex items-center gap-2">
        <span className="text-blue-600">{icon}</span>
        <h4 className="font-semibold text-gray-900 text-sm">{title}</h4>
      </div>
    </div>
  );

  const Field = ({ label, value, span = 1 }) => (
    <div className={span === 2 ? 'col-span-2' : ''}>
      <p className="text-xs font-medium text-gray-500 mb-1">{label}</p>
      <p className="text-sm text-gray-900 bg-white border border-gray-200 rounded-lg px-3 py-2 min-h-[36px] break-words">
        {value || <span className="text-gray-400 italic text-xs">Not provided</span>}
      </p>
    </div>
  );

  return (
    <>
      {/* Lightbox sits above this modal */}
      {lightbox && (
        <Lightbox
          docs={lightbox.docs}
          startIndex={lightbox.startIndex}
          onClose={() => setLightbox(null)}
        />
      )}

      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 overflow-y-auto"
        style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}>
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-7xl my-4 flex flex-col" style={{ maxHeight: '95vh' }}>

          {/* ── Header ── */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 flex-shrink-0"
            style={{ background: 'linear-gradient(90deg,#1e3a5f 0%,#1d4ed8 100%)', borderRadius: '16px 16px 0 0' }}>
            <div className="flex items-center gap-4">
              <Avatar firstName={employee.first_name} lastName={employee.last_name} size="lg" />
              <div>
                <h2 className="text-xl font-bold text-white">{employee.first_name} {employee.last_name}</h2>
                <p className="text-blue-200 text-sm mt-0.5">
                  {employee.position || 'Position not specified'} &bull; {employee.department || 'Department not specified'}
                </p>
                <p className="text-blue-300 text-xs mt-1.5">Applied: {formatDateTime(employee.created_at)}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {/* Print button */}
              <button onClick={handlePrint}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-white/15 hover:bg-white/25 text-white rounded-lg text-xs font-semibold transition-all border border-white/20">
                <Printer className="w-3.5 h-3.5" /> Print
              </button>
              <button onClick={onClose}
                className="px-4 py-2 bg-white text-blue-900 rounded-lg text-sm font-semibold hover:bg-blue-50 transition-all">
                Close
              </button>
            </div>
          </div>

          {/* ── Body ── */}
          <div className="flex-1 overflow-y-auto p-6 bg-gray-50">
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">

              {/* LEFT COLUMN */}
              <div className="space-y-5">

                {/* 1. Personal */}
                <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
                  <SectionTitle num="1" title="Personal Information" icon={<User className="w-4 h-4" />} />
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="First Name"                value={employee.first_name} />
                    <Field label="Last Name"                 value={employee.last_name} />
                    <Field label="Father / Husband Name"     value={employee.father_husband_name} />
                    <Field label="Date of Birth"             value={formatDate(employee.date_of_birth)} />
                    <Field label="Gender"                    value={employee.gender} />
                    <Field label="Blood Group"               value={employee.blood_group} />
                    <Field label="Marital Status"            value={employee.marital_status} />
                    <Field label="Educational Qualification" value={employee.educational_qualification} />
                    <Field label="PAN Number"                value={employee.pan_number} />
                    <Field label="Name on PAN"               value={employee.name_on_pan} />
                    <Field label="Aadhaar Number"            value={employee.aadhar_number} />
                    <Field label="Name on Aadhaar"           value={employee.name_on_aadhar} />
                  </div>
                </div>

                {/* 2. Contact */}
                <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
                  <SectionTitle num="2" title="Contact Information" icon={<Mail className="w-4 h-4" />} />
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Email Address"   value={employee.email}     span={2} />
                    <Field label="Primary Phone"   value={employee.phone} />
                    <Field label="Alternate Phone" value={employee.alt_phone} />
                  </div>
                </div>

                {/* 3. Family */}
                <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
                  <SectionTitle num="3" title="Family Details" icon={<Users className="w-4 h-4" />} />
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Family Member Name"     value={employee.family_member_name}     span={2} />
                    <Field label="Contact No"             value={employee.family_contact_no} />
                    <Field label="Working Status"         value={employee.family_working_status} />
                    <Field label="Employer Name"          value={employee.family_employer_name}   span={2} />
                    <Field label="Employer Contact"       value={employee.family_employer_contact} />
                  </div>
                </div>

                {/* 4. Emergency */}
                <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
                  <SectionTitle num="4" title="Emergency Contact" icon={<Phone className="w-4 h-4" />} />
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Contact Name" value={employee.emergency_contact_name}     span={2} />
                    <Field label="Contact No"   value={employee.emergency_contact_no} />
                    <Field label="Relation"     value={employee.emergency_contact_relation} />
                    <Field label="Address"      value={employee.emergency_contact_address}  span={2} />
                  </div>
                </div>

                {/* 5. Address */}
                <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
                  <SectionTitle num="5" title="Address Details" icon={<MapPin className="w-4 h-4" />} />
                  <div className="grid grid-cols-2 gap-3">
                    <p className="col-span-2 text-xs font-semibold text-gray-500 uppercase tracking-wide">Permanent Address</p>
                    <Field label="Address"  value={employee.permanent_address}  span={2} />
                    <Field label="Phone"    value={employee.permanent_phone} />
                    <Field label="Landmark" value={employee.permanent_landmark} />
                    <Field label="Lat-Long" value={employee.permanent_lat_long} span={2} />
                    <p className="col-span-2 text-xs font-semibold text-gray-500 uppercase tracking-wide mt-1">Local Address</p>
                    {employee.local_same_as_permanent ? (
                      <p className="col-span-2 text-sm text-blue-600 italic">Same as permanent address</p>
                    ) : (
                      <>
                        <Field label="Address"  value={employee.local_address}  span={2} />
                        <Field label="Phone"    value={employee.local_phone} />
                        <Field label="Landmark" value={employee.local_landmark} />
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* RIGHT COLUMN */}
              <div className="space-y-5">

                {/* 6-8. References */}
                {[
                  { num: '6', label: 'Reference 1 (Relevant Industry)', prefix: 'ref1' },
                  { num: '7', label: 'Reference 2 (Local Area)',         prefix: 'ref2' },
                  { num: '8', label: 'Reference 3 (Other than Relative)',prefix: 'ref3' },
                ].map(({ num, label, prefix }) => (
                  <div key={prefix} className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
                    <SectionTitle num={num} title={label} icon={<UserCircle className="w-4 h-4" />} />
                    <div className="grid grid-cols-2 gap-3">
                      <Field label="Name"           value={employee[`${prefix}_name`]}         span={2} />
                      <Field label="Designation"    value={employee[`${prefix}_designation`]} />
                      <Field label="Organization"   value={employee[`${prefix}_organization`]} />
                      <Field label="Address"        value={employee[`${prefix}_address`]}       span={2} />
                      <Field label="City/State/Pin" value={employee[`${prefix}_city_state_pin`]} />
                      <Field label="Contact No"     value={employee[`${prefix}_contact_no`]} />
                      <Field label="Email"          value={employee[`${prefix}_email`]} />
                    </div>
                  </div>
                ))}

                {/* 9. Employment */}
                <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
                  <SectionTitle num="9" title="Employment Details" icon={<Briefcase className="w-4 h-4" />} />
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Department"        value={employee.department} />
                    <Field label="Designation"       value={employee.position} />
                    <Field label="Employment Type"   value={employee.employment_type} />
                    <Field label="Joining Date"      value={formatDate(employee.joining_date)} />
                    <Field label="Reporting Manager" value={employee.reporting_manager} />
                    {employee.circle       && <Field label="Circle"       value={employee.circle} />}
                    {employee.project_name && <Field label="Project Name" value={employee.project_name} />}
                  </div>
                </div>

                {/* 10. Bank */}
                <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
                  <SectionTitle num="10" title="Bank Account Details" icon={<CreditCard className="w-4 h-4" />} />
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Bank Name"      value={employee.bank_name} />
                    <Field label="Account Holder" value={employee.account_holder_name} />
                    <Field label="Account Number" value={employee.account_number} />
                    <Field label="IFSC Code"      value={employee.ifsc_code} />
                    <Field label="Branch"         value={employee.bank_branch} />
                  </div>
                </div>

                {/* 11. Documents — with thumbnail previews */}
                <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
                  <SectionTitle num="11" title="Uploaded Documents" icon={<Shield className="w-4 h-4" />} />

                  {availableDocs.length === 0 ? (
                    <p className="text-sm text-gray-400 italic text-center py-4">No documents uploaded</p>
                  ) : (
                    <div className="grid grid-cols-2 gap-3">
                      {uploadedDocs.map((doc) => {
                        const url = fullUrl(doc.path);
                        const ft  = getFileType(doc.path, doc.mime_type);
                        return (
                          <div key={doc.type}
                            className={`rounded-xl border overflow-hidden transition-all ${
                              url
                                ? 'border-blue-200 bg-white hover:border-blue-400 hover:shadow-md cursor-pointer'
                                : 'border-gray-200 bg-gray-50'
                            }`}
                            onClick={() => url && openLightbox(doc.type)}>

                            {/* Thumbnail area */}
                            <div className="relative h-28 bg-gray-100 flex items-center justify-center overflow-hidden">
                              {ft === 'image' && url ? (
                                <img src={url} alt={doc.label}
                                  className="w-full h-full object-cover"
                                  onError={(e) => {
                                    e.target.style.display = 'none';
                                    e.target.parentElement.querySelector('.fallback')?.style.setProperty('display','flex');
                                  }} />
                              ) : ft === 'pdf' ? (
                                <div className="flex flex-col items-center justify-center gap-1 h-full w-full bg-red-50">
                                  <FileText className="w-8 h-8 text-red-400" />
                                  <span className="text-xs font-bold text-red-500">PDF</span>
                                </div>
                              ) : url ? (
                                <div className="flex flex-col items-center justify-center gap-1 h-full w-full bg-blue-50">
                                  <FileText className="w-8 h-8 text-blue-400" />
                                  <span className="text-xs font-bold text-blue-500">FILE</span>
                                </div>
                              ) : (
                                <div className="flex flex-col items-center justify-center gap-1 h-full w-full bg-gray-100">
                                  <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-gray-200 text-gray-400">
                                    {doc.icon}
                                  </div>
                                </div>
                              )}

                              {/* Hover overlay */}
                              {url && (
                                <div className="absolute inset-0 bg-blue-900/60 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
                                  <div className="flex items-center gap-1.5 text-white text-xs font-semibold">
                                    <ZoomIn className="w-4 h-4" /> View
                                  </div>
                                </div>
                              )}

                              {/* Status badge */}
                              <div className={`absolute top-1.5 right-1.5 px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                                url ? 'bg-green-500 text-white' : 'bg-gray-300 text-gray-600'
                              }`}>
                                {url ? '✓' : '—'}
                              </div>
                            </div>

                            {/* Label */}
                            <div className="px-3 py-2 border-t border-gray-100">
                              <p className="text-xs font-semibold text-gray-800 truncate">{doc.label}</p>
                              <p className={`text-[10px] mt-0.5 ${url ? 'text-green-600' : 'text-gray-400'}`}>
                                {url ? 'Click to view' : 'Not uploaded'}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* View all button */}
                  {availableDocs.length > 0 && (
                    <button onClick={() => setLightbox({ docs: availableDocs, startIndex: 0 })}
                      className="w-full mt-3 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 transition-all">
                      <Eye className="w-3.5 h-3.5" />
                      View All Documents ({availableDocs.length} uploaded)
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Declaration */}
            <div className="mt-6 rounded-xl border border-blue-200 bg-blue-50/50 p-5">
              <h4 className="text-sm font-semibold text-blue-900 mb-2">Declaration</h4>
              <p className="text-xs text-gray-600 leading-relaxed mb-4">
                I hereby declare that all the information provided above is true and correct to the best of my knowledge.
                I understand that any false information may result in the rejection of my application or termination of employment.
              </p>
              <div className="flex items-end justify-between border-t border-blue-200 pt-3">
                <div>
                  <p className="text-xs text-gray-500 mb-0.5">Applicant Name</p>
                  <p className="text-sm font-semibold text-gray-900">{employee.first_name} {employee.last_name}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-500 mb-0.5">Submission Date</p>
                  <p className="text-sm font-semibold text-gray-900">{formatDate(employee.created_at)}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

// ─── Reject Modal ─────────────────────────────────────────────────────────────
const RejectModal = ({ employee, onConfirm, onCancel, loading }) => {
  const [reason, setReason] = useState('');
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(6px)' }}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        <div className="h-1.5 w-full" style={{ background: 'linear-gradient(90deg,#ef4444,#f97316)' }} />
        <div className="p-8">
          <div className="w-16 h-16 mx-auto mb-5 rounded-2xl flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg,#fee2e2,#fecaca)' }}>
            <XCircle className="w-8 h-8 text-red-500" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 text-center mb-1">Reject Registration</h3>
          <p className="text-gray-500 text-sm text-center mb-6">
            Rejecting <strong className="text-gray-900">{employee.first_name} {employee.last_name}</strong>'s registration
          </p>
          <label className="block text-xs font-semibold text-gray-700 mb-2 uppercase tracking-wide">Reason for Rejection</label>
          <textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={3}
            placeholder="Provide a reason (optional but recommended)..."
            className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-red-400 outline-none text-sm mb-5 resize-none" />
          <div className="flex gap-3">
            <button onClick={onCancel} disabled={loading}
              className="flex-1 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-semibold text-sm disabled:opacity-50">
              Cancel
            </button>
            <button onClick={() => onConfirm(reason)} disabled={loading}
              className="flex-1 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl font-semibold text-sm disabled:opacity-50 flex items-center justify-center gap-2">
              {loading ? <Loader className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
              {loading ? 'Rejecting...' : 'Confirm Reject'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── Employee Card ────────────────────────────────────────────────────────────
const EmployeeCard = ({ employee, onApprove, onReject, approving, rejecting }) => {
  const [showFullForm, setShowFullForm] = useState(false);
  return (
    <>
      {showFullForm && <FullFormViewer employee={employee} onClose={() => setShowFullForm(false)} />}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden">
        <div className="h-0.5 w-full" style={{ background: 'linear-gradient(90deg,#1d4ed8,#3b82f6,#60a5fa)' }} />
        <div className="px-5 pt-4 pb-3.5 border-b border-gray-100">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3.5">
              <Avatar firstName={employee.first_name} lastName={employee.last_name} size="md" />
              <div>
                <h3 className="text-sm font-bold text-gray-900 leading-tight">
                  {employee.first_name} {employee.last_name}
                </h3>
                <div className="flex items-center gap-1.5 text-xs text-gray-500 mt-0.5">
                  <Briefcase className="w-3 h-3" />
                  <span>{employee.position || 'Not specified'}</span>
                  <span className="text-gray-300">•</span>
                  <Building2 className="w-3 h-3" />
                  <span>{employee.department || 'Not specified'}</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <button onClick={() => setShowFullForm(true)}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-gray-200 bg-white text-gray-600 hover:border-blue-300 hover:text-blue-700 hover:bg-blue-50 transition-all text-xs font-medium">
                <Eye className="w-3.5 h-3.5" /> View
              </button>
              <button onClick={onApprove} disabled={approving || rejecting}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-white disabled:opacity-50"
                style={{ background: approving ? '#15803d' : 'linear-gradient(135deg,#16a34a,#22c55e)', boxShadow: '0 1px 6px rgba(34,197,94,0.35)' }}>
                {approving
                  ? <><Loader className="w-3.5 h-3.5 animate-spin" /><span>Approving…</span></>
                  : <><CheckCircle className="w-3.5 h-3.5" /><span>Approve</span></>}
              </button>
              <button onClick={onReject} disabled={approving || rejecting}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-red-200 bg-white text-red-500 hover:bg-red-50 hover:border-red-400 text-xs font-medium disabled:opacity-50">
                <XCircle className="w-3.5 h-3.5" /> Reject
              </button>
            </div>
          </div>
        </div>
        <div className="px-5 py-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
            {[
              { icon: <Mail className="w-3.5 h-3.5 text-blue-500" />,     label: 'Email',        value: employee.email },
              { icon: <Phone className="w-3.5 h-3.5 text-blue-500" />,    label: 'Phone',        value: employee.phone },
              { icon: <Calendar className="w-3.5 h-3.5 text-blue-500" />, label: 'Joining Date', value: formatDateShort(employee.joining_date) },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-lg bg-gray-50 border border-gray-100">
                <div className="w-7 h-7 bg-blue-50 rounded-md flex items-center justify-center flex-shrink-0">{item.icon}</div>
                <div className="min-w-0">
                  <p className="text-[10px] font-medium text-gray-400 uppercase tracking-wide leading-none mb-0.5">{item.label}</p>
                  <p className="text-xs font-semibold text-gray-800 truncate">{item.value || '—'}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="flex items-center justify-between px-3.5 py-2.5 rounded-lg border border-gray-100 bg-gray-50">
            <div className="flex items-center gap-1.5 text-xs text-gray-500">
              <Clock className="w-3.5 h-3.5 text-gray-400" />
              <span>Applied:</span>
              <span className="font-semibold text-gray-700">{formatDateTime(employee.created_at)}</span>
            </div>
            {employee.employment_type && (
              <span className="px-2 py-0.5 text-[11px] font-semibold rounded-full" style={{ background: '#dbeafe', color: '#1d4ed8' }}>
                {employee.employment_type}
              </span>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────
const PendingApprovals = ({ showToast, onEmployeeApproved }) => {
  const [pendingList, setPendingList]     = useState([]);
  const [loading, setLoading]             = useState(true);
  const [error, setError]                 = useState('');
  const [actionLoading, setActionLoading] = useState({});
  const [rejectTarget, setRejectTarget]   = useState(null);

  const fetchPending = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const res = await employeeService.getPendingSubmissions();
      setPendingList(res.data || []);
    } catch (err) {
      if (err.message?.includes('Cannot connect') || err.message?.includes('Failed to fetch')) {
        setError('Cannot connect to server. Please ensure the backend is running on port 5000.');
      } else {
        setError(err.message || 'Failed to load pending submissions');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchPending(); }, [fetchPending]);

  const handleApprove = async (employee) => {
    setActionLoading(prev => ({ ...prev, [`approve_${employee.id}`]: true }));
    try {
      const res = await employeeService.approveSubmission(employee.id);
      if (res.success) {
        const empId = res.data?.employee_id || res.data?.employeeId || '';
        showToast?.(`✅ ${employee.first_name} ${employee.last_name} approved! ID: ${empId}`, 'success');
        setPendingList(prev => prev.filter(e => e.id !== employee.id));
        onEmployeeApproved?.();
      }
    } catch (err) {
      showToast?.(err.message || 'Failed to approve employee', 'error');
    } finally {
      setActionLoading(prev => ({ ...prev, [`approve_${employee.id}`]: false }));
    }
  };

  const handleRejectConfirm = async (reason) => {
    if (!rejectTarget) return;
    const id = rejectTarget.id;
    setActionLoading(prev => ({ ...prev, [`reject_${id}`]: true }));
    try {
      await employeeService.rejectSubmission(id, reason);
      showToast?.(`❌ ${rejectTarget.first_name} ${rejectTarget.last_name} rejected.`, 'success');
      setPendingList(prev => prev.filter(e => e.id !== id));
      setRejectTarget(null);
    } catch (err) {
      showToast?.(err.message || 'Failed to reject submission', 'error');
    } finally {
      setActionLoading(prev => ({ ...prev, [`reject_${id}`]: false }));
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center py-20">
        <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
          style={{ background: 'linear-gradient(135deg,#1d4ed8,#3b82f6)' }}>
          <Loader className="w-8 h-8 text-white animate-spin" />
        </div>
        <p className="text-gray-600 font-medium">Loading pending requests…</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6 md:p-8">
      {rejectTarget && (
        <RejectModal
          employee={rejectTarget}
          onConfirm={handleRejectConfirm}
          onCancel={() => setRejectTarget(null)}
          loading={!!actionLoading[`reject_${rejectTarget?.id}`]}
        />
      )}

      {/* Header */}
      <div className="mb-7">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ background: 'linear-gradient(135deg,#1e3a5f,#1d4ed8)' }}>
                <Users className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900">Pending Approvals</h1>
            </div>
            <p className="text-gray-500 text-sm ml-13">
              {pendingList.length > 0
                ? <span><strong className="text-blue-700">{pendingList.length}</strong> {pendingList.length === 1 ? 'request' : 'requests'} awaiting review</span>
                : 'No pending requests at the moment'}
            </p>
          </div>
          <button onClick={fetchPending}
            className="flex items-center gap-2 px-3.5 py-2 bg-white border border-gray-200 rounded-xl text-xs font-semibold text-gray-600 hover:border-blue-300 hover:text-blue-700 hover:bg-blue-50 transition-all shadow-sm">
            <RefreshCw className="w-3.5 h-3.5" /> Refresh
          </button>
        </div>

        {pendingList.length > 0 && (
          <div className="mt-5 grid grid-cols-3 gap-4">
            {[
              { label: 'Total Pending',  value: pendingList.length,                                                color: '#1d4ed8' },
              { label: 'Oldest Request', value: formatDateShort(pendingList[pendingList.length - 1]?.created_at), color: '#d97706' },
              { label: 'Latest Request', value: formatDateShort(pendingList[0]?.created_at),                      color: '#059669' },
            ].map((stat, i) => (
              <div key={i} className="bg-white rounded-xl border border-gray-200 px-5 py-4 shadow-sm">
                <p className="text-xs font-medium text-gray-500 mb-1">{stat.label}</p>
                <p className="text-lg font-bold" style={{ color: stat.color }}>{stat.value}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
          <p className="text-sm font-medium text-red-700 flex-1">{error}</p>
          <button onClick={fetchPending}
            className="px-3 py-1.5 bg-white border border-red-300 hover:bg-red-50 rounded-lg text-xs font-semibold text-red-600">
            Retry
          </button>
        </div>
      )}

      {/* Empty */}
      {!error && pendingList.length === 0 && (
        <div className="bg-white border border-gray-200 rounded-2xl p-16 text-center shadow-sm">
          <div className="w-20 h-20 mx-auto mb-5 rounded-2xl flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg,#dbeafe,#bfdbfe)' }}>
            <CheckCircle className="w-10 h-10 text-blue-600" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">All Caught Up!</h3>
          <p className="text-gray-500 text-sm max-w-xs mx-auto">No pending approval requests at the moment.</p>
        </div>
      )}

      {/* Cards */}
      {pendingList.length > 0 && (
        <div className="space-y-3">
          {pendingList.map((emp) => (
            <EmployeeCard
              key={emp.id}
              employee={emp}
              onApprove={() => handleApprove(emp)}
              onReject={() => setRejectTarget(emp)}
              approving={!!actionLoading[`approve_${emp.id}`]}
              rejecting={!!actionLoading[`reject_${emp.id}`]}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default PendingApprovals;