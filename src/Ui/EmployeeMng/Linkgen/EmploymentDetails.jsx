import React from 'react';
import {
  Building2,
  Calendar,
  Layers,
  MapPin,
  UserCircle,
  Users,
  AlertCircle,
} from 'lucide-react';

const EmploymentDetailsStep = ({ formData, errors = {}, onChange }) => {

  // All designations (used for every department)
  const allDesignations = [
    'Corporate Office Manager',
    'Coordinator',
    'Report Maker',
    'DT Engineer',
    'Service Engineer',
    'HR & Admin',
    'HSW Lead',
    'Intern',
    'IT Manager',
    'Manager',
    'Operations Head',
    'Project Manager',
    'Operations Lead',
    'Rigger',
    'Software Engineer',
    'Store Manager',
    'Technician',
    'Accountant',
  ];

  const departments = [
    'IT',
    'Telecom',
    'Corporate Office',
  ];

  const circles = [
    'Gujarat',
    'HP (Himachal Pradesh)',
    'MH (Maharashtra)',
    'MH (Pune Office)',
    'MH Nagpur',
    'MH_Ahilyanagar',
    'MH_Nagpur',
    'MH_Pen',
    'MPCG',
    'Mumbai',
    'Punjab',
    'Pune',
    'Other',
  ];

  const projectNames = [
    'Corporate',
    'E// JIO',
    'E// JIO EMF',
    'E// JIO TI',
    'E// JIO UBR',
    'E// VIL',
    'IGR',
    'IT',
    'Smart Intelligent Village',
    'VIL MM',
  ];

  const employmentTypes = ['Full-time', 'Part-time', 'Contract', 'Internship', 'Temporary'];

  const isTelecom = formData.department === 'Telecom';

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Employment Details</h2>
        <p className="text-gray-600">Provide information about your role and employment</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        {/* Employee ID — Auto-generated, read-only */}
        <div className="space-y-2">
          <label className="block text-sm font-semibold text-gray-700">Employee ID</label>
          <div className="relative">
            <input
              type="text"
              name="employeeId"
              value={formData.employeeId || ''}
              readOnly
              className="w-full px-4 py-3 rounded-lg border-2 border-gray-200 bg-gray-50 outline-none font-mono tracking-wide text-gray-700"
              placeholder="Auto-generated"
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-green-100 text-green-700">
                Auto-generated
              </span>
            </div>
          </div>
        </div>

        {/* Joining Date */}
        <div className="space-y-2">
          <label className="flex items-center gap-1 text-sm font-semibold text-gray-700">
            <Calendar className="w-4 h-4 text-gray-500" />
            Joining Date <span className="text-red-500">*</span>
          </label>
          <input
            type="date"
            name="joiningDate"
            value={formData.joiningDate || ''}
            onChange={onChange}
            className={`w-full px-4 py-3 rounded-lg border-2 ${
              errors.joiningDate ? 'border-red-500 bg-red-50' : 'border-gray-300'
            } focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all outline-none`}
          />
          {errors.joiningDate && (
            <p className="text-xs text-red-600 flex items-center gap-1">
              <AlertCircle className="w-3 h-3" />{errors.joiningDate}
            </p>
          )}
        </div>

        {/* Department */}
        <div className="space-y-2">
          <label className="flex items-center gap-1 text-sm font-semibold text-gray-700">
            <Building2 className="w-4 h-4 text-gray-500" />
            Department <span className="text-red-500">*</span>
          </label>
          <select
            name="department"
            value={formData.department || ''}
            onChange={onChange}
            className={`w-full px-4 py-3 rounded-lg border-2 ${
              errors.department ? 'border-red-500 bg-red-50' : 'border-gray-300'
            } focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all outline-none appearance-none bg-white cursor-pointer`}
          >
            <option value="">Select Department</option>
            {departments.map((dept) => (
              <option key={dept} value={dept}>{dept}</option>
            ))}
          </select>
          {errors.department && (
            <p className="text-xs text-red-600 flex items-center gap-1">
              <AlertCircle className="w-3 h-3" />{errors.department}
            </p>
          )}
        </div>

        {/* Designation — shown after department is selected */}
        {formData.department && (
          <div className="space-y-2">
            <label className="flex items-center gap-1 text-sm font-semibold text-gray-700">
              <Users className="w-4 h-4 text-gray-500" />
              Designation <span className="text-red-500">*</span>
            </label>
            <select
              name="position"
              value={formData.position || ''}
              onChange={onChange}
              className={`w-full px-4 py-3 rounded-lg border-2 ${
                errors.position ? 'border-red-500 bg-red-50' : 'border-gray-300'
              } focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all outline-none appearance-none bg-white cursor-pointer`}
            >
              <option value="">Select Designation</option>
              {allDesignations.map((designation) => (
                <option key={designation} value={designation}>{designation}</option>
              ))}
            </select>
            {errors.position && (
              <p className="text-xs text-red-600 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />{errors.position}
              </p>
            )}
          </div>
        )}

        {/* Project — only for Telecom */}
        {isTelecom && (
          <div className="space-y-2">
            <label className="flex items-center gap-1 text-sm font-semibold text-gray-700">
              <Layers className="w-4 h-4 text-gray-500" />
              Project Name <span className="text-red-500">*</span>
            </label>
            <select
              name="projectName"
              value={formData.projectName || ''}
              onChange={onChange}
              className={`w-full px-4 py-3 rounded-lg border-2 ${
                errors.projectName ? 'border-red-500 bg-red-50' : 'border-gray-300'
              } focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all outline-none appearance-none bg-white cursor-pointer`}
            >
              <option value="">Select Project</option>
              {projectNames.map((project) => (
                <option key={project} value={project}>{project}</option>
              ))}
            </select>
            {errors.projectName && (
              <p className="text-xs text-red-600 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />{errors.projectName}
              </p>
            )}
          </div>
        )}

        {/* Circle — only for Telecom */}
        {isTelecom && (
          <div className="space-y-2">
            <label className="flex items-center gap-1 text-sm font-semibold text-gray-700">
              <MapPin className="w-4 h-4 text-gray-500" />
              Circle <span className="text-red-500">*</span>
            </label>
            <select
              name="circle"
              value={formData.circle || ''}
              onChange={onChange}
              className={`w-full px-4 py-3 rounded-lg border-2 ${
                errors.circle ? 'border-red-500 bg-red-50' : 'border-gray-300'
              } focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all outline-none appearance-none bg-white cursor-pointer`}
            >
              <option value="">Select Circle</option>
              {circles.map((circle) => (
                <option key={circle} value={circle}>{circle}</option>
              ))}
            </select>
            {errors.circle && (
              <p className="text-xs text-red-600 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />{errors.circle}
              </p>
            )}
          </div>
        )}

        {/* Reporting Manager */}
        <div className="space-y-2">
          <label className="flex items-center gap-1 text-sm font-semibold text-gray-700">
            <UserCircle className="w-4 h-4 text-gray-500" />
            Reporting Manager
          </label>
          <input
            type="text"
            name="reportingManager"
            value={formData.reportingManager || ''}
            onChange={onChange}
            className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all outline-none"
            placeholder="Manager's name"
          />
        </div>

        {/* Employment Type — Radio button cards */}
        <div className="space-y-3 md:col-span-2">
          <label className="block text-sm font-semibold text-gray-700">
            Employment Type <span className="text-red-500">*</span>
          </label>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {employmentTypes.map((type) => (
              <label
                key={type}
                className={`relative flex items-center justify-center px-4 py-3 rounded-lg border-2 cursor-pointer transition-all ${
                  formData.employmentType === type
                    ? 'border-blue-500 bg-blue-50 shadow-sm'
                    : 'border-gray-300 hover:border-blue-300 bg-white'
                }`}
              >
                <input
                  type="radio"
                  name="employmentType"
                  value={type}
                  checked={formData.employmentType === type}
                  onChange={onChange}
                  className="sr-only"
                />
                <span className={`text-sm font-medium ${
                  formData.employmentType === type ? 'text-blue-700' : 'text-gray-700'
                }`}>
                  {type}
                </span>
                {formData.employmentType === type && (
                  <div className="absolute top-2 right-2 w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
                    <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                )}
              </label>
            ))}
          </div>
          {errors.employmentType && (
            <p className="text-xs text-red-600 flex items-center gap-1 mt-1">
              <AlertCircle className="w-3 h-3" />{errors.employmentType}
            </p>
          )}
        </div>

      </div>

      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mt-6">
        <p className="text-sm text-yellow-800">
          <strong>Please review:</strong> Make sure all information is accurate before submitting.
          You won't be able to edit this information after submission.
        </p>
      </div>
    </div>
  );
};

export default EmploymentDetailsStep;