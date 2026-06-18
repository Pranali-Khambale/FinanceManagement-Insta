import { AVP } from "../constants/theme";
import { ini } from "../utils/formatters";

// `size` still works exactly as before — pass a number, get that exact pixel size.
// New: pass a responsive size object instead, e.g. size={{ base: 24, sm: 28, lg: 32 }}
// to have the avatar scale itself across mobile / tablet / laptop without the
// parent needing its own media queries. Falls back to a single number for
// backwards compatibility with existing call sites.
export default function Av({ name, size = 28 }) {
  const { bg, fg } = AVP[(name || "?").charCodeAt(0) % AVP.length];

  const isResponsive = typeof size === "object" && size !== null;
  const base = isResponsive ? size.base ?? 24 : size;
  const sm = isResponsive ? size.sm ?? base : size;
  const lg = isResponsive ? size.lg ?? sm : size;

  // CSS custom properties carry the three breakpoint sizes; a scoped <style>
  // block (keyed by a unique class) does the actual media-query switching,
  // since inline styles alone can't respond to viewport width.
  const cls = `av-${Math.abs(
    (name || "?").split("").reduce((a, c) => a + c.charCodeAt(0), 0),
  )}-${base}-${sm}-${lg}`;

  return (
    <>
      {isResponsive && (
        <style>{`
          .${cls} {
            width: ${base}px;
            height: ${base}px;
            font-size: ${base * 0.34}px;
          }
          @media (min-width: 640px) {
            .${cls} {
              width: ${sm}px;
              height: ${sm}px;
              font-size: ${sm * 0.34}px;
            }
          }
          @media (min-width: 1024px) {
            .${cls} {
              width: ${lg}px;
              height: ${lg}px;
              font-size: ${lg * 0.34}px;
            }
          }
        `}</style>
      )}
      <div
        className={isResponsive ? cls : undefined}
        style={{
          width: isResponsive ? undefined : size,
          height: isResponsive ? undefined : size,
          borderRadius: "50%",
          background: bg,
          color: fg,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: isResponsive ? undefined : size * 0.34,
          fontWeight: 600,
          flexShrink: 0,
          letterSpacing: "-.01em",
          userSelect: "none",
          border: `1.5px solid ${fg}22`,
        }}
      >
        {ini(name)}
      </div>
    </>
  );
}