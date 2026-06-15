import { AVATAR_COLORS } from "../constants";

export const avatarGradient = (name = "") => {
  const idx = (name.charCodeAt(0) || 0) % AVATAR_COLORS.length;
  const [from, to] = AVATAR_COLORS[idx];
  return `linear-gradient(135deg, ${from}, ${to})`;
};

export const initials = (name = "") =>
  name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

export const n = (v) => {
  const x = Number(v);
  return isFinite(x) ? x : 0;
};

export const fmt = (v) =>
  "₹ " +
  n(v).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

export const pfFromBasic = (basic) => Math.round(n(basic) * 0.12);
export const employerPfFromBasic = (basic) => Math.round(n(basic) * 0.13);
export const gratuityFromBasic = (basic) =>
  Math.round(n(basic) * 0.0481 * 100) / 100;
