import { CheckCircle, XCircle, Info, AlertTriangle } from "lucide-react";

const Toast = ({ toasts, removeToast }) => {
  const icons = {
    success: <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />,
    error:   <XCircle    className="w-4 h-4 text-red-500   flex-shrink-0" />,
    info:    <Info       className="w-4 h-4 text-blue-500  flex-shrink-0" />,
    warning: <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0" />,
  };
  const colors = {
    success: "border-green-200 bg-green-50  text-green-800",
    error:   "border-red-200   bg-red-50    text-red-800",
    info:    "border-blue-200  bg-blue-50   text-blue-800",
    warning: "border-amber-200 bg-amber-50  text-amber-800",
  };

  return (
    <div className="fixed top-20 right-4 z-[10000] flex flex-col gap-2 pointer-events-none">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-xl border shadow-lg text-sm font-medium min-w-[260px] max-w-[380px] animate-slide-in ${colors[t.type] || colors.info}`}
        >
          {icons[t.type] || icons.info}
          <span className="flex-1">{t.message}</span>
          <button
            onClick={() => removeToast(t.id)}
            className="ml-1 opacity-60 hover:opacity-100 transition-opacity text-base leading-none"
          >
            ×
          </button>
        </div>
      ))}
      <style>{`
        @keyframes slide-in { from { opacity:0; transform:translateX(40px); } to { opacity:1; transform:translateX(0); } }
        .animate-slide-in { animation: slide-in 0.25s ease-out; }
      `}</style>
    </div>
  );
};

export default Toast;