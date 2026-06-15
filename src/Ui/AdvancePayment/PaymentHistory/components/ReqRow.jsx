import { useState } from "react";
import { ChevronDown, Calendar, BadgeCheck, CreditCard } from "lucide-react";
import { T } from "../constants/theme";
import { inr, fmtD, daysDiff } from "../utils/formatters";
import Av from "./Av";
import Chip from "./Chip";

export default function ReqRow({ req }) {
  const [open, setOpen] = useState(false);
  const age = req.request_date ? daysDiff(req.request_date) : null;

  return (
    <div style={{ borderBottom: "1px solid #EEEEEC" }}>
      <button
        className="ph-btn ph-row"
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
        <Av name={req.emp_name} size={30} />
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
                }}
              >
                {req.payment_type_label}
              </span>
            )}
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
          style={{ color: "#ADADAA" }}
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
                <p style={{ fontSize: 13, fontWeight: 600, color: "#323130" }}>
                  {v}
                </p>
              </div>
            ))}
          </div>
          <div
            style={{
              padding: "11px 14px",
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 8,
            }}
          >
            <div>
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
              <p style={{ fontSize: 12, color: "#323130", lineHeight: 1.5 }}>
                {req.reason || "—"}
              </p>
            </div>
            <div>
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
              <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                <Av name={req.emp_name} size={24} />
                <div>
                  <p
                    style={{ fontSize: 12, fontWeight: 500, color: "#323130" }}
                  >
                    {req.emp_name}
                  </p>
                  <p
                    style={{
                      fontSize: 10,
                      color: "#888885",
                      fontFamily: "'IBM Plex Mono',monospace",
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
