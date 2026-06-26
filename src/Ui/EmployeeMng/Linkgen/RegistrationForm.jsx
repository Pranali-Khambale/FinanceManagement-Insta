// src/Ui/EmployeeMng/Linkgen/RegistrationForm.jsx

import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  AlertTriangle,
  Check,
  ChevronLeft,
  ChevronRight,
  Loader,
  UserCheck,
  Info,
  Save,
  CheckCircle2,
} from "lucide-react";
import employeeService from "../../../services/employeeService";
import PersonalInfo from "./PersonalInfo";
import EmploymentDetails from "./EmploymentDetails";
import BankDetailsinfo from "./BankDetailsinfo";
import Documents from "./Documents";

const FARM_TO_CLI_POSITIONS = ["dt engineer", "rigger", "technician"];

const EMPTY_FORM = {
  firstName: "",
  fatherHusbandName: "",
  lastName: "",
  email: "",
  phone: "",
  altPhone: "",
  dob: "",
  gender: "",
  maritalStatus: "",
  educationalQualification: "",
  bloodGroup: "",
  panNumber: "",
  nameOnPan: "",
  aadhar: "",
  nameOnAadhar: "",
  uanNumber: "",
  familyMemberName: "",
  familyContactNo: "",
  familyWorkingStatus: "",
  familyEmployerName: "",
  familyEmployerContact: "",
  emergencyContactName: "",
  emergencyContactNo: "",
  emergencyContactAddress: "",
  emergencyContactRelation: "",
  permanentAddress: "",
  permanentPhone: "",
  permanentLandmark: "",
  permanentLatLong: "",
  localSameAsPermanent: false,
  localAddress: "",
  localPhone: "",
  localLandmark: "",
  localLatLong: "",
  ref1Name: "",
  ref1Designation: "",
  ref1Organization: "",
  ref1Address: "",
  ref1CityStatePin: "",
  ref1ContactNo: "",
  ref1Email: "",
  ref2Name: "",
  ref2Designation: "",
  ref2Organization: "",
  ref2Address: "",
  ref2CityStatePin: "",
  ref2ContactNo: "",
  ref2Email: "",
  ref3Name: "",
  ref3Designation: "",
  ref3Organization: "",
  ref3Address: "",
  ref3CityStatePin: "",
  ref3ContactNo: "",
  ref3Email: "",
  employeeId: "",
  joiningDate: "",
  department: "",
  position: "",
  projectName: "",
  circle: "",
  reportingManager: "",
  employmentType: "",
  bankName: "",
  accountHolderName: "",
  accountNumber: "",
  confirmAccountNumber: "",
  ifscCode: "",
  bankBranch: "",
  idPhoto: null,
  aadharCard: null,
  panCard: null,
  resume: null,
  bankPassbook: null,
  medicalCertificate: null,
  academicRecords: null,
  payslip: null,
  farmToCli: null,
  otherCertificates: null,
};

const FILE_FIELDS = new Set([
  "idPhoto",
  "aadharCard",
  "panCard",
  "resume",
  "bankPassbook",
  "medicalCertificate",
  "academicRecords",
  "payslip",
  "farmToCli",
  "otherCertificates",
]);

const FRONTEND_ONLY = new Set(["confirmAccountNumber"]);

const STEP_LABELS = [
  "Personal Info",
  "Employment Details",
  "Bank Details",
  "Documents",
];

// ── Draft helpers ─────────────────────────────────────────────────────────────
const getDraftKey = (id) => `reg_draft_${id || "unknown"}`;

const saveDraft = (draftKey, formData, step) => {
  try {
    const scalarData = {};
    Object.entries(formData).forEach(([k, v]) => {
      if (!FILE_FIELDS.has(k)) scalarData[k] = v;
    });
    localStorage.setItem(
      draftKey,
      JSON.stringify({
        formData: scalarData,
        savedStep: step,
        savedAt: Date.now(),
      }),
    );
    return true;
  } catch {
    return false;
  }
};

const loadDraft = (draftKey) => {
  try {
    const raw = localStorage.getItem(draftKey);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
};

const clearDraft = (draftKey) => {
  try {
    localStorage.removeItem(draftKey);
  } catch {}
};

const RegistrationForm = () => {
  const { linkId, token } = useParams();
  const navigate = useNavigate();
  const isResubmit = Boolean(token);
  const draftKey = getDraftKey(linkId || token);

  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isRejoin, setIsRejoin] = useState(false);
  const [linkLoading, setLinkLoading] = useState(true);
  const [linkError, setLinkError] = useState("");
  const [errors, setErrors] = useState({});
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [rejectionReason, setRejectionReason] = useState("");
  const [hasDraft, setHasDraft] = useState(false);

  // ── applyPrefillData ───────────────────────────────────────────────────────
  const applyPrefillData = useCallback((prefill) => {
    setFormData((prev) => ({
      ...prev,
      firstName: prefill.firstName ?? prev.firstName,
      lastName: prefill.lastName ?? prev.lastName,
      fatherHusbandName: prefill.fatherHusbandName ?? prev.fatherHusbandName,
      dob: prefill.dob ?? prev.dob,
      gender: prefill.gender ?? prev.gender,
      maritalStatus: prefill.maritalStatus ?? prev.maritalStatus,
      educationalQualification:
        prefill.educationalQualification ?? prev.educationalQualification,
      bloodGroup: prefill.bloodGroup ?? prev.bloodGroup,
      panNumber: prefill.panNumber ?? prev.panNumber,
      nameOnPan: prefill.nameOnPan ?? prev.nameOnPan,
      aadhar: prefill.aadhar ?? prev.aadhar,
      nameOnAadhar: prefill.nameOnAadhar ?? prev.nameOnAadhar,
      uanNumber: prefill.uanNumber ?? prev.uanNumber,
      email: prefill.email ?? prev.email,
      phone: prefill.phone ?? prev.phone,
      altPhone: prefill.altPhone ?? prev.altPhone,
      permanentAddress: prefill.permanentAddress ?? prev.permanentAddress,
      permanentPhone: prefill.permanentPhone ?? prev.permanentPhone,
      permanentLandmark: prefill.permanentLandmark ?? prev.permanentLandmark,
      permanentLatLong: prefill.permanentLatLong ?? prev.permanentLatLong,
      localSameAsPermanent:
        prefill.localSameAsPermanent ?? prev.localSameAsPermanent,
      localAddress: prefill.localAddress ?? prev.localAddress,
      localPhone: prefill.localPhone ?? prev.localPhone,
      localLandmark: prefill.localLandmark ?? prev.localLandmark,
      localLatLong: prefill.localLatLong ?? prev.localLatLong,
      familyMemberName: prefill.familyMemberName ?? prev.familyMemberName,
      familyContactNo: prefill.familyContactNo ?? prev.familyContactNo,
      familyWorkingStatus:
        prefill.familyWorkingStatus ?? prev.familyWorkingStatus,
      familyEmployerName: prefill.familyEmployerName ?? prev.familyEmployerName,
      familyEmployerContact:
        prefill.familyEmployerContact ?? prev.familyEmployerContact,
      emergencyContactName:
        prefill.emergencyContactName ?? prev.emergencyContactName,
      emergencyContactNo: prefill.emergencyContactNo ?? prev.emergencyContactNo,
      emergencyContactAddress:
        prefill.emergencyContactAddress ?? prev.emergencyContactAddress,
      emergencyContactRelation:
        prefill.emergencyContactRelation ?? prev.emergencyContactRelation,
      ref1Name: prefill.ref1Name ?? prev.ref1Name,
      ref1Designation: prefill.ref1Designation ?? prev.ref1Designation,
      ref1Organization: prefill.ref1Organization ?? prev.ref1Organization,
      ref1Address: prefill.ref1Address ?? prev.ref1Address,
      ref1CityStatePin: prefill.ref1CityStatePin ?? prev.ref1CityStatePin,
      ref1ContactNo: prefill.ref1ContactNo ?? prev.ref1ContactNo,
      ref1Email: prefill.ref1Email ?? prev.ref1Email,
      ref2Name: prefill.ref2Name ?? prev.ref2Name,
      ref2Designation: prefill.ref2Designation ?? prev.ref2Designation,
      ref2Organization: prefill.ref2Organization ?? prev.ref2Organization,
      ref2Address: prefill.ref2Address ?? prev.ref2Address,
      ref2CityStatePin: prefill.ref2CityStatePin ?? prev.ref2CityStatePin,
      ref2ContactNo: prefill.ref2ContactNo ?? prev.ref2ContactNo,
      ref2Email: prefill.ref2Email ?? prev.ref2Email,
      ref3Name: prefill.ref3Name ?? prev.ref3Name,
      ref3Designation: prefill.ref3Designation ?? prev.ref3Designation,
      ref3Organization: prefill.ref3Organization ?? prev.ref3Organization,
      ref3Address: prefill.ref3Address ?? prev.ref3Address,
      ref3CityStatePin: prefill.ref3CityStatePin ?? prev.ref3CityStatePin,
      ref3ContactNo: prefill.ref3ContactNo ?? prev.ref3ContactNo,
      ref3Email: prefill.ref3Email ?? prev.ref3Email,
      employeeId: prefill.employeeId ?? prev.employeeId,
      department: prefill.department ?? prev.department,
      position: prefill.position ?? prev.position,
      joiningDate: prefill.joiningDate ?? prev.joiningDate,
      employmentType: prefill.employmentType ?? prev.employmentType,
      reportingManager: prefill.reportingManager ?? prev.reportingManager,
      circle: prefill.circle ?? prev.circle,
      projectName: prefill.projectName ?? prev.projectName,
      bankName: prefill.bankName ?? prev.bankName,
      accountNumber: prefill.accountNumber ?? prev.accountNumber,
      ifscCode: prefill.ifscCode ?? prev.ifscCode,
      accountHolderName: prefill.accountHolderName ?? prev.accountHolderName,
      bankBranch: prefill.bankBranch ?? prev.bankBranch,
      confirmAccountNumber: prefill.accountNumber ?? prev.confirmAccountNumber,
    }));
  }, []);

  // ── Load data on mount ────────────────────────────────────────────────────
  useEffect(() => {
    if (isResubmit) {
      if (!token) {
        setLinkError("Invalid resubmission link — token is missing.");
        setLinkLoading(false);
        return;
      }

      const fetchPrefill = async () => {
        setLinkLoading(true);
        setLinkError("");
        try {
          const response = await employeeService.getPrefillData(token);
          if (!response?.success) {
            setLinkError(
              response?.message ||
                "This resubmission link is invalid or has expired.",
            );
            return;
          }
          const data = response.data;
          if (data) {
            if (data.rejectionReason) setRejectionReason(data.rejectionReason);
            applyPrefillData(data);
            clearDraft(draftKey);
          }
        } catch (err) {
          const draft = loadDraft(draftKey);
          if (draft?.formData) {
            applyPrefillData(draft.formData);
            if (draft.savedStep) setCurrentStep(draft.savedStep);
            setHasDraft(true);
          }
          setLinkError(
            "Failed to load your previous submission data. Please try again.",
          );
          console.error("[RegistrationForm] getPrefillData error:", err);
        } finally {
          setLinkLoading(false);
        }
      };

      fetchPrefill();
      return;
    }

    if (!linkId) {
      const draft = loadDraft(draftKey);
      if (draft?.formData) {
        applyPrefillData(draft.formData);
        if (draft.savedStep) setCurrentStep(draft.savedStep);
        setHasDraft(true);
      }
      setLinkLoading(false);
      return;
    }

    const validateAndPrefill = async () => {
      setLinkLoading(true);
      setLinkError("");
      try {
        const response = await employeeService.validateLink(linkId);
        if (!response?.valid) {
          setLinkError(
            response?.message ||
              (response?.expired
                ? "This registration link has expired."
                : response?.used
                  ? "This registration link has already been used."
                  : "Invalid registration link."),
          );
          return;
        }

        const rejoin = response.isRejoin === true;
        setIsRejoin(rejoin);

        if (rejoin) {
          const prefill = response.prefillData || response.data?.prefillData;
          if (prefill) {
            applyPrefillData(prefill);
            clearDraft(draftKey);
          }
        } else {
          const draft = loadDraft(draftKey);
          if (draft?.formData) {
            applyPrefillData(draft.formData);
            if (draft.savedStep) setCurrentStep(draft.savedStep);
            setHasDraft(true);
          }
        }
      } catch (err) {
        setLinkError(
          "Failed to validate the registration link. Please try again.",
        );
        console.error("[RegistrationForm] validateLink error:", err);
      } finally {
        setLinkLoading(false);
      }
    };

    validateAndPrefill();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [linkId, token, isResubmit]);

  const steps = [
    { id: 1, name: "Personal Info" },
    { id: 2, name: "Employment Details" },
    { id: 3, name: "Bank Details" },
    { id: 4, name: "Document Upload" },
  ];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const handleFileChange = (fieldName, file) => {
    setFormData((prev) => ({ ...prev, [fieldName]: file }));
    if (errors[fieldName]) setErrors((prev) => ({ ...prev, [fieldName]: "" }));
  };

  const checkFarmToCliRequirement = () => {
    const dept = (formData.department || "").toLowerCase().trim();
    const pos = (formData.position || "").toLowerCase().trim();
    return dept === "telecom" && FARM_TO_CLI_POSITIONS.includes(pos);
  };

  // ── Validation ────────────────────────────────────────────────────────────
  const validateStep = (step) => {
    const e = {};

    if (step === 1) {
      if (!formData.firstName) e.firstName = "First name is required";
      if (!formData.lastName) e.lastName = "Last name is required";
      if (!formData.dob) e.dob = "Date of birth is required";
      if (!formData.email) e.email = "Email is required";
      if (!formData.phone) e.phone = "Phone number is required";
      if (!formData.panNumber) e.panNumber = "PAN number is required";
      if (!formData.nameOnPan) e.nameOnPan = "Name on PAN is required";
      if (!formData.aadhar) e.aadhar = "Aadhaar number is required";
      if (!formData.nameOnAadhar)
        e.nameOnAadhar = "Name on Aadhaar is required";
      if (!formData.familyMemberName)
        e.familyMemberName = "Family member name is required";
      if (!formData.familyContactNo)
        e.familyContactNo = "Family contact number is required";
      if (!formData.familyWorkingStatus)
        e.familyWorkingStatus = "Working status is required";
      if (!formData.emergencyContactName)
        e.emergencyContactName = "Emergency contact name is required";
      if (!formData.emergencyContactNo)
        e.emergencyContactNo = "Emergency contact number is required";
      if (!formData.emergencyContactAddress)
        e.emergencyContactAddress = "Emergency contact address is required";
      if (!formData.emergencyContactRelation)
        e.emergencyContactRelation = "Relation is required";
      if (!formData.permanentAddress)
        e.permanentAddress = "Permanent address is required";
      if (!formData.permanentPhone)
        e.permanentPhone = "Permanent phone is required";
    }

    if (step === 2) {
      if (!formData.employeeId?.trim())
        e.employeeId = "Employee ID is required";
      else if (!/^Insta-\d{8,}$/.test(formData.employeeId.trim()))
        e.employeeId = "Format must be Insta-YYMMxxxx (e.g. Insta-26010001)";
      if (!formData.department) e.department = "Department is required";
      if (!formData.position) e.position = "Designation is required";
      if (!formData.joiningDate) e.joiningDate = "Joining date is required";
      if (!formData.employmentType)
        e.employmentType = "Employment type is required";
    }

    if (step === 3) {
      if (!formData.bankName) e.bankName = "Bank name is required";
      if (!formData.accountHolderName)
        e.accountHolderName = "Account holder name is required";
      if (!formData.accountNumber)
        e.accountNumber = "Account number is required";
      if (formData.confirmAccountNumber !== formData.accountNumber)
        e.confirmAccountNumber = "Account numbers do not match";
      if (!formData.ifscCode) e.ifscCode = "IFSC code is required";
    }

    if (step === 4) {
      if (!formData.idPhoto) e.idPhoto = "Photo is required";
      if (!formData.aadharCard) e.aadharCard = "Aadhaar card copy is required";
      if (!formData.resume) e.resume = "Resume is required";
      if (!formData.bankPassbook) e.bankPassbook = "Bank passbook is required";
      if (checkFarmToCliRequirement()) {
        if (!formData.farmToCli)
          e.farmToCli = "FARM-ToCli Certificate is mandatory for this role";
        if (!formData.medicalCertificate)
          e.medicalCertificate =
            "Medical Certificate is mandatory for this role";
      }
    }

    setErrors(e);
    return Object.keys(e).length === 0;
  };

  // ── Save & Continue ───────────────────────────────────────────────────────
  const handleSaveAndContinue = () => {
    if (!validateStep(currentStep)) return;

    setIsSaving(true);
    const ok = saveDraft(draftKey, formData, currentStep + 1);
    setIsSaving(false);

    if (ok) setHasDraft(true);

    setSaveSuccess(true);
    setTimeout(() => {
      setSaveSuccess(false);
      setCurrentStep((p) => p + 1);
    }, 700);
  };

  const handlePrev = () => setCurrentStep((p) => p - 1);

  // ── Submit ────────────────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!validateStep(currentStep)) return;

    setIsSubmitting(true);
    try {
      const fd = new FormData();

      if (isResubmit) {
        fd.append("resubmitToken", token);
      } else {
        fd.append("linkId", linkId);
        if (isRejoin) fd.append("isRejoin", "true");
      }

      Object.entries(formData).forEach(([key, val]) => {
        if (FRONTEND_ONLY.has(key)) return;
        if (FILE_FIELDS.has(key)) return;
        if (val === null || val === undefined) return;
        fd.append(key, String(val));
      });

      FILE_FIELDS.forEach((key) => {
        if (formData[key] instanceof File)
          fd.append(key, formData[key], formData[key].name);
      });

      let res;
      if (isResubmit) {
        res = await employeeService.resubmitRegistration(token, fd);
      } else {
        res = await employeeService.submitPublicRegistration(linkId, fd);
      }

      if (res?.success) {
        clearDraft(draftKey);

        // ── FIX: Pass one-time state so the success page can verify
        //    the user arrived via a real submission, not a direct URL visit.
        navigate("/success", {
          replace: true,
          state: {
            verified: true,
            submittedAt: Date.now(),
            type: isRejoin ? "rejoin" : isResubmit ? "resubmit" : "new",
          },
        });
      } else {
        setErrors({
          submit: res?.message || "Submission failed. Please try again.",
        });
      }
    } catch (err) {
      setErrors({
        submit: err?.message || "An error occurred while submitting.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Loading / error screens ───────────────────────────────────────────────
  if (linkLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <Loader className="w-10 h-10 text-blue-500 animate-spin mx-auto mb-3" />
          <p className="text-slate-600 font-medium">
            {isResubmit
              ? "Loading your previous submission…"
              : "Validating your registration link…"}
          </p>
        </div>
      </div>
    );
  }

  if (linkError) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-md p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="w-8 h-8 text-red-500" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">
            {isResubmit ? "Link Expired" : "Link Invalid"}
          </h2>
          <p className="text-gray-600">{linkError}</p>
        </div>
      </div>
    );
  }

  // ── Derive header metadata ────────────────────────────────────────────────
  const headerBg = isRejoin
    ? "bg-indigo-900"
    : isResubmit
      ? "bg-red-900"
      : "bg-slate-900";
  const headerTitle = isRejoin
    ? "Rejoin Registration"
    : isResubmit
      ? "Resubmit Registration"
      : "Employee Portal Registration";
  const headerNote = isRejoin
    ? "Your previous information has been pre-filled — please review and update as needed."
    : isResubmit
      ? "Your previously submitted information has been pre-filled — please correct any issues and re-upload your documents."
      : null;

  // ── Main render ───────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-slate-50 py-6 px-3 sm:py-12 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-md overflow-hidden">
        {/* ── Header ───────────────────────────────────────────────────────── */}
        <div className={`px-4 sm:px-6 py-4 ${headerBg}`}>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="min-w-0">
              <span className="text-white font-bold text-base sm:text-lg block truncate">
                {headerTitle}
              </span>
              {headerNote && (
                <p
                  className={`text-xs mt-0.5 ${isRejoin ? "text-indigo-300" : "text-red-300"}`}
                >
                  {headerNote}
                </p>
              )}
            </div>

            {/* Step progress */}
            <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
              {steps.map((s, idx) => (
                <React.Fragment key={s.id}>
                  <div className="flex flex-col items-center">
                    <div
                      className={`w-6 h-6 sm:w-7 sm:h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                        currentStep > s.id
                          ? "bg-green-400 text-white"
                          : currentStep === s.id
                            ? "bg-blue-400 text-white ring-2 ring-white ring-offset-1 ring-offset-transparent"
                            : "bg-slate-600 text-slate-400"
                      }`}
                    >
                      {currentStep > s.id ? (
                        <Check className="w-3 h-3" />
                      ) : (
                        s.id
                      )}
                    </div>
                    <span className="hidden lg:block text-xs mt-1 text-slate-400 whitespace-nowrap">
                      {s.name}
                    </span>
                  </div>
                  {idx < steps.length - 1 && (
                    <div
                      className={`h-0.5 w-4 sm:w-6 rounded-full transition-all ${
                        currentStep > s.id ? "bg-green-400" : "bg-slate-600"
                      }`}
                    />
                  )}
                </React.Fragment>
              ))}
            </div>
          </div>
        </div>

        {/* ── Draft restored notice ─────────────────────────────────────────── */}
        {hasDraft && !isRejoin && !isResubmit && (
          <div className="mx-4 sm:mx-6 mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-center gap-2 text-sm text-blue-700">
            <Info className="w-4 h-4 flex-shrink-0" />
            <span>Your previously saved progress has been restored.</span>
          </div>
        )}

        <div className="p-4 sm:p-8">
          {/* ── Rejection reason banner ───────────────────────────────────── */}
          {isResubmit && rejectionReason && (
            <div className="mb-6 p-4 bg-amber-50 border border-amber-300 rounded-lg flex items-start gap-3">
              <Info className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-amber-800 mb-0.5">
                  Your previous submission was rejected
                </p>
                <p className="text-sm text-amber-700">{rejectionReason}</p>
                <p className="text-xs text-amber-600 mt-1">
                  Please review the reason above, make the necessary
                  corrections, and re-upload all required documents before
                  resubmitting.
                </p>
              </div>
            </div>
          )}

          {/* ── Submit error ──────────────────────────────────────────────── */}
          {errors.submit && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 flex-shrink-0" />
              <span className="text-sm">{errors.submit}</span>
            </div>
          )}

          {/* ── Step content ──────────────────────────────────────────────── */}
          {currentStep === 1 && (
            <PersonalInfo
              formData={formData}
              errors={errors}
              onChange={handleInputChange}
            />
          )}
          {currentStep === 2 && (
            <EmploymentDetails
              formData={formData}
              errors={errors}
              onChange={handleInputChange}
            />
          )}
          {currentStep === 3 && (
            <BankDetailsinfo
              formData={formData}
              errors={errors}
              onChange={handleInputChange}
            />
          )}
          {currentStep === 4 && (
            <Documents
              formData={formData}
              errors={errors}
              onFileChange={handleFileChange}
              requiresFarmToCli={checkFarmToCliRequirement()}
            />
          )}

          {/* ── Navigation ────────────────────────────────────────────────── */}
          <div className="mt-8 pt-6 border-t">
            <div className="flex flex-col-reverse sm:flex-row sm:justify-between sm:items-center gap-3">
              {/* Previous */}
              <button
                type="button"
                onClick={handlePrev}
                disabled={currentStep === 1 || isSubmitting || isSaving}
                className="flex items-center justify-center gap-2 px-5 py-2.5 text-slate-600 rounded-lg font-medium hover:bg-slate-100 transition-all disabled:opacity-30 w-full sm:w-auto"
              >
                <ChevronLeft className="w-4 h-4" /> Previous
              </button>

              {/* Right-side action */}
              {currentStep < steps.length ? (
                // ── Save & Continue ──────────────────────────────────────────
                <button
                  type="button"
                  onClick={handleSaveAndContinue}
                  disabled={isSaving || isSubmitting}
                  className={`flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg font-medium transition-all shadow-sm w-full sm:w-auto text-sm ${
                    saveSuccess
                      ? "bg-green-500 text-white"
                      : "bg-blue-600 hover:bg-blue-700 text-white"
                  }`}
                >
                  {isSaving ? (
                    <>
                      <Loader className="w-4 h-4 animate-spin" /> Saving…
                    </>
                  ) : saveSuccess ? (
                    <>
                      <CheckCircle2 className="w-4 h-4" /> Saved!
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      Save & Continue
                      <ChevronRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              ) : (
                // ── Final step: Submit ───────────────────────────────────────
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={isSubmitting || isSaving}
                  className={`flex items-center justify-center gap-2 px-6 py-2.5 text-white rounded-lg font-medium transition-all disabled:opacity-50 shadow-sm w-full sm:w-auto ${
                    isRejoin
                      ? "bg-indigo-600 hover:bg-indigo-700"
                      : isResubmit
                        ? "bg-orange-600 hover:bg-orange-700"
                        : "bg-green-600 hover:bg-green-700"
                  }`}
                >
                  {isSubmitting ? (
                    <>
                      <Loader className="w-4 h-4 animate-spin" /> Submitting…
                    </>
                  ) : isRejoin ? (
                    <>
                      <UserCheck className="w-4 h-4" /> Submit Rejoin Request
                    </>
                  ) : isResubmit ? (
                    <>
                      <Check className="w-4 h-4" /> Resubmit Registration
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" /> Submit Registration
                    </>
                  )}
                </button>
              )}
            </div>

            {/* Step indicator text */}
            <p className="text-center text-xs text-slate-400 mt-4">
              Step {currentStep} of {steps.length} —{" "}
              {STEP_LABELS[currentStep - 1]}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegistrationForm;
