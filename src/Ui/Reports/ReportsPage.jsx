// =============================================================================
// FILE: src/Ui/Reports/ReportsPage.jsx
// Connected to real backend — shows empty states for months with no data.
// =============================================================================
import React, { useState } from 'react';
import {
  RefreshCw, Download, TrendingUp, BarChart2, PieChart as PieIcon, ChevronDown, AlertCircle,
} from 'lucide-react';
import { useReportData } from './useReportData';
import { KpiCards }                    from './KpiCards';
import { PieChart, LineChart, BarChart } from './Charts';
import { DeptTable }                   from './DeptTable';

const TABS = [
  { id: 'overview', label: 'Overview',          icon: TrendingUp  },
  { id: 'payroll',  label: 'Payroll Analysis',  icon: BarChart2   },
  { id: 'advance',  label: 'Advance Payments',  icon: PieIcon     },
];
const VIEWS = ['monthly', 'quarterly', 'yearly'];

const Section = ({ title, children, action }) => (
  <div style={{
    background: '#fff', borderRadius: 16, padding: '22px 24px',
    boxShadow: '0 1px 4px rgba(0,0,0,0.06),0 4px 18px rgba(0,0,0,0.04)',
    border: '1px solid #f1f5f9', marginBottom: 20,
  }}>
    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:18 }}>
      <h3 style={{ margin:0, fontSize:14, fontWeight:700, color:'#111827', fontFamily:"'DM Sans',sans-serif" }}>
        {title}
      </h3>
      {action}
    </div>
    {children}
  </div>
);

const Chip = ({ label, active, onClick }) => (
  <button onClick={onClick} style={{
    padding:'5px 14px', borderRadius:20, fontSize:12, fontWeight:600,
    fontFamily:"'DM Sans',sans-serif", cursor:'pointer', border:'none',
    background: active ? '#1d4ed8' : '#f1f5f9',
    color:      active ? '#fff'    : '#6b7280',
    transition: 'all .15s',
  }}>{label}</button>
);

const EmptyState = ({ msg }) => (
  <div style={{
    display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center',
    height:200, gap:12, color:'#9ca3af',
  }}>
    <BarChart2 size={36} strokeWidth={1.2} />
    <p style={{ margin:0, fontSize:13, fontFamily:"'DM Sans',sans-serif" }}>{msg}</p>
  </div>
);

// Export to CSV helper
function exportCSV(rows, filename) {
  if (!rows?.length) return;
  const keys  = Object.keys(rows[0]);
  const lines = [keys.join(','), ...rows.map(r => keys.map(k => JSON.stringify(r[k] ?? '')).join(','))];
  const blob  = new Blob([lines.join('\n')], { type:'text/csv' });
  const a     = document.createElement('a');
  a.href      = URL.createObjectURL(blob);
  a.download  = filename;
  a.click();
}

export default function ReportsPage() {
  const { data, loading, error, year, setYear, view, setView, refresh, currentYear } = useReportData();
  const [tab, setTab] = useState('overview');

  const yearOpts = Array.from({ length: currentYear - 2020 }, (_, i) => 2021 + i);

  const viewData = data
    ? view === 'monthly'   ? data.monthly
    : view === 'quarterly' ? data.quarterly
    : data.yearly
    : [];

  const xKey    = view === 'monthly' ? 'month' : view === 'quarterly' ? 'shortLabel' : 'year';
  const xLabels = viewData.map(d => d[xKey]);

  const hasPayrollData  = data?.monthly?.some(m => m.totalPayroll  > 0);
  const hasAdvanceData  = data?.monthly?.some(m => m.advanceIssued > 0);

  return (
    <div style={{ fontFamily:"'DM Sans',sans-serif", minHeight:'100%' }}>
      {/* ── Header ───────────────────────────────────────────────── */}
      <div style={{ marginBottom:24 }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', flexWrap:'wrap', gap:12 }}>
          <div>
            <h1 style={{ margin:0, fontSize:24, fontWeight:800, color:'#0f172a', letterSpacing:'-0.5px' }}>
              Financial Reports
            </h1>
            <p style={{ margin:'4px 0 0', fontSize:13, color:'#64748b' }}>
              Payroll &amp; Advance Payment analytics — live from database
            </p>
          </div>
          <div style={{ display:'flex', gap:10, alignItems:'center', flexWrap:'wrap' }}>
            {/* Year */}
            <div style={{ position:'relative' }}>
              <select value={year} onChange={e => setYear(Number(e.target.value))} style={{
                appearance:'none', padding:'8px 32px 8px 12px', borderRadius:10,
                border:'1px solid #e2e8f0', background:'#fff', fontSize:13,
                fontWeight:600, color:'#374151', cursor:'pointer',
                fontFamily:"'DM Sans',sans-serif", boxShadow:'0 1px 3px rgba(0,0,0,0.06)',
              }}>
                {yearOpts.map(y => <option key={y} value={y}>{y}</option>)}
              </select>
              <ChevronDown size={14} style={{ position:'absolute', right:10, top:'50%', transform:'translateY(-50%)', color:'#9ca3af', pointerEvents:'none' }}/>
            </div>

            {/* Refresh */}
            <button onClick={refresh} style={{
              display:'flex', alignItems:'center', gap:6, padding:'8px 14px',
              borderRadius:10, border:'1px solid #e2e8f0', background:'#fff',
              fontSize:13, fontWeight:600, color:'#374151', cursor:'pointer',
              fontFamily:"'DM Sans',sans-serif", boxShadow:'0 1px 3px rgba(0,0,0,0.06)',
            }}>
              <RefreshCw size={14} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }}/>
              Refresh
            </button>

            {/* Export */}
            <button onClick={() => {
              if (tab === 'payroll')  exportCSV(data?.monthly,   `payroll-${year}.csv`);
              if (tab === 'advance')  exportCSV(data?.monthly,   `advances-${year}.csv`);
              if (tab === 'overview') exportCSV(data?.deptBreak, `dept-${year}.csv`);
            }} style={{
              display:'flex', alignItems:'center', gap:6, padding:'8px 16px',
              borderRadius:10, border:'none', background:'#1d4ed8', fontSize:13,
              fontWeight:600, color:'#fff', cursor:'pointer',
              fontFamily:"'DM Sans',sans-serif", boxShadow:'0 2px 8px rgba(29,78,216,0.3)',
            }}>
              <Download size={14}/> Export CSV
            </button>
          </div>
        </div>

        {/* Period toggle */}
        <div style={{ display:'flex', gap:8, marginTop:16 }}>
          {VIEWS.map(v => (
            <Chip key={v} label={v.charAt(0).toUpperCase()+v.slice(1)} active={view===v} onClick={()=>setView(v)}/>
          ))}
        </div>
      </div>

      {/* ── Tabs ─────────────────────────────────────────────────── */}
      <div style={{ display:'flex', gap:4, marginBottom:24, borderBottom:'2px solid #f1f5f9' }}>
        {TABS.map(t => {
          const Icon = t.icon;
          return (
            <button key={t.id} onClick={() => setTab(t.id)} style={{
              display:'flex', alignItems:'center', gap:7, padding:'10px 18px',
              border:'none', background:'none', fontSize:13,
              fontWeight: tab===t.id ? 700 : 500,
              color:      tab===t.id ? '#1d4ed8' : '#64748b',
              cursor:'pointer', fontFamily:"'DM Sans',sans-serif",
              borderBottom: `2px solid ${tab===t.id ? '#1d4ed8' : 'transparent'}`,
              marginBottom: -2, transition:'color .15s',
            }}>
              <Icon size={14}/>{t.label}
            </button>
          );
        })}
      </div>

      {/* ── Error ────────────────────────────────────────────────── */}
      {error && (
        <div style={{
          display:'flex', alignItems:'center', gap:10, padding:'14px 18px',
          borderRadius:10, background:'#fef2f2', border:'1px solid #fecaca',
          marginBottom:20, color:'#dc2626', fontSize:13, fontFamily:"'DM Sans',sans-serif",
        }}>
          <AlertCircle size={16}/>
          <strong>API Error:</strong>&nbsp;{error}&nbsp;—&nbsp;
          <span style={{ color:'#6b7280' }}>Check that your backend is running and CORS is configured.</span>
        </div>
      )}

      {/* ── Loading ──────────────────────────────────────────────── */}
      {loading && (
        <div style={{ display:'flex', justifyContent:'center', alignItems:'center', height:240 }}>
          <div style={{
            width:40, height:40, border:'3px solid #e2e8f0',
            borderTopColor:'#1d4ed8', borderRadius:'50%',
            animation:'spin 0.8s linear infinite',
          }}/>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      )}

      {/* ── No data notice ───────────────────────────────────────── */}
      {!loading && !error && data && !hasPayrollData && (
        <div style={{
          display:'flex', alignItems:'center', gap:10, padding:'14px 18px',
          borderRadius:10, background:'#fffbeb', border:'1px solid #fde68a',
          marginBottom:20, color:'#92400e', fontSize:13, fontFamily:"'DM Sans',sans-serif",
        }}>
          <AlertCircle size={16}/>
          No paid payroll records found for {year}. Charts will be empty until salary is marked as Paid.
        </div>
      )}

      {/* ── Content ──────────────────────────────────────────────── */}
      {!loading && data && (
        <>
          {/* ═══ OVERVIEW ════════════════════════════════════════════ */}
          {tab === 'overview' && (
            <>
              <KpiCards totals={data.totals}/>

              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:20, marginBottom:20 }}>
                <Section title={`Payroll Trend — ${year}`}>
                  {hasPayrollData ? (
                    <LineChart labels={xLabels} series={[
                      { name:'Total Payroll', color:'#3b82f6', data: viewData.map(d => d.totalPayroll||0) },
                      { name:'Net Payroll',   color:'#10b981', data: viewData.map(d => d.netPayroll||0)   },
                    ]} height={200}/>
                  ) : <EmptyState msg="No paid payroll data for this period"/>}
                </Section>

                <Section title="Payroll Composition">
                  {data.pieData?.length > 0
                    ? <PieChart data={data.pieData} size={200} donut={true}/>
                    : <EmptyState msg="No payroll data to break down"/>}
                </Section>
              </div>

              <Section title={`Advance Payments — ${year}`}>
                {hasAdvanceData ? (
                  <BarChart data={viewData} xKey={xKey} height={200} bars={[
                    { key:'advanceIssued',    name:'Issued',    color:'#8b5cf6' },
                    { key:'advanceRecovered', name:'Recovered', color:'#06b6d4' },
                    { key:'advancePending',   name:'Pending',   color:'#f59e0b' },
                  ]}/>
                ) : <EmptyState msg="No advance payment data for this period"/>}
              </Section>

              <Section title="Department Breakdown">
                {data.deptBreak?.length > 0
                  ? <DeptTable data={data.deptBreak}/>
                  : <EmptyState msg="No department data available"/>}
              </Section>
            </>
          )}

          {/* ═══ PAYROLL ═════════════════════════════════════════════ */}
          {tab === 'payroll' && (
            <>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:20, marginBottom:20 }}>
                <Section title="Gross vs Net Payroll">
                  {hasPayrollData ? (
                    <LineChart labels={xLabels} series={[
                      { name:'Gross',      color:'#3b82f6', data: viewData.map(d => d.totalPayroll||0)    },
                      { name:'Net',        color:'#10b981', data: viewData.map(d => d.netPayroll||0)      },
                      { name:'Deductions', color:'#ef4444', data: viewData.map(d => d.totalDeductions||0) },
                    ]} height={200}/>
                  ) : <EmptyState msg="No payroll data"/>}
                </Section>

                <Section title="Payroll Component Split">
                  {data.pieData?.length > 0
                    ? <PieChart data={data.pieData} size={200} donut={true}/>
                    : <EmptyState msg="No component data"/>}
                </Section>
              </div>

              <Section title="Component-wise Payroll">
                {hasPayrollData ? (
                  <BarChart data={viewData} xKey={xKey} height={220} bars={[
                    { key:'basicPay',       name:'Basic',       color:'#3b82f6' },
                    { key:'hra',            name:'HRA',         color:'#8b5cf6' },
                    { key:'orgAllowance',   name:'Org Allow.',  color:'#06b6d4' },
                    { key:'performancePay', name:'Performance', color:'#10b981' },
                  ]}/>
                ) : <EmptyState msg="No component data"/>}
              </Section>

              <Section title="Deductions Breakdown">
                {hasPayrollData ? (
                  <BarChart data={viewData} xKey={xKey} height={200} bars={[
                    { key:'pfDeduction', name:'PF', color:'#f59e0b' },
                    { key:'ptDeduction', name:'PT', color:'#ef4444' },
                    { key:'tdsDeduction',name:'TDS',color:'#8b5cf6' },
                  ]}/>
                ) : <EmptyState msg="No deduction data"/>}
              </Section>

              <Section title="Employees Paid Per Period">
                {hasPayrollData ? (
                  <LineChart labels={xLabels} series={[{
                    name:'Employees Paid', color:'#1d4ed8',
                    data: viewData.map(d => d.employeesPaid || d.avgEmployees || 0),
                  }]} height={160} showArea={true}/>
                ) : <EmptyState msg="No payroll data"/>}
              </Section>
            </>
          )}

          {/* ═══ ADVANCE PAYMENTS ════════════════════════════════════ */}
          {tab === 'advance' && (
            <>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:20, marginBottom:20 }}>
                <Section title="Advance Flow">
                  {hasAdvanceData ? (
                    <LineChart labels={xLabels} series={[
                      { name:'Issued',    color:'#8b5cf6', data: viewData.map(d => d.advanceIssued||0)    },
                      { name:'Recovered', color:'#06b6d4', data: viewData.map(d => d.advanceRecovered||0) },
                      { name:'Pending',   color:'#f59e0b', data: viewData.map(d => d.advancePending||0)   },
                    ]} height={200}/>
                  ) : <EmptyState msg="No advance data for this period"/>}
                </Section>

                <Section title="Advance Distribution">
                  {(data.totals.advance > 0) ? (
                    <PieChart data={[
                      { label:'Issued',    value: data.totals.advance,   color:'#8b5cf6' },
                      { label:'Recovered', value: data.totals.recovered, color:'#06b6d4' },
                      { label:'Pending',   value: data.totals.pending,   color:'#f59e0b' },
                    ].filter(d => d.value > 0)} size={200} donut={true}/>
                  ) : <EmptyState msg="No advance totals"/>}
                </Section>
              </div>

              <Section title="Issued vs Recovered">
                {hasAdvanceData ? (
                  <BarChart data={viewData} xKey={xKey} height={200} bars={[
                    { key:'advanceIssued',    name:'Issued',    color:'#8b5cf6' },
                    { key:'advanceRecovered', name:'Recovered', color:'#06b6d4' },
                  ]}/>
                ) : <EmptyState msg="No advance data"/>}
              </Section>

              {/* Recovery summary cards */}
              <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(180px,1fr))', gap:14 }}>
                {[
                  { label:'Recovery Rate',   value: data.totals.advance > 0 ? `${((data.totals.recovered/data.totals.advance)*100).toFixed(1)}%` : 'N/A', color:'#10b981', bg:'#ecfdf5' },
                  { label:'Total Issued',    value: `₹${(data.totals.advance/1e3).toFixed(1)}K`,   color:'#8b5cf6', bg:'#f5f3ff' },
                  { label:'Total Recovered', value: `₹${(data.totals.recovered/1e3).toFixed(1)}K`, color:'#06b6d4', bg:'#ecfeff' },
                  { label:'Still Pending',   value: `₹${(data.totals.pending/1e3).toFixed(1)}K`,   color:'#ef4444', bg:'#fef2f2' },
                ].map((c,i) => (
                  <div key={i} style={{ background:c.bg, borderRadius:12, padding:'16px 18px', border:`1px solid ${c.color}22` }}>
                    <div style={{ fontSize:22, fontWeight:800, color:c.color, fontFamily:"'DM Sans',sans-serif" }}>{c.value}</div>
                    <div style={{ fontSize:12, color:'#64748b', fontFamily:"'DM Sans',sans-serif", marginTop:3 }}>{c.label}</div>
                  </div>
                ))}
              </div>
            </>
          )}
        </>
      )}

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap');
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}