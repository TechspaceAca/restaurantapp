import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { authApi } from '../../api';
import useStore from '../../store/useStore';

const SETTINGS_KEY = 'tclock_restaurant_settings';

const defaultSettings = {
  restaurant_name: 'T CLOCK RESTO CAFE',
  tagline: 'Time for Tea, Time for Taste',
  address: 'Main Road, Calicut, Kerala',
  phone: '+91 98765 43210',
  gstin: '32ABCDE1234F1Z5',
  logo_url: '',
  footer_greeting: 'Thank you for visiting T Clock Resto Cafe! 🌴',
  gst_percent: 5,
  service_charge: 0,
  currency: '₹',
  upi_id: '',
  wifi_password: '',
  opening_time: '09:00',
  closing_time: '23:00',
  dark_mode_default: false,
  auto_refresh_seconds: 15,
};

function SettingSection({ title, icon, children }) {
  return (
    <div className="card mb-4">
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20, paddingBottom: 14, borderBottom: '1px solid var(--border)' }}>
        <span style={{ fontSize: 22 }}>{icon}</span>
        <div style={{ fontWeight: 800, fontSize: 15 }}>{title}</div>
      </div>
      {children}
    </div>
  );
}

function Field({ label, hint, children }) {
  return (
    <div className="form-group">
      <label className="form-label">{label}</label>
      {children}
      {hint && <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>{hint}</div>}
    </div>
  );
}

export default function Settings() {
  const [form, setForm] = useState(defaultSettings);
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('restaurant');

  const setRestaurantSettings = useStore(state => state.setRestaurantSettings);
  const globalSettings = useStore(state => state.restaurantSettings);

  useEffect(() => {
    // Load local UI settings (like dark mode default) from localStorage
    const saved = localStorage.getItem(SETTINGS_KEY);
    if (saved) {
      try { setForm(f => ({ ...f, ...JSON.parse(saved) })); } catch {}
    }
    
    // Override with DB settings
    if (globalSettings) {
      setForm(f => ({
        ...f,
        restaurant_name: globalSettings.name || f.restaurant_name,
        tagline: globalSettings.tagline || f.tagline,
        address: globalSettings.address || f.address,
        phone: globalSettings.phone || f.phone,
        gstin: globalSettings.gstin || f.gstin,
        footer_greeting: globalSettings.footer || f.footer_greeting,
      }));
    } else {
      // Fetch if not available
      authApi.getSettings().then(res => {
        setRestaurantSettings(res.data);
        setForm(f => ({
          ...f,
          restaurant_name: res.data.name || f.restaurant_name,
          tagline: res.data.tagline || f.tagline,
          address: res.data.address || f.address,
          phone: res.data.phone || f.phone,
          gstin: res.data.gstin || f.gstin,
          footer_greeting: res.data.footer || f.footer_greeting,
        }));
      }).catch(console.error);
    }
  }, [globalSettings, setRestaurantSettings]);

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }));

  const handleLogoFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setLogoFile(file);
    const reader = new FileReader();
    reader.onload = ev => setLogoPreview(ev.target.result);
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const toSave = { ...form };
      if (logoPreview) toSave.logo_url = logoPreview;
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(toSave));
      setForm(toSave);
      
      // Save to database
      const dbPayload = {
        name: form.restaurant_name,
        tagline: form.tagline,
        address: form.address,
        phone: form.phone,
        gstin: form.gstin,
        footer: form.footer_greeting,
      };
      const res = await authApi.updateSettings(dbPayload);
      setRestaurantSettings(res.data);
      
      toast.success('Settings saved successfully!');
    } catch { toast.error('Failed to save settings to database'); }
    finally { setSaving(false); }
  };

  const handleReset = () => {
    if (!confirm('Reset all settings to defaults?')) return;
    localStorage.removeItem(SETTINGS_KEY);
    setForm(defaultSettings);
    setLogoPreview(null);
    setLogoFile(null);
    toast.success('Settings reset to defaults');
  };

  const tabs = [
    { id: 'restaurant', label: '🏪 Restaurant Info' },
    { id: 'billing',    label: '🧾 Billing & Tax' },
    { id: 'receipt',    label: '🖨️ Receipt & Branding' },
    { id: 'system',     label: '⚙️ System' },
  ];

  const currentLogo = logoPreview || form.logo_url;

  return (
    <div className="fade-in">
      {/* Header */}
      <div className="page-header">
        <div>
          <div className="page-title">⚙️ Settings &amp; Configuration</div>
          <div className="page-subtitle">Manage restaurant info, billing, receipt branding &amp; system preferences</div>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn btn-secondary btn-sm" onClick={handleReset}>↺ Reset Defaults</button>
          <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
            {saving ? 'Saving...' : '💾 Save Settings'}
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="category-tabs mb-4">
        {tabs.map(t => (
          <button
            key={t.id}
            className={`cat-tab ${activeTab === t.id ? 'active' : ''}`}
            onClick={() => setActiveTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ── Restaurant Info Tab ── */}
      {activeTab === 'restaurant' && (
        <>
          <SettingSection title="Restaurant Identity" icon="🏪">
            <div className="grid-2" style={{ gap: 16 }}>
              <Field label="Restaurant Name *" hint="Appears on receipts and customer portal">
                <input className="form-input" value={form.restaurant_name}
                  onChange={e => set('restaurant_name', e.target.value)} placeholder="e.g. Malabar Table" />
              </Field>
              <Field label="Tagline / Subtitle" hint="Short description shown below restaurant name">
                <input className="form-input" value={form.tagline}
                  onChange={e => set('tagline', e.target.value)} placeholder="e.g. Fine Dining Restaurant" />
              </Field>
              <div className="form-group" style={{ gridColumn: '1/-1' }}>
                <label className="form-label">Address / Location</label>
                <textarea className="form-textarea" rows={2} value={form.address}
                  onChange={e => set('address', e.target.value)} placeholder="Beach Road, Calicut, Kerala - 673001" />
              </div>
              <Field label="Contact Phone Number">
                <input className="form-input" value={form.phone}
                  onChange={e => set('phone', e.target.value)} placeholder="+91 98765 43210" />
              </Field>
              <Field label="WiFi Password" hint="Shown on receipt if filled">
                <input className="form-input" value={form.wifi_password}
                  onChange={e => set('wifi_password', e.target.value)} placeholder="restaurant_wifi_2024" />
              </Field>
              <Field label="Opening Time">
                <input className="form-input" type="time" value={form.opening_time}
                  onChange={e => set('opening_time', e.target.value)} />
              </Field>
              <Field label="Closing Time">
                <input className="form-input" type="time" value={form.closing_time}
                  onChange={e => set('closing_time', e.target.value)} />
              </Field>
            </div>
          </SettingSection>
        </>
      )}

      {/* ── Billing & Tax Tab ── */}
      {activeTab === 'billing' && (
        <>
          <SettingSection title="Tax Configuration" icon="🧾">
            <div className="grid-2" style={{ gap: 16 }}>
              <Field label="GSTIN Number" hint="Your GST registration number">
                <input className="form-input" value={form.gstin}
                  onChange={e => set('gstin', e.target.value)} placeholder="32ABCDE1234F1Z5" />
              </Field>
              <Field label="Currency Symbol">
                <input className="form-input" value={form.currency}
                  onChange={e => set('currency', e.target.value)} placeholder="₹" />
              </Field>
              <Field label="GST Percentage (%)" hint="Applied on all orders">
                <input className="form-input" type="number" min={0} max={28} value={form.gst_percent}
                  onChange={e => set('gst_percent', +e.target.value)} placeholder="5" />
              </Field>
              <Field label="Service Charge (%)" hint="Leave 0 to disable service charge">
                <input className="form-input" type="number" min={0} max={20} value={form.service_charge}
                  onChange={e => set('service_charge', +e.target.value)} placeholder="0" />
              </Field>
              <Field label="UPI ID" hint="For QR payments on receipt">
                <input className="form-input" value={form.upi_id}
                  onChange={e => set('upi_id', e.target.value)} placeholder="restaurant@upi" />
              </Field>
            </div>

            {/* Live Preview */}
            <div style={{ marginTop: 20, padding: 16, background: 'var(--bg-card2)', borderRadius: 12, border: '1px solid var(--border)' }}>
              <div style={{ fontWeight: 700, fontSize: 12, color: 'var(--text-muted)', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                Bill Preview
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 6 }}>
                <span>Subtotal</span><span>₹1000.00</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 6 }}>
                <span>GST ({form.gst_percent}%)</span><span>₹{(1000 * form.gst_percent / 100).toFixed(2)}</span>
              </div>
              {form.service_charge > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 6 }}>
                  <span>Service Charge ({form.service_charge}%)</span><span>₹{(1000 * form.service_charge / 100).toFixed(2)}</span>
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 15, fontWeight: 800, marginTop: 8, paddingTop: 8, borderTop: '1px dashed var(--border)', color: 'var(--primary)' }}>
                <span>Total Payable</span>
                <span>{form.currency}{(1000 * (1 + form.gst_percent / 100 + form.service_charge / 100)).toFixed(2)}</span>
              </div>
            </div>
          </SettingSection>
        </>
      )}

      {/* ── Receipt & Branding Tab ── */}
      {activeTab === 'receipt' && (
        <>
          <SettingSection title="Logo & Branding" icon="🖼️">
            <div className="grid-2" style={{ gap: 16, alignItems: 'start' }}>
              <div>
                <Field label="Upload Logo File" hint="PNG or JPG recommended (square format)">
                  <input className="form-input" type="file" accept="image/*" onChange={handleLogoFile} />
                </Field>
                <Field label="Or Paste Image URL" hint="Direct URL to your logo image">
                  <input className="form-input" value={form.logo_url}
                    onChange={e => set('logo_url', e.target.value)} placeholder="https://..." />
                </Field>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 120, height: 120, borderRadius: 16, border: '2px dashed var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-card2)', overflow: 'hidden' }}>
                  {currentLogo
                    ? <img src={currentLogo} alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                    : <span style={{ fontSize: 36 }}>🏪</span>
                  }
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Logo Preview</div>
              </div>
            </div>
          </SettingSection>

          <SettingSection title="Receipt Content" icon="🖨️">
            <Field label="Thermal Receipt Footer Greeting" hint="Printed at the bottom of every bill">
              <textarea className="form-textarea" rows={3} value={form.footer_greeting}
                onChange={e => set('footer_greeting', e.target.value)}
                placeholder="Thank you for dining with us! Please visit again." />
            </Field>

            {/* Live Receipt Preview */}
            <div style={{ marginTop: 20, padding: 20, background: '#fff', borderRadius: 12, border: '1px solid #e5e7eb', maxWidth: 320, fontFamily: 'monospace', fontSize: 12, color: '#111' }}>
              <div style={{ textAlign: 'center', marginBottom: 10 }}>
                {currentLogo && <img src={currentLogo} alt="logo" style={{ width: 60, height: 60, objectFit: 'contain', marginBottom: 6 }} />}
                <div style={{ fontWeight: 900, fontSize: 15 }}>{form.restaurant_name || 'RESTAURANT NAME'}</div>
                <div style={{ fontSize: 11, color: '#666' }}>{form.tagline || 'Tagline here'}</div>
                <div style={{ fontSize: 10, color: '#888', marginTop: 4 }}>{form.address || 'Address, City - PIN'}</div>
                <div style={{ fontSize: 10, color: '#888' }}>📞 {form.phone || '+91 00000 00000'}</div>
                {form.gstin && <div style={{ fontSize: 10, color: '#888' }}>GSTIN: {form.gstin}</div>}
              </div>
              <div style={{ borderTop: '1px dashed #ccc', borderBottom: '1px dashed #ccc', padding: '8px 0', margin: '8px 0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Malabar Biryani x1</span><span>₹380</span></div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Kerala Parotta x2</span><span>₹120</span></div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Subtotal</span><span>₹500</span></div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>GST ({form.gst_percent}%)</span><span>₹{(500*form.gst_percent/100).toFixed(0)}</span></div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 900, marginTop: 4, paddingTop: 4, borderTop: '1px dashed #ccc' }}>
                <span>TOTAL</span><span>₹{(500*(1+form.gst_percent/100)).toFixed(0)}</span>
              </div>
              {form.upi_id && <div style={{ textAlign: 'center', marginTop: 8, fontSize: 11 }}>UPI: {form.upi_id}</div>}
              {form.wifi_password && <div style={{ textAlign: 'center', fontSize: 10, color: '#888' }}>WiFi: {form.wifi_password}</div>}
              <div style={{ textAlign: 'center', marginTop: 10, fontSize: 10, color: '#888', fontStyle: 'italic' }}>{form.footer_greeting}</div>
            </div>
          </SettingSection>
        </>
      )}

      {/* ── System Tab ── */}
      {activeTab === 'system' && (
        <>
          <SettingSection title="System Preferences" icon="⚙️">
            <div className="grid-2" style={{ gap: 16 }}>
              <Field label="Auto-Refresh Interval (seconds)" hint="How often live panels refresh (minimum 10s)">
                <input className="form-input" type="number" min={10} max={120} value={form.auto_refresh_seconds}
                  onChange={e => set('auto_refresh_seconds', Math.max(10, +e.target.value))} />
              </Field>
            </div>
            <div style={{ marginTop: 8 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer', padding: '12px 16px', background: 'var(--bg-card2)', borderRadius: 10 }}>
                <input type="checkbox" checked={form.dark_mode_default}
                  onChange={e => set('dark_mode_default', e.target.checked)} style={{ width: 16, height: 16 }} />
                <div>
                  <div style={{ fontWeight: 700, fontSize: 13 }}>🌙 Default Dark Mode</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Apply dark mode by default when app loads</div>
                </div>
              </label>
            </div>
          </SettingSection>

          <SettingSection title="Danger Zone" icon="⚠️">
            <div style={{ padding: 16, background: '#fef2f2', borderRadius: 10, border: '1px solid #fecaca' }}>
              <div style={{ fontWeight: 700, fontSize: 13, color: '#dc2626', marginBottom: 8 }}>Reset All Settings</div>
              <div style={{ fontSize: 12, color: '#991b1b', marginBottom: 12 }}>
                This will clear all restaurant settings and restore factory defaults. This action cannot be undone.
              </div>
              <button className="btn btn-sm" style={{ background: '#dc2626', color: '#fff', border: 'none' }} onClick={handleReset}>
                🗑️ Reset to Defaults
              </button>
            </div>
          </SettingSection>
        </>
      )}

      {/* Sticky Save Bar */}
      <div style={{
        position: 'sticky', bottom: 16, display: 'flex', justifyContent: 'flex-end',
        padding: '12px 20px', background: 'var(--bg-card)', borderRadius: 12,
        border: '1px solid var(--border)', boxShadow: '0 4px 24px rgba(0,0,0,0.15)',
      }}>
        <div style={{ flex: 1, fontSize: 13, color: 'var(--text-muted)' }}>
          💡 Settings are saved locally and applied immediately
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn btn-secondary btn-sm" onClick={handleReset}>↺ Reset</button>
          <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
            {saving ? 'Saving...' : '💾 Save All Settings'}
          </button>
        </div>
      </div>
    </div>
  );
}
