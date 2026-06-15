// src/Ui/EmployeeMng/ReviewedDocsSection/utils/fileHelpers.js
import { BASE_URL as BASE_API } from "../../../../api/client";
import { getAuthHeaders, getPresignedUrl, extractS3Key } from "./urlHelpers";

export function getFileType(path = "", mime = "") {
  const p = String(path || "").toLowerCase();
  const m = String(mime || "").toLowerCase();
  if (m.includes("pdf") || p.endsWith(".pdf")) return "pdf";
  if (m.includes("image") || /\.(jpg|jpeg|png|gif|webp|bmp|svg)$/.test(p))
    return "image";
  return "other";
}

// ── Image / PDF loading for PDF generation ────────────────────────────────────
/**
 * FIX: Always extract the raw S3 key before passing to the proxy endpoint.
 * Registration docs have file_path as full HTTPS URLs (transformed by
 * employeeController.resolveDocUrls / getS3Url). The proxy expects raw keys.
 */
export async function fetchBytesViaProxy(s3KeyOrUrl) {
  // FIX: if it's a staged file path (blob:) or object URL, fetch directly
  if (s3KeyOrUrl.startsWith("blob:")) {
    const resp = await fetch(s3KeyOrUrl);
    if (!resp.ok) throw new Error(`Blob fetch failed: ${resp.status}`);
    return resp.arrayBuffer();
  }

  // FIX: extract the raw S3 key — handles both raw keys and full HTTPS URLs
  const rawKey = extractS3Key(s3KeyOrUrl);

  // If it's still a full URL (e.g. CloudFront public URL or truly external),
  // try fetching directly without the proxy
  if (rawKey.startsWith("http://") || rawKey.startsWith("https://")) {
    const resp = await fetch(rawKey, { cache: "no-store" });
    if (!resp.ok)
      throw new Error(`Direct fetch HTTP ${resp.status} – ${resp.statusText}`);
    return resp.arrayBuffer();
  }

  // Normal flow: use the proxy endpoint with the raw key
  const proxyUrl = `${BASE_API}/employees/s3/proxy?key=${encodeURIComponent(rawKey)}`;
  try {
    const resp = await fetch(proxyUrl, {
      headers: getAuthHeaders(),
      credentials: "include",
      cache: "no-store",
    });
    if (!resp.ok) {
      const body = await resp.text().catch(() => "");
      throw new Error(`Proxy ${resp.status}: ${body.slice(0, 120)}`);
    }
    return resp.arrayBuffer();
  } catch (proxyErr) {
    console.warn(
      "[PDF] proxy failed, falling back to presigned URL:",
      proxyErr.message,
    );
    // getPresignedUrl already handles key extraction internally
    const presigned = await getPresignedUrl(rawKey);
    if (!presigned)
      throw new Error(
        "Could not resolve document URL (proxy + presign both failed)",
      );
    const resp = await fetch(presigned, { cache: "no-store" });
    if (!resp.ok)
      throw new Error(`S3 direct HTTP ${resp.status} – ${resp.statusText}`);
    return resp.arrayBuffer();
  }
}

export async function fetchImageBytes(s3KeyOrUrl) {
  const buf = await fetchBytesViaProxy(s3KeyOrUrl);
  return new Uint8Array(buf);
}

export async function getImageBytesWithFallback(s3KeyOrUrl) {
  return fetchImageBytes(s3KeyOrUrl);
}

export async function fetchPdfBytes(s3KeyOrUrl) {
  return fetchBytesViaProxy(s3KeyOrUrl);
}

export function convertBlobUrlViaCanvas(blobUrl) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      canvas.getContext("2d").drawImage(img, 0, 0);
      canvas.toBlob((blob) => {
        if (!blob) {
          reject(new Error("toBlob returned null"));
          return;
        }
        blob
          .arrayBuffer()
          .then((buf) => resolve(new Uint8Array(buf)))
          .catch(reject);
      }, "image/png");
    };
    img.onerror = () => reject(new Error("WebP blob image failed to load"));
    img.src = blobUrl;
  });
}

export { BASE_API };