import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import API from '../utils/api';
import AdvancedSearch from '../components/AdvancedSearch';
import BookingFilterSidebar from '../components/BookingFilterSidebar';
import BookingHotelCard from '../components/BookingHotelCard';
import CustomerFullScreenMap from '../components/CustomerFullScreenMap';
import { FaChevronRight, FaFilter, FaTimes, FaSearch, FaFire, FaTag, FaClock } from 'react-icons/fa';
import './HotelSearchPage.css';

const FALLBACK_PROMO = {
  title: '🔥 Limited Time: Get 20% OFF on selected hotels',
  label: 'EXCLUSIVE DEAL',
};

const Rooms = () => {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [publicOffers, setPublicOffers] = useState([]);
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [viewMode, setViewMode] = useState('list');
  const [isSortOpen, setIsSortOpen] = useState(false);
  const [activeOffer, setActiveOffer] = useState(null);
  const [showFullMap, setShowFullMap] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  // Helper for human-readable sort labels
  const getSortLabel = (val) => {
    if (val === 'price-low') return 'Price: low to high';
    if (val === 'price-high') return 'Price: high to low';
    if (val === 'rating') return 'Top rated';
    return 'Our top picks';
  };

  // Get Search Params for AdvancedSearch
  const params = new URLSearchParams(location.search);
  const locationName = params.get('location') || '';
  const initialAdults = Number(params.get('adults')) || 2;
  const initialChildren = Number(params.get('children')) || 0;
  const initialRooms = Number(params.get('rooms')) || 1;

  const [filters, setFilters] = useState({
    type: [],
    amenities: [],
    minRating: 0,
    minPrice: 0,
    maxPrice: 500000,
    sort: 'top'
  });

  // Fetch public offers (no auth) alongside hotels
  useEffect(() => {
    API.get('/offers/public').then(res => setPublicOffers(res.data)).catch(() => {});
  }, []);

  // Sync filters & Active Offer from URL / Session
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    
    // Check state first, then localStorage
    const stateOffer = location.state?.appliedOffer;
    const savedOffer = localStorage.getItem('elite_stays_active_offer');
    
    if (stateOffer) {
      setActiveOffer(stateOffer);
    } else if (savedOffer) {
      setActiveOffer(JSON.parse(savedOffer));
    }

    setFilters(prev => ({
      ...prev,
      type: params.get('type') ? params.get('type').split(',') : [],
      amenities: params.get('amenities') ? params.get('amenities').split(',') : [],
      minRating: params.get('minRating') ? Number(params.get('minRating')) : 0,
      maxPrice: params.get('maxPrice') ? Number(params.get('maxPrice')) : 500000
    }));
  }, [location.search, location.state]);

  useEffect(() => {
    const fetchRooms = async () => {
      try {
        setLoading(true);
        const params = new URLSearchParams(location.search);
        
        // Sync filter state to query
        if (filters.type.length > 0) {
            params.set('type', filters.type.join(','));
        } else {
            // Allow the URL to provide the type if state is exactly '[]' (initial load)
            const urlType = new URLSearchParams(location.search).get('type');
            if (urlType) params.set('type', urlType);
        }
        
        if (filters.amenities.length > 0) params.set('amenities', filters.amenities.join(','));
        if (filters.minRating > 0) params.set('minRating', filters.minRating);
        params.set('maxPrice', filters.maxPrice);
        
        // Convert local sort keys to backend hotel sort keys
        let sortKey = 'top';
        if (filters.sort === 'price-low') sortKey = 'price_asc';
        if (filters.sort === 'price-high') sortKey = 'price_desc';
        if (filters.sort === 'rating') sortKey = 'rating_desc';
        params.set('sort', sortKey);

        const { data } = await API.get(`/hotels?${params.toString()}`);
        setRooms(data); // Using 'rooms' state to store 'hotels' for now to minimize refactoring
        setLoading(false);
      } catch (error) {
        console.error('Error fetching hotels', error);
        setLoading(false);
      }
    };
    fetchRooms();
  }, [location.search, filters.type, filters.amenities, filters.minRating, filters.maxPrice, filters.sort]);
  const handleFilterChange = (field, value) => {
    if (field === 'type' || field === 'amenities') {
        const currentList = filters[field];
        const newList = currentList.includes(value) 
            ? currentList.filter(t => t !== value)
            : [...currentList, value];
        setFilters(prev => ({ ...prev, [field]: newList }));
        return;
    }
    if (field === 'reset') {
        setFilters({ type: [], amenities: [], minRating: 0, minPrice: 0, maxPrice: 500000, sort: 'top' });
        setActiveOffer(null);
        localStorage.removeItem('elite_stays_active_offer');
        return;
    }
    setFilters(prev => ({ ...prev, [field]: value }));
  };

  const stats = {
    type: rooms.reduce((acc, room) => {
      // room is the hotel object
      const type = room.type || 'Hotel';
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {}),
    amenities: rooms.reduce((acc, room) => {
      const amenities = room.amenities || [];
      amenities.forEach(a => {
        acc[a] = (acc[a] || 0) + 1;
      });
      return acc;
    }, {})
  };

  return (
    <div className="search-page-container font-sans flex flex-col pt-24 pb-20">
      
      {/* 1. Modern Centered Search Bar Section */}
      <div className="search-results-header-wrap">
        <div className="max-w-[1350px] mx-auto px-5">
            <AdvancedSearch 
              isCompact={true} 
              initialLocation={locationName} 
              initialAdults={initialAdults}
              initialChildren={initialChildren}
              initialRooms={initialRooms}
            />
        </div>
      </div>

      <div className="search-results-wrapper">
        
        {/* 🔥 Promotion Banner Strip */}
        <div className={`listing-promo-strip ${activeOffer ? 'applied' : ''}`} data-aos="fade-down">
          <div className="listing-promo-strip-inner">
            <span className="listing-promo-fire">🔥</span>
            <div className="listing-promo-content">
              <span className="listing-promo-label">
                {activeOffer ? 'DISCOUNT APPLIED' : 'HOT DEALS'}
              </span>
              <span className="listing-promo-text">
                {activeOffer ? activeOffer.title : 'Offers available on selected hotels'}
              </span>
            </div>
            {activeOffer ? (
              <button
                className="listing-promo-cta secondary-cta"
                onClick={() => {
                  setActiveOffer(null);
                  localStorage.removeItem('elite_stays_active_offer');
                }}
              >
                Clear deal ×
              </button>
            ) : (
              <button
                className="listing-promo-cta"
                onClick={() => document.getElementById('hotel-results-anchor')?.scrollIntoView({ behavior: 'smooth' })}
              >
                Browse deals ↓
              </button>
            )}
          </div>
        </div>
        
        {/* 2. Enhanced Breadcrumbs (Template Style) */}
        <div className="flex items-center gap-1.5 text-[11px] md:text-[13px] text-[#6d5dfc] mb-6 overflow-x-auto whitespace-nowrap pb-2 no-scrollbar">
          <Link to="/" className="hover:underline">Home</Link>
          <span className="text-gray-400 mx-1 text-[9px] font-bold"><FaChevronRight className="scale-75" /></span>
          <span className="hover:underline cursor-pointer">India</span>
          <span className="text-gray-400 mx-1 text-[9px] font-bold"><FaChevronRight className="scale-75" /></span>
          <span className="hover:underline cursor-pointer">Tamil Nadu</span>
          {locationName && (
            <>
              <span className="text-gray-400 mx-1 text-[9px] font-bold"><FaChevronRight className="scale-75" /></span>
              <span className="hover:underline cursor-pointer">{locationName}</span>
            </>
          )}
          <span className="text-gray-400 mx-1 text-[9px] font-bold"><FaChevronRight className="scale-75" /></span>
          <span className="text-gray-900 font-medium">Search results</span>
        </div>

        {/* 3. Main Results Grid */}
        <div id="hotel-results-anchor" className="search-results-grid">
          
          {/* 3a. Sidebar Column (Filters) */}
          <aside className="hidden lg:block sticky-sidebar">
            <BookingFilterSidebar 
              filters={filters} 
              onFilterChange={handleFilterChange} 
              stats={stats} 
              onShowMap={() => setShowFullMap(true)}
            />
          </aside>

          {/* Mobile Filter Trigger */}
          <button 
            onClick={() => setShowMobileFilters(true)}
            className="lg:hidden w-full bg-white border border-[#e7e7e7] py-3 rounded-lg font-bold text-[#6d5dfc] mb-4 flex items-center justify-center gap-2 shadow-sm"
          >
            <FaFilter /> Filters
          </button>

          {/* 3b. Main Results Column */}
          <main className="results-column">
            
            {/* Results Title & Controls Header (New Template) */}
            <div className="flex flex-col md:flex-row md:items-start justify-between mb-2 gap-4">
              <div className="flex-1">
                <h2 className="text-[24px] font-bold text-[#1a1a1a] mb-4">
                  {locationName ? `${locationName}: ` : 'All stays: '} {rooms.length} properties found
                </h2>
                
                {/* Sort Dropdown */}
                <div className="relative inline-block">
                  <button 
                    onClick={() => setIsSortOpen(!isSortOpen)}
                    className="sort-pill-btn group"
                  >
                    <div className="flex items-center gap-2">
                      <div className="flex flex-col text-[10px] text-gray-500 group-hover:text-[#6d5dfc]">
                        <i className="fa fa-arrow-up -mb-1"></i>
                        <i className="fa fa-arrow-down"></i>
                      </div>
                      <span className="text-[14px]">Sort by: {getSortLabel(filters.sort)}</span>
                    </div>
                    <i className={`fa fa-chevron-down text-[10px] text-gray-400 transition-transform ${isSortOpen ? 'rotate-180' : ''}`}></i>
                  </button>

                  {isSortOpen && (
                    <div className="absolute left-0 mt-2 w-56 bg-white border border-[#e7e7e7] rounded-xl shadow-xl z-50 overflow-hidden py-1">
                      {[
                        { val: 'top', label: 'Our top picks' },
                        { val: 'price-low', label: 'Price: low to high' },
                        { val: 'price-high', label: 'Price: high to low' },
                        { val: 'rating', label: 'Top rated' }
                      ].map((opt) => (
                        <button
                          key={opt.val}
                          onClick={() => {
                            handleFilterChange('sort', opt.val);
                            setIsSortOpen(false);
                          }}
                          className={`w-full text-left px-4 py-2.5 text-[14px] hover:bg-[#f8f6ff] transition-colors ${filters.sort === opt.val ? 'text-[#6d5dfc] font-bold bg-[#f8f6ff]' : 'text-gray-700'}`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              
              <div className="flex items-center">
                {/* View Mode Dual-Pill Toggle */}
                <div className="view-toggle-pill-container">
                    <button 
                        onClick={() => setViewMode('list')}
                        className={`view-pill-segment ${viewMode === 'list' ? 'active' : ''}`}
                    >
                        List
                    </button>
                    <button 
                        onClick={() => setViewMode('grid')}
                        className={`view-pill-segment ${viewMode === 'grid' ? 'active' : ''}`}
                    >
                        Grid
                    </button>
                </div>
              </div>
            </div>

            {/* Results Area (Controlled by View Mode) */}
            <div className={`results-container ${viewMode === 'list' ? 'list-view' : 'grid-view'} pt-4`}>
              {loading ? (
                [1, 2, 3].map(i => (
                  <div key={i} className="bg-white h-64 rounded-xl border border-[#e7e7e7] shadow-sm animate-pulse flex overflow-hidden">
                    <div className="w-72 bg-gray-50 h-full"></div>
                    <div className="flex-1 p-8 space-y-4">
                      <div className="h-8 bg-gray-50 rounded-lg w-1/2"></div>
                      <div className="h-4 bg-gray-50 rounded-lg w-1/4"></div>
                      <div className="h-4 bg-gray-50 rounded-lg w-full mt-12"></div>
                      <div className="flex justify-between items-center pt-8">
                         <div className="h-10 bg-gray-50 rounded-lg w-32"></div>
                         <div className="h-12 bg-gray-50 rounded-lg w-40"></div>
                      </div>
                    </div>
                  </div>
                ))
              ) : rooms.length === 0 ? (
                <div className="empty-state-card" data-aos="zoom-in">
                  <div className="empty-state-icon-box">
                    <div className="main-search-icon">
                        <FaSearch />
                    </div>
                    <div className="cross-badge">
                        <FaTimes />
                    </div>
                  </div>
                  <h3 className="empty-state-title">
                     {locationName 
                       ? `No stays in ${locationName}` 
                       : filters.type.length > 1 
                         ? `No ${filters.type.join(' or ')}s available` 
                         : filters.type.length === 1
                           ? `No ${filters.type[0]}s available`
                           : 'No properties found'}
                  </h3>
                  <p className="empty-state-text">
                    {locationName 
                      ? `We couldn't find any properties in ${locationName} matching your current filters. Try relaxing your search criteria.` 
                      : "We couldn't find any properties matching those specific filters. Try clearing them to see all available stays."}
                  </p>
                  <div className="empty-state-actions">
                    <button 
                        onClick={() => handleFilterChange('reset')}
                        className="btn-reset-filters"
                    >
                        Reset all filters
                    </button>
                    <Link to="/" className="btn-back-home">
                        Back to homepage
                    </Link>
                  </div>
                </div>
              ) : (
                rooms.map((hotel) => {
                  const hotelOffer = publicOffers.find(o => !o.hotel || o.hotel === hotel._id || o.hotel._id === hotel._id);
                  return (
                    <BookingHotelCard 
                        key={hotel._id}
                        hotel={hotel}
                        offer={hotelOffer}
                    />
                  );
                })
              )}
            </div>
          </main>
        </div>
      </div>

      {/* 5. Mobile Filters Drawer */}
      {showMobileFilters && (
        <div className="filter-drawer-overlay" onClick={() => setShowMobileFilters(false)}>
            <div className="filter-drawer-content" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-black text-gray-900">Filters</h3>
                    <button 
                        onClick={() => setShowMobileFilters(false)}
                        className="w-10 h-10 bg-gray-50 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-900 transition-colors"
                    >
                        <FaTimes />
                    </button>
                </div>
                <BookingFilterSidebar 
                  filters={filters} 
                  onFilterChange={handleFilterChange} 
                  stats={stats} 
                  onShowMap={() => {
                    setShowMobileFilters(false);
                    setShowFullMap(true);
                  }}
                />
                <button 
                    onClick={() => setShowMobileFilters(false)}
                    className="w-full bg-blue-600 text-white font-bold py-4 rounded-xl mt-8 shadow-lg shadow-blue-100"
                >
                    Show {rooms.length} Results
                </button>
            </div>
        </div>
      )}

      {/* 7. Floating Mobile Toggle: Map / Filters */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[400] lg:hidden flex gap-3">
        <button 
          onClick={() => setShowFullMap(true)}
          className="bg-gray-900 text-white px-6 py-3 rounded-full font-bold shadow-2xl flex items-center gap-2 border border-white/20 active:scale-95 transition-transform"
        >
          <i className="fas fa-map-marker-alt"></i> Map
        </button>
        <button 
          onClick={() => setShowMobileFilters(true)}
          className="bg-white text-gray-900 px-6 py-3 rounded-full font-bold shadow-2xl flex items-center gap-2 border border-gray-200 active:scale-95 transition-transform"
        >
          <FaFilter /> Filters
        </button>
      </div>
    </div>
  );
};

export default Rooms;
