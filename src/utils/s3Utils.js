// ─────────────────────────────────────────────────────────────────────────────
// FILE: src/utils/s3Utils.js  (Frontend)
// ─────────────────────────────────────────────────────────────────────────────

const API_BASE = import.meta.env.VITE_API_URL || "";

/**
 * @param {string} keyOrUrl - S3 key or full S3 URL
 * @param {number} expiresIn - seconds the URL stays valid
 * @param {object} [options]
 * @param {string} [options.filename] - if provided, the presigned URL will
 *        force the browser to download (not preview) the file, saved under
 *        this filename. Pass this whenever the URL is used for a "Download"
 *        button. Omit it for preview/lightbox usage so it displays inline.
 */
export async function getPresignedUrl(
  keyOrUrl,
  expiresIn = 3600,
  options = {},
) {
  if (!keyOrUrl) return null;

  let key = String(keyOrUrl).trim();

  // Full S3 URL → extract just the key
  if (key.startsWith("http://") || key.startsWith("https://")) {
    try {
      key = new URL(key).pathname.replace(/^\//, "");
    } catch {
      console.warn("[s3Utils] Could not parse URL:", keyOrUrl);
      return null;
    }
  } else {
    key = key.replace(/^\/+/, "");
  }

  try {
    const params = new URLSearchParams({
      key,
      expires: String(expiresIn),
    });
    if (options.filename) params.set("filename", options.filename);

    // ✅ No extra "/api" here — API_BASE already contains it
    const res = await fetch(
      `${API_BASE}/s3/presigned-url?${params.toString()}`,
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
 * Use this if your bucket is PUBLIC and you don't need presigned URLs.
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

export default getPresignedUrl;
