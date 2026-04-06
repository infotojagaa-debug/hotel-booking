import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../utils/api';
import { AuthContext } from '../context/AuthContext';
import './MobileManagerDashboard.css';

const MobileManagerDashboard = () => {
    const { userInfo, logout } = useContext(AuthContext);
    const navigate = useNavigate();

    const [activeTab, setActiveTab] = useState('overview');
    const [loading, setLoading] = useState(true);
    const [analytics, setAnalytics] = useState(null);
    const [hotels, setHotels] = useState([]);
    const [reservations, setReservations] = useState([]);

    const fetchAll = async () => {
        try {
            const [ana, hot, res] = await Promise.all([
                API.get('/manager/analytics'),
                API.get('/manager/hotels'),
                API.get('/manager/reservations')
            ]);
            setAnalytics(ana.data);
            setHotels(hot.data);
            setReservations(res.data);
        } catch (e) {
            console.error('Mobile manager fetch error', e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        document.body.classList.add('mobile-manager-active');
        fetchAll();
        return () => document.body.classList.remove('mobile-manager-active');
    }, []);

    const updateReservation = async (id, status) => {
        try {
            await API.put(`/manager/reservations/${id}/status`, { status });
            setReservations(reservations.map(r => r._id === id ? { ...r, status } : r));
        } catch (e) {
            alert('Status update failed');
        }
    };

    if (loading) return (
        <div className="flex items-center justify-center min-h-[100vh] bg-gray-50">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
        </div>
    );

    return (
        <div className="mob-mgr-root">
            <div className="mob-mgr-hdr">
                <div className="mob-mgr-pic">
                    {userInfo?.name?.substring(0, 2).toUpperCase() || 'HM'}
                </div>
                <div className="mob-mgr-hdr-text">
                    <h2>{userInfo?.name || 'Manager'}</h2>
                    <p>Manager Portal</p>
                </div>
                <button className="mob-mgr-logout" onClick={() => { logout(); navigate('/login'); }}>
                    <i className="fa fa-sign-out-alt"></i>
                </button>
            </div>

            <div className="mob-mgr-main">
                {activeTab === 'overview' && (
                    <div className="mob-mgr-overview">
                        <div className="mob-mgr-stats">
                            <div className="mob-mstat rev">
                                <i className="fa fa-chart-line"></i>
                                <span>Revenue</span>
                                <h3>₹{((analytics?.revenue || 0)/1000).toFixed(1)}k</h3>
                            </div>
                            <div className="mob-mstat occ">
                                <i className="fa fa-bed"></i>
                                <span>Occupancy</span>
                                <h3>{analytics?.occupancyRate || 0}%</h3>
                            </div>
                            <div className="mob-mstat book">
                                <i className="fa fa-calendar-check"></i>
                                <span>Bookings</span>
                                <h3>{analytics?.totalBookings || reservations.length}</h3>
                            </div>
                            <div className="mob-mstat prop">
                                <i className="fa fa-building"></i>
                                <span>Properties</span>
                                <h3>{hotels.length}</h3>
                            </div>
                        </div>

                        <h3>Recent Bookings</h3>
                        <div className="mob-mgr-list">
                            {reservations.slice(0, 5).map(r => (
                                <div key={r._id} className="mob-mgr-card">
                                    <div className="mob-mc-header">
                                        <h4>{r.user?.name || 'Guest'}</h4>
                                        <span className={`mob-m-status ${r.status.toLowerCase()}`}>{r.status}</span>
                                    </div>
                                    <p className="text-sm text-gray-500 mb-1">{r.hotel?.name}</p>
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-gray-500">{new Date(r.checkInDate).toLocaleDateString()}</span>
                                        <strong className="text-indigo-600">₹{r.totalPrice?.toLocaleString()}</strong>
                                    </div>
                                </div>
                            ))}
                            {reservations.length === 0 && <p className="text-gray-400 text-sm">No recent bookings</p>}
                        </div>
                    </div>
                )}

                {activeTab === 'reservations' && (
                    <div className="mob-mgr-reservations">
                        <h3>All Reservations</h3>
                        <div className="mob-mgr-list">
                            {reservations.map(r => (
                                <div key={r._id} className="mob-mgr-card">
                                    <div className="mob-mc-header">
                                        <h4>{r.user?.name || 'Guest'}</h4>
                                        <select 
                                            className="mob-mc-select" 
                                            value={r.status}
                                            onChange={(e) => updateReservation(r._id, e.target.value)}
                                        >
                                            <option>Confirmed</option>
                                            <option>Checked In</option>
                                            <option>Checked Out</option>
                                            <option>Cancelled</option>
                                        </select>
                                    </div>
                                    <div className="text-sm text-gray-500 mt-2">
                                        <p><i className="fa fa-building w-4"></i> {r.hotel?.name}</p>
                                        <p><i className="fa fa-calendar w-4"></i> {new Date(r.checkInDate).toLocaleDateString()} to {new Date(r.checkOutDate).toLocaleDateString()}</p>
                                    </div>
                                    <div className="mt-3 pt-3 border-t flex justify-between font-bold">
                                        <span>Total</span>
                                        <span className="text-indigo-600">₹{r.totalPrice?.toLocaleString()}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
                
                {activeTab === 'properties' && (
                    <div className="mob-mgr-properties">
                         <h3>My Properties</h3>
                         <div className="mob-mgr-list">
                            {hotels.map(h => (
                                <div key={h._id} className="mob-mgr-card">
                                    <h4>{h.name}</h4>
                                    <p className="text-sm text-gray-500 mb-2">{h.city}</p>
                                    <div className="flex gap-2">
                                        <span className={`mob-m-status ${h.isApproved ? 'active' : 'pending'}`}>
                                            {h.isApproved ? 'LIVE' : 'PENDING APPROVAL'}
                                        </span>
                                    </div>
                                </div>
                            ))}
                         </div>
                    </div>
                )}
            </div>

            <div className="mob-mgr-bot">
                <div className={`mob-mgr-tab ${activeTab === 'overview' ? 'active' : ''}`} onClick={() => setActiveTab('overview')}>
                    <i className="fa fa-chart-line"></i>
                    <span>Overview</span>
                </div>
                <div className={`mob-mgr-tab ${activeTab === 'properties' ? 'active' : ''}`} onClick={() => setActiveTab('properties')}>
                    <i className="fa fa-building"></i>
                    <span>Properties</span>
                </div>
                <div className={`mob-mgr-tab ${activeTab === 'reservations' ? 'active' : ''}`} onClick={() => setActiveTab('reservations')}>
                    <i className="fa fa-clipboard-list"></i>
                    <span>Reservations</span>
                </div>
            </div>
        </div>
    );
};

export default MobileManagerDashboard;
