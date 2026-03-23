import React from 'react';
import {
  Mail,
  Phone,
  Calendar,
  CreditCard,
  AlertCircle,
  BookOpen,
  User,
  Droplets,
  FileText,
  Home,
  Landmark,
  Building2,
  MapPin,
  Users,
  Copy,
} from 'lucide-react';

const maritalStatuses = ['Married', 'Unmarried'];
const bloodGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
const genders = ['Male', 'Female', 'Other', 'Prefer not to say'];

/* ─────────────────────────────────────────────
   Shared helpers
───────────────────────────────────────────── */
const inputCls = (error) =>
  `w-full px-4 py-2.5 rounded-lg border-2 ${
    error ? 'border-red-500 bg-red-50' : 'border-gray-300'
  } focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all outline-none`;

const selectCls = (error) =>
  `${inputCls(error)} appearance-none bg-white cursor-pointer`;

const Err = ({ msg }) =>
  msg ? (
    <p className="text-xs text-red-600 flex items-center gap-1 mt-1">
      <AlertCircle className="w-3 h-3" />
      {msg}
    </p>
  ) : null;

const SubHeading = ({ icon: Icon, title, color = 'blue' }) => (
  <div
    className={`flex items-center gap-2 pt-2 pb-1 border-b-2 border-${color}-100 mb-1`}
  >
    {Icon && <Icon className={`w-4 h-4 text-${color}-500`} />}
    <h4 className="text-sm font-bold text-gray-700">{title}</h4>
  </div>
);

const PhoneField = ({ name, value, onChange, error, disabled }) => (
  <>
    <div className="relative">
      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-medium text-sm">
        +91
      </span>
      <input
        type="tel"
        name={name}
        value={value}
        onChange={onChange}
        disabled={disabled}
        className={`w-full pl-12 pr-4 py-2.5 rounded-lg border-2 ${
          error ? 'border-red-500 bg-red-50' : 'border-gray-300'
        } focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all outline-none font-mono`}
        placeholder="9876543210"
      />
    </div>
    <Err msg={error} />
  </>
);

const hp = (e, name, onChange) => {
  const v = e.target.value;
  if (/^\d*$/.test(v) && v.length <= 10)
    onChange({ target: { name, value: v } });
};

/* ─────────────────────────────────────────────
   Main component
───────────────────────────────────────────── */
const PersonalInfoStep = ({ formData, errors = {}, onChange }) => {
  /* Aadhaar formatter */
  const formatAadhar = (v) => {
    const c = v.replace(/\s/g, '');
    const m = c.match(/(\d{0,4})(\d{0,4})(\d{0,4})/);
    return m ? [m[1], m[2], m[3]].filter(Boolean).join(' ') : v;
  };
  const handleAadharChange = (e) => {
    const v = e.target.value.replace(/\s/g, '');
    if (/^\d*$/.test(v) && v.length <= 12)
      onChange({ target: { name: 'aadhar', value: v } });
  };

  /* Same-as-permanent handler */
  const handleSameAsPermanent = (e) => {
    const checked = e.target.checked;
    onChange({ target: { name: 'localSameAsPermanent', value: checked } });
    if (checked) {
      ['Address', 'Phone', 'Landmark', 'LatLong'].forEach((f) =>
        onChange({
          target: { name: `local${f}`, value: formData[`permanent${f}`] || '' },
        }),
      );
    } else {
      ['Address', 'Phone', 'Landmark', 'LatLong'].forEach((f) =>
        onChange({ target: { name: `local${f}`, value: '' } }),
      );
    }
  };
  const sameAddr = !!formData.localSameAsPermanent;

  return (
    <div className="space-y-8">

      {/* ══════════════════════════════════════
          1. Personal Details
      ══════════════════════════════════════ */}
      <section className="space-y-4">
        <SubHeading icon={User} title="1. Personal Details" color="blue" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">

          <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-700">
              First Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="firstName"
              value={formData.firstName || ''}
              onChange={onChange}
              className={inputCls(errors.firstName)}
              placeholder="John"
            />
            <Err msg={errors.firstName} />
          </div>

          <div className="space-y-2">
            <label className="flex items-center gap-1 text-sm font-semibold text-gray-700">
              <User className="w-4 h-4 text-gray-500" /> Father / Husband Name{' '}
              <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="fatherHusbandName"
              value={formData.fatherHusbandName || ''}
              onChange={onChange}
              className={inputCls(errors.fatherHusbandName)}
              placeholder="Enter father's or husband's name"
            />
            <Err msg={errors.fatherHusbandName} />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-700">
              Last Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="lastName"
              value={formData.lastName || ''}
              onChange={onChange}
              className={inputCls(errors.lastName)}
              placeholder="Doe"
            />
            <Err msg={errors.lastName} />
          </div>

          <div className="space-y-2">
            <label className="flex items-center gap-1 text-sm font-semibold text-gray-700">
              <Calendar className="w-4 h-4 text-gray-500" /> Date of Birth{' '}
              <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              name="dob"
              value={formData.dob || ''}
              onChange={onChange}
              max={
                new Date(new Date().setFullYear(new Date().getFullYear() - 18))
                  .toISOString()
                  .split('T')[0]
              }
              className={inputCls(errors.dob)}
            />
            <Err msg={errors.dob} />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-700">
              Gender <span className="text-red-500">*</span>
            </label>
            <select
              name="gender"
              value={formData.gender || ''}
              onChange={onChange}
              className={selectCls(errors.gender)}
            >
              <option value="">Select Gender</option>
              {genders.map((g) => (
                <option key={g} value={g}>{g}</option>
              ))}
            </select>
            <Err msg={errors.gender} />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-700">
              Marital Status <span className="text-red-500">*</span>
            </label>
            <select
              name="maritalStatus"
              value={formData.maritalStatus || ''}
              onChange={onChange}
              className={selectCls(errors.maritalStatus)}
            >
              <option value="">Select Status</option>
              {maritalStatuses.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
            <Err msg={errors.maritalStatus} />
          </div>

          <div className="space-y-2 md:col-span-2">
            <label className="flex items-center gap-1 text-sm font-semibold text-gray-700">
              <BookOpen className="w-4 h-4 text-gray-500" /> Educational Qualification{' '}
              <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="educationalQualification"
              value={formData.educationalQualification || ''}
              onChange={onChange}
              className={inputCls(errors.educationalQualification)}
              placeholder="e.g. B.E. Computer Engineering"
            />
            <Err msg={errors.educationalQualification} />
          </div>

          <div className="space-y-2">
            <label className="flex items-center gap-1 text-sm font-semibold text-gray-700">
              <Droplets className="w-4 h-4 text-gray-500" /> Blood Group{' '}
              <span className="text-red-500">*</span>
            </label>
            <select
              name="bloodGroup"
              value={formData.bloodGroup || ''}
              onChange={onChange}
              className={selectCls(errors.bloodGroup)}
            >
              <option value="">Select Blood Group</option>
              {bloodGroups.map((bg) => (
                <option key={bg} value={bg}>{bg}</option>
              ))}
            </select>
            <Err msg={errors.bloodGroup} />
          </div>

          <div className="space-y-2 md:col-span-2">
            <label className="flex items-center gap-1 text-sm font-semibold text-gray-700">
              <Mail className="w-4 h-4 text-gray-500" /> Email Address{' '}
              <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              name="email"
              value={formData.email || ''}
              onChange={onChange}
              className={inputCls(errors.email)}
              placeholder="john.doe@example.com"
            />
            <Err msg={errors.email} />
          </div>

          <div className="space-y-2">
            <label className="flex items-center gap-1 text-sm font-semibold text-gray-700">
              <Phone className="w-4 h-4 text-gray-500" /> Phone{' '}
              <span className="text-red-500">*</span>
            </label>
            <PhoneField
              name="phone"
              value={formData.phone || ''}
              onChange={(e) => hp(e, 'phone', onChange)}
              error={errors.phone}
            />
          </div>

          <div className="space-y-2 md:col-span-2">
            <label className="flex items-center gap-1 text-sm font-semibold text-gray-700">
              <Phone className="w-4 h-4 text-gray-500" /> Alternate Phone
            </label>
            <PhoneField
              name="altPhone"
              value={formData.altPhone || ''}
              onChange={(e) => hp(e, 'altPhone', onChange)}
            />
          </div>

          <div className="space-y-2">
            <label className="flex items-center gap-1 text-sm font-semibold text-gray-700">
              <FileText className="w-4 h-4 text-gray-500" /> PAN Number{' '}
              <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="panNumber"
              value={formData.panNumber || ''}
              onChange={onChange}
              maxLength={10}
              placeholder="ABCDE1234F"
              className={`${inputCls(errors.panNumber)} font-mono tracking-wide uppercase`}
            />
            <Err msg={errors.panNumber} />
          </div>

          <div className="space-y-2 md:col-span-2">
            <label className="block text-sm font-semibold text-gray-700">
              Name on PAN <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="nameOnPan"
              value={formData.nameOnPan || ''}
              onChange={onChange}
              className={inputCls(errors.nameOnPan)}
              placeholder="Name as printed on PAN card"
            />
            <Err msg={errors.nameOnPan} />
          </div>

          <div className="space-y-2">
            <label className="flex items-center gap-1 text-sm font-semibold text-gray-700">
              <CreditCard className="w-4 h-4 text-gray-500" /> Aadhaar Number{' '}
              <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="aadhar"
              value={formatAadhar(formData.aadhar || '')}
              onChange={handleAadharChange}
              placeholder="1234 5678 9012"
              className={`${inputCls(errors.aadhar)} font-mono tracking-wide`}
            />
            <Err msg={errors.aadhar} />
          </div>

          <div className="space-y-2 md:col-span-2">
            <label className="block text-sm font-semibold text-gray-700">
              Name on Aadhaar Card <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="nameOnAadhar"
              value={formData.nameOnAadhar || ''}
              onChange={onChange}
              className={inputCls(errors.nameOnAadhar)}
              placeholder="Name as printed on Aadhaar card"
            />
            <Err msg={errors.nameOnAadhar} />
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════
          2. Family Details
      ══════════════════════════════════════ */}
      <section className="space-y-4">
        <SubHeading icon={Users} title="2. Family Details" color="purple" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">

          <div className="space-y-2 md:col-span-2">
            <label className="flex items-center gap-1 text-sm font-semibold text-gray-700">
              <Users className="w-4 h-4 text-gray-500" /> Father / Mother / Spouse Name{' '}
              <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="familyMemberName"
              value={formData.familyMemberName || ''}
              onChange={onChange}
              className={inputCls(errors.familyMemberName)}
              placeholder="Enter full name"
            />
            <Err msg={errors.familyMemberName} />
          </div>

          <div className="space-y-2">
            <label className="flex items-center gap-1 text-sm font-semibold text-gray-700">
              <Phone className="w-4 h-4 text-gray-500" /> Contact No.{' '}
              <span className="text-red-500">*</span>
            </label>
            <PhoneField
              name="familyContactNo"
              value={formData.familyContactNo || ''}
              onChange={(e) => hp(e, 'familyContactNo', onChange)}
              error={errors.familyContactNo}
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-700">
              Working Status <span className="text-red-500">*</span>
            </label>
            <select
              name="familyWorkingStatus"
              value={formData.familyWorkingStatus || ''}
              onChange={onChange}
              className={selectCls(errors.familyWorkingStatus)}
            >
              <option value="">Select Status</option>
              {['Working', 'Not Working', 'Retired', 'Self Employed'].map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
            <Err msg={errors.familyWorkingStatus} />
          </div>

          <div className="space-y-2 md:col-span-2">
            <label className="flex items-center gap-1 text-sm font-semibold text-gray-700">
              <Building2 className="w-4 h-4 text-gray-500" /> Employer Name
            </label>
            <input
              type="text"
              name="familyEmployerName"
              value={formData.familyEmployerName || ''}
              onChange={onChange}
              className={inputCls()}
              placeholder="Enter employer name (if applicable)"
            />
          </div>

          <div className="space-y-2">
            <label className="flex items-center gap-1 text-sm font-semibold text-gray-700">
              <Phone className="w-4 h-4 text-gray-500" /> Employer Contact No.
            </label>
            <PhoneField
              name="familyEmployerContact"
              value={formData.familyEmployerContact || ''}
              onChange={(e) => hp(e, 'familyEmployerContact', onChange)}
            />
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════
          3. Emergency Contact Details
      ══════════════════════════════════════ */}
      <section className="space-y-4">
        <SubHeading icon={Phone} title="3. Emergency Contact Details" color="red" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">

          <div className="space-y-2 md:col-span-2">
            <label className="flex items-center gap-1 text-sm font-semibold text-gray-700">
              <User className="w-4 h-4 text-gray-500" /> Contact Person Name{' '}
              <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="emergencyContactName"
              value={formData.emergencyContactName || ''}
              onChange={onChange}
              className={inputCls(errors.emergencyContactName)}
              placeholder="Full name"
            />
            <Err msg={errors.emergencyContactName} />
          </div>

          <div className="space-y-2">
            <label className="flex items-center gap-1 text-sm font-semibold text-gray-700">
              <Phone className="w-4 h-4 text-gray-500" /> Contact No.{' '}
              <span className="text-red-500">*</span>
            </label>
            <PhoneField
              name="emergencyContactNo"
              value={formData.emergencyContactNo || ''}
              onChange={(e) => hp(e, 'emergencyContactNo', onChange)}
              error={errors.emergencyContactNo}
            />
          </div>

          <div className="space-y-2 md:col-span-2">
            <label className="flex items-center gap-1 text-sm font-semibold text-gray-700">
              <Home className="w-4 h-4 text-gray-500" /> Contact Person Address{' '}
              <span className="text-red-500">*</span>
            </label>
            <textarea
              name="emergencyContactAddress"
              value={formData.emergencyContactAddress || ''}
              onChange={onChange}
              rows={3}
              placeholder="Full address"
              className={`${inputCls(errors.emergencyContactAddress)} resize-none`}
            />
            <Err msg={errors.emergencyContactAddress} />
          </div>

          <div className="space-y-2">
            <label className="flex items-center gap-1 text-sm font-semibold text-gray-700">
              <Users className="w-4 h-4 text-gray-500" /> Relation{' '}
              <span className="text-red-500">*</span>
            </label>
            <select
              name="emergencyContactRelation"
              value={formData.emergencyContactRelation || ''}
              onChange={onChange}
              className={selectCls(errors.emergencyContactRelation)}
            >
              <option value="">Select Relation</option>
              {['Father', 'Mother', 'Spouse', 'Sibling', 'Friend', 'Sister','Brother','Other'].map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
            <Err msg={errors.emergencyContactRelation} />
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════
          4. Address Details
      ══════════════════════════════════════ */}
      <section className="space-y-4">
        <SubHeading icon={Home} title="4. Address Details" color="green" />
        <div className="space-y-4">

          {/* Permanent Address */}
          <div className="p-4 rounded-xl border-2 border-gray-200 bg-gray-50 space-y-4">
            <h5 className="text-sm font-bold text-gray-600 flex items-center gap-2">
              <Home className="w-4 h-4 text-green-500" /> A) Permanent Address
            </h5>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div className="space-y-2 md:col-span-3">
                <label className="flex items-center gap-1 text-sm font-semibold text-gray-700">
                  <MapPin className="w-4 h-4 text-gray-500" /> Address{' '}
                  <span className="text-red-500">*</span>
                </label>
                <textarea
                  name="permanentAddress"
                  value={formData.permanentAddress || ''}
                  onChange={onChange}
                  rows={3}
                  placeholder="Full address"
                  className={`${inputCls(errors.permanentAddress)} resize-none`}
                />
                <Err msg={errors.permanentAddress} />
              </div>
              <div className="space-y-2">
                <label className="flex items-center gap-1 text-sm font-semibold text-gray-700">
                  <Phone className="w-4 h-4 text-gray-500" /> Phone{' '}
                  <span className="text-red-500">*</span>
                </label>
                <PhoneField
                  name="permanentPhone"
                  value={formData.permanentPhone || ''}
                  onChange={(e) => hp(e, 'permanentPhone', onChange)}
                  error={errors.permanentPhone}
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <label className="flex items-center gap-1 text-sm font-semibold text-gray-700">
                  <Landmark className="w-4 h-4 text-gray-500" /> Landmark
                </label>
                <input
                  type="text"
                  name="permanentLandmark"
                  value={formData.permanentLandmark || ''}
                  onChange={onChange}
                  className={inputCls()}
                  placeholder="Nearby landmark"
                />
              </div>
              <div className="space-y-2 md:col-span-3">
                <label className="flex items-center gap-1 text-sm font-semibold text-gray-700">
                  <MapPin className="w-4 h-4 text-gray-500" /> Lat-Long
                </label>
                <input
                  type="text"
                  name="permanentLatLong"
                  value={formData.permanentLatLong || ''}
                  onChange={onChange}
                  className={`${inputCls()} font-mono`}
                  placeholder="e.g. 18.5204° N, 73.8567° E"
                />
              </div>
            </div>
          </div>

          {/* Local Address */}
          <div className="p-4 rounded-xl border-2 border-gray-200 bg-gray-50 space-y-4">
            <div className="flex items-center justify-between">
              <h5 className="text-sm font-bold text-gray-600 flex items-center gap-2">
                <Home className="w-4 h-4 text-green-500" /> B) Local Address
              </h5>
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
                        ? 'bg-blue-600 border-blue-600'
                        : 'border-gray-400 bg-white group-hover:border-blue-400'
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
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                </div>
                <span className="text-sm font-medium text-gray-600 flex items-center gap-1.5">
                  <Copy className="w-3.5 h-3.5 text-blue-500" /> Same as Permanent Address
                </span>
              </label>
            </div>

            <div
              className={`grid grid-cols-1 md:grid-cols-3 gap-5 transition-opacity duration-200 ${sameAddr ? 'opacity-50 pointer-events-none' : ''}`}
            >
              <div className="space-y-2 md:col-span-3">
                <label className="flex items-center gap-1 text-sm font-semibold text-gray-700">
                  <MapPin className="w-4 h-4 text-gray-500" /> Address{' '}
                  <span className="text-red-500">*</span>
                </label>
                <textarea
                  name="localAddress"
                  value={formData.localAddress || ''}
                  onChange={onChange}
                  rows={3}
                  placeholder="Full address"
                  disabled={sameAddr}
                  className={`${inputCls(errors.localAddress)} resize-none`}
                />
                <Err msg={errors.localAddress} />
              </div>
              <div className="space-y-2">
                <label className="flex items-center gap-1 text-sm font-semibold text-gray-700">
                  <Phone className="w-4 h-4 text-gray-500" /> Phone{' '}
                  <span className="text-red-500">*</span>
                </label>
                <PhoneField
                  name="localPhone"
                  value={formData.localPhone || ''}
                  onChange={(e) => hp(e, 'localPhone', onChange)}
                  error={errors.localPhone}
                  disabled={sameAddr}
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <label className="flex items-center gap-1 text-sm font-semibold text-gray-700">
                  <Landmark className="w-4 h-4 text-gray-500" /> Landmark
                </label>
                <input
                  type="text"
                  name="localLandmark"
                  value={formData.localLandmark || ''}
                  onChange={onChange}
                  disabled={sameAddr}
                  className={inputCls()}
                  placeholder="Nearby landmark"
                />
              </div>
              <div className="space-y-2 md:col-span-3">
                <label className="flex items-center gap-1 text-sm font-semibold text-gray-700">
                  <MapPin className="w-4 h-4 text-gray-500" /> Lat-Long
                </label>
                <input
                  type="text"
                  name="localLatLong"
                  value={formData.localLatLong || ''}
                  onChange={onChange}
                  disabled={sameAddr}
                  className={`${inputCls()} font-mono`}
                  placeholder="e.g. 18.5204° N, 73.8567° E"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════
          5. Reference Details
      ══════════════════════════════════════ */}
      <section className="space-y-4">
        <SubHeading icon={FileText} title="5. Reference Details" color="orange" />
        <p className="text-sm text-gray-500">
          Provide 3 personal references — one from relevant industry, one local, one non-relative.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { key: 'ref1', label: 'Reference 1', sub: 'Relevant Industry' },
            { key: 'ref2', label: 'Reference 2', sub: 'Local Area' },
            { key: 'ref3', label: 'Reference 3', sub: 'Other than Relative' },
          ].map(({ key, label, sub }) => (
            <div
              key={key}
              className="space-y-3 p-4 rounded-xl border-2 border-gray-200 bg-gray-50"
            >
              <div className="pb-2 border-b border-gray-200">
                <p className="text-sm font-bold text-blue-700">{label}</p>
                <p className="text-xs text-gray-500">({sub})</p>
              </div>
              {[
                { name: 'Name', key: 'Name', placeholder: 'Full name' },
                { name: 'Designation', key: 'Designation', placeholder: 'Job designation' },
                { name: 'Organization', key: 'Organization', placeholder: 'Company name' },
                { name: 'Address', key: 'Address', placeholder: 'Address', textarea: true },
                { name: 'City, State, Pin', key: 'CityStatePin', placeholder: 'Pune, Maharashtra, 411001' },
                { name: 'Contact No.', key: 'ContactNo', phone: true },
                { name: 'Email ID', key: 'Email', placeholder: 'official@example.com', email: true },
              ].map(({ name, key: fKey, placeholder, textarea, phone, email }) => {
                const fn = `${key}${fKey}`;
                const err = errors[fn];
                return (
                  <div key={fKey} className="space-y-1">
                    <label className="block text-xs font-semibold text-gray-600">{name}</label>
                    {textarea ? (
                      <textarea
                        name={fn}
                        value={formData[fn] || ''}
                        onChange={onChange}
                        rows={2}
                        placeholder={placeholder}
                        className={`${inputCls(err)} resize-none text-sm`}
                      />
                    ) : phone ? (
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-xs font-medium">
                          +91
                        </span>
                        <input
                          type="tel"
                          name={fn}
                          value={formData[fn] || ''}
                          onChange={(e) => hp(e, fn, onChange)}
                          className={`w-full pl-10 pr-3 py-2 rounded-lg border-2 ${
                            err ? 'border-red-500 bg-red-50' : 'border-gray-300'
                          } focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all outline-none font-mono text-sm`}
                          placeholder="9876543210"
                        />
                      </div>
                    ) : (
                      <input
                        type={email ? 'email' : 'text'}
                        name={fn}
                        value={formData[fn] || ''}
                        onChange={onChange}
                        placeholder={placeholder}
                        className={`${inputCls(err)} text-sm`}
                      />
                    )}
                    <Err msg={err} />
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </section>

      {/* Info banner */}
      <div className="p-4 bg-blue-50 border-l-4 border-blue-500 rounded-r-lg">
        <p className="text-sm text-blue-800 font-medium">
          Please ensure all information is accurate and matches official documents. Fields marked
          with <span className="text-red-600 font-bold">*</span> are mandatory.
        </p>
      </div>
    </div>
  );
};

export default PersonalInfoStep;