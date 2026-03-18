// src/services/employeeService.js
// ============================================================
// All Employee API calls — matches the PostgreSQL schema exactly.
// Works with Vite (import.meta.env.VITE_API_URL)
// ============================================================

const BASE_URL =
  (typeof import.meta !== "undefined" && import.meta.env?.VITE_API_URL) ||
  "http://localhost:5000/api";

// ── Auth token ──────────────────────────────────────────────
function getAuthToken() {
  try {
    return (
      localStorage.getItem("token") || sessionStorage.getItem("token") || ""
    );
  } catch {
    return "";
  }
}

// ── Central fetch wrapper ───────────────────────────────────
async function apiFetch(endpoint, options = {}) {
  const token = getAuthToken();
  const isFormData = options.body instanceof FormData;

  const headers = {
    ...(isFormData ? {} : { "Content-Type": "application/json" }),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {}),
  };

  try {
    const response = await fetch(`${BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    const contentType = response.headers.get("content-type") || "";
    if (!contentType.includes("application/json")) {
      throw new Error(
        `Server error (${response.status}): unexpected response format`
      );
    }

    const data = await response.json();

    if (!response.ok) {
      const err = new Error(
        data.message || `Request failed (${response.status})`
      );
      err.status  = response.status;
      err.expired = data.expired || false;
      err.used    = data.used    || false;
      err.response = { data };
      throw err;
    }

    return data;
  } catch (err) {
    if (err.name === "TypeError" && err.message === "Failed to fetch") {
      throw new Error(
        "Cannot connect to server. Please check your connection."
      );
    }
    throw err;
  }
}

// ── Build FormData for manual employee add (wizard) ─────────
function buildEmployeeFormData(employeeData) {
  const fd = new FormData();

  const scalarFields = [
    "firstName", "middleName", "lastName", "email", "phone", "altPhone",
    "aadhar", "dob", "gender", "address", "city", "state", "zipCode",
    "employeeId", "joiningDate", "department", "designation",
    "employmentType", "circle", "projectName", "reportingManager",
    "basicSalary", "hra", "otherAllowances",
    "bankName", "accountNumber", "ifscCode", "branch", "totalSalary", "status",
  ];

  scalarFields.forEach((field) => {
    const value = employeeData[field];
    if (value !== undefined && value !== null) fd.append(field, String(value));
  });

  const docs = employeeData.documents || {};
  if (docs.photo?.file)        fd.append("photo",        docs.photo.file,        docs.photo.name);
  if (docs.aadharCard?.file)   fd.append("aadharCard",   docs.aadharCard.file,   docs.aadharCard.name);
  if (docs.panCard?.file)      fd.append("panCard",       docs.panCard.file,      docs.panCard.name);
  if (docs.bankPassbook?.file) fd.append("bankPassbook",  docs.bankPassbook.file, docs.bankPassbook.name);

  return fd;
}

// ============================================================
// Employee Service
// ============================================================
const employeeService = {

  // ════════════════════════════════════════════════════════════════════════════
  // EMPLOYEES (active / inactive — NOT pending)
  // ════════════════════════════════════════════════════════════════════════════

  getAllEmployees: () => {
    console.log("📡 Fetching all employees...");
    return apiFetch("/employees");
  },

  getEmployee: (id) => {
    console.log(`📡 Fetching employee ${id}...`);
    return apiFetch(`/employees/${id}`);
  },

  addEmployee: (employeeData) => {
    console.log("📡 Adding new employee...");
    const fd = buildEmployeeFormData(employeeData);
    return apiFetch("/employees", { method: "POST", body: fd });
  },

  updateEmployee: (id, employeeData) => {
    console.log(`📡 Updating employee ${id}...`);
    return apiFetch(`/employees/${id}`, {
      method: "PUT",
      body: JSON.stringify(employeeData),
    });
  },

  updateStatus: (id, status, rejection_reason = "") => {
    console.log(`📡 Updating employee ${id} status to ${status}...`);
    return apiFetch(`/employees/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status, rejection_reason }),
    });
  },

  deleteEmployee: (id) => {
    console.log(`📡 Deleting employee ${id}...`);
    return apiFetch(`/employees/${id}`, { method: "DELETE" });
  },

  // ════════════════════════════════════════════════════════════════════════════
  // REGISTRATION LINKS
  // ════════════════════════════════════════════════════════════════════════════

  generateRegistrationLink: (data = {}) => {
    console.log("📡 Generating registration link...");
    return apiFetch("/registration-links", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  validateLink: (linkId) => {
    console.log(`📡 Validating registration link ${linkId}...`);
    return apiFetch(`/registration-links/${linkId}/validate`);
  },

  getRecentRegistrationLinks: () => {
    console.log("📡 Fetching recent registration links...");
    return apiFetch("/registration-links");
  },

  // ════════════════════════════════════════════════════════════════════════════
  // SELF-REGISTRATION (public — employee fills the 4-step form)
  // FIXED: uses FormData (multipart) so file uploads work correctly.
  //        Never send JSON when there are file attachments.
  // ════════════════════════════════════════════════════════════════════════════

  submitRegistration: (registrationData, documents) => {
    console.log("📡 Submitting registration form...");
    const fd = new FormData();

    // Append all text/scalar fields
    Object.entries(registrationData).forEach(([k, v]) => {
      if (v !== null && v !== undefined) {
        fd.append(k, String(v));
      }
    });

    // Append document files
    // documents = { idPhoto: File|null, aadharCard: File|null, ... }
    if (documents) {
      Object.entries(documents).forEach(([k, file]) => {
        if (file instanceof File) {
          console.log(`  📎 Attaching: ${k} (${file.name})`);
          fd.append(k, file, file.name);
        }
      });
    }

    // DO NOT set Content-Type header — browser sets it automatically
    // with the correct multipart boundary when using FormData
    return apiFetch("/registrations", { method: "POST", body: fd });
  },

  // ════════════════════════════════════════════════════════════════════════════
  // ADMIN — PENDING APPROVAL FLOW
  // ════════════════════════════════════════════════════════════════════════════

  getPendingSubmissions: async () => {
    console.log("📡 Fetching pending submissions...");
    try {
      const response = await apiFetch("/registrations/pending");
      console.log(`📊 Found ${response.data?.length || 0} pending submissions`);
      return response;
    } catch (error) {
      console.error("❌ Error fetching pending submissions:", error);
      throw error;
    }
  },

  approveSubmission: async (submissionId) => {
    console.log(`✅ Approving submission ${submissionId}...`);
    try {
      const response = await apiFetch(`/registrations/${submissionId}/approve`, {
        method: "POST",
      });
      console.log(`✅ Approved: ${response.data?.employee_id}`);
      return response;
    } catch (error) {
      console.error(`❌ Error approving submission ${submissionId}:`, error);
      throw error;
    }
  },

  rejectSubmission: async (submissionId, reason = "") => {
    console.log(`❌ Rejecting submission ${submissionId}...`);
    try {
      const response = await apiFetch(`/registrations/${submissionId}/reject`, {
        method: "POST",
        body: JSON.stringify({ rejection_reason: reason }),
      });
      return response;
    } catch (error) {
      console.error(`❌ Error rejecting submission ${submissionId}:`, error);
      throw error;
    }
  },

  // ════════════════════════════════════════════════════════════════════════════
  // UTILITY / STATS
  // ════════════════════════════════════════════════════════════════════════════

  getPendingCount: async () => {
    try {
      const response = await apiFetch("/employees/pending-count");
      return response.count || 0;
    } catch (error) {
      console.error("❌ Error fetching pending count:", error);
      return 0;
    }
  },

  // ════════════════════════════════════════════════════════════════════════════
  // EMAIL
  // ════════════════════════════════════════════════════════════════════════════

  sendRegistrationEmail: async ({ to, registrationUrl, expiresAt, subject }) => {
    console.log(`📧 Sending registration email to ${to}...`);
    const response = await fetch(`${BASE_URL}/employees/send-registration-email`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        to,
        registrationUrl,
        expiresAt,
        subject: subject || "Your Registration Link — Insta ICT Solutions",
        message: `
Dear Employee,

Please use the link below to complete your registration form.
Once submitted, our HR team will review your information and
approve your profile within 1–2 business days.

Registration Link: ${registrationUrl}

This link expires on ${new Date(expiresAt).toLocaleString()} and can only be used once.

After submitting your form:
✓ You will receive a confirmation email
✓ HR will review and approve your details
✓ You will be notified once your Employee ID is assigned

Regards,
HR Team — Insta ICT Solutions
        `.trim(),
      }),
    });
    return response.json();
  },

  sendFormSubmissionConfirmation: async ({ to, formData }) => {
    console.log(`📧 Sending form submission confirmation to ${to}...`);
    const response = await fetch(`${BASE_URL}/employees/send-submission-confirmation`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ to, formData }),
    });
    return response.json();
  },
};

export default employeeService;