export const FONT = "'Calibri', 'Segoe UI', Arial, sans-serif";
export const BORDER = "1px solid #000";

export const DOC_LABELS = {
  photo: "Passport Size Photograph",
  idPhoto: "Passport Size Photograph",
  id_photo: "Passport Size Photograph",
  resume: "Resume – Signed Copy",
  medicalCertificate: "Medical Certificate",
  medical_certificate: "Medical Certificate",
  aadharCard: "Aadhaar Card",
  aadhar_card: "Aadhaar Card",
  panCard: "PAN Card",
  pan_card: "PAN Card",
  academicRecords: "Academic Records",
  academic_records: "Academic Records",
  bankPassbook: "Bank Details / Passbook",
  bank_passbook: "Bank Details / Passbook",
  payslip: "Pay Slip / Bank Statement",
  otherCertificates: "Other Certificates",
  other_certificates: "Other Certificates",
  farmToCli: "Farm to CLI",
  farm_to_cli: "Farm to CLI",
};

export const STATUS_MAP = {
  active: { label: "Active", bg: "#dcfce7", color: "#15803d", dot: "#22c55e" },
  approved: {
    label: "Active",
    bg: "#dcfce7",
    color: "#15803d",
    dot: "#22c55e",
  },
  inactive: {
    label: "Inactive",
    bg: "#fee2e2",
    color: "#b91c1c",
    dot: "#ef4444",
  },
  rejected: {
    label: "Inactive",
    bg: "#fee2e2",
    color: "#b91c1c",
    dot: "#ef4444",
  },
  pending: {
    label: "Pending",
    bg: "#fef9c3",
    color: "#92400e",
    dot: "#f59e0b",
  },
};

export const DOC_LIST = [
  { sr: 1, name: "Resume -Signed copy", types: ["resume"] },
  {
    sr: 2,
    name: "2 passport size photographs-Name should be written on backside",
    types: ["idPhoto", "photo", "id_photo"],
  },
  {
    sr: 3,
    name: "Medical Certificate-Latest",
    types: ["medicalCertificate", "medical_certificate"],
  },
  { sr: 4, name: "Aadhaar Card", types: ["aadharCard", "aadhar_card"] },
  { sr: 5, name: "Pan Card", types: ["panCard", "pan_card"] },
  {
    sr: 6,
    name: "Academic records (SSC,ITI,HSC, Diploma, Degree Certificates Copy)",
    types: ["academicRecords", "academic_records"],
  },
  { sr: 7, name: "Bank Details", types: ["bankPassbook", "bank_passbook"] },
  {
    sr: 8,
    name: "Pay slip or bank statement reflecting last drawn salary",
    types: ["payslip"],
  },
  {
    sr: 9,
    name: "Other certificates, if any",
    types: ["otherCertificates", "other_certificates"],
  },
];

export const REF_ROWS = [
  ["Name", "ref1_name", "ref2_name", "ref3_name"],
  ["Designation", "ref1_designation", "ref2_designation", "ref3_designation"],
  [
    "Name of Organization",
    "ref1_organization",
    "ref2_organization",
    "ref3_organization",
  ],
  ["Address", "ref1_address", "ref2_address", "ref3_address"],
  [
    "City, State, Pin Code",
    "ref1_city_state_pin",
    "ref2_city_state_pin",
    "ref3_city_state_pin",
  ],
  [
    "Contact No. (Mobile/Landline)",
    "ref1_contact_no",
    "ref2_contact_no",
    "ref3_contact_no",
  ],
  ["Email ID (Preferably Official)", "ref1_email", "ref2_email", "ref3_email"],
];
