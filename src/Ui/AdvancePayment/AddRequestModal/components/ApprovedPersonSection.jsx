import { useState, useEffect } from "react";
import { ShieldCheck } from "lucide-react";
import { Field, Inp } from "./FormPrimitives";
import { SectionDivider } from "./SummaryComponents";

export default function ApprovedPersonSection({ form, errors, set }) {
  const [isMobile, setIsMobile] = useState(
    typeof window !== "undefined" && window.innerWidth <= 480,
  );
  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth <= 480);
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, []);

  return (
    <>
      <SectionDivider
        label="Approved by"
        color="#7c3aed"
        icon={<ShieldCheck size={10} />}
      />
      <div
        style={{
          display: "grid",
          gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr",
          gap: 10,
        }}
      >
        <Field label="Approver name" required error={errors.approverName}>
          <Inp
            placeholder="Ramesh Iyer"
            value={form.approverName}
            onChange={set("approverName")}
            error={errors.approverName}
          />
        </Field>
        <Field label="Approver ID" required error={errors.approverId}>
          <Inp
            placeholder="Insta-100201"
            value={form.approverId}
            onChange={set("approverId")}
            error={errors.approverId}
          />
        </Field>
        <Field label="Designation" error={errors.approverDesignation}>
          <Inp
            placeholder="HR Manager"
            value={form.approverDesignation}
            onChange={set("approverDesignation")}
            error={errors.approverDesignation}
          />
        </Field>
      </div>
    </>
  );
}
