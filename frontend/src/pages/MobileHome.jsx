import React, { useState, useEffect, useContext } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import API, { BACKEND_URL } from '../utils/api';
import MobileNav from '../components/MobileNav';
import './MobileHome.css';

// Trending destination images
import imgChennai    from '../assets/trending destination/Chennai.jpg';
import imgBangalore  from '../assets/trending destination/Bangalore.jpg';
import imgCoimbatore from '../assets/trending destination/coimbatore.png';
import imgHyderabad  from '../assets/trending destination/hyderabad.jpg';
import imgSalem      from '../assets/trending destination/salem.png';

// Property type images
import imgHotel      from '../assets/property_type/Hotel.jpg';
import imgApartment  from '../assets/property_type/Apartments.jpg';
import imgResort     from '../assets/property_type/Resort.jpg';
import imgVilla      from '../assets/property_type/Villas.jpg';

// Explore India images
import imgYelagiri   from '../assets/explore_india/Yelagiri.jpg';
import imgCoorg      from '../assets/explore_india/Coorg.jpg';
import imgYercaud    from '../assets/explore_india/Yercaud.jpg';
import imgMadurai    from '../assets/explore_india/Madurai.jpg';
import imgGoa        from '../assets/explore_india/Goa.jpg';
import imgRameshwaram from '../assets/explore_india/Rameshwaram.jpg';
import imgOoty       from '../assets/explore_india/Ooty.jpg';
import imgPondicherry from '../assets/explore_india/Pondicherry.jpg';

const DUMMY_OFFERS = [
  {
    _id: 'dummy-1',
    title: 'Flat 20% OFF on Beach Hotels',
    description: 'Enjoy sun, sand and savings!',
    discountType: 'Percentage',
    discountValue: 20,
    bannerImage: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600&q=80',
    validTo: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    hotel: null,
  },
  {
    _id: 'dummy-2',
    title: '₹1000 OFF on First Booking',
    description: 'New to EliteStays? Get ₹1000 off.',
    discountType: 'Flat',
    discountValue: 1000,
    bannerImage: 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=600&q=80',
    validTo: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(),
    hotel: null,
  },
  {
    _id: 'dummy-3',
    title: 'Luxury Rooms at 30% Discount',
    description: 'Upgrade your stay!',
    discountType: 'Percentage',
    discountValue: 30,
    bannerImage: 'https://images.unsplash.com/photo-1611892440504-42a792e24d32?w=600&q=80',
    validTo: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(),
    hotel: null,
  },
  {
    _id: 'dummy-4',
    title: 'Weekend Getaway – 25% OFF',
    description: 'Book Friday–Sunday & save 25%.',
    discountType: 'Percentage',
    discountValue: 25,
    bannerImage: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=600&q=80',
    validTo: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000).toISOString(),
    hotel: null,
  },
];

const trendingCities = [
  { name: 'Chennai',    img: imgChennai },
  { name: 'Bangalore',  img: imgBangalore },
  { name: 'Coimbatore', img: imgCoimbatore },
  { name: 'Hyderabad',  img: imgHyderabad },
  { name: 'Salem',      img: imgSalem },
];

const propertyTypes = [
  { name: 'Hotels',     icon: '🏨', img: imgHotel,     type: 'Hotel'     },
  { name: 'Apartments', icon: '🏢', img: imgApartment, type: 'Apartment' },
  { name: 'Resorts',    icon: '🌴', img: imgResort,    type: 'Resort'    },
  { name: 'Villas',     icon: '🏡', img: imgVilla,     type: 'Villa'     },
];

const exploreDestinations = [
  { name: 'Yelagiri',    props: 173,  img: imgYelagiri    },
  { name: 'Coorg',       props: 670,  img: imgCoorg       },
  { name: 'Yercaud',     props: 218,  img: imgYercaud     },
  { name: 'Madurai',     props: 214,  img: imgMadurai     },
  { name: 'Goa',         props: 3880, img: imgGoa         },
  { name: 'Rāmeswaram',  props: 111,  img: imgRameshwaram },
  { name: 'Ooty',        props: 530,  img: imgOoty        },
  { name: 'Pondicherry', props: 295,  img: imgPondicherry },
];

const MobileHome = () => {
  const [featuredHotels, setFeaturedHotels]   = useState([]);
  const [exclusiveOffers, setExclusiveOffers] = useState(DUMMY_OFFERS);
  const [loading, setLoading]                 = useState(true);
  const { userInfo }                          = useContext(AuthContext);
  const navigate                              = useNavigate();

  // Hide desktop navbar while this component is mounted
  useEffect(() => {
    document.body.classList.add('mobile-home-active');
    return () => document.body.classList.remove('mobile-home-active');
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [hotelsReq, offersReq] = await Promise.all([
          API.get('/hotels?limit=6'),
          API.get('/offers/public').catch(() => ({ data: [] })),
        ]);
        setFeaturedHotels(hotelsReq.data);
        const realOffers = offersReq.data || [];
        setExclusiveOffers(realOffers.length > 0 ? realOffers : DUMMY_OFFERS);
      } catch (err) {
        console.error('MobileHome fetch error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const getDynamicTag = (hotel) => {
    if (hotel.starRating >= 5) return 'LUXURY';
    if (hotel.rating      >= 4.5) return 'TOP RATED';
    if (hotel.cheapestPrice < 3000) return 'BEST VALUE';
    return 'TRENDING';
  };

  return (
    <div className="mob-root">

      {/* ── TOP BAR (inside hero gradient) ── */}
      <div style={{ background: 'linear-gradient(160deg, #2d264d 0%, #6d5dfc 60%, #4f46e5 100%)', paddingTop: 'max(12px, env(safe-area-inset-top))' }}>
        <div className="mob-top-bar">
          <div className="mob-brand">Elite Stays</div>
          {userInfo ? (
            <div className="mob-user-avatar">{userInfo.name.charAt(0).toUpperCase()}</div>
          ) : (
            <Link to="/login" className="mob-login-link">Login</Link>
          )}
        </div>

        {/* ── HERO SECTION ── */}
        <div className="mob-hero">
          <p className="mob-hero-greeting">
            {userInfo ? `Hello, ${userInfo.name.split(' ')[0]} 👋` : 'Good to see you 👋'}
          </p>
          <h1 className="mob-hero-title">Where to next?</h1>
          <p className="mob-hero-subtitle">Hotels, apartments, villas &amp; more</p>

          {/* Redesigned Premium Search Hub Trigger - Handled by MobileNav but triggerable here */}
          <div className="mob-search-hub" onClick={() => window.dispatchEvent(new CustomEvent('open-mob-search'))}>
            <div className="mob-search-hub-icon">
              <i className="fa fa-search"></i>
            </div>
            <div className="mob-search-hub-content">
              <div className="mob-search-hub-item">
                <span className="mob-hub-label">Where to?</span>
                <span className="mob-hub-value">Location</span>
              </div>
              <div className="mob-hub-divider"></div>
              <div className="mob-search-hub-item">
                <span className="mob-hub-label">When?</span>
                <span className="mob-hub-value">Any Dates</span>
              </div>
              <div className="mob-hub-divider"></div>
              <div className="mob-search-hub-item">
                <span className="mob-hub-label">Who?</span>
                <span className="mob-hub-value">Guests</span>
              </div>
            </div>
            <div className="mob-search-hub-filter">
              <i className="fa fa-sliders-h"></i>
            </div>
          </div>

          {/* Quick filter buttons */}
          <div className="mob-quick-filters">
            {propertyTypes.map((p) => (
              <Link key={p.type} to={`/hotels?type=${p.type}`} className="mob-quick-filter-btn" onTouchStart={(e) => e.target.classList.add('active')}>
                <span className="mob-quick-filter-icon">{p.icon}</span>
                <span>{p.name}</span>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* ── TRENDING CITIES ── */}
      <section className="mob-section">
        <div className="mob-section-header">
          <h2 className="mob-section-title">Trending Cities</h2>
          <Link to="/hotels" className="mob-see-all">See all →</Link>
        </div>
        <div className="mob-h-scroll">
          {trendingCities.map((city) => (
            <Link key={city.name} to={`/hotels?location=${city.name}`} className="mob-city-card">
              <img src={city.img} alt={city.name} loading="lazy" />
              <div className="mob-city-gradient"></div>
              <div className="mob-city-info">
                <span className="mob-city-name">{city.name}</span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ── EXCLUSIVE OFFERS ── */}
      <section className="mob-section">
        <div className="mob-section-header">
          <h2 className="mob-section-title">🔥 Exclusive Deals</h2>
        </div>
        <div className="mob-h-scroll">
          {exclusiveOffers.map((offer) => {
            const discountText = offer.discountType === 'Percentage'
              ? `${offer.discountValue}% OFF`
              : `₹${offer.discountValue} OFF`;
            const bannerSrc = offer.bannerImage
              ? (offer.bannerImage.startsWith('http') ? offer.bannerImage : `${BACKEND_URL}${offer.bannerImage.startsWith('/') ? '' : '/'}${offer.bannerImage}`)
              : 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=600&q=80';

            return (
              <Link
                key={offer._id}
                to={offer.hotel ? `/hotels/${offer.hotel._id}` : `/hotels?offer=${offer.code || ''}`}
                className="mob-offer-card"
                onClick={() => localStorage.setItem('elite_stays_active_offer', JSON.stringify(offer))}
              >
                <div className="mob-offer-img">
                  <img src={bannerSrc} alt={offer.title} loading="lazy" />
                  <div className="mob-offer-overlay"></div>
                  <span className="mob-offer-badge">{discountText}</span>
                </div>
                <div className="mob-offer-body">
                  <h4 className="mob-offer-title">{offer.title}</h4>
                  <span className="mob-offer-validity">
                    ⏰ Ends {new Date(offer.validTo).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                  </span>
                  <div><span className="mob-offer-cta">View Deal →</span></div>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* ── FEATURED HOTELS ── */}
      <section className="mob-section">
        <div className="mob-section-header">
          <h2 className="mob-section-title">Featured Deals</h2>
          <Link to="/hotels?sort=priceLow" className="mob-see-all">See all →</Link>
        </div>

        {loading ? (
          [1, 2, 3].map((i) => <div key={i} className="mob-skeleton"></div>)
        ) : featuredHotels.length === 0 ? (
          <p style={{ color: '#6b7280', textAlign: 'center', padding: '20px 0' }}>No hotels available.</p>
        ) : (
          featuredHotels.map((hotel) => {
            const imgSrc = hotel.images && hotel.images[0]
              ? (hotel.images[0].startsWith('http') ? hotel.images[0] : `${BACKEND_URL}/${hotel.images[0]}`)
              : '/images/services-1.jpg';

            return (
              <Link key={hotel._id} to={`/hotels/${hotel._id}`} className="mob-hotel-card">
                <div className="mob-hotel-img">
                  <img src={imgSrc} alt={hotel.name} loading="lazy" />
                  <span className="mob-hotel-tag">{getDynamicTag(hotel)}</span>
                </div>
                <div className="mob-hotel-body">
                  <h4 className="mob-hotel-name">{hotel.name}</h4>
                  <p className="mob-hotel-location">📍 {hotel.city}</p>
                  <div className="mob-hotel-footer">
                    <div className="mob-hotel-price-wrap">
                      <span className="mob-hotel-price-label">From</span>
                      <span>
                        <span className="mob-hotel-price">₹{hotel.cheapestPrice?.toLocaleString()}</span>
                        <span className="mob-hotel-per-night"> /night</span>
                      </span>
                    </div>
                    <div className="mob-hotel-rating">
                      <span className="mob-hotel-score">{hotel.rating || '4.0'}</span>
                      <span className="mob-hotel-book-btn">Book →</span>
                    </div>
                  </div>
                </div>
              </Link>
            );
          })
        )}
      </section>

      {/* ── EXPLORE INDIA ── */}
      <section className="mob-section">
        <div className="mob-section-header">
          <h2 className="mob-section-title">Explore India</h2>
        </div>
        <div className="mob-h-scroll">
          {exploreDestinations.map((dest) => (
            <Link key={dest.name} to={`/hotels?location=${dest.name}`} className="mob-explore-card">
              <div className="mob-explore-img">
                <img src={dest.img} alt={dest.name} loading="lazy" />
              </div>
              <span className="mob-explore-name">{dest.name}</span>
              <span className="mob-explore-props">{dest.props.toLocaleString()} properties</span>
            </Link>
          ))}
        </div>
      </section>

      {/* ── TRUST BAR ── */}
      <section className="mob-section">
        <div className="mob-trust-grid">
          {[
            { icon: '🛡️', title: 'Free Cancellation', text: 'No hidden fees on most stays' },
            { icon: '🏨', title: '1.2M+ Properties', text: 'Hotels, villas, resorts & more' },
            { icon: '⚡', title: 'Instant Confirm', text: 'Book & your stay is guaranteed' },
            { icon: '💬', title: '24/7 Support',    text: 'Always here when you need help' },
          ].map((item) => (
            <div key={item.title} className="mob-trust-item">
              <span className="mob-trust-icon">{item.icon}</span>
              <h5 className="mob-trust-title">{item.title}</h5>
              <p className="mob-trust-text">{item.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── NEWSLETTER ── */}
      <div className="mob-newsletter">
        <h3>Get deals in your inbox</h3>
        <p>Join 1M+ travelers who get the best hotel prices.</p>
        <div className="mob-newsletter-form">
          <input type="email" className="mob-newsletter-input" placeholder="Enter your email address" />
          <button className="mob-newsletter-btn">Subscribe Now</button>
        </div>
      </div>
    </div>
  );
};

export default MobileHome;
