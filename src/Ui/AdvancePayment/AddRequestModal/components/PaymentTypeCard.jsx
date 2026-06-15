const PAYMENT_TYPE_ICONS = {
  org_to_emp: (
    <svg
      width="19"
      height="19"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="2" y="7" width="9" height="14" rx="1.5" />
      <path d="M16 3h5v18h-5" />
      <line x1="6" y1="11" x2="7" y2="11" />
      <line x1="6" y1="15" x2="7" y2="15" />
    </svg>
  ),
  emp_to_emp: (
    <svg
      width="19"
      height="19"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  ),
  org_to_vendor: (
    <svg
      width="19"
      height="19"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="1" y="3" width="15" height="13" rx="1.5" />
      <path d="M16 8h4l3 5v3h-7V8z" />
      <circle cx="5.5" cy="18.5" r="2.5" />
      <circle cx="18.5" cy="18.5" r="2.5" />
    </svg>
  ),
  other: (
    <svg
      width="19"
      height="19"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
    </svg>
  ),
};

export default function PaymentTypeCard({ pt, selected, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        position: "relative",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 7,
        padding: "14px 8px 11px",
        borderRadius: 12,
        cursor: "pointer",
        border: "none",
        outline: `${selected ? "2px" : "1.5px"} solid ${selected ? pt.color : "#e2e8f0"}`,
        background: selected ? pt.color + "10" : "#fafafa",
        boxShadow: selected ? `0 0 0 3px ${pt.color}20` : "none",
        transition: "all 0.15s",
      }}
    >
      {selected && (
        <span
          style={{
            position: "absolute",
            top: 6,
            right: 6,
            width: 14,
            height: 14,
            borderRadius: "50%",
            background: pt.color,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <svg width="7" height="7" viewBox="0 0 10 10" fill="none">
            <path
              d="M2 5l2 2 4-4"
              stroke="#fff"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>
      )}
      <div
        style={{
          width: 34,
          height: 34,
          borderRadius: 9,
          background: selected ? pt.color : "#eef1f6",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: selected ? "#fff" : pt.color,
        }}
      >
        {PAYMENT_TYPE_ICONS[pt.key]}
      </div>
      <span
        style={{
          fontSize: 11,
          fontWeight: 700,
          color: selected ? pt.color : "#64748b",
          textAlign: "center",
          lineHeight: 1.3,
        }}
      >
        {pt.label}
      </span>
      <span
        style={{
          fontSize: 10,
          color: "#94a3b8",
          textAlign: "center",
          lineHeight: 1.3,
        }}
      >
        {pt.desc}
      </span>
    </button>
  );
}
