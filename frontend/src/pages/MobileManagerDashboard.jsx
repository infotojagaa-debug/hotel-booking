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

    const handleStatusChange = async (id, status) => {
        try {
            await API.put(`/manager/bookings/${id}/status`, { status });
            fetchAll();
        } catch { alert('Update failed'); }
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
                <button className="mob-add-btn">+ Add Room</button>
            </div>
            {rooms.map(r => (
                <div key={r._id} className="mob-adm-card room-inv-c">
                    <div className="rm-inv-top">
                        <strong>{r.name}</strong>
                        <span className={`rm-st ${r.status?.toLowerCase()}`}>{r.status || 'Available'}</span>
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
                    <div className="mob-adm-logo">
                        <div className="mob-mgr-avatar">
                            {userInfo?.name?.substring(0, 1) || 'M'}
                        </div>
                        <div className="mob-mgr-meta">
                            <span>{userInfo?.name || 'Manager'}</span>
                            <small>Elite Manager</small>
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
                {activeTab === 'overview' && renderOverview()}
                {activeTab === 'rooms' && renderInventory()}
                {activeTab === 'bookings' && renderBookings()}
                
                {/* Parity Hub for other sections */}
                {activeTab === 'hotels' && (
                    <div className="mob-mgr-pane">
                        <h3>My Properties</h3>
                        {hotels.map(h => (
                            <div key={h._id} className="mob-adm-list-item">
                                <div className="mob-li-info">
                                    <strong>{h.name}</strong>
                                    <span>{h.city} · {h.isApproved ? 'Live' : 'Pending'}</span>
                                </div>
                                <i className="fa fa-arrow-right text-gray-300"></i>
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
                        <h3>Hotel Offers</h3>
                        {offers.map(o => (
                            <div key={o._id} className="mob-adm-card">
                                <strong>{o.code}</strong>
                                <p className="text-xs">{o.title}</p>
                                <div className="text-indigo-600 font-bold mt-1">
                                    {o.discountType === 'Percentage' ? `${o.discountValue}% OFF` : `₹${o.discountValue} OFF`}
                                </div>
                            </div>
                        ))}
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
        </div>
    );
};

export default MobileManagerDashboard;
