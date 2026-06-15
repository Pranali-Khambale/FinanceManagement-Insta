// src/Ui/EmployeeMng/ReviewedDocsSection/components/HRDropZone.jsx
import React, { useState, useRef } from "react";
import { CheckCircle, FileText, X as XIcon } from "lucide-react";

// ── Tiny drop-zone ────────────────────────────────────────────────────────────
const HRDropZone = ({
  label,
  icon: Icon,
  accept,
  file,
  onChange,
  onRemove,
}) => {
  const inputRef = useRef(null);
  const [drag, setDrag] = useState(false);
  const preview = file?.type?.startsWith("image/")
    ? URL.createObjectURL(file)
    : null;

  const handleDrop = (e) => {
    e.preventDefault();
    setDrag(false);
    const f = e.dataTransfer.files[0];
    if (f) onChange(f);
  };

  if (file) {
    return (
      <div className="relative flex items-center gap-2 px-3 py-2 rounded-lg border-2 border-green-400 bg-green-50">
        <div className="w-8 h-8 rounded-md bg-green-100 flex items-center justify-center flex-shrink-0 overflow-hidden">
          {preview ? (
            <img src={preview} alt="" className="w-full h-full object-cover" />
          ) : (
            <FileText className="w-4 h-4 text-green-600" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-gray-800 truncate">
            {file.name}
          </p>
          <p className="text-[10px] text-gray-400">
            {(file.size / 1024).toFixed(1)} KB
          </p>
        </div>
        <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
        <button
          type="button"
          onClick={onRemove}
          className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-white hover:bg-red-600"
        >
          <XIcon size={10} />
        </button>
      </div>
    );
  }

  return (
    <div
      onClick={() => inputRef.current?.click()}
      onDragOver={(e) => {
        e.preventDefault();
        setDrag(true);
      }}
      onDragLeave={() => setDrag(false)}
      onDrop={handleDrop}
      className={`border-2 border-dashed rounded-lg px-4 py-4 text-center cursor-pointer transition-all ${drag ? "border-blue-500 bg-blue-50" : "border-gray-300 bg-gray-50 hover:border-blue-400 hover:bg-blue-50"}`}
    >
      <div className="w-8 h-8 mx-auto mb-1.5 rounded-lg flex items-center justify-center bg-blue-100">
        <Icon className="w-4 h-4 text-blue-600" />
      </div>
      <p className="text-xs font-semibold text-gray-600">
        Drop or <span className="text-blue-600 underline">browse</span>
      </p>
      <p className="text-[10px] text-gray-400 mt-0.5">
        PDF or image · max 10 MB
      </p>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={(e) => e.target.files[0] && onChange(e.target.files[0])}
      />
    </div>
  );
};

export default HRDropZone;