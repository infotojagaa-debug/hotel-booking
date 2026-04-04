import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import API, { BACKEND_URL } from '../../utils/api';
import { 
    FaCalendarAlt, FaMapMarkerAlt, FaRegSadCry, 
    FaDownload, FaClock, FaCheckCircle, FaExclamationCircle,
    FaArrowRight, FaHotel, FaSuitcaseRolling, FaChevronRight, FaFilter
} from 'react-icons/fa';
import './dashboard.css';

const CustomerBookings = () => {
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('All');
    const navigate = useNavigate();

    useEffect(() => {
        const fetchBookings = async () => {
            try {
                const { data } = await API.get('/bookings/mybookings');
                setBookings(data);
            } catch (err) {
                console.error('Error fetching bookings:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchBookings();
    }, []);

    const filters = ['All', 'Confirmed', 'Pending', 'Completed', 'Cancelled'];

    const displayed = filter === 'All'
        ? bookings
        : bookings.filter(b => b.status === filter);

    const handleCancel = async (id) => {
        if (!window.confirm('Are you sure you want to cancel this booking?')) return;
        try {
            await API.put(`/bookings/${id}/cancel`);
            setBookings(prev => prev.map(b => b._id === id ? { ...b, status: 'Cancelled' } : b));
        } catch {
            alert('Could not cancel booking. Please try again.');
        }
    };

    const handleDownloadInvoice = async (bookingId) => {
        try {
            const downloadUrl = `${BACKEND_URL}/api/bookings/${bookingId}/invoice`;
            console.log('Final Download URL:', downloadUrl);
            
            const response = await API.get(`/bookings/${bookingId}/invoice`, {
                responseType: 'blob'
            });
            
            // Check if response is JSON (error) despite blob request
            if (response.data.type === 'application/json') {
                const text = await response.data.text();
                const errorData = JSON.parse(text);
                throw new Error(errorData.message || 'Server error generating invoice');
            }

            const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `EliteStays_Invoice_${bookingId.slice(-6).toUpperCase()}.pdf`);
            document.body.appendChild(link);
            link.click();
            
            // Cleanup
            setTimeout(() => {
                link.remove();
                window.URL.revokeObjectURL(url);
            }, 100);
            
        } catch (err) {
            console.error('Invoice download failed:', err);
            const errorMsg = err.response?.data?.message || err.message || 'Could not download invoice. Please try again.';
            alert(`Download Failed: ${errorMsg}`);
        }
    };

    if (loading) return <div className="cd-loader"><div className="cd-spinner" /></div>;

    return (
        <div className="animate-in fade-in duration-600">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-10 gap-6">
                <div>
                    <div className="flex items-center gap-2 text-[#6d5dfc] font-black uppercase tracking-[0.2em] text-[10px] mb-3">
                        <FaSuitcaseRolling /> Travel History
                    </div>
                    <h1 className="cd-welcome-title">My Bookings</h1>
                    <p className="cd-welcome-sub">Manage your upcoming stays and review your past travels.</p>
                </div>
                <button 
                  onClick={() => navigate('/hotels')}
                  className="cd-btn-primary flex items-center gap-2 px-6"
                >
                    <FaHotel className="text-[12px]" /> Book New Stay
                </button>
            </div>

            {/* Premium Filter Tab Bar */}
            <div className="cd-filters-row">
                <div className="flex items-center gap-3 mr-4 text-slate-400">
                    <FaFilter className="text-[10px]" />
                </div>
                {filters.map(f => (
                    <button
                        key={f}
                        onClick={() => setFilter(f)}
                        className={`cd-filter-tab ${filter === f ? 'active' : ''}`}
                    >
                        {f}
                    </button>
                ))}
            </div>

            {/* Bookings List */}
            {displayed.length === 0 ? (
                <div className="cd-empty py-20 bg-white rounded-[32px] border border-slate-100 shadow-sm">
                    <div className="w-16 h-16 bg-slate-50 flex items-center justify-center rounded-full mx-auto mb-6">
                        <FaRegSadCry className="text-2xl text-slate-300" />
                    </div>
                    <h2 className="text-xl font-black text-slate-800 text-center">No {filter !== 'All' ? filter.toLowerCase() : ''} bookings found</h2>
                    <p className="text-slate-400 text-sm text-center max-w-[300px] mx-auto mt-2 leading-relaxed">
                        It looks like you haven't booked any trips yet. Time to find your next adventure?
                    </p>
                    <div className="flex justify-center mt-8">
                        <button onClick={() => navigate('/hotels')} className="cd-btn-primary px-8">
                            Browse Destinations
                        </button>
                    </div>
                </div>
            ) : (
                <div className="space-y-6">
                    {displayed.map((b, idx) => (
                        <div key={b._id} className="cd-booking-card-premium p-6 group" data-aos="fade-up" data-aos-delay={idx * 50}>
                            {/* Main Info Column */}
                            <div className="cd-booking-img-wrap w-full md:w-[240px] h-[160px] rounded-24">
                                <img
                                    src={
                                        (b.room?.images?.[0] || b.hotel?.images?.[0]) 
                                        ? ((b.room?.images?.[0] || b.hotel?.images?.[0]).startsWith('http') 
                                            ? (b.room?.images?.[0] || b.hotel?.images?.[0]) 
                                            : `${BACKEND_URL}${b.room?.images?.[0] || b.hotel?.images?.[0]}`)
                                        : 'https://images.unsplash.com/photo-1566073771259-6a8506099945?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80'
                                    }
                                    alt="hotel"
                                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                                />
                                <div className="absolute top-4 left-4">
                                    <span className={`cd-status-badge ${b.status?.toLowerCase()}`}>
                                        {b.status}
                                    </span>
                                </div>
                            </div>

                            <div className="cd-booking-main flex-1">
                                <div className="flex items-center gap-4 mb-4">
                                    <div className="flex items-center gap-2 text-[9px] uppercase font-black tracking-[0.15em] text-[#6d5dfc] bg-[#f5f3ff] w-fit px-3 py-1 rounded-full border border-[#6d5dfc1a]">
                                        <FaClock /> ID: #{b._id?.slice(-6).toUpperCase()}
                                    </div>
                                    <div className="flex items-center gap-3 text-[10px] font-black text-slate-400 uppercase tracking-widest border-l border-slate-100 pl-4">
                                        <span className="flex items-center gap-1.5"><FaCalendarAlt className="text-[9px] text-[#6d5dfc]" /> {new Date(b.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                                        <span className="flex items-center gap-1.5"><FaClock className="text-[9px] text-[#6d5dfc]" /> {new Date(b.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</span>
                                    </div>
                                </div>
                                <h3 className="cd-booking-title">{b.hotel?.name || b.room?.hotel?.name || 'Luxury Elite Stay'}</h3>
                                
                                <div className="cd-booking-meta-row mt-4">
                                    <div className="flex items-center gap-8 border-b border-slate-50 pb-4 mb-4">
                                        <div className="flex flex-col">
                                            <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-widest mb-1">Check-in</span>
                                            <span className="text-sm font-black text-slate-700 flex items-center gap-2">
                                                <FaCalendarAlt className="text-[#6d5dfc]" /> {new Date(b.checkInDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                                            </span>
                                        </div>
                                        <FaArrowRight className="text-slate-200 mt-4" />
                                        <div className="flex flex-col">
                                            <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-widest mb-1">Check-out</span>
                                            <span className="text-sm font-black text-slate-700 flex items-center gap-2">
                                                <FaCalendarAlt className="text-[#6d5dfc]" /> {new Date(b.checkOutDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                                            </span>
                                        </div>
                                    </div>
                                    
                                    <div className="flex items-center justify-between w-full">
                                        {(b.hotel?.city || 'Global City') && (
                                            <span className="text-xs font-bold text-slate-500 flex items-center gap-2">
                                                <FaMapMarkerAlt className="text-red-400" /> {b.hotel?.city || 'Global Destination'}
                                            </span>
                                        )}
                                        {b.paymentStatus === 'Paid' ? (
                                            <span className="text-[11px] font-black text-green-600 flex items-center gap-1.5 uppercase tracking-wide">
                                                <FaCheckCircle /> Payment Verified
                                            </span>
                                        ) : (
                                            <span className="text-[11px] font-black text-amber-500 flex items-center gap-1.5 uppercase tracking-wide">
                                                <FaExclamationCircle /> Awaiting Payment
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Actions Column */}
                            <div className="cd-booking-side flex flex-col items-end justify-between min-w-[200px]">
                                <div className="text-right">
                                    <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest block mb-1">Total Stay Value</span>
                                    <div className="cd-price-tag">₹{b.totalPrice?.toLocaleString()}</div>
                                </div>
                                <div className="flex gap-3 mt-8">
                                    {(b.status === 'Confirmed' || b.status === 'Pending') && (
                                        <button
                                            onClick={() => handleCancel(b._id)}
                                            className="cd-btn-ghost text-red-500 border-red-50 hover:bg-red-50 hover:border-red-100"
                                        >
                                            Cancel Stay
                                        </button>
                                    )}
                                    <button 
                                        onClick={() => handleDownloadInvoice(b._id)}
                                        className="cd-btn-primary py-3 px-6 shadow-none flex items-center gap-2"
                                    >
                                        <FaDownload className="text-[10px]" /> Get Invoice
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default CustomerBookings;
