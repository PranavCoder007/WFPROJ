import React, { useState, useEffect } from 'react';
import { 
  ShieldAlert, 
  Flame, 
  Wind, 
  Zap, 
  DollarSign, 
  TrendingUp, 
  Sliders, 
  Calendar,
  AlertOctagon,
  CheckCircle,
  HelpCircle
} from 'lucide-react';
import { simulateProcurement } from '../services/api';

export default function ProcurementSimulatorView({ gateClosureTime }) {
  const [date, setDate] = useState('2026-01-15');
  const [demandScale, setDemandScale] = useState(30000);
  const [riskConfidence, setRiskConfidence] = useState('P90');
  const [daPrice, setDaPrice] = useState(75);
  const [sbpPrice, setSbpPrice] = useState(120);
  const [sspPrice, setSspPrice] = useState(40);

  const [simResult, setSimResult] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    setLoading(true);
    simulateProcurement({
      date,
      gateClosureTime,
      demandScaleMW: demandScale,
      riskConfidence,
      dayAheadPriceGBP: daPrice,
      imbalanceBuyPriceGBP: sbpPrice,
      imbalanceSellPriceGBP: sspPrice
    }).then(res => {
      if (active) {
        setSimResult(res);
        setLoading(false);
      }
    });
    return () => { active = false; };
  }, [date, gateClosureTime, demandScale, riskConfidence, daPrice, sbpPrice, sspPrice]);

  if (loading && !simResult) {
    return (
      <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-secondary)' }}>
        Simulating day-ahead thermal procurement and imbalance risks...
      </div>
    );
  }

  const {
    appliedBufferMW = 0,
    totalDemandMWh = 0,
    totalActualWindMWh = 0,
    totalForecastWindMWh = 0,
    totalThermalProcuredMWh = 0,
    totalDayAheadCostGBP = 0,
    totalImbalanceCostGBP = 0,
    totalProcurementCostGBP = 0,
    unhedgedBaselineCostGBP = 0,
    costSavingsGBP = 0,
    shortfallHoursCount = 0,
    intervals = []
  } = simResult || {};

  // Chart Dimensions
  const chartWidth = 1000;
  const chartHeight = 360;
  const padding = { top: 30, right: 30, bottom: 40, left: 60 };

  const maxVal = Math.max(1000, ...intervals.map(i => Math.max(i.demandMW, i.procuredThermalMW + i.actualWindMW, i.procuredThermalMW + i.forecastWindMW))) * 1.15;

  const getX = (hour) => padding.left + (hour / 23) * (chartWidth - padding.left - padding.right);
  const getY = (val) => chartHeight - padding.bottom - ((val || 0) / maxVal) * (chartHeight - padding.top - padding.bottom);

  // Path generators
  const demandPath = intervals.map((inv, i) => `${i === 0 ? 'M' : 'L'} ${getX(inv.hour)} ${getY(inv.demandMW)}`).join(' ');
  const thermalPath = intervals.map((inv, i) => `${i === 0 ? 'M' : 'L'} ${getX(inv.hour)} ${getY(inv.procuredThermalMW)}`).join(' ');
  const totalGenPath = intervals.map((inv, i) => `${i === 0 ? 'M' : 'L'} ${getX(inv.hour)} ${getY(inv.procuredThermalMW + inv.actualWindMW)}`).join(' ');

  return (
    <div className="fade-in">
      {/* Simulation Controls Panel */}
      <div className="glass-card" style={{ marginBottom: 24, padding: '20px 24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
          <div className="card-title">
            <Sliders size={20} color="var(--thermal-orange)" />
            <span>Power Procurement & Imbalance Risk Parameters</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Calendar size={16} color="var(--wind-cyan)" />
            <input
              type="date"
              min="2026-01-01"
              max="2026-01-31"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              style={{ fontWeight: 600 }}
            />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 20 }}>
          {/* Demand Scale Slider */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: 6 }}>
              <span style={{ color: 'var(--text-secondary)' }}>Utility Demand Portfolio Scale:</span>
              <span className="mono" style={{ fontWeight: 700, color: '#f8fafc' }}>{demandScale.toLocaleString()} MW</span>
            </div>
            <input
              type="range"
              min="5000"
              max="45000"
              step="1000"
              value={demandScale}
              onChange={(e) => setDemandScale(Number(e.target.value))}
              style={{ width: '100%' }}
            />
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: 4 }}>
              National GB Winter Peak ~35-40 GW
            </div>
          </div>

          {/* Hedging Strategy Mode */}
          <div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: 6 }}>
              Quantified Error Hedging Buffer:
            </div>
            <select
              value={riskConfidence}
              onChange={(e) => setRiskConfidence(e.target.value)}
              style={{ width: '100%', fontWeight: 600, color: '#fbbf24' }}
            >
              <option value="raw">Raw Forecast (Unhedged - 0 MW Buffer)</option>
              <option value="bias_corrected">Bias-Corrected (+1,840 MW Buffer)</option>
              <option value="P75">P75 Risk Buffer (+2,600 MW Reserve)</option>
              <option value="P90">P90 Risk Buffer (+4,312 MW Reserve) [Recommended]</option>
              <option value="P95">P95 Ultra-Secure (+5,500 MW Reserve)</option>
            </select>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: 4 }}>
              Applied Buffer: <strong>+{Math.round(appliedBufferMW).toLocaleString()} MW</strong>
            </div>
          </div>

          {/* Day Ahead Price */}
          <div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: 6 }}>
              Day-Ahead Power Price (£/MWh):
            </div>
            <input
              type="number"
              value={daPrice}
              onChange={(e) => setDaPrice(Number(e.target.value))}
              style={{ width: '100%', fontWeight: 600 }}
            />
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: 4 }}>
              Wholesale base price
            </div>
          </div>

          {/* SBP Imbalance Price */}
          <div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: 6 }}>
              System Buy Price (SBP Shortfall £/MWh):
            </div>
            <input
              type="number"
              value={sbpPrice}
              onChange={(e) => setSbpPrice(Number(e.target.value))}
              style={{ width: '100%', fontWeight: 600, color: '#fb7185' }}
            />
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: 4 }}>
              Cash-out penalty when short
            </div>
          </div>
        </div>
      </div>

      {/* Financial ROI & Impact Metrics */}
      <div className="metrics-grid">
        <div className="metric-box emerald">
          <div className="metric-label">
            <span>Net Imbalance Cost Savings</span>
            <CheckCircle size={16} color="var(--success-emerald)" />
          </div>
          <div className="metric-val mono" style={{ color: '#34d399' }}>
            £{Math.round(costSavingsGBP).toLocaleString()}
          </div>
          <div className="metric-sub">Savings vs Unhedged Day-Ahead Bidding</div>
        </div>

        <div className="metric-box amber">
          <div className="metric-label">
            <span>Thermal Procured (Day-Ahead)</span>
            <Flame size={16} color="var(--thermal-orange)" />
          </div>
          <div className="metric-val mono">{Math.round(totalThermalProcuredMWh).toLocaleString()} <span style={{ fontSize: '1rem', fontWeight: 500 }}>MWh</span></div>
          <div className="metric-sub">Base Cost: £{Math.round(totalDayAheadCostGBP).toLocaleString()}</div>
        </div>

        <div className="metric-box rose">
          <div className="metric-label">
            <span>Real-Time Shortfall Hours</span>
            <AlertOctagon size={16} color="var(--error-rose)" />
          </div>
          <div className="metric-val mono" style={{ color: shortfallHoursCount > 0 ? '#fb7185' : '#34d399' }}>
            {shortfallHoursCount} <span style={{ fontSize: '1rem', fontWeight: 500 }}>of 24 hours</span>
          </div>
          <div className="metric-sub">
            {shortfallHoursCount === 0 ? 'Fully Protected at Chosen Buffer' : 'Exposed to SBP Surcharge'}
          </div>
        </div>

        <div className="metric-box violet">
          <div className="metric-label">
            <span>Total Energy Cost</span>
            <DollarSign size={16} color="var(--forecast-violet)" />
          </div>
          <div className="metric-val mono">£{Math.round(totalProcurementCostGBP).toLocaleString()}</div>
          <div className="metric-sub">Day-Ahead + Imbalance Settlement</div>
        </div>
      </div>

      {/* Visual Stacked Power Balance Chart */}
      <div className="glass-card" style={{ marginBottom: 24 }}>
        <div className="card-header">
          <div>
            <div className="card-title">
              <Zap size={20} color="var(--wind-cyan)" />
              <span>Real-Time Physical Power Balance ({date})</span>
            </div>
            <div className="card-subtitle">
              Consumer Demand vs Combined Generation (Thermal Procured + Physical Wind Delivered)
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.8rem' }}>
              <span style={{ width: 14, height: 3, background: '#f8fafc', borderRadius: 2 }}></span>
              <span style={{ color: '#f8fafc', fontWeight: 600 }}>Consumer Demand</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.8rem' }}>
              <span style={{ width: 14, height: 3, background: 'var(--thermal-orange)', borderRadius: 2 }}></span>
              <span style={{ color: 'var(--text-secondary)' }}>Thermal Procured</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.8rem' }}>
              <span style={{ width: 14, height: 3, background: 'var(--wind-cyan)', borderRadius: 2 }}></span>
              <span style={{ color: 'var(--text-secondary)' }}>Total Real Generation</span>
            </div>
          </div>
        </div>

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

            {/* Thermal Procured Line */}
            <path d={thermalPath} fill="none" stroke="#fb923c" strokeWidth="2.5" />

            {/* Total Generation Line */}
            <path d={totalGenPath} fill="none" stroke="#06b6d4" strokeWidth="2.5" />

            {/* Demand Line */}
            <path d={demandPath} fill="none" stroke="#ffffff" strokeWidth="3" strokeDasharray="6 3" />

            {/* Hour markers */}
            {intervals.map((inv, i) => {
              const x = getX(inv.hour);
              const yDemand = getY(inv.demandMW);
              const yTotal = getY(inv.procuredThermalMW + inv.actualWindMW);
              const isShort = inv.netResidualShortfallMW > 0;

              return (
                <g key={i}>
                  {isShort && (
                    <line x1={x} y1={yTotal} x2={x} y2={yDemand} stroke="#f43f5e" strokeWidth="3" />
                  )}
                  {inv.hour % 3 === 0 && (
                    <text
                      x={x}
                      y={chartHeight - padding.bottom + 20}
                      fill="var(--text-muted)"
                      fontSize="11"
                      textAnchor="middle"
                      fontFamily="JetBrains Mono"
                    >
                      {inv.hour}:00
                    </text>
                  )}
                </g>
              );
            })}
          </svg>
        </div>
      </div>

      {/* Hourly Dispatch Schedule Table */}
      <div className="glass-card">
        <div className="card-header">
          <div className="card-title">
            <span>Hourly Procurement & Imbalance Cash-out Schedule</span>
          </div>
          <div className="card-subtitle">
            Detailed 24-hour breakdown showing demand, wind forecast, thermal procured, physical wind, and net imbalance
          </div>
        </div>

        <div className="data-table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Hour (GMT)</th>
                <th>Consumer Demand</th>
                <th>Forecast Wind</th>
                <th>Procured Thermal</th>
                <th>Physical Wind</th>
                <th>Delivery Balance</th>
                <th>Imbalance Cashflow</th>
                <th>Total Interval Cost</th>
              </tr>
            </thead>
            <tbody>
              {intervals.map((row, idx) => {
                const isShort = row.netResidualShortfallMW > 0;
                return (
                  <tr key={idx}>
                    <td className="mono" style={{ fontWeight: 600 }}>{row.startTime.slice(11, 16)}</td>
                    <td className="mono">{row.demandMW.toLocaleString()} MW</td>
                    <td className="mono" style={{ color: '#fbbf24' }}>{row.forecastWindMW.toLocaleString()} MW</td>
                    <td className="mono" style={{ color: '#fb923c', fontWeight: 600 }}>{row.procuredThermalMW.toLocaleString()} MW</td>
                    <td className="mono" style={{ color: '#38bdf8' }}>{row.actualWindMW.toLocaleString()} MW</td>
                    <td>
                      {isShort ? (
                        <span className="pill pill-rose">
                          Short -{row.netResidualShortfallMW.toLocaleString()} MW
                        </span>
                      ) : (
                        <span className="pill pill-emerald">
                          Long +{row.netResidualSurplusMW.toLocaleString()} MW
                        </span>
                      )}
                    </td>
                    <td className="mono" style={{ color: isShort ? '#fb7185' : '#34d399' }}>
                      {isShort ? `+£${Math.round(row.imbalanceCostGBP).toLocaleString()} SBP` : `-£${Math.round(Math.abs(row.imbalanceCostGBP)).toLocaleString()} SSP`}
                    </td>
                    <td className="mono" style={{ fontWeight: 700 }}>
                      £{Math.round(row.totalCostGBP).toLocaleString()}
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
