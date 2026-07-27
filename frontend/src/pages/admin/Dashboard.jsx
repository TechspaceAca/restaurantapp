import { useState, useEffect } from 'react';
import { analyticsApi } from '../../api';
import toast from 'react-hot-toast';

function StatCard({ icon, label, value, color, sub }) {
  return (
    <div className="stat-card">
      <div className="stat-card-icon" style={{ background: color + '22' }}>
        {icon}
      </div>
      <div className="stat-card-value">{value}</div>
      <div className="stat-card-label">{label}</div>
      {sub && <div className="stat-card-change up">{sub}</div>}
    </div>
  );
}

function RevenueBar({ data }) {
  if (!data || data.length === 0) return null;
  const max = Math.max(...data.map(d => d.revenue), 1);
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height: 120, padding: '0 8px' }}>
      {data.slice(-14).map((d, i) => (
        <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
          <div
            title={`₹${d.revenue.toFixed(0)}`}
            style={{
              width: '100%', minHeight: 4,
              height: `${Math.max((d.revenue / max) * 100, 4)}%`,
              background: 'linear-gradient(to top, var(--primary), var(--primary-dark))',
              borderRadius: '4px 4px 0 0',
              transition: 'height 0.5s ease',
              opacity: i === data.slice(-14).length - 1 ? 1 : 0.7,
              cursor: 'pointer',
            }}
          />
          <span style={{ fontSize: 9, color: 'var(--text-dim)', whiteSpace: 'nowrap' }}>
            {new Date(d.date).getDate()}
          </span>
        </div>
      ))}
    </div>
  );
}

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [chart, setChart] = useState([]);
  const [topItems, setTopItems] = useState([]);
  const [orderTypes, setOrderTypes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAll();
    const interval = setInterval(fetchAll, 30000); // refresh every 30s
    return () => clearInterval(interval);
  }, []);

  const fetchAll = async () => {
    try {
      const [s, c, t, ot] = await Promise.all([
        analyticsApi.getDashboard(),
        analyticsApi.getRevenueChart('daily'),
        analyticsApi.getTopItems(),
        analyticsApi.getOrderTypes(),
      ]);
      setStats(s.data);
      setChart(c.data);
      setTopItems(t.data);
      setOrderTypes(ot.data);
    } catch {
      toast.error('Failed to load analytics');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return (
    <div className="loading-screen">
      <div className="spinner" />
      <p>Loading analytics...</p>
    </div>
  );

  return (
    <div className="fade-in">
      <div className="page-header">
        <div>
          <div className="page-title">📊 Owner Analytics</div>
          <div className="page-subtitle">Real-time restaurant performance overview</div>
        </div>
        <button className="btn btn-secondary btn-sm" onClick={fetchAll}>↻ Refresh</button>
      </div>

      {/* KPI Cards */}
      <div className="grid-4 mb-4">
        <StatCard icon="💰" label="Today's Revenue" value={`₹${stats?.today_revenue?.toFixed(0) || 0}`} color="#f97316" sub="Today" />
        <StatCard icon="🛒" label="Orders Today" value={stats?.today_orders || 0} color="#22c55e" />
        <StatCard icon="🔥" label="Active Orders" value={stats?.active_orders || 0} color="#ef4444" />
        <StatCard icon="📈" label="Avg Order Value" value={`₹${stats?.avg_order_value || 0}`} color="#8b5cf6" />
      </div>

      <div className="grid-2" style={{ gap: 16, marginBottom: 16 }}>
        {/* Revenue Chart */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
            <div>
              <div style={{ fontWeight: 800, fontSize: 15 }}>Revenue Trend</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Last 14 days</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--primary)' }}>
                ₹{stats?.week_revenue?.toFixed(0) || 0}
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>This week</div>
            </div>
          </div>
          {chart.length > 0 ? (
            <RevenueBar data={chart} />
          ) : (
            <div className="empty-state" style={{ padding: '30px 0' }}>
              <div className="empty-state-icon">📊</div>
              <div className="empty-state-text">No revenue data yet. Start taking orders!</div>
            </div>
          )}
        </div>

        {/* Order Type Breakdown */}
        <div className="card">
          <div style={{ fontWeight: 800, fontSize: 15, marginBottom: 16 }}>Order Type Split</div>
          {orderTypes.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {orderTypes.map(ot => {
                const total = orderTypes.reduce((s, x) => s + x.count, 0);
                const pct = total > 0 ? ((ot.count / total) * 100).toFixed(1) : 0;
                const colors = { dine_in: '#f97316', takeaway: '#22c55e', delivery: '#3b82f6', swiggy: '#f59e0b', zomato: '#ef4444' };
                return (
                  <div key={ot.order_type}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 4 }}>
                      <span style={{ fontWeight: 600, textTransform: 'capitalize' }}>
                        {ot.order_type.replace('_', ' ')}
                      </span>
                      <span style={{ color: 'var(--text-muted)' }}>{ot.count} orders ({pct}%)</span>
                    </div>
                    <div style={{ height: 6, background: 'var(--bg-card2)', borderRadius: 99 }}>
                      <div style={{
                        height: '100%', borderRadius: 99,
                        background: colors[ot.order_type] || 'var(--primary)',
                        width: `${pct}%`, transition: 'width 0.8s ease',
                      }} />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="empty-state" style={{ padding: '20px 0' }}>
              <div className="empty-state-icon">📋</div>
              <div className="empty-state-text">No orders yet</div>
            </div>
          )}
        </div>
      </div>

      {/* Top Items */}
      <div className="card">
        <div style={{ fontWeight: 800, fontSize: 15, marginBottom: 16 }}>🏆 Top Selling Items</div>
        {topItems.length > 0 ? (
          <table className="data-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Item Name</th>
                <th>Category</th>
                <th>Qty Sold</th>
                <th>Revenue</th>
              </tr>
            </thead>
            <tbody>
              {topItems.map((item, i) => (
                <tr key={item.id}>
                  <td>
                    <span style={{ fontWeight: 800, color: i < 3 ? 'var(--primary)' : 'var(--text-muted)' }}>
                      {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i + 1}`}
                    </span>
                  </td>
                  <td style={{ fontWeight: 600 }}>{item.name}</td>
                  <td><span className="badge badge-muted">{item.category}</span></td>
                  <td style={{ fontWeight: 700, color: 'var(--primary)' }}>{item.total_qty}</td>
                  <td style={{ fontWeight: 700 }}>₹{item.total_revenue?.toFixed(0)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="empty-state">
            <div className="empty-state-icon">🍽️</div>
            <div className="empty-state-text">No billed orders yet. Top items will appear here.</div>
          </div>
        )}
      </div>
    </div>
  );
}
