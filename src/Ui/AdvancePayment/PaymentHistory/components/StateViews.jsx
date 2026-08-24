import { FileText, AlertTriangle } from "lucide-react";
import { T } from "../constants/theme";

const STATE_RESPONSIVE_CSS = `
@media (max-width: 360px) {
  .ph-state-wrap { padding: 28px 12px !important; }
  .ph-state-icon { width: 36px !important; height: 36px !important; margin-bottom: 8px !important; border-radius: 10px !important; }
  .ph-state-title { font-size: 13px !important; }
  .ph-state-msg { font-size: 11px !important; }
}
@media (min-width: 361px) and (max-width: 480px) {
  .ph-state-wrap { padding: 36px 16px !important; }
  .ph-state-icon { width: 44px !important; height: 44px !important; margin-bottom: 11px !important; }
}
`;

export function EmptyState({ search, onClear }) {
  return (
    <div
      className="ph-state-wrap"
      style={{ padding: "60px 16px", textAlign: "center" }}
    >
      <style>{STATE_RESPONSIVE_CSS}</style>
      <div
        className="ph-state-icon"
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
        className="ph-state-title"
        style={{
          fontSize: 15,
          fontWeight: 600,
          color: "#4A4845",
          marginBottom: 6,
        }}
      >
        No records found
      </p>
      <p
        className="ph-state-msg"
        style={{
          fontSize: 13,
          color: "#888885",
          marginBottom: 18,
          overflowWrap: "break-word",
        }}
      >
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
    <div
      className="ph-state-wrap"
      style={{ padding: "60px 16px", textAlign: "center" }}
    >
      <style>{STATE_RESPONSIVE_CSS}</style>
      <div
        className="ph-state-icon"
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
        className="ph-state-title"
        style={{
          fontSize: 15,
          fontWeight: 600,
          color: "#4A4845",
          marginBottom: 6,
        }}
      >
        Failed to load data
      </p>
      <p
        className="ph-state-msg"
        style={{
          fontSize: 13,
          color: "#888885",
          marginBottom: 18,
          overflowWrap: "break-word",
        }}
      >
        {msg}
      </p>
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
