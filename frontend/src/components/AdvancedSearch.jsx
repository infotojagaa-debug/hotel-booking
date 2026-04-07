import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import { AuthContext } from '../context/AuthContext';
import API from '../utils/api';
import { INDIAN_LOCATIONS } from '../utils/locations';

const AdvancedSearch = ({ 
    isCompact = false, 
    initialLocation = '',
    initialAdults = 2,
    initialChildren = 0,
    initialRooms = 1
}) => {

    const [destination, setDestination] = useState(initialLocation);
    const [dateRange, setDateRange] = useState([null, null]);
    const [startDate, endDate] = dateRange;
    const [adults, setAdults] = useState(initialAdults || 2);
    const [children, setChildren] = useState(initialChildren || 0);
    const [rooms, setRooms] = useState(initialRooms || 1);
    const [isPetFriendly, setIsPetFriendly] = useState(false);
    const [showDropdown, setShowDropdown] = useState(false);
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [showGuestDropdown, setShowGuestDropdown] = useState(false);
    const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
    const [allLocations, setAllLocations] = useState(INDIAN_LOCATIONS);
    const [propertyType, setPropertyType] = useState('All');
    const [showMobSearchOverlay, setShowMobSearchOverlay] = useState(false);
    const [searchDebounce, setSearchDebounce] = useState(null);

    // ELITE SEARCH HUB STATES
    const [isHubActive, setIsHubActive] = useState(false);
    const [hubMode, setHubMode] = useState('location'); // 'location', 'dates', 'guests'
    const [activeDateTab, setActiveDateTab] = useState('calendar'); 
    const [stayDuration, setStayDuration] = useState('week');
    const [selectedMonths, setSelectedMonths] = useState([]);

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth <= 768);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);
    const [filteredResults, setFilteredResults] = useState([]);
    const [activeIndex, setActiveIndex] = useState(-1);
    const navigate = useNavigate();

    const destinationRef = useRef(null);
    const guestsBoxRef = useRef(null);
    const datePickerContainerRef = useRef(null);
    const { userInfo } = React.useContext(AuthContext);

    const totalGuests = adults + children;

    // Filter Logic
    useEffect(() => {
        if (searchDebounce) clearTimeout(searchDebounce);
        const timeout = setTimeout(() => {
            if (!destination || destination.length < 1) {
                setFilteredResults([]);
                return;
            }
            const query = destination.toLowerCase();
            const filtered = allLocations
                .filter(loc => loc.name.toLowerCase().includes(query) || loc.state.toLowerCase().includes(query))
                .slice(0, 10);
            setFilteredResults(filtered);
        }, 300);
        setSearchDebounce(timeout);
        return () => clearTimeout(timeout);
    }, [destination, allLocations]);

    // Body Scroll Lock
    useEffect(() => {
        if (isMobile && (isHubActive || showMobSearchOverlay)) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => { document.body.style.overflow = 'unset'; };
    }, [isMobile, isHubActive, showMobSearchOverlay]);

    const handleSearch = (e) => {
        if (e) e.preventDefault();
        let finalLocation = destination ? destination.trim() : '';
        if (filteredResults.length > 0 && !allLocations.find(l => l.name.toLowerCase() === finalLocation.toLowerCase())) {
            finalLocation = filteredResults[0].name;
            setDestination(finalLocation);
        }
        const searchData = {
            location: finalLocation,
            checkIn: startDate ? format(startDate, 'yyyy-MM-dd') : null,
            checkOut: endDate ? format(endDate, 'yyyy-MM-dd') : null,
            adults, children, rooms, isPetFriendly,
            type: propertyType !== 'All' ? propertyType : null
        };
        localStorage.setItem('elite_stays_search', JSON.stringify(searchData));
        if (!userInfo) {
            localStorage.setItem('pendingSearch', JSON.stringify(searchData));
            navigate(`/login?redirect=/hotels&msg=${encodeURIComponent('Please login to continue')}`);
            return;
        }
        const searchParams = new URLSearchParams();
        Object.entries(searchData).forEach(([key, value]) => { if (value) searchParams.append(key, value); });
        navigate(`/hotels?${searchParams.toString()}`);
    };

    const selectLocation = (loc) => {
        setDestination(loc.name);
        setShowMobSearchOverlay(false);
        if (isMobile) {
            setIsHubActive(true);
            setHubMode('dates');
        }
    };

    // PIXEL-PERFECT ELITE SEARCH HUB (MOBILE)
    if (isMobile && isHubActive) {
        return (
            <div className="mob-search-hub-overlay animate-in fade-in duration-300">
                {/* Header Section */}
                <div className="mob-search-hub-header">
                    <button type="button" className="mob-hub-back-btn" onClick={() => setIsHubActive(false)}>
                        <i className="fa fa-arrow-left"></i>
                    </button>
                    <span className="mob-hub-title">Search Stays</span>
                </div>

                {/* Property Tabs */}
                <div className="mob-prop-tabs-scroller">
                    {['All Stays', 'Hotels', 'Apartments', 'Villas'].map(type => (
                        <button 
                            key={type} 
                            type="button" 
                            className={`mob-prop-pill ${propertyType === type.replace(' Stays', '').replace('s', '') || (type === 'All Stays' && propertyType === 'All') ? 'all-stays' : 'others'}`}
                            onClick={() => setPropertyType(type === 'All Stays' ? 'All' : type.replace('s', ''))}
                        >
                            {type}
                        </button>
                    ))}
                </div>

                <div className="mob-selection-card-full">
                    {hubMode === 'dates' ? (
                        <div className="mob-hub-selection-card">
                            <div className="mob-card-head-row">
                                <span className="mob-card-head-title">Select dates</span>
                                <i className="fa fa-times mob-hub-card-close" onClick={() => setHubMode('guests')}></i>
                            </div>

                            <div className="mob-search-hub-tabs">
                                <div className={`mob-search-tab ${activeDateTab === 'calendar' ? 'active' : ''}`} onClick={() => setActiveDateTab('calendar')}>Calendar</div>
                                <div className={`mob-search-tab ${activeDateTab === 'flexible' ? 'active' : ''}`} onClick={() => setActiveDateTab('flexible')}>I'm flexible</div>
                            </div>

                            {activeDateTab === 'calendar' && (
                                <div className="mob-week-header">
                                    {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(day => <div key={day} className="mob-week-day">{day}</div>)}
                                </div>
                            )}

                            <div className="mob-overlay-scroll-body px-2">
                                {activeDateTab === 'calendar' ? (
                                        <DatePicker
                                            selectsRange 
                                            startDate={startDate} 
                                            endDate={endDate}
                                        onChange={(update) => setDateRange(update)}
                                        monthsShown={6} minDate={new Date()} inline
                                        calendarClassName="mob-premium-calendar"
                                    />
                                ) : (
                                    <div className="mob-flexible-section">
                                        <h3 className="mob-flex-question text-left">How long do you want to stay?</h3>
                                        <div className="mob-stay-options">
                                            {['A weekend', 'A week', 'A month', 'Other'].map(opt => (
                                                <div key={opt} className={`mob-stay-radio ${stayDuration === opt.toLowerCase().replace(' ', '') ? 'active' : ''}`} onClick={() => setStayDuration(opt.toLowerCase().replace(' ', ''))}>
                                                    <div className="mob-radio-circle"><div className="mob-radio-dot"></div></div>
                                                    <span>{opt}</span>
                                                </div>
                                            ))}
                                        </div>
                                        <h3 className="mob-flex-question text-left">When do you want to go?</h3>
                                        <div className="mob-month-scroller">
                                            {['Apr', 'May', 'Jun', 'Jul', 'Aug'].map(m => (
                                                <div key={m} className={`mob-month-card ${selectedMonths.includes(m) ? 'active' : ''}`} onClick={() => setSelectedMonths(prev => prev.includes(m) ? prev.filter(x => x !== m) : [...prev, m])}>
                                                    <i className="fa fa-calendar-alt"></i>
                                                    <span className="mob-month-text">{m}</span>
                                                    <span className="text-[10px] text-slate-400 font-bold">2026</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    ) : (
                        /* GUEST SELECTION HUB */
                        <div className="mob-hub-selection-card">
                            <div className="mob-card-head-row">
                                <span className="mob-card-head-title">Select guests</span>
                                <i className="fa fa-times mob-hub-card-close" onClick={() => setHubMode('dates')}></i>
                            </div>

                            <div className="mob-overlay-scroll-body">
                                {[
                                    { label: 'Adults', val: adults, set: setAdults, min: 1 },
                                    { label: 'Children', val: children, set: setChildren, min: 0 },
                                    { label: 'Rooms', val: rooms, set: setRooms, min: 1 }
                                ].map(item => (
                                    <div key={item.label} className="mob-guest-item-card">
                                        <span className="font-extrabold text-lg text-slate-900">{item.label}</span>
                                        <div className="mob-counter-box">
                                            <button type="button" className="mob-counter-btn" onClick={() => item.set(Math.max(item.min, item.val - 1))} disabled={item.val <= item.min}>−</button>
                                            <span className="mob-counter-value">{item.val}</span>
                                            <button type="button" className="mob-counter-btn" onClick={() => item.set(item.val + 1)}>+</button>
                                        </div>
                                    </div>
                                ))}

                                <div className="mob-pet-toggle-row">
                                    <span className="mob-pet-label-main">Traveling with pets?</span>
                                    <label className="mob-switch">
                                        <input type="checkbox" checked={isPetFriendly} onChange={() => setIsPetFriendly(!isPetFriendly)} />
                                        <span className="mob-slider"></span>
                                    </label>
                                </div>
                                <div className="mob-assistance-note text-left">
                                    Assistance animals aren't considered pets. <a href="#" className="mob-help-link">Read more about traveling with assistance animals</a>
                                </div>

                                {/* Popular Search Tags (Per Template 2) */}
                                <div className="mob-pop-searches-section">
                                    <div className="mob-pop-head-text text-left">Popular Searches</div>
                                    <div className="mob-pop-chip-row">
                                        {['Chennai', 'Goa', 'Ooty', 'Bangalore', 'Coorg', 'Pondicherry'].map(city => (
                                            <div key={city} className="mob-pop-chip-btn" onClick={() => { 
                                                setDestination(city); 
                                                setHubMode('dates'); 
                                            }}>
                                                <i className="fa fa-map-marker-alt"></i>
                                                <span>{city}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                <div className="mob-hub-footer-fixed">
                    <button 
                        type="button" 
                        className={`mob-hub-done-btn ${(hubMode === 'dates' && (!startDate || !endDate)) ? 'opacity-50' : ''}`} 
                        onClick={() => {
                            if (hubMode === 'dates') {
                                if (startDate && endDate) setHubMode('guests');
                            } else {
                                handleSearch();
                            }
                        }}
                        disabled={hubMode === 'dates' && activeDateTab === 'calendar' && (!startDate || !endDate)}
                    >
                        {hubMode === 'dates' ? 'Next' : 'Search'}
                    </button>
                </div>
            </div>
        );
    }

    return (
        <form onSubmit={handleSearch} className={`search-bar-modern ${isCompact ? 'is-compact-mode' : ''} ${isMobile ? 'is-mobile-search' : ''}`}>
            <div className="search-pill-container">
                {/* Destination Dropdown */}
                <div className="search-pill-item destination-pill" onClick={() => isMobile ? setShowMobSearchOverlay(true) : setShowDropdown(!showDropdown)}>
                    <div className="pill-content">
                        <div className="pill-icon"><i className="fa fa-map-marker-alt"></i></div>
                        <div className="pill-input-wrap">
                            <label className="pill-label">Location</label>
                            <input ref={destinationRef} type="text" className="pill-input" placeholder="Where to?" value={destination} onChange={(e) => { setDestination(e.target.value); setShowDropdown(true); }} autoComplete="off" required />
                        </div>
                    </div>
                </div>
                
                {/* Date Selection */}
                <div className="search-pill-item date-pill" onClick={() => isMobile ? setIsHubActive(true) || setHubMode('dates') : setShowDatePicker(!showDatePicker)}>
                    <div className="pill-content">
                        <div className="pill-icon"><i className="fa fa-calendar-day"></i></div>
                        <div className="pill-input-wrap">
                            <label className="pill-label">Dates</label>
                            <div className="pill-display-text text-left">
                                {startDate && endDate ? `${format(startDate, 'd MMM')} — ${format(endDate, 'd MMM')}` : "Add dates"}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Guest Selection */}
                <div className="search-pill-item guests-pill" onClick={() => isMobile ? setIsHubActive(true) || setHubMode('guests') : setShowGuestDropdown(!showGuestDropdown)}>
                    <div className="pill-content">
                        <div className="pill-icon"><i className="fa fa-users"></i></div>
                        <div className="pill-input-wrap">
                            <label className="pill-label">Guests</label>
                            <div className="pill-display-text text-left">{totalGuests} Guests, {rooms} Rms</div>
                        </div>
                    </div>
                </div>

                <div className="search-pill-btn-wrap">
                    <button type="submit" className="search-btn-gradient">
                        <i className="fa fa-search"></i>
                        <span>Search</span>
                    </button>
                </div>
            </div>

            {/* Mobile Location Overlay */}
            {isMobile && showMobSearchOverlay && (
                <div className="mob-search-full-overlay">
                    <div className="mob-search-full-header">
                        <button type="button" className="mob-overlay-back-btn" onClick={() => setShowMobSearchOverlay(false)}><i className="fa fa-arrow-left"></i></button>
                        <div className="mob-active-input-wrap">
                            <input autoFocus type="text" className="mob-active-search-input" placeholder="Where are you going?" value={destination} onChange={(e) => setDestination(e.target.value)} />
                        </div>
                    </div>
                    <div className="mob-search-full-body">
                        {filteredResults.map(loc => (
                            <div key={loc.name} className="mob-full-result-item" onClick={() => selectLocation(loc)}>
                                <i className="fa fa-map-marker-alt mob-result-icon"></i>
                                <div className="mob-result-info">
                                    <span className="mob-result-name">{loc.name}</span>
                                    <span className="mob-result-sub">{loc.state}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </form>
    );
};

export default AdvancedSearch;
