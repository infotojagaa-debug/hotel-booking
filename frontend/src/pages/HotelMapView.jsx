import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents, ZoomControl
} from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  FaChevronLeft, FaMapMarkerAlt, FaList, FaLayerGroup,
  FaExternalLinkAlt, FaStar, FaFilter
} from 'react-icons/fa';
import { MdOutlineMyLocation } from 'react-icons/md';
import API, { BACKEND_URL } from '../utils/api';
import MobileHotels from './MobileHotels';
import './HotelMapView.css';

// --- UTILS ---
const isValidCoords = (lat, lng) => {
  const latNum = parseFloat(lat);
  const lngNum = parseFloat(lng);
  return !isNaN(latNum) && !isNaN(lngNum) && isFinite(latNum) && isFinite(lngNum) && 
         (Math.abs(latNum) > 0.01 || Math.abs(lngNum) > 0.01);
};

// ─── Map Fit Bounds Controller ────────────────────────────────────────────────
const MapFitBounds = ({ hotels, forceCenter }) => {
  const map = useMap();
  const lastFlyTo = useRef(null);

  useEffect(() => {
    if (forceCenter && isValidCoords(forceCenter.lat, forceCenter.lng)) {
      const lat = Number(forceCenter.lat);
      const lng = Number(forceCenter.lng);
      
      // Prevent loop/redundant flyTo
      if (lastFlyTo.current && lastFlyTo.current.lat === lat && lastFlyTo.current.lng === lng) {
        return;
      }

      try {
        lastFlyTo.current = { lat, lng };
        map.flyTo([lat, lng], 15, { duration: 1.0, easeLinearity: 0.3 });
      } catch (err) {
        console.warn('Map flyTo skipped:', err.message);
      }
    }
  }, [forceCenter, map]);

  useEffect(() => {
    if (!forceCenter && hotels.length > 0) {
      const valid = hotels.filter(h => isValidCoords(h.latitude, h.longitude));
      if (valid.length === 0) return;
      
      try {
        if (valid.length === 1) {
          map.setView([valid[0].latitude, valid[0].longitude], 14);
          return;
        }
        const bounds = L.latLngBounds(valid.map(h => [h.latitude, h.longitude]));
        map.fitBounds(bounds, { padding: [50, 50], maxZoom: 14 });
      } catch (err) {
        console.warn('Map fitBounds/setView skipped:', err.message);
      }
    }
  }, [hotels, map, forceCenter]);

  return null;
};

// ─── Selected Marker Popup Controller ────────────────────────────────────────
const SelectedMarkerPopup = ({ selectedId }) => {
  const map = useMap();

  useEffect(() => {
    if (selectedId) {
      setTimeout(() => {
        map.eachLayer((layer) => {
          if (layer.options && layer.options.hotelId === selectedId) {
            layer.openPopup();
          }
        });
      }, 500); // Allow flyTo to stabilize
    }
  }, [selectedId, map]);

  return null;
};

// ─── Map Move Listener (updates visible hotels) ───────────────────────────────
const MapMoveListener = ({ hotels, onVisibleChange }) => {
  const map = useMap();
  const update = useCallback(() => {
    const bounds = map.getBounds();
    const visible = hotels.filter(h =>
      typeof h.latitude === 'number' && typeof h.longitude === 'number' && bounds.contains([h.latitude, h.longitude])
    );
    onVisibleChange(visible);
  }, [map, hotels, onVisibleChange]);

  useMapEvents({ 
    moveend: update, 
    zoomend: update 
  });

  // Removed redundant useEffect update() which was causing Error 185 (Loop)
  // Leaflet already fires moveend on initial render.

  return null;
};

// ─── Skeleton Card ────────────────────────────────────────────────────────────
const SkeletonCard = () => (
  <div className="hmv-loading-skeleton">
    <div className="hmv-skeleton-img" />
    <div className="hmv-skeleton-body">
      <div className="hmv-skeleton-line" style={{ height: 16, width: '70%' }} />
      <div className="hmv-skeleton-line" style={{ height: 12, width: '45%' }} />
      <div className="hmv-skeleton-line" style={{ height: 12, width: '55%' }} />
      <div className="hmv-skeleton-line" style={{ height: 20, width: '35%', alignSelf: 'flex-end', marginTop: 4 }} />
    </div>
  </div>
);

// ─── Hotel List Card ──────────────────────────────────────────────────────────
const HotelListCard = ({ hotel, isActive, onClick, onMouseEnter, onMouseLeave }) => {
  const navigate = useNavigate();
  const imgSrc = hotel.images?.[0]
    ? (hotel.images[0].startsWith('http') ? hotel.images[0] : `${BACKEND_URL}${hotel.images[0]}`)
    : 'https://images.unsplash.com/photo-1566073771259-6a8506099945?q=80&w=400';

  return (
    <div
      id={`hmv-card-${hotel._id}`}
      className={`hmv-hotel-card ${isActive ? 'active' : ''}`}
      onClick={() => onClick(hotel)}
      onMouseEnter={() => onMouseEnter(hotel._id)}
      onMouseLeave={() => onMouseLeave(null)}
    >
      <div className="hmv-card-img-wrap">
        <img src={imgSrc} alt={hotel.name} loading="lazy" />
        <div className="hmv-card-badge">Deal</div>
      </div>

      <div className="hmv-card-body">
        <div>
          <div className="hmv-card-name">{hotel.name}</div>
          <div className="hmv-card-location">
            <FaMapMarkerAlt size={9} />
            {hotel.city || 'India'}
          </div>
          {hotel.amenities?.length > 0 && (
            <div className="hmv-card-amenities">
              {hotel.amenities.slice(0, 2).map((a, i) => (
                <span key={i} className="hmv-card-amenity-pill">{a}</span>
              ))}
            </div>
          )}
        </div>

        <div className="hmv-card-footer">
          <div className="hmv-card-rating">
            <div className="hmv-rating-badge">{hotel.rating || '8.4'}</div>
            <span className="hmv-rating-label">
              {hotel.reviews?.length > 0 ? `${hotel.reviews.length} reviews` : 'Very Good'}
            </span>
          </div>
          <div className="hmv-card-price">
            <div className="hmv-card-price-original">
              ₹{Math.round((hotel.cheapestPrice || 0) * 1.25).toLocaleString('en-IN')}
            </div>
            <div className="hmv-card-price-main">
              ₹{(hotel.cheapestPrice || 0).toLocaleString('en-IN')}
            </div>
            <div className="hmv-card-price-night">/night</div>
          </div>
        </div>

        {isActive && (
          <button
            className="hmv-card-view-btn"
            onClick={(e) => { e.stopPropagation(); navigate(`/hotels/${hotel._id}`); }}
          >
            <FaExternalLinkAlt size={9} /> View Details
          </button>
        )}
      </div>
    </div>
  );
};

// ─── Popup Card (on marker click) ─────────────────────────────────────────────
const HotelPopupCard = ({ hotel, onNavigate }) => {
  const imgSrc = hotel.images?.[0]
    ? (hotel.images[0].startsWith('http') ? hotel.images[0] : `${BACKEND_URL}${hotel.images[0]}`)
    : 'https://images.unsplash.com/photo-1566073771259-6a8506099945?q=80&w=400';

  return (
    <div 
        className="map-elite-popup-card cursor-pointer group/popup"
        onClick={() => onNavigate(hotel._id)}
    >
        {/* Elite Image Header */}
        <div className="popup-premium-image h-[150px] overflow-hidden relative">
            <img 
                src={imgSrc}
                className="w-full h-full object-cover transition-transform duration-1000 group-hover/popup:scale-110"
                alt={hotel.name}
            />
            <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-md px-3 py-1 rounded-lg text-[10px] font-black text-slate-950 shadow-xl border border-white/20 uppercase">
                {hotel.type || 'Stay'}
            </div>
        </div>

        {/* Elite Popup Content (Matches Screenshot) */}
        <div className="p-6 bg-white flex flex-col gap-5">
            <div className="popup-main-meta">
                <h5 className="text-[24px] font-black text-slate-900 leading-[1.2] tracking-tight mb-2">
                    {hotel.name}
                </h5>
                <div className="flex items-center gap-2 text-[#6d5dfc] font-black text-[12px] uppercase tracking-widest">
                    <FaMapMarkerAlt size={12} />
                    {hotel.city || 'LOCATION'}
                </div>
            </div>

            <div className="h-[1px] w-full bg-slate-100" />

            <div className="flex items-end justify-between">
                <div className="flex flex-col">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Price From</span>
                    <span className="text-[26px] font-black text-slate-950 tracking-tighter leading-none">₹{hotel.cheapestPrice?.toLocaleString('en-IN')}</span>
                </div>
                <button 
                    onClick={(e) => {
                        e.stopPropagation();
                        onNavigate(hotel._id);
                    }}
                    className="bg-[#6d5dfc] hover:bg-indigo-700 text-white font-black text-[12px] px-6 py-3.5 rounded-xl shadow-[0_10px_25px_rgba(109,93,252,0.3)] border-b-2 border-indigo-800/20 active:scale-95 transition-all"
                >
                    View Rooms
                </button>
            </div>
        </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════
const HotelMapView = () => {
  const navigate = useNavigate();
  const routerLocation = useLocation();

  // ── State ──────────────────────────────────────────────────────────────────
  const [hotels, setHotels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState(null);
  const [hoveredId, setHoveredId] = useState(null);
  const [forceCenter, setForceCenter] = useState(null);
  const [visibleHotels, setVisibleHotels] = useState([]);
  const [listCollapsed, setListCollapsed] = useState(false);
  const [showPriceDropdown, setShowPriceDropdown] = useState(false);

  // Dates
  const today = new Date().toISOString().split('T')[0];
  const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];
  const [checkIn, setCheckIn] = useState(today);
  const [checkOut, setCheckOut] = useState(tomorrow);
  const [maxPrice, setMaxPrice] = useState(50000);
  const [appliedMaxPrice, setAppliedMaxPrice] = useState(50000);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  const listRef = useRef(null);
  const mapRef = useRef(null);
  const priceDropdownRef = useRef(null);

  useEffect(() => {
    const fn = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', fn);
    return () => window.removeEventListener('resize', fn);
  }, []);

  // ── Fetch Hotels ───────────────────────────────────────────────────────────
  useEffect(() => {
    const fetchHotels = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams(routerLocation.search);
        // 🔥 Ensure we show all property types (Villas, Apartments, etc.) on the map by default
        // If the user wants a broader view, we remove the strict 'type' filter coming from the list
        if (params.has('type')) {
           params.delete('type');
        }
        
        const { data } = await API.get(`/hotels?${params.toString()}`);
        setHotels(data);
      } catch (err) {
        console.error('Failed to fetch hotels', err);
      } finally {
        setLoading(false);
      }
    };
    fetchHotels();
  }, [routerLocation.search]);

  // ── Close price dropdown on outside click ─────────────────────────────────
  useEffect(() => {
    const handle = (e) => {
      if (priceDropdownRef.current && !priceDropdownRef.current.contains(e.target)) {
        setShowPriceDropdown(false);
      }
    };
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, []);

  // ── Filter hotels by price ─────────────────────────────────────────────────
  const displayedHotels = React.useMemo(() => 
    hotels.filter(h => (h.cheapestPrice || 0) <= appliedMaxPrice),
    [hotels, appliedMaxPrice]
  );

  // ── Handlers ───────────────────────────────────────────────────────────────
  const handleCardClick = useCallback((hotel) => {
    setSelectedId(hotel._id);
    setForceCenter({ lat: hotel.latitude, lng: hotel.longitude });
  }, []);

  const handleMarkerClick = useCallback((hotel) => {
    setSelectedId(hotel._id);
    setForceCenter({ lat: hotel.latitude, lng: hotel.longitude });
    // Scroll to card
    setTimeout(() => {
      const el = document.getElementById(`hmv-card-${hotel._id}`);
      if (el && listRef.current) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 100);
  }, []);

  const handlePopupNavigate = useCallback((hotelId) => {
    navigate(`/hotels/${hotelId}`);
  }, [navigate]);

  const handleFitAll = useCallback(() => {
    setForceCenter(null);
    setSelectedId(null);
    // Re-trigger fit by bumping hotels (trick: pass same array through)
    setHotels(prev => [...prev]);
  }, []);

  // Valid hotels (have lat/lng) — Relaxed to allow 0,0 but must be numbers
  const mappableHotels = React.useMemo(() => 
    displayedHotels.filter(h => 
      typeof h.latitude === 'number' && typeof h.longitude === 'number' && 
      (Math.abs(h.latitude) > 0.1 || Math.abs(h.longitude) > 0.1) // Exclude Null Island (0,0)
    ),
    [displayedHotels]
  );

  // ── Render ─────────────────────────────────────────────────────────────────
  const [showListOnMobile, setShowListOnMobile] = useState(!routerLocation.pathname.includes('map'));

  if (isMobile && showListOnMobile) {
    return <MobileHotels onToggleMap={() => setShowListOnMobile(false)} />;
  }

  return (
    <div className="hmv-root">

      {/* ═══ HEADER ═══════════════════════════════════════════════════════════ */}
      <header className="hmv-header">
        {/* Left */}
        <div className="hmv-header-left">
          <button className="hmv-back-btn" onClick={() => navigate(-1)} title="Go back">
            <FaChevronLeft size={15} />
          </button>
          <div>
            <div className="hmv-logo-text">Elite<span>Stays</span></div>
          </div>
          <div className="hmv-count-pill">
            <div className="hmv-count-dot" />
            {loading ? '...' : `${displayedHotels.length} hotels`}
          </div>
        </div>

        {/* Center — Date Pickers + Price Filter */}
        <div className="hmv-header-filters">
          {/* Check-in / Check-out */}
          <div className="hmv-date-group">
            <div className="hmv-date-input-wrap">
              <label htmlFor="hmv-checkin">Check-in</label>
              <input
                id="hmv-checkin"
                type="date"
                value={checkIn}
                min={today}
                onChange={e => setCheckIn(e.target.value)}
              />
            </div>
            <div className="hmv-date-divider" />
            <div className="hmv-date-input-wrap">
              <label htmlFor="hmv-checkout">Check-out</label>
              <input
                id="hmv-checkout"
                type="date"
                value={checkOut}
                min={checkIn || today}
                onChange={e => setCheckOut(e.target.value)}
              />
            </div>
          </div>

          {/* Price Filter (relative positioned for dropdown) */}
          <div style={{ position: 'relative' }} ref={priceDropdownRef}>
            <button
              className={`hmv-price-filter ${showPriceDropdown ? 'active' : ''}`}
              onClick={() => setShowPriceDropdown(v => !v)}
            >
              <FaFilter size={11} />
              Budget ≤ ₹{appliedMaxPrice.toLocaleString('en-IN')}
            </button>

            {showPriceDropdown && (
              <div className="hmv-price-dropdown">
                <h4>Max Price per Night</h4>
                <div className="hmv-price-range-display">
                  <span>₹0</span>
                  <span>₹{maxPrice.toLocaleString('en-IN')}</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={200000}
                  step={500}
                  value={maxPrice}
                  onChange={e => setMaxPrice(Number(e.target.value))}
                />
                <button
                  className="hmv-price-dropdown-apply"
                  onClick={() => { setAppliedMaxPrice(maxPrice); setShowPriceDropdown(false); }}
                >
                  Apply Filter
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Right — Toggle list */}
        <div className="hmv-header-right">
          <button
            className={`hmv-toggle-btn ${listCollapsed ? '' : 'active'}`}
            onClick={() => setListCollapsed(v => !v)}
          >
            <FaList size={12} />
            {listCollapsed ? 'Show List' : 'Hide List'}
          </button>
        </div>
      </header>

      {/* ═══ BODY ════════════════════════════════════════════════════════════ */}
      <div className="hmv-body">

        {/* ─── LEFT: Hotel List ─────────────────────────────────────────── */}
        <div className={`hmv-list-panel ${listCollapsed ? 'collapsed' : ''}`}>
          <div className="hmv-list-header">
            <div className="hmv-list-title">
              {loading ? 'Finding hotels...' : `${visibleHotels.length} hotels in view`}
            </div>
            <div className="hmv-list-subtitle">
              Move map to see hotels in that area
            </div>
          </div>

          <div className="hmv-list-scroll" ref={listRef}>
            {loading ? (
              Array(5).fill(0).map((_, i) => <SkeletonCard key={i} />)
            ) : displayedHotels.length === 0 ? (
              <div className="hmv-empty-state">
                <div className="hmv-empty-icon">🏨</div>
                <div className="hmv-empty-title">No hotels found</div>
                <div className="hmv-empty-text">
                  Try adjusting your price filter or go back to search.
                </div>
              </div>
            ) : (
              displayedHotels.map(hotel => (
                <HotelListCard
                  key={hotel._id}
                  hotel={hotel}
                  isActive={selectedId === hotel._id}
                  onClick={handleCardClick}
                  onMouseEnter={setHoveredId}
                  onMouseLeave={setHoveredId}
                />
              ))
            )}
          </div>

          <div className="hmv-map-notice">
            Showing <span>{visibleHotels.length}</span> of {displayedHotels.length} hotels on map
          </div>
        </div>

        {/* ─── RIGHT: Leaflet Map ───────────────────────────────────────── */}
        <div className="hmv-map-panel">
          <MapContainer
            center={[20.5937, 78.9629]} // India center
            zoom={5}
            zoomControl={false}
            className="hmv-map-container"
            ref={mapRef}
            tap={!L.Browser.mobile}
          >
            {/* Premium light tile */}
            <TileLayer
              attribution='&copy; <a href="https://carto.com/">CartoDB</a>'
              url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
              maxZoom={19}
            />

            <ZoomControl position="bottomright" />

            {/* Map controllers */}
            <MapFitBounds hotels={mappableHotels} forceCenter={forceCenter} />
            <MapMoveListener hotels={mappableHotels} onVisibleChange={setVisibleHotels} />
            <SelectedMarkerPopup selectedId={selectedId} hotels={mappableHotels} />

            {/* Markers */}
            {mappableHotels.map(hotel => (
              <Marker
                key={hotel._id}
                position={[hotel.latitude, hotel.longitude]}
                hotelId={hotel._id} // Custom option for SelectedMarkerPopup
                icon={createPriceMarker(
                  hotel.cheapestPrice,
                  selectedId === hotel._id,
                  hoveredId === hotel._id
                )}
                zIndexOffset={selectedId === hotel._id ? 1000 : 0}
                eventHandlers={{
                  click: () => handleMarkerClick(hotel),
                  mouseover: () => setHoveredId(hotel._id),
                  mouseout: () => setHoveredId(null),
                }}
              >
                <Popup className="hmv-popup-wrapper fs-marker-popup" minWidth={320} offset={[0, -10]}>
                  <HotelPopupCard hotel={hotel} onNavigate={handlePopupNavigate} />
                </Popup>
              </Marker>
            ))}
          </MapContainer>

          {/* Overlay map controls */}
          <div className="hmv-map-overlay-controls">
            <button
              className="hmv-map-ctrl-btn"
              onClick={handleFitAll}
              title="Fit all hotels"
            >
              <MdOutlineMyLocation size={18} />
            </button>
            <button
              className="hmv-map-ctrl-btn"
              onClick={isMobile ? () => setShowListOnMobile(true) : () => setListCollapsed(v => !v)}
              title="Toggle list"
            >
              <FaLayerGroup size={15} />
            </button>
          </div>

          {/* Visible count overlay */}
          {!loading && (
            <div className="hmv-visible-notice">
              📍 {visibleHotels.length} hotel{visibleHotels.length !== 1 ? 's' : ''} visible on map
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default HotelMapView;
