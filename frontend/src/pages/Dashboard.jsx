import React, { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import { FaCalendarAlt, FaCreditCard, FaHotel, FaHeart, FaChevronRight } from 'react-icons/fa';
import API from '../utils/api';
import { AuthContext } from '../context/AuthContext';
import MobileDashboard from './MobileDashboard';

const Dashboard = () => {
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const { userInfo } = useContext(AuthContext);
    const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth <= 768);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    useEffect(() => {
        const fetchMyBookings = async () => {
            try {
                const { data } = await API.get('/bookings/mybookings');
                setBookings(data);
                setLoading(false);
            } catch (error) {
                console.error('Error fetching bookings', error);
                setLoading(false);
            }
        };
        fetchMyBookings();
    }, []);

    const getStatusColor = (status) => {
        if (status === 'Confirmed') return 'bg-emerald-100 text-emerald-700';
        if (status === 'Pending') return 'bg-amber-100 text-amber-700';
        if (status === 'Cancelled') return 'bg-rose-100 text-rose-700';
        return 'bg-gray-100 text-gray-700';
    };

    const getPaymentColor = (status) => {
        if (status === 'Paid') return 'bg-blue-100 text-blue-700';
        return 'bg-gray-100 text-gray-700';
    };

    if (loading) return (
        <div className="min-h-screen bg-[#f3f4e6] flex items-center justify-center pt-24 pb-12">
            <div className="flex flex-col items-center">
                <div className="w-12 h-12 border-4 border-[#9EB393] border-t-transparent rounded-full animate-spin mb-4"></div>
                <p className="text-gray-600 font-medium">Loading your dashboard...</p>
            </div>
        </div>
    );

    if (isMobile) {
        return <MobileDashboard />;
    }

    return (
        <div className="min-h-screen bg-[#f3f4e6] pt-28 pb-16 font-sans">
            <div className="max-w-[1250px] mx-auto px-6">
                
                {/* Dashboard Header Banner */}
                <div className="bg-[#9EB393] rounded-2xl p-8 md:p-12 mb-8 text-white shadow-lg relative overflow-hidden">
                    <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
                        <div className="flex items-center gap-6">
                            <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center text-4xl font-bold border-2 border-white/50 shadow-inner">
                                {userInfo?.name?.charAt(0).toUpperCase()}
                            </div>
                            <div>
                                <h1 className="text-3xl md:text-4xl font-black mb-1">Welcome back, {userInfo?.name}!</h1>
                                <p className="text-white/80 font-medium text-lg">Manage your trips, wishlist, and account settings all in one place.</p>
                            </div>
                        </div>
                        <div className="flex flex-col gap-3 w-full md:w-auto">
                            <Link to="/hotels" className="bg-white text-[#9EB393] px-6 py-3 rounded-xl font-bold hover:bg-gray-50 hover:-translate-y-1 transition-all shadow-md flex items-center justify-center gap-2">
                                <FaHotel /> Explore Stays
                            </Link>
                            <Link to="/wishlist" className="bg-white/20 text-white border border-white/30 px-6 py-3 rounded-xl font-bold hover:bg-white/30 transition-all flex items-center justify-center gap-2">
                                <FaHeart /> View Wishlist
                            </Link>
                        </div>
                    </div>
                </div>

                {/* Main Content Area */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    
                    {/* Left Col: Bookings */}
                    <div className="lg:col-span-3">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-2xl font-black text-gray-800">Your Bookings</h2>
                            <span className="bg-gray-200 text-gray-700 px-3 py-1 rounded-full text-sm font-bold">{bookings.length} Total</span>
                        </div>

                        {bookings.length === 0 ? (
                            <div className="bg-white rounded-2xl p-12 text-center shadow-sm border border-gray-100 flex flex-col items-center justify-center">
                                <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mb-6">
                                    <FaCalendarAlt className="text-gray-300 text-4xl" />
                                </div>
                                <h3 className="text-2xl font-bold text-gray-900 mb-2">No bookings yet</h3>
                                <p className="text-gray-500 mb-8 max-w-md">You haven't booked any accommodations. Ready to plan your next getaway? Start searching for the perfect stay today.</p>
                                <Link to="/hotels" className="bg-[#9EB393] text-white px-8 py-3 rounded-xl font-bold hover:brightness-105 transition-all shadow-md">
                                    Find Accommodation
                                </Link>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {bookings.map((booking) => (
                                    <div key={booking._id} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow flex flex-col h-full">
                                        <div className="flex justify-between items-start mb-4">
                                            <h3 className="font-bold text-lg text-gray-900 line-clamp-2 leading-tight flex-1 mr-3">
                                                {booking.room?.name || 'Standard Room'}
                                            </h3>
                                            <span className={`px-2.5 py-1 text-xs font-bold rounded-md whitespace-nowrap ${getStatusColor(booking.status)}`}>
                                                {booking.status}
                                            </span>
                                        </div>
                                        
                                        <div className="space-y-4 flex-1">
                                            <div className="flex items-center gap-3 bg-gray-50 p-3 rounded-xl">
                                                <FaCalendarAlt className="text-[#9EB393]" />
                                                <div className="text-sm">
                                                    <div className="font-bold text-gray-800">Check-in / Out</div>
                                                    <div className="text-gray-500 mt-0.5">
                                                        {new Date(booking.checkInDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })} — {new Date(booking.checkOutDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex justify-between items-center border-t border-gray-100 pt-4 mt-auto">
                                                <div>
                                                    <div className="text-xs text-gray-500 font-bold uppercase mb-1">Total Amount</div>
                                                    <div className="font-black text-xl text-gray-900">₹{booking.totalPrice?.toLocaleString() || 0}</div>
                                                </div>
                                                <span className={`px-2.5 py-1 text-xs font-bold rounded-md flex items-center gap-1 ${getPaymentColor(booking.paymentStatus)}`}>
                                                    <FaCreditCard className="text-[10px]" /> {booking.paymentStatus}
                                                </span>
                                            </div>
                                        </div>
                                        
                                        {/* Optional View Details button if implemented later */}
                                        {/* <button className="w-full mt-5 bg-gray-50 hover:bg-gray-100 text-gray-700 font-bold py-2.5 rounded-xl text-sm transition-colors flex items-center justify-center gap-2">View Itinerary <FaChevronRight className="text-xs"/></button> */}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                </div>
            </div>
        </div>
    );
};

export default Dashboard;
