
import PaymentTypeCard from "./PaymentTypeCard";
import { PAYMENT_TYPES } from "../../../../data/content";

export default function Step1TypeSelect({ ptKey, setPtKey }) {
  return (
    <div
      style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 10 }}
    >
      {Object.values(PAYMENT_TYPES).map((p) => (
        <PaymentTypeCard
          key={p.key}
          pt={p}
          selected={ptKey === p.key}
          onClick={() => setPtKey(p.key)}
        />
      ))}
    </div>
  );
}
