import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import API, { BACKEND_URL } from '../utils/api';
import './MobileHotelDetails.css';

const MobileHotelDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const [hotel, setHotel] = useState(null);
  const [rooms, setRooms] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeImage, setActiveImage] = useState(0);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    document.body.classList.add('mobile-app-active');
    
    // Header scroll effect
    const handleScroll = () => {
        setScrolled(window.scrollY > 150);
    };
    window.addEventListener('scroll', handleScroll);
    
    return () => {
        document.body.classList.remove('mobile-app-active');
        window.removeEventListener('scroll', handleScroll);
    };
  }, []);

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

      } catch (error) {
        console.error('Error fetching mobile hotel details', error);
      } finally {
        setLoading(false);
      }
    };
    fetchHotelData();
  }, [id]);

  if (loading) return (
    <div className="flex items-center justify-center min-h-[100vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#6d5dfc]"></div>
    </div>
  );

  if (!hotel) return <div className="p-8 text-center mt-20">Hotel not found.</div>;

  const images = hotel.images?.map(img => img.startsWith('http') ? img : `${BACKEND_URL}${img}`) || [];
  const bestOffer = offers.length > 0 ? offers[0] : null;

  return (
    <div className="mob-mdetails-root">
      {/* ── HEADER (Transparent -> Solid on scroll) ── */}
      <header className={`mob-mdetails-header ${scrolled ? 'solid' : 'transparent'}`}>
        <button className="mob-btn-circle" onClick={() => navigate(-1)}>
          <i className="fa fa-arrow-left"></i>
        </button>
        {scrolled && <h3 className="mob-scrolled-title line-clamp-1">{hotel.name}</h3>}
        <button className="mob-btn-circle" onClick={() => alert("Saved to wishlist!")}>
          <i className="fa fa-heart"></i>
        </button>
      </header>

      {/* ── IMAGE CAROUSEL ── */}
      <div className="mob-mdetails-hero">
        {images.length > 0 ? (
          <div className="mob-carousel-wrap">
            <img src={images[activeImage]} alt={hotel.name} />
            <div className="mob-carousel-dots">
              {images.slice(0, 5).map((_, i) => (
                <div key={i} className={`mob-dot ${i === activeImage ? 'active' : ''}`} onClick={() => setActiveImage(i)}></div>
              ))}
            </div>
          </div>
        ) : (
          <div className="mob-no-image-placeholder">No Images Available</div>
        )}
      </div>

      {/* ── BODY ── */}
      <div className="mob-mdetails-body">
        
        {/* Title & Metadata */}
        <div className="mob-mdetails-title-sec">
          <div className="mob-mdetails-meta">
            <span className="mob-badge-premium">PREMIUM</span>
            <span className="mob-mdetails-stars">
              <i className="fa fa-star text-yellow-500"></i> {hotel.rating || '4.5'} ({hotel.reviewCount || reviews.length} reviews)
            </span>
          </div>
          <h1>{hotel.name}</h1>
          <p className="mob-mdetails-location">
            <i className="fa fa-map-marker-alt"></i> {hotel.district || hotel.city}, {hotel.state}
          </p>
        </div>

        {/* Promotion Banner */}
        {bestOffer && (
            <div className="mob-promo-banner my-4">
                <div className="mob-promo-left">🔥</div>
                <div className="mob-promo-right">
                    <strong>{bestOffer.discountType === 'Percentage' ? `${bestOffer.discountValue}% OFF` : `₹${bestOffer.discountValue} OFF`}</strong>
                    <p>{bestOffer.title}</p>
                </div>
            </div>
        )}

        {/* Description */}
        <div className="mob-section">
          <h2>About</h2>
          <p className="mob-text-muted">
            {hotel.description}
          </p>
        </div>

        {/* Amenities */}
        <div className="mob-section">
          <h2>Amenities</h2>
          <div className="mob-amenities-grid">
            <div className="mob-amenity-cell">
              <i className="fa fa-wifi"></i> Free Wifi
            </div>
            <div className="mob-amenity-cell">
              <i className="fa fa-coffee"></i> Breakfast
            </div>
            {hotel.amenities?.slice(0, 4).map((am, i) => (
               <div key={i} className="mob-amenity-cell">
                 <i className="fa fa-check"></i> {am}
               </div>
            ))}
          </div>
        </div>

        {/* Rooms Scroll List */}
        <div className="mob-section">
          <h2>Select Room</h2>
          {rooms.length === 0 ? (
            <div className="mob-alert">No rooms available currently.</div>
          ) : (
            <div className="mob-rooms-scroll">
              {rooms.map(r => (
                <div key={r._id} className="mob-room-card" onClick={() => navigate(`/rooms/${r._id}`)}>
                  {r.images?.[0] && <img src={r.images[0].startsWith('http') ? r.images[0] : `${BACKEND_URL}${r.images[0]}`} alt={r.name} />}
                  <div className="mob-room-info">
                    <h4>{r.name}</h4>
                    <p><i className="fa fa-users"></i> Up to {r.maxGuests || 2} Guests</p>
                    <div className="mob-room-price">
                        {bestOffer ? (
                            <>
                                <small className="line-through text-gray-400">₹{r.pricePerNight?.toLocaleString()}</small>
                                <strong>₹{
                                    bestOffer.discountType === 'Percentage' 
                                    ? Math.round(r.pricePerNight * (1 - bestOffer.discountValue/100)).toLocaleString()
                                    : Math.max(0, r.pricePerNight - bestOffer.discountValue).toLocaleString()
                                }</strong>
                            </>
                        ) : (
                            <strong>₹{r.pricePerNight?.toLocaleString()}</strong>
                        )}
                        <span>/night</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

      {/* ── STICKY BOTTOM BAR ── */}
      <div className="mob-bottom-book-bar">
        <div className="mob-bbb-price">
            <p>From</p>
            <h3>₹{hotel.cheapestPrice?.toLocaleString() || 'N/A'}</h3>
        </div>
        <button 
           className="mob-bbb-btn"
           onClick={() => {
               if (rooms.length > 0) navigate(`/rooms/${rooms[0]._id}`);
               else alert('No rooms available to book.');
           }}
        >
            Book Now
        </button>
      </div>

    </div>
  );
};

export default MobileHotelDetails;
