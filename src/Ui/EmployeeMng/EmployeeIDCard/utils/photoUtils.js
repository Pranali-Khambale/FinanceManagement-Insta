import { BASE_URL as API_URL } from "../../../../api/client";

// ─────────────────────────────────────────────────────────────────────────────
// PHOTO URL STRATEGY
//
// Instead of trying to resolve S3 keys on the frontend (which breaks when
// presigned URLs expire or when the backend returns raw keys), we use a
// dedicated backend endpoint:
//
//   GET /api/employees/:id/photo
//
// This endpoint always does a fresh 302 redirect to the latest S3 presigned
// URL, so the <img src> always works regardless of when the employee was
// created or how the photo was uploaded.
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Build the photo proxy URL for a given employee.
 * Uses the numeric DB id when available (most reliable), falls back to
 * the human-readable employee_id string.
 */
export const getPhotoProxyUrl = (employee) => {
  if (!employee) return null;
  const id = employee.id || employee.employee_id;
  if (!id) return null;
  return `${API_URL}/employees/${id}/photo`;
};

/**
 * uploadPhotoToDb
 * POST /api/employees/:id/upload-photo
 */
export const uploadPhotoToDb = async (employeeDbId, file) => {
  const formData = new FormData();
  formData.append("photo", file);
  const response = await fetch(
    `${API_URL}/employees/${employeeDbId}/upload-photo`,
    { method: "POST", body: formData },
  );
  const data = await response.json();
  if (!response.ok || !data.success)
    throw new Error(data.message || "Upload failed");
  return data;
};

export { API_URL };