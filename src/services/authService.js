// src/services/authService.js
// ─── Business logic: auth, token storage, session helpers ─────────────────────
import authRepository from '../hooks/authRepository'; // ← correct path

const TOKEN_KEY    = 'authToken';
const USER_KEY     = 'user';
const AUTH_KEY     = 'isAuthenticated';
const REMEMBER_KEY = 'rememberMe';

function persistSession(data, rememberMe = false) {
  localStorage.setItem(TOKEN_KEY, data.token);
  localStorage.setItem(USER_KEY, JSON.stringify(data.user));
  localStorage.setItem(AUTH_KEY, 'true');
  if (rememberMe) localStorage.setItem(REMEMBER_KEY, 'true');
}

function clearSession() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  localStorage.removeItem(AUTH_KEY);
  localStorage.removeItem(REMEMBER_KEY);
}

const authService = {
  // ── Auth ────────────────────────────────────────────────────────────────────
  login: async ({ username, password, rememberMe = false }) => {
    const data = await authRepository.login(username, password);
    if (data.success) persistSession(data.data, rememberMe);
    return data;
  },

  register: async (userData) => {
    const data = await authRepository.register(userData);
    if (data.success) persistSession(data.data);
    return data;
  },

  logout: async () => {
    try {
      await authRepository.logout();
    } finally {
      clearSession();
    }
  },

  // ── Password reset ──────────────────────────────────────────────────────────

  // Step 1 — request OTP email
  // Resolves with { success: true, message: '...' } regardless of whether the
  // email exists (server is intentionally vague for security).
  forgotPassword: async (email) => {
    return authRepository.forgotPassword(email);
  },

  // Step 2 — submit email + OTP + new password
  // Throws with a descriptive message when the OTP is invalid/expired.
  resetPassword: async (email, otp, newPassword) => {
    return authRepository.resetPassword(email, otp, newPassword);
  },

  // ── Session helpers ─────────────────────────────────────────────────────────
  isAuthenticated: () => !!localStorage.getItem(TOKEN_KEY),

  getToken: () => localStorage.getItem(TOKEN_KEY),

  getUser: () => {
    try {
      const str = localStorage.getItem(USER_KEY);
      return str ? JSON.parse(str) : null;
    } catch {
      return null;
    }
  },
};

export default authService;