import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const ForgotPassword = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const handleChange = (e) => {
    setEmail(e.target.value);
    if (error) setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim()) {
      setError("Email address is required");
      return;
    }
    if (!validateEmail(email)) {
      setError("Please enter a valid email address");
      return;
    }
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setSubmitted(true);
    }, 1500);
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#ffffff",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: '"Inter", "Segoe UI", sans-serif',
        padding: "24px",
      }}
    >
      {/* ── Main Card — same split layout as login ── */}
      <div
        style={{
          display: "flex",
          width: "100%",
          maxWidth: 820,
          minHeight: 480,
          borderRadius: 24,
          overflow: "hidden",
          boxShadow:
            "0 20px 60px rgba(37,99,235,0.13), 0 4px 16px rgba(0,0,0,0.07)",
          background: "#ffffff",
        }}
      >
        {/* ── LEFT: Form ── */}
        <div
          style={{
            flex: 1,
            padding: "48px 44px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            background: "#ffffff",
          }}
        >
          {!submitted ? (
            <>
              <h2
                style={{
                  fontSize: 26,
                  fontWeight: 800,
                  color: "#0f172a",
                  margin: "0 0 8px",
                  letterSpacing: "-0.5px",
                }}
              >
                Forgot Password?
              </h2>
              <p style={{ fontSize: 13, color: "#64748b", margin: "0 0 28px" }}>
                No worries! Enter your email and we'll send you reset
                instructions.
              </p>

              <form onSubmit={handleSubmit}>
                {/* Email */}
                <div style={{ marginBottom: 8 }}>
                  <label
                    style={{
                      display: "block",
                      fontSize: 13,
                      fontWeight: 600,
                      color: "#374151",
                      marginBottom: 6,
                    }}
                  >
                    Email Address
                  </label>
                  <div style={{ position: "relative" }}>
                    <span
                      style={{
                        position: "absolute",
                        left: 13,
                        top: "50%",
                        transform: "translateY(-50%)",
                        display: "flex",
                        color: error ? "#ef4444" : "#93c5fd",
                      }}
                    >
                      <svg
                        width="17"
                        height="17"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                        />
                      </svg>
                    </span>
                    <input
                      type="email"
                      value={email}
                      onChange={handleChange}
                      placeholder="admin@example.com"
                      style={{
                        width: "100%",
                        boxSizing: "border-box",
                        padding: "13px 16px 13px 40px",
                        border: `1.5px solid ${error ? "#fca5a5" : "#dbeafe"}`,
                        borderRadius: 10,
                        fontSize: 14,
                        color: "#0f172a",
                        background: error ? "#fef2f2" : "#eff6ff",
                        outline: "none",
                        transition: "border-color 0.2s",
                      }}
                      onFocus={(e) =>
                        (e.target.style.borderColor = error
                          ? "#ef4444"
                          : "#3b82f6")
                      }
                      onBlur={(e) =>
                        (e.target.style.borderColor = error
                          ? "#fca5a5"
                          : "#dbeafe")
                      }
                    />
                  </div>
                  {error && (
                    <p style={{ fontSize: 12, color: "#ef4444", marginTop: 4 }}>
                      {error}
                    </p>
                  )}
                </div>

                {/* Forgot password */}
                <div style={{ textAlign: "right", marginBottom: 24 }}>
                  <button
                    type="button"
                    onClick={() => navigate("/login")}
                    style={{
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      fontSize: 13,
                      color: "#3b82f6",
                      fontWeight: 500,
                      padding: 0,
                    }}
                  >
                    Back to Login
                  </button>
                </div>

                {/* Submit — compact pill */}
                <div style={{ display: "flex", justifyContent: "flex-start" }}>
                  <button
                    type="submit"
                    disabled={loading}
                    style={{
                      padding: "12px 48px",
                      background: loading
                        ? "#93c5fd"
                        : "linear-gradient(135deg, #2563eb, #3b82f6)",
                      color: "#fff",
                      border: "none",
                      borderRadius: 50,
                      fontSize: 15,
                      fontWeight: 700,
                      cursor: loading ? "not-allowed" : "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      boxShadow: loading
                        ? "none"
                        : "0 4px 14px rgba(37,99,235,0.35)",
                      transition: "all 0.2s",
                    }}
                  >
                    {loading ? (
                      <>
                        <svg
                          style={{ animation: "spin 1s linear infinite" }}
                          width="18"
                          height="18"
                          fill="none"
                          viewBox="0 0 24 24"
                        >
                          <circle
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="rgba(255,255,255,0.35)"
                            strokeWidth="4"
                          />
                          <path
                            fill="white"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                          />
                        </svg>
                        Sending...
                      </>
                    ) : (
                      "Send Reset Link"
                    )}
                  </button>
                </div>
              </form>
            </>
          ) : (
            /* ── Success State ── */
            <>
              {/* Success icon */}
              <div
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: 14,
                  background: "linear-gradient(135deg, #22c55e, #16a34a)",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: 20,
                  boxShadow: "0 6px 18px rgba(34,197,94,0.28)",
                }}
              >
                <svg
                  width="26"
                  height="26"
                  fill="none"
                  stroke="white"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                  />
                </svg>
              </div>

              <h2
                style={{
                  fontSize: 26,
                  fontWeight: 800,
                  color: "#0f172a",
                  margin: "0 0 8px",
                  letterSpacing: "-0.5px",
                }}
              >
                Check Your Email
              </h2>
              <p style={{ fontSize: 13, color: "#64748b", margin: "0 0 4px" }}>
                We've sent reset instructions to
              </p>
              <p
                style={{
                  fontSize: 13,
                  color: "#2563eb",
                  fontWeight: 600,
                  margin: "0 0 28px",
                }}
              >
                {email}
              </p>

              {/* Steps */}
              <div
                style={{
                  background: "#f8fafc",
                  border: "1px solid #e2e8f0",
                  borderRadius: 12,
                  padding: "16px 20px",
                  marginBottom: 28,
                }}
              >
                <p
                  style={{
                    fontSize: 13,
                    fontWeight: 600,
                    color: "#374151",
                    margin: "0 0 12px",
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                  }}
                >
                  <svg
                    width="15"
                    height="15"
                    fill="none"
                    stroke="#3b82f6"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  Next Steps
                </p>
                {[
                  "Check your email inbox (and spam folder)",
                  "Click the reset link in the email",
                  "Create a new password for your account",
                ].map((step, i) => (
                  <div
                    key={i}
                    style={{
                      display: "flex",
                      alignItems: "flex-start",
                      gap: 8,
                      marginBottom: i < 2 ? 8 : 0,
                    }}
                  >
                    <svg
                      width="15"
                      height="15"
                      fill="#22c55e"
                      viewBox="0 0 20 20"
                      style={{ flexShrink: 0, marginTop: 1 }}
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <span style={{ fontSize: 13, color: "#64748b" }}>
                      {step}
                    </span>
                  </div>
                ))}
              </div>

              {/* Return to login */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "flex-start",
                  marginBottom: 14,
                }}
              >
                <button
                  onClick={() => navigate("/login")}
                  style={{
                    padding: "12px 48px",
                    background: "linear-gradient(135deg, #2563eb, #3b82f6)",
                    color: "#fff",
                    border: "none",
                    borderRadius: 50,
                    fontSize: 15,
                    fontWeight: 700,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    boxShadow: "0 4px 14px rgba(37,99,235,0.35)",
                    transition: "all 0.2s",
                  }}
                >
                  Return to Login
                </button>
              </div>

              <button
                onClick={() => setSubmitted(false)}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  fontSize: 13,
                  color: "#3b82f6",
                  fontWeight: 500,
                  padding: 0,
                }}
              >
                Didn't receive the email? Try again
              </button>

              <p style={{ fontSize: 11, color: "#94a3b8", marginTop: 20 }}>
                The reset link will expire in 1 hour for security reasons
              </p>
            </>
          )}
        </div>

        {/* ── RIGHT: Blue Panel — same as login ── */}
        <div
          style={{
            width: 280,
            flexShrink: 0,
            background:
              "linear-gradient(160deg, #3b82f6 0%, #1d4ed8 60%, #1e40af 100%)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: "48px 36px",
            position: "relative",
            overflow: "hidden",
          }}
        >
          {/* Decorative circles */}
          <div
            style={{
              position: "absolute",
              top: -60,
              right: -60,
              width: 200,
              height: 200,
              borderRadius: "50%",
              background: "rgba(255,255,255,0.07)",
            }}
          />
          <div
            style={{
              position: "absolute",
              bottom: -40,
              left: -40,
              width: 160,
              height: 160,
              borderRadius: "50%",
              background: "rgba(255,255,255,0.07)",
            }}
          />

          <h3
            style={{
              color: "#fff",
              fontSize: 26,
              fontWeight: 800,
              margin: "0 0 14px",
              textAlign: "center",
              lineHeight: 1.2,
            }}
          >
            Remember It?
          </h3>
          <p
            style={{
              color: "rgba(255,255,255,0.80)",
              fontSize: 14,
              textAlign: "center",
              margin: "0 0 32px",
              lineHeight: 1.6,
            }}
          >
            Go back and sign in to access your admin dashboard!
          </p>

          <button
            type="button"
            onClick={() => navigate("/login")}
            style={{
              padding: "11px 36px",
              background: "#fff",
              color: "#2563eb",
              border: "none",
              borderRadius: 50,
              fontSize: 14,
              fontWeight: 700,
              cursor: "pointer",
              boxShadow: "0 4px 14px rgba(0,0,0,0.15)",
              transition: "all 0.2s",
              marginBottom: 48,
            }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.transform = "scale(1.04)")
            }
            onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
          >
            Sign In
          </button>

          <p
            style={{
              position: "absolute",
              bottom: 20,
              color: "rgba(255,255,255,0.45)",
              fontSize: 10,
              letterSpacing: "1.5px",
              textTransform: "uppercase",
              textAlign: "center",
            }}
          >
            Security • Excellence • Growth
          </p>
        </div>
      </div>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
};

export default ForgotPassword;
