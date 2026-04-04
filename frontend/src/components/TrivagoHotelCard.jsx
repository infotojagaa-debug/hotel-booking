import React, { useState } from 'react';
import { FaStar, FaWifi, FaParking, FaSwimmer, FaWind, FaHeart } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { useWishlist } from '../context/WishlistContext';
import { useToast } from './WishlistToast';

const TrivagoHotelCard = ({ hotel }) => {
    const navigate = useNavigate();
    const { isSaved, toggleWishlist } = useWishlist();
    const { showToast } = useToast();
    const [toggling, setToggling] = useState(false);
    const saved = isSaved(hotel._id);

    // Mock prices for comparison as requested
    const otherDeals = [
        { site: 'Booking.com', price: hotel.cheapestPrice + 450 },
        { site: 'Agoda', price: hotel.cheapestPrice + 200 }
    ];

    const ratingLabel = (score) => {
        if (score >= 9) return 'Excellent';
        if (score >= 8) return 'Very Good';
        if (score >= 7) return 'Good';
        return 'Satisfactory';
    };

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
        <div className="bg-white border border-gray-200 rounded-md shadow-sm overflow-hidden flex flex-col md:flex-row mb-4 hover:shadow-md transition-shadow group">
            {/* Left: Image Section */}
            <div className="relative w-full md:w-1/3 h-52 md:h-auto overflow-hidden">
                <img 
                    src={hotel.images?.[0] || '/images/room-1.jpg'} 
                    alt={hotel.name} 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                {hotel.featured && (
                    <span className="absolute top-3 left-3 bg-teal-600 text-white text-[10px] font-bold px-2 py-1 rounded-sm uppercase tracking-wider">
                        Top Deal
                    </span>
                )}

                {/* ── Wishlist Heart Button ── */}
                <button
                    onClick={handleWishlistClick}
                    disabled={toggling}
                    title={saved ? 'Remove from wishlist' : 'Save to wishlist'}
                    className="absolute top-3 right-3 flex items-center justify-center transition-all duration-200"
                    style={{
                        width: 36,
                        height: 36,
                        borderRadius: '50%',
                        background: saved ? 'linear-gradient(135deg, #e91e63, #c2185b)' : 'rgba(255,255,255,0.92)',
                        border: saved ? 'none' : '2px solid #e2e8f0',
                        boxShadow: saved
                            ? '0 4px 14px rgba(233,30,99,0.45)'
                            : '0 2px 8px rgba(0,0,0,0.12)',
                        cursor: 'pointer',
                        transform: toggling ? 'scale(0.88)' : 'scale(1)',
                    }}
                >
                    <FaHeart
                        style={{
                            color: saved ? '#fff' : '#cbd5e1',
                            fontSize: '0.85rem',
                            transition: 'color 0.25s, transform 0.25s',
                            transform: saved ? 'scale(1.15)' : 'scale(1)',
                        }}
                    />
                </button>
            </div>

            {/* Middle: Info Section */}
            <div className="flex-1 p-4 flex flex-col border-r border-gray-100">
                <div className="flex items-start justify-between">
                    <div>
                        <h3 className="text-xl font-bold text-gray-800 leading-tight mb-1">{hotel.name}</h3>
                        <div className="flex items-center gap-1 mb-2">
                            {[...Array(hotel.starRating || 3)].map((_, i) => (
                                <FaStar key={i} className="text-[#ffb700] text-xs" />
                            ))}
                        </div>
                        <p className="text-sm text-gray-500 flex items-center gap-1 mb-3">
                            <span className="text-trivago-blue underline cursor-pointer">{hotel.city}</span>
                            <span>• {hotel.locationHint || 'Near city center'}</span>
                        </p>
                    </div>
                    
                    <div className="text-right">
                        <div className="bg-trivago-blue text-white font-bold p-1 px-2 rounded-t-md rounded-br-md text-lg inline-block">
                            {hotel.rating?.toFixed(1) || '8.5'}
                        </div>
                        <p className="text-[10px] text-gray-400 mt-1 uppercase font-bold tracking-tighter">
                            {hotel.reviewCount || '120'} Reviews
                        </p>
                    </div>
                </div>

                <div className="mt-auto">
                    <div className="flex flex-wrap gap-4 text-xs text-gray-600 border-t border-gray-50 pt-3">
                        <div className="flex items-center gap-1 text-green-600 font-semibold">
                            <span className="w-1.5 h-1.5 bg-green-600 rounded-full"></span>
                            Excellent location
                        </div>
                        <div className="flex items-center gap-2">
                            {hotel.amenities?.includes('WiFi') && <FaWifi title="Free WiFi" />}
                            {hotel.amenities?.includes('Parking') && <FaParking title="Parking" />}
                            {hotel.amenities?.includes('Pool') && <FaSwimmer title="Pool" />}
                            {hotel.amenities?.includes('AC') && <FaWind title="AC" />}
                        </div>
                    </div>
                </div>
            </div>

            {/* Right: Price Comparison */}
            <div className="w-full md:w-56 p-4 bg-gray-50 flex flex-col justify-between">
                <div className="space-y-2">
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest text-center mb-1">More Deals</p>
                    {otherDeals.map((deal, idx) => (
                        <div key={idx} className="flex justify-between items-center text-xs text-gray-600 hover:bg-white p-1 rounded cursor-pointer transition-colors">
                            <span>{deal.site}</span>
                            <span className="font-bold">₹{deal.price.toLocaleString()}</span>
                        </div>
                    ))}
                </div>

                <div className="mt-4 pt-4 border-t border-gray-200">
                    <div className="flex flex-col items-center">
                        <span className="text-[10px] text-teal-600 font-bold uppercase">Our lowest price</span>
                        <div className="text-2xl font-black text-gray-900 mb-2">₹{hotel.cheapestPrice?.toLocaleString()}</div>
                        <button 
                            onClick={() => navigate(`/rooms/${hotel._id}`)}
                            className="w-full bg-[#007faf] hover:bg-[#006e99] text-white font-bold py-2.5 px-4 rounded shadow-sm transition-all text-sm active:scale-95"
                        >
                            View Deal
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TrivagoHotelCard;
