import React from "react";

const ChevronDown = () => (
  <svg
    className="w-3 h-3 text-slate-400 absolute right-[8px] top-1/2 -translate-y-1/2 pointer-events-none"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M19 9l-7 7-7-7"
    />
  </svg>
);

export default ChevronDown;
