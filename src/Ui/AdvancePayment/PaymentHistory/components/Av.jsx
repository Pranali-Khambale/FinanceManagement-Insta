import { AVP } from "../constants/theme";
import { ini } from "../utils/formatters";

export default function Av({ name, size = 28 }) {
  const { bg, fg } = AVP[(name || "?").charCodeAt(0) % AVP.length];
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        background: bg,
        color: fg,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: size * 0.34,
        fontWeight: 600,
        flexShrink: 0,
        letterSpacing: "-.01em",
        userSelect: "none",
        border: `1.5px solid ${fg}22`,
      }}
    >
      {ini(name)}
    </div>
  );
}
