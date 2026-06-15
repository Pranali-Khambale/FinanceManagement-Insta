import React from "react";

const btnBase = {
  fontSize: 11,
  fontWeight: 600,
  cursor: "pointer",
  border: "1px solid #e2e8f0",
  borderRadius: 6,
  background: "#fff",
  color: "#374151",
};

const ModalFooter = ({
  page,
  totalPages,
  filtered,
  onPrev,
  onNext,
  onPageSelect,
  onClose,
  PAGE_SIZE,
}) => (
  <div
    style={{
      padding: "12px 16px",
      borderTop: "1px solid #f1f5f9",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      flexShrink: 0,
      background: "#fff",
      flexWrap: "wrap",
      gap: 8,
    }}
  >
    <span style={{ fontSize: 12, color: "#94a3b8" }}>
      Showing{" "}
      <strong style={{ color: "#374151" }}>
        {filtered.length === 0 ? 0 : (page - 1) * PAGE_SIZE + 1}–
        {Math.min(page * PAGE_SIZE, filtered.length)}
      </strong>{" "}
      of <strong style={{ color: "#374151" }}>{filtered.length}</strong> events
    </span>

    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 4,
        flexWrap: "wrap",
      }}
    >
      {totalPages > 1 && (
        <>
          <button
            onClick={onPrev}
            disabled={page === 1}
            style={{
              ...btnBase,
              padding: "5px 10px",
              color: page === 1 ? "#d1d5db" : "#374151",
            }}
          >
            ← Prev
          </button>

          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
            const pg = Math.max(1, Math.min(page - 2, totalPages - 4)) + i;
            return (
              <button
                key={pg}
                onClick={() => onPageSelect(pg)}
                style={{
                  width: 28,
                  height: 28,
                  fontSize: 11,
                  fontWeight: 600,
                  cursor: "pointer",
                  border: pg === page ? "none" : "1px solid #e2e8f0",
                  borderRadius: 6,
                  background: pg === page ? "#1a3c6e" : "#fff",
                  color: pg === page ? "#fff" : "#374151",
                }}
              >
                {pg}
              </button>
            );
          })}

          <button
            onClick={onNext}
            disabled={page === totalPages}
            style={{
              ...btnBase,
              padding: "5px 10px",
              color: page === totalPages ? "#d1d5db" : "#374151",
            }}
          >
            Next →
          </button>
        </>
      )}

      <button
        onClick={onClose}
        style={{
          padding: "6px 16px",
          fontSize: 12,
          fontWeight: 600,
          cursor: "pointer",
          border: "1px solid #e2e8f0",
          borderRadius: 8,
          background: "#fff",
          color: "#374151",
          marginLeft: 4,
        }}
      >
        ✕ Close
      </button>
    </div>
  </div>
);

export default ModalFooter;
