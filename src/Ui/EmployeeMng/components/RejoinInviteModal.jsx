import { Loader, UserCheck, Mail, Send, Clock } from "lucide-react";

const RejoinInviteModal = ({ employee, onConfirm, onCancel, isSending }) => {
  const firstName = employee.first_name || employee.firstName || "";
  const lastName  = employee.last_name  || employee.lastName  || "";
  const fatherName = employee.father_husband_name || employee.fatherHusbandName || "";
  const name  = [firstName, fatherName, lastName].map((s) => s.trim()).filter(Boolean).join(" ");
  const email = employee.email || "—";
  const empId = employee.employee_id || employee.id || "—";
  const dept  = employee.department || "—";

  return (
    <div className="fixed inset-0 z-[9999] backdrop-blur-sm bg-black/40 flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden max-h-[90vh] flex flex-col">

        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-violet-600 px-4 sm:px-6 py-4 sm:py-5 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 sm:w-11 sm:h-11 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
              <UserCheck className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </div>
            <div className="min-w-0">
              <h3 className="text-white font-bold text-sm sm:text-base">Send Rejoin Invitation</h3>
              <p className="text-indigo-200 text-[11px] sm:text-xs mt-0.5">
                A pre-filled registration link will be emailed to this employee
              </p>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="px-4 sm:px-6 py-4 sm:py-5 overflow-y-auto flex-1">
          {/* Employee info card */}
          <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-3 sm:p-4 mb-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-indigo-200 flex items-center justify-center text-indigo-700 font-bold text-sm flex-shrink-0">
                {firstName[0] || "?"}{lastName[0] || ""}
              </div>
              <div className="min-w-0">
                <p className="font-bold text-indigo-900 text-sm truncate">{name || "—"}</p>
                <p className="text-xs text-indigo-600 truncate">{empId}</p>
              </div>
            </div>
            <div className="grid grid-cols-1 xs:grid-cols-2 gap-2">
              {[["Email", email], ["Department", dept], ["Status", "Inactive"]].map(([label, val]) => (
                <div key={label} className="bg-white rounded-lg px-3 py-2 border border-indigo-100 min-w-0">
                  <p className="text-[10px] text-indigo-400 font-semibold uppercase tracking-wide mb-0.5">{label}</p>
                  <p className="text-xs font-bold text-indigo-900 truncate" title={val}>{val}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Steps */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 sm:p-4 mb-4">
            <p className="text-xs font-bold text-blue-800 uppercase tracking-wide mb-2 flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5 flex-shrink-0" /> What happens when you confirm
            </p>
            <ul className="space-y-1.5">
              {[
                "A unique 7-day registration link is generated",
                `An invitation email is sent to ${email}`,
                "The form is auto-filled with their current database information",
                "Employee can edit any field before submitting",
                "On submission, status changes to 'Pending Rejoin' for HR review",
              ].map((step, i) => (
                <li key={i} className="flex items-start gap-2 text-xs text-blue-700">
                  <span className="w-4 h-4 rounded-full bg-blue-200 text-blue-700 font-bold text-[10px] flex items-center justify-center flex-shrink-0 mt-0.5">
                    {i + 1}
                  </span>
                  <span className="break-words">{step}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Expiry notice */}
          <div className="flex items-start sm:items-center gap-2 bg-amber-50 border border-amber-200 rounded-xl px-3 sm:px-4 py-3">
            <Clock className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5 sm:mt-0" />
            <p className="text-xs text-amber-700">
              The invitation link expires in <strong>7 days</strong> and can only be used once.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="px-4 sm:px-6 pb-4 sm:pb-5 pt-4 flex flex-col sm:flex-row gap-3 sm:justify-end border-t border-gray-100 flex-shrink-0">
          <button
            onClick={onCancel}
            disabled={isSending}
            className="order-2 sm:order-1 px-5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-sm font-medium transition-colors disabled:opacity-50 w-full sm:w-auto"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isSending}
            className="order-1 sm:order-2 flex items-center justify-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold transition-colors disabled:opacity-60 shadow-sm w-full sm:w-auto"
          >
            {isSending ? (
              <><Loader className="w-4 h-4 animate-spin" /> Sending…</>
            ) : (
              <><Send className="w-4 h-4" /> Send Invitation Email</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default RejoinInviteModal;