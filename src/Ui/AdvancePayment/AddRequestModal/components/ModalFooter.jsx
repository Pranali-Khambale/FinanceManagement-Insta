import { CheckCircle2, ArrowRight, Loader2 } from "lucide-react";

export default function ModalFooter({
  step,
  pt,
  submitting,
  onClose,
  setStep,
  submit,
}) {
  if (step === 3) {
    return (
      <button
        onClick={onClose}
        style={{
          flex: 1,
          padding: "11px 16px",
          borderRadius: 10,
          border: `1.5px solid ${pt.color}40`,
          background: pt.color + "0e",
          color: pt.color,
          fontSize: 13,
          fontWeight: 700,
          cursor: "pointer",
          animation: "fadeUp .3s ease .6s both",
        }}
      >
        Done
      </button>
    );
  }

  return (
    <>
      <button
        onClick={onClose}
        disabled={submitting}
        style={{
          padding: "10px 14px",
          borderRadius: 9,
          border: "1.5px solid #e2e8f0",
          background: "#fff",
          color: "#64748b",
          fontSize: 13,
          fontWeight: 600,
          cursor: "pointer",
        }}
      >
        Cancel
      </button>
      {step === 2 && (
        <button
          onClick={() => setStep(1)}
          disabled={submitting}
          style={{
            padding: "10px 14px",
            borderRadius: 9,
            border: "1.5px solid #e2e8f0",
            background: "#fff",
            color: "#64748b",
            fontSize: 13,
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          ← Back
        </button>
      )}
      <button
        onClick={step === 1 ? () => setStep(2) : submit}
        disabled={submitting}
        style={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 6,
          padding: "10px 16px",
          borderRadius: 9,
          border: "none",
          background: submitting ? "#cbd5e1" : pt.color,
          color: submitting ? "#94a3b8" : "#fff",
          fontSize: 13,
          fontWeight: 700,
          cursor: submitting ? "not-allowed" : "pointer",
          boxShadow: submitting ? "none" : `0 4px 14px ${pt.color}40`,
        }}
      >
        {submitting ? (
          <>
            <Loader2
              size={14}
              style={{ animation: "spin 1s linear infinite" }}
            />{" "}
            Submitting…
          </>
        ) : step === 1 ? (
          <>
            Continue <ArrowRight size={14} />
          </>
        ) : (
          <>
            <CheckCircle2 size={14} /> Submit request
          </>
        )}
      </button>
    </>
  );
}
