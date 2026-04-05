import React, { useState } from 'react';
import { FaStar, FaMapMarkerAlt, FaHeart, FaChevronRight, FaUmbrellaBeach, FaThumbsUp, FaFire } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { useWishlist } from '../context/WishlistContext';
import { useToast } from './WishlistToast';
import { BACKEND_URL } from '../utils/api';

const BookingHotelCard = ({ hotel, offer, viewMode = 'list' }) => {
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
        <div 
            className={`elite-hotel-card ${viewMode === 'grid' ? 'is-grid' : 'is-list'} animate-fade-up`} 
            onClick={handleNavigate}
        >
            {/* 1. Image Section */}
            <div className="card-media-wrap">
                <img 
                    src={
                        hotel.images?.[0] 
                        ? (hotel.images[0].startsWith('http') ? hotel.images[0] : `${BACKEND_URL}${hotel.images[0]}`)
                        : 'https://images.unsplash.com/photo-1566073771259-6a8506099945?q=80&w=600'
                    } 
                    alt={hotel.name} 
                    className="media-img"
                />
                
                {offer && (
                    <div className="media-badge-promo">
                        <FaFire className="mr-1" />
                        {offer.discountType === 'Percentage' ? `${offer.discountValue}% OFF` : `₹${offer.discountValue} OFF`}
                    </div>
                )}
                
                <button 
                    onClick={handleWishlistClick}
                    disabled={toggling}
                    className={`media-wishlist-btn ${saved ? 'is-saved' : ''}`}
                >
                    <FaHeart />
                </button>

                <div className="media-rating-overlay">
                    <FaStar className="text-amber-400 mr-1" />
                    <span>{hotel.rating || '4.5'}</span>
                </div>
            </div>

            {/* 2. Content Section */}
            <div className="card-details-wrap">
                <div className="details-main-info">
                    <div className="info-header">
                        <h3 className="info-title">{hotel.name || 'Elite Stay'}</h3>
                        <p className="info-location">
                            <FaMapMarkerAlt className="mr-1 text-indigo-500" />
                            {hotel.city}, {hotel.state || 'India'}
                        </p>
                    </div>

                    <div className="info-amenities">
                        {hotel.amenities?.slice(0, viewMode === 'grid' ? 2 : 4).map((a, i) => (
                            <span key={i} className="amenity-pill">{a}</span>
                        ))}
                    </div>

                    {hotel.isBreakfastIncluded && (
                        <div className="info-highlight">
                            <FaThumbsUp className="mr-2" />
                            Free Breakfast Included
                        </div>
                    )}
                </div>

                <div className="details-pricing-box">
                    <div className="pricing-header">
                        <div className="rating-summary">
                            <span className="rating-label">Excellent</span>
                            <span className="rating-count">{hotel.reviews?.length || 240} reviews</span>
                        </div>
                        <div className="rating-score">{hotel.rating || '9.2'}</div>
                    </div>

                    <div className="pricing-footer">
                        <div className="price-stack">
                            <span className="price-hint">Starting from</span>
                            <div className="price-row">
                                {offer && <span className="price-old">₹{hotel.cheapestPrice?.toLocaleString()}</span>}
                                <span className={`price-current ${offer ? 'text-rose-500' : ''}`}>
                                    ₹{offer 
                                        ? (offer.discountType === 'Percentage'
                                            ? Math.round(hotel.cheapestPrice * (1 - offer.discountValue / 100)).toLocaleString()
                                            : Math.max(0, hotel.cheapestPrice - offer.discountValue).toLocaleString())
                                        : hotel.cheapestPrice?.toLocaleString()}
                                </span>
                            </div>
                            <span className="price-tax">+ taxes & fees</span>
                        </div>

                        <button className="btn-availability group" onClick={(e) => { e.stopPropagation(); handleNavigate(); }}>
                            <span>Reserve</span>
                            <FaChevronRight className="group-hover:translate-x-1 transition-transform" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BookingHotelCard;
