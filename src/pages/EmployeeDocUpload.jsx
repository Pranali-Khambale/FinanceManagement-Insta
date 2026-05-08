// src/pages/EmployeeDocUpload.jsx
// ─────────────────────────────────────────────────────────────────────────────
// Public page — no auth required.
// Employee visits /upload-documents/:token and uploads:
//   1. Signed KYE form (required)
//   2. BGV form (recommended)
//   3. Screenshot of approval email (recommended)
// ─────────────────────────────────────────────────────────────────────────────
import React, { useState, useEffect, useRef } from 'react';
import {
  Upload, FileText, CheckCircle, AlertCircle, Loader,
  Image, File, X, Eye, Download, Info, ChevronRight,
  Shield, Camera, ClipboardList,
} from 'lucide-react';
import { useParams } from 'react-router-dom';

const BASE_URL =
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_URL) ||
  'http://localhost:5000/api';

// ── File drop zone ────────────────────────────────────────────────────────────
const DropZone = ({ label, description, accept, file, onChange, onRemove, required, icon: Icon }) => {
  const inputRef  = useRef(null);
  const [drag, setDrag] = useState(false);

  const handleDrop = (e) => {
    e.preventDefault();
    setDrag(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped) onChange(dropped);
  };

  const preview = file
    ? (file.type?.startsWith('image/')
        ? URL.createObjectURL(file)
        : null)
    : null;

  return (
    <div className="mb-5">
      <label className="block text-sm font-semibold text-gray-800 mb-1.5">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      {description && (
        <p className="text-xs text-gray-500 mb-2 leading-relaxed">{description}</p>
      )}

      {file ? (
        <div className="relative flex items-center gap-3 px-4 py-3 rounded-xl border-2 border-green-400 bg-green-50">
          <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center flex-shrink-0">
            {preview
              ? <img src={preview} alt="" className="w-10 h-10 object-cover rounded-lg" />
              : <FileText className="w-5 h-5 text-green-600" />
            }
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-gray-900 truncate">{file.name}</p>
            <p className="text-xs text-gray-500">{(file.size / 1024).toFixed(1)} KB</p>
          </div>
          <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
          <button
            type="button"
            onClick={onRemove}
            className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center text-white hover:bg-red-600 transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ) : (
        <div
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
          onDragLeave={() => setDrag(false)}
          onDrop={handleDrop}
          className={`border-2 border-dashed rounded-xl px-6 py-8 text-center cursor-pointer transition-all ${
            drag
              ? 'border-blue-500 bg-blue-50'
              : 'border-gray-300 bg-gray-50 hover:border-blue-400 hover:bg-blue-50'
          }`}
        >
          <div className="w-12 h-12 mx-auto mb-3 rounded-xl flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg,#dbeafe,#bfdbfe)' }}>
            <Icon className="w-6 h-6 text-blue-600" />
          </div>
          <p className="text-sm font-semibold text-gray-700 mb-1">
            Drop file here or <span className="text-blue-600 underline">browse</span>
          </p>
          <p className="text-xs text-gray-400">PDF or image • Max 10 MB</p>
          <input
            ref={inputRef}
            type="file"
            accept={accept}
            className="hidden"
            onChange={(e) => e.target.files[0] && onChange(e.target.files[0])}
          />
        </div>
      )}
    </div>
  );
};

// ── Main Component ────────────────────────────────────────────────────────────
const EmployeeDocUpload = () => {
  const { token }    = useParams();
  const [phase, setPhase]     = useState('loading'); // loading | valid | expired | used | success | error
  const [employee, setEmployee] = useState(null);
  const [expiresAt, setExpiresAt] = useState(null);

  // Files
  const [signedKye,       setSignedKye]       = useState(null);
  const [bgvForm,         setBgvForm]         = useState(null);
  const [emailScreenshot, setEmailScreenshot] = useState(null);

  // UI
  const [submitting, setSubmitting] = useState(false);
  const [error,      setError]      = useState('');

  // ── Validate token on mount ───────────────────────────────────────────────
  useEffect(() => {
    if (!token) { setPhase('error'); return; }
    fetch(`${BASE_URL}/employee-docs/validate/${token}`)
      .then(r => r.json())
      .then(data => {
        if (data.success) {
          setEmployee(data.employee);
          setExpiresAt(data.expiresAt);
          setPhase('valid');
        } else if (data.used)    { setPhase('used'); }
        else if (data.expired)   { setPhase('expired'); }
        else                     { setPhase('error'); setError(data.message || 'Invalid link'); }
      })
      .catch(() => { setPhase('error'); setError('Cannot connect to server.'); });
  }, [token]);

  // ── Submit ────────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (!signedKye) {
      setError('Please upload your signed KYE form — it is required.');
      return;
    }

    setError('');
    setSubmitting(true);

    try {
      const fd = new FormData();
      fd.append('signed_kye',       signedKye,       signedKye.name);
      if (bgvForm)         fd.append('bgv_form',         bgvForm,         bgvForm.name);
      if (emailScreenshot) fd.append('email_screenshot', emailScreenshot, emailScreenshot.name);

      const res  = await fetch(`${BASE_URL}/employee-docs/upload/${token}`, {
        method: 'POST',
        body: fd,
      });
      const data = await res.json();

      if (data.success) {
        setPhase('success');
      } else {
        setError(data.message || 'Upload failed. Please try again.');
      }
    } catch (err) {
      setError('Cannot connect to server. Please check your internet connection.');
    } finally {
      setSubmitting(false);
    }
  };

  // ── Phase renders ─────────────────────────────────────────────────────────
  if (phase === 'loading') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
            style={{ background: 'linear-gradient(135deg,#1d4ed8,#3b82f6)' }}>
            <Loader className="w-8 h-8 text-white animate-spin" />
          </div>
          <p className="text-gray-600 font-medium">Validating your upload link…</p>
        </div>
      </div>
    );
  }

  if (phase === 'success') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-10 text-center">
          <div className="w-20 h-20 mx-auto mb-5 rounded-2xl flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg,#dcfce7,#bbf7d0)' }}>
            <CheckCircle className="w-10 h-10 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Documents Submitted!</h2>
          <p className="text-gray-500 text-sm leading-relaxed mb-6">
            Your signed documents have been successfully uploaded. HR has been notified
            and will verify them shortly. You will be contacted once the review is complete.
          </p>
          <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-left">
            <p className="text-xs font-bold text-green-800 uppercase tracking-wider mb-2">What Happens Next</p>
            {['HR will verify your signed KYE and BGV forms',
              'Your onboarding will be completed within 1–2 business days',
              'HR will reach out with further instructions'].map((step, i) => (
              <div key={i} className="flex items-start gap-2 mb-1.5">
                <ChevronRight className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-green-700">{step}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (phase === 'used') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-10 text-center">
          <div className="w-20 h-20 mx-auto mb-5 rounded-2xl flex items-center justify-center bg-blue-100">
            <CheckCircle className="w-10 h-10 text-blue-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Already Submitted</h2>
          <p className="text-gray-500 text-sm">
            Your documents have already been submitted via this link.
            If you need to resubmit, please contact HR at{' '}
            <a href="mailto:humanresources@instagrp.com" className="text-blue-600 underline">
              humanresources@instagrp.com
            </a>
          </p>
        </div>
      </div>
    );
  }

  if (phase === 'expired') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-10 text-center">
          <div className="w-20 h-20 mx-auto mb-5 rounded-2xl flex items-center justify-center bg-amber-100">
            <AlertCircle className="w-10 h-10 text-amber-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Link Expired</h2>
          <p className="text-gray-500 text-sm">
            This upload link has expired. Please contact HR to request a new link.
          </p>
        </div>
      </div>
    );
  }

  if (phase === 'error') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-rose-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-10 text-center">
          <div className="w-20 h-20 mx-auto mb-5 rounded-2xl flex items-center justify-center bg-red-100">
            <AlertCircle className="w-10 h-10 text-red-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Invalid Link</h2>
          <p className="text-gray-500 text-sm">{error || 'This upload link is invalid. Please contact HR.'}</p>
        </div>
      </div>
    );
  }

  // ── Valid — show upload form ───────────────────────────────────────────────
  const expiry = expiresAt
    ? new Date(expiresAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })
    : null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-blue-100 py-8 px-4">
      <div className="max-w-lg mx-auto">

        {/* Header */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden mb-5">
          <div className="h-1.5 w-full" style={{ background: 'linear-gradient(90deg,#1d4ed8,#3b82f6,#60a5fa)' }} />
          <div className="px-6 py-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ background: 'linear-gradient(135deg,#1e3a5f,#1d4ed8)' }}>
                <Upload className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-gray-900">Upload Your Documents</h1>
                <p className="text-xs text-gray-500">Insta ICT Solutions — HR Department</p>
              </div>
            </div>

            {employee && (
              <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3">
                <p className="text-xs font-semibold text-blue-800 mb-1">
                  {employee.firstName} {employee.lastName}
                </p>
                <p className="text-xs text-blue-600">
                  {employee.empId} &bull; {employee.department} &bull; {employee.position}
                </p>
              </div>
            )}

            {expiry && (
              <div className="flex items-center gap-2 mt-3 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                This upload link expires on <strong>{expiry}</strong>
              </div>
            )}
          </div>
        </div>

     

        {/* Upload form */}
        <div className="bg-white rounded-2xl shadow-lg px-6 py-6 mb-5">
          <DropZone
            label="Signed KYE Form"
            description="Upload the printed, handwritten and signed KYE form. PDF or photo (JPG/PNG) accepted."
            accept="image/*,application/pdf"
            file={signedKye}
            onChange={setSignedKye}
            onRemove={() => setSignedKye(null)}
            required
            icon={FileText}
          />
          <DropZone
            label="BGV Form"
            description="Background Verification form — filled and signed."
            accept="image/*,application/pdf"
            file={bgvForm}
            onChange={setBgvForm}
            onRemove={() => setBgvForm(null)}
            icon={Shield}
          />
          <DropZone
            label="Approval Email Screenshot"
            description="A screenshot or photo of the approval email you received showing your Employee ID."
            accept="image/*,application/pdf"
            file={emailScreenshot}
            onChange={setEmailScreenshot}
            onRemove={() => setEmailScreenshot(null)}
            icon={Camera}
          />

          {error && (
            <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-3 mb-4">
              <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          <button
            onClick={handleSubmit}
            disabled={submitting || !signedKye}
            className={`w-full py-3.5 rounded-xl font-bold text-sm text-white transition-all flex items-center justify-center gap-2 ${
              submitting || !signedKye
                ? 'opacity-50 cursor-not-allowed'
                : 'hover:opacity-90 active:scale-95'
            }`}
            style={{ background: 'linear-gradient(135deg,#1d4ed8,#3b82f6)' }}
          >
            {submitting
              ? <><Loader className="w-4 h-4 animate-spin" /> Uploading…</>
              : <><Upload className="w-4 h-4" /> Submit Documents</>
            }
          </button>
          <p className="text-center text-xs text-gray-400 mt-2">
            Documents are securely stored and only accessible to HR
          </p>
        </div>

        <p className="text-center text-xs text-gray-500">
          Need help? Contact{' '}
          <a href="mailto:humanresources@instagrp.com" className="text-blue-600 underline">
            humanresources@instagrp.com
          </a>
        </p>
      </div>
    </div>
  );
};

export default EmployeeDocUpload;