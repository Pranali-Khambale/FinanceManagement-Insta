// ─────────────────────────────────────────────────────────────────────────────
// FILE: src/Ui/AdvancePayment/ViewDetailModal/utils/index.js  (Frontend)
// PATH: C:\Users\Admin\OneDrive\Desktop\FinanceApp\insta-finance-fe\src\Ui\AdvancePayment\ViewDetailModal\utils\index.js
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
 * @param {object} [options]
 * @param {string} [options.filename] - if provided, the resulting URL forces
 *        the browser to DOWNLOAD the file (Content-Disposition: attachment)
 *        instead of displaying it inline, saved under this name. Pass this
 *        when resolving a URL for a "Download" click. Omit it when resolving
 *        a URL for preview/lightbox display.
 * @returns {Promise<string|null>}
 */
export async function resolveFileUrl(keyOrUrl, options = {}) {
  if (!keyOrUrl) return null;

  // Blob URLs (created from local File objects) are already usable — skip fetch
  if (String(keyOrUrl).startsWith("blob:")) return keyOrUrl;

  // Everything else (S3 key or full S3 URL) → get presigned URL from backend.
  // Passing { filename } here forces S3 to send Content-Disposition: attachment,
  // so the browser actually saves the file instead of opening it in a tab.
  return await getPresignedUrl(keyOrUrl, 3600, options);
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

function getExtFromName(name) {
  if (!name || typeof name !== "string") return "";
  const clean = name.split("?")[0];
  const parts = clean.split(".");
  return parts.length > 1 ? parts.pop().toLowerCase() : "";
}

/**
 * Build a clean download filename for a document, falling back to a
 * label-based name with a guessed extension if none is available.
 * @param {string} name - Original file name (or null)
 * @param {string} url - The resolved URL (used to guess extension if name has none)
 * @param {string} fallbackLabel - Human-readable label, e.g. "Payment Screenshot"
 */
export function buildDownloadFilename(name, url, fallbackLabel = "document") {
  if (name) return name;
  const ext = getExtFromName(name) || getExtFromName(url) || "";
  const safeLabel = fallbackLabel.trim().replace(/[^a-z0-9]+/gi, "_");
  return ext ? `${safeLabel}.${ext}` : safeLabel;
}

/**
 * Trigger a save-to-disk for a URL that's already usable directly (e.g. a
 * blob: URL from a local File, or a presigned S3 URL that already has
 * Content-Disposition: attachment set via resolveFileUrl's filename option).
 * No fetch/blob conversion needed — the browser + S3's response header do
 * the actual "save as" work.
 *
 * @param {string} url
 * @param {string} filename
 */
export function triggerDownload(url, filename) {
  const a = document.createElement("a");
  a.href = url;
  a.download = filename || "download"; // no-op for cross-origin, harmless
  a.target = "_blank"; // S3's attachment header does the real work
  a.rel = "noreferrer";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}
