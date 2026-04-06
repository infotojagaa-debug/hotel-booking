import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../utils/api';
import { AuthContext } from '../context/AuthContext';
import './MobileAdminPanel.css';
import { 
    XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area 
} from 'recharts';
import { format, subDays, startOfToday, endOfToday, startOfYesterday, endOfYesterday } from 'date-fns';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

const MobileAdminPanel = () => {
    const { userInfo, logout } = useContext(AuthContext);
    const navigate = useNavigate();

    // --- State ---
    const [analytics, setAnalytics] = useState(null);
    const [hotels, setHotels] = useState([]);
    const [users, setUsers] = useState([]);
    const [bookings, setBookings] = useState([]);
    const [managers, setManagers] = useState([]);
    const [rooms, setRooms] = useState([]);
    const [reviews, setReviews] = useState([]);
    const [offers, setOffers] = useState([]);
    const [settings, setSettings] = useState({ commissionPercentage: 10, taxPercentage: 5, currency: 'INR' });
    
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('analytics');

    // Financial specialized state
    const [finRange, setFinRange] = useState({
        preset: 'last7',
        startDate: subDays(new Date(), 6),
        endDate: new Date()
    });
    const [financials, setFinancials] = useState(null);
    const [finLoading, setFinLoading] = useState(false);

    // Form/Modal States
    const [showHotelForm, setShowHotelForm] = useState(false);
    const [showManagerForm, setShowManagerForm] = useState(false);
    const [newManager, setNewManager] = useState({ name: '', email: '', password: '', phone: '' });
    
    const [selectedHotelForRooms, setSelectedHotelForRooms] = useState(null);
    const [hotelRooms, setHotelRooms] = useState([]);
    const [showAddRoomForm, setShowAddRoomForm] = useState(false);
    const [newRoom, setNewRoom] = useState({ name: '', type: 'Deluxe', pricePerNight: '', maxGuests: 2, description: '', roomNumbers: '' });
    const [roomImageUrl, setRoomImageUrl] = useState('');
    
    const [newOffer, setNewOffer] = useState({ code: '', title: '', description: '', discountType: 'Percentage', discountValue: '', minBookingAmount: '', usageCount: 0, validFrom: '', validTo: '', bannerImage: '', hotel: '' });
    const [editingOffer, setEditingOffer] = useState(null);
    const [submitting, setSubmitting] = useState(false);

    // --- Tab Config ---
    const TABS = [
        { id: 'analytics', label: 'Dashboard', icon: 'fa-chart-line' },
        { id: 'managers', label: 'Staff', icon: 'fa-user-shield' },
        { id: 'hotels', label: 'Hotels', icon: 'fa-building' },
        { id: 'rooms', label: 'Rooms', icon: 'fa-door-open' },
        { id: 'bookings', label: 'Bookings', icon: 'fa-clipboard-list' },
        { id: 'financials', label: 'Finance', icon: 'fa-file-invoice-dollar' },
        { id: 'users', label: 'Customers', icon: 'fa-user-friends' },
        { id: 'offers', label: 'Offers', icon: 'fa-ticket-alt' },
        { id: 'reviews', label: 'Reviews', icon: 'fa-star' },
        { id: 'settings', label: 'Settings', icon: 'fa-sliders-h' },
    ];

    // --- Lifecycle ---
    useEffect(() => {
        document.body.classList.add('mobile-app-active');
        fetchData();
        return () => document.body.classList.remove('mobile-app-active');
    }, []);

    useEffect(() => {
        if (activeTab === 'financials') {
            fetchFinancials();
        }
    }, [finRange.startDate, finRange.endDate, activeTab]);

    const fetchData = async () => {
        try {
            setLoading(true);
            const safe = async (fn) => { try { return await fn(); } catch { return null; } };

            const [ana, hot, usr, bkg, mgr, rm, rev, off, set] = await Promise.all([
                safe(() => API.get('/admin/analytics')),
                safe(() => API.get('/admin/hotels')),
                safe(() => API.get('/admin/users')),
                safe(() => API.get('/admin/bookings')),
                safe(() => API.get('/admin/managers')),
                safe(() => API.get('/admin/rooms')),
                safe(() => API.get('/reviews')),
                safe(() => API.get('/admin/offers')),
                safe(() => API.get('/admin/settings')),
            ]);

            if (ana) { setAnalytics(ana.data); setFinancials(ana.data); }
            if (hot) setHotels(hot.data);
            if (usr) setUsers(usr.data);
            if (bkg) setBookings(bkg.data);
            if (mgr) setManagers(mgr.data);
            if (rm) setRooms(rm.data);
            if (rev) setReviews(rev.data);
            if (off) setOffers(off.data);
            if (set) setSettings(set.data);
        } finally {
            setLoading(false);
        }
    };

    const fetchFinancials = async () => {
        setFinLoading(true);
        try {
            const { data } = await API.get('/admin/analytics', {
                params: {
                    startDate: finRange.startDate.toISOString(),
                    endDate: finRange.endDate.toISOString()
                }
            });
            setFinancials(data);
        } finally {
            setFinLoading(false);
        }
    };

    const handlePresetChange = (preset) => {
        let start = new Date();
        let end = new Date();
        if (preset === 'today') { start = startOfToday(); end = endOfToday(); }
        else if (preset === 'yesterday') { start = startOfYesterday(); end = endOfYesterday(); }
        else if (preset === 'last7') { start = subDays(new Date(), 6); end = new Date(); }
        setFinRange({ ...finRange, preset, startDate: start, endDate: end });
    };

    // --- Actions ---
    const toggleManagerApproval = async (id, currentStatus) => {
        try {
            await API.put(`/admin/managers/${id}/status`, { isApproved: !currentStatus });
            setManagers(managers.map(m => m._id === id ? { ...m, isApproved: !currentStatus } : m));
        } catch { alert('Update failed'); }
    };

    const toggleUserSuspension = async (id, currentStatus) => {
        try {
            await API.put(`/admin/users/${id}/suspend`, { isSuspended: !currentStatus });
            setUsers(users.map(u => u._id === id ? { ...u, isSuspended: !currentStatus } : u));
        } catch { alert('Update failed'); }
    };

    const toggleHotelApproval = async (id, currentStatus) => {
        try {
            await API.put(`/admin/hotels/${id}/approve`, { isApproved: !currentStatus });
            setHotels(hotels.map(h => h._id === id ? { ...h, isApproved: !currentStatus } : h));
        } catch { alert('Update failed'); }
    };

    const deleteOffer = async (id) => {
        if (!window.confirm('Delete offer?')) return;
        try {
            await API.delete(`/admin/offers/${id}`);
            setOffers(offers.filter(o => o._id !== id));
        } catch { alert('Failed'); }
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-IN', { 
            style: 'currency', 
            currency: settings.currency || 'INR', 
            maximumFractionDigits: 0 
        }).format(amount || 0);
    };

    if (loading) return <div className="mob-admin-loading"><div className="mob-spinner"></div></div>;

    // --- Render Helpers ---

    const renderAnalytics = () => (
        <div className="mob-adm-pane">
            <div className="mob-adm-stats-grid">
                {[
                    { label: 'Users', val: analytics?.totalUsers || users.length, color: '#6366f1', icon: 'fa-users' },
                    { label: 'Hotels', val: analytics?.totalHotels || hotels.length, color: '#10b981', icon: 'fa-building' },
                    { label: 'Bookings', val: analytics?.totalBookings || bookings.length, color: '#f59e0b', icon: 'fa-clipboard-list' },
                    { label: 'Revenue', val: formatCurrency(analytics?.totalRevenue || 0), color: '#ec4899', icon: 'fa-rupee-sign' },
                ].map(s => (
                    <div key={s.label} className="mob-adm-stat-c">
                        <i className={`fas ${s.icon}`} style={{color: s.color}}></i>
                        <span className="mob-st-val">{s.val}</span>
                        <span className="mob-st-lab">{s.label}</span>
                    </div>
                ))}
            </div>

            {analytics?.chartData && (
                <div className="mob-adm-card">
                    <h3>7-Day Performance</h3>
                    <div style={{width: '100%', height: 200}}>
                        <ResponsiveContainer>
                            <AreaChart data={analytics.chartData}>
                                <XAxis dataKey="date" hide />
                                <YAxis hide />
                                <Tooltip contentStyle={{fontSize: '10px'}} />
                                <Area type="monotone" dataKey="revenue" stroke="#6d5dfc" fill="#6d5dfc20" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            )}

            <div className="mob-adm-card">
                <h3>Recent Activity</h3>
                <div className="mob-activity-list">
                    {bookings.slice(0, 5).map(b => (
                        <div key={b._id} className="mob-act-item">
                            <div className="mob-act-dot"></div>
                            <div className="mob-act-tx">
                                <strong>{b.user?.name || 'Guest'}</strong>
                                <span>{new Date(b.createdAt).toLocaleDateString()}</span>
                            </div>
                            <div className="mob-act-pr">{formatCurrency(b.totalPrice)}</div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );

    const renderManagers = () => (
        <div className="mob-adm-pane">
            <div className="mob-sec-hdr">
                <h3>System Managers</h3>
                <button className="mob-add-btn" onClick={() => setShowManagerForm(true)}>+ Add</button>
            </div>
            {managers.map(m => (
                <div key={m._id} className="mob-adm-list-item">
                    <div className="mob-li-info">
                        <strong>{m.name}</strong>
                        <span>{m.email}</span>
                    </div>
                    <div className="mob-li-actions">
                        <button 
                            className={`mob-act-btn ${m.isApproved ? 'rev' : 'app'}`}
                            onClick={() => toggleManagerApproval(m._id, m.isApproved)}
                        >
                            {m.isApproved ? 'Revoke' : 'Approve'}
                        </button>
                    </div>
                </div>
            ))}

            {/* Manager Form Modal */}
            {showManagerForm && (
                <div className="mob-adm-overlay">
                    <div className="mob-adm-modal">
                        <div className="mob-mod-hdr">
                            <h3>Add Manager</h3>
                            <button onClick={() => setShowManagerForm(false)}>✕</button>
                        </div>
                        <div className="mob-form-group">
                            <label>Name</label>
                            <input value={newManager.name} onChange={e => setNewManager({...newManager, name: e.target.value})} placeholder="Full Name" />
                        </div>
                        <div className="mob-form-group">
                            <label>Email</label>
                            <input value={newManager.email} onChange={e => setNewManager({...newManager, email: e.target.value})} placeholder="Email" />
                        </div>
                        <div className="mob-form-group">
                            <label>Password</label>
                            <input type="password" value={newManager.password} onChange={e => setNewManager({...newManager, password: e.target.value})} placeholder="Password" />
                        </div>
                        <button className="mob-save-btn" onClick={async () => {
                             try {
                                await API.post('/admin/managers', { ...newManager, role: 'manager', isApproved: true });
                                setShowManagerForm(false);
                                fetchData();
                                alert('Success!');
                             } catch { alert('Failed'); }
                        }}>Create Manager</button>
                    </div>
                </div>
            )}
        </div>
    );

    const renderHotels = () => (
        <div className="mob-adm-pane">
             <div className="mob-sec-hdr">
                <h3>Property Management</h3>
            </div>
            {hotels.map(h => (
                <div key={h._id} className="mob-adm-list-item">
                    <div className="mob-li-info">
                        <strong>{h.name}</strong>
                        <span>{h.city}</span>
                        <em className={h.isApproved ? 'live' : 'pend'}>{h.isApproved ? 'Live' : 'Pending Approval'}</em>
                    </div>
                    <div className="mob-li-actions">
                        <button 
                            className={`mob-act-btn ${h.isApproved ? 'rev' : 'app'}`}
                            onClick={() => toggleHotelApproval(h._id, h.isApproved)}
                        >
                            {h.isApproved ? 'Revoke' : 'Approve'}
                        </button>
                    </div>
                </div>
            ))}
        </div>
    );

    const renderBookings = () => (
        <div className="mob-adm-pane">
            <div className="mob-sec-hdr">
                <h3>Master Booking List</h3>
            </div>
            {bookings.map(b => (
                <div key={b._id} className="mob-adm-card bkg-card">
                    <div className="bkg-c-hdr">
                        <span className="bkg-id">#{b._id.slice(-6).toUpperCase()}</span>
                        <span className={`bkg-st ${b.status?.toLowerCase()}`}>{b.status}</span>
                    </div>
                    <div className="bkg-c-line"><strong>Guest:</strong> {b.user?.name}</div>
                    <div className="bkg-c-line"><strong>Property:</strong> {b.hotel?.name || b.room?.name}</div>
                    <div className="bkg-c-line"><strong>Check-In:</strong> {new Date(b.checkInDate).toLocaleDateString()}</div>
                    <div className="bkg-c-footer">
                        <strong>{formatCurrency(b.totalPrice)}</strong>
                    </div>
                </div>
            ))}
        </div>
    );

    const renderFinancials = () => (
        <div className="mob-adm-pane">
            <div className="mob-adm-card fin-card">
                <div className="fin-hdr">
                    <h3>Revenue Breakdown</h3>
                    <select value={finRange.preset} onChange={(e) => handlePresetChange(e.target.value)}>
                        <option value="today">Today</option>
                        <option value="yesterday">Yesterday</option>
                        <option value="last7">Last 7 Days</option>
                    </select>
                </div>
                {financials && (
                    <div className="fin-grid">
                        <div className="fin-item">
                            <span>Total Volume</span>
                            <strong>{formatCurrency(financials.totalRevenue)}</strong>
                        </div>
                        <div className="fin-item">
                            <span>Platform Fee ({settings.commissionPercentage}%)</span>
                            <strong className="text-[#6d5dfc]">{formatCurrency(financials.platformEarnings)}</strong>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );

    const renderSettings = () => (
        <div className="mob-adm-pane">
            <div className="mob-adm-card">
                <h3>System Configuration</h3>
                <div className="mob-form-group">
                    <label>Commission Percentage (%)</label>
                    <input 
                        type="number" 
                        value={settings.commissionPercentage} 
                        onChange={e => setSettings({...settings, commissionPercentage: e.target.value})} 
                    />
                </div>
                <div className="mob-form-group">
                    <label>Platform Tax (%)</label>
                    <input 
                        type="number" 
                        value={settings.taxPercentage} 
                        onChange={e => setSettings({...settings, taxPercentage: e.target.value})} 
                    />
                </div>
                <button className="mob-save-btn" onClick={() => alert('Settings Saved!')}>Save Global Settings</button>
            </div>
        </div>
    );

    return (
        <div className="mob-admin-root">
            {/* Header */}
            <header className="mob-adm-header">
                <div className="mob-adm-top">
                    <div className="mob-adm-logo">
                        <i className="fas fa-crown"></i>
                        <span>Elite Admin</span>
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
                {activeTab === 'analytics' && renderAnalytics()}
                {activeTab === 'managers' && renderManagers()}
                {activeTab === 'hotels' && renderHotels()}
                {activeTab === 'bookings' && renderBookings()}
                {activeTab === 'financials' && renderFinancials()}
                {activeTab === 'users' && (
                    <div className="mob-adm-pane">
                        <h3>Customer Base</h3>
                        {users.map(u => (
                            <div key={u._id} className="mob-adm-list-item">
                                <div className="mob-li-info">
                                    <strong>{u.name}</strong>
                                    <span>{u.email}</span>
                                </div>
                                <div className="mob-li-actions">
                                    <button 
                                        className={`mob-act-btn ${u.isSuspended ? 'app' : 'rev'}`}
                                        onClick={() => toggleUserSuspension(u._id, u.isSuspended)}
                                    >
                                        {u.isSuspended ? 'Unlock' : 'Suspend'}
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
                {activeTab === 'offers' && (
                    <div className="mob-adm-pane">
                        <div className="mob-sec-hdr">
                            <h3>Promotions</h3>
                            <button className="mob-add-btn" onClick={() => setShowAddRoomForm(true)}>+ Create</button>
                        </div>
                        {offers.map(o => (
                            <div key={o._id} className="mob-adm-card offer-card">
                                <div className="offer-c-top">
                                    <strong>{o.code}</strong>
                                    <div style={{display: 'flex', gap: '8px'}}>
                                        <button onClick={() => deleteOffer(o._id)}><i className="fas fa-trash"></i></button>
                                    </div>
                                </div>
                                <p>{o.title}</p>
                                <div className="offer-c-val">
                                    {o.discountType === 'Percentage' ? `${o.discountValue}% OFF` : `₹${o.discountValue} OFF`}
                                </div>
                            </div>
                        ))}
                        
                        {/* Offer form modal */}
                        {showAddRoomForm && (
                             <div className="mob-adm-overlay">
                                <div className="mob-adm-modal">
                                    <div className="mob-mod-hdr">
                                        <h3>New Offer</h3>
                                        <button onClick={() => setShowAddRoomForm(false)}>✕</button>
                                    </div>
                                    <div className="mob-form-group">
                                        <label>Code</label>
                                        <input value={newOffer.code} onChange={e => setNewOffer({...newOffer, code: e.target.value.toUpperCase()})} placeholder="SUMMER30" />
                                    </div>
                                    <div className="mob-form-group">
                                        <label>Disc (%)</label>
                                        <input type="number" value={newOffer.discountValue} onChange={e => setNewOffer({...newOffer, discountValue: e.target.value})} placeholder="30" />
                                    </div>
                                    <button className="mob-save-btn" onClick={async () => {
                                         try {
                                            await API.post('/admin/offers', newOffer);
                                            setShowAddRoomForm(false);
                                            fetchData();
                                            alert('Offer Added!');
                                         } catch { alert('Failed'); }
                                    }}>Add Offer</button>
                                </div>
                             </div>
                        )}
                    </div>
                )}
                {activeTab === 'settings' && renderSettings()}

                {/* Reviews & Rooms placeholders for now, following parity */}
                {activeTab === 'reviews' && (
                    <div className="mob-adm-pane">
                        <h3>Moderation</h3>
                        {reviews.slice(0, 10).map(r => (
                            <div key={r._id} className="mob-adm-card">
                                <div className="rev-hdr"><strong>{r.user?.name}</strong> <span>{r.rating}★</span></div>
                                <p>{r.comment}</p>
                                <small>{r.hotel?.name}</small>
                            </div>
                        ))}
                    </div>
                )}
                {activeTab === 'rooms' && (
                    <div className="mob-adm-pane">
                        <h3>Property Rooms</h3>
                        <p className="text-gray-500 text-sm mb-4">Select hotel to manage inventory</p>
                        {hotels.map(h => (
                            <div key={h._id} className="mob-adm-list-item" onClick={() => alert('Inventory control coming to mobile in next minor sync!')}>
                                <div className="mob-li-info">
                                    <strong>{h.name}</strong>
                                    <span>Manage Rooms</span>
                                </div>
                                <i className="fas fa-chevron-right text-gray-300"></i>
                            </div>
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
};

export default MobileAdminPanel;
