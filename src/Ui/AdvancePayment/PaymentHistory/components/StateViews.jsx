import { FileText, AlertTriangle } from "lucide-react";
import { T } from "../constants/theme";

export function EmptyState({ search, onClear }) {
  return (
    <div style={{ padding: "60px 16px", textAlign: "center" }}>
      <div
        style={{
          width: 52,
          height: 52,
          borderRadius: 14,
          background: "#EEEEEC",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          margin: "0 auto 14px",
        }}
      >
        <FileText size={22} style={{ color: "#ADADAA" }} />
      </div>
      <p
        style={{
          fontSize: 15,
          fontWeight: 600,
          color: "#4A4845",
          marginBottom: 6,
        }}
      >
        No records found
      </p>
      <p style={{ fontSize: 13, color: "#888885", marginBottom: 18 }}>
        {search
          ? `No results for "${search}"`
          : "No salary advance history yet."}
      </p>
      {search && (
        <button
          className="ph-btn"
          onClick={onClear}
          style={{
            padding: "7px 20px",
            borderRadius: 6,
            background: "#EEEEEC",
            color: "#323130",
            border: "1px solid #CECEC9",
            fontSize: 12,
            fontWeight: 500,
          }}
        >
          Clear search
        </button>
      )}
    </div>
  );
}

export function ErrState({ msg, onRetry }) {
  return (
    <div style={{ padding: "60px 16px", textAlign: "center" }}>
      <div
        style={{
          width: 52,
          height: 52,
          borderRadius: 14,
          background: T.r50,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          margin: "0 auto 14px",
        }}
      >
        <AlertTriangle size={22} style={{ color: T.r500 }} />
      </div>
      <p
        style={{
          fontSize: 15,
          fontWeight: 600,
          color: "#4A4845",
          marginBottom: 6,
        }}
      >
        Failed to load data
      </p>
      <p style={{ fontSize: 13, color: "#888885", marginBottom: 18 }}>{msg}</p>
      <button
        className="ph-btn"
        onClick={onRetry}
        style={{
          padding: "8px 24px",
          borderRadius: 6,
          background: T.t500,
          color: "#fff",
          border: "none",
          fontSize: 12,
          fontWeight: 600,
        }}
      >
        Retry
      </button>
    </div>
  );
}

export function SkeletonRows({ n = 6 }) {
  return (
    <div
      style={{
        padding: "14px",
        display: "flex",
        flexDirection: "column",
        gap: 9,
      }}
    >
      {Array.from({ length: n }).map((_, i) => (
        <div
          key={i}
          className="ph-shim"
          style={{ height: 62, borderRadius: 8, animationDelay: `${i * 70}ms` }}
        />
      ))}
    </div>
  );
}
