import React, { useState, useContext, useEffect } from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { 
    FaTachometerAlt, FaCompass, FaSuitcase, FaHeart, 
    FaCreditCard, FaUserAlt, FaBell, FaCog, FaSignOutAlt,
    FaBars, FaTimes
} from 'react-icons/fa';
import { AuthContext } from '../../context/AuthContext';
import './dashboard.css';

const CustomerDashboardLayout = () => {
    const { logout } = useContext(AuthContext);
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();

    // Close sidebar on navigation (mobile)
    useEffect(() => {
        setSidebarOpen(false);
    }, [location.pathname]);

    const navItems = [
        { path: '/dashboard', icon: <FaTachometerAlt />, label: 'Overview', end: true },
        { path: '/dashboard/explore', icon: <FaCompass />, label: 'Explore' },
        { path: '/dashboard/bookings', icon: <FaSuitcase />, label: 'Bookings' },
        { path: '/dashboard/wishlist', icon: <FaHeart />, label: 'Wishlist' },
        { path: '/dashboard/payments', icon: <FaCreditCard />, label: 'Payments' },
        { path: '/dashboard/profile', icon: <FaUserAlt />, label: 'Profile' },
        { path: '/dashboard/notifications', icon: <FaBell />, label: 'Notifications' },
        { path: '/dashboard/settings', icon: <FaCog />, label: 'Settings' },
    ];

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <div className="cd-dashboard-layout">
            {/* Mobile Header (Only visible on small screens) */}
            <div className="cd-mobile-header">
                <button className="cd-sidebar-toggle" onClick={() => setSidebarOpen(!sidebarOpen)}>
                    {sidebarOpen ? <FaTimes /> : <FaBars />}
                </button>
                <span className="cd-mobile-title">Elite Dashboard</span>
            </div>

            {/* Restored Sidebar */}
            <aside className={`cd-sidebar ${sidebarOpen ? 'open' : ''}`}>
                <nav className="cd-sidebar-nav">
                    {navItems.map((item) => (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            end={item.end}
                            className={({ isActive }) => `cd-nav-item ${isActive ? 'active' : ''}`}
                        >
                            {item.icon}
                            <span>{item.label}</span>
                        </NavLink>
                    ))}
                </nav>

                <div className="cd-sidebar-footer">
                    <button onClick={handleLogout} className="cd-logout-btn">
                        <FaSignOutAlt />
                        <span>Sign Out</span>
                    </button>
                </div>
            </aside>

            {/* Mobile Overlay */}
            {sidebarOpen && <div className="cd-sidebar-overlay" onClick={() => setSidebarOpen(false)} />}

            {/* Main Content Area */}
            <main className="cd-main">
                <div className="cd-content-area">
                    <Outlet />
                </div>
            </main>
        </div>
    );
};

export default CustomerDashboardLayout;
