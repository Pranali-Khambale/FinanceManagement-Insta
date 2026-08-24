// src/utils/downloadFile.js
// ─────────────────────────────────────────────────────────────────────────────
// WHY THIS EXISTS:
// `<a href={presignedS3Url} download>` does NOT work for cross-origin URLs.
// Browsers silently ignore the `download` attribute whenever the href points
// to a different origin (which a presigned S3 URL always does) — so instead
// of saving the file, the browser just opens it in a new tab.
//
// FIX: fetch the file ourselves as a Blob, turn that into a same-origin
// `blob:` URL, and click a temporary <a download> pointing at THAT. Blob URLs
// are always same-origin, so the download attribute is respected and the
// file is saved to disk with whatever filename we choose.
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Force-download a file from a (possibly cross-origin) URL, saving it with
 * the given filename.
 * @param {string} url - The file URL (presigned S3 URL, API URL, etc.)
 * @param {string} filename - Filename to save as (with extension)
 */
export async function downloadFile(url, filename) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch file (${res.status})`);
  const blob = await res.blob();

  const blobUrl = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = blobUrl;
  a.download = filename || "document";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);

  // Give the browser a moment to pick up the download before revoking.
  setTimeout(() => window.URL.revokeObjectURL(blobUrl), 2000);
}

/** Get a lowercase file extension from a filename, or "" if none found. */
function getExtFromName(name) {
  if (!name || typeof name !== "string") return "";
  const parts = name.split(".");
  return parts.length > 1 ? parts.pop().toLowerCase() : "";
}

/** Guess an extension from a MIME type as a fallback. */
function getExtFromMime(mime) {
  const m = (mime || "").toLowerCase();
  if (m.includes("pdf")) return "pdf";
  if (m.includes("jpeg") || m.includes("jpg")) return "jpg";
  if (m.includes("png")) return "png";
  if (m.includes("webp")) return "webp";
  if (m.includes("gif")) return "gif";
  return "";
}

/**
 * Build a clean, human-readable download filename for a document, e.g.
 * "PAN_Card.jpg" instead of "IMG_20260615_192001_308_AI.jpg".
 * @param {object} doc - The document object (file_name, mime_type, etc.)
 * @param {string} label - Human-readable label (e.g. "PAN Card")
 */
export function buildDownloadFilename(doc, label) {
  const rawName = doc?.file_name || doc?.name || "";
  const ext =
    getExtFromName(rawName) ||
    getExtFromMime(doc?.mime_type || doc?.mimeType) ||
    "";
  const safeLabel = (label || "document").trim().replace(/[^a-z0-9]+/gi, "_");
  return ext ? `${safeLabel}.${ext}` : safeLabel;
}
