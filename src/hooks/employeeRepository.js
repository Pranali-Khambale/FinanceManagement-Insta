import { apiFetch, publicFetch, BASE_URL } from "../api/client";

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
  // NOTE: "position"/"designation" is handled explicitly below — not in SCALAR_FIELDS
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

  // UI stores designation; backend reads position (DB column name).
  // Append as both so either check in the controller succeeds.
  const designation = employeeData.designation?.toString().trim();
  if (designation) {
    fd.append("position", designation);
    fd.append("designation", designation);
  }

  // UI field name is "project"; backend/SCALAR_FIELDS expects "projectName".
  const project = employeeData.project?.toString().trim();
  if (project) fd.append("projectName", project);

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
  // ── Employees (admin — authenticated) ───────────────────────────────────
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

  update: (id, employeeData) => {
    // PUT /api/employees/:id uses express.json() — must send JSON, NOT FormData.
    // Documents are uploaded separately via /upload-document endpoint.
    const UPDATABLE_FIELDS = [
      "firstName",
      "lastName",
      "fatherHusbandName",
      "email",
      "phone",
      "altPhone",
      "dob",
      "gender",
      "maritalStatus",
      "educationalQualification",
      "bloodGroup",
      "panNumber",
      "nameOnPan",
      "aadhar",
      "nameOnAadhar",
      "uanNumber",
      "familyMemberName",
      "familyContactNo",
      "familyWorkingStatus",
      "familyEmployerName",
      "familyEmployerContact",
      "emergencyContactName",
      "emergencyContactNo",
      "emergencyContactAddress",
      "emergencyContactRelation",
      "permanentAddress",
      "permanentPhone",
      "permanentLandmark",
      "permanentLatLong",
      "localSameAsPermanent",
      "localAddress",
      "localPhone",
      "localLandmark",
      "localLatLong",
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
      "employeeId",
      "joiningDate",
      "department",
      "designation",
      "position",
      "employmentType",
      "circle",
      "projectName",
      "reportingManager",
      "status",
      "basicSalary",
      "hra",
      "otherAllowances",
      "bankName",
      "accountNumber",
      "ifscCode",
      "accountHolderName",
      "bankBranch",
      "address",
      "city",
      "state",
      "zipCode",
    ];
    const payload = {};
    UPDATABLE_FIELDS.forEach((k) => {
      if (employeeData[k] !== undefined) payload[k] = employeeData[k];
    });
    return apiFetch(`/employees/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  },

  updateStatus: (id, status, rejection_reason = "") =>
    apiFetch(`/employees/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status, rejection_reason }),
    }),

  delete: (id) => apiFetch(`/employees/${id}`, { method: "DELETE" }),

  sendRejoinInvite: (employeeId) =>
    apiFetch(`/employees/${employeeId}/send-rejoin-invite`, { method: "POST" }),

  // ── Registration links (public — visitor has no authToken) ──────────────
  // NOTE: generateRegistrationLink / getRecentRegistrationLinks stay on
  // apiFetch — only an authenticated admin can create or list links.
  generateRegistrationLink: (data = {}) =>
    apiFetch("/registration-links", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  validateLink: (linkId) =>
    publicFetch(`/registration-links/${linkId}/validate`),

  // Convenience wrapper: calls validateLink and returns the full response.
  // For rejoin links the response includes prefillData with all previous employee fields.
  getRejoinPrefill: (linkId) =>
    publicFetch(`/registration-links/${linkId}/validate`),

  getRecentRegistrationLinks: () => apiFetch("/registration-links"),

  checkRejoinLink: (linkId) =>
    publicFetch(`/registration-links/rejoin/${linkId}`),

  // ── Public registration — new employee submitting via a one-time link ────
  // `formData` is a fully-built FormData from RegistrationForm.jsx.
  // linkId is already inside the FormData (appended before this call).
  // We accept _linkId only so the call signature is clear at the call site.
  submitPublicRegistration: (_linkId, formData) =>
    publicFetch("/registrations", { method: "POST", body: formData }),

  // ── Resubmission — rejected employee re-filling the form ─────────────────
  // resubmitToken is already inside the FormData.
  resubmitRegistration: (_token, formData) =>
    publicFetch("/registrations", { method: "POST", body: formData }),

  // ── Legacy admin submitRegistration (AddEmp wizard — authenticated) ──────
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
  // getPrefillData / checkAadhar are hit from the public resubmit form before
  // the user has any session — must stay on publicFetch.
  getPrefillData: (token) => publicFetch(`/registrations/prefill/${token}`),
  checkAadhar: (aadhar) => publicFetch(`/registrations/check-aadhar/${aadhar}`),

  // Admin-only review actions — stay authenticated.
  getPendingSubmissions: () => apiFetch("/registrations/pending"),
  approveSubmission: (submissionId) =>
    apiFetch(`/registrations/${submissionId}/approve`, { method: "POST" }),
  rejectSubmission: (submissionId, reason = "") =>
    apiFetch(`/registrations/${submissionId}/reject`, {
      method: "POST",
      body: JSON.stringify({ rejection_reason: reason }),
    }),

  // ── Document review ──────────────────────────────────────────────────────
  getDocReviewedEmployees: () => apiFetch("/employee-docs/reviewed"),
  getPendingDocCount: () =>
    apiFetch("/employee-docs/pending")
      .then((r) => r.count || 0)
      .catch(() => 0),

  // ── Email helpers ────────────────────────────────────────────────────────
  // NOTE: The registration email itself is already sent server-side by the
  // POST /api/registration-links controller (generateLink) the moment a
  // link is created. These helpers are ONLY for optional manual resend
  // actions elsewhere in the UI — do NOT call sendRegistrationEmail right
  // after generateRegistrationLink, that would (attempt to) send it twice.
  //
  // All three now properly check r.ok so a 404/500 rejects the promise
  // instead of silently resolving with success=false and letting the UI
  // show a false "sent" toast.
  sendRegistrationEmail: async (payload) => {
    const r = await fetch(`${BASE_URL}/employees/send-registration-email`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await r.json().catch(() => ({}));
    if (!r.ok || data.success === false) {
      throw new Error(data.message || `Request failed (${r.status})`);
    }
    return data;
  },

  sendFormSubmissionConfirmation: async (payload) => {
    const r = await fetch(
      `${BASE_URL}/employees/send-submission-confirmation`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      },
    );
    const data = await r.json().catch(() => ({}));
    if (!r.ok || data.success === false) {
      throw new Error(data.message || `Request failed (${r.status})`);
    }
    return data;
  },

  sendHRSubmissionNotification: async (payload) => {
    const r = await fetch(`${BASE_URL}/employees/send-hr-notification`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await r.json().catch(() => ({}));
    if (!r.ok || data.success === false) {
      throw new Error(data.message || `Request failed (${r.status})`);
    }
    return data;
  },
};

export default employeeRepository;
