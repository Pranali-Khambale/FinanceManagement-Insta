// ─────────────────────────────────────────────────────────────────────────────
// FILE: src/pages/AdvancePayment.jsx
// ─────────────────────────────────────────────────────────────────────────────
import { useState } from "react";
import { Link2, Download, Plus } from "lucide-react";

// Dashboard (stat cards + table)
import AdvancePaymentDashboard from "../Ui/AdvancePayment/AdvancePaymentDashboard";

// Modals — imported here so page-header buttons can open them directly
import GenerateLinkModal from "../Ui/AdvancePayment/GenerateLink";
import AddRequestModal   from "../Ui/AdvancePayment/AddRequest";

export default function AdvancePayment() {
  // Modal open/close state lives here so header buttons can trigger them
  const [showLink, setShowLink] = useState(false);
  const [showAdd,  setShowAdd]  = useState(false);

  // Shared requests state — lifted so both header and dashboard share it
  const [requests, setRequests] = useState([
    { id: "ADV001", empId: "EMP012", name: "Aarav Ramesh Mehta", dept: "Engineering", amount: 15000, reason: "Medical emergency", date: "2026-03-28", status: "pending",  proof: "bill.pdf"    },
    { id: "ADV002", empId: "EMP013", name: "Priya Sharma",       dept: "HR",          amount: 8000,  reason: "Home renovation",  date: "2026-03-30", status: "pending",  proof: "quote.png"   },
    { id: "ADV003", empId: "EMP010", name: "Ravi Kumar",         dept: "IT",          amount: 20000, reason: "Education fee",    date: "2026-03-15", status: "approved", proof: "receipt.pdf", adjustedIn: "April 2026" },
    { id: "ADV004", empId: "EMP008", name: "Sneha Patil",        dept: "Finance",     amount: 5000,  reason: "Travel",           date: "2026-03-10", status: "rejected", proof: null          },
  ]);

  const addRequest = (req) => setRequests((rs) => [req, ...rs]);

  const exportCSV = () => {
    const rows = [
      ["ID", "Emp ID", "Name", "Dept", "Amount", "Reason", "Date", "Status"],
      ...requests.map((r) => [r.id, r.empId, r.name, r.dept, r.amount, r.reason, r.date, r.status]),
    ];
    const csv = rows.map((r) => r.join(",")).join("\n");
    const a   = document.createElement("a");
    a.href     = "data:text/csv;charset=utf-8," + encodeURIComponent(csv);
    a.download = "advance_payments.csv";
    a.click();
  };

  return (
    <div className="space-y-6">

      {/* ── Page Heading + 3 Buttons inline (like Employee Management) ── */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">

        {/* Left: Title */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-800">
            Advance Payments
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Process and manage advance payment requests
          </p>
        </div>

        {/* Right: 3 Action Buttons — trigger modals directly */}
        <div className="flex items-center gap-3 flex-wrap shrink-0">

          {/* 1. Generate Link → opens GenerateLinkModal */}
          <button
            onClick={() => setShowLink(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 border-blue-500 text-blue-600 bg-white text-sm font-semibold hover:bg-blue-50 transition-colors"
          >
            <Link2 size={16} />
            Generate Link
          </button>

          {/* 2. Export CSV */}
          <button
            onClick={exportCSV}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 border-emerald-500 text-emerald-600 bg-white text-sm font-semibold hover:bg-emerald-50 transition-colors"
          >
            <Download size={16} />
            Export
          </button>

          {/* 3. New Request → opens AddRequestModal */}
          <button
            onClick={() => setShowAdd(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 active:bg-indigo-800 transition-colors shadow-sm shadow-indigo-200"
          >
            <Plus size={16} />
            New Request
          </button>
        </div>
      </div>

      {/* ── Dashboard: stat cards + requests table only ── */}
      <AdvancePaymentDashboard
        requests={requests}
        setRequests={setRequests}
      />

      {/* ── Modals triggered by header buttons ── */}
      {showLink && (
        <GenerateLinkModal onClose={() => setShowLink(false)} />
      )}
      {showAdd && (
        <AddRequestModal
          onClose={() => setShowAdd(false)}
          onAdd={addRequest}
        />
      )}
    </div>
  );
}