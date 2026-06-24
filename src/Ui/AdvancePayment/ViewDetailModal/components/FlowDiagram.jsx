// ─────────────────────────────────────────────────────────────────────────────
// FILE: src/Ui/AdvancePayment/ViewDetailModal/components/FlowDiagram.jsx
// ─────────────────────────────────────────────────────────────────────────────
import { ArrowRight } from "lucide-react";
import { Avatar } from "./Primitives";
import { fmt } from "../utils";

// All sizing is handled via inline styles so it responds purely to the
// parent container width (the modal card) rather than the viewport.
// The wrapper uses a min-width:0 + overflow:hidden guard so nothing bleeds.
const FLOW_RESPONSIVE_CSS = `
@media (max-width: 380px) {
  .ph-flow-wrap      { padding: 10px 6px !important; gap: 2px !important; }
  .ph-flow-node-icon { width: 34px !important; height: 34px !important; }
  .ph-flow-node-label{ font-size: 10px !important; max-width: 62px !important; }
  .ph-flow-node-sub  { font-size: 9px  !important; }
  .ph-flow-arrow-line{ width: 14px !important; }
  .ph-flow-amount-pill{ font-size: 9px !important; padding: 2px 5px !important; }
  .ph-flow-arrow-wrap { padding: 0 2px !important; }
}
@media (min-width: 381px) and (max-width: 480px) {
  .ph-flow-wrap      { padding: 12px 8px !important; gap: 4px !important; }
  .ph-flow-node-icon { width: 38px !important; height: 38px !important; }
  .ph-flow-node-label{ font-size: 11px !important; max-width: 76px !important; }
  .ph-flow-arrow-line{ width: 18px !important; }
  .ph-flow-arrow-wrap { padding: 0 3px !important; }
}
`;

function OrgBox({ pt }) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 6,
        minWidth: 0,
      }}
    >
      <div
        className="ph-flow-node-icon"
        style={{
          width: 44,
          height: 44,
          borderRadius: "50%",
          background: pt.lightBg,
          flexShrink: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke={pt.color}
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <rect x="2" y="7" width="9" height="14" rx="1.5" />
          <path d="M16 3h5v18h-5" />
          <line x1="6" y1="11" x2="7" y2="11" />
          <line x1="6" y1="15" x2="7" y2="15" />
        </svg>
      </div>
      <div style={{ textAlign: "center" }}>
        <p
          className="ph-flow-node-label"
          style={{
            margin: 0,
            fontSize: 12,
            fontWeight: 700,
            color: "#334155",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            maxWidth: 80,
          }}
        >
          Organization
        </p>
        <p
          className="ph-flow-node-sub"
          style={{ margin: 0, fontSize: 10, color: "#94a3b8" }}
        >
          Company
        </p>
      </div>
    </div>
  );
}

function VendorBox({ vendorName, vendorRef, pt }) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 6,
        minWidth: 0,
      }}
    >
      <div
        className="ph-flow-node-icon"
        style={{
          width: 44,
          height: 44,
          borderRadius: "50%",
          background: pt.lightBg,
          flexShrink: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke={pt.color}
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="12" cy="12" r="10" />
          <path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
        </svg>
      </div>
      <div style={{ textAlign: "center" }}>
        <p
          className="ph-flow-node-label"
          style={{
            margin: 0,
            fontSize: 12,
            fontWeight: 700,
            color: "#334155",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            maxWidth: 80,
          }}
        >
          {vendorName || "Vendor"}
        </p>
        <p
          className="ph-flow-node-sub"
          style={{ margin: 0, fontSize: 10, color: "#94a3b8" }}
        >
          {vendorRef || "External"}
        </p>
      </div>
    </div>
  );
}

function EmpBox({ name, id, colorKey = "indigo" }) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 6,
        minWidth: 0,
      }}
    >
      <Avatar name={name} size="lg" colorKey={colorKey} />
      <div style={{ textAlign: "center" }}>
        <p
          className="ph-flow-node-label"
          style={{
            margin: 0,
            fontSize: 12,
            fontWeight: 700,
            color: "#334155",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            maxWidth: 80,
          }}
        >
          {name}
        </p>
        <p
          className="ph-flow-node-sub"
          style={{ margin: 0, fontSize: 10, color: "#94a3b8" }}
        >
          {id}
        </p>
      </div>
    </div>
  );
}

function AmountArrow({ amount, pt }) {
  return (
    <div
      className="ph-flow-arrow-wrap"
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 5,
        flexShrink: 0,
        padding: "0 6px",
      }}
    >
      <div
        className="ph-flow-amount-pill"
        style={{
          background: pt.lightBg,
          color: pt.textColor,
          padding: "3px 8px",
          borderRadius: 99,
          fontSize: 10,
          fontWeight: 700,
          whiteSpace: "nowrap",
          border: `1px solid ${pt.borderColor}`,
        }}
      >
        {fmt(amount)}
      </div>
      <div style={{ display: "flex", alignItems: "center", color: pt.color }}>
        <div
          className="ph-flow-arrow-line"
          style={{ width: 24, height: 2, background: pt.color }}
        />
        <ArrowRight size={13} />
      </div>
    </div>
  );
}

export default function FlowDiagram({ req, pt }) {
  const paymentType = req.paymentType || req.payment_type_key;
  const empName = req.name || req.emp_name;
  const empId = req.empId || req.emp_id;
  const toEmpName = req.toEmpName || req.to_emp_name;
  const toEmpId = req.toEmpId || req.to_emp_id;
  const vendorName = req.vendorName || req.vendor_name || req.to_vendor_name;
  const vendorRef = req.vendorRef || req.vendor_ref || req.to_vendor_ref;

  const wrap = {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    borderRadius: 16,
    padding: "14px 10px",
    border: `1px solid ${pt.borderColor}`,
    background: pt.lightBg,
    overflow: "hidden",
  };

  return (
    <>
      <style>{FLOW_RESPONSIVE_CSS}</style>

      {paymentType === "org_to_emp" && (
        <div className="ph-flow-wrap" style={wrap}>
          <OrgBox pt={pt} />
          <AmountArrow amount={req.amount} pt={pt} />
          <EmpBox name={empName} id={empId} colorKey="indigo" />
        </div>
      )}

      {paymentType === "org_to_vendor" && (
        <div className="ph-flow-wrap" style={wrap}>
          <OrgBox pt={pt} />
          <AmountArrow amount={req.amount} pt={pt} />
          <VendorBox vendorName={vendorName} vendorRef={vendorRef} pt={pt} />
        </div>
      )}

      {paymentType === "emp_to_emp" && (
        <div className="ph-flow-wrap" style={wrap}>
          <EmpBox name={empName} id={empId} colorKey="indigo" />
          <AmountArrow amount={req.amount} pt={pt} />
          <EmpBox name={toEmpName} id={toEmpId} colorKey="sky" />
        </div>
      )}

      {paymentType !== "org_to_emp" &&
        paymentType !== "org_to_vendor" &&
        paymentType !== "emp_to_emp" && (
          <div className="ph-flow-wrap" style={wrap}>
            <EmpBox name={empName} id={empId} colorKey="indigo" />
            <AmountArrow amount={req.amount} pt={pt} />
            <VendorBox vendorName={vendorName} vendorRef={vendorRef} pt={pt} />
          </div>
        )}
    </>
  );
}
