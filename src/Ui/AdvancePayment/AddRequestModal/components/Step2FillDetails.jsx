import { AlertCircle } from "lucide-react";
import { Field, Inp } from "./FormPrimitives";
import { SectionDivider } from "./SummaryComponents";
import ApprovedPersonSection from "./ApprovedPersonSection";
import { ScreenshotUpload, ProofUpload } from "./FileUploadFields";

function TextareaField({ value, onChange, placeholder, error }) {
  return (
    <>
      <textarea
        rows={3}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        style={{
          width: "100%",
          padding: "9px 12px",
          borderRadius: 9,
          fontSize: 13,
          border: `1.5px solid ${error ? "#fca5a5" : "#e2e8f0"}`,
          background: error ? "#fff5f5" : "#fff",
          color: "#1e293b",
          fontFamily: "inherit",
          resize: "none",
          outline: "none",
          boxSizing: "border-box",
        }}
      />
      {error && (
        <p
          style={{
            display: "flex",
            alignItems: "center",
            gap: 4,
            margin: "4px 0 0",
            fontSize: 11,
            color: "#ef4444",
          }}
        >
          <AlertCircle size={10} /> {error}
        </p>
      )}
    </>
  );
}

function OrgToVendorFields({ form, errors, set }) {
  return (
    <>
      <p
        style={{
          margin: "0 0 4px",
          fontSize: 10,
          fontWeight: 700,
          color: "#94a3b8",
          textTransform: "uppercase",
          letterSpacing: ".07em",
        }}
      >
        Vendor details
      </p>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        <Field label="Vendor name" required error={errors.toVendorName}>
          <Inp
            placeholder="Acme Supplies Pvt Ltd"
            value={form.toVendorName}
            onChange={set("toVendorName")}
            error={errors.toVendorName}
          />
        </Field>
        <Field label="GST number" error={errors.toVendorGST}>
          <Inp
            placeholder="27AABCU9603R1ZX"
            value={form.toVendorGST}
            onChange={set("toVendorGST")}
            error={errors.toVendorGST}
            extraStyle={{ textTransform: "uppercase" }}
          />
        </Field>
        <Field label="PO / reference" error={errors.toVendorRef}>
          <Inp
            placeholder="PO-2026-0041"
            value={form.toVendorRef}
            onChange={set("toVendorRef")}
            error={errors.toVendorRef}
          />
        </Field>
        <Field label="Amount (₹)" required error={errors.toVendorAmount}>
          <Inp
            type="number"
            min="1"
            placeholder="45000"
            value={form.toVendorAmount}
            onChange={set("toVendorAmount")}
            error={errors.toVendorAmount}
          />
        </Field>
      </div>
      <Field label="Reason" required error={errors.toVendorReason}>
        <TextareaField
          value={form.toVendorReason}
          onChange={set("toVendorReason")}
          placeholder="Describe the reason for this vendor advance…"
          error={errors.toVendorReason}
        />
      </Field>
    </>
  );
}

function EmployeeFields({ ptKey, pt, form, errors, set }) {
  return (
    <>
      <p
        style={{
          margin: "0 0 4px",
          fontSize: 10,
          fontWeight: 700,
          color: "#94a3b8",
          textTransform: "uppercase",
          letterSpacing: ".07em",
        }}
      >
        {ptKey === "emp_to_emp" ? "Requesting employee" : "Employee details"}
      </p>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        <Field label="Employee ID" required error={errors.empId}>
          <Inp
            placeholder="Insta-260401"
            value={form.empId}
            onChange={set("empId")}
            error={errors.empId}
          />
        </Field>
        <Field label="Full name" required error={errors.name}>
          <Inp
            placeholder="John Doe"
            value={form.name}
            onChange={set("name")}
            error={errors.name}
          />
        </Field>
        <Field label="Department" required error={errors.dept}>
          <Inp
            placeholder="Engineering"
            value={form.dept}
            onChange={set("dept")}
            error={errors.dept}
          />
        </Field>
        <Field label="Amount (₹)" required error={errors.amount}>
          <Inp
            type="number"
            min="1"
            placeholder="10000"
            value={form.amount}
            onChange={set("amount")}
            error={errors.amount}
          />
        </Field>
      </div>

      {ptKey === "emp_to_emp" && (
        <>
          <SectionDivider label="Recipient employee" color={pt.color} />
          <div
            style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}
          >
            <Field label="Recipient emp ID" required error={errors.toEmpId}>
              <Inp
                placeholder="Insta-260401"
                value={form.toEmpId}
                onChange={set("toEmpId")}
                error={errors.toEmpId}
              />
            </Field>
            <Field label="Recipient name" required error={errors.toEmpName}>
              <Inp
                placeholder="Jane Smith"
                value={form.toEmpName}
                onChange={set("toEmpName")}
                error={errors.toEmpName}
              />
            </Field>
            <Field label="Recipient department" error={errors.toEmpDept}>
              <Inp
                placeholder="Design"
                value={form.toEmpDept}
                onChange={set("toEmpDept")}
                error={errors.toEmpDept}
              />
            </Field>
          </div>
        </>
      )}

      {ptKey === "other" && (
        <>
          <SectionDivider label="Vendor / external" color={pt.color} />
          <div
            style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}
          >
            <Field label="Vendor name" required error={errors.vendorName}>
              <Inp
                placeholder="LexPro LLP"
                value={form.vendorName}
                onChange={set("vendorName")}
                error={errors.vendorName}
              />
            </Field>
            <Field label="Reference / invoice" error={errors.vendorRef}>
              <Inp
                placeholder="INV-001"
                value={form.vendorRef}
                onChange={set("vendorRef")}
                error={errors.vendorRef}
              />
            </Field>
          </div>
        </>
      )}

      <Field label="Reason" required error={errors.reason}>
        <TextareaField
          value={form.reason}
          onChange={set("reason")}
          placeholder="Describe the reason for this advance request…"
          error={errors.reason}
        />
      </Field>
    </>
  );
}

export default function Step2FillDetails({
  ptKey,
  pt,
  form,
  errors,
  set,
  screenshotName,
  screenshotPreview,
  proofName,
  handleScreenshot,
  handleProof,
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {ptKey === "org_to_vendor" ? (
        <OrgToVendorFields form={form} errors={errors} set={set} />
      ) : (
        <EmployeeFields
          ptKey={ptKey}
          pt={pt}
          form={form}
          errors={errors}
          set={set}
        />
      )}
      <ApprovedPersonSection form={form} errors={errors} set={set} />
      <ScreenshotUpload
        pt={pt}
        screenshotName={screenshotName}
        screenshotPreview={screenshotPreview}
        errors={errors}
        onChange={handleScreenshot}
      />
      <ProofUpload pt={pt} proofName={proofName} onChange={handleProof} />
    </div>
  );
}
