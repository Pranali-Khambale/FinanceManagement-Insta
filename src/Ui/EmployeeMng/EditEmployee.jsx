import React, { useState } from "react";
import {
  X,
  Save,
  Loader,
  User,
  Users,
  Phone,
  Home,
  Landmark,
  Building2,
  FileText,
  Copy,
  MapPin,
} from "lucide-react";
import employeeService from "../../services/employeeService";

const maritalStatuses = ["Married", "Unmarried"];
const bloodGroups = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

/* helper — read both snake_case and camelCase */
const g = (obj, snake, camel, fallback = "") =>
  obj[snake] ?? obj[camel] ?? fallback;

const sliceDate = (v) => (v ? String(v).slice(0, 10) : "");

const EditEmployee = ({ employee, onClose, onSave, showToast }) => {
  if (!employee) return null;

  const e = employee; // shorthand

  const [form, setForm] = useState({
    /* ── 1. Personal ── */
    firstName: g(e, "first_name", "firstName"),
    lastName: g(e, "last_name", "lastName"),
    fatherHusbandName: g(e, "father_husband_name", "fatherHusbandName"),
    dob: sliceDate(e.date_of_birth || e.dob),
    gender: g(e, "gender", "gender"),
    maritalStatus: g(e, "marital_status", "maritalStatus"),
    educationalQualification: g(
      e,
      "educational_qualification",
      "educationalQualification",
    ),
    bloodGroup: g(e, "blood_group", "bloodGroup"),
    email: g(e, "email", "email"),
    phone: g(e, "phone", "phone"),
    altPhone: g(e, "alt_phone", "altPhone"),
    panNumber: g(e, "pan_number", "panNumber"),
    nameOnPan: g(e, "name_on_pan", "nameOnPan"),
    aadhar: g(e, "aadhar_number", "aadhar"),
    nameOnAadhar: g(e, "name_on_aadhar", "nameOnAadhar"),

    /* ── 2. Family ── */
    familyMemberName: g(e, "family_member_name", "familyMemberName"),
    familyContactNo: g(e, "family_contact_no", "familyContactNo"),
    familyWorkingStatus: g(e, "family_working_status", "familyWorkingStatus"),
    familyEmployerName: g(e, "family_employer_name", "familyEmployerName"),
    familyEmployerContact: g(
      e,
      "family_employer_contact",
      "familyEmployerContact",
    ),

    /* ── 3. Emergency ── */
    emergencyContactName: g(
      e,
      "emergency_contact_name",
      "emergencyContactName",
    ),
    emergencyContactNo: g(e, "emergency_contact_no", "emergencyContactNo"),
    emergencyContactAddress: g(
      e,
      "emergency_contact_address",
      "emergencyContactAddress",
    ),
    emergencyContactRelation: g(
      e,
      "emergency_contact_relation",
      "emergencyContactRelation",
    ),

    /* ── 4. Address ── */
    permanentAddress: g(e, "permanent_address", "permanentAddress"),
    permanentPhone: g(e, "permanent_phone", "permanentPhone"),
    permanentLandmark: g(e, "permanent_landmark", "permanentLandmark"),
    permanentLatLong: g(e, "permanent_lat_long", "permanentLatLong"),
    localSameAsPermanent: false,
    localAddress: g(e, "local_address", "localAddress"),
    localPhone: g(e, "local_phone", "localPhone"),
    localLandmark: g(e, "local_landmark", "localLandmark"),
    localLatLong: g(e, "local_lat_long", "localLatLong"),

    /* ── 5. References ── */
    ref1Name: g(e, "ref1_name", "ref1Name"),
    ref1Designation: g(e, "ref1_designation", "ref1Designation"),
    ref1Organization: g(e, "ref1_organization", "ref1Organization"),
    ref1Address: g(e, "ref1_address", "ref1Address"),
    ref1CityStatePin: g(e, "ref1_city_state_pin", "ref1CityStatePin"),
    ref1ContactNo: g(e, "ref1_contact_no", "ref1ContactNo"),
    ref1Email: g(e, "ref1_email", "ref1Email"),

    ref2Name: g(e, "ref2_name", "ref2Name"),
    ref2Designation: g(e, "ref2_designation", "ref2Designation"),
    ref2Organization: g(e, "ref2_organization", "ref2Organization"),
    ref2Address: g(e, "ref2_address", "ref2Address"),
    ref2CityStatePin: g(e, "ref2_city_state_pin", "ref2CityStatePin"),
    ref2ContactNo: g(e, "ref2_contact_no", "ref2ContactNo"),
    ref2Email: g(e, "ref2_email", "ref2Email"),

    ref3Name: g(e, "ref3_name", "ref3Name"),
    ref3Designation: g(e, "ref3_designation", "ref3Designation"),
    ref3Organization: g(e, "ref3_organization", "ref3Organization"),
    ref3Address: g(e, "ref3_address", "ref3Address"),
    ref3CityStatePin: g(e, "ref3_city_state_pin", "ref3CityStatePin"),
    ref3ContactNo: g(e, "ref3_contact_no", "ref3ContactNo"),
    ref3Email: g(e, "ref3_email", "ref3Email"),

    /* ── 6. Employment ── */
    employeeId: g(e, "employee_id", "employeeId"),
    joiningDate: sliceDate(e.joining_date || e.joiningDate),
    department: g(e, "department", "department"),
    designation:
      g(e, "designation", "designation") || g(e, "position", "position"),
    employmentType: g(e, "employment_type", "employmentType"),
    circle: g(e, "circle", "circle"),
    projectName: g(e, "project_name", "projectName"),
    reportingManager: g(e, "reporting_manager", "reportingManager"),
    status: g(e, "status", "status") || "Active",

    /* ── 7. Salary ── */
    basicSalary: g(e, "basic_salary", "basicSalary"),
    hra: g(e, "hra", "hra"),
    otherAllowances: g(e, "other_allowances", "otherAllowances"),

    /* ── 8. Bank ── */
    bankName: g(e, "bank_name", "bankName"),
    accountNumber: g(e, "account_number", "accountNumber"),
    ifscCode: g(e, "ifsc_code", "ifscCode"),
    accountHolderName: g(e, "account_holder_name", "accountHolderName"),
    bankBranch: g(e, "bank_branch", "bankBranch") || g(e, "branch", "branch"),
  });

  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});

  /* ── change handlers ── */
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((p) => ({ ...p, [name]: value }));
    if (errors[name]) setErrors((p) => ({ ...p, [name]: "" }));
  };

  const handlePhone = (e, name) => {
    const v = e.target.value;
    if (/^\d*$/.test(v) && v.length <= 10) {
      setForm((p) => ({ ...p, [name]: v }));
      if (errors[name]) setErrors((p) => ({ ...p, [name]: "" }));
    }
  };

  const handleSameAsPermanent = (ev) => {
    const checked = ev.target.checked;
    setForm((p) => ({
      ...p,
      localSameAsPermanent: checked,
      localAddress: checked ? p.permanentAddress : "",
      localPhone: checked ? p.permanentPhone : "",
      localLandmark: checked ? p.permanentLandmark : "",
      localLatLong: checked ? p.permanentLatLong : "",
    }));
  };

  const sameAddr = !!form.localSameAsPermanent;

  /* ── validation ── */
  const validate = () => {
    const err = {};
    if (!form.firstName.trim()) err.firstName = "First name is required";
    if (!form.lastName.trim()) err.lastName = "Last name is required";
    if (!form.email.trim()) err.email = "Email is required";
    if (!form.phone.trim()) err.phone = "Phone is required";
    if (!form.department.trim()) err.department = "Department is required";
    if (!form.designation.trim()) err.designation = "Designation is required";
    if (!form.joiningDate) err.joiningDate = "Joining date is required";
    return err;
  };

  const handleSubmit = async () => {
    const err = validate();
    if (Object.keys(err).length > 0) {
      setErrors(err);
      return;
    }
    setSaving(true);
    try {
      const id = employee.id || employee.employee_id;
      const res = await employeeService.updateEmployee(id, {
        ...form,
        basicSalary: parseFloat(form.basicSalary) || 0,
        hra: parseFloat(form.hra) || 0,
        otherAllowances: parseFloat(form.otherAllowances) || 0,
      });
      if (res.success) {
        showToast?.("Employee updated successfully!", "success");
        onSave?.(res.data);
        onClose();
      } else {
        throw new Error(res.message || "Update failed");
      }
    } catch (err) {
      showToast?.(err.message || "Failed to update employee", "error");
    } finally {
      setSaving(false);
    }
  };

  /* ── shared style helpers ── */
  const iCls = (name) =>
    `w-full px-3 py-2.5 rounded-lg border text-sm outline-none transition-all ${
      errors[name]
        ? "border-red-400 bg-red-50"
        : "border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
    }`;

  /* ── reusable atoms ── */
  const Label = ({ text, name, required }) => (
    <label className="block text-xs font-medium text-gray-600 mb-1">
      {text} {required && <span className="text-red-500">*</span>}
      {errors[name] && (
        <span className="text-red-500 ml-2 font-normal">{errors[name]}</span>
      )}
    </label>
  );

  const Input = ({ label, name, type = "text", required, colSpan = "" }) => (
    <div className={colSpan}>
      <Label text={label} name={name} required={required} />
      <input
        type={type}
        name={name}
        value={form[name] ?? ""}
        onChange={handleChange}
        className={iCls(name)}
      />
    </div>
  );

  const Select = ({ label, name, options, required, colSpan = "" }) => (
    <div className={colSpan}>
      <Label text={label} name={name} required={required} />
      <select
        name={name}
        value={form[name] ?? ""}
        onChange={handleChange}
        className={`${iCls(name)} appearance-none bg-white cursor-pointer`}
      >
        <option value="">Select…</option>
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    </div>
  );

  const Textarea = ({
    label,
    name,
    required,
    rows = 2,
    disabled = false,
    colSpan = "",
  }) => (
    <div className={colSpan}>
      <Label text={label} name={name} required={required} />
      <textarea
        name={name}
        value={form[name] ?? ""}
        onChange={handleChange}
        rows={rows}
        disabled={disabled}
        className={`${iCls(name)} resize-none ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
      />
    </div>
  );

  const PhoneInput = ({
    label,
    name,
    required,
    disabled = false,
    colSpan = "",
  }) => (
    <div className={colSpan}>
      <Label text={label} name={name} required={required} />
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-xs font-medium">
          +91
        </span>
        <input
          type="tel"
          name={name}
          value={form[name] ?? ""}
          onChange={(ev) => handlePhone(ev, name)}
          disabled={disabled}
          placeholder="9876543210"
          className={`w-full pl-10 pr-3 py-2.5 rounded-lg border text-sm outline-none font-mono transition-all ${
            errors[name]
              ? "border-red-400 bg-red-50"
              : "border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
        />
      </div>
    </div>
  );

  const SecHead = ({ icon: Icon, color = "blue", text }) => (
    <div
      className={`col-span-2 mt-5 mb-1 pb-1.5 border-b-2 border-${color}-100 flex items-center gap-2`}
    >
      {Icon && <Icon className={`w-4 h-4 text-${color}-500`} />}
      <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wide">
        {text}
      </h3>
    </div>
  );

  const refs = [
    { key: "ref1", label: "Reference 1", sub: "Relevant Industry" },
    { key: "ref2", label: "Reference 2", sub: "Local Area" },
    { key: "ref3", label: "Reference 3", sub: "Other than Relative" },
  ];

  return (
    <div
      className="fixed inset-0 z-[1100] backdrop-blur-sm bg-black/40 flex items-start justify-center p-4 pt-10 overflow-y-auto"
      onClick={(ev) => ev.target === ev.currentTarget && onClose()}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl flex flex-col my-4">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Edit Employee</h2>
            <p className="text-sm text-gray-500 mt-0.5">
              {form.firstName} {form.lastName} ·{" "}
              {employee.employee_id || employee.id}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Body */}
        <div
          className="p-6 overflow-y-auto max-h-[74vh]"
          style={{ scrollbarWidth: "thin" }}
        >
          <div className="grid grid-cols-2 gap-4">
            {/* ════════ 1. Personal Details ════════ */}
            <SecHead icon={User} color="blue" text="1. Personal Details" />

            <Input label="First Name" name="firstName" required />
            <Input label="Last Name" name="lastName" required />
            <Input
              label="Father / Husband Name"
              name="fatherHusbandName"
              required
            />
            <Input label="Date of Birth" name="dob" type="date" />
            <Select
              label="Gender"
              name="gender"
              options={["Male", "Female", "Other"]}
            />
            <Select
              label="Marital Status"
              name="maritalStatus"
              options={maritalStatuses}
            />
            <Input
              label="Educational Qualification"
              name="educationalQualification"
              colSpan="col-span-2"
            />
            <Select
              label="Blood Group"
              name="bloodGroup"
              options={bloodGroups}
            />
            <Input
              label="Email"
              name="email"
              type="email"
              required
              colSpan="col-span-2"
            />
            <PhoneInput label="Phone" name="phone" required />
            <PhoneInput label="Alternate Phone" name="altPhone" />
            <Input label="PAN Number" name="panNumber" />
            <Input label="Name on PAN" name="nameOnPan" />
            <Input label="Aadhaar Number" name="aadhar" />
            <Input label="Name on Aadhaar Card" name="nameOnAadhar" />

            {/* ════════ 2. Family Details ════════ */}
            <SecHead icon={Users} color="purple" text="2. Family Details" />

            <Input
              label="Father / Mother / Spouse Name"
              name="familyMemberName"
              required
              colSpan="col-span-2"
            />
            <PhoneInput label="Contact No." name="familyContactNo" required />
            <Select
              label="Working Status"
              name="familyWorkingStatus"
              options={["Working", "Not Working", "Retired", "Self Employed"]}
            />
            <Input
              label="Employer Name"
              name="familyEmployerName"
              colSpan="col-span-2"
            />
            <PhoneInput
              label="Employer Contact No."
              name="familyEmployerContact"
            />

            {/* ════════ 3. Emergency Contact ════════ */}
            <SecHead
              icon={Phone}
              color="red"
              text="3. Emergency Contact Details"
            />

            <Input
              label="Contact Person Name"
              name="emergencyContactName"
              required
              colSpan="col-span-2"
            />
            <PhoneInput
              label="Contact No."
              name="emergencyContactNo"
              required
            />
            <Select
              label="Relation with Employee"
              name="emergencyContactRelation"
              options={[
                "Father",
                "Mother",
                "Spouse",
                "Sibling",
                "Friend",
                "Other",
              ]}
            />
            <Textarea
              label="Contact Person Address"
              name="emergencyContactAddress"
              required
              colSpan="col-span-2"
              rows={2}
            />

            {/* ════════ 4. Address Details ════════ */}
            <SecHead icon={Home} color="green" text="4. Address Details" />

            {/* Permanent Address */}
            <div className="col-span-2 p-4 rounded-xl border-2 border-gray-200 bg-gray-50 space-y-3">
              <h5 className="text-xs font-bold text-gray-600 flex items-center gap-1.5">
                <Home className="w-3.5 h-3.5 text-green-500" /> A) Permanent
                Address
              </h5>
              <div className="grid grid-cols-2 gap-4">
                <Textarea
                  label="Address"
                  name="permanentAddress"
                  required
                  colSpan="col-span-2"
                  rows={2}
                />
                <PhoneInput label="Phone" name="permanentPhone" required />
                <Input label="Landmark" name="permanentLandmark" />
                <Input
                  label="Lat-Long"
                  name="permanentLatLong"
                  colSpan="col-span-2"
                />
              </div>
            </div>

            {/* Local Address */}
            <div className="col-span-2 p-4 rounded-xl border-2 border-gray-200 bg-gray-50 space-y-3">
              <div className="flex items-center justify-between">
                <h5 className="text-xs font-bold text-gray-600 flex items-center gap-1.5">
                  <Home className="w-3.5 h-3.5 text-green-500" /> B) Local
                  Address
                </h5>
                {/* Same as Permanent checkbox */}
                <label className="flex items-center gap-2 cursor-pointer select-none group">
                  <div className="relative">
                    <input
                      type="checkbox"
                      checked={sameAddr}
                      onChange={handleSameAsPermanent}
                      className="sr-only"
                    />
                    <div
                      className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
                        sameAddr
                          ? "bg-blue-600 border-blue-600"
                          : "border-gray-400 bg-white group-hover:border-blue-400"
                      }`}
                    >
                      {sameAddr && (
                        <svg
                          className="w-3 h-3 text-white"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={3}
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                      )}
                    </div>
                  </div>
                  <span className="text-xs font-medium text-gray-600 flex items-center gap-1">
                    <Copy className="w-3 h-3 text-blue-500" /> Same as Permanent
                    Address
                  </span>
                </label>
              </div>
              <div
                className={`grid grid-cols-2 gap-4 transition-opacity duration-200 ${sameAddr ? "opacity-50 pointer-events-none" : ""}`}
              >
                <Textarea
                  label="Address"
                  name="localAddress"
                  required
                  colSpan="col-span-2"
                  rows={2}
                  disabled={sameAddr}
                />
                <PhoneInput
                  label="Phone"
                  name="localPhone"
                  required
                  disabled={sameAddr}
                />
                <Input label="Landmark" name="localLandmark" />
                <Input
                  label="Lat-Long"
                  name="localLatLong"
                  colSpan="col-span-2"
                />
              </div>
            </div>

            {/* ════════ 5. Reference Details ════════ */}
            <SecHead
              icon={FileText}
              color="orange"
              text="5. Reference Details"
            />

            {refs.map(({ key, label, sub }) => (
              <div
                key={key}
                className="col-span-2 p-4 rounded-xl border-2 border-gray-200 bg-gray-50 space-y-3"
              >
                <div className="pb-1.5 border-b border-gray-200">
                  <p className="text-xs font-bold text-blue-700">
                    {label}{" "}
                    <span className="text-gray-400 font-normal">({sub})</span>
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <Input label="Name" name={`${key}Name`} />
                  <Input label="Designation" name={`${key}Designation`} />
                  <Input
                    label="Name of Organization"
                    name={`${key}Organization`}
                    colSpan="col-span-2"
                  />
                  <Textarea
                    label="Address"
                    name={`${key}Address`}
                    colSpan="col-span-2"
                    rows={2}
                  />
                  <Input
                    label="City, State, Pin Code"
                    name={`${key}CityStatePin`}
                  />
                  <PhoneInput label="Contact No." name={`${key}ContactNo`} />
                  <Input
                    label="Email ID"
                    name={`${key}Email`}
                    type="email"
                    colSpan="col-span-2"
                  />
                </div>
              </div>
            ))}

            {/* ════════ 6. Employment Details ════════ */}
            <SecHead
              icon={Building2}
              color="blue"
              text="6. Employment Details"
            />

            <Input label="Employee ID" name="employeeId" />
            <Input
              label="Joining Date"
              name="joiningDate"
              type="date"
              required
            />
            <Input label="Department" name="department" required />
            <Input label="Designation" name="designation" required />
            <Select
              label="Employment Type"
              name="employmentType"
              options={["Full-time", "Part-time", "Contract", "Intern"]}
            />
            <Select
              label="Status"
              name="status"
              options={["Active", "Inactive", "Pending"]}
            />
            <Input label="Circle" name="circle" />
            <Input label="Project Name" name="projectName" />
            <Input
              label="Reporting Manager"
              name="reportingManager"
              colSpan="col-span-2"
            />

            {/* ════════ 7. Salary Details ════════ */}
            <SecHead color="yellow" text="7. Salary Details" />

            <Input label="Basic Salary" name="basicSalary" type="number" />
            <Input label="HRA" name="hra" type="number" />
            <Input
              label="Other Allowances"
              name="otherAllowances"
              type="number"
              colSpan="col-span-2"
            />

            {/* ════════ 8. Bank Details ════════ */}
            <SecHead color="green" text="8. Bank Details" />

            <Input label="Bank Name" name="bankName" />
            <Input label="Account Number" name="accountNumber" />
            <Input label="IFSC Code" name="ifscCode" />
            <Input label="Account Holder Name" name="accountHolderName" />
            <Input label="Bank Branch" name="bankBranch" colSpan="col-span-2" />
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            disabled={saving}
            className="px-5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={saving}
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2 disabled:opacity-60"
          >
            {saving ? (
              <Loader className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            {saving ? "Saving…" : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditEmployee;
