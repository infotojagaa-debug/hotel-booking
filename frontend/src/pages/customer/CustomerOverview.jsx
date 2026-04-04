import React, { useState, useEffect, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import API, { BACKEND_URL } from '../../utils/api';
import { 
    FaSuitcase, FaHeart, FaCalendarAlt, FaHotel, 
    FaMapMarkerAlt, FaChevronRight, FaClock, FaCheckCircle, 
    FaPlusCircle, FaTachometerAlt
} from 'react-icons/fa';
import './dashboard.css';

const CustomerOverview = () => {
    const { userInfo } = useContext(AuthContext);
    const navigate = useNavigate();
    const [bookings, setBookings] = useState([]);
    const [wishlistCount, setWishlistCount] = useState(0);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const { data: bData } = await API.get('/bookings/mybookings');
                setBookings(bData);
                try {
                    const { data: wData } = await API.get('/wishlist');
                    setWishlistCount(wData.length || 0);
                } catch {}
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    if (loading) return (
        <div className="cd-loader"><div className="cd-spinner" /></div>
    );

    const upcoming   = bookings.filter(b => b.status === 'Confirmed' && new Date(b.checkInDate) > new Date());
    const confirmed  = bookings.filter(b => b.status === 'Confirmed').length;
    const recentActivity = bookings.slice(0, 3);

    return (
        <div className="animate-in fade-in duration-600">
            {/* Header section with stats summary */}
            <div className="mb-12">
                <div className="flex items-center gap-3 text-[#6d5dfc] font-black uppercase tracking-[0.2em] text-[10px] mb-3">
                    <FaTachometerAlt /> Premium Dashboard
                </div>
                <h1 className="cd-welcome-title">Welcome back, {userInfo?.name?.split(' ')[0] || 'Member'}!</h1>
                <p className="cd-welcome-sub">You have {upcoming.length} upcoming adventures planned.</p>
            </div>

            {/* Quick stats section */}
            <div className="cd-stats-row">
                {[
                    { label: 'Total Stays', value: bookings.length, icon: <FaSuitcase />, color: 'purple' },
                    { label: 'Confirmed', value: confirmed, icon: <FaCheckCircle />, color: 'green' },
                    { label: 'Saved Items', value: wishlistCount, icon: <FaHeart />, color: 'rose' },
                    { label: 'Saved Hotels', value: wishlistCount, icon: <FaPlusCircle />, color: 'blue' }
                ].map((stat, idx) => (
                    <div key={idx} className="cd-stat-card-premium" data-aos="fade-up" data-aos-delay={idx * 100}>
                        <div className={`cd-stat-icon-box ${stat.color} shadow-sm`}>
                            {stat.icon}
                        </div>
                        <div className="cd-stat-info">
                            <span className="cd-stat-label">{stat.label}</span>
                            <span className="cd-stat-value">{stat.value}</span>
                        </div>
                    </div>
                ))}
            </div>

            {/* Main content grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-12">
                {/* 1. Recent Activity Feed (Activity cards take col-span 2) */}
                <div className="lg:col-span-2">
                    <div className="flex items-center justify-between mb-8">
                        <h2 className="text-xl font-black text-[#1e293b] flex items-center gap-3">
                            Recent Activity <span className="text-[10px] bg-slate-100 text-slate-500 py-1 px-3 rounded-full font-black uppercase tracking-widest">History</span>
                        </h2>
                        <Link to="/dashboard/bookings" className="text-[11px] font-black text-[#6d5dfc] hover:underline flex items-center gap-2 uppercase tracking-widest">
                            View All <FaChevronRight className="text-[10px]" />
                        </Link>
                    </div>

                    <div className="grid gap-2">
                        {recentActivity.map((b, idx) => (
                            <div key={b._id} className="cd-activity-item-v3" data-aos="fade-up" data-aos-delay={idx * 50}>
                                <div className="cd-activity-img shadow-sm border border-slate-50">
                                    <img 
                                        src={
                                            (b.room?.images?.[0] || b.hotel?.images?.[0]) 
                                            ? ((b.room?.images?.[0] || b.hotel?.images?.[0]).startsWith('http') 
                                                ? (b.room?.images?.[0] || b.hotel?.images?.[0]) 
                                                : `${BACKEND_URL}${b.room?.images?.[0] || b.hotel?.images?.[0]}`) 
                                            : 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=200&q=80'
                                        } 
                                        alt="hotel" 
                                    />
                                </div>
                                <div className="cd-activity-content">
                                    <h3 className="cd-activity-title">{b.hotel?.name || 'Luxury Stay'}</h3>
                                    <div className="cd-activity-meta">
                                        <span className="flex items-center gap-1.5"><FaClock className="text-[#6d5dfc] text-[10px]" /> {new Date(b.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>
                                        <span className={`cd-status-capsule ${b.status === 'Confirmed' ? 'confirmed' : 'pending'}`}>
                                            {b.status}
                                        </span>
                                    </div>
                                </div>
                                <div className="cd-activity-price">
                                    <div className="amount text-[#1e293b]">₹{b.totalPrice?.toLocaleString()}</div>
                                    <div className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">Total Paid</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* 2. Quick Actions Sidebar (col-span 1) */}
                <div>
                     <h2 className="text-xl font-black text-[#1e293b] mb-8">Quick Tools</h2>
                     <div className="cd-quick-tools-grid">
                        <div onClick={() => navigate('/hotels')} className="cd-tool-card-premium">
                            <div className="cd-tool-icon-wrap bg-[#eff6ff] text-[#3b82f6] shadow-sm">
                                <FaHotel />
                            </div>
                            <FaChevronRight className="cd-tool-arrow" />
                            <h4 className="cd-tool-title">Book New Stay</h4>
                            <p className="cd-tool-desc">Discover 500+ luxury hotels globally with elite amenities.</p>
                        </div>

                        <div onClick={() => navigate('/dashboard/wishlist')} className="cd-tool-card-premium">
                            <div className="cd-tool-icon-wrap bg-[#fff1f2] text-[#f43f5e] shadow-sm">
                                <FaHeart />
                            </div>
                            <FaChevronRight className="cd-tool-arrow" />
                            <h4 className="cd-tool-title">View Wishlist</h4>
                            <p className="cd-tool-desc">Revisit the places you saved before and complete your booking.</p>
                        </div>
                        
                        <div onClick={() => navigate('/dashboard/profile')} className="cd-tool-card-premium">
                            <div className="cd-tool-icon-wrap bg-[#f5f3ff] text-[#6d5dfc] shadow-sm">
                                <FaCalendarAlt />
                            </div>
                            <FaChevronRight className="cd-tool-arrow" />
                            <h4 className="cd-tool-title">Edit Profile</h4>
                            <p className="cd-tool-desc">Update your member information and traveler preferences.</p>
                        </div>
                     </div>
                </div>
            </div>
        </div>
    );
};

export default CustomerOverview;
