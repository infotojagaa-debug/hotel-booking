import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import API, { BACKEND_URL } from '../utils/api';
import { AuthContext } from '../context/AuthContext';
import './MobileManagerDashboard.css';
import { 
    BarChart, Bar, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid 
} from 'recharts';


const MobileManagerDashboard = () => {
    const { userInfo, logout } = useContext(AuthContext);
    const navigate = useNavigate();

    // --- State ---
    const [activeTab, setActiveTab] = useState('overview');
    const [loading, setLoading] = useState(true);
    const [analytics, setAnalytics] = useState(null);
    const [hotels, setHotels] = useState([]);
    const [selectedHotel, setSelectedHotel] = useState(null);
    const [rooms, setRooms] = useState([]);
    const [reservations, setReservations] = useState([]);
    const [reviews, setReviews] = useState([]);
    const [offers, setOffers] = useState([]);
    const [notifications, setNotifications] = useState([]);
    
    // --- New Form States ---
    const [showAddHotel, setShowAddHotel] = useState(false);
    const [showAddRoom, setShowAddRoom] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [hotelForm, setHotelForm] = useState({
        name: '', city: '', address: '', description: '', type: 'Hotel', starRating: 3, cheapestPrice: ''
    });
    const [roomForm, setRoomForm] = useState({
        name: '', type: 'Classic Room', pricePerNight: '', maxGuests: 2, description: '', totalRoomCount: 1
    });
    const [previewImage, setPreviewImage] = useState(null);
    const [selectedImageFile, setSelectedImageFile] = useState(null);
    
    // --- Config ---
    const TABS = [
        { id: 'overview', label: 'Dashboard', icon: 'fa-chart-pie' },
        { id: 'hotels', label: 'Properties', icon: 'fa-building' },
        { id: 'rooms', label: 'Inventory', icon: 'fa-bed' },
        { id: 'availability', label: 'Pricing', icon: 'fa-calendar-alt' },
        { id: 'bookings', label: 'Bookings', icon: 'fa-clipboard-list' },
        { id: 'reports', label: 'Reports', icon: 'fa-file-invoice-dollar' },
        { id: 'reviews', label: 'Reviews', icon: 'fa-star' },
        { id: 'offers', label: 'Offers', icon: 'fa-tag' },
        { id: 'notifications', label: 'Alerts', icon: 'fa-bell' },
        { id: 'profile', label: 'Profile', icon: 'fa-user-circle' },
    ];

    const formatCurrency = (amt) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amt || 0);

    // --- Lifecycle ---
    useEffect(() => {
        document.body.classList.add('mobile-app-active');
        fetchAll();
        return () => document.body.classList.remove('mobile-app-active');
    }, []);

    const fetchAll = async () => {
        try {
            setLoading(true);
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
            console.error(e);
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

    const handleAddHotel = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            let imageUrl = 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80';
            if (selectedImageFile) {
                const formData = new FormData();
                formData.append('image', selectedImageFile);
                const { data } = await API.post('/upload', formData);
                imageUrl = data.url;
            }
            
            await API.post('/admin/hotels', { ...hotelForm, images: [imageUrl], isApproved: true });
            setShowAddHotel(false);
            fetchAll();
        } catch (err) { alert(err.response?.data?.message || 'Failed to add hotel'); }
        finally { setSubmitting(false); }
    };

    const handleAddRoom = async (e) => {
        e.preventDefault();
        if (!selectedHotel) return alert('Select a hotel first');
        setSubmitting(true);
        try {
            let imageUrl = 'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=800&q=80';
            if (selectedImageFile) {
                const formData = new FormData();
                formData.append('image', selectedImageFile);
                const { data } = await API.post('/upload', formData);
                imageUrl = data.url;
            }
            
            await API.post('/manager/rooms', { ...roomForm, images: [imageUrl], hotelId: selectedHotel._id });
            setShowAddRoom(false);
            fetchAll();
        } catch (err) { alert(err.response?.data?.message || 'Failed to add room'); }
        finally { setSubmitting(false); }
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setSelectedImageFile(file);
            setPreviewImage(URL.createObjectURL(file));
        }
    };

    if (loading) return <div className="mob-admin-loading"><div className="mob-spinner"></div></div>;

    // --- Tab Renderers ---

    const renderOverview = () => (
        <div className="mob-mgr-pane">
            <div className="mob-adm-stats-grid">
                {[
                    { label: 'Revenue', val: formatCurrency(analytics?.netEarnings || 0), color: '#6366f1', icon: 'fa-wallet' },
                    { label: 'Occupancy', val: `${analytics?.occupancyRate || 0}%`, color: '#10b981', icon: 'fa-house-user' },
                    { label: 'Active Bookings', val: analytics?.totalBookings || 0, color: '#f59e0b', icon: 'fa-clipboard-check' },
                    { label: 'Total Rooms', val: analytics?.totalRooms || 0, color: '#ec4899', icon: 'fa-bed' },
                ].map(s => (
                    <div key={s.label} className="mob-adm-stat-c">
                        <i className={`fas ${s.icon}`} style={{color: s.color}}></i>
                        <span className="mob-st-val">{s.val}</span>
                        <span className="mob-st-lab">{s.label}</span>
                    </div>
                ))}
            </div>

            <div className="mob-adm-card">
                <h3>Recent Reservations</h3>
                <div className="mob-activity-list">
                    {reservations.slice(0, 5).map(r => (
                        <div key={r._id} className="mob-act-item">
                            <div className="mob-act-dot"></div>
                            <div className="mob-act-tx">
                                <strong>{r.user?.name || 'Guest'}</strong>
                                <span>{r.room?.name}</span>
                            </div>
                            <div className="mob-act-pr">{formatCurrency(r.managerEarnings)}</div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );

    const renderInventory = () => (
        <div className="mob-mgr-pane">
            <div className="mob-sec-hdr">
                <h3>Room Inventory</h3>
                <button className="mob-add-btn" onClick={() => { setRoomForm({ ...roomForm }); setShowAddRoom(true); }}>+ Add Room</button>
            </div>
            {rooms.map(r => (
                <div key={r._id} className="mob-adm-card room-inv-c">
                    <div className="rm-inv-top">
                        <strong>{r.name}</strong>
                        <span className={`rm-st ${r.status?.toLowerCase()}`}>{r.status || 'Available'}</span>
                    </div>
                    <div className="rm-inv-meta">
                        <span><i className="fa fa-users"></i> {r.maxGuests} Guests</span>
                        <span><i className="fa fa-tag"></i> {formatCurrency(r.pricePerNight)}</span>
                    </div>
                </div>
            ))}
        </div>
    );

    const renderBookings = () => (
        <div className="mob-mgr-pane">
            <div className="mob-sec-hdr">
                <h3>Reservations</h3>
            </div>
            {reservations.map(r => (
                <div key={r._id} className="mob-adm-card bkg-card">
                    <div className="bkg-c-hdr">
                        <span className="bkg-id">#{r._id.slice(-6).toUpperCase()}</span>
                        <select 
                            className={`bkg-st-sel ${r.status.toLowerCase()}`}
                            value={r.status}
                            onChange={(e) => handleStatusChange(r._id, e.target.value)}
                        >
                            <option>Pending</option>
                            <option>Confirmed</option>
                            <option>Checked-In</option>
                            <option>Checked-Out</option>
                            <option>Cancelled</option>
                        </select>
                    </div>
                    <div className="bkg-c-line"><strong>Guest:</strong> {r.user?.name}</div>
                    <div className="bkg-c-line"><strong>Stay:</strong> {new Date(r.checkInDate).toLocaleDateString()} - {new Date(r.checkOutDate).toLocaleDateString()}</div>
                    <div className="bkg-c-footer">
                        <strong>{formatCurrency(r.managerEarnings)}</strong>
                        <small className={r.paymentStatus === 'Paid' ? 'text-green-600' : 'text-amber-600'}>{r.paymentStatus}</small>
                    </div>
                </div>
            ))}
        </div>
    );

    return (
        <div className="mob-admin-root">
            {/* Header */}
            <header className="mob-adm-header">
                <div className="mob-adm-top">
                    <div className="mob-adm-logo">
                        <div className="mob-mgr-avatar">
                            {userInfo?.name?.substring(0, 1) || 'M'}
                        </div>
                        <div className="mob-mgr-meta">
                            <span>{userInfo?.name || 'Manager'}</span>
                            <small>Elite Manager</small>
                        </div>
                    </div>
                    <button className="mob-logout-c" onClick={() => { logout(); navigate('/login'); }}>
                        <i className="fas fa-sign-out-alt"></i>
                    </button>
                </div>

                {/* Scrollable Nav Bar */}
                <div className="mob-adm-nav-scroll">
                    {TABS.map(t => (
                        <button 
                            key={t.id} 
                            className={`mob-nav-tab ${activeTab === t.id ? 'active' : ''}`}
                            onClick={() => setActiveTab(t.id)}
                        >
                            <i className={`fas ${t.icon}`}></i>
                            <span>{t.label}</span>
                        </button>
                    ))}
                </div>
            </header>

            {/* Content Area */}
            <main className="mob-adm-content">
                {activeTab === 'overview' && renderOverview()}
                {activeTab === 'rooms' && renderInventory()}
                {activeTab === 'bookings' && renderBookings()}
                
                {/* Parity Hub for other sections */}
                {activeTab === 'hotels' && (
                    <div className="mob-mgr-pane">
                        <div className="mob-sec-hdr">
                            <h3>My Properties</h3>
                            <button className="mob-add-btn" onClick={() => setShowAddHotel(true)}>+ Add Hotel</button>
                        </div>
                        {hotels.map(h => (
                            <div key={h._id} className="mob-adm-list-item">
                                <div className="mob-li-info">
                                    <strong>{h.name}</strong>
                                    <span>{h.city} · {h.isApproved ? 'Live' : 'Pending'}</span>
                                </div>
                                <i className="fa fa-arrow-right text-gray-300"></i>
                            </div>
                        ))}
                    </div>
                )}
                
                {activeTab === 'availability' && (
                    <div className="mob-mgr-pane">
                        <h3>Availability Control</h3>
                        <p className="text-gray-500 text-xs mb-4">Porting calendar view to mobile. Use "Inventory" for price checks.</p>
                        {rooms.slice(0, 5).map(r => (
                            <div key={r._id} className="mob-adm-card">
                                <div className="flex justify-between items-center">
                                    <strong>{r.name}</strong>
                                    <span className="text-sm font-bold text-indigo-600">{r.weekendPriceMultiplier}x Wknd</span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {activeTab === 'reports' && (
                    <div className="mob-mgr-pane">
                        <div className="mob-adm-card fin-card">
                            <h3>Financial Performance</h3>
                            <div className="fin-grid">
                                <div className="fin-item"><span>Net Earnings</span><strong>{formatCurrency(analytics?.netEarnings)}</strong></div>
                                <div className="fin-item"><span>Total Revenue</span><strong>{formatCurrency(analytics?.totalRevenue)}</strong></div>
                            </div>
                        </div>

                        {analytics?.monthlyData && (
                            <div className="mob-adm-card">
                                <h3>Monthly Revenue</h3>
                                <div style={{width: '100%', height: 200}}>
                                    <ResponsiveContainer>
                                        <BarChart data={analytics.monthlyData}>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                            <XAxis dataKey="month" hide />
                                            <YAxis hide />
                                            <Tooltip contentStyle={{fontSize: '10px'}} />
                                            <Bar dataKey="revenue" fill="#6d5dfc" radius={[4, 4, 0, 0]} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                        )}
                        
                        <div className="mob-adm-card">
                            <h3>Payment Status</h3>
                            <div className="mob-activity-list">
                                {reservations.filter(r => r.paymentStatus === 'Unpaid').map(r => (
                                    <div key={r._id} className="mob-act-item">
                                        <div className="mob-act-dot bg-amber-400"></div>
                                        <div className="mob-act-tx">
                                            <strong>{r.user?.name}</strong>
                                            <span>Unpaid Stay</span>
                                        </div>
                                        <div className="mob-act-pr text-amber-600">{formatCurrency(r.managerEarnings)}</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'reviews' && (
                    <div className="mob-mgr-pane">
                        <h3>Guest Feedback</h3>
                        {reviews.map(r => (
                            <div key={r._id} className="mob-adm-card">
                                <div className="rev-hdr"><strong>{r.user?.name}</strong> <span>{r.rating}★</span></div>
                                <p className="text-sm my-2 italic">"{r.comment}"</p>
                                <div className={r.managerReply?.text ? 'text-green-600 text-[10px] font-bold' : 'text-amber-600 text-[10px] font-bold'}>
                                    {r.managerReply?.text ? '✓ REPLIED' : '⚠ NEEDS REPLY'}
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {activeTab === 'offers' && (
                    <div className="mob-mgr-pane">
                        <h3>Hotel Offers</h3>
                        {offers.map(o => (
                            <div key={o._id} className="mob-adm-card">
                                <strong>{o.code}</strong>
                                <p className="text-xs">{o.title}</p>
                                <div className="text-indigo-600 font-bold mt-1">
                                    {o.discountType === 'Percentage' ? `${o.discountValue}% OFF` : `₹${o.discountValue} OFF`}
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {activeTab === 'notifications' && (
                    <div className="mob-mgr-pane">
                        <h3>Business Alerts</h3>
                        {notifications.map(n => (
                            <div key={n._id} className={`mob-adm-list-item ${n.isRead ? 'opacity-60' : 'border-l-4 border-indigo-600'}`}>
                                <div className="mob-li-info">
                                    <strong className="text-xs">{n.title}</strong>
                                    <span className="text-[10px]">{n.message}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {activeTab === 'profile' && (
                    <div className="mob-mgr-pane">
                        <div className="mob-adm-card text-center">
                            <div className="w-16 h-16 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                                {userInfo?.name?.substring(0, 1)}
                            </div>
                            <h3 className="mb-1">{userInfo?.name}</h3>
                            <p className="text-gray-500 text-sm mb-6">{userInfo?.email}</p>
                            <button className="mob-save-btn bg-red-50 text-red-600" onClick={logout}>Sign Out</button>
                        </div>
                    </div>
                )}

            </main>

            {/* --- ADD HOTEL MODAL --- */}
            {showAddHotel && (
                <div className="mob-form-overlay animate-in fade-in slide-in-from-bottom duration-300">
                    <div className="mob-form-hdr">
                        <button className="mob-close-btn" onClick={() => { setShowAddHotel(false); setPreviewImage(null); }}><i className="fa fa-times"></i></button>
                        <h2>Register Property</h2>
                    </div>
                    <form className="mob-form-body" onSubmit={handleAddHotel}>
                        <div className="mob-input-group">
                            <label>Hotel Name</label>
                            <input type="text" placeholder="e.g. Grand Plaza" value={hotelForm.name} onChange={e => setHotelForm({...hotelForm, name: e.target.value})} required />
                        </div>
                        <div className="mob-input-row">
                            <div className="mob-input-group">
                                <label>City</label>
                                <input type="text" placeholder="Mumbai" value={hotelForm.city} onChange={e => setHotelForm({...hotelForm, city: e.target.value})} required />
                            </div>
                            <div className="mob-input-group">
                                <label>Type</label>
                                <select value={hotelForm.type} onChange={e => setHotelForm({...hotelForm, type: e.target.value})}>
                                    <option>Hotel</option><option>Apartment</option><option>Resort</option><option>Villa</option>
                                </select>
                            </div>
                        </div>
                        <div className="mob-input-group">
                            <label>Full Address</label>
                            <input type="text" placeholder="123 Street, Area..." value={hotelForm.address} onChange={e => setHotelForm({...hotelForm, address: e.target.value})} required />
                        </div>
                        <div className="mob-input-group">
                            <label>Starting Price (₹)</label>
                            <input type="number" placeholder="2500" value={hotelForm.cheapestPrice} onChange={e => setHotelForm({...hotelForm, cheapestPrice: e.target.value})} required />
                        </div>
                        <div className="mob-input-group">
                            <label>Description</label>
                            <textarea rows="3" placeholder="Describe your property..." value={hotelForm.description} onChange={e => setHotelForm({...hotelForm, description: e.target.value})} required></textarea>
                        </div>
                        
                        <div className="mob-amenity-pick">
                            <label>Property Amenities</label>
                            <div className="mob-amenity-grid">
                                {['WiFi', 'Pool', 'Gym', 'Spa', 'Restaurant'].map(a => (
                                    <div key={a} className={`mob-amenity-chip ${hotelForm.amenities?.includes(a) ? 'active' : ''}`} 
                                         onClick={() => {
                                             const curr = hotelForm.amenities || [];
                                             setHotelForm({...hotelForm, amenities: curr.includes(a) ? curr.filter(x => x !== a) : [...curr, a]})
                                         }}>
                                        <i className={`fa ${a === 'WiFi' ? 'fa-wifi' : a === 'Pool' ? 'fa-swimming-pool' : a === 'Gym' ? 'fa-dumbbell' : a === 'Spa' ? 'fa-spa' : 'fa-utensils'}`}></i>
                                        <span>{a}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                        
                        <div className="mob-img-upload-c">
                            <label>Property Photo</label>
                            <div className="mob-img-preview" onClick={() => document.getElementById('hotel-file').click()}>
                                {previewImage ? (
                                    <img src={previewImage} alt="Preview" />
                                ) : (
                                    <div className="mob-img-placeholder"><i className="fa fa-camera"></i><span>Tap to upload</span></div>
                                )}
                            </div>
                            <input type="file" id="hotel-file" hidden onChange={handleFileChange} accept="image/*" />
                        </div>

                        <div className="mob-form-footer">
                            <button type="submit" className="mob-submit-btn" disabled={submitting}>
                                {submitting ? 'Registering...' : 'Register Property'}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* --- ADD ROOM MODAL --- */}
            {showAddRoom && (
                <div className="mob-form-overlay animate-in fade-in slide-in-from-bottom duration-300">
                    <div className="mob-form-hdr">
                        <button className="mob-close-btn" onClick={() => { setShowAddRoom(false); setPreviewImage(null); }}><i className="fa fa-times"></i></button>
                        <h2>{selectedHotel ? `Add Room to ${selectedHotel.name.substring(0, 15)}...` : 'Add Room'}</h2>
                    </div>
                    <form className="mob-form-body" onSubmit={handleAddRoom}>
                        <div className="mob-input-group">
                            <label>Room Name</label>
                            <input type="text" placeholder="e.g. Deluxe Suite" value={roomForm.name} onChange={e => setRoomForm({...roomForm, name: e.target.value})} required />
                        </div>
                        <div className="mob-input-row">
                            <div className="mob-input-group">
                                <label>Price (₹)</label>
                                <input type="number" placeholder="1500" value={roomForm.pricePerNight} onChange={e => setRoomForm({...roomForm, pricePerNight: e.target.value})} required />
                            </div>
                            <div className="mob-input-group">
                                <label>Max Guests</label>
                                <input type="number" value={roomForm.maxGuests} onChange={e => setRoomForm({...roomForm, maxGuests: e.target.value})} required />
                            </div>
                        </div>
                        <div className="mob-input-group">
                            <label>Type</label>
                            <select value={roomForm.type} onChange={e => setRoomForm({...roomForm, type: e.target.value})}>
                                <option>Classic Room</option><option>Deluxe Room</option><option>Suite</option><option>Double Room</option>
                            </select>
                        </div>
                        <div className="mob-input-group">
                            <label>Description</label>
                            <textarea rows="3" placeholder="Room details..." value={roomForm.description} onChange={e => setRoomForm({...roomForm, description: e.target.value})} required></textarea>
                        </div>

                        <div className="mob-amenity-pick">
                            <label>Room Amenities</label>
                            <div className="mob-amenity-grid">
                                {['WiFi', 'AC', 'TV', 'Mini Bar'].map(a => (
                                    <div key={a} className={`mob-amenity-chip ${roomForm.amenities?.includes(a) ? 'active' : ''}`} 
                                         onClick={() => {
                                             const curr = roomForm.amenities || [];
                                             setRoomForm({...roomForm, amenities: curr.includes(a) ? curr.filter(x => x !== a) : [...curr, a]})
                                         }}>
                                        <i className={`fa ${a === 'WiFi' ? 'fa-wifi' : a === 'AC' ? 'fa-snowflake' : a === 'TV' ? 'fa-tv' : 'fa-cocktail'}`}></i>
                                        <span>{a}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="mob-img-upload-c">
                            <label>Room Photo</label>
                            <div className="mob-img-preview" onClick={() => document.getElementById('room-file').click()}>
                                {previewImage ? (
                                    <img src={previewImage} alt="Preview" />
                                ) : (
                                    <div className="mob-img-placeholder"><i className="fa fa-camera"></i><span>Tap to upload</span></div>
                                )}
                            </div>
                            <input type="file" id="room-file" hidden onChange={handleFileChange} accept="image/*" />
                        </div>

                        <div className="mob-form-footer">
                            <button type="submit" className="mob-submit-btn" disabled={submitting}>
                                {submitting ? 'Adding Room...' : 'Confirm Room'}
                            </button>
                        </div>
                    </form>
                </div>
            )}
        </div>
    );
};

export default MobileManagerDashboard;

