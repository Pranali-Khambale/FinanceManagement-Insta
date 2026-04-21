// ─────────────────────────────────────────────────────────────────────────────
// FILE: src/Ui/Reports/reportUtils.js
// Shared helpers: API fetching, PDF export, Excel/CSV export, print
// ─────────────────────────────────────────────────────────────────────────────

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

// ── Auth header ───────────────────────────────────────────────────────────────
export function authHeaders() {
  const token =
    localStorage.getItem("adminToken") || localStorage.getItem("token") || "";
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

// ── Generic fetch ─────────────────────────────────────────────────────────────
export async function apiFetch(path, params = {}) {
  const qs = new URLSearchParams(
    Object.entries(params).filter(([, v]) => v !== "" && v != null),
  ).toString();
  const url = `${API_URL}${path}${qs ? `?${qs}` : ""}`;
  const res = await fetch(url, { headers: authHeaders() });
  if (!res.ok) throw new Error(`API ${path} failed: ${res.status}`);
  return res.json();
}

// ── Format helpers ────────────────────────────────────────────────────────────
export const fmtCurrency = (n) =>
  `₹${Number(n || 0).toLocaleString("en-IN", { minimumFractionDigits: 0 })}`;

export const fmtDate = (d) => {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

export const fmtMonth = (label) => label || "—";

// ── CSV Export ────────────────────────────────────────────────────────────────
export function exportCSV(filename, headers, rows) {
  const escape = (v) => {
    const s = String(v ?? "");
    return s.includes(",") || s.includes('"') || s.includes("\n")
      ? `"${s.replace(/"/g, '""')}"`
      : s;
  };
  const lines = [
    headers.map(escape).join(","),
    ...rows.map((r) => r.map(escape).join(",")),
  ];
  const blob = new Blob([lines.join("\n")], {
    type: "text/csv;charset=utf-8;",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

// ── Print helper ──────────────────────────────────────────────────────────────
export function printSection(elementId, title) {
  const el = document.getElementById(elementId);
  if (!el) return;
  const win = window.open("", "_blank");
  win.document.write(`
    <html><head>
      <title>${title}</title>
      <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: 'Segoe UI', sans-serif; font-size: 12px; color: #1e293b; padding: 24px; }
        h1 { font-size: 18px; margin-bottom: 16px; color: #0f172a; }
        table { width: 100%; border-collapse: collapse; margin-top: 12px; }
        th { background: #f1f5f9; padding: 8px 10px; text-align: left; font-size: 11px; text-transform: uppercase; letter-spacing: .05em; border-bottom: 2px solid #e2e8f0; }
        td { padding: 7px 10px; border-bottom: 1px solid #f1f5f9; }
        tr:nth-child(even) td { background: #f8fafc; }
        .badge { display: inline-block; padding: 2px 8px; border-radius: 99px; font-size: 10px; font-weight: 700; }
        .badge-green { background: #dcfce7; color: #166534; }
        .badge-red { background: #fee2e2; color: #991b1b; }
        .badge-amber { background: #fef9c3; color: #854d0e; }
        @media print { body { padding: 0; } }
      </style>
    </head><body>
      <h1>${title}</h1>
      ${el.innerHTML}
    </body></html>
  `);
  win.document.close();
  win.focus();
  setTimeout(() => {
    win.print();
    win.close();
  }, 400);
}

// ── Summary stat card data builder ───────────────────────────────────────────
export function buildStatCards(items) {
  return items.map(({ label, value, sub, color, icon }) => ({
    label,
    value,
    sub,
    color: color || "#6366f1",
    icon: icon || "📊",
  }));
}
