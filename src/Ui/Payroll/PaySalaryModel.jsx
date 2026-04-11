// src/Ui/Payroll/PaySalaryModal.jsx
import React, { useState } from "react";

const PaySalaryModal = ({ employee, onClose, onSuccess }) => {
  const [mode, setMode] = useState("bank");
  const [remarks, setRemarks] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const gross = employee.salary + employee.bonus;
  const totalDed = employee.tax + employee.deductions;
  const net = gross - totalDed;
  const fmtINR = (n) => "₹" + Number(n).toLocaleString("en-IN");

  const avatarColors = [
    "from-indigo-400 to-indigo-600",
    "from-violet-400 to-violet-600",
    "from-blue-400 to-blue-600",
    "from-emerald-400 to-teal-600",
    "from-rose-400 to-pink-600",
    "from-amber-400 to-orange-500",
    "from-cyan-400 to-cyan-600",
  ];
  const colorIdx = employee.name.charCodeAt(0) % avatarColors.length;

  const handlePay = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setDone(true);
      setTimeout(() => {
        onSuccess(employee.id);
        onClose();
      }, 1600);
    }, 2200);
  };

  const modeFields = {
    bank: {
      label: "Account Number",
      value: `${employee.accountNo} · ${employee.bankName}`,
      readOnly: true,
    },
    upi: {
      label: "UPI ID",
      value: employee.upiId || "",
      readOnly: false,
      placeholder: "e.g. name@upi",
    },
    cheque: {
      label: "Cheque Number",
      value: "",
      readOnly: false,
      placeholder: "Enter cheque number",
    },
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(15,23,42,0.5)", backdropFilter: "blur(8px)" }}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
        style={{ animation: "slideUp 0.2s cubic-bezier(.22,1,.36,1)" }}
      >
        <style>{`
          @keyframes slideUp {
            from { opacity: 0; transform: translateY(20px) scale(0.98); }
            to   { opacity: 1; transform: translateY(0) scale(1); }
          }
          @keyframes spin { to { transform: rotate(360deg); } }
          .spin { animation: spin 0.8s linear infinite; }
        `}</style>

        {/* ── Header ── */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div>
            <h2 className="text-base font-bold text-slate-800">Pay Salary</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Process salary payment for this employee
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-400 text-sm transition-colors"
          >
            ✕
          </button>
        </div>

        {done ? (
          /* ── Success ── */
          <div className="px-6 py-14 flex flex-col items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center">
              <svg
                className="w-8 h-8 text-emerald-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2.5}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <p className="text-base font-bold text-slate-800">
              Payment Successful!
            </p>
            <p className="text-sm text-slate-500 text-center">
              {fmtINR(net)} has been dispatched to{" "}
              <strong>{employee.name}</strong>'s account.
            </p>
          </div>
        ) : (
          <>
            {/* ── Employee chip ── */}
            <div className="px-6 py-4 bg-slate-50 flex items-center gap-4 border-b border-slate-100">
              <div
                className={`w-11 h-11 rounded-xl bg-gradient-to-br ${avatarColors[colorIdx]} flex items-center justify-center text-white text-sm font-bold shadow-sm flex-shrink-0`}
              >
                {employee.avatar}
              </div>
              <div className="min-w-0">
                <p className="font-bold text-slate-800 truncate">
                  {employee.name}
                </p>
                <p className="text-xs text-slate-400 truncate">
                  {employee.employeeId} · {employee.designation} ·{" "}
                  {employee.department}
                </p>
              </div>
            </div>

            {/* ── Salary breakdown ── */}
            <div className="px-6 py-4 space-y-2.5">
              {[
                {
                  label: "Gross Salary",
                  value: fmtINR(employee.salary),
                  color: "text-slate-700",
                },
                {
                  label: "Bonus",
                  value: `+ ${fmtINR(employee.bonus)}`,
                  color: "text-emerald-600",
                },
                {
                  label: "Tax (TDS)",
                  value: `- ${fmtINR(employee.tax)}`,
                  color: "text-red-400",
                },
                {
                  label: "Deductions",
                  value: `- ${fmtINR(employee.deductions)}`,
                  color: "text-red-400",
                },
              ].map((item) => (
                <div key={item.label} className="flex justify-between text-sm">
                  <span className="text-slate-500">{item.label}</span>
                  <span className={`font-semibold ${item.color}`}>
                    {item.value}
                  </span>
                </div>
              ))}
              <div className="flex justify-between items-center pt-3 mt-1 border-t border-slate-100">
                <span className="text-sm font-bold text-slate-700">
                  Net Pay
                </span>
                <span className="text-xl font-extrabold text-indigo-600">
                  {fmtINR(net)}
                </span>
              </div>
            </div>

            {/* ── Payment Mode ── */}
            <div className="px-6 pb-3">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                Payment Mode
              </label>
              <div className="flex gap-2 mt-2">
                {[
                  { key: "bank", label: "🏦 Bank" },
                  { key: "upi", label: "📱 UPI" },
                  { key: "cheque", label: "📃 Cheque" },
                ].map((m) => (
                  <button
                    key={m.key}
                    onClick={() => setMode(m.key)}
                    className={`flex-1 py-2 rounded-xl text-xs font-semibold border transition-all ${
                      mode === m.key
                        ? "bg-indigo-50 border-indigo-400 text-indigo-700"
                        : "bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100"
                    }`}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
            </div>

            {/* ── Account field ── */}
            <div className="px-6 pb-3">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                {modeFields[mode].label}
              </label>
              <input
                readOnly={modeFields[mode].readOnly}
                defaultValue={modeFields[mode].value}
                placeholder={modeFields[mode].placeholder || ""}
                className="mt-1.5 w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-300"
              />
            </div>

            {/* ── Remarks ── */}
            <div className="px-6 pb-5">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                Remarks (Optional)
              </label>
              <textarea
                rows={2}
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                placeholder="Add payment notes..."
                className="mt-1.5 w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-300 resize-none"
              />
            </div>

            {/* ── Action buttons ── */}
            <div className="px-6 py-4 bg-slate-50 flex gap-3 border-t border-slate-100">
              <button
                onClick={onClose}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-100 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handlePay}
                disabled={loading}
                className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 text-white text-sm font-bold shadow-md hover:from-indigo-700 hover:to-blue-700 transition-all disabled:opacity-70 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <svg
                      className="spin w-4 h-4"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8v8z"
                      />
                    </svg>
                    Processing…
                  </>
                ) : (
                  <>
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                    Confirm Pay {fmtINR(net)}
                  </>
                )}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default PaySalaryModal;
