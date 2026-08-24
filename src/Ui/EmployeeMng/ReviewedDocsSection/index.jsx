import React, { useState, useEffect, useCallback } from "react";
import {
  CheckCheck,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Loader,
  AlertCircle,
  FolderOpen,
} from "lucide-react";
import { BASE_URL as BASE_API } from "@/api/client";
import { getAuthHeaders } from "@/utils/presignUtils";
import DocsModal from "./DocsModal";

export { DocsModal } from "./DocsModal";

const ReviewedDocsSection = ({ showToast }) => {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [collapsed, setCollapsed] = useState(false);
  const [docsModalEmp, setDocsModalEmp] = useState(null);

  const fetchReviewed = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${BASE_API}/employee-docs/reviewed`, {
        headers: getAuthHeaders(),
      });
      const data = await res.json();
      if (data.success) setEmployees(data.data || []);
      else setError(data.message || "Failed to load");
    } catch {
      setError("Cannot connect to server");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReviewed();
  }, [fetchReviewed]);

  if (!loading && !error && employees.length === 0) return null;

  return (
    <>
      {docsModalEmp && (
        <DocsModal emp={docsModalEmp} onClose={() => setDocsModalEmp(null)} />
      )}
      <div className="mt-6 sm:mt-8">
        {/* Section header */}
        <div className="flex items-start sm:items-center justify-between mb-4 gap-3 flex-wrap">
          <div className="flex items-center gap-3">
            <div
              className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: "#dcfce7" }}
            >
              <CheckCheck size={16} style={{ color: "#16a34a" }} />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base sm:text-lg font-semibold text-gray-900">
                  Document-Verified Employees
                </h2>
                {!loading && employees.length > 0 && (
                  <span
                    className="text-xs px-2.5 py-0.5 rounded-full font-semibold"
                    style={{ background: "#dcfce7", color: "#16a34a" }}
                  >
                    {employees.length} employee
                    {employees.length !== 1 ? "s" : ""}
                  </span>
                )}
              </div>
              <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
                Employees whose signed KYE form has been accepted by HR
              </p>
            </div>
          </div>
          <div className="flex gap-2 flex-shrink-0">
            <button
              onClick={fetchReviewed}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:bg-gray-50 transition-all"
            >
              <RefreshCw size={12} /> Refresh
            </button>
            <button
              onClick={() => setCollapsed((p) => !p)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:bg-gray-50 transition-all"
            >
              {collapsed ? <ChevronDown size={12} /> : <ChevronUp size={12} />}
              {collapsed ? "Show" : "Hide"}
            </button>
          </div>
        </div>

        {!collapsed && (
          <>
            {loading && (
              <div className="flex items-center justify-center py-10 gap-3 bg-white rounded-xl border border-gray-200">
                <Loader size={18} className="animate-spin text-gray-400" />
                <span className="text-sm text-gray-500">
                  Loading verified employees…
                </span>
              </div>
            )}
            {error && !loading && (
              <div className="flex items-center gap-3 px-4 py-3 bg-red-50 border border-red-200 rounded-xl mb-3">
                <AlertCircle size={16} className="text-red-500 flex-shrink-0" />
                <p className="text-sm text-red-700 flex-1">{error}</p>
                <button
                  onClick={fetchReviewed}
                  className="text-xs text-red-600 underline font-medium flex-shrink-0"
                >
                  Retry
                </button>
              </div>
            )}
            {!loading && !error && employees.length > 0 && (
              <div className="space-y-2">
                {employees.map((emp) => {
                  const docs = Array.isArray(emp.docs) ? emp.docs : [];
                  const acceptedCount =
                    emp.accepted_docs ||
                    docs.filter(
                      (d) =>
                        (d.status === "accepted" || d.reviewed) &&
                        d.document_type === "signed_kye",
                    ).length ||
                    0;
                  const firstName = emp.first_name || "";
                  const lastName = emp.last_name || "";
                  const initials =
                    `${firstName[0] || "?"}${lastName[0] || ""}`.toUpperCase();

                  return (
                    <div
                      key={emp.id}
                      className="bg-white rounded-xl border border-gray-200 hover:border-green-300 hover:shadow-sm transition-all overflow-hidden"
                    >
                      <div className="flex items-center gap-3 px-3 py-3 sm:px-4">
                        <div
                          className="w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center font-semibold text-sm text-blue-700 flex-shrink-0"
                          style={{ background: "#dbeafe" }}
                        >
                          {initials}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-gray-900 truncate">
                            {firstName}
                            {emp.father_husband_name
                              ? ` ${emp.father_husband_name} `
                              : " "}
                            {lastName}
                          </p>
                          <p className="text-xs text-gray-500 truncate">
                            {emp.emp_id || emp.employee_id} ·{" "}
                            {emp.department || "—"} · {emp.position || "—"}
                          </p>
                        </div>
                        <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
                          <span
                            className="hidden sm:inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border"
                            style={{
                              background: "#f0fdf4",
                              color: "#16a34a",
                              borderColor: "#bbf7d0",
                            }}
                          >
                            <CheckCheck size={12} /> {acceptedCount} KYE
                          </span>
                          <span
                            className="sm:hidden inline-flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-lg border"
                            style={{
                              background: "#f0fdf4",
                              color: "#16a34a",
                              borderColor: "#bbf7d0",
                            }}
                          >
                            <CheckCheck size={10} /> {acceptedCount}
                          </span>
                          <button
                            onClick={() => setDocsModalEmp(emp)}
                            className="flex items-center gap-1 sm:gap-1.5 px-2.5 py-1.5 sm:px-3 rounded-lg text-[11px] sm:text-xs font-semibold transition-all"
                            style={{
                              background:
                                "linear-gradient(135deg, #1d4ed8, #3b82f6)",
                              color: "#fff",
                            }}
                          >
                            <FolderOpen size={12} />
                            <span className="hidden sm:inline">View Docs</span>
                            <span className="sm:hidden">View</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
};

export default ReviewedDocsSection;
