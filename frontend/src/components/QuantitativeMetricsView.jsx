import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle2, 
  ShieldCheck, 
  Clock, 
  Percent,
  Sliders,
  Info
} from 'lucide-react';
import { fetchOverallMetrics, fetchDiurnalProfile, fetchDailyBreakdown } from '../services/api';

export default function QuantitativeMetricsView({ gateClosureTime }) {
  const [metrics, setMetrics] = useState(null);
  const [diurnal, setDiurnal] = useState([]);
  const [daily, setDaily] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hoveredBin, setHoveredBin] = useState(null);
  const [hoveredHour, setHoveredHour] = useState(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    Promise.all([
      fetchOverallMetrics({ startDate: '2026-01-01', endDate: '2026-01-31', gateClosureTime }),
      fetchDiurnalProfile({ startDate: '2026-01-01', endDate: '2026-01-31', gateClosureTime }),
      fetchDailyBreakdown({ startDate: '2026-01-01', endDate: '2026-01-31', gateClosureTime })
    ]).then(([m, d, dayList]) => {
      if (active) {
        setMetrics(m);
        setDiurnal(d || []);
        setDaily(dayList || []);
        setLoading(false);
      }
    });
    return () => { active = false; };
  }, [gateClosureTime]);

  if (loading || !metrics) {
    return (
      <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-secondary)' }}>
        Loading quantitative evaluation metrics...
      </div>
    );
  }

  const quantiles = metrics.quantiles || {};
  const distribution = metrics.distribution || [];

  // Max count for histogram
  const maxHistCount = distribution.length > 0 ? Math.max(...distribution.map(b => b.count)) : 1;

  // Max diurnal value
  const maxDiurnalMW = diurnal.length > 0 ? Math.max(...diurnal.map(d => Math.max(d.meanActualMW, d.meanForecastMW, d.maeMW))) * 1.15 : 20000;

  return (
    <div className="fade-in">
      {/* Top Banner: Key Domain Finding */}
      <div className="glass-card" style={{
        marginBottom: 24,
        background: 'linear-gradient(135deg, rgba(19, 28, 49, 0.95), rgba(30, 41, 59, 0.7))',
        borderLeft: '4px solid #f59e0b'
      }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
          <div style={{
            width: 40,
            height: 40,
            borderRadius: 'var(--radius-md)',
            background: 'rgba(245, 158, 11, 0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}>
            <Info size={22} color="#fbbf24" />
          </div>
          <div>
            <h3 style={{ fontSize: '1.15rem', color: '#f8fafc', fontWeight: 700, marginBottom: 4 }}>
              Critical Domain Finding: Systematic Over-Forecast Bias of +{metrics.meanBiasMW} MW
            </h3>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
              In January 2026, National Grid ESO wind forecasts published prior to the {gateClosureTime} GMT Day-Ahead gate closure 
              consistently over-estimated physical wind generation across <strong>{metrics.overForecastFrequencyPct}% of all delivery intervals</strong>. 
              Traders procuring power without accounting for this quantified error would experience severe real-time energy deficits, 
              forcing exposure to volatile System Buy Price (SBP) imbalance cash-out penalties.
            </p>
          </div>
        </div>
      </div>

      {/* Quantitative KPIs */}
      <div className="metrics-grid">
        <div className="metric-box amber">
          <div className="metric-label">
            <span>Mean Absolute Error (MAE)</span>
            <AlertTriangle size={16} color="var(--forecast-amber)" />
          </div>
          <div className="metric-val mono">{metrics.maeMW.toLocaleString()} <span style={{ fontSize: '1rem', fontWeight: 500 }}>MW</span></div>
          <div className="metric-sub">Average absolute error magnitude</div>
        </div>

        <div className="metric-box rose">
          <div className="metric-label">
            <span>Root Mean Squared (RMSE)</span>
            <TrendingUp size={16} color="var(--error-rose)" />
          </div>
          <div className="metric-val mono">{metrics.rmseMW.toLocaleString()} <span style={{ fontSize: '1rem', fontWeight: 500 }}>MW</span></div>
          <div className="metric-sub">Penalizes large forecast spikes</div>
        </div>

        <div className="metric-box cyan">
          <div className="metric-label">
            <span>Weighted Abs Pct Error (WAPE)</span>
            <Percent size={16} color="var(--wind-cyan)" />
          </div>
          <div className="metric-val mono">{metrics.wapePct}%</div>
          <div className="metric-sub">Error normalized against wind fleet</div>
        </div>

        <div className="metric-box violet">
          <div className="metric-label">
            <span>Pearson Correlation (R²)</span>
            <ShieldCheck size={16} color="var(--forecast-violet)" />
          </div>
          <div className="metric-val mono">{(metrics.rSquared * 100).toFixed(1)}%</div>
          <div className="metric-sub">r = {metrics.correlationR} (Good trend fit)</div>
        </div>
      </div>

      {/* Quantiles & Error Distribution Section */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(480px, 1fr))', gap: 24, marginBottom: 24 }}>
        {/* Error Quantiles & Value-at-Risk Hedging Table */}
        <div className="glass-card">
          <div className="card-header">
            <div>
              <div className="card-title">
                <Sliders size={20} color="var(--forecast-amber)" />
                <span>Empirical Error Quantiles (Risk Margins)</span>
              </div>
              <div className="card-subtitle">
                Used to determine required thermal buffer reserves at specified confidence levels
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[
              { q: 'P10', val: quantiles.p10, desc: '10th Percentile: Under-forecast bound (Spill risk)', color: '#34d399' },
              { q: 'P25', val: quantiles.p25, desc: '25th Percentile: Lower quartile shortfall', color: '#38bdf8' },
              { q: 'P50 (Median)', val: quantiles.p50, desc: '50th Percentile: Median expected over-forecast', color: '#fbbf24' },
              { q: 'P75', val: quantiles.p75, desc: '75th Percentile: Moderate procurement hedge margin', color: '#fb923c' },
              { q: 'P90 (Recommended)', val: quantiles.p90, desc: '90th Percentile: 90% confidence reserve buffer', color: '#f43f5e' },
              { q: 'P95', val: quantiles.p95, desc: '95th Percentile: Extreme weather risk hedge', color: '#e11d48' },
            ].map((item, idx) => (
              <div 
                key={idx}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px 16px',
                  background: 'rgba(15, 23, 42, 0.6)',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-subtle)'
                }}
              >
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.9rem', color: item.color }}>{item.q}</div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>{item.desc}</div>
                </div>
                <div className="mono" style={{ fontSize: '1.15rem', fontWeight: 700, color: '#f8fafc' }}>
                  {item.val > 0 ? `+${item.val.toLocaleString()}` : item.val.toLocaleString()} MW
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Error Frequency Distribution Histogram */}
        <div className="glass-card">
          <div className="card-header">
            <div>
              <div className="card-title">
                <BarChart3 size={20} color="var(--wind-cyan)" />
                <span>Forecast Error Distribution Histogram</span>
              </div>
              <div className="card-subtitle">
                Frequency distribution of (Forecast - Actual) across 744 intervals (20 bins)
              </div>
            </div>
          </div>

          <div style={{ height: 260, display: 'flex', alignItems: 'flex-end', gap: 4, padding: '10px 0', borderBottom: '1px solid var(--border-subtle)' }}>
            {distribution.map((bin, i) => {
              const heightPct = (bin.count / maxHistCount) * 100;
              const isOver = bin.binCenter > 0;
              const isHovered = hoveredBin === i;

              return (
                <div
                  key={i}
                  onMouseEnter={() => setHoveredBin(i)}
                  onMouseLeave={() => setHoveredBin(null)}
                  style={{
                    flex: 1,
                    height: `${Math.max(4, heightPct)}%`,
                    background: isOver 
                      ? (isHovered ? '#fb7185' : 'rgba(244, 63, 94, 0.65)')
                      : (isHovered ? '#34d399' : 'rgba(16, 185, 129, 0.65)'),
                    borderRadius: '3px 3px 0 0',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    position: 'relative'
                  }}
                />
              );
            })}
          </div>

          {/* Histogram X Axis */}
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, fontSize: '0.75rem', color: 'var(--text-muted)' }} className="mono">
            <span>{distribution.length > 0 ? `${distribution[0].binStart} MW (Under)` : ''}</span>
            <span>0 MW (Zero Error)</span>
            <span>{distribution.length > 0 ? `+${distribution[distribution.length - 1].binEnd} MW (Over)` : ''}</span>
          </div>

          {/* Bin Tooltip */}
          {hoveredBin !== null && distribution[hoveredBin] && (
            <div style={{
              marginTop: 12,
              padding: '8px 12px',
              background: 'rgba(15, 23, 42, 0.9)',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border-card)',
              fontSize: '0.8rem',
              display: 'flex',
              justifyContent: 'space-between'
            }}>
              <span>Bin: <strong>{distribution[hoveredBin].binStart} to {distribution[hoveredBin].binEnd} MW</strong></span>
              <span>Count: <strong>{distribution[hoveredBin].count} hours ({distribution[hoveredBin].frequencyPct}%)</strong></span>
            </div>
          )}
        </div>
      </div>

      {/* Diurnal Hourly Error Profile */}
      <div className="glass-card" style={{ marginBottom: 24 }}>
        <div className="card-header">
          <div>
            <div className="card-title">
              <Clock size={20} color="var(--thermal-orange)" />
              <span>Diurnal Settlement Period Error Curve (Hours 00:00 to 23:00)</span>
            </div>
            <div className="card-subtitle">
              Average Wind Generation, Forecast, and MAE by hour of day (identifying peak risk windows)
            </div>
          </div>
        </div>

        {/* Diurnal Bar / Line Visualization */}
        <div style={{ overflowX: 'auto' }}>
          <div style={{ minWidth: 800, height: 260, display: 'flex', alignItems: 'flex-end', gap: 8, padding: '10px 0', borderBottom: '1px solid var(--border-subtle)' }}>
            {diurnal.map((d, i) => {
              const actH = (d.meanActualMW / maxDiurnalMW) * 100;
              const fcH = (d.meanForecastMW / maxDiurnalMW) * 100;
              const maeH = (d.maeMW / maxDiurnalMW) * 100;
              const isHovered = hoveredHour === i;

              return (
                <div
                  key={i}
                  onMouseEnter={() => setHoveredHour(i)}
                  onMouseLeave={() => setHoveredHour(null)}
                  style={{
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 3,
                    height: '100%',
                    justifyContent: 'flex-end',
                    cursor: 'pointer'
                  }}
                >
                  <div style={{ width: '100%', display: 'flex', gap: 2, alignItems: 'flex-end', height: '100%' }}>
                    {/* Forecast bar */}
                    <div style={{
                      flex: 1,
                      height: `${fcH}%`,
                      background: isHovered ? '#fbbf24' : 'rgba(245, 158, 11, 0.6)',
                      borderRadius: '2px 2px 0 0'
                    }} title={`Forecast: ${d.meanForecastMW} MW`} />
                    {/* Actual bar */}
                    <div style={{
                      flex: 1,
                      height: `${actH}%`,
                      background: isHovered ? '#38bdf8' : 'rgba(6, 182, 212, 0.6)',
                      borderRadius: '2px 2px 0 0'
                    }} title={`Actual: ${d.meanActualMW} MW`} />
                    {/* MAE indicator */}
                    <div style={{
                      flex: 1,
                      height: `${maeH}%`,
                      background: isHovered ? '#fb7185' : 'rgba(244, 63, 94, 0.6)',
                      borderRadius: '2px 2px 0 0'
                    }} title={`MAE: ${d.maeMW} MW`} />
                  </div>
                  <span className="mono" style={{ fontSize: '0.68rem', color: isHovered ? '#f8fafc' : 'var(--text-muted)' }}>
                    {d.hour}h
                  </span>
                </div>
              );
            })}
          </div>

          {/* Diurnal Legend & Tooltip */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 12, flexWrap: 'wrap', gap: 12 }}>
            <div style={{ display: 'flex', gap: 16, fontSize: '0.8rem' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ width: 10, height: 10, background: 'rgba(245, 158, 11, 0.8)', borderRadius: 2 }}></span>
                <span style={{ color: 'var(--text-secondary)' }}>Mean Forecast (MW)</span>
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ width: 10, height: 10, background: 'rgba(6, 182, 212, 0.8)', borderRadius: 2 }}></span>
                <span style={{ color: 'var(--text-secondary)' }}>Mean Actual (MW)</span>
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ width: 10, height: 10, background: 'rgba(244, 63, 94, 0.8)', borderRadius: 2 }}></span>
                <span style={{ color: 'var(--text-secondary)' }}>Hour MAE (MW)</span>
              </span>
            </div>

            {hoveredHour !== null && diurnal[hoveredHour] && (
              <div className="mono" style={{ fontSize: '0.82rem', color: '#f8fafc' }}>
                Hour {diurnal[hoveredHour].label} (SP {diurnal[hoveredHour].settlementPeriodStart}-{diurnal[hoveredHour].settlementPeriodEnd}): 
                Forecast {diurnal[hoveredHour].meanForecastMW} MW vs Actual {diurnal[hoveredHour].meanActualMW} MW (Bias: +{diurnal[hoveredHour].meanBiasMW} MW)
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Daily Performance Ranking Table */}
      <div className="glass-card">
        <div className="card-header">
          <div className="card-title">
            <span>January 2026 Daily Error Performance Ranking</span>
          </div>
          <div className="card-subtitle">
            All 31 delivery days ordered by date with error metrics and extreme volatility days
          </div>
        </div>

        <div className="data-table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Total Actual (MWh)</th>
                <th>Total Forecast (MWh)</th>
                <th>Peak Actual</th>
                <th>Peak Forecast</th>
                <th>Day MAE</th>
                <th>Day RMSE</th>
                <th>Net Bias (MW)</th>
                <th>Max Shortfall (MW)</th>
                <th>Accuracy Tier</th>
              </tr>
            </thead>
            <tbody>
              {daily.map((row, idx) => {
                const isHighError = row.maeMW > 2500;
                return (
                  <tr key={idx}>
                    <td className="mono" style={{ fontWeight: 600 }}>{row.date}</td>
                    <td className="mono">{row.totalActualMWh.toLocaleString()} MWh</td>
                    <td className="mono">{row.totalForecastMWh.toLocaleString()} MWh</td>
                    <td className="mono" style={{ color: '#38bdf8' }}>{row.peakActualMW.toLocaleString()} MW</td>
                    <td className="mono" style={{ color: '#fbbf24' }}>{row.peakForecastMW.toLocaleString()} MW</td>
                    <td className="mono" style={{ fontWeight: 600, color: isHighError ? '#fb7185' : '#f8fafc' }}>
                      {row.maeMW.toLocaleString()} MW
                    </td>
                    <td className="mono">{row.rmseMW.toLocaleString()} MW</td>
                    <td className="mono" style={{ color: row.meanBiasMW > 0 ? '#fb7185' : '#34d399' }}>
                      {row.meanBiasMW > 0 ? `+${row.meanBiasMW}` : row.meanBiasMW} MW
                    </td>
                    <td className="mono" style={{ color: '#f43f5e' }}>
                      +{row.maxOverForecastMW.toLocaleString()} MW
                    </td>
                    <td>
                      {isHighError ? (
                        <span className="pill pill-rose">Volatile Front</span>
                      ) : (
                        <span className="pill pill-emerald">Standard</span>
                      )}
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
