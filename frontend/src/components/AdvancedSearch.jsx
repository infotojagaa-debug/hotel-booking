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
    const dropdownRef = useRef(null);
    const datePickerContainerRef = useRef(null);
    const guestDropdownRef = useRef(null);

    const totalGuests = adults + children;

    // Load persisted search on mount if no initial props are provided
    useEffect(() => {
        const savedSearch = localStorage.getItem('elite_stays_search');
        if (savedSearch && !initialLocation) {
            try {
                const parsed = JSON.parse(savedSearch);
                if (parsed.location) setDestination(parsed.location);
                if (parsed.checkIn && parsed.checkOut) {
                    setDateRange([new Date(parsed.checkIn), new Date(parsed.checkOut)]);
                }
                if (parsed.adults) setAdults(parsed.adults);
                if (parsed.children) setChildren(parsed.children);
                if (parsed.rooms) setRooms(parsed.rooms);
                if (parsed.isPetFriendly !== undefined) setIsPetFriendly(parsed.isPetFriendly);
            } catch (err) {
                console.error("Failed to parse saved search", err);
            }
        }
    }, [initialLocation]);

    // Fetch real locations from backend + combine with curated list
    useEffect(() => {
        const fetchLocations = async () => {
            try {
                const { data } = await API.get('/hotels/districts');
                // Convert backend strings to structured objects
                const backendCities = data.cities.map(c => ({ name: c, type: 'City', state: 'Tamil Nadu' }));
                const backendDistricts = data.districts.map(d => ({ name: d, type: 'District', state: 'Tamil Nadu' }));
                const backendStates = data.states.map(s => ({ name: s, type: 'State', state: s }));

                const merged = [...INDIAN_LOCATIONS];
                
                // Add unique ones from backend
                [...backendCities, ...backendDistricts, ...backendStates].forEach(item => {
                    if (!merged.find(m => m.name.toLowerCase() === item.name.toLowerCase())) {
                        merged.push(item);
                    }
                });

                setAllLocations(merged);
            } catch (err) {
                console.error("Failed to fetch locations", err);
            }
        };
        fetchLocations();
    }, []);

    // Filter suggestions based on input (WITH 300ms DEBOUNCE)
    useEffect(() => {
        if (searchDebounce) clearTimeout(searchDebounce);
        
        const timeout = setTimeout(() => {
            if (!destination || destination.length < 1) {
                setFilteredResults([]);
                setActiveIndex(-1);
                return;
            }

            const query = destination.toLowerCase();
            const filtered = allLocations
                .filter(loc => 
                    loc.name.toLowerCase().includes(query) || 
                    loc.state.toLowerCase().includes(query)
                )
                .slice(0, 10); // Top 10 matches
            
            setFilteredResults(filtered);
            setActiveIndex(0); // Auto-focus first suggestion
        }, 300);

        setSearchDebounce(timeout);
        return () => clearTimeout(timeout);
    }, [destination, allLocations]);

    // Body Scroll Lock for Mobile
    useEffect(() => {
        if (isMobile && (showDropdown || showDatePicker || showGuestDropdown)) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => { document.body.style.overflow = 'unset'; };
    }, [isMobile, showDropdown, showDatePicker, showGuestDropdown]);

    // Handle clicking outside to close
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target) && 
                destinationRef.current && !destinationRef.current.contains(event.target)) {
                setShowDropdown(false);
            }
            if (datePickerContainerRef.current && !datePickerContainerRef.current.contains(event.target)) {
                setShowDatePicker(false);
            }
            if (guestDropdownRef.current && !guestDropdownRef.current.contains(event.target) &&
                guestsBoxRef.current && !guestsBoxRef.current.contains(event.target)) {
                setShowGuestDropdown(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);


    const { userInfo } = React.useContext(AuthContext);

    const handleSearch = (e) => {
        if (e) e.preventDefault();
        
        let finalLocation = destination ? destination.trim() : '';

        // Auto-select first suggestion if user hits search without picking one
        if (filteredResults.length > 0 && !allLocations.find(l => l.name.toLowerCase() === finalLocation.toLowerCase())) {
            finalLocation = filteredResults[0].name;
            setDestination(finalLocation);
        }

        const searchData = {
            location: finalLocation,
            checkIn: startDate ? format(startDate, 'yyyy-MM-dd') : null,
            checkOut: endDate ? format(endDate, 'yyyy-MM-dd') : null,
            adults,
            children,
            rooms,
            isPetFriendly,
            type: propertyType !== 'All' ? propertyType : null
        };

        // Persist for seamless flow
        localStorage.setItem('elite_stays_search', JSON.stringify(searchData));

        if (!userInfo) {
            // Save pending search for after login
            localStorage.setItem('pendingSearch', JSON.stringify(searchData));
            navigate(`/login?redirect=/hotels&msg=${encodeURIComponent('Please login to Elite Stays to continue booking')}`);
            return;
        }

        const searchParams = new URLSearchParams();
        Object.entries(searchData).forEach(([key, value]) => {
            if (value !== null && value !== undefined) searchParams.append(key, value);
        });

        navigate(`/hotels?${searchParams.toString()}`);
    };

    const triggerDatePicker = () => {
        setShowDatePicker(!showDatePicker);
    };

    const triggerFocus = (ref) => {
        if (ref.current) {
            ref.current.focus();
        }
    };


    const selectLocation = (loc) => {
        setDestination(loc.name);
        setShowDropdown(false);
        setShowMobSearchOverlay(false);
        setActiveIndex(-1);
    };

    const handleKeyDown = (e) => {
        if (!showDropdown || filteredResults.length === 0) return;

        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setActiveIndex(prev => (prev < filteredResults.length - 1 ? prev + 1 : prev));
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setActiveIndex(prev => (prev > 0 ? prev - 1 : prev));
        } else if (e.key === 'Enter') {
            if (activeIndex >= 0) {
                e.preventDefault();
                selectLocation(filteredResults[activeIndex]);
            }
        } else if (e.key === 'Escape') {
            setShowDropdown(false);
        }
    };

    const highlightMatch = (text, query) => {
        if (!query) return text;
        const parts = text.split(new RegExp(`(${query})`, 'gi'));
        return (
            <span>
                {parts.map((part, i) => 
                    part.toLowerCase() === query.toLowerCase() 
                        ? <b key={i} style={{ color: '#000' }}>{part}</b> 
                        : <span key={i}>{part}</span>
                )}
            </span>
        );
    };

    return (
        <form onSubmit={handleSearch} className={`search-bar-modern ${isCompact ? 'is-compact-mode' : ''} ${isMobile ? 'is-mobile-search' : ''}`}>
            {/* 0. Property Type Tabs (Mobile Only) */}
            {isMobile && (
                <div className="mob-property-tabs">
                    {['All', 'Hotel', 'Apartment', 'Villa'].map((type) => (
                        <button
                            key={type}
                            type="button"
                            className={`mob-prop-tab ${propertyType === type ? 'active' : ''}`}
                            onClick={() => setPropertyType(type)}
                            onTouchStart={() => setPropertyType(type)}
                        >
                            {type === 'All' ? 'All Stays' : `${type}s`}
                        </button>
                    ))}
                </div>
            )}

            <div className="search-pill-container">
                {/* 1. Destination Box */}
                <div 
                    className={`search-pill-item destination-pill ${showDropdown ? 'pill-active' : ''}`} 
                    onClick={() => triggerFocus(destinationRef)}
                    onTouchStart={() => triggerFocus(destinationRef)}
                >
                    <div className="pill-content">
                        <div className="pill-icon">
                            <i className="fa fa-map-marker-alt"></i>
                        </div>
                        <div className="pill-input-wrap">
                            <label className="pill-label">Location</label>
                            <input
                                ref={destinationRef}
                                type="text"
                                className="pill-input"
                                placeholder="Where to?"
                                value={destination}
                                onKeyDown={handleKeyDown}
                                onChange={(e) => {
                                    const val = e.target.value;
                                    const caret = e.target.selectionStart;
                                    setDestination(val);
                                    setShowDropdown(true);
                                    // Hack to prevent cursor jumping on async re-renders
                                    requestAnimationFrame(() => {
                                        if (destinationRef.current) {
                                            destinationRef.current.setSelectionRange(caret, caret);
                                        }
                                    });
                                }}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    if (isMobile) {
                                        setShowMobSearchOverlay(true);
                                    } else if (destination.length > 0) {
                                        setShowDropdown(true);
                                    }
                                }}
                                onTouchStart={(e) => {
                                    if (isMobile) {
                                        setShowMobSearchOverlay(true);
                                    } else if (destination.length > 0) {
                                        setShowDropdown(true);
                                    }
                                }}
                                autoComplete="off"
                                required
                            />
                        </div>
                        {destination && (
                            <button type="button" className="clear-loc-btn" onClick={(e) => { e.stopPropagation(); setDestination(''); }}>
                                <i className="fas fa-times-circle"></i>
                            </button>
                        )}
                        
                        {/* Multi-Level Location Dropdown (Desktop Only) */}
                        {!isMobile && showDropdown && (
                            <div className="search-dropdown modern-district-dropdown select-none" ref={dropdownRef}>
                                <div className="dropdown-list">
                                    {filteredResults.length > 0 ? (
                                        filteredResults.map((loc, index) => (
                                            <div 
                                                key={index} 
                                                className={`dropdown-item district-item ${activeIndex === index ? 'active-suggestion' : ''}`}
                                                onMouseEnter={() => setActiveIndex(index)}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    selectLocation(loc);
                                                }}
                                            >
                                                <div className="flex items-center gap-4 w-full text-left">
                                                    <i className={`fa ${loc.type === 'State' ? 'fa-globe-asia' : 'fa-map-marker-alt'} dropdown-icon`}></i>
                                                    <div className="loc-info flex-1">
                                                        <div className="flex items-center justify-between">
                                                            <span className="loc-name">{highlightMatch(loc.name, destination)}</span>
                                                            <span className={`type-tag tag-${loc.type.toLowerCase()}`}>
                                                                {loc.type}
                                                            </span>
                                                        </div>
                                                        {loc.type !== 'State' && (
                                                            <span className="loc-state-text">{loc.state}</span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="no-res-msg">
                                            <i className="fa fa-info-circle"></i>
                                            <p>No matching locations found. Try a different city.</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                <div className="search-pill-divider"></div>

                {/* 2. Check-in/out Unified Box */}
                <div className={`search-pill-item date-pill ${showDatePicker ? 'pill-active' : ''}`} ref={datePickerContainerRef} 
                    onClick={triggerDatePicker}
                    onTouchStart={triggerDatePicker}
                >
                    <div className="pill-content">
                        <div className="pill-icon">
                            <i className="fa fa-calendar-day"></i>
                        </div>
                        <div className="pill-input-wrap">
                            <label className="pill-label">Check-in / Out</label>
                            <div className="pill-display-text text-left">
                                {startDate && endDate 
                                    ? <span className="text-slate-900 font-bold">{format(startDate, 'd MMM')} — {format(endDate, 'd MMM')}</span>
                                    : <span className="text-slate-400">Add dates</span>}
                            </div>
                        </div>
                        <i className={`fa fa-chevron-down pill-chevron ${showDatePicker ? 'rotated' : ''}`}></i>
                    </div>

                    {/* Unified Date Range Picker Popover (Upward) */}
                    {showDatePicker && (
                        <>
                            {isMobile && <div className="search-mobile-backdrop" onClick={(e) => { e.stopPropagation(); setShowDatePicker(false); }}></div>}
                            <div className="custom-date-picker-popover solid-dropdown" onClick={(e) => e.stopPropagation()}>
                                <DatePicker
                                    selectsRange={true}
                                    startDate={startDate}
                                    endDate={endDate}
                                    onChange={(update) => {
                                        setDateRange(update);
                                        if (update[0] && update[1]) {
                                            setShowDatePicker(false);
                                        }
                                    }}
                                    monthsShown={1}
                                    minDate={new Date()}
                                    inline
                                    showPopperArrow={false}
                                    formatWeekDay={(nameOfDay) => nameOfDay.substring(0, 2)}
                                >
                                    <div className="datepicker-footer">
                                        <button type="button" className="quick-action-pill" onClick={() => setDateRange([new Date(), new Date(new Date().setDate(new Date().getDate() + 1))])}>
                                             Tonight
                                        </button>
                                        <button type="button" className="quick-action-pill" onClick={() => setDateRange([new Date(new Date().setDate(new Date().getDate() + 1)), new Date(new Date().setDate(new Date().getDate() + 2))])}>
                                             Tomorrow
                                        </button>
                                        <button type="button" className="quick-action-pill" onClick={() => {
                                            const today = new Date();
                                            const friday = new Date(today);
                                            friday.setDate(today.getDate() + ((5 - today.getDay() + 7) % 7));
                                            const sunday = new Date(friday);
                                            sunday.setDate(friday.getDate() + 2);
                                            setDateRange([friday, sunday]);
                                        }}>
                                             This weekend
                                        </button>
                                    </div>
                                </DatePicker>
                            </div>
                        </>
                    )}
                </div>

                <div className="search-pill-divider"></div>

                {/* 3. Guests Box */}
                <div className={`search-pill-item guests-pill ${showGuestDropdown ? 'pill-active' : ''}`} ref={guestsBoxRef} 
                    onClick={() => setShowGuestDropdown(!showGuestDropdown)}
                    onTouchStart={() => setShowGuestDropdown(!showGuestDropdown)}
                >
                    <div className="pill-content">
                        <div className="pill-icon">
                            <i className="fa fa-users"></i>
                        </div>
                        <div className="pill-input-wrap">
                            <label className="pill-label">Guests</label>
                            <div className="pill-display-text text-left">
                                <span className={totalGuests > 0 ? "text-slate-900 font-bold" : "text-slate-400"}>
                                    {totalGuests} Guests, {rooms} Rms
                                </span>
                            </div>
                        </div>
                        <i className={`fa fa-chevron-down pill-chevron ${showGuestDropdown ? 'rotated' : ''}`}></i>
                    </div>

                    {/* Custom Guest Dropdown - Positioned Right on Desktop */}
                    {showGuestDropdown && (
                        <>
                            {isMobile && <div className="search-mobile-backdrop" onClick={(e) => { e.stopPropagation(); setShowGuestDropdown(false); }}></div>}
                            <div className={`guest-dropdown-popover is-right-aligned solid-dropdown ${isMobile ? 'centered-mobile-dropdown' : ''}`} ref={guestDropdownRef} onClick={(e) => e.stopPropagation()}>
                                <div className="guest-dropdown-content">
                                    <div className="guest-row">
                                        <div className="guest-info">
                                            <span className="guest-label-main">Adults</span>
                                            <span className="guest-label-sub">Ages 13 or above</span>
                                        </div>
                                        <div className="guest-counter">
                                            <button type="button" className={`counter-btn ${adults <= 1 ? 'disabled' : ''}`} onClick={() => setAdults(Math.max(1, adults - 1))}>−</button>
                                            <div className="counter-val-box">{adults}</div>
                                            <button type="button" className="counter-btn" onClick={() => setAdults(adults + 1)}>+</button>
                                        </div>
                                    </div>
                                    <div className="guest-row">
                                        <div className="guest-info">
                                            <span className="guest-label-main">Children</span>
                                            <span className="guest-label-sub">Ages 2–12</span>
                                        </div>
                                        <div className="guest-counter">
                                            <button type="button" className={`counter-btn ${children <= 0 ? 'disabled' : ''}`} onClick={() => setChildren(Math.max(0, children - 1))}>−</button>
                                            <div className="counter-val-box">{children}</div>
                                            <button type="button" className="counter-btn" onClick={() => setChildren(children + 1)}>+</button>
                                        </div>
                                    </div>
                                    <div className="guest-row">
                                        <div className="guest-info">
                                            <span className="guest-label-main">Rooms</span>
                                            <span className="guest-label-sub">Required units</span>
                                        </div>
                                        <div className="guest-counter">
                                            <button type="button" className={`counter-btn ${rooms <= 1 ? 'disabled' : ''}`} onClick={() => setRooms(Math.max(1, rooms - 1))}>−</button>
                                            <div className="counter-val-box">{rooms}</div>
                                            <button type="button" className="counter-btn" onClick={() => setRooms(rooms + 1)}>+</button>
                                        </div>
                                    </div>

                                    {/* Pet Friendly - Image 2 Style Square Checkbox */}
                                    <div className="guest-row pet-row" onClick={() => setIsPetFriendly(!isPetFriendly)}>
                                        <div className="pet-info">
                                            <span className="guest-label-main">Pet-friendly</span>
                                            <span className="guest-label-sub">Only show stays that allow pets</span>
                                        </div>
                                        <div className="pet-checkbox-wrapper">
                                            <div className={`square-checkbox ${isPetFriendly ? 'active' : ''}`}>
                                                {isPetFriendly && <i className="fa fa-check"></i>}
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div className="guest-dropdown-footer">
                                        <button type="button" className="guest-reset-text" onClick={() => { setAdults(2); setChildren(0); setRooms(1); setIsPetFriendly(false); }}>RESET</button>
                                        <button type="button" className="guest-apply-btn-rect" onClick={() => setShowGuestDropdown(false)}>Apply</button>
                                    </div>
                                </div>
                            </div>
                        </>
                    )}
                </div>

                {/* Search Button */}
                <div className="search-pill-btn-wrap">
                    <button type="submit" className="search-btn-gradient" onTouchStart={(e) => e.target.classList.add('active')}>
                        <i className="fa fa-search"></i>
                        <span>Search</span>
                    </button>
                </div>
            </div>
            {/* 6. Modern Full-Screen Mobile Location Search Overlay */}
            {isMobile && showMobSearchOverlay && (
                <div className="mob-search-full-overlay">
                    <div className="mob-search-full-header">
                        <button type="button" className="mob-overlay-back-btn" onClick={() => setShowMobSearchOverlay(false)}>
                            <i className="fa fa-arrow-left"></i>
                        </button>
                        <div className="mob-active-input-wrap">
                            <i className="fa fa-search mob-search-input-icon"></i>
                            <input
                                autoFocus
                                type="text"
                                className="mob-active-search-input"
                                placeholder="Search City, District, or State..."
                                value={destination}
                                onChange={(e) => {
                                    setDestination(e.target.value);
                                }}
                            />
                            {destination && (
                                <button type="button" className="mob-overlay-clear-btn" onClick={() => setDestination('')}>
                                    <i className="fas fa-times-circle"></i>
                                </button>
                            )}
                        </div>
                    </div>

                    <div className="mob-search-full-body">
                        {destination.length === 0 && (
                            <div className="mob-popular-section">
                                <h4 className="mob-popular-title">Popular Destinations</h4>
                                <div className="mob-popular-grid">
                                    {['Chennai', 'Salem', 'Madurai', 'Coimbatore', 'Bengaluru'].map(city => (
                                        <div key={city} className="mob-pop-chip" onClick={() => { setDestination(city); }}>
                                            <i className="fa fa-map-marker-alt"></i>
                                            <span>{city}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div className="mob-full-results-list">
                            {filteredResults.length > 0 ? (
                                filteredResults.map((loc, index) => (
                                    <div 
                                        key={index} 
                                        className="mob-full-result-item"
                                        onClick={() => selectLocation(loc)}
                                    >
                                        <div className="mob-result-icon-box">
                                            <i className={`fa ${loc.type === 'State' ? 'fa-globe-asia' : 'fa-map-marker-alt'}`}></i>
                                        </div>
                                        <div className="mob-result-info">
                                            <div className="mob-result-main">
                                                <span className="mob-result-name">{highlightMatch(loc.name, destination)}</span>
                                                <span className={`mob-result-type ${loc.type.toLowerCase()}`}>{loc.type}</span>
                                            </div>
                                            {loc.type !== 'State' && <span className="mob-result-sub">{loc.state}</span>}
                                        </div>
                                        <i className="fa fa-chevron-right mob-result-arrow"></i>
                                    </div>
                                ))
                            ) : destination.length > 0 && (
                                <div className="mob-no-results">
                                    <i className="fa fa-map-marked-alt"></i>
                                    <p>We couldn't find matches for "{destination}"</p>
                                    <span>Check your spelling or try another city</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </form>
    );
};


export default AdvancedSearch;
