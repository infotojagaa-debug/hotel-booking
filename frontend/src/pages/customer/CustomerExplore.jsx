import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
    FaSearch, FaMapMarkerAlt, FaStar, FaGlobeAmericas, 
    FaHotel, FaSuitcaseRolling, FaChevronRight, FaFilter,
    FaArrowRight, FaCompass
} from 'react-icons/fa';
import API, { BACKEND_URL } from '../../utils/api';
import HotelMap from '../../components/HotelMap';
import './dashboard.css';

const CustomerExplore = () => {
    const [hotels, setHotels] = useState([]);
    const [loading, setLoading] = useState(true);
    const [hoveredHotelId, setHoveredHotelId] = useState(null);
    const [activeHotelId, setActiveHotelId] = useState(null);
    const listRefs = useRef({});
    const navigate = useNavigate();

    useEffect(() => {
        const fetchHotels = async () => {
            try {
                const { data } = await API.get('/hotels');
                // Ensure dummy coordinates for demo if they are 0
                const processed = data.map((h, i) => ({
                    ...h,
                    latitude: h.latitude || (13.08 + (Math.random() - 0.5) * 0.1),
                    longitude: h.longitude || (80.27 + (Math.random() - 0.5) * 0.1)
                }));
                setHotels(processed);
            } catch (err) {
                console.error('Error fetching hotels:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchHotels();
    }, []);

    const handleMarkerClick = (hotel) => {
        setActiveHotelId(hotel._id);
        const element = listRefs.current[hotel._id];
        if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    };

    if (loading) return <div className="cd-loader"><div className="cd-spinner" /></div>;

    return (
        <div className="animate-in fade-in duration-700 flex flex-col h-[calc(100vh-180px)]">
            {/* Header / Intro Area */}
            <div className="mb-6">
                <div className="flex items-center gap-2 text-[#6d5dfc] font-black uppercase tracking-[0.25em] text-[10px] mb-2">
                    <FaCompass /> Destination Discovery
                </div>
                <h1 className="cd-welcome-title">Interactive Map Explorer</h1>
                <p className="cd-welcome-sub">Showing {hotels.length} luxury stays found in your selected area.</p>
            </div>

            {/* Split Screen Container */}
            <div className="cd-split-screen flex-1 min-h-0">
                
                {/* Scrollable List Side */}
                <div className="cd-listing-side flex-1">
                    <div className="space-y-4 pr-4">
                        {hotels.map((hotel) => (
                            <div 
                                key={hotel._id}
                                ref={el => listRefs.current[hotel._id] = el}
                                className={`cd-booking-card-premium p-4 flex gap-6 cursor-pointer transition-all duration-300 ${
                                    activeHotelId === hotel._id ? 'border-[#6d5dfc] ring-2 ring-[#6d5dfc1a]' : ''
                                }`}
                                onMouseEnter={() => setHoveredHotelId(hotel._id)}
                                onMouseLeave={() => setHoveredHotelId(null)}
                                onClick={() => navigate(`/hotels/${hotel._id}`)}
                            >
                                <div className="w-[180px] h-[120px] rounded-2xl overflow-hidden flex-shrink-0">
                                    <img 
                                        src={hotel.images?.[0]?.startsWith('http') ? hotel.images[0] : `${BACKEND_URL}${hotel.images[0]}`} 
                                        alt={hotel.name}
                                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                                    />
                                </div>
                                <div className="flex-1 flex flex-col justify-between">
                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="text-[10px] font-black text-[#6d5dfc] uppercase tracking-widest">{hotel.type}</span>
                                            <span className="text-slate-300">•</span>
                                            <span className="text-[10px] font-bold text-slate-400 capitalize">{hotel.district || hotel.city}</span>
                                        </div>
                                        <h3 className="text-lg font-black text-slate-800 leading-tight mb-1">{hotel.name}</h3>
                                        <div className="flex items-center gap-4">
                                            <span className="text-xs font-bold text-[#22c55e] flex items-center gap-1">
                                                <FaStar className="text-[10px]" /> {hotel.rating || '4.5'}
                                            </span>
                                            <span className="text-xs font-bold text-slate-400">{hotel.reviewCount || 0} reviews</span>
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between mt-4">
                                        <div className="flex flex-col">
                                            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Nightly Rate</span>
                                            <span className="text-lg font-black text-slate-900">₹{hotel.cheapestPrice?.toLocaleString()}</span>
                                        </div>
                                        <button className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-[#6d5dfc] hover:bg-slate-100 transition-colors">
                                            <FaChevronRight className="text-xs" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Sticky Map Side */}
                <div className="cd-map-side flex-1 hidden lg:block">
                    <HotelMap 
                        hotels={hotels} 
                        hoveredHotelId={hoveredHotelId}
                        activeHotelId={activeHotelId}
                        onMarkerClick={handleMarkerClick}
                    />
                </div>
            </div>
        </div>
    );
};

export default CustomerExplore;
