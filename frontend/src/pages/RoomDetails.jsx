import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { addDays, startOfDay } from 'date-fns';
import { 
    FaCheck, FaWifi, FaTv, FaSnowflake, FaSwimmingPool, FaCar, 
    FaUtensils, FaDumbbell, FaSmokingBan, FaPaw, FaCoffee, 
    FaSpa, FaVideo, FaShieldAlt, FaBriefcase, FaConciergeBell,
    FaMapMarkerAlt, FaStar, FaInfoCircle, FaUsers
} from 'react-icons/fa';
import API from '../utils/api';
import { AuthContext } from '../context/AuthContext';
import BookingStepper from '../components/BookingStepper';
import ImageLightbox from '../components/ImageLightbox';
import BookingSummaryBar from '../components/BookingSummaryBar';
import MobileRoomDetails from './MobileRoomDetails';
import './RoomDetails.css';
import './HotelDetails.css'; // Import for promotion card styling

const AMENITY_MAP = {
    'WiFi': { icon: <FaWifi />, color: '#3b82f6' },
    'Free WiFi': { icon: <FaWifi />, color: '#3b82f6' },
    'TV': { icon: <FaTv />, color: '#6366f1' },
    'AC': { icon: <FaSnowflake />, color: '#0ea5e9' },
    'Pool': { icon: <FaSwimmingPool />, color: '#06b6d4' },
    'Swimming Pool': { icon: <FaSwimmingPool />, color: '#06b6d4' },
    'Parking': { icon: <FaCar />, color: '#64748b' },
    'Restaurant': { icon: <FaUtensils />, color: '#f59e0b' },
    'Gym': { icon: <FaDumbbell />, color: '#ec4899' },
    'CCTV': { icon: <FaVideo />, color: '#64748b' },
    'Power Backup': { icon: <FaShieldAlt />, color: '#f59e0b' },
    'Breakfast': { icon: <FaCoffee />, color: '#d97706' },
    'Spa': { icon: <FaSpa />, color: '#8b5cf6' },
    'Work Desk': { icon: <FaBriefcase />, color: '#475569' },
};

const RoomDetails = () => {
    const { id } = useParams();
    const [room, setRoom] = useState(null);
    const [reviews, setReviews] = useState([]);
    const [offers, setOffers] = useState([]);
    const [selectedOffer, setSelectedOffer] = useState(null);
    const [loading, setLoading] = useState(true);
    const [checkIn, setCheckIn] = useState(null);
    const [checkOut, setCheckOut] = useState(null);
    const { userInfo } = useContext(AuthContext);
    const navigate = useNavigate();

    const [userRating, setUserRating] = useState(5);
    const [userComment, setUserComment] = useState('');
    const [submitLoading, setSubmitLoading] = useState(false);
    const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth <= 768);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Lightbox State
    const [lightbox, setLightbox] = useState({
        isOpen: false,
        index: 0,
        images: []
    });

    // Persistent Search & Offer State
    const [searchData, setSearchData] = useState(null);
    const [activeOffer, setActiveOffer] = useState(null);

    useEffect(() => {
        const savedSearch = localStorage.getItem('elite_stays_search');
        const savedOffer = localStorage.getItem('elite_stays_active_offer');
        
        if (savedSearch) {
            const parsed = JSON.parse(savedSearch);
            setSearchData(parsed);
            if (parsed.checkIn) setCheckIn(new Date(parsed.checkIn));
            if (parsed.checkOut) setCheckOut(new Date(parsed.checkOut));
        }

        if (savedOffer) {
            setActiveOffer(JSON.parse(savedOffer));
        }
    }, []);

    const handleClearSearch = () => {
        localStorage.removeItem('elite_stays_search');
        localStorage.removeItem('elite_stays_active_offer');
        setSearchData(null);
        setActiveOffer(null);
    };

    useEffect(() => {
        const fetchRoomAndReviews = async () => {
            try {
                const { data: roomData } = await API.get(`/rooms/${id}`);
                setRoom(roomData);
                const { data: reviewsData } = await API.get(`/reviews/hotel/${roomData.hotel?._id}`);
                setReviews(reviewsData);
                const { data: offersData } = await API.get(`/offers/hotel/${roomData.hotel?._id}`).catch(() => ({ data: [] }));
                setOffers(offersData);
                
                // Prioritize persisted offer if it belongs to this hotel or is global
                const persistedOffer = localStorage.getItem('elite_stays_active_offer');
                if (persistedOffer) {
                    const parsed = JSON.parse(persistedOffer);
                    const hotelId = roomData.hotel?._id || roomData.hotel;
                    if (!parsed.hotel || parsed.hotel._id === hotelId || parsed.hotel === hotelId) {
                        setSelectedOffer(parsed);
                    } else if (offersData.length > 0) {
                        setSelectedOffer(offersData[0]);
                    }
                } else if (offersData.length > 0) {
                    setSelectedOffer(offersData[0]);
                }
                setLoading(false);
            } catch (error) {
                console.error('Error fetching details', error);
                setLoading(false);
            }
        };
        fetchRoomAndReviews();
    }, [id]);

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

    const handleBooking = async (e) => {
        e.preventDefault();
        if (!userInfo) {
            navigate('/login');
            return;
        }
        if (!checkIn || !checkOut) {
            alert('Please select check-in and check-out dates.');
            return;
        }
        const nights = (new Date(checkOut) - new Date(checkIn)) / (1000 * 60 * 60 * 24);
        if (nights <= 0) {
            alert('Check-out date must be after check-in date');
            return;
        }
        navigate('/payment', { 
            state: { 
                roomId: room._id, 
                checkIn, 
                checkOut, 
                nights, 
                totalPrice: subtotal, 
                discountAmount,
                bestOffer,
                room 
            } 
        });
    };

    const handleReviewSubmit = async (e) => {
        e.preventDefault();
        if (!userInfo) return navigate('/login');
        try {
            setSubmitLoading(true);
            const { data: bookings } = await API.get('/bookings');
            const myPaidBooking = bookings.find(b => b.room?.hotel === room.hotel?._id && b.paymentStatus === 'Paid');
            if (!myPaidBooking) {
                alert('You can only review hotels you have previously booked and paid for.');
                setSubmitLoading(false);
                return;
            }
            const { data: newReview } = await API.post('/reviews', {
                hotelId: room.hotel?._id,
                bookingId: myPaidBooking._id,
                rating: userRating,
                comment: userComment
            });
            setReviews([newReview, ...reviews]);
            setUserComment('');
            alert('Review submitted successfully!');
        } catch (error) {
            alert(error.response?.data?.message || 'Failed to submit review');
        } finally {
            setSubmitLoading(false);
        }
    };

    const getRatingLabel = (rating) => {
        if (!rating || rating === 0) return 'No Ratings';
        if (rating >= 9) return 'Exceptional';
        if (rating >= 8) return 'Excellent';
        if (rating >= 7) return 'Very Good';
        if (rating >= 6) return 'Good';
        return 'Pleasant';
    };

    const calculateNights = () => {
        if (!checkIn || !checkOut) return 0;
        const diffTime = Math.abs(checkOut - checkIn);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays > 0 ? diffDays : 0;
    };

    const nights = calculateNights();
    const subtotal = nights * (room?.pricePerNight || 0);

    const bestOffer = selectedOffer;

    let discountAmount = 0;
    if (bestOffer && subtotal > 0) {
        if (bestOffer.discountType === 'Percentage') {
            discountAmount = subtotal * (bestOffer.discountValue / 100);
        } else {
            discountAmount = bestOffer.discountValue;
        }
        if (discountAmount > subtotal) discountAmount = subtotal;
    }

    const discountedSubtotal = subtotal - discountAmount;

    const serviceFee = discountedSubtotal * 0.05;
    const platformFee = discountedSubtotal * 0.02;
    const gst = discountedSubtotal * 0.12;
    const finalTotal = discountedSubtotal + serviceFee + platformFee + gst;

    if (loading) return (
        <div className="flex items-center justify-center min-h-screen">
             <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#6d5dfc]"></div>
        </div>
    );
    if (!room) return <div className="container py-20 text-center">Room not found.</div>;

    const roomImages = room.images || [];

    if (isMobile) {
        return <MobileRoomDetails />;
    }

    return (
        <>
            <BookingStepper currentStep={2} />
            
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

            <div className="room-details-wrapper">
                <main className="room-details-main-grid">
                    
                    <div className="room-details-left">
                        <div className="mb-6">
                            <div className="flex items-center gap-3 mb-4">
                                <span className="badge-premium-blue">{room.hotel?.type}</span>
                                {room.hotel?.isAdminHotel && (
                                    <span className="bg-amber-100 text-amber-800 text-[11px] font-bold px-3 py-1 rounded-full border border-amber-200">
                                        PREMIUM PARTNER
                                    </span>
                                )}
                            </div>
                            <h1 className="room-title-premium">{room.name}</h1>
                            <div className="hotel-info-tagline">
                                <FaMapMarkerAlt className="text-[#6d5dfc]" />
                                {room.hotel?.city}, {room.hotel?.address} — <span className="text-[#6d5dfc] font-bold cursor-pointer hover:underline">Excellent location</span>
                            </div>
                        </div>

                        {/* Image Display - Only switch between what's present */}
                        {roomImages.length > 0 && (
                            <section className="room-premium-gallery">
                                <div className="room-main-img-wrap cursor-zoom-in relative" onClick={() => openLightbox(roomImages, 0)}>
                                    <img src={roomImages[0]} alt={room.name} referrerPolicy="no-referrer" />
                                    {/* 🔥 Discount Badge on Image */}
                                    {bestOffer && (
                                        <div className="hotel-card-offer-badge" style={{ top: '16px', right: '16px', bottom: 'auto', left: 'auto', fontSize: '13px', padding: '6px 16px' }}>
                                            🔥 {bestOffer.discountType === 'Percentage' ? `${bestOffer.discountValue}% OFF` : `₹${bestOffer.discountValue} OFF`}
                                        </div>
                                    )}
                                </div>
                                {roomImages.length > 1 && (
                                    <div className="flex flex-wrap gap-3 mt-3">
                                        {roomImages.slice(1).map((img, i) => (
                                            <div 
                                                key={i} 
                                                className="w-32 h-24 rounded-lg overflow-hidden cursor-zoom-in opacity-80 hover:opacity-100 transition-opacity border-2 border-transparent hover:border-[#6d5dfc]"
                                                onClick={() => openLightbox(roomImages, i + 1)}
                                            >
                                                <img src={img} alt={`${room.name} ${i + 2}`} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </section>
                        )}

                        <section className="mb-10">
                            <h3 className="section-title">Room Description</h3>
                            <p className="text-[#4b5563] leading-relaxed text-[16px] mb-6">
                                {room.description}
                            </p>
                            
                            <div className="bg-purple-50 border-l-4 border-[#6d5dfc] p-4 rounded-r-lg flex items-start gap-3">
                                <FaInfoCircle className="text-[#6d5dfc] mt-1 shrink-0" />
                                <div className="text-sm">
                                    <p className="font-bold text-[#2d264d] mb-1">Cancellation Policy</p>
                                    <p className="text-gray-600">{room.hotel?.policies?.cancellationPolicy || 'Free cancellation up to 24 hours before check-in. Non-refundable after that.'}</p>
                                </div>
                            </div>
                        </section>

                        {/* 🔥 Promotions Section Below Description */}
                        {offers.length > 0 && (
                            <div className="hotel-promotions-section mb-12">
                                <h3 className="section-title mb-4">🔥 Active Promotions &amp; Offers</h3>
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
                                                    <div className="flex gap-2 items-center">
                                                        {offer.code && (
                                                            <span className="promo-code-chip">Code: {offer.code}</span>
                                                        )}
                                                        <button 
                                                            onClick={() => setSelectedOffer(offer)}
                                                            className={`text-[11px] px-3 py-1.5 font-extrabold rounded-lg border transition-all uppercase tracking-wide cursor-pointer ${
                                                                selectedOffer?._id === offer._id 
                                                                ? 'bg-green-100 border-green-300 text-green-700 shadow-sm' 
                                                                : 'bg-red-50 border-red-200 text-red-600 hover:bg-red-100 hover:border-red-300 shadow-sm'
                                                            }`}
                                                        >
                                                            {selectedOffer?._id === offer._id ? '✓ APPLIED' : 'APPLY OFFER'}
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        <section className="mb-12">
                            <h3 className="section-title">Popular Amenities</h3>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                                {room.amenities.map((amenity, index) => {
                                    const config = AMENITY_MAP[amenity] || { icon: <FaCheck />, color: '#10b981' };
                                    return (
                                        <div key={index} className="amenity-premium-pill">
                                            <div 
                                                className="icon-box-p" 
                                                style={{ backgroundColor: `${config.color}15`, color: config.color }}
                                            >
                                                {config.icon}
                                            </div>
                                            <span className="text-[14px] font-bold text-gray-700">{amenity}</span>
                                        </div>
                                    );
                                })}
                            </div>
                        </section>

                        <section className="reviews-section-premium">
                            <div className="reviews-header-flex-p">
                                <h3 className="section-title-p">Guest Reviews</h3>
                                <div className="rating-summary-card-p">
                                    <div className="text-right">
                                        <p className="rating-label-p">{getRatingLabel(room.hotel?.rating)}</p>
                                        <p className="rating-count-p">{room.hotel?.reviewCount || 0} verified reviews</p>
                                    </div>
                                    <div className="rating-score-badge-p">
                                        {room.hotel?.rating?.toFixed(1) || '0.0'}
                                    </div>
                                </div>
                            </div>

                            {/* Leave a Review Section */}
                            <div className="leave-review-box-p">
                                <h4 className="leave-review-title-p">Leave a Review</h4>
                                <div className="star-selection-p">
                                    {[1, 2, 3, 4, 5].map((s) => (
                                        <FaStar 
                                            key={s} 
                                            className={s <= userRating ? 'star-active-p' : 'star-inactive-p'} 
                                            onClick={() => setUserRating(s)}
                                        />
                                    ))}
                                </div>
                                <textarea 
                                    className="review-input-p" 
                                    placeholder={`Share your experience with ${room.name}...`}
                                    value={userComment}
                                    onChange={(e) => setUserComment(e.target.value)}
                                />
                                <button 
                                    className="submit-review-btn-p" 
                                    onClick={handleReviewSubmit}
                                    disabled={submitLoading}
                                >
                                    {submitLoading ? 'Submitting...' : 'Post Review'}
                                </button>
                            </div>

                            <div className="space-y-4">
                                {reviews.map(review => (
                                    <div key={review._id} className="review-card-modern">
                                        <div className="flex justify-between mb-3">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center font-bold text-gray-400 capitalize">
                                                    {review.user?.name.charAt(0)}
                                                </div>
                                                <div>
                                                    <p className="font-bold text-sm text-gray-800">{review.user?.name}</p>
                                                    <p className="text-[11px] text-gray-400">{new Date(review.createdAt).toLocaleDateString()}</p>
                                                </div>
                                            </div>
                                            <div className="rating-stars-p flex gap-0.5">
                                                {[...Array(5)].map((_, i) => (
                                                    <FaStar key={i} className={i < review.rating ? 'text-[#ffb700]' : 'text-gray-200'} />
                                                ))}
                                            </div>
                                        </div>
                                        <p className="text-gray-600 text-sm leading-relaxed italic">"{review.comment}"</p>
                                    </div>
                                ))}
                                {reviews.length === 0 && (
                                    <div className="p-12 text-center bg-white rounded-2xl border border-dashed border-gray-200">
                                        <p className="text-gray-400">Be the first to share your experience with {room.name}!</p>
                                    </div>
                                )}
                            </div>
                        </section>
                    </div>

                    <div className="room-details-right">
                        <div className="premium-booking-card">
                            <div className="booking-card-price-row">
                                <div className="room-price-total">₹{room.pricePerNight?.toLocaleString()}</div>
                                <div className="price-unit">per night</div>
                            </div>

                            <form onSubmit={handleBooking}>
                                <div className="booking-input-grid-box">
                                    <div className="booking-input-group">
                                        <label>Check-In</label>
                                        <DatePicker
                                            selected={checkIn}
                                            onChange={(date) => setCheckIn(date)}
                                            selectsStart
                                            startDate={checkIn}
                                            endDate={checkOut}
                                            minDate={startOfDay(new Date())}
                                            placeholderText="Add date"
                                            className="datepicker-premium-custom"
                                            required
                                        />
                                    </div>
                                    <div className="booking-input-group">
                                        <label>Check-Out</label>
                                        <DatePicker
                                            selected={checkOut}
                                            onChange={(date) => setCheckOut(date)}
                                            selectsEnd
                                            startDate={checkIn}
                                            endDate={checkOut}
                                            minDate={checkIn ? addDays(checkIn, 1) : addDays(new Date(), 1)}
                                            placeholderText="Add date"
                                            className="datepicker-premium-custom"
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="capacity-row-p">
                                    <div className="capacity-icon-p">
                                        <FaUsers />
                                    </div>
                                    <div className="capacity-text-p">
                                        Maximum Capacity: <strong>{room.maxGuests} Adults</strong>
                                    </div>
                                </div>

                                {nights > 0 && (
                                    <div className="price-summary-box-p">
                                        <div className="price-line-p">
                                            <span>₹{room.pricePerNight?.toLocaleString()} x {nights} nights</span>
                                            <span>₹{subtotal.toLocaleString()}</span>
                                        </div>
                                        {discountAmount > 0 && (
                                            <div className="price-line-p text-[13px] text-green-600 font-semibold border-b border-dashed border-gray-200 pb-2 mb-2">
                                                <span>Special Discount ({bestOffer?.title || 'Offer'})</span>
                                                <span>-₹{discountAmount.toLocaleString()}</span>
                                            </div>
                                        )}
                                        <div className="price-line-p text-[13px] text-gray-500 mt-2">
                                            <span>Service Fee (5%)</span>
                                            <span>₹{serviceFee.toLocaleString()}</span>
                                        </div>
                                        <div className="price-line-p text-[13px] text-gray-500">
                                            <span>Platform Fee (2%)</span>
                                            <span>₹{platformFee.toLocaleString()}</span>
                                        </div>
                                        <div className="price-line-p text-[13px] text-gray-500">
                                            <span>GST (12%)</span>
                                            <span>₹{gst.toLocaleString()}</span>
                                        </div>
                                        <div className="price-line-total-p mt-4 pt-4 border-t border-dashed">
                                            <span>Total</span>
                                            <span>₹{finalTotal.toLocaleString()}</span>
                                        </div>
                                    </div>
                                )}

                                <button type="submit" className="btn-reserve-gold">
                                    {userInfo ? 'Reserve Now' : 'Sign in to Reserve'}
                                </button>
                                
                                <p className="not-charged-hint">
                                    <FaShieldAlt className="inline mr-0.5" /> No payment required yet
                                </p>
                            </form>

                            <div className="included-facilities-box">
                                <p className="facilities-title-p">Included Facilities</p>
                                <div className="facilities-mini-grid">
                                    <div className="facility-mini-item">
                                        <FaWifi className="facility-mini-icon text-green-600" /> Free WiFi
                                    </div>
                                    <div className="facility-mini-item">
                                        <FaSnowflake className="facility-mini-icon text-blue-400" /> AC Room
                                    </div>
                                    <div className="facility-mini-item">
                                        <FaCoffee className="facility-mini-icon text-amber-600" /> Breakfast
                                    </div>
                                    <div className="facility-mini-item">
                                        <FaShieldAlt className="facility-mini-icon text-slate-400" /> Secured
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                </main>
            </div>
        </>
    );
};

export default RoomDetails;
