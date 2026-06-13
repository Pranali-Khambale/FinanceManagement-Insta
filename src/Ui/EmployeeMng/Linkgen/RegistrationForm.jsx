// src/Ui/EmployeeMng/Linkgen/RegistrationForm.jsx
//
// FIX: Resubmit flow now fetches previously submitted data via
//      GET /api/registrations/prefill/:token and pre-fills all form fields,
//      exactly the same way the rejoin flow uses applyPrefillData().
//      The rejection reason is shown as a banner on step 1.

import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  AlertTriangle,
  Check,
  ChevronLeft,
  ChevronRight,
  Loader,
  UserCheck,
  Info,
} from "lucide-react";
import employeeService from "../../../services/employeeService";
import PersonalInfo from "./PersonalInfo";
import EmploymentDetails from "./EmploymentDetails";
import BankDetailsinfo from "./BankDetailsinfo";
import Documents from "./Documents";

const FARM_TO_CLI_POSITIONS = ["dt engineer", "rigger", "technician"];

const EMPTY_FORM = {
  // ── Personal ──────────────────────────────────────────────────────────────
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
  // ── Family ────────────────────────────────────────────────────────────────
  familyMemberName: "",
  familyContactNo: "",
  familyWorkingStatus: "",
  familyEmployerName: "",
  familyEmployerContact: "",
  // ── Emergency ─────────────────────────────────────────────────────────────
  emergencyContactName: "",
  emergencyContactNo: "",
  emergencyContactAddress: "",
  emergencyContactRelation: "",
  // ── Permanent address ─────────────────────────────────────────────────────
  permanentAddress: "",
  permanentPhone: "",
  permanentLandmark: "",
  permanentLatLong: "",
  // ── Local address ─────────────────────────────────────────────────────────
  localSameAsPermanent: false,
  localAddress: "",
  localPhone: "",
  localLandmark: "",
  localLatLong: "",
  // ── References ────────────────────────────────────────────────────────────
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
  // ── Employment ────────────────────────────────────────────────────────────
  employeeId: "",
  joiningDate: "",
  department: "",
  position: "",
  projectName: "",
  circle: "",
  reportingManager: "",
  employmentType: "",
  // ── Bank ──────────────────────────────────────────────────────────────────
  bankName: "",
  accountHolderName: "",
  accountNumber: "",
  confirmAccountNumber: "",
  ifscCode: "",
  bankBranch: "",
  // ── Documents (File objects — never prefilled) ────────────────────────────
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

const RegistrationForm = () => {
  const { linkId, token } = useParams();
  const navigate = useNavigate();
  const isResubmit = Boolean(token);

  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRejoin, setIsRejoin] = useState(false);
  const [linkLoading, setLinkLoading] = useState(true); // always true on mount; both flows load
  const [linkError, setLinkError] = useState("");
  const [errors, setErrors] = useState({});
  const [formData, setFormData] = useState(EMPTY_FORM);
  // Rejection reason shown to the employee on resubmit
  const [rejectionReason, setRejectionReason] = useState("");

  // ── applyPrefillData ───────────────────────────────────────────────────────
  // Shared helper used by both rejoin (from validateLink) and resubmit
  // (from getPrefillData). Only scalar fields are applied — file fields are
  // intentionally omitted so the employee must re-upload documents.
  const applyPrefillData = (prefill) => {
    setFormData((prev) => ({
      ...prev,
      // Personal
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
      // Contact
      email: prefill.email ?? prev.email,
      phone: prefill.phone ?? prev.phone,
      altPhone: prefill.altPhone ?? prev.altPhone,
      // Permanent address
      permanentAddress: prefill.permanentAddress ?? prev.permanentAddress,
      permanentPhone: prefill.permanentPhone ?? prev.permanentPhone,
      permanentLandmark: prefill.permanentLandmark ?? prev.permanentLandmark,
      permanentLatLong: prefill.permanentLatLong ?? prev.permanentLatLong,
      // Local address
      localSameAsPermanent:
        prefill.localSameAsPermanent ?? prev.localSameAsPermanent,
      localAddress: prefill.localAddress ?? prev.localAddress,
      localPhone: prefill.localPhone ?? prev.localPhone,
      localLandmark: prefill.localLandmark ?? prev.localLandmark,
      localLatLong: prefill.localLatLong ?? prev.localLatLong,
      // Family
      familyMemberName: prefill.familyMemberName ?? prev.familyMemberName,
      familyContactNo: prefill.familyContactNo ?? prev.familyContactNo,
      familyWorkingStatus:
        prefill.familyWorkingStatus ?? prev.familyWorkingStatus,
      familyEmployerName: prefill.familyEmployerName ?? prev.familyEmployerName,
      familyEmployerContact:
        prefill.familyEmployerContact ?? prev.familyEmployerContact,
      // Emergency
      emergencyContactName:
        prefill.emergencyContactName ?? prev.emergencyContactName,
      emergencyContactNo: prefill.emergencyContactNo ?? prev.emergencyContactNo,
      emergencyContactAddress:
        prefill.emergencyContactAddress ?? prev.emergencyContactAddress,
      emergencyContactRelation:
        prefill.emergencyContactRelation ?? prev.emergencyContactRelation,
      // References
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
      // Employment
      employeeId: prefill.employeeId ?? prev.employeeId,
      department: prefill.department ?? prev.department,
      position: prefill.position ?? prev.position,
      joiningDate: prefill.joiningDate ?? prev.joiningDate,
      employmentType: prefill.employmentType ?? prev.employmentType,
      reportingManager: prefill.reportingManager ?? prev.reportingManager,
      circle: prefill.circle ?? prev.circle,
      projectName: prefill.projectName ?? prev.projectName,
      // Bank
      bankName: prefill.bankName ?? prev.bankName,
      accountNumber: prefill.accountNumber ?? prev.accountNumber,
      ifscCode: prefill.ifscCode ?? prev.ifscCode,
      accountHolderName: prefill.accountHolderName ?? prev.accountHolderName,
      bankBranch: prefill.bankBranch ?? prev.bankBranch,
      // Mirror accountNumber into confirmAccountNumber for resubmit convenience
      confirmAccountNumber: prefill.accountNumber ?? prev.confirmAccountNumber,
      // File fields intentionally omitted — employee must re-upload documents
    }));
  };

  // ── Load data on mount ────────────────────────────────────────────────────
  useEffect(() => {
    // ── RESUBMIT flow: fetch previously submitted data via token ─────────────
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
            // Show rejection reason as a banner above the form
            if (data.rejectionReason) {
              setRejectionReason(data.rejectionReason);
            }
            applyPrefillData(data);
          }
        } catch (err) {
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

    // ── NEW / REJOIN flow: validate the registration link ────────────────────
    if (!linkId) {
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
          if (prefill) applyPrefillData(prefill);
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

  const handleNext = () => {
    if (validateStep(currentStep)) setCurrentStep((p) => p + 1);
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

      const FRONTEND_ONLY = new Set(["confirmAccountNumber"]);
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
        navigate("/success");
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
    <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-md overflow-hidden">
        {/* Step header */}
        <div
          className={`px-6 py-4 flex items-center justify-between ${headerBg}`}
        >
          <div>
            <span className="text-white font-bold text-lg">{headerTitle}</span>
            {headerNote && (
              <p
                className={`text-xs mt-0.5 ${isRejoin ? "text-indigo-300" : "text-red-300"}`}
              >
                {headerNote}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2">
            {steps.map((s) => (
              <div
                key={s.id}
                className={`w-3 h-3 rounded-full ${currentStep >= s.id ? "bg-blue-400" : "bg-slate-700"}`}
              />
            ))}
          </div>
        </div>

        <div className="p-8">
          {/* Rejection reason banner — only shown on resubmit */}
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

          {errors.submit && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 flex-shrink-0" />
              <span>{errors.submit}</span>
            </div>
          )}

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

          {/* Navigation */}
          <div className="mt-8 pt-6 border-t flex justify-between items-center">
            <button
              type="button"
              onClick={handlePrev}
              disabled={currentStep === 1 || isSubmitting}
              className="flex items-center gap-2 px-5 py-2.5 text-slate-600 rounded-lg font-medium hover:bg-slate-100 transition-all disabled:opacity-30"
            >
              <ChevronLeft className="w-4 h-4" /> Previous
            </button>

            {currentStep < steps.length ? (
              <button
                type="button"
                onClick={handleNext}
                className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-all shadow-sm"
              >
                Next <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={isSubmitting}
                className={`flex items-center gap-2 px-6 py-2.5 text-white rounded-lg font-medium transition-all disabled:opacity-50 shadow-sm ${
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
        </div>
      </div>
    </div>
  );
};

export default RegistrationForm;
