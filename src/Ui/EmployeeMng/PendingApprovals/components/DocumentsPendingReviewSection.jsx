import React, { useState, useEffect, useCallback } from "react";
import { Loader, AlertCircle } from "lucide-react";
import { BASE_URL as BASE_API } from "../../../../api/client";
import DocReviewCard from "./DocReviewCard";

const DocumentsPendingReviewSection = ({ showToast, onCountLoaded }) => {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchPendingDocs = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${BASE_API}/employee-docs/pending`);
      const data = await res.json();
      if (data.success) {
        const list = data.data || [];
        setEmployees(list);
        onCountLoaded?.(list.length);
      } else {
        setError(data.message || "Failed to load");
        onCountLoaded?.(0);
      }
    } catch {
      setError("Cannot connect to server");
      onCountLoaded?.(0);
    } finally {
      setLoading(false);
    }
  }, [onCountLoaded]);

  useEffect(() => {
    fetchPendingDocs();
  }, [fetchPendingDocs]);

  const handleAllReviewed = (empId) => {
    setEmployees((prev) => {
      const updated = prev.filter((e) => e.id !== empId);
      onCountLoaded?.(updated.length);
      return updated;
    });
  };

  if (!loading && !error && employees.length === 0) return null;

  return (
    <div className="mb-8">
      <div className="relative mb-5">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-dashed border-amber-200" />
        </div>
        <div className="relative flex justify-center">
          <span
            className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest"
            style={{
              background: "#fffbeb",
              color: "#d97706",
              border: "1px solid #fde68a",
            }}
          >
            Signed Documents Received
          </span>
        </div>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-12 bg-white rounded-2xl border border-amber-100">
          <Loader className="w-6 h-6 text-amber-500 animate-spin" />
          <span className="text-sm text-gray-500 ml-3">
            Loading submitted documents…
          </span>
        </div>
      )}
      {error && !loading && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
          <p className="text-sm text-red-700 flex-1">{error}</p>
          <button
            onClick={fetchPendingDocs}
            className="px-3 py-1.5 bg-white border border-red-300 hover:bg-red-50 rounded-lg text-xs font-semibold text-red-600"
          >
            Retry
          </button>
        </div>
      )}
      {!loading && !error && (
        <div className="space-y-4">
          {employees.map((emp) => (
            <DocReviewCard
              key={emp.id}
              emp={emp}
              onAllReviewed={handleAllReviewed}
              showToast={showToast}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default DocumentsPendingReviewSection;
