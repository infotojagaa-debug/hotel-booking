import React, { useEffect, useState, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FaHeart, FaMapMarkerAlt, FaStar, FaTrash, FaHotel, FaArrowLeft } from 'react-icons/fa';
import API from '../utils/api';
import { AuthContext } from '../context/AuthContext';
import { useWishlist } from '../context/WishlistContext';
import './Wishlist.css';

const Wishlist = () => {
    const [wishlist, setWishlist] = useState([]);
    const [loading, setLoading] = useState(true);
    const { userInfo } = useContext(AuthContext);
    const { toggleWishlist } = useWishlist();
    const navigate = useNavigate();

    useEffect(() => {
        if (!userInfo) {
            navigate('/login');
            return;
        }
        fetchWishlist();
    }, [userInfo]);

    const fetchWishlist = async () => {
        try {
            setLoading(true);
            const { data } = await API.get('/wishlist');
            setWishlist(data);
        } catch {
            setWishlist([]);
        } finally {
            setLoading(false);
        }
    };

    const handleRemove = async (hotelId) => {
        await toggleWishlist(hotelId);
        setWishlist(prev => prev.filter(item => item.hotel?._id !== hotelId));
    };

    const getRatingLabel = (rating) => {
        if (!rating) return '';
        if (rating >= 9) return 'Exceptional';
        if (rating >= 8) return 'Excellent';
        if (rating >= 7) return 'Very Good';
        if (rating >= 6) return 'Good';
        return 'Pleasant';
    };

    if (loading) return (
        <div className="wishlist-loading">
            <div className="wishlist-spinner"></div>
            <p>Loading your saved hotels...</p>
        </div>
    );

    return (
        <div className="wishlist-page">
            {/* Header */}
            <div className="wishlist-hero">
                <div className="wishlist-hero-content">
                    <button className="wishlist-back-btn" onClick={() => navigate(-1)}>
                        <FaArrowLeft /> Back
                    </button>
                    <div className="wishlist-hero-title">
                        <FaHeart className="wishlist-hero-heart" />
                        <div>
                            <h1>My Wishlist</h1>
                            <p>{wishlist.length} saved {wishlist.length === 1 ? 'property' : 'properties'}</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="wishlist-container">
                {wishlist.length === 0 ? (
                    <div className="wishlist-empty">
                        <div className="wishlist-empty-icon">
                            <FaHotel />
                        </div>
                        <h2>Your wishlist is empty</h2>
                        <p>Save hotels you love by clicking the ❤️ heart icon on any hotel card.</p>
                        <Link to="/hotels" className="wishlist-explore-btn">
                            Explore Hotels
                        </Link>
                    </div>
                ) : (
                    <div className="wishlist-grid">
                        {wishlist.map((item) => {
                            const hotel = item.hotel;
                            if (!hotel) return null;
                            return (
                                <div key={item._id} className="wishlist-card">
                                    {/* Image */}
                                    <div className="wishlist-card-img-wrap">
                                        {hotel.images?.[0] ? (
                                            <img
                                                src={hotel.images[0]}
                                                alt={hotel.name}
                                                referrerPolicy="no-referrer"
                                                onError={e => {
                                                    e.target.onerror = null;
                                                    e.target.src = 'https://via.placeholder.com/400x250?text=Hotel';
                                                }}
                                            />
                                        ) : (
                                            <div className="wishlist-card-img-placeholder">
                                                <FaHotel />
                                            </div>
                                        )}
                                        {/* Remove button */}
                                        <button
                                            className="wishlist-remove-btn"
                                            onClick={() => handleRemove(hotel._id)}
                                            title="Remove from wishlist"
                                        >
                                            <FaHeart />
                                        </button>
                                        {/* Type badge */}
                                        {hotel.type && (
                                            <span className="wishlist-type-badge">{hotel.type}</span>
                                        )}
                                    </div>

                                    {/* Info */}
                                    <div className="wishlist-card-body">
                                        <h3 className="wishlist-hotel-name">{hotel.name}</h3>
                                        <div className="wishlist-location">
                                            <FaMapMarkerAlt />
                                            <span>{hotel.city}{hotel.address ? `, ${hotel.address}` : ''}</span>
                                        </div>

                                        <div className="wishlist-card-footer">
                                            {hotel.rating ? (
                                                <div className="wishlist-rating">
                                                    <div className="wishlist-rating-badge">
                                                        {hotel.rating.toFixed(1)}
                                                    </div>
                                                    <div>
                                                        <div className="wishlist-rating-label">{getRatingLabel(hotel.rating)}</div>
                                                        <div className="wishlist-review-count">{hotel.reviewCount || 0} reviews</div>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="wishlist-rating">
                                                    <div className="flex gap-0.5">
                                                        {[...Array(hotel.starRating || 3)].map((_, i) => (
                                                            <FaStar key={i} className="text-amber-400 text-xs" />
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            <div className="wishlist-price-section">
                                                {hotel.cheapestPrice ? (
                                                    <>
                                                        <div className="wishlist-price">
                                                            ₹{hotel.cheapestPrice.toLocaleString()}
                                                        </div>
                                                        <div className="wishlist-price-unit">per night</div>
                                                    </>
                                                ) : null}
                                                <Link to={`/hotels/${hotel._id}`} className="wishlist-view-btn">
                                                    View Hotel
                                                </Link>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Wishlist;
