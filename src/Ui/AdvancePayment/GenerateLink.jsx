import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import {
  X,
  Link2,
  Mail,
  Copy,
  RefreshCw,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  Users,
  Globe,
  Loader2,
  Clock,
  Send,
} from "lucide-react";
import advancePaymentService from "../../services/advancePaymentService";

const ALLOWED_KEYS = ["emp_to_emp", "other"];

function validateEmail(v) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
}

function buildLink(paymentTypeKey, token) {
  return `${window.location.origin}/advance-request/${paymentTypeKey}/${token}`;
}

function TypeIcon({ ptKey, size = 16, color = "currentColor" }) {
  if (ptKey === "emp_to_emp") return <Users size={size} color={color} />;
  return <Globe size={size} color={color} />;
}

function StepTab({ num, label, active }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 5,
        padding: "6px 10px",
        borderRadius: 99,
        background: active ? "#dbeafe" : "#f1f5f9",
        color: active ? "#1d4ed8" : "#94a3b8",
        fontSize: 11,
        fontWeight: 600,
        transition: "all 0.2s",
        whiteSpace: "nowrap",
      }}
    >
      <span
        style={{
          width: 16,
          height: 16,
          borderRadius: "50%",
          fontSize: 9,
          fontWeight: 700,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: active ? "#2563eb" : "#e2e8f0",
          color: active ? "#fff" : "#94a3b8",
          flexShrink: 0,
        }}
      >
        {num}
      </span>
      {label}
    </div>
  );
}

export default function GenerateLinkModal({ onClose }) {
  const [paymentTypes, setPaymentTypes] = useState([]);
  const [typesLoading, setTypesLoading] = useState(true);
  const [ptKey, setPtKey] = useState("");
  const [email, setEmail] = useState("");
  const [emailErr, setEmailErr] = useState("");

  const [step, setStep] = useState(1);
  const [generated, setGenerated] = useState(null);
  const [generating, setGenerating] = useState(false);
  const [copied, setCopied] = useState(false);

  const [resending, setResending] = useState(false);
  const [resent, setResent] = useState(false);

  useEffect(() => {
    advancePaymentService
      .getPaymentTypes()
      .then((res) => {
        const all = (res.data || []).filter((p) =>
          ALLOWED_KEYS.includes(p.key)
        );
        setPaymentTypes(all);
        if (all.length) setPtKey(all[0].key);
      })
      .catch((err) => console.error("getPaymentTypes:", err.message))
      .finally(() => setTypesLoading(false));
  }, []);

  const pt = paymentTypes.find((p) => p.key === ptKey) || {};

  const handleGenerate = async () => {
    if (!email) {
      setEmailErr("Employee email is required");
      return;
    }
    if (!validateEmail(email)) {
      setEmailErr("Enter a valid email address");
      return;
    }
    setEmailErr("");
    setGenerating(true);
    try {
      const res = await advancePaymentService.createLink({
        payment_type_key: ptKey,
        employee_email: email,
        expires_in_days: 30,
        multi_use: true,
      });
      const token = res.data?.token;
      const retPtKey = res.data?.payment_type_key || ptKey;
      const expires = res.data?.expires_at;
      if (!token) throw new Error("No token returned");

      setGenerated({
        link: buildLink(retPtKey, token),
        token,
        expires_at: expires,
        ptKey: retPtKey,
      });
      setStep(2);
    } catch (err) {
      alert(err.message || "Failed to generate link");
    } finally {
      setGenerating(false);
    }
  };

  const handleResend = async () => {
    if (!generated?.token || resending) return;
    setResending(true);
    setResent(false);
    try {
      await advancePaymentService.sendLinkEmail({
        token: generated.token,
        email,
        payment_type_key: generated.ptKey,
      });
      setResent(true);
      setTimeout(() => setResent(false), 3000);
    } catch (err) {
      alert(`Resend failed: ${err.message}`);
    } finally {
      setResending(false);
    }
  };

  const handleCopy = () => {
    if (generated?.link) {
      navigator.clipboard?.writeText(generated.link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    }
  };

  const handleReset = () => {
    setStep(1);
    setGenerated(null);
    setCopied(false);
    setEmailErr("");
    setResent(false);
  };

  const expiryLabel = generated?.expires_at
    ? new Date(generated.expires_at).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : null;

  const modalContent = (
    <>
      <style>{`
        @keyframes spin   { to { transform: rotate(360deg); } }
        @keyframes fadeUp { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:translateY(0); } }
        @keyframes slideUp { from { opacity:0; transform:translateY(20px); } to { opacity:1; transform:translateY(0); } }

        .gl-type-card:hover { border-color: #93c5fd !important; background: #eff6ff !important; }
        .gl-chip:hover { background: #f8fafc !important; }
        .gl-outline-hover:hover { background: #f8fafc !important; }

        .gl-modal-wrapper {
          position: fixed;
          inset: 0;
          z-index: 9999;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(0,0,0,.5);
          backdrop-filter: blur(4px);
          -webkit-backdrop-filter: blur(4px);
          padding: 16px;
        }

        /* Mobile: slide up from bottom, full width */
        @media (max-width: 480px) {
          .gl-modal-wrapper {
            align-items: flex-end;
            padding: 0;
          }
          .gl-modal {
            border-radius: 20px 20px 0 0 !important;
            max-width: 100% !important;
            width: 100% !important;
            animation: slideUp 0.28s cubic-bezier(0.32,0.72,0,1) !important;
            max-height: 92dvh;
            overflow-y: auto;
          }
          .gl-header { padding: 16px 16px 12px !important; }
          .gl-body { padding: 14px 16px !important; gap: 12px !important; }
          .gl-footer { padding: 10px 16px 20px !important; }
          .gl-type-grid { grid-template-columns: repeat(2, 1fr) !important; }
          .gl-action-chips { flex-direction: column !important; }
          .gl-action-chips > * { width: 100% !important; justify-content: center !important; }
          .gl-link-box { font-size: 10px !important; }
          .gl-title { font-size: 14px !important; }
          .gl-subtitle { font-size: 11px !important; }
          .gl-footer-btns { flex-direction: column-reverse !important; }
          .gl-footer-btns > * { width: 100% !important; justify-content: center !important; }
          .gl-drag-handle {
            display: block !important;
          }
        }

        /* Tablet: centered, constrained width */
        @media (min-width: 481px) and (max-width: 768px) {
          .gl-modal-wrapper {
            padding: 12px;
          }
          .gl-modal {
            max-width: 480px !important;
            animation: fadeUp 0.22s ease;
          }
          .gl-action-chips { flex-wrap: wrap !important; }
        }

        /* Desktop */
        @media (min-width: 769px) {
          .gl-modal {
            max-width: 460px !important;
            animation: fadeUp 0.22s ease;
          }
        }

        .gl-drag-handle {
          display: none;
          width: 36px;
          height: 4px;
          border-radius: 99px;
          background: #cbd5e1;
          margin: 0 auto 14px;
        }

        .gl-modal::-webkit-scrollbar { width: 4px; }
        .gl-modal::-webkit-scrollbar-track { background: transparent; }
        .gl-modal::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 99px; }
      `}</style>

      <div
        className="gl-modal-wrapper"
        onClick={(e) => e.target === e.currentTarget && onClose()}
      >
        <div
          className="gl-modal"
          style={{
            background: "#fff",
            borderRadius: 18,
            width: "100%",
            boxShadow: "0 25px 60px rgba(0,0,0,.2)",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
          }}
        >
          {/* Drag handle — mobile only */}
          <div style={{ padding: "10px 0 0", background: "#fff" }}>
            <div className="gl-drag-handle" />
          </div>

          {/* Header */}
          <div
            className="gl-header"
            style={{ padding: "18px 20px 14px", borderBottom: "1px solid #f1f5f9" }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                gap: 8,
              }}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                <p
                  className="gl-title"
                  style={{ margin: 0, fontSize: 15, fontWeight: 700, color: "#1e293b" }}
                >
                  Generate payment link
                </p>
                <p
                  className="gl-subtitle"
                  style={{ margin: "3px 0 0", fontSize: 12, color: "#94a3b8", lineHeight: 1.4 }}
                >
                  Employee fills form &amp; uploads screenshots · auto-emailed · valid 30 days
                </p>
              </div>
              <button
                onClick={onClose}
                style={{
                  border: "none",
                  background: "none",
                  cursor: "pointer",
                  color: "#94a3b8",
                  padding: "4px",
                  lineHeight: 1,
                  flexShrink: 0,
                  borderRadius: 6,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <X size={18} />
              </button>
            </div>
            <div style={{ display: "flex", gap: 6, marginTop: 14, flexWrap: "wrap" }}>
              <StepTab num={1} label="Configure" active={step === 1} />
              <StepTab num={2} label="Share link" active={step === 2} />
            </div>
          </div>

          {/* Step 1 */}
          {step === 1 && (
            <div
              className="gl-body"
              style={{
                padding: "18px 20px",
                display: "flex",
                flexDirection: "column",
                gap: 14,
              }}
            >
              {/* Payment type */}
              <div>
                <span
                  style={{
                    display: "block",
                    fontSize: 11,
                    fontWeight: 700,
                    color: "#94a3b8",
                    textTransform: "uppercase",
                    letterSpacing: "0.07em",
                    marginBottom: 8,
                  }}
                >
                  Payment type
                </span>
                {typesLoading ? (
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      color: "#94a3b8",
                      fontSize: 13,
                      padding: "12px 0",
                    }}
                  >
                    <Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} />
                    Loading types…
                  </div>
                ) : paymentTypes.length === 0 ? (
                  <div
                    style={{
                      padding: "12px 14px",
                      borderRadius: 10,
                      background: "#fef2f2",
                      border: "1px solid #fecaca",
                      fontSize: 13,
                      color: "#b91c1c",
                    }}
                  >
                    No payment types available.
                  </div>
                ) : (
                  <div
                    className="gl-type-grid"
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(2, 1fr)",
                      gap: 8,
                    }}
                  >
                    {paymentTypes.map((p) => {
                      const sel = ptKey === p.key;
                      const c = p.color || "#2563eb";
                      return (
                        <button
                          key={p.key}
                          className="gl-type-card"
                          onClick={() => setPtKey(p.key)}
                          style={{
                            position: "relative",
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            gap: 7,
                            padding: "14px 8px 11px",
                            borderRadius: 11,
                            cursor: "pointer",
                            border: `${sel ? "2px" : "1.5px"} solid ${sel ? c : "#e2e8f0"}`,
                            background: sel ? `${c}0f` : "#fafafa",
                            transition: "all 0.15s",
                            boxShadow: sel ? `0 0 0 3px ${c}18` : "none",
                            minHeight: 88,
                          }}
                        >
                          {sel && (
                            <span
                              style={{
                                position: "absolute",
                                top: 6,
                                right: 6,
                                width: 14,
                                height: 14,
                                borderRadius: "50%",
                                background: c,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                              }}
                            >
                              <svg width="7" height="7" viewBox="0 0 10 10" fill="none">
                                <path
                                  d="M2 5l2 2 4-4"
                                  stroke="#fff"
                                  strokeWidth="1.8"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                />
                              </svg>
                            </span>
                          )}
                          <div
                            style={{
                              width: 34,
                              height: 34,
                              borderRadius: 9,
                              background: sel ? c : "#eef1f6",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              flexShrink: 0,
                            }}
                          >
                            <TypeIcon ptKey={p.key} size={16} color={sel ? "#fff" : "#7c8fa6"} />
                          </div>
                          <span
                            style={{
                              fontSize: 11,
                              fontWeight: 700,
                              color: sel ? c : "#64748b",
                              textAlign: "center",
                              lineHeight: 1.3,
                            }}
                          >
                            {p.short_label}
                          </span>
                          <span
                            style={{
                              fontSize: 10,
                              color: "#94a3b8",
                              textAlign: "center",
                              lineHeight: 1.3,
                            }}
                          >
                            {p.description}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Type hint */}
              {pt.key && (
                <div
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: 9,
                    padding: "10px 12px",
                    borderRadius: 9,
                    background: "#f8fafc",
                    border: "1px solid #f1f5f9",
                    animation: "fadeUp 0.2s ease",
                  }}
                >
                  <TypeIcon ptKey={pt.key} size={14} color="#64748b" />
                  <p style={{ margin: 0, fontSize: 12, color: "#64748b", lineHeight: 1.6 }}>
                    <strong style={{ color: "#334155" }}>{pt.short_label}</strong>
                    {pt.description ? ` — ${pt.description}` : ""}
                  </p>
                </div>
              )}

              {/* Email input */}
              <div>
                <span
                  style={{
                    display: "block",
                    fontSize: 11,
                    fontWeight: 700,
                    color: "#94a3b8",
                    textTransform: "uppercase",
                    letterSpacing: "0.07em",
                    marginBottom: 8,
                  }}
                >
                  Employee email <span style={{ color: "#ef4444" }}>*</span>
                </span>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    padding: "10px 12px",
                    borderRadius: 9,
                    border: `1.5px solid ${emailErr ? "#fca5a5" : "#e2e8f0"}`,
                    background: emailErr ? "#fff5f5" : "#fff",
                  }}
                >
                  <Mail size={14} color="#94a3b8" style={{ flexShrink: 0 }} />
                  <input
                    type="email"
                    inputMode="email"
                    autoComplete="email"
                    placeholder="employee@company.com"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      setEmailErr("");
                    }}
                    style={{
                      flex: 1,
                      border: "none",
                      outline: "none",
                      fontSize: 14,
                      color: "#1e293b",
                      background: "transparent",
                      fontFamily: "inherit",
                      minWidth: 0,
                    }}
                  />
                  {email && validateEmail(email) && (
                    <CheckCircle2 size={13} color="#22c55e" style={{ flexShrink: 0 }} />
                  )}
                </div>
                {emailErr && (
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 5,
                      marginTop: 5,
                      fontSize: 11,
                      color: "#ef4444",
                    }}
                  >
                    <AlertCircle size={11} /> {emailErr}
                  </div>
                )}
              </div>

              {/* Info banner */}
              <div
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 8,
                  padding: "10px 12px",
                  borderRadius: 9,
                  background: "#f8fafc",
                  border: "1px solid #f1f5f9",
                }}
              >
                <Clock size={13} color="#94a3b8" style={{ flexShrink: 0, marginTop: 1 }} />
                <p style={{ margin: 0, fontSize: 12, color: "#64748b", lineHeight: 1.65 }}>
                  Valid for <strong style={{ color: "#334155" }}>30 days</strong> · Link is{" "}
                  <strong style={{ color: "#334155" }}>auto-emailed</strong> on generate · Each
                  submission creates a new pending request
                </p>
              </div>
            </div>
          )}

          {/* Step 2 */}
          {step === 2 && generated && (
            <div
              className="gl-body"
              style={{
                padding: "18px 20px",
                display: "flex",
                flexDirection: "column",
                gap: 14,
                animation: "fadeUp 0.22s ease",
              }}
            >
              {/* Success banner */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "12px 14px",
                  borderRadius: 10,
                  background: "#f0fdf4",
                  border: "1.5px solid #86efac",
                }}
              >
                <div
                  style={{
                    width: 34,
                    height: 34,
                    borderRadius: 9,
                    flexShrink: 0,
                    background: "#dcfce7",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Link2 size={16} color="#16a34a" />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: "#15803d" }}>
                    Link generated &amp; emailed
                  </p>
                  <p
                    style={{
                      margin: "2px 0 0",
                      fontSize: 11,
                      color: "#16a34a",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    Sent to <strong>{email}</strong>
                    {expiryLabel ? ` · Expires ${expiryLabel}` : ""}
                  </p>
                </div>
                <div
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: "50%",
                    background: "#22c55e",
                    flexShrink: 0,
                  }}
                />
              </div>

              {/* Link display */}
              <div>
                <span
                  style={{
                    display: "block",
                    fontSize: 11,
                    fontWeight: 700,
                    color: "#94a3b8",
                    textTransform: "uppercase",
                    letterSpacing: "0.07em",
                    marginBottom: 8,
                  }}
                >
                  Shareable link
                </span>
                <div
                  className="gl-link-box"
                  style={{
                    padding: "10px 12px",
                    borderRadius: 9,
                    background: "#f8fafc",
                    border: "1px solid #e2e8f0",
                    fontFamily: "'ui-monospace', 'Cascadia Code', monospace",
                    fontSize: 11,
                    color: "#475569",
                    wordBreak: "break-all",
                    lineHeight: 1.75,
                  }}
                >
                  {generated.link}
                </div>
              </div>

              {/* Action chips */}
              <div
                className="gl-action-chips"
                style={{ display: "flex", gap: 8, flexWrap: "wrap" }}
              >
                <button
                  className="gl-chip"
                  onClick={handleCopy}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 5,
                    padding: "9px 14px",
                    borderRadius: 8,
                    border: "none",
                    background: copied ? "#dcfce7" : "#eef2ff",
                    color: copied ? "#15803d" : "#4338ca",
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: "pointer",
                    transition: "all 0.15s",
                    flex: "1 1 auto",
                    minWidth: 100,
                  }}
                >
                  {copied ? (
                    <><CheckCircle2 size={13} /> Copied!</>
                  ) : (
                    <><Copy size={13} /> Copy link</>
                  )}
                </button>

                <a
                  href={generated.link}
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 5,
                    padding: "9px 14px",
                    borderRadius: 8,
                    background: "#1e293b",
                    color: "#f1f5f9",
                    fontSize: 13,
                    fontWeight: 600,
                    textDecoration: "none",
                    flex: "1 1 auto",
                    minWidth: 100,
                  }}
                >
                  <ExternalLink size={13} /> Preview form
                </a>

                <button
                  onClick={handleResend}
                  disabled={resending}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 5,
                    padding: "9px 14px",
                    borderRadius: 8,
                    border: "none",
                    background: resent ? "#dcfce7" : "#f0f9ff",
                    color: resent ? "#15803d" : "#0369a1",
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: resending ? "not-allowed" : "pointer",
                    opacity: resending ? 0.7 : 1,
                    transition: "all 0.15s",
                    flex: "1 1 auto",
                    minWidth: 100,
                  }}
                >
                  {resending ? (
                    <>
                      <Loader2 size={13} style={{ animation: "spin 1s linear infinite" }} /> Sending…
                    </>
                  ) : resent ? (
                    <><CheckCircle2 size={13} /> Resent!</>
                  ) : (
                    <><Send size={13} /> Resend email</>
                  )}
                </button>
              </div>

              {/* Reminder banner */}
              <div
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 8,
                  padding: "10px 12px",
                  borderRadius: 9,
                  background: "#fefce8",
                  border: "1px solid #fde68a",
                }}
              >
                <Clock size={13} color="#b45309" style={{ flexShrink: 0, marginTop: 1 }} />
                <p style={{ margin: 0, fontSize: 12, color: "#92400e", lineHeight: 1.6 }}>
                  This link is <strong>reusable for 30 days</strong>. Each form submission creates
                  a separate pending request. Use <strong>Resend email</strong> above if the
                  employee didn't receive the original email.
                </p>
              </div>
            </div>
          )}

          {/* Footer */}
          <div
            className="gl-footer"
            style={{
              padding: "12px 20px 16px",
              borderTop: "1px solid #f1f5f9",
              background: "#fafbfc",
            }}
          >
            <div
              className="gl-footer-btns"
              style={{ display: "flex", gap: 8, alignItems: "center" }}
            >
              <button
                onClick={onClose}
                className="gl-outline-hover"
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 6,
                  padding: "10px 14px",
                  borderRadius: 9,
                  border: "1.5px solid #e2e8f0",
                  background: "#fff",
                  color: "#475569",
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                  flexShrink: 0,
                }}
              >
                <X size={13} /> Close
              </button>

              {step === 1 && (
                <button
                  onClick={handleGenerate}
                  disabled={generating || !ptKey}
                  style={{
                    flex: 1,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 6,
                    padding: "10px 16px",
                    borderRadius: 9,
                    border: "none",
                    background: generating || !ptKey ? "#cbd5e1" : "#2563eb",
                    color: generating || !ptKey ? "#94a3b8" : "#fff",
                    fontSize: 13,
                    fontWeight: 700,
                    cursor: generating || !ptKey ? "not-allowed" : "pointer",
                    boxShadow:
                      generating || !ptKey ? "none" : "0 4px 14px rgba(37,99,235,0.3)",
                    whiteSpace: "nowrap",
                    transition: "all 0.15s",
                  }}
                >
                  {generating ? (
                    <>
                      <Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} />
                      Generating…
                    </>
                  ) : (
                    <>
                      <Link2 size={14} /> Generate &amp; email link
                    </>
                  )}
                </button>
              )}

              {step === 2 && (
                <button
                  onClick={handleReset}
                  className="gl-outline-hover"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 6,
                    padding: "10px 14px",
                    borderRadius: 9,
                    border: "1.5px solid #e2e8f0",
                    background: "#fff",
                    color: "#475569",
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: "pointer",
                    flex: 1,
                  }}
                >
                  <RefreshCw size={13} /> New link
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );

  return createPortal(modalContent, document.body);
}