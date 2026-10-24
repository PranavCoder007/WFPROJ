import React, { useState } from 'react';
import Header from './components/Header';
import DayAheadView from './components/DayAheadView';
import QuantitativeMetricsView from './components/QuantitativeMetricsView';
import ForecastEvolutionView from './components/ForecastEvolutionView';
import ProcurementSimulatorView from './components/ProcurementSimulatorView';
import DataExplorerView from './components/DataExplorerView';
import ClientPitchModal from './components/ClientPitchModal';
import TechLeadModal from './components/TechLeadModal';
import { Wind, Shield, Database, ExternalLink } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState('day-ahead');
  const [gateClosureTime, setGateClosureTime] = useState('11:00');
  const [showPitchModal, setShowPitchModal] = useState(false);
  const [showTechModal, setShowTechModal] = useState(false);

  return (
    <div className="app-container">
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        gateClosureTime={gateClosureTime}
        setGateClosureTime={setGateClosureTime}
        onOpenPitch={() => setShowPitchModal(true)}
        onOpenTech={() => setShowTechModal(true)}
      />

      <main className="main-content">
        {activeTab === 'day-ahead' && (
          <DayAheadView gateClosureTime={gateClosureTime} />
        )}

        {activeTab === 'metrics' && (
          <QuantitativeMetricsView gateClosureTime={gateClosureTime} />
        )}

        {activeTab === 'evolution' && (
          <ForecastEvolutionView />
        )}

        {activeTab === 'procurement' && (
          <ProcurementSimulatorView gateClosureTime={gateClosureTime} />
        )}

        {activeTab === 'explorer' && (
          <DataExplorerView gateClosureTime={gateClosureTime} />
        )}
      </main>

      {/* Footer */}
      <footer style={{
        borderTop: '1px solid var(--border-card)',
        background: 'rgba(11, 16, 27, 0.98)',
        padding: '24px 28px',
        marginTop: 'auto',
        fontSize: '0.82rem',
        color: 'var(--text-secondary)'
      }}>
        <div style={{
          maxWidth: 1560,
          margin: '0 auto',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 16
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#10b981', boxShadow: '0 0 8px #10b981' }}></div>
            <span>UK National Wind Power Procurement Desk • January 2026 Scope</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
            <a
              href="https://bmrs.elexon.co.uk"
              target="_blank"
              rel="noreferrer"
              style={{ color: 'var(--text-muted)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4 }}
            >
              Elexon BMRS Source <ExternalLink size={12} />
            </a>
            <span style={{ color: 'var(--text-muted)' }}>React + Python + Docker</span>
            <span className="pill pill-slate" style={{ fontSize: '0.72rem' }}>v1.0.0 Enterprise</span>
          </div>
        </div>
      </footer>

      {/* Modals */}
      {showPitchModal && (
        <ClientPitchModal onClose={() => setShowPitchModal(false)} />
      )}

      {showTechModal && (
        <TechLeadModal onClose={() => setShowTechModal(false)} />
      )}
    </div>
  );
}
