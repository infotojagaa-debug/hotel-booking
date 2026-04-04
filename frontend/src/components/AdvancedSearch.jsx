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
    const [allLocations, setAllLocations] = useState(INDIAN_LOCATIONS);
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

    // Filter suggestions based on input
    useEffect(() => {
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
    }, [destination, allLocations]);

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
            isPetFriendly
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
        <form onSubmit={handleSearch} className={`search-bar-wrapper ${isCompact ? 'is-compact' : ''}`}>
            <div className="search-boxes-container">
                {/* 1. Destination Box */}
                <div 
                    className={`search-box-item flex-1 destination-box ${showDropdown ? 'active-box' : ''}`} 
                    onClick={() => triggerFocus(destinationRef)}
                >
                    <div className="search-item-content">
                        {isCompact ? <i className="fas fa-search search-icon"></i> : <i className="fa fa-search search-icon"></i>}
                        <div className="input-box">
                            {!isCompact && <label>Destination</label>}
                            <input
                                ref={destinationRef}
                                type="text"
                                id="location-input-autocomplete"
                                placeholder={isCompact ? "Location" : "Search destinations (city, district, or state across India)"}
                                value={destination}
                                onKeyDown={handleKeyDown}
                                onChange={(e) => {
                                    setDestination(e.target.value);
                                    setShowDropdown(true);
                                }}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    if (destination.length > 0) setShowDropdown(true);
                                }}
                                autoComplete="off"
                                required
                            />
                        </div>
                        {isCompact && destination && (
                            <button type="button" className="clear-loc-btn" onClick={(e) => { e.stopPropagation(); setDestination(''); }}>
                                <i className="fas fa-times-circle"></i>
                            </button>
                        )}
                        
                        {/* Multi-Level Location Dropdown */}
                        {showDropdown && filteredResults.length > 0 && (
                            <div className="search-dropdown modern-district-dropdown select-none" ref={dropdownRef}>
                                <div className="dropdown-list">
                                    {filteredResults.map((loc, index) => (
                                        <div 
                                            key={index} 
                                            className={`dropdown-item district-item ${activeIndex === index ? 'active-suggestion' : ''}`}
                                            onMouseEnter={() => setActiveIndex(index)}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                selectLocation(loc);
                                            }}
                                        >
                                            <div className="flex items-center gap-4 w-full">
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
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* 2. Check-in/out Unified Box */}
                <div className={`search-box-item flex-1 unified-date-box ${showDatePicker ? 'active-box' : ''}`} ref={datePickerContainerRef} onClick={triggerDatePicker}>
                    <div className="search-item-content">
                        <i className={isCompact ? "fas fa-calendar-alt search-icon" : "fa fa-calendar search-icon"}></i>
                        <div className="input-box">
                            {!isCompact && <label>Check-in/out</label>}
                            <div className="date-display-text">
                                {startDate && endDate 
                                    ? `${format(startDate, 'd MMM')} - ${format(endDate, 'd MMM')}`
                                    : 'Select dates'}
                            </div>
                        </div>
                    </div>

                    {/* Unified Date Range Picker Popover (Upward) */}
                    {showDatePicker && (
                        <div className="custom-date-picker-popover" onClick={(e) => e.stopPropagation()}>
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
                                monthsShown={2}
                                minDate={new Date()}
                                inline
                                showPopperArrow={false}
                                formatWeekDay={(nameOfDay) => nameOfDay.substring(0, 2)}
                            >
                                <div className="datepicker-footer">
                                    <button type="button" className="quick-action-pill" onClick={() => setDateRange([new Date(), new Date(new Date().setDate(new Date().getDate() + 1))])}>
                                        <i className="fa fa-clock-o"></i> Tonight
                                    </button>
                                    <button type="button" className="quick-action-pill" onClick={() => setDateRange([new Date(new Date().setDate(new Date().getDate() + 1)), new Date(new Date().setDate(new Date().getDate() + 2))])}>
                                        <i className="fa fa-sun-o"></i> Tomorrow night
                                    </button>
                                    <button type="button" className="quick-action-pill" onClick={() => {
                                        const today = new Date();
                                        const friday = new Date(today);
                                        friday.setDate(today.getDate() + ((5 - today.getDay() + 7) % 7));
                                        const sunday = new Date(friday);
                                        sunday.setDate(friday.getDate() + 2);
                                        setDateRange([friday, sunday]);
                                    }}>
                                        <i className="fa fa-calendar-check-o"></i> This weekend
                                    </button>
                                    <button type="button" className="quick-action-pill" onClick={() => {
                                        const today = new Date();
                                        const fridayNext = new Date(today);
                                        fridayNext.setDate(today.getDate() + ((5 - today.getDay() + 14) % 14) || 14);
                                        if (fridayNext.getTime() <= today.getTime() + (7 * 24 * 60 * 60 * 1000)) {
                                            fridayNext.setDate(fridayNext.getDate() + 7);
                                        }
                                        const sundayNext = new Date(fridayNext);
                                        sundayNext.setDate(fridayNext.getDate() + 2);
                                        setDateRange([fridayNext, sundayNext]);
                                    }}>
                                        <i className="fa fa-calendar-plus-o"></i> Next weekend
                                    </button>
                                </div>
                            </DatePicker>
                        </div>
                    )}
                </div>

                {/* 3. Guests Box */}
                <div className={`search-box-item flex-1 unified-guests-box ${showGuestDropdown ? 'active-box' : ''}`} ref={guestsBoxRef} onClick={() => setShowGuestDropdown(!showGuestDropdown)}>
                    <div className="search-item-content">
                        <i className={isCompact ? "fas fa-users search-icon" : "fa fa-users search-icon"}></i>
                        <div className="input-box">
                            {!isCompact && <label>Guests and rooms</label>}
                            <div className="guest-display">
                                {adults + children} Guests, {rooms} Room
                            </div>
                        </div>
                    </div>

                    {/* Custom Guest Dropdown */}
                    {showGuestDropdown && (
                        <div className="guest-dropdown-popover" ref={guestDropdownRef} onClick={(e) => e.stopPropagation()}>
                            <div className="guest-dropdown-content">
                                <div className="guest-row">
                                    <span className="guest-label">Adults</span>
                                    <div className="guest-counter">
                                        <button type="button" className={`counter-btn ${adults <= 1 ? 'disabled' : ''}`} onClick={() => setAdults(Math.max(1, adults - 1))}>−</button>
                                        <span className="counter-val">{adults}</span>
                                        <button type="button" className="counter-btn" onClick={() => setAdults(adults + 1)}>+</button>
                                    </div>
                                </div>
                                <div className="guest-row">
                                    <span className="guest-label">Children</span>
                                    <div className="guest-counter">
                                        <button type="button" className={`counter-btn ${children <= 0 ? 'disabled' : ''}`} onClick={() => setChildren(Math.max(0, children - 1))}>−</button>
                                        <span className="counter-val">{children}</span>
                                        <button type="button" className="counter-btn" onClick={() => setChildren(children + 1)}>+</button>
                                    </div>
                                </div>
                                <div className="guest-row">
                                    <span className="guest-label">Rooms</span>
                                    <div className="guest-counter">
                                        <button type="button" className={`counter-btn ${rooms <= 1 ? 'disabled' : ''}`} onClick={() => setRooms(Math.max(1, rooms - 1))}>−</button>
                                        <span className="counter-val">{rooms}</span>
                                        <button type="button" className="counter-btn" onClick={() => setRooms(rooms + 1)}>+</button>
                                    </div>
                                </div>

                                <div className="guest-row pet-row" onClick={() => setIsPetFriendly(!isPetFriendly)}>
                                    <div className="pet-info">
                                        <span className="guest-label">Pet-friendly</span>
                                        <span className="pet-desc">Only show stays that allow pets</span>
                                    </div>
                                    <label className="custom-checkbox" onClick={(e) => e.stopPropagation()}>
                                        <input type="checkbox" checked={isPetFriendly} onChange={(e) => setIsPetFriendly(e.target.checked)} />
                                    </label>
                                </div>
                                
                                <div className="guest-dropdown-footer">
                                    <button type="button" className="guest-reset-btn" onClick={() => { setAdults(2); setChildren(0); setRooms(1); setIsPetFriendly(false); }}>Reset</button>
                                    <button type="button" className="guest-apply-btn" onClick={() => setShowGuestDropdown(false)}>Apply</button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Search Button */}
                <div className="search-btn-container-standalone">
                    <button type="submit" className="search-submit-btn-pill">
                        <i className={`fa fa-search ${isCompact ? 'mr-2' : ''}`}></i>
                        <span>Search</span>
                    </button>
                </div>
            </div>
        </form>
    );
};


export default AdvancedSearch;
