export const inr = (n) =>
  `₹${Math.round(Number(n) || 0).toLocaleString("en-IN")}`;

export const inrK = (n) => {
  const v = Math.round(Number(n) || 0);
  if (v >= 10000000) return `₹${(v / 10000000).toFixed(2)}Cr`;
  if (v >= 100000) return `₹${(v / 100000).toFixed(2)}L`;
  if (v >= 1000) return `₹${(v / 1000).toFixed(1)}K`;
  return inr(v);
};

export const fmtD = (r) => {
  if (!r) return "—";
  const d = new Date(r);
  return isNaN(d)
    ? String(r).slice(0, 10)
    : d.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
};

export const ini = (s) =>
  (s || "?")
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0] || "")
    .join("")
    .toUpperCase();

const MMAP = {
  jan: "01",
  feb: "02",
  mar: "03",
  apr: "04",
  may: "05",
  jun: "06",
  jul: "07",
  aug: "08",
  sep: "09",
  oct: "10",
  nov: "11",
  dec: "12",
};

export const mKey = (l) => {
  if (/^\d{4}-\d{2}$/.test(l)) return l;
  const [m = "", y = ""] = l.trim().split(/\s+/);
  const k = MMAP[m.slice(0, 3).toLowerCase()];
  return k ? `${y}-${k}` : l;
};

export const sortM = (arr) =>
  [...new Set(arr)].sort((a, b) => mKey(a).localeCompare(mKey(b)));

export const daysDiff = (d) => {
  if (!d) return null;
  return Math.round((Date.now() - new Date(d)) / (1000 * 86400));
};
