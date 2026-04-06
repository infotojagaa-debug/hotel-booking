import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { addDays, startOfDay } from 'date-fns';
import API, { BACKEND_URL } from '../utils/api';
import { AuthContext } from '../context/AuthContext';
import './MobileRoomDetails.css';

const MobileRoomDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { userInfo } = useContext(AuthContext);

    const [room, setRoom] = useState(null);
    const [reviews, setReviews] = useState([]);
    const [offers, setOffers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeImage, setActiveImage] = useState(0);
    const [scrolled, setScrolled] = useState(false);

    // Booking state
    const [checkIn, setCheckIn] = useState(null);
    const [checkOut, setCheckOut] = useState(null);

    // Selected offer
    const [selectedOffer, setSelectedOffer] = useState(null);

    useEffect(() => {
        document.body.classList.add('mobile-app-active');
        const handleScroll = () => setScrolled(window.scrollY > 150);
        window.addEventListener('scroll', handleScroll);
        
        return () => {
            document.body.classList.remove('mobile-app-active');
            window.removeEventListener('scroll', handleScroll);
        };
    }, []);

    // Sync from local storage
    useEffect(() => {
        const savedSearch = localStorage.getItem('elite_stays_search');
        if (savedSearch) {
            const parsed = JSON.parse(savedSearch);
            if (parsed.checkIn) setCheckIn(new Date(parsed.checkIn));
            if (parsed.checkOut) setCheckOut(new Date(parsed.checkOut));
        }
    }, []);

    useEffect(() => {
        const fetchRoomData = async () => {
            try {
                setLoading(true);
                const { data: roomData } = await API.get(`/rooms/${id}`);
                setRoom(roomData);
                
                const { data: reviewsData } = await API.get(`/reviews/hotel/${roomData.hotel?._id}`);
                setReviews(reviewsData);
                
                const { data: offersData } = await API.get(`/offers/hotel/${roomData.hotel?._id}`).catch(() => ({ data: [] }));
                setOffers(offersData);

                // Auto-apply logic
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
            } catch (error) {
                console.error(error);
            } finally {
                setLoading(false);
            }
        };
        fetchRoomData();
    }, [id]);

    const handleBooking = () => {
        if (!userInfo) {
            navigate('/login');
            return;
        }
        if (!checkIn || !checkOut) {
            alert('Please select check-in and check-out dates.');
            return;
        }
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
                bestOffer: selectedOffer,
                room 
            } 
        });
    };

    if (loading) return (
        <div className="flex items-center justify-center min-h-[100vh]">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#6d5dfc]"></div>
        </div>
    );
    if (!room) return <div className="p-8 text-center mt-20">Room not found.</div>;

    const images = room.images?.map(img => img.startsWith('http') ? img : `${BACKEND_URL}${img}`) || [];
    
    // Mathematics
    const calculateNights = () => {
        if (!checkIn || !checkOut) return 0;
        const diffTime = Math.abs(checkOut - checkIn);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays > 0 ? diffDays : 0;
    };
    
    const nights = calculateNights();
    const subtotal = nights * (room.pricePerNight || 0);

    let discountAmount = 0;
    if (selectedOffer && subtotal > 0) {
        if (selectedOffer.discountType === 'Percentage') {
            discountAmount = subtotal * (selectedOffer.discountValue / 100);
        } else {
            discountAmount = selectedOffer.discountValue;
        }
        if (discountAmount > subtotal) discountAmount = subtotal;
    }

    const discountedSubtotal = subtotal - discountAmount;
    const serviceFee = discountedSubtotal * 0.05;
    const platformFee = discountedSubtotal * 0.02;
    const gst = discountedSubtotal * 0.12;
    const finalTotal = discountedSubtotal + serviceFee + platformFee + gst;

    return (
        <div className="mob-room-root">
            {/* Header */}
            <header className={`mob-room-hdr ${scrolled ? 'solid' : 'transparent'}`}>
                <button className="mob-btn-cr" onClick={() => navigate(-1)}>
                    <i className="fa fa-arrow-left"></i>
                </button>
                {scrolled && <h3 className="line-clamp-1">{room.name}</h3>}
                <div style={{width: 40}}></div>
            </header>

            {/* Carousel */}
            <div className="mob-rm-hero">
                {images.length > 0 ? (
                    <div className="mob-c-wrap">
                        <img src={images[activeImage]} alt={room.name} />
                        <div className="mob-c-dots">
                            {images.slice(0, 5).map((_, i) => (
                                <div key={i} className={`mob-dot ${i === activeImage ? 'active' : ''}`} onClick={() => setActiveImage(i)}></div>
                            ))}
                        </div>
                        {selectedOffer && (
                            <div className="mob-hero-badge">
                                🔥 {selectedOffer.discountType === 'Percentage' ? `${selectedOffer.discountValue}% OFF` : `₹${selectedOffer.discountValue} OFF`}
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="mob-no-img">No Images</div>
                )}
            </div>

            {/* Body */}
            <div className="mob-rm-body">
                
                <div className="mob-rm-title-sec">
                    <span className="mob-hotel-type">{room.hotel?.type || 'Hotel'}</span>
                    <h1>{room.name}</h1>
                    <div className="mob-rm-capacity">
                        <i className="fa fa-users"></i> Up to {room.maxGuests} Guests
                    </div>
                </div>

                <div className="mob-sec">
                    <h2>Description</h2>
                    <p className="mob-txt-mut">{room.description}</p>
                </div>

                {/* Offer application logic */}
                {offers.length > 0 && (
                    <div className="mob-sec mob-offers-bg">
                        <h2>Available Offers</h2>
                        <div className="mob-offers-scroll">
                            {offers.map(o => (
                                <div key={o._id} className="mob-offer-card">
                                    <div className="mob-oc-top">
                                        <strong>{o.discountType === 'Percentage' ? `${o.discountValue}% OFF` : `₹${o.discountValue} OFF`}</strong>
                                        <span>{o.hotel ? 'Hotel specific' : 'Global offer'}</span>
                                    </div>
                                    <p>{o.title}</p>
                                    <button 
                                        className={selectedOffer?._id === o._id ? 'applied' : 'apply'}
                                        onClick={() => setSelectedOffer(o)}
                                    >
                                        {selectedOffer?._id === o._id ? '✓ APPLIED' : 'APPLY OFFER'}
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                <div className="mob-sec">
                    <h2>Amenities</h2>
                    <div className="mob-amenities-g">
                        {room.amenities?.map((am, i) => (
                            <div key={i} className="mob-am-pill">
                                <i className="fa fa-check text-[#6d5dfc]"></i>
                                {am}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Booking Section */}
                <div className="mob-sec">
                    <h2>Choose Dates</h2>
                    <div className="mob-date-grid">
                        <div className="mob-dt-col">
                            <label>Check-In</label>
                            <DatePicker
                                selected={checkIn}
                                onChange={(date) => setCheckIn(date)}
                                selectsStart
                                startDate={checkIn}
                                endDate={checkOut}
                                minDate={startOfDay(new Date())}
                                placeholderText="Select date"
                                className="mob-dp-input"
                            />
                        </div>
                        <div className="mob-dt-col">
                            <label>Check-Out</label>
                            <DatePicker
                                selected={checkOut}
                                onChange={(date) => setCheckOut(date)}
                                selectsEnd
                                startDate={checkIn}
                                endDate={checkOut}
                                minDate={checkIn ? addDays(checkIn, 1) : addDays(new Date(), 1)}
                                placeholderText="Select date"
                                className="mob-dp-input"
                            />
                        </div>
                    </div>
                </div>

                {/* Pricing Summary (only if dates selected) */}
                {nights > 0 && (
                    <div className="mob-sec mob-summary-box">
                        <h2>Invoice Summary</h2>
                        <div className="mob-sm-row">
                            <span>₹{room.pricePerNight?.toLocaleString()} x {nights} nights</span>
                            <span>₹{subtotal.toLocaleString()}</span>
                        </div>
                        {discountAmount > 0 && (
                            <div className="mob-sm-row text-green-600 font-bold border-b border-dashed border-gray-200 pb-2 mb-2">
                                <span>Discount</span>
                                <span>-₹{discountAmount.toLocaleString()}</span>
                            </div>
                        )}
                        <div className="mob-sm-row txt-mute">
                            <span>Service Fee (5%)</span>
                            <span>₹{serviceFee.toLocaleString()}</span>
                        </div>
                        <div className="mob-sm-row txt-mute">
                            <span>Platform Fee (2%)</span>
                            <span>₹{platformFee.toLocaleString()}</span>
                        </div>
                        <div className="mob-sm-row txt-mute">
                            <span>GST (12%)</span>
                            <span>₹{gst.toLocaleString()}</span>
                        </div>
                        <div className="mob-sm-row total">
                            <span>Total Payable</span>
                            <span>₹{finalTotal.toLocaleString()}</span>
                        </div>
                    </div>
                )}
            </div>

            {/* Sticky Bottom Bar */}
            <div className="mob-rm-bot-bar">
                <div className="mob-rm-price">
                    <p>Price</p>
                    {nights > 0 ? (
                        <h3>₹{finalTotal.toLocaleString()}</h3>
                    ) : (
                        <h3>₹{room.pricePerNight?.toLocaleString()} <small>/night</small></h3>
                    )}
                </div>
                <button className="mob-rm-book" onClick={handleBooking}>
                    Reserve
                </button>
            </div>
        </div>
    );
};

export default MobileRoomDetails;
