import React, { useState } from 'react';
import API, { BACKEND_URL } from '../../utils/api';

const ManagerOffers = ({ offers, hotels, onRefresh }) => {
    const defaultHotel = hotels && hotels.length > 0 ? hotels[0]._id : '';
    const emptyOffer = {
        code: '', title: '', description: '',
        discountType: 'Percentage', discountValue: '',
        validFrom: '', validTo: '',
        minBookingAmount: 0, maxDiscount: 0,
        isActive: true, bannerImage: '',
        hotel: defaultHotel  // Always hotel-specific for managers
    };

    const [showForm, setShowForm] = useState(false);
    const [form, setForm] = useState(emptyOffer);
    const [editingOffer, setEditingOffer] = useState(null);
    const [saving, setSaving] = useState(false);
    const [msg, setMsg] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            await API.post('/manager/offers', form);
            setMsg('✅ Offer created!');
            onRefresh();
            setTimeout(() => { setShowForm(false); setMsg(''); setForm({ ...emptyOffer, hotel: hotels[0]?._id || '' }); }, 1200);
        } catch (err) { setMsg('❌ ' + (err.response?.data?.message || 'Failed')); }
        setSaving(false);
    };

    const handleUpdate = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            await API.put(`/manager/offers/${editingOffer._id}`, editingOffer);
            setMsg('✅ Offer updated!');
            onRefresh();
            setTimeout(() => { setEditingOffer(null); setMsg(''); }, 1200);
        } catch (err) { setMsg('❌ ' + (err.response?.data?.message || 'Failed')); }
        setSaving(false);
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Delete this offer?')) return;
        try { await API.delete(`/manager/offers/${id}`); onRefresh(); } catch { alert('Delete failed'); }
    };

    const handleToggle = async (id) => {
        try { await API.put(`/manager/offers/${id}/toggle`); onRefresh(); } catch { alert('Toggle failed'); }
    };

    const isExpired = (to) => new Date(to) < new Date();

    const handleImageUpload = async (e, isEditing) => {
        const file = e.target.files[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('image', file);
        
        try {
            setSaving(true);
            const res = await API.post('/upload', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            
            if (isEditing) {
                setEditingOffer({ ...editingOffer, bannerImage: res.data.url });
            } else {
                setForm({ ...form, bannerImage: res.data.url });
            }
            setMsg('✅ Image uploaded successfully!');
            setTimeout(() => setMsg(''), 2000);
        } catch (err) {
            console.error('Upload Error:', err);
            setMsg('❌ Image upload failed');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div>
            <div className="flex-between mb-16">
                <div className="mgr-section-title">🏷️ Offers &amp; Coupons</div>
                <button className="mgr-btn mgr-btn-primary" onClick={() => { setShowForm(!showForm); setMsg(''); setForm({ ...emptyOffer, hotel: hotels[0]?._id || '' }); }}>
                    {showForm ? '✕ Close' : '+ Create Offer'}
                </button>
            </div>

            {/* Info Banner: Manager scope restriction */}
            <div style={{
                background: 'linear-gradient(135deg, #eff6ff, #f0f9ff)',
                border: '1.5px solid #bfdbfe',
                borderRadius: '14px',
                padding: '12px 18px',
                marginBottom: '20px',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                fontSize: '0.85rem',
                color: '#1e40af',
            }}>
                <span style={{ fontSize: '1.2rem' }}>🏨</span>
                <div>
                    <strong>Hotel-Specific Promotions Only.</strong> As a manager, you can create offers exclusively for your own properties. Global promotions are managed by the Admin.
                </div>
            </div>

            {/* Create Form */}
            {showForm && (
                <div className="mgr-card mgr-section">
                    <div className="mgr-card-header"><h3>Create Hotel-Specific Offer</h3></div>
                    <div className="mgr-card-body">
                        {msg && <div style={{ marginBottom: 12, padding: '10px 14px', borderRadius: 8, background: msg.startsWith('✅') ? 'var(--success-light)' : 'var(--danger-light)', color: msg.startsWith('✅') ? '#065f46' : '#991b1b', fontSize: '0.85rem', fontWeight: 600 }}>{msg}</div>}
                        <form onSubmit={handleSubmit}>
                            <div className="mgr-form-grid">
                                <div className="mgr-form-group">
                                    <label>Coupon Code *</label>
                                    <input className="mgr-input" placeholder="e.g. SUMMER20" value={form.code} onChange={e => setForm({ ...form, code: e.target.value.toUpperCase() })} required />
                                </div>
                                <div className="mgr-form-group">
                                    <label>🏨 Hotel / Property (Auto-assigned)</label>
                                    <div className="mgr-input" style={{ background: '#f8fafc', color: '#64748b', display: 'flex', alignItems: 'center' }}>
                                        {hotels[0]?.name || 'Your Primary Hotel'}
                                    </div>
                                </div>
                                <div className="mgr-form-group">
                                    <label>Offer Title *</label>
                                    <input className="mgr-input" placeholder="e.g. Summer Sale" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} required />
                                </div>
                                <div className="mgr-form-group">
                                    <label>Discount Type</label>
                                    <select className="mgr-input" value={form.discountType} onChange={e => setForm({ ...form, discountType: e.target.value })}>
                                        <option value="Percentage">Percentage (%)</option>
                                        <option value="Flat">Flat (₹)</option>
                                    </select>
                                </div>
                                <div className="mgr-form-group">
                                    <label>Discount Value *</label>
                                    <input className="mgr-input" type="number" placeholder={form.discountType === 'Percentage' ? '0-100' : '₹ amount'} value={form.discountValue} onChange={e => setForm({ ...form, discountValue: e.target.value })} required />
                                </div>
                                <div className="mgr-form-group">
                                    <label>Min Booking Amount (₹)</label>
                                    <input className="mgr-input" type="number" value={form.minBookingAmount} onChange={e => setForm({ ...form, minBookingAmount: e.target.value })} />
                                </div>
                                <div className="mgr-form-group">
                                    <label>Max Discount Cap (₹)</label>
                                    <input className="mgr-input" type="number" value={form.maxDiscount} onChange={e => setForm({ ...form, maxDiscount: e.target.value })} />
                                </div>
                                <div className="mgr-form-group">
                                    <label>Valid From *</label>
                                    <input className="mgr-input" type="date" value={form.validFrom} onChange={e => setForm({ ...form, validFrom: e.target.value })} required />
                                </div>
                                <div className="mgr-form-group">
                                    <label>Valid To *</label>
                                    <input className="mgr-input" type="date" value={form.validTo} onChange={e => setForm({ ...form, validTo: e.target.value })} required />
                                </div>
                                <div className="mgr-form-group span-2" style={{ border: '1px dashed #cbd5e1', padding: '16px', borderRadius: '12px', background: '#f8fafc' }}>
                                    <label style={{ display: 'block', marginBottom: '12px', fontWeight: 700, color: '#0f172a' }}>Offer Banner Image</label>
                                    <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) auto minmax(0, 1fr)', gap: '16px', alignItems: 'center' }}>
                                        {/* Upload Column */}
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                            <label style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 600 }}>1. Upload from Device</label>
                                            <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, false)} className="mgr-input" style={{ padding: '8px', background: '#fff' }} disabled={saving} />
                                        </div>
                                        {/* Divider */}
                                        <div style={{ color: '#94a3b8', fontSize: '0.85rem', fontWeight: 600, padding: '0 8px', alignSelf: 'end', marginBottom: '8px' }}>OR</div>
                                        {/* URL Column */}
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                            <label style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 600 }}>2. Enter Direct Image URL</label>
                                            <input className="mgr-input" placeholder="https://..." value={form.bannerImage} onChange={e => setForm({ ...form, bannerImage: e.target.value })} style={{ background: '#fff' }} />
                                        </div>
                                    </div>
                                    
                                    {form.bannerImage && (
                                        <div style={{ marginTop: '20px', borderRadius: '10px', overflow: 'hidden', height: '160px', background: '#e2e8f0', display: 'flex', alignItems: 'center', justifyItems: 'center', border: '1px solid #e2e8f0' }}>
                                            <img src={form.bannerImage.startsWith('http') ? form.bannerImage : `${BACKEND_URL}${form.bannerImage.startsWith('/') ? '' : '/'}${form.bannerImage}`} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                        </div>
                                    )}
                                </div>
                                <div className="mgr-form-group" style={{ justifyContent: 'flex-start' }}>
                                    <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', marginTop: 22 }}>
                                        <input type="checkbox" checked={form.isActive} onChange={e => setForm({ ...form, isActive: e.target.checked })} /> Active immediately
                                    </label>
                                </div>
                                <div className="mgr-form-group span-2">
                                    <label>Description *</label>
                                    <input className="mgr-input" placeholder="Short description of the offer" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} required />
                                </div>
                            </div>
                            <div className="flex-gap mt-16">
                                <button type="submit" className="mgr-btn mgr-btn-primary" disabled={saving}>{saving ? 'Creating...' : 'Create Offer'}</button>
                                <button type="button" className="mgr-btn mgr-btn-outline" onClick={() => setShowForm(false)}>Cancel</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Edit Form Modal */}
            {editingOffer && (
                <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.5)',zIndex:1000,display:'flex',alignItems:'center',justifyContent:'center'}}>
                    <div className="mgr-card mgr-section" style={{width:'800px',maxHeight:'90vh',overflowY:'auto',margin:0}}>
                        <div className="mgr-card-header"><h3>Edit Offer Form</h3></div>
                        <div className="mgr-card-body">
                            {msg && <div style={{ marginBottom: 12, padding: '10px 14px', borderRadius: 8, background: msg.startsWith('✅') ? 'var(--success-light)' : 'var(--danger-light)', color: msg.startsWith('✅') ? '#065f46' : '#991b1b', fontSize: '0.85rem', fontWeight: 600 }}>{msg}</div>}
                            <form onSubmit={handleUpdate}>
                                <div className="mgr-form-grid">
                                    <div className="mgr-form-group">
                                        <label>Coupon Code *</label>
                                        <input className="mgr-input" value={editingOffer.code} onChange={e => setEditingOffer({ ...editingOffer, code: e.target.value.toUpperCase() })} required />
                                    </div>
                                    <div className="mgr-form-group">
                                        <label>🏨 Hotel (Auto-assigned)</label>
                                        <div className="mgr-input" style={{ background: '#f8fafc', color: '#64748b', display: 'flex', alignItems: 'center' }}>
                                            {hotels[0]?.name || 'Your Primary Hotel'}
                                        </div>
                                    </div>
                                    <div className="mgr-form-group">
                                        <label>Offer Title *</label>
                                        <input className="mgr-input" value={editingOffer.title} onChange={e => setEditingOffer({ ...editingOffer, title: e.target.value })} required />
                                    </div>
                                    <div className="mgr-form-group">
                                        <label>Discount Type</label>
                                        <select className="mgr-input" value={editingOffer.discountType} onChange={e => setEditingOffer({ ...editingOffer, discountType: e.target.value })}>
                                            <option value="Percentage">Percentage (%)</option>
                                            <option value="Flat">Flat (₹)</option>
                                        </select>
                                    </div>
                                    <div className="mgr-form-group">
                                        <label>Discount Value *</label>
                                        <input className="mgr-input" type="number" value={editingOffer.discountValue} onChange={e => setEditingOffer({ ...editingOffer, discountValue: e.target.value })} required />
                                    </div>
                                    <div className="mgr-form-group">
                                        <label>Valid From *</label>
                                        <input className="mgr-input" type="date" value={editingOffer.validFrom?.split('T')[0] || ''} onChange={e => setEditingOffer({ ...editingOffer, validFrom: e.target.value })} required />
                                    </div>
                                    <div className="mgr-form-group">
                                        <label>Valid To *</label>
                                        <input className="mgr-input" type="date" value={editingOffer.validTo?.split('T')[0] || ''} onChange={e => setEditingOffer({ ...editingOffer, validTo: e.target.value })} required />
                                    </div>
                                    <div className="mgr-form-group span-2" style={{ border: '1px dashed #cbd5e1', padding: '16px', borderRadius: '12px', background: '#f8fafc' }}>
                                        <label style={{ display: 'block', marginBottom: '12px', fontWeight: 700, color: '#0f172a' }}>Offer Banner Image</label>
                                        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) auto minmax(0, 1fr)', gap: '16px', alignItems: 'center' }}>
                                            {/* Upload Column */}
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                                <label style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 600 }}>1. Upload from Device</label>
                                                <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, true)} className="mgr-input" style={{ padding: '8px', background: '#fff' }} disabled={saving} />
                                            </div>
                                            {/* Divider */}
                                            <div style={{ color: '#94a3b8', fontSize: '0.85rem', fontWeight: 600, padding: '0 8px', alignSelf: 'end', marginBottom: '8px' }}>OR</div>
                                            {/* URL Column */}
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                                <label style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 600 }}>2. Enter Direct Image URL</label>
                                                <input className="mgr-input" placeholder="https://..." value={editingOffer.bannerImage || ''} onChange={e => setEditingOffer({ ...editingOffer, bannerImage: e.target.value })} style={{ background: '#fff' }} />
                                            </div>
                                        </div>
                                        
                                        {/* Preview Area */}
                                        {editingOffer.bannerImage && (
                                            <div style={{ marginTop: '20px', borderRadius: '10px', overflow: 'hidden', height: '160px', background: '#e2e8f0', display: 'flex', alignItems: 'center', justifyItems: 'center', border: '1px solid #e2e8f0' }}>
                                                <img src={editingOffer.bannerImage.startsWith('http') ? editingOffer.bannerImage : `${BACKEND_URL}${editingOffer.bannerImage.startsWith('/') ? '' : '/'}${editingOffer.bannerImage}`} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                            </div>
                                        )}
                                    </div>
                                    <div className="mgr-form-group span-2">
                                        <label>Description *</label>
                                        <input className="mgr-input" value={editingOffer.description} onChange={e => setEditingOffer({ ...editingOffer, description: e.target.value })} required />
                                    </div>
                                </div>
                                <div className="flex-gap mt-16">
                                    <button type="submit" className="mgr-btn mgr-btn-primary" disabled={saving}>{saving ? 'Saving...' : 'Save Changes'}</button>
                                    <button type="button" className="mgr-btn mgr-btn-outline" onClick={() => {setEditingOffer(null); setMsg('');}}>Cancel</button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* Offers Grid */}
            {offers.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px', color: '#64748b', fontSize: '1.2rem' }}>
                    No offers available
                </div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 20 }}>
                    {offers.map(o => (
                    <div key={o._id} className={`offer-card ${!o.isActive ? 'inactive' : ''}`} style={{ border: '1px solid var(--border)', borderRadius: '20px', padding: '24px', position: 'relative', overflow: 'hidden', transition: 'all 0.3s ease', background: '#fff', boxShadow: 'var(--shadow)' }}>
                        {/* Type Label */}
                        <div style={{ marginBottom: '12px' }}>
                            <span style={{
                                display: 'inline-flex', alignItems: 'center', gap: '6px',
                                padding: '5px 14px',
                                background: 'linear-gradient(135deg, #eff6ff, #dbeafe)',
                                color: '#1d4ed8',
                                borderRadius: '20px', fontSize: '11px', fontWeight: 700,
                                border: '1px solid #bfdbfe',
                            }}>
                                🏨 Exclusive for this Hotel {o.hotel?.name ? `· ${o.hotel.name}` : ''}
                            </span>
                        </div>

                        <div className="flex-between" style={{ marginBottom: '12px' }}>
                            <div className="offer-code" style={{ fontSize: '1.4rem', color: 'var(--primary)', fontWeight: 900, letterSpacing: '1px' }}>{o.code}</div>
                            <div className="flex-gap">
                                <span className={`badge ${o.isActive && !isExpired(o.validTo) ? 'badge-green' : 'badge-gray'}`} style={{ padding: '4px 12px' }}>
                                    {isExpired(o.validTo) ? 'Expired' : o.isActive ? 'Active' : 'Inactive'}
                                </span>
                            </div>
                        </div>
                        {o.title && <div style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--text-primary)', marginBottom: '4px' }}>{o.title}</div>}
                        <div className="offer-desc" style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '16px', lineHeight: 1.4 }}>{o.description}</div>
                        <div className="offer-meta" style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '20px' }}>
                            <span className="badge badge-purple" style={{ background: 'var(--primary-light)', color: 'var(--primary)', fontWeight: 700 }}>
                                {o.discountType === 'Percentage' ? `${o.discountValue}% OFF` : `₹${o.discountValue} OFF`}
                            </span>
                            {o.minBookingAmount > 0 && <span className="badge badge-gray">Min ₹{o.minBookingAmount.toLocaleString()}</span>}
                            <span className="badge" style={{ background: '#fef3c7', color: '#92400e' }}>⌛ {new Date(o.validTo).toLocaleDateString('en-IN', { dateStyle: 'medium' })}</span>
                            <span className="badge" style={{ background: '#f1f0ff', color: '#6d5dfc' }}>📊 {o.usageCount} Redemptions</span>
                        </div>
                        <div className="flex-gap" style={{ borderTop: '1px solid var(--border)', paddingTop: '16px' }}>
                            <button className="mgr-btn mgr-btn-outline mgr-btn-sm flex-1" style={{ borderRadius: '10px' }} onClick={() => setEditingOffer(o)}>
                                ✏ Edit
                            </button>
                            <button className="mgr-btn mgr-btn-outline mgr-btn-sm flex-1" style={{ borderRadius: '10px' }} onClick={() => handleToggle(o._id)}>
                                {o.isActive ? '⏸ Deactivate' : '▶ Activate'}
                            </button>
                            <button className="mgr-btn mgr-btn-danger mgr-btn-sm" style={{ borderRadius: '10px', background: 'var(--danger)' }} onClick={() => handleDelete(o._id)}>🗑 Delete</button>
                        </div>
                    </div>
                ))}
            </div>
            )}
        </div>
    );
};

export default ManagerOffers;
