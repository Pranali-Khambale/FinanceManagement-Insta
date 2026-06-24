// ─────────────────────────────────────────────────────────────────────────────
// FILE: src/Ui/AdvancePayment/ViewDetailModal/constants/index.js
// ─────────────────────────────────────────────────────────────────────────────

export const PAYMENT_TYPES = {
  org_to_emp: {
    label: "Org → Employee",
    color: "#6366F1",
    lightBg: "#EEF2FF",
    borderColor: "#C7D2FE",
    textColor: "#4338CA",
  },
  emp_to_emp: {
    label: "Employee → Employee",
    color: "#0EA5E9",
    lightBg: "#E0F2FE",
    borderColor: "#BAE6FD",
    textColor: "#0369A1",
  },
  other: {
    label: "External / Vendor",
    color: "#8B5CF6",
    lightBg: "#F5F3FF",
    borderColor: "#DDD6FE",
    textColor: "#6D28D9",
  },
  org_to_vendor: {
    label: "Org → Vendor",
    color: "#10B981",
    lightBg: "#ECFDF5",
    borderColor: "#A7F3D0",
    textColor: "#065F46",
  },
};

export const STATUS_CONFIG = {
  pending: {
    bg: "bg-amber-50",
    text: "text-amber-700",
    ring: "ring-amber-200",
    dot: "bg-amber-400",
    label: "Pending",
  },
  approved: {
    bg: "bg-emerald-50",
    text: "text-emerald-700",
    ring: "ring-emerald-200",
    dot: "bg-emerald-500",
    label: "Approved",
  },
  rejected: {
    bg: "bg-red-50",
    text: "text-red-700",
    ring: "ring-red-200",
    dot: "bg-red-400",
    label: "Rejected",
  },
};
