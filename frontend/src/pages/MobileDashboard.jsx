import React, { useState, useEffect, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import API from '../utils/api';
import { AuthContext } from '../context/AuthContext';
import './MobileDashboard.css';

const MobileDashboard = () => {
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const { userInfo, logout } = useContext(AuthContext);
    const navigate = useNavigate();

    useEffect(() => {
        document.body.classList.add('mobile-app-active');
        const fetchMyBookings = async () => {
            try {
                const { data } = await API.get('/bookings/mybookings');
                setBookings(data);
            } catch (error) {
                console.error('Error fetching bookings', error);
            } finally {
                setLoading(false);
            }
        };
        fetchMyBookings();

        return () => document.body.classList.remove('mobile-app-active');
    }, []);

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    if (loading) return (
        <div className="flex items-center justify-center min-h-[100vh]">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#9EB393]"></div>
        </div>
    );

    return (
        <div className="mob-dash-root">
            {/* Header */}
            <div className="mob-dash-header">
                <div className="mob-dash-user-bar">
                    <div className="mob-dash-avatar">
                        {userInfo?.name?.charAt(0).toUpperCase()}
                    </div>
                    <div className="mob-dash-greeting">
                        <h2>{userInfo?.name}</h2>
                        <p>{userInfo?.email}</p>
                    </div>
                    <button className="mob-dash-logout" onClick={handleLogout}>
                        <i className="fa fa-sign-out-alt"></i>
                    </button>
                </div>
                
                <div className="mob-dash-quick-actions">
                    <Link to="/hotels" className="mob-qa-btn">
                        <i className="fa fa-search"></i>
                        <span>Explore</span>
                    </Link>
                    <Link to="/wishlist" className="mob-qa-btn outline">
                        <i className="fa fa-heart"></i>
                        <span>Wishlist</span>
                    </Link>
                </div>
            </div>

            {/* Content */}
            <div className="mob-dash-content">
                <div className="mob-dash-section-title">
                    <h3>My Trips</h3>
                    <span>{bookings.length}</span>
                </div>

                {bookings.length === 0 ? (
                    <div className="mob-empty-state">
                        <i className="fa fa-calendar-times"></i>
                        <h4>No trips yet</h4>
                        <p>Time to dust off your bags and start planning your next adventure.</p>
                        <Link to="/hotels">Start Searching</Link>
                    </div>
                ) : (
                    <div className="mob-bookings-list">
                        {bookings.map(b => (
                            <div key={b._id} className="mob-booking-card">
                                <div className="mob-bc-header">
                                    <h4>{b.room?.name || 'Room'}</h4>
                                    <span className={`mob-status ${b.status.toLowerCase()}`}>{b.status}</span>
                                </div>
                                <div className="mob-bc-dates">
                                    <i className="fa fa-calendar-alt text-[#9EB393]"></i>
                                    <span>
                                        {new Date(b.checkInDate).toLocaleDateString('en-US', { day: 'numeric', month: 'short' })} - {new Date(b.checkOutDate).toLocaleDateString('en-US', { day: 'numeric', month: 'short' })}
                                    </span>
                                </div>
                                <div className="mob-bc-footer">
                                    <div className="mob-bc-price">
                                        <small>Total paid</small>
                                        <strong>₹{b.totalPrice?.toLocaleString()}</strong>
                                    </div>
                                    <span className={`mob-payment ${b.paymentStatus.toLowerCase()}`}>
                                        <i className="fa fa-credit-card"></i> {b.paymentStatus}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Bottom Nav */}
            <div className="mob-dash-bottom-nav">
                <Link to="/" className="mob-nav-item">
                    <i className="fa fa-home"></i>
                    <span>Home</span>
                </Link>
                <Link to="/hotels" className="mob-nav-item">
                    <i className="fa fa-search"></i>
                    <span>Search</span>
                </Link>
                <Link to="/dashboard" className="mob-nav-item active">
                    <i className="fa fa-user"></i>
                    <span>Profile</span>
                </Link>
            </div>
        </div>
    );
};

export default MobileDashboard;
