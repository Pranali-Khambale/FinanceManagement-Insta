// src/Ui/Reports/KpiCards.jsx
import React from "react";
import {
  TrendingUp,
  
  TrendingDown,
  Users,
  CreditCard,
  Wallet,
  AlertCircle,
} from "lucide-react";

const fmt = (n) =>
  n >= 1e6
    ? `₹${(n / 1e6).toFixed(2)}M`
    : n >= 1e3
      ? `₹${(n / 1e3).toFixed(1)}K`
      : `₹${n.toLocaleString("en-IN")}`;

const cards = (totals) => [
  {
    label: "Total Payroll",
    value: fmt(totals.payroll),
    sub: "Gross disbursed",
    icon: Wallet,
    color: "#3b82f6",
    bg: "#eff6ff",
    trend: "+8.2%",
    up: true,
  },
  {
    label: "Net Payroll",
    value: fmt(totals.net),
    sub: "After all deductions",
    icon: TrendingUp,
    color: "#10b981",
    bg: "#ecfdf5",
    trend: "+6.5%",
    up: true,
  },
  {
    label: "Total Deductions",
    value: fmt(totals.deduct),
    sub: "PF + PT + Others",
    icon: TrendingDown,
    color: "#f59e0b",
    bg: "#fffbeb",
    trend: "+3.1%",
    up: false,
  },
  {
    label: "Advance Issued",
    value: fmt(totals.advance),
    sub: "Total advances given",
    icon: CreditCard,
    color: "#8b5cf6",
    bg: "#f5f3ff",
    trend: "-2.4%",
    up: false,
  },
  {
    label: "Advance Recovered",
    value: fmt(totals.recovered),
    sub: "Amount recovered",
    icon: TrendingUp,
    color: "#06b6d4",
    bg: "#ecfeff",
    trend: "+11.0%",
    up: true,
  },
  {
    label: "Advance Pending",
    value: fmt(totals.pending),
    sub: "Outstanding balance",
    icon: AlertCircle,
    color: "#ef4444",
    bg: "#fef2f2",
    trend: "-5.8%",
    up: true,
  },
];

export function KpiCards({ totals }) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(3, 1fr)",
        gap: 16,
        marginBottom: 28,
      }}
    >
      {cards(totals).map((c, i) => {
        const Icon = c.icon;
        return (
          <div
            key={i}
            style={{
              background: "#fff",
              borderRadius: 14,
              padding: "18px 20px",
              boxShadow:
                "0 1px 4px rgba(0,0,0,0.07), 0 4px 16px rgba(0,0,0,0.04)",
              display: "flex",
              flexDirection: "column",
              gap: 10,
              border: "1px solid #f1f5f9",
              transition: "transform .18s, box-shadow .18s",
              cursor: "default",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-2px)";
              e.currentTarget.style.boxShadow = "0 4px 20px rgba(0,0,0,0.10)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "";
              e.currentTarget.style.boxShadow =
                "0 1px 4px rgba(0,0,0,0.07), 0 4px 16px rgba(0,0,0,0.04)";
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
              }}
            >
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 10,
                  background: c.bg,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Icon size={18} color={c.color} strokeWidth={2} />
              </div>
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  color: c.up ? "#10b981" : "#ef4444",
                  background: c.up ? "#ecfdf5" : "#fef2f2",
                  padding: "2px 7px",
                  borderRadius: 20,
                  fontFamily: "'DM Sans',sans-serif",
                }}
              >
                {c.trend}
              </span>
            </div>
            <div>
              <div
                style={{
                  fontSize: 22,
                  fontWeight: 700,
                  color: "#111827",
                  fontFamily: "'DM Sans',sans-serif",
                  letterSpacing: "-0.5px",
                }}
              >
                {c.value}
              </div>
              <div
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  color: "#374151",
                  fontFamily: "'DM Sans',sans-serif",
                  marginTop: 2,
                }}
              >
                {c.label}
              </div>
              <div
                style={{
                  fontSize: 11,
                  color: "#9ca3af",
                  fontFamily: "'DM Sans',sans-serif",
                  marginTop: 1,
                }}
              >
                {c.sub}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
