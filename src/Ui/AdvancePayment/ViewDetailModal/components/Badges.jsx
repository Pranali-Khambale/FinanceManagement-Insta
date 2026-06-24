// ─────────────────────────────────────────────────────────────────────────────
// FILE: src/Ui/AdvancePayment/ViewDetailModal/components/Badges.jsx
// ─────────────────────────────────────────────────────────────────────────────
import { PAYMENT_TYPES, STATUS_CONFIG } from "../constants";

const BADGE_RESPONSIVE_CSS = `
@media (max-width: 360px) {
  .ph-status-badge {
    font-size: 10px !important;
    padding: 3px 8px !important;
    gap: 4px !important;
  }
  .ph-payment-pill {
    font-size: 10px !important;
    padding: 3px 8px !important;
  }
}
`;

export function StatusBadge({ status }) {
  const sc = STATUS_CONFIG[status] || STATUS_CONFIG.pending;
  return (
    <>
      <style>{BADGE_RESPONSIVE_CSS}</style>
      <span
        className={`ph-status-badge inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ring-1 ${sc.bg} ${sc.text} ${sc.ring}`}
      >
        <span className={`w-1.5 h-1.5 rounded-full ${sc.dot}`} />
        {sc.label}
      </span>
    </>
  );
}

export function PaymentTypePill({ type }) {
  const pt = PAYMENT_TYPES[type] || PAYMENT_TYPES.org_to_emp;
  return (
    <>
      <style>{BADGE_RESPONSIVE_CSS}</style>
      <span
        className="ph-payment-pill inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold"
        style={{
          background: pt.lightBg,
          color: pt.textColor,
          border: `1px solid ${pt.borderColor}`,
        }}
      >
        {pt.label}
      </span>
    </>
  );
}
