import React, { useState } from 'react';
import { FaStar, FaMapMarkerAlt, FaHeart, FaChevronRight, FaCheck } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { useWishlist } from '../context/WishlistContext';
import { useToast } from './WishlistToast';
import { BACKEND_URL } from '../utils/api';

const BookingHotelCard = ({ hotel, offer, viewMode = 'list' }) => {
    const navigate = useNavigate();
    const { isSaved, toggleWishlist } = useWishlist();
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
        <div className={`hotel-card-premium ${viewMode === 'grid' ? 'is-grid' : 'is-list'}`} onClick={handleNavigate}>
            {/* Image Wrapper */}
            <div className="card-image-wrapper relative">
                <img 
                    src={
                        hotel.images?.[0] 
                        ? (hotel.images[0].startsWith('http') ? hotel.images[0] : `${BACKEND_URL}${hotel.images[0]}`)
                        : 'https://images.unsplash.com/photo-1566073771259-6a8506099945?q=80&w=600'
                    } 
                    alt={hotel.name} 
                    className="w-full h-full object-cover rounded-lg"
                />
                
                {/* Wishlist Button */}
                <button 
                    onClick={handleWishlistClick}
                    disabled={toggling}
                    className="absolute top-4 right-4 bg-white hover:bg-gray-100 rounded-full w-8 h-8 flex items-center justify-center shadow-sm transition-transform active:scale-90"
                    style={{ zIndex: 10 }}
                >
                    <FaHeart className={saved ? "text-red-500" : "text-gray-300"} />
                </button>
            </div>

            {/* Content Body */}
            <div className="card-content">
                <div className="details-column">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                        <h3 className="hotel-title-blue">{hotel.name}</h3>
                        <div className="flex text-yellow-400 text-[10px]">
                            {[...Array(hotel.starRating || 3)].map((_, i) => (
                                <FaStar key={i} />
                            ))}
                        </div>
                        {hotel.featured && (
                            <span className="featured-badge-gold ml-1">
                                <FaThumbsUp className="mr-1" /> Plus
                            </span>
                        )}
                    </div>
                    
                    <div className="location-row-links">
                        <span className="underline cursor-pointer">{hotel.city || 'Location'}</span>
                        <span className="text-gray-400 font-normal no-underline text-[12px]">• Show on map • 2.5 km from center</span>
                    </div>

                    {offer && (
                        <div className="bg-green-700 text-white text-[11px] font-bold px-2 py-0.5 rounded w-max mt-1 mb-1">
                            Limited-time Deal
                        </div>
                    )}

                    <div className="room-inventory-section text-[12px]">
                        <div className="font-bold text-gray-900 mb-0.5 mt-1">Deluxe Double Room</div>
                        <div className="text-gray-600 mb-2">1 extra-large double bed</div>
                        
                        {hotel.isBreakfastIncluded && (
                            <div className="text-green-700 font-bold mb-1">
                                Breakfast included
                            </div>
                        )}
                        
                        <div className="text-green-700 font-bold flex items-center gap-1">
                            <FaCheck /> Free cancellation
                        </div>
                        <div className="text-green-700">
                            No prepayment needed <span className="text-gray-600 font-normal">– pay at the property</span>
                        </div>
                        
                        {offer && (
                            <div className="text-red-600 font-bold mt-1 text-[11px]">
                                Only 2 rooms left at this price on our site
                            </div>
                        )}
                    </div>
                </div>

                {/* Pricing / Score Column */}
                <div className="pricing-column-anchored flex flex-col justify-between">
                    <div className="flex justify-end items-start gap-2 h-[42px] overflow-hidden">
                        <div className="text-right">
                            <div className="font-bold text-[#1a1a1a] text-[15px] leading-tight">Good</div>
                            <div className="text-gray-500 text-[11px] mt-0.5">{hotel.reviews?.length || 238} reviews</div>
                        </div>
                        <div className="score-badge-dark-blue flex-shrink-0">
                            {hotel.rating || '7.5'}
                        </div>
                    </div>
                    
                    <div className="text-right mt-auto">
                        <div className="text-[12px] text-gray-600 mb-1">1 night, 2 adults</div>
                        <div className="flex items-baseline justify-end gap-1.5 line-height-[1.2]">
                            {offer && (
                                <span className="text-[14px] text-red-600 line-through">
                                    ₹{hotel.cheapestPrice?.toLocaleString()}
                                </span>
                            )}
                            <span className="text-[22px] font-bold text-[#1a1a1a]">
                                ₹{offer 
                                    ? (offer.discountType === 'Percentage'
                                        ? Math.round(hotel.cheapestPrice * (1 - offer.discountValue / 100)).toLocaleString()
                                        : Math.max(0, hotel.cheapestPrice - offer.discountValue).toLocaleString())
                                    : hotel.cheapestPrice?.toLocaleString()}
                            </span>
                        </div>
                        <div className="text-[11px] text-gray-500 mt-1 mb-3">+₹171 taxes and charges</div>
                        <button 
                            className="see-availability-btn w-full"
                            onClick={(e) => { e.stopPropagation(); handleNavigate(); }}
                        >
                            See availability <FaChevronRight className="inline-block ml-1 text-xs" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BookingHotelCard;
