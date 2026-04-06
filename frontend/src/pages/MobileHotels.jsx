import React, { useState, useEffect, useContext } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import API, { BACKEND_URL } from '../utils/api';
import { AuthContext } from '../context/AuthContext';
import './MobileHotels.css';

const MobileHotels = ({ onToggleMap }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { userInfo } = useContext(AuthContext);

  const [hotels, setHotels] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Add class for scoping global body styles if needed
    document.body.classList.add('mobile-app-active');
    return () => document.body.classList.remove('mobile-app-active');
  }, []);

  useEffect(() => {
    const fetchHotels = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams(location.search);
        // RETAIN 'type' parameter for "Browse by property" functionality
        // removed params.delete('type') bug
        const { data } = await API.get(`/hotels?${params.toString()}`);
        setHotels(data);
      } catch (err) {
        console.error('Failed to fetch hotels', err);
      } finally {
        setLoading(false);
      }
    };
    fetchHotels();
  }, [location.search]);

  return (
    <div className="mob-hotels-root">
      
      {/* ── TOP HEADER ── */}
      <header className="mob-hotels-header">
        <button className="mob-back" onClick={() => navigate(-1)}>
          <i className="fa fa-arrow-left"></i>
        </button>
        <div className="mob-header-titles">
          <h3>Search Results</h3>
          <span>{loading ? '...' : `${hotels.length} stays available`}</span>
        </div>
        <button className="mob-filter-btn">
          <i className="fa fa-filter"></i>
        </button>
      </header>

      {/* ── BODY (Scrollable List) ── */}
      <div className="mob-hotels-body">
        {loading ? (
          [1, 2, 3].map(i => <div key={i} className="mob-skeleton-card"></div>)
        ) : hotels.length === 0 ? (
          <div className="mob-empty">
            <h2>No hotels found</h2>
            <p>Try moving the map or changing your dates.</p>
          </div>
        ) : (
          <div className="mob-hotel-list">
            {hotels.map((hotel) => {
              const imgSrc = hotel.images?.[0]
                ? (hotel.images[0].startsWith('http') ? hotel.images[0] : `${BACKEND_URL}${hotel.images[0]}`)
                : 'https://images.unsplash.com/photo-1566073771259-6a8506099945?q=80&w=400';

              return (
                <div key={hotel._id} className="mob-hotel-list-card" onClick={() => navigate(`/hotels/${hotel._id}`)}>
                  <div className="mob-card-img-wrapper">
                    <img src={imgSrc} alt={hotel.name} />
                    <div className="mob-card-rating">
                      <i className="fa fa-star"></i> {hotel.rating || '4.5'}
                    </div>
                  </div>
                  <div className="mob-card-info">
                    <h4>{hotel.name}</h4>
                    <p className="mob-card-location">📍 {hotel.city || 'India'} <span style={{color:'#6b7280', fontSize:'11px'}}>{hotel.distance || '1.2 km from center'}</span></p>
                    
                    <div className="mob-card-amenities">
                      {hotel.amenities?.slice(0, 3).map((am, i) => (
                        <span key={i}>{am}</span>
                      ))}
                    </div>

                    <div className="mob-card-bottom">
                      <div className="mob-card-urgency">
                        {hotel.cheapestPrice < 4000 ? <label className="mob-tag-green">Value Deal</label> : null}
                      </div>
                      <div className="mob-card-price">
                        <span className="mob-price-old">₹{Math.round(hotel.cheapestPrice * 1.2).toLocaleString()}</span>
                        <div className="mob-price-new">
                          <strong>₹{hotel.cheapestPrice?.toLocaleString()}</strong>
                          <small>/night</small>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── MAP TOGGLE FAB ── */}
      <button className="mob-map-fab" 
        onClick={() => navigate('/hotels/map')}
        onTouchStart={() => navigate('/hotels/map')}
      >
        <i className="fa fa-map"></i> Map
      </button>

      {/* ── BOTTOM TAB BAR ── */}
      <nav className="mob-bottom-bar">
        <Link to="/" className={`mob-tab`}>
          <span className="mob-tab-icon">🏠</span>
          <span className="mob-tab-label">Home</span>
        </Link>
        <Link to="/" className="mob-tab">
          <span className="mob-tab-icon">🔍</span>
          <span className="mob-tab-label">Search</span>
        </Link>
        <Link to="/hotels" className={`mob-tab active`}>
          <span className="mob-tab-icon">🗺️</span>
          <span className="mob-tab-label">Hotels</span>
        </Link>
        <Link to={userInfo ? '/wishlist' : '/login'} className={`mob-tab`}>
          <span className="mob-tab-icon">❤️</span>
          <span className="mob-tab-label">Saved</span>
        </Link>
        <Link to={userInfo ? '/dashboard' : '/login'} className={`mob-tab`} onTouchStart={(e) => e.target.classList.add('active')}>
          <span className="mob-tab-icon">👤</span>
          <span className="mob-tab-label">Account</span>
        </Link>
      </nav>

    </div>
  );
};

export default MobileHotels;
