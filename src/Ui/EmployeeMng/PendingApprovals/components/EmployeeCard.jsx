import React, { useState } from "react";
import {
  Eye,
  Loader,
  CheckCircle,
  XCircle,
  Mail,
  Phone,
  Calendar,
  Clock,
  Briefcase,
  Building2,
  History,
  Upload,
} from "lucide-react";
import { formatDateShort, formatDateTime } from "../../../../utils/dateUtils";
import Avatar from "./Avatar";
import FullFormViewer from "./FullFormViewer";
import SubmittedDocsSection from "./SubmittedDocsSection";

const EmployeeCard = ({
  employee,
  onApprove,
  onReject,
  approving,
  rejecting,
  showToast,
}) => {
  const [showFullForm, setShowFullForm] = useState(false);
  const isRejoin = employee.status === "pending_rejoin";
  const docsSubmitted = !!employee.docs_submitted;

  return (
    <>
      {showFullForm && (
        <FullFormViewer
          employee={employee}
          onClose={() => setShowFullForm(false)}
        />
      )}

      <div
        className={`bg-white rounded-2xl border shadow-sm hover:shadow-lg transition-all overflow-hidden ${
          isRejoin
            ? "border-indigo-200"
            : docsSubmitted
              ? "border-amber-200"
              : "border-gray-200"
        }`}
      >
        <div
          className="h-0.5 w-full"
          style={{
            background: isRejoin
              ? "linear-gradient(90deg,#4f46e5,#7c3aed,#a78bfa)"
              : docsSubmitted
                ? "linear-gradient(90deg,#f59e0b,#fbbf24,#fcd34d)"
                : "linear-gradient(90deg,#1d4ed8,#3b82f6,#60a5fa)",
          }}
        />

        {/* Card header */}
        <div className="px-3 sm:px-5 pt-4 pb-3.5 border-b border-gray-100">
          <div className="flex items-center justify-between flex-wrap gap-2 sm:gap-3">
            <div className="flex items-center gap-2 sm:gap-3.5 min-w-0">
              <div className="relative flex-shrink-0">
                <Avatar
                  firstName={employee.first_name}
                  lastName={employee.last_name}
                  size="md"
                />
                {isRejoin && (
                  <div className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-amber-400 rounded-full flex items-center justify-center border-2 border-white">
                    <History
                      className="w-2 h-2 text-white"
                      style={{ strokeWidth: 3 }}
                    />
                  </div>
                )}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                  <h3 className="text-sm font-bold text-gray-900 truncate">
                    {employee.first_name} {employee.last_name}
                  </h3>
                  {isRejoin && (
                    <span
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border flex-shrink-0"
                      style={{
                        background: "#ede9fe",
                        color: "#6d28d9",
                        borderColor: "#c4b5fd",
                      }}
                    >
                      <History className="w-2.5 h-2.5" /> Rejoin
                    </span>
                  )}
                  {docsSubmitted && (
                    <span
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border flex-shrink-0"
                      style={{
                        background: "#fffbeb",
                        color: "#92400e",
                        borderColor: "#fcd34d",
                      }}
                    >
                      <Upload className="w-2.5 h-2.5" /> Docs Uploaded
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1 sm:gap-1.5 text-xs text-gray-500 mt-0.5 flex-wrap">
                  <Briefcase className="w-3 h-3 flex-shrink-0" />
                  <span className="truncate">
                    {employee.position || "Not specified"}
                  </span>
                  <span className="text-gray-300">•</span>
                  <Building2 className="w-3 h-3 flex-shrink-0" />
                  <span className="truncate">
                    {employee.department || "Not specified"}
                  </span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-1 sm:gap-1.5 flex-shrink-0">
              <button
                onClick={() => setShowFullForm(true)}
                className="inline-flex items-center gap-1 px-2 sm:px-2.5 py-1.5 rounded-lg border border-gray-200 bg-white text-gray-600 hover:border-blue-300 hover:text-blue-700 hover:bg-blue-50 text-xs font-medium"
              >
                <Eye className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">View</span>
              </button>
              <button
                onClick={onApprove}
                disabled={approving || rejecting}
                className="inline-flex items-center gap-1 px-2 sm:px-2.5 py-1.5 rounded-lg text-xs font-semibold text-white disabled:opacity-50"
                style={{
                  background: isRejoin
                    ? "linear-gradient(135deg,#4f46e5,#7c3aed)"
                    : "linear-gradient(135deg,#16a34a,#22c55e)",
                }}
              >
                {approving ? (
                  <>
                    <Loader className="w-3.5 h-3.5 animate-spin" />
                    <span className="hidden sm:inline">Approving…</span>
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">
                      {isRejoin ? "Approve Rejoin" : "Approve"}
                    </span>
                  </>
                )}
              </button>
              <button
                onClick={onReject}
                disabled={approving || rejecting}
                className="inline-flex items-center gap-1 px-2 sm:px-2.5 py-1.5 rounded-lg border border-red-200 bg-white text-red-500 hover:bg-red-50 hover:border-red-400 text-xs font-medium disabled:opacity-50"
              >
                <XCircle className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">
                  {isRejoin ? "Decline" : "Reject"}
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* Info row */}
        <div className="px-3 sm:px-5 pt-3 sm:pt-4 pb-3">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3 mb-2 sm:mb-3">
            {[
              {
                icon: <Mail className="w-3.5 h-3.5 text-blue-500" />,
                label: "Email",
                value: employee.email,
              },
              {
                icon: <Phone className="w-3.5 h-3.5 text-blue-500" />,
                label: "Phone",
                value: employee.phone,
              },
              {
                icon: <Calendar className="w-3.5 h-3.5 text-blue-500" />,
                label: "Joining Date",
                value: formatDateShort(employee.joining_date),
              },
            ].map((item, i) => (
              <div
                key={i}
                className="flex items-center gap-2 sm:gap-2.5 px-3 sm:px-3.5 py-2 sm:py-2.5 rounded-lg bg-gray-50 border border-gray-100"
              >
                <div className="w-6 h-6 sm:w-7 sm:h-7 bg-blue-50 rounded-md flex items-center justify-center flex-shrink-0">
                  {item.icon}
                </div>
                <div className="min-w-0">
                  <p className="text-[9px] sm:text-[10px] font-medium text-gray-400 uppercase tracking-wide leading-none mb-0.5">
                    {item.label}
                  </p>
                  <p className="text-xs font-semibold text-gray-800 truncate">
                    {item.value || "—"}
                  </p>
                </div>
              </div>
            ))}
          </div>
          <div className="flex items-center justify-between px-3 sm:px-3.5 py-2 sm:py-2.5 rounded-lg border border-gray-100 bg-gray-50 flex-wrap gap-2">
            <div className="flex items-center gap-1.5 text-xs text-gray-500">
              <Clock className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
              <span>{isRejoin ? "Requested:" : "Applied:"}</span>
              <span className="font-semibold text-gray-700">
                {formatDateTime(employee.created_at)}
              </span>
            </div>
            {employee.employment_type && (
              <span className="px-2 py-0.5 text-[11px] font-semibold rounded-full bg-blue-100 text-blue-800">
                {employee.employment_type}
              </span>
            )}
          </div>
        </div>

        {/* Submitted docs section */}
        <div className="border-t border-gray-100 pt-3">
          <SubmittedDocsSection
            empDbId={employee.id}
            docsSubmitted={docsSubmitted}
            showToast={showToast}
          />
        </div>
      </div>
    </>
  );
};

export default EmployeeCard;
