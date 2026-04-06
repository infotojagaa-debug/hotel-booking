import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import HeroSlider from '../components/HeroSlider';
import API, { BACKEND_URL } from '../utils/api';
import MobileHome from './MobileHome';

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



const trendingCities = [
  { name: 'Chennai',    flag: '🇮🇳', img: imgChennai    },
  { name: 'Bangalore',  flag: '🇮🇳', img: imgBangalore  },
  { name: 'Coimbatore', flag: '🇮🇳', img: imgCoimbatore },
  { name: 'Hyderabad',  flag: '🇮🇳', img: imgHyderabad  },
  { name: 'Salem',      flag: '🇮🇳', img: imgSalem      },
];

// ─── Static dummy offers shown when DB has no offers yet ───────────────────
const DUMMY_OFFERS = [
  {
    _id: 'dummy-1',
    title: 'Flat 20% OFF on Beach Hotels',
    description: 'Enjoy sun, sand and savings! Get 20% off on all beachside properties this season.',
    discountType: 'Percentage',
    discountValue: 20,
    bannerImage: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600&q=80',
    validTo: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    hotel: null,
  },
  {
    _id: 'dummy-2',
    title: '₹1000 OFF on First Booking',
    description: 'New to EliteStays? Get flat ₹1000 off on your very first hotel booking.',
    discountType: 'Flat',
    discountValue: 1000,
    bannerImage: 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=600&q=80',
    validTo: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(),
    hotel: null,
  },
  {
    _id: 'dummy-3',
    title: 'Luxury Rooms at 30% Discount',
    description: 'Upgrade your stay! Premium suites and luxury rooms at 30% off for a limited time.',
    discountType: 'Percentage',
    discountValue: 30,
    bannerImage: 'https://images.unsplash.com/photo-1611892440504-42a792e24d32?w=600&q=80',
    validTo: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(),
    hotel: null,
  },
  {
    _id: 'dummy-4',
    title: 'Weekend Getaway – 25% OFF',
    description: 'Plan your weekend escape! Book Friday–Sunday stays and save 25% automatically.',
    discountType: 'Percentage',
    discountValue: 25,
    bannerImage: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=600&q=80',
    validTo: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000).toISOString(),
    hotel: null,
  },
  {
    _id: 'dummy-5',
    title: 'Early Bird Special – 15% OFF',
    description: 'Book 7+ days in advance and enjoy an exclusive 15% early bird discount.',
    discountType: 'Percentage',
    discountValue: 15,
    bannerImage: 'https://images.unsplash.com/photo-1551882547-ff40c63fe2fa?w=600&q=80',
    validTo: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
    hotel: null,
  },
];

const Home = () => {
  const [featuredHotels, setFeaturedHotels] = useState([]);
  const [exclusiveOffers, setExclusiveOffers] = useState(DUMMY_OFFERS);
  const [loading, setLoading] = useState(true);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [hotelsReq, offersReq] = await Promise.all([
            API.get('/hotels?limit=4'),
            API.get('/offers/public').catch(() => ({ data: [] }))
        ]);
        setFeaturedHotels(hotelsReq.data);
        // Merge: real offers first, then fill remaining with dummy if < 3 real offers
        const realOffers = offersReq.data || [];
        setExclusiveOffers(realOffers.length > 0 ? realOffers : DUMMY_OFFERS);
      } catch (err) {
        console.error("Error fetching home data:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const getDynamicTag = (hotel) => {
    if (hotel.starRating >= 5) return 'LUXURY';
    if (hotel.rating >= 4.5) return 'TOP RATED';
    if (hotel.cheapestPrice < 3000) return 'BEST VALUE';
    return 'TRENDING';
  };

  if (isMobile) {
    return <MobileHome />;
  }

  return (
    <>
      <HeroSlider />

      {/* Browse by Property Type */}
      <section className="prop-type-section mb-[60px]">
        <div className="container-elite">
          <h2 className="prop-type-heading" data-aos="fade-up">Browse by property type</h2>
          <div className="prop-type-grid" data-aos="fade-up" data-aos-delay="80">
            {[
              { name: 'Hotels',     count: 320, img: imgHotel,     type: 'Hotel'     },
              { name: 'Apartments', count: 215, img: imgApartment, type: 'Apartment' },
              { name: 'Resorts',    count: 140, img: imgResort,    type: 'Resort'    },
              { name: 'Villas',     count:  98, img: imgVilla,     type: 'Villa'     },
            ].map((p, idx) => (
              <Link key={idx} to={`/hotels?type=${p.type}`} className="prop-type-card">
                <div className="prop-type-img-wrap">
                  <img src={p.img} alt={p.name} loading="lazy" />
                </div>
                <div className="prop-type-label">
                  <span className="prop-type-name">{p.name}</span>
                  <span className="prop-type-count">{p.count} properties</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* 🔥 Exclusive Offers & Deals – always visible */}
      <section className="exclusive-offers-section mb-[60px]">
        <div className="container-elite">
          <div className="offers-section-header" data-aos="fade-up">
            <div className="offers-header-left">
              <div className="offers-fire-badge">🔥 Limited Time</div>
              <h2 className="offers-main-heading">Exclusive Offers &amp; Deals</h2>
              <p className="offers-sub-heading">Don't miss out on these hand-picked platform discounts</p>
            </div>
            <div className="offers-nav-arrows">
              <button className="offers-arrow-btn" aria-label="scroll left"
                onClick={() => document.getElementById('offersTrack').scrollBy({ left: -340, behavior: 'smooth' })}>
                ‹
              </button>
              <button className="offers-arrow-btn" aria-label="scroll right"
                onClick={() => document.getElementById('offersTrack').scrollBy({ left: 340, behavior: 'smooth' })}>
                ›
              </button>
            </div>
          </div>

          <div className="offers-scroll-track" id="offersTrack" data-aos="fade-up" data-aos-delay="80">
            {exclusiveOffers.length === 0 ? (
                <div style={{ width: '100%', textAlign: 'center', padding: '40px 0', fontSize: '1.2rem', color: '#64748b' }}>
                    No offers available
                </div>
            ) : (
                exclusiveOffers.map((offer) => {
                  const discountText = offer.discountType === 'Percentage' ? `${offer.discountValue}% OFF` : `₹${offer.discountValue} OFF`;
                  const offerLabelText = offer.hotel?.name ? `${discountText} – ${offer.hotel.name}` : `${discountText} – All Hotels`;

                  return (
                  <div key={offer._id} className="offer-deal-card">
                    <div className="offer-deal-img">
                      <img 
                        src={offer.bannerImage
                          ? (offer.bannerImage.startsWith('http') ? offer.bannerImage : `${BACKEND_URL}${offer.bannerImage.startsWith('/') ? '' : '/'}${offer.bannerImage}`)
                          : 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=600&q=80'} 
                        alt={offer.title}
                        loading="lazy" 
                      />
                      <div className="offer-deal-overlay"></div>
                      <span className="offer-deal-badge" style={{ backgroundColor: offer.hotel ? '#3b82f6' : '#10b981' }}>
                        🔥 {offerLabelText}
                      </span>
                    </div>
                    <div className="offer-deal-body">
                      <h4 className="offer-deal-title">{offer.title}</h4>
                      <p className="offer-deal-desc">
                        {offer.description || (offer.hotel ? `Exclusive deal at ${offer.hotel.name}` : 'Applicable for All Hotels')}
                      </p>
                      <div className="offer-deal-footer">
                        <span className="offer-deal-validity">⏰ Ends {new Date(offer.validTo).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>
                        <Link
                          to={offer.hotel ? `/hotels/${offer.hotel._id}` : `/hotels?offer=${offer.code}`}
                          state={{ appliedOffer: offer }}
                          onClick={() => {
                            localStorage.setItem('elite_stays_active_offer', JSON.stringify(offer));
                          }}
                          className="offer-deal-cta"
                        >
                          View Deal →
                        </Link>
                      </div>
                    </div>
                  </div>
                )})
            )}
          </div>
        </div>
      </section>

      {/* Trending Destinations - Bento Grid */}
      <section style={{ padding: '60px 0', background: '#fff', overflow: 'hidden', position: 'relative' }} className="mb-[60px]">
        <div className="container-elite">
          <div className="row mb-4">
            <div className="col-md-12 text-left" data-aos="fade-up">
              <h2 className="mb-1 font-weight-bold" style={{ color: '#222222', fontSize: '28px', fontFamily: "'Poppins', sans-serif" }}>Trending destinations</h2>
              <p className="text-muted" style={{ fontSize: '15px' }}>Travelers searching for India also booked these</p>
            </div>
          </div>
          <div className="bento-grid-container" data-aos="fade-up" data-aos-delay="100">
            {trendingCities.map((city, idx) => (
              <Link key={idx} to={`/hotels?location=${city.name}`} className="bento-item shadow-sm">
                <div className="bento-gradient"></div>
                <div className="bento-content">
                  <h3 className="bento-title">{city.name}</h3>
                  <span className="bento-flag">{city.flag}</span>
                </div>
                <img src={city.img} alt={city.name} loading="lazy" />
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Explore India – Horizontal Scroll */}
      <section className="explore-section mb-[60px]">
        <div className="container-elite">
          <div className="explore-header" data-aos="fade-up">
            <div>
              <h2 className="explore-heading">Explore India</h2>
              <p className="explore-subheading">These popular destinations have a lot to offer</p>
            </div>
            <div className="explore-arrows">
              <button className="explore-arrow" id="exploreLeft" aria-label="scroll left"
                onClick={() => document.getElementById('exploreTrack').scrollBy({ left: -280, behavior: 'smooth' })}>
                ‹
              </button>
              <button className="explore-arrow" id="exploreRight" aria-label="scroll right"
                onClick={() => document.getElementById('exploreTrack').scrollBy({ left: 280, behavior: 'smooth' })}>
                ›
              </button>
            </div>
          </div>

          <div className="explore-track" id="exploreTrack" data-aos="fade-up" data-aos-delay="80">
            {[
              { name: 'Yelagiri',    props: 173,   img: imgYelagiri    },
              { name: 'Coorg',       props: 670,   img: imgCoorg       },
              { name: 'Yercaud',     props: 218,   img: imgYercaud     },
              { name: 'Madurai',     props: 214,   img: imgMadurai     },
              { name: 'Goa',         props: 3880,  img: imgGoa         },
              { name: 'Rāmeswaram',  props: 111,   img: imgRameshwaram },
              { name: 'Ooty',        props: 530,   img: imgOoty        },
              { name: 'Pondicherry', props: 295,   img: imgPondicherry },
            ].map((dest, idx) => (
              <Link key={idx} to={`/hotels?location=${dest.name}`} className="explore-card">
                <div className="explore-img-wrap">
                  <img src={dest.img} alt={dest.name} loading="lazy" />
                </div>
                <div className="explore-card-body">
                  <span className="explore-city">{dest.name}</span>
                  <span className="explore-props">{dest.props.toLocaleString()} properties</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Deals */}

      <section className="ftco-section mb-[60px]" style={{ background: '#f8f8f8', paddingTop: '60px', paddingBottom: '60px' }}>
        <div className="container-elite">
          <div className="row mb-4 align-items-end">
            <div className="col-md-8" data-aos="fade-up">
              <h2 className="mb-1 font-weight-bold" style={{ color: '#222222', fontSize: '28px', fontFamily: "'Poppins', sans-serif" }}>Featured deals</h2>
              <p className="text-muted mb-0" style={{ fontSize: '15px' }}>Great properties at limited-time prices</p>
            </div>
            <div className="col-md-4 text-right" data-aos="fade-up">
              <Link to="/hotels?sort=priceLow" className="home-see-all-link">See all deals →</Link>
            </div>
          </div>
          <div className="deals-grid" data-aos="fade-up" data-aos-delay="100">
            {loading ? (
              [1, 2, 3, 4].map(i => (
                <div key={i} className="bg-white h-96 rounded-xl border border-[#e7e7e7] shadow-sm animate-pulse"></div>
              ))
            ) : featuredHotels.length === 0 ? (
               <div className="col-span-4 text-center py-10 text-gray-500">No deals available at the moment.</div>
            ) : (
                featuredHotels.map((hotel) => (
                    <Link key={hotel._id} to={`/hotels/${hotel._id}`} className="deal-card">
                        <div className="deal-card-img-wrap">
                        <img 
                            src={hotel.images && hotel.images[0] ? (hotel.images[0].startsWith('http') ? hotel.images[0] : `${BACKEND_URL}/${hotel.images[0]}`) : '/images/services-1.jpg'} 
                            alt={hotel.name} 
                        />
                        <span className="deal-tag">{getDynamicTag(hotel)}</span>
                        </div>
                        <div className="deal-card-body">
                        <div className="deal-rating">
                            <span className="deal-score">{hotel.rating || '4.0'}</span>
                            <span className="deal-score-label">Excellent</span>
                        </div>
                        <h4 className="deal-name">{hotel.name}</h4>
                        <p className="deal-location">📍 {hotel.city}</p>
                        <div className="deal-footer">
                            <div>
                            <span className="deal-price-label">From</span>
                            <span className="deal-price">₹{hotel.cheapestPrice?.toLocaleString()}</span>
                            <span className="deal-per-night">/night</span>
                            </div>
                            <span className="deal-book-btn">Book now</span>
                        </div>
                        </div>
                    </Link>
                ))
            )}
          </div>
        </div>
      </section>

      {/* Trust Bar */}
      <section className="trust-bar-section mb-[60px]">
        <div className="container-elite">
          <div className="trust-bar-grid" data-aos="fade-up">
            {[
              { icon: '🛡️', title: 'Free cancellation', text: 'On most properties with no hidden fees' },
              { icon: '🏨', title: 'Over 1.2M properties', text: 'Hotels, villas, resorts and more' },
              { icon: '⚡', title: 'Instant Confirmation', text: 'Book and your stay is guaranteed' },
              { icon: '💬', title: '24/7 Support', text: 'Always here when you need help' },
            ].map((item, idx) => (
              <div key={idx} className="trust-bar-item" data-aos="fade-up" data-aos-delay={idx * 80}>
                <span className="trust-icon">{item.icon}</span>
                <div>
                  <h5 className="trust-title">{item.title}</h5>
                  <p className="trust-text">{item.text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Newsletter Strip */}
      <section className="newsletter-section mb-[60px]">
        <div className="container-elite">
          <div className="newsletter-inner" data-aos="fade-up">
            <div className="newsletter-text">
              <h3>Get exclusive deals in your inbox</h3>
              <p>Join 1M+ travelers who already get the best hotel prices.</p>
            </div>
            <div className="newsletter-form">
              <input type="email" placeholder="Enter your email address" className="newsletter-input" />
              <button className="newsletter-btn">Subscribe</button>
            </div>
          </div>
        </div>
      </section>
    </>
  );
};

export default Home;

