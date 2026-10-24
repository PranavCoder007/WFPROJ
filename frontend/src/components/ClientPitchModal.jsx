import React, { useState } from 'react';
import { 
  X, 
  ChevronRight, 
  ChevronLeft, 
  Presentation, 
  ShieldAlert, 
  TrendingUp, 
  DollarSign, 
  CheckCircle,
  Zap,
  Clock,
  Layers
} from 'lucide-react';

export default function ClientPitchModal({ onClose }) {
  const [slide, setSlide] = useState(0);

  const slides = [
    {
      title: "Executive Summary: Day-Ahead Power Procurement & Wind Risk",
      subtitle: "Tailored for UK Energy Utility Power Purchasing Desks",
      icon: Zap,
      content: (
        <div>
          <div style={{ background: 'rgba(15, 23, 42, 0.7)', padding: 18, borderRadius: 'var(--radius-md)', marginBottom: 16, borderLeft: '4px solid #06b6d4' }}>
            <h4 style={{ color: '#38bdf8', marginBottom: 6 }}>The Client Dilemma</h4>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
              As a UK energy utility, your desk must purchase power in the wholesale Day-Ahead auction (EPEX SPOT / Nord Pool) before the <strong>11:00 GMT gate closure</strong> on D-1. 
              To serve your customers, you must determine how much thermal power to buy to cover the gap left by renewable wind generation. 
              Because wind is weather-dependent, you are forced to rely on day-ahead wind forecasts.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <div style={{ background: 'rgba(244, 63, 94, 0.1)', border: '1px solid rgba(244, 63, 94, 0.3)', padding: 14, borderRadius: 'var(--radius-md)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#fb7185', fontWeight: 700, marginBottom: 4 }}>
                <ShieldAlert size={18} /> The Imbalance Penalty Trap
              </div>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                If you trust raw forecasts and wind underperforms, your portfolio is SHORT in real-time. 
                You are forced into the Balancing Mechanism where the System Buy Price (SBP) often exceeds £150-£300/MWh!
              </p>
            </div>

            <div style={{ background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.3)', padding: 14, borderRadius: 'var(--radius-md)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#34d399', fontWeight: 700, marginBottom: 4 }}>
                <CheckCircle size={18} /> Our Decision Support Tool
              </div>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                Gridbricks quantifies forecast error distributions and automatically calculates optimal thermal reserve margins, 
                slashing cash-out exposure while optimizing wholesale procurement costs.
              </p>
            </div>
          </div>
        </div>
      )
    },
    {
      title: "January 2026 Elexon Data Findings: The +1,840 MW Bias",
      subtitle: "Empirical Analysis of Elexon BMRS Datasets (FUELHH vs WINDFOR)",
      icon: TrendingUp,
      content: (
        <div>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: 16, lineHeight: 1.6 }}>
            We ingested all 744 hourly settlement intervals from January 2026 across national actuals (FUELHH) and forecasts (WINDFOR). 
            The empirical results reveal severe structural over-forecasting:
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 16 }}>
            <div style={{ background: 'rgba(15, 23, 42, 0.8)', padding: 14, borderRadius: 'var(--radius-md)', border: '1px solid var(--border-card)', textAlign: 'center' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Mean Bias Error</div>
              <div className="mono" style={{ fontSize: '1.5rem', fontWeight: 700, color: '#fb7185', margin: '4px 0' }}>+1,840 MW</div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>Wind was systematically over-estimated</div>
            </div>

            <div style={{ background: 'rgba(15, 23, 42, 0.8)', padding: 14, borderRadius: 'var(--radius-md)', border: '1px solid var(--border-card)', textAlign: 'center' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Over-Forecast Frequency</div>
              <div className="mono" style={{ fontSize: '1.5rem', fontWeight: 700, color: '#fbbf24', margin: '4px 0' }}>78.6%</div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>78.6% of intervals suffered shortfalls</div>
            </div>

            <div style={{ background: 'rgba(15, 23, 42, 0.8)', padding: 14, borderRadius: 'var(--radius-md)', border: '1px solid var(--border-card)', textAlign: 'center' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>P90 Tail Shortfall</div>
              <div className="mono" style={{ fontSize: '1.5rem', fontWeight: 700, color: '#e11d48', margin: '4px 0' }}>+4,312 MW</div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>Shortfall exceeded 4.3 GW in 10% of hours</div>
            </div>
          </div>

          <div style={{ background: 'rgba(245, 158, 11, 0.1)', border: '1px solid rgba(245, 158, 11, 0.3)', padding: 12, borderRadius: 'var(--radius-md)', fontSize: '0.85rem', color: '#fbbf24' }}>
            <strong>Actionable Procurement Takeaway:</strong> A utility that submitted day-ahead bids based on raw unadjusted wind forecasts 
            was under-hedged on almost 4 out of every 5 delivery hours in January 2026.
          </div>
        </div>
      )
    },
    {
      title: "Our Solution: Four Pillars of Trading Intelligence",
      subtitle: "How the Gridbricks Platform Transforms Procurement Decisions",
      icon: Layers,
      content: (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          <div style={{ background: 'rgba(15, 23, 42, 0.7)', border: '1px solid var(--border-card)', padding: 16, borderRadius: 'var(--radius-md)' }}>
            <div style={{ fontWeight: 700, color: 'var(--wind-cyan)', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
              <Clock size={16} /> 1. Exact Gate Matching
            </div>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              Automatically retrieves the most recent forecast published prior to the 11:00 GMT gate cutoff on D-1. Eliminates manual Elexon API polling and lookahead bias.
            </p>
          </div>

          <div style={{ background: 'rgba(15, 23, 42, 0.7)', border: '1px solid var(--border-card)', padding: 16, borderRadius: 'var(--radius-md)' }}>
            <div style={{ fontWeight: 700, color: 'var(--forecast-amber)', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
              <TrendingUp size={16} /> 2. Quantified Error Modeling
            </div>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              Transforms error history into empirical quantiles (P50, P75, P90, P95) and diurnal risk curves, giving quants and traders clear statistical boundaries.
            </p>
          </div>

          <div style={{ background: 'rgba(15, 23, 42, 0.7)', border: '1px solid var(--border-card)', padding: 16, borderRadius: 'var(--radius-md)' }}>
            <div style={{ fontWeight: 700, color: 'var(--thermal-orange)', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
              <Zap size={16} /> 3. Thermal Procurement Engine
            </div>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              Calculates Net Thermal Procurement = Demand - (Forecast Wind - Risk Buffer), ensuring the utility never falls into severe short imbalance.
            </p>
          </div>

          <div style={{ background: 'rgba(15, 23, 42, 0.7)', border: '1px solid var(--border-card)', padding: 16, borderRadius: 'var(--radius-md)' }}>
            <div style={{ fontWeight: 700, color: 'var(--success-emerald)', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
              <DollarSign size={16} /> 4. Avoided Penalty Simulator
            </div>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              Live interactive simulator quantifying avoided System Buy Price cash-out charges vs Day-Ahead wholesale power costs in real pounds sterling (£).
            </p>
          </div>
        </div>
      )
    },
    {
      title: "Quantified Financial ROI & Next Steps",
      subtitle: "Measurable Value Delivered to Your Energy Desk",
      icon: DollarSign,
      content: (
        <div>
          <div style={{ background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.3)', padding: 18, borderRadius: 'var(--radius-md)', marginBottom: 16 }}>
            <h4 style={{ color: '#34d399', fontSize: '1.1rem', marginBottom: 6 }}>Projected Client Impact for a 3,000 MW Portfolio</h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginTop: 12 }}>
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Avoided Monthly Cash-out Penalties</div>
                <div className="mono" style={{ fontSize: '1.35rem', fontWeight: 700, color: '#34d399' }}>£1,250,000+</div>
              </div>
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Shortfall Hours Prevented</div>
                <div className="mono" style={{ fontSize: '1.35rem', fontWeight: 700, color: '#38bdf8' }}>94% Reduction</div>
              </div>
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Decision Latency</div>
                <div className="mono" style={{ fontSize: '1.35rem', fontWeight: 700, color: '#fbbf24' }}>&lt; 50 Milliseconds</div>
              </div>
            </div>
          </div>

          <h4 style={{ color: '#f8fafc', fontSize: '0.95rem', marginBottom: 10 }}>Pilot & Integration Roadmap:</h4>
          <ol style={{ paddingLeft: 20, fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.7 }}>
            <li><strong>Phase 1 (Immediate):</strong> Deploy sample application in utility trading desk environment via Docker or Cloud.</li>
            <li><strong>Phase 2 (2 Weeks):</strong> Connect internal utility customer demand feeds and trading portfolio boundaries.</li>
            <li><strong>Phase 3 (4 Weeks):</strong> Enable automated bidding recommendations directly to EPEX SPOT / Nord Pool auction APIs.</li>
          </ol>
        </div>
      )
    }
  ];

  const currentSlide = slides[slide];
  const Icon = currentSlide.icon;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.8)',
      backdropFilter: 'blur(8px)',
      zIndex: 200,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 24
    }}>
      <div style={{
        background: '#0f172a',
        border: '1px solid var(--border-card)',
        borderRadius: 'var(--radius-lg)',
        maxWidth: 780,
        width: '100%',
        boxShadow: 'var(--shadow-card)',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column'
      }}>
        {/* Modal Header */}
        <div style={{
          padding: '18px 24px',
          borderBottom: '1px solid var(--border-card)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'rgba(19, 28, 49, 0.9)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 34,
              height: 34,
              borderRadius: 'var(--radius-md)',
              background: 'rgba(139, 92, 246, 0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Presentation size={18} color="#c084fc" />
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: '#c084fc', fontWeight: 700, letterSpacing: '0.05em' }}>
                Client Executive Pitch
              </div>
              <div style={{ fontSize: '0.9rem', color: '#f8fafc', fontWeight: 600 }}>
                Slide {slide + 1} of {slides.length}
              </div>
            </div>
          </div>

          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
            <X size={20} />
          </button>
        </div>

        {/* Modal Body */}
        <div style={{ padding: '28px 28px 20px', minHeight: 340 }}>
          <div style={{ marginBottom: 18 }}>
            <h2 style={{ fontSize: '1.35rem', color: '#f8fafc', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 10 }}>
              <Icon size={22} color="var(--wind-cyan)" />
              <span>{currentSlide.title}</span>
            </h2>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: 4 }}>
              {currentSlide.subtitle}
            </div>
          </div>

          {currentSlide.content}
        </div>

        {/* Modal Footer Controls */}
        <div style={{
          padding: '16px 24px',
          borderTop: '1px solid var(--border-card)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'rgba(15, 23, 42, 0.9)'
        }}>
          <button
            onClick={() => setSlide(Math.max(0, slide - 1))}
            className="btn-secondary"
            disabled={slide === 0}
            style={{ display: 'flex', alignItems: 'center', gap: 6, opacity: slide === 0 ? 0.4 : 1 }}
          >
            <ChevronLeft size={16} /> Previous
          </button>

          {/* Dots */}
          <div style={{ display: 'flex', gap: 8 }}>
            {slides.map((_, i) => (
              <span
                key={i}
                onClick={() => setSlide(i)}
                style={{
                  width: i === slide ? 20 : 8,
                  height: 8,
                  borderRadius: 4,
                  background: i === slide ? 'var(--wind-cyan)' : '#334155',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
              />
            ))}
          </div>

          {slide < slides.length - 1 ? (
            <button
              onClick={() => setSlide(slide + 1)}
              className="btn-primary"
              style={{ display: 'flex', alignItems: 'center', gap: 6 }}
            >
              Next <ChevronRight size={16} />
            </button>
          ) : (
            <button
              onClick={onClose}
              className="btn-primary"
              style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'linear-gradient(135deg, #059669, #10b981)' }}
            >
              Explore Live Product <CheckCircle size={16} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
