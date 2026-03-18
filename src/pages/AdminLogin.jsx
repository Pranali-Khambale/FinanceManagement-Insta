import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import authService from "../services/authService";

const AdminLogin = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    username: "",
    password: "",
    rememberMe: false,
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [apiError, setApiError] = useState("");
  const [toast, setToast] = useState(null);

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
    setApiError("");
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.username.trim()) newErrors.username = "Username is required";
    if (!formData.password) newErrors.password = "Password is required";
    else if (formData.password.length < 8)
      newErrors.password = "Password must be at least 8 characters";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    setLoading(true);
    setApiError("");
    try {
      const response = await authService.login(formData);
      if (response.success) {
        localStorage.setItem("isAuthenticated", "true");
        if (response.data?.user) {
          localStorage.setItem(
            "fullName",
            response.data.user.fullName || response.data.user.username,
          );
          localStorage.setItem("email", response.data.user.email || "");
        }
        showToast(
          `Welcome back, ${response.data?.user?.fullName || formData.username}!`,
          "success",
        );
        setTimeout(() => navigate("/employee/dashboard"), 1200);
      } else {
        throw new Error(response.message || "Login failed");
      }
    } catch (error) {
      if (error.response) {
        setApiError(error.response.data?.message || "Login failed");
      } else if (error.request) {
        setApiError(
          "Cannot connect to server. Please ensure the backend is running.",
        );
      } else {
        setApiError(error.message || "An unexpected error occurred");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#ffffff", // ← white background
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: '"Inter", "Segoe UI", sans-serif',
        padding: "24px",
      }}
    >
      {/* ── Toast ── */}
      {toast && (
        <div
          style={{
            position: "fixed",
            top: 24,
            right: 24,
            zIndex: 9999,
            minWidth: 280,
            maxWidth: 380,
            background: toast.type === "success" ? "#f0fdf4" : "#fef2f2",
            border: `1px solid ${toast.type === "success" ? "#bbf7d0" : "#fecaca"}`,
            borderLeft: `4px solid ${toast.type === "success" ? "#22c55e" : "#ef4444"}`,
            borderRadius: 10,
            padding: "12px 16px",
            display: "flex",
            alignItems: "center",
            gap: 10,
            boxShadow: "0 8px 24px rgba(0,0,0,0.10)",
            animation: "slideInRight 0.3s ease",
          }}
        >
          {toast.type === "success" ? (
            <svg
              width="20"
              height="20"
              fill="none"
              viewBox="0 0 24 24"
              style={{ flexShrink: 0 }}
            >
              <circle cx="12" cy="12" r="10" fill="#22c55e" />
              <path
                stroke="white"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M7 13l3 3 7-7"
              />
            </svg>
          ) : (
            <svg
              width="20"
              height="20"
              fill="#ef4444"
              viewBox="0 0 20 20"
              style={{ flexShrink: 0 }}
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                clipRule="evenodd"
              />
            </svg>
          )}
          <span
            style={{
              fontSize: 13,
              fontWeight: 500,
              flex: 1,
              color: toast.type === "success" ? "#15803d" : "#dc2626",
            }}
          >
            {toast.message}
          </span>
          <button
            onClick={() => setToast(null)}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "#94a3b8",
              padding: 0,
              display: "flex",
            }}
          >
            <svg
              width="16"
              height="16"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
      )}

      {/* ── Main Card ── */}
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
        {/* ── LEFT: Login Form ── */}
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
          {/* Title */}
          <h2
            style={{
              fontSize: 26,
              fontWeight: 800,
              color: "#0f172a",
              margin: "0 0 28px",
              letterSpacing: "-0.5px",
            }}
          >
            Login to Your Account
          </h2>

          {/* API Error */}
          {apiError && (
            <div
              style={{
                background: "#fef2f2",
                border: "1px solid #fecaca",
                borderLeft: "4px solid #ef4444",
                borderRadius: 10,
                padding: "10px 14px",
                display: "flex",
                alignItems: "center",
                gap: 10,
                marginBottom: 16,
              }}
            >
              <svg
                width="15"
                height="15"
                fill="#ef4444"
                viewBox="0 0 20 20"
                style={{ flexShrink: 0 }}
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
              <span style={{ fontSize: 13, color: "#dc2626" }}>{apiError}</span>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {/* Username */}
            <div style={{ marginBottom: 16 }}>
              <input
                type="text"
                name="username"
                value={formData.username}
                onChange={handleChange}
                placeholder="Username"
                autoComplete="username"
                style={{
                  width: "100%",
                  boxSizing: "border-box",
                  padding: "13px 16px",
                  border: `1.5px solid ${errors.username ? "#fca5a5" : "#dbeafe"}`,
                  borderRadius: 10,
                  fontSize: 14,
                  color: "#0f172a",
                  background: errors.username ? "#fef2f2" : "#eff6ff",
                  outline: "none",
                  transition: "border-color 0.2s",
                }}
                onFocus={(e) =>
                  (e.target.style.borderColor = errors.username
                    ? "#ef4444"
                    : "#3b82f6")
                }
                onBlur={(e) =>
                  (e.target.style.borderColor = errors.username
                    ? "#fca5a5"
                    : "#dbeafe")
                }
              />
              {errors.username && (
                <p style={{ fontSize: 12, color: "#ef4444", marginTop: 4 }}>
                  {errors.username}
                </p>
              )}
            </div>

            {/* Password */}
            <div style={{ marginBottom: 8 }}>
              <div style={{ position: "relative" }}>
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Password"
                  autoComplete="current-password"
                  style={{
                    width: "100%",
                    boxSizing: "border-box",
                    padding: "13px 44px 13px 16px",
                    border: `1.5px solid ${errors.password ? "#fca5a5" : "#dbeafe"}`,
                    borderRadius: 10,
                    fontSize: 14,
                    color: "#0f172a",
                    background: errors.password ? "#fef2f2" : "#eff6ff",
                    outline: "none",
                    transition: "border-color 0.2s",
                  }}
                  onFocus={(e) =>
                    (e.target.style.borderColor = errors.password
                      ? "#ef4444"
                      : "#3b82f6")
                  }
                  onBlur={(e) =>
                    (e.target.style.borderColor = errors.password
                      ? "#fca5a5"
                      : "#dbeafe")
                  }
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((p) => !p)}
                  style={{
                    position: "absolute",
                    right: 12,
                    top: "50%",
                    transform: "translateY(-50%)",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    color: "#93c5fd",
                    display: "flex",
                    padding: 2,
                  }}
                >
                  {showPassword ? (
                    <svg
                      width="18"
                      height="18"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                      />
                    </svg>
                  ) : (
                    <svg
                      width="18"
                      height="18"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                      />
                    </svg>
                  )}
                </button>
              </div>
              {errors.password && (
                <p style={{ fontSize: 12, color: "#ef4444", marginTop: 4 }}>
                  {errors.password}
                </p>
              )}
            </div>

            {/* Forgot password */}
            <div style={{ textAlign: "right", marginBottom: 24 }}>
              <button
                type="button"
                onClick={() => navigate("/admin/forgot-password")}
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
                Forgot password?
              </button>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              style={{
                width: "100%",
                padding: "13px",
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
                justifyContent: "center",
                gap: 8,
                boxShadow: loading ? "none" : "0 4px 14px rgba(37,99,235,0.35)",
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
                  Authenticating...
                </>
              ) : (
                "Sign In"
              )}
            </button>
          </form>
        </div>

        {/* ── RIGHT: Blue Panel ── */}
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

          {/* Content */}
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
            New Here?
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
            Sign up and discover a great amount of new opportunities!
          </p>

          {/* Sign Up button */}
          <button
            type="button"
            onClick={() => navigate("/register")}
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
            Sign Up
          </button>

          {/* Bottom tagline */}
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
        @keyframes slideInRight {
          from { opacity: 0; transform: translateX(60px); }
          to   { opacity: 1; transform: translateX(0); }
        }
      `}</style>
    </div>
  );
};

export default AdminLogin;
