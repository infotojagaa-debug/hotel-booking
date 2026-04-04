import React from 'react';
import API from '../../utils/api';

const NOTIF_ICONS = { Info: 'ℹ️', Success: '✅', Warning: '⚠️', Alert: '🔔' };
const NOTIF_CLASS = { Info: 'info', Success: 'success', Warning: 'warning', Alert: 'alert' };

const ManagerNotifications = ({ notifications, onRefresh }) => {
    const unread = notifications.filter(n => !n.isRead).length;

    const markRead = async (id) => {
        try { await API.put(`/manager/notifications/${id}/read`); onRefresh(); } catch {}
    };

    const markAll = async () => {
        try { await API.put('/manager/notifications/read-all'); onRefresh(); } catch {}
    };

    return (
        <div>
            <div className="flex-between mb-16">
                <div className="mgr-section-title">🔔 Notifications {unread > 0 && <span className="badge badge-red">{unread} new</span>}</div>
                {unread > 0 && <button className="mgr-btn mgr-btn-outline mgr-btn-sm" onClick={markAll}>✓ Mark All Read</button>}
            </div>

            <div className="mgr-card">
                {notifications.length === 0 ? (
                    <div className="mgr-empty"><div className="empty-icon">🔔</div><p>No notifications yet</p></div>
                ) : (
                    notifications.map(n => (
                        <div key={n._id} className={`notif-item ${!n.isRead ? 'unread' : ''}`} onClick={() => !n.isRead && markRead(n._id)}>
                            <div className={`notif-icon ${NOTIF_CLASS[n.type] || 'info'}`}>
                                {NOTIF_ICONS[n.type] || 'ℹ️'}
                            </div>
                            <div className="notif-body">
                                <div className="notif-msg">{n.message}</div>
                                <div className="notif-time">{new Date(n.createdAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}</div>
                            </div>
                            {!n.isRead && <div className="notif-dot" title="Unread" />}
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default ManagerNotifications;
