import React from "react";
import {
  X,
  User,
  MapPin,
  Briefcase,
  DollarSign,
  CreditCard,
  Users,
  Phone,
  Home,
  Landmark,
  FileText,
  BookOpen,
  Droplets,
  Copy,
} from "lucide-react";

const ViewEmployee = ({ employee, onClose }) => {
  if (!employee) return null;

  const e = employee;

  const firstName = e.first_name || e.firstName || "";
  const lastName = e.last_name || e.lastName || "";
  const middleName = e.middle_name || e.middleName || "";
  const empId = e.employee_id || e.id || "";
  const department = e.department || "";
  const designation = e.designation || e.position || "";
  const joiningDate = e.joining_date || e.joiningDate || "";

  const fmtDate = (v) => (v ? new Date(v).toLocaleDateString("en-IN") : "—");
  const fmtMoney = (v) => (v ? `₹${Number(v).toLocaleString("en-IN")}` : "—");

  const normalizeStatus = (s) => {
    const v = s?.toLowerCase();
    if (v === "active" || v === "approved")
      return { label: "Active", color: "bg-green-100 text-green-700" };
    if (v === "inactive" || v === "rejected")
      return { label: "Inactive", color: "bg-red-100 text-red-700" };
    if (v === "pending")
      return { label: "Pending", color: "bg-amber-100 text-amber-700" };
    return { label: s || "Unknown", color: "bg-gray-100 text-gray-600" };
  };

  const { label: statusLabel, color: statusColor } = normalizeStatus(e.status);

  /* ── Shared layout components ── */
  const Section = ({ title, icon: Icon, color = "blue", children }) => (
    <div className="mb-6">
      <div className="flex items-center gap-2 mb-3 pb-2 border-b border-gray-100">
        <Icon className={`w-4 h-4 text-${color}-600`} />
        <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wide">
          {title}
        </h3>
      </div>
      <div className="grid grid-cols-2 gap-x-6 gap-y-4">{children}</div>
    </div>
  );

  const Field = ({ label, value, full = false }) => (
    <div className={full ? "col-span-2" : ""}>
      <p className="text-xs text-gray-400 font-medium mb-0.5">{label}</p>
      <p className="text-sm font-medium text-gray-800 break-words">
        {value || "—"}
      </p>
    </div>
  );

  const SubCard = ({ title, children }) => (
    <div className="col-span-2 p-4 rounded-xl border border-gray-200 bg-gray-50 space-y-3">
      <p className="text-xs font-bold text-gray-600 uppercase tracking-wide">
        {title}
      </p>
      <div className="grid grid-cols-2 gap-x-6 gap-y-3">{children}</div>
    </div>
  );

  const refs = [
    { label: "Reference 1 (Relevant Industry)", prefix: "ref1_" },
    { label: "Reference 2 (Local Area)", prefix: "ref2_" },
    { label: "Reference 3 (Other than Relative)", prefix: "ref3_" },
  ];

  return (
    <div
      className="fixed inset-0 z-[1100] backdrop-blur-sm bg-black/40 flex items-start justify-center p-4 pt-10 overflow-y-auto"
      onClick={(ev) => ev.target === ev.currentTarget && onClose()}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl flex flex-col my-4">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-xl">
              {firstName[0] || "N"}
              {lastName[0] || "A"}
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                {firstName} {middleName} {lastName}
              </h2>
              <p className="text-sm text-gray-500">
                {designation} · {department}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span
              className={`px-3 py-1 rounded-full text-xs font-semibold ${statusColor}`}
            >
              {statusLabel}
            </span>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div
          className="p-6 overflow-y-auto max-h-[78vh]"
          style={{ scrollbarWidth: "thin" }}
        >
          {/* ══ 1. Personal Details ══ */}
          <Section title="1. Personal Details" icon={User} color="blue">
            <Field label="Employee ID" value={empId} />
            <Field
              label="Full Name"
              value={`${firstName} ${middleName} ${lastName}`.trim()}
            />
            <Field
              label="Father / Husband Name"
              value={e.father_husband_name}
            />
            <Field label="Date of Birth" value={fmtDate(e.date_of_birth)} />
            <Field label="Gender" value={e.gender} />
            <Field label="Marital Status" value={e.marital_status} />
            <Field
              label="Educational Qualification"
              value={e.educational_qualification}
              full
            />
            <Field label="Blood Group" value={e.blood_group} />
            <Field label="Email" value={e.email} />
            <Field label="Phone" value={e.phone} />
            <Field label="Alternate Phone" value={e.alt_phone} />
            <Field label="PAN Number" value={e.pan_number} />
            <Field label="Name on PAN" value={e.name_on_pan} />
            <Field label="Aadhaar Number" value={e.aadhar_number} />
            <Field label="Name on Aadhaar Card" value={e.name_on_aadhar} />
          </Section>

          {/* ══ 2. Family Details ══ */}
          <Section title="2. Family Details" icon={Users} color="purple">
            <Field
              label="Father / Mother / Spouse Name"
              value={e.family_member_name}
              full
            />
            <Field label="Contact No." value={e.family_contact_no} />
            <Field label="Working Status" value={e.family_working_status} />
            <Field label="Employer Name" value={e.family_employer_name} />
            <Field label="Employer Contact" value={e.family_employer_contact} />
          </Section>

          {/* ══ 3. Emergency Contact ══ */}
          <Section
            title="3. Emergency Contact Details"
            icon={Phone}
            color="red"
          >
            <Field
              label="Contact Person Name"
              value={e.emergency_contact_name}
            />
            <Field label="Contact No." value={e.emergency_contact_no} />
            <Field
              label="Relation with Employee"
              value={e.emergency_contact_relation}
            />
            <Field label="Address" value={e.emergency_contact_address} full />
          </Section>

          {/* ══ 4. Address Details ══ */}
          <Section title="4. Address Details" icon={Home} color="green">
            <SubCard title="A) Permanent Address">
              <Field label="Address" value={e.permanent_address} full />
              <Field label="Phone" value={e.permanent_phone} />
              <Field label="Landmark" value={e.permanent_landmark} />
              <Field label="Lat-Long" value={e.permanent_lat_long} full />
            </SubCard>
            <SubCard title="B) Local Address">
              <Field label="Address" value={e.local_address} full />
              <Field label="Phone" value={e.local_phone} />
              <Field label="Landmark" value={e.local_landmark} />
              <Field label="Lat-Long" value={e.local_lat_long} full />
            </SubCard>
          </Section>

          {/* ══ 5. Reference Details ══ */}
          <Section title="5. Reference Details" icon={FileText} color="orange">
            {refs.map(({ label, prefix }) => (
              <SubCard key={prefix} title={label}>
                <Field label="Name" value={e[`${prefix}name`]} />
                <Field label="Designation" value={e[`${prefix}designation`]} />
                <Field
                  label="Organization"
                  value={e[`${prefix}organization`]}
                  full
                />
                <Field label="Address" value={e[`${prefix}address`]} full />
                <Field
                  label="City, State, Pin"
                  value={e[`${prefix}city_state_pin`]}
                />
                <Field label="Contact No." value={e[`${prefix}contact_no`]} />
                <Field label="Email ID" value={e[`${prefix}email`]} full />
              </SubCard>
            ))}
          </Section>

          {/* ══ 6. Employment Details ══ */}
          <Section title="6. Employment Details" icon={Briefcase} color="blue">
            <Field label="Department" value={department} />
            <Field label="Designation" value={designation} />
            <Field label="Employment Type" value={e.employment_type} />
            <Field label="Joining Date" value={fmtDate(joiningDate)} />
            <Field label="Circle" value={e.circle} />
            <Field label="Project Name" value={e.project_name} />
            <Field label="Reporting Manager" value={e.reporting_manager} full />
          </Section>

          {/* ══ 7. Salary Details ══ */}
          <Section title="7. Salary Details" icon={DollarSign} color="yellow">
            <Field label="Basic Salary" value={fmtMoney(e.basic_salary)} />
            <Field label="HRA" value={fmtMoney(e.hra)} />
            <Field
              label="Other Allowances"
              value={fmtMoney(e.other_allowances)}
            />
            <Field
              label="Total Salary"
              value={fmtMoney(
                Number(e.basic_salary || 0) +
                  Number(e.hra || 0) +
                  Number(e.other_allowances || 0),
              )}
            />
          </Section>

          {/* ══ 8. Bank Details ══ */}
          <Section title="8. Bank Details" icon={CreditCard} color="green">
            <Field label="Bank Name" value={e.bank_name} />
            <Field label="Account Number" value={e.account_number} />
            <Field label="IFSC Code" value={e.ifsc_code} />
            <Field label="Account Holder Name" value={e.account_holder_name} />
            <Field label="Bank Branch" value={e.bank_branch || e.branch} />
          </Section>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-100 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default ViewEmployee;
