import React from "react";
import { fmtCompact } from "../utils";

const StatCard = ({ label, value, accent }) => (
  <div
    style={{
      background: "rgba(255,255,255,.08)",
      border: "1px solid rgba(255,255,255,.1)",
      borderRadius: 10,
      padding: "12px 14px",
    }}
  >
    <p
      style={{
        margin: "0 0 4px",
        fontSize: 22,
        fontWeight: 800,
        color: accent,
      }}
    >
      {value}
    </p>
    <p
      style={{
        margin: 0,
        fontSize: 10,
        fontWeight: 700,
        color: "rgba(255,255,255,.45)",
        letterSpacing: "0.08em",
      }}
    >
      {label}
    </p>
  </div>
);

const ModalHeader = ({
  loading,
  allRecords,
  filtered,
  totalGross,
  totalDed,
  totalNet,
  onExport,
  onClose,
}) => (
  <div
    style={{
      background: "linear-gradient(135deg,#1a3c6e,#1e56a0)",
      padding: "18px 20px 0",
      flexShrink: 0,
    }}
  >
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: 18,
        flexWrap: "wrap",
        gap: 10,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: 10,
            background: "rgba(255,255,255,.15)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <svg
            width="18"
            height="18"
            fill="none"
            stroke="#fff"
            strokeWidth="2"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
            />
          </svg>
        </div>
        <div>
          <h2
            style={{ margin: 0, color: "#fff", fontSize: 17, fontWeight: 700 }}
          >
            Payroll History
          </h2>
          <p
            style={{
              margin: "2px 0 0",
              color: "rgba(255,255,255,.55)",
              fontSize: 12,
            }}
          >
            Combined salary run history · live view
          </p>
        </div>
      </div>

      <div style={{ display: "flex", gap: 8 }}>
        <button
          onClick={onExport}
          disabled={loading || filtered.length === 0}
          style={{
            background: "rgba(255,255,255,.15)",
            border: "none",
            cursor:
              loading || filtered.length === 0 ? "not-allowed" : "pointer",
            color: "#fff",
            borderRadius: 8,
            padding: "7px 14px",
            fontSize: 12,
            fontWeight: 600,
            display: "flex",
            alignItems: "center",
            gap: 6,
            opacity: loading || filtered.length === 0 ? 0.5 : 1,
          }}
        >
          <svg
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
              d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
            />
          </svg>
          Export {!loading && filtered.length > 0 ? filtered.length : ""}
        </button>
        <button
          onClick={onClose}
          aria-label="Close"
          style={{
            background: "rgba(255,255,255,.15)",
            border: "none",
            cursor: "pointer",
            color: "#fff",
            width: 32,
            height: 32,
            borderRadius: 8,
            fontSize: 16,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          ✕
        </button>
      </div>
    </div>

    {!loading && (
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(100px, 1fr))",
          gap: 10,
          paddingBottom: 18,
        }}
      >
        {[
          { label: "TOTAL", value: allRecords.length, accent: "#93c5fd" },
          {
            label: "PAID",
            value: allRecords.filter((r) => r.status === "Paid").length,
            accent: "#6ee7b7",
          },
          {
            label: "PENDING",
            value: allRecords.filter((r) => r.status === "Pending").length,
            accent: "#fcd34d",
          },
          {
            label: "REJECTED",
            value: allRecords.filter((r) => r.status === "Rejected").length,
            accent: "#fca5a5",
          },
        ].map((card) => (
          <StatCard key={card.label} {...card} />
        ))}
      </div>
    )}

    {!loading && filtered.length > 0 && (
      <div
        style={{
          display: "flex",
          margin: "0 -20px",
          background: "rgba(0,0,0,.2)",
          padding: "10px 20px",
          flexWrap: "wrap",
          gap: 4,
        }}
      >
        {[
          {
            label: "GROSS",
            value: fmtCompact(totalGross),
            color: "rgba(255,255,255,.9)",
          },
          {
            label: "DEDUCTIONS",
            value: `− ${fmtCompact(totalDed)}`,
            color: "#fca5a5",
          },
          { label: "NET PAID", value: fmtCompact(totalNet), color: "#6ee7b7" },
        ].map(({ label, value, color }, i, arr) => (
          <div
            key={label}
            style={{
              flex: "1 1 80px",
              textAlign: "center",
              borderRight:
                i < arr.length - 1 ? "1px solid rgba(255,255,255,.1)" : "none",
              padding: "0 4px",
            }}
          >
            <p
              style={{
                margin: 0,
                fontSize: 10,
                color: "rgba(255,255,255,.4)",
                letterSpacing: "0.06em",
              }}
            >
              {label}
            </p>
            <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color }}>
              {value}
            </p>
          </div>
        ))}
      </div>
    )}
  </div>
);

export default ModalHeader;
