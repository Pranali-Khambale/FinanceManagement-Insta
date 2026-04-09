// ─────────────────────────────────────────────────────────────────────────────
// FILE: src/Ui/AdvancePayment/GenerateLinkModal.jsx
// ─────────────────────────────────────────────────────────────────────────────
import { useState } from "react";
import {
  X,
  Link2,
  Mail,
  Send,
  CheckCircle2,
  Copy,
  RefreshCw,
  ExternalLink,
} from "lucide-react";

// ── Helpers ──────────────────────────────────────────────────────────────────

/** Generates a short random token (8 chars, uppercase) */
function generateToken() {
  return Math.random().toString(36).slice(2, 10).toUpperCase();
}

/** Builds a hash-based URL that lands on AdvanceRequestForm */
function buildLink(token) {
  return `${window.location.origin}${window.location.pathname}#/advance-request/${token}`;
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function GenerateLinkModal({ onClose }) {
  const [email,     setEmail]     = useState("");
  const [generated, setGenerated] = useState(null);   // full URL string
  const [token,     setToken]     = useState(null);   // bare token
  const [sent,      setSent]      = useState(false);
  const [loading,   setLoading]   = useState(false);
  const [emailErr,  setEmailErr]  = useState("");
  const [copied,    setCopied]    = useState(false);

  const validateEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);

  /* ── Generate ── */
  const handleGenerate = () => {
    if (email && !validateEmail(email)) {
      setEmailErr("Please enter a valid email address");
      return;
    }
    setEmailErr("");
    setLoading(true);
    setTimeout(() => {
      const t = generateToken();
      setToken(t);
      setGenerated(buildLink(t));
      setLoading(false);
    }, 800);
  };

  /* ── Send email ── */
  const handleSend = () => {
    if (!email || !validateEmail(email)) {
      setEmailErr("Please enter a valid email to send the link");
      return;
    }
    setEmailErr("");
    setLoading(true);
    // TODO: call your API here with `generated` + `email`
    setTimeout(() => {
      setSent(true);
      setLoading(false);
    }, 700);
  };

  /* ── Copy ── */
  const handleCopy = () => {
    navigator.clipboard?.writeText(generated);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  /* ── Open form in the same app (hash navigation) ── */
  const handleOpen = () => {
    window.location.hash = `/advance-request/${token}`;
    onClose();
  };

  /* ── Reset / New ── */
  const handleReset = () => {
    setGenerated(null);
    setToken(null);
    setSent(false);
    setCopied(false);
  };

  /* ── Email field change ── */
  const handleEmailChange = (e) => {
    setEmail(e.target.value);
    setEmailErr("");
    setSent(false);
    setGenerated(null);
    setToken(null);
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">

        {/* ── Header ── */}
        <div className="bg-gradient-to-r from-blue-700 to-indigo-700 px-6 py-5 flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center">
              <Link2 size={18} className="text-white" />
            </div>
            <div>
              <h3 className="text-white font-bold text-base">
                Generate Payment Request Link
              </h3>
              <p className="text-blue-200 text-xs mt-0.5">
                Create a one-time advance payment request link
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white/70 hover:text-white transition-colors p-1"
          >
            <X size={18} />
          </button>
        </div>

        {/* ── Body ── */}
        <div className="p-6 space-y-5">

          {/* Email field */}
          <div>
            <label className="text-sm font-semibold text-slate-700 mb-1.5 block">
              Employee Email{" "}
              <span className="text-slate-400 font-normal">(Optional)</span>
            </label>
            <div
              className={`flex items-center gap-2.5 border rounded-xl px-3 py-2.5 bg-white transition-colors ${
                emailErr
                  ? "border-red-400 ring-1 ring-red-300"
                  : "border-blue-400 ring-1 ring-blue-200"
              }`}
            >
              <Mail size={16} className="text-slate-400 shrink-0" />
              <input
                type="email"
                placeholder="employee@example.com"
                value={email}
                onChange={handleEmailChange}
                className="flex-1 text-sm text-slate-700 placeholder-slate-400 outline-none bg-transparent"
              />
            </div>
            {emailErr && (
              <p className="text-xs text-red-500 mt-1">{emailErr}</p>
            )}
          </div>

          {/* Note box */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3">
            <p className="text-sm text-blue-800">
              <span className="font-bold">Note:</span>{" "}
              Expires in 7 days · One-time use · Requires admin approval
            </p>
          </div>

          {/* Generated link display */}
          {generated && (
            <div className="space-y-2">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                Generated Link
              </p>
              <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5">
                <p className="flex-1 text-xs text-indigo-700 font-mono truncate">
                  {generated}
                </p>

                {/* Copy with feedback */}
                <button
                  onClick={handleCopy}
                  className={`flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg font-semibold transition-colors shrink-0 ${
                    copied
                      ? "bg-emerald-100 text-emerald-700"
                      : "bg-indigo-100 text-indigo-700 hover:bg-indigo-200"
                  }`}
                >
                  {copied ? <CheckCircle2 size={11} /> : <Copy size={11} />}
                  {copied ? "Copied!" : "Copy"}
                </button>

                {/* Open form in app */}
                <button
                  onClick={handleOpen}
                  className="flex items-center gap-1 text-xs bg-blue-600 text-white px-2.5 py-1 rounded-lg font-semibold hover:bg-blue-700 transition-colors shrink-0"
                >
                  <ExternalLink size={11} />
                  Open
                </button>
              </div>
            </div>
          )}

          {/* Sent success */}
          {sent && (
            <div className="flex items-center gap-2.5 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3">
              <CheckCircle2 size={18} className="text-emerald-600 shrink-0" />
              <p className="text-sm text-emerald-800 font-medium">
                Link sent successfully to{" "}
                <span className="font-bold">{email}</span>
              </p>
            </div>
          )}
        </div>

        {/* ── Footer ── */}
        <div className="px-6 pb-6 flex items-center gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-sm font-semibold hover:bg-slate-50 transition-colors"
          >
            Cancel
          </button>

          {/* Generate Link */}
          {!generated && (
            <button
              onClick={handleGenerate}
              disabled={loading}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-sm font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all disabled:opacity-60"
            >
              <Link2 size={15} />
              {loading ? "Generating…" : "Generate Link"}
            </button>
          )}

          {/* Send via email (shows after link generated + email present + not yet sent) */}
          {generated && email && !sent && (
            <button
              onClick={handleSend}
              disabled={loading}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-sm font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all disabled:opacity-60"
            >
              <Send size={15} />
              {loading ? "Sending…" : "Send Link"}
            </button>
          )}

          {/* Re-generate / New */}
          {generated && (
            <button
              onClick={handleReset}
              className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl border border-slate-200 text-slate-500 text-sm font-medium hover:bg-slate-50 transition-colors"
            >
              <RefreshCw size={13} />
              New
            </button>
          )}
        </div>
      </div>
    </div>
  );
}