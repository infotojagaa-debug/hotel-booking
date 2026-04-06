import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../utils/api';
import { AuthContext } from '../context/AuthContext';
import './MobileAdminPanel.css';
// import { formatCurrency } from '../utils/helpers'; // Removed non-existent import causing build error

const MobileAdminPanel = () => {
    const { userInfo, logout } = useContext(AuthContext);
    const navigate = useNavigate();
    
    const [analytics, setAnalytics] = useState(null);
    const [hotels, setHotels] = useState([]);
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('dashboard');
    
    useEffect(() => {
        document.body.classList.add('mobile-admin-active');
        const fetchData = async () => {
            try {
                const safe = async (fn) => { try { return await fn(); } catch { return null; } };
                const [analyticsRes, hotelsRes, bookingsRes] = await Promise.all([
                    safe(() => API.get('/admin/analytics')),
                    safe(() => API.get('/admin/hotels')),
                    safe(() => API.get('/admin/bookings')),
                ]);

                if (analyticsRes) setAnalytics(analyticsRes.data);
                if (hotelsRes) setHotels(hotelsRes.data);
                if (bookingsRes) setBookings(bookingsRes.data);
                
                setLoading(false);
            } catch (err) {
                setLoading(false);
            }
        };
        fetchData();

        return () => document.body.classList.remove('mobile-admin-active');
    }, []);

    const toggleHotelApproval = async (id, currentStatus) => {
        try {
            await API.put(`/admin/hotels/${id}/approve`, { isApproved: !currentStatus });
            setHotels(hotels.map(h => h._id === id ? { ...h, isApproved: !currentStatus } : h));
        } catch (error) {
            alert('Failed to update property approval status');
        }
    };

    const updateBookingStatus = async (id, status) => {
        try {
            await API.put(`/admin/bookings/${id}/status`, { status });
            setBookings(bookings.map(b => b._id === id ? { ...b, status } : b));
        } catch (error) {
            alert('Failed to update booking status');
        }
    };

    if (loading) return (
        <div className="flex items-center justify-center min-h-[100vh] bg-[#0f172a]">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-500"></div>
        </div>
    );

    return (
        <div className="mob-admin-root">
            {/* Header */}
            <div className="mob-admin-hdr">
                <div className="mob-admin-pic">
                    {userInfo?.name?.charAt(0).toUpperCase() || 'A'}
                </div>
                <div className="mob-admin-hdr-text">
                    <h2>Hello, Admin</h2>
                    <p>Elite Stays Control Center</p>
                </div>
                <button className="mob-admin-logout" onClick={() => { logout(); navigate('/login'); }}>
                    <i className="fa fa-sign-out-alt"></i>
                </button>
            </div>

            {/* Content Area */}
            <div className="mob-admin-main">
                
                {/* DASHBOARD TAB */}
                {activeTab === 'dashboard' && (
                    <div className="mob-admin-dashboard">
                        <div className="mob-stats-grid">
                            <div className="mob-stat-box blue">
                                <i className="fa fa-users"></i>
                                <h3>{analytics?.totalUsers || 0}</h3>
                                <p>Users</p>
                            </div>
                            <div className="mob-stat-box orange">
                                <i className="fa fa-building"></i>
                                <h3>{analytics?.totalHotels || hotels.length}</h3>
                                <p>Hotels</p>
                            </div>
                            <div className="mob-stat-box purple">
                                <i className="fa fa-calendar-check"></i>
                                <h3>{analytics?.totalBookings || bookings.length}</h3>
                                <p>Bookings</p>
                            </div>
                            <div className="mob-stat-box green">
                                <i className="fa fa-coins"></i>
                                <h3>₹{((analytics?.totalRevenue || 0)/1000).toFixed(1)}k</h3>
                                <p>Revenue</p>
                            </div>
                        </div>

                        <div className="mob-admin-section">
                            <h3>Recent Activity</h3>
                            <div className="mob-admin-list">
                                {bookings.slice(0, 5).map(b => (
                                    <div key={b._id} className="mob-admin-list-item">
                                        <div className="mob-admin-li-icon"><i className="fa fa-bolt"></i></div>
                                        <div className="mob-admin-li-info">
                                            <strong>{b.user?.name || 'Guest'} booked {b.hotel?.name || 'a room'}</strong>
                                            <span className="text-gray-400">{new Date(b.createdAt || b.checkInDate).toLocaleDateString()}</span>
                                        </div>
                                        <strong className="text-indigo-400">₹{b.totalPrice?.toLocaleString()}</strong>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* HOTELS TAB */}
                {activeTab === 'hotels' && (
                    <div className="mob-admin-hotels">
                        <h3>Properties ({hotels.length})</h3>
                        <div className="mob-admin-list">
                            {hotels.map(h => (
                                <div key={h._id} className="mob-admin-card">
                                    <div className="mob-ac-header">
                                        <h4>{h.name}</h4>
                                        <span className={`mob-badge ${h.isApproved ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                                            {h.isApproved ? 'LIVE' : 'PENDING'}
                                        </span>
                                    </div>
                                    <p className="text-sm text-gray-400 mb-4">{h.city}</p>
                                    <button 
                                        className={`mob-btn-full ${h.isApproved ? 'bg-red-500/10 text-red-400' : 'bg-indigo-600 text-white'}`}
                                        onClick={() => toggleHotelApproval(h._id, h.isApproved)}
                                    >
                                        {h.isApproved ? 'Revoke Approval' : 'Approve Property'}
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* BOOKINGS TAB */}
                {activeTab === 'bookings' && (
                    <div className="mob-admin-bookings">
                        <h3>All Bookings ({bookings.length})</h3>
                        <div className="mob-admin-list">
                            {bookings.map(b => (
                                <div key={b._id} className="mob-admin-card">
                                    <div className="mob-ac-header">
                                        <h4>Ref: {b._id.slice(-6).toUpperCase()}</h4>
                                        <select 
                                            className="mob-status-select"
                                            value={b.status}
                                            onChange={(e) => updateBookingStatus(b._id, e.target.value)}
                                        >
                                            <option>Confirmed</option>
                                            <option>Pending</option>
                                            <option>Cancelled</option>
                                        </select>
                                    </div>
                                    <div className="text-sm text-gray-400 mt-2">
                                        <p><i className="fa fa-user"></i> {b.user?.name}</p>
                                        <p><i className="fa fa-building"></i> {b.hotel?.name}</p>
                                        <p className="mt-2 text-indigo-400 font-bold">₹{b.totalPrice?.toLocaleString()}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

            </div>

            {/* Bottom Nav */}
            <div className="mob-admin-bot-nav">
                <div className={`mob-nav-btn ${activeTab === 'dashboard' ? 'active' : ''}`} onClick={() => setActiveTab('dashboard')}>
                    <i className="fa fa-chart-pie"></i>
                    <span>Metrics</span>
                </div>
                <div className={`mob-nav-btn ${activeTab === 'hotels' ? 'active' : ''}`} onClick={() => setActiveTab('hotels')}>
                    <i className="fa fa-hotel"></i>
                    <span>Hotels</span>
                </div>
                <div className={`mob-nav-btn ${activeTab === 'bookings' ? 'active' : ''}`} onClick={() => setActiveTab('bookings')}>
                    <i className="fa fa-receipt"></i>
                    <span>Bookings</span>
                </div>
            </div>
        </div>
    );
};

export default MobileAdminPanel;
