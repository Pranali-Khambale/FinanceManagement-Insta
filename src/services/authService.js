// src/services/authService.js
// ─── Business logic: auth, token storage, session helpers ─────────────────────
import authRepository from '../hooks/authRepository';

const TOKEN_KEY       = 'authToken';
const USER_KEY        = 'user';
const AUTH_KEY        = 'isAuthenticated';
const REMEMBER_KEY    = 'rememberMe';

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