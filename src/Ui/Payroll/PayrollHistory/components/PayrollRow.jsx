import React from "react";
import {
  avatarColor,
  initials,
  fmtINR,
  fmtCompact,
  timeAgoLabel,
  formatDate,
} from "../utils";
import StatusBadge from "./StatusBadge";
import DetailPanel from "./DetailPanel";

const PayrollRow = ({ rec, expanded, onToggle }) => {
  const av = avatarColor(rec.name);
  const timeAgo = timeAgoLabel(rec.paidAt);

  return (
    <div style={{ borderBottom: "1px solid #f1f5f9" }}>
      <div
        onClick={onToggle}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === "Enter" && onToggle()}
        style={{
          display: "flex",
          alignItems: "flex-start",
          gap: 12,
          padding: "14px 16px",
          cursor: "pointer",
          background: expanded ? "#f8fafc" : "transparent",
          transition: "background .15s",
        }}
        onMouseEnter={(e) => {
          if (!expanded) e.currentTarget.style.background = "#fafbfc";
        }}
        onMouseLeave={(e) => {
          if (!expanded) e.currentTarget.style.background = "transparent";
        }}
      >
        <div
          style={{
            width: 38,
            height: 38,
            borderRadius: "50%",
            flexShrink: 0,
            background: av.bg,
            color: av.color,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 13,
            fontWeight: 700,
          }}
        >
          {initials(rec.name)}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              flexWrap: "wrap",
              marginBottom: 5,
            }}
          >
            <span style={{ fontSize: 13, fontWeight: 700, color: "#1e293b" }}>
              {rec.name}
            </span>
            <span
              style={{
                background: "#f1f5f9",
                color: "#64748b",
                fontSize: 11,
                padding: "1px 7px",
                borderRadius: 4,
                fontFamily: "monospace",
              }}
            >
              {rec.employeeId}
            </span>
            {rec.department && (
              <span style={{ fontSize: 11, color: "#94a3b8" }}>
                🏢 {rec.department}
              </span>
            )}
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              flexWrap: "wrap",
              marginBottom: 6,
            }}
          >
            <StatusBadge status={rec.status} />
            <span
              style={{
                background: "#eff6ff",
                color: "#1d4ed8",
                fontSize: 11,
                padding: "3px 10px",
                borderRadius: 20,
                fontWeight: 600,
                whiteSpace: "nowrap",
              }}
            >
              {rec.forMonth}
            </span>
            {rec.pDays != null && (
              <span
                style={{
                  background: "#f0fdf4",
                  color: "#166534",
                  fontSize: 11,
                  padding: "3px 10px",
                  borderRadius: 20,
                  fontWeight: 600,
                  whiteSpace: "nowrap",
                }}
              >
                {rec.pDays}/{rec.monthDays || 30} days
              </span>
            )}
          </div>

          <p
            style={{
              margin: 0,
              fontSize: 12,
              color: "#64748b",
              lineHeight: 1.6,
            }}
          >
            Gross:{" "}
            <strong style={{ color: "#4f46e5" }}>
              {fmtINR(rec.grossEarned)}
            </strong>
            {"  ·  "}
            Deductions:{" "}
            <strong style={{ color: "#ef4444" }}>
              −{fmtINR(rec.totalDeduction)}
            </strong>
            {"  ·  "}
            Net:{" "}
            <strong style={{ color: "#059669" }}>
              {fmtINR(rec.netSalary)}
            </strong>
          </p>
        </div>

        <div
          style={{
            flexShrink: 0,
            textAlign: "right",
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-end",
            gap: 3,
          }}
        >
          {timeAgo && (
            <span style={{ fontSize: 11, color: "#94a3b8" }}>⏱ {timeAgo}</span>
          )}
          {rec.paidAt && (
            <span style={{ fontSize: 11, color: "#94a3b8" }}>
              {formatDate(rec.paidAt)}
            </span>
          )}
          <span
            style={{
              fontSize: 13,
              fontWeight: 700,
              color: "#1e293b",
              marginTop: 2,
            }}
          >
            {fmtCompact(rec.totalEarning)}
          </span>
          <span
            style={{
              fontSize: 11,
              color: "#94a3b8",
              display: "inline-block",
              transform: expanded ? "rotate(180deg)" : "rotate(0deg)",
              transition: "transform .2s",
            }}
          >
            ▾
          </span>
        </div>
      </div>

      {expanded && <DetailPanel rec={rec} />}
    </div>
  );
};

export default PayrollRow;
