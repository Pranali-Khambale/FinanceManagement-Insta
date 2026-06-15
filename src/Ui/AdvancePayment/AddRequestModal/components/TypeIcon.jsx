import { Users, Globe, Truck, Building2 } from "lucide-react";

export default function TypeIcon({ ptKey, color, size = 15 }) {
  if (ptKey === "emp_to_emp") return <Users size={size} color={color} />;
  if (ptKey === "other") return <Globe size={size} color={color} />;
  if (ptKey === "org_to_vendor") return <Truck size={size} color={color} />;
  return <Building2 size={size} color={color} />;
}
