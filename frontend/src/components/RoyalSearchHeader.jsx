import React, { useState } from 'react';
import { FaSearch, FaMapMarkerAlt, FaGlobe, FaBed, FaUserCircle } from 'react-icons/fa';
import { useNavigate, Link } from 'react-router-dom';

const RoyalSearchHeader = ({ initialLocation = '' }) => {
    const navigate = useNavigate();
    const [destination, setDestination] = useState(initialLocation);

    const handleSearch = (e) => {
        if (e) e.preventDefault();
        navigate(`/rooms?location=${destination}`);
    };

    return (
        <div className="w-full">
            {/* Top Navigation Bar */}
            <nav className="bg-royal-sage shadow-md px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center">
                        <span className="text-royal-sage font-black text-xl">R</span>
                    </div>
                    <h1 className="text-white font-black text-xl tracking-tight hidden sm:block uppercase">Royal Hotel Bookings</h1>
                </div>

                <div className="flex items-center gap-8">
                    <div className="hidden lg:flex items-center gap-8 text-white font-bold text-sm uppercase tracking-wide">
                        <Link to="/" className="hover:opacity-80">Home</Link>
                        <Link to="/rooms" className="hover:opacity-80">Accommodation</Link>
                        <Link to="/login" className="hover:opacity-80">Customer Login</Link>
                    </div>
                    <Link 
                        to="/register" 
                        className="bg-white text-royal-sage font-black px-6 py-2.5 rounded-xl text-sm shadow-sm hover:bg-royal-cream transition-all uppercase"
                    >
                        Register
                    </Link>
                </div>
            </nav>

            {/* Integrated Search Bar Section */}
            <div className="bg-royal-cream py-10 px-4 flex justify-center">
                <div className="w-full max-w-4xl relative group">
                    <div className="absolute inset-y-0 left-6 flex items-center pointer-events-none">
                        <FaMapMarkerAlt className="text-royal-sage text-xl" />
                    </div>
                    <input 
                        type="text" 
                        placeholder="Where are you going?"
                        value={destination}
                        onChange={(e) => setDestination(e.target.value)}
                        className="w-full bg-white h-20 pl-16 pr-24 rounded-full shadow-lg border-4 border-white focus:border-royal-sage outline-none text-lg font-medium text-gray-700 transition-all placeholder:text-gray-400"
                    />
                    <button 
                        onClick={handleSearch}
                        className="absolute right-4 top-1/2 -translate-y-1/2 bg-royal-sage hover:bg-royal-accent text-white w-14 h-14 rounded-2xl shadow-md flex items-center justify-center transition-all active:scale-95"
                    >
                        <FaSearch className="text-xl" />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default RoyalSearchHeader;
