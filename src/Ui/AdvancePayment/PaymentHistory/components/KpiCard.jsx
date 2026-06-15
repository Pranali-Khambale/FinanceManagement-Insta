import { ArrowUpRight, ArrowDownRight } from "lucide-react";
import { T } from "../constants/theme";
import { inrK } from "../utils/formatters";

export default function KpiCard({
  label,
  value,
  sub,
  icon: Icon,
  color,
  loading,
  trend,
  trendLabel,
}) {
  return (
    <div
      className="ph-kpi"
      style={{
        background: "#fff",
        borderRadius: 10,
        border: "1px solid #E3E3E0",
        padding: "14px 16px",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          position: "absolute",
          right: 11,
          top: 11,
          width: 34,
          height: 34,
          borderRadius: 8,
          background: `${color}18`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Icon size={15} style={{ color }} />
      </div>
      <p
        style={{
          fontSize: 10,
          fontWeight: 600,
          color: "#888885",
          textTransform: "uppercase",
          letterSpacing: ".08em",
          marginBottom: 8,
        }}
      >
        {label}
      </p>
      {loading ? (
        <>
          <div
            className="ph-shim"
            style={{ height: 26, width: "60%", marginBottom: 5 }}
          />
          <div className="ph-shim" style={{ height: 10, width: "42%" }} />
        </>
      ) : (
        <>
          <p
            style={{
              fontSize: 24,
              fontWeight: 600,
              color: "#111110",
              fontFamily: "'IBM Plex Mono',monospace",
              letterSpacing: "-.04em",
              lineHeight: 1,
              marginBottom: 5,
            }}
          >
            {value}
          </p>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              flexWrap: "wrap",
            }}
          >
            {sub && <p style={{ fontSize: 10, color: "#888885" }}>{sub}</p>}
            {trend !== undefined && (
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 600,
                  color: trend >= 0 ? T.g600 : T.r600,
                  display: "flex",
                  alignItems: "center",
                  gap: 2,
                }}
              >
                {trend >= 0 ? (
                  <ArrowUpRight size={10} />
                ) : (
                  <ArrowDownRight size={10} />
                )}
                {trendLabel}
              </span>
            )}
          </div>
        </>
      )}
    </div>
  );
}
