import { BASE_URL as BASE_API } from "../api/client";
import { getS3Url } from "./s3Utils";

/** In-memory cache: S3 key → { url, expiresAt } */
const _presignCache = new Map();

/**
 * getDocUrl(keyOrPath)
 *
 * Converts any stored file_path into a URL the browser can load:
 *   • Already http(s)://  → returned as-is (via getS3Url)
 *   • Starts with /       → legacy local path → prepend server base URL
 *   • Anything else       → treated as S3 key → fetch a presigned URL
 *
 * Presigned URLs are cached for 50 minutes (backend signs for 3 600 s).
 * Returns null for falsy input.
 */
export async function getDocUrl(keyOrPath) {
  if (!keyOrPath) return null;

  const direct = getS3Url(keyOrPath);
  if (
    direct &&
    (keyOrPath.startsWith("http://") || keyOrPath.startsWith("https://"))
  ) {
    return direct;
  }

  if (keyOrPath.startsWith("/")) {
    const serverBase = BASE_API.replace("/api", "");
    return `${serverBase}${keyOrPath}`;
  }

  // S3 key — try cache first
  const now = Date.now();
  const cached = _presignCache.get(keyOrPath);
  if (cached && cached.expiresAt > now) return cached.url;

  try {
    const res = await fetch(
      `${BASE_API}/employees/s3/presign?key=${encodeURIComponent(keyOrPath)}`,
    );
    const data = await res.json();
    if (data.success && data.url) {
      _presignCache.set(keyOrPath, {
        url: data.url,
        expiresAt: now + 50 * 60 * 1000,
      });
      return data.url;
    }
  } catch {
    // Silently fall through — return null
  }
  return null;
}

/**
 * Synchronous version — returns cached presigned URL or a legacy URL.
 * Use only as an initial useState() value; always follow up with getDocUrl().
 */
export function fullUrl(keyOrPath) {
  if (!keyOrPath) return null;
  if (keyOrPath.startsWith("https://") || keyOrPath.startsWith("http://"))
    return keyOrPath;
  if (keyOrPath.startsWith("/")) {
    const serverBase = BASE_API.replace("/api", "");
    return `${serverBase}${keyOrPath}`;
  }
  return _presignCache.get(keyOrPath)?.url ?? null;
}
