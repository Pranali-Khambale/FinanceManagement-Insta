// src/services/employeeService.js
// ✅ UPDATED: uanNumber added to scalar fields so it is sent on add/edit

const BASE_URL =
  (typeof import.meta !== "undefined" && import.meta.env?.VITE_API_URL) ||
  "http://localhost:5000/api";

function getAuthToken() {
  try {
    return (
      localStorage.getItem("token") || sessionStorage.getItem("token") || ""
    );
  } catch {
    return "";
  }
}

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
      err.status   = response.status;
      err.expired  = data.expired || false;
      err.used     = data.used    || false;
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

function buildEmployeeFormData(employeeData) {
  const fd = new FormData();

  const scalarFields = [
    "firstName", "lastName",
    "fatherHusbandName", "email", "phone", "altPhone",
    "aadhar", "nameOnAadhar", "panNumber", "nameOnPan",
    "uanNumber",                                                  // ✅ NEW
    "dob", "gender", "maritalStatus", "educationalQualification", "bloodGroup",
    "address", "city", "state", "zipCode",
    "familyMemberName", "familyContactNo", "familyWorkingStatus",
    "familyEmployerName", "familyEmployerContact",
    "emergencyContactName", "emergencyContactNo",
    "emergencyContactAddress", "emergencyContactRelation",
    "permanentAddress", "permanentPhone", "permanentLandmark", "permanentLatLong",
    "localSameAsPermanent",
    "localAddress", "localPhone", "localLandmark", "localLatLong",
    "ref1Name", "ref1Designation", "ref1Organization", "ref1Address",
    "ref1CityStatePin", "ref1ContactNo", "ref1Email",
    "ref2Name", "ref2Designation", "ref2Organization", "ref2Address",
    "ref2CityStatePin", "ref2ContactNo", "ref2Email",
    "ref3Name", "ref3Designation", "ref3Organization", "ref3Address",
    "ref3CityStatePin", "ref3ContactNo", "ref3Email",
    "joiningDate", "department", "designation",
    "employmentType", "circle", "projectName", "reportingManager",
    "basicSalary", "hra", "otherAllowances",
    "bankName", "accountNumber", "ifscCode", "bankBranch",
    "accountHolderName", "branch", "totalSalary", "status",
  ];

  scalarFields.forEach((field) => {
    const value = employeeData[field];
    if (value !== undefined && value !== null && value !== "") {
      fd.append(field, String(value));
    }
  });

  const eid = employeeData.employeeId?.toString().trim();
  if (eid) fd.append("employeeId", eid);

  const docs = employeeData.documents || {};
  if (docs.photo?.file)        fd.append("photo",        docs.photo.file,        docs.photo.name);
  if (docs.aadharCard?.file)   fd.append("aadharCard",   docs.aadharCard.file,   docs.aadharCard.name);
  if (docs.panCard?.file)      fd.append("panCard",       docs.panCard.file,      docs.panCard.name);
  if (docs.bankPassbook?.file) fd.append("bankPassbook",  docs.bankPassbook.file, docs.bankPassbook.name);

  return fd;
}

const employeeService = {

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

  submitRegistration: (registrationData, documents) => {
    console.log("📡 Submitting registration form...");
    const fd = new FormData();

    Object.entries(registrationData).forEach(([k, v]) => {
      if (v !== null && v !== undefined) {
        fd.append(k, String(v));
      }
    });

    if (documents) {
      Object.entries(documents).forEach(([k, file]) => {
        if (file instanceof File) {
          console.log(`  📎 Attaching: ${k} (${file.name})`);
          fd.append(k, file, file.name);
        }
      });
    }

    return apiFetch("/registrations", { method: "POST", body: fd });
  },

  getPrefillData: (token) => {
    console.log(`📡 Loading prefill data for resubmit token ${token}...`);
    return apiFetch(`/registrations/prefill/${token}`);
  },

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

  getNextEmployeeId: async () => {
    const res = await apiFetch('/employees/next-id');
    return res.nextId;
  },

  getPendingCount: async () => {
    try {
      const response = await apiFetch("/employees/pending-count");
      return response.count || 0;
    } catch (error) {
      console.error("❌ Error fetching pending count:", error);
      return 0;
    }
  },

  getDocReviewedEmployees: async () => {
    console.log('📡 Fetching doc-reviewed employees...');
    return apiFetch('/employee-docs/reviewed');
  },

  getPendingDocCount: async () => {
    try {
      const res = await apiFetch('/employee-docs/pending');
      return res.count || 0;
    } catch {
      return 0;
    }
  },

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

Registration Link: ${registrationUrl}

This link expires on ${new Date(expiresAt).toLocaleString()} and can only be used once.

Regards,
HR Team — Insta ICT Solutions
        `.trim(),
      }),
    });
    return response.json();
  },

  sendFormSubmissionConfirmation: async ({ to, formData, isRejoin = false }) => {
    console.log(`📧 Sending form submission confirmation to ${to}...`);
    const response = await fetch(`${BASE_URL}/employees/send-submission-confirmation`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ to, formData, isRejoin }),
    });
    return response.json();
  },

  sendHRSubmissionNotification: async ({ formData, isRejoin = false }) => {
    console.log(`📧 Sending HR submission notification...`);
    const response = await fetch(`${BASE_URL}/employees/send-hr-notification`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ formData, isRejoin }),
    });
    return response.json();
  },

  sendRejoinInvite: async (employeeId) => {
    console.log(`📧 Sending rejoin invite to employee ${employeeId}...`);
    return apiFetch(`/employees/${employeeId}/send-rejoin-invite`, {
      method: "POST",
    });
  },

  checkRejoinLink: (linkId) => {
    console.log(`📡 Validating rejoin link ${linkId}...`);
    return apiFetch(`/registration-links/rejoin/${linkId}`);
  },

  checkAadhar: (aadhar) => {
    console.log(`📡 Checking Aadhaar ${aadhar}...`);
    return apiFetch(`/registrations/check-aadhar/${aadhar}`);
  },
};

export default employeeService;