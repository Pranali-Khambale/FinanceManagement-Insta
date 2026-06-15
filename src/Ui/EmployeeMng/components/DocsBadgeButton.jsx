// docs count button
import { useState, useEffect } from "react";
import { FolderOpen } from "lucide-react";
import { BASE_URL } from "../../../api/client";

const DocsBadgeButton = ({ emp, onClick }) => {
  const [count, setCount] = useState(null);

  useEffect(() => {
    const preloaded =
      typeof emp.accepted_docs === "number"
        ? emp.accepted_docs
        : Array.isArray(emp.docs)
          ? emp.docs.filter(
              (d) => d.status === "accepted" || d.reviewed === true,
            ).length
          : null;

    if (preloaded !== null) {
      setCount(preloaded);
      return;
    }

    const empId = emp.id || emp.employee_id;
    fetch(`${BASE_URL}/employee-docs/submissions/${empId}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.success) {
          const accepted = (data.data || []).filter(
            (d) => d.status === "accepted" || d.reviewed === true,
          ).length;
          setCount(accepted);
        } else {
          setCount(0);
        }
      })
      .catch(() => setCount(0));
  }, [emp.id, emp.employee_id, emp.accepted_docs, emp.docs]);

  const btnBg =
    count === null
      ? "linear-gradient(135deg, #9ca3af, #6b7280)"
      : count > 0
        ? "linear-gradient(135deg, #1d4ed8, #3b82f6)"
        : "linear-gradient(135deg, #374151, #6b7280)";

  return (
    <div className="flex items-center gap-1.5">
      <button
        onClick={onClick}
        title={
          count === null
            ? "Loading documents…"
            : count > 0
              ? `View ${count} accepted document${count !== 1 ? "s" : ""}`
              : "View submitted documents"
        }
        className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all hover:opacity-90 active:scale-[0.97] whitespace-nowrap"
        style={{ background: btnBg, color: "#fff" }}
      >
        <FolderOpen size={12} />
        Docs
      </button>
    </div>
  );
};

export default DocsBadgeButton;