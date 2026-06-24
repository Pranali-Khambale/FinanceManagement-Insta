// src/Ui/Reports/ReportsPage.jsx
import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import {
  RefreshCw, Download, TrendingUp, BarChart2,
  PieChart as PieIcon, ChevronDown, AlertCircle,
} from 'lucide-react';
import { useReportData } from './useReportData';
import { useBreakpoint }  from './useBreakpoint';
import { KpiCards }                      from './KpiCards';
import { PieChart, LineChart, BarChart }  from './Charts';
import { DeptTable }                     from './DeptTable';

// ─── Constants ────────────────────────────────────────────────────────────────
const TABS = [
  { id: 'overview', label: 'Overview',         icon: TrendingUp },
  { id: 'payroll',  label: 'Payroll Analysis', icon: BarChart2  },
  { id: 'advance',  label: 'Advance Payments', icon: PieIcon    },
];
const VIEWS = ['monthly', 'quarterly', 'yearly'];

// ─── Column label maps (unchanged from original) ──────────────────────────────
const PAYROLL_COLS = {
  month: 'Month', monthLabel: 'Period', totalPayroll: 'Gross Payroll (₹)',
  basicPay: 'Basic Pay (₹)', hra: 'HRA (₹)', orgAllowance: 'Other Allowances (₹)',
  performancePay: 'Performance Pay (₹)', grossEarned: 'Gross Earned (₹)',
  totalDeductions: 'Total Deductions (₹)', pfDeduction: 'PF Employee 12% (₹)',
  employerPf: 'PF Employer 13% (₹)', totalPf: 'Total PF 25% (₹)',
  ptDeduction: 'PT (₹)', gratuity: 'Gratuity 4.81% (₹)', tdsDeduction: 'TDS (₹)',
  otherDeduction: 'Other Deductions (₹)', advanceDeduction: 'Advance Recovery (₹)',
  advanceAddition: 'Advance Addition (₹)', netPayroll: 'Net Payroll (₹)',
  employeesPaid: 'Employees Paid',
};
const ADVANCE_COLS = {
  month: 'Month', monthLabel: 'Period', advanceIssued: 'Advance Issued (₹)',
  advanceRecovered: 'Advance Recovered (₹)', advancePending: 'Advance Pending (₹)',
  advanceCount: 'No. of Advances',
};
const QUARTERLY_PAYROLL_COLS = {
  quarter: 'Quarter', shortLabel: 'Short Label', totalPayroll: 'Gross Payroll (₹)',
  netPayroll: 'Net Payroll (₹)', totalDeductions: 'Total Deductions (₹)',
  pfDeduction: 'PF Employee 12% (₹)', employerPf: 'PF Employer 13% (₹)',
  totalPf: 'Total PF 25% (₹)', ptDeduction: 'PT (₹)', gratuity: 'Gratuity 4.81% (₹)',
  tdsDeduction: 'TDS (₹)', otherDeduction: 'Other Deductions (₹)',
  advanceDeduction: 'Advance Recovery (₹)', advanceAddition: 'Advance Addition (₹)',
  performancePay: 'Performance Pay (₹)', employeesPaid: 'Employees Paid',
  advanceIssued: 'Advance Issued (₹)', advanceRecovered: 'Advance Recovered (₹)',
  advancePending: 'Advance Pending (₹)',
};
const YEARLY_COLS = {
  year: 'Year', totalPayroll: 'Gross Payroll (₹)', netPayroll: 'Net Payroll (₹)',
  totalDeductions: 'Total Deductions (₹)', pfDeduction: 'PF Employee 12% (₹)',
  employerPf: 'PF Employer 13% (₹)', totalPf: 'Total PF 25% (₹)',
  ptDeduction: 'PT (₹)', gratuity: 'Gratuity 4.81% (₹)', tdsDeduction: 'TDS (₹)',
  otherDeduction: 'Other Deductions (₹)', advanceDeduction: 'Advance Recovery (₹)',
  advanceAddition: 'Advance Addition (₹)', performancePay: 'Performance Pay (₹)',
  avgEmployees: 'Avg Employees', advanceIssued: 'Advance Issued (₹)',
  advanceRecovered: 'Advance Recovered (₹)', advancePending: 'Advance Pending (₹)',
};
const DEPT_COLS = {
  dept: 'Department', headcount: 'Headcount', payroll: 'Net Payroll (₹)',
  advances: 'Advances (₹)', pfTotal: 'PF Total (₹)',
};

// ─── XLSX export (unchanged) ──────────────────────────────────────────────────
function exportXLSX(rows, colMap, filename, sheetName = 'Report') {
  if (!rows?.length) { alert('No data available to export for the selected view.'); return; }
  const keys = Object.keys(colMap);
  const labels = Object.values(colMap);
  const aoa = [labels, ...rows.map(row => keys.map(k => row[k] ?? ''))];
  const ws = XLSX.utils.aoa_to_sheet(aoa);
  ws['!cols'] = labels.map((lbl, ci) => ({
    wch: Math.max(lbl.length, ...rows.map(row => String(row[keys[ci]] ?? '').length)) + 2,
  }));
  const range = XLSX.utils.decode_range(ws['!ref']);
  for (let C = range.s.c; C <= range.e.c; C++) {
    const addr = XLSX.utils.encode_cell({ r: 0, c: C });
    if (!ws[addr]) continue;
    ws[addr].s = {
      font: { bold: true, color: { rgb: 'FFFFFF' } },
      fill: { fgColor: { rgb: '1D4ED8' } },
      alignment: { horizontal: 'center' },
    };
  }
  for (let R = 1; R <= range.e.r; R++) {
    for (let C = range.s.c; C <= range.e.c; C++) {
      const label = labels[C];
      const addr = XLSX.utils.encode_cell({ r: R, c: C });
      if (!ws[addr]) continue;
      if (label?.includes('₹')) ws[addr].z = '#,##0.00';
    }
  }
  ws['!freeze'] = { xSplit: 0, ySplit: 1, topLeftCell: 'A2', activePane: 'bottomLeft' };
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheetName);
  XLSX.writeFile(wb, filename);
}

function handleExport({ tab, view, data, year }) {
  if (!data) return;
  if (tab === 'overview') {
    exportXLSX(data.deptBreak, DEPT_COLS, `dept-breakdown-${year}.xlsx`, 'Dept Breakdown');
    return;
  }
  let rows, colMap;
  if (view === 'monthly') {
    rows = data.monthly; colMap = tab === 'payroll' ? PAYROLL_COLS : ADVANCE_COLS;
  } else if (view === 'quarterly') {
    rows = data.quarterly; colMap = QUARTERLY_PAYROLL_COLS;
  } else {
    rows = data.yearly; colMap = YEARLY_COLS;
  }
  const tabLabel = tab === 'payroll' ? 'payroll' : 'advances';
  const sheet = `${tabLabel}-${view}`.replace(/^./, c => c.toUpperCase());
  exportXLSX(rows, colMap, `${tabLabel}-${year}-${view}.xlsx`, sheet);
}

// ─── Sub-components ───────────────────────────────────────────────────────────
const Section = ({ title, children, action, isMobile }) => (
  <div style={{
    background: '#fff',
    borderRadius: isMobile ? 12 : 16,
    padding: isMobile ? '16px 14px' : '22px 24px',
    boxShadow: '0 1px 4px rgba(0,0,0,0.06),0 4px 18px rgba(0,0,0,0.04)',
    border: '1px solid #f1f5f9',
    marginBottom: isMobile ? 14 : 20,
  }}>
    <div style={{
      display: 'flex', justifyContent: 'space-between',
      alignItems: 'center', marginBottom: isMobile ? 14 : 18,
      flexWrap: 'wrap', gap: 8,
    }}>
      <h3 style={{
        margin: 0, fontSize: isMobile ? 13 : 14,
        fontWeight: 700, color: '#111827',
        fontFamily: "'DM Sans',sans-serif",
      }}>
        {title}
      </h3>
      {action}
    </div>
    {children}
  </div>
);

const Chip = ({ label, active, onClick, isMobile }) => (
  <button
    onClick={onClick}
    style={{
      padding: isMobile ? '4px 10px' : '5px 14px',
      borderRadius: 20,
      fontSize: isMobile ? 11 : 12,
      fontWeight: 600,
      fontFamily: "'DM Sans',sans-serif",
      cursor: 'pointer', border: 'none',
      background: active ? '#1d4ed8' : '#f1f5f9',
      color: active ? '#fff' : '#6b7280',
      transition: 'all .15s',
    }}
  >
    {label}
  </button>
);

const EmptyState = ({ msg }) => (
  <div style={{
    display: 'flex', flexDirection: 'column', alignItems: 'center',
    justifyContent: 'center', height: 160, gap: 12, color: '#9ca3af',
  }}>
    <BarChart2 size={32} strokeWidth={1.2} />
    <p style={{ margin: 0, fontSize: 12, fontFamily: "'DM Sans',sans-serif", textAlign: 'center' }}>
      {msg}
    </p>
  </div>
);

// ─── Main component ───────────────────────────────────────────────────────────
export default function ReportsPage() {
  const {
    data, loading, error,
    year, setYear,
    view, setView,
    refresh, currentYear,
  } = useReportData();

  const { isMobile, isTablet, isSmall } = useBreakpoint();
  const [tab, setTab] = useState('overview');

  const yearOpts = Array.from({ length: currentYear - 2020 }, (_, i) => 2021 + i);

  const viewData = data
    ? view === 'monthly'   ? data.monthly
    : view === 'quarterly' ? data.quarterly
    : data.yearly
    : [];

  const xKey = view === 'monthly' ? 'month' : view === 'quarterly' ? 'shortLabel' : 'year';
  const xLabels = viewData.map(d => String(d[xKey] ?? ''));

  const hasPayrollData = data?.monthly?.some(m => m.totalPayroll  > 0);
  const hasAdvanceData = data?.monthly?.some(m => m.advanceIssued > 0);
  const viewHasPayroll = viewData.some(d => (d.totalPayroll  || 0) > 0);
  const viewHasAdvance = viewData.some(d => (d.advanceIssued || 0) > 0);

  const exportLabel = tab === 'overview'
    ? (isMobile ? 'Export' : 'Export Dept')
    : (isMobile ? 'Export' : `Export ${view.charAt(0).toUpperCase() + view.slice(1)}`);

  // Two-column layout collapses to one on mobile/tablet
  const twoColGrid = {
    display: 'grid',
    gridTemplateColumns: isSmall ? '1fr' : '1fr 1fr',
    gap: isMobile ? 14 : 20,
    marginBottom: isMobile ? 14 : 20,
  };

  return (
    <div style={{ fontFamily: "'DM Sans',sans-serif", minHeight: '100%' }}>

      {/* ── Header ───────────────────────────────────────────────────────────── */}
      <div style={{ marginBottom: isMobile ? 16 : 24 }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: isMobile ? 'flex-start' : 'flex-start',
          flexWrap: 'wrap',
          gap: 12,
        }}>
          <div>
            <h1 style={{
              margin: 0,
              fontSize: isMobile ? 20 : 24,
              fontWeight: 800,
              color: '#0f172a',
              letterSpacing: '-0.5px',
            }}>
              Financial Reports
            </h1>
            {!isMobile && (
              <p style={{ margin: '4px 0 0', fontSize: 13, color: '#64748b' }}>
                Payroll &amp; Advance Payment analytics — live from database
              </p>
            )}
          </div>

          {/* Controls — wrap naturally on small screens */}
          <div style={{
            display: 'flex',
            gap: 8,
            alignItems: 'center',
            flexWrap: 'wrap',
            width: isMobile ? '100%' : undefined,
          }}>
            {/* Year selector */}
            <div style={{ position: 'relative', flexShrink: 0 }}>
              <select
                value={year}
                onChange={e => setYear(Number(e.target.value))}
                style={{
                  appearance: 'none',
                  padding: isMobile ? '7px 28px 7px 10px' : '8px 32px 8px 12px',
                  borderRadius: 10,
                  border: '1px solid #e2e8f0',
                  background: '#fff',
                  fontSize: isMobile ? 12 : 13,
                  fontWeight: 600,
                  color: '#374151',
                  cursor: 'pointer',
                  fontFamily: "'DM Sans',sans-serif",
                  boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
                }}
              >
                {yearOpts.map(y => <option key={y} value={y}>{y}</option>)}
              </select>
              <ChevronDown size={13} style={{
                position: 'absolute', right: 8, top: '50%',
                transform: 'translateY(-50%)', color: '#9ca3af', pointerEvents: 'none',
              }} />
            </div>

            {/* Refresh */}
            <button
              onClick={refresh}
              style={{
                display: 'flex', alignItems: 'center', gap: 5,
                padding: isMobile ? '7px 10px' : '8px 14px',
                borderRadius: 10, border: '1px solid #e2e8f0', background: '#fff',
                fontSize: isMobile ? 12 : 13, fontWeight: 600, color: '#374151',
                cursor: 'pointer', fontFamily: "'DM Sans',sans-serif",
                boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
                // Icon-only on very small screens
                minWidth: 0,
              }}
              title="Refresh"
            >
              <RefreshCw
                size={13}
                style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }}
              />
              {!isMobile && 'Refresh'}
            </button>

            {/* Export */}
            <button
              onClick={() => handleExport({ tab, view, data, year })}
              disabled={!data || loading}
              style={{
                display: 'flex', alignItems: 'center', gap: 5,
                padding: isMobile ? '7px 12px' : '8px 16px',
                borderRadius: 10, border: 'none',
                background: (!data || loading) ? '#93c5fd' : '#1d4ed8',
                fontSize: isMobile ? 12 : 13, fontWeight: 600, color: '#fff',
                cursor: (!data || loading) ? 'not-allowed' : 'pointer',
                fontFamily: "'DM Sans',sans-serif",
                boxShadow: '0 2px 8px rgba(29,78,216,0.3)',
                transition: 'background .15s',
                flexShrink: 0,
              }}
            >
              <Download size={13} /> {exportLabel}
            </button>
          </div>
        </div>

        {/* View toggle */}
        <div style={{ display: 'flex', gap: 6, marginTop: isMobile ? 12 : 16, flexWrap: 'wrap' }}>
          {VIEWS.map(v => (
            <Chip
              key={v}
              label={v.charAt(0).toUpperCase() + v.slice(1)}
              active={view === v}
              onClick={() => setView(v)}
              isMobile={isMobile}
            />
          ))}
        </div>
      </div>

      {/* ── Tabs ─────────────────────────────────────────────────────────────── */}
      <div style={{
        display: 'flex',
        gap: isMobile ? 0 : 4,
        marginBottom: isMobile ? 16 : 24,
        borderBottom: '2px solid #f1f5f9',
        overflowX: 'auto',
        WebkitOverflowScrolling: 'touch',
      }}>
        {TABS.map(t => {
          const Icon = t.icon;
          const isActive = tab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              style={{
                display: 'flex', alignItems: 'center',
                gap: isMobile ? 5 : 7,
                padding: isMobile ? '8px 12px' : '10px 18px',
                border: 'none', background: 'none',
                fontSize: isMobile ? 12 : 13,
                fontWeight: isActive ? 700 : 500,
                color: isActive ? '#1d4ed8' : '#64748b',
                cursor: 'pointer',
                fontFamily: "'DM Sans',sans-serif",
                borderBottom: `2px solid ${isActive ? '#1d4ed8' : 'transparent'}`,
                marginBottom: -2,
                transition: 'color .15s',
                whiteSpace: 'nowrap',
                flexShrink: 0,
              }}
            >
              <Icon size={isMobile ? 13 : 14} />
              {/* On xs (very small phones), show icon only */}
              {!(isMobile && window.innerWidth < 380) && t.label}
            </button>
          );
        })}
      </div>

      {/* ── Error banner ─────────────────────────────────────────────────────── */}
      {error && (
        <div style={{
          display: 'flex', alignItems: 'flex-start', gap: 10,
          padding: '12px 14px', borderRadius: 10,
          background: '#fef2f2', border: '1px solid #fecaca',
          marginBottom: 16, color: '#dc2626',
          fontSize: isMobile ? 12 : 13, fontFamily: "'DM Sans',sans-serif",
          flexWrap: 'wrap',
        }}>
          <AlertCircle size={15} style={{ flexShrink: 0, marginTop: 1 }} />
          <span>
            <strong>API Error:</strong>&nbsp;{error}&nbsp;—&nbsp;
            <span style={{ color: '#6b7280' }}>Check that your backend is running and CORS is configured.</span>
          </span>
        </div>
      )}

      {/* ── Loading spinner ───────────────────────────────────────────────────── */}
      {loading && (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 200 }}>
          <div style={{
            width: 36, height: 36, border: '3px solid #e2e8f0',
            borderTopColor: '#1d4ed8', borderRadius: '50%',
            animation: 'spin 0.8s linear infinite',
          }} />
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      )}

      {/* ── No data warning ───────────────────────────────────────────────────── */}
      {!loading && !error && data && !hasPayrollData && (
        <div style={{
          display: 'flex', alignItems: 'flex-start', gap: 10,
          padding: '12px 14px', borderRadius: 10,
          background: '#fffbeb', border: '1px solid #fde68a',
          marginBottom: 16, color: '#92400e',
          fontSize: isMobile ? 12 : 13, fontFamily: "'DM Sans',sans-serif",
        }}>
          <AlertCircle size={15} style={{ flexShrink: 0, marginTop: 1 }} />
          No paid payroll records found for {year}. Charts will be empty until salary is marked as Paid.
        </div>
      )}

      {/* ── Tab content ──────────────────────────────────────────────────────── */}
      {!loading && data && (
        <>
          {/* ══ OVERVIEW ══════════════════════════════════════════════════════ */}
          {tab === 'overview' && (
            <>
              <KpiCards totals={data.totals} />

              <div style={twoColGrid}>
                <Section title={`Payroll Trend — ${year}`} isMobile={isMobile}>
                  {hasPayrollData ? (
                    <LineChart
                      labels={xLabels}
                      series={[
                        { name: 'Total Payroll', color: '#3b82f6', data: viewData.map(d => d.totalPayroll  || 0) },
                        { name: 'Net Payroll',   color: '#10b981', data: viewData.map(d => d.netPayroll    || 0) },
                      ]}
                      height={isMobile ? 160 : 200}
                    />
                  ) : <EmptyState msg="No paid payroll data for this period" />}
                </Section>

                <Section title="Payroll Composition" isMobile={isMobile}>
                  {data.pieData?.length > 0
                    ? <PieChart data={data.pieData} size={isMobile ? 180 : 200} donut={true} />
                    : <EmptyState msg="No payroll data to break down" />}
                </Section>
              </div>

              <Section title={`Advance Payments — ${year}`} isMobile={isMobile}>
                {hasAdvanceData ? (
                  <BarChart
                    data={viewData}
                    xKey={xKey}
                    height={isMobile ? 160 : 200}
                    bars={[
                      { key: 'advanceIssued',    name: 'Issued',    color: '#8b5cf6' },
                      { key: 'advanceRecovered', name: 'Recovered', color: '#06b6d4' },
                      { key: 'advancePending',   name: 'Pending',   color: '#f59e0b' },
                    ]}
                  />
                ) : <EmptyState msg="No advance payment data for this period" />}
              </Section>

              <Section title="Department Breakdown" isMobile={isMobile}>
                {data.deptBreak?.length > 0
                  ? <DeptTable data={data.deptBreak} />
                  : <EmptyState msg="No department data available" />}
              </Section>
            </>
          )}

          {/* ══ PAYROLL ════════════════════════════════════════════════════════ */}
          {tab === 'payroll' && (
            <>
              <div style={twoColGrid}>
                <Section title={`Gross vs Net — ${view.charAt(0).toUpperCase() + view.slice(1)}`} isMobile={isMobile}>
                  {viewHasPayroll ? (
                    <LineChart
                      labels={xLabels}
                      series={[
                        { name: 'Gross',      color: '#3b82f6', data: viewData.map(d => d.totalPayroll    || 0) },
                        { name: 'Net',        color: '#10b981', data: viewData.map(d => d.netPayroll      || 0) },
                        { name: 'Deductions', color: '#ef4444', data: viewData.map(d => d.totalDeductions || 0) },
                      ]}
                      height={isMobile ? 160 : 200}
                    />
                  ) : <EmptyState msg={`No payroll data for ${view} view`} />}
                </Section>

                <Section title="Payroll Component Split" isMobile={isMobile}>
                  {data.pieData?.length > 0
                    ? <PieChart data={data.pieData} size={isMobile ? 180 : 200} donut={true} />
                    : <EmptyState msg="No component data" />}
                </Section>
              </div>

              {view === 'monthly' && (
                <Section title="Component-wise Payroll" isMobile={isMobile}>
                  {viewHasPayroll ? (
                    <BarChart
                      data={viewData}
                      xKey={xKey}
                      height={isMobile ? 180 : 220}
                      bars={[
                        { key: 'basicPay',       name: 'Basic',       color: '#3b82f6' },
                        { key: 'hra',            name: 'HRA',         color: '#8b5cf6' },
                        { key: 'orgAllowance',   name: 'Org Allow.',  color: '#06b6d4' },
                        { key: 'performancePay', name: 'Performance', color: '#10b981' },
                      ]}
                    />
                  ) : <EmptyState msg="No component data" />}
                </Section>
              )}

              {view === 'monthly' && (
                <Section title="Deductions Breakdown" isMobile={isMobile}>
                  {viewHasPayroll ? (
                    <BarChart
                      data={viewData}
                      xKey={xKey}
                      height={isMobile ? 160 : 200}
                      bars={[
                        { key: 'pfDeduction',  name: 'PF',  color: '#f59e0b' },
                        { key: 'ptDeduction',  name: 'PT',  color: '#ef4444' },
                        { key: 'tdsDeduction', name: 'TDS', color: '#8b5cf6' },
                      ]}
                    />
                  ) : <EmptyState msg="No deduction data" />}
                </Section>
              )}

              {(view === 'quarterly' || view === 'yearly') && (
                <Section title={`Payroll Overview — ${view.charAt(0).toUpperCase() + view.slice(1)}`} isMobile={isMobile}>
                  {viewHasPayroll ? (
                    <BarChart
                      data={viewData}
                      xKey={xKey}
                      height={isMobile ? 180 : 220}
                      bars={[
                        { key: 'totalPayroll',    name: 'Gross Payroll',   color: '#3b82f6' },
                        { key: 'netPayroll',      name: 'Net Payroll',     color: '#10b981' },
                        { key: 'totalDeductions', name: 'Deductions',      color: '#ef4444' },
                        { key: 'performancePay',  name: 'Performance Pay', color: '#f59e0b' },
                      ]}
                    />
                  ) : <EmptyState msg={`No payroll data for ${view} view`} />}
                </Section>
              )}

              <Section title={`Employees Paid — ${view.charAt(0).toUpperCase() + view.slice(1)}`} isMobile={isMobile}>
                {viewHasPayroll ? (
                  <LineChart
                    labels={xLabels}
                    series={[{
                      name: 'Employees Paid',
                      color: '#1d4ed8',
                      data: viewData.map(d => d.employeesPaid || d.avgEmployees || 0),
                    }]}
                    height={isMobile ? 130 : 160}
                    showArea={true}
                  />
                ) : <EmptyState msg="No payroll data" />}
              </Section>
            </>
          )}

          {/* ══ ADVANCE PAYMENTS ══════════════════════════════════════════════ */}
          {tab === 'advance' && (
            <>
              <div style={twoColGrid}>
                <Section title={`Advance Flow — ${view.charAt(0).toUpperCase() + view.slice(1)}`} isMobile={isMobile}>
                  {viewHasAdvance ? (
                    <LineChart
                      labels={xLabels}
                      series={[
                        { name: 'Issued',    color: '#8b5cf6', data: viewData.map(d => d.advanceIssued    || 0) },
                        { name: 'Recovered', color: '#06b6d4', data: viewData.map(d => d.advanceRecovered || 0) },
                        { name: 'Pending',   color: '#f59e0b', data: viewData.map(d => d.advancePending   || 0) },
                      ]}
                      height={isMobile ? 160 : 200}
                    />
                  ) : <EmptyState msg={`No advance data for ${view} view`} />}
                </Section>

                <Section title="Advance Distribution (Year Total)" isMobile={isMobile}>
                  {(data.totals.advance > 0) ? (
                    <PieChart
                      data={[
                        { label: 'Issued',    value: data.totals.advance,   color: '#8b5cf6' },
                        { label: 'Recovered', value: data.totals.recovered, color: '#06b6d4' },
                        { label: 'Pending',   value: data.totals.pending,   color: '#f59e0b' },
                      ].filter(d => d.value > 0)}
                      size={isMobile ? 180 : 200}
                      donut={true}
                    />
                  ) : <EmptyState msg="No advance totals" />}
                </Section>
              </div>

              <Section title={`Issued vs Recovered — ${view.charAt(0).toUpperCase() + view.slice(1)}`} isMobile={isMobile}>
                {viewHasAdvance ? (
                  <BarChart
                    data={viewData}
                    xKey={xKey}
                    height={isMobile ? 160 : 200}
                    bars={[
                      { key: 'advanceIssued',    name: 'Issued',    color: '#8b5cf6' },
                      { key: 'advanceRecovered', name: 'Recovered', color: '#06b6d4' },
                    ]}
                  />
                ) : <EmptyState msg={`No advance data for ${view} view`} />}
              </Section>

              {/* Recovery summary cards — 2 col on mobile, 4 col on desktop */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: isMobile
                  ? 'repeat(2, 1fr)'
                  : 'repeat(auto-fill, minmax(180px, 1fr))',
                gap: isMobile ? 10 : 14,
              }}>
                {[
                  {
                    label: 'Recovery Rate',
                    value: data.totals.advance > 0
                      ? `${((data.totals.recovered / data.totals.advance) * 100).toFixed(1)}%`
                      : 'N/A',
                    color: '#10b981', bg: '#ecfdf5',
                  },
                  {
                    label: 'Total Issued',
                    value: `₹${(data.totals.advance   / 1e3).toFixed(1)}K`,
                    color: '#8b5cf6', bg: '#f5f3ff',
                  },
                  {
                    label: 'Total Recovered',
                    value: `₹${(data.totals.recovered / 1e3).toFixed(1)}K`,
                    color: '#06b6d4', bg: '#ecfeff',
                  },
                  {
                    label: 'Still Pending',
                    value: `₹${(data.totals.pending   / 1e3).toFixed(1)}K`,
                    color: '#ef4444', bg: '#fef2f2',
                  },
                ].map((c, i) => (
                  <div key={i} style={{
                    background: c.bg, borderRadius: isMobile ? 10 : 12,
                    padding: isMobile ? '12px 14px' : '16px 18px',
                    border: `1px solid ${c.color}22`,
                  }}>
                    <div style={{
                      fontSize: isMobile ? 18 : 22, fontWeight: 800, color: c.color,
                      fontFamily: "'DM Sans',sans-serif",
                    }}>
                      {c.value}
                    </div>
                    <div style={{
                      fontSize: isMobile ? 11 : 12, color: '#64748b',
                      fontFamily: "'DM Sans',sans-serif", marginTop: 3,
                    }}>
                      {c.label}
                    </div>
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
        * { box-sizing: border-box; }
      `}</style>
    </div>
  );
}