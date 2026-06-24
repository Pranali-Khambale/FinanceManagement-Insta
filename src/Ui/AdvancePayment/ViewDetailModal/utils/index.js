
import { getS3Url } from "../../../../utils/s3Utils"; // adjust path if needed

/**
 * Resolves a file path or S3 key into a full URL.
 * @param {string|null} filePathOrKey
 * @returns {string|null}
 */
export function resolveFileUrl(filePathOrKey) {
  if (!filePathOrKey) return null;
  if (/^(blob:|https?:\/\/)/.test(filePathOrKey)) return filePathOrKey;
  return getS3Url(filePathOrKey);
}

/**
 * Formats a number as Indian currency string.
 * @param {number|string} n
 * @returns {string}
 */
export const fmt = (n) => `₹${Number(n).toLocaleString("en-IN")}`;
