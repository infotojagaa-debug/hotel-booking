import React, { useState } from 'react';
import API from '../../utils/api';

const DAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

const ManagerAvailability = ({ rooms, hotels, selectedHotel, onSelectHotel }) => {
    const [selectedRoom, setSelectedRoom] = useState(null);
    const [month, setMonth] = useState(new Date());
    const [selectedDates, setSelectedDates] = useState([]);
    const [weekendMult, setWeekendMult] = useState('');
    const [saving, setSaving] = useState(false);
    const [msg, setMsg] = useState('');

    const hotelRooms = selectedHotel ? rooms.filter(r => r.hotel?._id === selectedHotel._id || r.hotel === selectedHotel._id) : [];

    const getDaysInMonth = (date) => {
        const y = date.getFullYear(), m = date.getMonth();
        const first = new Date(y, m, 1).getDay();
        const total = new Date(y, m + 1, 0).getDate();
        const days = [];
        for (let i = 0; i < first; i++) days.push(null);
        for (let d = 1; d <= total; d++) days.push(new Date(y, m, d));
        return days;
    };

    const toggleDate = (date) => {
        if (!date) return;
        const key = date.toDateString();
        setSelectedDates(prev => prev.includes(key) ? prev.filter(d => d !== key) : [...prev, key]);
    };

    const isBlocked = (date) => {
        if (!date || !selectedRoom) return false;
        return selectedRoom.blockedDates?.some(d => new Date(d).toDateString() === date.toDateString());
    };

    const isSelected = (date) => date && selectedDates.includes(date.toDateString());

    const handleBlock = async () => {
        if (!selectedRoom || selectedDates.length === 0) return;
        setSaving(true);
        try {
            await API.put(`/manager/rooms/${selectedRoom._id}/block`, { dates: selectedDates.map(d => new Date(d)) });
            setMsg('✅ Dates blocked!');
            setSelectedDates([]);
            // Refresh room data by reloading
            setTimeout(() => setMsg(''), 2000);
        } catch { setMsg('❌ Failed to block dates'); }
        setSaving(false);
    };

    const handleUnblock = async () => {
        if (!selectedRoom || selectedDates.length === 0) return;
        setSaving(true);
        try {
            await API.put(`/manager/rooms/${selectedRoom._id}/unblock`, { dates: selectedDates.map(d => new Date(d)) });
            setMsg('✅ Dates unblocked!');
            setSelectedDates([]);
            setTimeout(() => setMsg(''), 2000);
        } catch { setMsg('❌ Failed to unblock dates'); }
        setSaving(false);
    };

    const handleWeekendUpdate = async () => {
        if (!selectedRoom || !weekendMult) return;
        try {
            await API.put(`/manager/rooms/${selectedRoom._id}`, { weekendPriceMultiplier: parseFloat(weekendMult) });
            setMsg('✅ Weekend pricing updated!');
            setTimeout(() => setMsg(''), 2000);
        } catch { setMsg('❌ Failed'); }
    };

    const prevMonth = () => { const d = new Date(month); d.setMonth(d.getMonth() - 1); setMonth(d); };
    const nextMonth = () => { const d = new Date(month); d.setMonth(d.getMonth() + 1); setMonth(d); };
    const days = getDaysInMonth(month);

    return (
        <div>
            <div className="mgr-section-title mb-16">📅 Availability & Pricing</div>

            {/* Hotel Selector */}
            <div className="mgr-card mgr-section">
                <div className="mgr-card-body" style={{ padding: '12px 16px' }}>
                    <div style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 8 }}>SELECT HOTEL</div>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: hotelRooms.length ? 12 : 0 }}>
                        {hotels.map(h => (
                            <button key={h._id} onClick={() => { onSelectHotel(h); setSelectedRoom(null); }}
                                className={`mgr-btn mgr-btn-sm ${selectedHotel?._id === h._id ? 'mgr-btn-primary' : 'mgr-btn-outline'}`}>
                                {h.name}
                            </button>
                        ))}
                    </div>
                    {hotelRooms.length > 0 && (
                        <>
                            <div style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 8 }}>SELECT ROOM</div>
                            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                                {hotelRooms.map(r => (
                                    <button key={r._id} onClick={() => setSelectedRoom(r)}
                                        className={`mgr-btn mgr-btn-sm ${selectedRoom?._id === r._id ? 'mgr-btn-primary' : 'mgr-btn-outline'}`}>
                                        {r.name}
                                    </button>
                                ))}
                            </div>
                        </>
                    )}
                </div>
            </div>

            {msg && <div style={{ margin: '0 0 16px', padding: '10px 14px', borderRadius: 8, background: msg.startsWith('✅') ? 'var(--success-light)' : 'var(--danger-light)', color: msg.startsWith('✅') ? '#065f46' : '#991b1b', fontSize: '0.85rem', fontWeight: 600 }}>{msg}</div>}

            {selectedRoom ? (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 20 }}>
                    {/* Calendar */}
                    <div className="mgr-card">
                        <div className="mgr-card-header">
                            <h3>📆 {selectedRoom.name} — Availability Calendar</h3>
                        </div>
                        <div className="mgr-card-body">
                            {/* Legend */}
                            <div className="flex-gap" style={{ marginBottom: 16, flexWrap: 'wrap' }}>
                                {[['var(--danger-light)', 'var(--danger)', '🔴 Blocked'], ['var(--warning-light)', 'var(--warning)', '🟡 Booked'], ['var(--primary)', '#fff', '🔵 Selected'], ['#fff', 'var(--text-primary)', '⬜ Available']].map(([bg, color, label]) => (
                                    <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.75rem' }}>
                                        <div style={{ width: 14, height: 14, borderRadius: 3, background: bg, border: '1px solid var(--border)' }} />
                                        {label}
                                    </div>
                                ))}
                            </div>

                            {/* Month nav */}
                            <div className="cal-header">
                                <button className="mgr-btn mgr-btn-outline mgr-btn-sm" onClick={prevMonth}>‹</button>
                                <strong>{month.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}</strong>
                                <button className="mgr-btn mgr-btn-outline mgr-btn-sm" onClick={nextMonth}>›</button>
                            </div>

                            <div className="cal-grid">
                                {DAYS.map(d => <div key={d} className="cal-day-label">{d}</div>)}
                                {days.map((day, i) => (
                                    <div key={i}
                                        className={`cal-day ${!day ? 'empty' : isSelected(day) ? 'selected-block' : isBlocked(day) ? 'blocked' : ''}`}
                                        onClick={() => day && toggleDate(day)}>
                                        {day?.getDate()}
                                    </div>
                                ))}
                            </div>

                            <div className="flex-gap" style={{ marginTop: 16 }}>
                                <button className="mgr-btn mgr-btn-danger mgr-btn-sm" onClick={handleBlock} disabled={saving || !selectedDates.length}>
                                    🔒 Block Selected ({selectedDates.length})
                                </button>
                                <button className="mgr-btn mgr-btn-success mgr-btn-sm" onClick={handleUnblock} disabled={saving || !selectedDates.length}>
                                    🔓 Unblock Selected
                                </button>
                                {selectedDates.length > 0 && (
                                    <button className="mgr-btn mgr-btn-outline mgr-btn-sm" onClick={() => setSelectedDates([])}>Clear</button>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Pricing Panel */}
                    <div>
                        <div className="mgr-card mgr-section">
                            <div className="mgr-card-header"><h3>💰 Dynamic Pricing</h3></div>
                            <div className="mgr-card-body">
                                <div style={{ marginBottom: 12 }}>
                                    <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: 4 }}>Base Price</div>
                                    <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-primary)' }}>₹{selectedRoom.pricePerNight?.toLocaleString()}/night</div>
                                </div>
                                <hr className="divider" />
                                <div className="mgr-form-group" style={{ marginBottom: 12 }}>
                                    <label>Weekend Multiplier (e.g. 1.3 = +30%)</label>
                                    <input className="mgr-input" type="number" step="0.1" min="1" max="5"
                                        placeholder={`Current: ${selectedRoom.weekendPriceMultiplier || 1}×`}
                                        value={weekendMult} onChange={e => setWeekendMult(e.target.value)} />
                                </div>
                                {weekendMult && (
                                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: 10 }}>
                                        Weekend price: ₹{Math.round(selectedRoom.pricePerNight * weekendMult).toLocaleString()}/night
                                    </div>
                                )}
                                <button className="mgr-btn mgr-btn-primary w-100" onClick={handleWeekendUpdate}>Update Pricing</button>
                            </div>
                        </div>

                        <div className="mgr-card">
                            <div className="mgr-card-header"><h3>📊 Room Info</h3></div>
                            <div className="mgr-card-body">
                                {[['Type', selectedRoom.type], ['Max Guests', selectedRoom.maxGuests], ['Total Rooms', selectedRoom.totalRoomCount || 1], ['Status', selectedRoom.status || 'Available'], ['Blocked Dates', (selectedRoom.blockedDates?.length || 0) + ' days']].map(([k, v]) => (
                                    <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border)', fontSize: '0.83rem' }}>
                                        <span style={{ color: 'var(--text-secondary)' }}>{k}</span>
                                        <span style={{ fontWeight: 600 }}>{v}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="mgr-empty"><div className="empty-icon">📅</div><p>Select a hotel and room to manage availability</p></div>
            )}
        </div>
    );
};

export default ManagerAvailability;
