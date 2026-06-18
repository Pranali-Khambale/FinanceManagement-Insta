import { useState } from "react";
import { ChevronDown, Calendar, BadgeCheck, CreditCard } from "lucide-react";
import { T } from "../constants/theme";
import { inr, fmtD, daysDiff } from "../utils/formatters";
import Av from "./Av";
import Chip from "./Chip";

// `ph-row` is a flex row (avatar+name | amount | chip | chevron). At mobile
// width the amount/chip pair crowds out the name. Wrap the row and pin the
// amount block to the right while letting the chip drop beneath it, and let
// the bottom detail grid reflow to a single column so dates/labels aren't
// squeezed three-across on a phone.
const REQ_RESPONSIVE_CSS = `
@media (max-width: 640px) {
  .ph-req-row {
    flex-wrap: wrap !important;
    row-gap: 8px;
  }
  .ph-req-row > div:first-of-type {
    flex-basis: 100%;
    order: 1;
  }
  .ph-detail-3 {
    grid-template-columns: 1fr 1fr !important;
  }
  .ph-detail-3 > div:nth-child(3) {
    border-right: none !important;
    grid-column: 1 / -1;
    border-top: 1px solid #EEEEEC;
  }
  .ph-req-bottom-grid {
    grid-template-columns: 1fr !important;
  }
}
`;

export default function ReqRow({ req }) {
  const [open, setOpen] = useState(false);
  const age = req.request_date ? daysDiff(req.request_date) : null;

  return (
    <div style={{ borderBottom: "1px solid #EEEEEC" }}>
      <style>{REQ_RESPONSIVE_CSS}</style>
      <button
        className="ph-btn ph-row ph-req-row"
        onClick={() => setOpen((o) => !o)}
        style={{
          width: "100%",
          display: "flex",
          alignItems: "center",
          gap: 9,
          padding: "11px 14px",
          background: "transparent",
          textAlign: "left",
          transition: "background .1s",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 9, flex: 1, minWidth: 0 }}>
          <Av name={req.emp_name} size={{ base: 26, sm: 30 }} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <p
              style={{
                fontSize: 13,
                fontWeight: 600,
                color: "#111110",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                marginBottom: 3,
              }}
            >
              {req.emp_name}
            </p>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 5,
                flexWrap: "wrap",
              }}
            >
              {req.request_code && (
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
                  {req.request_code}
                </span>
              )}
              {req.emp_dept && (
                <span
                  style={{
                    fontSize: 10,
                    color: "#65635F",
                    background: "#EEEEEC",
                    padding: "2px 6px",
                    borderRadius: 3,
                    whiteSpace: "nowrap",
                  }}
                >
                  {req.emp_dept}
                </span>
              )}
              {req.payment_type_label && (
                <span
                  style={{
                    fontSize: 10,
                    color: "#3730A3",
                    background: "#EEF2FF",
                    padding: "2px 6px",
                    borderRadius: 3,
                    whiteSpace: "nowrap",
                  }}
                >
                  {req.payment_type_label}
                </span>
              )}
            </div>
          </div>
        </div>
        <div style={{ textAlign: "right", flexShrink: 0, marginRight: 6 }}>
          <p
            style={{
              fontSize: 15,
              fontWeight: 700,
              color: "#111110",
              fontFamily: "'IBM Plex Mono',monospace",
              letterSpacing: "-.03em",
            }}
          >
            {inr(req.amount)}
          </p>
          {age !== null && (
            <p style={{ fontSize: 10, color: "#ADADAA" }}>{age}d ago</p>
          )}
        </div>
        <Chip type="advance" />
        <ChevronDown
          size={12}
          className={`ph-chev${open ? " open" : ""}`}
          style={{ color: "#ADADAA", flexShrink: 0 }}
        />
      </button>

      {open && (
        <div
          className="ph-up"
          style={{ background: "#FAFAF9", borderTop: "1px solid #EEEEEC" }}
        >
          <div
            className="ph-detail-3"
            style={{ borderBottom: "1px solid #EEEEEC" }}
          >
            {[
              { l: "Requested", v: fmtD(req.request_date), icon: Calendar },
              { l: "Approved", v: fmtD(req.reviewed_at), icon: BadgeCheck },
              { l: "Adjusted In", v: req.adjusted_in || "—", icon: CreditCard },
            ].map(({ l, v, icon: Icon }, i) => (
              <div
                key={l}
                style={{
                  padding: "11px 14px",
                  borderRight: i < 2 ? "1px solid #EEEEEC" : "none",
                  minWidth: 0,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 5,
                    marginBottom: 4,
                  }}
                >
                  <Icon size={10} style={{ color: "#888885" }} />
                  <p
                    style={{
                      fontSize: 9,
                      fontWeight: 600,
                      color: "#888885",
                      textTransform: "uppercase",
                      letterSpacing: ".08em",
                    }}
                  >
                    {l}
                  </p>
                </div>
                <p style={{ fontSize: 13, fontWeight: 600, color: "#323130", overflowWrap: "break-word" }}>
                  {v}
                </p>
              </div>
            ))}
          </div>
          <div
            className="ph-req-bottom-grid"
            style={{
              padding: "11px 14px",
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 12,
            }}
          >
            <div style={{ minWidth: 0 }}>
              <p
                style={{
                  fontSize: 9,
                  fontWeight: 600,
                  color: "#888885",
                  textTransform: "uppercase",
                  letterSpacing: ".08em",
                  marginBottom: 5,
                }}
              >
                Reason
              </p>
              <p style={{ fontSize: 12, color: "#323130", lineHeight: 1.5, overflowWrap: "break-word" }}>
                {req.reason || "—"}
              </p>
            </div>
            <div style={{ minWidth: 0 }}>
              <p
                style={{
                  fontSize: 9,
                  fontWeight: 600,
                  color: "#888885",
                  textTransform: "uppercase",
                  letterSpacing: ".08em",
                  marginBottom: 5,
                }}
              >
                Employee
              </p>
              <div style={{ display: "flex", alignItems: "center", gap: 7, minWidth: 0 }}>
                <Av name={req.emp_name} size={24} />
                <div style={{ minWidth: 0 }}>
                  <p
                    style={{
                      fontSize: 12,
                      fontWeight: 500,
                      color: "#323130",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {req.emp_name}
                  </p>
                  <p
                    style={{
                      fontSize: 10,
                      color: "#888885",
                      fontFamily: "'IBM Plex Mono',monospace",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {req.emp_id} · {req.emp_dept || "—"}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}