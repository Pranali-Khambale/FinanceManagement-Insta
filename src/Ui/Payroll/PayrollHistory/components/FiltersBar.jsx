import React from "react";

const selectStyle = {
  height: 32,
  fontSize: 12,
  border: "1px solid #e2e8f0",
  borderRadius: 8,
  padding: "0 10px",
  background: "#f8fafc",
  color: "#374151",
  outline: "none",
  minWidth: 0,
  maxWidth: "100%",
};

const FiltersBar = ({
  search,
  onSearchChange,
  monthFilter,
  onMonthChange,
  months,
  deptFilter,
  onDeptChange,
  departments,
  statusFilt,
  onStatusChange,
  statusOptions,
  loading,
  filteredCount,
}) => (
  <div
    style={{
      padding: "12px 16px",
      borderBottom: "1px solid #f1f5f9",
      display: "flex",
      alignItems: "center",
      gap: 8,
      flexWrap: "wrap",
      flexShrink: 0,
      background: "#fff",
    }}
  >
    <div style={{ position: "relative", flexShrink: 0 }}>
      <svg
        style={{
          position: "absolute",
          left: 9,
          top: "50%",
          transform: "translateY(-50%)",
          color: "#94a3b8",
          pointerEvents: "none",
        }}
        width="13"
        height="13"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
        />
      </svg>
      <input
        type="text"
        placeholder="Search name or ID…"
        value={search}
        onChange={(e) => onSearchChange(e.target.value)}
        style={{
          paddingLeft: 30,
          paddingRight: 10,
          height: 32,
          fontSize: 12,
          border: "1px solid #e2e8f0",
          borderRadius: 8,
          background: "#f8fafc",
          color: "#374151",
          outline: "none",
          width: 160,
          maxWidth: "100%",
        }}
      />
    </div>

    <select
      value={monthFilter}
      onChange={(e) => onMonthChange(e.target.value)}
      style={selectStyle}
    >
      {months.map((o) => (
        <option key={o}>{o}</option>
      ))}
    </select>

    <select
      value={deptFilter}
      onChange={(e) => onDeptChange(e.target.value)}
      style={selectStyle}
    >
      {departments.map((o) => (
        <option key={o}>{o}</option>
      ))}
    </select>

    <select
      value={statusFilt}
      onChange={(e) => onStatusChange(e.target.value)}
      style={selectStyle}
    >
      {statusOptions.map((o) => (
        <option key={o}>{o}</option>
      ))}
    </select>

    <span
      style={{
        marginLeft: "auto",
        fontSize: 11,
        color: "#94a3b8",
        whiteSpace: "nowrap",
      }}
    >
      {loading
        ? "Loading…"
        : `${filteredCount} event${filteredCount !== 1 ? "s" : ""}`}
    </span>
  </div>
);

export default FiltersBar;
