import { createPortal } from "react-dom";
import { X, Plus } from "lucide-react";
import { PAYMENT_TYPES } from "../../../data/content";
import { useAddRequestForm } from "./hooks/useAddRequestForm";
import StepIndicator from "./components/StepIndicator";
import Step1TypeSelect from "./components/Step1TypeSelect";
import Step2FillDetails from "./components/Step2FillDetails";
import Step3Success from "./components/Step3Success";
import ModalFooter from "./components/ModalFooter";

const MODAL_STYLES = `
  @keyframes spin   { to { transform: rotate(360deg); } }
  @keyframes popIn  { 0%{transform:scale(.7);opacity:0} 60%{transform:scale(1.08)} 100%{transform:scale(1);opacity:1} }
  @keyframes fadeUp { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
  @keyframes fadeIn { from{opacity:0} to{opacity:1} }
`;

export default function AddRequestModal({ onClose, onAdd, linkToken = null }) {
  const {
    step,
    setStep,
    ptKey,
    setPtKey,
    form,
    set,
    screenshotName,
    screenshotFile,
    screenshotPreview,
    proofName,
    errors,
    submitting,
    result,
    handleScreenshot,
    handleProof,
    submit,
  } = useAddRequestForm({ onAdd, linkToken });

  const pt = PAYMENT_TYPES[ptKey];

  const modalContent = (
    <>
      <style>{MODAL_STYLES}</style>
      <div
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 9999,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "rgba(0,0,0,.5)",
          backdropFilter: "blur(4px)",
          WebkitBackdropFilter: "blur(4px)",
          padding: 16,
        }}
      >
        <div
          style={{
            background: "#fff",
            borderRadius: 18,
            width: "100%",
            maxWidth: 520,
            boxShadow: "0 25px 60px rgba(0,0,0,.2)",
            display: "flex",
            flexDirection: "column",
            maxHeight: "90vh",
            overflow: "hidden",
          }}
        >
          {step < 3 && (
            <div
              style={{
                padding: "18px 22px",
                borderBottom: "1px solid #f1f5f9",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                flexShrink: 0,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 9,
                    background: pt.color + "15",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Plus size={16} color={pt.color} />
                </div>
                <div>
                  <p
                    style={{
                      margin: 0,
                      fontSize: 14,
                      fontWeight: 700,
                      color: "#1e293b",
                    }}
                  >
                    New advance request
                  </p>
                  <p
                    style={{
                      margin: "2px 0 0",
                      fontSize: 11,
                      color: "#94a3b8",
                    }}
                  >
                    {step === 1
                      ? "Select a payment type to continue"
                      : `Type: ${pt.label}`}
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                style={{
                  width: 28,
                  height: 28,
                  border: "1.5px solid #e2e8f0",
                  borderRadius: 7,
                  background: "#fafafa",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#94a3b8",
                }}
              >
                <X size={14} />
              </button>
            </div>
          )}

          {step < 3 && <StepIndicator step={step} pt={pt} />}

          <div
            style={{
              overflowY: "auto",
              flex: 1,
              padding: step === 3 ? "32px 26px 12px" : "18px 22px",
            }}
          >
            {step === 1 && (
              <Step1TypeSelect ptKey={ptKey} setPtKey={setPtKey} />
            )}

            {step === 2 && (
              <Step2FillDetails
                ptKey={ptKey}
                pt={pt}
                form={form}
                errors={errors}
                set={set}
                screenshotName={screenshotName}
                screenshotPreview={screenshotPreview}
                proofName={proofName}
                handleScreenshot={handleScreenshot}
                handleProof={handleProof}
              />
            )}

            {step === 3 && result && (
              <Step3Success result={result} pt={pt} ptKey={ptKey} />
            )}
          </div>

          <div
            style={{
              padding: "14px 22px 18px",
              borderTop: step === 3 ? "none" : "1px solid #f1f5f9",
              background: "#fff",
              display: "flex",
              gap: 8,
              flexShrink: 0,
            }}
          >
            <ModalFooter
              step={step}
              pt={pt}
              submitting={submitting}
              onClose={onClose}
              setStep={setStep}
              submit={submit}
            />
          </div>
        </div>
      </div>
    </>
  );

  return createPortal(modalContent, document.body);
}
