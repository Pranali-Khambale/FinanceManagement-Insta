// src/api/client.js
import axios from "axios";

export const BASE_URL = 'https://api-fin.instagrp.com/api';
// export const BASE_URL = "http://192.168.1.17:5000/api";
// export const BASE_URL = "http://localhost:5000/api";

// ── Axios instance ───────────────────────────────────────────────────────────
export const axiosClient = axios.create({
  baseURL: BASE_URL,
  headers: { "Content-Type": "application/json" },
  timeout: 30_000,
});

axiosClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("authToken");
    if (token) config.headers.Authorization = `Bearer ${token}`;
    if (config.data instanceof FormData) delete config.headers["Content-Type"];
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
  localStorage.removeItem("authToken");
  localStorage.removeItem("user");
  localStorage.removeItem("isAuthenticated");
  window.location.href = "/login";
}

function buildHeaders(options = {}) {
  const token = localStorage.getItem("authToken");
  const isFormData = options.body instanceof FormData;
  return {
    ...(!isFormData && { "Content-Type": "application/json" }),
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options.headers,
  };
}

async function parseResponse(response) {
  const data = await response.json().catch(() => ({}));

  console.log("[API] Status:", response.status);
  console.log("[API] Response:", data);

  if (!response.ok) {
    // Include detail in the error message so it surfaces in the UI
    const detailSuffix = data.detail ? ` — ${data.detail}` : "";
    const message = (data.message || `HTTP ${response.status}`) + detailSuffix;
    const err = new Error(message);
    err.status = response.status;
    err.data = data;
    throw err;
  }

  // Always return data — callers check data.success themselves.
  // Do NOT throw on success:false here; business-logic failures (e.g.
  // "Employee not found", conflict errors) return success:false on HTTP 200
  // and the caller needs to read data.message to show the right toast.
  return data;
}

// ── apiFetch: authenticated fetch wrapper ────────────────────────────────────
export async function apiFetch(path, options = {}) {
  const response = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: buildHeaders(options),
  });

  // Only redirect to /login on 401 if there is no token at all (genuine
  // session expiry). If we got a 401 with a token present, let parseResponse
  // throw so the caller can show the error message instead of a silent redirect.
  if (response.status === 401) {
    const token = localStorage.getItem("authToken");
    if (!token) {
      handleUnauthorized();
      return;
    }
    // Token exists but backend still returned 401 — fall through to
    // parseResponse which will throw with the backend's error message.
  }

  return parseResponse(response);
}

// ── publicFetch: no auth token ───────────────────────────────────────────────
export async function publicFetch(path, options = {}) {
  const isFormData = options.body instanceof FormData;
  const headers = {
    ...(!isFormData && { "Content-Type": "application/json" }),
    ...options.headers,
  };
  const response = await fetch(`${BASE_URL}${path}`, { ...options, headers });
  return parseResponse(response);
}

// ── buildQS: query-string helper ─────────────────────────────────────────────
export function buildQS(params = {}) {
  const qs = new URLSearchParams(
    Object.fromEntries(
      Object.entries(params).filter(([, v]) => v !== "" && v != null),
    ),
  ).toString();
  return qs ? `?${qs}` : "";
}

// ════════════════════════════════════════════════════════════════════════════
// GLOBAL FETCH INTERCEPTOR
// ────────────────────────────────────────────────────────────────────────────
// Some components in this codebase call the browser's native `fetch()`
// directly (bypassing `apiFetch`) when hitting admin-protected endpoints —
// e.g. POST /api/registrations/:id/reject-rejoin — without attaching the
// Authorization header. This causes "No token provided." 401 errors even
// though the user IS logged in and `authToken` exists in localStorage.
//
// Rather than hunt down and patch every raw `fetch()` call across the app,
// we patch `window.fetch` ONCE here (this module is imported app-wide via
// `axiosClient`/`apiFetch`, so it always runs early). For any request whose
// URL targets our own API (BASE_URL), we automatically inject
// `Authorization: Bearer <authToken>` if it isn't already present.
//
// This is purely additive — it never removes or overrides a header that a
// caller explicitly set, and it does nothing for requests to other origins
// (e.g. S3 presigned URLs, external services).
// ════════════════════════════════════════════════════════════════════════════
if (typeof window !== "undefined" && !window.__authFetchPatched) {
  const originalFetch = window.fetch.bind(window);

  window.fetch = (input, init = {}) => {
    try {
      const url =
        typeof input === "string"
          ? input
          : input instanceof Request
            ? input.url
            : String(input);

      const isApiRequest = url.startsWith(BASE_URL);

      if (isApiRequest) {
        const token = localStorage.getItem("authToken");

        if (token) {
          // Normalise headers into a plain object so we can check/merge safely
          const existingHeaders = new Headers(init.headers || {});

          if (!existingHeaders.has("Authorization")) {
            existingHeaders.set("Authorization", `Bearer ${token}`);
          }

          init = { ...init, headers: existingHeaders };
        }
      }
    } catch (e) {
      // Never let header-injection break the actual request
      console.warn("[authFetchPatch] failed to inject auth header:", e.message);
    }

    return originalFetch(input, init);
  };

  window.__authFetchPatched = true;
  console.log("[client.js] Global fetch patched to auto-attach authToken");
}

export default axiosClient;
