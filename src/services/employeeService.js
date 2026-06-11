// src/services/employeeService.js
// ─── Business logic: employee management ──────────────────────────────────────
//
// NOTE: employeeRepository lives at ../hooks/employeeRepository
//       (the file header comment "src/repositories/..." is a legacy mistake)
//
import employeeRepository from "../hooks/employeeRepository";

const employeeService = {
  // ── Employees ──────────────────────────────────────────────────────────────
  getAllEmployees: () => employeeRepository.getAll(),
  getEmployee: (id) => employeeRepository.getById(id),
  getNextId: () => employeeRepository.getNextId(),

  // Alias used by AddEmp wizard (useEffect on mount)
  getNextEmployeeId: () => employeeRepository.getNextEmployeeId(),

  getPendingCount: () => employeeRepository.getPendingCount(),
  addEmployee: (employeeData) => employeeRepository.create(employeeData),
  updateEmployee: (id, data) => employeeRepository.update(id, data),
  updateStatus: (id, status, reason) =>
    employeeRepository.updateStatus(id, status, reason),
  deleteEmployee: (id) => employeeRepository.delete(id),
  sendRejoinInvite: (employeeId) =>
    employeeRepository.sendRejoinInvite(employeeId),

  // ── Registration links ─────────────────────────────────────────────────────
  generateRegistrationLink: (data) =>
    employeeRepository.generateRegistrationLink(data),

  // validateLink returns: { success, valid, isRejoin, prefillData, linkEmail, data }
  // For rejoin links, prefillData contains ALL previous employee fields pre-populated.
  validateLink: (linkId) => employeeRepository.validateLink(linkId),

  // Explicit rejoin prefill fetch — same endpoint, clearer call-site semantics.
  // RegistrationForm should call this when isRejoin=true to get prefillData.
  getRejoinPrefill: (linkId) => employeeRepository.getRejoinPrefill(linkId),

  getRecentRegistrationLinks: () =>
    employeeRepository.getRecentRegistrationLinks(),
  checkRejoinLink: (linkId) => employeeRepository.checkRejoinLink(linkId),

  // ── Submissions ────────────────────────────────────────────────────────────
  submitRegistration: (data, docs) =>
    employeeRepository.submitRegistration(data, docs),

  // Public employee registration via one-time link
  submitPublicRegistration: (linkId, formData) =>
    employeeRepository.submitPublicRegistration(linkId, formData),

  // Rejected employee re-submitting their form
  resubmitRegistration: (token, formData) =>
    employeeRepository.resubmitRegistration(token, formData),
  getPrefillData: (token) => employeeRepository.getPrefillData(token),
  getPendingSubmissions: () => employeeRepository.getPendingSubmissions(),
  approveSubmission: (id) => employeeRepository.approveSubmission(id),
  rejectSubmission: (id, reason) =>
    employeeRepository.rejectSubmission(id, reason),
  checkAadhar: (aadhar) => employeeRepository.checkAadhar(aadhar),

  // ── Documents ──────────────────────────────────────────────────────────────
  getDocReviewedEmployees: () => employeeRepository.getDocReviewedEmployees(),
  getPendingDocCount: () => employeeRepository.getPendingDocCount(),

  // ── Emails ─────────────────────────────────────────────────────────────────
  sendRegistrationEmail: (payload) =>
    employeeRepository.sendRegistrationEmail(payload),
  sendFormSubmissionConfirmation: (payload) =>
    employeeRepository.sendFormSubmissionConfirmation(payload),
  sendHRSubmissionNotification: (payload) =>
    employeeRepository.sendHRSubmissionNotification(payload),
};

export default employeeService;
