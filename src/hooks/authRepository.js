// src/repositories/authRepository.js
// ─── Raw API calls for auth endpoints ─────────────────────────────────────────
import { BASE_URL, apiFetch } from '../api/client';

const authRepository = {
  login: (username, password) =>
    fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    }).then(async (res) => {
      const data = await res.json();
      if (!res.ok) {
        const err = new Error(data.message || `HTTP ${res.status}`);
        err.status = res.status;
        throw err;
      }
      return data;
    }),

  register: (userData) =>
    fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fullName: userData.fullName,
        username: userData.username,
        email:    userData.email,
        password: userData.password,
        role:     userData.role || 'hr',
      }),
    }).then(async (res) => {
      const data = await res.json();
      if (!res.ok) {
        const err = new Error(data.message || `HTTP ${res.status}`);
        err.status = res.status;
        throw err;
      }
      return data;
    }),

  // Sends a 6-digit OTP to the given email address.
  // Always resolves (server never reveals whether the email exists).
  forgotPassword: (email) =>
    fetch(`${BASE_URL}/auth/forgot-password`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ email }),
    }).then(async (res) => {
      const data = await res.json();
      if (!res.ok) {
        const err = new Error(data.message || `HTTP ${res.status}`);
        err.status = res.status;
        throw err;
      }
      return data;
    }),

  // Validates email + OTP and sets a new password.
  resetPassword: (email, otp, newPassword) =>
    fetch(`${BASE_URL}/auth/reset-password`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ email, otp, newPassword }),
    }).then(async (res) => {
      const data = await res.json();
      if (!res.ok) {
        const err = new Error(data.message || `HTTP ${res.status}`);
        err.status = res.status;
        throw err;
      }
      return data;
    }),

  logout: () =>
    fetch(`${BASE_URL}/auth/logout`, {
      method:  'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${localStorage.getItem('authToken')}`,
      },
    }).catch(() => {}), // swallow network errors on logout
};

export default authRepository;