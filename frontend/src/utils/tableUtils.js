export const ENRICHED_STATUS_INFO = {
  available:      { label: 'AVAILABLE',      color: '#22c55e', dark: '#166534', border: '#22c55e', bg: '#f0fdf4', badge: 'badge-success' },
  occupied:       { label: 'SEATED',         color: '#64748b', dark: '#334155', border: '#64748b', bg: '#f8fafc', badge: 'badge-secondary' },
  placed:         { label: 'ORDER PLACED',   color: '#eab308', dark: '#854d0e', border: '#eab308', bg: '#fefce8', badge: 'badge-warning' },
  bill_requested: { label: 'BILL REQUESTED', color: '#8b5cf6', dark: '#4c1d95', border: '#8b5cf6', bg: '#f5f3ff', badge: 'badge-info' },
  reserved:       { label: 'RESERVED',       color: '#3b82f6', dark: '#1e3a8a', border: '#3b82f6', bg: '#eff6ff', badge: 'badge-info' },
  kitchen:        { label: 'IN KITCHEN',     color: '#f97316', dark: '#9a3412', border: '#f97316', bg: '#fff7ed', badge: 'badge-warning' },
  ready:          { label: 'READY TO SERVE', color: '#f43f5e', dark: '#881337', border: '#f43f5e', bg: '#fff1f2', badge: 'badge-danger' },
  served:         { label: 'FOOD SERVED',    color: '#0ea5e9', dark: '#075985', border: '#0ea5e9', bg: '#f0f9ff', badge: 'badge-info' },
};

export function getEnrichedTableStatus(table, liveOrders = []) {
  if (table.status === 'bill_requested') return 'bill_requested';
  if (table.status === 'reserved') return 'reserved';

  const tableOrders = liveOrders.filter(
    o => o.table === table.id || String(o.table_number) === String(table.number) || o.table_name === table.name
  );
  
  if (tableOrders.length > 0) {
    if (tableOrders.some(o => o.status === 'ready')) return 'ready';
    if (tableOrders.some(o => ['cooking', 'preparing'].includes(o.status))) return 'kitchen';
    if (tableOrders.some(o => ['pending', 'placed', 'confirmed'].includes(o.status))) return 'placed';
    if (tableOrders.some(o => o.status === 'served')) return 'served';
    return 'occupied';
  }
  
  return table.status || 'available';
}
