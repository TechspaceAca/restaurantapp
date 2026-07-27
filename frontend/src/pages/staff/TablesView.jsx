import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { tableApi } from '../../api';
import useStore from '../../store/useStore';
import toast from 'react-hot-toast';

const STATUS_COLORS = {
  available: { bg: 'rgba(34,197,94,0.1)', border: 'rgba(34,197,94,0.35)', num: '#22c55e', badge: 'badge-success' },
  occupied:  { bg: 'rgba(239,68,68,0.08)', border: 'rgba(239,68,68,0.4)', num: '#ef4444', badge: 'badge-danger' },
  reserved:  { bg: 'rgba(245,158,11,0.08)', border: 'rgba(245,158,11,0.35)', num: '#f59e0b', badge: 'badge-warning' },
  cleaning:  { bg: 'rgba(59,130,246,0.08)', border: 'rgba(59,130,246,0.3)', num: '#3b82f6', badge: 'badge-info' },
};

const SECTION_ICONS = { indoor: '🏠', outdoor: '🌳', terrace: '🌅', private: '🔒' };

export default function TablesView() {
  const [tables, setTables] = useState([]);
  const [loading, setLoading] = useState(true);
  const [section, setSection] = useState('all');
  const { setSelectedTable, clearCart } = useStore();
  const navigate = useNavigate();

  useEffect(() => {
    fetchTables();
    const interval = setInterval(fetchTables, 10000); // auto-refresh every 10s
    return () => clearInterval(interval);
  }, []);

  const fetchTables = async () => {
    try {
      const res = await tableApi.getTables();
      setTables(res.data);
    } catch { toast.error('Failed to load tables'); }
    finally { setLoading(false); }
  };

  const handleTableClick = (table) => {
    setSelectedTable(table);
    clearCart();
    navigate('/pos/order');
  };

  const sections = ['all', ...new Set(tables.map(t => t.section))];
  const filtered = section === 'all' ? tables : tables.filter(t => t.section === section);

  const counts = {
    available: tables.filter(t => t.status === 'available').length,
    occupied: tables.filter(t => t.status === 'occupied').length,
  };

  return (
    <div className="page-content fade-in">
      <div className="page-header">
        <div>
          <div className="page-title">🪑 Dining Tables</div>
          <div className="page-subtitle">
            <span style={{ color: 'var(--success)' }}>{counts.available} available</span>
            {' · '}
            <span style={{ color: 'var(--danger)' }}>{counts.occupied} occupied</span>
            {' · '}
            {tables.length} total
          </div>
        </div>
        <button className="btn btn-secondary btn-sm" onClick={fetchTables}>↻ Refresh</button>
      </div>

      {/* Section Filter */}
      <div className="category-tabs mb-4">
        {sections.map(s => (
          <button key={s} className={`cat-tab ${section === s ? 'active' : ''}`} onClick={() => setSection(s)}>
            {s === 'all' ? '🪑 All' : `${SECTION_ICONS[s] || ''} ${s.charAt(0).toUpperCase() + s.slice(1)}`}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="loading-screen"><div className="spinner" /><p>Loading tables...</p></div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 14 }}>
          {filtered.map(table => {
            const style = STATUS_COLORS[table.status] || STATUS_COLORS.available;
            return (
              <div
                key={table.id}
                onClick={() => handleTableClick(table)}
                style={{
                  background: style.bg,
                  border: `2px solid ${style.border}`,
                  borderRadius: 'var(--radius-lg)',
                  padding: '18px 16px',
                  cursor: 'pointer',
                  textAlign: 'center',
                  transition: 'all var(--transition)',
                  userSelect: 'none',
                }}
                onMouseOver={e => e.currentTarget.style.transform = 'translateY(-3px)'}
                onMouseOut={e => e.currentTarget.style.transform = 'translateY(0)'}
              >
                <div style={{ fontSize: 36, fontWeight: 900, color: style.num, lineHeight: 1.2 }}>
                  {table.number}
                </div>
                <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--text)', marginTop: 6 }}>{table.name}</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                  {SECTION_ICONS[table.section]} {table.capacity} seats
                </div>
                <div style={{ marginTop: 10 }}>
                  <span className={`badge ${style.badge}`}>
                    {table.status.charAt(0).toUpperCase() + table.status.slice(1)}
                  </span>
                </div>
                {table.active_order_id && (
                  <div style={{ fontSize: 10, color: 'var(--warning)', marginTop: 6, fontWeight: 600 }}>
                    🔥 Order #{table.active_order_id}
                  </div>
                )}
              </div>
            );
          })}
          {filtered.length === 0 && (
            <div style={{ gridColumn: '1/-1' }}>
              <div className="card">
                <div className="empty-state">
                  <div className="empty-state-icon">🪑</div>
                  <div className="empty-state-title">No tables in this section</div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
