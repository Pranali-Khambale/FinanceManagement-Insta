import { ArrowUpRight, ArrowDownRight } from "lucide-react";
import { T } from "../constants/theme";
import { inrK } from "../utils/formatters";

const KPI_RESPONSIVE_CSS = `
@media (max-width: 640px) {
  .ph-kpi { padding: 11px 12px !important; }
  .ph-kpi-icon { width: 28px !important; height: 28px !important; right: 9px !important; top: 9px !important; }
  .ph-kpi-value { font-size: 19px !important; }
}
`;

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
      <style>{KPI_RESPONSIVE_CSS}</style>
      <div
        className="ph-kpi-icon"
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
          paddingRight: 38,
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
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
            className="ph-kpi-value"
            style={{
              fontSize: 24,
              fontWeight: 600,
              color: "#111110",
              fontFamily: "'IBM Plex Mono',monospace",
              letterSpacing: "-.04em",
              lineHeight: 1,
              marginBottom: 5,
              overflowWrap: "break-word",
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
                  whiteSpace: "nowrap",
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