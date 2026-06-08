// src/Ui/EmployeeMng/Linkgen/RegistrationForm.jsx
// ✅ FIXED: Every formData key matches the exact `name` / `fieldName` used in
//           each child component AND the camelCase key the backend controller
//           reads from req.body (buildCommonFields).
//           • linkId injected into FormData before POST
//           • resubmitToken injected for resubmit flow
//           • confirmAccountNumber excluded from server payload (frontend-only)
//           • submitPublicRegistration / resubmitRegistration called correctly

import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  AlertTriangle,
  Check,
  ChevronLeft,
  ChevronRight,
  Loader,
  UserCheck,
} from "lucide-react";
import employeeService from "../../../services/employeeService";
import PersonalInfo from "./PersonalInfo";
import EmploymentDetails from "./EmploymentDetails";
import BankDetailsinfo from "./BankDetailsinfo";
import Documents from "./Documents";

// Medical Certificate + FARM-ToCli mandatory ONLY for these three roles in Telecom
const FARM_TO_CLI_POSITIONS = ["dt engineer", "rigger", "technician"];

const RegistrationForm = () => {
  const { linkId, token } = useParams();
  const navigate = useNavigate();
  const isResubmit = Boolean(token);

  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRejoin] = useState(false);
  const [errors, setErrors] = useState({});

  // ─────────────────────────────────────────────────────────────────────────
  // KEY RULE: every key here must EXACTLY match the `name` attribute in the
  // child component that writes it, AND the camelCase name the backend reads.
  //
  // DB column          → backend reads (req.body key) → formData key here
  // ─────────────────────────────────────────────────────────────────────────
  const [formData, setFormData] = useState({
    // ── Personal (PersonalInfo.jsx) ────────────────────────────────────────
    firstName: "", // name="firstName"        → first_name
    fatherHusbandName: "", // name="fatherHusbandName"→ father_husband_name
    lastName: "", // name="lastName"         → last_name
    email: "", // name="email"            → email
    phone: "", // name="phone"            → phone
    altPhone: "", // name="altPhone"         → alt_phone
    dob: "", // name="dob"              → date_of_birth
    gender: "", // name="gender"           → gender
    maritalStatus: "", // name="maritalStatus"    → marital_status
    educationalQualification: "", // name="educationalQualification" → educational_qualification
    bloodGroup: "", // name="bloodGroup"       → blood_group
    panNumber: "", // name="panNumber"        → pan_number
    nameOnPan: "", // name="nameOnPan"        → name_on_pan
    aadhar: "", // name="aadhar"           → aadhar_number
    nameOnAadhar: "", // name="nameOnAadhar"     → name_on_aadhar
    uanNumber: "", // name="uanNumber"        → uan_number

    // ── Family (PersonalInfo.jsx) ──────────────────────────────────────────
    familyMemberName: "", // name="familyMemberName"   → family_member_name
    familyContactNo: "", // name="familyContactNo"    → family_contact_no
    familyWorkingStatus: "", // name="familyWorkingStatus"→ family_working_status
    familyEmployerName: "", // name="familyEmployerName" → family_employer_name
    familyEmployerContact: "", // name="familyEmployerContact"→family_employer_contact

    // ── Emergency (PersonalInfo.jsx) ──────────────────────────────────────
    emergencyContactName: "", // name="emergencyContactName"   → emergency_contact_name
    emergencyContactNo: "", // name="emergencyContactNo"     → emergency_contact_no
    emergencyContactAddress: "", // name="emergencyContactAddress"→ emergency_contact_address
    emergencyContactRelation: "", // name="emergencyContactRelation"→emergency_contact_relation

    // ── Permanent address (PersonalInfo.jsx) ──────────────────────────────
    permanentAddress: "", // name="permanentAddress" → permanent_address
    permanentPhone: "", // name="permanentPhone"   → permanent_phone
    permanentLandmark: "", // name="permanentLandmark"→ permanent_landmark
    permanentLatLong: "", // name="permanentLatLong" → permanent_lat_long

    // ── Local address (PersonalInfo.jsx) ──────────────────────────────────
    localSameAsPermanent: false, // name="localSameAsPermanent"→local_same_as_permanent
    localAddress: "", // name="localAddress"    → local_address
    localPhone: "", // name="localPhone"      → local_phone
    localLandmark: "", // name="localLandmark"   → local_landmark
    localLatLong: "", // name="localLatLong"    → local_lat_long

    // ── References (PersonalInfo.jsx) — key = ref{n}{SubKey} ──────────────
    ref1Name: "",
    ref1Designation: "",
    ref1Organization: "", // ref1_*
    ref1Address: "",
    ref1CityStatePin: "",
    ref1ContactNo: "",
    ref1Email: "",
    ref2Name: "",
    ref2Designation: "",
    ref2Organization: "", // ref2_*
    ref2Address: "",
    ref2CityStatePin: "",
    ref2ContactNo: "",
    ref2Email: "",
    ref3Name: "",
    ref3Designation: "",
    ref3Organization: "", // ref3_*
    ref3Address: "",
    ref3CityStatePin: "",
    ref3ContactNo: "",
    ref3Email: "",

    // ── Employment (EmploymentDetails.jsx) ────────────────────────────────
    joiningDate: "", // name="joiningDate"     → joining_date
    department: "", // name="department"      → department
    position: "", // name="position"        → position  (UI label: Designation)
    projectName: "", // name="projectName"     → project_name
    circle: "", // name="circle"          → circle
    reportingManager: "", // name="reportingManager"→ reporting_manager
    employmentType: "", // name="employmentType"  → employment_type

    // ── Bank (BankDetailsinfo.jsx) ────────────────────────────────────────
    bankName: "", // name="bankName"           → bank_name
    accountHolderName: "", // name="accountHolderName"  → account_holder_name
    accountNumber: "", // name="accountNumber"      → account_number
    confirmAccountNumber: "", // name="confirmAccountNumber"— frontend validation only, NOT sent
    ifscCode: "", // name="ifscCode"           → ifsc_code
    bankBranch: "", // name="bankBranch"         → bank_branch

    // ── Documents (Documents.jsx) — match multer .fields() names ─────────
    idPhoto: null, // fieldName="idPhoto"           → id_photo_url
    aadharCard: null, // fieldName="aadharCard"        → aadhar_card_url
    panCard: null, // fieldName="panCard"           → pan_card_url
    resume: null, // fieldName="resume"            → resume_url
    bankPassbook: null, // fieldName="bankPassbook"      → bank_passbook_url
    medicalCertificate: null, // fieldName="medicalCertificate"→ medical_certificate_url
    academicRecords: null, // fieldName="academicRecords"   → academic_records_url
    payslip: null, // fieldName="payslip"           → pay_slip_url
    farmToCli: null, // fieldName="farmToCli"         → farm_to_cli_certificate_url
    otherCertificates: null, // fieldName="otherCertificates" → other_certificates_url
  });

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

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!validateStep(currentStep)) return;

    setIsSubmitting(true);
    try {
      const fd = new FormData();

      // ── Step 1: routing tokens (required by resolveSubmissionContext) ──
      if (isResubmit) {
        fd.append("resubmitToken", token); // backend: req.body.resubmitToken
      } else {
        fd.append("linkId", linkId); // backend: req.body.linkId
        if (isRejoin) fd.append("isRejoin", "true");
      }

      // ── Step 2: scalar fields — skip frontend-only keys ───────────────
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
        if (FILE_FIELDS.has(key)) return; // handled below
        if (val === null || val === undefined) return;
        fd.append(key, String(val));
      });

      // ── Step 3: file fields ────────────────────────────────────────────
      FILE_FIELDS.forEach((key) => {
        if (formData[key] instanceof File)
          fd.append(key, formData[key], formData[key].name);
      });

      // ── Step 4: dispatch ───────────────────────────────────────────────
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

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-md overflow-hidden">
        {/* Step header */}
        <div className="bg-slate-900 px-6 py-4 flex items-center justify-between">
          <span className="text-white font-bold text-lg">
            Employee Portal Registration
          </span>
          <div className="flex items-center gap-2">
            {steps.map((s) => (
              <div
                key={s.id}
                className={`w-3 h-3 rounded-full ${currentStep >= s.id ? "bg-blue-500" : "bg-slate-700"}`}
              />
            ))}
          </div>
        </div>

        <div className="p-8">
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
