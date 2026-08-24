import React, { useState, useEffect, useCallback } from "react";
import {
  Loader,
  AlertCircle,
  RefreshCw,
  Users,
  CheckCircle,
} from "lucide-react";
import { BASE_URL as BASE_API } from "../../../api/client";
import employeeService from "../../../services/employeeService";
import { formatDateShort } from "../../../utils/dateUtils";
import EmployeeCard from "./components/EmployeeCard";
import DocumentsPendingReviewSection from "./components/DocumentsPendingReviewSection";
import RejectModal from "./components/RejectModal";

const PendingApprovals = ({ showToast, onEmployeeApproved }) => {
  const [pendingList, setPendingList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionLoading, setActionLoading] = useState({});
  const [rejectTarget, setRejectTarget] = useState(null);
  const [docPendingCount, setDocPendingCount] = useState(0);

  const fetchPending = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const res = await employeeService.getPendingSubmissions();
      const list = (res.data || []).filter(
        (e) => e.status === "pending" || e.status === "pending_rejoin",
      );
      setPendingList(list);
    } catch (err) {
      setError(
        err.message?.includes("connect") || err.message?.includes("fetch")
          ? "Cannot connect to server. Please ensure the backend is running."
          : err.message || "Failed to load pending submissions",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPending();
  }, [fetchPending]);

  const handleApprove = async (employee) => {
    setActionLoading((p) => ({ ...p, [`approve_${employee.id}`]: true }));
    try {
      const res = await employeeService.approveSubmission(employee.id);
      if (res.success) {
        const empId =
          res.data?.employee_id || res.data?.employeeId || res.employeeId || "";
        showToast?.(
          `✅ Approved: ${employee.first_name} ${employee.last_name} — ID: ${empId}`,
          "success",
        );
        setPendingList((p) => p.filter((e) => e.id !== employee.id));
        onEmployeeApproved?.();
      }
    } catch (err) {
      showToast?.(err.message || "Failed to approve", "error");
    } finally {
      setActionLoading((p) => ({ ...p, [`approve_${employee.id}`]: false }));
    }
  };

  const handleRejectConfirm = async (reason) => {
    if (!rejectTarget) return;
    const { id, status } = rejectTarget;
    const isRejoin = status === "pending_rejoin";
    setActionLoading((p) => ({ ...p, [`reject_${id}`]: true }));
    try {
      if (isRejoin) {
        const res = await fetch(
          `${BASE_API}/registrations/${id}/reject-rejoin`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ rejection_reason: reason }),
          },
        );
        const data = await res.json();
        if (!data.success) throw new Error(data.message || "Failed to decline");
      } else {
        await employeeService.rejectSubmission(id, reason);
      }
      showToast?.(
        isRejoin
          ? `↩️ Rejoin declined: ${rejectTarget.first_name} ${rejectTarget.last_name}`
          : `❌ Rejected: ${rejectTarget.first_name} ${rejectTarget.last_name}`,
        "success",
      );
      setPendingList((p) => p.filter((e) => e.id !== id));
      setRejectTarget(null);
    } catch (err) {
      showToast?.(err.message || "Failed to process", "error");
    } finally {
      setActionLoading((p) => ({ ...p, [`reject_${id}`]: false }));
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center py-20">
        <div
          className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center mb-4"
          style={{ background: "linear-gradient(135deg,#1d4ed8,#3b82f6)" }}
        >
          <Loader className="w-7 h-7 sm:w-8 sm:h-8 text-white animate-spin" />
        </div>
        <p className="text-gray-600 font-medium text-sm sm:text-base">
          Loading pending requests…
        </p>
      </div>
    );
  }

  const newCount = pendingList.filter((e) => e.status === "pending").length;
  const rejoinCount = pendingList.filter(
    (e) => e.status === "pending_rejoin",
  ).length;
  const totalPending = pendingList.length + docPendingCount;

  return (
    <div className="min-h-screen bg-gray-50 p-3 sm:p-6 md:p-8">
      {rejectTarget && (
        <RejectModal
          employee={rejectTarget}
          onConfirm={handleRejectConfirm}
          onCancel={() => setRejectTarget(null)}
          loading={!!actionLoading[`reject_${rejectTarget?.id}`]}
        />
      )}

      {/* Page header */}
      <div className="mb-5 sm:mb-7">
        <div className="flex items-start justify-between flex-wrap gap-3 sm:gap-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2 sm:gap-3 mb-1">
              <div
                className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{
                  background: "linear-gradient(135deg,#1e3a5f,#1d4ed8)",
                }}
              >
                <Users className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              </div>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
                Pending Approvals
              </h1>
            </div>
            <p className="text-gray-500 text-xs sm:text-sm pl-11 sm:pl-13">
              {pendingList.length > 0 || docPendingCount > 0 ? (
                <>
                  {pendingList.length > 0 && (
                    <>
                      <strong className="text-blue-700">
                        {pendingList.length}
                      </strong>{" "}
                      registration{" "}
                      {pendingList.length === 1 ? "request" : "requests"}{" "}
                      awaiting review
                    </>
                  )}
                  {pendingList.length > 0 && docPendingCount > 0 && (
                    <span className="mx-1">·</span>
                  )}
                  {docPendingCount > 0 && (
                    <>
                      <strong className="text-amber-600">
                        {docPendingCount}
                      </strong>{" "}
                      {docPendingCount === 1 ? "employee" : "employees"} with
                      docs pending
                    </>
                  )}
                  {rejoinCount > 0 && (
                    <span className="ml-2 text-indigo-600 font-medium">
                      ({rejoinCount} rejoin{rejoinCount > 1 ? "s" : ""})
                    </span>
                  )}
                </>
              ) : (
                "No pending requests at the moment"
              )}
            </p>
          </div>
          <button
            onClick={fetchPending}
            className="flex items-center gap-2 px-3 sm:px-3.5 py-2 bg-white border border-gray-200 rounded-xl text-xs font-semibold text-gray-600 hover:border-blue-300 hover:text-blue-700 hover:bg-blue-50 shadow-sm flex-shrink-0"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Refresh</span>
          </button>
        </div>

        {/* Stats bar */}
        {(pendingList.length > 0 || docPendingCount > 0) && (
          <div className="mt-4 sm:mt-5 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 sm:gap-3">
            {[
              {
                label: "Total Pending",
                value: totalPending,
                color: "#1d4ed8",
                bg: "#eff6ff",
              },
              {
                label: "New Applications",
                value: newCount,
                color: "#059669",
                bg: "#f0fdf4",
              },
              {
                label: "Rejoin Requests",
                value: rejoinCount,
                color: "#7c3aed",
                bg: "#f5f3ff",
              },
              {
                label: "Docs Pending",
                value: docPendingCount,
                color: "#d97706",
                bg: "#fffbeb",
              },
              {
                label: "Latest Request",
                value: formatDateShort(pendingList[0]?.created_at),
                color: "#64748b",
                bg: "#f8fafc",
              },
            ].map((stat, i) => (
              <div
                key={i}
                className="rounded-xl border px-3 sm:px-4 py-2.5 sm:py-3 shadow-sm"
                style={{
                  background: stat.bg,
                  borderColor:
                    stat.bg === "#f8fafc" ? "#e2e8f0" : "transparent",
                }}
              >
                <p className="text-[9px] sm:text-[10px] font-semibold text-gray-500 uppercase tracking-wide mb-1">
                  {stat.label}
                </p>
                <p
                  className="text-base sm:text-lg font-bold"
                  style={{ color: stat.color }}
                >
                  {stat.value ?? "—"}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Error banner */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-5 sm:mb-6 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
          <p className="text-sm font-medium text-red-700 flex-1">{error}</p>
          <button
            onClick={fetchPending}
            className="px-3 py-1.5 bg-white border border-red-300 hover:bg-red-50 rounded-lg text-xs font-semibold text-red-600 flex-shrink-0"
          >
            Retry
          </button>
        </div>
      )}

      {/* Documents pending review section */}
      <DocumentsPendingReviewSection
        showToast={showToast}
        onCountLoaded={setDocPendingCount}
      />

      {/* Empty state */}
      {!error && pendingList.length === 0 && docPendingCount === 0 && (
        <div className="bg-white border border-gray-200 rounded-2xl p-10 sm:p-16 text-center shadow-sm">
          <div
            className="w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-4 sm:mb-5 rounded-2xl flex items-center justify-center"
            style={{ background: "linear-gradient(135deg,#dbeafe,#bfdbfe)" }}
          >
            <CheckCircle className="w-8 h-8 sm:w-10 sm:h-10 text-blue-600" />
          </div>
          <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-2">
            All Caught Up!
          </h3>
          <p className="text-gray-500 text-sm max-w-xs mx-auto">
            No pending registration, rejoin, or document review requests at the
            moment.
          </p>
        </div>
      )}

      {/* Registration approval cards */}
      {pendingList.length > 0 && (
        <>
          <div className="relative mb-4 sm:mb-5">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-dashed border-blue-200" />
            </div>
            <div className="relative flex justify-center">
              <span
                className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest"
                style={{
                  background: "#eff6ff",
                  color: "#1d4ed8",
                  border: "1px solid #bfdbfe",
                }}
              >
                Registration Approvals
              </span>
            </div>
          </div>
          <div className="space-y-3 sm:space-y-4">
            {pendingList.map((emp) => (
              <EmployeeCard
                key={emp.id}
                employee={emp}
                onApprove={() => handleApprove(emp)}
                onReject={() => setRejectTarget(emp)}
                approving={!!actionLoading[`approve_${emp.id}`]}
                rejecting={!!actionLoading[`reject_${emp.id}`]}
                showToast={showToast}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default PendingApprovals;
