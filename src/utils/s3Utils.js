// ─────────────────────────────────────────────────────────────────────────────
// FILE: src/utils/s3Utils.js  (Frontend)
// ─────────────────────────────────────────────────────────────────────────────

const API_BASE = import.meta.env.VITE_API_URL || "";

export async function getPresignedUrl(keyOrUrl, expiresIn = 3600) {
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
    // ✅ No extra "/api" here — API_BASE already contains it
    const res = await fetch(
      `${API_BASE}/s3/presigned-url?key=${encodeURIComponent(key)}&expires=${expiresIn}`,
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
