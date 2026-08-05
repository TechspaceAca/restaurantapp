import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { orderApi } from '../api';
import toast from 'react-hot-toast';
import { RESTAURANT_INFO } from '../utils/config';

export default function AdminBillModal({ table, onClose }) {
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const res = await orderApi.getActiveTableOrder(table.id);
        setOrder(res.data);
      } catch (e) {
        toast.error('Failed to load active bill for this table');
        onClose();
      } finally {
        setLoading(false);
      }
    };
    fetchOrder();
  }, [table.id, onClose]);

  if (loading) {
    return (
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal" style={{ maxWidth: 360, textAlign: 'center', padding: '40px' }} onClick={e => e.stopPropagation()}>
          <div className="spinner" />
          <p style={{ marginTop: 10 }}>Loading Bill...</p>
        </div>
      </div>
    );
  }

  if (!order) return null;

  const subtotal = Number(order.subtotal);
  const tax = subtotal * 0.05; // 5% default GST
  const total = subtotal + tax;
  const now = new Date();

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" style={{ maxWidth: 360, padding: 0 }} onClick={e => e.stopPropagation()}>
        <div className="modal-header" style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)' }}>
          <div className="modal-title">Table {table.number} - Bill Preview</div>
          <button className="modal-close" onClick={onClose}><X size={18} /></button>
        </div>
        
        <div style={{ padding: '24px', background: '#fff', color: '#000', fontFamily: 'monospace', maxHeight: '70vh', overflowY: 'auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 16 }}>
            <div style={{ fontSize: 18, fontWeight: 900, letterSpacing: 1 }}>{RESTAURANT_INFO.name}</div>
            <div style={{ fontSize: 10, marginTop: 2 }}>{RESTAURANT_INFO.tagline}</div>
            <div style={{ fontSize: 10, marginTop: 2 }}>{RESTAURANT_INFO.address}</div>
            <div style={{ fontSize: 10 }}>Ph: {RESTAURANT_INFO.phone}</div>
            <div style={{ fontSize: 10, fontWeight: 700 }}>GSTIN: {RESTAURANT_INFO.gstin}</div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, padding: '3px 0' }}>
            <span>Date:</span>
            <span>{now.toLocaleDateString('en-IN')} {now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, padding: '3px 0' }}>
            <span>Type/Table:</span>
            <span>{order.table_name || `Table ${table.number}`}</span>
          </div>
          {order.customer_name && (
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, padding: '3px 0' }}>
              <span>Customer:</span>
              <span>{order.customer_name}</span>
            </div>
          )}
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, padding: '3px 0' }}>
            <span>Order #:</span>
            <span>{order.id}</span>
          </div>

          <div style={{ borderTop: '1px dashed #999', margin: '8px 0' }} />

          {order.items.map(item => (
            <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, padding: '3px 0' }}>
              <span>{item.quantity}× {item.menu_item_name}</span>
              <span>₹{(item.quantity * item.unit_price).toFixed(0)}</span>
            </div>
          ))}

          <div style={{ borderTop: '1px dashed #999', margin: '8px 0' }} />

          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, padding: '3px 0' }}>
            <span>Subtotal:</span>
            <span>₹{subtotal.toFixed(2)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, padding: '3px 0' }}>
            <span>GST (5%):</span>
            <span>₹{tax.toFixed(2)}</span>
          </div>

          <div style={{ borderTop: '2px solid #000', borderBottom: '2px solid #000', padding: '4px 0', margin: '6px 0', display: 'flex', justifyContent: 'space-between', fontSize: 15, fontWeight: 'bold' }}>
            <span>TOTAL:</span>
            <span>₹{total.toFixed(2)}</span>
          </div>

          <div style={{ textAlign: 'center', fontSize: 10, marginTop: 12, borderTop: '1px dashed #000', paddingTop: 8 }}>
            {RESTAURANT_INFO.footer}
          </div>
        </div>
      </div>
    </div>
  );
}
