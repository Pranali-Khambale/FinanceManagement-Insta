// src/Ui/Reports/DeptTable.jsx
import React from 'react';
import { useBreakpoint } from './useBreakpoint';

const fmt = (n) =>
  n >= 1e6 ? `₹${(n / 1e6).toFixed(2)}M` : `₹${(n / 1e3).toFixed(1)}K`;

export function DeptTable({ data }) {
  const { isMobile, isTablet } = useBreakpoint();
  const total = data.reduce((s, d) => s + d.payroll, 0);

  // On mobile, show a condensed card layout instead of a table
  if (isMobile) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {data.map((d, i) => {
          const pct = ((d.payroll / total) * 100).toFixed(1);
          const hue = i * 55 + 210;
          return (
            <div
              key={i}
              style={{
                background: '#f8fafc',
                borderRadius: 10,
                padding: '12px 14px',
                borderLeft: `3px solid hsl(${hue},70%,55%)`,
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <span style={{
                  fontSize: 13, fontWeight: 700, color: '#111827',
                  fontFamily: "'DM Sans',sans-serif",
                }}>
                  {d.dept}
                </span>
                <span style={{
                  fontSize: 13, fontWeight: 700, color: '#111827',
                  fontFamily: "'DM Sans',sans-serif",
                }}>
                  {fmt(d.payroll)}
                </span>
              </div>

              {/* Progress bar */}
              <div style={{ height: 5, borderRadius: 3, background: '#e2e8f0', marginBottom: 8, overflow: 'hidden' }}>
                <div style={{
                  height: '100%',
                  width: `${pct}%`,
                  background: `hsl(${hue},70%,55%)`,
                  borderRadius: 3,
                  transition: 'width .5s ease',
                }} />
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#6b7280', fontFamily: "'DM Sans',sans-serif" }}>
                <span>{d.headcount} employees</span>
                <span style={{ color: '#8b5cf6' }}>Advances: {fmt(d.advances)}</span>
                <span style={{ fontWeight: 600, color: '#374151' }}>{pct}%</span>
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  // Tablet / desktop: standard table with horizontal scroll
  return (
    <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
      <table style={{
        width: '100%',
        borderCollapse: 'collapse',
        fontFamily: "'DM Sans',sans-serif",
        // minimum width so columns don't crush on tablet
        minWidth: isTablet ? 520 : undefined,
      }}>
        <thead>
          <tr style={{ borderBottom: '2px solid #f1f5f9' }}>
            {['Department', 'Headcount', 'Payroll', 'Advances', '% of Total'].map((h) => (
              <th
                key={h}
                style={{
                  padding: isTablet ? '8px 10px' : '10px 14px',
                  textAlign: h === 'Department' ? 'left' : 'right',
                  fontSize: isTablet ? 10 : 11,
                  fontWeight: 600,
                  color: '#6b7280',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  whiteSpace: 'nowrap',
                }}
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((d, i) => {
            const pct = ((d.payroll / total) * 100).toFixed(1);
            return (
              <tr
                key={i}
                style={{ borderBottom: '1px solid #f8fafc', transition: 'background .14s' }}
                onMouseEnter={(e) => (e.currentTarget.style.background = '#f8fafc')}
                onMouseLeave={(e) => (e.currentTarget.style.background = '')}
              >
                <td style={{ padding: isTablet ? '10px 10px' : '12px 14px', fontSize: isTablet ? 12 : 13, fontWeight: 600, color: '#111827' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{
                      width: 8, height: 8, borderRadius: 2,
                      background: `hsl(${i * 55 + 210},70%,55%)`,
                      flexShrink: 0,
                    }} />
                    {d.dept}
                  </div>
                </td>
                <td style={{ padding: isTablet ? '10px 10px' : '12px 14px', textAlign: 'right', fontSize: isTablet ? 12 : 13, color: '#374151' }}>
                  {d.headcount}
                </td>
                <td style={{ padding: isTablet ? '10px 10px' : '12px 14px', textAlign: 'right', fontSize: isTablet ? 12 : 13, fontWeight: 600, color: '#111827' }}>
                  {fmt(d.payroll)}
                </td>
                <td style={{ padding: isTablet ? '10px 10px' : '12px 14px', textAlign: 'right', fontSize: isTablet ? 12 : 13, color: '#8b5cf6' }}>
                  {fmt(d.advances)}
                </td>
                <td style={{ padding: isTablet ? '10px 10px' : '12px 14px', textAlign: 'right' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'flex-end' }}>
                    {!isTablet && (
                      <div style={{ width: 60, height: 5, borderRadius: 3, background: '#f1f5f9', overflow: 'hidden' }}>
                        <div style={{
                          height: '100%',
                          width: `${pct}%`,
                          background: `hsl(${i * 55 + 210},70%,55%)`,
                          borderRadius: 3,
                          transition: 'width .5s ease',
                        }} />
                      </div>
                    )}
                    <span style={{ fontSize: 12, fontWeight: 600, color: '#374151', minWidth: 36 }}>
                      {pct}%
                    </span>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}