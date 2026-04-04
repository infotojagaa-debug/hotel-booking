import React from 'react';
import './HotelCard.css';

const HotelCard = ({ hotel }) => {
    return (
        <div className="trivago-hotel-card">
            {/* Left Panel: Image */}
            <div className="trivago-card-image-panel">
                <button className="favorite-btn modern-heart">
                    <i className="fas fa-heart"></i>
                </button>
                <img src={hotel.images?.[0] || 'https://via.placeholder.com/300x200'} alt={hotel.name} />
            </div>

            {/* Middle Panel: Info */}
            <div className="trivago-card-info-panel">
                <div className="info-header">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <h3 className="hotel-name">{hotel.name}</h3>
                        {hotel.isAdminHotel && (
                            <span className="admin-hotel-badge" style={{ backgroundColor: '#0f172a', color: '#fff', fontSize: '10px', padding: '2px 8px', borderRadius: '12px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                Admin Hotel
                            </span>
                        )}
                    </div>
                    <div className="hotel-stars">
                        {[...Array(hotel.starRating || 3)].map((_, i) => (
                            <i key={i} className="fas fa-star" style={{ color: '#f59e0b', fontSize: '12px' }}></i>
                        ))}
                    </div>
                </div>
                
                <p className="hotel-location-link">
                    <span className="city-link">{hotel.city}</span> - {hotel.distanceFromCenter || '3.5 km to center'}
                </p>

                {/* Rating Badge */}
                <div className="guest-rating-badge">
                    <span className="rating-score">8.5</span>
                    <span className="rating-text">
                        Very good <span className="review-count">(1,234 reviews)</span>
                    </span>
                </div>

                {/* Amenities */}
                <div className="hotel-amenities-list">
                    <span className="amenity-item"><i className="fas fa-check text-green"></i> Free WiFi</span>
                    <span className="amenity-item"><i className="fas fa-check text-green"></i> Breakfast included</span>
                </div>
            </div>

            {/* Right Panel: Deals */}
            <div className="trivago-card-deals-panel">
                <div className="other-deals">
                    <div className="other-deal">
                        <span>Agoda</span>
                        <span className="other-price">${hotel.cheapestPrice + 12}</span>
                    </div>
                    <div className="other-deal">
                        <span>Expedia</span>
                        <span className="other-price">${hotel.cheapestPrice + 18}</span>
                    </div>
                    <hr className="deals-divider" />
                </div>
                
                <div className="main-deal">
                    <div className="provider-name">Our lowest price</div>
                    <div className="deal-price">${hotel.cheapestPrice}</div>
                    <div className="deal-tag text-green">Free cancellation</div>
                    <button className="view-deal-btn">
                        View Deal <i className="fas fa-chevron-right"></i>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default HotelCard;
