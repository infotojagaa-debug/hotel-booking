import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, ZoomControl } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { FaStar, FaChevronLeft, FaSearch, FaTimes, FaHeart, FaMapMarkerAlt, FaExchangeAlt, FaTag, FaChevronDown } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { BACKEND_URL } from '../utils/api';

// --- CUSTOM PRICE PILL MARKER ---
const createPricePillIcon = (price, isActive, isHovered) => {
    const activeClass = isActive ? 'active' : '';
    const hoverClass = isHovered ? 'hovered' : '';
    return L.divIcon({
        className: 'price-pill-marker-wrapper',
        html: `<div class="price-pill-marker ${activeClass} ${hoverClass}">
                <span class="price-pill-text">₹${price?.toLocaleString()}</span>
              </div>`,
        iconSize: [80, 32],
        iconAnchor: [40, 32],
        popupAnchor: [0, -32]
    });
};

// --- MAP AUTO-FIT BOUNDS CONTROLLER ---
const MapController = ({ hotels, forceCenter }) => {
    const map = useMap();
    useEffect(() => {
        if (hotels.length > 0 && !forceCenter) {
            const bounds = L.latLngBounds(hotels.map(h => [h.latitude, h.longitude]));
            map.fitBounds(bounds, { padding: [40, 40], maxZoom: 15 });
        }
    }, [hotels, map, forceCenter]);

    useEffect(() => {
        if (forceCenter) {
            map.flyTo([forceCenter.lat, forceCenter.lng], 15, { duration: 1.2 });
        }
    }, [forceCenter, map]);

    return null;
};

// --- SKELETON LOADER (COMPACT) ---
const HotelCardSkeleton = () => (
    <div className="flex flex-row bg-white rounded-2xl border border-slate-100 mb-6 overflow-hidden animate-pulse p-5 gap-6 max-w-[480px] w-full shadow-sm">
        <div className="w-[140px] h-[110px] bg-slate-50 rounded-xl flex-shrink-0" />
        <div className="flex-1 flex flex-col justify-between py-1">
            <div className="space-y-4">
                <div className="h-4 bg-slate-100 rounded w-3/4" />
                <div className="h-3 bg-slate-100 rounded w-1/2" />
            </div>
            <div className="h-7 bg-slate-100 rounded w-1/4 self-end" />
        </div>
    </div>
);

const MapSkeleton = () => (
    <div className="w-full h-full bg-slate-50 flex flex-col items-center justify-center animate-pulse rounded-[40px]">
        <div className="w-16 h-16 rounded-full border-4 border-[#6d5dfc22] border-t-[#6d5dfc] animate-spin mb-4" />
        <p className="text-slate-400 font-black tracking-widest uppercase text-[10px]">Discovery Map...</p>
    </div>
);

// --- COMPACT PREMIUM HOTEL CARD ---
const HotelListCard = ({ hotel, isActive, onSelect, onHover }) => {
    const [isSaved, setIsSaved] = useState(false);

    return (
        <div 
            id={`hotel-card-${hotel._id}`}
            className={`flex flex-row bg-white rounded-[26px] border transition-all duration-500 cursor-pointer mb-6 overflow-hidden group hover:shadow-2xl hover:translate-y-[-4px] p-5 gap-6 max-w-[480px] w-full ${
                isActive ? 'border-[#6d5dfc] ring-2 ring-[#6d5dfc0c] shadow-2xl bg-white' : 'border-slate-100/70 shadow-sm'
            }`}
            onClick={() => onSelect(hotel)}
            onMouseEnter={() => onHover(hotel._id)}
            onMouseLeave={() => onHover(null)}
        >
            {/* Image (140x110) */}
            <div className="w-[140px] h-[110px] relative flex-shrink-0 overflow-hidden rounded-[18px] bg-slate-50 shadow-inner">
                <img 
                    src={hotel.images?.[0]?.startsWith('http') ? hotel.images[0] : `${BACKEND_URL}${hotel.images[0]}`}
                    className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-115"
                    alt={hotel.name}
                />
                <div className="absolute top-3 right-3 bg-emerald-500 text-white text-[9px] font-black px-2.5 py-1 rounded-full shadow-lg z-20 backdrop-blur-md border border-white/20 uppercase tracking-tighter">
                    Deal
                </div>
                <button 
                    onClick={(e) => { e.stopPropagation(); setIsSaved(!isSaved); }}
                    className={`absolute bottom-3 left-3 w-8 h-8 rounded-full flex items-center justify-center shadow-lg backdrop-blur-md transition-all active:scale-90 z-20 ${
                        isSaved ? 'bg-rose-500 text-white' : 'bg-white/90 text-gray-400 hover:text-rose-500'
                    }`}
                >
                    <FaHeart size={12} fill={isSaved ? 'white' : 'none'} stroke="currentColor" strokeWidth="2.5" />
                </button>
            </div>

            {/* Content (Focused Spacing) */}
            <div className="flex-1 flex flex-col justify-between min-w-0 py-1 pr-1">
                <div className="space-y-2">
                     <h4 className="text-[19px] font-black text-slate-900 truncate group-hover:text-[#6d5dfc] transition-colors leading-none tracking-tight">
                        {hotel.name}
                     </h4>
                    
                    <div className="flex items-center gap-2.5">
                         <div className="bg-[#003b95] text-white text-[10px] font-black px-2.5 py-1 rounded-lg shadow-sm">
                            {hotel.rating || '8.4'}
                         </div>
                         <span className="text-[13px] font-bold text-slate-500">• {hotel.reviews?.length || 142} Reviews</span>
                    </div>

                    <div className="flex items-center gap-2 text-[11px] font-bold text-slate-400">
                        <FaMapMarkerAlt className="text-[#6d5dfc]/50" size={12} />
                        <span className="truncate">{hotel.city}, India</span>
                    </div>
                </div>

                <div className="flex justify-end items-end pt-3 border-t border-slate-50">
                    <div className="flex flex-col items-end">
                        <div className="text-[10px] text-slate-300 line-through font-bold mb-1">₹{Math.round((hotel.cheapestPrice || 0) * 1.3).toLocaleString()}</div>
                        <div className="flex items-baseline gap-1">
                             <span className="text-[24px] font-black text-slate-900 tracking-tighter leading-none">₹{hotel.cheapestPrice?.toLocaleString()}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const CustomerFullScreenMap = ({ hotels, onClose }) => {
    const [selectedHotelId, setSelectedHotelId] = useState(null);
    const [hoveredHotelId, setHoveredHotelId] = useState(null);
    const [forceCenter, setForceCenter] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [isMapReady, setIsMapReady] = useState(false);
    const listRef = useRef(null);
    const navigate = useNavigate();

    useEffect(() => {
        const timer = setTimeout(() => setIsMapReady(true), 1200);
        return () => clearTimeout(timer);
    }, []);

    const handleHotelSelect = (hotel) => {
        setSelectedHotelId(hotel._id);
        setForceCenter({ lat: hotel.latitude, lng: hotel.longitude });
    };

    const handleMarkerClick = (hotel) => {
        setSelectedHotelId(hotel._id);
        setForceCenter({ lat: hotel.latitude, lng: hotel.longitude });
        const card = document.getElementById(`hotel-card-${hotel._id}`);
        if (card && listRef.current) {
            card.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    };

    return (
        <div className="fs-map-root h-screen w-screen bg-white flex flex-col font-sans overflow-hidden animate-in fade-in duration-1000">
            
            {/* 1. CENTERED PREMIUM HEADER (FIXED SEARCH HOVER) */}
            <header className="fs-map-header shadow-[0_10px_40px_rgba(0,0,0,0.04)] relative z-[1001] bg-white border-b border-slate-100 h-[100px] flex items-center px-10">
                <div className="max-w-[1300px] mx-auto w-full flex items-center justify-between gap-10">
                    <div className="flex items-center gap-6 min-w-[240px]">
                        <button 
                            onClick={onClose}
                            className="w-12 h-12 rounded-2xl flex items-center justify-center hover:bg-slate-50 transition-all active:scale-90 border border-slate-100 bg-white"
                        >
                            <FaChevronLeft className="text-slate-700" size={18} />
                        </button>
                        <div className="hidden sm:block">
                            <h2 className="text-[24px] font-black text-slate-900 leading-none mb-2 tracking-tighter">Discovery Hub</h2>
                            <div className="flex items-center gap-2">
                                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.3)] animate-pulse" />
                                <span className="text-[11px] text-slate-400 font-bold uppercase tracking-widest">{hotels.length} Stays Found</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex-1 flex justify-center items-center h-full max-w-[500px]">
                        <div className="relative w-full group flex items-center">
                            {/* SEARCH ICON - FIXED HOVER CLIPPING & SHAPE */}
                            <div className="absolute right-2 w-10 h-10 rounded-full bg-white border border-slate-100 flex items-center justify-center z-20 group-hover:bg-slate-950 group-hover:text-white group-focus-within:bg-slate-950 group-focus-within:text-white transition-all duration-300 shadow-sm group-hover:shadow-[0_8px_20px_rgba(0,0,0,0.15)] group-hover:scale-90">
                                <FaSearch size={14} />
                            </div>
                            <input 
                                type="text"
                                placeholder="Find your luxury stay..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full bg-slate-50 border border-slate-200/60 rounded-full pl-8 pr-14 py-4 text-[15px] font-bold focus:outline-none focus:ring-[5px] focus:ring-slate-950/5 focus:border-slate-950 transition-all shadow-inner hover:bg-white"
                            />
                        </div>
                    </div>

                    <div className="flex items-center justify-end min-w-[220px]">
                        <button 
                            onClick={onClose}
                            className="bg-gradient-to-tr from-slate-950 to-indigo-950 px-12 py-4 rounded-2xl font-black text-white text-[11px] tracking-[0.2em] uppercase hover:shadow-[0_20px_50px_rgba(99,102,241,0.2)] transition-all flex items-center gap-4 group active:scale-95 shadow-xl border border-white/5"
                        >
                            Close <FaTimes className="group-hover:rotate-90 transition-transform" size={12} />
                        </button>
                    </div>
                </div>
            </header>

            {/* 2. CENTERED GRID CONTAINER (CARDS ON MAP SIDE) */}
            <main className="flex-1 flex overflow-y-auto pt-10 pb-20 no-scrollbar bg-slate-50/30">
                <div className="max-w-[1300px] mx-auto w-full grid grid-cols-1 lg:grid-cols-[1fr_1.2fr] gap-12">
                    
                    {/* 2a. List (CARDS MOVED TO MAP SIDE) */}
                    <div ref={listRef} className="flex flex-col items-end gap-10 pr-6">
                        <div className="flex flex-col items-end w-full max-w-[480px]">
                            <div className="flex items-center gap-4 mb-4 pr-4">
                                <div className="w-3 h-3 rounded-full bg-[#6d5dfc] shadow-[0_0_15px_rgba(109,93,252,0.4)] animate-pulse" />
                                <span className="text-[14px] font-black text-slate-800 uppercase tracking-[0.15em]">Discovery Mode</span>
                            </div>

                            <div className="space-y-10 w-full mb-10">
                                {hotels.length === 0 ? (
                                    Array(5).fill(0).map((_, i) => <HotelCardSkeleton key={i} />)
                                ) : (
                                    hotels.map(hotel => (
                                        <HotelListCard 
                                            key={hotel._id} 
                                            hotel={hotel} 
                                            isActive={selectedHotelId === hotel._id}
                                            onSelect={handleHotelSelect}
                                            onHover={setHoveredHotelId}
                                        />
                                    ))
                                )}
                            </div>
                        </div>
                    </div>

                    {/* 2b. Sticky Map */}
                    <div className="hidden lg:block relative pr-10">
                        <div className="sticky top-10 h-[calc(100vh-180px)] rounded-[50px] overflow-hidden shadow-[0_40px_100px_rgba(0,0,0,0.18)] border-[10px] border-white bg-slate-50 group">
                            <div className="absolute inset-0 border border-slate-200/40 pointer-events-none rounded-[40px] z-10" />
                            {!isMapReady ? (
                                <MapSkeleton />
                            ) : (
                                <MapContainer
                                    center={[13.08, 80.27]}
                                    zoom={13}
                                    zoomControl={false}
                                    className="h-full w-full"
                                >
                                    <TileLayer
                                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                                        url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
                                    />
                                    
                                    <MapController hotels={hotels} forceCenter={forceCenter} />

                                    {hotels.map(hotel => (
                                        <Marker
                                            key={hotel._id}
                                            position={[hotel.latitude, hotel.longitude]}
                                            icon={createPricePillIcon(
                                                hotel.cheapestPrice, 
                                                selectedHotelId === hotel._id,
                                                hoveredHotelId === hotel._id
                                            )}
                                            eventHandlers={{
                                                click: () => handleMarkerClick(hotel)
                                            }}
                                        >
                                            <Popup className="fs-marker-popup" minWidth={280} offset={[0, -20]}>
                                                <div 
                                                    className="map-popup-card cursor-pointer group/popup"
                                                    onClick={() => navigate(`/hotels/${hotel._id}`)}
                                                >
                                                    <div className="h-[160px] overflow-hidden relative">
                                                        <img 
                                                            src={hotel.images?.[0]?.startsWith('http') ? hotel.images[0] : `${BACKEND_URL}${hotel.images[0]}`}
                                                            className="w-full h-full object-cover transition-transform duration-700 group-hover/popup:scale-110"
                                                            alt={hotel.name}
                                                        />
                                                    </div>
                                                    <div className="p-4 bg-white">
                                                        <h5 className="text-[17px] font-black text-slate-900 truncate mb-1">{hotel.name}</h5>
                                                        <div className="flex items-center gap-2 text-[13px] text-slate-400 font-bold">
                                                            <FaStar className="text-amber-400" size={13} />
                                                            {hotel.rating || '8.4'} • Recommended
                                                        </div>
                                                    </div>
                                                </div>
                                            </Popup>
                                        </Marker>
                                    ))}

                                    <ZoomControl position="bottomright" />
                                </MapContainer>
                            )}
                        </div>
                    </div>
                </div>
            </main>

            <style>{`
                .no-scrollbar::-webkit-scrollbar { display: none; }
                .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
                .fs-marker-popup .leaflet-popup-content-wrapper { padding: 0 !important; border-radius: 32px !important; overflow: hidden !important; box-shadow: 0 40px 90px rgba(0,0,0,0.2) !important; border: 1px solid #f1f5f9; }
                .fs-marker-popup .leaflet-popup-content { margin: 0 !important; width: 280px !important; }
                .fs-marker-popup .leaflet-popup-tip-container { display: none; }
                .price-pill-marker-wrapper { background: transparent; border: none; }
                .price-pill-marker { background: #012e6d; border: 3px solid white; border-radius: 14px; padding: 7px 18px; display: flex; align-items: center; justify-content: center; box-shadow: 0 15px 40px rgba(0,0,0,0.3); cursor: pointer; transition: all 0.5s cubic-bezier(0.18, 0.89, 0.32, 1.28); white-space: nowrap; position: relative; color: white; }
                .price-pill-marker.active { background: #6d5dfc !important; transform: scale(1.3) translateY(-10px); z-index: 1000 !important; box-shadow: 0 25px 60px rgba(109,93,252,0.5); }
                .price-pill-marker:after { border-top: 14px solid #012e6d; }
                .price-pill-marker.active:after { border-top-color: #6d5dfc; }
                .price-pill-text { font-size: 16px; font-weight: 900; letter-spacing: -0.6px; }
            `}</style>
        </div>
    );
};

export default CustomerFullScreenMap;
