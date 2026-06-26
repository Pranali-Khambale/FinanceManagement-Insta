// ─────────────────────────────────────────────────────────────────────────────
// FILE: src/utils/s3Utils.js  (Frontend)
// PATH: C:\Users\Admin\OneDrive\Desktop\FinanceApp\insta-finance-fe\src\utils\s3Utils.js
// ─────────────────────────────────────────────────────────────────────────────

const API_BASE = import.meta.env.VITE_API_BASE_URL || "";

/**
 * Fetches a short-lived presigned URL from the backend for a private S3 file.
 *
 * Handles three input cases:
 *   1. S3 key  (e.g. "uploads/advance-payment/abc.png")
 *   2. Full S3 URL (extracts the key automatically)
 *   3. null / undefined / "" → returns null
 *
 * @param {string|null|undefined} keyOrUrl
 * @param {number} [expiresIn=3600] — seconds, passed to backend
 * @returns {Promise<string|null>} presigned URL or null on failure
 *
 * @example
 *   const url = await getPresignedUrl("uploads/advance-payment/abc.png");
 *   // → "https://bucket.s3.amazonaws.com/uploads/...?X-Amz-Signature=..."
 */
export async function getPresignedUrl(keyOrUrl, expiresIn = 3600) {
  if (!keyOrUrl) return null;

  // Extract key from full S3 URL if a full URL was passed
  let key = String(keyOrUrl);
  if (key.startsWith("http")) {
    try {
      const urlObj = new URL(key);
      key = urlObj.pathname.replace(/^\//, ""); // strip leading slash
    } catch {
      console.warn("[s3Utils] Could not parse URL:", keyOrUrl);
      return null;
    }
  } else {
    key = key.replace(/^\/+/, ""); // strip leading slashes from raw key
  }

  try {
    const res = await fetch(
      `${API_BASE}/api/s3/presigned-url?key=${encodeURIComponent(key)}&expires=${expiresIn}`,
    );

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      console.error("[s3Utils] Server error:", res.status, body.error);
      return null;
    }

    const data = await res.json();
    return data.url || null;
  } catch (err) {
    console.error(
      "[s3Utils] Network error fetching presigned URL:",
      err.message,
    );
    return null;
  }
}

/**
 * Synchronous helper — builds a public S3 URL from a key.
 *
 * ⚠️  Only use this if your bucket is PUBLIC.
 * For private buckets (recommended), use getPresignedUrl() instead.
 *
 * @param {string|null|undefined} keyOrUrl
 * @returns {string|null}
 */
export function getS3Url(keyOrUrl) {
  if (!keyOrUrl) return null;

  if (
    String(keyOrUrl).startsWith("http://") ||
    String(keyOrUrl).startsWith("https://")
  ) {
    return keyOrUrl;
  }

  const BUCKET = import.meta.env.VITE_AWS_BUCKET_NAME || "";
  const REGION = import.meta.env.VITE_AWS_REGION || "";

  if (!BUCKET || !REGION) {
    console.warn(
      "[s3Utils] VITE_AWS_BUCKET_NAME or VITE_AWS_REGION not set in .env",
    );
    return null;
  }

  const cleanKey = String(keyOrUrl).replace(/^\/+/, "");
  return `https://${BUCKET}.s3.${REGION}.amazonaws.com/${cleanKey}`;
}

/**
 * Returns true if the value is already a full URL (http/https).
 */
export function isFullUrl(value) {
  return (
    typeof value === "string" &&
    (value.startsWith("http://") || value.startsWith("https://"))
  );
}

// Default export is the async presigned URL function (used by DocCard/resolveFileUrl)
export default getPresignedUrl;
