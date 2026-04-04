import React, { useContext, useState, useRef, useEffect } from 'react';
import { NotificationContext } from '../../context/NotificationContext';
import { useNavigate } from 'react-router-dom';
import './NotificationStyles.css';

const NotificationBell = () => {
    const { notifications, unreadCount, markAsRead, clearAll } = useContext(NotificationContext);
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);
    const navigate = useNavigate();

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const getIconForType = (type) => {
        switch (type) {
            case 'booking': return '🛎️';
            case 'payment': return '💰';
            case 'hotel': return '🏨';
            case 'offer': return '🎁';
            case 'system': return '⚙️';
            default: return '🔔';
        }
    };

    const handleNotificationClick = (notif) => {
        markAsRead(notif._id);
        setIsOpen(false);
        // Basic routing logic based on type and role
        if (notif.type === 'booking') {
            navigate('/dashboard/bookings');
        } else if (notif.type === 'payment') {
            navigate('/dashboard/payments');
        } else {
            navigate('/dashboard'); 
        }
    };

    const isPanel = window.location.pathname.startsWith('/admin') || window.location.pathname.startsWith('/manager');

    return (
        <div className="notification-bell-container" ref={dropdownRef}>
            <div className="notification-bell" onClick={() => setIsOpen(!isOpen)}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={`bell-svg ${isPanel ? 'text-slate-600' : 'text-white'}`}>
                    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                    <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
                </svg>
                {unreadCount > 0 && <span className="bell-badge">{unreadCount > 9 ? '9+' : unreadCount}</span>}
            </div>

            {isOpen && (
                <div className="notification-dropdown-panel">
                    <div className="noti-header">
                        <span className="noti-title">Notifications</span>
                        <button className="noti-clear-btn" onClick={clearAll}>Clear All</button>
                    </div>

                    <div className="noti-list">
                        {notifications.length === 0 ? (
                            <div className="noti-empty">
                                <span style={{fontSize: '2rem'}}>🔕</span>
                                <p>You're all caught up!</p>
                            </div>
                        ) : (
                            notifications.map(notif => (
                                <div 
                                    key={notif._id} 
                                    className={`noti-item ${notif.isRead ? 'read' : 'unread'}`}
                                    onClick={() => handleNotificationClick(notif)}
                                >
                                    <div className="noti-icon">{getIconForType(notif.type)}</div>
                                    <div className="noti-content">
                                        <p className="noti-message">{notif.message}</p>
                                        <span className="noti-time">
                                            {new Date(notif.createdAt).toLocaleDateString()}
                                        </span>
                                    </div>
                                    {!notif.isRead && <div className="noti-unread-dot"></div>}
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default NotificationBell;
