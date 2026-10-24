import React, { useState, useEffect } from 'react';
import { Database, Download, Search, ExternalLink, Filter, FileText } from 'lucide-react';
import { fetchDayAheadForecasts } from '../services/api';

export default function DataExplorerView({ gateClosureTime }) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');

  useEffect(() => {
    let active = true;
    setLoading(true);
    fetchDayAheadForecasts({
      startDate: '2026-01-01',
      endDate: '2026-01-31',
      gateClosureTime,
      resolution: 'hourly'
    }).then(res => {
      if (active) {
        setData(res || []);
        setLoading(false);
      }
    });
    return () => { active = false; };
  }, [gateClosureTime]);

  const filtered = data.filter(d => {
    if (searchTerm && !d.startTime.includes(searchTerm) && !d.date.includes(searchTerm)) {
      return false;
    }
    if (filterType === 'over' && d.errorMW <= 0) return false;
    if (filterType === 'under' && d.errorMW >= 0) return false;
    if (filterType === 'high_error' && d.absErrorMW < 2500) return false;
    return true;
  });

  const downloadCSV = () => {
    if (!data.length) return;
    const headers = ['startTime', 'date', 'hour', 'actualWindMW', 'forecastWindMW', 'errorMW', 'absErrorMW', 'pctError', 'publishTime'];
    const csvContent = [
      headers.join(','),
      ...data.map(row => headers.map(h => row[h] !== undefined ? row[h] : '').join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `gridbricks_wind_dayahead_jan2026_${gateClosureTime.replace(':', '')}gate.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fade-in">
      {/* Header & Export Bar */}
      <div className="glass-card" style={{ marginBottom: 24, padding: '20px 24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <div className="card-title">
              <Database size={20} color="var(--wind-cyan)" />
              <span>National Wind Actuals & Forecast Data Audit Trail</span>
            </div>
            <div className="card-subtitle">
              Verified dataset: 744 matched hourly intervals across all 31 delivery days of January 2026
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button onClick={downloadCSV} className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Download size={16} />
              <span>Export CSV ({data.length} records)</span>
            </button>
          </div>
        </div>

        {/* Search & Filters */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 18, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#0f172a', padding: '6px 12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-card)', minWidth: 260 }}>
            <Search size={16} color="var(--text-muted)" />
            <input
              type="text"
              placeholder="Search date (e.g. 2026-01-15)..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ background: 'transparent', border: 'none', padding: 0, width: '100%' }}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Filter size={16} color="var(--text-muted)" />
            <button
              onClick={() => setFilterType('all')}
              className="btn-secondary"
              style={{
                fontSize: '0.78rem',
                borderColor: filterType === 'all' ? 'var(--wind-cyan)' : undefined,
                color: filterType === 'all' ? '#38bdf8' : undefined
              }}
            >
              All ({data.length})
            </button>
            <button
              onClick={() => setFilterType('over')}
              className="btn-secondary"
              style={{
                fontSize: '0.78rem',
                borderColor: filterType === 'over' ? '#f43f5e' : undefined,
                color: filterType === 'over' ? '#fb7185' : undefined
              }}
            >
              Over-Forecast Shortfalls
            </button>
            <button
              onClick={() => setFilterType('under')}
              className="btn-secondary"
              style={{
                fontSize: '0.78rem',
                borderColor: filterType === 'under' ? '#10b981' : undefined,
                color: filterType === 'under' ? '#34d399' : undefined
              }}
            >
              Under-Forecasts
            </button>
            <button
              onClick={() => setFilterType('high_error')}
              className="btn-secondary"
              style={{
                fontSize: '0.78rem',
                borderColor: filterType === 'high_error' ? '#f59e0b' : undefined,
                color: filterType === 'high_error' ? '#fbbf24' : undefined
              }}
            >
              High Error &gt; 2.5 GW
            </button>
          </div>
        </div>
      </div>

      {/* Official Data Source References */}
      <div className="glass-card" style={{ marginBottom: 24, padding: '16px 20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <FileText size={18} color="var(--forecast-violet)" />
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              Source Datasets: <strong>Elexon BMRS Insights Solution</strong>
            </span>
          </div>

          <div style={{ display: 'flex', gap: 16, fontSize: '0.8rem' }}>
            <a
              href="https://bmrs.elexon.co.uk/api-documentation/endpoint/datasets/FUELHH/stream"
              target="_blank"
              rel="noreferrer"
              style={{ color: '#38bdf8', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4 }}
            >
              FUELHH Endpoint Docs <ExternalLink size={12} />
            </a>
            <a
              href="https://bmrs.elexon.co.uk/api-documentation/endpoint/datasets/WINDFOR/stream"
              target="_blank"
              rel="noreferrer"
              style={{ color: '#38bdf8', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4 }}
            >
              WINDFOR Endpoint Docs <ExternalLink size={12} />
            </a>
          </div>
        </div>
      </div>

      {/* Data Table */}
      <div className="glass-card">
        <div className="data-table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Start Time (GMT)</th>
                <th>Delivery Date</th>
                <th>Hour</th>
                <th>Actual Wind (MW)</th>
                <th>Day-Ahead Forecast (MW)</th>
                <th>Error (MW)</th>
                <th>Abs Error (MW)</th>
                <th>% Error</th>
                <th>Gate Publish Time (D-1)</th>
              </tr>
            </thead>
            <tbody>
              {filtered.slice(0, 100).map((row, idx) => {
                const isOver = row.errorMW > 0;
                return (
                  <tr key={idx}>
                    <td className="mono" style={{ fontWeight: 600 }}>{row.startTime}</td>
                    <td>{row.date}</td>
                    <td className="mono">{row.hour}:00</td>
                    <td className="mono" style={{ color: '#38bdf8' }}>{row.actualWindMW.toLocaleString()} MW</td>
                    <td className="mono" style={{ color: '#fbbf24' }}>{row.forecastWindMW.toLocaleString()} MW</td>
                    <td className="mono" style={{ color: isOver ? '#fb7185' : '#34d399', fontWeight: 700 }}>
                      {isOver ? `+${row.errorMW.toLocaleString()}` : row.errorMW.toLocaleString()} MW
                    </td>
                    <td className="mono">{row.absErrorMW.toLocaleString()} MW</td>
                    <td className="mono">{row.pctError}%</td>
                    <td className="mono" style={{ color: 'var(--text-muted)' }}>{row.publishTime}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {filtered.length > 100 && (
          <div style={{ textAlign: 'center', padding: '16px 0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            Showing first 100 of {filtered.length} matching records. Use CSV Export for full 744 intervals.
          </div>
        )}
      </div>
    </div>
  );
}
