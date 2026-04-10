// ─────────────────────────────────────────────────────────────────────────────
// FILE: src/pages/SalaryPaymentHistory.jsx
// ─────────────────────────────────────────────────────────────────────────────
import { useState, useEffect, useRef } from "react";
import {
  TrendingDown, TrendingUp, ChevronDown, ChevronUp,
  Search, Users, Wallet, ArrowDownCircle, BarChart2,
} from "lucide-react";
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS, CategoryScale, LinearScale,
  BarElement, Tooltip, Legend,
} from "chart.js";

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

// ─── Static data (wire up to your API / context as needed) ───────────────────
const EMPLOYEES = [
  { id: "EMP010", name: "Ravi Kumar",        dept: "IT",          baseSalary: 43000, advanceId: "ADV003" },
  { id: "EMP012", name: "Aarav Ramesh Mehta",dept: "Engineering", baseSalary: 47000, advanceId: "ADV001" },
  { id: "EMP013", name: "Priya Sharma",      dept: "HR",          baseSalary: 35000, advanceId: "ADV002" },
  { id: "EMP021", name: "Kiran Desai",       dept: "Engineering", baseSalary: 39000, advanceId: "ADV005" },
  { id: "EMP031", name: "Meera Iyer",        dept: "Marketing",   baseSalary: 30000, advanceId: "ADV006" },
  { id: "EMP008", name: "Sneha Patil",       dept: "Finance",     baseSalary: 32000, advanceId: null     },
  { id: "EMP015", name: "Rohan Nair",        dept: "IT",          baseSalary: 41000, advanceId: null     },
  { id: "EMP022", name: "Ananya Joshi",      dept: "HR",          baseSalary: 28000, advanceId: null     },
];

const ADVANCES = {
  ADV001: {
    id: "ADV001", amount: 15000, paymentType: "Salary Advance",
    reason: "Medical emergency", givenDate: "2026-03-28", status: "pending",
    deductions: [
      { month: "Apr 2026", amount: 5000, status: "upcoming" },
      { month: "May 2026", amount: 5000, status: "upcoming" },
      { month: "Jun 2026", amount: 5000, status: "upcoming" },
    ],
  },
  ADV002: {
    id: "ADV002", amount: 8000, paymentType: "Salary Advance",
    reason: "Home renovation", givenDate: "2026-03-30", status: "pending",
    deductions: [
      { month: "Apr 2026", amount: 4000, status: "upcoming" },
      { month: "May 2026", amount: 4000, status: "upcoming" },
    ],
  },
  ADV003: {
    id: "ADV003", amount: 20000, paymentType: "Loan Advance",
    reason: "Education fee", givenDate: "2026-01-10", status: "approved",
    deductions: [
      { month: "Jan 2026", amount: 5000, status: "done" },
      { month: "Feb 2026", amount: 5000, status: "done" },
      { month: "Mar 2026", amount: 5000, status: "done" },
      { month: "Apr 2026", amount: 5000, status: "upcoming" },
    ],
  },
  ADV005: {
    id: "ADV005", amount: 12000, paymentType: "Loan Advance",
    reason: "Vehicle repair", givenDate: "2026-01-20", status: "approved",
    deductions: [
      { month: "Jan 2026", amount: 4000, status: "done" },
      { month: "Feb 2026", amount: 4000, status: "done" },
      { month: "Mar 2026", amount: 4000, status: "done" },
    ],
  },
  ADV006: {
    id: "ADV006", amount: 9000, paymentType: "Salary Advance",
    reason: "Education", givenDate: "2026-01-15", status: "approved",
    deductions: [
      { month: "Jan 2026", amount: 3000, status: "done" },
      { month: "Feb 2026", amount: 3000, status: "done" },
      { month: "Mar 2026", amount: 3000, status: "done" },
    ],
  },
};

const MONTHS = ["Jan 2026","Feb 2026","Mar 2026","Apr 2026","May 2026","Jun 2026"];
const MONTH_ORDER = Object.fromEntries(MONTHS.map((m, i) => [m, i]));

// ─── Helpers ──────────────────────────────────────────────────────────────────
const fmt = (n) => `₹${Math.round(Number(n)).toLocaleString("en-IN")}`;
const initials = (name) => name.split(" ").slice(0, 2).map((x) => x[0]).join("");

function buildLedger() {
  const ledger = [];
  EMPLOYEES.forEach((emp) => {
    const adv = emp.advanceId ? ADVANCES[emp.advanceId] : null;
    MONTHS.forEach((month) => {
      const deduct = adv ? adv.deductions.find((d) => d.month === month) : null;
      const givenMonthStr = adv
        ? new Date(adv.givenDate).toLocaleString("en-IN", { month: "short", year: "numeric" })
        : "";
      const advGiven = givenMonthStr === month ? adv.amount : 0;
      const deductAmt = deduct ? deduct.amount : 0;
      const net = emp.baseSalary - deductAmt;
      if (deductAmt > 0 || advGiven > 0) {
        ledger.push({
          empId: emp.id, name: emp.name, dept: emp.dept,
          baseSalary: emp.baseSalary, month, advGiven, deductAmt,
          net, deductStatus: deduct?.status ?? null,
          reason: adv?.reason ?? "", paymentType: adv?.paymentType ?? "",
          advanceId: emp.advanceId,
        });
      } else if (!adv && MONTH_ORDER[month] < 3) {
        ledger.push({
          empId: emp.id, name: emp.name, dept: emp.dept,
          baseSalary: emp.baseSalary, month, advGiven: 0, deductAmt: 0,
          net: emp.baseSalary, deductStatus: null,
          reason: "", paymentType: "Regular", advanceId: null,
        });
      }
    });
  });
  return ledger;
}

// ─── Badge ────────────────────────────────────────────────────────────────────
const BADGE_STYLES = {
  done:     "bg-emerald-50 text-emerald-700 ring-emerald-200",
  upcoming: "bg-violet-50  text-violet-700  ring-violet-200",
  advance:  "bg-blue-50    text-blue-700    ring-blue-200",
  regular:  "bg-slate-100  text-slate-600   ring-slate-200",
};
const BADGE_DOT = {
  done: "bg-emerald-400", upcoming: "bg-violet-400",
  advance: "bg-blue-400", regular: "bg-slate-400",
};
const BADGE_LABEL = { done:"Deducted", upcoming:"Upcoming", advance:"Advance given", regular:"Regular" };

function Badge({ type }) {
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-semibold ring-1 ${BADGE_STYLES[type] ?? BADGE_STYLES.regular}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${BADGE_DOT[type] ?? BADGE_DOT.regular}`} />
      {BADGE_LABEL[type] ?? type}
    </span>
  );
}

// ─── Change Cell ──────────────────────────────────────────────────────────────
function ChangeCell({ row }) {
  if (row.advGiven > 0)
    return (
      <div className="flex items-center gap-1 text-blue-600 font-semibold text-xs">
        <TrendingUp size={13} />
        +{fmt(row.advGiven)}
        <span className="text-slate-400 font-normal">advance</span>
      </div>
    );
  if (row.deductAmt > 0)
    return (
      <div className="flex items-center gap-1 text-red-500 font-semibold text-xs">
        <TrendingDown size={13} />
        −{fmt(row.deductAmt)}
        <span className="text-slate-400 font-normal">deducted</span>
      </div>
    );
  return <span className="text-slate-300 text-xs">— no change</span>;
}

// ─── Stat Card ────────────────────────────────────────────────────────────────
function StatCard({ icon: Icon, label, value, iconBg, iconColor }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 flex items-center gap-3">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${iconBg}`}>
        <Icon size={18} className={iconColor} />
      </div>
      <div>
        <p className="text-lg font-bold text-slate-800 leading-tight">{value}</p>
        <p className="text-xs text-slate-500 mt-0.5">{label}</p>
      </div>
    </div>
  );
}

// ─── Flow Chart ───────────────────────────────────────────────────────────────
function FlowChart({ ledger }) {
  const data = MONTHS.map((m) => {
    const rows = ledger.filter((r) => r.month === m);
    return {
      netPaid:   rows.reduce((s, r) => s + r.net, 0),
      advGiven:  rows.reduce((s, r) => s + r.advGiven, 0),
      deducted:  rows.reduce((s, r) => s + r.deductAmt, 0),
    };
  });

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold text-slate-800 flex items-center gap-1.5">
            <BarChart2 size={15} className="text-indigo-500" /> Monthly salary flow overview
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">Net paid vs advances given vs deductions</p>
        </div>
        <div className="flex gap-4 text-xs text-slate-500">
          {[
            { color: "bg-indigo-400", label: "Net paid" },
            { color: "bg-amber-400",  label: "Advance given" },
            { color: "bg-red-400",    label: "Deducted" },
          ].map(({ color, label }) => (
            <span key={label} className="flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-sm inline-block ${color}`} />
              {label}
            </span>
          ))}
        </div>
      </div>
      <div style={{ height: 200 }}>
        <Bar
          data={{
            labels: MONTHS.map((m) => m.slice(0, 3)),
            datasets: [
              { label: "Net paid",     data: data.map((d) => d.netPaid),  backgroundColor: "#818cf8", borderRadius: 4, barPercentage: 0.65 },
              { label: "Advance given",data: data.map((d) => d.advGiven), backgroundColor: "#fbbf24", borderRadius: 4, barPercentage: 0.65 },
              { label: "Deducted",     data: data.map((d) => d.deducted), backgroundColor: "#f87171", borderRadius: 4, barPercentage: 0.65 },
            ],
          }}
          options={{
            responsive: true, maintainAspectRatio: false,
            plugins: {
              legend: { display: false },
              tooltip: { callbacks: { label: (c) => " " + fmt(c.raw) } },
            },
            scales: {
              x: { grid: { display: false }, ticks: { font: { size: 11 } } },
              y: { grid: { color: "rgba(0,0,0,.04)" }, ticks: { callback: (v) => fmt(v), font: { size: 10 } } },
            },
          }}
        />
      </div>
    </div>
  );
}

// ─── Table header row ─────────────────────────────────────────────────────────
function THead({ cols }) {
  return (
    <div className="flex bg-slate-50 border-b border-slate-100">
      {cols.map((c) => (
        <div key={c.label} className={`${c.cls} px-4 py-2.5 text-xs font-semibold text-slate-400 uppercase tracking-wide`}>
          {c.label}
        </div>
      ))}
    </div>
  );
}

const TIMELINE_COLS = [
  { label: "Employee",      cls: "w-52 flex-shrink-0" },
  { label: "Dept",          cls: "w-24 flex-shrink-0" },
  { label: "Base salary",   cls: "w-28 flex-shrink-0" },
  { label: "Change",        cls: "w-28 flex-shrink-0" },
  { label: "Net salary",    cls: "w-28 flex-shrink-0" },
  { label: "+/− Amount",    cls: "w-32 flex-shrink-0" },
  { label: "Status",        cls: "w-28 flex-shrink-0" },
  { label: "Reason",        cls: "flex-1" },
];
const EMP_COLS = [
  { label: "Month",         cls: "w-32 flex-shrink-0" },
  { label: "Base salary",   cls: "w-28 flex-shrink-0" },
  { label: "Advance given", cls: "w-28 flex-shrink-0" },
  { label: "Deducted",      cls: "w-28 flex-shrink-0" },
  { label: "Net received",  cls: "w-32 flex-shrink-0" },
  { label: "Change",        cls: "w-32 flex-shrink-0" },
  { label: "Status",        cls: "w-28 flex-shrink-0" },
  { label: "Note",          cls: "flex-1" },
];

// ─── Timeline Group (one month) ───────────────────────────────────────────────
function TimelineGroup({ month, rows }) {
  const [open, setOpen] = useState(true);
  const totalDed = rows.reduce((s, r) => s + r.deductAmt, 0);
  const totalAdv = rows.reduce((s, r) => s + r.advGiven, 0);
  const totalNet = rows.reduce((s, r) => s + r.net, 0);

  return (
    <div className="border-b border-slate-100 last:border-b-0">
      {/* Month header */}
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-4 py-3 bg-slate-50 hover:bg-slate-100 transition-colors text-left"
      >
        <div className="flex items-center gap-2.5 flex-wrap">
          {open ? <ChevronUp size={14} className="text-slate-400" /> : <ChevronDown size={14} className="text-slate-400" />}
          <span className="text-sm font-semibold text-slate-700">{month}</span>
          <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 font-semibold">{rows.length} employees</span>
          {totalAdv > 0 && <span className="text-xs px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 font-semibold">+{fmt(totalAdv)} advanced</span>}
          {totalDed > 0 && <span className="text-xs px-2 py-0.5 rounded-full bg-red-50 text-red-700 font-semibold">−{fmt(totalDed)} deducted</span>}
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-500 flex-shrink-0">
          <span>Net disbursed:</span>
          <span className="font-semibold text-slate-800">{fmt(totalNet)}</span>
        </div>
      </button>

      {open && (
        <div className="overflow-x-auto">
          <THead cols={TIMELINE_COLS} />
          {rows.map((r) => (
            <div key={r.empId} className="flex items-center border-b border-slate-50 hover:bg-slate-50 transition-colors last:border-b-0">
              {/* Employee */}
              <div className="w-52 flex-shrink-0 px-4 py-3 flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-xs font-semibold flex-shrink-0">
                  {initials(r.name)}
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-slate-800 truncate">{r.name}</p>
                  <p className="text-xs text-slate-400">{r.empId}</p>
                </div>
              </div>
              <div className="w-24 flex-shrink-0 px-4 py-3 text-xs text-slate-500">{r.dept}</div>
              <div className="w-28 flex-shrink-0 px-4 py-3 text-xs font-semibold text-slate-700">{fmt(r.baseSalary)}</div>
              <div className="w-28 flex-shrink-0 px-4 py-3 text-xs font-semibold">
                {r.advGiven > 0
                  ? <span className="text-blue-600">+{fmt(r.advGiven)}</span>
                  : r.deductAmt > 0
                    ? <span className="text-red-500">−{fmt(r.deductAmt)}</span>
                    : <span className="text-slate-300">—</span>}
              </div>
              <div className="w-28 flex-shrink-0 px-4 py-3 text-xs font-semibold">
                <span className={r.deductAmt > 0 ? "text-red-500" : "text-slate-800"}>{fmt(r.net)}</span>
              </div>
              <div className="w-32 flex-shrink-0 px-4 py-3"><ChangeCell row={r} /></div>
              <div className="w-28 flex-shrink-0 px-4 py-3">
                <Badge type={r.advGiven > 0 ? "advance" : r.deductAmt > 0 ? (r.deductStatus ?? "upcoming") : "regular"} />
              </div>
              <div className="flex-1 px-4 py-3 text-xs text-slate-500 truncate">
                {r.reason || "Regular salary"}
                {r.paymentType && r.paymentType !== "Regular" && (
                  <span className="ml-1 text-slate-400">· {r.paymentType}</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Employee Group ───────────────────────────────────────────────────────────
function EmployeeGroup({ emp, rows }) {
  const [open, setOpen] = useState(true);
  const adv = emp.advanceId ? ADVANCES[emp.advanceId] : null;
  const totalDed = rows.reduce((s, r) => s + r.deductAmt, 0);
  const totalAdv = rows.reduce((s, r) => s + r.advGiven, 0);
  const pct      = adv ? Math.round((totalDed / adv.amount) * 100) : 0;
  const sorted   = [...rows].sort((a, b) => MONTH_ORDER[a.month] - MONTH_ORDER[b.month]);

  return (
    <div className="border-b border-slate-100 last:border-b-0">
      {/* Employee header */}
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-4 py-3 bg-slate-50 hover:bg-slate-100 transition-colors text-left"
      >
        <div className="flex items-center gap-2.5 flex-wrap">
          {open ? <ChevronUp size={14} className="text-slate-400" /> : <ChevronDown size={14} className="text-slate-400" />}
          <div className="w-7 h-7 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-xs font-semibold flex-shrink-0">
            {initials(emp.name)}
          </div>
          <span className="text-sm font-semibold text-slate-700">{emp.name}</span>
          <span className="text-xs text-slate-400">{emp.id} · {emp.dept}</span>
          {adv ? (
            <>
              <span className="text-xs px-2 py-0.5 rounded-full bg-red-50 text-red-700 font-semibold">Advance: {fmt(adv.amount)}</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-semibold">Deducted: {fmt(totalDed)}</span>
              {pct > 0 && <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 font-semibold">{pct}% cleared</span>}
            </>
          ) : (
            <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 font-semibold">No advance</span>
          )}
        </div>
        <span className="text-xs text-slate-500 flex-shrink-0">Base: <strong className="text-slate-800">{fmt(emp.baseSalary)}</strong></span>
      </button>

      {open && (
        <div className="overflow-x-auto">
          <THead cols={EMP_COLS} />
          {sorted.map((r) => (
            <div key={r.month} className="flex items-center border-b border-slate-50 hover:bg-slate-50 transition-colors last:border-b-0">
              <div className="w-32 flex-shrink-0 px-4 py-3 text-xs font-semibold text-slate-800">{r.month}</div>
              <div className="w-28 flex-shrink-0 px-4 py-3 text-xs font-semibold text-slate-700">{fmt(r.baseSalary)}</div>
              <div className="w-28 flex-shrink-0 px-4 py-3 text-xs font-semibold">
                {r.advGiven > 0 ? <span className="text-blue-600">+{fmt(r.advGiven)}</span> : <span className="text-slate-300">—</span>}
              </div>
              <div className="w-28 flex-shrink-0 px-4 py-3 text-xs font-semibold">
                {r.deductAmt > 0 ? <span className="text-red-500">−{fmt(r.deductAmt)}</span> : <span className="text-slate-300">—</span>}
              </div>
              <div className="w-32 flex-shrink-0 px-4 py-3 text-xs font-semibold">
                <span className={r.deductAmt > 0 ? "text-red-500" : "text-slate-800"}>{fmt(r.net)}</span>
              </div>
              <div className="w-32 flex-shrink-0 px-4 py-3"><ChangeCell row={r} /></div>
              <div className="w-28 flex-shrink-0 px-4 py-3">
                <Badge type={r.advGiven > 0 ? "advance" : r.deductAmt > 0 ? (r.deductStatus ?? "upcoming") : "regular"} />
              </div>
              <div className="flex-1 px-4 py-3 text-xs text-slate-500">{r.reason || "Regular salary"}</div>
            </div>
          ))}
          {/* Summary strip */}
          {adv && (
            <div className="px-4 py-3 border-t border-slate-100 bg-slate-50">
              <div className="grid grid-cols-5 gap-3 text-center">
                {[
                  { val: fmt(adv.amount),         lbl: "Total advance",  color: "" },
                  { val: fmt(totalDed),            lbl: "Total deducted", color: "text-emerald-600" },
                  { val: fmt(adv.amount-totalDed), lbl: "Remaining",      color: adv.amount-totalDed > 0 ? "text-red-500" : "text-emerald-600" },
                  { val: `${pct}%`,                lbl: "Cleared",        color: "text-indigo-600" },
                  { val: rows.filter((r) => r.deductAmt > 0).length, lbl: "EMIs done", color: "" },
                ].map(({ val, lbl, color }) => (
                  <div key={lbl} className="bg-white rounded-xl py-2 px-3 border border-slate-100">
                    <p className={`text-sm font-bold ${color || "text-slate-800"}`}>{val}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{lbl}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function PaymentHistory() {
  const [view,   setView]   = useState("timeline");
  const [search, setSearch] = useState("");
  const allLedger = buildLedger();

  const filtered = search
    ? allLedger.filter((r) =>
        r.name.toLowerCase().includes(search.toLowerCase()) ||
        r.empId.toLowerCase().includes(search.toLowerCase()) ||
        r.dept.toLowerCase().includes(search.toLowerCase())
      )
    : allLedger;

  // Stats
  const advances    = Object.values(ADVANCES);
  const totalDisb   = advances.reduce((s, a) => s + a.amount, 0);
  const totalDed    = advances.reduce((s, a) => s + a.deductions.filter((d) => d.status === "done").reduce((ss, d) => ss + d.amount, 0), 0);
  const totalRem    = totalDisb - totalDed;
  const onAdvance   = advances.length;

  return (
    <div className="space-y-5">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Salary payment history</h1>
        <p className="text-sm text-slate-400 mt-1">
          Overall advance disbursals & monthly salary deductions across all employees
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard icon={Wallet}          label="Total advance given"     value={fmt(totalDisb)} iconBg="bg-indigo-100" iconColor="text-indigo-600" />
        <StatCard icon={TrendingDown}    label="Total deducted so far"   value={fmt(totalDed)}  iconBg="bg-emerald-100" iconColor="text-emerald-600" />
        <StatCard icon={ArrowDownCircle} label="Outstanding balance"     value={fmt(totalRem)}  iconBg="bg-red-100" iconColor="text-red-600" />
        <StatCard icon={Users}           label="Employees on advance"    value={`${onAdvance} / ${EMPLOYEES.length}`} iconBg="bg-blue-100" iconColor="text-blue-600" />
      </div>

      {/* Chart */}
      <FlowChart ledger={allLedger} />

      {/* Main table panel */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Panel toolbar */}
        <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between gap-3 flex-wrap">
          {/* View toggle */}
          <div className="flex bg-slate-100 rounded-xl p-1 gap-1">
            {[
              { key: "timeline", label: "By month" },
              { key: "employee", label: "By employee" },
            ].map((v) => (
              <button
                key={v.key}
                onClick={() => setView(v.key)}
                className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-all ${
                  view === v.key ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-700"
                }`}
              >
                {v.label}
              </button>
            ))}
          </div>
          {/* Search */}
          <div className="relative">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search employee, dept…"
              className="pl-8 pr-4 py-2 text-sm border border-slate-200 rounded-xl bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-200 w-52"
            />
          </div>
        </div>

        {/* Timeline view */}
        {view === "timeline" && (
          <div>
            {MONTHS.map((month) => {
              const rows = filtered.filter((r) => r.month === month);
              return rows.length ? <TimelineGroup key={month} month={month} rows={rows} /> : null;
            })}
          </div>
        )}

        {/* Employee view */}
        {view === "employee" && (
          <div>
            {EMPLOYEES.map((emp) => {
              const rows = filtered.filter((r) => r.empId === emp.id);
              return rows.length ? <EmployeeGroup key={emp.id} emp={emp} rows={rows} /> : null;
            })}
          </div>
        )}

        {/* Empty */}
        {filtered.length === 0 && (
          <div className="py-16 text-center text-slate-400">
            <p className="font-semibold">No records found</p>
            <p className="text-sm mt-1">Try adjusting your search</p>
          </div>
        )}
      </div>
    </div>
  );
}