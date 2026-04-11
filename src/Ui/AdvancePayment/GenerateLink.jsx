// ─────────────────────────────────────────────────────────────────────────────
// FILE: src/Ui/AdvancePayment/GenerateLink.jsx
// Two-step modal: Step 1 → configure type + email | Step 2 → generated link
// ─────────────────────────────────────────────────────────────────────────────
import { useState, useEffect } from "react";
import {
  X, Link2, Mail, Send, Copy, RefreshCw,
  ExternalLink, CheckCircle2, AlertCircle,
  Users, Globe, Loader2, Clock, Building2,
} from "lucide-react";
import advancePaymentService from "../../services/advancePaymentService";

function validateEmail(v) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
}

function buildLink(paymentTypeKey, token) {
  return `${window.location.origin}/advance-request/${paymentTypeKey}/${token}`;
}

// ── Payment-type icon ─────────────────────────────────────────────────────────
function TypeIcon({ ptKey, size = 16, color = "currentColor" }) {
  if (ptKey === "emp_to_emp") return <Users size={size} color={color} />;
  if (ptKey === "other")      return <Globe size={size} color={color} />;
  return <Building2 size={size} color={color} />;
}

// ── Step tab button ───────────────────────────────────────────────────────────
function StepTab({ num, label, active }) {
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 5,
      padding: "6px 12px", borderRadius: 99,
      background: active ? "#dbeafe" : "#f1f5f9",
      color:      active ? "#1d4ed8" : "#94a3b8",
      fontSize: 12, fontWeight: 600,
      transition: "all 0.2s",
    }}>
      <span style={{
        width: 16, height: 16, borderRadius: "50%",
        fontSize: 9, fontWeight: 700,
        display: "flex", alignItems: "center", justifyContent: "center",
        background: active ? "#2563eb" : "#e2e8f0",
        color:      active ? "#fff"    : "#94a3b8",
        flexShrink: 0,
      }}>
        {num}
      </span>
      {label}
    </div>
  );
}

// ── Shared primitive styles ───────────────────────────────────────────────────
const S = {
  overlay: {
    position: "fixed", inset: 0, zIndex: 9999,
    display: "flex", alignItems: "center", justifyContent: "center",
    background: "rgba(10,15,30,0.5)",
    backdropFilter: "blur(6px)",
    padding: 16,
  },
  modal: {
    background: "#fff",
    borderRadius: 18,
    width: "100%", maxWidth: 460,
    boxShadow: "0 24px 64px rgba(10,15,30,0.18), 0 0 0 1px rgba(0,0,0,0.06)",
    display: "flex", flexDirection: "column",
    overflow: "hidden",
  },
  header: {
    padding: "18px 20px 14px",
    borderBottom: "1px solid #f1f5f9",
  },
  body: {
    padding: "18px 20px",
    display: "flex", flexDirection: "column", gap: 14,
  },
  footer: {
    padding: "12px 20px 16px",
    borderTop: "1px solid #f1f5f9",
    background: "#fafbfc",
    display: "flex", gap: 8, alignItems: "center",
  },
  label: {
    display: "block",
    fontSize: 11, fontWeight: 700, color: "#94a3b8",
    textTransform: "uppercase", letterSpacing: "0.07em",
    marginBottom: 8,
  },
  iconClose: {
    border: "none", background: "none", cursor: "pointer",
    color: "#94a3b8", padding: "2px 4px", lineHeight: 1, fontSize: 18,
  },
};

const btnPrimary = (disabled) => ({
  flex: 1,
  display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
  padding: "10px 16px", borderRadius: 9, border: "none",
  background: disabled ? "#cbd5e1" : "#2563eb",
  color: disabled ? "#94a3b8" : "#fff",
  fontSize: 13, fontWeight: 700,
  cursor: disabled ? "not-allowed" : "pointer",
  boxShadow: disabled ? "none" : "0 4px 14px rgba(37,99,235,0.3)",
  whiteSpace: "nowrap",
});

const btnOutline = {
  display: "flex", alignItems: "center", gap: 6,
  padding: "10px 14px", borderRadius: 9,
  border: "1.5px solid #e2e8f0", background: "#fff",
  color: "#475569", fontSize: 13, fontWeight: 600,
  cursor: "pointer", whiteSpace: "nowrap",
};

// ─────────────────────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────────────────────
export default function GenerateLinkModal({ onClose }) {
  const [paymentTypes, setPaymentTypes] = useState([]);
  const [typesLoading, setTypesLoading] = useState(true);
  const [ptKey,        setPtKey]        = useState("");
  const [email,        setEmail]        = useState("");
  const [emailErr,     setEmailErr]     = useState("");

  // Step 2 state
  const [step,         setStep]         = useState(1); // 1 = config, 2 = link
  const [generated,    setGenerated]    = useState(null);
  const [generating,   setGenerating]   = useState(false);
  const [copied,       setCopied]       = useState(false);
  const [sent,         setSent]         = useState(false);
  const [sending,      setSending]      = useState(false);

  useEffect(() => {
    advancePaymentService.getPaymentTypes()
      .then(res => {
        const all = res.data || [];
        setPaymentTypes(all);
        if (all.length) setPtKey(all[0].key);
      })
      .catch(err => console.error("getPaymentTypes:", err.message))
      .finally(() => setTypesLoading(false));
  }, []);

  const pt = paymentTypes.find(p => p.key === ptKey) || {};

  // ── Generate ──────────────────────────────────────────────────────────────
  const handleGenerate = async () => {
    if (email && !validateEmail(email)) {
      setEmailErr("Enter a valid email address");
      return;
    }
    setEmailErr("");
    setGenerating(true);
    try {
      const res = await advancePaymentService.createLink({
        payment_type_key: ptKey,
        employee_email:   email || null,
        expires_in_days:  7,
      });
      const token    = res.data?.token;
      const retPtKey = res.data?.payment_type_key || ptKey;
      const expires  = res.data?.expires_at;
      if (!token) throw new Error("No token returned");
      setGenerated({ link: buildLink(retPtKey, token), token, expires_at: expires, ptKey: retPtKey });
      setStep(2);
    } catch (err) {
      alert(err.message || "Failed to generate link");
    } finally {
      setGenerating(false);
    }
  };

  // ── Copy ──────────────────────────────────────────────────────────────────
  const handleCopy = () => {
    if (generated?.link) {
      navigator.clipboard?.writeText(generated.link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    }
  };

  // ── Email send ────────────────────────────────────────────────────────────
  const handleSend = async () => {
    if (!email || !validateEmail(email)) {
      setEmailErr("Enter a valid email to send the link");
      return;
    }
    setSending(true);
    try {
      await new Promise(r => setTimeout(r, 700)); // replace with real API call
      setSent(true);
    } finally {
      setSending(false);
    }
  };

  // ── Reset to step 1 ───────────────────────────────────────────────────────
  const handleReset = () => {
    setStep(1);
    setGenerated(null);
    setCopied(false);
    setSent(false);
    setEmailErr("");
  };

  // ── Format expiry ─────────────────────────────────────────────────────────
  const expiryLabel = generated?.expires_at
    ? new Date(generated.expires_at).toLocaleDateString("en-IN", {
        day: "2-digit", month: "short", year: "numeric",
      })
    : null;

  return (
    <>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeUp { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:translateY(0); } }
        .gl-type-card:hover { border-color: #93c5fd !important; background: #eff6ff !important; }
        .gl-chip:hover { background: #f8fafc !important; }
        .gl-outline-hover:hover { background: #f8fafc !important; }
      `}</style>

      <div style={S.overlay} onClick={e => e.target === e.currentTarget && onClose()}>
        <div style={S.modal}>

          {/* ── Header ── */}
          <div style={S.header}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <p style={{ margin: 0, fontSize: 15, fontWeight: 700, color: "#1e293b" }}>
                  Generate payment link
                </p>
                <p style={{ margin: "3px 0 0", fontSize: 12, color: "#94a3b8" }}>
                  Employee fills a one-time form → request goes to Pending
                </p>
              </div>
              <button onClick={onClose} style={S.iconClose}>×</button>
            </div>

            {/* Step tabs */}
            <div style={{ display: "flex", gap: 6, marginTop: 14 }}>
              <StepTab num={1} label="Configure" active={step === 1} />
              <StepTab num={2} label="Share link" active={step === 2} />
            </div>
          </div>

          {/* ── Step 1: Configure ── */}
          {step === 1 && (
            <div style={S.body}>

              {/* Payment type grid */}
              <div>
                <span style={S.label}>Payment type</span>
                {typesLoading ? (
                  <div style={{ display: "flex", alignItems: "center", gap: 8, color: "#94a3b8", fontSize: 13, padding: "12px 0" }}>
                    <Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} /> Loading types…
                  </div>
                ) : paymentTypes.length === 0 ? (
                  <div style={{ padding: "12px 14px", borderRadius: 10, background: "#fef2f2", border: "1px solid #fecaca", fontSize: 13, color: "#b91c1c" }}>
                    No payment types found.
                  </div>
                ) : (
                  <div style={{ display: "grid", gridTemplateColumns: `repeat(${Math.min(paymentTypes.length, 3)}, 1fr)`, gap: 8 }}>
                    {paymentTypes.map(p => {
                      const sel = ptKey === p.key;
                      const c   = p.color || "#2563eb";
                      return (
                        <button
                          key={p.key}
                          className="gl-type-card"
                          onClick={() => { setPtKey(p.key); }}
                          style={{
                            position: "relative",
                            display: "flex", flexDirection: "column",
                            alignItems: "center", gap: 7,
                            padding: "14px 8px 11px",
                            borderRadius: 11, cursor: "pointer",
                            border: `${sel ? "2px" : "1.5px"} solid ${sel ? c : "#e2e8f0"}`,
                            background: sel ? `${c}0f` : "#fafafa",
                            transition: "all 0.15s",
                            boxShadow: sel ? `0 0 0 3px ${c}18` : "none",
                          }}
                        >
                          {sel && (
                            <span style={{
                              position: "absolute", top: 6, right: 6,
                              width: 14, height: 14, borderRadius: "50%",
                              background: c, display: "flex", alignItems: "center", justifyContent: "center",
                            }}>
                              <svg width="7" height="7" viewBox="0 0 10 10" fill="none">
                                <path d="M2 5l2 2 4-4" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                              </svg>
                            </span>
                          )}
                          <div style={{
                            width: 34, height: 34, borderRadius: 9,
                            background: sel ? c : "#eef1f6",
                            display: "flex", alignItems: "center", justifyContent: "center",
                          }}>
                            <TypeIcon ptKey={p.key} size={16} color={sel ? "#fff" : "#7c8fa6"} />
                          </div>
                          <span style={{ fontSize: 11, fontWeight: 700, color: sel ? c : "#64748b", textAlign: "center", lineHeight: 1.3 }}>
                            {p.short_label}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Description strip */}
              {pt.key && (
                <div style={{
                  display: "flex", alignItems: "flex-start", gap: 9,
                  padding: "10px 12px", borderRadius: 9,
                  background: "#f8fafc", border: "1px solid #f1f5f9",
                  animation: "fadeUp 0.2s ease",
                }}>
                  <TypeIcon ptKey={pt.key} size={14} color="#64748b" />
                  <p style={{ margin: 0, fontSize: 12, color: "#64748b", lineHeight: 1.6 }}>
                    <strong style={{ color: "#334155" }}>{pt.short_label}</strong>
                    {pt.description ? ` — ${pt.description}` : ""}
                  </p>
                </div>
              )}

              {/* Email input */}
              <div>
                <span style={S.label}>
                  Employee email
                  <span style={{ textTransform: "none", fontWeight: 400, letterSpacing: 0, color: "#cbd5e1", marginLeft: 6 }}>
                    optional
                  </span>
                </span>
                <div style={{
                  display: "flex", alignItems: "center", gap: 8,
                  padding: "9px 12px", borderRadius: 9,
                  border: `1.5px solid ${emailErr ? "#fca5a5" : "#e2e8f0"}`,
                  background: "#fff",
                }}>
                  <Mail size={13} color="#94a3b8" style={{ flexShrink: 0 }} />
                  <input
                    type="email"
                    placeholder="employee@company.com"
                    value={email}
                    onChange={e => { setEmail(e.target.value); setEmailErr(""); }}
                    style={{ flex: 1, border: "none", outline: "none", fontSize: 13, color: "#1e293b", background: "transparent", fontFamily: "inherit" }}
                  />
                  {email && validateEmail(email) && <CheckCircle2 size={13} color="#22c55e" />}
                </div>
                {emailErr && (
                  <div style={{ display: "flex", alignItems: "center", gap: 5, marginTop: 5, fontSize: 11, color: "#ef4444" }}>
                    <AlertCircle size={11} /> {emailErr}
                  </div>
                )}
              </div>

              {/* Info strip */}
              <div style={{
                display: "flex", alignItems: "flex-start", gap: 8,
                padding: "10px 12px", borderRadius: 9,
                background: "#f8fafc", border: "1px solid #f1f5f9",
              }}>
                <Clock size={13} color="#94a3b8" style={{ flexShrink: 0, marginTop: 1 }} />
                <p style={{ margin: 0, fontSize: 12, color: "#64748b", lineHeight: 1.65 }}>
                  Expires in <strong style={{ color: "#334155" }}>7 days</strong> · One-time use ·
                  Submission appears in <strong style={{ color: "#334155" }}>Pending</strong> tab
                </p>
              </div>

            </div>
          )}

          {/* ── Step 2: Link ready ── */}
          {step === 2 && generated && (
            <div style={{ ...S.body, animation: "fadeUp 0.22s ease" }}>

              {/* Status card */}
              <div style={{
                display: "flex", alignItems: "center", gap: 10,
                padding: "12px 14px", borderRadius: 10,
                background: "#f0fdf4", border: "1.5px solid #86efac",
              }}>
                <div style={{
                  width: 34, height: 34, borderRadius: 9, flexShrink: 0,
                  background: "#dcfce7", display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <Link2 size={16} color="#16a34a" />
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: "#15803d" }}>Link generated</p>
                  <p style={{ margin: "2px 0 0", fontSize: 11, color: "#16a34a" }}>
                    {pt.short_label || generated.ptKey}
                    {expiryLabel ? ` · Expires ${expiryLabel}` : ""}
                  </p>
                </div>
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#22c55e", flexShrink: 0 }} />
              </div>

              {/* Link URL */}
              <div>
                <span style={S.label}>Shareable link</span>
                <div style={{
                  padding: "10px 12px", borderRadius: 9,
                  background: "#f8fafc", border: "1px solid #e2e8f0",
                  fontFamily: "'ui-monospace', 'Cascadia Code', monospace",
                  fontSize: 11, color: "#475569",
                  wordBreak: "break-all", lineHeight: 1.75,
                }}>
                  {generated.link}
                </div>
              </div>

              {/* Action chips */}
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <button
                  className="gl-chip"
                  onClick={handleCopy}
                  style={{
                    display: "flex", alignItems: "center", gap: 5,
                    padding: "7px 13px", borderRadius: 7, border: "none",
                    background: copied ? "#dcfce7" : "#eef2ff",
                    color:      copied ? "#15803d" : "#4338ca",
                    fontSize: 12, fontWeight: 600, cursor: "pointer",
                    transition: "all 0.15s",
                  }}>
                  {copied ? <><CheckCircle2 size={12} /> Copied!</> : <><Copy size={12} /> Copy link</>}
                </button>

                <a
                  href={generated.link}
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    display: "flex", alignItems: "center", gap: 5,
                    padding: "7px 13px", borderRadius: 7,
                    background: "#1e293b", color: "#f1f5f9",
                    fontSize: 12, fontWeight: 600, textDecoration: "none",
                  }}>
                  <ExternalLink size={12} /> Preview form
                </a>

                {email && validateEmail(email) && !sent && (
                  <button
                    onClick={handleSend}
                    disabled={sending}
                    style={{
                      display: "flex", alignItems: "center", gap: 5,
                      padding: "7px 13px", borderRadius: 7, border: "none",
                      background: "#f0fdf4", color: "#15803d",
                      fontSize: 12, fontWeight: 600, cursor: sending ? "not-allowed" : "pointer",
                    }}>
                    {sending
                      ? <><Loader2 size={12} style={{ animation: "spin 1s linear infinite" }} /> Sending…</>
                      : <><Send size={12} /> Email to employee</>
                    }
                  </button>
                )}
              </div>

              {/* Sent confirmation */}
              {sent && (
                <div style={{
                  display: "flex", alignItems: "center", gap: 10,
                  padding: "11px 14px", borderRadius: 10,
                  background: "#f0fdf4", border: "1.5px solid #86efac",
                  animation: "fadeUp 0.2s ease",
                }}>
                  <CheckCircle2 size={18} color="#16a34a" style={{ flexShrink: 0 }} />
                  <div>
                    <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: "#15803d" }}>Email sent!</p>
                    <p style={{ margin: 0, fontSize: 12, color: "#16a34a", marginTop: 1 }}>
                      Delivered to <strong>{email}</strong>
                    </p>
                  </div>
                </div>
              )}

            </div>
          )}

          {/* ── Footer ── */}
          <div style={S.footer}>
            <button onClick={onClose} className="gl-outline-hover" style={btnOutline}>
              <X size={13} /> Close
            </button>

            {step === 1 && (
              <button
                onClick={handleGenerate}
                disabled={generating || !ptKey}
                style={btnPrimary(generating || !ptKey)}>
                {generating
                  ? <><Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} /> Generating…</>
                  : <><Link2 size={14} /> Generate link</>
                }
              </button>
            )}

            {step === 2 && (
              <button onClick={handleReset} className="gl-outline-hover" style={btnOutline}>
                <RefreshCw size={13} /> New link
              </button>
            )}
          </div>

        </div>
      </div>
    </>
  );
}