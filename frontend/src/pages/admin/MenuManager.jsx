import { useState, useEffect } from 'react';
import { menuApi } from '../../api';
import toast from 'react-hot-toast';

function CategoryModal({ cat, onClose, onSave }) {
  const [form, setForm] = useState({ name: cat?.name || '', icon: cat?.icon || '🍽️', sort_order: cat?.sort_order || 0 });
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      if (cat?.id) await menuApi.updateCategory(cat.id, form);
      else await menuApi.createCategory(form);
      toast.success(`Category ${cat?.id ? 'updated' : 'created'}!`);
      onSave();
    } catch { toast.error('Failed to save category'); }
    finally { setSaving(false); }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title">{cat?.id ? 'Edit' : 'Add'} Category</div>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        <div className="form-group">
          <label className="form-label">Icon (emoji)</label>
          <input className="form-input" value={form.icon} onChange={e => setForm(f => ({ ...f, icon: e.target.value }))} placeholder="🍽️" />
        </div>
        <div className="form-group">
          <label className="form-label">Category Name</label>
          <input className="form-input" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Starters" required />
        </div>
        <div className="form-group">
          <label className="form-label">Sort Order</label>
          <input className="form-input" type="number" value={form.sort_order} onChange={e => setForm(f => ({ ...f, sort_order: +e.target.value }))} />
        </div>
        <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
          <button className="btn btn-secondary flex-1" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary flex-1" onClick={handleSave} disabled={saving}>
            {saving ? 'Saving...' : 'Save Category'}
          </button>
        </div>
      </div>
    </div>
  );
}

function ItemModal({ item, categories, onClose, onSave }) {
  const [form, setForm] = useState({
    name: item?.name || '', description: item?.description || '',
    price: item?.price || '', category: item?.category || (categories[0]?.id || ''),
    is_veg: item?.is_veg ?? true, is_available: item?.is_available ?? true,
    is_featured: item?.is_featured ?? false, prep_time: item?.prep_time || 15,
    sort_order: item?.sort_order || 0,
  });
  const [imageFile, setImageFile] = useState(null);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!form.name || !form.price || !form.category) {
      toast.error('Name, price and category are required'); return;
    }
    setSaving(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => fd.append(k, v));
      if (imageFile) fd.append('image', imageFile);
      if (item?.id) await menuApi.updateItem(item.id, fd);
      else await menuApi.createItem(fd);
      toast.success(`Menu item ${item?.id ? 'updated' : 'created'}!`);
      onSave();
    } catch (e) {
      toast.error(e.response?.data?.price?.[0] || 'Failed to save item');
    } finally { setSaving(false); }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" style={{ maxWidth: 580 }} onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title">{item?.id ? 'Edit' : 'Add'} Menu Item</div>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <div className="grid-2" style={{ gap: 12 }}>
          <div className="form-group" style={{ gridColumn: '1/-1' }}>
            <label className="form-label">Item Name *</label>
            <input className="form-input" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Butter Chicken" />
          </div>
          <div className="form-group">
            <label className="form-label">Category *</label>
            <select className="form-select" value={form.category} onChange={e => setForm(f => ({ ...f, category: +e.target.value }))}>
              {categories.map(c => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Price (₹) *</label>
            <input className="form-input" type="number" value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))} placeholder="0.00" />
          </div>
          <div className="form-group">
            <label className="form-label">Prep Time (min)</label>
            <input className="form-input" type="number" value={form.prep_time} onChange={e => setForm(f => ({ ...f, prep_time: +e.target.value }))} />
          </div>
          <div className="form-group">
            <label className="form-label">Sort Order</label>
            <input className="form-input" type="number" value={form.sort_order} onChange={e => setForm(f => ({ ...f, sort_order: +e.target.value }))} />
          </div>
          <div className="form-group" style={{ gridColumn: '1/-1' }}>
            <label className="form-label">Description</label>
            <textarea className="form-textarea" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Short description..." rows={2} />
          </div>
          <div className="form-group" style={{ gridColumn: '1/-1' }}>
            <label className="form-label">Item Image</label>
            <input className="form-input" type="file" accept="image/*" onChange={e => setImageFile(e.target.files[0])} />
          </div>
        </div>

        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', margin: '8px 0 16px' }}>
          {[
            { key: 'is_veg', label: '🌿 Vegetarian' },
            { key: 'is_available', label: '✅ Available' },
            { key: 'is_featured', label: '⭐ Featured' },
          ].map(({ key, label }) => (
            <label key={key} style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 13 }}>
              <input type="checkbox" checked={form[key]} onChange={e => setForm(f => ({ ...f, [key]: e.target.checked }))} />
              {label}
            </label>
          ))}
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn btn-secondary flex-1" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary flex-1" onClick={handleSave} disabled={saving}>
            {saving ? 'Saving...' : 'Save Item'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function MenuManager() {
  const [categories, setCategories] = useState([]);
  const [selectedCat, setSelectedCat] = useState(null);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [catModal, setCatModal] = useState(null);  // null | 'new' | category object
  const [itemModal, setItemModal] = useState(null);
  const [search, setSearch] = useState('');

  useEffect(() => { fetchCategories(); }, []);
  useEffect(() => { if (selectedCat) fetchItems(selectedCat); }, [selectedCat]);

  const fetchCategories = async () => {
    try {
      const res = await menuApi.getCategories();
      setCategories(res.data);
      if (res.data.length > 0 && !selectedCat) setSelectedCat(res.data[0].id);
    } catch { toast.error('Failed to load categories'); }
    finally { setLoading(false); }
  };

  const fetchItems = async (catId) => {
    try {
      const res = await menuApi.getItems({ category: catId });
      setItems(res.data);
    } catch { toast.error('Failed to load items'); }
  };

  const handleDeleteCat = async (catId) => {
    if (!confirm('Delete this category and all its items?')) return;
    try { await menuApi.deleteCategory(catId); toast.success('Category deleted'); fetchCategories(); }
    catch { toast.error('Failed to delete'); }
  };

  const handleDeleteItem = async (itemId) => {
    if (!confirm('Delete this menu item?')) return;
    try { await menuApi.deleteItem(itemId); toast.success('Item deleted'); fetchItems(selectedCat); }
    catch { toast.error('Failed to delete item'); }
  };

  const handleToggleItem = async (itemId) => {
    try { await menuApi.toggleItem(itemId); fetchItems(selectedCat); }
    catch { toast.error('Failed to toggle availability'); }
  };

  const filteredItems = items.filter(i => i.name.toLowerCase().includes(search.toLowerCase()));
  const currentCat = categories.find(c => c.id === selectedCat);

  return (
    <div className="fade-in">
      <div className="page-header">
        <div>
          <div className="page-title">🍽️ Menu Catalog</div>
          <div className="page-subtitle">{categories.length} categories · {items.length} items</div>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn btn-secondary btn-sm" onClick={() => setCatModal('new')}>+ Add Category</button>
          <button className="btn btn-primary" onClick={() => setItemModal('new')}>+ Add Item</button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr', gap: 16 }}>
        {/* Categories Panel */}
        <div className="card" style={{ padding: 12, alignSelf: 'start' }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8, padding: '0 6px' }}>
            Categories
          </div>
          {categories.map(cat => (
            <div
              key={cat.id}
              className={`nav-item ${selectedCat === cat.id ? 'active' : ''}`}
              onClick={() => setSelectedCat(cat.id)}
              style={{ justifyContent: 'space-between' }}
            >
              <span>{cat.icon} {cat.name}</span>
              <div style={{ display: 'flex', gap: 4 }} onClick={e => e.stopPropagation()}>
                <button className="btn btn-ghost btn-sm btn-icon" onClick={() => setCatModal(cat)} title="Edit" style={{ padding: '2px 6px', fontSize: 12 }}>✏️</button>
                <button className="btn btn-ghost btn-sm btn-icon" onClick={() => handleDeleteCat(cat.id)} title="Delete" style={{ padding: '2px 6px', fontSize: 12 }}>🗑️</button>
              </div>
            </div>
          ))}
          {categories.length === 0 && !loading && (
            <div style={{ padding: '16px', textAlign: 'center', color: 'var(--text-muted)', fontSize: 12 }}>
              No categories yet
            </div>
          )}
        </div>

        {/* Items Panel */}
        <div>
          <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
            <div className="search-box" style={{ flex: 1 }}>
              <span className="search-icon">🔍</span>
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search items..." />
            </div>
          </div>

          {loading ? (
            <div className="loading-screen"><div className="spinner" /><p>Loading...</p></div>
          ) : filteredItems.length === 0 ? (
            <div className="card">
              <div className="empty-state">
                <div className="empty-state-icon">🍴</div>
                <div className="empty-state-title">No items in {currentCat?.name}</div>
                <div className="empty-state-text">Click "+ Add Item" to add your first menu item</div>
              </div>
            </div>
          ) : (
            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Item</th>
                    <th>Price</th>
                    <th>Type</th>
                    <th>Prep</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredItems.map(item => (
                    <tr key={item.id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          {item.is_veg ? <div className="veg-dot" /> : <div className="nonveg-dot" />}
                          <div>
                            <div style={{ fontWeight: 600, fontSize: 13 }}>
                              {item.name}
                              {item.is_featured && <span style={{ marginLeft: 6, fontSize: 11 }}>⭐</span>}
                            </div>
                            {item.description && <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{item.description.slice(0, 50)}</div>}
                          </div>
                        </div>
                      </td>
                      <td style={{ fontWeight: 700, color: 'var(--primary)' }}>₹{item.price}</td>
                      <td><span className={`badge ${item.is_veg ? 'badge-success' : 'badge-danger'}`}>{item.is_veg ? 'Veg' : 'Non-Veg'}</span></td>
                      <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>{item.prep_time}m</td>
                      <td>
                        <button onClick={() => handleToggleItem(item.id)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                          <span className={`badge ${item.is_available ? 'badge-success' : 'badge-muted'}`}>
                            {item.is_available ? 'Available' : 'Unavailable'}
                          </span>
                        </button>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button className="btn btn-ghost btn-sm" onClick={() => setItemModal(item)}>✏️ Edit</button>
                          <button className="btn btn-ghost btn-sm" onClick={() => handleDeleteItem(item.id)} style={{ color: 'var(--danger)' }}>🗑️</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {catModal !== null && (
        <CategoryModal
          cat={catModal === 'new' ? null : catModal}
          onClose={() => setCatModal(null)}
          onSave={() => { setCatModal(null); fetchCategories(); }}
        />
      )}
      {itemModal !== null && (
        <ItemModal
          item={itemModal === 'new' ? null : itemModal}
          categories={categories}
          onClose={() => setItemModal(null)}
          onSave={() => { setItemModal(null); fetchItems(selectedCat); }}
        />
      )}
    </div>
  );
}
