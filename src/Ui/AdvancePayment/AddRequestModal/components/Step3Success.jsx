import { CheckCircle2, ShieldCheck, FileImage } from "lucide-react";
import { SRow } from "./SummaryComponents";
import TypeIcon from "./TypeIcon";

function StatusBadge({ label }) {
  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 5,
        padding: "4px 11px",
        borderRadius: 99,
        background: "#EAF3DE",
        border: "0.5px solid #97C459",
      }}
    >
      <div
        style={{
          width: 6,
          height: 6,
          borderRadius: "50%",
          background: "#639922",
        }}
      />
      <span style={{ fontSize: 10, fontWeight: 700, color: "#3B6D11" }}>
        {label}
      </span>
    </div>
  );
}

export default function Step3Success({ result, pt, ptKey }) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        animation: "fadeIn .25s ease",
      }}
    >
      <div
        style={{
          width: 64,
          height: 64,
          borderRadius: "50%",
          background: "#EAF3DE",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: 18,
          animation: "popIn .45s cubic-bezier(.34,1.56,.64,1) both",
        }}
      >
        <CheckCircle2 size={30} color="#3B6D11" />
      </div>
      <p
        style={{
          margin: 0,
          fontSize: 18,
          fontWeight: 700,
          color: "#1e293b",
          textAlign: "center",
          animation: "fadeUp .3s ease .15s both",
        }}
      >
        Request submitted!
      </p>
      <p
        style={{
          margin: "8px 0 0",
          fontSize: 13,
          color: "#64748b",
          lineHeight: 1.7,
          textAlign: "center",
          animation: "fadeUp .3s ease .22s both",
        }}
      >
        Your advance payment request has been received.
        <br />
        HR will review it and get back to you shortly.
      </p>
      <div
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 5,
          marginTop: 14,
          padding: "5px 12px",
          borderRadius: 99,
          background: "#EAF3DE",
          border: "0.5px solid #97C459",
          animation: "fadeUp .3s ease .28s both",
        }}
      >
        <div
          style={{
            width: 6,
            height: 6,
            borderRadius: "50%",
            background: "#639922",
          }}
        />
        <span style={{ fontSize: 11, fontWeight: 600, color: "#3B6D11" }}>
          Pending HR approval
        </span>
      </div>

      <div
        style={{
          width: "100%",
          marginTop: 20,
          borderRadius: 14,
          border: "0.5px solid #e2e8f0",
          overflow: "hidden",
          animation: "fadeUp .3s ease .35s both",
        }}
      >
        <div
          style={{
            background: pt.color + "0d",
            borderBottom: `0.5px solid ${pt.color}20`,
            padding: "11px 16px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div
              style={{
                width: 28,
                height: 28,
                borderRadius: 8,
                background: pt.color + "1a",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <TypeIcon ptKey={ptKey} color={pt.color} size={15} />
            </div>
            <div>
              <p
                style={{
                  margin: 0,
                  fontSize: 11,
                  fontWeight: 700,
                  color: "#334155",
                }}
              >
                Advance payment
              </p>
              <p style={{ margin: 0, fontSize: 10, color: "#94a3b8" }}>
                {pt.label}
              </p>
            </div>
          </div>
          <StatusBadge label="Pending approval" />
        </div>

        <div style={{ padding: "12px 16px 14px", background: "#f8fafc" }}>
          <SRow label="Request ID" value={result.id} mono />

          {result.paymentType === "org_to_vendor" ? (
            <>
              <SRow
                label="Vendor"
                value={
                  result.toVendorRef
                    ? `${result.toVendorName} · ${result.toVendorRef}`
                    : result.toVendorName
                }
              />
              {result.toVendorGST && (
                <SRow label="GST" value={result.toVendorGST} mono />
              )}
            </>
          ) : (
            <>
              <SRow
                label="Employee"
                value={`${result.name} · ${result.empId}`}
              />
              <SRow label="Department" value={result.dept} />
              {result.toEmpName && (
                <SRow
                  label="Recipient"
                  value={`${result.toEmpName}${result.toEmpId ? " · " + result.toEmpId : ""}`}
                />
              )}
              {result.vendorName && (
                <SRow
                  label="Vendor"
                  value={
                    result.vendorRef
                      ? `${result.vendorName} · ${result.vendorRef}`
                      : result.vendorName
                  }
                />
              )}
            </>
          )}

          <SRow label="Date" value={result.date} />

          <div
            style={{
              margin: "8px 0 0",
              paddingTop: 8,
              borderTop: "0.5px dashed #e8edf2",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 5,
                marginBottom: 6,
              }}
            >
              <ShieldCheck size={11} color="#7c3aed" />
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  color: "#7c3aed",
                  textTransform: "uppercase",
                  letterSpacing: ".06em",
                }}
              >
                Approved by
              </span>
            </div>
            <SRow
              label="Approver"
              value={`${result.approverName} · ${result.approverId}`}
            />
            {result.approverDesignation && (
              <SRow label="Designation" value={result.approverDesignation} />
            )}
          </div>

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginTop: 11,
              paddingTop: 11,
              borderTop: `1.5px solid ${pt.color}22`,
            }}
          >
            <span style={{ fontSize: 12, fontWeight: 600, color: "#64748b" }}>
              Total amount
            </span>
            <span style={{ fontSize: 20, fontWeight: 700, color: pt.color }}>
              ₹ {Number(result.amount).toLocaleString("en-IN")}
            </span>
          </div>
        </div>

        {result.screenshotName && (
          <div
            style={{
              padding: "9px 16px",
              borderTop: "0.5px solid #e8edf2",
              background: "#fff",
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <FileImage size={13} color="#94a3b8" />
            <span
              style={{
                fontSize: 11,
                color: "#64748b",
                flex: 1,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {result.screenshotName}
            </span>
            <span style={{ fontSize: 10, color: "#94a3b8", flexShrink: 0 }}>
              Screenshot attached
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
