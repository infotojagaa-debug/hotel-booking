import React, { useState } from 'react';
import { FaWifi, FaSnowflake, FaTv, FaCocktail, FaBorderNone, FaBed, FaWater, FaHotTub, FaLock, FaBriefcase, FaCheck } from 'react-icons/fa';
import API, { BACKEND_URL } from '../../utils/api';

const AMENITY_ICONS = {
    'WiFi': <FaWifi />,
    'AC': <FaSnowflake />,
    'TV': <FaTv />,
    'Mini Bar': <FaCocktail />,
    'Balcony': <FaBorderNone />,
    'King Bed': <FaBed />,
    'Sea View': <FaWater />,
    'Hot Tub': <FaHotTub />,
    'Safe': <FaLock />,
    'Work Desk': <FaBriefcase />,
};

const ROOM_TYPES = ['Classic Room', 'Deluxe Room', 'Suite', 'Double Room', 'Single Room', 'Family Room', 'Presidential Suite'];
const ROOM_AMENITIES = ['WiFi', 'AC', 'TV', 'Mini Bar', 'Balcony', 'King Bed', 'Sea View', 'Hot Tub', 'Safe', 'Work Desk'];

const emptyForm = { name: '', type: 'Classic Room', pricePerNight: '', maxGuests: 1, description: '', images: '', amenities: [], weekendPriceMultiplier: 1.0, totalRoomCount: 1 };

const ManagerRooms = ({ rooms, hotels, selectedHotel, onSelectHotel, onRefresh }) => {
    const [showForm, setShowForm] = useState(false);
    const [editId, setEditId] = useState(null);
    const [form, setForm] = useState(emptyForm);
    const [saving, setSaving] = useState(false);
    const [msg, setMsg] = useState('');
    const [uploadingImage, setUploadingImage] = useState(false);

    const safeRooms = Array.isArray(rooms) ? rooms : [];
    const hotelRooms = selectedHotel ? safeRooms.filter(r => r.hotel?._id === selectedHotel._id || r.hotel === selectedHotel._id) : safeRooms;

    const openAdd = () => { setForm(emptyForm); setEditId(null); setShowForm(true); setMsg(''); };
    const openEdit = (r) => {
        setForm({ ...r, images: (r.images || []).join(', '), amenities: r.amenities || [] });
        setEditId(r._id); setShowForm(true); setMsg('');
    };

    const toggleAmenity = (a) => setForm(f => {
        const current = f.amenities || [];
        return { ...f, amenities: current.includes(a) ? current.filter(x => x !== a) : [...current, a] };
    });

    const handleImageUpload = async (e) => {
        const files = Array.from(e.target.files);
        if (!files.length) return;
        setUploadingImage(true);
        try {
            const uploadPromises = files.map(file => {
                const formData = new FormData();
                formData.append('image', file);
                return API.post('/upload', formData); // Let Axios handle the form-data boundary natively
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

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!selectedHotel && !editId) { setMsg('❌ Please select a hotel first'); return; }
        setSaving(true);
        try {
            const payload = { ...form, images: form.images ? form.images.split(',').map(s => s.trim()).filter(Boolean) : [], hotelId: selectedHotel?._id };
            if (editId) { await API.put(`/manager/rooms/${editId}`, payload); setMsg('✅ Room updated!'); }
            else { await API.post('/manager/rooms', payload); setMsg('✅ Room created!'); }
            onRefresh();
            setTimeout(() => { setShowForm(false); setMsg(''); }, 1200);
        } catch (err) { setMsg('❌ ' + (err.response?.data?.message || 'Failed')); }
        setSaving(false);
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Delete this room?')) return;
        try { await API.delete(`/manager/rooms/${id}`); onRefresh(); } catch { alert('Delete failed'); }
    };

    const handleStatusChange = async (id, status) => {
        try { await API.put(`/manager/rooms/${id}`, { status }); onRefresh(); } catch { alert('Update failed'); }
    };

    return (
        <div>
            <div className="flex-between mb-16">
                <div className="mgr-section-title">🛏️ Room Management</div>
                <button className="mgr-btn mgr-btn-primary" onClick={openAdd}>+ Add Room</button>
            </div>

            {/* Hotel Selector */}
            <div className="mgr-card mgr-section">
                <div className="mgr-card-body" style={{ padding: '16px' }}>
                    <div className="mgr-section-label">SELECT HOTEL TO MANAGE ROOMS</div>
                    <div className="hotel-selector-chips">
                        {hotels.map(h => (
                            <button key={h._id} onClick={() => onSelectHotel(h)}
                                className={`mgr-chip-btn ${selectedHotel?._id === h._id ? 'active' : ''}`}>
                                {h.name}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Add/Edit Form */}
            {showForm && (
                <div className="mgr-card mgr-section">
                    <div className="mgr-card-header" style={{ background: 'linear-gradient(135deg, var(--primary-light), #fff)', padding: '24px', borderBottom: '1.5px solid var(--primary-light)' }}>
                        <h3 style={{ fontSize: '1.2rem', color: 'var(--primary-dark)', fontWeight: 800 }}>{editId ? 'Edit Room Details' : `Add Room${selectedHotel ? ` — ${selectedHotel.name}` : ''}`}</h3>
                        <button className="icon-btn" onClick={() => setShowForm(false)}>✕</button>
                    </div>
                    <div className="mgr-card-body">
                        {msg && <div className={`mgr-alert ${msg.startsWith('✅') ? 'alert-success' : 'alert-danger'}`}>{msg}</div>}
                        <form onSubmit={handleSubmit}>
                            <div className="mgr-form-grid">
                                <div className="mgr-form-group">
                                    <label>Room Name *</label>
                                    <input className="mgr-input" placeholder="e.g. Ocean Suite" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
                                </div>
                                <div className="mgr-form-group">
                                    <label>Room Type *</label>
                                    <select className="mgr-input" value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}>
                                        {ROOM_TYPES.map(t => <option key={t}>{t}</option>)}
                                    </select>
                                </div>
                                <div className="mgr-form-group">
                                    <label>Price/Night (₹) *</label>
                                    <input className="mgr-input" type="number" value={form.pricePerNight} onChange={e => setForm({ ...form, pricePerNight: e.target.value })} required />
                                </div>
                                <div className="mgr-form-group">
                                    <label>Max Guests *</label>
                                    <input className="mgr-input" type="number" min="1" value={form.maxGuests} onChange={e => setForm({ ...form, maxGuests: e.target.value })} required />
                                </div>
                                <div className="mgr-form-group">
                                    <label>Total Room Count</label>
                                    <input className="mgr-input" type="number" min="1" value={form.totalRoomCount} onChange={e => setForm({ ...form, totalRoomCount: e.target.value })} />
                                </div>
                                <div className="mgr-form-group">
                                    <label>Weekend Price Multiplier</label>
                                    <input className="mgr-input" type="number" step="0.1" min="1" max="3" value={form.weekendPriceMultiplier} onChange={e => setForm({ ...form, weekendPriceMultiplier: e.target.value })} />
                                </div>
                                <div className="mgr-form-group span-2" style={{ background: 'var(--bg)', padding: '16px', borderRadius: '12px', border: '1px solid var(--border)' }}>
                                    <label>Room Images</label>
                                    <div style={{ display: 'flex', gap: '12px', marginBottom: '8px' }}>
                                        <div style={{ flex: 1 }}>
                                            <input className="mgr-input" placeholder="Paste Image URLs (comma-separated)..." value={form.images} onChange={e => setForm({ ...form, images: e.target.value })} />
                                        </div>
                                        <div>
                                            <input type="file" id="room-img-upload" style={{ display: 'none' }} onChange={handleImageUpload} accept="image/*" multiple />
                                            <label htmlFor="room-img-upload" className="mgr-btn mgr-btn-outline" style={{ cursor: 'pointer', height: '100%' }}>
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
                                    <label>Room Amenities (Visual identification for accessibility)</label>
                                    <div className="amenity-section-container" style={{ background: 'var(--primary-light)', padding: '24px', borderRadius: '16px', marginTop: '8px' }}>
                                        <div className="amenity-grid">
                                            {ROOM_AMENITIES.map(a => (
                                                <label key={a} className={`amenity-chip ${form.amenities?.includes(a) ? 'selected' : ''}`}>
                                                    <input type="checkbox" checked={form.amenities?.includes(a) || false} onChange={() => toggleAmenity(a)} />
                                                    <span className="chip-icon">{AMENITY_ICONS[a] || <FaCheck />}</span>
                                                    <span>{a}</span>
                                                </label>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="flex-gap mt-16">
                                <button type="submit" className="mgr-btn mgr-btn-primary" disabled={saving}>{saving ? 'Saving...' : editId ? 'Update' : 'Add Room'}</button>
                                <button type="button" className="mgr-btn mgr-btn-outline" onClick={() => setShowForm(false)}>Cancel</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Room Table */}
            <div className="mgr-card">
                <div className="mgr-card-header">
                    <h3>Room Inventory {selectedHotel ? `— ${selectedHotel.name}` : '(All Hotels)'}</h3>
                    <span className="badge badge-blue">{hotelRooms.length} Rooms</span>
                </div>
                {hotelRooms.length === 0 ? (
                    <div className="mgr-empty"><div className="empty-icon">🛏️</div><p>No rooms yet. Add your first room!</p></div>
                ) : (
                    <div className="room-cards-grid" style={{ padding: '20px' }}>
                        {hotelRooms.map(r => (
                            <div key={r._id} className="room-card-item">
                                {r.images?.[0]
                                    ? <img src={r.images[0]} alt={r.name} className="room-card-img" onError={e => e.target.style.display='none'} referrerPolicy="no-referrer" />
                                    : <div className="room-card-img-placeholder"><i className="fas fa-bed"></i></div>
                                }
                                <div className="room-card-body">
                                    <div style={{display:'flex', justifyContent:'space-between', alignItems:'start'}}>
                                        <span className="room-card-name" style={{ flex: 1, marginRight: '10px' }}>{r.name}</span>
                                        <div style={{display:'flex', gap:'8px'}}>
                                            <button className="icon-btn edit" onClick={() => openEdit(r)} style={{ padding: '6px', background: 'none' }} title="Edit"><i className="fas fa-pen" style={{ color: 'var(--primary)', fontSize: '1rem' }}></i></button>
                                            <button className="icon-btn del" onClick={() => handleDelete(r._id)} style={{ padding: '6px', background: 'none' }} title="Delete"><i className="fas fa-trash" style={{ color: 'var(--danger)', fontSize: '1rem' }}></i></button>
                                        </div>
                                    </div>
                                    <div className="room-card-price" style={{ color: 'var(--primary)' }}>₹{r.pricePerNight?.toLocaleString()} <span>/ night</span></div>
                                    <div className="room-card-meta">
                                        <span><i className="fas fa-users"></i> Up to {r.maxGuests} Guests</span>
                                        <span><i className="fas fa-door-closed"></i> {r.roomNumbers?.length || 0} Units Available</span>
                                        
                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '14px', paddingTop: '14px', borderTop: '1px solid #f1f5f9' }}>
                                            <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                                                <strong>{r.weekendPriceMultiplier || 1}×</strong> Wknd
                                            </span>
                                            <select className="status-select" value={r.status || 'Available'} onChange={e => handleStatusChange(r._id, e.target.value)}>
                                                <option>Available</option>
                                                <option>Maintenance</option>
                                                <option>Blocked</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default ManagerRooms;
