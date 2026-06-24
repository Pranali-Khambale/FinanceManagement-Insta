import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  Loader,
  AlertCircle,
  RefreshCw,
  FolderOpen,
  CheckCircle,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { BASE_URL as BASE_API } from "../../../../api/client";
import DocViewRow from "./DocViewRow";
import DocLightbox from "./DocLightbox";
import BatchActionBar from "./BatchActionBar";

const SubmittedDocsSection = ({ empDbId, docsSubmitted, showToast }) => {
  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [lightbox, setLightbox] = useState(null);
  const [accepting, setAccepting] = useState(false);
  const [rejecting, setRejecting] = useState(false);
  const [expanded, setExpanded] = useState(true);
  const hasFetched = useRef(false);

  const fetchDocs = useCallback(async () => {
    if (!empDbId) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch(
        `${BASE_API}/employee-docs/submissions/${empDbId}`,
      );
      const data = await res.json();
      if (data.success) setDocs(data.data || []);
      else setError(data.message || "Failed to load documents");
    } catch {
      setError("Cannot connect to server");
    } finally {
      setLoading(false);
    }
  }, [empDbId]);

  useEffect(() => {
    if (docsSubmitted && !hasFetched.current) {
      hasFetched.current = true;
      fetchDocs();
    }
  }, [docsSubmitted, fetchDocs]);

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
      setDocs((p) =>
        p.map((d) =>
          pending.find((pd) => pd.id === d.id)
            ? { ...d, reviewed: true, status: "accepted" }
            : d,
        ),
      );
      showToast?.(
        `All ${pending.length} document${pending.length > 1 ? "s" : ""} accepted`,
        "success",
      );
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
      setDocs((p) =>
        p.map((d) =>
          pending.find((pd) => pd.id === d.id)
            ? { ...d, status: "rejected", rejection_reason: reason }
            : d,
        ),
      );
      showToast?.(
        `All ${pending.length} document${pending.length > 1 ? "s" : ""} rejected`,
        "success",
      );
    } catch {
      showToast?.("Failed to reject all documents", "error");
    } finally {
      setRejecting(false);
    }
  };

  const pending = docs.filter(
    (d) => !d.reviewed && d.status !== "rejected" && d.status !== "accepted",
  ).length;
  const allDone = docs.length > 0 && pending === 0;

  if (!docsSubmitted) {
    return (
      <div className="mx-3 sm:mx-5 mb-4 rounded-xl border border-dashed border-gray-200 bg-gray-50 px-3 sm:px-4 py-3 flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-white border border-gray-200 flex items-center justify-center flex-shrink-0 shadow-sm">
          <FolderOpen className="w-4 h-4 text-gray-400" />
        </div>
        <div>
          <p className="text-xs font-semibold text-gray-500">
            No documents submitted yet
          </p>
          <p className="text-[10px] text-gray-400 mt-0.5">
            Documents will appear here once the employee uploads them after
            approval.
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      {lightbox !== null && (
        <DocLightbox
          docs={docs}
          startIndex={lightbox}
          onClose={() => setLightbox(null)}
        />
      )}

      <div className="mx-3 sm:mx-5 mb-4">
        {/* Toggle header */}
        <button
          onClick={() => setExpanded((p) => !p)}
          className="w-full flex items-center justify-between px-3 sm:px-4 py-2.5 rounded-xl border transition-all mb-2"
          style={{
            background: allDone
              ? "linear-gradient(90deg,#f0fdf4,#dcfce7)"
              : pending > 0
                ? "linear-gradient(90deg,#fefce8,#fef9c3)"
                : "#f8fafc",
            borderColor: allDone
              ? "#bbf7d0"
              : pending > 0
                ? "#fde68a"
                : "#e2e8f0",
          }}
        >
          <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
            <div className="relative flex-shrink-0">
              <div
                className="w-2 h-2 rounded-full"
                style={{ background: allDone ? "#22c55e" : "#f59e0b" }}
              />
              {pending > 0 && (
                <div
                  className="absolute inset-0 rounded-full animate-ping"
                  style={{ background: "#f59e0b", opacity: 0.4 }}
                />
              )}
            </div>
            <span
              className="text-xs font-bold truncate"
              style={{ color: allDone ? "#14532d" : "#92400e" }}
            >
              {allDone
                ? "All Documents Reviewed"
                : `${pending} Doc${pending > 1 ? "s" : ""} Pending`}
            </span>
            <span
              className="hidden sm:inline text-[10px] px-2 py-0.5 rounded-full font-semibold flex-shrink-0"
              style={{
                background: allDone ? "#bbf7d0" : "#fde68a",
                color: allDone ? "#14532d" : "#78350f",
              }}
            >
              {docs.length} submitted
            </span>
          </div>
          <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
            <button
              onClick={(e) => {
                e.stopPropagation();
                fetchDocs();
              }}
              className="p-1 rounded-md hover:bg-white/60"
            >
              <RefreshCw className="w-3.5 h-3.5 text-gray-500" />
            </button>
            {expanded ? (
              <ChevronUp className="w-4 h-4 text-gray-500" />
            ) : (
              <ChevronDown className="w-4 h-4 text-gray-500" />
            )}
          </div>
        </button>

        {expanded && (
          <div className="space-y-2">
            {loading && (
              <div className="flex items-center justify-center py-6">
                <Loader className="w-5 h-5 text-blue-500 animate-spin" />
                <span className="text-xs text-gray-500 ml-2">
                  Loading documents…
                </span>
              </div>
            )}
            {error && !loading && (
              <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
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
            {!loading && !error && docs.length > 0 && (
              <BatchActionBar
                docs={docs}
                onAcceptAll={handleAcceptAll}
                onRejectAll={handleRejectAll}
                accepting={accepting}
                rejecting={rejecting}
              />
            )}
            {!loading &&
              !error &&
              docs.map((doc) => (
                <DocViewRow
                  key={doc.id}
                  doc={doc}
                  onView={(d) => setLightbox(docs.indexOf(d))}
                />
              ))}
            {!loading && !error && docs.length > 0 && allDone && (
              <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-green-50 border border-green-200">
                <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                <p className="text-xs font-semibold text-green-700">
                  All {docs.length} document{docs.length > 1 ? "s" : ""}{" "}
                  reviewed — onboarding complete
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
};

export default SubmittedDocsSection;
