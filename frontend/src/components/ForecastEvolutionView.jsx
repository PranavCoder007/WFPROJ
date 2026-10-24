import React, { useState, useEffect } from 'react';
import { TrendingUp, Clock, Calendar, CheckCircle2, RefreshCw } from 'lucide-react';
import { fetchForecastEvolution } from '../services/api';

export default function ForecastEvolutionView() {
  const [targetDate, setTargetDate] = useState('2026-01-15');
  const [evolutionData, setEvolutionData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedRun, setSelectedRun] = useState(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    fetchForecastEvolution(targetDate).then(data => {
      if (active) {
        setEvolutionData(data);
        setLoading(false);
      }
    });
    return () => { active = false; };
  }, [targetDate]);

  if (loading || !evolutionData) {
    return (
      <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-secondary)' }}>
        Loading forecast evolution runs for {targetDate}...
      </div>
    );
  }

  const { runs = [], actuals = [] } = evolutionData;

  // Distinct run colors
  const runColors = [
    '#94a3b8', '#64748b', '#38bdf8', '#0284c7', 
    '#f59e0b', '#d97706', '#a855f7', '#10b981'
  ];

  // SVG Chart dimensions
  const chartWidth = 1000;
  const chartHeight = 360;
  const padding = { top: 30, right: 30, bottom: 40, left: 60 };

  const allGens = [
    ...actuals.map(a => a.actualWindMW || 0),
    ...runs.flatMap(r => r.points.map(p => p.generation || 0))
  ];
  const maxVal = Math.max(1000, ...allGens) * 1.15;

  const getX = (hour) => padding.left + (hour / 23) * (chartWidth - padding.left - padding.right);
  const getY = (val) => chartHeight - padding.bottom - ((val || 0) / maxVal) * (chartHeight - padding.top - padding.bottom);

  // Actual curve path
  const actualPath = actuals.filter(a => a.actualWindMW !== null).map((a, i) => `${i === 0 ? 'M' : 'L'} ${getX(a.hour)} ${getY(a.actualWindMW)}`).join(' ');

  return (
    <div className="fade-in">
      {/* Date Header */}
      <div className="glass-card" style={{ marginBottom: 24, padding: '18px 24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Calendar size={18} color="var(--wind-cyan)" />
            <span style={{ fontSize: '0.875rem', fontWeight: 600 }}>Target Delivery Date:</span>
            <input
              type="date"
              min="2026-01-01"
              max="2026-01-31"
              value={targetDate}
              onChange={(e) => setTargetDate(e.target.value)}
              style={{ fontWeight: 600 }}
            />
          </div>

          <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
            Tracking <strong>{runs.length} forecast updates</strong> published by NESO/Elexon for {targetDate}
          </div>
        </div>
      </div>

      {/* Multi-Run Convergence Chart */}
      <div className="glass-card" style={{ marginBottom: 24 }}>
        <div className="card-header">
          <div>
            <div className="card-title">
              <TrendingUp size={20} color="var(--wind-cyan)" />
              <span>Forecast Convergence Fan Chart ({targetDate})</span>
            </div>
            <div className="card-subtitle">
              Visualizing how the wind forecast changed across successive publication batches compared to physical delivery
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.8rem' }}>
              <span style={{ width: 14, height: 3, background: 'var(--wind-cyan)', borderRadius: 2 }}></span>
              <span style={{ color: '#f8fafc', fontWeight: 600 }}>Physical Actuals</span>
            </div>
          </div>
        </div>

        {/* SVG Fan Chart */}
        <div style={{ width: '100%', overflowX: 'auto' }}>
          <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} style={{ width: '100%', minWidth: 700, height: 'auto' }}>
            {/* Grid */}
            {[0, 0.25, 0.5, 0.75, 1].map((pct, i) => {
              const yVal = maxVal * pct;
              const y = getY(yVal);
              return (
                <g key={i}>
                  <line x1={padding.left} y1={y} x2={chartWidth - padding.right} y2={y} stroke="rgba(51, 65, 85, 0.4)" strokeDasharray="4 4" />
                  <text x={padding.left - 10} y={y + 4} fill="var(--text-muted)" fontSize="11" textAnchor="end" fontFamily="JetBrains Mono">
                    {Math.round(yVal).toLocaleString()}
                  </text>
                </g>
              );
            })}

            {/* Run curves */}
            {runs.map((r, rIdx) => {
              const isSelected = selectedRun === r.publishTime;
              const color = runColors[rIdx % runColors.length];
              const opacity = selectedRun ? (isSelected ? 1 : 0.2) : 0.65;
              const strokeWidth = isSelected ? 3 : 1.5;

              const runPath = r.points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${getX(p.hour)} ${getY(p.generation)}`).join(' ');

              return (
                <path
                  key={r.publishTime}
                  d={runPath}
                  fill="none"
                  stroke={color}
                  strokeWidth={strokeWidth}
                  strokeOpacity={opacity}
                  strokeDasharray={rIdx === 0 ? '4 4' : undefined}
                />
              );
            })}

            {/* Bold Actual Path */}
            {actualPath && (
              <path d={actualPath} fill="none" stroke="#06b6d4" strokeWidth="3" />
            )}

            {/* X Axis Hours */}
            {Array.from({ length: 24 }).map((_, h) => {
              if (h % 3 !== 0) return null;
              return (
                <text
                  key={h}
                  x={getX(h)}
                  y={chartHeight - padding.bottom + 20}
                  fill="var(--text-muted)"
                  fontSize="11"
                  textAnchor="middle"
                  fontFamily="JetBrains Mono"
                >
                  {h}:00
                </text>
              );
            })}
          </svg>
        </div>
      </div>

      {/* Runs Table */}
      <div className="glass-card">
        <div className="card-header">
          <div className="card-title">
            <span>Forecast Publication Runs for {targetDate}</span>
          </div>
          <div className="card-subtitle">
            Click any run to highlight its curve in the chart above
          </div>
        </div>

        <div className="data-table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Batch Publication Time (GMT)</th>
                <th>Run Color</th>
                <th>Points Covered</th>
                <th>Average Wind Forecast</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {runs.map((r, i) => {
                const color = runColors[i % runColors.length];
                const isSelected = selectedRun === r.publishTime;
                return (
                  <tr 
                    key={r.publishTime}
                    style={{ background: isSelected ? 'rgba(56, 189, 248, 0.1)' : undefined, cursor: 'pointer' }}
                    onClick={() => setSelectedRun(isSelected ? null : r.publishTime)}
                  >
                    <td className="mono" style={{ fontWeight: 600 }}>{r.publishTime.replace('T', ' ').replace('Z', ' GMT')}</td>
                    <td>
                      <span style={{ display: 'inline-block', width: 14, height: 14, borderRadius: '50%', background: color }}></span>
                    </td>
                    <td>{r.dataPointsCount} hours</td>
                    <td className="mono" style={{ color: '#fbbf24', fontWeight: 600 }}>{r.avgGenerationMW.toLocaleString()} MW</td>
                    <td>
                      <button 
                        className="btn-secondary" 
                        style={{ padding: '3px 8px', fontSize: '0.75rem' }}
                        onClick={(e) => { e.stopPropagation(); setSelectedRun(isSelected ? null : r.publishTime); }}
                      >
                        {isSelected ? 'Clear Highlight' : 'Highlight Curve'}
                      </button>
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
