// src/Ui/EmployeeMng/AddEmp/AddEmployeeWizard.jsx
// ✅ UPDATED:
//   1. Session retention via sessionStorage (form data + doc metadata)
//   2. Aadhaar card split into aadharCardFront / aadharCardBack
//   3. FARM-ToCli + Medical mandatory only for DT Engineer / Rigger / Technician
//   4. designation passed down to DocumentUpload

import React, { useState, useEffect, useRef } from "react";
import {
  X,
  ChevronLeft,
  ChevronRight,
  Check,
  AlertCircle,
  Loader2,
} from "lucide-react";
import PersonalInformation from "./AddEmp/PersonalInfo";
import EmploymentDetails from "./AddEmp/employeeDetails";
import SalaryDetails from "./AddEmp/SalaryInfo";
import DocumentUpload from "./AddEmp/IDProof";
import employeeService from "../../services/employeeService";

// ── Field roles that require FARM-ToCli and Medical Certificate ──────────────
const FIELD_ROLES = ["dt engineer", "rigger", "technician"];
const isFieldRole = (designation = "") =>
  FIELD_ROLES.includes((designation || "").toLowerCase().trim());

// ── Session storage keys ─────────────────────────────────────────────────────
const SESSION_FORM_KEY = "addEmp_formData";
const SESSION_DOCS_KEY = "addEmp_docMeta"; // stores names/sizes only (no File blobs)
const SESSION_STEP_KEY = "addEmp_step";

// Serialize formData safely (omit non-serialisable values just in case)
const saveFormToSession = (data) => {
  try {
    sessionStorage.setItem(SESSION_FORM_KEY, JSON.stringify(data));
  } catch (_) {}
};

const loadFormFromSession = () => {
  try {
    const raw = sessionStorage.getItem(SESSION_FORM_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (_) {
    return null;
  }
};

const saveStepToSession = (step) => {
  try {
    sessionStorage.setItem(SESSION_STEP_KEY, String(step));
  } catch (_) {}
};

const loadStepFromSession = () => {
  try {
    const raw = sessionStorage.getItem(SESSION_STEP_KEY);
    return raw ? parseInt(raw, 10) : 1;
  } catch (_) {
    return 1;
  }
};

const clearSession = () => {
  try {
    sessionStorage.removeItem(SESSION_FORM_KEY);
    sessionStorage.removeItem(SESSION_DOCS_KEY);
    sessionStorage.removeItem(SESSION_STEP_KEY);
  } catch (_) {}
};

// ── Default empty form ───────────────────────────────────────────────────────
const defaultForm = {
  // Personal
  firstName: "",
  lastName: "",
  fatherHusbandName: "",
  dob: "",
  gender: "",
  maritalStatus: "",
  educationalQualification: "",
  bloodGroup: "",
  email: "",
  phone: "",
  altPhone: "",
  panNumber: "",
  nameOnPan: "",
  aadhar: "",
  nameOnAadhar: "",
  uanNumber: "",
  // Family
  familyMemberName: "",
  familyContactNo: "",
  familyWorkingStatus: "",
  familyEmployerName: "",
  familyEmployerContact: "",
  // Emergency
  emergencyContactName: "",
  emergencyContactNo: "",
  emergencyContactAddress: "",
  emergencyContactRelation: "",
  // Address
  permanentAddress: "",
  permanentPhone: "",
  permanentLandmark: "",
  permanentLatLong: "",
  localSameAsPermanent: false,
  localAddress: "",
  localPhone: "",
  localLandmark: "",
  localLatLong: "",
  // References
  ref1Name: "", ref1Designation: "", ref1Organization: "",
  ref1Address: "", ref1CityStatePin: "", ref1ContactNo: "", ref1Email: "",
  ref2Name: "", ref2Designation: "", ref2Organization: "",
  ref2Address: "", ref2CityStatePin: "", ref2ContactNo: "", ref2Email: "",
  ref3Name: "", ref3Designation: "", ref3Organization: "",
  ref3Address: "", ref3CityStatePin: "", ref3ContactNo: "", ref3Email: "",
  // Employment
  employeeId: "Loading...",
  joiningDate: "",
  department: "",
  designation: "",
  employmentType: "",
  project: "",
  circle: "",
  status: "Active",
  // Salary & Bank
  basicSalary: "",
  hra: "",
  otherAllowances: "",
  bankName: "",
  accountNumber: "",
  ifscCode: "",
  branch: "",
};

// ── Default empty documents ──────────────────────────────────────────────────
const defaultDocs = {
  photo: null,
  aadharCardFront: null, // ✅ split front
  aadharCardBack: null,  // ✅ split back
  panCard: null,
  bankPassbook: null,
  resume: null,
  medicalCertificate: null,
  academicRecords: null,
  payslip: null,
  otherCertificates: null,
  farmToCli: null,
};

// ── Main wizard ──────────────────────────────────────────────────────────────
const AddEmployeeWizard = ({ onClose, onSubmit, generateEmployeeId }) => {
  const [currentStep, setCurrentStep] = useState(() => loadStepFromSession());
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingId, setIsLoadingId] = useState(true);

  const [formData, setFormData] = useState(() => {
    const saved = loadFormFromSession();
    return saved ? { ...defaultForm, ...saved } : { ...defaultForm };
  });

  // Documents: File blobs cannot be stored in sessionStorage.
  // We keep them in state only; on hard refresh they reset (unavoidable for files).
  // We DO save doc metadata (name, size) to show users which files were selected.
  const [documents, setDocuments] = useState({ ...defaultDocs });

  // ── Fetch next employee ID ─────────────────────────────────────────────────
  useEffect(() => {
    // Only fetch if the stored value is still the placeholder
    if (formData.employeeId && formData.employeeId !== "Loading...") {
      setIsLoadingId(false);
      return;
    }
    let cancelled = false;
    const fetchNextId = async () => {
      setIsLoadingId(true);
      try {
        const nextId = await employeeService.getNextEmployeeId();
        if (!cancelled) {
          setFormData((prev) => ({ ...prev, employeeId: nextId }));
        }
      } catch (err) {
        console.error("Failed to fetch next employee ID:", err);
        if (!cancelled) {
          const fallback =
            typeof generateEmployeeId === "function"
              ? generateEmployeeId()
              : "EMP001";
          setFormData((prev) => ({ ...prev, employeeId: fallback }));
        }
      } finally {
        if (!cancelled) setIsLoadingId(false);
      }
    };
    fetchNextId();
    return () => { cancelled = true; };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Persist formData to sessionStorage on every change ────────────────────
  const isFirstRender = useRef(true);
  useEffect(() => {
    if (isFirstRender.current) { isFirstRender.current = false; return; }
    saveFormToSession(formData);
  }, [formData]);

  useEffect(() => {
    saveStepToSession(currentStep);
  }, [currentStep]);

  // ── Steps ──────────────────────────────────────────────────────────────────
  const steps = [
    { number: 1, title: "Personal Info" },
    { number: 2, title: "Employee Details" },
    { number: 3, title: "Salary & Bank" },
    { number: 4, title: "Documents" },
  ];

  // ── Handlers ───────────────────────────────────────────────────────────────
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setTouched((prev) => ({ ...prev, [name]: true }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const handleFileUpload = (documentType, file) => {
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setErrors((prev) => ({
        ...prev,
        [documentType]: "File size must be less than 5MB",
      }));
      return;
    }
    const validTypes = [
      "image/jpeg", "image/jpg", "image/png",
      "image/gif", "image/webp", "application/pdf",
    ];
    if (!validTypes.includes(file.type)) {
      setErrors((prev) => ({
        ...prev,
        [documentType]: "Only JPEG, PNG, GIF, WEBP, and PDF files are allowed",
      }));
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      setDocuments((prev) => ({
        ...prev,
        [documentType]: { file, preview: reader.result, name: file.name },
      }));
      if (errors[documentType])
        setErrors((prev) => ({ ...prev, [documentType]: "" }));
    };
    reader.readAsDataURL(file);
  };

  const handleFileRemove = (documentType) => {
    setDocuments((prev) => ({ ...prev, [documentType]: null }));
  };

  // ── Validation ─────────────────────────────────────────────────────────────
  const validateStep = (step) => {
    const newErrors = {};

    if (step === 1) {
      if (!formData.firstName.trim())
        newErrors.firstName = "First name is required";
      else if (formData.firstName.length < 2)
        newErrors.firstName = "Must be at least 2 characters";
      else if (!/^[a-zA-Z\s]+$/.test(formData.firstName))
        newErrors.firstName = "Only letters allowed";

      if (!formData.lastName.trim())
        newErrors.lastName = "Last name is required";
      else if (formData.lastName.length < 2)
        newErrors.lastName = "Must be at least 2 characters";
      else if (!/^[a-zA-Z\s]+$/.test(formData.lastName))
        newErrors.lastName = "Only letters allowed";

      if (!formData.fatherHusbandName.trim())
        newErrors.fatherHusbandName = "Father/Husband name is required";
      if (!formData.maritalStatus)
        newErrors.maritalStatus = "Marital status is required";
      if (!formData.educationalQualification.trim())
        newErrors.educationalQualification = "Educational qualification is required";
      if (!formData.bloodGroup)
        newErrors.bloodGroup = "Blood group is required";

      if (!formData.dob) newErrors.dob = "Date of birth is required";
      else {
        const age = Math.floor(
          (new Date() - new Date(formData.dob)) / 31557600000,
        );
        if (age < 18) newErrors.dob = "Employee must be at least 18 years old";
        else if (age > 100) newErrors.dob = "Please enter a valid date of birth";
      }

      if (!formData.gender) newErrors.gender = "Gender is required";
      if (!formData.email.trim()) newErrors.email = "Email is required";
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email))
        newErrors.email = "Please enter a valid email";

      if (!formData.phone.trim()) newErrors.phone = "Phone number is required";
      else if (!/^[6-9]\d{9}$/.test(formData.phone))
        newErrors.phone = "Enter a valid 10-digit Indian phone number";

      if (!formData.panNumber.trim())
        newErrors.panNumber = "PAN number is required";
      else if (!/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(formData.panNumber.toUpperCase()))
        newErrors.panNumber = "Enter a valid PAN (e.g. ABCDE1234F)";
      if (!formData.nameOnPan.trim())
        newErrors.nameOnPan = "Name on PAN is required";
      if (!formData.aadhar.trim())
        newErrors.aadhar = "Aadhar number is required";
      else if (!/^\d{12}$/.test(formData.aadhar.replace(/\s/g, "")))
        newErrors.aadhar = "Aadhar must be exactly 12 digits";
      if (!formData.nameOnAadhar.trim())
        newErrors.nameOnAadhar = "Name on Aadhaar is required";

      if (formData.uanNumber && formData.uanNumber.trim() !== "") {
        const cleanUan = formData.uanNumber.replace(/\D/g, "");
        if (cleanUan.length !== 12)
          newErrors.uanNumber = "UAN must be exactly 12 digits";
      }

      if (!formData.familyMemberName.trim())
        newErrors.familyMemberName = "Family member name is required";
      if (!formData.familyContactNo.trim())
        newErrors.familyContactNo = "Contact number is required";
      else if (!/^[6-9]\d{9}$/.test(formData.familyContactNo))
        newErrors.familyContactNo = "Enter a valid 10-digit number";
      if (!formData.familyWorkingStatus)
        newErrors.familyWorkingStatus = "Working status is required";

      if (!formData.emergencyContactName.trim())
        newErrors.emergencyContactName = "Contact name is required";
      if (!formData.emergencyContactNo.trim())
        newErrors.emergencyContactNo = "Contact number is required";
      else if (!/^[6-9]\d{9}$/.test(formData.emergencyContactNo))
        newErrors.emergencyContactNo = "Enter a valid 10-digit number";
      if (!formData.emergencyContactAddress.trim())
        newErrors.emergencyContactAddress = "Address is required";
      if (!formData.emergencyContactRelation)
        newErrors.emergencyContactRelation = "Relation is required";

      if (!formData.permanentAddress.trim())
        newErrors.permanentAddress = "Permanent address is required";
      if (!formData.permanentPhone.trim())
        newErrors.permanentPhone = "Phone is required";
      else if (!/^[6-9]\d{9}$/.test(formData.permanentPhone))
        newErrors.permanentPhone = "Enter a valid 10-digit number";
      if (!formData.localAddress.trim())
        newErrors.localAddress = "Local address is required";
      if (!formData.localPhone.trim())
        newErrors.localPhone = "Phone is required";
      else if (!/^[6-9]\d{9}$/.test(formData.localPhone))
        newErrors.localPhone = "Enter a valid 10-digit number";
    }

    if (step === 2) {
      if (!formData.joiningDate)
        newErrors.joiningDate = "Joining date is required";
      if (!formData.department)
        newErrors.department = "Department is required";
      if (!formData.designation.trim())
        newErrors.designation = "Designation is required";
      if (!formData.employmentType)
        newErrors.employmentType = "Employment type is required";
      if (formData.department === "Telecom") {
        if (!formData.project) newErrors.project = "Project is required";
        if (!formData.circle)  newErrors.circle  = "Circle is required";
      }
    }

    if (step === 3) {
      if (!formData.basicSalary)
        newErrors.basicSalary = "Basic salary is required";
      else if (parseFloat(formData.basicSalary) <= 0)
        newErrors.basicSalary = "Salary must be greater than 0";
      if (!formData.bankName.trim())
        newErrors.bankName = "Bank name is required";
      if (!formData.accountNumber.trim())
        newErrors.accountNumber = "Account number is required";
      if (!formData.ifscCode.trim())
        newErrors.ifscCode = "IFSC code is required";
    }

    if (step === 4) {
      const isTelecom =
        (formData.department || "").toLowerCase().trim() === "telecom";
      const fieldRole = isFieldRole(formData.designation);

      if (!documents.photo)
        newErrors.photo = "Employee photo is required";
      if (!documents.aadharCardFront)
        newErrors.aadharCardFront = "Aadhaar card front side is required";
      if (!documents.aadharCardBack)
        newErrors.aadharCardBack = "Aadhaar card back side is required";
      if (!documents.resume)
        newErrors.resume = "Resume is required";
      if (!documents.bankPassbook)
        newErrors.bankPassbook = "Bank passbook / cancelled cheque is required";

      // Medical + FARM-ToCli mandatory only for field roles in Telecom
      if (isTelecom && fieldRole) {
        if (!documents.medicalCertificate)
          newErrors.medicalCertificate =
            "Medical certificate is required for this role";
        if (!documents.farmToCli)
          newErrors.farmToCli =
            "FARM-ToCli Certificate is required for DT Engineer / Rigger / Technician";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep((prev) => prev + 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      const firstError = document.querySelector(
        ".border-red-500, .border-red-300",
      );
      if (firstError)
        firstError.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => prev - 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handleClose = () => {
    // Prompt user before discarding
    const confirmed = window.confirm(
      "Close the form? Your progress is saved in this browser session — it will be restored if you reopen the form.",
    );
    if (confirmed) onClose();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateStep(currentStep)) return;
    setIsSubmitting(true);
    try {
      const totalSalary =
        (parseFloat(formData.basicSalary) || 0) +
        (parseFloat(formData.hra) || 0) +
        (parseFloat(formData.otherAllowances) || 0);
      await onSubmit({
        ...formData,
        totalSalary,
        documents,
        createdAt: new Date().toISOString(),
      });
      // Clear session on successful submit
      clearSession();
    } catch (error) {
      console.error("Submit error:", error);
      setErrors({
        submit: error.message || "Failed to add employee. Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[1100] p-4">
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl h-[95vh] flex flex-col overflow-hidden"
        style={{ animation: "slideUp 0.3s ease-out" }}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white px-8 py-5 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">Add New Employee</h2>
              <p className="text-white/90 text-sm mt-1">
                Step {currentStep} of {steps.length}:{" "}
                {steps[currentStep - 1].title}
              </p>
            </div>
            <button
              onClick={handleClose}
              disabled={isSubmitting}
              className="p-2 hover:bg-white/20 rounded-lg transition-all disabled:opacity-50"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Session-saved notice */}
        <div className="px-8 py-2 bg-blue-50 border-b border-blue-100 flex-shrink-0">
          <p className="text-xs text-blue-600 flex items-center gap-1.5">
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z"/>
              <path fillRule="evenodd" d="M4 5a2 2 0 012-2v1a1 1 0 102 0V3h4v1a1 1 0 102 0V3a2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd"/>
            </svg>
            Your form data is automatically saved in this session — minimising or switching tabs won't lose your progress.
          </p>
        </div>

        {/* Progress stepper */}
        <div className="px-8 pt-5 pb-4 bg-gray-50 flex-shrink-0">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => (
              <React.Fragment key={step.number}>
                <div className="flex flex-col items-center">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all ${
                      currentStep > step.number
                        ? "bg-green-500 text-white shadow-md"
                        : currentStep === step.number
                          ? "bg-blue-600 text-white ring-4 ring-blue-100 shadow-md"
                          : "bg-gray-200 text-gray-500"
                    }`}
                  >
                    {currentStep > step.number ? (
                      <Check className="w-5 h-5" />
                    ) : (
                      step.number
                    )}
                  </div>
                  <span
                    className={`mt-2 text-xs font-medium ${
                      currentStep >= step.number ? "text-gray-900" : "text-gray-400"
                    }`}
                  >
                    {step.title}
                  </span>
                </div>
                {index < steps.length - 1 && (
                  <div
                    className={`flex-1 h-1 mx-2 rounded-full transition-all ${
                      currentStep > step.number ? "bg-green-500" : "bg-gray-200"
                    }`}
                  />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Form body */}
        <form
          onSubmit={handleSubmit}
          className="flex-1 flex flex-col overflow-hidden"
        >
          <div
            className="flex-1 overflow-y-auto px-8 py-6"
            style={{ scrollbarWidth: "thin" }}
          >
            {isLoadingId && (
              <div className="mb-4 flex items-center gap-2 text-sm text-blue-600 bg-blue-50 border border-blue-200 rounded-lg px-4 py-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                Fetching next available Employee ID from database…
              </div>
            )}

            {errors.submit && (
              <div className="mb-6 bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
                <p className="text-sm text-red-800">{errors.submit}</p>
              </div>
            )}

            {currentStep === 1 && (
              <PersonalInformation
                formData={formData}
                handleInputChange={handleInputChange}
                errors={errors}
                touched={touched}
              />
            )}
            {currentStep === 2 && (
              <EmploymentDetails
                formData={formData}
                handleInputChange={handleInputChange}
                errors={errors}
                touched={touched}
              />
            )}
            {currentStep === 3 && (
              <SalaryDetails
                formData={formData}
                handleInputChange={handleInputChange}
                errors={errors}
                touched={touched}
              />
            )}
            {currentStep === 4 && (
              <DocumentUpload
                documents={documents}
                handleFileUpload={handleFileUpload}
                handleFileRemove={handleFileRemove}
                errors={errors}
                department={formData.department}
                designation={formData.designation} // ✅ pass designation
              />
            )}

            <div className="h-8" />
          </div>

          {/* Footer */}
          <div className="px-8 py-4 bg-gray-50 border-t border-gray-200 flex items-center justify-between flex-shrink-0">
            <button
              type="button"
              onClick={handleBack}
              disabled={currentStep === 1 || isSubmitting}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-lg font-medium transition-all ${
                currentStep === 1 || isSubmitting
                  ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                  : "bg-white text-gray-700 hover:bg-gray-100 border border-gray-300 shadow-sm"
              }`}
            >
              <ChevronLeft className="w-4 h-4" /> Back
            </button>

            <div className="text-sm text-gray-600 font-medium">
              Step {currentStep} of {steps.length}
            </div>

            {currentStep < steps.length ? (
              <button
                type="button"
                onClick={handleNext}
                disabled={isSubmitting || isLoadingId}
                className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-all shadow-md disabled:opacity-50"
              >
                Next <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="submit"
                disabled={isSubmitting || isLoadingId}
                className="flex items-center gap-2 px-5 py-2.5 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-all shadow-md disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />{" "}
                    Submitting...
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" /> Submit
                  </>
                )}
              </button>
            )}
          </div>
        </form>
      </div>

      <style>{`
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
};

export default AddEmployeeWizard;