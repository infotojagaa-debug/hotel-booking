import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import API, { BACKEND_URL } from '../utils/api';
import { AuthContext } from '../context/AuthContext';
import './MobileManagerDashboard.css';
import { 
    BarChart, Bar, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid 
} from 'recharts';


const MobileManagerDashboard = () => {
    const { userInfo, logout } = useContext(AuthContext);
    const navigate = useNavigate();

    // --- State ---
    const [activeTab, setActiveTab] = useState('overview');
    const [loading, setLoading] = useState(true);
    const [analytics, setAnalytics] = useState(null);
    const [hotels, setHotels] = useState([]);
    const [selectedHotel, setSelectedHotel] = useState(null);
    const [rooms, setRooms] = useState([]);
    const [reservations, setReservations] = useState([]);
    const [reviews, setReviews] = useState([]);
    const [offers, setOffers] = useState([]);
    const [notifications, setNotifications] = useState([]);
    
    // --- New Form States ---
    const [showAddHotel, setShowAddHotel] = useState(false);
    const [showAddRoom, setShowAddRoom] = useState(false);
    const [editingId, setEditingId] = useState(null); // Used for both Hotel and Room editing
    const [submitting, setSubmitting] = useState(false);
    const [hotelForm, setHotelForm] = useState({
        name: '', city: '', address: '', description: '', type: 'Hotel', starRating: 3, cheapestPrice: '', amenities: []
    });
    const [roomForm, setRoomForm] = useState({
        name: '', type: 'Classic Room', pricePerNight: '', maxGuests: 2, description: '', totalRoomCount: 1, amenities: []
    });
    const [previewImage, setPreviewImage] = useState(null);
    const [selectedImageFile, setSelectedImageFile] = useState(null);
    const [showAddOffer, setShowAddOffer] = useState(false);
    const [offerForm, setOfferForm] = useState({
        code: '', title: '', description: '', discountType: 'Percentage', discountValue: '', validFrom: '', validTo: ''
    });
    
    // --- Config ---
    const TABS = [
        { id: 'overview', label: 'Dashboard', icon: 'fa-chart-pie' },
        { id: 'hotels', label: 'Properties', icon: 'fa-building' },
        { id: 'rooms', label: 'Inventory', icon: 'fa-bed' },
        { id: 'availability', label: 'Pricing', icon: 'fa-calendar-alt' },
        { id: 'bookings', label: 'Bookings', icon: 'fa-clipboard-list' },
        { id: 'reports', label: 'Reports', icon: 'fa-file-invoice-dollar' },
        { id: 'reviews', label: 'Reviews', icon: 'fa-star' },
        { id: 'offers', label: 'Offers', icon: 'fa-tag' },
        { id: 'notifications', label: 'Alerts', icon: 'fa-bell' },
        { id: 'profile', label: 'Profile', icon: 'fa-user-circle' },
    ];

    const formatCurrency = (amt) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amt || 0);

    // --- Lifecycle ---
    useEffect(() => {
        document.body.classList.add('mobile-app-active');
        fetchAll();
        return () => document.body.classList.remove('mobile-app-active');
    }, []);

    const fetchAll = async () => {
        try {
            setLoading(true);
            const [ana, hot, res, rev, off, notif] = await Promise.all([
                API.get('/manager/analytics'),
                API.get('/manager/hotels'),
                API.get('/manager/reservations'),
                API.get('/manager/reviews'),
                API.get('/manager/offers'),
                API.get('/manager/notifications'),
            ]);
            setAnalytics(ana.data);
            setHotels(hot.data);
            setReservations(res.data);
            setReviews(rev.data);
            setOffers(off.data);
            setNotifications(notif.data);

            if (hot.data.length > 0) {
                const first = hot.data[0];
                setSelectedHotel(first);
                fetchRooms(first._id);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const fetchRooms = async (hotelId) => {
        try {
            const { data } = await API.get(`/manager/rooms${hotelId ? `?hotelId=${hotelId}` : ''}`);
            setRooms(data);
        } catch {}
    };

    const handleAddHotel = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            let imageUrl = hotelForm.images?.[0] || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80';
            if (selectedImageFile) {
                const formData = new FormData();
                formData.append('image', selectedImageFile);
                const { data } = await API.post('/upload', formData);
                imageUrl = data.url;
            }
            
            const payload = { 
                ...hotelForm, 
                images: [imageUrl], 
                isApproved: true,
                starRating: Number(hotelForm.starRating),
                cheapestPrice: Number(hotelForm.cheapestPrice)
            };
            
            if (editingId) {
                await API.put(`/manager/hotels/${editingId}`, payload);
            } else {
                await API.post('/manager/hotels', payload);
            }

            setShowAddHotel(false);
            setEditingId(null);
            setHotelForm({ name: '', city: '', address: '', description: '', type: 'Hotel', starRating: 3, cheapestPrice: '', amenities: [] });
            setPreviewImage(null);
            fetchAll();
        } catch (err) { alert(err.response?.data?.message || 'Failed to save hotel'); }
        finally { setSubmitting(false); }
    };

    const handleAddRoom = async (e) => {
        e.preventDefault();
        if (!selectedHotel && !editingId) return alert('Select a hotel first');
        setSubmitting(true);
        try {
            let imageUrl = roomForm.images?.[0] || 'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=800&q=80';
            if (selectedImageFile) {
                const formData = new FormData();
                formData.append('image', selectedImageFile);
                const { data } = await API.post('/upload', formData);
                imageUrl = data.url;
            }
            
            const payload = { 
                ...roomForm, 
                images: [imageUrl], 
                pricePerNight: Number(roomForm.pricePerNight),
                maxGuests: Number(roomForm.maxGuests),
                totalRoomCount: Number(roomForm.totalRoomCount)
            };

            if (editingId) {
                await API.put(`/manager/rooms/${editingId}`, payload);
            } else {
                payload.hotelId = selectedHotel._id;
                await API.post('/manager/rooms', payload);
            }

            setShowAddRoom(false);
            setEditingId(null);
            setRoomForm({ name: '', type: 'Classic Room', pricePerNight: '', maxGuests: 2, description: '', totalRoomCount: 1, amenities: [] });
            setPreviewImage(null);
            fetchAll();
        } catch (err) { alert(err.response?.data?.message || 'Failed to save room'); }
        finally { setSubmitting(false); }
    };

    const handleDeleteHotel = async (id) => {
        if (!window.confirm('Delete this hotel and all its rooms?')) return;
        try {
            await API.delete(`/manager/hotels/${id}`);
            fetchAll();
        } catch { alert('Delete failed'); }
    };

    const handleDeleteRoom = async (id) => {
        if (!window.confirm('Delete this room?')) return;
        try {
            await API.delete(`/manager/rooms/${id}`);
            fetchAll();
        } catch { alert('Delete failed'); }
    };

    const handleToggleRoomStatus = async (id, current) => {
        const statuses = ['Available', 'Blocked', 'Maintenance'];
        const next = statuses[(statuses.indexOf(current || 'Available') + 1) % statuses.length];
        try {
            await API.put(`/manager/rooms/${id}`, { status: next });
            fetchAll();
        } catch { alert('Update failed'); }
    };

    const handleAddOffer = async (e) => {
        e.preventDefault();
        if (!hotels.length) return alert('No property to link offer to');
        setSubmitting(true);
        try {
            await API.post('/manager/offers', { ...offerForm, hotel: selectedHotel?._id || hotels[0]._id });
            setShowAddOffer(false);
            setOfferForm({ code: '', title: '', description: '', discountType: 'Percentage', discountValue: '', validFrom: '', validTo: '' });
            fetchAll();
        } catch (err) { alert(err.response?.data?.message || 'Failed to add offer'); }
        finally { setSubmitting(false); }
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setSelectedImageFile(file);
            setPreviewImage(URL.createObjectURL(file));
        }
    };

    const handleEditHotelClick = (h) => {
        setHotelForm({ ...h });
        setEditingId(h._id);
        setPreviewImage(h.images?.[0] || null);
        setShowAddHotel(true);
    };

    const handleEditRoomClick = (r) => {
        setRoomForm({ ...r });
        setEditingId(r._id);
        setPreviewImage(r.images?.[0] || null);
        setShowAddRoom(true);
    };

    const handleBackClick = () => {
        if (showAddHotel || showAddRoom || showAddOffer) {
            setShowAddHotel(false);
            setShowAddRoom(false);
            setShowAddOffer(false);
            setEditingId(null);
        } else if (activeTab === 'rooms' || activeTab === 'availability') {
            setActiveTab('hotels');
        } else if (activeTab !== 'overview') {
            setActiveTab('overview');
        } else {
            navigate('/dashboard'); // Go to general dashboard or home instead of login
        }
    };

    if (loading) return <div className="mob-admin-loading"><div className="mob-spinner"></div></div>;

    // --- Tab Renderers ---

    const renderOverview = () => (
        <div className="mob-mgr-pane">
            <div className="mob-adm-stats-grid">
                {[
                    { label: 'Revenue', val: formatCurrency(analytics?.netEarnings || 0), color: '#6366f1', icon: 'fa-wallet' },
                    { label: 'Occupancy', val: `${analytics?.occupancyRate || 0}%`, color: '#10b981', icon: 'fa-house-user' },
                    { label: 'Active Bookings', val: analytics?.totalBookings || 0, color: '#f59e0b', icon: 'fa-clipboard-check' },
                    { label: 'Total Rooms', val: analytics?.totalRooms || 0, color: '#ec4899', icon: 'fa-bed' },
                ].map(s => (
                    <div key={s.label} className="mob-adm-stat-c">
                        <i className={`fas ${s.icon}`} style={{color: s.color}}></i>
                        <span className="mob-st-val">{s.val}</span>
                        <span className="mob-st-lab">{s.label}</span>
                    </div>
                ))}
            </div>

            <div className="mob-adm-card">
                <h3>Recent Reservations</h3>
                <div className="mob-activity-list">
                    {reservations.slice(0, 5).map(r => (
                        <div key={r._id} className="mob-act-item">
                            <div className="mob-act-dot"></div>
                            <div className="mob-act-tx">
                                <strong>{r.user?.name || 'Guest'}</strong>
                                <span>{r.room?.name}</span>
                            </div>
                            <div className="mob-act-pr">{formatCurrency(r.managerEarnings)}</div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );

    const renderInventory = () => (
        <div className="mob-mgr-pane">
            <div className="mob-sec-hdr">
                <h3>Room Inventory</h3>
                <button className="mob-add-btn" onClick={() => { setRoomForm({ name: '', type: 'Classic Room', pricePerNight: '', maxGuests: 2, description: '', totalRoomCount: 1, amenities: [] }); setShowAddRoom(true); }}>+ Add Room</button>
            </div>

            <div className="mob-property-selector">
                <label>SELECT PROPERTY</label>
                <div className="mob-chip-row">
                    {hotels.map(h => (
                        <button 
                            key={h._id} 
                            className={`mob-prop-chip ${selectedHotel?._id === h._id ? 'active' : ''}`}
                            onClick={() => { setSelectedHotel(h); fetchRooms(h._id); }}
                        >
                            {h.name}
                        </button>
                    ))}
                </div>
            </div>

            <h4 className="mob-inv-sub">Room Inventory — {selectedHotel?.name || 'Select a property'}</h4>

            {rooms.length === 0 ? (
                <div className="mob-empty-state">
                    <i className="fa fa-bed"></i>
                    <p>No rooms found for {selectedHotel?.name}</p>
                </div>
            ) : rooms.map(r => (
                <div key={r._id} className="mob-adm-card room-inv-c">
                    <div className="rm-inv-top">
                        <div className="rm-inv-info">
                            <strong>{r.name}</strong>
                            <div className="flex items-center gap-2">
                                <span className={`rm-st ${r.status?.toLowerCase()}`}>{r.status || 'Available'}</span>
                                <button className="mob-cycle-btn" onClick={(e) => { e.stopPropagation(); handleToggleRoomStatus(r._id, r.status); }}>
                                    <i className="fa fa-sync-alt"></i>
                                </button>
                            </div>
                        </div>
                        <div className="rm-inv-actions">
                            <button className="mob-icon-btn edit" onClick={(e) => { e.stopPropagation(); handleEditRoomClick(r); }}><i className="fa fa-pencil-alt"></i></button>
                            <button className="mob-icon-btn del" onClick={(e) => { e.stopPropagation(); handleDeleteRoom(r._id); }}><i className="fa fa-trash-alt"></i></button>
                        </div>
                    </div>
                    <div className="rm-inv-meta">
                        <span><i className="fa fa-users"></i> {r.maxGuests} Guests</span>
                        <span><i className="fa fa-tag"></i> {formatCurrency(r.pricePerNight)}</span>
                    </div>
                </div>
            ))}
        </div>
    );

    const renderBookings = () => (
        <div className="mob-mgr-pane">
            <div className="mob-sec-hdr">
                <h3>Reservations</h3>
            </div>
            {reservations.map(r => (
                <div key={r._id} className="mob-adm-card bkg-card">
                    <div className="bkg-c-hdr">
                        <span className="bkg-id">#{r._id.slice(-6).toUpperCase()}</span>
                        <select 
                            className={`bkg-st-sel ${r.status.toLowerCase()}`}
                            value={r.status}
                            onChange={(e) => handleStatusChange(r._id, e.target.value)}
                        >
                            <option>Pending</option>
                            <option>Confirmed</option>
                            <option>Checked-In</option>
                            <option>Checked-Out</option>
                            <option>Cancelled</option>
                        </select>
                    </div>
                    <div className="bkg-c-line"><strong>Guest:</strong> {r.user?.name}</div>
                    <div className="bkg-c-line"><strong>Stay:</strong> {new Date(r.checkInDate).toLocaleDateString()} - {new Date(r.checkOutDate).toLocaleDateString()}</div>
                    <div className="bkg-c-footer">
                        <strong>{formatCurrency(r.managerEarnings)}</strong>
                        <small className={r.paymentStatus === 'Paid' ? 'text-green-600' : 'text-amber-600'}>{r.paymentStatus}</small>
                    </div>
                </div>
            ))}
        </div>
    );

    return (
        <div className="mob-admin-root">
            {/* Header */}
            <header className="mob-adm-header">
                <div className="mob-adm-top">
                    <div className="mob-header-left">
                        <button className="mob-back-btn" onClick={handleBackClick}>
                            <i className="fas fa-chevron-left"></i>
                        </button>
                        <div className="mob-adm-logo">
                            <div className="mob-mgr-avatar">
                                {userInfo?.name?.substring(0, 1) || 'M'}
                            </div>
                            <div className="mob-mgr-meta">
                                <span>{userInfo?.name || 'Manager'}</span>
                                <small>Elite Manager</small>
                            </div>
                        </div>
                    </div>
                    <button className="mob-logout-c" onClick={() => { logout(); navigate('/login'); }}>
                        <i className="fas fa-sign-out-alt"></i>
                    </button>
                </div>

                {/* Scrollable Nav Bar */}
                <div className="mob-adm-nav-scroll">
                    {TABS.map(t => (
                        <button 
                            key={t.id} 
                            className={`mob-nav-tab ${activeTab === t.id ? 'active' : ''}`}
                            onClick={() => setActiveTab(t.id)}
                        >
                            <i className={`fas ${t.icon}`}></i>
                            <span>{t.label}</span>
                        </button>
                    ))}
                </div>
            </header>

            {/* Content Area */}
            <main className="mob-adm-content">
                {/* Context Bar for Rooms/Availability */}
                {(activeTab === 'rooms' || activeTab === 'availability') && selectedHotel && (
                    <div className="mob-ctx-bar">
                        <i className="fa fa-building"></i>
                        <span>Managing <strong>{selectedHotel.name}</strong></span>
                        <button className="mob-st-sw" onClick={() => setActiveTab('hotels')}>Switch</button>
                    </div>
                )}

                {activeTab === 'overview' && renderOverview()}
                {activeTab === 'rooms' && renderInventory()}
                {activeTab === 'bookings' && renderBookings()}
                
                {/* Parity Hub for other sections */}
                {activeTab === 'hotels' && (
                    <div className="mob-mgr-pane">
                        <div className="mob-sec-hdr">
                            <h3>My Properties</h3>
                            <button className="mob-add-btn" onClick={() => setShowAddHotel(true)}>+ Add Hotel</button>
                        </div>
                        {hotels.map(h => (
                            <div key={h._id} className="mob-adm-list-item" onClick={() => { setSelectedHotel(h); fetchRooms(h._id); setActiveTab('rooms'); }}>
                                <div className="mob-li-info">
                                    <strong>{h.name}</strong>
                                    <span>{h.city} · {h.isApproved ? 'Live' : 'Pending'}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button className="mob-icon-btn edit" onClick={(e) => { e.stopPropagation(); handleEditHotelClick(h); }}><i className="fa fa-pencil-alt"></i></button>
                                    <button className="mob-icon-btn del" onClick={(e) => { e.stopPropagation(); handleDeleteHotel(h._id); }}><i className="fa fa-trash-alt"></i></button>
                                    <i className="fa fa-chevron-right text-gray-300 ml-2"></i>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
                
                {activeTab === 'availability' && (
                    <div className="mob-mgr-pane">
                        <h3>Availability Control</h3>
                        <p className="text-gray-500 text-xs mb-4">Porting calendar view to mobile. Use "Inventory" for price checks.</p>
                        {rooms.slice(0, 5).map(r => (
                            <div key={r._id} className="mob-adm-card">
                                <div className="flex justify-between items-center">
                                    <strong>{r.name}</strong>
                                    <span className="text-sm font-bold text-indigo-600">{r.weekendPriceMultiplier}x Wknd</span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {activeTab === 'reports' && (
                    <div className="mob-mgr-pane">
                        <div className="mob-adm-card fin-card">
                            <h3>Financial Performance</h3>
                            <div className="fin-grid">
                                <div className="fin-item"><span>Net Earnings</span><strong>{formatCurrency(analytics?.netEarnings)}</strong></div>
                                <div className="fin-item"><span>Total Revenue</span><strong>{formatCurrency(analytics?.totalRevenue)}</strong></div>
                            </div>
                        </div>

                        {analytics?.monthlyData && (
                            <div className="mob-adm-card">
                                <h3>Monthly Revenue</h3>
                                <div style={{width: '100%', height: 200}}>
                                    <ResponsiveContainer>
                                        <BarChart data={analytics.monthlyData}>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                            <XAxis dataKey="month" hide />
                                            <YAxis hide />
                                            <Tooltip contentStyle={{fontSize: '10px'}} />
                                            <Bar dataKey="revenue" fill="#6d5dfc" radius={[4, 4, 0, 0]} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                        )}
                        
                        <div className="mob-adm-card">
                            <h3>Payment Status</h3>
                            <div className="mob-activity-list">
                                {reservations.filter(r => r.paymentStatus === 'Unpaid').map(r => (
                                    <div key={r._id} className="mob-act-item">
                                        <div className="mob-act-dot bg-amber-400"></div>
                                        <div className="mob-act-tx">
                                            <strong>{r.user?.name}</strong>
                                            <span>Unpaid Stay</span>
                                        </div>
                                        <div className="mob-act-pr text-amber-600">{formatCurrency(r.managerEarnings)}</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'reviews' && (
                    <div className="mob-mgr-pane">
                        <h3>Guest Feedback</h3>
                        {reviews.map(r => (
                            <div key={r._id} className="mob-adm-card">
                                <div className="rev-hdr"><strong>{r.user?.name}</strong> <span>{r.rating}★</span></div>
                                <p className="text-sm my-2 italic">"{r.comment}"</p>
                                <div className={r.managerReply?.text ? 'text-green-600 text-[10px] font-bold' : 'text-amber-600 text-[10px] font-bold'}>
                                    {r.managerReply?.text ? '✓ REPLIED' : '⚠ NEEDS REPLY'}
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {activeTab === 'offers' && (
                    <div className="mob-mgr-pane">
                        <div className="mob-sec-hdr">
                            <h3>Hotel Offers</h3>
                            <button className="mob-add-btn" onClick={() => setShowAddOffer(true)}>+ Add Offer</button>
                        </div>
                        {offers.length === 0 ? (
                            <div className="mob-empty-state">
                                <i className="fa fa-tag"></i>
                                <p>No active offers found</p>
                            </div>
                        ) : (
                            <div className="mob-offers-grid">
                                {offers.map(o => (
                                    <div key={o._id} className="mob-adm-card offer-card">
                                        <div className="off-hdr">
                                            <strong>{o.code}</strong>
                                            <span className="badge-purple">{o.discountType === 'Percentage' ? `${o.discountValue}% OFF` : `₹${o.discountValue} OFF`}</span>
                                        </div>
                                        <p className="text-xs font-bold my-1">{o.title}</p>
                                        <p className="text-[10px] text-gray-500">{o.description}</p>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'notifications' && (
                    <div className="mob-mgr-pane">
                        <h3>Business Alerts</h3>
                        {notifications.map(n => (
                            <div key={n._id} className={`mob-adm-list-item ${n.isRead ? 'opacity-60' : 'border-l-4 border-indigo-600'}`}>
                                <div className="mob-li-info">
                                    <strong className="text-xs">{n.title}</strong>
                                    <span className="text-[10px]">{n.message}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {activeTab === 'profile' && (
                    <div className="mob-mgr-pane">
                        <div className="mob-adm-card text-center">
                            <div className="w-16 h-16 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                                {userInfo?.name?.substring(0, 1)}
                            </div>
                            <h3 className="mb-1">{userInfo?.name}</h3>
                            <p className="text-gray-500 text-sm mb-6">{userInfo?.email}</p>
                            <button className="mob-save-btn bg-red-50 text-red-600" onClick={logout}>Sign Out</button>
                        </div>
                    </div>
                )}

            </main>

            {/* --- ADD OFFER MODAL --- */}
            {showAddOffer && (
                <div className="mob-form-overlay animate-in fade-in slide-in-from-bottom duration-300">
                    <div className="mob-form-hdr">
                        <button className="mob-close-btn" onClick={() => setShowAddOffer(false)}><i className="fa fa-times"></i></button>
                        <h2>Create Offer</h2>
                    </div>
                    <form className="mob-form-body" onSubmit={handleAddOffer}>
                        <div className="mob-input-group">
                            <label>Coupon Code</label>
                            <input type="text" placeholder="e.g. SAVE20" value={offerForm.code} onChange={e => setOfferForm({...offerForm, code: e.target.value.toUpperCase()})} required />
                        </div>
                        <div className="mob-input-group">
                            <label>Offer Title</label>
                            <input type="text" placeholder="e.g. Summer Special" value={offerForm.title} onChange={e => setOfferForm({...offerForm, title: e.target.value})} required />
                        </div>
                        <div className="mob-input-row">
                            <div className="mob-input-group">
                                <label>Type</label>
                                <select value={offerForm.discountType} onChange={e => setOfferForm({...offerForm, discountType: e.target.value})}>
                                    <option value="Percentage">Percentage (%)</option>
                                    <option value="Flat">Flat (₹)</option>
                                </select>
                            </div>
                            <div className="mob-input-group">
                                <label>Value</label>
                                <input type="number" placeholder="20" value={offerForm.discountValue} onChange={e => setOfferForm({...offerForm, discountValue: e.target.value})} required />
                            </div>
                        </div>
                        <div className="mob-input-group">
                            <label>Valid From</label>
                            <input type="date" value={offerForm.validFrom} onChange={e => setOfferForm({...offerForm, validFrom: e.target.value})} required />
                        </div>
                        <div className="mob-input-group">
                            <label>Valid To</label>
                            <input type="date" value={offerForm.validTo} onChange={e => setOfferForm({...offerForm, validTo: e.target.value})} required />
                        </div>
                        <div className="mob-input-group">
                            <label>Description</label>
                            <textarea rows="3" placeholder="Brief details about the offer..." value={offerForm.description} onChange={e => setOfferForm({...offerForm, description: e.target.value})} required></textarea>
                        </div>

                        <div className="mob-form-footer">
                            <button type="submit" className="mob-submit-btn" disabled={submitting}>
                                {submitting ? 'Creating...' : 'Launch Offer'}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* --- ADD HOTEL MODAL --- */}
            {showAddHotel && (
                <div className="mob-form-overlay animate-in fade-in slide-in-from-bottom duration-300">
                    <div className="mob-form-hdr">
                        <button className="mob-close-btn" onClick={() => { setShowAddHotel(false); setEditingId(null); setPreviewImage(null); }}><i className="fa fa-times"></i></button>
                        <h2>{editingId ? 'Edit Property' : 'Register Property'}</h2>
                    </div>
                    <form className="mob-form-body" onSubmit={handleAddHotel}>
                        <div className="mob-input-group">
                            <label>Hotel Name</label>
                            <input type="text" placeholder="e.g. Grand Plaza" value={hotelForm.name} onChange={e => setHotelForm({...hotelForm, name: e.target.value})} required />
                        </div>
                        <div className="mob-input-row">
                            <div className="mob-input-group">
                                <label>City</label>
                                <input type="text" placeholder="Mumbai" value={hotelForm.city} onChange={e => setHotelForm({...hotelForm, city: e.target.value})} required />
                            </div>
                            <div className="mob-input-group">
                                <label>Type</label>
                                <select value={hotelForm.type} onChange={e => setHotelForm({...hotelForm, type: e.target.value})}>
                                    <option>Hotel</option><option>Apartment</option><option>Resort</option><option>Villa</option>
                                </select>
                            </div>
                        </div>
                        <div className="mob-input-group">
                            <label>Full Address</label>
                            <input type="text" placeholder="123 Street, Area..." value={hotelForm.address} onChange={e => setHotelForm({...hotelForm, address: e.target.value})} required />
                        </div>
                        <div className="mob-input-group">
                            <label>Starting Price (₹)</label>
                            <input type="number" placeholder="2500" value={hotelForm.cheapestPrice} onChange={e => setHotelForm({...hotelForm, cheapestPrice: e.target.value})} required />
                        </div>
                        <div className="mob-input-group">
                            <label>Description</label>
                            <textarea rows="3" placeholder="Describe your property..." value={hotelForm.description} onChange={e => setHotelForm({...hotelForm, description: e.target.value})} required></textarea>
                        </div>
                        
                        <div className="mob-amenity-pick">
                            <label>Property Amenities</label>
                            <div className="mob-amenity-grid">
                                {[
                                    {id: 'WiFi', icon: 'fa-wifi'}, {id: 'Breakfast', icon: 'fa-coffee'}, 
                                    {id: 'Restaurant', icon: 'fa-utensils'}, {id: 'Pool', icon: 'fa-swimming-pool'}, 
                                    {id: 'Gym', icon: 'fa-dumbbell'}, {id: 'Parking', icon: 'fa-car'}, 
                                    {id: 'AC', icon: 'fa-snowflake'}, {id: 'Spa', icon: 'fa-spa'}, 
                                    {id: 'Pet-friendly', icon: 'fa-paw'}, {id: 'TV', icon: 'fa-tv'}
                                ].map(a => (
                                    <div key={a.id} className={`mob-amenity-chip ${hotelForm.amenities?.includes(a.id) ? 'active' : ''}`} 
                                         onClick={() => {
                                             const curr = hotelForm.amenities || [];
                                             setHotelForm({...hotelForm, amenities: curr.includes(a.id) ? curr.filter(x => x !== a.id) : [...curr, a.id]})
                                         }}>
                                        <i className={`fa ${a.icon}`}></i>
                                        <span>{a.id}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                        
                        <div className="mob-img-upload-c">
                            <label>Property Photo</label>
                            <div className="mob-img-preview" onClick={() => document.getElementById('hotel-file').click()}>
                                {previewImage ? (
                                    <img src={previewImage} alt="Preview" />
                                ) : (
                                    <div className="mob-img-placeholder"><i className="fa fa-camera"></i><span>Tap to upload</span></div>
                                )}
                            </div>
                            <input type="file" id="hotel-file" hidden onChange={handleFileChange} accept="image/*" />
                        </div>

                        <div className="mob-form-footer">
                            <button type="submit" className="mob-submit-btn" disabled={submitting}>
                                {submitting ? 'Registering...' : 'Register Property'}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* --- ADD ROOM MODAL --- */}
            {showAddRoom && (
                <div className="mob-form-overlay animate-in fade-in slide-in-from-bottom duration-300">
                    <div className="mob-form-hdr">
                        <button className="mob-close-btn" onClick={() => { setShowAddRoom(false); setEditingId(null); setPreviewImage(null); }}><i className="fa fa-times"></i></button>
                        <h2>{editingId ? 'Edit Room' : (selectedHotel ? `Add Room to ${selectedHotel.name.substring(0, 15)}...` : 'Add Room')}</h2>
                    </div>
                    <form className="mob-form-body" onSubmit={handleAddRoom}>
                        <div className="mob-input-group">
                            <label>Room Name</label>
                            <input type="text" placeholder="e.g. Deluxe Suite" value={roomForm.name} onChange={e => setRoomForm({...roomForm, name: e.target.value})} required />
                        </div>
                        <div className="mob-input-row">
                            <div className="mob-input-group">
                                <label>Price (₹)</label>
                                <input type="number" placeholder="1500" value={roomForm.pricePerNight} onChange={e => setRoomForm({...roomForm, pricePerNight: e.target.value})} required />
                            </div>
                            <div className="mob-input-group">
                                <label>Max Guests</label>
                                <input type="number" value={roomForm.maxGuests} onChange={e => setRoomForm({...roomForm, maxGuests: e.target.value})} required />
                            </div>
                        </div>
                        <div className="mob-input-group">
                            <label>Type</label>
                            <select value={roomForm.type} onChange={e => setRoomForm({...roomForm, type: e.target.value})}>
                                <option>Classic Room</option><option>Deluxe Room</option><option>Suite</option><option>Double Room</option>
                            </select>
                        </div>
                        <div className="mob-input-group">
                            <label>Description</label>
                            <textarea rows="3" placeholder="Room details..." value={roomForm.description} onChange={e => setRoomForm({...roomForm, description: e.target.value})} required></textarea>
                        </div>

                        <div className="mob-amenity-pick">
                            <label>Room Amenities</label>
                            <div className="mob-amenity-grid">
                                {[
                                    {id: 'WiFi', icon: 'fa-wifi'}, {id: 'AC', icon: 'fa-snowflake'}, 
                                    {id: 'TV', icon: 'fa-tv'}, {id: 'Mini Bar', icon: 'fa-cocktail'}, 
                                    {id: 'Balcony', icon: 'fa-border-none'}, {id: 'King Bed', icon: 'fa-bed'}, 
                                    {id: 'Sea View', icon: 'fa-water'}, {id: 'Hot Tub', icon: 'fa-hot-tub'}, 
                                    {id: 'Safe', icon: 'fa-lock'}, {id: 'Work Desk', icon: 'fa-briefcase'}
                                ].map(a => (
                                    <div key={a.id} className={`mob-amenity-chip ${roomForm.amenities?.includes(a.id) ? 'active' : ''}`} 
                                         onClick={() => {
                                             const curr = roomForm.amenities || [];
                                             setRoomForm({...roomForm, amenities: curr.includes(a.id) ? curr.filter(x => x !== a.id) : [...curr, a.id]})
                                         }}>
                                        <i className={`fa ${a.icon}`}></i>
                                        <span>{a.id}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="mob-img-upload-c">
                            <label>Room Photo</label>
                            <div className="mob-img-preview" onClick={() => document.getElementById('room-file').click()}>
                                {previewImage ? (
                                    <img src={previewImage} alt="Preview" />
                                ) : (
                                    <div className="mob-img-placeholder"><i className="fa fa-camera"></i><span>Tap to upload</span></div>
                                )}
                            </div>
                            <input type="file" id="room-file" hidden onChange={handleFileChange} accept="image/*" />
                        </div>

                        <div className="mob-form-footer">
                            <button type="submit" className="mob-submit-btn" disabled={submitting}>
                                {submitting ? 'Adding Room...' : 'Confirm Room'}
                            </button>
                        </div>
                    </form>
                </div>
            )}
        </div>
    );
};

export default MobileManagerDashboard;

