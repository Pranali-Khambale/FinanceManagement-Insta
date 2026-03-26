// src/Ui/EmployeeMng/Linkgen/RegistrationForm.jsx
import React, { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  AlertCircle, CheckCircle, Loader, User, Mail, Check,
  ChevronLeft, ChevronRight, AlertTriangle, UserCheck,
  RefreshCw, Info, History, ShieldAlert, Clock,
} from "lucide-react";
import employeeService from "../../../services/employeeService";
import PersonalInfo      from "./PersonalInfo";
import EmploymentDetails from "./EmploymentDetails";
import BankDetailsinfo   from "./BankDetailsinfo";
import Documents         from "./Documents";

const RegistrationForm = () => {
  const { linkId, token } = useParams();
  const navigate          = useNavigate();
  const isResubmit        = Boolean(token);

  const [linkStatus,      setLinkStatus]      = useState("validating");
  const [rejectionReason, setRejectionReason] = useState("");
  const [currentStep,     setCurrentStep]     = useState(1);
  const [isSubmitting,    setIsSubmitting]     = useState(false);
  const [isSubmitted,     setIsSubmitted]      = useState(false);
  const [errors,          setErrors]           = useState({});

  // ── Aadhaar check / rejoin state ──────────────────────────────────────────
  const [aadharCheck,    setAadharCheck]    = useState(null);
  const [isRejoin,       setIsRejoin]       = useState(false);
  const [aadharChecking, setAadharChecking] = useState(false);
  // ✅ NEW: true when the link itself is a rejoin invite (HR-sent link)
  const [isRejoinLink,   setIsRejoinLink]   = useState(false);
  const [oldEmployeeId,  setOldEmployeeId]  = useState(null);
  const aadharDebounceRef = useRef(null);

  // ── Empty form template ──────────────────────────────────────────────────
  const emptyForm = {
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
  };

  const [formData,  setFormData]  = useState(emptyForm);
  const [documents, setDocuments] = useState({
    idPhoto: null, aadharCard: null, panCard: null, resume: null,
    medicalCertificate: null, academicRecords: null,
    bankPassbook: null, payslip: null, otherCertificates: null,
  });

  // ── Map API data → form fields ───────────────────────────────────────────
  const mapPrefillToForm = (d) => ({
    firstName:                d.firstName                || "",
    fatherHusbandName:        d.fatherHusbandName        || "",
    lastName:                 d.lastName                 || "",
    dob:                      d.dob                      || "",
    gender:                   d.gender                   || "",
    maritalStatus:            d.maritalStatus            || "",
    educationalQualification: d.educationalQualification || "",
    bloodGroup:               d.bloodGroup               || "",
    email:                    d.email                    || "",
    phone:                    d.phone                    || "",
    altPhone:                 d.altPhone                 || "",
    panNumber:                d.panNumber                || "",
    nameOnPan:                d.nameOnPan                || "",
    aadhar:                   d.aadhar                   || "",
    nameOnAadhar:             d.nameOnAadhar             || "",
    familyMemberName:         d.familyMemberName         || "",
    familyContactNo:          d.familyContactNo          || "",
    familyWorkingStatus:      d.familyWorkingStatus      || "",
    familyEmployerName:       d.familyEmployerName       || "",
    familyEmployerContact:    d.familyEmployerContact    || "",
    emergencyContactName:     d.emergencyContactName     || "",
    emergencyContactNo:       d.emergencyContactNo       || "",
    emergencyContactAddress:  d.emergencyContactAddress  || "",
    emergencyContactRelation: d.emergencyContactRelation || "",
    permanentAddress:         d.permanentAddress         || "",
    permanentPhone:           d.permanentPhone           || "",
    permanentLandmark:        d.permanentLandmark        || "",
    permanentLatLong:         d.permanentLatLong         || "",
    localSameAsPermanent:     d.localSameAsPermanent     || false,
    localAddress:             d.localAddress             || "",
    localPhone:               d.localPhone               || "",
    localLandmark:            d.localLandmark            || "",
    localLatLong:             d.localLatLong             || "",
    ref1Name:         d.ref1Name         || "", ref1Designation: d.ref1Designation || "",
    ref1Organization: d.ref1Organization || "", ref1Address:     d.ref1Address     || "",
    ref1CityStatePin: d.ref1CityStatePin || "", ref1ContactNo:   d.ref1ContactNo   || "",
    ref1Email:        d.ref1Email        || "",
    ref2Name:         d.ref2Name         || "", ref2Designation: d.ref2Designation || "",
    ref2Organization: d.ref2Organization || "", ref2Address:     d.ref2Address     || "",
    ref2CityStatePin: d.ref2CityStatePin || "", ref2ContactNo:   d.ref2ContactNo   || "",
    ref2Email:        d.ref2Email        || "",
    ref3Name:         d.ref3Name         || "", ref3Designation: d.ref3Designation || "",
    ref3Organization: d.ref3Organization || "", ref3Address:     d.ref3Address     || "",
    ref3CityStatePin: d.ref3CityStatePin || "", ref3ContactNo:   d.ref3ContactNo   || "",
    ref3Email:        d.ref3Email        || "",
    department:        d.department        || "",
    position:          d.position          || "",
    joiningDate:       d.joiningDate       || "",
    employmentType:    d.employmentType    || "",
    reportingManager:  d.reportingManager  || "",
    projectName:       d.projectName       || "",
    circle:            d.circle            || "",
    bankName:          d.bankName          || "",
    accountNumber:     d.accountNumber     || "",
    confirmAccountNumber: d.accountNumber  || "",   // pre-fill both account fields
    ifscCode:          d.ifscCode          || "",
    accountHolderName: d.accountHolderName || "",
    bankBranch:        d.bankBranch        || "",
  });

  // ── On mount: validate link OR load resubmit prefill ────────────────────
  useEffect(() => {
    if (isResubmit) {
      // ── Resubmit flow (rejected employee with token) ──────────────────────
      (async () => {
        try {
          const res = await employeeService.getPrefillData(token);
          if (res.success && res.data) {
            setFormData(prev => ({ ...prev, ...mapPrefillToForm(res.data) }));
            setRejectionReason(res.data.rejectionReason || "");
            setLinkStatus("valid");
          } else {
            setLinkStatus("invalid");
          }
        } catch {
          setLinkStatus("invalid");
        }
      })();
    } else {
      // ── Normal link validation ─────────────────────────────────────────────
      (async () => {
        try {
          const res = await employeeService.validateLink(linkId);

          if (!res.success || !res.valid) {
            if (res.used)    setLinkStatus("used");
            else if (res.expired) setLinkStatus("expired");
            else             setLinkStatus("invalid");
            return;
          }

          // ✅ KEY FIX: detect rejoin links and pre-fill the form
          if (res.isRejoin && res.prefillData) {
            const p = res.prefillData;

            setIsRejoinLink(true);   // this link was an HR rejoin invite
            setIsRejoin(true);       // activate rejoin mode throughout the form
            setOldEmployeeId(p.oldEmployeeId || null);

            // Pre-fill every form field with the employee's previous data
            setFormData(prev => ({
              ...prev,
              ...mapPrefillToForm(p),
            }));
          }

          setLinkStatus("valid");
        } catch (err) {
          if (err.expired)   setLinkStatus("expired");
          else if (err.used) setLinkStatus("used");
          else               setLinkStatus("invalid");
        }
      })();
    }
  }, [linkId, token, isResubmit]);   // eslint-disable-line react-hooks/exhaustive-deps

  // ── Aadhaar live-check (debounced 700ms, only on normal new registration) ─
  const checkAadhar = useCallback(async (aadharVal) => {
    const clean = aadharVal.replace(/\s/g, '');
    if (clean.length !== 12) {
      setAadharCheck(null);
      setIsRejoin(false);
      return;
    }
    setAadharChecking(true);
    try {
      const res = await employeeService.checkAadhar(clean);
      setAadharCheck(res);
      if (!res.exists) setIsRejoin(false);
    } catch {
      setAadharCheck(null);
    } finally {
      setAadharChecking(false);
    }
  }, []);

  // ── Input handler ─────────────────────────────────────────────────────────
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: "" }));

    // Only run Aadhaar check on fresh registrations (not rejoin links, not resubmits)
    if (name === 'aadhar' && !isResubmit && !isRejoinLink) {
      setAadharCheck(null);
      setIsRejoin(false);
      clearTimeout(aadharDebounceRef.current);
      aadharDebounceRef.current = setTimeout(() => checkAadhar(value), 700);
    }
  };

  // ── Rejoin checkbox toggle (manual, via Aadhaar check — not rejoin links) ─
  const handleRejoinToggle = (checked) => {
    setIsRejoin(checked);
    if (checked && aadharCheck?.exists && aadharCheck?.data) {
      setFormData(prev => ({
        ...mapPrefillToForm(aadharCheck.data),
        aadhar: prev.aadhar,   // always preserve what was typed
      }));
    } else if (!checked) {
      const currentAadhar = formData.aadhar;
      setFormData({ ...emptyForm, aadhar: currentAadhar });
    }
  };

  // ── File change ───────────────────────────────────────────────────────────
  const handleDocChange = (field, file) => {
    if (!file) { setDocuments(prev => ({ ...prev, [field]: null })); return; }
    if (file.size > 5 * 1024 * 1024) {
      setErrors(prev => ({ ...prev, [field]: "File must be less than 5MB" }));
      return;
    }
    setDocuments(prev => ({ ...prev, [field]: file }));
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: "" }));
  };

  // ── Step validation ───────────────────────────────────────────────────────
  const validateStep = (step) => {
    const newErrors = {};

    if (step === 1) {
      if (!formData.firstName.trim())                newErrors.firstName = "First name is required";
      if (!formData.fatherHusbandName.trim())        newErrors.fatherHusbandName = "Father / Husband name is required";
      if (!formData.lastName.trim())                 newErrors.lastName = "Last name is required";
      if (!formData.email.trim())                    newErrors.email = "Email is required";
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) newErrors.email = "Invalid email format";
      if (!formData.phone.trim())                    newErrors.phone = "Phone number is required";
      else if (!/^[6-9]\d{9}$/.test(formData.phone)) newErrors.phone = "Enter a valid 10-digit Indian phone number";
      if (!formData.dob)                             newErrors.dob = "Date of birth is required";
      else {
        const age = Math.floor((new Date() - new Date(formData.dob)) / 31557600000);
        if (age < 18) newErrors.dob = "You must be at least 18 years old";
      }
      if (!formData.gender)                          newErrors.gender = "Gender is required";
      if (!formData.maritalStatus)                   newErrors.maritalStatus = "Marital status is required";
      if (!formData.educationalQualification.trim()) newErrors.educationalQualification = "Educational qualification is required";
      if (!formData.bloodGroup)                      newErrors.bloodGroup = "Blood group is required";
      if (!formData.panNumber.trim())                newErrors.panNumber = "PAN number is required";
      else if (!/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(formData.panNumber.toUpperCase())) newErrors.panNumber = "Enter a valid PAN (e.g. ABCDE1234F)";
      if (!formData.nameOnPan.trim())                newErrors.nameOnPan = "Name on PAN is required";
      if (!formData.aadhar.trim())                   newErrors.aadhar = "Aadhaar number is required";
      else if (formData.aadhar.replace(/\s/g, "").length !== 12) newErrors.aadhar = "Aadhaar must be 12 digits";
      if (!formData.nameOnAadhar.trim())             newErrors.nameOnAadhar = "Name on Aadhaar is required";

      // Block duplicate Aadhaar only on fresh registrations (not rejoin links / not already in rejoin mode)
      if (!isResubmit && !isRejoinLink && aadharCheck?.exists && !isRejoin) {
        const s = aadharCheck.status;
        if (s === 'blacklisted')
          newErrors.aadhar = "This Aadhaar is blacklisted. Contact HR.";
        else if (s === 'active')
          newErrors.aadhar = "This employee is currently active. Contact HR if this is an error.";
        else if (s === 'pending' || s === 'pending_rejoin')
          newErrors.aadhar = "A pending application already exists for this Aadhaar.";
        else
          newErrors.aadhar = "Aadhaar already registered. Please tick 'I am a returning employee' below.";
      }

      if (!formData.familyMemberName.trim())         newErrors.familyMemberName = "Family member name is required";
      if (!formData.familyContactNo.trim())          newErrors.familyContactNo = "Family contact number is required";
      else if (!/^[6-9]\d{9}$/.test(formData.familyContactNo)) newErrors.familyContactNo = "Enter a valid 10-digit phone number";
      if (!formData.familyWorkingStatus)             newErrors.familyWorkingStatus = "Working status is required";
      if (!formData.emergencyContactName.trim())     newErrors.emergencyContactName = "Emergency contact name is required";
      if (!formData.emergencyContactNo.trim())       newErrors.emergencyContactNo = "Emergency contact number is required";
      else if (!/^[6-9]\d{9}$/.test(formData.emergencyContactNo)) newErrors.emergencyContactNo = "Enter a valid 10-digit phone number";
      if (!formData.emergencyContactAddress.trim())  newErrors.emergencyContactAddress = "Emergency contact address is required";
      if (!formData.emergencyContactRelation)        newErrors.emergencyContactRelation = "Relation is required";
      if (!formData.permanentAddress.trim())         newErrors.permanentAddress = "Permanent address is required";
      if (!formData.permanentPhone.trim())           newErrors.permanentPhone = "Permanent address phone is required";
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
      if (!formData.bankName.trim())              newErrors.bankName = "Bank name is required";
      if (!formData.accountHolderName.trim())     newErrors.accountHolderName = "Account holder name is required";
      if (!formData.accountNumber.trim())         newErrors.accountNumber = "Account number is required";
      if (!formData.confirmAccountNumber.trim())  newErrors.confirmAccountNumber = "Please confirm your account number";
      else if (formData.accountNumber !== formData.confirmAccountNumber) newErrors.confirmAccountNumber = "Account numbers do not match";
      if (!formData.ifscCode.trim())              newErrors.ifscCode = "IFSC code is required";
      else if (!/^[A-Z]{4}0[A-Z0-9]{6}$/.test(formData.ifscCode.toUpperCase())) newErrors.ifscCode = "Enter a valid IFSC code (e.g. SBIN0001234)";
    }

    if (step === 4) {
      if (!documents.idPhoto)      newErrors.idPhoto = "Employee photo is required";
      if (!documents.aadharCard)   newErrors.aadharCard = "Aadhaar card is required";
      if (!documents.bankPassbook) newErrors.bankPassbook = "Bank passbook / cancelled cheque is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(p => p + 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };
  const handleBack = () => {
    setCurrentStep(p => p - 1);
    setErrors({});
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // ── Submit ────────────────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateStep(4)) return;
    setIsSubmitting(true);
    try {
      const payload = { ...formData };
      if (isResubmit)    { payload.resubmitToken = token; }
      else if (isRejoin) { payload.linkId = linkId; payload.isRejoin = true; }
      else               { payload.linkId = linkId; }

      await employeeService.submitRegistration(payload, documents);

      // Non-blocking email confirmations
      const emailPayload = {
        firstName: formData.firstName, fatherHusbandName: formData.fatherHusbandName,
        lastName: formData.lastName, email: formData.email, phone: formData.phone,
        dob: formData.dob, gender: formData.gender, maritalStatus: formData.maritalStatus,
        educationalQualification: formData.educationalQualification, bloodGroup: formData.bloodGroup,
        panNumber: formData.panNumber, aadhar: formData.aadhar,
        permanentAddress: formData.permanentAddress,
        localAddress: formData.localSameAsPermanent ? formData.permanentAddress : formData.localAddress,
        emergencyContactName: formData.emergencyContactName, emergencyContactNo: formData.emergencyContactNo,
        department: formData.department, position: formData.position,
        joiningDate: formData.joiningDate, employmentType: formData.employmentType,
        reportingManager: formData.reportingManager, projectName: formData.projectName,
        circle: formData.circle, bankName: formData.bankName, accountNumber: formData.accountNumber,
        ifscCode: formData.ifscCode, accountHolderName: formData.accountHolderName, bankBranch: formData.bankBranch,
      };
      if (formData.email) {
        employeeService.sendFormSubmissionConfirmation({ to: formData.email, formData: emailPayload, isRejoin })
          .catch(e => console.error("Confirmation email failed:", e));
      }
      employeeService.sendHRSubmissionNotification({ formData: emailPayload, isRejoin })
        .catch(e => console.error("HR notification failed:", e));

      setIsSubmitted(true);
    } catch (err) {
      if (err.used)         setLinkStatus("used");
      else if (err.expired) setLinkStatus("expired");
      else setErrors({ submit: err.message || "Submission failed. Please try again." });
    } finally {
      setIsSubmitting(false);
    }
  };

  const steps = ["Personal Info", "Employment", "Bank Details", "Documents"];

  // ── Derived UI flags ──────────────────────────────────────────────────────
  // Aadhaar-based rejoin option: only show on fresh registrations (not HR rejoin links)
  const showRejoinOption   = !isResubmit && !isRejoinLink && aadharCheck?.exists && aadharCheck?.canRejoin;
  const showBlockedWarning = !isResubmit && !isRejoinLink && aadharCheck?.exists && !aadharCheck?.canRejoin;

  // ── Status screens ────────────────────────────────────────────────────────
  if (linkStatus === "validating") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <Loader className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600 font-medium">
            {isResubmit ? "Loading your saved form data…" : "Validating your registration link…"}
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
            <Clock className="w-10 h-10 text-red-500" />
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
          <p className="text-gray-600">
            This registration link has already been used. Please contact HR if you have questions.
          </p>
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
            This {isResubmit ? "resubmission" : "registration"} link is not valid or has expired. Please contact HR.
          </p>
        </div>
      </div>
    );
  }

  // ── Success screen ────────────────────────────────────────────────────────
  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-10 max-w-md w-full text-center">
          <div className={`w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6 ${
            isRejoin ? 'bg-indigo-100' : 'bg-green-100'
          }`}>
            {isRejoin
              ? <UserCheck className="w-14 h-14 text-indigo-500" />
              : <CheckCircle className="w-14 h-14 text-green-500" />}
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-3">
            {isRejoin
              ? "Rejoin Request Submitted!"
              : isResubmit
              ? "Resubmission Successful!"
              : "Registration Submitted!"}
          </h2>
          <p className="text-gray-600 mb-4">
            {isRejoin
              ? "Your rejoin request has been submitted. HR will verify your previous record and notify you once a decision is made."
              : isResubmit
              ? "Your updated registration has been submitted. HR will review your corrections and notify you."
              : "Your registration has been submitted. HR will review your application and notify you once approved."}
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
          <div className={`rounded-xl p-4 text-left ${isRejoin ? 'bg-indigo-50' : 'bg-blue-50'}`}>
            <p className={`text-sm font-semibold mb-2 ${isRejoin ? 'text-indigo-800' : 'text-blue-800'}`}>
              What happens next?
            </p>
            <ul className={`text-sm space-y-1 ${isRejoin ? 'text-indigo-700' : 'text-blue-700'}`}>
              {isRejoin ? (
                <>
                  <li>✓ HR verifies your previous employment record</li>
                  <li>✓ Rejoin request is reviewed and processed</li>
                  <li>✓ You receive a brand-new Employee ID on approval</li>
                </>
              ) : (
                <>
                  <li>✓ HR reviews your submitted information</li>
                  <li>✓ Documents are verified</li>
                  <li>✓ You receive your Employee ID on approval</li>
                </>
              )}
            </ul>
          </div>
        </div>
      </div>
    );
  }

  // ── Main form ─────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 py-8 px-4">
      <div className="max-w-3xl mx-auto">

        {/* ── Page header ── */}
        <div className="text-center mb-8">
          <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full mb-4 shadow-lg ${
            isRejoin
              ? 'bg-gradient-to-br from-indigo-600 to-violet-600'
              : 'bg-gradient-to-br from-blue-600 to-indigo-600'
          }`}>
            {isRejoin ? <UserCheck className="w-8 h-8 text-white" /> : <User className="w-8 h-8 text-white" />}
          </div>
          <h1 className="text-3xl font-bold text-gray-900">
            {isRejoin
              ? "Rejoin Registration"
              : isResubmit
              ? "Update Your Registration"
              : "Employee Registration"}
          </h1>
          <p className="text-gray-600 mt-2">
            {isRejoin
              ? "Your previous details have been auto-filled. Please update anything that has changed."
              : isResubmit
              ? "Correct the highlighted issue and resubmit your form"
              : "Please fill in your details accurately to complete registration"}
          </p>
        </div>

        {/* ── Rejection reason banner (resubmit flow) ── */}
        {isResubmit && rejectionReason && (
          <div className="bg-red-50 border-l-4 border-red-500 rounded-r-2xl p-5 mb-6 shadow-sm">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 bg-red-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <p className="text-sm font-bold text-red-800 mb-1 uppercase tracking-wide">Reason for Rejection</p>
                <p className="text-sm text-red-700 leading-relaxed">{rejectionReason}</p>
                <p className="text-xs text-red-500 mt-2 font-medium">
                  Please correct the above issue and resubmit your form.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════
            ✅ NEW: HR REJOIN LINK BANNER
            Shown automatically when the link itself is a rejoin invite.
            Replaces the manual checkbox flow for this case.
        ══════════════════════════════════════════════════════════════════ */}
        {isRejoinLink && (
          <div className="mb-6 rounded-2xl border-2 border-indigo-300 bg-white overflow-hidden shadow-md">
            <div className="h-1.5 w-full bg-gradient-to-r from-indigo-500 to-violet-500" />
            <div className="p-5">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5">
                  <History className="w-5 h-5 text-indigo-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-bold text-indigo-800 mb-1">Rejoin Registration — Previous Data Loaded</p>
                  <p className="text-sm text-indigo-700 leading-relaxed mb-4">
                    HR has invited you to rejoin. Your previous employment details have been pre-filled into the form.
                    Please review every section and update anything that has changed since your last employment
                    (address, phone, bank details, etc.) before submitting.
                    {oldEmployeeId && (
                      <span className="ml-1 font-semibold">Your previous Employee ID was: {oldEmployeeId}.</span>
                    )}
                  </p>

                  {/* Preview grid of key pre-filled values */}
                  {formData.firstName && (
                    <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4 mb-4">
                      <p className="text-xs font-bold text-indigo-600 uppercase tracking-wide mb-3 flex items-center gap-1.5">
                        <RefreshCw className="w-3.5 h-3.5" /> Pre-filled from your previous record
                      </p>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {[
                          ["Name",        `${formData.firstName} ${formData.lastName}`.trim()],
                          ["Previous ID", oldEmployeeId || "—"],
                          ["Department",  formData.department  || "—"],
                          ["Designation", formData.position    || "—"],
                          ["Email",       formData.email       || "—"],
                          ["Phone",       formData.phone       || "—"],
                        ].map(([label, val]) => (
                          <div key={label} className="bg-white rounded-lg px-3 py-2 border border-indigo-100">
                            <p className="text-[10px] text-indigo-400 font-semibold uppercase tracking-wide mb-0.5">{label}</p>
                            <p className="text-xs font-bold text-indigo-900 truncate">{val}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex items-start gap-2 bg-blue-50 border border-blue-200 rounded-xl px-4 py-3">
                    <Info className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-blue-700 leading-relaxed">
                      <span className="font-semibold">All fields are fully editable.</span> Scroll through each step
                      and update any information that has changed before submitting your rejoin request.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════
            MANUAL REJOIN OPTION PANEL
            Only shown on Step 1 when Aadhaar belongs to an inactive/rejected
            employee on a fresh (non-HR-invite) registration link.
        ══════════════════════════════════════════════════════════════════ */}
        {currentStep === 1 && showRejoinOption && (
          <div className="mb-6">
            <div className={`rounded-2xl border-2 shadow-md overflow-hidden transition-all duration-300 ${
              isRejoin ? 'border-indigo-400 bg-white' : 'border-amber-300 bg-amber-50'
            }`}>
              <div className={`h-1.5 w-full ${isRejoin ? 'bg-gradient-to-r from-indigo-500 to-violet-500' : 'bg-amber-400'}`} />

              {!isRejoin && (
                <div className="p-5">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5">
                      <History className="w-5 h-5 text-amber-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-bold text-amber-800 mb-1">Returning Employee Detected</p>
                      <p className="text-sm text-amber-700 leading-relaxed mb-4">
                        This Aadhaar number is linked to a previous employee record
                        {aadharCheck?.employeeId && (
                          <span className="font-semibold"> (ID: {aadharCheck.employeeId})</span>
                        )}.
                        If you are rejoining, tick the box below to auto-fill your saved details — you only need to update what has changed.
                      </p>
                      <label className="flex items-start gap-3 cursor-pointer group">
                        <div
                          className="w-5 h-5 mt-0.5 rounded border-2 border-amber-400 group-hover:border-indigo-500 bg-white flex items-center justify-center flex-shrink-0 transition-colors"
                          onClick={() => handleRejoinToggle(true)}
                        />
                        <input type="checkbox" className="sr-only" onChange={() => handleRejoinToggle(true)} />
                        <span className="text-sm font-semibold text-amber-900 leading-tight">
                          Yes, I am a returning employee and I want to rejoin Insta ICT Solutions
                        </span>
                      </label>
                    </div>
                  </div>
                </div>
              )}

              {isRejoin && (
                <div className="p-5">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5">
                      <CheckCircle className="w-5 h-5 text-indigo-600" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1 flex-wrap gap-2">
                        <p className="text-sm font-bold text-indigo-800">Form Auto-filled from Previous Record</p>
                        <button
                          type="button"
                          onClick={() => handleRejoinToggle(false)}
                          className="text-xs text-indigo-500 hover:text-indigo-700 underline font-medium"
                        >
                          Clear &amp; start fresh
                        </button>
                      </div>
                      <p className="text-sm text-indigo-700 leading-relaxed mb-4">
                        Your saved information has been pre-loaded into the form below. Please review each field
                        and update anything that has changed since your last employment.
                      </p>
                      {aadharCheck?.data && (
                        <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4 mb-4">
                          <p className="text-xs font-bold text-indigo-600 uppercase tracking-wide mb-3 flex items-center gap-1.5">
                            <RefreshCw className="w-3.5 h-3.5" /> Pre-filled data preview
                          </p>
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                            {[
                              ['Name',        `${aadharCheck.data.firstName || ''} ${aadharCheck.data.lastName || ''}`.trim()],
                              ['Employee ID', aadharCheck.employeeId || '—'],
                              ['Department',  aadharCheck.data.department  || '—'],
                              ['Designation', aadharCheck.data.position    || '—'],
                              ['Email',       aadharCheck.data.email       || '—'],
                              ['Phone',       aadharCheck.data.phone       || '—'],
                            ].map(([label, val]) => (
                              <div key={label} className="bg-white rounded-lg px-3 py-2 border border-indigo-100">
                                <p className="text-[10px] text-indigo-400 font-semibold uppercase tracking-wide mb-0.5">{label}</p>
                                <p className="text-xs font-bold text-indigo-900 truncate">{val}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      <div className="flex items-start gap-2 bg-blue-50 border border-blue-200 rounded-xl px-4 py-3">
                        <Info className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
                        <p className="text-xs text-blue-700 leading-relaxed">
                          <span className="font-semibold">All form fields are fully editable.</span> Scroll through
                          each step and update any information that has changed before submitting.
                        </p>
                      </div>
                      <label className="flex items-start gap-3 mt-4 cursor-pointer" onClick={() => handleRejoinToggle(false)}>
                        <div className="w-5 h-5 mt-0.5 rounded border-2 border-indigo-600 bg-indigo-600 flex items-center justify-center flex-shrink-0">
                          <Check className="w-3 h-3 text-white" />
                        </div>
                        <span className="text-sm font-semibold text-indigo-800 leading-tight">
                          Yes, I am a returning employee and I want to rejoin Insta ICT Solutions
                        </span>
                      </label>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── Blocked warning (blacklisted / active / already pending) ── */}
        {currentStep === 1 && showBlockedWarning && (
          <div className="mb-6 rounded-2xl border-2 border-red-300 bg-red-50 overflow-hidden shadow-sm">
            <div className="h-1.5 w-full bg-red-500" />
            <div className="p-5">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 bg-red-100 rounded-xl flex items-center justify-center flex-shrink-0">
                  <ShieldAlert className="w-5 h-5 text-red-600" />
                </div>
                <div>
                  <p className="text-sm font-bold text-red-800 mb-1">
                    {aadharCheck.status === 'blacklisted'
                      ? 'Aadhaar Blacklisted'
                      : aadharCheck.status === 'active'
                      ? 'Already an Active Employee'
                      : 'Application Already Pending'}
                  </p>
                  <p className="text-sm text-red-700 leading-relaxed">
                    {aadharCheck.status === 'blacklisted'
                      ? 'This Aadhaar number has been blacklisted. You are not eligible to register or rejoin. Please contact HR for clarification.'
                      : aadharCheck.status === 'active'
                      ? 'An active employee record already exists for this Aadhaar. If you believe this is an error, please contact HR immediately.'
                      : 'There is already a pending application for this Aadhaar number. Please wait for HR to process it, or contact HR directly.'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── Persistent rejoin mode banner (steps 2, 3, 4) ── */}
        {isRejoin && currentStep > 1 && (
          <div className="mb-6 bg-indigo-50 border border-indigo-200 rounded-2xl p-4 flex items-center gap-3">
            <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <UserCheck className="w-4 h-4 text-indigo-600" />
            </div>
            <p className="text-sm text-indigo-800">
              <span className="font-bold">Rejoin Request Mode</span>
              {isRejoinLink ? " — Pre-filled from your previous record via HR invite." : " — Auto-filled from your previous record."}
              {" "}Please review and update any fields that have changed before submitting.
            </p>
          </div>
        )}

        {/* ── Progress stepper ── */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-center justify-between">
            {steps.map((step, idx) => (
              <React.Fragment key={idx}>
                <div className="flex flex-col items-center">
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm transition-all ${
                    currentStep > idx + 1
                      ? "bg-green-500 text-white"
                      : currentStep === idx + 1
                      ? isRejoin
                        ? "bg-indigo-600 text-white ring-4 ring-indigo-100"
                        : "bg-blue-600 text-white ring-4 ring-blue-100"
                      : "bg-gray-200 text-gray-500"
                  }`}>
                    {currentStep > idx + 1 ? <Check className="w-4 h-4" /> : idx + 1}
                  </div>
                  <span className={`mt-1.5 text-xs font-medium hidden sm:block ${
                    currentStep >= idx + 1 ? "text-gray-800" : "text-gray-400"
                  }`}>{step}</span>
                </div>
                {idx < steps.length - 1 && (
                  <div className={`flex-1 h-1 mx-2 rounded-full transition-all ${
                    currentStep > idx + 1
                      ? isRejoin ? "bg-indigo-500" : "bg-green-500"
                      : "bg-gray-200"
                  }`} />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* ── Form card ── */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
          {errors.submit && (
            <div className="mb-6 bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
              <p className="text-sm text-red-800">{errors.submit}</p>
            </div>
          )}

          {currentStep === 1 && (
            <PersonalInfo
              formData={formData}
              errors={errors}
              onChange={handleInputChange}
              aadharChecking={aadharChecking}
              isRejoin={isRejoin}
            />
          )}
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
                className={`flex items-center gap-2 px-5 py-2.5 text-white rounded-lg font-medium transition-all shadow-sm ${
                  isRejoin ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-blue-600 hover:bg-blue-700'
                }`}>
                Next <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button type="button" onClick={handleSubmit} disabled={isSubmitting}
                className={`flex items-center gap-2 px-6 py-2.5 text-white rounded-lg font-medium transition-all disabled:opacity-50 shadow-sm ${
                  isRejoin ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-green-600 hover:bg-green-700'
                }`}>
                {isSubmitting ? (
                  <><Loader className="w-4 h-4 animate-spin" /> Submitting…</>
                ) : isRejoin ? (
                  <><UserCheck className="w-4 h-4" /> Submit Rejoin Request</>
                ) : isResubmit ? (
                  <><Check className="w-4 h-4" /> Resubmit Registration</>
                ) : (
                  <><Check className="w-4 h-4" /> Submit Registration</>
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