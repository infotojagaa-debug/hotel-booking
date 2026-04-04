import React, { useState } from 'react';
import { FaStar, FaMapMarkerAlt, FaHeart, FaChevronRight, FaUmbrellaBeach, FaThumbsUp } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { useWishlist } from '../context/WishlistContext';
import { useToast } from './WishlistToast';
import { BACKEND_URL } from '../utils/api';

const BookingHotelCard = ({ hotel, offer }) => {
    const navigate = useNavigate();
    const { isSaved, toggleWishlist, loading } = useWishlist();
    const { showToast } = useToast();
    const [toggling, setToggling] = useState(false);
    const saved = isSaved(hotel._id);

    const handleNavigate = () => {
        navigate(`/hotels/${hotel._id}`);
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
        <div className="hotel-card-premium shadow-sm border border-gray-200 rounded-xl overflow-hidden bg-white hover:border-[#6d5dfc] transition-all duration-300 cursor-pointer" onClick={handleNavigate}>
            {/* 1. Narrow Image Column (300px) */}
            <div className="card-image-wrapper relative flex-shrink-0">
                <img 
                    src={
                        hotel.images?.[0] 
                        ? (hotel.images?.[0].startsWith('http') ? hotel.images[0] : `${BACKEND_URL}${hotel.images[0]}`)
                        : 'https://images.unsplash.com/photo-1566073771259-6a8506099945'
                    } 
                    alt={hotel.name} 
                    className="w-full h-full object-cover cursor-pointer"
                    onClick={handleNavigate}
                />
                {/* Offer Badge (top-left, above or separate from wishlist) */}
                {offer && (
                    <div className="hotel-card-offer-badge">
                        {offer.discountType === 'Percentage' ? `${offer.discountValue}% OFF` : `₹${offer.discountValue} OFF`}
                    </div>
                )}
                
                <button 
                    onClick={handleWishlistClick}
                    disabled={toggling}
                    title={saved ? 'Remove from wishlist' : 'Save to wishlist'}
                    className={`absolute top-3 left-3 w-9 h-9 flex items-center justify-center rounded-full shadow-lg transition-all border outline-none ${
                        saved 
                        ? 'bg-white border-[#e61e2d] text-[#e61e2d]' 
                        : 'bg-white/90 backdrop-blur-sm border-gray-100 text-gray-400 hover:text-rose-500 hover:scale-110'
                    }`}
                >
                    <FaHeart className={saved ? 'text-[#e61e2d]' : ''} />
                </button>
            </div>

            {/* 2. Main Content Area (Fluid Expansion) */}
            <div className="card-content flex-grow flex flex-row gap-4 p-4 min-w-0">
                
                {/* 2a. Details Column (Expansive) */}
                <div className="details-column flex-grow min-w-0 flex flex-col">
                    <div className="flex items-center gap-3 mb-1">
                        <h3 
                            className="hotel-title-blue hover:underline cursor-pointer text-[#6d5dfc]"
                            onClick={handleNavigate}
                        >
                            {hotel.name || 'Grand Hotel'}
                        </h3>
                    </div>

                    <div className="location-row-links text-[#6d5dfc]">
                        <span className="underline cursor-pointer">{hotel.city || 'Chennai'}</span>
                        <span className="underline cursor-pointer ml-1">Show on map</span>
                        <span className="text-gray-500 font-medium no-underline">{hotel.distanceFromCenter || '1 km from downtown'}</span>
                        {hotel.distanceFromBeach && (
                            <span className="text-gray-500 font-medium no-underline flex items-center gap-1">
                                <FaUmbrellaBeach className="text-[14px]" />
                                {hotel.distanceFromBeach}
                            </span>
                        )}
                    </div>

                    {/* Hotel Overview Section (Instead of single room) */}
                    <div className="room-inventory-section">
                        <p className="text-[14px] font-bold text-[#1a1a1a]">{hotel.type || 'Hotel'} in {hotel.city}</p>
                        <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1 text-[12px] text-gray-600">
                            {hotel.amenities?.slice(0, 3).map((a, i) => (
                                <span key={i} className="flex items-center">
                                    <span className="w-1 h-1 bg-gray-400 rounded-full mr-1.5" />
                                    {a}
                                </span>
                            ))}
                        </div>
                        {hotel.isBreakfastIncluded && (
                            <p className="text-[13px] font-bold text-[#6d5dfc] flex items-center gap-1.5 mt-1">
                                <i className="fa fa-check text-[10px]"></i>
                                Breakfast included
                            </p>
                        )}
                    </div>
                </div>

                {/* 2b. Pricing & Rating Column (Anchored) */}
                <div className="pricing-column-anchored">
                    <div className="flex flex-col items-end">
                        <div className="flex items-center gap-2">
                            <div className="text-right">
                                <p className="text-[16px] font-bold text-[#1a1a1a] leading-tight">Very Good</p>
                                <p className="text-[12px] text-gray-500">{hotel.reviews?.length || 1415} reviews</p>
                            </div>
                            <div className="score-badge-dark-blue">{hotel.rating || '8.3'}</div>
                        </div>
                    </div>

                    <div className="flex flex-col items-end">
                        <p className="text-[12px] text-gray-500">Starting from</p>
                        {offer ? (
                            <>
                                <p className="text-[15px] text-gray-400 line-through leading-tight">
                                    ₹ {hotel.cheapestPrice?.toLocaleString() || '3,999'}
                                </p>
                                <p className="text-[22px] font-black text-[#dc2626] leading-tight">
                                    ₹ {offer.discountType === 'Percentage'
                                        ? Math.round(hotel.cheapestPrice * (1 - offer.discountValue / 100)).toLocaleString()
                                        : Math.max(0, hotel.cheapestPrice - offer.discountValue).toLocaleString()}
                                </p>
                                <p className="text-[11px] font-bold text-[#dc2626]">
                                    Save {offer.discountType === 'Percentage' ? `${offer.discountValue}%` : `₹${offer.discountValue}`}!
                                </p>
                            </>
                        ) : (
                            <p className="text-[24px] font-bold text-[#1a1a1a] leading-tight">₹ {hotel.cheapestPrice?.toLocaleString() || '3,999'}</p>
                        )}
                        <p className="text-[12px] text-gray-500 mb-2">+ taxes and fees</p>
                        <button 
                            className="see-availability-btn-fluid group flex items-center justify-center"
                            onClick={handleNavigate}
                        >
                            <span>See availability</span>
                            <FaChevronRight className="ml-2 group-hover:translate-x-1 transition-transform" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BookingHotelCard;
