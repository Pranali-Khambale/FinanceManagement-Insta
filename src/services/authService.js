// src/services/authService.js
import { apiFetch, BASE_URL } from './api';

const authService = {

  login: async (credentials) => {
    const response = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: credentials.username,
        password: credentials.password,
      }),
    });

    const data = await response.json();
    if (!response.ok) {
      const err = new Error(data.message || `HTTP ${response.status}`);
      err.status = response.status;
      throw err;
    }

    if (data.success) {
      localStorage.setItem('authToken', data.data.token);      // ← key must be 'authToken'
      localStorage.setItem('user', JSON.stringify(data.data.user));
      if (credentials.rememberMe) localStorage.setItem('rememberMe', 'true');
    }

    return data;
  },

  register: async (userData) => {
    const response = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fullName: userData.fullName,
        username: userData.username,
        email:    userData.email,
        password: userData.password,
        role:     userData.role || 'hr',
      }),
    });

    const data = await response.json();
    if (!response.ok) {
      const err = new Error(data.message || `HTTP ${response.status}`);
      err.status = response.status;
      throw err;
    }

    if (data.success) {
      localStorage.setItem('authToken', data.data.token);
      localStorage.setItem('user', JSON.stringify(data.data.user));
    }

    return data;
  },

  logout: async () => {
    try {
      await fetch(`${BASE_URL}/auth/logout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('authToken')}`,
        },
      });
    } catch (_) {}
    finally {
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
      localStorage.removeItem('rememberMe');
      localStorage.removeItem('isAuthenticated');
    }
  },

  isAuthenticated: () => !!localStorage.getItem('authToken'),

  getUser: () => {
    try {
      const str = localStorage.getItem('user');
      return str ? JSON.parse(str) : null;
    } catch {
      return null;
    }
  },
};

export default authService;