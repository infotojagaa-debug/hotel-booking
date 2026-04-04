import React, { useState, useEffect } from 'react';
import { 
    FaBell, FaCheckCircle, FaPercentage, 
    FaExclamationCircle, FaCircle, FaInfoCircle, FaCheckDouble,
    FaRegBellSlash, FaClock, FaChevronRight, FaCalendarCheck
} from 'react-icons/fa';
import API from '../../utils/api';
import './dashboard.css';

const CustomerNotifications = () => {
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        let mounted = true;
        API.get('/notifications')
            .then(({ data }) => {
                if (mounted) {
                    setNotifications(Array.isArray(data) ? data : []);
                }
            })
            .catch(err => {
                if (mounted) {
                    setError('Failed to sync notifications.');
                    console.error('Notification Error:', err);
                }
            })
            .finally(() => { 
                if (mounted) setLoading(false); 
            });
        return () => { mounted = false; };
    }, []);

    const markAllAsRead = async () => {
        try {
            await API.patch('/notifications/read-all');
            setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
        } catch (error) {
            console.error('Failed to mark all as read', error);
        }
    };

    const markAsRead = async (id) => {
        try {
            await API.patch(`/notifications/${id}/read`);
            setNotifications(prev => prev.map(n => n._id === id ? { ...n, isRead: true } : n));
        } catch (error) {
            console.error('Failed to mark as read', error);
        }
    };

    if (loading) {
        return (
            <div className="space-y-6">
                {[1, 2, 3].map(i => (
                    <div key={i} className="h-24 bg-white animate-pulse rounded-[16px] shadow-sm" />
                ))}
            </div>
        );
    }

    const unreadCount = notifications.filter(n => !n.isRead).length;

    return (
        <div className="animate-fade-in max-w-[900px] mx-auto">
            <div className="flex items-center justify-between mb-10">
                <div>
                    <h1 className="text-3xl font-extrabold text-slate-900 mb-2">Notifications</h1>
                    <p className="text-slate-500 font-medium">Stay updated with your bookings and exclusive offers.</p>
                </div>
                {unreadCount > 0 && (
                    <button 
                        onClick={markAllAsRead} 
                        className="flex items-center gap-2 text-sm font-bold text-[#6d5dfc] hover:bg-[#6d5dfc]/5 px-4 py-2 rounded-full transition-all"
                    >
                        <FaCheckDouble /> Mark all as read
                    </button>
                )}
            </div>

            {error ? (
                <div className="cd-card-premium text-center py-12">
                    <p className="text-rose-500 font-bold mb-4">{error}</p>
                    <button onClick={() => window.location.reload()} className="cd-btn-gradient px-8 py-3">Retry Sync</button>
                </div>
            ) : notifications.length === 0 ? (
                <div className="cd-card-premium text-center py-20 flex flex-col items-center gap-6">
                    <div className="w-24 h-24 rounded-full bg-slate-50 flex items-center justify-center text-slate-200 text-5xl">
                        <FaRegBellSlash />
                    </div>
                    <div>
                        <h3 className="text-xl font-bold text-slate-800 mb-2">No notifications yet</h3>
                        <p className="text-slate-400 font-medium max-w-xs">We'll let you know when something important happens.</p>
                    </div>
                </div>
            ) : (
                <div className="space-y-4">
                    {notifications.map((n, idx) => (
                        <div 
                            key={n._id || idx} 
                            className={`cd-card-premium notif-card !mb-0 ${!n.isRead ? 'unread' : ''}`}
                            onClick={() => !n.isRead && markAsRead(n._id)}
                            style={{ animationDelay: `${idx * 0.05}s` }}
                        >
                            {!n.isRead && <span className="notif-indicator" />}
                            
                            <div className={`notif-icon-box ${
                                n.type === 'booking' ? 'bg-green-50 text-green-500' :
                                n.type === 'offer' ? 'bg-amber-50 text-amber-500' :
                                n.type === 'alert' ? 'bg-rose-50 text-rose-500' :
                                'bg-indigo-50 text-indigo-500'
                            }`}>
                                {n.type === 'booking' ? <FaCalendarCheck /> :
                                 n.type === 'offer' ? <FaPercentage /> :
                                 n.type === 'alert' ? <FaExclamationCircle /> :
                                 <FaInfoCircle />}
                            </div>

                            <div className="flex-1">
                                <div className="flex items-center justify-between mb-1">
                                    <h4 className={`text-base font-bold ${!n.isRead ? 'text-slate-900' : 'text-slate-600'}`}>
                                        {n.title || 'Elite Update'}
                                    </h4>
                                    <div className="flex items-center gap-2 text-[11px] font-bold text-slate-400 uppercase tracking-tighter">
                                        <FaClock className="text-slate-300" />
                                        {n.createdAt ? new Date(n.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : 'Today'}
                                    </div>
                                </div>
                                <p className="text-sm font-medium text-slate-500 leading-relaxed pr-8">
                                    {n.message}
                                </p>
                            </div>

                            <FaChevronRight className="text-slate-200 mt-2 self-center sm:block hidden" />
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default CustomerNotifications;
