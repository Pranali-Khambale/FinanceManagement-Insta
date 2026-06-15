const STEP_LABELS = ["Select type", "Fill details", "Done"];

export default function StepIndicator({ step, pt }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 6,
        padding: "14px 22px 0",
      }}
    >
      {STEP_LABELS.map((l, i) => {
        const num = i + 1;
        const done = step > num;
        const active = step === num;
        return (
          <div
            key={l}
            style={{ display: "flex", alignItems: "center", gap: 6 }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
              <div
                style={{
                  width: 22,
                  height: 22,
                  borderRadius: "50%",
                  fontSize: 10,
                  fontWeight: 700,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  background: done ? "#dcfce7" : active ? pt.color : "#f1f5f9",
                  color: done ? "#16a34a" : active ? "#fff" : "#94a3b8",
                  transition: "all 0.2s",
                  flexShrink: 0,
                }}
              >
                {done ? (
                  <svg
                    width="10"
                    height="10"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                  >
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                ) : (
                  num
                )}
              </div>
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  color: active ? "#334155" : done ? "#64748b" : "#94a3b8",
                }}
              >
                {l}
              </span>
            </div>
            {i < STEP_LABELS.length - 1 && (
              <div style={{ width: 20, height: 1, background: "#e2e8f0" }} />
            )}
          </div>
        );
      })}
    </div>
  );
}
