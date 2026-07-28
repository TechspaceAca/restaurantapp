import { useState, useEffect, useCallback, useRef } from 'react';
import { orderApi, billingApi } from '../../api';
import toast from 'react-hot-toast';

/* ─── Constants ─────────────────────────────────────────────── */
const STATUS_LABELS = {
  pending: '⏳ Pending', confirmed: '✅ Confirmed', preparing: '🔥 Preparing',
  ready: '🔔 Ready', served: '🍽️ Served', billed: '🧾 Billed', cancelled: '❌ Cancelled',
};

const PAYMENT_METHODS = [
  { key: 'cash', label: '💵 Cash Register', icon: '💵' },
  { key: 'gpay', label: '📱 Google Pay (GPay)', icon: '📱' },
  { key: 'card', label: '💳 Credit / Debit Card', icon: '💳' },
  { key: 'upi', label: '📲 UPI / QR Code', icon: '📲' },
  { key: 'split', label: '🔀 Split Payment', icon: '🔀' },
  { key: 'complimentary', label: '🎁 Complimentary', icon: '🎁' },
];

const RESTAURANT_INFO = {
  name: 'T CLOCK RESTO CAFE',
  tagline: 'Time for Tea, Time for Taste',
  address: 'Main Road, Calicut, Kerala',
  phone: '+91 98765 43210',
  gstin: '32ABCDE1234F1Z5',
  footer: 'Thank you for visiting T Clock Resto Cafe! 🌴',
};

/* ─── WhatsApp Send Modal ────────────────────────────────────── */
/* ─── Send Customer Receipt Modal (WhatsApp / Email / SMS / Print) ────── */
function CustomerReceiptModal({ bill, whatsappText, onClose }) {
  const [phone, setPhone] = useState(bill.order_details?.customer_phone || bill.customer_phone || '8547189033');
  const [email, setEmail] = useState('');
  const [method, setMethod] = useState('wa'); // 'wa', 'email', 'sms', 'manual'
  const textRef = useRef(null);

  const getCleanPhone = () => {
    let num = phone.replace(/\D/g, '');
    if (num.startsWith('0')) num = '91' + num.slice(1);
    if (!num.startsWith('91') && num.length === 10) num = '91' + num;
    return num;
  };

  const waUrl = `https://api.whatsapp.com/send?phone=${getCleanPhone()}&text=${encodeURIComponent(whatsappText)}`;

  const sendViaWhatsApp = () => {
    if (!phone.trim()) { toast.error('Enter customer phone number'); return; }
    window.open(waUrl, '_blank');
    toast.success(`Opening WhatsApp for +${getCleanPhone()}! 📱`);
  };

  const sendViaEmail = () => {
    if (!email.trim()) { toast.error('Enter customer email ID'); return; }
    const subject = encodeURIComponent(`Invoice ${bill.bill_number} — T Clock Resto Cafe`);
    const body = encodeURIComponent(whatsappText);
    window.location.href = `mailto:${email.trim()}?subject=${subject}&body=${body}`;
    toast.success('Opening Email Client! ✉️');
  };

  const sendViaSMS = () => {
    if (!phone.trim()) { toast.error('Enter customer phone number'); return; }
    let num = phone.replace(/\D/g, '');
    const url = `sms:${num}?body=${encodeURIComponent(whatsappText)}`;
    window.open(url, '_blank');
    toast.success('Opening Mobile SMS app! 💬');
  };

  const copyText = () => {
    navigator.clipboard.writeText(whatsappText).then(() => toast.success('Receipt text copied! 📋'));
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" style={{ maxWidth: 520, borderRadius: 'var(--radius-lg)' }} onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title" style={{ fontWeight: 900 }}>🧾 Send Digital Invoice to Customer</div>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        {/* Method selector tabs */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6, marginBottom: 16 }}>
          <button
            className={`btn ${method === 'wa' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setMethod('wa')}
            style={{ justifyContent: 'center', fontSize: 11, padding: '8px 4px' }}
          >
            📱 WhatsApp
          </button>
          <button
            className={`btn ${method === 'email' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setMethod('email')}
            style={{ justifyContent: 'center', fontSize: 11, padding: '8px 4px' }}
          >
            ✉️ Email
          </button>
          <button
            className={`btn ${method === 'sms' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setMethod('sms')}
            style={{ justifyContent: 'center', fontSize: 11, padding: '8px 4px' }}
          >
            💬 SMS
          </button>
          <button
            className={`btn ${method === 'manual' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setMethod('manual')}
            style={{ justifyContent: 'center', fontSize: 11, padding: '8px 4px' }}
          >
            📋 Copy
          </button>
        </div>

        {method === 'wa' && (
          <>
            <div className="form-group" style={{ marginBottom: 12 }}>
              <label className="form-label" style={{ fontWeight: 700 }}>Customer Mobile / WhatsApp Number</label>
              <div style={{ display: 'flex', gap: 8 }}>
                <span style={{
                  display: 'flex', alignItems: 'center', padding: '0 12px',
                  background: 'var(--bg-card2)', border: '1px solid var(--surface-border)',
                  borderRadius: 'var(--radius-sm)', fontSize: 14, fontWeight: 700, color: 'var(--text-muted)',
                }}>+91</span>
                <input
                  className="form-input"
                  style={{ flex: 1 }}
                  type="tel"
                  maxLength={10}
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  placeholder="9876543210"
                  autoFocus
                />
              </div>
            </div>

            <div style={{
              background: '#128C7E', borderRadius: 'var(--radius-sm)', padding: '12px 14px',
              marginBottom: 16, fontFamily: 'sans-serif', fontSize: 11,
              color: '#fff', whiteSpace: 'pre-wrap', maxHeight: 180, overflowY: 'auto', lineHeight: 1.5
            }}>
              {whatsappText}
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <button className="btn btn-secondary flex-1" onClick={handlePrint} style={{ justifyContent: 'center' }}>
                🖨️ Print Receipt
              </button>
              <a
                href={waUrl}
                target="_blank"
                rel="noreferrer"
                className="btn btn-primary flex-1"
                style={{ justifyContent: 'center', background: '#25D366', borderColor: '#25D366', color: '#fff', fontWeight: 800, textDecoration: 'none' }}
                onClick={() => toast.success(`Opening WhatsApp for +${getCleanPhone()}! 📱`)}
              >
                📲 Open WhatsApp & Send
              </a>
            </div>
          </>
        )}

        {method === 'email' && (
          <>
            <div className="form-group" style={{ marginBottom: 12 }}>
              <label className="form-label" style={{ fontWeight: 700 }}>Customer Email Address</label>
              <input
                className="form-input"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="customer@example.com"
                autoFocus
              />
            </div>

            <div style={{
              background: 'var(--bg-card2)', borderRadius: 'var(--radius-sm)', padding: '12px 14px',
              marginBottom: 16, fontSize: 11, color: 'var(--text)', whiteSpace: 'pre-wrap', maxHeight: 180, overflowY: 'auto'
            }}>
              {whatsappText}
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <button className="btn btn-secondary flex-1" onClick={handlePrint} style={{ justifyContent: 'center' }}>
                🖨️ Print Receipt
              </button>
              <button
                className="btn btn-primary flex-1"
                style={{ justifyContent: 'center', fontWeight: 800 }}
                onClick={sendViaEmail}
              >
                ✉️ Send Email Receipt
              </button>
            </div>
          </>
        )}

        {method === 'sms' && (
          <>
            <div className="form-group" style={{ marginBottom: 12 }}>
              <label className="form-label" style={{ fontWeight: 700 }}>Customer Phone Number (SMS)</label>
              <input
                className="form-input"
                type="tel"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                placeholder="9876543210"
                autoFocus
              />
            </div>

            <button
              className="btn btn-primary"
              style={{ width: '100%', justifyContent: 'center', fontWeight: 800 }}
              onClick={sendViaSMS}
            >
              💬 Send SMS Receipt
            </button>
          </>
        )}

        {method === 'manual' && (
          <>
            <label className="form-label">Bill Receipt Text</label>
            <textarea
              ref={textRef}
              className="form-textarea"
              style={{ fontFamily: 'monospace', fontSize: 12, minHeight: 200, marginBottom: 12 }}
              value={whatsappText}
              readOnly
              onClick={e => e.target.select()}
            />
            <div style={{ display: 'flex', gap: 10 }}>
              <button className="btn btn-secondary flex-1" onClick={handlePrint} style={{ justifyContent: 'center' }}>
                🖨️ Print
              </button>
              <button className="btn btn-primary flex-1" style={{ justifyContent: 'center' }} onClick={copyText}>
                📋 Copy Text
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

/* ─── Thermal Receipt Preview ────────────────────────────────── */
function ReceiptPreview({ order, includeGst, taxPercent, discountAmount, discountReason }) {
  const subtotal = Number(order.subtotal);
  const tax = includeGst ? (subtotal * taxPercent) / 100 : 0;
  const discount = Number(discountAmount) || 0;
  const total = subtotal + tax - discount;
  const now = new Date();

  return (
    <div className="receipt-paper">
      <div className="receipt-header">
        <div style={{ fontSize: 18, fontWeight: 900, letterSpacing: 1 }}>{RESTAURANT_INFO.name}</div>
        <div style={{ fontSize: 10, marginTop: 2 }}>{RESTAURANT_INFO.tagline}</div>
        <div style={{ fontSize: 10, marginTop: 2 }}>{RESTAURANT_INFO.address}</div>
        <div style={{ fontSize: 10 }}>Ph: {RESTAURANT_INFO.phone}</div>
        <div style={{ fontSize: 10, fontWeight: 700 }}>GSTIN: {RESTAURANT_INFO.gstin}</div>
      </div>

      <div className="receipt-row">
        <span>Date:</span>
        <span>{now.toLocaleDateString('en-IN')} {now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</span>
      </div>
      <div className="receipt-row">
        <span>Type/Table:</span>
        <span>{order.order_type === 'swiggy' ? '🟠 Swiggy' : order.order_type === 'zomato' ? '🔴 Zomato' : (order.table_name || order.table_number || 'Takeaway')}</span>
      </div>
      {order.customer_name && (
        <div className="receipt-row">
          <span>Customer:</span>
          <span>{order.customer_name}</span>
        </div>
      )}
      <div className="receipt-row">
        <span>Order #:</span>
        <span>{order.id}</span>
      </div>

      <div className="receipt-divider" />

      {/* Items */}
      {order.items.map(item => (
        <div key={item.id} className="receipt-row">
          <span>{item.quantity}× {item.menu_item_name}</span>
          <span>₹{(item.quantity * item.unit_price).toFixed(0)}</span>
        </div>
      ))}

      <div className="receipt-divider" />

      <div className="receipt-row">
        <span>Subtotal:</span>
        <span>₹{subtotal.toFixed(2)}</span>
      </div>
      {includeGst ? (
        <div className="receipt-row">
          <span>GST ({taxPercent}%):</span>
          <span>₹{tax.toFixed(2)}</span>
        </div>
      ) : (
        <div className="receipt-row" style={{ fontStyle: 'italic', opacity: 0.8 }}>
          <span>GST:</span>
          <span>Excluded (No Tax)</span>
        </div>
      )}
      {discount > 0 && (
        <div className="receipt-row">
          <span>Discount{discountReason ? ` (${discountReason})` : ''}:</span>
          <span>-₹{discount.toFixed(2)}</span>
        </div>
      )}

      <div className="receipt-total receipt-row">
        <span>TOTAL:</span>
        <span>₹{total.toFixed(2)}</span>
      </div>

      {RESTAURANT_INFO.footer && (
        <div style={{ textAlign: 'center', fontSize: 10, marginTop: 12, borderTop: '1px dashed #000', paddingTop: 8 }}>
          {RESTAURANT_INFO.footer}
        </div>
      )}
    </div>
  );
}

/* ─── Settle Payment Panel ───────────────────────────────────── */
function SettlePanel({ order, onBilled, onFormChange, currentForm }) {
  const [form, setForm] = useState({
    include_gst: true,
    tax_percent: 5,
    discount_amount: 0,
    discount_reason: '',
    payment_method: 'gpay',
    customer_phone: order.customer_phone || '8547189033',
    customer_name: order.customer_name || 'Guest',
    notes: '',
  });
  const [billing, setBilling] = useState(false);
  const [billResult, setBillResult] = useState(null);
  const [waModal, setWaModal] = useState(false);

  // Sync form state up to parent for live receipt preview
  useEffect(() => {
    if (onFormChange) onFormChange(form);
  }, [form, onFormChange]);

  const subtotal = Number(order.subtotal);
  const tax = form.include_gst ? (subtotal * form.tax_percent) / 100 : 0;
  const discount = Number(form.discount_amount) || 0;
  const total = subtotal + tax - discount;

  const handleGenerateBill = async () => {
    setBilling(true);
    try {
      const res = await billingApi.generateBill({
        order_id: order.id,
        include_gst: form.include_gst,
        tax_percent: form.include_gst ? form.tax_percent : 0,
        discount_amount: form.discount_amount,
        discount_reason: form.discount_reason,
        payment_method: form.payment_method,
        notes: form.notes,
      });
      setBillResult(res.data);
      toast.success('🧾 Bill generated! Table is now free.');
      onBilled();
      return res.data;
    } catch (e) {
      const errData = e.response?.data;
      let msg = 'Failed to generate bill';
      if (typeof errData === 'string') {
        msg = errData;
      } else if (errData?.error) {
        msg = errData.error;
      } else if (errData?.detail) {
        msg = errData.detail;
      } else if (errData && typeof errData === 'object') {
        const firstKey = Object.keys(errData)[0];
        const val = errData[firstKey];
        msg = Array.isArray(val) ? `${firstKey}: ${val[0]}` : `${firstKey}: ${val}`;
      }
      toast.error(msg);
      return null;
    } finally {
      setBilling(false);
    }
  };

  const handleGenerateAndPrintAndSend = async () => {
    const generatedBill = await handleGenerateBill();
    if (generatedBill) {
      // 1. Immediately open WhatsApp Web/App with pre-filled bill text
      let phone = form.customer_phone || order.customer_phone || '8547189033';
      let num = phone.replace(/\D/g, '');
      if (num.startsWith('0')) num = '91' + num.slice(1);
      if (!num.startsWith('91') && num.length === 10) num = '91' + num;

      const waText = generatedBill.whatsapp_text;
      if (waText) {
        const waUrl = `https://api.whatsapp.com/send?phone=${num}&text=${encodeURIComponent(waText)}`;
        window.open(waUrl, '_blank');
        toast.success(`Opening WhatsApp for +${num}! 📱`);
      }

      setWaModal(true);

      // 2. Launch thermal receipt print window after short delay so print dialog doesn't freeze browser JS
      setTimeout(() => {
        handlePrint();
      }, 300);
    }
  };

  const handlePrint = () => {
    const win = window.open('', '_blank', 'width=420,height=640');
    const now = new Date();
    win.document.write(`
      <html><head><title>Bill — ${order.table_name || 'T Clock'}</title>
      <style>
        body { font-family: 'Courier New', monospace; padding: 20px; font-size: 13px; background:#fff; color:#000; }
        h2 { text-align: center; margin: 0; font-size:16px; }
        p  { text-align: center; font-size:11px; margin:2px 0; }
        .row { display: flex; justify-content: space-between; padding: 3px 0; font-size:12px; }
        .total { border-top: 2px solid #000; border-bottom:2px solid #000; font-weight:bold; font-size:15px; padding:4px 0; margin:6px 0; }
        .dashed { border-top: 1px dashed #999; margin: 8px 0; }
        .center { text-align: center; }
      </style></head><body>
      <h2>${RESTAURANT_INFO.name}</h2>
      <p>${RESTAURANT_INFO.tagline}</p>
      <p>${RESTAURANT_INFO.address}</p>
      <p>Ph: ${RESTAURANT_INFO.phone}</p>
      <p>GSTIN: ${RESTAURANT_INFO.gstin}</p>
      <div class="dashed"></div>
      <div class="row"><span>Date:</span><span>${now.toLocaleDateString('en-IN')} ${now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</span></div>
      <div class="row"><span>Customer:</span><span>${form.customer_name || order.customer_name || 'Guest'}</span></div>
      ${form.customer_phone ? `<div class="row"><span>Phone:</span><span>${form.customer_phone}</span></div>` : ''}
      <div class="row"><span>Type/Table:</span><span>${order.order_type === 'swiggy' ? 'Swiggy' : order.order_type === 'zomato' ? 'Zomato' : (order.table_name || 'Takeaway')}</span></div>
      <div class="row"><span>Order #:</span><span>${order.id}</span></div>
      ${billResult ? `<div class="row"><span>Bill No:</span><span>${billResult.bill_number}</span></div>` : ''}
      <div class="dashed"></div>
      ${order.items.map(i => `<div class="row"><span>${i.quantity}× ${i.menu_item_name}</span><span>₹${(i.quantity * i.unit_price).toFixed(0)}</span></div>`).join('')}
      <div class="dashed"></div>
      <div class="row"><span>Subtotal:</span><span>₹${subtotal.toFixed(2)}</span></div>
      ${form.include_gst ? `<div class="row"><span>GST (${form.tax_percent}%):</span><span>₹${tax.toFixed(2)}</span></div>` : `<div class="row"><span>GST:</span><span>Excluded</span></div>`}
      ${discount > 0 ? `<div class="row"><span>Discount:</span><span>-₹${discount.toFixed(2)}</span></div>` : ''}
      <div class="row total"><span>TOTAL:</span><span>₹${total.toFixed(2)}</span></div>
      <div class="dashed"></div>
      <p style="font-weight:700;">Payment: ${form.payment_method.toUpperCase()}</p>
      <p style="margin-top:12px;">${RESTAURANT_INFO.footer}</p>
      </body></html>
    `);
    win.print();
    win.close();
  };

  return (
    <div className="card" style={{ position: 'sticky', top: 80 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div style={{ fontWeight: 800, fontSize: 15 }}>
          {order.order_type === 'swiggy' ? '🟠 Swiggy Order' : order.order_type === 'zomato' ? '🔴 Zomato Order' : (order.table_name || 'Takeaway')} — #{order.id}
        </div>
        <span className={`badge status-${order.status}`}>{STATUS_LABELS[order.status]}</span>
      </div>

      {/* If bill already generated — show post-bill actions */}
      {billResult ? (
        <div>
          <div style={{
            background: 'rgba(34,197,94,0.10)', border: '1px solid rgba(34,197,94,0.25)',
            borderRadius: 'var(--radius)', padding: '14px 16px', marginBottom: 16, textAlign: 'center',
          }}>
            <div style={{ fontSize: 24, marginBottom: 6 }}>✅</div>
            <div style={{ fontWeight: 800, fontSize: 16, color: 'var(--success)' }}>Bill Generated!</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
              {billResult.bill_number} · ₹{Number(billResult.total).toFixed(2)} · {form.payment_method.toUpperCase()}
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <button
              className="btn"
              style={{ justifyContent: 'center', background: '#25D366', borderColor: '#25D366', color: '#fff', fontWeight: 700 }}
              onClick={() => setWaModal(true)}
            >
              📱 Send Bill on WhatsApp / SMS
            </button>
            <button className="btn btn-secondary" style={{ justifyContent: 'center' }} onClick={handlePrint}>
              🖨️ Print Receipt
            </button>
          </div>
        </div>
      ) : (
        /* Pre-bill: payment form */
        <>
          {/* Customer Phone No & Name Input */}
          <div style={{ background: 'var(--bg-card2)', borderRadius: 'var(--radius-sm)', padding: 12, marginBottom: 14 }}>
            <div style={{ fontSize: 12, fontWeight: 800, marginBottom: 8, color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: 6 }}>
              <span>📱</span> Customer Phone & Receipt Info
            </div>
            <div className="grid-2" style={{ gap: 8 }}>
              <div>
                <label className="form-label" style={{ fontSize: 11 }}>Phone Number</label>
                <input
                  className="form-input"
                  type="tel"
                  maxLength={10}
                  placeholder="e.g. 9876543210"
                  value={form.customer_phone}
                  onChange={e => setForm(f => ({ ...f, customer_phone: e.target.value }))}
                />
              </div>
              <div>
                <label className="form-label" style={{ fontSize: 11 }}>Customer Name</label>
                <input
                  className="form-input"
                  type="text"
                  placeholder="e.g. Rahul"
                  value={form.customer_name}
                  onChange={e => setForm(f => ({ ...f, customer_name: e.target.value }))}
                />
              </div>
            </div>
          </div>

          {/* GST Configuration Toggle */}
          <div style={{ marginBottom: 14 }}>
            <label className="form-label" style={{ fontWeight: 700 }}>GST Configuration Option</label>
            <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
              <button
                type="button"
                className={`btn flex-1 ${form.include_gst ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setForm(f => ({ ...f, include_gst: true }))}
                style={{ justifyContent: 'center', fontSize: 12, padding: '7px 10px' }}
              >
                ✅ Include GST (5%)
              </button>
              <button
                type="button"
                className={`btn flex-1 ${!form.include_gst ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setForm(f => ({ ...f, include_gst: false }))}
                style={{ justifyContent: 'center', fontSize: 12, padding: '7px 10px' }}
              >
                🚫 Exclude GST
              </button>
            </div>
          </div>

          {/* Payment method selection */}
          <div style={{ marginBottom: 16 }}>
            <label className="form-label" style={{ fontWeight: 700 }}>Select Payment Method</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
              {PAYMENT_METHODS.map(pm => (
                <button
                  key={pm.key}
                  onClick={() => setForm(f => ({ ...f, payment_method: pm.key }))}
                  style={{
                    padding: '9px 10px', borderRadius: 'var(--radius-sm)', cursor: 'pointer',
                    fontWeight: 700, fontSize: 12, textAlign: 'left',
                    background: form.payment_method === pm.key ? 'var(--primary)' : 'var(--bg-card2)',
                    color: form.payment_method === pm.key ? '#fff' : 'var(--text)',
                    border: form.payment_method === pm.key ? '2px solid var(--primary)' : '1px solid var(--surface-border)',
                    transition: 'all 0.15s',
                    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                  }}
                >
                  {pm.label}
                </button>
              ))}
            </div>
          </div>

          {/* Tax % & discount */}
          <div className="grid-2" style={{ gap: 10, marginBottom: 12 }}>
            <div className="form-group">
              <label className="form-label">GST %</label>
              <input
                className="form-input"
                type="number"
                min={0}
                max={28}
                disabled={!form.include_gst}
                value={form.include_gst ? form.tax_percent : 0}
                onChange={e => setForm(f => ({ ...f, tax_percent: Number(e.target.value) }))}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Discount (₹)</label>
              <input
                className="form-input"
                type="number"
                min={0}
                value={form.discount_amount}
                onChange={e => setForm(f => ({ ...f, discount_amount: e.target.value }))}
              />
            </div>
          </div>

          {form.discount_amount > 0 && (
            <div className="form-group" style={{ marginBottom: 12 }}>
              <label className="form-label">Discount Reason</label>
              <input
                className="form-input"
                value={form.discount_reason}
                onChange={e => setForm(f => ({ ...f, discount_reason: e.target.value }))}
                placeholder="Staff, loyalty, event…"
              />
            </div>
          )}

          {/* Totals */}
          <div style={{ background: 'var(--bg-card2)', borderRadius: 'var(--radius-sm)', padding: '10px 14px', marginBottom: 16 }}>
            <div className="bill-row"><span>Subtotal</span><span>₹{subtotal.toFixed(2)}</span></div>
            {form.include_gst ? (
              <div className="bill-row"><span>GST ({form.tax_percent}%)</span><span>₹{tax.toFixed(2)}</span></div>
            ) : (
              <div className="bill-row" style={{ opacity: 0.7, fontStyle: 'italic' }}><span>GST</span><span>Excluded (₹0)</span></div>
            )}
            {discount > 0 && (
              <div className="bill-row" style={{ color: 'var(--success)' }}>
                <span>Discount</span><span>−₹{discount.toFixed(2)}</span>
              </div>
            )}
            <div className="bill-total-row"><span>Grand Total</span><span>₹{total.toFixed(2)}</span></div>
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <button
              className="btn btn-primary"
              style={{
                width: '100%', justifyContent: 'center', padding: '12px 14px',
                fontWeight: 800, fontSize: 13, background: 'linear-gradient(135deg, #f97316, #ea580c)',
                boxShadow: '0 4px 14px rgba(249,115,22,0.35)',
              }}
              onClick={handleGenerateAndPrintAndSend}
              disabled={billing}
            >
              {billing ? <><div className="spinner spinner-sm" /> Generating…</> : `🖨️ Print & Send ₹${total.toFixed(0)} Bill to Customer Phone`}
            </button>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn btn-secondary flex-1" style={{ justifyContent: 'center' }} onClick={handlePrint}>🖨️ Print Only</button>
              <button
                className="btn btn-success flex-1"
                style={{ justifyContent: 'center' }}
                onClick={handleGenerateBill}
                disabled={billing}
              >
                ✅ Settle Only
              </button>
            </div>
          </div>
        </>
      )}

      {/* Customer receipt modal */}
      {waModal && billResult && (
        <CustomerReceiptModal
          bill={billResult}
          whatsappText={billResult.whatsapp_text}
          onClose={() => setWaModal(false)}
        />
      )}
    </div>
  );
}

/* ─── Order List Item (left sidebar) ────────────────────────── */
function OrderListItem({ order, isSelected, onSelect }) {
  const isBillReq = order.bill_requested || order.table_status === 'bill_requested';
  const isSwiggy = order.order_type === 'swiggy';
  const isZomato = order.order_type === 'zomato';

  return (
    <button
      onClick={() => onSelect(order)}
      style={{
        width: '100%', textAlign: 'left', padding: '12px 14px', cursor: 'pointer',
        background: isSelected ? 'rgba(249,115,22,0.10)' : 'transparent',
        borderLeft: isSelected
          ? '4px solid var(--primary)'
          : isSwiggy ? '4px solid #f97316'
            : isZomato ? '4px solid #ef4444'
              : '4px solid transparent',
        borderTop: 'none', borderRight: 'none', borderBottom: '1px solid var(--surface-border)',
        transition: 'all 0.15s',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
        <div style={{ fontWeight: 800, fontSize: 14, display: 'flex', alignItems: 'center', gap: 6 }}>
          {isSwiggy ? '🟠 Swiggy' : isZomato ? '🔴 Zomato' : (order.table_name || 'Takeaway')} — #{order.id}
        </div>
        <span style={{ fontWeight: 800, fontSize: 15, color: 'var(--primary)' }}>
          ₹{Number(order.subtotal).toFixed(0)}
        </span>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
          {order.items.length} items · {new Date(order.created_at).toLocaleTimeString()}
          {order.customer_name && ` · ${order.customer_name}`}
        </div>
        <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
          {isBillReq && (
            <span style={{ fontSize: 9, background: '#a855f7', color: '#fff', borderRadius: 99, padding: '2px 6px', fontWeight: 800, animation: 'pulse 1.5s infinite' }}>
              🔔 Req
            </span>
          )}
          <span className={`badge status-${order.status}`} style={{ fontSize: 9 }}>{STATUS_LABELS[order.status]}</span>
        </div>
      </div>
    </button>
  );
}

/* ─── Main Billing Page ──────────────────────────────────────── */
const TABS = [
  { key: 'bill_requested', label: '🔔 Bill Requested' },
  { key: 'active', label: '🔥 Active Orders' },
  { key: 'online', label: '🛵 Swiggy & Zomato' },
  { key: 'billed', label: '✅ Billed Today' },
];

export default function BillingPage() {
  const [allOrders, setAllOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('active');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [settleForm, setSettleForm] = useState({ include_gst: true, tax_percent: 5, discount_amount: 0 });

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const res = await orderApi.getOrders();
      setAllOrders(res.data);
    } catch { toast.error('Failed to load orders'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  /* Auto-refresh every 20s */
  useEffect(() => {
    const iv = setInterval(fetchOrders, 20000);
    return () => clearInterval(iv);
  }, [fetchOrders]);

  /* Filter by tab */
  const visibleOrders = allOrders.filter(o => {
    if (tab === 'bill_requested') {
      return !['billed', 'cancelled'].includes(o.status) &&
        (o.bill_requested || o.table_status === 'bill_requested' || o.status === 'served');
    }
    if (tab === 'active') return !['billed', 'cancelled'].includes(o.status);
    if (tab === 'online') {
      return !['billed', 'cancelled'].includes(o.status) &&
        ['swiggy', 'zomato', 'delivery'].includes(o.order_type);
    }
    if (tab === 'billed') {
      const today = new Date().toDateString();
      return o.status === 'billed' && new Date(o.created_at).toDateString() === today;
    }
    return true;
  });

  const billRequestedCount = allOrders.filter(o =>
    !['billed', 'cancelled'].includes(o.status) &&
    (o.bill_requested || o.table_status === 'bill_requested' || o.status === 'served')
  ).length;

  /* When tab changes, clear selected */
  useEffect(() => { setSelectedOrder(null); }, [tab]);

  const handleBilled = async () => {
    await fetchOrders();
    setSelectedOrder(null);
  };

  const handleStatusUpdate = async (orderId, newStatus) => {
    try {
      await orderApi.updateStatus(orderId, newStatus);
      toast.success(`✅ Order status updated to ${newStatus.toUpperCase()}`);
      setSelectedOrder(prev => prev && prev.id === orderId ? { ...prev, status: newStatus } : prev);
      fetchOrders();
    } catch (e) {
      const serverErr = e.response?.data?.error;
      if (serverErr && (serverErr.includes('pending') || serverErr.includes('Cannot move'))) {
        toast.error("👨‍🍳 Kitchen Alert: Order request must be accepted from the kitchen side first!");
      } else {
        toast.error(serverErr || "👨‍🍳 Kitchen Alert: Order request must be accepted from the kitchen side first!");
      }
    }
  };

  return (
    <div className="page-content fade-in">
      {/* Header */}
      <div className="page-header">
        <div>
          <div className="page-title">🧾 Billing Counter</div>
          <div className="page-subtitle">
            {visibleOrders.length} order{visibleOrders.length !== 1 ? 's' : ''} · auto-refreshes every 20s
          </div>
        </div>
        <button className="btn btn-secondary btn-sm" onClick={fetchOrders}>↻ Refresh</button>
      </div>

      {/* Tabs */}
      <div className="tabs" style={{ marginBottom: 20, display: 'inline-flex', gap: 4, flexWrap: 'wrap' }}>
        {TABS.map(t => (
          <button
            key={t.key}
            className={`tab-btn ${tab === t.key ? 'active' : ''}`}
            onClick={() => setTab(t.key)}
            style={t.key === 'bill_requested' && billRequestedCount > 0 && tab !== 'bill_requested' ? { color: '#a855f7' } : {}}
          >
            {t.label}
            {t.key === 'bill_requested' && billRequestedCount > 0 && (
              <span style={{ marginLeft: 6, background: '#a855f7', color: '#fff', borderRadius: 99, padding: '1px 7px', fontSize: 10, fontWeight: 800 }}>
                {billRequestedCount}
              </span>
            )}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="loading-screen"><div className="spinner" /><p>Loading orders…</p></div>
      ) : (
        /* ── Two-column billing layout ── */
        <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: 20, alignItems: 'start' }}>

          {/* LEFT: Order queue */}
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{ padding: '12px 14px', borderBottom: '1px solid var(--surface-border)', fontWeight: 800, fontSize: 14 }}>
              {tab === 'billed' ? '✅ Billed Orders' : tab === 'online' ? '🛵 Online Aggregator Orders' : `📋 Order Queue (${visibleOrders.length})`}
            </div>
            {visibleOrders.length === 0 ? (
              <div className="empty-state" style={{ padding: '40px 20px' }}>
                <div className="empty-state-icon" style={{ fontSize: 36 }}>🧾</div>
                <div className="empty-state-title" style={{ fontSize: 14 }}>No orders here</div>
                <div className="empty-state-text" style={{ fontSize: 12 }}>
                  {tab === 'bill_requested' ? 'No bill requests yet' :
                    tab === 'online' ? 'No active Swiggy/Zomato orders' :
                      tab === 'active' ? 'All tables are free!' : 'No bills generated today'}
                </div>
              </div>
            ) : (
              <div style={{ maxHeight: 'calc(100vh - 280px)', overflowY: 'auto' }}>
                {visibleOrders.map(o => (
                  <OrderListItem
                    key={o.id}
                    order={o}
                    isSelected={selectedOrder?.id === o.id}
                    onSelect={setSelectedOrder}
                  />
                ))}
              </div>
            )}
          </div>

          {/* RIGHT: Receipt + settle panel */}
          {!selectedOrder ? (
            <div className="card">
              <div className="empty-state" style={{ padding: '80px 20px' }}>
                <div className="empty-state-icon">🧾</div>
                <div className="empty-state-title">Select an order to bill</div>
                <div className="empty-state-text">
                  Click any order from the left queue to preview the thermal receipt and settle payment.
                </div>
              </div>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 20, alignItems: 'start' }}>

              {/* Receipt paper preview */}
              <div>
                <div style={{ marginBottom: 16, display: 'flex', gap: 8, alignItems: 'center' }}>
                  <span style={{ fontWeight: 700, fontSize: 14 }}>🖨️ Thermal Receipt Preview</span>
                  <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Updates live as you change options →</span>
                </div>
                <ReceiptPreview
                  order={selectedOrder}
                  includeGst={settleForm.include_gst}
                  taxPercent={settleForm.tax_percent}
                  discountAmount={settleForm.discount_amount}
                  discountReason={settleForm.discount_reason}
                />

                {/* Quick status action if not served yet */}
                {['pending', 'confirmed', 'preparing', 'ready'].includes(selectedOrder.status) ? (
                  <div style={{ marginTop: 16 }}>
                    <div className="card" style={{ background: 'rgba(249,115,22,0.06)', borderColor: 'rgba(249,115,22,0.2)' }}>
                      <div style={{ fontSize: 13, marginBottom: 4, fontWeight: 800, color: 'var(--warning)' }}>
                        👨‍🍳 Order in Kitchen ({STATUS_LABELS[selectedOrder.status]})
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 10 }}>
                        Order must be accepted & marked ready from kitchen side before serving.
                      </div>
                      <button
                        className="btn btn-success"
                        style={{ width: '100%', justifyContent: 'center' }}
                        onClick={() => handleStatusUpdate(selectedOrder.id, 'served')}
                      >
                        ✅ Mark as Served — then bill
                      </button>
                    </div>
                  </div>
                ) : selectedOrder.status === 'served' ? (
                  <div style={{ marginTop: 16 }}>
                    <div className="card" style={{ background: 'rgba(34,197,94,0.08)', borderColor: 'rgba(34,197,94,0.25)', textAlign: 'center' }}>
                      <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--success)' }}>
                        🍽️ Food Served to Customer
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                        All items delivered · Ready for payment settlement →
                      </div>
                    </div>
                  </div>
                ) : null}
              </div>

              {/* Settle panel */}
              {selectedOrder.status !== 'billed' && selectedOrder.status !== 'cancelled' ? (
                <SettlePanel
                  key={selectedOrder.id}
                  order={selectedOrder}
                  onBilled={handleBilled}
                  onFormChange={setSettleForm}
                  currentForm={settleForm}
                />
              ) : (
                <div className="card">
                  <div style={{ textAlign: 'center', padding: '30px 10px' }}>
                    <div style={{ fontSize: 40, marginBottom: 10 }}>
                      {selectedOrder.status === 'billed' ? '✅' : '❌'}
                    </div>
                    <div style={{ fontWeight: 800, fontSize: 15 }}>
                      {selectedOrder.status === 'billed' ? 'Bill Settled' : 'Order Cancelled'}
                    </div>
                    {selectedOrder.status === 'billed' && selectedOrder.bill && (
                      <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 8 }}>
                        <div>₹{Number(selectedOrder.bill.total).toFixed(2)} paid via {selectedOrder.bill.payment_method}</div>
                        <div>{selectedOrder.bill.bill_number}</div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
