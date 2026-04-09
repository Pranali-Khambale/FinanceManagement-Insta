// src/Ui/EmployeeMng/EmployeeManagement.jsx
import React, { useState, useEffect, useCallback } from "react";
import {
  Plus, Link2, Upload, Download, Search, Filter,
  Eye, Edit2, Loader, AlertCircle, Users,
  CheckCircle, XCircle, Info, AlertTriangle, ClipboardList,
  UserCheck, Send, Mail, Clock, RefreshCw,
  Activity, CreditCard,
} from "lucide-react";
import AddEmployeeWizard    from "./AddEmp";
import PublicLinkModal      from "./GenerateLink";
import ImportExcelModal     from "./EmployeeExcel";
import ViewEmployee         from "./ViewEmployee";
import EditEmployee         from "./EditEmployee";
import CombinedActivityLog  from "./Combinedactivitylogo";
import EmployeeIDCardModal  from "./EmployeeIDCard";
import employeeService      from "../../services/employeeService";
import { useNavigate }      from "react-router-dom";

const BASE_URL =
  (typeof import.meta !== "undefined" && import.meta.env?.VITE_API_URL) ||
  "http://localhost:5000/api";

// ── Full name helper: First + Father/Husband + Last ───────────────────────────
const buildFullName = (emp) =>
  [
    emp?.first_name          || emp?.firstName          || "",
    emp?.father_husband_name || emp?.fatherHusbandName  || "",
    emp?.last_name           || emp?.lastName           || "",
  ]
    .map((s) => String(s || "").trim())
    .filter(Boolean)
    .join(" ");

// ══════════════════════════════════════════════════════════════════════════════
// TOAST
// ══════════════════════════════════════════════════════════════════════════════
const Toast = ({ toasts, removeToast }) => {
  const icons = {
    success: <CheckCircle   className="w-4 h-4 text-green-500 flex-shrink-0" />,
    error:   <XCircle       className="w-4 h-4 text-red-500   flex-shrink-0" />,
    info:    <Info          className="w-4 h-4 text-blue-500  flex-shrink-0" />,
    warning: <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0" />,
  };
  const colors = {
    success: "border-green-200 bg-green-50  text-green-800",
    error:   "border-red-200   bg-red-50    text-red-800",
    info:    "border-blue-200  bg-blue-50   text-blue-800",
    warning: "border-amber-200 bg-amber-50  text-amber-800",
  };
  return (
    <div className="fixed top-20 right-4 z-[9999] flex flex-col gap-2 pointer-events-none">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-xl border shadow-lg text-sm font-medium min-w-[260px] max-w-[380px] animate-slide-in ${colors[t.type] || colors.info}`}
        >
          {icons[t.type] || icons.info}
          <span className="flex-1">{t.message}</span>
          <button onClick={() => removeToast(t.id)} className="ml-1 opacity-60 hover:opacity-100 transition-opacity text-base leading-none">×</button>
        </div>
      ))}
      <style>{`
        @keyframes slide-in { from { opacity:0; transform:translateX(40px); } to { opacity:1; transform:translateX(0); } }
        .animate-slide-in { animation: slide-in 0.25s ease-out; }
      `}</style>
    </div>
  );
};

// ══════════════════════════════════════════════════════════════════════════════
// CONFIRM DIALOG
// ══════════════════════════════════════════════════════════════════════════════
const ConfirmDialog = ({ message, onConfirm, onCancel }) => (
  <div className="fixed inset-0 z-[9998] backdrop-blur-sm bg-black/40 flex items-center justify-center p-4">
    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
          <AlertTriangle className="w-5 h-5 text-red-600" />
        </div>
        <p className="text-sm font-medium text-gray-800">{message}</p>
      </div>
      <div className="flex gap-3 justify-end">
        <button onClick={onCancel}  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium transition-colors">Cancel</button>
        <button onClick={onConfirm} className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition-colors">Confirm</button>
      </div>
    </div>
  </div>
);

// ══════════════════════════════════════════════════════════════════════════════
// STATUS REASON MODAL
// ══════════════════════════════════════════════════════════════════════════════
const StatusReasonModal = ({ targetStatus, employeeName, onConfirm, onCancel }) => {
  const [reason, setReason] = useState("");
  const isBlacklist = targetStatus === "Blacklist";
  const config = isBlacklist
    ? {
        icon: "🚫", headerBg: "bg-red-600",
        label: "Reason for Blacklisting",
        placeholder: "e.g. Policy violation, misconduct, fraud…",
        btnClass: "bg-red-600 hover:bg-red-700",
        defaultReason: "Account blacklisted due to a policy violation.",
      }
    : {
        icon: "⚠️", headerBg: "bg-amber-500",
        label: "Reason for Deactivation",
        placeholder: "e.g. Resigned, contract ended, on leave…",
        btnClass: "bg-amber-500 hover:bg-amber-600",
        defaultReason: "Account deactivated by HR.",
      };

  return (
    <div className="fixed inset-0 z-[9999] backdrop-blur-sm bg-black/40 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        <div className={`${config.headerBg} px-6 py-4`}>
          <div className="flex items-center gap-3">
            <span className="text-2xl">{config.icon}</span>
            <div>
              <h3 className="text-white font-bold text-base">Mark as {targetStatus}</h3>
              {/* ✅ FIX: employeeName now passed as First+Father/Husband+Last from parent */}
              <p className="text-white/80 text-xs mt-0.5">{employeeName}</p>
            </div>
          </div>
        </div>
        <div className="px-6 py-5">
          <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
            {config.label} <span className="text-gray-400 font-normal normal-case">(optional)</span>
          </label>
          <textarea
            value={reason} onChange={(e) => setReason(e.target.value)} rows={3}
            placeholder={config.placeholder}
            className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none resize-none text-sm text-gray-700 transition-all"
          />
          <p className="text-xs text-gray-400 mt-2">
            This reason will be included in the notification email sent to the employee.
          </p>
        </div>
        <div className="px-6 pb-5 flex gap-3 justify-end">
          <button onClick={onCancel} className="px-5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-sm font-medium transition-colors">Cancel</button>
          <button onClick={() => onConfirm(reason.trim() || config.defaultReason)}
            className={`px-5 py-2.5 ${config.btnClass} text-white rounded-xl text-sm font-semibold transition-colors`}>
            Confirm &amp; Send Email
          </button>
        </div>
      </div>
    </div>
  );
};

// ══════════════════════════════════════════════════════════════════════════════
// REJOIN INVITE MODAL
// ══════════════════════════════════════════════════════════════════════════════
const RejoinInviteModal = ({ employee, onConfirm, onCancel, isSending }) => {
  const firstName  = employee.first_name  || employee.firstName  || "";
  const lastName   = employee.last_name   || employee.lastName   || "";
  const fatherName = employee.father_husband_name || employee.fatherHusbandName || "";

  // ✅ FIX: Full name = First + Father/Husband + Last
  const name  = [firstName, fatherName, lastName].map(s => s.trim()).filter(Boolean).join(" ");
  const email = employee.email || "—";
  const empId = employee.employee_id || employee.id || "—";
  const dept  = employee.department || "—";

  return (
    <div className="fixed inset-0 z-[9999] backdrop-blur-sm bg-black/40 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
        <div className="bg-gradient-to-r from-indigo-600 to-violet-600 px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
              <UserCheck className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-white font-bold text-base">Send Rejoin Invitation</h3>
              <p className="text-indigo-200 text-xs mt-0.5">A pre-filled registration link will be emailed to this employee</p>
            </div>
          </div>
        </div>

        <div className="px-6 py-5">
          <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4 mb-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-indigo-200 flex items-center justify-center text-indigo-700 font-bold text-sm flex-shrink-0">
                {firstName[0] || "?"}{lastName[0] || ""}
              </div>
              <div>
                {/* ✅ FIX: Shows First+Father/Husband+Last */}
                <p className="font-bold text-indigo-900 text-sm">{name || "—"}</p>
                <p className="text-xs text-indigo-600">{empId}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {[["Email", email], ["Department", dept], ["Status", "Inactive"]].map(([label, val]) => (
                <div key={label} className="bg-white rounded-lg px-3 py-2 border border-indigo-100">
                  <p className="text-[10px] text-indigo-400 font-semibold uppercase tracking-wide mb-0.5">{label}</p>
                  <p className="text-xs font-bold text-indigo-900 truncate">{val}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-4">
            <p className="text-xs font-bold text-blue-800 uppercase tracking-wide mb-2 flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5" /> What happens when you confirm
            </p>
            <ul className="space-y-1.5">
              {[
                "A unique 7-day registration link is generated",
                `An invitation email is sent to ${email}`,
                "The form is auto-filled with their current database information",
                "Employee can edit any field before submitting",
                "On submission, status changes to 'Pending Rejoin' for HR review",
              ].map((step, i) => (
                <li key={i} className="flex items-start gap-2 text-xs text-blue-700">
                  <span className="w-4 h-4 rounded-full bg-blue-200 text-blue-700 font-bold text-[10px] flex items-center justify-center flex-shrink-0 mt-0.5">{i + 1}</span>
                  {step}
                </li>
              ))}
            </ul>
          </div>

          <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
            <Clock className="w-4 h-4 text-amber-500 flex-shrink-0" />
            <p className="text-xs text-amber-700">
              The invitation link expires in <strong>7 days</strong> and can only be used once.
              You can resend a new link after it expires.
            </p>
          </div>
        </div>

        <div className="px-6 pb-5 flex gap-3 justify-end border-t border-gray-100 pt-4">
          <button onClick={onCancel} disabled={isSending}
            className="px-5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-sm font-medium transition-colors disabled:opacity-50">
            Cancel
          </button>
          <button onClick={onConfirm} disabled={isSending}
            className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold transition-colors disabled:opacity-60 shadow-sm">
            {isSending
              ? <><Loader className="w-4 h-4 animate-spin" /> Sending…</>
              : <><Send className="w-4 h-4" /> Send Invitation Email</>
            }
          </button>
        </div>
      </div>
    </div>
  );
};

// ══════════════════════════════════════════════════════════════════════════════
// STATUS BADGE & DROPDOWN
// ══════════════════════════════════════════════════════════════════════════════
const statusStyles = {
  Active:        "bg-green-50  text-green-700  border-green-300",
  Inactive:      "bg-red-50    text-red-700    border-red-300",
  Blacklist:     "bg-amber-50  text-amber-700  border-amber-300",
  Pending:       "bg-gray-100  text-gray-600   border-gray-300",
  PendingRejoin: "bg-indigo-50 text-indigo-700 border-indigo-300",
};

const StatusDropdown = ({ emp, onStatusChange, updatingId }) => {
  const currentStatus = normalizeStatus(emp.status);
  const isUpdating    = updatingId === (emp.id || emp.employee_id);
  const isPending     = currentStatus === "Pending" || currentStatus === "PendingRejoin";

  if (isPending) {
    return (
      <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border ${
        currentStatus === "PendingRejoin" ? statusStyles.PendingRejoin : statusStyles.Pending
      }`}>
        {currentStatus === "PendingRejoin"
          ? <><RefreshCw className="w-3 h-3" /> Pending Rejoin</>
          : <><Clock className="w-3 h-3" /> Pending Review</>
        }
      </span>
    );
  }

  return (
    <div className="relative inline-flex items-center gap-1.5">
      <select
        value={currentStatus}
        disabled={isUpdating}
        onChange={(e) => onStatusChange(emp, e.target.value)}
        className={`appearance-none text-xs font-semibold px-3 py-1.5 pr-7 rounded-lg border cursor-pointer outline-none transition-all duration-150 disabled:opacity-60 disabled:cursor-not-allowed ${statusStyles[currentStatus] || statusStyles.Pending}`}
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6' viewBox='0 0 10 6'%3E%3Cpath d='M1 1l4 4 4-4' stroke='%23888' stroke-width='1.5' fill='none' stroke-linecap='round'/%3E%3C/svg%3E")`,
          backgroundRepeat: "no-repeat",
          backgroundPosition: "right 8px center",
        }}
      >
        <option value="Active">Active</option>
        <option value="Inactive">Inactive</option>
        <option value="Blacklist">Blacklist</option>
      </select>
      {isUpdating && (
        <Loader className="w-3.5 h-3.5 text-blue-500 animate-spin absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none" />
      )}
    </div>
  );
};

// ══════════════════════════════════════════════════════════════════════════════
// HELPERS
// ══════════════════════════════════════════════════════════════════════════════
function normalizeStatus(status) {
  const s = status?.toLowerCase();
  if (s === "active" || s === "approved")       return "Active";
  if (s === "pending")                           return "Pending";
  if (s === "pending_rejoin")                    return "PendingRejoin";
  if (s === "inactive" || s === "rejected")      return "Inactive";
  if (s === "blacklist" || s === "blacklisted")  return "Blacklist";
  return status || "Unknown";
}

// ══════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ══════════════════════════════════════════════════════════════════════════════
const EmployeeManagement = ({ showToast: parentShowToast }) => {
  const navigate = useNavigate();

  const [employees,          setEmployees]          = useState([]);
  const [loading,            setLoading]            = useState(true);
  const [error,              setError]              = useState("");
  const [showModal,          setShowModal]          = useState(false);
  const [modalType,          setModalType]          = useState("");
  const [showImportModal,    setShowImportModal]    = useState(false);
  const [searchTerm,         setSearchTerm]         = useState("");
  const [filterStatus,       setFilterStatus]       = useState("all");
  const [exportLoading,      setExportLoading]      = useState(false);
  const [viewEmployee,       setViewEmployee]       = useState(null);
  const [editEmployee,       setEditEmployee]       = useState(null);
  const [showActivityLog,    setShowActivityLog]    = useState(false);
  const [toasts,             setToasts]             = useState([]);
  const [confirm,            setConfirm]            = useState(null);
  const [pendingCount,       setPendingCount]       = useState(0);
  const [pendingRejoinCount, setPendingRejoinCount] = useState(0);

  // ── ID Card state ──────────────────────────────────────────────────────────
  const [idCardEmployee,   setIdCardEmployee]   = useState(null);

  const [updatingStatusId, setUpdatingStatusId] = useState(null);
  const [reasonModal,      setReasonModal]      = useState(null);
  const [rejoinModal,      setRejoinModal]      = useState(null);
  const [isSendingInvite,  setIsSendingInvite]  = useState(false);

  // ── Toast helper ──────────────────────────────────────────────────────────
  const toast = useCallback((message, type = "info") => {
    const id = Date.now() + Math.random();
    setToasts((p) => [...p, { id, message, type }]);
    parentShowToast?.(message, type);
    setTimeout(() => setToasts((p) => p.filter((t) => t.id !== id)), 5000);
  }, [parentShowToast]);

  const removeToast = (id) => setToasts((p) => p.filter((t) => t.id !== id));

  const confirmAction = (message) =>
    new Promise((resolve) => {
      setConfirm({
        message,
        onConfirm: () => { setConfirm(null); resolve(true);  },
        onCancel:  () => { setConfirm(null); resolve(false); },
      });
    });

  // ── Data fetching ──────────────────────────────────────────────────────────
  const fetchEmployees = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const response = await employeeService.getAllEmployees();
      if (response.success) setEmployees(response.data || []);
      else setError(response.message || "Failed to load employees");
    } catch (err) {
      setError(err.message || "Failed to load employees");
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchCounts = useCallback(async () => {
    try {
      const r1 = await employeeService.getPendingSubmissions();
      if (r1.success) setPendingCount((r1.data || []).filter(e => e.status === 'pending').length);

      const r2 = await fetch(`${BASE_URL}/employees/pending-rejoin-count`);
      const d2 = await r2.json();
      if (d2.success) setPendingRejoinCount(d2.count || 0);
    } catch (_) {}
  }, []);

  useEffect(() => {
    fetchEmployees();
    fetchCounts();
    const interval = setInterval(fetchCounts, 30000);
    return () => clearInterval(interval);
  }, [fetchEmployees, fetchCounts]);

  // ── Status change ──────────────────────────────────────────────────────────
  const handleStatusChange = (emp, newStatus) => {
    const currentStatus = normalizeStatus(emp.status);
    if (newStatus === currentStatus) return;
    if (newStatus === "Active") {
      executeStatusChange(emp, newStatus, "");
    } else {
      setReasonModal({ emp, newStatus });
    }
  };

  const executeStatusChange = async (emp, newStatus, reason) => {
    const empId      = emp.id || emp.employee_id;
    const prevStatus = emp.status;
    setReasonModal(null);

    setEmployees((prev) =>
      prev.map((e) => (e.id === emp.id || e.employee_id === emp.employee_id) ? { ...e, status: newStatus } : e)
    );
    setUpdatingStatusId(empId);

    try {
      const statusRes  = await fetch(`${BASE_URL}/employees/${empId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus, reason }),
      });
      const statusData = await statusRes.json();
      if (!statusData.success) throw new Error(statusData.message || "Failed to update status");

      const notifRes  = await fetch(`${BASE_URL}/employees/${empId}/status-notification`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: newStatus, email: emp.email,
          firstName: emp.first_name || emp.firstName,
          lastName:  emp.last_name  || emp.lastName,
          reason,
        }),
      });
      const notifData = await notifRes.json();
      const emailNote = notifData.success ? " · Email sent" : " · (email failed)";
      toast(`Status updated to ${newStatus}${emailNote}`, "success");
    } catch (err) {
      setEmployees((prev) =>
        prev.map((e) => (e.id === emp.id || e.employee_id === emp.employee_id) ? { ...e, status: prevStatus } : e)
      );
      toast(err.message || "Failed to update status", "error");
    } finally {
      setUpdatingStatusId(null);
    }
  };

  // ── Send Rejoin Invite ────────────────────────────────────────────────────
  const handleSendRejoinInvite = async () => {
    if (!rejoinModal) return;
    const emp   = rejoinModal;
    const empId = emp.id || emp.employee_id;

    setIsSendingInvite(true);
    try {
      const res  = await fetch(`${BASE_URL}/employees/${empId}/send-rejoin-invite`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      const data = await res.json();

      if (data.success) {
        toast(`✅ Rejoin invitation sent to ${emp.email || "employee"} — link valid for 7 days`, "success");
        setRejoinModal(null);
      } else {
        toast(data.message || "Failed to send invite", "error");
      }
    } catch (err) {
      toast(err.message || "Network error — please try again", "error");
    } finally {
      setIsSendingInvite(false);
    }
  };

  // ── Other handlers ────────────────────────────────────────────────────────
  const generateEmployeeId = () => {
    if (employees.length === 0) return "EMP001";
    const ids   = employees.map((emp) => parseInt((emp.employee_id || emp.id || "").toString().replace(/\D/g, "")) || 0);
    const maxId = Math.max(...ids, 0);
    return `EMP${String(maxId + 1).padStart(3, "0")}`;
  };

  const handleAddEmployee = async (employeeData) => {
    const response = await employeeService.addEmployee(employeeData);
    if (response.success) {
      toast("Employee added successfully!", "success");
      setShowModal(false);
      fetchEmployees();
    } else {
      throw new Error(response.message || "Failed to add employee");
    }
  };

  const handleEditSave = (updatedEmployee) => {
    setEmployees((prev) =>
      prev.map((e) =>
        e.id === updatedEmployee.id || e.employee_id === updatedEmployee.employee_id
          ? { ...e, ...updatedEmployee } : e
      )
    );
  };

  const handleExportData = async () => {
    setExportLoading(true);
    try {
      toast("Exporting employee data…", "info");
      const res  = await fetch(`${BASE_URL}/employees/export/data`);
      if (!res.ok) throw new Error("Export failed. Please try again.");
      const blob = await res.blob();
      const url  = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href     = url;
      link.download = `employees_export_${new Date().toISOString().slice(0, 10)}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast("Employee data exported successfully!", "success");
    } catch (err) {
      toast(err.message || "Failed to export data", "error");
    } finally {
      setExportLoading(false);
    }
  };

  // ── Filter ────────────────────────────────────────────────────────────────
  const filteredEmployees = employees.filter((emp) => {
    const q          = searchTerm.toLowerCase();
    const fullName   = buildFullName(emp).toLowerCase();
    const matchSearch =
      fullName.includes(q) ||
      (emp.employee_id || "").toLowerCase().includes(q) ||
      (emp.email || "").toLowerCase().includes(q);
    const normalized  = normalizeStatus(emp.status);
    const matchFilter = filterStatus === "all" || normalized === filterStatus ||
      (filterStatus === "Pending" && (normalized === "Pending" || normalized === "PendingRejoin"));
    return matchSearch && matchFilter;
  });

  const totalPendingCount = pendingCount + pendingRejoinCount;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader className="w-10 h-10 text-blue-600 animate-spin" />
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════════════════════
  // RENDER
  // ══════════════════════════════════════════════════════════════════════════
  return (
    <div className="p-8">
      <Toast toasts={toasts} removeToast={removeToast} />
      {confirm && <ConfirmDialog message={confirm.message} onConfirm={confirm.onConfirm} onCancel={confirm.onCancel} />}
      {reasonModal && (
        <StatusReasonModal
          targetStatus={reasonModal.newStatus}
          // ✅ FIX: employeeName = First + Father/Husband + Last
          employeeName={buildFullName(reasonModal.emp)}
          onConfirm={(reason) => executeStatusChange(reasonModal.emp, reasonModal.newStatus, reason)}
          onCancel={() => setReasonModal(null)}
        />
      )}
      {rejoinModal && (
        <RejoinInviteModal
          employee={rejoinModal}
          onConfirm={handleSendRejoinInvite}
          onCancel={() => !isSendingInvite && setRejoinModal(null)}
          isSending={isSendingInvite}
        />
      )}

      {/* ── ID Card Modal ── */}
      {idCardEmployee && (
        <EmployeeIDCardModal
          employee={idCardEmployee}
          onClose={() => setIdCardEmployee(null)}
        />
      )}

      {/* ── Combined Activity Log Modal ── */}
      {showActivityLog && (
        <CombinedActivityLog onClose={() => setShowActivityLog(false)} />
      )}

      {/* ── Header ── */}
      <div className="mb-6 flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Employee Management</h1>
          <p className="text-gray-500 mt-1 text-sm">
            Manage your workforce — add, search, and maintain employee records
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <button
            onClick={() => setShowActivityLog(true)}
            className="relative flex items-center gap-2.5 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200 shadow-md hover:shadow-lg active:scale-[0.97]"
            style={{ background: "linear-gradient(135deg, #6366f1, #4f46e5)", color: "#fff" }}
          >
            <span className="relative flex items-center justify-center w-7 h-7 rounded-lg bg-white/20">
              <Activity className="w-4 h-4" />
            </span>
            <span>Activity Log</span>
          </button>

          <button
            onClick={() => navigate("/employee/pending")}
            className="relative flex items-center gap-2.5 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200 shadow-md hover:shadow-lg active:scale-[0.97]"
            style={{
              background: totalPendingCount > 0
                ? "linear-gradient(135deg, #f59e0b, #d97706)"
                : "linear-gradient(135deg, #3b82f6, #1d4ed8)",
              color: "#fff",
            }}
          >
            <span className="relative flex items-center justify-center w-7 h-7 rounded-lg bg-white/20">
              <ClipboardList className="w-4 h-4" />
            </span>
            <span>Pending Approvals</span>
            {totalPendingCount > 0 && (
              <span className="flex items-center justify-center min-w-[22px] h-[22px] px-1.5 rounded-full text-[11px] font-bold"
                style={{ background: "#fff", color: "#d97706" }}>
                {totalPendingCount > 99 ? "99+" : totalPendingCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* ── Error Banner ── */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
          <p className="text-sm text-red-800">{error}</p>
          <button onClick={fetchEmployees} className="ml-auto text-xs text-red-600 underline">Retry</button>
        </div>
      )}

      {/* ── Action Buttons ── */}
      <div className="mb-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <button onClick={() => { setModalType("add"); setShowModal(true); }}
          className="px-6 py-4 bg-blue-600 text-white border-2 border-blue-600 rounded-lg font-medium flex items-center justify-center gap-2 shadow-sm hover:bg-blue-700 transition">
          <Plus className="w-5 h-5" /> Add Employee Manually
        </button>
        <button onClick={() => { setModalType("link"); setShowModal(true); }}
          className="px-6 py-4 bg-white border-2 border-blue-600 text-blue-600 rounded-lg font-medium flex items-center justify-center gap-2 hover:bg-blue-50 transition-all shadow-sm">
          <Link2 className="w-5 h-5" /> Generate Public Link
        </button>
        <button onClick={() => setShowImportModal(true)}
          className="px-6 py-4 bg-white border-2 border-green-600 text-green-600 rounded-lg font-medium flex items-center justify-center gap-2 hover:bg-green-50 transition-all shadow-sm">
          <Upload className="w-5 h-5" /> Import from Excel
        </button>
        <button onClick={handleExportData} disabled={exportLoading}
          className={`px-6 py-4 border-2 border-purple-600 rounded-lg font-medium flex items-center justify-center gap-2 transition-all shadow-sm ${
            exportLoading ? "bg-purple-100 text-purple-400 cursor-not-allowed" : "bg-white text-purple-600 hover:bg-purple-50"
          }`}>
          <Download className={`w-5 h-5 ${exportLoading ? "animate-bounce" : ""}`} />
          {exportLoading ? "Exporting…" : "Export Excel"}
        </button>
      </div>

      {/* ── Search & Filter ── */}
      <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm mb-6">
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[260px] relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name, ID, or email…"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all text-sm"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-500" />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-3 rounded-lg border border-gray-300 focus:border-blue-500 outline-none bg-white text-sm"
            >
              <option value="all">All Status</option>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
              <option value="Blacklist">Blacklist</option>
              <option value="Pending">Pending / Pending Rejoin</option>
            </select>
          </div>
        </div>
      </div>

      {/* ── Table ── */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        {filteredEmployees.length === 0 ? (
          <div className="p-16 text-center">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Users className="w-10 h-10 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No Employees Found</h3>
            <p className="text-gray-500 mb-5 text-sm">
              {employees.length === 0 ? "Get started by adding your first employee" : "Try adjusting your search or filters"}
            </p>
            {employees.length === 0 && (
              <button onClick={() => { setModalType("add"); setShowModal(true); }}
                className="bg-blue-600 px-6 py-3 text-white rounded-lg font-medium inline-flex items-center gap-2 hover:bg-blue-700 transition-all">
                <Plus className="w-5 h-5" /> Add First Employee
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                   {["Employee", "ID", "Department", "Designation", "Joining Date", "Status", "Actions"].map((h) => (
  <th key={h} className="px-4 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">{h}</th>
))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredEmployees.map((emp) => {
                    const firstName   = emp.first_name   || emp.firstName   || "";
                    const lastName    = emp.last_name    || emp.lastName    || "";
                    const fatherName  = emp.father_husband_name || emp.fatherHusbandName || "";
                    const empId       = emp.employee_id  || emp.id          || "";
                    const department  = emp.department   || "";
                    const designation = emp.designation  || emp.position    || "";
                    const joiningDate = emp.joining_date || emp.joiningDate || "";
                    const normalized  = normalizeStatus(emp.status);
                    const isInactive  = normalized === "Inactive";

                    // ✅ FIX: Full name = First + Father/Husband + Last
                    const fullName = [firstName, fatherName, lastName]
                      .map(s => s.trim()).filter(Boolean).join(" ");

                    return (
                      <tr key={emp.id || emp.employee_id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-sm flex-shrink-0">
                              {firstName[0] || "N"}{lastName[0] || "A"}
                            </div>
                            <div>
                              {/* ✅ FIX: Shows First + Father/Husband + Last */}
                              <p className="font-semibold text-gray-900 text-sm">{fullName}</p>
                              <p className="text-xs text-gray-500">{emp.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="font-mono text-sm font-medium text-gray-700">{empId}</span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-sm text-gray-700">{department || "—"}</span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-sm text-gray-700">{designation || "—"}</span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-sm text-gray-500">
                            {joiningDate ? new Date(joiningDate).toLocaleDateString("en-IN") : "—"}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <StatusDropdown emp={emp} onStatusChange={handleStatusChange} updatingId={updatingStatusId} />
                        </td>
<td className="px-4 py-4">
  <div className="flex flex-col gap-1.5">
    {/* Row 1: 3 icon buttons */}
    <div className="flex items-center gap-1.5">
      {/* View */}
      <button
        onClick={() => setViewEmployee(emp)}
        title="View Employee"
        className="group relative flex items-center justify-center w-8 h-8 rounded-lg bg-blue-50 hover:bg-blue-100 border border-blue-200 hover:border-blue-400 transition-all duration-150"
      >
        <Eye className="w-3.5 h-3.5 text-blue-600" />
        <span className="absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-[10px] font-medium px-2 py-0.5 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">View</span>
      </button>

      {/* Edit */}
      <button
        onClick={() => setEditEmployee(emp)}
        title="Edit Employee"
        className="group relative flex items-center justify-center w-8 h-8 rounded-lg bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 hover:border-emerald-400 transition-all duration-150"
      >
        <Edit2 className="w-3.5 h-3.5 text-emerald-600" />
        <span className="absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-[10px] font-medium px-2 py-0.5 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">Edit</span>
      </button>

      {/* ID Card */}
      <button
        onClick={() => setIdCardEmployee(emp)}
        title="Generate ID Card"
        className="group relative flex items-center justify-center w-8 h-8 rounded-lg bg-violet-50 hover:bg-violet-100 border border-violet-200 hover:border-violet-400 transition-all duration-150"
      >
        <CreditCard className="w-3.5 h-3.5 text-violet-600" />
        <span className="absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-[10px] font-medium px-2 py-0.5 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">ID Card</span>
      </button>
    </div>

    {/* Row 2: Invite to Rejoin — snug fit under 3 buttons */}
    {isInactive && (
      <button
        onClick={() => setRejoinModal(emp)}
        title="Invite to Rejoin"
        className="flex items-center justify-center gap-1 h-6 px-2 rounded-md bg-indigo-600 hover:bg-indigo-700 text-white transition-all duration-150 active:scale-[0.97]"
        style={{ width: "calc(3 * 2rem + 2 * 0.375rem)" }}
      >
        <Send className="w-2.5 h-2.5 flex-shrink-0" />
        <span className="text-[10px] font-semibold whitespace-nowrap">Invite to Rejoin</span>
      </button>
    )}
  </div>
</td>            
</tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="px-6 py-3 bg-gray-50 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500 flex-wrap gap-2">
              <span>Showing {filteredEmployees.length} of {employees.length} employees</span>
              <span className="flex items-center gap-3">
                <span className="flex items-center gap-1.5">
                  <CreditCard className="w-3 h-3 text-indigo-500" />
                  <span className="text-indigo-600 font-medium">ID Card</span>
                  — generate &amp; print for any employee
                </span>
                <span className="text-gray-300">|</span>
                <span className="flex items-center gap-1.5">
                  <Send className="w-3 h-3 text-indigo-500" />
                  <span className="text-indigo-600 font-medium">"Invite to Rejoin"</span>
                  — for Inactive employees
                </span>
              </span>
            </div>
          </>
        )}
      </div>

      {/* ── Modals ── */}
      {showModal && modalType === "add" && (
        <AddEmployeeWizard onClose={() => setShowModal(false)} onSubmit={handleAddEmployee} generateEmployeeId={generateEmployeeId} />
      )}
      {showModal && modalType === "link" && (
        <PublicLinkModal onClose={() => setShowModal(false)} showToast={toast} />
      )}
      {showImportModal && (
        <ImportExcelModal onClose={() => setShowImportModal(false)} showToast={toast}
          onImportComplete={() => { fetchEmployees(); setShowImportModal(false); }} />
      )}
      {viewEmployee && (
        <ViewEmployee employee={viewEmployee} onClose={() => setViewEmployee(null)} />
      )}
      {editEmployee && (
        <EditEmployee employee={editEmployee} onClose={() => setEditEmployee(null)} onSave={handleEditSave} showToast={toast} />
      )}
    </div>
  );
};

export default EmployeeManagement;