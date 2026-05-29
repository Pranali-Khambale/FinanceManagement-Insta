// src/pages/ForgotPassword.jsx
import React, { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import authRepository from "../hooks/authRepository"; // ← was ../hooks/authRepository

const STEPS = { EMAIL: 1, OTP: 2, PASSWORD: 3, DONE: 4 };

const ForgotPassword = () => {
  const navigate = useNavigate();
  const [step, setStep]           = useState(STEPS.EMAIL);
  const [email, setEmail]         = useState("");
  const [otp, setOtp]             = useState(["", "", "", "", "", ""]);
  const [newPassword, setNewPw]   = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [showPw, setShowPw]       = useState(false);
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState("");
  const [resendTimer, setResendTimer] = useState(0);
  const otpRefs = useRef([]);

  // ── resend cooldown ────────────────────────────────────────
  const startResendTimer = () => {
    setResendTimer(60);
    const iv = setInterval(() => {
      setResendTimer((t) => {
        if (t <= 1) { clearInterval(iv); return 0; }
        return t - 1;
      });
    }, 1000);
  };

  // ── step 1: request OTP ────────────────────────────────────
  const handleSendCode = async (e) => {
    e.preventDefault();
    setError("");
    if (!email.trim()) return setError("Email is required");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return setError("Enter a valid email");
    setLoading(true);
    try {
      await authRepository.forgotPassword(email.trim().toLowerCase());
      setStep(STEPS.OTP);
      startResendTimer();
    } catch (err) {
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  // ── step 2: OTP box keyboard handling ─────────────────────
  const handleOtpChange = (i, val) => {
    if (!/^\d?$/.test(val)) return;
    const next = [...otp];
    next[i] = val;
    setOtp(next);
    if (val && i < 5) otpRefs.current[i + 1]?.focus();
  };

  const handleOtpKey = (i, e) => {
    if (e.key === "Backspace" && !otp[i] && i > 0) otpRefs.current[i - 1]?.focus();
    if (e.key === "ArrowLeft"  && i > 0) otpRefs.current[i - 1]?.focus();
    if (e.key === "ArrowRight" && i < 5) otpRefs.current[i + 1]?.focus();
  };

  const handleOtpPaste = (e) => {
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (!pasted) return;
    e.preventDefault();
    const arr = pasted.split("").concat(Array(6).fill("")).slice(0, 6);
    setOtp(arr);
    otpRefs.current[Math.min(pasted.length, 5)]?.focus();
  };

  // OTP is only validated on the server during resetPassword — just advance here
  const handleVerifyOtp = (e) => {
    e.preventDefault();
    setError("");
    if (otp.join("").length < 6) return setError("Enter the full 6-digit code");
    setStep(STEPS.PASSWORD);
  };

  // ── step 3: set new password ───────────────────────────────
  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError("");
    if (newPassword.length < 8) return setError("Password must be at least 8 characters");
    if (newPassword !== confirmPw) return setError("Passwords do not match");
    setLoading(true);
    try {
      await authRepository.resetPassword(
        email.trim().toLowerCase(),
        otp.join(""),
        newPassword
      );
      setStep(STEPS.DONE);
    } catch (err) {
      // Invalid / expired OTP → bounce back to OTP step so they can retry
      if (
        err.message?.toLowerCase().includes("invalid") ||
        err.message?.toLowerCase().includes("expired")
      ) {
        setError(err.message);
        setStep(STEPS.OTP);
        setOtp(["", "", "", "", "", ""]);
        setTimeout(() => otpRefs.current[0]?.focus(), 100);
      } else {
        setError(err.message || "Reset failed. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (resendTimer > 0) return;
    setError("");
    try {
      await authRepository.forgotPassword(email.trim().toLowerCase());
      setOtp(["", "", "", "", "", ""]);
      setTimeout(() => otpRefs.current[0]?.focus(), 100);
      startResendTimer();
    } catch (err) {
      setError(err.message || "Could not resend. Please try again.");
    }
  };

  // ── shared styles ──────────────────────────────────────────
  const inputStyle = (hasErr) => ({
    width: "100%", boxSizing: "border-box", padding: "13px 16px",
    border: `1.5px solid ${hasErr ? "#fca5a5" : "#dbeafe"}`,
    borderRadius: 10, fontSize: 14, color: "#0f172a",
    background: hasErr ? "#fef2f2" : "#eff6ff", outline: "none",
  });

  const btnStyle = (disabled) => ({
    padding: "12px 40px",
    background: disabled
      ? "#93c5fd"
      : "linear-gradient(135deg, #2563eb, #3b82f6)",
    color: "#fff", border: "none", borderRadius: 50, fontSize: 15,
    fontWeight: 700, cursor: disabled ? "not-allowed" : "pointer",
    display: "flex", alignItems: "center", gap: 8,
    boxShadow: disabled ? "none" : "0 4px 14px rgba(37,99,235,0.35)",
  });

  const Spinner = () => (
    <svg
      style={{ animation: "spin 1s linear infinite" }}
      width="18" height="18" fill="none" viewBox="0 0 24 24"
    >
      <circle cx="12" cy="12" r="10" stroke="rgba(255,255,255,0.35)" strokeWidth="4" />
      <path fill="white" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );

  const ErrorBanner = ({ msg }) =>
    msg ? (
      <div style={{
        background: "#fef2f2", border: "1px solid #fecaca",
        borderLeft: "4px solid #ef4444", borderRadius: 10,
        padding: "10px 14px", fontSize: 13, color: "#dc2626",
      }}>
        {msg}
      </div>
    ) : null;

  const StepDots = () => (
    <div style={{ display: "flex", gap: 6, marginBottom: 20 }}>
      {[1, 2, 3].map((n) => (
        <div
          key={n}
          style={{
            width: 8, height: 8, borderRadius: "50%",
            background: step >= n ? "#2563eb" : "#dbeafe",
            opacity: step > n ? 0.4 : 1,
          }}
        />
      ))}
    </div>
  );

  // ── layout ─────────────────────────────────────────────────
  const RightPanel = () => (
    <div style={{
      width: 280, flexShrink: 0,
      background: "linear-gradient(160deg, #3b82f6 0%, #1d4ed8 60%, #1e40af 100%)",
      display: "flex", flexDirection: "column", alignItems: "center",
      justifyContent: "center", padding: "48px 36px",
      position: "relative", overflow: "hidden",
    }}>
      <div style={{ position: "absolute", top: -60, right: -60, width: 200, height: 200, borderRadius: "50%", background: "rgba(255,255,255,0.07)" }} />
      <div style={{ position: "absolute", bottom: -40, left: -40, width: 160, height: 160, borderRadius: "50%", background: "rgba(255,255,255,0.07)" }} />
      <h3 style={{ color: "#fff", fontSize: 22, fontWeight: 800, margin: "0 0 12px", textAlign: "center" }}>
        {step === STEPS.EMAIL    && "Remember it?"}
        {step === STEPS.OTP     && "Check your inbox"}
        {step === STEPS.PASSWORD && "Almost there!"}
        {step === STEPS.DONE    && "All done!"}
      </h3>
      <p style={{ color: "rgba(255,255,255,0.75)", fontSize: 13, textAlign: "center", margin: "0 0 28px", lineHeight: 1.6 }}>
        {step === STEPS.EMAIL    && "Go back and sign in if you remember your password."}
        {step === STEPS.OTP     && `We sent a 6-digit code to ${email}. It expires in 15 minutes.`}
        {step === STEPS.PASSWORD && "Choose a strong password you haven't used before."}
        {step === STEPS.DONE    && "Your password has been updated. Sign in to continue."}
      </p>
      {step !== STEPS.DONE && (
        <button
          onClick={() => navigate("/login")}
          style={{
            padding: "10px 32px", background: "#fff", color: "#2563eb",
            border: "none", borderRadius: 50, fontSize: 14,
            fontWeight: 700, cursor: "pointer",
          }}
        >
          Back to login
        </button>
      )}
      <p style={{
        position: "absolute", bottom: 20,
        color: "rgba(255,255,255,0.4)", fontSize: 10,
        letterSpacing: "1.5px", textTransform: "uppercase",
      }}>
        Security • Excellence • Growth
      </p>
    </div>
  );

  return (
    <div style={{
      minHeight: "100vh", background: "#ffffff",
      display: "flex", alignItems: "center", justifyContent: "center",
      fontFamily: '"Inter","Segoe UI",sans-serif', padding: 24,
    }}>
      <div style={{
        display: "flex", width: "100%", maxWidth: 820, minHeight: 480,
        borderRadius: 24, overflow: "hidden",
        boxShadow: "0 20px 60px rgba(37,99,235,0.13), 0 4px 16px rgba(0,0,0,0.07)",
      }}>
        {/* ── LEFT ── */}
        <div style={{
          flex: 1, padding: "48px 44px",
          display: "flex", flexDirection: "column", justifyContent: "center",
        }}>

          {/* Step 1 — Email */}
          {step === STEPS.EMAIL && (
            <>
              <StepDots />
              <h2 style={{ fontSize: 26, fontWeight: 800, color: "#0f172a", margin: "0 0 8px" }}>
                Forgot password?
              </h2>
              <p style={{ fontSize: 13, color: "#64748b", margin: "0 0 24px" }}>
                Enter your admin email and we'll send a 6-digit code.
              </p>
              <form onSubmit={handleSendCode} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <ErrorBanner msg={error} />
                <div>
                  <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 6 }}>
                    Email address
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => { setEmail(e.target.value); setError(""); }}
                    placeholder="admin@example.com"
                    style={inputStyle(!!error)}
                    onFocus={(e) => (e.target.style.borderColor = "#3b82f6")}
                    onBlur={(e)  => (e.target.style.borderColor = error ? "#fca5a5" : "#dbeafe")}
                  />
                </div>
                <button type="submit" disabled={loading} style={btnStyle(loading)}>
                  {loading ? <><Spinner /> Sending...</> : "Send code"}
                </button>
              </form>
            </>
          )}

          {/* Step 2 — OTP */}
          {step === STEPS.OTP && (
            <>
              <StepDots />
              <h2 style={{ fontSize: 26, fontWeight: 800, color: "#0f172a", margin: "0 0 8px" }}>
                Enter your code
              </h2>
              <p style={{ fontSize: 13, color: "#64748b", margin: "0 0 24px" }}>
                Sent to{" "}
                <span style={{ color: "#2563eb", fontWeight: 600 }}>{email}</span>.
                Expires in 15 minutes.
              </p>
              <form onSubmit={handleVerifyOtp} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <ErrorBanner msg={error} />
                <div style={{ display: "flex", gap: 8 }} onPaste={handleOtpPaste}>
                  {otp.map((d, i) => (
                    <input
                      key={i}
                      ref={(el) => (otpRefs.current[i] = el)}
                      value={d}
                      maxLength={1}
                      inputMode="numeric"
                      onChange={(e) => handleOtpChange(i, e.target.value)}
                      onKeyDown={(e) => handleOtpKey(i, e)}
                      style={{
                        width: 44, height: 52, textAlign: "center",
                        fontSize: 22, fontWeight: 700,
                        border: "1.5px solid #dbeafe", borderRadius: 10,
                        background: "#eff6ff", color: "#0f172a", outline: "none",
                      }}
                      onFocus={(e) => (e.target.style.borderColor = "#3b82f6")}
                      onBlur={(e)  => (e.target.style.borderColor = "#dbeafe")}
                    />
                  ))}
                </div>
                <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                  <button type="submit" style={btnStyle(false)}>
                    Verify code
                  </button>
                  <button
                    type="button"
                    onClick={() => { setStep(STEPS.EMAIL); setError(""); }}
                    style={{
                      background: "none", border: "none", cursor: "pointer",
                      fontSize: 13, color: "#3b82f6", fontWeight: 500,
                    }}
                  >
                    ← Back
                  </button>
                </div>
                <p style={{ fontSize: 12, color: "#64748b", margin: 0 }}>
                  Didn't receive it?{" "}
                  <button
                    type="button"
                    onClick={handleResend}
                    disabled={resendTimer > 0}
                    style={{
                      background: "none", border: "none",
                      cursor: resendTimer > 0 ? "default" : "pointer",
                      fontSize: 12,
                      color: resendTimer > 0 ? "#93c5fd" : "#3b82f6",
                      fontWeight: 500, padding: 0,
                    }}
                  >
                    {resendTimer > 0 ? `Resend in ${resendTimer}s` : "Resend code"}
                  </button>
                </p>
              </form>
            </>
          )}

          {/* Step 3 — New Password */}
          {step === STEPS.PASSWORD && (
            <>
              <StepDots />
              <h2 style={{ fontSize: 26, fontWeight: 800, color: "#0f172a", margin: "0 0 8px" }}>
                Set new password
              </h2>
              <p style={{ fontSize: 13, color: "#64748b", margin: "0 0 24px" }}>
                Choose a strong password — at least 8 characters.
              </p>
              <form onSubmit={handleResetPassword} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <ErrorBanner msg={error} />
                <div>
                  <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 6 }}>
                    New password
                  </label>
                  <div style={{ position: "relative" }}>
                    <input
                      type={showPw ? "text" : "password"}
                      value={newPassword}
                      onChange={(e) => { setNewPw(e.target.value); setError(""); }}
                      placeholder="Min. 8 characters"
                      style={{ ...inputStyle(!!error), paddingRight: 44 }}
                      onFocus={(e) => (e.target.style.borderColor = "#3b82f6")}
                      onBlur={(e)  => (e.target.style.borderColor = error ? "#fca5a5" : "#dbeafe")}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPw((p) => !p)}
                      style={{
                        position: "absolute", right: 12, top: "50%",
                        transform: "translateY(-50%)", background: "none",
                        border: "none", cursor: "pointer", color: "#93c5fd",
                      }}
                    >
                      <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        {showPw ? (
                          <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                        ) : (
                          <>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </>
                        )}
                      </svg>
                    </button>
                  </div>
                </div>
                <div>
                  <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 6 }}>
                    Confirm password
                  </label>
                  <input
                    type={showPw ? "text" : "password"}
                    value={confirmPw}
                    onChange={(e) => { setConfirmPw(e.target.value); setError(""); }}
                    placeholder="Repeat new password"
                    style={inputStyle(!!error && newPassword !== confirmPw)}
                    onFocus={(e) => (e.target.style.borderColor = "#3b82f6")}
                    onBlur={(e)  => (e.target.style.borderColor = "#dbeafe")}
                  />
                </div>
                <button type="submit" disabled={loading} style={btnStyle(loading)}>
                  {loading ? <><Spinner /> Updating...</> : "Update password"}
                </button>
              </form>
            </>
          )}

          {/* Step 4 — Done */}
          {step === STEPS.DONE && (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div style={{
                width: 56, height: 56, borderRadius: 14,
                background: "linear-gradient(135deg,#22c55e,#16a34a)",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <svg width="26" height="26" fill="none" stroke="white" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 style={{ fontSize: 26, fontWeight: 800, color: "#0f172a", margin: 0 }}>
                Password updated!
              </h2>
              <p style={{ fontSize: 13, color: "#64748b", margin: 0 }}>
                You can now sign in with your new password.
              </p>
              <button onClick={() => navigate("/login")} style={btnStyle(false)}>
                Go to login
              </button>
            </div>
          )}
        </div>

        <RightPanel />
      </div>

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
};

export default ForgotPassword;