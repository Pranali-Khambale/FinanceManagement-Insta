// ─────────────────────────────────────────────────────────────────────────────
// FILE: src/utils/s3Utils.js  (Frontend)
// PATH: C:\Users\Admin\OneDrive\Desktop\FinanceApp\insta-finance-fe\src\utils\s3Utils.js
// ─────────────────────────────────────────────────────────────────────────────

const API_BASE = import.meta.env.VITE_API_BASE_URL || "";

/**
 * Fetches a short-lived presigned URL from the backend for a private S3 file.
 *
 * Handles all path formats found in the DB:
 *   1. Full S3 URL (old records):
 *      "https://hrms-insta.s3.ap-south-1.amazonaws.com/uploads/advance-payment/uuid.png"
 *      → extracts key: "uploads/advance-payment/uuid.png"
 *
 *   2. Bare key without uploads/ prefix (new records before this fix):
 *      "advance-payment/uuid.png"
 *      → sends key as-is: "advance-payment/uuid.png"
 *
 *   3. Full S3 URL (new records after this fix):
 *      "https://hrms-insta.s3.ap-south-1.amazonaws.com/advance-payment/uuid.png"
 *      → extracts key: "advance-payment/uuid.png"
 *
 *   4. null / undefined / "" → returns null
 *
 * @param {string|null|undefined} keyOrUrl
 * @param {number} [expiresIn=3600] — seconds, passed to backend
 * @returns {Promise<string|null>} presigned URL or null on failure
 */
export async function getPresignedUrl(keyOrUrl, expiresIn = 3600) {
  if (!keyOrUrl) return null;

  let key = String(keyOrUrl).trim();

  // Full S3 URL → extract just the pathname as the key
  if (key.startsWith("http://") || key.startsWith("https://")) {
    try {
      key = new URL(key).pathname.replace(/^\//, ""); // strip leading "/"
    } catch {
      console.warn("[s3Utils] Could not parse URL:", keyOrUrl);
      return null;
    }
  } else {
    // Bare key — strip any accidental leading slashes
    key = key.replace(/^\/+/, "");
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
    return keyOrUrl; // already a full URL
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
