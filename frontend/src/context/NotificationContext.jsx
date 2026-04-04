import React, { createContext, useContext, useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import { AuthContext } from './AuthContext';
import API, { BACKEND_URL } from '../utils/api';
import { useToast } from '../components/WishlistToast';

export const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
    const { user } = useContext(AuthContext);
    const { showToast } = useToast();
    const [notifications, setNotifications] = useState([]);
    const [socket, setSocket] = useState(null);

    const fetchNotifications = async () => {
        try {
            const { data } = await API.get('/notifications');
            setNotifications(data);
        } catch (error) {
            console.error('Failed to load notifications:', error);
        }
    };

    useEffect(() => {
        if (user) {
            fetchNotifications();
            
            // Connect to Backend WebSocket
            const newSocket = io(BACKEND_URL, {
                reconnection: true,
            });
            setSocket(newSocket);

            newSocket.on('connect', () => {
                console.log('Connected to notification socket');
                newSocket.emit('register', user._id);
            });

            // Listen for Real-Time Pushes
            newSocket.on('newNotification', (newNotif) => {
                setNotifications(prev => [newNotif, ...prev]);
                showToast(newNotif.message, 'success'); // Trigger global toast
            });

            return () => {
                newSocket.disconnect();
            };
        } else {
            setNotifications([]);
            if (socket) {
                socket.disconnect();
                setSocket(null);
            }
        }
        // eslint-disable-next-line
    }, [user]);

    const markAsRead = async (id) => {
        try {
            await API.patch(`/notifications/${id}/read`);
            setNotifications(prev => prev.map(n => n._id === id ? { ...n, isRead: true } : n));
        } catch (error) {
            console.error('Error marking notification as read');
        }
    };

    const markAllAsRead = async () => {
        try {
            await API.patch(`/notifications/read-all`);
            setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
        } catch (error) {
            console.error('Error marking all notifications as read');
        }
    };

    const clearAll = async () => {
        try {
            await API.delete(`/notifications`);
            setNotifications([]);
        } catch (error) {
            console.error('Error clearing notifications');
        }
    };

    const unreadCount = notifications.filter(n => !n.isRead).length;

    return (
        <NotificationContext.Provider value={{
            notifications,
            unreadCount,
            markAsRead,
            markAllAsRead,
            clearAll,
            fetchNotifications
        }}>
            {children}
        </NotificationContext.Provider>
    );
};
