import React from 'react';
import { 
  Wind, 
  BarChart3, 
  TrendingUp, 
  ShieldAlert, 
  Database, 
  Presentation, 
  FileCode,
  Clock,
  Zap
} from 'lucide-react';

export default function Header({ 
  activeTab, 
  setActiveTab, 
  gateClosureTime, 
  setGateClosureTime,
  onOpenPitch,
  onOpenTech
}) {
  const tabs = [
    { id: 'day-ahead', label: 'Day-Ahead Decision Desk', icon: Wind, desc: 'Latest Forecast vs Actuals' },
    { id: 'metrics', label: 'Quantitative Error Evaluation', icon: BarChart3, desc: 'MAE, RMSE, Bias & Quantiles' },
    { id: 'evolution', label: 'Forecast Evolution', icon: TrendingUp, desc: 'Run-by-Run Convergence' },
    { id: 'procurement', label: 'Procurement & Risk Simulator', icon: ShieldAlert, desc: 'Thermal Buffer & Hedging' },
    { id: 'explorer', label: 'Data Audit & Elexon API', icon: Database, desc: 'Raw Feeds & Validation' },
  ];

  return (
    <header style={{
      borderBottom: '1px solid var(--border-card)',
      background: 'rgba(11, 16, 27, 0.95)',
      backdropFilter: 'blur(16px)',
      position: 'sticky',
      top: 0,
      zIndex: 100,
    }}>
      {/* Top Bar */}
      <div style={{
        maxWidth: 1560,
        margin: '0 auto',
        padding: '14px 28px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 16
      }}>
        {/* Brand */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{
            width: 42,
            height: 42,
            borderRadius: 'var(--radius-md)',
            background: 'linear-gradient(135deg, #0284c7, #06b6d4)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 15px rgba(6, 182, 212, 0.4)'
          }}>
            <Wind size={24} color="#ffffff" />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span className="brand-font" style={{ fontSize: '1.25rem', fontWeight: 800, color: '#f8fafc', letterSpacing: '-0.02em' }}>
                Gridbricks
              </span>
              <span className="pill pill-cyan">
                <Zap size={11} /> Day-Ahead Power Procurement
              </span>
            </div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
              UK Wholesale Electricity Market • January 2026 Elexon BMRS Live Data
            </div>
          </div>
        </div>

        {/* Global Controls & Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          {/* Decision Gate Selector */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            background: 'rgba(15, 23, 42, 0.8)',
            padding: '6px 12px',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-subtle)'
          }}>
            <Clock size={15} color="var(--forecast-amber)" />
            <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>Gate Closure (D-1):</span>
            <select
              value={gateClosureTime}
              onChange={(e) => setGateClosureTime(e.target.value)}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#fbbf24',
                fontWeight: 600,
                fontSize: '0.82rem',
                cursor: 'pointer',
                padding: '2px 4px'
              }}
            >
              <option value="11:00">11:00 GMT (EPEX Auction Default)</option>
              <option value="10:00">10:00 GMT (Early Gate)</option>
              <option value="12:00">12:00 GMT (Noon Cutoff)</option>
              <option value="14:00">14:00 GMT (Late Gate)</option>
            </select>
          </div>

          {/* Client Pitch Button */}
          <button
            onClick={onOpenPitch}
            className="btn-secondary"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              background: 'rgba(139, 92, 246, 0.15)',
              color: '#c084fc',
              borderColor: 'rgba(139, 92, 246, 0.3)'
            }}
          >
            <Presentation size={15} />
            <span>Client Pitch</span>
          </button>

          {/* Tech Design Button */}
          <button
            onClick={onOpenTech}
            className="btn-secondary"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              background: 'rgba(59, 130, 246, 0.15)',
              color: '#60a5fa',
              borderColor: 'rgba(59, 130, 246, 0.3)'
            }}
          >
            <FileCode size={15} />
            <span>Tech Lead Review</span>
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div style={{
        maxWidth: 1560,
        margin: '0 auto',
        padding: '0 28px',
        display: 'flex',
        gap: 6,
        overflowX: 'auto'
      }}>
        {tabs.map((t) => {
          const Icon = t.icon;
          const isActive = activeTab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '12px 18px',
                background: 'transparent',
                border: 'none',
                borderBottom: isActive ? '3px solid #06b6d4' : '3px solid transparent',
                color: isActive ? '#f8fafc' : 'var(--text-secondary)',
                fontWeight: isActive ? 600 : 500,
                fontSize: '0.875rem',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'all 0.15s ease'
              }}
            >
              <Icon size={16} color={isActive ? '#06b6d4' : 'var(--text-muted)'} />
              <span>{t.label}</span>
            </button>
          );
        })}
      </div>
    </header>
  );
}
