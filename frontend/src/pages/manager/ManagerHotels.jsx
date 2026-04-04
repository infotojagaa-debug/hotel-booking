import React, { useState } from 'react';
import { FaWifi, FaSwimmingPool, FaVideo, FaShieldAlt, FaDumbbell, FaUtensils, FaCar, FaSpa, FaSnowflake, FaCocktail, FaTshirt, FaPlaneDeparture, FaCheck, FaUmbrellaBeach } from 'react-icons/fa';
import API, { BACKEND_URL } from '../../utils/api';

const AMENITY_ICONS = {
    'WiFi': <FaWifi />,
    'Swimming Pool': <FaSwimmingPool />,
    'CCTV': <FaVideo />,
    'Power Backup': <FaShieldAlt />,
    'Gym': <FaDumbbell />,
    'Restaurant': <FaUtensils />,
    'Parking': <FaCar />,
    'Spa': <FaSpa />,
    'AC': <FaSnowflake />,
    'Bar': <FaCocktail />,
    'Laundry': <FaTshirt />,
    'Airport Shuttle': <FaPlaneDeparture />,
};

const AMENITIES = ['WiFi', 'Swimming Pool', 'CCTV', 'Power Backup', 'Gym', 'Restaurant', 'Parking', 'Spa', 'AC', 'Bar', 'Laundry', 'Airport Shuttle'];
const HOTEL_TYPES = ['Hotel', 'Apartment', 'Resort', 'Villa', 'Hostel', 'Guest House'];

const emptyForm = {
    name: '', type: 'Hotel', city: '', address: '', zipCode: '',
    distanceFromCenter: '', distanceFromBeach: '', description: '', cheapestPrice: '',
    starRating: 3, images: '', amenities: [], isBreakfastIncluded: false,
    policies: { checkInTime: '14:00', checkOutTime: '11:00', cancellationPolicy: 'Free cancellation up to 24 hours before check-in' }
};

const ManagerHotels = ({ hotels, selectedHotel, onSelectHotel, onRefresh }) => {
    const [showForm, setShowForm] = useState(false);
    const [editHotel, setEditHotel] = useState(null);
    const [form, setForm] = useState(emptyForm);
    const [saving, setSaving] = useState(false);
    const [msg, setMsg] = useState('');
    const [uploadingImage, setUploadingImage] = useState(false);

    const handleAmenityToggle = (a) => {
        setForm(f => {
            const current = f.amenities || [];
            return {
                ...f,
                amenities: current.includes(a) ? current.filter(x => x !== a) : [...current, a]
            };
        });
    };

    const handleImageUpload = async (e) => {
        const files = Array.from(e.target.files);
        if (!files.length) return;
        setUploadingImage(true);
        try {
            const uploadPromises = files.map(file => {
                const formData = new FormData();
                formData.append('image', file);
                return API.post('/upload', formData);
            });
            const responses = await Promise.all(uploadPromises);
            const newUrls = responses.map(res => BACKEND_URL + res.data.url).join(', ');
            
            const currentImages = form.images ? form.images.trim() + (form.images.trim().endsWith(',') ? ' ' : ', ') : '';
            setForm({ ...form, images: currentImages + newUrls });
        } catch (err) { 
            alert('Image upload failed: ' + (err.response?.data?.message || err.message)); 
        }
        finally { setUploadingImage(false); }
    };

    const openAdd = () => { setForm(emptyForm); setEditHotel(null); setShowForm(true); setMsg(''); };
    const openEdit = (h) => {
        setForm({
            ...h,
            images: (h.images || []).join(', '),
            amenities: h.amenities || [],
            policies: h.policies || emptyForm.policies,
        });
        setEditHotel(h._id);
        setShowForm(true);
        setMsg('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            const payload = {
                ...form,
                images: form.images ? form.images.split(',').map(s => s.trim()).filter(Boolean) : [],
            };
            if (editHotel) {
                await API.put(`/manager/hotels/${editHotel}`, payload);
                setMsg('✅ Hotel updated successfully!');
            } else {
                await API.post('/manager/hotels', payload);
                setMsg('✅ Hotel submitted for admin approval!');
            }
            onRefresh();
            setTimeout(() => { setShowForm(false); setMsg(''); }, 1500);
        } catch (err) {
            setMsg('❌ ' + (err.response?.data?.message || 'Failed to save'));
        }
        setSaving(false);
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Delete this hotel and all its rooms?')) return;
        try {
            await API.delete(`/manager/hotels/${id}`);
            onRefresh();
        } catch { alert('Delete failed'); }
    };

    return (
        <div>
            <div className="flex-between mb-16">
                <div className="mgr-section-title">🏨 My Properties</div>
                <button className="mgr-btn mgr-btn-primary" onClick={openAdd}>+ Register Property</button>
            </div>

            {showForm && (
                <div className="mgr-card mgr-section">
                    <div className="mgr-card-header" style={{ background: 'linear-gradient(135deg, var(--primary-light), #fff)', padding: '24px', borderBottom: '1.5px solid var(--primary-light)' }}>
                        <h3 style={{ fontSize: '1.2rem', color: 'var(--primary-dark)', fontWeight: 800 }}>{editHotel ? 'Edit Property Details' : 'Register New Property'}</h3>
                        <button className="icon-btn" onClick={() => setShowForm(false)}>✕</button>
                    </div>
                    <div className="mgr-card-body" style={{ padding: '32px' }}>
                        {msg && <div style={{ marginBottom: 12, padding: '10px 14px', borderRadius: 8, background: msg.startsWith('✅') ? 'var(--success-light)' : 'var(--danger-light)', color: msg.startsWith('✅') ? '#065f46' : '#991b1b', fontSize: '0.85rem', fontWeight: 600 }}>{msg}</div>}
                        <form onSubmit={handleSubmit}>
                            <div className="mgr-form-grid">
                                <div className="mgr-form-group">
                                    <label>Property Name *</label>
                                    <input className="mgr-input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
                                </div>
                                <div className="mgr-form-group">
                                    <label>Type *</label>
                                    <select className="mgr-input" value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}>
                                        {HOTEL_TYPES.map(t => <option key={t}>{t}</option>)}
                                    </select>
                                </div>
                                <div className="mgr-form-group">
                                    <label>City *</label>
                                    <input className="mgr-input" value={form.city} onChange={e => setForm({ ...form, city: e.target.value })} required />
                                </div>
                                <div className="mgr-form-group">
                                    <label>Star Rating</label>
                                    <select className="mgr-input" value={form.starRating} onChange={e => setForm({ ...form, starRating: e.target.value })}>
                                        {[1,2,3,4,5].map(n => <option key={n} value={n}>{n} Star{n>1?'s':''}</option>)}
                                    </select>
                                </div>
                                <div className="mgr-form-group span-2">
                                    <label>Full Address *</label>
                                    <input className="mgr-input" value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} required />
                                </div>
                                <div className="mgr-form-group span-2">
                                    <label>Distance from Downtown *</label>
                                    <input className="mgr-input" placeholder="e.g. 1 km from downtown" value={form.distanceFromCenter} onChange={e => setForm({ ...form, distanceFromCenter: e.target.value })} required />
                                </div>
                                <div className="mgr-form-group span-2">
                                    <label>Distance from Beach (Optional)</label>
                                    <input className="mgr-input" placeholder="e.g. 2 km from beach" value={form.distanceFromBeach} onChange={e => setForm({ ...form, distanceFromBeach: e.target.value })} />
                                </div>
                                <div className="mgr-form-group">
                                    <label>Breakfast Included?</label>
                                    <div className="flex items-center gap-2 mt-2">
                                        <input type="checkbox" className="mgr-checkbox" checked={form.isBreakfastIncluded} onChange={e => setForm({ ...form, isBreakfastIncluded: e.target.checked })} />
                                        <span style={{ fontSize: '0.9rem' }}>Show "Breakfast Included" badge</span>
                                    </div>
                                </div>
                                <div className="mgr-form-group">
                                    <label>Base Price (₹/night) *</label>
                                    <input className="mgr-input" type="number" value={form.cheapestPrice} onChange={e => setForm({ ...form, cheapestPrice: e.target.value })} required />
                                </div>
                                <div className="mgr-form-group">
                                    <label>Check-In After</label>
                                    <input className="mgr-input" type="time" value={form.policies?.checkInTime} onChange={e => setForm({ ...form, policies: { ...form.policies, checkInTime: e.target.value } })} />
                                </div>
                                <div className="mgr-form-group">
                                    <label>Check-Out Before</label>
                                    <input className="mgr-input" type="time" value={form.policies?.checkOutTime} onChange={e => setForm({ ...form, policies: { ...form.policies, checkOutTime: e.target.value } })} />
                                </div>
                                 <div className="mgr-form-group span-2" style={{ background: 'var(--bg)', padding: '16px', borderRadius: '12px', border: '1px solid var(--border)' }}>
                                    <label>Property Images</label>
                                    <div style={{ display: 'flex', gap: '12px', marginBottom: '8px' }}>
                                        <div style={{ flex: 1 }}>
                                            <input className="mgr-input" placeholder="Paste Image URLs (comma-separated)..." value={form.images} onChange={e => setForm({ ...form, images: e.target.value })} />
                                        </div>
                                        <div>
                                            <input type="file" id="hotel-img-upload" style={{ display: 'none' }} onChange={handleImageUpload} accept="image/*" multiple />
                                            <label htmlFor="hotel-img-upload" className="mgr-btn mgr-btn-outline" style={{ cursor: 'pointer', height: '100%' }}>
                                                {uploadingImage ? 'Uploading...' : '📁 Upload Images'}
                                            </label>
                                        </div>
                                    </div>
                                    <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>You can provide direct URLs, or upload actual files. Uploaded files will automatically convert to URLs here.</span>
                                </div>
                                <div className="mgr-form-group span-2">
                                    <label>Description *</label>
                                    <textarea className="mgr-input" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} required />
                                </div>
                                <div className="mgr-form-group span-2">
                                    <label>Amenities (Visual identification for accessibility)</label>
                                     <div className="amenity-section-container" style={{ background: 'var(--primary-light)', padding: '24px', borderRadius: '16px', marginTop: '8px' }}>
                                        <div className="amenity-grid">
                                            {AMENITIES.map(a => (
                                                <label key={a} className={`amenity-chip ${form.amenities?.includes(a) ? 'selected' : ''}`}>
                                                    <input type="checkbox" checked={form.amenities?.includes(a)} onChange={() => handleAmenityToggle(a)} /> 
                                                    <span className="chip-icon">{AMENITY_ICONS[a] || <FaCheck />}</span>
                                                    <span>{a}</span>
                                                </label>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="flex-gap mt-16">
                                <button type="submit" className="mgr-btn mgr-btn-primary" disabled={saving}>{saving ? 'Saving...' : editHotel ? 'Update Hotel' : 'Submit for Approval'}</button>
                                <button type="button" className="mgr-btn mgr-btn-outline" onClick={() => setShowForm(false)}>Cancel</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Properties List - Card Grid */}
            {hotels.length > 0 ? (
                <div className="room-cards-grid">
                    {hotels.map(h => (
                        <div key={h._id} className={`room-card-item ${selectedHotel?._id === h._id ? 'active-card' : ''}`} 
                             onClick={() => onSelectHotel(h)} style={{ cursor: 'pointer' }}>
                            {h.images?.[0] 
                                ? <img src={h.images[0]} alt={h.name} className="room-card-img" onError={e => e.target.style.display='none'} referrerPolicy="no-referrer" />
                                : <div className="room-card-img-placeholder"><i className="fas fa-hotel"></i></div>
                            }
                            <div className="room-card-body">
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '8px' }}>
                                    <div>
                                        <div className="room-card-name">{h.name}</div>
                                        <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: '4px' }}>📍 {h.city} · {h.type}</div>
                                    </div>
                                     <div className="flex-gap">
                                        <button className="icon-btn edit" onClick={e => { e.stopPropagation(); openEdit(h); }} title="Edit"><i className="fas fa-pen" style={{ color: 'var(--primary)' }}></i></button>
                                        <button className="icon-btn del" onClick={e => { e.stopPropagation(); handleDelete(h._id); }} title="Delete"><i className="fas fa-trash" style={{ color: 'var(--danger)' }}></i></button>
                                    </div>
                                </div>
                                <div className="room-card-price" style={{ color: 'var(--primary)' }}>₹{h.cheapestPrice?.toLocaleString()} <span>/ night (from)</span></div>
                                
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '16px', paddingTop: '16px', borderTop: '1px solid #f1f5f9' }}>
                                    <div style={{ display: 'flex', gap: '12px', fontSize: '0.8rem', color: '#64748b' }}>
                                        <span>{'⭐'.repeat(h.starRating || 3)}</span>
                                        {h.distanceFromBeach && <span title="Beach Dist"><FaUmbrellaBeach /> {h.distanceFromBeach}</span>}
                                        {h.isBreakfastIncluded && <span title="Breakfast" style={{ color: '#059669' }}><FaUtensils /> Yes</span>}
                                    </div>
                                    <span className={`badge ${h.isApproved ? 'badge-green' : 'badge-amber'}`}>
                                        {h.isApproved ? '✓ Live' : '⏳ Pending'}
                                    </span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="mgr-empty">
                    <div className="empty-icon">🏨</div>
                    <p>No properties yet. Register your first hotel to get started!</p>
                </div>
            )}
        </div>
    );
};

export default ManagerHotels;
