// src/Ui/Reports/Charts.jsx
// Pure SVG chart components — zero external dependencies.

import React, { useState } from "react";

const fmt = (n) =>
  n >= 1e6
    ? `₹${(n / 1e6).toFixed(2)}M`
    : n >= 1e3
      ? `₹${(n / 1e3).toFixed(1)}K`
      : `₹${n}`;

// ─── Pie / Donut Chart ────────────────────────────────────────────────────────
export function PieChart({ data, size = 240, donut = true, title }) {
  const [hovered, setHovered] = useState(null);
  const cx = size / 2,
    cy = size / 2;
  const R = size * 0.38,
    r = donut ? R * 0.55 : 0;
  const total = data.reduce((s, d) => s + d.value, 0);

  let cumAngle = -Math.PI / 2;
  const slices = data.map((d) => {
    const angle = (d.value / total) * 2 * Math.PI;
    const start = cumAngle;
    cumAngle += angle;
    const end = cumAngle;
    const x1 = cx + R * Math.cos(start),
      y1 = cy + R * Math.sin(start);
    const x2 = cx + R * Math.cos(end),
      y2 = cy + R * Math.sin(end);
    const ix1 = cx + r * Math.cos(start),
      iy1 = cy + r * Math.sin(start);
    const ix2 = cx + r * Math.cos(end),
      iy2 = cy + r * Math.sin(end);
    const large = angle > Math.PI ? 1 : 0;
    const path = donut
      ? `M${x1},${y1} A${R},${R} 0 ${large},1 ${x2},${y2} L${ix2},${iy2} A${r},${r} 0 ${large},0 ${ix1},${iy1} Z`
      : `M${cx},${cy} L${x1},${y1} A${R},${R} 0 ${large},1 ${x2},${y2} Z`;
    const midA = start + angle / 2;
    return { ...d, path, midA, pct: ((d.value / total) * 100).toFixed(1) };
  });

  const active = hovered !== null ? slices[hovered] : null;

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 24,
        flexWrap: "wrap",
      }}
    >
      <svg width={size} height={size} style={{ flexShrink: 0 }}>
        {slices.map((s, i) => (
          <path
            key={i}
            d={s.path}
            fill={s.color}
            opacity={hovered === null || hovered === i ? 1 : 0.45}
            stroke="#fff"
            strokeWidth={2}
            style={{ cursor: "pointer", transition: "opacity .18s" }}
            transform={
              hovered === i
                ? `translate(${Math.cos(s.midA) * 6},${Math.sin(s.midA) * 6})`
                : ""
            }
            onMouseEnter={() => setHovered(i)}
            onMouseLeave={() => setHovered(null)}
          />
        ))}
        {donut && (
          <text
            x={cx}
            y={cy - 8}
            textAnchor="middle"
            fontSize={11}
            fill="#6b7280"
            fontFamily="'DM Sans',sans-serif"
          >
            {active ? active.label : "Total"}
          </text>
        )}
        {donut && (
          <text
            x={cx}
            y={cy + 12}
            textAnchor="middle"
            fontSize={13}
            fontWeight="700"
            fill="#111827"
            fontFamily="'DM Sans',sans-serif"
          >
            {active ? fmt(active.value) : fmt(total)}
          </text>
        )}
      </svg>

      {/* Legend */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 7,
          minWidth: 160,
        }}
      >
        {slices.map((s, i) => (
          <div
            key={i}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              cursor: "pointer",
              opacity: hovered === null || hovered === i ? 1 : 0.5,
              transition: "opacity .18s",
            }}
            onMouseEnter={() => setHovered(i)}
            onMouseLeave={() => setHovered(null)}
          >
            <div
              style={{
                width: 10,
                height: 10,
                borderRadius: 3,
                background: s.color,
                flexShrink: 0,
              }}
            />
            <span
              style={{
                fontSize: 11.5,
                color: "#374151",
                fontFamily: "'DM Sans',sans-serif",
                flex: 1,
              }}
            >
              {s.label}
            </span>
            <span
              style={{
                fontSize: 11,
                color: "#6b7280",
                fontFamily: "'DM Sans',sans-serif",
                fontWeight: 600,
              }}
            >
              {s.pct}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Line Chart ───────────────────────────────────────────────────────────────
export function LineChart({ series, labels, height = 200, showArea = true }) {
  const [tooltip, setTooltip] = useState(null);
  const W = 520,
    H = height;
  const PAD = { top: 20, right: 20, bottom: 36, left: 56 };
  const iW = W - PAD.left - PAD.right;
  const iH = H - PAD.top - PAD.bottom;

  const allVals = series.flatMap((s) => s.data);
  const minV = Math.min(...allVals) * 0.9;
  const maxV = Math.max(...allVals) * 1.05;

  const xP = (i) => PAD.left + (i / (labels.length - 1)) * iW;
  const yP = (v) => PAD.top + iH - ((v - minV) / (maxV - minV)) * iH;

  const ticks = 5;
  const yTicks = Array.from(
    { length: ticks + 1 },
    (_, i) => minV + ((maxV - minV) / ticks) * i,
  );

  return (
    <div style={{ position: "relative", width: "100%", overflowX: "auto" }}>
      <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ display: "block" }}>
        {/* Grid */}
        {yTicks.map((v, i) => (
          <g key={i}>
            <line
              x1={PAD.left}
              y1={yP(v)}
              x2={W - PAD.right}
              y2={yP(v)}
              stroke="#e5e7eb"
              strokeWidth={1}
              strokeDasharray="4,3"
            />
            <text
              x={PAD.left - 8}
              y={yP(v) + 4}
              textAnchor="end"
              fontSize={9.5}
              fill="#9ca3af"
              fontFamily="'DM Sans',sans-serif"
            >
              {v >= 1e6
                ? `${(v / 1e6).toFixed(1)}M`
                : v >= 1e3
                  ? `${(v / 1e3).toFixed(0)}K`
                  : v}
            </text>
          </g>
        ))}

        {/* X labels */}
        {labels.map((l, i) => (
          <text
            key={i}
            x={xP(i)}
            y={H - 6}
            textAnchor="middle"
            fontSize={9.5}
            fill="#9ca3af"
            fontFamily="'DM Sans',sans-serif"
          >
            {l}
          </text>
        ))}

        {/* Series */}
        {series.map((s, si) => {
          const pts = s.data.map((v, i) => `${xP(i)},${yP(v)}`).join(" ");
          const areaPath =
            `M${xP(0)},${yP(s.data[0])} ` +
            s.data.map((v, i) => `L${xP(i)},${yP(v)}`).join(" ") +
            ` L${xP(s.data.length - 1)},${H - PAD.bottom} L${xP(0)},${H - PAD.bottom} Z`;
          return (
            <g key={si}>
              {showArea && (
                <path d={areaPath} fill={s.color} fillOpacity={0.08} />
              )}
              <polyline
                points={pts}
                fill="none"
                stroke={s.color}
                strokeWidth={2.2}
                strokeLinejoin="round"
                strokeLinecap="round"
              />
              {s.data.map((v, i) => (
                <circle
                  key={i}
                  cx={xP(i)}
                  cy={yP(v)}
                  r={3.5}
                  fill={s.color}
                  stroke="#fff"
                  strokeWidth={1.5}
                  style={{ cursor: "pointer" }}
                  onMouseEnter={(e) =>
                    setTooltip({
                      si,
                      i,
                      v,
                      x: xP(i),
                      y: yP(v),
                      label: labels[i],
                      name: s.name,
                      color: s.color,
                    })
                  }
                  onMouseLeave={() => setTooltip(null)}
                />
              ))}
            </g>
          );
        })}

        {/* Tooltip */}
        {tooltip &&
          (() => {
            const tx = Math.min(tooltip.x + 10, W - 120);
            const ty = Math.max(tooltip.y - 40, 4);
            return (
              <g>
                <rect
                  x={tx}
                  y={ty}
                  width={110}
                  height={36}
                  rx={6}
                  fill="#1f2937"
                  opacity={0.93}
                />
                <text
                  x={tx + 8}
                  y={ty + 13}
                  fontSize={9.5}
                  fill="#d1d5db"
                  fontFamily="'DM Sans',sans-serif"
                >
                  {tooltip.label} · {tooltip.name}
                </text>
                <text
                  x={tx + 8}
                  y={ty + 27}
                  fontSize={11}
                  fontWeight="700"
                  fill="#fff"
                  fontFamily="'DM Sans',sans-serif"
                >
                  {fmt(tooltip.v)}
                </text>
              </g>
            );
          })()}
      </svg>

      {/* Legend */}
      <div
        style={{
          display: "flex",
          gap: 16,
          justifyContent: "center",
          marginTop: 4,
          flexWrap: "wrap",
        }}
      >
        {series.map((s, i) => (
          <div
            key={i}
            style={{ display: "flex", alignItems: "center", gap: 6 }}
          >
            <div
              style={{
                width: 24,
                height: 3,
                borderRadius: 2,
                background: s.color,
              }}
            />
            <span
              style={{
                fontSize: 11,
                color: "#6b7280",
                fontFamily: "'DM Sans',sans-serif",
              }}
            >
              {s.name}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Bar Chart ────────────────────────────────────────────────────────────────
export function BarChart({ data, xKey, bars, height = 200 }) {
  const [tooltip, setTooltip] = useState(null);
  const W = 520,
    H = height;
  const PAD = { top: 20, right: 16, bottom: 36, left: 56 };
  const iW = W - PAD.left - PAD.right;
  const iH = H - PAD.top - PAD.bottom;

  const n = data.length;
  const bCount = bars.length;
  const groupW = iW / n;
  const barW = Math.min((groupW / (bCount + 1)) * 0.9, 28);

  const allVals = data.flatMap((d) => bars.map((b) => d[b.key] || 0));
  const maxV = Math.max(...allVals) * 1.1;

  const yP = (v) => PAD.top + iH - (v / maxV) * iH;
  const ticks = 4;

  return (
    <div style={{ position: "relative", width: "100%", overflowX: "auto" }}>
      <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ display: "block" }}>
        {/* Grid */}
        {Array.from({ length: ticks + 1 }, (_, i) => {
          const v = (maxV / ticks) * i;
          return (
            <g key={i}>
              <line
                x1={PAD.left}
                y1={yP(v)}
                x2={W - PAD.right}
                y2={yP(v)}
                stroke="#e5e7eb"
                strokeWidth={1}
                strokeDasharray="4,3"
              />
              <text
                x={PAD.left - 6}
                y={yP(v) + 4}
                textAnchor="end"
                fontSize={9.5}
                fill="#9ca3af"
                fontFamily="'DM Sans',sans-serif"
              >
                {v >= 1e6
                  ? `${(v / 1e6).toFixed(1)}M`
                  : v >= 1e3
                    ? `${(v / 1e3).toFixed(0)}K`
                    : Math.round(v)}
              </text>
            </g>
          );
        })}

        {data.map((d, di) => {
          const gx =
            PAD.left +
            di * groupW +
            groupW / 2 -
            (bCount * barW + (bCount - 1) * 4) / 2;
          return (
            <g key={di}>
              {bars.map((b, bi) => {
                const v = d[b.key] || 0;
                const bx = gx + bi * (barW + 4);
                const by = yP(v);
                const bh = PAD.top + iH - by;
                return (
                  <g key={bi}>
                    <rect
                      x={bx}
                      y={by}
                      width={barW}
                      height={bh}
                      rx={3}
                      fill={b.color}
                      opacity={
                        tooltip?.di === di && tooltip?.bi === bi ? 1 : 0.82
                      }
                      style={{ cursor: "pointer", transition: "opacity .15s" }}
                      onMouseEnter={() =>
                        setTooltip({
                          di,
                          bi,
                          v,
                          label: d[xKey],
                          name: b.name,
                          color: b.color,
                          bx,
                          by,
                        })
                      }
                      onMouseLeave={() => setTooltip(null)}
                    />
                  </g>
                );
              })}
              <text
                x={PAD.left + di * groupW + groupW / 2}
                y={H - 6}
                textAnchor="middle"
                fontSize={9.5}
                fill="#9ca3af"
                fontFamily="'DM Sans',sans-serif"
              >
                {d[xKey]}
              </text>
            </g>
          );
        })}

        {/* Tooltip */}
        {tooltip &&
          (() => {
            const tx = Math.min(tooltip.bx + barW + 4, W - 120);
            const ty = Math.max(tooltip.by - 40, 4);
            return (
              <g>
                <rect
                  x={tx}
                  y={ty}
                  width={110}
                  height={36}
                  rx={6}
                  fill="#1f2937"
                  opacity={0.93}
                />
                <text
                  x={tx + 8}
                  y={ty + 13}
                  fontSize={9.5}
                  fill="#d1d5db"
                  fontFamily="'DM Sans',sans-serif"
                >
                  {tooltip.label} · {tooltip.name}
                </text>
                <text
                  x={tx + 8}
                  y={ty + 27}
                  fontSize={11}
                  fontWeight="700"
                  fill="#fff"
                  fontFamily="'DM Sans',sans-serif"
                >
                  {fmt(tooltip.v)}
                </text>
              </g>
            );
          })()}
      </svg>

      {/* Legend */}
      <div
        style={{
          display: "flex",
          gap: 16,
          justifyContent: "center",
          marginTop: 4,
          flexWrap: "wrap",
        }}
      >
        {bars.map((b, i) => (
          <div
            key={i}
            style={{ display: "flex", alignItems: "center", gap: 6 }}
          >
            <div
              style={{
                width: 10,
                height: 10,
                borderRadius: 3,
                background: b.color,
              }}
            />
            <span
              style={{
                fontSize: 11,
                color: "#6b7280",
                fontFamily: "'DM Sans',sans-serif",
              }}
            >
              {b.name}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
