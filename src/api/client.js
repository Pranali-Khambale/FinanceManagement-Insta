// src/api/client.js
// ─── Axios instance + fetch helpers ───────────────────────────────────────────
import axios from 'axios';

// export const BASE_URL = 'https://api-fin.instagrp.com/api';
export const BASE_URL = 'http://192.168.1.17:5000/api';

// ── Axios instance ───────────────────────────────────────────────────────────
export const axiosClient = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 30_000,
});

axiosClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    if (config.data instanceof FormData) delete config.headers['Content-Type'];
    return config;
  },
  (error) => Promise.reject(error),
);

axiosClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) handleUnauthorized();
    return Promise.reject(error);
  },
);

// ── Internal helpers ─────────────────────────────────────────────────────────
function handleUnauthorized() {
  localStorage.removeItem('authToken');
  localStorage.removeItem('user');
  localStorage.removeItem('isAuthenticated');
  window.location.href = '/login';
}

function buildHeaders(options = {}) {
  const token = localStorage.getItem('authToken');
  const isFormData = options.body instanceof FormData;
  return {
    ...(!isFormData && { 'Content-Type': 'application/json' }),
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options.headers,
  };
}

async function parseResponse(response) {
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const err = new Error(data.message || `HTTP ${response.status}`);
    err.status = response.status;
    err.data = data;
    throw err;
  }
  return data;
}

// ── apiFetch: authenticated fetch wrapper ────────────────────────────────────
export async function apiFetch(path, options = {}) {
  const response = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: buildHeaders(options),
  });

  if (response.status === 401) {
    handleUnauthorized();
    return;
  }

  return parseResponse(response);
}

// ── publicFetch: no auth token ───────────────────────────────────────────────
export async function publicFetch(path, options = {}) {
  const isFormData = options.body instanceof FormData;
  const headers = {
    ...(!isFormData && { 'Content-Type': 'application/json' }),
    ...options.headers,
  };
  const response = await fetch(`${BASE_URL}${path}`, { ...options, headers });
  return parseResponse(response);
}

// ── buildQS: query-string helper ─────────────────────────────────────────────
export function buildQS(params = {}) {
  const qs = new URLSearchParams(
    Object.fromEntries(
      Object.entries(params).filter(([, v]) => v !== '' && v != null),
    ),
  ).toString();
  return qs ? `?${qs}` : '';
}

export default axiosClient;