import React from 'react';
import {
  Upload, Check, FileText, Shield, AlertCircle,
  CreditCard, Building2, User, Heart, BookOpen,
  Banknote, Award, Radio,
} from 'lucide-react';

/* ─────────────────────────────────────────────
   DocumentCard — reusable upload card
───────────────────────────────────────────── */
const DocumentCard = ({
  title,
  fieldName,
  required = false,
  accept = 'image/*,application/pdf',
  icon,
  description,
  formData,
  errors = {},
  onFileChange,
  badge = null,
}) => {
  const file = formData[fieldName];

  const handleFileSelect = (e) => {
    const selected = e.target.files[0];
    if (!selected) return;
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
    if (!validTypes.includes(selected.type)) {
      alert('Please upload only JPG, PNG, or PDF files');
      e.target.value = '';
      return;
    }
    if (selected.size > 5 * 1024 * 1024) {
      alert('File size must be less than 5MB');
      e.target.value = '';
      return;
    }
    onFileChange(fieldName, selected);
  };

  const getFileSize = (bytes) => {
    if (bytes < 1024)        return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const isImage  = file instanceof File && file.type?.startsWith('image/');
  const isPDF    = file instanceof File && file.type === 'application/pdf';
  const preview  = file instanceof File && isImage ? URL.createObjectURL(file) : null;

  return (
    <div className="relative group">
      <div className={`rounded-xl p-5 border-2 transition-all duration-200 ${
        file
          ? 'border-green-400 bg-gradient-to-br from-green-50 to-emerald-50'
          : errors[fieldName]
          ? 'border-red-300 bg-red-50'
          : 'border-dashed border-gray-300 hover:border-blue-400 bg-white hover:bg-blue-50/30'
      }`}>

        {/* Badge (e.g. "Telecom Only") */}
        {badge && (
          <div className="absolute top-2 right-2 z-10">
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 text-indigo-700 border border-indigo-200">
              {badge}
            </span>
          </div>
        )}

        <div className="text-center">
          {file ? (
            /* ── Uploaded state ── */
            <div className="space-y-3">
              <div className="w-14 h-14 mx-auto bg-green-500 rounded-full flex items-center justify-center shadow-md">
                <Check className="w-7 h-7 text-white" />
              </div>
              <div>
                <div className="text-sm font-bold text-gray-900 mb-1">{title}</div>
                <div className="text-xs text-gray-600 truncate px-3 bg-white rounded py-1.5 border border-green-200">
                  {file.name}
                </div>
                <div className="text-xs text-gray-500 mt-1">{getFileSize(file.size)}</div>
              </div>
              {isImage && preview && (
                <div className="relative overflow-hidden rounded-lg border-2 border-green-200">
                  <img src={preview} alt={title} className="max-h-40 w-full object-contain bg-white" />
                </div>
              )}
              {isPDF && (
                <div className="p-4 bg-white rounded-lg border-2 border-green-200">
                  <FileText className="w-12 h-12 mx-auto text-red-500" />
                  <div className="text-xs text-gray-700 font-medium mt-2">PDF Document</div>
                </div>
              )}
              <div className="flex gap-2 justify-center pt-1">
                <label className="cursor-pointer">
                  <span className="text-xs text-green-700 hover:text-green-800 font-semibold px-4 py-2 bg-green-100 rounded-lg hover:bg-green-200 transition-all inline-block">
                    Replace
                  </span>
                  <input type="file" accept={accept} onChange={handleFileSelect} className="hidden" />
                </label>
                <button
                  type="button"
                  onClick={() => onFileChange(fieldName, null)}
                  className="text-xs text-red-700 hover:text-red-800 font-semibold px-4 py-2 bg-red-100 rounded-lg hover:bg-red-200 transition-all"
                >
                  Remove
                </button>
              </div>
            </div>
          ) : (
            /* ── Empty state ── */
            <div className="space-y-3 py-2">
              <div className="w-16 h-16 mx-auto bg-gray-100 rounded-xl flex items-center justify-center group-hover:bg-blue-100 transition-all duration-200">
                {icon}
              </div>
              <div>
                <div className="text-sm font-bold text-gray-900 mb-0.5">
                  {title}
                  {required && <span className="text-red-500 ml-1">*</span>}
                </div>
                {description && <div className="text-xs text-gray-600 mt-1">{description}</div>}
                <div className="text-xs text-gray-500 mt-2">PNG, JPG, PDF • Max 5MB</div>
              </div>
              <label className="cursor-pointer">
                <span className="px-5 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition-all inline-flex items-center gap-2 shadow-sm hover:shadow-md">
                  <Upload className="w-4 h-4" /> Choose File
                </span>
                <input type="file" accept={accept} onChange={handleFileSelect} className="hidden" />
              </label>
            </div>
          )}
        </div>
      </div>

      {errors[fieldName] && (
        <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-xs text-red-600 font-medium flex items-center gap-1">
            <AlertCircle className="w-3 h-3" />
            {errors[fieldName]}
          </p>
        </div>
      )}
    </div>
  );
};

/* ─────────────────────────────────────────────
   Main Documents component
───────────────────────────────────────────── */
const DocumentUploadStep = ({ formData, errors = {}, onFileChange, department }) => {
  const iconCls = 'w-8 h-8 text-gray-400 group-hover:text-blue-600 transition-colors';

  const rawDept   = (department || formData?.department || '').toString().toLowerCase().trim();
  const isTelecom = rawDept === 'telecom';

  return (
    <div className="space-y-8">

      {/* Header */}
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-purple-500 to-purple-600 rounded-full mb-3 shadow-lg">
          <Shield className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-1">Document Upload</h2>
        <p className="text-gray-600 text-sm">Upload all required documents for verification</p>
      </div>

      {/* Guidelines banner */}
      <div className="p-4 bg-blue-50 border-l-4 border-blue-500 rounded-lg">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="font-semibold text-blue-900 mb-1">Document Guidelines</p>
            {isTelecom ? (
              <p className="text-blue-700">
                For <strong>Telecom</strong> employees, the following are mandatory:
                Employee Photo, Aadhaar Card, Resume, Bank Passbook, Medical Certificate,
                Academic Records, and <strong>FARM-ToCli Certificate</strong>.
                Accepted formats: JPG, PNG, PDF — max 5MB each.
              </p>
            ) : (
              <p className="text-blue-700">
                The following documents are mandatory: Employee Photo, Aadhaar Card, Resume,
                and Bank Passbook. Other documents are optional but recommended.
                Accepted formats: JPG, PNG, PDF — max 5MB each.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Telecom notice */}
      {isTelecom && (
        <div className="p-4 bg-indigo-50 border border-indigo-200 rounded-lg flex items-start gap-3">
          <Radio className="w-5 h-5 text-indigo-500 flex-shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="font-semibold text-indigo-900 mb-0.5">Telecom Department Detected</p>
            <p className="text-indigo-700">
              FARM-ToCli Certificate is required for all Telecom employees. Please upload a valid,
              current certificate.
            </p>
          </div>
        </div>
      )}

      {/* ── Identity & Personal Documents ── */}
      <div className="space-y-3">
        <h3 className="text-sm font-bold text-gray-700 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-blue-500 inline-block" />
          Identity &amp; Personal Documents
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Mandatory for ALL departments */}
          <DocumentCard
            title="Employee Photo"
            fieldName="idPhoto"
            required
            accept="image/*"
            description="Recent passport-size photo (45mm × 35mm)"
            icon={<User className={iconCls} />}
            formData={formData} errors={errors} onFileChange={onFileChange}
          />
          <DocumentCard
            title="Aadhaar Card"
            fieldName="aadharCard"
            required
            description="Front and back sides"
            icon={<CreditCard className={iconCls} />}
            formData={formData} errors={errors} onFileChange={onFileChange}
          />
          <DocumentCard
            title="PAN Card"
            fieldName="panCard"
            required={false}
            description="Optional — if available"
            icon={<FileText className={iconCls} />}
            formData={formData} errors={errors} onFileChange={onFileChange}
          />
          <DocumentCard
            title="Resume (Signed Copy)"
            fieldName="resume"
            required
            description="Signed copy of latest resume"
            icon={<FileText className={iconCls} />}
            formData={formData} errors={errors} onFileChange={onFileChange}
          />
        </div>
      </div>

      {/* ── KYE Form Documents ── */}
      <div className="space-y-3">
        <h3 className="text-sm font-bold text-gray-700 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-indigo-500 inline-block" />
          KYE Form Documents
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

          {/* Medical Certificate — mandatory for Telecom, optional for others */}
          <DocumentCard
            title="Medical Certificate"
            fieldName="medicalCertificate"
            required={isTelecom}
            description={isTelecom
              ? "Mandatory — latest medical fitness certificate"
              : "Optional — latest medical fitness certificate"}
            icon={<Heart className={iconCls} />}
            formData={formData} errors={errors} onFileChange={onFileChange}
          />

          {/* Academic Records — mandatory for Telecom, optional for others */}
          <DocumentCard
            title="Academic Records"
            fieldName="academicRecords"
            required={isTelecom}
            description={isTelecom
              ? "Mandatory — SSC, ITI, HSC, Diploma, Degree certificates"
              : "Optional — SSC, ITI, HSC, Diploma, Degree certificates"}
            icon={<BookOpen className={iconCls} />}
            formData={formData} errors={errors} onFileChange={onFileChange}
          />

          {/* Bank Passbook — mandatory for ALL departments */}
          <DocumentCard
            title="Bank Passbook / Cancelled Cheque"
            fieldName="bankPassbook"
            required
            description="For bank account verification"
            icon={<Building2 className={iconCls} />}
            formData={formData} errors={errors} onFileChange={onFileChange}
          />

          {/* Pay Slip — always optional */}
          <DocumentCard
            title="Pay Slip / Bank Statement"
            fieldName="payslip"
            required={false}
            description="Last drawn salary proof (optional)"
            icon={<Banknote className={iconCls} />}
            formData={formData} errors={errors} onFileChange={onFileChange}
          />

          {/* FARM-ToCli — shown for Telecom only, mandatory when shown */}
          {isTelecom && (
            <DocumentCard
              title="FARM-ToCli Certificate"
              fieldName="farmToCli"
              required
              description="Field Activity Risk Management – ToCli compliance certificate"
              icon={<Radio className={iconCls} />}
              badge="Telecom Only"
              formData={formData} errors={errors} onFileChange={onFileChange}
            />
          )}

          {/* Other Certificates — always optional */}
          <DocumentCard
            title="Other Certificates"
            fieldName="otherCertificates"
            required={false}
            description="Any other relevant certificates (optional)"
            icon={<Award className={iconCls} />}
            formData={formData} errors={errors} onFileChange={onFileChange}
          />
        </div>
      </div>

      {/* Warning banner */}
      <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <p className="text-sm text-yellow-800">
          <strong>Important:</strong> Please ensure all uploaded documents are clear, valid,
          and match the information provided in previous steps.
        </p>
      </div>
    </div>
  );
};

export default DocumentUploadStep;