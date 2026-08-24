const INFOROW_RESPONSIVE_CSS = `
@media (max-width: 360px) {
  .ph-inforow {
    flex-direction: column !important;
    align-items: flex-start !important;
    gap: 2px !important;
  }
  .ph-inforow-val {
    max-width: 100% !important;
    text-align: left !important;
  }
}
@media (min-width: 361px) and (max-width: 480px) {
  .ph-inforow-val {
    max-width: 55% !important;
  }
}
`;

export default function InfoRow({ label, value, mono = false, color }) {
  return (
    <>
      <style>{INFOROW_RESPONSIVE_CSS}</style>
      <div
        className="ph-inforow"
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 8,
          padding: "6px 0",
          borderBottom: "1px solid #F4F4F2",
        }}
      >
        <span style={{ fontSize: 11, color: "#888885", flexShrink: 0 }}>
          {label}
        </span>
        <span
          className="ph-inforow-val"
          style={{
            fontSize: 12,
            fontWeight: 500,
            color: color || "#323130",
            fontFamily: mono ? "'IBM Plex Mono',monospace" : undefined,
            textAlign: "right",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
           
            maxWidth: "60%",
          }}
        >
          {value || "—"}
        </span>
      </div>
    </>
  );
}
