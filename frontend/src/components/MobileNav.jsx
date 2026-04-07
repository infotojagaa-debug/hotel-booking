import React, { useState, useEffect, useContext } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import AdvancedSearch from './AdvancedSearch';

const MobileNav = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { userInfo } = useContext(AuthContext);
    const [isVisible, setIsVisible] = useState(true);
    const [showSearch, setShowSearch] = useState(false);
    const [lastScrollY, setLastScrollY] = useState(0);

    // Smart Visibility Logic: Show on activity, hide after 2s of inactivity
    useEffect(() => {
        let timeoutId = null;

        const showNav = () => {
            setIsVisible(true);
            if (timeoutId) clearTimeout(timeoutId);
            
            // Only hide if we are scrolled down (at the top it should always stay visible)
            timeoutId = setTimeout(() => {
                if (window.scrollY > 80) {
                    setIsVisible(false);
                }
            }, 2000);
        };

        const handleOpenSearch = () => setShowSearch(true);

        // Listen for all activity: Scroll, Mouse Move (Hover), Touch, etc.
        window.addEventListener('scroll', showNav, { passive: true });
        window.addEventListener('mousemove', showNav);
        window.addEventListener('mousedown', showNav);
        window.addEventListener('touchstart', showNav, { passive: true });
        window.addEventListener('open-mob-search', handleOpenSearch);
        
        // Initial timer
        timeoutId = setTimeout(() => {
            if (window.scrollY > 80) setIsVisible(false);
        }, 2000);

        return () => {
            window.removeEventListener('scroll', showNav);
            window.removeEventListener('mousemove', showNav);
            window.removeEventListener('mousedown', showNav);
            window.removeEventListener('touchstart', showNav);
            window.removeEventListener('open-mob-search', handleOpenSearch);
            if (timeoutId) clearTimeout(timeoutId);
        };
    }, []);

    const activeTab = location.pathname === '/' ? 'home' 
                    : location.pathname === '/wishlist' ? 'wishlist'
                    : location.pathname.startsWith('/dashboard') || location.pathname.startsWith('/admin') || location.pathname.startsWith('/manager') ? 'account'
                    : location.pathname === '/hotels' ? 'hotels' : '';

    const handlePopularSearch = (city) => {
        const searchData = {
            location: city,
            checkIn: null, checkOut: null,
            adults: 2, children: 0, rooms: 1,
            isPetFriendly: false
        };
        localStorage.setItem('elite_stays_search', JSON.stringify(searchData));
        setShowSearch(false);
        navigate(`/hotels?location=${city}`);
    };

    return (
        <>
            <nav className={`mob-bottom-bar ${!isVisible ? 'hidden-nav' : ''}`}>
                <Link to="/" className={`mob-tab ${activeTab === 'home' ? 'active' : ''}`}>
                    <span className="mob-tab-icon">🏠</span>
                    <span className="mob-tab-label">Home</span>
                </Link>

                <button className="mob-tab" onClick={() => setShowSearch(true)}>
                    <span className="mob-tab-icon">🔍</span>
                    <span className="mob-tab-label">Search</span>
                </button>

                <Link to="/hotels" className={`mob-tab ${activeTab === 'hotels' ? 'active' : ''}`}>
                    <span className="mob-tab-icon">🗺️</span>
                    <span className="mob-tab-label">Hotels</span>
                </Link>

                <Link to={userInfo ? '/wishlist' : '/login'} className={`mob-tab ${activeTab === 'wishlist' ? 'active' : ''}`}>
                    <span className="mob-tab-icon">❤️</span>
                    <span className="mob-tab-label">Saved</span>
                </Link>

                <Link
                    to={userInfo
                        ? (userInfo.role === 'admin' ? '/admin/dashboard' : userInfo.role === 'manager' ? '/manager/dashboard' : '/dashboard')
                        : '/login'}
                    className={`mob-tab ${activeTab === 'account' ? 'active' : ''}`}
                >
                    <span className="mob-tab-icon">👤</span>
                    <span className="mob-tab-label">Account</span>
                </Link>
            </nav>

            {/* Global Mobile Search Overlay */}
            {showSearch && (
                <div className="mob-search-overlay animate-in fade-in duration-300">
                    <div className="mob-overlay-header">
                        <button className="mob-overlay-back" onClick={() => setShowSearch(false)}>
                            <i className="fa fa-arrow-left"></i>
                        </button>
                        <span className="mob-overlay-title">Search Stays</span>
                    </div>

                    <div className="mob-overlay-body">
                        <AdvancedSearch onSearchComplete={() => setShowSearch(false)} />

                        <div className="mob-overlay-tips">
                            <h4>Popular Searches</h4>
                            <div className="mob-tip-chips">
                                {['Chennai', 'Goa', 'Ooty', 'Bangalore', 'Coorg', 'Pondicherry'].map((city) => (
                                    <button
                                        key={city}
                                        type="button"
                                        className="mob-tip-chip"
                                        onClick={() => handlePopularSearch(city)}
                                    >
                                        📍 {city}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default MobileNav;
