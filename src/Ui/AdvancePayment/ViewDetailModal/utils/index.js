// ─────────────────────────────────────────────────────────────────────────────
// FILE: src/Ui/AdvancePayment/ViewDetailModal/utils.js  (Frontend)
// PATH: C:\Users\Admin\OneDrive\Desktop\FinanceApp\insta-finance-fe\src\Ui\AdvancePayment\ViewDetailModal\utils.js
// ─────────────────────────────────────────────────────────────────────────────
import { getPresignedUrl } from "../../../../utils/s3Utils";

/**
 * Resolves any S3 key / full S3 URL / blob URL to a displayable URL.
 *
 * - Blob URL (local File preview)  → returned immediately, no fetch
 * - Full https:// URL              → fetches a fresh presigned URL from backend
 * - S3 key string                  → fetches a presigned URL from backend
 * - null / undefined               → returns null
 *
 * @param {string|null|undefined} keyOrUrl
 * @returns {Promise<string|null>}
 */
export async function resolveFileUrl(keyOrUrl) {
  if (!keyOrUrl) return null;

  // Blob URLs (created from local File objects) are already usable — skip fetch
  if (String(keyOrUrl).startsWith("blob:")) return keyOrUrl;

  // Everything else (S3 key or full S3 URL) → get presigned URL from backend
  return await getPresignedUrl(keyOrUrl);
}

/**
 * Formats a date string or Date object for display.
 * Returns "—" for null/undefined values.
 *
 * @param {string|Date|null|undefined} value
 * @param {Intl.DateTimeFormatOptions} [opts]
 * @returns {string}
 */
export function fmt(
  value,
  opts = { day: "2-digit", month: "short", year: "numeric" },
) {
  if (!value) return "—";
  try {
    return new Intl.DateTimeFormat("en-IN", opts).format(new Date(value));
  } catch {
    return String(value);
  }
}
