// confirm popup
import { AlertTriangle } from "lucide-react";

const ConfirmDialog = ({ message, onConfirm, onCancel }) => (
  <div className="fixed inset-0 z-[10000] backdrop-blur-sm bg-black/40 flex items-center justify-center p-3 sm:p-4">
    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-5 sm:p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
          <AlertTriangle className="w-5 h-5 text-red-600" />
        </div>
        <p className="text-sm font-medium text-gray-800 break-words">{message}</p>
      </div>
      <div className="flex flex-col sm:flex-row gap-3 sm:justify-end">
        <button
          onClick={onCancel}
          className="order-2 sm:order-1 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium transition-colors w-full sm:w-auto"
        >
          Cancel
        </button>
        <button
          onClick={onConfirm}
          className="order-1 sm:order-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition-colors w-full sm:w-auto"
        >
          Confirm
        </button>
      </div>
    </div>
  </div>
);

export default ConfirmDialog;