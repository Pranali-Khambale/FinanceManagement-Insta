// src/Ui/EmployeeMng/ReviewedDocsSection/utils/urlHelpers.js
import { BASE_URL as BASE_API } from "../../../../api/client";
import { getS3Url } from "../../../../utils/s3Utils";

// ── URL resolver ──────────────────────────────────────────────────────────────
export function fullUrl(path) {
  if (!path) return null;
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  return getS3Url(path);
}

// ── S3 key extractor ──────────────────────────────────────────────────────────
// CRITICAL FIX: employeeController.resolveDocUrls() converts raw S3 keys
// (e.g. "uploads/employee_docs/file.png") into full HTTPS URLs before
// returning registration docs to the frontend. But the proxy endpoint
// (/api/employees/s3/proxy?key=...) and presign endpoint
// (/api/employees/s3/presign?key=...) both expect a raw S3 key — NOT a full URL.
//
// This function strips the S3 / CloudFront host prefix so we always pass
// raw keys to backend endpoints, regardless of doc source (KYE, HR, Reg).
//
// Handles:
//   https://<bucket>.s3.<region>.amazonaws.com/<key>   → <key>
//   https://<bucket>.s3.amazonaws.com/<key>            → <key>
//   https://<cloudfront-id>.cloudfront.net/<key>       → <key>
//   https://any-custom-cdn.example.com/<key>           → <key>  (falls back gracefully)
//   uploads/employee_docs/file.png                     → unchanged (already a key)
export function extractS3Key(urlOrKey) {
  if (!urlOrKey) return urlOrKey;
  // Already a raw key (no protocol) — return as-is
  if (!urlOrKey.startsWith("http://") && !urlOrKey.startsWith("https://")) {
    return urlOrKey;
  }
  try {
    const parsed = new URL(urlOrKey);
    // pathname starts with "/" — strip it to get the S3 key
    // e.g. "/uploads/employee_docs/file.png" → "uploads/employee_docs/file.png"
    return parsed.pathname.replace(/^\//, "");
  } catch {
    return urlOrKey;
  }
}

// Module-level presign cache: S3 key → { url, expiresAt }
const _presignCache = new Map();

// ── Auth helper — used by every fetch call in this module ─────────────────────
export function getAuthHeaders() {
  const token =
    typeof localStorage !== "undefined"
      ? localStorage.getItem("authToken")
      : null;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

/**
 * Returns a short-lived presigned S3 URL for the given file_path key.
 * Results are cached for 50 min. Falls back to fullUrl() on failure.
 *
 * FIX: always extract the raw S3 key before calling the presign endpoint,
 * because registration docs arrive with file_path already resolved to a
 * full HTTPS URL by employeeController.resolveDocUrls().
 */
export async function getPresignedUrl(filePath) {
  if (!filePath) return null;

  // FIX: extract the raw key even if filePath is already a full URL
  const rawKey = extractS3Key(filePath);

  // If it's still a full URL after extraction (shouldn't happen, but safety check),
  // return it directly — it's already accessible
  if (rawKey.startsWith("http://") || rawKey.startsWith("https://")) {
    return rawKey;
  }

  const now = Date.now();
  const cached = _presignCache.get(rawKey);
  if (cached && cached.expiresAt > now) return cached.url;

  try {
    const res = await fetch(
      `${BASE_API}/employees/s3/presign?key=${encodeURIComponent(rawKey)}`,
      { headers: getAuthHeaders(), credentials: "include" },
    );
    if (!res.ok) {
      console.warn("[presign] HTTP", res.status, "for key:", rawKey);
      return fullUrl(rawKey);
    }
    const data = await res.json();
    if (data.success && data.url) {
      _presignCache.set(rawKey, {
        url: data.url,
        expiresAt: now + 50 * 60 * 1000,
      });
      return data.url;
    }
    console.warn("[presign] no url in response:", data);
  } catch (e) {
    console.warn("[presign] failed for", rawKey, "–", e.message);
  }
  return fullUrl(rawKey);
}