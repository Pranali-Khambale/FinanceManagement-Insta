import { useState } from "react";
import advancePaymentService from "../../../../services/advancePaymentService";
import { validateForm, buildPayload, buildReceipt } from "../utils/formHelpers";

const INITIAL_FORM = {
  empId: "",
  name: "",
  dept: "",
  amount: "",
  reason: "",
  toEmpId: "",
  toEmpName: "",
  toEmpDept: "",
  vendorName: "",
  vendorRef: "",
  toVendorName: "",
  toVendorGST: "",
  toVendorRef: "",
  toVendorAmount: "",
  toVendorReason: "",
  approverName: "",
  approverId: "",
  approverDesignation: "",
};

export function useAddRequestForm({ onAdd, linkToken }) {
  const [step, setStep] = useState(1);
  const [ptKey, setPtKey] = useState("org_to_emp");
  const [form, setForm] = useState(INITIAL_FORM);
  const [screenshotName, setScreenshotName] = useState("");
  const [screenshotFile, setScreenshotFile] = useState(null);
  const [screenshotPreview, setScreenshotPreview] = useState(null);
  const [proofName, setProofName] = useState("");
  const [proofFile, setProofFile] = useState(null);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);

  const set = (k) => (e) => {
    setForm((f) => ({ ...f, [k]: e.target.value }));
    setErrors((er) => ({ ...er, [k]: "" }));
  };

  const handleScreenshot = (e) => {
    const f = e.target.files[0];
    if (!f) return;
    setScreenshotName(f.name);
    setScreenshotFile(f);
    setErrors((er) => ({ ...er, screenshot: "" }));
    const reader = new FileReader();
    reader.onload = (ev) => setScreenshotPreview(ev.target.result);
    reader.readAsDataURL(f);
  };

  const handleProof = (e) => {
    const f = e.target.files[0];
    if (f) {
      setProofName(f.name);
      setProofFile(f);
    }
  };

  const submit = async () => {
    const er = validateForm(ptKey, form, screenshotFile);
    if (Object.keys(er).length) {
      setErrors(er);
      return;
    }
    setSubmitting(true);
    try {
      const payload = buildPayload(ptKey, form);
      const res = await advancePaymentService.createRequest(
        payload,
        screenshotFile,
        proofFile || null,
        null,
        linkToken,
      );
      const receipt = buildReceipt(
        ptKey,
        form,
        res,
        screenshotName,
        screenshotFile,
        proofName,
        proofFile,
      );
      if (onAdd) await onAdd(receipt);
      setResult(receipt);
      setStep(3);
    } catch (err) {
      alert(err.message || "Failed to submit request. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return {
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
    proofFile,
    errors,
    submitting,
    result,
    handleScreenshot,
    handleProof,
    submit,
  };
}
