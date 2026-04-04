import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { format } from 'date-fns';
import DatePicker from 'react-datepicker';
import { FaSearch, FaCalendarAlt, FaUsers, FaMapMarkerAlt } from 'react-icons/fa';

const TrivagoSearchHeader = ({ initialLocation = '' }) => {
    const navigate = useNavigate();
    const location = useLocation();
    
    // State synced with global location/params
    const params = new URLSearchParams(location.search);
    const [destination, setDestination] = useState(initialLocation || params.get('location') || '');
    const [dateRange, setDateRange] = useState([null, null]);
    const [startDate, endDate] = dateRange;
    const [showDatePicker, setShowDatePicker] = useState(false);
    
    const handleSearch = (e) => {
        if (e) e.preventDefault();
        const searchParams = new URLSearchParams(location.search);
        searchParams.set('location', destination);
        if (startDate) searchParams.set('checkIn', format(startDate, 'yyyy-MM-dd'));
        if (endDate) searchParams.set('checkOut', format(endDate, 'yyyy-MM-dd'));
        navigate(`/rooms?${searchParams.toString()}`);
    };

    return (
        <header className="sticky top-0 z-50 bg-[#007faf] shadow-lg py-2 px-4 transition-all border-b border-white/10">
            <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-stretch gap-2">
                
                {/* Destination Input */}
                <div className="flex-1 bg-white rounded flex items-center px-4 h-12 shadow-inner focus-within:ring-2 focus-within:ring-white">
                    <FaMapMarkerAlt className="text-gray-400 mr-3" />
                    <input 
                        type="text" 
                        placeholder="E.g. Chennai"
                        value={destination}
                        onChange={(e) => setDestination(e.target.value)}
                        className="w-full bg-transparent outline-none text-sm font-bold text-gray-800"
                    />
                </div>

                {/* Date Picker Trigger */}
                <div 
                    className="flex-1 bg-white rounded flex items-center px-4 h-12 shadow-inner cursor-pointer relative"
                    onClick={() => setShowDatePicker(!showDatePicker)}
                >
                    <FaCalendarAlt className="text-gray-400 mr-3" />
                    <div className="text-sm font-bold text-gray-800">
                        {startDate && endDate 
                            ? `${format(startDate, 'MMM d')} - ${format(endDate, 'MMM d')}` 
                            : 'Select Dates'}
                    </div>
                    {showDatePicker && (
                        <div className="absolute top-full left-0 mt-2 z-[60] shadow-2xl rounded-md overflow-hidden bg-white border border-gray-100" onClick={(e) => e.stopPropagation()}>
                            <DatePicker
                                selectsRange={true}
                                startDate={startDate}
                                endDate={endDate}
                                onChange={(update) => setDateRange(update)}
                                inline
                                minDate={new Date()}
                            />
                        </div>
                    )}
                </div>

                {/* Guests/Rooms (Simple version for header) */}
                <div className="flex-1 bg-white rounded flex items-center px-4 h-12 shadow-inner">
                    <FaUsers className="text-gray-400 mr-3" />
                    <div className="text-sm font-bold text-gray-800">1 Room, 2 Guests</div>
                </div>

                {/* Search Button */}
                <button 
                    onClick={handleSearch}
                    className="bg-[#002f5a] hover:bg-[#003d75] text-white px-10 rounded font-bold transition-colors h-12 flex items-center justify-center gap-2 active:scale-95"
                >
                    <FaSearch className="text-xs" />
                    Search
                </button>
            </div>
        </header>
    );
};

export default TrivagoSearchHeader;
