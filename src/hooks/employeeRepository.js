// src/repositories/employeeRepository.js
// ─── Raw API calls for employee endpoints ─────────────────────────────────────
import { apiFetch, BASE_URL } from '../api/client';

const SCALAR_FIELDS = [
  'firstName', 'lastName',
  'fatherHusbandName', 'email', 'phone', 'altPhone',
  'aadhar', 'nameOnAadhar', 'panNumber', 'nameOnPan', 'uanNumber',
  'dob', 'gender', 'maritalStatus', 'educationalQualification', 'bloodGroup',
  'address', 'city', 'state', 'zipCode',
  'familyMemberName', 'familyContactNo', 'familyWorkingStatus',
  'familyEmployerName', 'familyEmployerContact',
  'emergencyContactName', 'emergencyContactNo',
  'emergencyContactAddress', 'emergencyContactRelation',
  'permanentAddress', 'permanentPhone', 'permanentLandmark', 'permanentLatLong',
  'localSameAsPermanent',
  'localAddress', 'localPhone', 'localLandmark', 'localLatLong',
  'ref1Name', 'ref1Designation', 'ref1Organization', 'ref1Address',
  'ref1CityStatePin', 'ref1ContactNo', 'ref1Email',
  'ref2Name', 'ref2Designation', 'ref2Organization', 'ref2Address',
  'ref2CityStatePin', 'ref2ContactNo', 'ref2Email',
  'ref3Name', 'ref3Designation', 'ref3Organization', 'ref3Address',
  'ref3CityStatePin', 'ref3ContactNo', 'ref3Email',
  'joiningDate', 'department', 'designation',
  'employmentType', 'circle', 'projectName', 'reportingManager',
  'basicSalary', 'hra', 'otherAllowances',
  'bankName', 'accountNumber', 'ifscCode', 'bankBranch',
  'accountHolderName', 'branch', 'totalSalary', 'status',
];

function buildEmployeeFormData(employeeData) {
  const fd = new FormData();
  SCALAR_FIELDS.forEach((field) => {
    const value = employeeData[field];
    if (value !== undefined && value !== null && value !== '') {
      fd.append(field, String(value));
    }
  });
  const eid = employeeData.employeeId?.toString().trim();
  if (eid) fd.append('employeeId', eid);
  const docs = employeeData.documents || {};
  if (docs.photo?.file)        fd.append('photo',        docs.photo.file,        docs.photo.name);
  if (docs.aadharCard?.file)   fd.append('aadharCard',   docs.aadharCard.file,   docs.aadharCard.name);
  if (docs.panCard?.file)      fd.append('panCard',      docs.panCard.file,      docs.panCard.name);
  if (docs.bankPassbook?.file) fd.append('bankPassbook', docs.bankPassbook.file, docs.bankPassbook.name);
  return fd;
}

const employeeRepository = {
  getAll:    ()     => apiFetch('/employees'),
  getById:   (id)   => apiFetch(`/employees/${id}`),
  getNextId: ()     => apiFetch('/employees/next-id').then((r) => r.nextId),

  getPendingCount: () =>
    apiFetch('/employees/pending-count')
      .then((r) => r.count || 0)
      .catch(() => 0),

  create: (employeeData) =>
    apiFetch('/employees', {
      method: 'POST',
      body: buildEmployeeFormData(employeeData),
    }),

  update: (id, employeeData) =>
    apiFetch(`/employees/${id}`, {
      method: 'PUT',
      body: JSON.stringify(employeeData),
    }),

  updateStatus: (id, status, rejection_reason = '') =>
    apiFetch(`/employees/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status, rejection_reason }),
    }),

  delete: (id) => apiFetch(`/employees/${id}`, { method: 'DELETE' }),

  sendRejoinInvite: (employeeId) =>
    apiFetch(`/employees/${employeeId}/send-rejoin-invite`, { method: 'POST' }),

  // ── Registration links ─────────────────────────────────────────────────────
  generateRegistrationLink: (data = {}) =>
    apiFetch('/registration-links', { method: 'POST', body: JSON.stringify(data) }),

  validateLink:               (linkId) => apiFetch(`/registration-links/${linkId}/validate`),
  getRecentRegistrationLinks: ()       => apiFetch('/registration-links'),
  checkRejoinLink:            (linkId) => apiFetch(`/registration-links/rejoin/${linkId}`),

  // ── Submissions ────────────────────────────────────────────────────────────
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
    return apiFetch('/registrations', { method: 'POST', body: fd });
  },

  getPrefillData:        (token)         => apiFetch(`/registrations/prefill/${token}`),
  getPendingSubmissions: ()              => apiFetch('/registrations/pending'),
  approveSubmission:     (submissionId)  => apiFetch(`/registrations/${submissionId}/approve`, { method: 'POST' }),
  rejectSubmission:      (submissionId, reason = '') =>
    apiFetch(`/registrations/${submissionId}/reject`, {
      method: 'POST',
      body: JSON.stringify({ rejection_reason: reason }),
    }),

  checkAadhar: (aadhar) => apiFetch(`/registrations/check-aadhar/${aadhar}`),

  // ── Document review ────────────────────────────────────────────────────────
  getDocReviewedEmployees: () => apiFetch('/employee-docs/reviewed'),
  getPendingDocCount: () =>
    apiFetch('/employee-docs/pending')
      .then((r) => r.count || 0)
      .catch(() => 0),

  // ── Email helpers ──────────────────────────────────────────────────────────
  sendRegistrationEmail: (payload) =>
    fetch(`${BASE_URL}/employees/send-registration-email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }).then((r) => r.json()),

  sendFormSubmissionConfirmation: (payload) =>
    fetch(`${BASE_URL}/employees/send-submission-confirmation`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }).then((r) => r.json()),

  sendHRSubmissionNotification: (payload) =>
    fetch(`${BASE_URL}/employees/send-hr-notification`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }).then((r) => r.json()),
};

export default employeeRepository;