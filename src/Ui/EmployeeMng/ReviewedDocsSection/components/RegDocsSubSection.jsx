// src/Ui/EmployeeMng/ReviewedDocsSection/components/RegDocsSubSection.jsx
import React, { useState } from "react";
import { AlertCircle, User, ChevronUp, ChevronDown } from "lucide-react";
import DocCard from "./DocCard";

// ── Registration Docs Sub-Section ─────────────────────────────────────────────
const RegDocsSubSection = ({ regDocs, allViewableDocsRef, onView }) => {
  const [open, setOpen] = useState(true);

  if (!regDocs || regDocs.length === 0) {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 flex items-center gap-2">
        <AlertCircle size={14} className="text-amber-500 flex-shrink-0" />
        <p className="text-xs text-amber-700">
          No registration documents found for this employee.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-amber-200 overflow-hidden">
      <button
        onClick={() => setOpen((p) => !p)}
        className="w-full flex items-center gap-2 px-4 py-3 border-b border-amber-200 text-left transition-colors hover:bg-amber-50"
        style={{ background: "linear-gradient(135deg,#92400e,#b45309)" }}
      >
        <User size={14} className="text-white flex-shrink-0" />
        <p className="text-white text-xs font-bold flex-1">
          Registration Documents
        </p>
        <span className="text-amber-200 text-[10px] font-semibold">
          {regDocs.length} file{regDocs.length !== 1 ? "s" : ""}
        </span>
        {open ? (
          <ChevronUp size={13} className="text-white" />
        ) : (
          <ChevronDown size={13} className="text-white" />
        )}
      </button>
      {open && (
        <div className="p-4 space-y-3 bg-amber-50">
          {regDocs.map((doc, i) => {
            const globalIdx =
              allViewableDocsRef?.findIndex((d) => d === doc) ?? -1;
            return (
              <DocCard
                key={doc.id || i}
                doc={doc}
                index={globalIdx >= 0 ? globalIdx : i}
                onView={globalIdx >= 0 ? onView : undefined}
              />
            );
          })}
        </div>
      )}
    </div>
  );
};

export default RegDocsSubSection;