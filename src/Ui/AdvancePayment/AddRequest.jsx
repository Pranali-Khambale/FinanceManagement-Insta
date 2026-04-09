// ─────────────────────────────────────────────────────────────────────────────
// FILE: src/Ui/AdvancePayment/AddRequestModal.jsx
// ─────────────────────────────────────────────────────────────────────────────
import { useState } from "react";
import { X, Upload, Plus } from "lucide-react";

export default function AddRequestModal({ onClose, onAdd }) {
  const [form, setForm]       = useState({ empId: "", name: "", dept: "", amount: "", reason: "" });
  const [proofName, setProof] = useState("");
  const [errors,    setErrors] = useState({});

  const set = (k) => (e) => {
    setForm((f) => ({ ...f, [k]: e.target.value }));
    setErrors((er) => ({ ...er, [k]: "" }));
  };

  const handleFile = (e) => {
    const f = e.target.files[0];
    if (f) setProof(f.name);
  };

  const submit = () => {
    const er = {};
    if (!form.empId)                       er.empId  = "Required";
    if (!form.name)                        er.name   = "Required";
    if (!form.dept)                        er.dept   = "Required";
    if (!form.amount || isNaN(form.amount)) er.amount = "Enter a valid amount";
    if (!form.reason)                      er.reason = "Required";
    if (Object.keys(er).length) { setErrors(er); return; }

    onAdd({
      ...form,
      proof:  proofName || null,
      id:     "ADV" + Date.now(),
      date:   new Date().toISOString().slice(0, 10),
      status: "pending",
    });
    onClose();
  };

  const fields = [
    { label: "Employee ID", key: "empId",  ph: "EMP001",      type: "text"   },
    { label: "Full Name",   key: "name",   ph: "John Doe",    type: "text"   },
    { label: "Department",  key: "dept",   ph: "Engineering", type: "text"   },
    { label: "Amount (₹)",  key: "amount", ph: "10000",       type: "number" },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">

        {/* ── Header ── */}
        <div className="bg-gradient-to-r from-indigo-600 to-violet-600 px-6 py-5 flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center">
              <Plus size={18} className="text-white" />
            </div>
            <div>
              <h3 className="text-white font-bold text-base">Add Manual Request</h3>
              <p className="text-indigo-200 text-xs mt-0.5">Submit an advance payment on behalf of an employee</p>
            </div>
          </div>
          <button onClick={onClose} className="text-white/70 hover:text-white transition-colors p-1">
            <X size={18} />
          </button>
        </div>

        {/* ── Body ── */}
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            {fields.map(({ label, key, ph, type }) => (
              <div key={key}>
                <label className="text-xs font-semibold text-slate-600 mb-1 block">
                  {label} <span className="text-red-400">*</span>
                </label>
                <input
                  type={type}
                  placeholder={ph}
                  value={form[key]}
                  onChange={set(key)}
                  className={`w-full px-3 py-2.5 text-sm border rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-slate-50 transition-colors
                    ${errors[key] ? "border-red-400 bg-red-50" : "border-slate-200"}`}
                />
                {errors[key] && <p className="text-xs text-red-500 mt-0.5">{errors[key]}</p>}
              </div>
            ))}
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-600 mb-1 block">
              Reason <span className="text-red-400">*</span>
            </label>
            <textarea
              rows={3}
              placeholder="Reason for advance request..."
              value={form.reason}
              onChange={set("reason")}
              className={`w-full px-3 py-2.5 text-sm border rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-slate-50 resize-none transition-colors
                ${errors.reason ? "border-red-400 bg-red-50" : "border-slate-200"}`}
            />
            {errors.reason && <p className="text-xs text-red-500 mt-0.5">{errors.reason}</p>}
          </div>

          {/* File upload */}
          <label className="flex flex-col items-center gap-2 border-2 border-dashed border-slate-200 rounded-xl p-5 cursor-pointer hover:border-indigo-300 hover:bg-indigo-50/30 transition-colors">
            <Upload size={20} className="text-slate-400" />
            {proofName
              ? <p className="text-sm font-medium text-indigo-600">{proofName}</p>
              : <>
                  <p className="text-sm font-medium text-slate-500">Upload Proof Document</p>
                  <p className="text-xs text-slate-400">PNG, JPG, PDF (optional)</p>
                </>
            }
            <input type="file" accept=".png,.jpg,.jpeg,.pdf" onChange={handleFile} className="hidden" />
          </label>
        </div>

        {/* ── Footer ── */}
        <div className="flex gap-3 px-6 pb-6">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-sm font-semibold hover:bg-slate-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={submit}
            className="flex-1 px-4 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 transition-colors shadow-sm shadow-indigo-200"
          >
            Submit Request
          </button>
        </div>
      </div>
    </div>
  );
}