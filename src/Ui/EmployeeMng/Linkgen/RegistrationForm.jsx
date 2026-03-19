// src/Ui/EmployeeMng/Linkgen/RegistrationForm.jsx
import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  AlertCircle,
  CheckCircle,
  Loader,
  User,
  Mail,
  Check,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
} from "lucide-react";
import employeeService from "../../../services/employeeService";

import PersonalInfo      from "./PersonalInfo";
import EmploymentDetails from "./EmploymentDetails";
import BankDetailsinfo   from "./BankDetailsinfo";
import Documents         from "./Documents";

const RegistrationForm = () => {
  // ── useParams picks up BOTH route patterns:
  //    /registration/:linkId          → normal
  //    /registration/resubmit/:token  → resubmit
  const { linkId, token } = useParams();
  const navigate          = useNavigate();

  const isResubmit = Boolean(token);  // true when opened via resubmit link

  const [linkStatus,      setLinkStatus]      = useState("validating");
  const [rejectionReason, setRejectionReason] = useState("");
  const [currentStep,     setCurrentStep]     = useState(1);
  const [isSubmitting,    setIsSubmitting]     = useState(false);
  const [isSubmitted,     setIsSubmitted]      = useState(false);
  const [errors,          setErrors]           = useState({});

  // ─── formData ────────────────────────────────────────────────────────────────
  const [formData, setFormData] = useState({
    firstName: "", fatherHusbandName: "", lastName: "",
    dob: "", gender: "", maritalStatus: "",
    educationalQualification: "", bloodGroup: "",
    email: "", phone: "", altPhone: "",
    panNumber: "", nameOnPan: "",
    aadhar: "", nameOnAadhar: "",

    familyMemberName: "", familyContactNo: "",
    familyWorkingStatus: "", familyEmployerName: "", familyEmployerContact: "",

    emergencyContactName: "", emergencyContactNo: "",
    emergencyContactAddress: "", emergencyContactRelation: "",

    permanentAddress: "", permanentPhone: "",
    permanentLandmark: "", permanentLatLong: "",
    localSameAsPermanent: false,
    localAddress: "", localPhone: "", localLandmark: "", localLatLong: "",

    ref1Name: "", ref1Designation: "", ref1Organization: "",
    ref1Address: "", ref1CityStatePin: "", ref1ContactNo: "", ref1Email: "",
    ref2Name: "", ref2Designation: "", ref2Organization: "",
    ref2Address: "", ref2CityStatePin: "", ref2ContactNo: "", ref2Email: "",
    ref3Name: "", ref3Designation: "", ref3Organization: "",
    ref3Address: "", ref3CityStatePin: "", ref3ContactNo: "", ref3Email: "",

    department: "", position: "",
    joiningDate: "", employmentType: "",
    reportingManager: "", projectName: "", circle: "",

    bankName: "", accountNumber: "", confirmAccountNumber: "",
    ifscCode: "", accountHolderName: "", bankBranch: "",
  });

  const [documents, setDocuments] = useState({
    idPhoto: null, aadharCard: null, panCard: null, resume: null,
    medicalCertificate: null, academicRecords: null,
    bankPassbook: null, payslip: null, otherCertificates: null,
  });

  // ─── On mount: validate normal link OR load prefill data for resubmit ────────
  useEffect(() => {
    if (isResubmit) {
      // ── Resubmit flow: fetch saved data from backend using the token ──
      const loadPrefillData = async () => {
        try {
          const res = await employeeService.getPrefillData(token);
          if (res.success && res.data) {
            const d = res.data;

            // Pre-fill form with all saved values
            setFormData(prev => ({
              ...prev,
              firstName:                 d.firstName                || "",
              fatherHusbandName:         d.fatherHusbandName        || "",
              lastName:                  d.lastName                 || "",
              dob:                       d.dob                      || "",
              gender:                    d.gender                   || "",
              maritalStatus:             d.maritalStatus            || "",
              educationalQualification:  d.educationalQualification || "",
              bloodGroup:                d.bloodGroup               || "",
              email:                     d.email                    || "",
              phone:                     d.phone                    || "",
              altPhone:                  d.altPhone                 || "",
              panNumber:                 d.panNumber                || "",
              nameOnPan:                 d.nameOnPan                || "",
              aadhar:                    d.aadhar                   || "",
              nameOnAadhar:              d.nameOnAadhar             || "",

              familyMemberName:          d.familyMemberName         || "",
              familyContactNo:           d.familyContactNo          || "",
              familyWorkingStatus:       d.familyWorkingStatus      || "",
              familyEmployerName:        d.familyEmployerName       || "",
              familyEmployerContact:     d.familyEmployerContact    || "",

              emergencyContactName:      d.emergencyContactName     || "",
              emergencyContactNo:        d.emergencyContactNo       || "",
              emergencyContactAddress:   d.emergencyContactAddress  || "",
              emergencyContactRelation:  d.emergencyContactRelation || "",

              permanentAddress:          d.permanentAddress         || "",
              permanentPhone:            d.permanentPhone           || "",
              permanentLandmark:         d.permanentLandmark        || "",
              permanentLatLong:          d.permanentLatLong         || "",
              localSameAsPermanent:      d.localSameAsPermanent     || false,
              localAddress:              d.localAddress             || "",
              localPhone:                d.localPhone               || "",
              localLandmark:             d.localLandmark            || "",
              localLatLong:              d.localLatLong             || "",

              ref1Name:                  d.ref1Name                 || "",
              ref1Designation:           d.ref1Designation          || "",
              ref1Organization:          d.ref1Organization         || "",
              ref1Address:               d.ref1Address              || "",
              ref1CityStatePin:          d.ref1CityStatePin         || "",
              ref1ContactNo:             d.ref1ContactNo            || "",
              ref1Email:                 d.ref1Email                || "",
              ref2Name:                  d.ref2Name                 || "",
              ref2Designation:           d.ref2Designation          || "",
              ref2Organization:          d.ref2Organization         || "",
              ref2Address:               d.ref2Address              || "",
              ref2CityStatePin:          d.ref2CityStatePin         || "",
              ref2ContactNo:             d.ref2ContactNo            || "",
              ref2Email:                 d.ref2Email                || "",
              ref3Name:                  d.ref3Name                 || "",
              ref3Designation:           d.ref3Designation          || "",
              ref3Organization:          d.ref3Organization         || "",
              ref3Address:               d.ref3Address              || "",
              ref3CityStatePin:          d.ref3CityStatePin         || "",
              ref3ContactNo:             d.ref3ContactNo            || "",
              ref3Email:                 d.ref3Email                || "",

              department:                d.department               || "",
              position:                  d.position                 || "",
              joiningDate:               d.joiningDate              || "",
              employmentType:            d.employmentType           || "",
              reportingManager:          d.reportingManager         || "",
              projectName:               d.projectName              || "",
              circle:                    d.circle                   || "",

              bankName:                  d.bankName                 || "",
              accountNumber:             d.accountNumber            || "",
              confirmAccountNumber:      d.accountNumber            || "", // pre-fill confirm too
              ifscCode:                  d.ifscCode                 || "",
              accountHolderName:         d.accountHolderName        || "",
              bankBranch:                d.bankBranch               || "",
            }));

            setRejectionReason(d.rejectionReason || "");
            setLinkStatus("valid");
          } else {
            setLinkStatus("invalid");
          }
        } catch (err) {
          setLinkStatus("invalid");
        }
      };
      loadPrefillData();

    } else {
      // ── Normal registration flow: validate the linkId ──
      const validateLink = async () => {
        try {
          const res = await employeeService.validateLink(linkId);
          if (res.success && res.valid) setLinkStatus("valid");
          else setLinkStatus("invalid");
        } catch (err) {
          if (err.expired)   setLinkStatus("expired");
          else if (err.used) setLinkStatus("used");
          else               setLinkStatus("invalid");
        }
      };
      validateLink();
    }
  }, [linkId, token, isResubmit]);

  // ─── Input handlers ───────────────────────────────────────────────────────────
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: "" }));
  };

  const handleDocChange = (field, file) => {
    if (!file) { setDocuments(prev => ({ ...prev, [field]: null })); return; }
    if (file.size > 5 * 1024 * 1024) {
      setErrors(prev => ({ ...prev, [field]: "File must be less than 5MB" }));
      return;
    }
    setDocuments(prev => ({ ...prev, [field]: file }));
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: "" }));
  };

  // ─── Step validation (unchanged from original) ────────────────────────────────
  const validateStep = (step) => {
    const newErrors = {};

    if (step === 1) {
      if (!formData.firstName.trim())               newErrors.firstName = "First name is required";
      if (!formData.fatherHusbandName.trim())       newErrors.fatherHusbandName = "Father / Husband name is required";
      if (!formData.lastName.trim())                newErrors.lastName = "Last name is required";
      if (!formData.email.trim())                   newErrors.email = "Email is required";
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) newErrors.email = "Invalid email format";
      if (!formData.phone.trim())                   newErrors.phone = "Phone number is required";
      else if (!/^[6-9]\d{9}$/.test(formData.phone)) newErrors.phone = "Enter a valid 10-digit Indian phone number";
      if (!formData.dob)                            newErrors.dob = "Date of birth is required";
      else {
        const age = Math.floor((new Date() - new Date(formData.dob)) / 31557600000);
        if (age < 18) newErrors.dob = "You must be at least 18 years old";
      }
      if (!formData.gender)                         newErrors.gender = "Gender is required";
      if (!formData.maritalStatus)                  newErrors.maritalStatus = "Marital status is required";
      if (!formData.educationalQualification.trim()) newErrors.educationalQualification = "Educational qualification is required";
      if (!formData.bloodGroup)                     newErrors.bloodGroup = "Blood group is required";
      if (!formData.panNumber.trim())               newErrors.panNumber = "PAN number is required";
      else if (!/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(formData.panNumber.toUpperCase())) newErrors.panNumber = "Enter a valid PAN (e.g. ABCDE1234F)";
      if (!formData.nameOnPan.trim())               newErrors.nameOnPan = "Name on PAN is required";
      if (!formData.aadhar.trim())                  newErrors.aadhar = "Aadhaar number is required";
      else if (formData.aadhar.replace(/\s/g, "").length !== 12) newErrors.aadhar = "Aadhaar must be 12 digits";
      if (!formData.nameOnAadhar.trim())            newErrors.nameOnAadhar = "Name on Aadhaar is required";
      if (!formData.familyMemberName.trim())        newErrors.familyMemberName = "Family member name is required";
      if (!formData.familyContactNo.trim())         newErrors.familyContactNo = "Family contact number is required";
      else if (!/^[6-9]\d{9}$/.test(formData.familyContactNo)) newErrors.familyContactNo = "Enter a valid 10-digit phone number";
      if (!formData.familyWorkingStatus)            newErrors.familyWorkingStatus = "Working status is required";
      if (!formData.emergencyContactName.trim())    newErrors.emergencyContactName = "Emergency contact name is required";
      if (!formData.emergencyContactNo.trim())      newErrors.emergencyContactNo = "Emergency contact number is required";
      else if (!/^[6-9]\d{9}$/.test(formData.emergencyContactNo)) newErrors.emergencyContactNo = "Enter a valid 10-digit phone number";
      if (!formData.emergencyContactAddress.trim()) newErrors.emergencyContactAddress = "Emergency contact address is required";
      if (!formData.emergencyContactRelation)       newErrors.emergencyContactRelation = "Relation is required";
      if (!formData.permanentAddress.trim())        newErrors.permanentAddress = "Permanent address is required";
      if (!formData.permanentPhone.trim())          newErrors.permanentPhone = "Permanent address phone is required";
      else if (!/^[6-9]\d{9}$/.test(formData.permanentPhone)) newErrors.permanentPhone = "Enter a valid 10-digit phone number";
      if (!formData.localSameAsPermanent) {
        if (!formData.localAddress.trim()) newErrors.localAddress = "Local address is required";
        if (!formData.localPhone.trim())   newErrors.localPhone = "Local address phone is required";
        else if (!/^[6-9]\d{9}$/.test(formData.localPhone)) newErrors.localPhone = "Enter a valid 10-digit phone number";
      }
    }

    if (step === 2) {
      if (!formData.department)     newErrors.department = "Department is required";
      if (!formData.position)       newErrors.position = "Designation is required";
      if (!formData.joiningDate)    newErrors.joiningDate = "Joining date is required";
      if (!formData.employmentType) newErrors.employmentType = "Employment type is required";
      if (formData.department === "Telecom") {
        if (!formData.projectName)  newErrors.projectName = "Project name is required for Telecom";
        if (!formData.circle)       newErrors.circle = "Circle is required for Telecom";
      }
    }

    if (step === 3) {
      if (!formData.bankName.trim())            newErrors.bankName = "Bank name is required";
      if (!formData.accountHolderName.trim())   newErrors.accountHolderName = "Account holder name is required";
      if (!formData.accountNumber.trim())       newErrors.accountNumber = "Account number is required";
      if (!formData.confirmAccountNumber.trim()) newErrors.confirmAccountNumber = "Please confirm your account number";
      else if (formData.accountNumber !== formData.confirmAccountNumber) newErrors.confirmAccountNumber = "Account numbers do not match";
      if (!formData.ifscCode.trim())            newErrors.ifscCode = "IFSC code is required";
      else if (!/^[A-Z]{4}0[A-Z0-9]{6}$/.test(formData.ifscCode.toUpperCase())) newErrors.ifscCode = "Enter a valid IFSC code (e.g. SBIN0001234)";
    }

    if (step === 4) {
      if (!documents.idPhoto)    newErrors.idPhoto = "Employee photo is required";
      if (!documents.aadharCard) newErrors.aadharCard = "Aadhaar card is required";
      if (!documents.bankPassbook) newErrors.bankPassbook = "Bank passbook / cancelled cheque is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => prev + 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handleBack = () => {
    setCurrentStep(prev => prev - 1);
    setErrors({});
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // ─── Submit ───────────────────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateStep(4)) return;

    setIsSubmitting(true);
    try {
      if (isResubmit) {
        // ── Resubmit: pass resubmitToken instead of linkId ──
        await employeeService.submitRegistration(
          { ...formData, resubmitToken: token },
          documents
        );
      } else {
        // ── Normal: pass linkId ──
        await employeeService.submitRegistration(
          { ...formData, linkId },
          documents
        );
      }

      // Send confirmation email (non-blocking)
      if (formData.email) {
        try {
          await employeeService.sendFormSubmissionConfirmation({
            to: formData.email,
            formData: {
              firstName: formData.firstName,
              fatherHusbandName: formData.fatherHusbandName,
              lastName: formData.lastName,
              email: formData.email,
              phone: formData.phone,
              dob: formData.dob,
              gender: formData.gender,
              maritalStatus: formData.maritalStatus,
              educationalQualification: formData.educationalQualification,
              bloodGroup: formData.bloodGroup,
              panNumber: formData.panNumber,
              aadhar: formData.aadhar,
              permanentAddress: formData.permanentAddress,
              localAddress: formData.localSameAsPermanent ? formData.permanentAddress : formData.localAddress,
              emergencyContactName: formData.emergencyContactName,
              emergencyContactNo: formData.emergencyContactNo,
              department: formData.department,
              designation: formData.position,
              joiningDate: formData.joiningDate,
              employmentType: formData.employmentType,
              reportingManager: formData.reportingManager,
              projectName: formData.projectName,
              circle: formData.circle,
              bankName: formData.bankName,
              accountNumber: formData.accountNumber,
              ifscCode: formData.ifscCode,
              accountHolderName: formData.accountHolderName,
              bankBranch: formData.bankBranch,
            },
          });
        } catch (emailErr) {
          console.error("Confirmation email failed (non-blocking):", emailErr);
        }
      }

      setIsSubmitted(true);
    } catch (err) {
      console.error("Submission error:", err);
      if (err.used)         setLinkStatus("used");
      else if (err.expired) setLinkStatus("expired");
      else setErrors({ submit: err.message || "Submission failed. Please try again." });
    } finally {
      setIsSubmitting(false);
    }
  };

  const steps = ["Personal Info", "Employment", "Bank Details", "Documents"];

  // ─── Link states ──────────────────────────────────────────────────────────────
  if (linkStatus === "validating") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <Loader className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600 font-medium">
            {isResubmit ? "Loading your saved form data..." : "Validating your registration link..."}
          </p>
        </div>
      </div>
    );
  }

  if (linkStatus === "expired") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-pink-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-10 max-w-md w-full text-center">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertCircle className="w-10 h-10 text-red-500" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-3">Link Expired</h2>
          <p className="text-gray-600">
            This {isResubmit ? "resubmission" : "registration"} link has expired. Please contact HR for a new link.
          </p>
        </div>
      </div>
    );
  }

  if (linkStatus === "used") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-yellow-50 to-amber-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-10 max-w-md w-full text-center">
          <div className="w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertCircle className="w-10 h-10 text-yellow-500" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-3">Link Already Used</h2>
          <p className="text-gray-600">This registration link has already been used. Please contact HR if you have questions.</p>
        </div>
      </div>
    );
  }

  if (linkStatus === "invalid") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-10 max-w-md w-full text-center">
          <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertCircle className="w-10 h-10 text-gray-500" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-3">Invalid Link</h2>
          <p className="text-gray-600">
            This {isResubmit ? "resubmission" : "registration"} link is not valid or has expired. Please contact HR for assistance.
          </p>
        </div>
      </div>
    );
  }

  // ─── Success state ─────────────────────────────────────────────────────────────
  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-10 max-w-md w-full text-center">
          <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-14 h-14 text-green-500" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-3">
            {isResubmit ? "Resubmission Successful!" : "Registration Submitted!"}
          </h2>
          <p className="text-gray-600 mb-4">
            {isResubmit
              ? "Your updated registration has been submitted. HR will review your corrections and notify you."
              : "Your registration has been submitted successfully. HR will review your application and notify you once approved."}
          </p>
          {formData.email && (
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-4 text-left">
              <p className="text-sm font-semibold text-blue-800 mb-1 flex items-center gap-2">
                <Mail className="w-4 h-4" /> Confirmation Email Sent
              </p>
              <p className="text-xs text-blue-700">
                A confirmation email has been sent to <strong>{formData.email}</strong>
              </p>
            </div>
          )}
          <div className="bg-blue-50 rounded-xl p-4 text-left">
            <p className="text-sm font-semibold text-blue-800 mb-2">What happens next?</p>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>✓ HR reviews your submitted information</li>
              <li>✓ Documents are verified</li>
              <li>✓ You receive your Employee ID on approval</li>
            </ul>
          </div>
        </div>
      </div>
    );
  }

  // ─── Main form ─────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 py-8 px-4">
      <div className="max-w-3xl mx-auto">

        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-full mb-4 shadow-lg">
            <User className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">
            {isResubmit ? "Update Your Registration" : "Employee Registration"}
          </h1>
          <p className="text-gray-600 mt-2">
            {isResubmit ? "Correct the highlighted issue and resubmit" : "Please fill in your details accurately"}
          </p>
        </div>

        {/* ── Rejection reason banner — shown only on resubmit ── */}
        {isResubmit && rejectionReason && (
          <div className="bg-red-50 border-l-4 border-red-500 rounded-r-2xl p-5 mb-6 shadow-sm">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 bg-red-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <p className="text-sm font-bold text-red-800 mb-1 uppercase tracking-wide">
                  Reason for Rejection
                </p>
                <p className="text-sm text-red-700 leading-relaxed">{rejectionReason}</p>
                <p className="text-xs text-red-500 mt-2 font-medium">
                  Please correct the above issue and resubmit your form.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Progress Steps */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-center justify-between">
            {steps.map((step, idx) => (
              <React.Fragment key={idx}>
                <div className="flex flex-col items-center">
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm transition-all ${
                    currentStep > idx + 1
                      ? "bg-green-500 text-white"
                      : currentStep === idx + 1
                      ? "bg-blue-600 text-white ring-4 ring-blue-100"
                      : "bg-gray-200 text-gray-500"
                  }`}>
                    {currentStep > idx + 1 ? <Check className="w-4 h-4" /> : idx + 1}
                  </div>
                  <span className={`mt-1.5 text-xs font-medium hidden sm:block ${
                    currentStep >= idx + 1 ? "text-gray-800" : "text-gray-400"
                  }`}>
                    {step}
                  </span>
                </div>
                {idx < steps.length - 1 && (
                  <div className={`flex-1 h-1 mx-2 rounded-full transition-all ${
                    currentStep > idx + 1 ? "bg-green-500" : "bg-gray-200"
                  }`} />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">

          {/* Global submit error */}
          {errors.submit && (
            <div className="mb-6 bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
              <p className="text-sm text-red-800">{errors.submit}</p>
            </div>
          )}

          {currentStep === 1 && <PersonalInfo      formData={formData} errors={errors} onChange={handleInputChange} />}
          {currentStep === 2 && <EmploymentDetails formData={formData} errors={errors} onChange={handleInputChange} />}
          {currentStep === 3 && <BankDetailsinfo   formData={formData} errors={errors} onChange={handleInputChange} />}
          {currentStep === 4 && <Documents         formData={documents} errors={errors} onFileChange={handleDocChange} />}

          {/* Navigation */}
          <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-200">
            <button
              type="button" onClick={handleBack} disabled={currentStep === 1}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-lg font-medium transition-all ${
                currentStep === 1 ? "text-gray-400 cursor-not-allowed" : "text-gray-700 hover:bg-gray-100 border border-gray-300"
              }`}
            >
              <ChevronLeft className="w-4 h-4" /> Back
            </button>

            <span className="text-sm text-gray-500">Step {currentStep} of {steps.length}</span>

            {currentStep < steps.length ? (
              <button type="button" onClick={handleNext}
                className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-all shadow-sm">
                Next <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button type="button" onClick={handleSubmit} disabled={isSubmitting}
                className="flex items-center gap-2 px-6 py-2.5 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-all disabled:opacity-50 shadow-sm">
                {isSubmitting ? (
                  <><Loader className="w-4 h-4 animate-spin" /> Submitting...</>
                ) : (
                  <><Check className="w-4 h-4" /> {isResubmit ? "Resubmit Registration" : "Submit Registration"}</>
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