// src/Ui/EmployeeMng/EmployeeManagement.jsx
import React, { useState, useEffect, useCallback } from "react";
import {
  Plus, Link2, Upload, Download, Search, Filter,
  Eye, Edit2, Loader, AlertCircle, Users,
  ClipboardList, Send, CreditCard, FolderOpen, Activity,
} from "lucide-react";

// ── Page-level modals & views ─────────────────────────────────────────────────
import AddEmployeeWizard      from "./AddEmp";
import PublicLinkModal        from "./GenerateLink";
import ImportExcelModal       from "./EmployeeExcel";
import ViewEmployee from "./ViewEmployee";
import EditEmployee           from "./EditEmployee";
import CombinedActivityLog    from "./Combinedactivitylogo";
import EmployeeIDCardModal from "./EmployeeIDCard/index";
import ReviewedDocsSection, { DocsModal } from "./ReviewedDocsSection";

// ── Split components ──────────────────────────────────────────────────────────
import EmployeeAvatar         from "./components/EmployeeAvatar";
import DocsBadgeButton        from "./components/DocsBadgeButton";
import Toast                  from "./components/Toast";
import ConfirmDialog          from "./components/ConfirmDialog";
import StatusReasonModal      from "./components/StatusReasonModal";
import RejoinInviteModal      from "./components/RejoinInviteModal";
import StatusDropdown, { normalizeStatus } from "./components/StatusDropdown";

// ── Services & utilities ──────────────────────────────────────────────────────
import employeeService        from "../../services/employeeService";
import { useNavigate }        from "react-router-dom";
import { BASE_URL }           from "../../api/client";

// ── Full name helper ──────────────────────────────────────────────────────────
const buildFullName = (emp) =>
  [
    emp?.first_name  || emp?.firstName       || "",
    emp?.father_husband_name || emp?.fatherHusbandName || "",
    emp?.last_name   || emp?.lastName        || "",
  ]
    .map((s) => String(s || "").trim())
    .filter(Boolean)
    .join(" ");

// ══════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ══════════════════════════════════════════════════════════════════════════════
const EmployeeManagement = ({ showToast: parentShowToast }) => {
  const navigate = useNavigate();

  // ── State ──────────────────────────────────────────────────────────────────
  const [employees,            setEmployees]            = useState([]);
  const [loading,              setLoading]              = useState(true);
  const [error,                setError]                = useState("");
  const [showModal,            setShowModal]            = useState(false);
  const [modalType,            setModalType]            = useState("");
  const [showImportModal,      setShowImportModal]      = useState(false);
  const [searchTerm,           setSearchTerm]           = useState("");
  const [filterStatus,         setFilterStatus]         = useState("all");
  const [exportLoading,        setExportLoading]        = useState(false);
  const [viewEmployee,         setViewEmployee]         = useState(null);
  const [editEmployee,         setEditEmployee]         = useState(null);
  const [showActivityLog,      setShowActivityLog]      = useState(false);
  const [toasts,               setToasts]               = useState([]);
  const [confirm,              setConfirm]              = useState(null);
  const [pendingCount,         setPendingCount]         = useState(0);
  const [pendingRejoinCount,   setPendingRejoinCount]   = useState(0);
  const [pendingDocsCount,     setPendingDocsCount]     = useState(0);
  const [idCardEmployee,       setIdCardEmployee]       = useState(null);
  const [docsModalEmployee,    setDocsModalEmployee]    = useState(null);
  const [updatingStatusId,     setUpdatingStatusId]     = useState(null);
  const [reasonModal,          setReasonModal]          = useState(null);
  const [rejoinModal,          setRejoinModal]          = useState(null);
  const [isSendingInvite,      setIsSendingInvite]      = useState(false);

  // ── Toast helper ───────────────────────────────────────────────────────────
  const toast = useCallback(
    (message, type = "info") => {
      const id = Date.now() + Math.random();
      setToasts((p) => [...p, { id, message, type }]);
      parentShowToast?.(message, type);
      setTimeout(() => setToasts((p) => p.filter((t) => t.id !== id)), 5000);
    },
    [parentShowToast],
  );

  const removeToast = (id) => setToasts((p) => p.filter((t) => t.id !== id));

  // ── Fetch employees ────────────────────────────────────────────────────────
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

  // ── Fetch badge counts ─────────────────────────────────────────────────────
  const fetchCounts = useCallback(async () => {
    try {
      const r1 = await employeeService.getPendingSubmissions();
      if (r1.success) {
        const all = r1.data || [];
        setPendingCount(all.filter((e) => e.status === "pending").length);
        setPendingRejoinCount(all.filter((e) => e.status === "pending_rejoin").length);
      }
    } catch (_) {}

    try {
      const token = localStorage.getItem("authToken");
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const r2  = await fetch(`${BASE_URL}/employee-docs/pending`, { headers });
      const d2  = await r2.json();
      if (d2.success) setPendingDocsCount((d2.data || []).length);
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
    if (newStatus === normalizeStatus(emp.status)) return;
    if (newStatus === "Active") executeStatusChange(emp, newStatus, "");
    else setReasonModal({ emp, newStatus });
  };

  const executeStatusChange = async (emp, newStatus, reason) => {
    const empId      = emp.id || emp.employee_id;
    const prevStatus = emp.status;
    const token      = localStorage.getItem("authToken");
    const authHeader = token ? { Authorization: `Bearer ${token}` } : {};

    setReasonModal(null);
    setEmployees((prev) =>
      prev.map((e) =>
        e.id === emp.id || e.employee_id === emp.employee_id
          ? { ...e, status: newStatus }
          : e,
      ),
    );
    setUpdatingStatusId(empId);

    try {
      const sr = await fetch(`${BASE_URL}/employees/${empId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...authHeader },
        body: JSON.stringify({ status: newStatus, reason }),
      });
      const sd = await sr.json();
      if (!sd.success) throw new Error(sd.message || "Failed to update status");

      const nr = await fetch(`${BASE_URL}/employees/${empId}/status-notification`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeader },
        body: JSON.stringify({
          status: newStatus,
          email: emp.email,
          firstName: emp.first_name || emp.firstName,
          lastName:  emp.last_name  || emp.lastName,
          reason,
        }),
      });
      const nd = await nr.json();
      toast(
        `Status updated to ${newStatus}${nd.success ? " · Email sent" : " · (email failed)"}`,
        "success",
      );
    } catch (err) {
      setEmployees((prev) =>
        prev.map((e) =>
          e.id === emp.id || e.employee_id === emp.employee_id
            ? { ...e, status: prevStatus }
            : e,
        ),
      );
      toast(err.message || "Failed to update status", "error");
    } finally {
      setUpdatingStatusId(null);
    }
  };

  // ── Rejoin invite ──────────────────────────────────────────────────────────
  const handleSendRejoinInvite = async () => {
    if (!rejoinModal) return;
    const emp        = rejoinModal;
    const empId      = emp.id || emp.employee_id;
    const token      = localStorage.getItem("authToken");
    const authHeader = token ? { Authorization: `Bearer ${token}` } : {};

    setIsSendingInvite(true);
    try {
      const res  = await fetch(`${BASE_URL}/employees/${empId}/send-rejoin-invite`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeader },
      });
      const data = await res.json();
      if (data.success) {
        toast(`✅ Rejoin invitation sent to ${emp.email || "employee"} — link valid for 7 days`, "success");
        setRejoinModal(null);
      } else {
        toast(data.message || "Failed to send invite", "error");
      }
    } catch (err) {
      toast(err.message || "Network error", "error");
    } finally {
      setIsSendingInvite(false);
    }
  };

  // ── Add / edit / export ────────────────────────────────────────────────────
  const handleAddEmployee = async (data) => {
    const response = await employeeService.addEmployee(data);
    if (response.success) {
      toast("Employee added successfully!", "success");
      setShowModal(false);
      fetchEmployees();
    } else {
      throw new Error(response.message || "Failed to add employee");
    }
  };

  const handleEditSave = (updated) => {
    setEmployees((prev) =>
      prev.map((e) =>
        e.id === updated.id || e.employee_id === updated.employee_id
          ? { ...e, ...updated }
          : e,
      ),
    );
  };

  const handleExportData = async () => {
    setExportLoading(true);
    const token      = localStorage.getItem("authToken");
    const authHeader = token ? { Authorization: `Bearer ${token}` } : {};
    try {
      toast("Exporting employee data…", "info");
      const res = await fetch(`${BASE_URL}/employees/export/data`, { headers: authHeader });
      if (!res.ok) throw new Error("Export failed");
      const blob = await res.blob();
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement("a");
      a.href     = url;
      a.download = `employees_export_${new Date().toISOString().slice(0, 10)}.xlsx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast("Employee data exported successfully!", "success");
    } catch (err) {
      toast(err.message || "Failed to export data", "error");
    } finally {
      setExportLoading(false);
    }
  };

  // ── Filter ─────────────────────────────────────────────────────────────────
  const filteredEmployees = employees.filter((emp) => {
    const q   = searchTerm.toLowerCase();
    const ok1 =
      buildFullName(emp).toLowerCase().includes(q) ||
      (emp.employee_id || "").toLowerCase().includes(q) ||
      (emp.email || "").toLowerCase().includes(q);
    const n   = normalizeStatus(emp.status);
    const ok2 =
      filterStatus === "all" ||
      n === filterStatus ||
      (filterStatus === "Pending" && (n === "Pending" || n === "PendingRejoin"));
    return ok1 && ok2;
  });

  const approvalBadgeCount = pendingCount + pendingRejoinCount;
  const docsBadgeCount     = pendingDocsCount;

  // ── Loading state ──────────────────────────────────────────────────────────
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
      {/* ── Global UI overlays ─────────────────────────────────────────────── */}
      <Toast toasts={toasts} removeToast={removeToast} />

      {confirm && <ConfirmDialog {...confirm} />}

      {reasonModal && (
        <StatusReasonModal
          targetStatus={reasonModal.newStatus}
          employeeName={buildFullName(reasonModal.emp)}
          onConfirm={(reason) =>
            executeStatusChange(reasonModal.emp, reasonModal.newStatus, reason)
          }
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

      {idCardEmployee && (
        <EmployeeIDCardModal
          employee={idCardEmployee}
          onClose={() => setIdCardEmployee(null)}
        />
      )}

      {docsModalEmployee && (
        <DocsModal
          emp={docsModalEmployee}
          onClose={() => setDocsModalEmployee(null)}
        />
      )}

      {showActivityLog && (
        <CombinedActivityLog onClose={() => setShowActivityLog(false)} />
      )}

      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <div className="mb-6 flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Employee Management</h1>
          <p className="text-gray-500 mt-1 text-sm">
            Manage your workforce — add, search, and maintain employee records
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          {/* Activity Log */}
          <button
            onClick={() => setShowActivityLog(true)}
            className="flex items-center gap-2.5 px-5 py-2.5 rounded-xl font-semibold text-sm shadow-md hover:shadow-lg active:scale-[0.97] transition-all"
            style={{ background: "linear-gradient(135deg,#6366f1,#4f46e5)", color: "#fff" }}
          >
            <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-white/20">
              <Activity className="w-4 h-4" />
            </span>
            Activity Log
          </button>

          {/* Pending Approvals */}
          <div className="relative flex flex-col items-center gap-1">
            <button
              onClick={() => navigate("/employee/pending")}
              className="relative flex items-center gap-2.5 px-5 py-2.5 rounded-xl font-semibold text-sm shadow-md hover:shadow-lg active:scale-[0.97] transition-all"
              style={{
                background:
                  approvalBadgeCount > 0 || docsBadgeCount > 0
                    ? "linear-gradient(135deg,#4f46e5,#7c3aed)"
                    : "linear-gradient(135deg,#3b82f6,#1d4ed8)",
                color: "#fff",
              }}
            >
              <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-white/20">
                <ClipboardList className="w-4 h-4" />
              </span>
              Pending Approvals
              {(approvalBadgeCount > 0 || docsBadgeCount > 0) && (
                <span className="flex items-center gap-1 ml-0.5">
                  {approvalBadgeCount > 0 && (
                    <span
                      title={`${approvalBadgeCount} pending approval${approvalBadgeCount !== 1 ? "s" : ""}`}
                      className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full text-[10px] font-bold leading-none"
                      style={{ background: "#fbbf24", color: "#1e1b4b" }}
                    >
                      {approvalBadgeCount > 99 ? "99+" : approvalBadgeCount}
                    </span>
                  )}
                  {docsBadgeCount > 0 && (
                    <span
                      title={`${docsBadgeCount} document${docsBadgeCount !== 1 ? "s" : ""} pending review`}
                      className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full text-[10px] font-bold leading-none"
                      style={{ background: "#ef4444", color: "#fff" }}
                    >
                      {docsBadgeCount > 99 ? "99+" : docsBadgeCount}
                    </span>
                  )}
                </span>
              )}
            </button>
            {(approvalBadgeCount > 0 || docsBadgeCount > 0) && (
              <div className="flex items-center gap-2 text-[10px] text-gray-400 font-medium">
                {approvalBadgeCount > 0 && (
                  <span className="flex items-center gap-1">
                    <span className="inline-block w-2 h-2 rounded-full" style={{ background: "#fbbf24" }} />
                    approvals
                  </span>
                )}
                {approvalBadgeCount > 0 && docsBadgeCount > 0 && <span className="text-gray-300">·</span>}
                {docsBadgeCount > 0 && (
                  <span className="flex items-center gap-1">
                    <span className="inline-block w-2 h-2 rounded-full" style={{ background: "#ef4444" }} />
                    docs pending
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Error banner ────────────────────────────────────────────────────── */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
          <p className="text-sm text-red-800">{error}</p>
          <button onClick={fetchEmployees} className="ml-auto text-xs text-red-600 underline">
            Retry
          </button>
        </div>
      )}

      {/* ── Action buttons ───────────────────────────────────────────────────── */}
      <div className="mb-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <button
          onClick={() => { setModalType("add"); setShowModal(true); }}
          className="px-6 py-4 bg-blue-600 text-white border-2 border-blue-600 rounded-lg font-medium flex items-center justify-center gap-2 shadow-sm hover:bg-blue-700 transition"
        >
          <Plus className="w-5 h-5" /> Add Employee Manually
        </button>
        <button
          onClick={() => { setModalType("link"); setShowModal(true); }}
          className="px-6 py-4 bg-white border-2 border-blue-600 text-blue-600 rounded-lg font-medium flex items-center justify-center gap-2 hover:bg-blue-50 transition-all shadow-sm"
        >
          <Link2 className="w-5 h-5" /> Generate Registration Link
        </button>
        <button
          onClick={() => setShowImportModal(true)}
          className="px-6 py-4 bg-white border-2 border-green-600 text-green-600 rounded-lg font-medium flex items-center justify-center gap-2 hover:bg-green-50 transition-all shadow-sm"
        >
          <Upload className="w-5 h-5" /> Import from Excel
        </button>
        <button
          onClick={handleExportData}
          disabled={exportLoading}
          className={`px-6 py-4 border-2 border-purple-600 rounded-lg font-medium flex items-center justify-center gap-2 transition-all shadow-sm ${
            exportLoading
              ? "bg-purple-100 text-purple-400 cursor-not-allowed"
              : "bg-white text-purple-600 hover:bg-purple-50"
          }`}
        >
          <Download className={`w-5 h-5 ${exportLoading ? "animate-bounce" : ""}`} />
          {exportLoading ? "Exporting…" : "Export Excel"}
        </button>
      </div>

      {/* ── Search & Filter ──────────────────────────────────────────────────── */}
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

      {/* ── Employee Table ───────────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        {filteredEmployees.length === 0 ? (
          <div className="p-16 text-center">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Users className="w-10 h-10 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No Employees Found</h3>
            <p className="text-gray-500 mb-5 text-sm">
              {employees.length === 0
                ? "Get started by adding your first employee"
                : "Try adjusting your search or filters"}
            </p>
            {employees.length === 0 && (
              <button
                onClick={() => { setModalType("add"); setShowModal(true); }}
                className="bg-blue-600 px-6 py-3 text-white rounded-lg font-medium inline-flex items-center gap-2 hover:bg-blue-700 transition-all"
              >
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
                    {["Employee", "ID", "Department", "Designation", "Joining Date", "Status", "Docs", "Actions"].map((h) => (
                      <th
                        key={h}
                        className="px-4 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider whitespace-nowrap"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredEmployees.map((emp) => {
                    const firstName   = emp.first_name  || emp.firstName  || "";
                    const lastName    = emp.last_name   || emp.lastName   || "";
                    const fatherName  = emp.father_husband_name || emp.fatherHusbandName || "";
                    const empId       = emp.employee_id || emp.id || "";
                    const designation = emp.designation || emp.position || "";
                    const joiningDate = emp.joining_date || emp.joiningDate || "";
                    const normalized  = normalizeStatus(emp.status);
                    const isInactive  = normalized === "Inactive";
                    const fullName    = [firstName, fatherName, lastName].map((s) => s.trim()).filter(Boolean).join(" ");

                    return (
                      <tr key={emp.id || emp.employee_id} className="hover:bg-gray-50 transition-colors">
                        {/* Employee */}
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <EmployeeAvatar emp={emp} />
                            <div>
                              <p className="font-semibold text-gray-900 text-sm">{fullName}</p>
                              <p className="text-xs text-gray-500">{emp.email}</p>
                            </div>
                          </div>
                        </td>
                        {/* ID */}
                        <td className="px-6 py-4">
                          <span className="font-mono text-sm font-medium text-gray-700">{empId}</span>
                        </td>
                        {/* Department */}
                        <td className="px-6 py-4">
                          <span className="text-sm text-gray-700">{emp.department || "—"}</span>
                        </td>
                        {/* Designation */}
                        <td className="px-6 py-4">
                          <span className="text-sm text-gray-700">{designation || "—"}</span>
                        </td>
                        {/* Joining Date */}
                        <td className="px-6 py-4">
                          <span className="text-sm text-gray-500">
                            {joiningDate
                              ? new Date(joiningDate).toLocaleDateString("en-IN")
                              : "—"}
                          </span>
                        </td>
                        {/* Status */}
                        <td className="px-6 py-4">
                          <StatusDropdown
                            emp={emp}
                            onStatusChange={handleStatusChange}
                            updatingId={updatingStatusId}
                          />
                        </td>
                        {/* Docs */}
                        <td className="px-4 py-4">
                          <DocsBadgeButton
                            emp={emp}
                            onClick={() => setDocsModalEmployee(emp)}
                          />
                        </td>
                        {/* Actions */}
                        <td className="px-4 py-4">
                          <div className="flex flex-col gap-1.5">
                            <div className="flex items-center gap-1.5">
                              {/* View */}
                              <button
                                onClick={() => setViewEmployee(emp)}
                                title="View Employee"
                                className="group relative flex items-center justify-center w-8 h-8 rounded-lg bg-blue-50 hover:bg-blue-100 border border-blue-200 hover:border-blue-400 transition-all"
                              >
                                <Eye className="w-3.5 h-3.5 text-blue-600" />
                                <span className="absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-[10px] px-2 py-0.5 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                                  View
                                </span>
                              </button>
                              {/* Edit */}
                              <button
                                onClick={() => setEditEmployee(emp)}
                                title="Edit Employee"
                                className="group relative flex items-center justify-center w-8 h-8 rounded-lg bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 hover:border-emerald-400 transition-all"
                              >
                                <Edit2 className="w-3.5 h-3.5 text-emerald-600" />
                                <span className="absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-[10px] px-2 py-0.5 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                                  Edit
                                </span>
                              </button>
                              {/* ID Card */}
                              <button
                                onClick={() => setIdCardEmployee(emp)}
                                title="Generate ID Card"
                                className="group relative flex items-center justify-center w-8 h-8 rounded-lg bg-violet-50 hover:bg-violet-100 border border-violet-200 hover:border-violet-400 transition-all"
                              >
                                <CreditCard className="w-3.5 h-3.5 text-violet-600" />
                                <span className="absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-[10px] px-2 py-0.5 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                                  ID Card
                                </span>
                              </button>
                            </div>
                            {/* Rejoin button — only for inactive employees */}
                            {isInactive && (
                              <button
                                onClick={() => setRejoinModal(emp)}
                                title="Invite to Rejoin"
                                className="flex items-center justify-center gap-1 h-6 px-2 rounded-md bg-indigo-600 hover:bg-indigo-700 text-white transition-all active:scale-[0.97]"
                                style={{ width: "calc(3 * 2rem + 2 * 0.375rem)" }}
                              >
                                <Send className="w-2.5 h-2.5 flex-shrink-0" />
                                <span className="text-[10px] font-semibold whitespace-nowrap">
                                  Invite to Rejoin
                                </span>
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

            {/* Table footer */}
            <div className="px-6 py-3 bg-gray-50 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500 flex-wrap gap-2">
              <span>
                Showing {filteredEmployees.length} of {employees.length} employees
              </span>
              <span className="flex items-center gap-3 flex-wrap">
                <span className="flex items-center gap-1.5">
                  <FolderOpen className="w-3 h-3 text-blue-500" />
                  <span className="text-blue-600 font-medium">Docs</span>— view all uploaded &amp; accepted documents
                </span>
                <span className="text-gray-300">|</span>
                <span className="flex items-center gap-1.5">
                  <CreditCard className="w-3 h-3 text-indigo-500" />
                  <span className="text-indigo-600 font-medium">ID Card</span>— generate &amp; print for any employee
                </span>
                <span className="text-gray-300">|</span>
                <span className="flex items-center gap-1.5">
                  <Send className="w-3 h-3 text-indigo-500" />
                  <span className="text-indigo-600 font-medium">"Invite to Rejoin"</span>— for Inactive employees
                </span>
              </span>
            </div>
          </>
        )}
      </div>

      {/* ── Modals ───────────────────────────────────────────────────────────── */}
      {showModal && modalType === "add" && (
        <AddEmployeeWizard onClose={() => setShowModal(false)} onSubmit={handleAddEmployee} />
      )}
      {showModal && modalType === "link" && (
        <PublicLinkModal onClose={() => setShowModal(false)} showToast={toast} />
      )}
      {showImportModal && (
        <ImportExcelModal
          onClose={() => setShowImportModal(false)}
          showToast={toast}
          onImportComplete={() => { fetchEmployees(); setShowImportModal(false); }}
        />
      )}
      {viewEmployee && (
        <ViewEmployee employee={viewEmployee} onClose={() => setViewEmployee(null)} />
      )}
      {editEmployee && (
        <EditEmployee
          employee={editEmployee}
          onClose={() => setEditEmployee(null)}
          onSave={handleEditSave}
          showToast={toast}
        />
      )}
    </div>
  );
};

export default EmployeeManagement;