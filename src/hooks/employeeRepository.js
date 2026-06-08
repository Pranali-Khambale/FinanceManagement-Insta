// src/repositories/employeeRepository.js
// ─── Raw API calls for employee endpoints ─────────────────────────────────────
//
// FIXED:
//  • SCALAR_FIELDS updated — every key matches exactly what the backend
//    controller (buildCommonFields) reads from req.body
//  • submitPublicRegistration(linkId, formData) — new employee via link
//  • resubmitRegistration(token, formData)       — rejected employee resubmit
//    Both receive a pre-built FormData from RegistrationForm.jsx and POST it
//    directly to /api/registrations.

import { apiFetch, BASE_URL } from "../api/client";

// These are the camelCase keys the backend controller reads from req.body.
// They map 1-to-1 with DB columns (e.g. firstName → first_name).
// Used by buildEmployeeFormData / buildUpdateFormData for the AddEmp admin flow.
const SCALAR_FIELDS = [
  // Personal
  "firstName",
  "fatherHusbandName",
  "lastName",
  "email",
  "phone",
  "altPhone",
  "dob",
  "gender",
  "maritalStatus",
  "educationalQualification",
  "bloodGroup",
  // Identity
  "panNumber",
  "nameOnPan",
  "aadhar",
  "nameOnAadhar", // aadhar → aadhar_number
  "uanNumber",
  // Family
  "familyMemberName",
  "familyContactNo",
  "familyWorkingStatus",
  "familyEmployerName",
  "familyEmployerContact",
  // Emergency
  "emergencyContactName",
  "emergencyContactNo",
  "emergencyContactAddress",
  "emergencyContactRelation",
  // Permanent address
  "permanentAddress",
  "permanentPhone",
  "permanentLandmark",
  "permanentLatLong",
  // Local address
  "localSameAsPermanent",
  "localAddress",
  "localPhone",
  "localLandmark",
  "localLatLong",
  // References
  "ref1Name",
  "ref1Designation",
  "ref1Organization",
  "ref1Address",
  "ref1CityStatePin",
  "ref1ContactNo",
  "ref1Email",
  "ref2Name",
  "ref2Designation",
  "ref2Organization",
  "ref2Address",
  "ref2CityStatePin",
  "ref2ContactNo",
  "ref2Email",
  "ref3Name",
  "ref3Designation",
  "ref3Organization",
  "ref3Address",
  "ref3CityStatePin",
  "ref3ContactNo",
  "ref3Email",
  // Employment
  "joiningDate",
  "department",
  "position", // DB column: position  (UI label: "Designation")
  "circle",
  "projectName",
  "reportingManager",
  "employmentType",
  // Bank
  "bankName",
  "accountNumber",
  "ifscCode",
  "accountHolderName",
  "bankBranch",
  // Salary (admin-only)
  "basicSalary",
  "hra",
  "otherAllowances",
  // Legacy address fields used by admin AddEmp flow
  "address",
  "city",
  "state",
  "zipCode",
  "status",
];

// ── Helper: attach a File or { file, name } object to FormData ────────────────
function attachFile(fd, fieldName, docEntry) {
  if (!docEntry) return;
  if (docEntry instanceof File) {
    fd.append(fieldName, docEntry, docEntry.name);
  } else if (docEntry?.file instanceof File) {
    fd.append(fieldName, docEntry.file, docEntry.name || docEntry.file.name);
  }
}

// ── Build FormData for POST /api/employees (admin AddEmp wizard) ──────────────
function buildEmployeeFormData(employeeData) {
  const fd = new FormData();

  SCALAR_FIELDS.forEach((field) => {
    const value = employeeData[field];
    if (value !== undefined && value !== null && value !== "") {
      fd.append(field, String(value));
    }
  });

  const eid = employeeData.employeeId?.toString().trim();
  if (eid) fd.append("employeeId", eid);

  const docs = employeeData.documents || {};
  // Multer field names must match middleware .fields([...]) exactly
  attachFile(fd, "idPhoto", docs.idPhoto);
  attachFile(fd, "aadharCard", docs.aadharCard);
  attachFile(fd, "panCard", docs.panCard);
  attachFile(fd, "bankPassbook", docs.bankPassbook);
  attachFile(fd, "resume", docs.resume);
  attachFile(fd, "medicalCertificate", docs.medicalCertificate);
  attachFile(fd, "academicRecords", docs.academicRecords);
  attachFile(fd, "payslip", docs.payslip);
  attachFile(fd, "otherCertificates", docs.otherCertificates);
  attachFile(fd, "farmToCli", docs.farmToCli);

  return fd;
}

// ── Build FormData for PUT /api/employees/:id ─────────────────────────────────
function buildUpdateFormData(employeeData) {
  const fd = new FormData();

  SCALAR_FIELDS.forEach((field) => {
    const value = employeeData[field];
    if (value !== undefined && value !== null && value !== "") {
      fd.append(field, String(value));
    }
  });

  const docs = employeeData.documents || {};
  attachFile(fd, "idPhoto", docs.idPhoto);
  attachFile(fd, "aadharCard", docs.aadharCard);
  attachFile(fd, "panCard", docs.panCard);
  attachFile(fd, "bankPassbook", docs.bankPassbook);
  attachFile(fd, "resume", docs.resume);
  attachFile(fd, "medicalCertificate", docs.medicalCertificate);
  attachFile(fd, "academicRecords", docs.academicRecords);
  attachFile(fd, "payslip", docs.payslip);
  attachFile(fd, "otherCertificates", docs.otherCertificates);
  attachFile(fd, "farmToCli", docs.farmToCli);

  return fd;
}

const employeeRepository = {
  // ── Employees ────────────────────────────────────────────────────────────
  getAll: () => apiFetch("/employees"),
  getById: (id) => apiFetch(`/employees/${id}`),
  getNextId: () => apiFetch("/employees/next-id").then((r) => r.nextId),
  getNextEmployeeId: () => apiFetch("/employees/next-id").then((r) => r.nextId),
  getPendingCount: () =>
    apiFetch("/employees/pending-count")
      .then((r) => r.count || 0)
      .catch(() => 0),

  create: (employeeData) =>
    apiFetch("/employees", {
      method: "POST",
      body: buildEmployeeFormData(employeeData),
    }),

  update: (id, employeeData) =>
    apiFetch(`/employees/${id}`, {
      method: "PUT",
      body: buildUpdateFormData(employeeData),
    }),

  updateStatus: (id, status, rejection_reason = "") =>
    apiFetch(`/employees/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status, rejection_reason }),
    }),

  delete: (id) => apiFetch(`/employees/${id}`, { method: "DELETE" }),

  sendRejoinInvite: (employeeId) =>
    apiFetch(`/employees/${employeeId}/send-rejoin-invite`, { method: "POST" }),

  // ── Registration links ───────────────────────────────────────────────────
  generateRegistrationLink: (data = {}) =>
    apiFetch("/registration-links", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  validateLink: (linkId) => apiFetch(`/registration-links/${linkId}/validate`),
  getRecentRegistrationLinks: () => apiFetch("/registration-links"),
  checkRejoinLink: (linkId) => apiFetch(`/registration-links/rejoin/${linkId}`),

  // ── Public registration — new employee submitting via a one-time link ────
  // `formData` is a fully-built FormData from RegistrationForm.jsx.
  // linkId is already inside the FormData (appended before this call).
  // We accept _linkId only so the call signature is clear at the call site.
  submitPublicRegistration: (_linkId, formData) =>
    apiFetch("/registrations", { method: "POST", body: formData }),

  // ── Resubmission — rejected employee re-filling the form ─────────────────
  // resubmitToken is already inside the FormData.
  resubmitRegistration: (_token, formData) =>
    apiFetch("/registrations", { method: "POST", body: formData }),

  // ── Legacy admin submitRegistration (AddEmp wizard) ──────────────────────
  submitRegistration: (registrationData, documents) => {
    const fd = new FormData();
    Object.entries(registrationData).forEach(([k, v]) => {
      if (v !== null && v !== undefined) fd.append(k, String(v));
    });
    if (documents) {
      Object.entries(documents).forEach(([k, file]) => {
        if (file instanceof File) fd.append(k, file, file.name);
      });
    }
    return apiFetch("/registrations", { method: "POST", body: fd });
  },

  // ── Submissions ──────────────────────────────────────────────────────────
  getPrefillData: (token) => apiFetch(`/registrations/prefill/${token}`),
  getPendingSubmissions: () => apiFetch("/registrations/pending"),
  approveSubmission: (submissionId) =>
    apiFetch(`/registrations/${submissionId}/approve`, { method: "POST" }),
  rejectSubmission: (submissionId, reason = "") =>
    apiFetch(`/registrations/${submissionId}/reject`, {
      method: "POST",
      body: JSON.stringify({ rejection_reason: reason }),
    }),
  checkAadhar: (aadhar) => apiFetch(`/registrations/check-aadhar/${aadhar}`),

  // ── Document review ──────────────────────────────────────────────────────
  getDocReviewedEmployees: () => apiFetch("/employee-docs/reviewed"),
  getPendingDocCount: () =>
    apiFetch("/employee-docs/pending")
      .then((r) => r.count || 0)
      .catch(() => 0),

  // ── Email helpers ────────────────────────────────────────────────────────
  sendRegistrationEmail: (payload) =>
    fetch(`${BASE_URL}/employees/send-registration-email`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }).then((r) => r.json()),

  sendFormSubmissionConfirmation: (payload) =>
    fetch(`${BASE_URL}/employees/send-submission-confirmation`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }).then((r) => r.json()),

  sendHRSubmissionNotification: (payload) =>
    fetch(`${BASE_URL}/employees/send-hr-notification`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }).then((r) => r.json()),
};

export default employeeRepository;
