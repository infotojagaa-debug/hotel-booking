import React, { useState } from 'react';
import { FaBed, FaPlane, FaCar, FaIcons, FaTaxi, FaSearch, FaUser, FaRegCalendarAlt, FaTimes } from 'react-icons/fa';
import { useNavigate, Link } from 'react-router-dom';

const BookingSearchHeader = ({ initialLocation = '' }) => {
    const navigate = useNavigate();
    const [destination, setDestination] = useState(initialLocation);

    const handleSearch = (e) => {
        if (e) e.preventDefault();
        navigate(`/rooms?location=${destination}`);
    };

    return (
        <div className="w-full py-4 px-4 relative z-40">
            {/* Premium Search Bar Section */}
            <div className="search-header-premium">
                <div className="flex flex-col md:flex-row items-stretch divide-y md:divide-y-0 md:divide-x divide-gray-100">
                    
                    {/* Location */}
                    <div className="flex-1 flex items-center bg-white px-4 h-14 transition-colors hover:bg-gray-50/50 first:rounded-t-xl md:first:rounded-tr-none md:first:rounded-l-xl">
                        <FaBed className="text-blue-500 mr-3 text-lg" />
                        <div className="flex-1">
                            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">Location</label>
                            <input 
                                type="text" 
                                placeholder="Where are you going?"
                                value={destination}
                                onChange={(e) => setDestination(e.target.value)}
                                className="w-full bg-transparent outline-none text-sm font-semibold text-gray-800 placeholder:text-gray-300"
                            />
                        </div>
                        {destination && <FaTimes className="text-gray-300 cursor-pointer hover:text-red-400 ml-2 transition-colors" onClick={() => setDestination('')} />}
                    </div>

                    {/* Dates */}
                    <div className="flex-1 flex items-center bg-white px-4 h-14 cursor-pointer transition-colors hover:bg-gray-50/50">
                        <FaRegCalendarAlt className="text-blue-500 mr-3 text-lg" />
                        <div className="flex-1">
                            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">Dates</label>
                            <div className="text-sm text-gray-800 font-semibold truncate">Check-in — Check-out</div>
                        </div>
                    </div>

                    {/* Guests */}
                    <div className="flex-1 flex items-center justify-between bg-white px-4 h-14 cursor-pointer group transition-colors hover:bg-gray-50/50">
                        <div className="flex items-center">
                            <FaUser className="text-blue-500 mr-3 text-lg" />
                            <div className="flex-1">
                                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">Guests</label>
                                <div className="text-sm text-gray-800 font-semibold">2 adults · 1 room</div>
                            </div>
                        </div>
                        <span className="text-[10px] text-gray-400 transform transition-transform group-hover:rotate-180">▼</span>
                    </div>

                    {/* Search Button */}
                    <div className="p-1 md:p-0">
                        <button 
                            onClick={handleSearch}
                            className="w-full md:w-auto bg-blue-600 hover:bg-blue-700 text-white px-10 h-12 md:h-14 text-base font-bold transition-all rounded-lg md:rounded-l-none md:rounded-r-xl flex items-center justify-center gap-2 shadow-lg shadow-blue-200"
                        >
                            <FaSearch className="text-sm" />
                            <span>Search</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};





export default BookingSearchHeader;
