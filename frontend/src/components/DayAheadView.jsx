import React, { useState, useEffect } from 'react';
import { 
  Wind, 
  AlertTriangle, 
  TrendingDown, 
  TrendingUp, 
  Calendar, 
  ChevronLeft, 
  ChevronRight,
  Layers,
  ArrowRight
} from 'lucide-react';
import { fetchDayAheadForecasts } from '../services/api';

export default function DayAheadView({ gateClosureTime }) {
  const [selectedDate, setSelectedDate] = useState('2026-01-15');
  const [resolution, setResolution] = useState('hourly');
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hoveredPoint, setHoveredPoint] = useState(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    fetchDayAheadForecasts({
      startDate: selectedDate,
      endDate: selectedDate,
      gateClosureTime,
      resolution
    }).then(res => {
      if (active) {
        setData(res || []);
        setLoading(false);
      }
    });
    return () => { active = false; };
  }, [selectedDate, gateClosureTime, resolution]);

  // Navigate date
  const changeDate = (delta) => {
    const cur = new Date(`${selectedDate}T00:00:00Z`);
    cur.setUTCDate(cur.getUTCDate() + delta);
    if (cur.getUTCFullYear() === 2026 && cur.getUTCMonth() === 0) {
      setSelectedDate(cur.toISOString().slice(0, 10));
    }
  };

  // Preset dates
  const presets = [
    { label: 'Jan 9 (Storm Peak)', date: '2026-01-09' },
    { label: 'Jan 15 (Baseline)', date: '2026-01-15' },
    { label: 'Jan 18 (Dunkelflaute)', date: '2026-01-18' },
    { label: 'Jan 22 (Shortfall Crisis)', date: '2026-01-22' },
  ];

  // Calculate day summary metrics
  const totalActualMWh = data.reduce((a, b) => a + (b.actualWindMW || 0), 0);
  const totalForecastMWh = data.reduce((a, b) => a + (b.forecastWindMW || 0), 0);
  const peakActualMW = data.length > 0 ? Math.max(...data.map(d => d.actualWindMW || 0)) : 0;
  const peakForecastMW = data.length > 0 ? Math.max(...data.map(d => d.forecastWindMW || 0)) : 0;
  const absErrors = data.map(d => Math.abs((d.forecastWindMW || 0) - (d.actualWindMW || 0)));
  const dayMAE = absErrors.length > 0 ? Math.round((absErrors.reduce((a, b) => a + b, 0) / absErrors.length) * 10) / 10 : 0;
  const netBias = data.length > 0 ? Math.round((data.reduce((a, b) => a + (b.errorMW || 0), 0) / data.length) * 10) / 10 : 0;

  // Chart Dimensions
  const chartWidth = 1000;
  const chartHeight = 360;
  const padding = { top: 30, right: 30, bottom: 40, left: 60 };

  const maxVal = Math.max(1000, peakActualMW, peakForecastMW) * 1.15;
  const pointsCount = data.length || 1;

  const getX = (idx) => padding.left + (idx / Math.max(1, pointsCount - 1)) * (chartWidth - padding.left - padding.right);
  const getY = (val) => chartHeight - padding.bottom - ((val || 0) / maxVal) * (chartHeight - padding.top - padding.bottom);

  // Path generators
  const actualPath = data.map((d, i) => `${i === 0 ? 'M' : 'L'} ${getX(i)} ${getY(d.actualWindMW)}`).join(' ');
  const forecastPath = data.map((d, i) => `${i === 0 ? 'M' : 'L'} ${getX(i)} ${getY(d.forecastWindMW)}`).join(' ');
  const latestPath = data.map((d, i) => `${i === 0 ? 'M' : 'L'} ${getX(i)} ${getY(d.latestForecastMW || d.forecastWindMW)}`).join(' ');

  const actualArea = `${actualPath} L ${getX(pointsCount - 1)} ${getY(0)} L ${getX(0)} ${getY(0)} Z`;

  return (
    <div className="fade-in">
      {/* Date & Control Bar */}
      <div className="glass-card" style={{ marginBottom: 24, padding: '18px 24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
          {/* Date Selector */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button 
              onClick={() => changeDate(-1)} 
              className="btn-secondary"
              disabled={selectedDate === '2026-01-01'}
              title="Previous Delivery Day"
            >
              <ChevronLeft size={16} />
            </button>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Calendar size={18} color="var(--wind-cyan)" />
              <input
                type="date"
                min="2026-01-01"
                max="2026-01-31"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                style={{ fontWeight: 600, fontSize: '0.95rem' }}
              />
            </div>
            <button 
              onClick={() => changeDate(1)} 
              className="btn-secondary"
              disabled={selectedDate === '2026-01-31'}
              title="Next Delivery Day"
            >
              <ChevronRight size={16} />
            </button>
          </div>

          {/* Quick Presets */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Market Scenarios:</span>
            {presets.map(p => (
              <button
                key={p.date}
                onClick={() => setSelectedDate(p.date)}
                className="btn-secondary"
                style={{
                  fontSize: '0.78rem',
                  padding: '4px 10px',
                  borderColor: selectedDate === p.date ? 'var(--wind-cyan)' : 'var(--border-subtle)',
                  color: selectedDate === p.date ? '#38bdf8' : 'var(--text-secondary)'
                }}
              >
                {p.label}
              </button>
            ))}
          </div>

          {/* Resolution Toggle */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#0f172a', padding: 4, borderRadius: 'var(--radius-sm)' }}>
            <button
              onClick={() => setResolution('hourly')}
              style={{
                background: resolution === 'hourly' ? '#1e293b' : 'transparent',
                color: resolution === 'hourly' ? '#f8fafc' : 'var(--text-muted)',
                border: 'none',
                padding: '4px 10px',
                borderRadius: 4,
                fontSize: '0.78rem',
                fontWeight: 600
              }}
            >
              Hourly (24)
            </button>
            <button
              onClick={() => setResolution('half_hourly')}
              style={{
                background: resolution === 'half_hourly' ? '#1e293b' : 'transparent',
                color: resolution === 'half_hourly' ? '#f8fafc' : 'var(--text-muted)',
                border: 'none',
                padding: '4px 10px',
                borderRadius: 4,
                fontSize: '0.78rem',
                fontWeight: 600
              }}
            >
              Half-Hourly (48 SP)
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="metrics-grid">
        <div className="metric-box cyan">
          <div className="metric-label">
            <span>Actual Wind Generation</span>
            <Wind size={16} color="var(--wind-cyan)" />
          </div>
          <div className="metric-val mono">{peakActualMW.toLocaleString()} <span style={{ fontSize: '1rem', fontWeight: 500 }}>MW</span></div>
          <div className="metric-sub">Total: {Math.round(totalActualMWh).toLocaleString()} MWh delivered</div>
        </div>

        <div className="metric-box amber">
          <div className="metric-label">
            <span>Day-Ahead Forecast</span>
            <span className="pill pill-amber" style={{ padding: '2px 6px', fontSize: '0.7rem' }}>
              At {gateClosureTime} (D-1)
            </span>
          </div>
          <div className="metric-val mono">{peakForecastMW.toLocaleString()} <span style={{ fontSize: '1rem', fontWeight: 500 }}>MW</span></div>
          <div className="metric-sub">Total Forecast: {Math.round(totalForecastMWh).toLocaleString()} MWh</div>
        </div>

        <div className="metric-box rose">
          <div className="metric-label">
            <span>Day MAE (Mean Abs Error)</span>
            <AlertTriangle size={16} color="var(--error-rose)" />
          </div>
          <div className="metric-val mono">{dayMAE.toLocaleString()} <span style={{ fontSize: '1rem', fontWeight: 500 }}>MW</span></div>
          <div className="metric-sub">Average deviation per interval</div>
        </div>

        <div className="metric-box violet">
          <div className="metric-label">
            <span>Net Day Bias</span>
            {netBias > 0 ? <TrendingUp size={16} color="#fb7185" /> : <TrendingDown size={16} color="#34d399" />}
          </div>
          <div className="metric-val mono" style={{ color: netBias > 0 ? '#fb7185' : '#34d399' }}>
            {netBias > 0 ? `+${netBias}` : netBias} <span style={{ fontSize: '1rem', fontWeight: 500 }}>MW</span>
          </div>
          <div className="metric-sub">{netBias > 0 ? 'Over-forecasted (Shortfall Risk)' : 'Under-forecasted (Spill)'}</div>
        </div>
      </div>

      {/* Main Comparison Chart */}
      <div className="glass-card" style={{ marginBottom: 24 }}>
        <div className="card-header">
          <div>
            <div className="card-title">
              <Layers size={20} color="var(--wind-cyan)" />
              <span>Day-Ahead Forecast vs Physical Actuals ({selectedDate})</span>
            </div>
            <div className="card-subtitle">
              Evaluating the exact forecast published before gate closure ({gateClosureTime} GMT on D-1) against real-time delivery
            </div>
          </div>

          {/* Chart Legend */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.8rem' }}>
              <span style={{ width: 14, height: 3, background: 'var(--wind-cyan)', borderRadius: 2 }}></span>
              <span style={{ color: 'var(--text-secondary)' }}>Actual Wind (FUELHH)</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.8rem' }}>
              <span style={{ width: 14, height: 2, borderBottom: '2px dashed var(--forecast-amber)' }}></span>
              <span style={{ color: 'var(--text-secondary)' }}>Day-Ahead Forecast (WINDFOR at Gate)</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.8rem' }}>
              <span style={{ width: 14, height: 2, borderBottom: '2px dotted var(--success-emerald)' }}></span>
              <span style={{ color: 'var(--text-secondary)' }}>Latest Intraday</span>
            </div>
          </div>
        </div>

        {/* SVG Chart */}
        <div style={{ width: '100%', overflowX: 'auto', position: 'relative' }}>
          <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} style={{ width: '100%', minWidth: 700, height: 'auto' }}>
            <defs>
              <linearGradient id="actualGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.35" />
                <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.0" />
              </linearGradient>
            </defs>

            {/* Horizontal Grid Lines */}
            {[0, 0.25, 0.5, 0.75, 1].map((pct, i) => {
              const yVal = maxVal * pct;
              const y = getY(yVal);
              return (
                <g key={i}>
                  <line 
                    x1={padding.left} 
                    y1={y} 
                    x2={chartWidth - padding.right} 
                    y2={y} 
                    stroke="rgba(51, 65, 85, 0.4)" 
                    strokeDasharray="4 4" 
                  />
                  <text 
                    x={padding.left - 10} 
                    y={y + 4} 
                    fill="var(--text-muted)" 
                    fontSize="11" 
                    textAnchor="end"
                    fontFamily="JetBrains Mono"
                  >
                    {Math.round(yVal).toLocaleString()}
                  </text>
                </g>
              );
            })}

            {/* Actual Area */}
            <path d={actualArea} fill="url(#actualGrad)" />

            {/* Lines */}
            <path d={actualPath} fill="none" stroke="#06b6d4" strokeWidth="2.5" />
            <path d={forecastPath} fill="none" stroke="#f59e0b" strokeWidth="2" strokeDasharray="5 4" />
            <path d={latestPath} fill="none" stroke="#10b981" strokeWidth="1.5" strokeDasharray="2 3" />

            {/* Hover Points */}
            {data.map((d, i) => {
              const x = getX(i);
              const yAct = getY(d.actualWindMW);
              const yFc = getY(d.forecastWindMW);
              const isHovered = hoveredPoint === i;

              return (
                <g key={i} onMouseEnter={() => setHoveredPoint(i)} onMouseLeave={() => setHoveredPoint(null)}>
                  {/* Invisible hit column */}
                  <rect
                    x={x - (chartWidth / pointsCount) / 2}
                    y={padding.top}
                    width={chartWidth / pointsCount}
                    height={chartHeight - padding.top - padding.bottom}
                    fill="transparent"
                    style={{ cursor: 'pointer' }}
                  />

                  {/* Marker if hovered */}
                  {isHovered && (
                    <g>
                      <line x1={x} y1={padding.top} x2={x} y2={chartHeight - padding.bottom} stroke="#64748b" strokeWidth="1" strokeDasharray="3 3" />
                      <circle cx={x} cy={yAct} r="5" fill="#06b6d4" stroke="#ffffff" strokeWidth="2" />
                      <circle cx={x} cy={yFc} r="5" fill="#f59e0b" stroke="#ffffff" strokeWidth="2" />
                    </g>
                  )}

                  {/* X Axis labels */}
                  {(resolution === 'hourly' ? i % 3 === 0 : i % 6 === 0) && (
                    <text
                      x={x}
                      y={chartHeight - padding.bottom + 20}
                      fill="var(--text-muted)"
                      fontSize="11"
                      textAnchor="middle"
                      fontFamily="JetBrains Mono"
                    >
                      {resolution === 'hourly' ? `${d.hour}:00` : `SP${d.settlementPeriod}`}
                    </text>
                  )}
                </g>
              );
            })}
          </svg>

          {/* Tooltip Overlay */}
          {hoveredPoint !== null && data[hoveredPoint] && (
            <div style={{
              position: 'absolute',
              top: 20,
              right: 30,
              background: 'rgba(15, 23, 42, 0.95)',
              border: '1px solid var(--border-card)',
              borderRadius: 'var(--radius-md)',
              padding: '12px 16px',
              boxShadow: 'var(--shadow-card)',
              pointerEvents: 'none',
              backdropFilter: 'blur(8px)',
              minWidth: 220
            }}>
              <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#f8fafc', marginBottom: 6 }}>
                Interval: {data[hoveredPoint].startTime.slice(11, 16)} GMT 
                {data[hoveredPoint].settlementPeriod && ` (SP ${data[hoveredPoint].settlementPeriod})`}
              </div>
              <div style={{ fontSize: '0.78rem', display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ color: 'var(--wind-cyan)' }}>Actual Wind:</span>
                <span className="mono" style={{ fontWeight: 600 }}>{data[hoveredPoint].actualWindMW.toLocaleString()} MW</span>
              </div>
              <div style={{ fontSize: '0.78rem', display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ color: 'var(--forecast-amber)' }}>Day-Ahead Forecast:</span>
                <span className="mono" style={{ fontWeight: 600 }}>{data[hoveredPoint].forecastWindMW.toLocaleString()} MW</span>
              </div>
              <div style={{ fontSize: '0.78rem', display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ color: 'var(--text-secondary)' }}>Error (F - A):</span>
                <span className="mono" style={{ 
                  fontWeight: 700, 
                  color: data[hoveredPoint].errorMW > 0 ? '#fb7185' : '#34d399' 
                }}>
                  {data[hoveredPoint].errorMW > 0 ? `+${data[hoveredPoint].errorMW}` : data[hoveredPoint].errorMW} MW
                </span>
              </div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', borderTop: '1px solid #1e293b', paddingTop: 4, marginTop: 4 }}>
                Published: {data[hoveredPoint].publishTime.slice(11, 16)} GMT on D-1
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Hourly Settlement Breakdown Table */}
      <div className="glass-card">
        <div className="card-header">
          <div className="card-title">
            <span>Settlement Breakdown Table</span>
          </div>
          <div className="card-subtitle">
            Showing all {data.length} periods with deviation status
          </div>
        </div>

        <div className="data-table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Interval (GMT)</th>
                <th>Settlement Period</th>
                <th>Day-Ahead Forecast</th>
                <th>Actual Generation</th>
                <th>Forecast Error (MW)</th>
                <th>Abs Error %</th>
                <th>Procurement Status</th>
                <th>Latest Intraday</th>
              </tr>
            </thead>
            <tbody>
              {data.map((row, idx) => {
                const isOver = row.errorMW > 0;
                return (
                  <tr key={idx}>
                    <td className="mono" style={{ fontWeight: 600 }}>{row.startTime.slice(11, 16)}</td>
                    <td>{row.settlementPeriod ? `SP ${row.settlementPeriod}` : `SP ${row.settlementPeriodStart}-${row.settlementPeriodEnd}`}</td>
                    <td className="mono" style={{ color: '#fbbf24' }}>{row.forecastWindMW.toLocaleString()} MW</td>
                    <td className="mono" style={{ color: '#38bdf8' }}>{row.actualWindMW.toLocaleString()} MW</td>
                    <td className="mono" style={{ fontWeight: 700, color: isOver ? '#fb7185' : '#34d399' }}>
                      {isOver ? `+${row.errorMW.toLocaleString()}` : row.errorMW.toLocaleString()} MW
                    </td>
                    <td className="mono">{row.pctError}%</td>
                    <td>
                      {isOver ? (
                        <span className="pill pill-rose">
                          <AlertTriangle size={11} /> Over-Forecast (Shortfall Risk)
                        </span>
                      ) : (
                        <span className="pill pill-emerald">
                          <TrendingDown size={11} /> Under-Forecast (Spill)
                        </span>
                      )}
                    </td>
                    <td className="mono" style={{ color: '#94a3b8' }}>
                      {row.latestForecastMW ? `${row.latestForecastMW.toLocaleString()} MW` : '—'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
