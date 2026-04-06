import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../utils/api';
import { AuthContext } from '../context/AuthContext';
import './ManagerDashboard.css';

import ManagerOverview      from './manager/ManagerOverview';
import ManagerHotels        from './manager/ManagerHotels';
import ManagerRooms         from './manager/ManagerRooms';
import ManagerAvailability  from './manager/ManagerAvailability';
import ManagerBookings      from './manager/ManagerBookings';
import ManagerReports       from './manager/ManagerReports';
import ManagerReviews       from './manager/ManagerReviews';
import ManagerOffers        from './manager/ManagerOffers';
import ManagerNotifications from './manager/ManagerNotifications';
import ManagerProfile       from './manager/ManagerProfile';
import NotificationBell     from '../components/notifications/NotificationBell';
import MobileManagerDashboard from './MobileManagerDashboard';

const NAV = [
  { id: 'overview',       label: 'Dashboard',      icon: 'fas fa-chart-pie', section: 'MAIN' },
  { id: 'hotels',         label: 'My Properties',  icon: 'fas fa-building',  section: 'MAIN' },
  { id: 'rooms',          label: 'Room Inventory', icon: 'fas fa-bed',       section: 'MAIN' },
  { id: 'availability',   label: 'Availability',   icon: 'fas fa-calendar-alt', section: 'MAIN' },
  { id: 'bookings',       label: 'Bookings',       icon: 'fas fa-clipboard-list', section: 'OPERATIONS' },
  { id: 'reports',        label: 'Reports',        icon: 'fas fa-file-invoice-dollar', section: 'OPERATIONS' },
  { id: 'reviews',        label: 'Reviews',        icon: 'fas fa-star',      section: 'OPERATIONS' },
  { id: 'offers',         label: 'Offers & Deals', icon: 'fas fa-tag',       section: 'MARKETING' },
  { id: 'notifications',  label: 'Notifications',  icon: 'fas fa-bell',      section: 'ACCOUNT' },
  { id: 'profile',        label: 'Profile',        icon: 'fas fa-user-circle', section: 'ACCOUNT' },
];

const PAGE_TITLES = {
  overview: 'Dashboard Overview', hotels: 'My Properties',
  rooms: 'Room Inventory', availability: 'Availability & Pricing',
  bookings: 'Booking Management', reports: 'Reports & Analytics',
  reviews: 'Reviews & Ratings', offers: 'Offers & Discounts',
  notifications: 'Notifications', profile: 'Profile Settings',
};

const ManagerDashboard = () => {
  const { userInfo, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const [activeTab, setActiveTab]         = useState('overview');
  const [loading, setLoading]             = useState(true);
  const [errorMsg, setErrorMsg]           = useState(null);
  const [analytics, setAnalytics]         = useState(null);
  const [hotels, setHotels]               = useState([]);
  const [selectedHotel, setSelectedHotel] = useState(null);
  const [rooms, setRooms]                 = useState([]);
  const [reservations, setReservations]   = useState([]);
  const [reviews, setReviews]             = useState([]);
  const [offers, setOffers]               = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [isMobile, setIsMobile]           = useState(window.innerWidth <= 768);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const fetchAll = async () => {
    try {
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
      console.error('Manager data fetch failed', e);
      setErrorMsg(e.response?.data?.message || e.message || 'API Error');
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

  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth > 1024);
  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  // ── Fetch all data on mount ──────────────────────────────────────────────
  useEffect(() => {
    fetchAll();
  }, []);

  // ── Collapse sidebar on mobile when tab changes ──────────────────────────
  useEffect(() => {
    if (window.innerWidth <= 1024) {
      setIsSidebarOpen(false);
    }
  }, [activeTab]);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleSelectHotel = (h) => {
    setSelectedHotel(h);
    fetchRooms(h._id);
  };

  const handleLogout = () => { logout(); navigate('/login'); };

  if (loading) {
    return (
      <div className="mgr-loading">
        <div className="mgr-spinner" />
        <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Loading Manager Portal…</span>
      </div>
    );
  }

  if (isMobile) {
    return <MobileManagerDashboard />;
  }

  const initials = userInfo?.name ? userInfo.name.substring(0, 2).toUpperCase() : 'HM';
  const sections = [...new Set(NAV.map(n => n.section))];

  return (
    <div className={`mgr-wrapper ${!isSidebarOpen ? 'sidebar-collapsed' : ''}`}>
      {/* Sidebar Overlay */}
      <div className={`dashboard-overlay ${isSidebarOpen ? 'active' : ''}`} onClick={() => setIsSidebarOpen(false)}></div>

      {/* ── SIDEBAR ─────────────────────────────── */}
      <aside className={`mgr-sidebar ${!isSidebarOpen ? 'collapsed' : ''} ${isSidebarOpen ? 'mobile-open' : ''}`}>
        <div className="mgr-sidebar-header-action">
          <button className="mgr-sidebar-toggle" onClick={toggleSidebar} title="Toggle Sidebar">
            <i className={`fas ${isSidebarOpen ? 'fa-indent' : 'fa-outdent'}`}></i>
          </button>
        </div>
        {/* Logo */}
        <div className="mgr-sidebar-logo">
          <div className="logo-icon">E</div>
          {!isSidebarOpen ? null : (
            <div>
              <div className="logo-text">Elite Stays Manager</div>
              <div className="logo-sub">Hotel Portal</div>
            </div>
          )}
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, paddingBottom: 8 }}>
          {sections.map(sec => (
            <div key={sec}>
              <div className="mgr-sidebar-section-title">{isSidebarOpen ? sec : '•'}</div>
              {NAV.filter(n => n.section === sec).map(n => (
                <div
                  key={n.id}
                  className={`mgr-nav-link ${activeTab === n.id ? 'active' : ''}`}
                  onClick={() => setActiveTab(n.id)}
                  title={!isSidebarOpen ? n.label : ''}
                >
                  <span className="nav-icon"><i className={n.icon}></i></span>
                  {isSidebarOpen && n.label}
                  {n.id === 'notifications' && unreadCount > 0 && (
                    <span className="nav-badge">{unreadCount}</span>
                  )}
                  {n.id === 'reviews' && reviews.filter(r => !r.managerReply?.text).length > 0 && (
                    <span className="nav-badge">{reviews.filter(r => !r.managerReply?.text).length}</span>
                  )}
                </div>
              ))}
            </div>
          ))}
        </nav>

        {/* User Footer */}
        <div className="mgr-sidebar-user">
          <div className="user-avatar">{initials}</div>
          {isSidebarOpen && (
            <div className="user-info">
              <div className="user-name">{userInfo?.name || 'Manager'}</div>
              <div className="user-role">Hotel Manager</div>
            </div>
          )}
          <div className="logout-btn" onClick={handleLogout} title="Logout">⎋</div>
        </div>
      </aside>

      <div className={`mgr-main`}>
        {/* Top Bar */}
        <header className="mgr-topbar">
          <div className="mgr-topbar-left">
            <button className="mgr-sidebar-toggle-mobile show-mobile" onClick={toggleSidebar} style={{marginRight: '15px', background: 'none', border: 'none', fontSize: '20px', color: 'var(--primary)'}}>
              <i className={`fas ${isSidebarOpen ? 'fa-times' : 'fa-bars'}`}></i>
            </button>
            <h1>{PAGE_TITLES[activeTab]}</h1>
          </div>
          <div className="mgr-topbar-right">
            {hotels.length > 1 && (
              <select
                className="hotel-selector"
                value={selectedHotel?._id || ''}
                onChange={e => {
                  const h = hotels.find(h => h._id === e.target.value);
                  if (h) handleSelectHotel(h);
                }}
              >
                {hotels.map(h => <option key={h._id} value={h._id}>{h.name}</option>)}
              </select>
            )}
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }} className="admin-nav-bell">
              <NotificationBell />
            </div>
            <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(135deg,var(--primary),#818cf8)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer' }}
              onClick={() => setActiveTab('profile')}>
              {initials}
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="mgr-content">
          <div className="container-elite section-premium">
            {errorMsg && (
              <div style={{ padding: '20px', background: '#ffe4e6', color: '#e11d48', borderRadius: '8px', marginBottom: '20px' }}>
                <strong>Error loading dashboard:</strong> {errorMsg}
              </div>
            )}
            {activeTab === 'overview'      && <ManagerOverview analytics={analytics} reservations={reservations} />}
            {activeTab === 'hotels'        && <ManagerHotels hotels={hotels} selectedHotel={selectedHotel} onSelectHotel={handleSelectHotel} onRefresh={fetchAll} />}
            {activeTab === 'rooms'         && <ManagerRooms rooms={rooms} hotels={hotels} selectedHotel={selectedHotel} onSelectHotel={handleSelectHotel} onRefresh={() => { fetchAll(); }} />}
            {activeTab === 'availability'  && <ManagerAvailability rooms={rooms} hotels={hotels} selectedHotel={selectedHotel} onSelectHotel={handleSelectHotel} />}
            {activeTab === 'bookings'      && <ManagerBookings reservations={reservations} onRefresh={fetchAll} />}
            {activeTab === 'reports'       && <ManagerReports reservations={reservations} analytics={analytics} />}
            {activeTab === 'reviews'       && <ManagerReviews reviews={reviews} onRefresh={fetchAll} />}
            {activeTab === 'offers'        && <ManagerOffers offers={offers} hotels={hotels} onRefresh={fetchAll} />}
            {activeTab === 'notifications' && <ManagerNotifications notifications={notifications} onRefresh={fetchAll} />}
            {activeTab === 'profile'       && <ManagerProfile userInfo={userInfo} onRefresh={fetchAll} />}
          </div>
        </main>
      </div>
    </div>
  );
};

export default ManagerDashboard;
