// src/services/employeeService.js
// ─── Business logic: employee management ──────────────────────────────────────
import employeeRepository from '../hooks/employeeRepository';

const employeeService = {
  // ── Employees ──────────────────────────────────────────────────────────────
  getAllEmployees:  ()              => employeeRepository.getAll(),
  getEmployee:     (id)            => employeeRepository.getById(id),
  getNextId:       ()              => employeeRepository.getNextId(),
  getPendingCount: ()              => employeeRepository.getPendingCount(),
  addEmployee:     (employeeData)  => employeeRepository.create(employeeData),
  updateEmployee:  (id, data)      => employeeRepository.update(id, data),
  updateStatus:    (id, status, reason) => employeeRepository.updateStatus(id, status, reason),
  deleteEmployee:  (id)            => employeeRepository.delete(id),
  sendRejoinInvite: (employeeId)   => employeeRepository.sendRejoinInvite(employeeId),

  // ── Registration links ─────────────────────────────────────────────────────
  generateRegistrationLink:  (data)   => employeeRepository.generateRegistrationLink(data),
  validateLink:              (linkId) => employeeRepository.validateLink(linkId),
  getRecentRegistrationLinks: ()      => employeeRepository.getRecentRegistrationLinks(),
  checkRejoinLink:           (linkId) => employeeRepository.checkRejoinLink(linkId),

  // ── Submissions ────────────────────────────────────────────────────────────
  submitRegistration:    (data, docs)   => employeeRepository.submitRegistration(data, docs),
  getPrefillData:        (token)        => employeeRepository.getPrefillData(token),
  getPendingSubmissions: ()             => employeeRepository.getPendingSubmissions(),
  approveSubmission:     (id)           => employeeRepository.approveSubmission(id),
  rejectSubmission:      (id, reason)   => employeeRepository.rejectSubmission(id, reason),
  checkAadhar:           (aadhar)       => employeeRepository.checkAadhar(aadhar),

  // ── Documents ──────────────────────────────────────────────────────────────
  getDocReviewedEmployees: () => employeeRepository.getDocReviewedEmployees(),
  getPendingDocCount:      () => employeeRepository.getPendingDocCount(),

  // ── Emails ─────────────────────────────────────────────────────────────────
  sendRegistrationEmail:          (payload)           => employeeRepository.sendRegistrationEmail(payload),
  sendFormSubmissionConfirmation: (payload)           => employeeRepository.sendFormSubmissionConfirmation(payload),
  sendHRSubmissionNotification:   (payload)           => employeeRepository.sendHRSubmissionNotification(payload),
};

export default employeeService;