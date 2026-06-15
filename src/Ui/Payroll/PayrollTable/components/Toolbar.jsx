import React from "react";
import ChevronDown from "./ChevronDown";
import { CIRCLES } from "../constants";

const Toolbar = ({
  forMonth,
  activeTab,
  setActiveTab,
  pendingCount,
  paidCount,
  search,
  setSearch,
  deptFilter,
  setDeptFilter,
  departments,
  empTypeFilter,
  setEmpTypeFilter,
  circleFilter,
  setCircleFilter,
  activeFiltersCount,
  clearAllFilters,
  filtered,
  employees,
  tabMap,
  exporting,
  onAttendance,
  onExport,
}) => (
  <div className="px-4 sm:px-6 pt-5 pb-0 flex flex-col gap-0">
    {/* Row 1: Tabs + Actions */}
    <div className="flex items-center justify-between gap-2 sm:gap-3 pb-4 border-b border-slate-100 flex-wrap">
      <div className="flex items-center bg-slate-100 rounded-[9px] p-[3px] gap-[2px]">
        {[
          { key: "pending", label: "Pending", count: pendingCount },
          { key: "paid", label: "Paid", count: paidCount },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-2 px-3 sm:px-4 py-[6px] rounded-[7px] text-[13px] transition-all ${
              activeTab === tab.key
                ? "bg-white text-slate-800 font-medium shadow-sm"
                : "text-slate-500 hover:text-slate-700 font-normal"
            }`}
          >
            {tab.label}
            <span
              className={`text-[11px] font-semibold px-[7px] py-[1px] rounded-full ${
                activeTab === tab.key
                  ? "bg-blue-50 text-blue-700"
                  : "bg-slate-200 text-slate-500"
              }`}
            >
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <span className="hidden sm:inline-flex items-center text-[12px] font-medium px-3 py-[5px] rounded-full bg-amber-50 border border-amber-200 text-amber-800 whitespace-nowrap">
          PT: {/february/i.test(forMonth || "") ? "₹300 (Feb)" : "₹200"} / month
        </span>

        <button
          onClick={onAttendance}
          className="inline-flex items-center gap-[6px] px-3 sm:px-4 py-[7px] rounded-lg text-[13px] font-medium bg-indigo-700 hover:bg-indigo-800 text-white transition-colors whitespace-nowrap"
        >
          <svg
            className="w-[14px] h-[14px] flex-shrink-0"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
          Attendance
        </button>

        <button
          onClick={onExport}
          disabled={exporting || filtered.length === 0}
          className="inline-flex items-center gap-[6px] px-3 sm:px-4 py-[7px] rounded-lg text-[13px] font-medium bg-emerald-700 hover:bg-emerald-800 text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
        >
          {exporting ? (
            <>
              <svg
                className="w-[14px] h-[14px] animate-spin flex-shrink-0"
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
              Exporting…
            </>
          ) : (
            <>
              <svg
                className="w-[14px] h-[14px] flex-shrink-0"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 10v6m0 0l-3-3m3 3l3-3M3 17V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z"
                />
              </svg>
              Export Excel
            </>
          )}
        </button>
      </div>
    </div>

    {/* Row 2: Filters */}
    <div className="flex items-center gap-2 flex-wrap py-3 border-b border-slate-100">
      <div className="relative">
        <svg
          className="w-[13px] h-[13px] text-slate-400 absolute left-[9px] top-1/2 -translate-y-1/2 pointer-events-none"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
        <input
          type="text"
          placeholder="Search name, ID…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-[30px] pr-7 py-[7px] text-[13px] border border-slate-200 rounded-lg bg-slate-50 focus:outline-none focus:ring-[3px] focus:ring-blue-100 focus:border-blue-300 focus:bg-white transition-all w-[160px] sm:w-[220px]"
        />
        {search && (
          <button
            onClick={() => setSearch("")}
            className="absolute right-[9px] top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 text-[16px] leading-none bg-transparent border-none cursor-pointer p-0"
          >
            ×
          </button>
        )}
      </div>

      <div className="w-px h-[22px] bg-slate-200 mx-[2px] flex-shrink-0 hidden sm:block" />

      <div className="relative inline-flex items-center">
        <select
          value={deptFilter}
          onChange={(e) => setDeptFilter(e.target.value)}
          className={`text-[13px] border rounded-lg pl-[10px] pr-[26px] py-[7px] appearance-none outline-none cursor-pointer transition-all focus:ring-[3px] focus:ring-blue-100 ${
            deptFilter !== "All"
              ? "border-blue-300 bg-blue-50 text-blue-900 font-medium focus:border-blue-400"
              : "border-slate-200 bg-slate-50 text-slate-700 hover:bg-white focus:border-blue-300"
          }`}
        >
          <option value="All">All departments</option>
          {departments
            .filter((d) => d !== "All")
            .map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
        </select>
        <ChevronDown />
      </div>

      <div className="relative inline-flex items-center">
        <select
          value={empTypeFilter}
          onChange={(e) => setEmpTypeFilter(e.target.value)}
          className={`text-[13px] border rounded-lg pl-[10px] pr-[26px] py-[7px] appearance-none outline-none cursor-pointer transition-all focus:ring-[3px] focus:ring-violet-100 ${
            empTypeFilter !== "All"
              ? "border-violet-300 bg-violet-50 text-violet-900 font-medium focus:border-violet-400"
              : "border-slate-200 bg-slate-50 text-slate-700 hover:bg-white focus:border-violet-300"
          }`}
        >
          <option value="All">All types</option>
          <option value="IT">IT</option>
          <option value="Telecom">Telecom</option>
          <option value="Other">Other</option>
        </select>
        <ChevronDown />
      </div>

      <div className="relative inline-flex items-center">
        <select
          value={circleFilter}
          onChange={(e) => setCircleFilter(e.target.value)}
          className={`text-[13px] border rounded-lg pl-[10px] pr-[26px] py-[7px] appearance-none outline-none cursor-pointer transition-all focus:ring-[3px] focus:ring-emerald-100 ${
            circleFilter !== "All"
              ? "border-emerald-300 bg-emerald-50 text-emerald-900 font-medium focus:border-emerald-400"
              : "border-slate-200 bg-slate-50 text-slate-700 hover:bg-white focus:border-emerald-300"
          }`}
        >
          <option value="All">All circles</option>
          {CIRCLES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <ChevronDown />
      </div>

      {activeFiltersCount > 0 && (
        <button
          onClick={clearAllFilters}
          className="inline-flex items-center gap-[5px] px-3 py-[6px] rounded-lg bg-red-50 border border-red-200 text-[12px] font-medium text-red-800 hover:bg-red-100 transition-colors whitespace-nowrap"
        >
          <svg
            className="w-[11px] h-[11px]"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
          Clear
          <span className="bg-red-200 text-red-900 rounded-full px-[6px] py-[1px] text-[11px] font-bold leading-none">
            {activeFiltersCount}
          </span>
        </button>
      )}

      <span className="ml-auto text-[12px] text-slate-400 whitespace-nowrap">
        {filtered.length} of{" "}
        {employees.filter((e) => tabMap[activeTab]?.includes(e.status)).length}
      </span>
    </div>

    {/* Row 3: Active filter tags */}
    {activeFiltersCount > 0 && (
      <div className="flex items-center gap-[6px] flex-wrap py-[10px] border-b border-slate-100">
        {search.trim() && (
          <span className="inline-flex items-center gap-[4px] text-[12px] px-[10px] py-[3px] rounded-full bg-blue-50 border border-blue-200 text-blue-800">
            &ldquo;{search.trim()}&rdquo;
            <button
              onClick={() => setSearch("")}
              className="ml-[2px] opacity-50 hover:opacity-100 text-[14px] leading-none bg-transparent border-none cursor-pointer text-blue-800 p-0"
            >
              ×
            </button>
          </span>
        )}
        {deptFilter !== "All" && (
          <span className="inline-flex items-center gap-[4px] text-[12px] px-[10px] py-[3px] rounded-full bg-slate-100 border border-slate-200 text-slate-700">
            {deptFilter}
            <button
              onClick={() => setDeptFilter("All")}
              className="ml-[2px] opacity-50 hover:opacity-100 text-[14px] leading-none bg-transparent border-none cursor-pointer text-slate-700 p-0"
            >
              ×
            </button>
          </span>
        )}
        {empTypeFilter !== "All" && (
          <span className="inline-flex items-center gap-[4px] text-[12px] px-[10px] py-[3px] rounded-full bg-violet-50 border border-violet-200 text-violet-800">
            {empTypeFilter}
            <button
              onClick={() => setEmpTypeFilter("All")}
              className="ml-[2px] opacity-50 hover:opacity-100 text-[14px] leading-none bg-transparent border-none cursor-pointer text-violet-800 p-0"
            >
              ×
            </button>
          </span>
        )}
        {circleFilter !== "All" && (
          <span className="inline-flex items-center gap-[4px] text-[12px] px-[10px] py-[3px] rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800">
            {circleFilter}
            <button
              onClick={() => setCircleFilter("All")}
              className="ml-[2px] opacity-50 hover:opacity-100 text-[14px] leading-none bg-transparent border-none cursor-pointer text-emerald-800 p-0"
            >
              ×
            </button>
          </span>
        )}
      </div>
    )}
  </div>
);

export default Toolbar;
