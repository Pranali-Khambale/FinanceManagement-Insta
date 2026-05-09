// src/Ui/EmployeeMng/PendingApprovals.jsx
import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  CheckCircle, XCircle, Eye, Loader, AlertCircle, RefreshCw,
  User, Mail, Phone, Building2, Calendar, FileText, Clock, Users,
  Briefcase, CreditCard, Shield, UserCircle, Building, FileCheck,
  Award, ExternalLink, Printer, Download, ChevronLeft, ChevronRight,
  X as XIcon, History, Upload, Check, Camera, File, ChevronDown, ChevronUp,
  FolderOpen, CheckCheck,
} from 'lucide-react';
import employeeService from '../../services/employeeService';
import { printKYEForm } from './KYEPrintForm';

const BASE_URL =
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_URL?.replace('/api', '')) ||
  'http://localhost:5000';

const BASE_API =
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_URL) ||
  'http://localhost:5000/api';

// ─── Utilities ────────────────────────────────────────────────────────────────
const formatDate = (d) => {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
};
const formatDateTime = (d) => {
  if (!d) return '—';
  return new Date(d).toLocaleString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });
};
const formatDateShort = (d) => {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
};
const fullUrl = (path) =>
  !path ? null : path.startsWith('http') ? path : `${BASE_URL}${path}`;
const getFileType = (path, mime) => {
  const p = (path || '').toLowerCase();
  const m = (mime || '').toLowerCase();
  if (m.includes('pdf') || p.endsWith('.pdf')) return 'pdf';
  if (m.includes('image') || /\.(jpg|jpeg|png|gif|webp|bmp)$/.test(p)) return 'image';
  return 'other';
};

// ─── Document type metadata ───────────────────────────────────────────────────
const DOC_META = {
  signed_kye: {
    label: 'Signed KYE Form',
    icon: FileText,
    color: { bg: '#eff6ff', border: '#bfdbfe', text: '#1d4ed8', dot: '#3b82f6' },
  },
  bgv_form: {
    label: 'BGV Form',
    icon: Shield,
    color: { bg: '#f5f3ff', border: '#ddd6fe', text: '#6d28d9', dot: '#7c3aed' },
  },
  email_screenshot: {
    label: 'Approval Email Screenshot',
    icon: Camera,
    color: { bg: '#f0fdf4', border: '#bbf7d0', text: '#15803d', dot: '#22c55e' },
  },
  other: {
    label: 'Other Document',
    icon: File,
    color: { bg: '#f9fafb', border: '#e5e7eb', text: '#374151', dot: '#9ca3af' },
  },
};

// ─── Avatar ───────────────────────────────────────────────────────────────────
const Avatar = ({ firstName, lastName, size = 'md' }) => {
  const initials = `${(firstName?.[0] || 'N').toUpperCase()}${(lastName?.[0] || 'A').toUpperCase()}`;
  const sizes = { sm: 'w-9 h-9 text-sm', md: 'w-12 h-12 text-base', lg: 'w-16 h-16 text-xl' };
  return (
    <div
      className={`${sizes[size]} rounded-xl flex items-center justify-center font-bold text-white flex-shrink-0`}
      style={{
        background: 'linear-gradient(135deg,#1d4ed8 0%,#3b82f6 60%,#60a5fa 100%)',
        boxShadow: '0 4px 14px rgba(59,130,246,0.4)',
      }}
    >
      {initials}
    </div>
  );
};

// ─── Doc Lightbox ─────────────────────────────────────────────────────────────
const DocLightbox = ({ docs, startIndex = 0, onClose }) => {
  const [idx, setIdx]           = useState(startIndex);
  const [imgError, setImgError] = useState(false);

  const doc      = docs[idx];
  const url      = fullUrl(doc?.file_path || doc?.path);
  const fileType = getFileType(doc?.file_path || doc?.path, doc?.mime_type);

  useEffect(() => { setImgError(false); }, [idx]);
  useEffect(() => {
    const h = (e) => {
      if (e.key === 'Escape')     onClose();
      if (e.key === 'ArrowRight') setIdx(i => Math.min(i + 1, docs.length - 1));
      if (e.key === 'ArrowLeft')  setIdx(i => Math.max(i - 1, 0));
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [docs.length, onClose]);

  const meta = DOC_META[doc?.document_type] || DOC_META.other;
  const Icon = meta.icon;

  return (
    <div className="fixed inset-0 z-[400] flex flex-col" style={{ background: 'rgba(0,0,0,0.95)' }}>
      <div
        className="flex items-center justify-between px-6 py-3 flex-shrink-0"
        style={{ background: 'linear-gradient(90deg,#0f172a,#1e3a5f)' }}
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: meta.color.bg }}>
            <Icon className="w-4 h-4" style={{ color: meta.color.text }} />
          </div>
          <div>
            <p className="text-white font-semibold text-sm">{meta.label}</p>
            <p className="text-blue-300 text-xs">{idx + 1} of {docs.length}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {url && (
            <>
              <a href={url} download target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-lg text-xs font-medium transition-all border border-white/10">
                <Download className="w-3.5 h-3.5" /> Download
              </a>
              <a href={url} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-lg text-xs font-medium transition-all border border-white/10">
                <ExternalLink className="w-3.5 h-3.5" /> Open
              </a>
            </>
          )}
          <button onClick={onClose}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white text-slate-900 rounded-lg text-xs font-bold hover:bg-blue-50 transition-all ml-2">
            <XIcon className="w-3.5 h-3.5" /> Close
          </button>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center relative overflow-hidden p-6">
        {idx > 0 && (
          <button onClick={() => setIdx(i => i - 1)}
            className="absolute left-4 z-10 w-11 h-11 bg-white/10 hover:bg-white/25 rounded-full flex items-center justify-center text-white transition-all border border-white/10">
            <ChevronLeft className="w-6 h-6" />
          </button>
        )}
        {fileType === 'pdf' && url && (
          <iframe src={url} title={meta.label} className="w-full rounded-xl shadow-2xl bg-white"
            style={{ height: 'calc(100vh - 140px)', maxWidth: '960px' }} />
        )}
        {fileType === 'image' && url && !imgError && (
          <img src={url} alt={meta.label}
            className="rounded-xl shadow-2xl object-contain"
            style={{ maxHeight: 'calc(100vh - 140px)', maxWidth: '100%' }}
            onError={() => setImgError(true)} />
        )}
        {(fileType === 'other' || (fileType === 'image' && imgError) || !url) && (
          <div className="text-center text-white space-y-4">
            <div className="w-20 h-20 bg-white/10 rounded-2xl flex items-center justify-center mx-auto">
              <FileText className="w-10 h-10 opacity-50" />
            </div>
            <p className="text-lg font-semibold opacity-70">Preview not available</p>
            {url && (
              <a href={url} download
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-white/15 hover:bg-white/25 rounded-xl text-sm font-semibold transition-all">
                <Download className="w-4 h-4" /> Download File
              </a>
            )}
          </div>
        )}
        {idx < docs.length - 1 && (
          <button onClick={() => setIdx(i => i + 1)}
            className="absolute right-4 z-10 w-11 h-11 bg-white/10 hover:bg-white/25 rounded-full flex items-center justify-center text-white transition-all border border-white/10">
            <ChevronRight className="w-6 h-6" />
          </button>
        )}
      </div>

      {docs.length > 1 && (
        <div className="flex-shrink-0 flex items-center gap-2 px-6 py-3 overflow-x-auto"
          style={{ background: 'rgba(0,0,0,0.7)' }}>
          {docs.map((d, i) => {
            const u  = fullUrl(d.file_path || d.path);
            const ft = getFileType(d.file_path || d.path, d.mime_type);
            const m  = DOC_META[d.document_type] || DOC_META.other;
            const I  = m.icon;
            return (
              <button key={i} onClick={() => setIdx(i)}
                className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all ${
                  i === idx ? 'border-blue-400 scale-110' : 'border-white/20 opacity-50 hover:opacity-80'
                }`}>
                {ft === 'image' && u
                  ? <img src={u} alt="" className="w-full h-full object-cover" onError={(e) => { e.target.style.display = 'none'; }} />
                  : <div className="w-full h-full bg-slate-800 flex items-center justify-center"><I className="w-4 h-4 text-slate-400" /></div>}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

// ─── Single Document Row — VIEW + DOWNLOAD only (no per-doc accept/reject) ────
const DocViewRow = ({ doc, onView }) => {
  const meta  = DOC_META[doc.document_type] || DOC_META.other;
  const Icon  = meta.icon;
  const url   = fullUrl(doc.file_path);
  const ft    = getFileType(doc.file_path, doc.mime_type);

  const isAccepted = doc.status === 'accepted' || doc.reviewed === true;
  const isRejected = doc.status === 'rejected';
  const isPending  = !isAccepted && !isRejected;

  return (
    <div
      className="rounded-xl border transition-all"
      style={{
        background: isAccepted ? '#f0fdf4' : isRejected ? '#fef2f2' : meta.color.bg,
        borderColor: isAccepted ? '#bbf7d0' : isRejected ? '#fecaca' : meta.color.border,
      }}
    >
      <div className="flex items-center gap-3 px-4 py-3">
        {/* Thumbnail */}
        <div
          className="w-12 h-12 rounded-lg overflow-hidden border flex-shrink-0 flex items-center justify-center"
          style={{ borderColor: meta.color.border, background: ft === 'image' ? 'transparent' : meta.color.bg }}
        >
          {ft === 'image' && url ? (
            <img src={url} alt={meta.label} className="w-full h-full object-cover"
              onError={(e) => { e.target.style.display = 'none'; }} />
          ) : ft === 'pdf' ? (
            <div className="w-full h-full flex flex-col items-center justify-center gap-0.5" style={{ background: meta.color.bg }}>
              <FileText className="w-5 h-5" style={{ color: meta.color.text }} />
              <span className="text-[8px] font-bold" style={{ color: meta.color.text }}>PDF</span>
            </div>
          ) : (
            <Icon className="w-5 h-5" style={{ color: meta.color.text }} />
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <p className="text-sm font-bold text-gray-900 truncate">{meta.label}</p>
            {isPending && (
              <span
                className="flex-shrink-0 text-[9px] font-bold px-1.5 py-0.5 rounded-full"
                style={{ background: meta.color.dot, color: '#fff' }}
              >
                PENDING
              </span>
            )}
            {isAccepted && (
              <span className="flex-shrink-0 inline-flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-green-500 text-white">
                <Check className="w-2.5 h-2.5" style={{ strokeWidth: 3 }} /> ACCEPTED
              </span>
            )}
            {isRejected && (
              <span className="flex-shrink-0 inline-flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-red-500 text-white">
                <XIcon className="w-2.5 h-2.5" style={{ strokeWidth: 3 }} /> REJECTED
              </span>
            )}
          </div>
          <p className="text-xs text-gray-500 truncate">{doc.file_name}</p>
          <p className="text-[10px] text-gray-400 mt-0.5">
            {new Date(doc.uploaded_at).toLocaleString('en-IN', {
              day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
            })}
          </p>
          {isRejected && doc.rejection_reason && (
            <p className="text-[10px] text-red-500 mt-1 italic">Reason: {doc.rejection_reason}</p>
          )}
        </div>

        {/* View + Download only */}
        <div className="flex items-center gap-1.5 flex-shrink-0">
          {url && (
            <button
              onClick={() => onView(doc)}
              className="w-9 h-9 rounded-lg flex items-center justify-center border border-gray-200 bg-white hover:border-blue-300 hover:bg-blue-50 transition-all"
              title="View document"
            >
              <Eye className="w-4 h-4 text-gray-500" />
            </button>
          )}
          {url && (
            <a
              href={url} download target="_blank" rel="noopener noreferrer"
              className="w-9 h-9 rounded-lg flex items-center justify-center border border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50 transition-all"
              title="Download"
            >
              <Download className="w-4 h-4 text-gray-500" />
            </a>
          )}
        </div>
      </div>
    </div>
  );
};

// ─── Batch Action Bar ─────────────────────────────────────────────────────────
const BatchActionBar = ({ docs, onAcceptAll, onRejectAll, accepting, rejecting }) => {
  const [showRejectBox, setShowRejectBox] = useState(false);
  const [reason, setReason]               = useState('');

  const pendingCount = docs.filter(
    d => !d.reviewed && d.status !== 'accepted' && d.status !== 'rejected'
  ).length;
  const allDone = pendingCount === 0 && docs.length > 0;

  if (allDone) return null;

  const handleRejectConfirm = () => {
    onRejectAll(reason);
    setShowRejectBox(false);
    setReason('');
  };

  return (
    <div
      className="rounded-xl border mb-3 overflow-hidden"
      style={{
        background: 'linear-gradient(90deg,#f8fafc,#f1f5f9)',
        borderColor: '#e2e8f0',
      }}
    >
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-3 gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
          <p className="text-xs font-bold text-gray-700">
            {pendingCount} document{pendingCount !== 1 ? 's' : ''} pending review
          </p>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 font-semibold border border-amber-200">
            {docs.length} submitted
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Accept All */}
          <button
            onClick={onAcceptAll}
            disabled={accepting || rejecting}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-white text-xs font-bold disabled:opacity-50 transition-all shadow-sm hover:shadow-md active:scale-[0.97]"
            style={{ background: 'linear-gradient(135deg,#16a34a,#22c55e)' }}
          >
            {accepting
              ? <Loader className="w-3.5 h-3.5 animate-spin" />
              : <CheckCheck className="w-3.5 h-3.5" />}
            Accept All
          </button>

          {/* Reject All */}
          <button
            onClick={() => setShowRejectBox(p => !p)}
            disabled={accepting || rejecting}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg border border-red-200 bg-white text-red-600 hover:bg-red-50 hover:border-red-400 text-xs font-bold disabled:opacity-50 transition-all"
          >
            <XCircle className="w-3.5 h-3.5" />
            {showRejectBox ? 'Cancel' : 'Reject All'}
          </button>
        </div>
      </div>

      {/* Inline reject reason box */}
      {showRejectBox && (
        <div
          className="px-4 pb-4 border-t border-red-100"
          style={{ background: '#fff5f5', animation: 'fadeSlideIn 0.18s ease both' }}
        >
          <p className="text-xs font-semibold text-red-700 mb-2 mt-3">
            Reason for rejecting all documents <span className="text-red-400 font-normal">(optional)</span>
          </p>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={2}
            placeholder="e.g. Documents are blurry, wrong files uploaded, incomplete submission…"
            className="w-full px-3 py-2 rounded-lg border border-red-200 bg-white text-xs text-gray-800 resize-none outline-none focus:border-red-400 mb-3"
          />
          <div className="flex gap-2 justify-end">
            <button
              onClick={() => { setShowRejectBox(false); setReason(''); }}
              disabled={rejecting}
              className="px-3 py-1.5 rounded-lg border border-gray-200 bg-white text-xs font-semibold text-gray-600 hover:bg-gray-50 transition-all disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleRejectConfirm}
              disabled={rejecting}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition-all disabled:opacity-50"
            >
              {rejecting ? <Loader className="w-3 h-3 animate-spin" /> : <XCircle className="w-3 h-3" />}
              Confirm Reject All
            </button>
          </div>
        </div>
      )}

      <style>{`
        @keyframes fadeSlideIn {
          from { opacity: 0; transform: translateY(-6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
};

// ═════════════════════════════════════════════════════════════════════════════
// ── SUBMITTED DOCS SECTION (inline in pending approval card) ─────────────────
// ═════════════════════════════════════════════════════════════════════════════
const SubmittedDocsSection = ({ empDbId, docsSubmitted, showToast }) => {
  const [docs,      setDocs]      = useState([]);
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState('');
  const [lightbox,  setLightbox]  = useState(null);
  const [accepting, setAccepting] = useState(false);
  const [rejecting, setRejecting] = useState(false);
  const [expanded,  setExpanded]  = useState(true);
  const hasFetched = useRef(false);

  const fetchDocs = useCallback(async () => {
    if (!empDbId) return;
    setLoading(true); setError('');
    try {
      const res  = await fetch(`${BASE_API}/employee-docs/submissions/${empDbId}`);
      const data = await res.json();
      if (data.success) setDocs(data.data || []);
      else setError(data.message || 'Failed to load documents');
    } catch { setError('Cannot connect to server'); }
    finally { setLoading(false); }
  }, [empDbId]);

  useEffect(() => {
    if (docsSubmitted && !hasFetched.current) {
      hasFetched.current = true;
      fetchDocs();
    }
  }, [docsSubmitted, fetchDocs]);

  // ── Accept ALL pending docs ────────────────────────────────────────────────
  const handleAcceptAll = async () => {
    const pending = docs.filter(d => !d.reviewed && d.status !== 'accepted' && d.status !== 'rejected');
    if (pending.length === 0) return;
    setAccepting(true);
    try {
      await Promise.all(
        pending.map(doc =>
          fetch(`${BASE_API}/employee-docs/mark-reviewed/${doc.id}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
          })
        )
      );
      setDocs(p =>
        p.map(d => pending.find(pd => pd.id === d.id)
          ? { ...d, reviewed: true, status: 'accepted' }
          : d
        )
      );
      showToast?.(`All ${pending.length} document${pending.length > 1 ? 's' : ''} accepted`, 'success');
    } catch { showToast?.('Failed to accept all documents', 'error'); }
    finally { setAccepting(false); }
  };

  // ── Reject ALL pending docs with shared reason ────────────────────────────
  const handleRejectAll = async (reason) => {
    const pending = docs.filter(d => !d.reviewed && d.status !== 'accepted' && d.status !== 'rejected');
    if (pending.length === 0) return;
    setRejecting(true);
    try {
      await Promise.all(
        pending.map(doc =>
          fetch(`${BASE_API}/employee-docs/reject-doc/${doc.id}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ rejection_reason: reason }),
          })
        )
      );
      setDocs(p =>
        p.map(d => pending.find(pd => pd.id === d.id)
          ? { ...d, status: 'rejected', rejection_reason: reason }
          : d
        )
      );
      showToast?.(`All ${pending.length} document${pending.length > 1 ? 's' : ''} rejected`, 'success');
    } catch { showToast?.('Failed to reject all documents', 'error'); }
    finally { setRejecting(false); }
  };

  const pending = docs.filter(d => !d.reviewed && d.status !== 'rejected' && d.status !== 'accepted').length;
  const allDone = docs.length > 0 && pending === 0;

  // ── No docs submitted yet — professional empty state ──────────────────────
  if (!docsSubmitted) {
    return (
      <div className="mx-5 mb-4 rounded-xl border border-dashed border-gray-200 bg-gray-50 px-4 py-3 flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-white border border-gray-200 flex items-center justify-center flex-shrink-0 shadow-sm">
          <FolderOpen className="w-4 h-4 text-gray-400" />
        </div>
        <div>
          <p className="text-xs font-semibold text-gray-500">No documents submitted yet</p>
          <p className="text-[10px] text-gray-400 mt-0.5">
            Documents will appear here once the employee uploads them after approval.
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      {lightbox !== null && (
        <DocLightbox docs={docs} startIndex={lightbox} onClose={() => setLightbox(null)} />
      )}

      <div className="mx-5 mb-4">
        {/* Toggle header */}
        <button
          onClick={() => setExpanded(p => !p)}
          className="w-full flex items-center justify-between px-4 py-2.5 rounded-xl border transition-all mb-2"
          style={{
            background: allDone ? 'linear-gradient(90deg,#f0fdf4,#dcfce7)' : pending > 0 ? 'linear-gradient(90deg,#fefce8,#fef9c3)' : '#f8fafc',
            borderColor: allDone ? '#bbf7d0' : pending > 0 ? '#fde68a' : '#e2e8f0',
          }}
        >
          <div className="flex items-center gap-2.5">
            <div className="relative">
              <div className="w-2 h-2 rounded-full" style={{ background: allDone ? '#22c55e' : '#f59e0b' }} />
              {pending > 0 && (
                <div className="absolute inset-0 rounded-full animate-ping" style={{ background: '#f59e0b', opacity: 0.4 }} />
              )}
            </div>
            <span className="text-xs font-bold" style={{ color: allDone ? '#14532d' : '#92400e' }}>
              {allDone ? 'All Documents Reviewed' : `${pending} Document${pending > 1 ? 's' : ''} Pending Review`}
            </span>
            <span
              className="text-[10px] px-2 py-0.5 rounded-full font-semibold"
              style={{ background: allDone ? '#bbf7d0' : '#fde68a', color: allDone ? '#14532d' : '#78350f' }}
            >
              {docs.length} submitted
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={(e) => { e.stopPropagation(); fetchDocs(); }} className="p-1 rounded-md hover:bg-white/60 transition-all">
              <RefreshCw className="w-3.5 h-3.5 text-gray-500" />
            </button>
            {expanded ? <ChevronUp className="w-4 h-4 text-gray-500" /> : <ChevronDown className="w-4 h-4 text-gray-500" />}
          </div>
        </button>

        {expanded && (
          <div className="space-y-2">
            {loading && (
              <div className="flex items-center justify-center py-6">
                <Loader className="w-5 h-5 text-blue-500 animate-spin" />
                <span className="text-xs text-gray-500 ml-2">Loading documents…</span>
              </div>
            )}
            {error && !loading && (
              <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                <AlertCircle className="w-4 h-4 text-red-500" />
                <p className="text-xs text-red-700 flex-1">{error}</p>
                <button onClick={fetchDocs} className="text-xs text-red-600 underline font-medium">Retry</button>
              </div>
            )}

            {/* ── BATCH ACTION BAR at top of list ── */}
            {!loading && !error && docs.length > 0 && (
              <BatchActionBar
                docs={docs}
                onAcceptAll={handleAcceptAll}
                onRejectAll={handleRejectAll}
                accepting={accepting}
                rejecting={rejecting}
              />
            )}

            {/* ── Document rows (view + download only) ── */}
            {!loading && !error && docs.map((doc) => (
              <DocViewRow
                key={doc.id}
                doc={doc}
                onView={(d) => setLightbox(docs.indexOf(d))}
              />
            ))}

            {!loading && !error && docs.length > 0 && allDone && (
              <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-green-50 border border-green-200">
                <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                <p className="text-xs font-semibold text-green-700">
                  All {docs.length} document{docs.length > 1 ? 's' : ''} reviewed — onboarding complete
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
};

// ═════════════════════════════════════════════════════════════════════════════
// ── DOC REVIEW CARD (active employees who submitted docs after approval) ─────
// ═════════════════════════════════════════════════════════════════════════════
const DocReviewCard = ({ emp, onAllReviewed, showToast }) => {
  const [docs,      setDocs]      = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState('');
  const [lightbox,  setLightbox]  = useState(null);
  const [accepting, setAccepting] = useState(false);
  const [rejecting, setRejecting] = useState(false);
  const [expanded,  setExpanded]  = useState(true);

  const fetchDocs = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const res  = await fetch(`${BASE_API}/employee-docs/submissions/${emp.id}`);
      const data = await res.json();
      if (data.success) setDocs(data.data || []);
      else setError(data.message || 'Failed to load');
    } catch { setError('Cannot connect to server'); }
    finally { setLoading(false); }
  }, [emp.id]);

  useEffect(() => { fetchDocs(); }, [fetchDocs]);

  // ── Accept ALL pending ────────────────────────────────────────────────────
  const handleAcceptAll = async () => {
    const pending = docs.filter(d => !d.reviewed && d.status !== 'accepted' && d.status !== 'rejected');
    if (pending.length === 0) return;
    setAccepting(true);
    try {
      await Promise.all(
        pending.map(doc =>
          fetch(`${BASE_API}/employee-docs/mark-reviewed/${doc.id}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
          })
        )
      );
      const updated = docs.map(d =>
        pending.find(pd => pd.id === d.id) ? { ...d, reviewed: true, status: 'accepted' } : d
      );
      setDocs(updated);
      showToast?.(`All ${pending.length} document${pending.length > 1 ? 's' : ''} accepted`, 'success');
      const allNowDone = updated.every(d => d.reviewed || d.status === 'accepted' || d.status === 'rejected');
      if (allNowDone) setTimeout(() => onAllReviewed?.(emp.id), 800);
    } catch { showToast?.('Failed to accept all documents', 'error'); }
    finally { setAccepting(false); }
  };

  // ── Reject ALL pending with shared reason ─────────────────────────────────
  const handleRejectAll = async (reason) => {
    const pending = docs.filter(d => !d.reviewed && d.status !== 'accepted' && d.status !== 'rejected');
    if (pending.length === 0) return;
    setRejecting(true);
    try {
      await Promise.all(
        pending.map(doc =>
          fetch(`${BASE_API}/employee-docs/reject-doc/${doc.id}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ rejection_reason: reason }),
          })
        )
      );
      const updated = docs.map(d =>
        pending.find(pd => pd.id === d.id) ? { ...d, status: 'rejected', rejection_reason: reason } : d
      );
      setDocs(updated);
      showToast?.(`All ${pending.length} document${pending.length > 1 ? 's' : ''} rejected`, 'success');
      const allNowDone = updated.every(d => d.reviewed || d.status === 'accepted' || d.status === 'rejected');
      if (allNowDone) setTimeout(() => onAllReviewed?.(emp.id), 800);
    } catch { showToast?.('Failed to reject all documents', 'error'); }
    finally { setRejecting(false); }
  };

  const pending = docs.filter(d => !d.reviewed && d.status !== 'accepted' && d.status !== 'rejected').length;
  const allDone = docs.length > 0 && pending === 0;

  return (
    <>
      {lightbox !== null && (
        <DocLightbox docs={docs} startIndex={lightbox} onClose={() => setLightbox(null)} />
      )}

      <div className={`bg-white rounded-2xl border shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden ${
        allDone ? 'border-green-200' : 'border-amber-200'
      }`}>
        {/* Accent bar */}
        <div className="h-0.5 w-full" style={{
          background: allDone
            ? 'linear-gradient(90deg,#22c55e,#16a34a)'
            : 'linear-gradient(90deg,#f59e0b,#fbbf24,#fcd34d)',
        }} />

        {/* Header */}
        <div className="px-5 pt-4 pb-3 border-b border-gray-100">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3.5">
              {/* ── Avatar with clean dot indicator (no Bell icon) ── */}
              <div className="relative">
               <Avatar firstName={emp.first_name} lastName={emp.last_name} size="md" />
                <div
                  className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full border-2 border-white"
                  style={{ background: allDone ? '#22c55e' : '#f59e0b' }}
                />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-sm font-bold text-gray-900">{emp.first_name} {emp.last_name}</h3>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border"
                    style={{ background: '#f0fdf4', color: '#16a34a', borderColor: '#bbf7d0' }}>
                    <CheckCircle className="w-2.5 h-2.5" /> Active Employee
                  </span>
                  {!allDone && pending > 0 && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border"
                      style={{ background: '#fffbeb', color: '#92400e', borderColor: '#fcd34d' }}>
                      {pending} Doc{pending > 1 ? 's' : ''} Pending
                    </span>
                  )}
                  {allDone && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border"
                      style={{ background: '#f0fdf4', color: '#15803d', borderColor: '#bbf7d0' }}>
                      <CheckCheck className="w-2.5 h-2.5" /> All Reviewed
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1.5 text-xs text-gray-500 mt-0.5 flex-wrap">
                  <Briefcase className="w-3 h-3" />
                  <span>{emp.position || 'Not specified'}</span>
                  <span className="text-gray-300">•</span>
                  <Building2 className="w-3 h-3" />
                  <span>{emp.department || 'Not specified'}</span>
                  {emp.employee_id && (
                    <><span className="text-gray-300">•</span>
                    <span className="font-mono text-[10px] font-semibold text-blue-600">{emp.employee_id}</span></>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button onClick={fetchDocs}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-gray-200 bg-white text-gray-500 hover:border-blue-300 hover:text-blue-600 transition-all text-xs">
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
              <button onClick={() => setExpanded(p => !p)}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-gray-200 bg-white text-gray-500 hover:border-gray-300 transition-all text-xs">
                {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Info row */}
        <div className="px-5 py-3 border-b border-gray-50">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
            {[
              { icon: <Mail className="w-3.5 h-3.5 text-blue-500" />,     label: 'Email',          value: emp.email },
              { icon: <Phone className="w-3.5 h-3.5 text-blue-500" />,    label: 'Phone',          value: emp.phone },
              { icon: <Calendar className="w-3.5 h-3.5 text-blue-500" />, label: 'Docs Submitted', value: formatDateShort(emp.docs_submitted_at) },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-50 border border-gray-100">
                <div className="w-6 h-6 bg-blue-50 rounded-md flex items-center justify-center flex-shrink-0">{item.icon}</div>
                <div className="min-w-0">
                  <p className="text-[9px] font-medium text-gray-400 uppercase tracking-wide leading-none mb-0.5">{item.label}</p>
                  <p className="text-xs font-semibold text-gray-800 truncate">{item.value || '—'}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Documents */}
        {expanded && (
          <div className="px-5 py-4">
            {loading && (
              <div className="flex items-center justify-center py-8">
                <Loader className="w-5 h-5 text-amber-500 animate-spin" />
                <span className="text-xs text-gray-500 ml-2">Loading submitted documents…</span>
              </div>
            )}
            {error && !loading && (
              <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
                <AlertCircle className="w-4 h-4 text-red-500" />
                <p className="text-xs text-red-700 flex-1">{error}</p>
                <button onClick={fetchDocs} className="text-xs text-red-600 underline font-medium">Retry</button>
              </div>
            )}
            {!loading && !error && docs.length === 0 && (
              <div className="text-center py-6 text-gray-400 text-xs">No documents found</div>
            )}
            {!loading && !error && docs.length > 0 && (
              <div className="space-y-2">
                {/* ── BATCH ACTION BAR ── */}
                <BatchActionBar
                  docs={docs}
                  onAcceptAll={handleAcceptAll}
                  onRejectAll={handleRejectAll}
                  accepting={accepting}
                  rejecting={rejecting}
                />

                {/* ── Doc rows (view + download only) ── */}
                {docs.map((doc) => (
                  <DocViewRow
                    key={doc.id}
                    doc={doc}
                    onView={(d) => setLightbox(docs.indexOf(d))}
                  />
                ))}

                {allDone && (
                  <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-green-50 border border-green-200 mt-1">
                    <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                      <CheckCheck className="w-4 h-4 text-green-600" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-green-800">All documents reviewed</p>
                      <p className="text-[10px] text-green-600 mt-0.5">Onboarding is complete for this employee</p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
};

// ═════════════════════════════════════════════════════════════════════════════
// ── DOCUMENTS PENDING REVIEW SECTION ─────────────────────────────────────────
// ═════════════════════════════════════════════════════════════════════════════
// ✅ FIX: Added `onCountLoaded` prop — calls back with employee count after fetch
const DocumentsPendingReviewSection = ({ showToast, onCountLoaded }) => {
  const [employees, setEmployees] = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState('');
  const [collapsed, setCollapsed] = useState(false);

  const fetchPendingDocs = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const res  = await fetch(`${BASE_API}/employee-docs/pending`);
      const data = await res.json();
      if (data.success) {
        const list = data.data || [];
        setEmployees(list);
        // ✅ FIX: Report the real count up to the parent stats bar
        onCountLoaded?.(list.length);
      } else {
        setError(data.message || 'Failed to load');
        onCountLoaded?.(0);
      }
    } catch {
      setError('Cannot connect to server');
      onCountLoaded?.(0);
    }
    finally { setLoading(false); }
  }, [onCountLoaded]);

  useEffect(() => { fetchPendingDocs(); }, [fetchPendingDocs]);

  const handleAllReviewed = (empId) => {
    setEmployees(prev => {
      const updated = prev.filter(e => e.id !== empId);
      // ✅ FIX: Keep count in sync when an employee's docs are all reviewed
      onCountLoaded?.(updated.length);
      return updated;
    });
  };

  if (!loading && !error && employees.length === 0) return null;

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3" />

      {!collapsed && (
        <>
          <div className="relative mb-5">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-dashed border-amber-200" />
            </div>
            <div className="relative flex justify-center">
              <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest"
                style={{ background: '#fffbeb', color: '#d97706', border: '1px solid #fde68a' }}>
                Signed Documents Received
              </span>
            </div>
          </div>

          {loading && (
            <div className="flex items-center justify-center py-12 bg-white rounded-2xl border border-amber-100">
              <Loader className="w-6 h-6 text-amber-500 animate-spin" />
              <span className="text-sm text-gray-500 ml-3">Loading submitted documents…</span>
            </div>
          )}
          {error && !loading && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
              <p className="text-sm text-red-700 flex-1">{error}</p>
              <button onClick={fetchPendingDocs}
                className="px-3 py-1.5 bg-white border border-red-300 hover:bg-red-50 rounded-lg text-xs font-semibold text-red-600">
                Retry
              </button>
            </div>
          )}
          {!loading && !error && (
            <div className="space-y-4">
              {employees.map(emp => (
                <DocReviewCard key={emp.id} emp={emp} onAllReviewed={handleAllReviewed} showToast={showToast} />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};

// ─── Lightbox for registration form documents ──────────────────────────────────
const Lightbox = ({ docs, startIndex = 0, onClose }) => {
  const [idx, setIdx]           = useState(startIndex);
  const [imgError, setImgError] = useState(false);

  const doc      = docs[idx];
  const url      = fullUrl(doc?.path);
  const fileType = getFileType(doc?.path, doc?.mime_type);

  useEffect(() => { setImgError(false); }, [idx]);
  useEffect(() => {
    const h = (e) => {
      if (e.key === 'Escape')     onClose();
      if (e.key === 'ArrowRight') setIdx(i => Math.min(i + 1, docs.length - 1));
      if (e.key === 'ArrowLeft')  setIdx(i => Math.max(i - 1, 0));
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [docs.length, onClose]);

  if (!url) return null;

  return (
    <div className="fixed inset-0 z-[300] flex flex-col" style={{ background: 'rgba(0,0,0,0.92)' }}>
      <div className="flex items-center justify-between px-6 py-3 flex-shrink-0"
        style={{ background: 'linear-gradient(90deg,#1e3a5f,#1d4ed8)' }}>
        <div className="flex items-center gap-3">
          <FileText className="w-5 h-5 text-white/80" />
          <div>
            <p className="text-white font-semibold text-sm">{doc?.label}</p>
            <p className="text-blue-200 text-xs">{idx + 1} of {docs.length} documents</p>
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
      <div className="flex-1 flex items-center justify-center relative overflow-hidden p-6">
        {idx > 0 && (
          <button onClick={() => setIdx(i => i - 1)}
            className="absolute left-4 z-10 w-11 h-11 bg-white/20 hover:bg-white/40 rounded-full flex items-center justify-center text-white transition-all">
            <ChevronLeft className="w-6 h-6" />
          </button>
        )}
        {fileType === 'pdf' && (
          <iframe src={url} title={doc?.label} className="w-full rounded-xl shadow-2xl bg-white"
            style={{ height: 'calc(100vh - 140px)', maxWidth: '960px' }} />
        )}
        {fileType === 'image' && !imgError && (
          <img src={url} alt={doc?.label}
            className="rounded-xl shadow-2xl object-contain"
            style={{ maxHeight: 'calc(100vh - 140px)', maxWidth: '100%' }}
            onError={() => setImgError(true)} />
        )}
        {(fileType === 'other' || (fileType === 'image' && imgError)) && (
          <div className="text-center text-white space-y-4">
            <div className="w-20 h-20 bg-white/10 rounded-2xl flex items-center justify-center mx-auto">
              <FileText className="w-10 h-10 opacity-60" />
            </div>
            <p className="text-lg font-semibold opacity-80">Preview not available</p>
            <a href={url} download
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-white/15 hover:bg-white/25 rounded-xl text-sm font-semibold transition-all">
              <Download className="w-4 h-4" /> Download
            </a>
          </div>
        )}
        {idx < docs.length - 1 && (
          <button onClick={() => setIdx(i => i + 1)}
            className="absolute right-4 z-10 w-11 h-11 bg-white/20 hover:bg-white/40 rounded-full flex items-center justify-center text-white transition-all">
            <ChevronRight className="w-6 h-6" />
          </button>
        )}
      </div>
    </div>
  );
};

// ─── Full Form Viewer Modal ───────────────────────────────────────────────────
const FullFormViewer = ({ employee, onClose }) => {
  const [lightbox, setLightbox] = useState(null);

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

  const uploadedDocs  = DOC_DEFS.map(def => {
    const found = Array.isArray(employee.documents)
      ? employee.documents.find(d => d.type === def.type || d.document_type === def.type)
      : null;
    return { ...def, path: found?.path || found?.file_path || null };
  });
  const availableDocs = uploadedDocs.filter(d => d.path);
  const openLightbox  = (type) => {
    const idx = availableDocs.findIndex(d => d.type === type);
    if (idx >= 0) setLightbox({ docs: availableDocs, startIndex: idx });
  };

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
      {lightbox && (
        <Lightbox docs={lightbox.docs} startIndex={lightbox.startIndex} onClose={() => setLightbox(null)} />
      )}
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 overflow-y-auto"
        style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}>
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-7xl my-4 flex flex-col" style={{ maxHeight: '95vh' }}>
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 flex-shrink-0"
            style={{ background: 'linear-gradient(90deg,#1e3a5f 0%,#1d4ed8 100%)', borderRadius: '16px 16px 0 0' }}>
            <div className="flex items-center gap-4">
              <Avatar firstName={employee.first_name} lastName={employee.last_name} size="lg" />
              <div>
                <div className="flex items-center gap-2 mb-0.5">
                  <h2 className="text-xl font-bold text-white">{employee.first_name} {employee.last_name}</h2>
                  {employee.status === 'pending_rejoin' && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold"
                      style={{ background: 'rgba(251,191,36,0.25)', color: '#fbbf24', border: '1px solid rgba(251,191,36,0.4)' }}>
                      RETURNING EMPLOYEE
                    </span>
                  )}
                </div>
                <p className="text-blue-200 text-sm">
                  {employee.position || 'Position not specified'} &bull; {employee.department || 'Department not specified'}
                </p>
                <p className="text-blue-300 text-xs mt-1">Applied: {formatDateTime(employee.created_at)}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => printKYEForm(employee)}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-white/15 hover:bg-white/25 text-white rounded-lg text-xs font-semibold transition-all border border-white/20">
                <Printer className="w-3.5 h-3.5" /> Print
              </button>
              <button onClick={onClose}
                className="px-4 py-2 bg-white rounded-lg text-sm font-semibold text-blue-900 hover:bg-blue-50 transition-all">
                Close
              </button>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-6 bg-gray-50">
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              <div className="space-y-5">
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
                <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
                  <SectionTitle num="2" title="Contact Information" icon={<Mail className="w-4 h-4" />} />
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Email Address"   value={employee.email}    span={2} />
                    <Field label="Primary Phone"   value={employee.phone} />
                    <Field label="Alternate Phone" value={employee.alt_phone} />
                  </div>
                </div>
              </div>
              <div className="space-y-5">
                <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
                  <SectionTitle num="3" title="Employment Details" icon={<Briefcase className="w-4 h-4" />} />
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Department"        value={employee.department} />
                    <Field label="Designation"       value={employee.position} />
                    <Field label="Employment Type"   value={employee.employment_type} />
                    <Field label="Joining Date"      value={formatDate(employee.joining_date)} />
                    <Field label="Reporting Manager" value={employee.reporting_manager} />
                  </div>
                </div>
                {availableDocs.length > 0 && (
                  <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
                    <SectionTitle num="4" title="Uploaded Documents" icon={<FileText className="w-4 h-4" />} />
                    <div className="grid grid-cols-2 gap-2">
                      {availableDocs.map((doc, i) => (
                        <button key={i} onClick={() => openLightbox(doc.type)}
                          className="flex items-center gap-2 p-2.5 rounded-lg border border-gray-100 bg-gray-50 hover:border-blue-200 hover:bg-blue-50 transition-all text-left">
                          <div className="w-7 h-7 bg-blue-100 rounded-md flex items-center justify-center flex-shrink-0 text-blue-600">
                            {doc.icon}
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-semibold text-gray-800 truncate">{doc.label}</p>
                            <p className="text-[10px] text-blue-500">Click to view</p>
                          </div>
                        </button>
                      ))}
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

// ─── Reject Modal (for registration rejection) ────────────────────────────────
const RejectModal = ({ employee, onConfirm, onCancel, loading }) => {
  const [reason, setReason] = useState('');
  const isRejoin = employee.status === 'pending_rejoin';
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
          <h3 className="text-xl font-bold text-gray-900 text-center mb-1">
            {isRejoin ? 'Decline Rejoin Request' : 'Reject Registration'}
          </h3>
          <p className="text-gray-500 text-sm text-center mb-6">
            {isRejoin ? 'Declining' : 'Rejecting'}{' '}
            <strong className="text-gray-900">{employee.first_name} {employee.last_name}</strong>
          </p>
          <label className="block text-xs font-semibold text-gray-700 mb-2 uppercase tracking-wide">
            Reason for {isRejoin ? 'Declining' : 'Rejection'}
          </label>
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
              {loading ? 'Processing...' : isRejoin ? 'Confirm Decline' : 'Confirm Reject'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── Employee Card ────────────────────────────────────────────────────────────
const EmployeeCard = ({ employee, onApprove, onReject, approving, rejecting, showToast }) => {
  const [showFullForm, setShowFullForm] = useState(false);
  const isRejoin      = employee.status === 'pending_rejoin';
  const docsSubmitted = !!(employee.docs_submitted);

  return (
    <>
      {showFullForm && <FullFormViewer employee={employee} onClose={() => setShowFullForm(false)} />}

      <div className={`bg-white rounded-2xl border shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden ${
        isRejoin ? 'border-indigo-200' : docsSubmitted ? 'border-amber-200' : 'border-gray-200'
      }`}>
        <div className="h-0.5 w-full" style={{
          background: isRejoin
            ? 'linear-gradient(90deg,#4f46e5,#7c3aed,#a78bfa)'
            : docsSubmitted
            ? 'linear-gradient(90deg,#f59e0b,#fbbf24,#fcd34d)'
            : 'linear-gradient(90deg,#1d4ed8,#3b82f6,#60a5fa)',
        }} />

        <div className="px-5 pt-4 pb-3.5 border-b border-gray-100">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3.5">
              <div className="relative">
                <Avatar firstName={employee.first_name} lastName={employee.last_name} size="md" />
                {isRejoin && (
                  <div className="absolute -top-1 -right-1 w-4 h-4 bg-amber-400 rounded-full flex items-center justify-center border-2 border-white">
                    <History className="w-2 h-2 text-white" style={{ strokeWidth: 3 }} />
                  </div>
                )}
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-sm font-bold text-gray-900">{employee.first_name} {employee.last_name}</h3>
                  {isRejoin && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border"
                      style={{ background: '#ede9fe', color: '#6d28d9', borderColor: '#c4b5fd' }}>
                      <History className="w-2.5 h-2.5" /> Rejoin
                    </span>
                  )}
                  {docsSubmitted && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border"
                      style={{ background: '#fffbeb', color: '#92400e', borderColor: '#fcd34d' }}>
                      <Upload className="w-2.5 h-2.5" /> Docs Uploaded
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1.5 text-xs text-gray-500 mt-0.5 flex-wrap">
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
                style={{
                  background: isRejoin
                    ? 'linear-gradient(135deg,#4f46e5,#7c3aed)'
                    : 'linear-gradient(135deg,#16a34a,#22c55e)',
                  boxShadow: isRejoin
                    ? '0 1px 6px rgba(124,58,237,0.35)'
                    : '0 1px 6px rgba(34,197,94,0.35)',
                }}>
                {approving
                  ? <><Loader className="w-3.5 h-3.5 animate-spin" /><span>Approving…</span></>
                  : isRejoin
                  ? <><CheckCircle className="w-3.5 h-3.5" /><span>Approve Rejoin</span></>
                  : <><CheckCircle className="w-3.5 h-3.5" /><span>Approve</span></>}
              </button>
              <button onClick={onReject} disabled={approving || rejecting}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-red-200 bg-white text-red-500 hover:bg-red-50 hover:border-red-400 text-xs font-medium disabled:opacity-50">
                <XCircle className="w-3.5 h-3.5" /> {isRejoin ? 'Decline' : 'Reject'}
              </button>
            </div>
          </div>
        </div>

        <div className="px-5 pt-4 pb-3">
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
              <span>{isRejoin ? 'Requested:' : 'Applied:'}</span>
              <span className="font-semibold text-gray-700">{formatDateTime(employee.created_at)}</span>
            </div>
            {employee.employment_type && (
              <span className="px-2 py-0.5 text-[11px] font-semibold rounded-full bg-blue-100 text-blue-800">
                {employee.employment_type}
              </span>
            )}
          </div>
        </div>

        <div className="border-t border-gray-100 pt-3">
          <SubmittedDocsSection empDbId={employee.id} docsSubmitted={docsSubmitted} showToast={showToast} />
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
  // ✅ FIX: Track doc-pending count separately from registration pending count
  const [docPendingCount, setDocPendingCount] = useState(0);

  const fetchPending = useCallback(async () => {
    try {
      setLoading(true); setError('');
      const res  = await employeeService.getPendingSubmissions();
      const list = (res.data || []).filter(e => e.status === 'pending' || e.status === 'pending_rejoin');
      setPendingList(list);
    } catch (err) {
      setError(
        err.message?.includes('connect') || err.message?.includes('fetch')
          ? 'Cannot connect to server. Please ensure the backend is running on port 5000.'
          : err.message || 'Failed to load pending submissions'
      );
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchPending(); }, [fetchPending]);

  const handleApprove = async (employee) => {
    setActionLoading(p => ({ ...p, [`approve_${employee.id}`]: true }));
    try {
      const res = await employeeService.approveSubmission(employee.id);
      if (res.success) {
        const empId = res.data?.employee_id || res.data?.employeeId || res.employeeId || '';
        showToast?.(`✅ Approved: ${employee.first_name} ${employee.last_name} — ID: ${empId}`, 'success');
        setPendingList(p => p.filter(e => e.id !== employee.id));
        onEmployeeApproved?.();
      }
    } catch (err) { showToast?.(err.message || 'Failed to approve', 'error'); }
    finally { setActionLoading(p => ({ ...p, [`approve_${employee.id}`]: false })); }
  };

  const handleRejectConfirm = async (reason) => {
    if (!rejectTarget) return;
    const { id, status } = rejectTarget;
    const isRejoin = status === 'pending_rejoin';
    setActionLoading(p => ({ ...p, [`reject_${id}`]: true }));
    try {
      if (isRejoin) {
        const res  = await fetch(`${BASE_API}/registrations/${id}/reject-rejoin`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ rejection_reason: reason }),
        });
        const data = await res.json();
        if (!data.success) throw new Error(data.message || 'Failed to decline');
      } else {
        await employeeService.rejectSubmission(id, reason);
      }
      showToast?.(
        isRejoin
          ? `↩️ Rejoin declined: ${rejectTarget.first_name} ${rejectTarget.last_name}`
          : `❌ Rejected: ${rejectTarget.first_name} ${rejectTarget.last_name}`,
        'success'
      );
      setPendingList(p => p.filter(e => e.id !== id));
      setRejectTarget(null);
    } catch (err) { showToast?.(err.message || 'Failed to process', 'error'); }
    finally { setActionLoading(p => ({ ...p, [`reject_${id}`]: false })); }
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

  const newCount    = pendingList.filter(e => e.status === 'pending').length;
  const rejoinCount = pendingList.filter(e => e.status === 'pending_rejoin').length;
  // ✅ FIX: Use docPendingCount (from DocumentsPendingReviewSection) instead of
  //         pendingList.filter(e => e.docs_submitted).length which was wrong
  const totalPending = pendingList.length + docPendingCount;

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

      {/* Page Header */}
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
              {(pendingList.length > 0 || docPendingCount > 0)
                ? <>
                    {pendingList.length > 0 && (
                      <><strong className="text-blue-700">{pendingList.length}</strong>{' '}
                      registration {pendingList.length === 1 ? 'request' : 'requests'} awaiting review</>
                    )}
                    {pendingList.length > 0 && docPendingCount > 0 && <span className="mx-1">·</span>}
                    {docPendingCount > 0 && (
                      <><strong className="text-amber-600">{docPendingCount}</strong>{' '}
                      {docPendingCount === 1 ? 'employee' : 'employees'} with docs pending review</>
                    )}
                    {rejoinCount > 0 && (
                      <span className="ml-2 text-indigo-600 font-medium">
                        ({rejoinCount} rejoin{rejoinCount > 1 ? 's' : ''})
                      </span>
                    )}
                  </>
                : 'No pending requests at the moment'}
            </p>
          </div>
          <button onClick={fetchPending}
            className="flex items-center gap-2 px-3.5 py-2 bg-white border border-gray-200 rounded-xl text-xs font-semibold text-gray-600 hover:border-blue-300 hover:text-blue-700 hover:bg-blue-50 transition-all shadow-sm">
            <RefreshCw className="w-3.5 h-3.5" /> Refresh
          </button>
        </div>

        {/* ✅ FIX: Stats bar now shows correct counts for both sections */}
        {(pendingList.length > 0 || docPendingCount > 0) && (
          <div className="mt-5 grid grid-cols-2 md:grid-cols-5 gap-3">
            {[
              {
                label: 'Total Pending',
                // ✅ Registration pending + doc review pending combined
                value: totalPending,
                color: '#1d4ed8', bg: '#eff6ff',
              },
              {
                label: 'New Applications',
                value: newCount,
                color: '#059669', bg: '#f0fdf4',
              },
              {
                label: 'Rejoin Requests',
                value: rejoinCount,
                color: '#7c3aed', bg: '#f5f3ff',
              },
              {
                label: 'Docs Pending Review',
                // ✅ FIX: Now correctly shows employees with pending doc reviews
                //         from DocumentsPendingReviewSection, not from pendingList
                value: docPendingCount,
                color: '#d97706', bg: '#fffbeb',
              },
              {
                label: 'Latest Request',
                value: formatDateShort(pendingList[0]?.created_at),
                color: '#64748b', bg: '#f8fafc',
              },
            ].map((stat, i) => (
              <div key={i} className="rounded-xl border px-4 py-3 shadow-sm"
                style={{ background: stat.bg, borderColor: stat.bg === '#f8fafc' ? '#e2e8f0' : 'transparent' }}>
                <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide mb-1">{stat.label}</p>
                <p className="text-lg font-bold" style={{ color: stat.color }}>{stat.value ?? '—'}</p>
              </div>
            ))}
          </div>
        )}
      </div>

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

      {/* ✅ FIX: Pass onCountLoaded callback so doc count flows up to stats bar */}
      <DocumentsPendingReviewSection
        showToast={showToast}
        onCountLoaded={setDocPendingCount}
      />

      {/* Empty state */}
      {!error && pendingList.length === 0 && docPendingCount === 0 && (
        <div className="bg-white border border-gray-200 rounded-2xl p-16 text-center shadow-sm">
          <div className="w-20 h-20 mx-auto mb-5 rounded-2xl flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg,#dbeafe,#bfdbfe)' }}>
            <CheckCircle className="w-10 h-10 text-blue-600" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">All Caught Up!</h3>
          <p className="text-gray-500 text-sm max-w-xs mx-auto">
            No pending registration, rejoin, or document review requests at the moment.
          </p>
        </div>
      )}

      {pendingList.length > 0 && (
        <>
          <div className="relative mb-5">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-dashed border-blue-200" />
            </div>
            <div className="relative flex justify-center">
              <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest"
                style={{ background: '#eff6ff', color: '#1d4ed8', border: '1px solid #bfdbfe' }}>
                Registration Approvals
              </span>
            </div>
          </div>
          <div className="space-y-4">
            {pendingList.map((emp) => (
              <EmployeeCard
                key={emp.id}
                employee={emp}
                onApprove={() => handleApprove(emp)}
                onReject={() => setRejectTarget(emp)}
                approving={!!actionLoading[`approve_${emp.id}`]}
                rejecting={!!actionLoading[`reject_${emp.id}`]}
                showToast={showToast}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default PendingApprovals;