import React, { useState } from "react";
import {
  X, Upload, FileSpreadsheet, Download, AlertCircle,
  CheckCircle, Loader, Table2, ChevronDown, ChevronUp, Info,
} from "lucide-react";
import * as XLSX from "xlsx-js-style";
import employeeService from "../../services/employeeService";

const BASE_URL =
  (typeof import.meta !== "undefined" && import.meta.env?.VITE_API_URL) ||
  "http://localhost:5000/api";

const SECTIONS = [
  { label: "Basic",                color: "#374151" },
  { label: "Personal Information", color: "#1D4ED8" },
  { label: "Family Details",       color: "#7C3AED" },
  { label: "Emergency Contact",    color: "#DC2626" },
  { label: "Permanent Address",    color: "#059669" },
  { label: "Local Address",        color: "#0891B2" },
  { label: "Reference 1",          color: "#D97706" },
  { label: "Reference 2",          color: "#D97706" },
  { label: "Reference 3",          color: "#D97706" },
  { label: "Employment",           color: "#7C3AED" },
  { label: "Salary & Bank",        color: "#047857" },
];

// Middle Name removed → all column indices after it shift by -1
const SECTION_DEFS = [
  ["Basic",                 0,  1,  "374151"],
  ["Personal Information",  2,  18, "1D4ED8"],  // was 19, -1 for removed Middle Name
  ["Family Details",        19, 23, "7C3AED"],  // was 20-24
  ["Emergency Contact",     24, 27, "DC2626"],  // was 25-28
  ["Permanent Address",     28, 31, "059669"],  // was 29-32
  ["Local Address",         32, 36, "0891B2"],  // was 33-37
  ["Reference 1",           37, 43, "D97706"],  // was 38-44
  ["Reference 2",           44, 50, "D97706"],  // was 45-51
  ["Reference 3",           51, 57, "D97706"],  // was 52-58
  ["Employment",            58, 65, "7C3AED"],  // was 59-66
  ["Salary & Bank",         66, 74, "047857"],  // was 67-75
];

const FIELD_HEADERS = [
  "Employee ID", "Status",
  "First Name", "Father/Husband Name", "Last Name",             // Middle Name removed
  "Email", "Phone", "Alternate Phone", "Date of Birth", "Gender",
  "Marital Status", "Educational Qualification", "Blood Group",
  "PAN Number", "Name on PAN", "Aadhaar Number", "Name on Aadhaar",
  "Address", "City",                                             // (Legacy) removed
  "Family Member Name", "Family Contact No", "Family Working Status",
  "Family Employer Name", "Family Employer Contact",
  "Emergency Contact Name", "Emergency Contact No", "Emergency Address", "Emergency Relation",
  "Permanent Address", "Permanent Phone", "Permanent Landmark", "Permanent Lat-Long",
  "Same as Permanent", "Local Address", "Local Phone", "Local Landmark", "Local Lat-Long",
  "Ref1 Name", "Ref1 Designation", "Ref1 Organization", "Ref1 Address",
  "Ref1 City/State/Pin", "Ref1 Contact", "Ref1 Email",
  "Ref2 Name", "Ref2 Designation", "Ref2 Organization", "Ref2 Address",
  "Ref2 City/State/Pin", "Ref2 Contact", "Ref2 Email",
  "Ref3 Name", "Ref3 Designation", "Ref3 Organization", "Ref3 Address",
  "Ref3 City/State/Pin", "Ref3 Contact", "Ref3 Email",
  "Department", "Designation", "Joining Date", "Employment Type",
  "Circle", "Project Name", "Reporting Manager", "Basic Salary",
  "HRA", "Other Allowances", "Total Salary",
  "Bank Name", "Bank Branch", "Account Number", "IFSC Code", "Account Holder Name", "",
];

const SAMPLE_DATA = [
  "", "Active",
  "Rahul", "Suresh", "Sharma",                                  // Middle Name removed
  "rahul.sharma@example.com", "9876543210",
  "", "1995-06-15", "Male", "Unmarried",
  "B.Tech", "O+", "ABCDE1234F", "Rahul Suresh Sharma",
  "123456789012", "Rahul Suresh Sharma", "45 MG Road", "Pune",  // no (Legacy)
  "", "", "", "", "",
  "", "", "", "",
  "45 MG Road, Pune", "9876543210", "", "",
  "Yes", "", "", "", "",
  "", "", "", "", "", "", "",
  "", "", "", "", "", "", "",
  "", "", "", "", "", "", "",
  "IT", "Software Developer", "2024-01-10", "Full-time",
  "West", "Project Alpha", "Amit Joshi", 45000,
  13500, 5000, 63500,
  "State Bank of India", "Pune Main", "1234567890", "SBIN0001234", "Rahul Suresh Sharma", "",
];

const COL_WIDTHS = [
  12, 10, 16, 20, 14,                                            // removed Middle Name width (16)
  28, 14, 16, 13, 10, 14, 24, 12, 14, 20, 16, 20, 14, 14,
  20, 16, 18, 20, 14, 22, 18, 24, 18, 28, 16, 20, 14, 16, 28, 16, 20, 16, 18,
  18, 20, 22, 20, 16, 24, 20, 18, 20, 22, 20, 16, 24, 20, 18, 20, 22, 20, 16, 24,
  18, 20, 14, 16, 14, 20, 14, 14, 12, 18, 14, 22, 18, 16, 14, 22, 10,
];

const sv  = (v) => (v !== undefined && v !== null ? String(v).trim() : "");
const num = (v) => parseFloat(String(v ?? "").replace(/[^0-9.-]/g, "")) || 0;

const fmtDate = (v) => {
  if (!v) return "";
  if (typeof v === "number") {
    const d = new Date(Math.round((v - 25569) * 86400 * 1000));
    return d.toISOString().split("T")[0];
  }
  const str = sv(v);
  if (!str || str === "nan") return "";
  const d = new Date(str);
  return isNaN(d.getTime()) ? str : d.toISOString().split("T")[0];
};

const detectFormat = (rows) => {
  if (!rows?.length) return "unknown";
  const r0 = rows[0].map((x) => sv(x).toLowerCase());
  if (["basic", "personal information", "employment", "salary & bank"].some((x) => r0.includes(x)))
    return "export";
  if (["first name", "last name", "email", "phone"].some((x) => r0.includes(x)))
    return "template";
  return "unknown";
};

const parseFile = (arrayBuffer) => {
  const wb    = XLSX.read(new Uint8Array(arrayBuffer), { type: "array", cellDates: false });
  const sheet = wb.Sheets[wb.SheetNames[0]];
  const rows  = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: "" });
  const fmt   = detectFormat(rows);
  const headerIdx = fmt === "export" ? 1 : 0;
  const headers   = rows[headerIdx].map((x) => sv(x));
  const dataRows  = rows.slice(headerIdx + 1).filter((row) => {
    const colA = sv(row[0]);
    if (colA.toLowerCase().startsWith("total")) return false;
    return row.slice(0, 10).some((v) => sv(v) !== "");
  });
  const objects = dataRows.map((row) => {
    const obj = {};
    headers.forEach((h, i) => { if (h) obj[h] = row[i] ?? ""; });
    return obj;
  });
  return { format: fmt, objects };
};

// ── Map row → API body ──────────────────────────────────────────────────────
const mapToBody = (row) => {
  const g = (...keys) => {
    for (const k of keys) {
      const val = sv(row[k]);
      if (val && val !== "nan") return val;
    }
    return "";
  };

  return {
    employeeId:               "",
    status:                   "Active",
    firstName:                g("First Name",                "First Name *"),
    fatherHusbandName:        g("Father/Husband Name"),
    // middleName removed
    lastName:                 g("Last Name",                 "Last Name *"),
    email:                    g("Email",                     "Email *").toLowerCase(),
    phone:                    g("Phone",                     "Phone *").replace(/\D/g, "").slice(-10),
    altPhone:                 g("Alternate Phone").replace(/\D/g, ""),
    dob:                      fmtDate(row["Date of Birth"]   || row["Date of Birth *"] || ""),
    gender:                   g("Gender",                    "Gender *"),
    maritalStatus:            g("Marital Status"),
    educationalQualification: g("Educational Qualification"),
    bloodGroup:               g("Blood Group"),
    panNumber:                g("PAN Number"),
    nameOnPan:                g("Name on PAN"),
    aadhar:                   g("Aadhaar Number", "Aadhar Number", "Aadhar Number *").replace(/\s/g, ""),
    nameOnAadhar:             g("Name on Aadhaar"),
    address:                  g("Address", "Address (Legacy)"),  // supports old exports too
    city:                     g("City",    "City (Legacy)"),
    state:                    g("State"),
    zipCode:                  g("Zip Code"),
    familyMemberName:         g("Family Member Name"),
    familyContactNo:          g("Family Contact No").replace(/\D/g, ""),
    familyWorkingStatus:      g("Family Working Status"),
    familyEmployerName:       g("Family Employer Name"),
    familyEmployerContact:    g("Family Employer Contact").replace(/\D/g, ""),
    emergencyContactName:     g("Emergency Contact Name"),
    emergencyContactNo:       g("Emergency Contact No").replace(/\D/g, ""),
    emergencyContactAddress:  g("Emergency Address"),
    emergencyContactRelation: g("Emergency Relation"),
    permanentAddress:         g("Permanent Address"),
    permanentPhone:           g("Permanent Phone").replace(/\D/g, ""),
    permanentLandmark:        g("Permanent Landmark"),
    permanentLatLong:         g("Permanent Lat-Long"),
    localSameAsPermanent:     g("Same as Permanent").toLowerCase() === "yes",
    localAddress:             g("Local Address"),
    localPhone:               g("Local Phone").replace(/\D/g, ""),
    localLandmark:            g("Local Landmark"),
    localLatLong:             g("Local Lat-Long"),
    ref1Name:                 g("Ref1 Name"),
    ref1Designation:          g("Ref1 Designation"),
    ref1Organization:         g("Ref1 Organization"),
    ref1Address:              g("Ref1 Address"),
    ref1CityStatePin:         g("Ref1 City/State/Pin"),
    ref1ContactNo:            g("Ref1 Contact").replace(/\D/g, ""),
    ref1Email:                g("Ref1 Email").toLowerCase(),
    ref2Name:                 g("Ref2 Name"),
    ref2Designation:          g("Ref2 Designation"),
    ref2Organization:         g("Ref2 Organization"),
    ref2Address:              g("Ref2 Address"),
    ref2CityStatePin:         g("Ref2 City/State/Pin"),
    ref2ContactNo:            g("Ref2 Contact").replace(/\D/g, ""),
    ref2Email:                g("Ref2 Email").toLowerCase(),
    ref3Name:                 g("Ref3 Name"),
    ref3Designation:          g("Ref3 Designation"),
    ref3Organization:         g("Ref3 Organization"),
    ref3Address:              g("Ref3 Address"),
    ref3CityStatePin:         g("Ref3 City/State/Pin"),
    ref3ContactNo:            g("Ref3 Contact").replace(/\D/g, ""),
    ref3Email:                g("Ref3 Email").toLowerCase(),
    department:               g("Department",      "Department *"),
    designation:              g("Designation",     "Designation *"),
    joiningDate:              fmtDate(row["Joining Date"] || row["Joining Date *"] || ""),
    employmentType:           g("Employment Type", "Employment Type *"),
    circle:                   g("Circle"),
    projectName:              g("Project Name"),
    reportingManager:         g("Reporting Manager"),
    basicSalary:              num(row["Basic Salary"]     || 0),
    hra:                      num(row["HRA"]              || 0),
    otherAllowances:          num(row["Other Allowances"] || 0),
    bankName:                 g("Bank Name",       "Bank Name *"),
    bankBranch:               g("Bank Branch"),
    accountNumber:            g("Account Number",  "Account Number *"),
    ifscCode:                 g("IFSC Code",       "IFSC Code *").toUpperCase(),
    accountHolderName:        g("Account Holder Name"),
  };
};

const REQUIRED_FIELDS = [
  { key: "firstName",      label: "First Name" },
  { key: "lastName",       label: "Last Name" },
  { key: "email",          label: "Email" },
  { key: "phone",          label: "Phone" },
  { key: "dob",            label: "Date of Birth" },
  { key: "gender",         label: "Gender" },
  { key: "department",     label: "Department" },
  { key: "designation",    label: "Designation" },
  { key: "joiningDate",    label: "Joining Date" },
  { key: "employmentType", label: "Employment Type" },
  { key: "bankName",       label: "Bank Name" },
  { key: "accountNumber",  label: "Account Number" },
  { key: "ifscCode",       label: "IFSC Code" },
];

const validate = (rows, format = "template") => {
  const errors = [];
  const isReimport = format === "export";
  rows.forEach((row, i) => {
    const label = `Row ${i + 3}`;
    REQUIRED_FIELDS.forEach(({ key, label: fieldLabel }) => {
      if (!row[key] || sv(row[key]) === "")
        errors.push(`${label}: Missing — ${fieldLabel}`);
    });
    if (row.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(row.email))
      errors.push(`${label}: Invalid email format`);
    if (row.phone && !/^[6-9]\d{9}$/.test(row.phone))
      errors.push(`${label}: Phone must be 10 digits starting with 6–9`);
    if (!isReimport && row.dob) {
      const d = new Date(row.dob);
      if (!isNaN(d.getTime())) {
        const age = Math.floor((Date.now() - d) / 31557600000);
        if (age < 18 || age > 100)
          errors.push(`${label}: Date of Birth — age must be 18–100`);
      }
    }
  });
  return errors;
};

const friendlyError = (err) => {
  const msg = err?.message || "";
  if (msg.includes("email address") || msg.includes("email already"))
    return "Email already exists — employee already in system";
  if (msg.includes("employee ID") || msg.includes("employee_id"))
    return "Employee ID conflict — contact support";
  if (msg.includes("account_number") || msg.includes("account number"))
    return "Account number already exists";
  return msg || "Unknown error";
};

// ── Component ───────────────────────────────────────────────────────────────
const ImportExcelModal = ({ onClose, showToast, onImportComplete }) => {
  const [file,              setFile]              = useState(null);
  const [fileFormat,        setFileFormat]        = useState(null);
  const [importing,         setImporting]         = useState(false);
  const [downloadingExport, setDownloadingExport] = useState(false);
  const [validationErrors,  setValidationErrors]  = useState([]);
  const [preview,           setPreview]           = useState(null);
  const [importResult,      setImportResult]      = useState(null);
  const [showTable,         setShowTable]         = useState(true);

  const handleFileChange = (e) => {
    const f = e.target.files[0];
    if (!f) return;
    const validTypes = [
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "text/csv",
    ];
    if (!validTypes.includes(f.type) && !f.name.match(/\.(xlsx|xls|csv)$/i)) {
      showToast?.("Please upload a valid Excel or CSV file", "error"); return;
    }
    setFile(f); setValidationErrors([]); setImportResult(null); setFileFormat(null);
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const { format, objects } = parseFile(ev.target.result);
        setFileFormat(format);
        setPreview(objects.slice(0, 5).map(mapToBody));
      } catch { showToast?.("Error reading file", "error"); }
    };
    reader.readAsArrayBuffer(f);
  };

  const handleImport = async () => {
    if (!file) { showToast?.("Please select a file", "error"); return; }
    setImporting(true); setImportResult(null); setValidationErrors([]);
    const reader = new FileReader();
    reader.onload = async (ev) => {
      try {
        const { format, objects } = parseFile(ev.target.result);
        if (!objects.length) {
          showToast?.("File is empty or has no data rows", "error");
          setImporting(false); return;
        }
        const mapped = objects.map(mapToBody);
        const errors = validate(mapped, format);
        if (errors.length) { setValidationErrors(errors); setImporting(false); return; }

        let successCount = 0, errorCount = 0;
        const importedRows = [];

        for (let i = 0; i < mapped.length; i++) {
          if (!mapped[i].accountHolderName)
            mapped[i].accountHolderName = `${mapped[i].firstName} ${mapped[i].lastName}`.trim();
          mapped[i].employeeId = "";

          try {
            await employeeService.addEmployee(mapped[i]);
            successCount++;
            importedRows.push({ ...mapped[i], _rowNum: i + 3, _status: "success" });
          } catch (err) {
            errorCount++;
            importedRows.push({ ...mapped[i], _rowNum: i + 3, _status: "error", _error: friendlyError(err) });
          }
        }

        setImporting(false);
        setImportResult({ successCount, errorCount, importedRows });
        setShowTable(true);

        if (errorCount === 0) {
          showToast?.(`Successfully imported ${successCount} employee${successCount > 1 ? "s" : ""}!`, "success");
          onImportComplete?.();
        } else if (successCount > 0) {
          showToast?.(`Imported ${successCount} employees. ${errorCount} failed.`, "error");
        } else {
          showToast?.(`All ${errorCount} rows failed — check errors below.`, "error");
        }
      } catch (err) {
        console.error(err);
        showToast?.("Error processing file. Please check the format.", "error");
        setImporting(false);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const downloadTemplate = () => {
    const colColorMap = {};
    SECTION_DEFS.forEach(([, sc, ec, color]) => {
      for (let c = sc; c <= ec; c++) colColorMap[c] = color;
    });
    const totalCols = FIELD_HEADERS.length;
    const mkCell = (value, style) => ({ v: value, t: typeof value === "number" ? "n" : "s", s: style });
    const row1 = Array.from({ length: totalCols }, (_, c) => {
      const secDef = SECTION_DEFS.find(([, sc]) => sc === c);
      return mkCell(secDef ? secDef[0] : "", {
        font: { bold: true, color: { rgb: "FFFFFF" }, sz: 10, name: "Arial" },
        fill: { fgColor: { rgb: colColorMap[c] || "374151" }, patternType: "solid" },
        alignment: { horizontal: "center", vertical: "center" },
      });
    });
    const row2 = FIELD_HEADERS.map((h) => mkCell(h, {
      font: { bold: true, color: { rgb: "FFFFFF" }, sz: 9, name: "Arial" },
      fill: { fgColor: { rgb: "1F2937" }, patternType: "solid" },
      alignment: { horizontal: "center", vertical: "center", wrapText: true },
    }));
    const row3 = SAMPLE_DATA.map((v) => mkCell(v, {
      font: { sz: 9, name: "Arial", color: { rgb: "374151" } },
      fill: { fgColor: { rgb: "F8FAFC" }, patternType: "solid" },
      alignment: { vertical: "center" },
    }));
    const ws = {};
    [row1, row2, row3].forEach((rowArr, r) => {
      rowArr.forEach((cellObj, c) => { ws[XLSX.utils.encode_cell({ r, c })] = cellObj; });
    });
    ws["!ref"]    = XLSX.utils.encode_range({ s: { r: 0, c: 0 }, e: { r: 2, c: totalCols - 1 } });
    ws["!cols"]   = COL_WIDTHS.map((w) => ({ wch: w }));
    ws["!rows"]   = [{ hpt: 22 }, { hpt: 28 }, { hpt: 16 }];
    ws["!merges"] = SECTION_DEFS.map(([, sc, ec]) => ({ s: { r: 0, c: sc }, e: { r: 0, c: ec } }));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Employee Import");
    XLSX.writeFile(wb, "employee_import_template.xlsx");
    showToast?.("Template downloaded!", "success");
  };

  const downloadEmployeesExcel = async () => {
    setDownloadingExport(true);
    try {
      const res  = await fetch(`${BASE_URL}/employees/export/data`);
      if (!res.ok) throw new Error("Export failed");
      const blob = await res.blob();
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement("a");
      const date = new Date().toISOString().slice(0, 10);
      a.href = url; a.download = `employees_export_${date}.xlsx`;
      document.body.appendChild(a); a.click();
      document.body.removeChild(a); URL.revokeObjectURL(url);
      showToast?.("Employees exported successfully!", "success");
    } catch { showToast?.("Failed to export employee data", "error"); }
    finally   { setDownloadingExport(false); }
  };

  const reset = () => {
    setFile(null); setPreview(null); setImportResult(null);
    setValidationErrors([]); setFileFormat(null);
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[1100] p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[92vh] overflow-hidden flex flex-col">

        {/* Header */}
        <div className="bg-gradient-to-r from-green-600 to-emerald-600 text-white px-8 py-5 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="bg-green-500 rounded-xl p-2"><FileSpreadsheet className="w-6 h-6" /></div>
            <div>
              <h3 className="text-xl font-bold">Import Employees from Excel</h3>
              <p className="text-green-100 text-sm mt-0.5">Upload the exported employees file or the import template</p>
            </div>
          </div>
          <button onClick={onClose} disabled={importing} className="p-2 hover:bg-green-700 rounded-lg transition-all disabled:opacity-50">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-8 overflow-y-auto flex-1">
          {!importResult && (<>
            {/* Drop zone */}
            <div className="mb-4">
              <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-green-500 transition-colors">
                <input type="file" accept=".xlsx,.xls,.csv" onChange={handleFileChange} disabled={importing} className="hidden" id="excel-upload" />
                <label htmlFor="excel-upload" className="cursor-pointer flex flex-col items-center gap-3">
                  <div className="bg-green-100 rounded-full p-4"><Upload className="w-8 h-8 text-green-600" /></div>
                  <div>
                    <p className="text-gray-700 font-medium flex items-center justify-center gap-2 flex-wrap">
                      {file ? file.name : "Click to upload or drag and drop"}
                      {fileFormat && (
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${fileFormat === "export" ? "bg-blue-100 text-blue-700" : "bg-green-100 text-green-700"}`}>
                          {fileFormat === "export" ? "Export Format Detected ✓" : "Template Format Detected ✓"}
                        </span>
                      )}
                    </p>
                    <p className="text-sm text-gray-500 mt-1">Accepts: exported employees file · import template · CSV</p>
                  </div>
                </label>
              </div>
            </div>

            {/* Download template link */}
            <div className="mb-5 flex justify-end">
              <button onClick={downloadTemplate} className="text-sm text-green-700 hover:underline flex items-center gap-1 font-medium">
                <Download className="w-4 h-4" /> Download Import Template
              </button>
            </div>

            {/* Preview */}
            {preview?.length > 0 && (
              <div className="mb-5">
                <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  Preview ({preview.length} row{preview.length > 1 ? "s" : ""} detected)
                </h4>
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200 space-y-2">
                  {preview.map((emp, idx) => (
                    <div key={idx} className="bg-white p-3 rounded border border-gray-200 text-sm flex flex-wrap gap-3 items-center">
                      <span className="font-semibold text-gray-400 text-xs">Row {idx + 3}</span>
                      <span className="font-medium text-gray-900">{emp.firstName} {emp.lastName}</span>
                      <span className="text-gray-500 text-xs">{emp.email}</span>
                      {emp.phone && <span className="text-gray-400 text-xs">{emp.phone}</span>}
                      {emp.department && <span className="text-indigo-600 text-xs bg-indigo-50 px-2 py-0.5 rounded">{emp.department}</span>}
                      {emp.designation && <span className="text-gray-500 text-xs">· {emp.designation}</span>}
                      {emp.joiningDate && <span className="text-gray-400 text-xs">📅 {emp.joiningDate}</span>}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Validation errors */}
            {validationErrors.length > 0 && (
              <div className="bg-red-50 rounded-xl p-5 mb-5 border border-red-200">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <h4 className="font-semibold text-red-900 mb-2">Validation Errors ({validationErrors.length})</h4>
                    <div className="max-h-48 overflow-y-auto space-y-1">
                      {validationErrors.map((err, idx) => <p key={idx} className="text-sm text-red-700">• {err}</p>)}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Field guide */}
            <div className="bg-amber-50 rounded-lg p-4 border border-amber-200">
              <h4 className="font-semibold text-amber-900 mb-3 text-sm flex items-center gap-1"><Info className="w-4 h-4" /> Field Guide</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-1 text-sm text-amber-800 mb-4">
                <div>
                  <p className="font-semibold text-amber-900 mb-1">Required</p>
                  <p>First Name · Last Name · Email · Phone</p>
                  <p>Date of Birth <span className="text-xs">(age 18–100)</span> · Gender</p>
                  <p>Department · Designation · Joining Date · Employment Type</p>
                  <p>Bank Name · Account Number · IFSC Code</p>
                </div>
                <div>
                  <p className="font-semibold text-amber-900 mb-1">Notes</p>
                  <p>✓ Employee ID is always auto-generated (never re-used)</p>
                  <p>✓ Each email must be unique in the system</p>
                  <p>✓ Both the Export file and Import Template are accepted</p>
                  <p>✓ Total Salary column is ignored (server computes it)</p>
                </div>
              </div>
              <div className="border-t border-amber-200 pt-3">
                <p className="text-xs font-semibold text-amber-900 uppercase tracking-wide mb-2">Export file sections</p>
                <div className="flex flex-wrap gap-1.5">
                  {SECTIONS.map(({ label, color }) => (
                    <span key={label} className="text-xs font-medium px-2 py-0.5 rounded text-white" style={{ backgroundColor: color }}>{label}</span>
                  ))}
                </div>
              </div>
            </div>
          </>)}

          {/* Import result */}
          {importResult && (
            <div className="space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center gap-4">
                  <div className="bg-green-100 rounded-full p-3"><CheckCircle className="w-6 h-6 text-green-600" /></div>
                  <div>
                    <p className="text-2xl font-bold text-green-700">{importResult.successCount}</p>
                    <p className="text-sm text-green-600 font-medium">Successfully Imported</p>
                  </div>
                </div>
                <div className={`border rounded-xl p-4 flex items-center gap-4 ${importResult.errorCount > 0 ? "bg-red-50 border-red-200" : "bg-gray-50 border-gray-200"}`}>
                  <div className={`rounded-full p-3 ${importResult.errorCount > 0 ? "bg-red-100" : "bg-gray-100"}`}>
                    <AlertCircle className={`w-6 h-6 ${importResult.errorCount > 0 ? "text-red-500" : "text-gray-400"}`} />
                  </div>
                  <div>
                    <p className={`text-2xl font-bold ${importResult.errorCount > 0 ? "text-red-600" : "text-gray-400"}`}>{importResult.errorCount}</p>
                    <p className={`text-sm font-medium ${importResult.errorCount > 0 ? "text-red-500" : "text-gray-400"}`}>Failed</p>
                  </div>
                </div>
              </div>

              {importResult.errorCount > 0 && (
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 text-sm text-orange-800 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-orange-500" />
                  <span>Most failures are caused by <strong>duplicate emails</strong> — each employee email must be unique. Check the "Note" column below.</span>
                </div>
              )}

              <div className="border border-gray-200 rounded-xl overflow-hidden">
                <button onClick={() => setShowTable((v) => !v)}
                  className="w-full flex items-center justify-between px-5 py-3 bg-gray-50 hover:bg-gray-100 transition-colors text-sm font-semibold text-gray-700">
                  <span className="flex items-center gap-2"><Table2 className="w-4 h-4 text-gray-500" /> Imported Data ({importResult.importedRows.length} rows)</span>
                  {showTable ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
                {showTable && (
                  <div className="overflow-x-auto max-h-72 overflow-y-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-100 sticky top-0 z-10">
                        <tr>
                          {["#","Status","Name","Email","Phone","Dept","Designation","Joining","Salary","Note"].map((h) => (
                            <th key={h} className="px-4 py-2.5 text-left text-xs font-semibold text-gray-600 whitespace-nowrap">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {importResult.importedRows.map((row, idx) => {
                          const total = (row.basicSalary||0) + (row.hra||0) + (row.otherAllowances||0);
                          return (
                            <tr key={idx} className={row._status === "error" ? "bg-red-50" : "hover:bg-gray-50"}>
                              <td className="px-4 py-2.5 text-gray-400 text-xs">{row._rowNum}</td>
                              <td className="px-4 py-2.5">
                                {row._status === "success"
                                  ? <span className="inline-flex items-center gap-1 text-green-700 text-xs font-medium"><CheckCircle className="w-3.5 h-3.5" /> OK</span>
                                  : <span className="inline-flex items-center gap-1 text-red-600 text-xs font-medium"><AlertCircle className="w-3.5 h-3.5" /> Failed</span>}
                              </td>
                              <td className="px-4 py-2.5 font-medium text-gray-800 whitespace-nowrap">{row.firstName} {row.lastName}</td>
                              <td className="px-4 py-2.5 text-gray-600 text-xs">{row.email}</td>
                              <td className="px-4 py-2.5 text-gray-600 text-xs">{row.phone}</td>
                              <td className="px-4 py-2.5 text-gray-600 text-xs">{row.department}</td>
                              <td className="px-4 py-2.5 text-gray-600 text-xs">{row.designation}</td>
                              <td className="px-4 py-2.5 text-gray-600 text-xs whitespace-nowrap">{row.joiningDate}</td>
                              <td className="px-4 py-2.5 text-gray-600 text-xs">{total > 0 ? `₹${Number(total).toLocaleString("en-IN")}` : "—"}</td>
                              <td className="px-4 py-2.5 text-red-500 text-xs max-w-[180px] truncate" title={row._error || ""}>{row._error || "—"}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              <button onClick={reset} className="text-sm text-blue-600 hover:underline flex items-center gap-1">
                <Upload className="w-4 h-4" /> Import another file
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-8 py-4 bg-gray-50 border-t border-gray-200 flex items-center justify-end gap-3 flex-shrink-0">
          <button onClick={onClose} disabled={importing}
            className="px-6 py-2.5 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300 transition-all disabled:opacity-50">
            {importResult ? "Close" : "Cancel"}
          </button>
          {!importResult && (
            <button onClick={handleImport} disabled={!file || importing}
              className="flex items-center gap-2 px-6 py-2.5 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-all disabled:bg-gray-400 disabled:cursor-not-allowed">
              {importing ? <><Loader className="w-4 h-4 animate-spin" /> Importing…</> : <><Upload className="w-4 h-4" /> Import Employees</>}
            </button>
          )}
          {importResult?.successCount > 0 && (
            <button onClick={downloadEmployeesExcel} disabled={downloadingExport}
              className="flex items-center gap-2 px-6 py-2.5 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 transition-all disabled:opacity-60">
              {downloadingExport ? <Loader className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
              Export All Employees
            </button>
          )}
        </div>

      </div>
    </div>
  );
};

export default ImportExcelModal;