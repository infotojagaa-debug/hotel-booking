import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../utils/api';
import './AdminPanel.css';
import NotificationBell from '../components/notifications/NotificationBell';
import HotelAddForm from './HotelAddForm';
import { AuthContext } from '../context/AuthContext';
import { 
    XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area 
} from 'recharts';
import { format, subDays, startOfToday, endOfToday, startOfYesterday, endOfYesterday } from 'date-fns';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

const AdminPanel = () => {
    const { userInfo, logout } = useContext(AuthContext);
    const navigate = useNavigate();
    
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

    // Financial Dashboard specialized state
    const [finRange, setFinRange] = useState({
        preset: 'last7',
        startDate: subDays(new Date(), 6),
        endDate: new Date()
    });
    const [financials, setFinancials] = useState(null);
    const [finLoading, setFinLoading] = useState(false);
    
    // Hotels
    const [showHotelForm, setShowHotelForm] = useState(false);
    
    // Managers
    const [showManagerForm, setShowManagerForm] = useState(false);
    const [newManager, setNewManager] = useState({ name: '', email: '', password: '', phone: '' });

    // Rooms
    const [selectedHotelForRooms, setSelectedHotelForRooms] = useState(null);
    const [hotelRooms, setHotelRooms] = useState([]);
    const [showAddRoomForm, setShowAddRoomForm] = useState(false);
    const [newRoom, setNewRoom] = useState({ name: '', type: 'Deluxe', pricePerNight: '', maxGuests: 2, description: '', roomNumbers: '' });
    const [roomImageUrl, setRoomImageUrl] = useState('');
    const [roomToDelete, setRoomToDelete] = useState(null); // State for the custom delete modal

    // Offers
    const [newOffer, setNewOffer] = useState({ code: '', title: '', description: '', discountType: 'Percentage', discountValue: '', minBookingAmount: '', usageCount: 0, validFrom: '', validTo: '', bannerImage: '', hotel: '' });
    const [editingOffer, setEditingOffer] = useState(null);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        const fetchAllData = async () => {
            // Fetch each independently so one failure doesn't block the dashboard
            const safe = async (fn) => { try { return await fn(); } catch { return null; } };

            const [analyticsRes, hotelsRes, usersRes, bookingsRes, managersRes, roomsRes, reviewsRes, offersRes, settingsRes] = await Promise.all([
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

            if (analyticsRes) {
                setAnalytics(analyticsRes.data);
                // Sync financial tab data with initial analytics
                setFinancials(analyticsRes.data);
            }
            if (hotelsRes) setHotels(hotelsRes.data);
            if (usersRes) setUsers(usersRes.data);
            if (bookingsRes) setBookings(bookingsRes.data);
            if (managersRes) setManagers(managersRes.data);
            if (roomsRes) setRooms(roomsRes.data);
            if (reviewsRes) setReviews(reviewsRes.data);
            if (offersRes) setOffers(offersRes.data);
            if (settingsRes) setSettings(settingsRes.data);

            setLoading(false);
        };
        fetchAllData();
    }, []);

    // Watch for financial range changes to refetch specific financial metrics
    useEffect(() => {
        if (activeTab === 'financials') {
            fetchFinancials();
        }
        // Auto-close sidebar on mobile when tab changes
        if (window.innerWidth <= 1024) {
            setIsSidebarOpen(false);
        }
    }, [finRange.startDate, finRange.endDate, activeTab]);

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
        } catch (err) {
            console.error('Financial data fetch error:', err);
        } finally {
            setFinLoading(false);
        }
    };

    const handlePresetChange = (preset) => {
        let start = new Date();
        let end = new Date();

        switch (preset) {
            case 'today':
                start = startOfToday();
                end = endOfToday();
                break;
            case 'yesterday':
                start = startOfYesterday();
                end = endOfYesterday();
                break;
            case 'last7':
                start = subDays(new Date(), 6);
                end = new Date();
                break;
            default:
                // custom case handled by datepicker itself
                break;
        }

        setFinRange({ ...finRange, preset, startDate: start, endDate: end });
    };

    const toggleManagerApproval = async (id, currentStatus) => {
        try {
            await API.put(`/admin/managers/${id}/status`, { isApproved: !currentStatus });
            setManagers(managers.map(m => m._id === id ? { ...m, isApproved: !currentStatus } : m));
        } catch (error) {
            alert('Failed to update manager approval');
        }
    };

    const toggleUserSuspension = async (id, currentStatus) => {
        try {
            await API.put(`/admin/users/${id}/suspend`, { isSuspended: !currentStatus });
            setUsers(users.map(u => u._id === id ? { ...u, isSuspended: !currentStatus } : u));
        } catch (error) {
            alert('Failed to update user status');
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

    const toggleHotelApproval = async (id, currentStatus) => {
        try {
            await API.put(`/admin/hotels/${id}/approve`, { isApproved: !currentStatus });
            setHotels(hotels.map(h => h._id === id ? { ...h, isApproved: !currentStatus } : h));
        } catch (error) {
            alert('Failed to update property approval status');
        }
    };

    const handleRemoveHotel = async (id) => {
        if (!window.confirm("Are you sure you want to completely remove this property? This cannot be undone.")) return;
        try {
            await API.delete(`/admin/hotels/${id}`);
            setHotels(hotels.filter(h => h._id !== id));
        } catch (error) {
            alert(error.response?.data?.message || 'Failed to remove hotel');
        }
    };

    const handleCreateManager = async (e) => {
        e.preventDefault();
        try {
            await API.post('/admin/managers', { ...newManager, role: 'manager', isApproved: true });
            setNewManager({ name: '', email: '', password: '', phone: '' });
            setShowManagerForm(false);
            const res = await API.get('/admin/managers');
            setManagers(res.data);
            alert('Manager created successfully!');
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to create manager');
        }
    };

    const loadHotelRooms = async (hotel) => {
        setSelectedHotelForRooms(hotel);
        setHotelRooms([]); // Clear immediately so stale data never shows
        setShowAddRoomForm(false);
        try {
            // Use the dedicated admin hotel rooms endpoint - strict hotel isolation
            const { data } = await API.get(`/admin/hotels/${hotel._id}/rooms`);
            setHotelRooms(data);
        } catch {
            setHotelRooms([]);
        }
    };

    const handleAddRoom = async (e) => {
        e.preventDefault();
        if (!selectedHotelForRooms?._id) {
            alert('No hotel selected. Please go back and select a hotel first.');
            return;
        }
        try {
            // POST to the hotel-scoped route — hotelId comes from the URL param, not the body
            await API.post(`/admin/hotels/${selectedHotelForRooms._id}/rooms`, {
                ...newRoom,
                images: roomImageUrl ? [roomImageUrl] : [],
            });
            alert('Room added successfully!');
            setShowAddRoomForm(false);
            setNewRoom({ name: '', type: 'Deluxe', pricePerNight: '', maxGuests: 2, description: '', roomNumbers: '' });
            setRoomImageUrl('');
            loadHotelRooms(selectedHotelForRooms); // Reload this hotel's rooms only
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to add room');
        }
    };

    const handleDeleteRoom = (id) => {
        setRoomToDelete(id); // Open the custom modal
    };

    const confirmDeleteRoom = async () => {
        if (!roomToDelete) return;
        try {
            await API.delete(`/rooms/${roomToDelete}`);
            setHotelRooms(hotelRooms.filter(r => r._id !== roomToDelete));
            setRoomToDelete(null); // Close modal
            // Optional: Show a highly styled toast success here instead of alert, but for now just clear it silently for a better UX, or keep alert if needed.
        } catch (error) {
            alert(error.response?.data?.message || 'Failed to remove room');
            setRoomToDelete(null);
        }
    };

    const cancelDeleteRoom = () => {
        setRoomToDelete(null);
    };

    const handleCreateOffer = async (e) => {
        e.preventDefault();
        try {
            const payload = { ...newOffer, hotel: newOffer.hotel || null };
            const { data } = await API.post('/admin/offers', payload);
            setOffers([data, ...offers]);
            setNewOffer({ code: '', title: '', description: '', discountType: 'Percentage', discountValue: '', minBookingAmount: '', usageCount: 0, validFrom: '', validTo: '', bannerImage: '', hotel: '' });
        } catch (error) {
            alert(error.response?.data?.message || 'Failed to create offer');
        }
    };

    const handleUpdateOffer = async (e) => {
        e.preventDefault();
        if (!editingOffer) return;
        try {
            const payload = { ...editingOffer, hotel: editingOffer.hotel?._id || editingOffer.hotel || null };
            const { data } = await API.put(`/admin/offers/${editingOffer._id}`, payload);
            setOffers(offers.map(o => o._id === data._id ? data : o));
            setEditingOffer(null);
        } catch (error) {
            alert(error.response?.data?.message || 'Failed to update offer');
        }
    };

    const deleteOffer = async (id) => {
        if (!window.confirm('Delete this offer?')) return;
        try {
            await API.delete(`/admin/offers/${id}`);
            setOffers(offers.filter(o => o._id !== id));
        } catch (error) {
            alert('Failed to delete offer');
        }
    };

    const updateGlobalSettings = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            await API.put('/admin/settings', settings);
            alert('Settings updated successfully!');
        } catch (error) {
            alert('Failed to update settings');
        } finally {
            setSubmitting(false);
        }
    };


    const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth > 1024);

    const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-IN', { 
            style: 'currency', 
            currency: settings.currency || 'INR', 
            maximumFractionDigits: 0 
        }).format(amount || 0);
    };

    const handleLogout = () => { logout(); navigate('/login'); };

    if (loading) {
        return (
            <div className="admin-loading-screen" style={{display: 'flex', flexDirection: 'column', height: '100vh', justifyContent: 'center', alignItems: 'center', background: '#f8f7ff'}}>
                <div className="admin-spinner"></div>
                <h3 style={{color: '#6d5dfc', fontWeight: 800, fontSize: '1.5rem', marginTop: '20px'}}>Accessing Elite Command Center...</h3>
            </div>
        );
    }

    return (
        <div className={`admin-dashboard-container ${!isSidebarOpen ? 'sidebar-collapsed' : ''}`}>

            {/* ===== TOP NAVBAR ===== */}
            <nav className="admin-navbar">
                <div className="nav-left">
                    <button className="sidebar-toggle-btn-mobile show-mobile" onClick={toggleSidebar} style={{marginRight: '15px', background: 'none', border: 'none', fontSize: '20px', color: '#6d5dfc'}}>
                        <i className={`fas ${isSidebarOpen ? 'fa-times' : 'fa-bars'}`}></i>
                    </button>
                    <a className="nav-logo" href="#">
                        <div className="nav-logo-icon">
                            <i className="fas fa-crown"></i>
                        </div>
                        <span className="nav-logo-text">Elite<span>Stays</span></span>
                    </a>
                </div>
                <div className="nav-right">
                    <div className="notification-wrapper admin-nav-bell">
                        <NotificationBell />
                    </div>
                    <div className="nav-divider hide-mobile"></div>
                    <div className="admin-info hide-mobile">
                        <span className="admin-name">Admin</span>
                        <span className="admin-role">Super Admin</span>
                    </div>
                    <div className="profile-icon-box">
                        <i className="fas fa-user"></i>
                    </div>
                    <div className="nav-divider"></div>
                    <button className="nav-logout-btn" onClick={handleLogout}>
                        <i className="fas fa-sign-out-alt"></i> <span className="hide-mobile">Logout</span>
                    </button>
                </div>
            </nav>

            {/* Sidebar Overlay */}
            <div className={`dashboard-overlay ${isSidebarOpen ? 'active' : ''}`} onClick={toggleSidebar}></div>

            {/* ===== SIDEBAR ===== */}
            <div className={`admin-sidebar ${!isSidebarOpen ? 'collapsed' : ''} ${isSidebarOpen ? 'mobile-open' : ''}`}>
                <div className="sidebar-header-action">
                    <button className="sidebar-toggle-btn" onClick={toggleSidebar} title="Toggle Sidebar">
                        <i className={`fas ${isSidebarOpen ? 'fa-indent' : 'fa-outdent'}`}></i>
                    </button>
                </div>
                <ul className="admin-nav-list">
                    <li className={`admin-nav-item ${activeTab === 'analytics' ? 'active' : ''}`} onClick={() => setActiveTab('analytics')}>
                        <i className="fas fa-chart-line"></i> <span>Dashboard</span>
                    </li>
                    <li className={`admin-nav-item ${activeTab === 'managers' ? 'active' : ''}`} onClick={() => setActiveTab('managers')}>
                        <i className="fas fa-user-shield"></i> <span>Managers</span>
                    </li>
                    <li className={`admin-nav-item ${activeTab === 'hotels' ? 'active' : ''}`} onClick={() => setActiveTab('hotels')}>
                        <i className="fas fa-building"></i> <span>Hotels</span>
                    </li>
                    <li className={`admin-nav-item ${activeTab === 'rooms' ? 'active' : ''}`} onClick={() => setActiveTab('rooms')}>
                        <i className="fas fa-door-open"></i> <span>Rooms</span>
                    </li>
                    <li className={`admin-nav-item ${activeTab === 'bookings' ? 'active' : ''}`} onClick={() => setActiveTab('bookings')}>
                        <i className="fas fa-clipboard-list"></i> <span>Bookings</span>
                    </li>
                    <li className={`admin-nav-item ${activeTab === 'financials' ? 'active' : ''}`} onClick={() => setActiveTab('financials')}>
                        <i className="fas fa-file-invoice-dollar"></i> <span>Financials</span>
                    </li>
                    <li className={`admin-nav-item ${activeTab === 'users' ? 'active' : ''}`} onClick={() => setActiveTab('users')}>
                        <i className="fas fa-user-friends"></i> <span>Customers</span>
                    </li>
                    <li className={`admin-nav-item ${activeTab === 'offers' ? 'active' : ''}`} onClick={() => setActiveTab('offers')}>
                        <i className="fas fa-ticket-alt"></i> <span>Offers</span>
                    </li>
                    <li className={`admin-nav-item ${activeTab === 'reviews' ? 'active' : ''}`} onClick={() => setActiveTab('reviews')}>
                        <i className="fas fa-star-half-alt"></i> <span>Reviews</span>
                    </li>
                    <li className={`admin-nav-item ${activeTab === 'settings' ? 'active' : ''}`} onClick={() => setActiveTab('settings')}>
                        <i className="fas fa-sliders-h"></i> <span>Settings</span>
                    </li>
                </ul>
            </div>

            {/* Main Content Area */}
            <div className={`admin-main-content ${!isSidebarOpen ? 'full-width' : ''}`}>
                <div className="container-elite section-premium">
                <div className="admin-header-premium">
                    <div className="admin-welcome">
                        <h2>{
                            activeTab === 'analytics' ? 'System Overview' :
                            activeTab === 'managers' ? 'Staff Control' :
                            activeTab === 'hotels' ? 'Property Management' :
                            activeTab === 'rooms' ? 'Inventory Control' :
                            activeTab === 'financials' ? 'Revenue Tracking' :
                            activeTab === 'offers' ? 'Campaign Center' : 'System Configuration'
                        }</h2>
                        <p>{new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                    </div>
                    <div className="admin-top-actions">
                        {activeTab === 'hotels' && (
                            <button className="royal-button" onClick={() => setShowHotelForm(!showHotelForm)}>
                                {showHotelForm ? 'Back to List' : 'Register New Property'}
                            </button>
                        )}
                    </div>
                </div>

                {/* Dashboard / Analytics Tab */}
                {activeTab === 'analytics' && (
                    <>
                        <div className="admin-analytics-grid" style={{marginBottom: '32px'}}>
                            <div className="admin-stat-card stat-blue">
                                <div className="stat-icon-wrap"><i className="fas fa-users"></i></div>
                                <span className="admin-stat-title">Total Users</span>
                                <h3 className="admin-stat-value">{analytics?.totalUsers ?? users.length}</h3>
                            </div>
                            <div className="admin-stat-card stat-green">
                                <div className="stat-icon-wrap"><i className="fas fa-building"></i></div>
                                <span className="admin-stat-title">Total Hotels</span>
                                <h3 className="admin-stat-value">{analytics?.totalHotels ?? hotels.length}</h3>
                            </div>
                            <div className="admin-stat-card stat-orange">
                                <div className="stat-icon-wrap"><i className="fas fa-clipboard-list"></i></div>
                                <span className="admin-stat-title">Total Bookings</span>
                                <h3 className="admin-stat-value">{analytics?.totalBookings ?? bookings.length}</h3>
                            </div>
                            <div className="admin-stat-card stat-pink">
                                <div className="stat-icon-wrap"><i className="fas fa-rupee-sign"></i></div>
                                <span className="admin-stat-title">Revenue</span>
                                <h3 className="admin-stat-value">{formatCurrency(analytics?.totalRevenue ?? 0)}</h3>
                            </div>
                        </div>

                        {analytics?.chartData && (
                            <div className="premium-section-card">
                                <h4>Platform Performance</h4>
                                <div style={{width: '100%', height: 350}}>
                                    <ResponsiveContainer>
                                        <AreaChart data={analytics.chartData}>
                                            <defs>
                                                <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#6d5dfc" stopOpacity={0.15}/>
                                                    <stop offset="95%" stopColor="#6d5dfc" stopOpacity={0}/>
                                                </linearGradient>
                                            </defs>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                            <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                                            <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} tickFormatter={(val) => `₹${val/1000}k`} />
                                            <Tooltip contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.1)'}} />
                                            <Area type="monotone" dataKey="revenue" stroke="#6d5dfc" strokeWidth={4} fillOpacity={1} fill="url(#colorRev)" />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                        )}

                        <div className="premium-section-card" style={{marginTop: '30px'}}>
                            <h4>Recent Activity</h4>
                            <div className="recent-activity-list">
                                {(analytics?.recentBookings || bookings).slice(0, 5).map(b => (
                                    <div key={b._id} className="activity-row">
                                        <div className="activity-dot"></div>
                                        <div className="activity-info">
                                            <span className="activity-name">{b.user?.name || 'Guest'} booked</span>
                                            <span className="activity-time">{new Date(b.createdAt || b.checkInDate).toLocaleString()}</span>
                                        </div>
                                        <span className="activity-amount">{formatCurrency(b.totalPrice)}</span>
                                    </div>
                                ))}
                                {bookings.length === 0 && !analytics?.recentBookings?.length && (
                                    <p style={{color: '#94a3b8', textAlign: 'center', padding: '20px'}}>No recent activity yet</p>
                                )}
                            </div>
                        </div>
                    </>
                )}

                {/* ===== MANAGERS TAB ===== */}
                {activeTab === 'managers' && (
                    <div>
                        <div style={{marginBottom:'24px', display:'flex', justifyContent:'flex-end'}}>
                            <button className="royal-button" onClick={() => setShowManagerForm(!showManagerForm)}>
                                <i className="fas fa-user-plus" style={{marginRight:'8px'}}></i>
                                {showManagerForm ? 'Cancel' : 'Add New Manager'}
                            </button>
                        </div>

                        {showManagerForm && (
                            <div className="premium-section-card" style={{marginBottom:'30px'}}>
                                <h4><i className="fas fa-user-plus" style={{marginRight:'10px', color:'var(--primary)'}}></i>Create Manager Account</h4>
                                <form onSubmit={handleCreateManager} style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'20px'}}>
                                    <div>
                                        <label style={{display:'block', fontSize:'12px', fontWeight:700, color:'#64748b', marginBottom:'8px', textTransform:'uppercase', letterSpacing:'1px'}}>Full Name</label>
                                        <input className="premium-input" placeholder="Manager full name" value={newManager.name} onChange={e => setNewManager({...newManager, name: e.target.value})} required />
                                    </div>
                                    <div>
                                        <label style={{display:'block', fontSize:'12px', fontWeight:700, color:'#64748b', marginBottom:'8px', textTransform:'uppercase', letterSpacing:'1px'}}>Email Address</label>
                                        <input className="premium-input" type="email" placeholder="manager@hotel.com" value={newManager.email} onChange={e => setNewManager({...newManager, email: e.target.value})} required />
                                    </div>
                                    <div>
                                        <label style={{display:'block', fontSize:'12px', fontWeight:700, color:'#64748b', marginBottom:'8px', textTransform:'uppercase', letterSpacing:'1px'}}>Password</label>
                                        <input className="premium-input" type="password" placeholder="Set a secure password" value={newManager.password} onChange={e => setNewManager({...newManager, password: e.target.value})} required />
                                    </div>
                                    <div>
                                        <label style={{display:'block', fontSize:'12px', fontWeight:700, color:'#64748b', marginBottom:'8px', textTransform:'uppercase', letterSpacing:'1px'}}>Phone</label>
                                        <input className="premium-input" placeholder="Phone number" value={newManager.phone} onChange={e => setNewManager({...newManager, phone: e.target.value})} />
                                    </div>
                                    <div style={{gridColumn:'1/-1'}}>
                                        <button type="submit" className="royal-button"><i className="fas fa-check" style={{marginRight:'8px'}}></i>Create Manager</button>
                                    </div>
                                </form>
                            </div>
                        )}

                        <div className="admin-table-container">
                            <table className="admin-table">
                                <thead>
                                    <tr><th>Manager</th><th>Email</th><th>Approval Status</th><th>Actions</th></tr>
                                </thead>
                                <tbody>
                                    {managers.map(m => (
                                        <tr key={m._id}>
                                            <td style={{fontWeight: 700, color: '#1e293b'}}>{m.name}</td>
                                            <td>{m.email}</td>
                                            <td>
                                                <span className={`status-badge ${m.isApproved ? 'status-confirmed' : 'status-pending'}`}>
                                                    {m.isApproved ? 'Approved' : 'Pending'}
                                                </span>
                                            </td>
                                            <td>
                                                <div style={{display: 'flex', gap: '10px'}}>
                                                    <button className="admin-btn admin-btn-approve" onClick={() => toggleManagerApproval(m._id, m.isApproved)}>
                                                        {m.isApproved ? 'Revoke' : 'Approve'}
                                                    </button>
                                                    <button className="admin-btn admin-btn-revoke" onClick={() => toggleUserSuspension(m._id, m.isSuspended)}>
                                                        {m.isSuspended ? 'Unlock' : 'Suspend'}
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                    {managers.length === 0 && <tr><td colSpan="4" style={{textAlign:'center', color:'#94a3b8', padding:'40px'}}>No managers yet.</td></tr>}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* ===== HOTELS TAB ===== */}
                {activeTab === 'hotels' && !showHotelForm && (
                    <div className="admin-table-container">
                        <table className="admin-table">
                            <thead>
                                <tr><th>Property Name</th><th>Location</th><th>Beach Dist</th><th>Breakfast</th><th>Status</th><th>Actions</th></tr>
                            </thead>
                            <tbody>
                                {hotels.map(h => (
                                    <tr key={h._id}>
                                        <td style={{fontWeight: 700}}>{h.name}</td>
                                        <td>{h.city}</td>
                                        <td style={{fontSize:'0.85rem'}}>{h.distanceFromBeach || '---'}</td>
                                        <td style={{fontSize:'1.2rem'}}>{h.isBreakfastIncluded ? '🥞' : '❌'}</td>
                                        <td>
                                            <span className={`status-badge ${h.isApproved ? 'status-confirmed' : 'status-pending'}`}>
                                                {h.isApproved ? 'Live' : 'Pending'}
                                            </span>
                                        </td>
                                        <td>
                                            <div style={{display:'flex', gap:'10px'}}>
                                                <button className={`admin-btn ${h.isApproved ? 'admin-btn-revoke' : 'admin-btn-approve'}`} onClick={() => toggleHotelApproval(h._id, h.isApproved)}>
                                                    {h.isApproved ? 'Revoke' : 'Approve'}
                                                </button>
                                                <button className="admin-btn admin-btn-revoke" onClick={() => handleRemoveHotel(h._id)}>Remove</button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {hotels.length === 0 && (
                                    <tr><td colSpan="5" style={{textAlign:'center', color:'#94a3b8', padding:'40px'}}>No hotels yet. Add one with "Register New Property".</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
                {activeTab === 'hotels' && showHotelForm && (
                    <HotelAddForm onSuccess={() => setShowHotelForm(false)} />
                )}

                {/* ===== ROOMS TAB ===== */}
                {activeTab === 'rooms' && !selectedHotelForRooms && (
                    <div>
                        <p style={{color:'#94a3b8', marginBottom:'24px', fontSize:'0.95rem'}}>Select a hotel below to manage its rooms.</p>
                        <div className="hotel-pick-grid">
                            {hotels.map(h => (
                                <div key={h._id} className="hotel-pick-card" onClick={() => loadHotelRooms(h)}>
                                    <div className="hotel-pick-icon"><i className="fas fa-bed"></i></div>
                                    <div>
                                        <div className="hotel-pick-name">{h.name}</div>
                                        <div className="hotel-pick-city">{h.city}</div>
                                    </div>
                                    <i className="fas fa-chevron-right" style={{marginLeft:'auto', color:'#94a3b8'}}></i>
                                </div>
                            ))}
                            {hotels.length === 0 && <p style={{color:'#94a3b8'}}>No hotels found. Add hotels first.</p>}
                        </div>
                    </div>
                )}

                {activeTab === 'rooms' && selectedHotelForRooms && (
                    <div>
                        <div style={{display:'flex', alignItems:'center', gap:'16px', marginBottom:'28px'}}>
                            <button className="admin-btn" style={{background:'#f1f5f9', color:'#475569'}} onClick={() => { setSelectedHotelForRooms(null); setShowAddRoomForm(false); }}>
                                <i className="fas fa-arrow-left"></i> Back
                            </button>
                            <div style={{flex:1}}>
                                <h3 style={{margin:0, fontWeight:800}}>{selectedHotelForRooms.name}</h3>
                                <small style={{color:'#94a3b8'}}>{selectedHotelForRooms.city} · Manage room types</small>
                            </div>
                            <button className="royal-button" style={{background:'#ff5a3d', boxShadow:'0 8px 20px rgba(255,90,61,0.25)'}} onClick={() => setShowAddRoomForm(!showAddRoomForm)}>
                                <i className="fas fa-plus" style={{marginRight:'8px'}}></i> ADD ROOM TYPE
                            </button>
                        </div>

                        {showAddRoomForm && (
                            <div className="premium-section-card" style={{marginBottom:'30px'}}>
                                <h4><i className="fas fa-door-open" style={{marginRight:'10px', color:'#006ce4'}}></i>New Room Type</h4>
                                <form onSubmit={handleAddRoom} style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'20px'}}>
                                    <div>
                                        <label style={{display:'block', fontSize:'12px', fontWeight:700, color:'#64748b', marginBottom:'8px', textTransform:'uppercase'}}>Room Name</label>
                                        <input className="premium-input" placeholder="e.g. Deluxe King" value={newRoom.name} onChange={e => setNewRoom({...newRoom, name: e.target.value})} required />
                                    </div>
                                    <div>
                                        <label style={{display:'block', fontSize:'12px', fontWeight:700, color:'#64748b', marginBottom:'8px', textTransform:'uppercase'}}>Type</label>
                                        <select className="premium-input" value={newRoom.type} onChange={e => setNewRoom({...newRoom, type: e.target.value})}>
                                            {['Standard', 'Deluxe', 'Suite', 'Superior', 'Executive', 'Family'].map(t => <option key={t}>{t}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label style={{display:'block', fontSize:'12px', fontWeight:700, color:'#64748b', marginBottom:'8px', textTransform:'uppercase'}}>Price / Night (₹)</label>
                                        <input className="premium-input" type="number" placeholder="e.g. 3500" value={newRoom.pricePerNight} onChange={e => setNewRoom({...newRoom, pricePerNight: e.target.value})} required />
                                    </div>
                                    <div>
                                        <label style={{display:'block', fontSize:'12px', fontWeight:700, color:'#64748b', marginBottom:'8px', textTransform:'uppercase'}}>Max Guests</label>
                                        <input className="premium-input" type="number" value={newRoom.maxGuests} onChange={e => setNewRoom({...newRoom, maxGuests: e.target.value})} min="1" max="10" />
                                    </div>
                                    <div style={{gridColumn:'1/-1'}}>
                                        <label style={{display:'block', fontSize:'12px', fontWeight:700, color:'#64748b', marginBottom:'8px', textTransform:'uppercase'}}>Description</label>
                                        <textarea className="premium-input" rows="3" placeholder="Describe this room type..." value={newRoom.description} onChange={e => setNewRoom({...newRoom, description: e.target.value})} required />
                                    </div>
                                    <div>
                                        <label style={{display:'block', fontSize:'12px', fontWeight:700, color:'#64748b', marginBottom:'8px', textTransform:'uppercase'}}>Room Numbers (comma separated)</label>
                                        <input className="premium-input" placeholder="101, 102, 103" value={newRoom.roomNumbers} onChange={e => setNewRoom({...newRoom, roomNumbers: e.target.value})} />
                                    </div>
                                    <div>
                                        <label style={{display:'block', fontSize:'12px', fontWeight:700, color:'#64748b', marginBottom:'8px', textTransform:'uppercase'}}>Image URL (optional)</label>
                                        <input className="premium-input" type="url" placeholder="https://..." value={roomImageUrl} onChange={e => setRoomImageUrl(e.target.value)} />
                                    </div>
                                    <div style={{gridColumn:'1/-1', display:'flex', gap:'14px'}}>
                                        <button type="submit" className="royal-button"><i className="fas fa-plus-circle" style={{marginRight:'8px'}}></i>Add Room</button>
                                        <button type="button" className="admin-btn" style={{background:'#f1f5f9', color:'#64748b', padding:'12px 24px'}} onClick={() => setShowAddRoomForm(false)}>Cancel</button>
                                    </div>
                                </form>
                            </div>
                        )}

                        <div className="room-cards-grid">
                            {hotelRooms.map(r => (
                                <div key={r._id} className="room-card-item">
                                    {r.images?.[0]
                                        ? <img src={r.images[0]} alt={r.name} className="room-card-img" referrerPolicy="no-referrer" onError={e => e.target.style.display='none'} />
                                        : <div className="room-card-img-placeholder"><i className="fas fa-bed"></i></div>
                                    }
                                    <div className="room-card-body">
                                        <div style={{display:'flex', justifyContent:'space-between', alignItems:'start'}}>
                                            <span className="room-card-name">{r.name}</span>
                                            <div style={{display:'flex', gap:'10px'}}>
                                                <button className="admin-btn" style={{background:'none', color:'#64748b', padding:'4px 8px'}}><i className="fas fa-pen"></i></button>
                                                <button 
                                                    className="admin-btn" 
                                                    style={{background:'none', color:'#ef4444', padding:'4px 8px'}}
                                                    onClick={() => handleDeleteRoom(r._id)}
                                                >
                                                    <i className="fas fa-trash"></i>
                                                </button>
                                            </div>
                                        </div>
                                        <div className="room-card-price">{formatCurrency(r.pricePerNight)} <span>/ night</span></div>
                                        <div className="room-card-meta">
                                            <span><i className="fas fa-users"></i> Up to {r.maxGuests} Guests</span>
                                            <span><i className="fas fa-door-closed"></i> {r.roomNumbers?.length || 0} Units Available</span>
                                        </div>
                                        {/* Hotel name badge for verification */}
                                        <div style={{marginTop:'10px', paddingTop:'10px', borderTop:'1px solid #f1f5f9', fontSize:'11px', color:'#94a3b8', fontWeight:600}}>
                                            <i className="fas fa-building" style={{marginRight:'5px'}}></i>
                                            {r.hotel?.name || selectedHotelForRooms.name}
                                        </div>
                                    </div>
                                </div>
                            ))}
                            {hotelRooms.length === 0 && !showAddRoomForm && (
                                <div style={{gridColumn:'1/-1', textAlign:'center', padding:'60px', color:'#94a3b8'}}>
                                    <i className="fas fa-bed" style={{fontSize:'3rem', marginBottom:'16px', display:'block'}}></i>
                                    <p style={{fontWeight:600, marginBottom:'8px'}}>No rooms for <strong style={{color:'#003580'}}>{selectedHotelForRooms.name}</strong></p>
                                    <p style={{fontSize:'0.85rem'}}>Click <strong style={{color:'#ff5a3d'}}>"ADD ROOM TYPE"</strong> to add the first room for this hotel.</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* ===== BOOKINGS TAB ===== */}
                {activeTab === 'bookings' && (
                    <div className="admin-table-container">
                        <table className="admin-table">
                            <thead>
                                <tr><th>Ref ID</th><th>Customer</th><th>Property</th><th>Check-In</th><th>Status</th><th>Actions</th></tr>
                            </thead>
                            <tbody>
                                {bookings.map(b => (
                                    <tr key={b._id}>
                                        <td style={{fontSize: '0.75rem', fontWeight: 600, color: '#64748b'}}>{b._id.slice(-8).toUpperCase()}</td>
                                        <td>{b.user?.name}</td>
                                        <td>{b.hotel?.name || b.room?.name || '---'}</td>
                                        <td>{new Date(b.checkInDate).toLocaleDateString()}</td>
                                        <td><span className={`status-badge status-${b.status?.toLowerCase()}`}>{b.status}</span></td>
                                        <td>
                                            <select className="status-select" value={b.status} onChange={(e) => updateBookingStatus(b._id, e.target.value)}>
                                                <option>Confirmed</option>
                                                <option>Cancelled</option>
                                                <option>Completed</option>
                                            </select>
                                        </td>
                                    </tr>
                                ))}
                                {bookings.length === 0 && <tr><td colSpan="6" style={{textAlign:'center', color:'#94a3b8', padding:'40px'}}>No bookings yet.</td></tr>}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* ===== CUSTOMERS TAB ===== */}
                {activeTab === 'users' && (
                    <div className="admin-table-container">
                        <table className="admin-table">
                            <thead>
                                <tr><th>Customer</th><th>Email</th><th>Joined</th><th>Status</th><th>Action</th></tr>
                            </thead>
                            <tbody>
                                {users.map(u => (
                                    <tr key={u._id}>
                                        <td style={{fontWeight:700}}>{u.name}</td>
                                        <td>{u.email}</td>
                                        <td style={{color:'#94a3b8', fontSize:'0.85rem'}}>{new Date(u.createdAt).toLocaleDateString()}</td>
                                        <td>
                                            <span className={`status-badge ${u.isSuspended ? 'status-cancelled' : 'status-confirmed'}`}>
                                                {u.isSuspended ? 'Suspended' : 'Active'}
                                            </span>
                                        </td>
                                        <td>
                                            <button className={`admin-btn ${u.isSuspended ? 'admin-btn-approve' : 'admin-btn-revoke'}`}
                                                onClick={() => toggleUserSuspension(u._id, u.isSuspended)}>
                                                {u.isSuspended ? 'Unsuspend' : 'Suspend'}
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                                {users.length === 0 && <tr><td colSpan="5" style={{textAlign:'center', color:'#94a3b8', padding:'40px'}}>No customers registered yet.</td></tr>}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* ===== OFFERS TAB (Booking.com Style) ===== */}
                {activeTab === 'offers' && (
                    <div>
                        {/* Edit Offer Modal */}
                        {editingOffer && (
                            <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.5)',zIndex:1000,display:'flex',alignItems:'center',justifyContent:'center'}}>
                                <div className="premium-section-card" style={{width:'700px',maxHeight:'90vh',overflowY:'auto',margin:0}}>
                                    <h4><i className="fas fa-pen" style={{marginRight:'10px',color:'var(--primary)'}}></i>Edit Offer</h4>
                                    <form onSubmit={handleUpdateOffer} style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'20px',marginTop:'20px'}}>
                                        <div>
                                            <label style={{display:'block',fontSize:'12px',fontWeight:700,color:'#64748b',marginBottom:'8px',textTransform:'uppercase'}}>Scope</label>
                                            <select className="premium-input" value={editingOffer.hotel?._id || editingOffer.hotel || ''} onChange={e => setEditingOffer({...editingOffer, hotel: e.target.value})}>
                                                <option value="">🌍 Global (All Hotels)</option>
                                                {hotels.map(h => <option key={h._id} value={h._id}>🏨 {h.name}</option>)}
                                            </select>
                                        </div>
                                        <div>
                                            <label style={{display:'block',fontSize:'12px',fontWeight:700,color:'#64748b',marginBottom:'8px',textTransform:'uppercase'}}>Promo Code</label>
                                            <input className="premium-input" value={editingOffer.code} onChange={e => setEditingOffer({...editingOffer, code: e.target.value.toUpperCase()})} required />
                                        </div>
                                        <div style={{gridColumn:'1/-1'}}>
                                            <label style={{display:'block',fontSize:'12px',fontWeight:700,color:'#64748b',marginBottom:'8px',textTransform:'uppercase'}}>Title</label>
                                            <input className="premium-input" value={editingOffer.title} onChange={e => setEditingOffer({...editingOffer, title: e.target.value})} required />
                                        </div>
                                        <div style={{gridColumn:'1/-1'}}>
                                            <label style={{display:'block',fontSize:'12px',fontWeight:700,color:'#64748b',marginBottom:'8px',textTransform:'uppercase'}}>Description</label>
                                            <input className="premium-input" value={editingOffer.description} onChange={e => setEditingOffer({...editingOffer, description: e.target.value})} required />
                                        </div>
                                        <div>
                                            <label style={{display:'block',fontSize:'12px',fontWeight:700,color:'#64748b',marginBottom:'8px',textTransform:'uppercase'}}>Discount Type</label>
                                            <select className="premium-input" value={editingOffer.discountType} onChange={e => setEditingOffer({...editingOffer, discountType: e.target.value})}>
                                                <option value="Percentage">Percentage (%) off</option>
                                                <option value="Flat">Flat Amount (₹) off</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label style={{display:'block',fontSize:'12px',fontWeight:700,color:'#64748b',marginBottom:'8px',textTransform:'uppercase'}}>Discount Value</label>
                                            <input className="premium-input" type="number" value={editingOffer.discountValue} onChange={e => setEditingOffer({...editingOffer, discountValue: e.target.value})} required />
                                        </div>
                                        <div>
                                            <label style={{display:'block',fontSize:'12px',fontWeight:700,color:'#64748b',marginBottom:'8px',textTransform:'uppercase'}}>Valid From</label>
                                            <input className="premium-input" type="date" value={editingOffer.validFrom?.split('T')[0] || ''} onChange={e => setEditingOffer({...editingOffer, validFrom: e.target.value})} required />
                                        </div>
                                        <div>
                                            <label style={{display:'block',fontSize:'12px',fontWeight:700,color:'#64748b',marginBottom:'8px',textTransform:'uppercase'}}>Valid To</label>
                                            <input className="premium-input" type="date" value={editingOffer.validTo?.split('T')[0] || ''} onChange={e => setEditingOffer({...editingOffer, validTo: e.target.value})} required />
                                        </div>
                                        <div style={{gridColumn:'1/-1',display:'flex',gap:'14px'}}>
                                            <button type="submit" className="royal-button"><i className="fas fa-save" style={{marginRight:'8px'}}></i>Save Changes</button>
                                            <button type="button" className="admin-btn" style={{background:'#f1f5f9',color:'#64748b',padding:'12px 24px'}} onClick={() => setEditingOffer(null)}>Cancel</button>
                                        </div>
                                    </form>
                                </div>
                            </div>
                        )}

                        <div className="premium-section-card" style={{marginBottom:'30px'}}>
                            <h4><i className="fas fa-tag" style={{marginRight:'10px', color:'var(--primary)'}}></i>Create New Promotion</h4>
                            <form onSubmit={handleCreateOffer} style={{display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:'20px'}}>
                                {/* Scope Selector */}
                                <div style={{gridColumn:'1/-1',background:'#f8f7ff',borderRadius:'12px',padding:'16px',border:'1.5px solid #e8e4ff'}}>
                                    <label style={{display:'block', fontSize:'12px', fontWeight:700, color:'#6d5dfc', marginBottom:'10px', textTransform:'uppercase', letterSpacing:'1px'}}>🎯 Promotion Scope</label>
                                    <div style={{display:'flex',gap:'12px'}}>
                                        <label style={{flex:1,display:'flex',alignItems:'center',gap:'10px',padding:'12px 16px',border:`2px solid ${newOffer.hotel === '' ? '#6d5dfc' : '#e2e8f0'}`,borderRadius:'10px',cursor:'pointer',background: newOffer.hotel === '' ? '#f0edff' : '#fff',transition:'all 0.2s'}}>
                                            <input type="radio" name="scope" checked={newOffer.hotel === ''} onChange={() => setNewOffer({...newOffer, hotel: ''})} style={{accentColor:'#6d5dfc'}} />
                                            <div>
                                                <div style={{fontWeight:700,fontSize:'0.9rem'}}>🌍 Global Promotion</div>
                                                <div style={{fontSize:'0.75rem',color:'#64748b'}}>Applies to ALL hotels on the platform</div>
                                            </div>
                                        </label>
                                        <label style={{flex:1,display:'flex',alignItems:'center',gap:'10px',padding:'12px 16px',border:`2px solid ${newOffer.hotel !== '' ? '#6d5dfc' : '#e2e8f0'}`,borderRadius:'10px',cursor:'pointer',background: newOffer.hotel !== '' ? '#f0edff' : '#fff',transition:'all 0.2s'}}>
                                            <input type="radio" name="scope" checked={newOffer.hotel !== ''} onChange={() => setNewOffer({...newOffer, hotel: hotels[0]?._id || ''})} style={{accentColor:'#6d5dfc'}} />
                                            <div>
                                                <div style={{fontWeight:700,fontSize:'0.9rem'}}>🏨 Hotel-Specific</div>
                                                <div style={{fontSize:'0.75rem',color:'#64748b'}}>Only for a particular hotel</div>
                                            </div>
                                        </label>
                                    </div>
                                    {newOffer.hotel !== '' && (
                                        <div style={{marginTop:'12px'}}>
                                            <label style={{display:'block', fontSize:'12px', fontWeight:700, color:'#64748b', marginBottom:'8px', textTransform:'uppercase'}}>Select Hotel</label>
                                            <select className="premium-input" value={newOffer.hotel} onChange={e => setNewOffer({...newOffer, hotel: e.target.value})} required>
                                                {hotels.map(h => <option key={h._id} value={h._id}>{h.name} – {h.city}</option>)}
                                            </select>
                                        </div>
                                    )}
                                </div>

                                <div>
                                    <label style={{display:'block', fontSize:'12px', fontWeight:700, color:'#64748b', marginBottom:'8px', textTransform:'uppercase', letterSpacing:'1px'}}>Promo Code</label>
                                    <input className="premium-input" placeholder="e.g. SUMMER30" value={newOffer.code} onChange={e => setNewOffer({...newOffer, code: e.target.value.toUpperCase()})} required />
                                </div>
                                <div>
                                    <label style={{display:'block', fontSize:'12px', fontWeight:700, color:'#64748b', marginBottom:'8px', textTransform:'uppercase', letterSpacing:'1px'}}>Title</label>
                                    <input className="premium-input" placeholder="e.g. Summer Sale 30% Off" value={newOffer.title} onChange={e => setNewOffer({...newOffer, title: e.target.value})} required />
                                </div>
                                <div>
                                    <label style={{display:'block', fontSize:'12px', fontWeight:700, color:'#64748b', marginBottom:'8px', textTransform:'uppercase', letterSpacing:'1px'}}>Discount Type</label>
                                    <select className="premium-input" value={newOffer.discountType} onChange={e => setNewOffer({...newOffer, discountType: e.target.value})}>
                                        <option value="Percentage">Percentage (%) off</option>
                                        <option value="Flat">Flat Amount (₹) off</option>
                                    </select>
                                </div>
                                <div style={{gridColumn:'1/-1'}}>
                                    <label style={{display:'block', fontSize:'12px', fontWeight:700, color:'#64748b', marginBottom:'8px', textTransform:'uppercase', letterSpacing:'1px'}}>Description (shown to users)</label>
                                    <input className="premium-input" placeholder="e.g. Get 30% off on your summer stays!" value={newOffer.description} onChange={e => setNewOffer({...newOffer, description: e.target.value})} required />
                                </div>
                                <div>
                                    <label style={{display:'block', fontSize:'12px', fontWeight:700, color:'#64748b', marginBottom:'8px', textTransform:'uppercase', letterSpacing:'1px'}}>
                                        {newOffer.discountType === 'Percentage' ? 'Discount (%)' : 'Discount Amount (₹)'}
                                    </label>
                                    <input className="premium-input" type="number" placeholder={newOffer.discountType === 'Percentage' ? '20' : '500'} value={newOffer.discountValue} onChange={e => setNewOffer({...newOffer, discountValue: e.target.value})} required />
                                </div>
                                <div>
                                    <label style={{display:'block', fontSize:'12px', fontWeight:700, color:'#64748b', marginBottom:'8px', textTransform:'uppercase', letterSpacing:'1px'}}>Min Booking Amount (₹)</label>
                                    <input className="premium-input" type="number" placeholder="e.g. 2000" value={newOffer.minBookingAmount} onChange={e => setNewOffer({...newOffer, minBookingAmount: e.target.value})} />
                                </div>
                                <div>
                                    <label style={{display:'block', fontSize:'12px', fontWeight:700, color:'#64748b', marginBottom:'8px', textTransform:'uppercase', letterSpacing:'1px'}}>Valid From</label>
                                    <input className="premium-input" type="date" value={newOffer.validFrom} onChange={e => setNewOffer({...newOffer, validFrom: e.target.value})} required />
                                </div>
                                <div>
                                    <label style={{display:'block', fontSize:'12px', fontWeight:700, color:'#64748b', marginBottom:'8px', textTransform:'uppercase', letterSpacing:'1px'}}>Valid To</label>
                                    <input className="premium-input" type="date" value={newOffer.validTo} onChange={e => setNewOffer({...newOffer, validTo: e.target.value})} required />
                                </div>
                                <div>
                                    <label style={{display:'block', fontSize:'12px', fontWeight:700, color:'#64748b', marginBottom:'8px', textTransform:'uppercase', letterSpacing:'1px'}}>Banner Image URL</label>
                                    <input className="premium-input" placeholder="https://..." value={newOffer.bannerImage} onChange={e => setNewOffer({...newOffer, bannerImage: e.target.value})} />
                                </div>
                                <div style={{gridColumn:'1/-1'}}>
                                    <button type="submit" className="royal-button"><i className="fas fa-plus-circle" style={{marginRight:'8px'}}></i>Create Promotion</button>
                                </div>
                            </form>
                        </div>

                        <div className="offers-grid">
                            {offers.map(o => (
                                <div key={o._id} className="offer-card">
                                    {/* Scope Label */}
                                    <div style={{marginBottom:'10px'}}>
                                        {o.hotel
                                            ? <span style={{display:'inline-flex',alignItems:'center',gap:'6px',padding:'4px 12px',background:'#eff6ff',color:'#1d4ed8',borderRadius:'20px',fontSize:'11px',fontWeight:700,border:'1px solid #bfdbfe'}}>
                                                🏨 Exclusive: {o.hotel?.name || 'Hotel-Specific'}
                                              </span>
                                            : <span style={{display:'inline-flex',alignItems:'center',gap:'6px',padding:'4px 12px',background:'#f0fdf4',color:'#15803d',borderRadius:'20px',fontSize:'11px',fontWeight:700,border:'1px solid #bbf7d0'}}>
                                                🌍 Applicable for All Hotels
                                              </span>
                                        }
                                    </div>
                                    <div className="offer-card-top">
                                        <span className="offer-code">{o.code}</span>
                                        <div style={{display:'flex',gap:'6px'}}>
                                            <button className="admin-btn" style={{background:'none',color:'#6d5dfc',padding:'4px 8px'}} onClick={() => setEditingOffer({...o, hotel: o.hotel || null})} title="Edit"><i className="fas fa-pen"></i></button>
                                            <button className="admin-btn" style={{background:'none', color:'#ef4444', padding:'4px 8px'}} onClick={() => deleteOffer(o._id)}><i className="fas fa-trash"></i></button>
                                        </div>
                                    </div>
                                    <p className="offer-desc"><strong>{o.title}</strong><br/>{o.description}</p>
                                    <div className="offer-meta">
                                        <span className="offer-discount">
                                            <i className="fas fa-tag"></i>
                                            {o.discountType === 'Percentage' ? `${o.discountValue}% OFF` : `₹${o.discountValue} OFF`}
                                        </span>
                                        {o.minBookingAmount > 0 && <span className="offer-min">Min ₹{o.minBookingAmount}</span>}
                                        {o.validTo && <span className="offer-expiry"><i className="fas fa-clock"></i> Expires {new Date(o.validTo).toLocaleDateString()}</span>}
                                    </div>
                                    <div className="offer-valid">
                                        {new Date(o.validTo) > new Date()
                                            ? <span className="status-badge status-confirmed">Active</span>
                                            : <span className="status-badge status-cancelled">Expired</span>
                                        }
                                    </div>
                                </div>
                            ))}
                            {offers.length === 0 && <p style={{color:'#94a3b8', gridColumn:'1/-1', textAlign:'center', padding:'40px 0'}}>No promotions created yet.</p>}
                        </div>
                    </div>
                )}

                {/* ===== FINANCIALS TAB (Premium Redesign) ===== */}
                {activeTab === 'financials' && financials && (
                    <div className="financial-dashboard" style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '32px',
                        animation: 'fadeInUp 0.6s ease-out'
                    }}>
                        {/* Top Control Bar */}
                        <div className="financial-controls" style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            background: '#fff',
                            padding: '24px 32px',
                            borderRadius: '24px',
                            boxShadow: 'var(--card-shadow)',
                            borderLeft: '6px solid var(--primary)'
                        }}>
                            <div>
                                <h2 style={{margin: 0, fontSize: '1.6rem', fontWeight: 800, color: '#1a162d'}}>Financial Overview</h2>
                                <p style={{margin: '4px 0 0', color: '#94a3b8', fontSize: '0.9rem'}}>
                                    {finRange.preset === 'custom' 
                                        ? `Showing range: ${format(finRange.startDate, 'dd MMM')} - ${format(finRange.endDate, 'dd MMM yyyy')}`
                                        : `Filtered by: ${finRange.preset.charAt(0).toUpperCase() + finRange.preset.slice(1)}`}
                                </p>
                            </div>
                            
                            <div className="control-actions" style={{display: 'flex', alignItems: 'center', gap: '16px'}}>
                                <div className="preset-selector" style={{position: 'relative'}}>
                                    <select 
                                        className="premium-input" 
                                        style={{padding: '10px 40px 10px 16px', fontSize: '0.9rem', width: '160px', height: '44px'}}
                                        value={finRange.preset}
                                        onChange={(e) => handlePresetChange(e.target.value)}
                                    >
                                        <option value="today">Today</option>
                                        <option value="yesterday">Yesterday</option>
                                        <option value="last7">Last 7 Days</option>
                                        <option value="custom">Custom Range</option>
                                    </select>
                                </div>

                                {finRange.preset === 'custom' && (
                                    <div className="custom-date-picker" style={{display: 'flex', gap: '10px', alignItems: 'center'}}>
                                        <DatePicker
                                            selected={finRange.startDate}
                                            onChange={(date) => setFinRange({...finRange, startDate: date})}
                                            selectsStart
                                            startDate={finRange.startDate}
                                            endDate={finRange.endDate}
                                            className="premium-input"
                                            style={{width: '120px', height: '44px'}}
                                        />
                                        <span style={{color: '#94a3b8'}}>to</span>
                                        <DatePicker
                                            selected={finRange.endDate}
                                            onChange={(date) => setFinRange({...finRange, endDate: date})}
                                            selectsEnd
                                            startDate={finRange.startDate}
                                            endDate={finRange.endDate}
                                            minDate={finRange.startDate}
                                            className="premium-input"
                                            style={{width: '120px', height: '44px'}}
                                        />
                                    </div>
                                )}

                                <button 
                                    className="royal-button" 
                                    style={{padding: '0 24px', height: '44px', display: 'flex', alignItems: 'center', gap: '8px'}}
                                    onClick={fetchFinancials}
                                    disabled={finLoading}
                                >
                                    {finLoading ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-filter"></i>}
                                    Refresh
                                </button>
                            </div>
                        </div>

                        {/* Premium Stat Cards */}
                        <div className="financial-cards-grid" style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                            gap: '24px'
                        }}>
                            <div className="fin-premium-card" style={{
                                background: '#fff',
                                padding: '28px',
                                borderRadius: '24px',
                                boxShadow: 'var(--card-shadow)',
                                border: '1px solid rgba(0,0,0,0.03)',
                                transition: 'all 0.3s'
                            }}>
                                <div className="fin-card-icon" style={{
                                    width: '48px', height: '48px', borderRadius: '14px', 
                                    background: '#eef2ff', color: '#6366f1', 
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.3rem'
                                }}>
                                    <i className="fas fa-wallet"></i>
                                </div>
                                <div>
                                    <span style={{fontSize: '0.85rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1px'}}>Total Volume</span>
                                    <h2 style={{fontSize: '2rem', fontWeight: 800, color: '#1a162d', margin: '8px 0 0'}}>{formatCurrency(financials.totalRevenue)}</h2>
                                </div>
                                <div style={{marginTop: 'auto', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', color: '#10b981', fontWeight: 600}}>
                                    <i className="fas fa-arrow-trend-up"></i>
                                    <span>Live Growth</span>
                                </div>
                            </div>

                            <div className="fin-premium-card" style={{
                                background: '#fff',
                                padding: '28px',
                                borderRadius: '24px',
                                boxShadow: 'var(--card-shadow)',
                                border: '1px solid rgba(0,0,0,0.03)',
                                transition: 'all 0.3s'
                            }}>
                                <div className="fin-card-icon" style={{
                                    width: '48px', height: '48px', borderRadius: '14px', 
                                    background: '#ecfdf5', color: '#10b981', 
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.3rem'
                                }}>
                                    <i className="fas fa-hand-holding-usd"></i>
                                </div>
                                <div>
                                    <span style={{fontSize: '0.85rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1px'}}>Merchant Payouts</span>
                                    <h2 style={{fontSize: '2rem', fontWeight: 800, color: '#1a162d', margin: '8px 0 0'}}>{formatCurrency(financials.managerPayouts)}</h2>
                                </div>
                                <div style={{marginTop: 'auto', color: '#94a3b8', fontSize: '0.8rem'}}>90% Revenue Share</div>
                            </div>

                            <div className="fin-premium-card" style={{
                                background: '#fff',
                                padding: '28px',
                                borderRadius: '24px',
                                boxShadow: 'var(--card-shadow)',
                                border: '1px solid rgba(0,0,0,0.03)',
                                transition: 'all 0.3s'
                            }}>
                                <div className="fin-card-icon" style={{
                                    width: '48px', height: '48px', borderRadius: '14px', 
                                    background: '#f5f3ff', color: '#8b5cf6', 
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.3rem'
                                }}>
                                    <i className="fas fa-chart-pie"></i>
                                </div>
                                <div>
                                    <span style={{fontSize: '0.85rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1px'}}>Platform Earnings</span>
                                    <h2 style={{fontSize: '2rem', fontWeight: 800, color: '#6d5dfc', margin: '8px 0 0'}}>{formatCurrency(financials.platformEarnings)}</h2>
                                </div>
                                <div style={{marginTop: 'auto', color: '#6d5dfc', fontSize: '0.8rem', fontWeight: 600}}>Commission: {settings.commissionPercentage}%</div>
                            </div>

                            <div className="fin-premium-card" style={{
                                background: '#fff',
                                padding: '28px',
                                borderRadius: '24px',
                                boxShadow: 'var(--card-shadow)',
                                border: '1px solid rgba(0,0,0,0.03)',
                                transition: 'all 0.3s'
                            }}>
                                <div className="fin-card-icon" style={{
                                    width: '48px', height: '48px', borderRadius: '14px', 
                                    background: '#fff7ed', color: '#f59e0b', 
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.3rem'
                                }}>
                                    <i className="fas fa-calendar-day"></i>
                                </div>
                                <div>
                                    <span style={{fontSize: '0.85rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1px'}}>Daily Earnings</span>
                                    <h2 style={{fontSize: '2rem', fontWeight: 800, color: '#f59e0b', margin: '8px 0 0'}}>{formatCurrency(financials.dailyEarnings || financials.yesterdayEarnings)}</h2>
                                </div>
                                <div style={{marginTop: 'auto', color: '#94a3b8', fontSize: '0.8rem'}}>Refreshes daily</div>
                            </div>
                        </div>

                        {/* Animated Analytics Chart */}
                        <div className="premium-section-card" style={{padding: '32px'}}>
                            <h3 style={{margin: '0 0 24px', fontSize: '1.1rem', fontWeight: 800, color: '#1a162d', display: 'flex', alignItems: 'center', gap: '10px'}}>
                                <i className="fas fa-chart-line" style={{color: '#6d5dfc'}}></i>
                                7-Day Performance Analytics
                            </h3>
                            <div style={{width: '100%', height: 400, position: 'relative'}}>
                                {finLoading && (
                                    <div className="shimmer" style={{
                                        position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', 
                                        borderRadius: '16px', zIndex: 10, opacity: 0.5
                                    }}></div>
                                )}
                                <ResponsiveContainer>
                                    <AreaChart data={financials.chartData}>
                                        <defs>
                                            <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#6366f1" stopOpacity={0.15}/>
                                                <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                                            </linearGradient>
                                            <linearGradient id="colorEarnings" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.15}/>
                                                <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                        <XAxis 
                                            dataKey="date" 
                                            axisLine={false} 
                                            tickLine={false} 
                                            tick={{fill: '#94a3b8', fontSize: 12, fontWeight: 600}} 
                                            dy={10}
                                        />
                                        <YAxis 
                                            axisLine={false} 
                                            tickLine={false} 
                                            tick={{fill: '#94a3b8', fontSize: 12, fontWeight: 600}} 
                                            tickFormatter={(val) => `₹${val >= 1000 ? (val/1000).toFixed(1) + 'k' : val}`}
                                        />
                                        <Tooltip 
                                            contentStyle={{
                                                borderRadius: '16px', 
                                                border: 'none', 
                                                boxShadow: '0 10px 40px rgba(0,0,0,0.1)',
                                                padding: '12px 16px'
                                            }} 
                                            itemStyle={{fontWeight: 700}}
                                        />
                                        <Area 
                                            animationDuration={1500}
                                            type="monotone" 
                                            dataKey="revenue" 
                                            stroke="#6366f1" 
                                            strokeWidth={4} 
                                            fillOpacity={1} 
                                            fill="url(#colorRevenue)" 
                                            name="Revenue"
                                        />
                                        <Area 
                                            animationDuration={1800}
                                            type="monotone" 
                                            dataKey="earnings" 
                                            stroke="#8b5cf6" 
                                            strokeWidth={4} 
                                            fillOpacity={1} 
                                            fill="url(#colorEarnings)" 
                                            name="Net Profit"
                                        />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </div>
                )}

                {/* ===== SETTINGS TAB ===== */}
                {activeTab === 'settings' && (
                    <div className="premium-section-card">
                        <h4>Platform Configuration</h4>
                        <form onSubmit={updateGlobalSettings} className="settings-form">
                            <div style={{display: 'flex', gap: '30px'}}>
                                <div style={{flex: 1}}>
                                    <label style={{display: 'block', fontSize: '13px', fontWeight: 700, marginBottom: '10px', color: '#64748b'}}>DEFAULT COMMISSION %</label>
                                    <input type="number" className="premium-input" value={settings.commissionPercentage} onChange={e => setSettings({...settings, commissionPercentage: e.target.value})} />
                                </div>
                                <div style={{flex: 1}}>
                                    <label style={{display: 'block', fontSize: '13px', fontWeight: 700, marginBottom: '10px', color: '#64748b'}}>PLATFORM TAX (%)</label>
                                    <input type="number" className="premium-input" value={settings.taxPercentage} onChange={e => setSettings({...settings, taxPercentage: e.target.value})} />
                                </div>
                            </div>
                            <div>
                                <label style={{display: 'block', fontSize: '13px', fontWeight: 700, marginBottom: '10px', color: '#64748b'}}>BASE CURRENCY</label>
                                <select className="premium-input" value={settings.currency} onChange={e => setSettings({...settings, currency: e.target.value})}>
                                    <option value="INR">Indian Rupee (₹)</option>
                                    <option value="USD">US Dollar ($)</option>
                                    <option value="EUR">Euro (€)</option>
                                </select>
                            </div>
                            <button type="submit" className="royal-button" disabled={submitting}>
                                {submitting ? 'Applying Changes...' : 'Save Configuration'}
                            </button>
                        </form>
                    </div>
                )}
                </div>
            </div>

            {/* Custom Delete Confirmation Modal */}
            {roomToDelete && (
                <div className="custom-modal-overlay">
                    <div className="custom-modal-card delete-modal">
                        <div className="modal-icon-danger">
                            <i className="fas fa-exclamation-triangle"></i>
                        </div>
                        <h3>Delete Room Type?</h3>
                        <p>Are you sure you want to delete this room type? This action cannot be undone and will remove all associated inventory.</p>
                        <div className="modal-actions">
                            <button className="admin-btn admin-btn-cancel" onClick={cancelDeleteRoom}>Cancel</button>
                            <button className="admin-btn admin-btn-danger" onClick={confirmDeleteRoom}>Delete Everything</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminPanel;


