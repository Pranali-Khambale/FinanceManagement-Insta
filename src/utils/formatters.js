// =========================
// Currency Formatter
// =========================
export const formatCurrency = (amount, currency = "INR") => {
  if (amount === null || amount === undefined || amount === "") {
    return "₹0.00";
  }

  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
  }).format(Number(amount));
};

// Alias for compatibility
export const fmtCurrency = formatCurrency;

// =========================
// Number Formatter
// =========================
export const formatNumber = (number) => {
  if (number === null || number === undefined || number === "") {
    return "0";
  }

  return new Intl.NumberFormat("en-IN").format(Number(number));
};

// =========================
// Date Formatter
// =========================
export const formatDate = (date) => {
  if (!date) return "";

  const d = new Date(date);

  if (isNaN(d.getTime())) return "";

  const day = String(d.getDate()).padStart(2, "0");
  const month = d.toLocaleString("en-IN", { month: "short" });
  const year = d.getFullYear();

  return `${day} ${month} ${year}`;
};

// Alias used in ViewEmployee.jsx
export const fmtDate = formatDate;

// =========================
// Date Time Formatter
// =========================
export const formatDateTime = (date) => {
  if (!date) return "";

  const d = new Date(date);

  if (isNaN(d.getTime())) return "";

  return d.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
};

// =========================
// Aadhaar Mask
// =========================
export const maskAadhar = (aadhar) => {
  if (!aadhar) return "";

  const cleaned = String(aadhar).replace(/\D/g, "");

  if (cleaned.length < 4) return cleaned;

  return `XXXX-XXXX-${cleaned.slice(-4)}`;
};

// =========================
// Bank Account Mask
// =========================
export const maskBankAccount = (account) => {
  if (!account) return "";

  const acc = String(account);

  if (acc.length < 4) return acc;

  return `XXXX${acc.slice(-4)}`;
};

// =========================
// Capitalize First Letter
// =========================
export const capitalizeFirst = (str) => {
  if (!str) return "";

  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};

// =========================
// Full Name Formatter
// =========================
export const formatName = (...parts) => {
  return parts
    .filter(Boolean)
    .map((p) => String(p).trim())
    .join(" ");
};

// =========================
// Safe Value Helper
// =========================
export const val = (value) => {
  if (
    value === null ||
    value === undefined ||
    value === "" ||
    value === "null" ||
    value === "undefined"
  ) {
    return "-";
  }

  return String(value);
};

// =========================
// Status Formatter
// =========================
export const getStatus = (status) => {
  const s = String(status || "").toLowerCase();

  switch (s) {
    case "approved":
    case "active":
      return {
        label: "Approved",
        bg: "#dcfce7",
        color: "#166534",
      };

    case "pending":
      return {
        label: "Pending",
        bg: "#fef3c7",
        color: "#92400e",
      };

    case "rejected":
      return {
        label: "Rejected",
        bg: "#fee2e2",
        color: "#991b1b",
      };

    case "verified":
      return {
        label: "Verified",
        bg: "#dbeafe",
        color: "#1d4ed8",
      };

    default:
      return {
        label: status || "Unknown",
        bg: "#e5e7eb",
        color: "#374151",
      };
  }
};

// =========================
// File Helpers
// =========================
export const isPdf = (filePath = "") => {
  if (!filePath) return false;

  const path = String(filePath).toLowerCase();

  return path.endsWith(".pdf") || path.includes(".pdf?");
};

// =========================
// Document Label Helper
// =========================
export const getDocLabel = (doc, DOC_LABELS = {}) => {
  if (!doc) return "Document";

  const docType =
    doc.document_type ||
    doc.doc_type ||
    doc.documentType ||
    doc.type ||
    doc.category ||
    doc.document_name ||
    doc.name;

  return DOC_LABELS?.[docType] || docType || "Document";
};
