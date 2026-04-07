import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link, useLocation } from 'react-router-dom';
import { 
    FaStar, FaMapMarkerAlt, FaChevronRight, FaCheckCircle, 
    FaWifi, FaTv, FaSnowflake, FaUsers, FaCoffee, FaShieldAlt, FaHeart, FaCommentAlt, FaPaperPlane 
} from 'react-icons/fa';
import API from '../utils/api';
import ImageLightbox from '../components/ImageLightbox';
import { useWishlist } from '../context/WishlistContext';
import { useToast } from '../components/WishlistToast';
import BookingSummaryBar from '../components/BookingSummaryBar';
import HotelMap from '../components/HotelMap';
import MobileHotelDetails from './MobileHotelDetails';
import './HotelDetails.css';

const HotelDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const { isSaved, toggleWishlist } = useWishlist();
    const { showToast } = useToast();
    const [toggling, setToggling] = useState(false);
    const [hotel, setHotel] = useState(null);
    const [rooms, setRooms] = useState([]);
    const [reviews, setReviews] = useState([]);
    const [offers, setOffers] = useState([]);
    const [loading, setLoading] = useState(true);
    
    // New Review State
    const [userRating, setUserRating] = useState(5);
    const [userComment, setUserComment] = useState('');
    const [submittingReview, setSubmittingReview] = useState(false);

    // Lightbox State
    const [lightbox, setLightbox] = useState({
        isOpen: false,
        index: 0,
        images: []
    });

    // Persistent Search & Offer State
    const [searchData, setSearchData] = useState(null);
    const [activeOffer, setActiveOffer] = useState(null);
    const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth <= 768);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    useEffect(() => {
        const savedSearch = localStorage.getItem('elite_stays_search');
        
        // Priority: location.state > localStorage
        const stateOffer = location.state?.appliedOffer;
        const savedOffer = localStorage.getItem('elite_stays_active_offer');
        
        if (savedSearch) setSearchData(JSON.parse(savedSearch));
        
        if (stateOffer) {
            setActiveOffer(stateOffer);
        } else if (savedOffer) {
            const parsedOffer = JSON.parse(savedOffer);
            // Only set if global or belongs to this hotel
            if (!parsedOffer.hotel || parsedOffer.hotel._id === id || parsedOffer.hotel === id) {
                setActiveOffer(parsedOffer);
            }
        }
    }, [id, location.state]);

    const handleClearSearch = () => {
        localStorage.removeItem('elite_stays_search');
        localStorage.removeItem('elite_stays_active_offer');
        setSearchData(null);
        setActiveOffer(null);
    };

    useEffect(() => {
        const fetchHotelData = async () => {
            try {
                setLoading(true);
                const { data: hotelData } = await API.get(`/hotels/${id}`);
                setHotel(hotelData);

                const { data: roomsData } = await API.get(`/rooms?hotel=${id}`);
                setRooms(roomsData);

                const { data: reviewsData } = await API.get(`/reviews/hotel/${id}`);
                setReviews(reviewsData);
                
                const { data: offersData } = await API.get(`/offers/hotel/${id}`).catch(() => ({ data: [] }));
                setOffers(offersData);

                setLoading(false);
            } catch (error) {
                console.error('Error fetching hotel details', error);
                setLoading(false);
            }
        };
        fetchHotelData();
    }, [id]);

    const handlePostReview = async (e) => {
        e.preventDefault();
        // Note: Backend requires a bookingId to post a review.
        // For the sake of the UI fix, we'll inform the user they need a booking.
        alert('To leave a review, you must have a confirmed past booking for this hotel. Please visit your dashboard to review past stays!');
    };

    const saved = isSaved(id);

    const handleWishlistClick = async () => {
        if (toggling) return;
        setToggling(true);
        const result = await toggleWishlist(id);
        if (result?.requiresLogin) {
            navigate('/login');
        } else if (result?.saved !== undefined) {
            showToast(
                result.saved ? `Added "${hotel?.name}" to wishlist ❤️` : `Removed "${hotel?.name}" from wishlist`,
                result.saved ? 'success' : 'removed'
            );
        }
        setToggling(false);
    };

    const openLightbox = (imgs, idx) => {
        setLightbox({
            isOpen: true,
            index: idx,
            images: imgs
        });
    };

    const closeLightbox = () => setLightbox({ ...lightbox, isOpen: false });
    const nextImage = () => setLightbox(prev => ({ ...prev, index: (prev.index + 1) % prev.images.length }));
    const prevImage = () => setLightbox(prev => ({ ...prev, index: (prev.index - 1 + prev.images.length) % prev.images.length }));

    if (loading) return (
        <div className="flex items-center justify-center min-h-[100vh]">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#006ce4]"></div>
        </div>
    );

    if (!hotel) return <div className="container py-40 text-center">Hotel not found.</div>;

    const hotelImages = hotel.images || [];

    if (isMobile) {
        return <MobileHotelDetails />;
    }

    return (
        <div className="container-elite pt-24 pb-20">
            
            {/* 🆕 Sticky Booking Summary Bar */}
            <BookingSummaryBar 
                searchData={searchData} 
                activeOffer={activeOffer} 
                onClear={handleClearSearch}
            />

            {/* Lightbox Component */}
            {lightbox.isOpen && (
                <ImageLightbox 
                    images={lightbox.images} 
                    currentIndex={lightbox.index} 
                    onClose={closeLightbox} 
                    onNext={nextImage} 
                    onPrev={prevImage} 
                />
            )}

            {/* 📣 Premium Promotion Banner - Show activeOffer if present, else fallback to first available hotel offer */}
            {(activeOffer || offers.length > 0) && (
                <div className={`hotel-promo-banner-v2 ${activeOffer ? 'applied-highlight' : ''}`}>
                    <div className="hotel-promo-banner-left">
                        <div className="hotel-promo-fire-icon">🔥</div>
                        <div className="hotel-promo-text-block">
                            <span className="hotel-promo-limited-badge">
                                {activeOffer ? 'SELECTED DEAL APPLIED' : 'Limited Time Offer'}
                            </span>
                            <h3 className="hotel-promo-title">{(activeOffer || offers[0]).title}</h3>
                            <p className="hotel-promo-subtitle">{(activeOffer || offers[0]).description || 'Exclusive deal on this property. Book before the offer expires!'}</p>
                        </div>
                    </div>
                    <div className="hotel-promo-right">
                        {activeOffer ? (
                            <button 
                                className="hotel-promo-clear-btn"
                                onClick={() => {
                                    setActiveOffer(null);
                                    localStorage.removeItem('elite_stays_active_offer');
                                }}
                            >
                                Clear deal ×
                            </button>
                        ) : (
                            <div className="hotel-promo-discount-box">
                                <span className="hotel-promo-discount-value">
                                    {(activeOffer || offers[0]).discountType === 'Percentage' ? `${(activeOffer || offers[0]).discountValue}%` : `₹${(activeOffer || offers[0]).discountValue}`}
                                </span>
                                <span className="hotel-promo-discount-label">OFF</span>
                            </div>
                        )}
                        <p className="hotel-promo-validity">⏰ Valid till {new Date((activeOffer || offers[0]).validTo).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                    </div>
                </div>
            )}

            {/* 1. Breadcrumbs & Actions Row */}
            <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
                <div className="flex items-center gap-2 text-sm text-[#006ce4]">
                    <Link to="/" className="hover:underline">Home</Link>
                    <FaChevronRight className="text-[10px] text-gray-400" />
                    <Link to="/hotels" className="hover:underline">Hotels</Link>
                    <FaChevronRight className="text-[10px] text-gray-400" />
                    <span className="text-gray-600 font-medium">{hotel.name}</span>
                </div>
                
                <div className="flex items-center gap-4">
                    <button 
                        onClick={handleWishlistClick}
                        disabled={toggling}
                        className={`flex items-center gap-2 transition-all text-sm font-bold bg-transparent border-none p-0 ${
                            saved ? 'text-[#e61e2d]' : 'text-[#8c7efc] hover:text-[#5b4cdb]'
                        }`}
                        style={{ cursor: 'pointer' }}
                    >
                        <FaHeart className={`text-lg ${saved ? 'text-[#e61e2d]' : 'text-gray-300'}`} />
                        <span className="underline-offset-4 hover:underline">
                            {saved ? 'Saved to Wishlist' : 'Save to Wishlist'}
                        </span>
                    </button>
                    <div className="h-6 w-[1px] bg-gray-200 hidden sm:block"></div>
                    <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#f0f8ff] border border-[#e0f2fe] text-[#006ce4] font-bold text-xs uppercase tracking-tight shadow-sm">
                        <FaShieldAlt className="text-[#006ce4]" /> Safe & Verified
                    </div>
                </div>
            </div>

            {/* 2. Hotel Header */}
            <header className="hotel-header-flex">
                <div className="hotel-title-section">
                    <h1>
                        {hotel.name}
                        <div className="hotel-stars">
                            {[...Array(hotel.starRating || 3)].map((_, i) => <FaStar key={i} />)}
                        </div>
                    </h1>
                    <a href="#location-map" className="hotel-location-link">
                        <FaMapMarkerAlt /> {hotel.district || hotel.city} District
                    </a>
                </div>

                <div className="review-summary-flex">
                    <div className="rating-text-wrap">
                        <p className="rating-verbal">Very Good</p>
                        <p className="rating-count">{hotel.reviewCount || 1415} reviews</p>
                    </div>
                    <div className="rating-square-badge">
                        {hotel.rating || '8.3'}
                    </div>
                </div>
            </header>

            {/* 🆕 Photo Gallery Grid */}
            {hotelImages.length > 0 && (
                <div className="hotel-gallery-grid">
                    <img 
                        src={hotelImages[0]} 
                        alt="Hotel Main" 
                        className="gallery-main-img cursor-zoom-in" 
                        onClick={() => openLightbox(hotelImages, 0)}
                        referrerPolicy="no-referrer"
                    />
                    <div className="gallery-sub-grid">
                        {hotelImages.slice(1, 5).map((img, idx) => (
                            <img 
                                key={idx}
                                src={img} 
                                alt={`Interior ${idx + 1}`} 
                                className="gallery-sub-img cursor-zoom-in" 
                                onClick={() => openLightbox(hotelImages, idx + 1)}
                                referrerPolicy="no-referrer"
                            />
                        ))}
                        {/* If less than 5 images, show placeholders or just don't show the grid slots */}
                    </div>
                </div>
            )}

            {/* 4. Main Two-Column Content Grid */}
            <div className="hotel-content-grid">
                
                <div className="hotel-main-column">
                    <div className="hotel-description-section">
                        <h2 className="section-title-premium">About this property</h2>
                        <div className="hotel-description-text">
                            "{hotel.description}"
                        </div>
                    </div>

                    {/* 🔥 Promotions Section Below Description */}
                    {offers.length > 0 && (
                        <div className="hotel-promotions-section">
                            <h2 className="section-title-premium" style={{ marginBottom: '16px' }}>
                                🔥 Active Promotions &amp; Offers
                            </h2>
                            <div className="promotions-cards-grid">
                                {offers.map((offer, idx) => (
                                    <div key={offer._id || idx} className={`promotion-offer-card ${offer.hotel ? 'hotel-specific' : 'global-offer'}`}>
                                        <div className="promo-card-left">
                                            <div className="promo-discount-badge">
                                                {offer.discountType === 'Percentage'
                                                    ? `${offer.discountValue}%`
                                                    : `₹${offer.discountValue}`}
                                                <span>OFF</span>
                                            </div>
                                        </div>
                                        <div className="promo-card-right">
                                            {/* Scope Label */}
                                            <div className="promo-scope-label">
                                                {offer.hotel
                                                    ? <span className="scope-badge hotel-scope">🏨 Exclusive for this Hotel</span>
                                                    : <span className="scope-badge global-scope">🌍 Applicable for All Hotels</span>
                                                }
                                            </div>
                                            <h4 className="promo-title">{offer.title}</h4>
                                            <p className="promo-desc">{offer.description}</p>
                                            <div className="promo-footer">
                                                <span className="promo-validity">
                                                    ⏰ Valid till {new Date(offer.validTo).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                                                </span>
                                                {offer.code && (
                                                    <span className="promo-code-chip">Code: {offer.code}</span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="hotel-amenities-section">
                        <h2 className="section-title-premium">Exceptional Amenities</h2>
                        <div className="amenities-grid-premium">
                            <div className="amenity-card-premium">
                                <FaWifi className="amenity-icon-p" />
                                <span>Wifi</span>
                            </div>
                            <div className="amenity-card-premium">
                                <FaMapMarkerAlt className="amenity-icon-p" />
                                <span>Parking</span>
                            </div>
                            <div className="amenity-card-premium">
                                <FaCoffee className="amenity-icon-p" />
                                <span>Breakfast</span>
                            </div>
                            {hotel.amenities?.slice(0, 3).map((amenity, i) => (
                                <div key={i} className="amenity-card-premium">
                                    <FaCheckCircle className="amenity-icon-p" />
                                    <span>{amenity}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* 📍 Location / Map Section */}
                    <div className="hotel-location-section" id="location-map" style={{ marginTop: '40px' }}>
                        <h2 className="section-title-premium">Where you'll stay</h2>
                        <div className="location-map-wrapper" style={{ height: '450px', marginBottom: '16px', borderRadius: '24px', overflow: 'hidden', border: '1px solid #f1f5f9', boxShadow: '0 20px 50px rgba(0,0,0,0.05)' }}>
                            <HotelMap 
                                hotels={[hotel]} 
                                activeHotelId={hotel._id}
                                center={
                                    hotel.latitude && hotel.longitude && 
                                    !isNaN(Number(hotel.latitude)) && !isNaN(Number(hotel.longitude))
                                        ? { lat: Number(hotel.latitude), lng: Number(hotel.longitude) }
                                        : undefined
                                }
                            />
                        </div>
                        <div className="location-info-footer flex items-center justify-between bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-[#f5f3ff] rounded-full flex items-center justify-center text-[#6d5dfc]">
                                    <FaMapMarkerAlt />
                                </div>
                                <div>
                                    <p className="text-sm font-black text-slate-800">{hotel.district || hotel.city} District</p>
                                    <p className="text-xs text-slate-500">{hotel.state}, India</p>
                                </div>
                            </div>
                            <a 
                                href={`https://www.google.com/maps/dir/?api=1&destination=${hotel.latitude},${hotel.longitude}`}
                                target="_blank"
                                rel="noreferrer"
                                className="text-xs font-black text-[#6d5dfc] underline-offset-4 hover:underline"
                            >
                                GET DIRECTIONS
                            </a>
                        </div>
                    </div>

                    <div className="room-selection-section" id="room-selection">
                        <h2 className="section-title-premium" style={{marginTop: '40px'}}>Choose Your Room</h2>
                        
                        <div className="room-list-container">
                            {rooms.length === 0 ? (
                                <div className="p-10 text-center bg-gray-50 rounded-xl border border-dashed border-gray-300">
                                    No rooms available for this hotel yet.
                                </div>
                            ) : (
                                rooms.map((room) => {
                                    const bestOffer = offers.length > 0 ? offers[0] : null;
                                    return (
                                    <div key={room._id} className="room-card-premium">
                                        <div className="room-image-area" style={{ position: 'relative' }}>
                                            {room.images?.[0] && (
                                                <img 
                                                    src={room.images[0]} 
                                                    alt={room.name} 
                                                    className="cursor-zoom-in"
                                                    onClick={() => openLightbox(room.images, 0)}
                                                />
                                            )}
                                            {/* 🔥 Discount Badge */}
                                            {bestOffer && (
                                                <div className="room-discount-badge">
                                                    🔥 {bestOffer.discountType === 'Percentage'
                                                        ? `${bestOffer.discountValue}% OFF`
                                                        : `₹${bestOffer.discountValue} OFF`}
                                                </div>
                                            )}
                                        </div>
                                        <div className="room-body-area">
                                            <div className="room-details-top">
                                                <div className="flex-grow">
                                                    <h4 className="room-title-h">{room.name}</h4>
                                                    <div className="room-capacity">
                                                        <FaUsers /> Up to {room.maxGuests || 2} Guests
                                                    </div>
                                                    
                                                    <div className="room-amenities-tags">
                                                        <div className="room-amenity-item">
                                                            <FaWifi className="room-amenity-item-icon" /> Free WiFi
                                                        </div>
                                                        <div className="room-amenity-item">
                                                            <FaSnowflake className="room-amenity-item-icon" /> AC
                                                        </div>
                                                        {room.isBreakfastIncluded && (
                                                            <div className="room-amenity-item">
                                                                <FaCoffee className="room-amenity-item-icon" /> Breakfast included
                                                            </div>
                                                        )}
                                                    </div>

                                                    <div className="free-cancel-badge">
                                                        <FaCheckCircle /> Free Cancellation
                                                    </div>
                                                </div>

                                                <div className="room-pricing-area">
                                                    <div>
                                                        {bestOffer ? (
                                                            <>
                                                                <p className="room-price-value" style={{ textDecoration: 'line-through', color: '#94a3b8', fontSize: '14px' }}>₹{room.pricePerNight?.toLocaleString()}</p>
                                                                <p className="room-price-value" style={{ color: '#dc2626' }}>₹{
                                                                    bestOffer.discountType === 'Percentage'
                                                                        ? Math.round(room.pricePerNight * (1 - bestOffer.discountValue / 100)).toLocaleString()
                                                                        : Math.max(0, room.pricePerNight - bestOffer.discountValue).toLocaleString()
                                                                }</p>
                                                            </>
                                                        ) : (
                                                            <p className="room-price-value">₹{room.pricePerNight?.toLocaleString()}</p>
                                                        )}
                                                        <p className="room-price-sub">per night</p>
                                                    </div>
                                                    <button 
                                                        onClick={() => navigate(`/rooms/${room._id}`)}
                                                        className="room-book-btn"
                                                    >
                                                        Book Now
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    );
                                })
                            )}
                        </div>
                    </div>

                    {/* 5. Guest Reviews Section */}
                    <div className="guest-reviews-section">
                        <div className="reviews-header-p">
                            <FaCommentAlt className="reviews-icon-p" />
                            <h2 className="section-title-premium" style={{margin: 0}}>Guest Reviews</h2>
                        </div>

                        <div className="leave-review-card">
                            <h4>Leave a Review</h4>
                            <div className="star-rating-p">
                                {[1, 2, 3, 4, 5].map((s) => (
                                    <FaStar 
                                        key={s} 
                                        className={s <= userRating ? 'star-active' : 'star-inactive'} 
                                        onClick={() => setUserRating(s)}
                                    />
                                ))}
                            </div>
                            <textarea 
                                placeholder="Share your experience..." 
                                className="review-textarea-p"
                                value={userComment}
                                onChange={(e) => setUserComment(e.target.value)}
                            />
                            <button className="post-review-btn-p" onClick={handlePostReview}>
                                <FaPaperPlane /> POST REVIEW
                            </button>
                        </div>

                        <div className="existing-reviews-list">
                            {reviews.length === 0 ? (
                                <p className="no-reviews-p">No reviews yet. Be the first to stay and share your experience!</p>
                            ) : (
                                reviews.map((r) => (
                                    <div key={r._id} className="review-item-p">
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="review-user-p">{r.user?.name}</span>
                                            <div className="review-rating-p">
                                                <FaStar /> {r.rating}
                                            </div>
                                        </div>
                                        <p className="review-comment-p">{r.comment}</p>
                                        <span className="review-date-p">{new Date(r.createdAt).toLocaleDateString()}</span>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>

                <div className="hotel-sidebar-column">
                    <div className="property-highlights-card">
                        <h3 className="highlights-header">Property highlights</h3>
                        
                        <div className="highlight-item">
                            <h4 className="highlight-title">Perfect for a 4-night stay!</h4>
                            <div className="highlight-content">
                                <FaMapMarkerAlt className="highlight-icon" />
                                <span>Top Location: Highly rated by recent guests (8.2)</span>
                            </div>
                        </div>

                        <div className="highlight-item">
                            <h4 className="highlight-title">Breakfast Info</h4>
                            <p className="highlight-text">
                                Continental, Full English/Irish, Vegetarian, Gluten-free, American, Buffet
                            </p>
                        </div>

                        <div className="highlight-item flex items-center gap-3">
                            <div className="p-badge">P</div>
                            <span className="highlight-text">Free private parking available at the hotel</span>
                        </div>

                        <div className="highlight-item">
                            <h4 className="highlight-title">Loyal Customers</h4>
                            <p className="highlight-text italic">
                                There are more repeat guests here than most other properties.
                            </p>
                        </div>

                        <button className="reserve-btn-primary" onClick={() => document.getElementById('room-selection')?.scrollIntoView({ behavior: 'smooth' })}>
                            Reserve
                        </button>
                    </div>

                    <div className="guarantee-card mt-6">
                        <div className="guarantee-title">
                            <div className="guarantee-icon-wrap">
                                <FaShieldAlt />
                            </div>
                            <span>Elite Stays Guarantee</span>
                        </div>
                        <ul className="guarantee-list">
                            <li className="guarantee-item">
                                <FaCheckCircle className="guarantee-check" />
                                <span>Best price guaranteed</span>
                            </li>
                            <li className="guarantee-item">
                                <FaCheckCircle className="guarantee-check" />
                                <span>24/7 Customer support</span>
                            </li>
                            <li className="guarantee-item">
                                <FaCheckCircle className="guarantee-check" />
                                <span>Secure payment processing</span>
                            </li>
                            <li className="guarantee-item">
                                <FaCheckCircle className="guarantee-check" />
                                <span>No hidden booking fees</span>
                            </li>
                        </ul>

                        <div className="mt-8 pt-6 border-t border-gray-100">
                            <h4 className="font-bold text-sm mb-3">Property Policies</h4>
                            <div className="text-xs text-gray-500 space-y-2">
                                <p><strong>Check-in:</strong> {hotel.policies?.checkInTime || '14:00'}</p>
                                <p><strong>Check-out:</strong> {hotel.policies?.checkOutTime || '11:00'}</p>
                                <p className="text-[#008009] font-semibold mt-2">{hotel.policies?.cancellationPolicy || 'Flexible cancellation available'}</p>
                            </div>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default HotelDetails;
