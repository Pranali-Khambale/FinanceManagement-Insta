import React, { useState, useEffect, useCallback } from "react";
import {
  Loader,
  AlertCircle,
  RefreshCw,
  CheckCircle,
  Mail,
  Phone,
  Calendar,
  Briefcase,
  Building2,
  CheckCheck,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { BASE_URL as BASE_API } from "../../../../api/client";
import { formatDateShort } from "../../../../utils/dateUtils";
import Avatar from "./Avatar";
import DocViewRow from "./DocViewRow";
import DocLightbox from "./DocLightbox";
import BatchActionBar from "./BatchActionBar";

const DocReviewCard = ({ emp, onAllReviewed, showToast }) => {
  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [lightbox, setLightbox] = useState(null);
  const [accepting, setAccepting] = useState(false);
  const [rejecting, setRejecting] = useState(false);
  const [expanded, setExpanded] = useState(true);

  const fetchDocs = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(
        `${BASE_API}/employee-docs/submissions/${emp.id}`,
      );
      const data = await res.json();
      if (data.success) setDocs(data.data || []);
      else setError(data.message || "Failed to load");
    } catch {
      setError("Cannot connect to server");
    } finally {
      setLoading(false);
    }
  }, [emp.id]);

  useEffect(() => {
    fetchDocs();
  }, [fetchDocs]);

  const handleAcceptAll = async () => {
    const pending = docs.filter(
      (d) => !d.reviewed && d.status !== "accepted" && d.status !== "rejected",
    );
    if (!pending.length) return;
    setAccepting(true);
    try {
      await Promise.all(
        pending.map((doc) =>
          fetch(`${BASE_API}/employee-docs/mark-reviewed/${doc.id}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
          }),
        ),
      );
      const updated = docs.map((d) =>
        pending.find((pd) => pd.id === d.id)
          ? { ...d, reviewed: true, status: "accepted" }
          : d,
      );
      setDocs(updated);
      showToast?.(
        `All ${pending.length} document${pending.length > 1 ? "s" : ""} accepted`,
        "success",
      );
      const allNowDone = updated.every(
        (d) => d.reviewed || d.status === "accepted" || d.status === "rejected",
      );
      if (allNowDone) setTimeout(() => onAllReviewed?.(emp.id), 800);
    } catch {
      showToast?.("Failed to accept all documents", "error");
    } finally {
      setAccepting(false);
    }
  };

  const handleRejectAll = async (reason) => {
    const pending = docs.filter(
      (d) => !d.reviewed && d.status !== "accepted" && d.status !== "rejected",
    );
    if (!pending.length) return;
    setRejecting(true);
    try {
      await Promise.all(
        pending.map((doc) =>
          fetch(`${BASE_API}/employee-docs/reject-doc/${doc.id}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ rejection_reason: reason }),
          }),
        ),
      );
      const updated = docs.map((d) =>
        pending.find((pd) => pd.id === d.id)
          ? { ...d, status: "rejected", rejection_reason: reason }
          : d,
      );
      setDocs(updated);
      showToast?.(
        `All ${pending.length} document${pending.length > 1 ? "s" : ""} rejected`,
        "success",
      );
      const allNowDone = updated.every(
        (d) => d.reviewed || d.status === "accepted" || d.status === "rejected",
      );
      if (allNowDone) setTimeout(() => onAllReviewed?.(emp.id), 800);
    } catch {
      showToast?.("Failed to reject all documents", "error");
    } finally {
      setRejecting(false);
    }
  };

  const pending = docs.filter(
    (d) => !d.reviewed && d.status !== "accepted" && d.status !== "rejected",
  ).length;
  const allDone = docs.length > 0 && pending === 0;

  return (
    <>
      {lightbox !== null && (
        <DocLightbox
          docs={docs}
          startIndex={lightbox}
          onClose={() => setLightbox(null)}
        />
      )}

      <div
        className={`bg-white rounded-2xl border shadow-sm hover:shadow-md transition-all overflow-hidden ${
          allDone ? "border-green-200" : "border-amber-200"
        }`}
      >
        <div
          className="h-0.5 w-full"
          style={{
            background: allDone
              ? "linear-gradient(90deg,#22c55e,#16a34a)"
              : "linear-gradient(90deg,#f59e0b,#fbbf24,#fcd34d)",
          }}
        />

        {/* Header */}
        <div className="px-3 sm:px-5 pt-4 pb-3 border-b border-gray-100">
          <div className="flex items-center justify-between flex-wrap gap-2 sm:gap-3">
            <div className="flex items-center gap-2 sm:gap-3.5 min-w-0">
              <div className="relative flex-shrink-0">
                <Avatar
                  firstName={emp.first_name}
                  lastName={emp.last_name}
                  size="md"
                />
                <div
                  className="absolute -top-1 -right-1 w-3 h-3 sm:w-3.5 sm:h-3.5 rounded-full border-2 border-white"
                  style={{ background: allDone ? "#22c55e" : "#f59e0b" }}
                />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                  <h3 className="text-sm font-bold text-gray-900 truncate">
                    {emp.first_name} {emp.last_name}
                  </h3>
                  <span
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border"
                    style={{
                      background: "#f0fdf4",
                      color: "#16a34a",
                      borderColor: "#bbf7d0",
                    }}
                  >
                    <CheckCircle className="w-2.5 h-2.5" /> Active
                  </span>
                  {!allDone && pending > 0 && (
                    <span
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border"
                      style={{
                        background: "#fffbeb",
                        color: "#92400e",
                        borderColor: "#fcd34d",
                      }}
                    >
                      {pending} Pending
                    </span>
                  )}
                  {allDone && (
                    <span
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border"
                      style={{
                        background: "#f0fdf4",
                        color: "#15803d",
                        borderColor: "#bbf7d0",
                      }}
                    >
                      <CheckCheck className="w-2.5 h-2.5" /> Reviewed
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1 sm:gap-1.5 text-xs text-gray-500 mt-0.5 flex-wrap">
                  <Briefcase className="w-3 h-3 flex-shrink-0" />
                  <span className="truncate">
                    {emp.position || "Not specified"}
                  </span>
                  <span className="text-gray-300">•</span>
                  <Building2 className="w-3 h-3 flex-shrink-0" />
                  <span className="truncate">
                    {emp.department || "Not specified"}
                  </span>
                  {emp.employee_id && (
                    <>
                      <span className="text-gray-300">•</span>
                      <span className="font-mono text-[10px] font-semibold text-blue-600">
                        {emp.employee_id}
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                onClick={fetchDocs}
                className="inline-flex items-center gap-1 px-2 py-1.5 rounded-lg border border-gray-200 bg-white text-gray-500 hover:border-blue-300 hover:text-blue-600 text-xs"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setExpanded((p) => !p)}
                className="inline-flex items-center gap-1 px-2 py-1.5 rounded-lg border border-gray-200 bg-white text-gray-500 text-xs"
              >
                {expanded ? (
                  <ChevronUp className="w-3.5 h-3.5" />
                ) : (
                  <ChevronDown className="w-3.5 h-3.5" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Info row */}
        <div className="px-3 sm:px-5 py-3 border-b border-gray-50">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {[
              {
                icon: <Mail className="w-3.5 h-3.5 text-blue-500" />,
                label: "Email",
                value: emp.email,
              },
              {
                icon: <Phone className="w-3.5 h-3.5 text-blue-500" />,
                label: "Phone",
                value: emp.phone,
              },
              {
                icon: <Calendar className="w-3.5 h-3.5 text-blue-500" />,
                label: "Docs Submitted",
                value: formatDateShort(emp.docs_submitted_at),
              },
            ].map((item, i) => (
              <div
                key={i}
                className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-50 border border-gray-100"
              >
                <div className="w-6 h-6 bg-blue-50 rounded-md flex items-center justify-center flex-shrink-0">
                  {item.icon}
                </div>
                <div className="min-w-0">
                  <p className="text-[9px] font-medium text-gray-400 uppercase tracking-wide leading-none mb-0.5">
                    {item.label}
                  </p>
                  <p className="text-xs font-semibold text-gray-800 truncate">
                    {item.value || "—"}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Documents */}
        {expanded && (
          <div className="px-3 sm:px-5 py-4">
            {loading && (
              <div className="flex items-center justify-center py-8">
                <Loader className="w-5 h-5 text-amber-500 animate-spin" />
                <span className="text-xs text-gray-500 ml-2">
                  Loading submitted documents…
                </span>
              </div>
            )}
            {error && !loading && (
              <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
                <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                <p className="text-xs text-red-700 flex-1">{error}</p>
                <button
                  onClick={fetchDocs}
                  className="text-xs text-red-600 underline font-medium"
                >
                  Retry
                </button>
              </div>
            )}
            {!loading && !error && docs.length === 0 && (
              <div className="text-center py-6 text-gray-400 text-xs">
                No documents found
              </div>
            )}
            {!loading && !error && docs.length > 0 && (
              <div className="space-y-2">
                <BatchActionBar
                  docs={docs}
                  onAcceptAll={handleAcceptAll}
                  onRejectAll={handleRejectAll}
                  accepting={accepting}
                  rejecting={rejecting}
                />
                {docs.map((doc) => (
                  <DocViewRow
                    key={doc.id}
                    doc={doc}
                    onView={(d) => setLightbox(docs.indexOf(d))}
                  />
                ))}
                {allDone && (
                  <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-green-50 border border-green-200 mt-1">
                    <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                      <CheckCheck className="w-4 h-4 text-green-600" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-green-800">
                        All documents reviewed
                      </p>
                      <p className="text-[10px] text-green-600 mt-0.5">
                        Onboarding is complete for this employee
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
};

export default DocReviewCard;
