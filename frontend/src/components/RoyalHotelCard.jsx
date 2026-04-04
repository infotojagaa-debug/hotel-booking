import React, { useState } from 'react';
import { FaStar, FaWifi, FaCoffee, FaParking, FaCar, FaHeart, FaMapMarkerAlt } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { useWishlist } from '../context/WishlistContext';
import { useToast } from './WishlistToast';

const RoyalHotelCard = ({ hotel }) => {
    const navigate = useNavigate();
    const { isSaved, toggleWishlist } = useWishlist();
    const { showToast } = useToast();
    const [toggling, setToggling] = useState(false);
    const saved = isSaved(hotel._id);

    const handleWishlistClick = async (e) => {
        e.stopPropagation();
        if (toggling) return;
        setToggling(true);
        const result = await toggleWishlist(hotel._id);
        if (result?.requiresLogin) {
            navigate('/login');
        } else if (result?.saved !== undefined) {
            showToast(
                result.saved ? `Added "${hotel.name}" to wishlist` : `Removed "${hotel.name}" from wishlist`,
                result.saved ? 'success' : 'removed'
            );
        }
        setToggling(false);
    };

    return (
        <div className="bg-white rounded-4xl shadow-md overflow-hidden flex flex-col md:flex-row mb-6 hover:shadow-xl transition-all border border-gray-100/50 group">
            {/* Left: Image Section */}
            <div className="relative w-full md:w-1/3 aspect-[4/3] md:aspect-auto overflow-hidden">
                <img 
                    src={hotel.images?.[0] || '/images/room-1.jpg'} 
                    alt={hotel.name} 
                    className="w-full h-full object-cover rounded-3xl md:rounded-r-none m-2 md:m-0"
                />
                
                {/* Star Badge */}
                <div className="absolute top-6 left-6 bg-white/90 backdrop-blur-sm px-4 py-2 rounded-xl flex items-center gap-2 shadow-lg border border-gray-100">
                    <FaStar className="text-royal-sage text-sm" />
                    <span className="text-sm font-black text-gray-800">{hotel.starRating || 'N/A'}</span>
                </div>

                {/* Wishlist Icon */}
                <button 
                    onClick={handleWishlistClick}
                    disabled={toggling}
                    title={saved ? 'Remove from wishlist' : 'Save to wishlist'}
                    className={`absolute top-6 right-6 w-11 h-11 rounded-2xl flex items-center justify-center backdrop-blur-md transition-all shadow-lg ${
                        saved ? 'bg-royal-sage text-white' : 'bg-white/80 text-royal-sage hover:bg-white'
                    } ${toggling ? 'scale-90 opacity-80' : 'hover:scale-105'}`}
                >
                    <FaHeart className={saved ? 'fill-current' : 'text-xl'} />
                </button>
            </div>

            {/* Right: Info Section */}
            <div className="flex-1 p-8 flex flex-col justify-between">
                <div>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                        <div className="space-y-1">
                            <h3 className="text-3xl font-black text-royal-dark tracking-tight leading-none">{hotel.name}</h3>
                            <p className="text-royal-sage font-bold flex items-center gap-2 text-sm italic">
                                <FaMapMarkerAlt className="text-xs" /> {hotel.city}
                            </p>
                        </div>
                        <div className="text-right">
                            <span className="text-2xl font-black text-royal-dark">₹{hotel.cheapestPrice}</span>
                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest leading-none mt-1">per night</p>
                        </div>
                    </div>

                    <p className="text-royal-sage text-base font-medium opacity-80 mb-8 italic">
                        {hotel.descriptionHint || "Good Peaceful Stay"}
                    </p>

                    <div className="flex flex-wrap gap-4 mb-8">
                        {['WiFi', 'Breakfast', 'Parking', 'AC'].map((amenity, i) => (
                            <div key={i} className="group/icon relative">
                                <div className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center text-gray-400 hover:bg-royal-sage hover:text-white transition-all cursor-pointer shadow-sm border border-gray-100">
                                    {amenity === 'WiFi' && <FaWifi />}
                                    {amenity === 'Breakfast' && <FaCoffee />}
                                    {amenity === 'Parking' && <FaCar />}
                                    {amenity === 'AC' && <FaWifi className="rotate-90" />}
                                </div>
                                {/* Simple Tooltip placeholder for styling */}
                                <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-[10px] font-bold px-2 py-1 rounded opacity-0 group-hover/icon:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                                    {amenity}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="flex justify-end mt-auto">
                    <button 
                        onClick={() => navigate(`/rooms/${hotel._id}`)}
                        className="bg-royal-sage hover:bg-royal-accent text-white font-black px-10 py-4 rounded-2xl shadow-lg shadow-royal-sage/20 transition-all active:scale-95 uppercase tracking-widest text-xs"
                    >
                        View Details
                    </button>
                </div>
            </div>
        </div>
    );
};

export default RoyalHotelCard;
