import { useState } from "react";
import {
  ChevronDown,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
  BadgeCheck,
  CreditCard,
  Clock,
  Hash,
  Receipt,
} from "lucide-react";
import { T } from "../constants/theme";
import { inr, fmtD, daysDiff } from "../utils/formatters";
import Av from "./Av";
import Chip from "./Chip";
import InfoRow from "./InfoRow";


const EV_RESPONSIVE_CSS = `
@media (max-width: 360px) {
  .ph-ev-row {
    flex-wrap: wrap !important;
    row-gap: 6px;
    padding: 9px 8px !important;
  }
  .ph-ev-row > div:nth-child(2) {
    order: 3;
    flex-basis: 100%;
    min-width: 100% !important;
  }
  .ph-detail-4 {
    grid-template-columns: 1fr !important;
  }
  .ph-detail-4 > div {
    border-right: none !important;
    border-bottom: 1px solid #EEEEEC;
  }
  .ph-detail-4 > div:last-child {
    border-bottom: none;
  }
  .ph-detail-2 {
    grid-template-columns: 1fr !important;
  }
  .ph-detail-2 > div:first-child {
    border-right: none !important;
    border-bottom: 1px solid #EEEEEC;
  }
}
@media (min-width: 361px) and (max-width: 640px) {
  .ph-ev-row {
    flex-wrap: wrap !important;
    row-gap: 8px;
  }
  .ph-ev-row > div:nth-child(2) {
    order: 3;
    flex-basis: 100%;
    min-width: 100% !important;
  }
  .ph-detail-4 {
    grid-template-columns: repeat(2, 1fr) !important;
  }
  .ph-detail-4 > div {
    border-right: none !important;
    border-bottom: 1px solid #EEEEEC;
  }
  .ph-detail-4 > div:nth-last-child(-n+2) {
    border-bottom: none;
  }
  .ph-detail-2 {
    grid-template-columns: 1fr !important;
  }
  .ph-detail-2 > div:first-child {
    border-right: none !important;
    border-bottom: 1px solid #EEEEEC;
  }
}
@media (min-width: 641px) and (max-width: 900px) {
  .ph-detail-4 {
    grid-template-columns: repeat(2, 1fr) !important;
  }
  .ph-detail-4 > div {
    border-right: none !important;
    border-bottom: 1px solid #EEEEEC;
  }
  .ph-detail-4 > div:nth-last-child(-n+2) {
    border-bottom: none;
  }
}
`;

export default function EvCard({ r }) {
  const [open, setOpen] = useState(false);
  const isAdv = r.eventType === "advance";
  const statusType = isAdv ? "advance" : (r.deduction_status ?? "upcoming");
  const age = r.request_date ? daysDiff(r.request_date) : null;

  return (
    <div style={{ borderBottom: "1px solid #EEEEEC" }}>
      <style>{EV_RESPONSIVE_CSS}</style>
      <div
        className="ph-row ph-ev-row"
        style={{ background: "#fff", cursor: "pointer" }}
        onClick={() => setOpen((o) => !o)}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            minWidth: 0,
          }}
        >
          <Av name={r.emp_name} size={{ base: 28, sm: 32 }} />
          <div style={{ minWidth: 0 }}>
            <p
              style={{
                fontSize: 13,
                fontWeight: 600,
                color: "#111110",
                maxWidth: 140,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {r.emp_name}
            </p>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 5,
                marginTop: 2,
              }}
            >
              <span
                style={{
                  fontSize: 10,
                  color: "#888885",
                  fontFamily: "'IBM Plex Mono',monospace",
                }}
              >
                {r.emp_id}
              </span>
              {r.emp_dept && (
                <span
                  style={{
                    fontSize: 10,
                    color: "#65635F",
                    padding: "1px 6px",
                    borderRadius: 3,
                    background: "#EEEEEC",
                    fontWeight: 500,
                  }}
                >
                  {r.emp_dept}
                </span>
              )}
            </div>
          </div>
        </div>

        <div style={{ minWidth: 0 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 5,
              marginBottom: 5,
              flexWrap: "wrap",
            }}
          >
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 3,
                fontSize: 11,
                fontWeight: 600,
                color: isAdv ? T.t600 : T.r600,
                whiteSpace: "nowrap",
              }}
            >
              {isAdv ? (
                <ArrowUpRight size={11} />
              ) : (
                <ArrowDownRight size={11} />
              )}
              {isAdv ? "Advance Disbursed" : "Salary Deduction"}
            </span>
            <Chip type={statusType} />
            {r.payment_type_label && (
              <span
                className="ph-tag"
                style={{
                  background: "#F0F4FF",
                  color: "#3730A3",
                  border: "1px solid #C7D2FE",
                  fontSize: 9,
                  whiteSpace: "nowrap",
                }}
              >
                {r.payment_type_label}
              </span>
            )}
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              flexWrap: "wrap",
            }}
          >
            {r.request_code && (
              <span
                style={{
                  fontSize: 10,
                  color: T.t600,
                  fontFamily: "'IBM Plex Mono',monospace",
                  background: T.t100,
                  padding: "2px 6px",
                  borderRadius: 3,
                  whiteSpace: "nowrap",
                }}
              >
                {r.request_code}
              </span>
            )}
            {r.reason && (
              <span
                style={{
                  fontSize: 10,
                  color: "#65635F",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                  maxWidth: 170,
                }}
                title={r.reason}
              >
                {r.reason}
              </span>
            )}
          </div>
        </div>

        <div style={{ textAlign: "right", flexShrink: 0 }}>
          <p
            style={{
              fontSize: 16,
              fontWeight: 700,
              fontFamily: "'IBM Plex Mono',monospace",
              color: isAdv ? T.t700 : T.r700,
              letterSpacing: "-.03em",
            }}
          >
            {isAdv ? "+" : "−"}
            {inr(r.amount)}
          </p>
          <p style={{ fontSize: 10, color: "#ADADAA", marginTop: 2 }}>
            {r.month}
          </p>
        </div>

        <ChevronDown
          size={13}
          className={`ph-chev ph-ev-chev${open ? " open" : ""}`}
          style={{ color: "#ADADAA", flexShrink: 0 }}
        />
      </div>

      {open && (
        <div
          className="ph-up"
          style={{ background: "#FAFAF9", borderTop: "1px solid #EEEEEC" }}
        >
          <div
            className="ph-detail-4"
            style={{ borderBottom: "1px solid #EEEEEC" }}
          >
            {[
              {
                label: "Request Date",
                value: fmtD(r.request_date),
                icon: Calendar,
                color: T.b1,
              },
              {
                label: "Reviewed On",
                value: fmtD(r.reviewed_at),
                icon: BadgeCheck,
                color: T.g500,
              },
              {
                label: "Adjusted In",
                value: r.adjusted_in || "—",
                icon: CreditCard,
                color: T.a500,
              },
              {
                label: "Days Ago",
                value: age !== null ? `${age}d ago` : "—",
                icon: Clock,
                color: T.v500,
              },
            ].map(({ label, value, icon: Icon, color }, i) => (
              <div
                key={label}
                style={{
                  padding: "11px 14px",
                  borderRight: i < 3 ? "1px solid #EEEEEC" : "none",
                  minWidth: 0,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 5,
                    marginBottom: 5,
                  }}
                >
                  <Icon size={11} style={{ color, flexShrink: 0 }} />
                  <span
                    style={{
                      fontSize: 9,
                      fontWeight: 600,
                      color: "#888885",
                      textTransform: "uppercase",
                      letterSpacing: ".08em",
                    }}
                  >
                    {label}
                  </span>
                </div>
                <p
                  style={{
                    fontSize: 13,
                    fontWeight: 600,
                    color: "#323130",
                    overflowWrap: "break-word",
                    fontFamily:
                      label === "Days Ago"
                        ? "'IBM Plex Mono',monospace"
                        : undefined,
                  }}
                >
                  {value}
                </p>
              </div>
            ))}
          </div>

          <div
            className="ph-detail-2"
            style={{ gap: 0, borderBottom: "1px solid #EEEEEC" }}
          >
            <div
              style={{ padding: "11px 14px", borderRight: "1px solid #EEEEEC" }}
            >
              <p
                style={{
                  fontSize: 9,
                  fontWeight: 600,
                  color: "#888885",
                  textTransform: "uppercase",
                  letterSpacing: ".08em",
                  marginBottom: 8,
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                }}
              >
                <Hash size={9} /> Transaction Details
              </p>
              <InfoRow label="Request Code" value={r.request_code} mono />
              <InfoRow label="Employee ID" value={r.emp_id} mono />
              <InfoRow label="Department" value={r.emp_dept} />
              <InfoRow label="Payment Type" value={r.payment_type_label} />
            </div>
            <div style={{ padding: "11px 14px" }}>
              <p
                style={{
                  fontSize: 9,
                  fontWeight: 600,
                  color: "#888885",
                  textTransform: "uppercase",
                  letterSpacing: ".08em",
                  marginBottom: 8,
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                }}
              >
                <Receipt size={9} /> Recovery Details
              </p>
              <InfoRow
                label="Status"
                value={<Chip type={statusType} size="lg" />}
              />
              <InfoRow
                label="Amount"
                value={inr(r.amount)}
                mono
                color={isAdv ? T.t700 : T.r700}
              />
              <InfoRow label="Month" value={r.month} />
              <InfoRow label="Reason" value={r.reason} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
