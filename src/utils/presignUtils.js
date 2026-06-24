import { BASE_URL as BASE_API } from "@/api/client";
import { getS3Url } from "./s3Utils";

const _presignCache = new Map();

export function getAuthHeaders() {
  const token =
    typeof localStorage !== "undefined"
      ? localStorage.getItem("authToken")
      : null;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export function extractS3Key(urlOrKey) {
  if (!urlOrKey) return urlOrKey;
  if (!urlOrKey.startsWith("http://") && !urlOrKey.startsWith("https://")) {
    return urlOrKey;
  }
  try {
    const parsed = new URL(urlOrKey);
    return parsed.pathname.replace(/^\//, "");
  } catch {
    return urlOrKey;
  }
}

export function fullUrl(path) {
  if (!path) return null;
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  return getS3Url(path);
}

export async function getPresignedUrl(filePath) {
  if (!filePath) return null;
  const rawKey = extractS3Key(filePath);
  if (rawKey.startsWith("http://") || rawKey.startsWith("https://")) {
    return rawKey;
  }
  const now = Date.now();
  const cached = _presignCache.get(rawKey);
  if (cached && cached.expiresAt > now) return cached.url;
  try {
    const res = await fetch(
      `${BASE_API}/employees/s3/presign?key=${encodeURIComponent(rawKey)}`,
      { headers: getAuthHeaders() },
    );
    if (!res.ok) return fullUrl(rawKey);
    const data = await res.json();
    if (data.success && data.url) {
      _presignCache.set(rawKey, {
        url: data.url,
        expiresAt: now + 50 * 60 * 1000,
      });
      return data.url;
    }
  } catch {
    // intentionally silent — fall through to fullUrl
  }
  return fullUrl(rawKey);
}
