// src/services/authService.js
// ─── Business logic: auth, token storage, session helpers ─────────────────────
import authRepository from '../hooks/authRepository'; // fixed path (was '../hooks/authRepository')

const TOKEN_KEY = 'authToken';
const USER_KEY = 'user';
const AUTH_KEY = 'isAuthenticated';
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
  // ── Auth (two-step, OTP-gated) ────────────────────────────────────────────

  // STEP 1 — verify username/password. Does NOT log the user in yet: server
  // emails an OTP to HR and returns { otpRequired, pendingToken }.
  login: async ({ username, password }) => {
    return authRepository.login(username, password);
  },

  // STEP 2 — submit the OTP. On success, persists the real session
  // (7-day token) exactly like the old one-step login used to.
 verifyOtp: async ({ pendingToken, otp, rememberMe = false }) => {
    const data = await authRepository.verifyOtp(pendingToken, otp);
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
  forgotPassword: async (email) => authRepository.forgotPassword(email),
  resetPassword: async (email, otp, newPassword) =>
    authRepository.resetPassword(email, otp, newPassword),

  // ── Session helpers ─────────────────────────────────────────────────────────
  // NOTE: session auto-expiry after 1 week is enforced by the JWT's 7d
  // expiresIn on the server. When it expires, any authenticated request
  // gets a 401, which client.js's interceptor already catches to clear
  // localStorage and redirect to /login — no separate timer needed here.
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