// src/utils/s3Utils.js
// ─── Frontend helper: convert S3 keys → public HTTPS URLs ────────────────────
//
// The backend stores only the S3 *key* in the database (e.g.
//   "uploads/employee_docs/a1b2c3-uuid.pdf"
//   "uploads/advance-payment/2026-05/xyz.png"
// ).
// This helper turns that key into the full URL the browser can load.
//
// REQUIRED env vars (Vite / CRA):
//   VITE_AWS_BUCKET_NAME   or   REACT_APP_AWS_BUCKET_NAME
//   VITE_AWS_REGION        or   REACT_APP_AWS_REGION
//
// If the env vars are not set it falls back to the values you have in .env.
// ─────────────────────────────────────────────────────────────────────────────

const BUCKET = import.meta.env.VITE_AWS_BUCKET_NAME || "";

const REGION = import.meta.env.VITE_AWS_REGION || "";
/**
 * Converts an S3 key (as stored in the DB) into a publicly accessible URL.
 *
 * Handles three cases:
 *   1. Already a full https:// URL  → returned as-is
 *   2. An S3 key string             → prefixed with the bucket/region URL
 *   3. null / undefined / ""        → returns null
 *
 * @param {string|null|undefined} keyOrUrl
 * @returns {string|null}
 *
 * @example
 *   getS3Url('uploads/employee_docs/abc.pdf')
 *   // → 'https://my-bucket.s3.ap-south-1.amazonaws.com/uploads/employee_docs/abc.pdf'
 *
 *   getS3Url('https://already-full-url.com/file.pdf')
 *   // → 'https://already-full-url.com/file.pdf'  (unchanged)
 */
export function getS3Url(keyOrUrl) {
  if (!keyOrUrl) return null;

  // Already a full URL — return unchanged
  if (keyOrUrl.startsWith("http://") || keyOrUrl.startsWith("https://")) {
    return keyOrUrl;
  }

  if (!BUCKET || !REGION) {
    console.warn(
      "[s3Utils] BUCKET or REGION env vars not set. Cannot build S3 URL.",
    );
    return null;
  }

  // Strip any leading slash to keep the key clean
  const cleanKey = keyOrUrl.replace(/^\/+/, "");
  return `https://${BUCKET}.s3.${REGION}.amazonaws.com/${cleanKey}`;
}

/**
 * Returns true if the value is already a full URL (http/https).
 * Useful for conditional rendering.
 */
export function isFullUrl(value) {
  return (
    typeof value === "string" &&
    (value.startsWith("http://") || value.startsWith("https://"))
  );
}

export default getS3Url;
