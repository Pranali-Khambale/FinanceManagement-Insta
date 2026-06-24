// ─── DOC TYPE ALIASES ────────────────────────────────────────────────────────
// Backend stores document_type in snake_case ("aadhar_card", "bank_passbook").
// DOC_DEFS use camelCase ("aadharCard", "bankPassbook").
// This map normalizes snake_case → camelCase before matching.

export const DOC_TYPE_ALIASES = {
  photo: "idPhoto",
  id_photo: "idPhoto",
  idPhoto: "idPhoto",
  aadhar_card: "aadharCard",
  aadharCard: "aadharCard",
  pan_card: "panCard",
  panCard: "panCard",
  resume: "resume",
  bank_passbook: "bankPassbook",
  bankPassbook: "bankPassbook",
  medical_certificate: "medicalCertificate",
  medicalCertificate: "medicalCertificate",
  academic_records: "academicRecords",
  academicRecords: "academicRecords",
  payslip: "payslip",
  pay_slip: "payslip",
  other_certificates: "otherCertificates",
  otherCertificates: "otherCertificates",
  farm_to_cli: "farmToCli",
  farm_to_cli_certificate: "farmToCli",
  farmToCli: "farmToCli",
};

/**
 * Normalize a backend doc type string to camelCase.
 * Falls back to generic snake_case → camelCase conversion.
 */
export function normalizeDocType(t) {
  if (!t) return t;
  if (DOC_TYPE_ALIASES[t]) return DOC_TYPE_ALIASES[t];
  return t.replace(/_([a-z])/g, (_, c) => c.toUpperCase());
}

// ─── DOC META ────────────────────────────────────────────────────────────────

export const DOC_META = {
  signed_kye: {
    label: "Signed KYE Form",
    color: {
      bg: "#eff6ff",
      border: "#bfdbfe",
      text: "#1d4ed8",
      dot: "#3b82f6",
    },
  },
  bgv_form: {
    label: "BGV Form",
    color: {
      bg: "#f5f3ff",
      border: "#ddd6fe",
      text: "#6d28d9",
      dot: "#7c3aed",
    },
  },
  email_screenshot: {
    label: "Approval Email Screenshot",
    color: {
      bg: "#f0fdf4",
      border: "#bbf7d0",
      text: "#15803d",
      dot: "#22c55e",
    },
  },
  other: {
    label: "Other Document",
    color: {
      bg: "#f9fafb",
      border: "#e5e7eb",
      text: "#374151",
      dot: "#9ca3af",
    },
  },
};

// ─── FILE TYPE ────────────────────────────────────────────────────────────────

export function getFileType(path, mime) {
  const p = (path || "").toLowerCase();
  const m = (mime || "").toLowerCase();
  if (m.includes("pdf") || p.endsWith(".pdf")) return "pdf";
  if (m.includes("image") || /\.(jpg|jpeg|png|gif|webp|bmp)$/.test(p))
    return "image";
  return "other";
}
