import React, { useEffect, useState, useMemo, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from 'react-leaflet';
import { useNavigate } from 'react-router-dom';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { FaStar, FaBuilding, FaMapMarkerAlt, FaGlobe } from 'react-icons/fa';
import { BACKEND_URL } from '../utils/api';

// --- CUSTOM MARKER CREATORS ---

// 1. City Level Badge Marker
const createCityIcon = (cityName, count) => {
    return L.divIcon({
        className: 'city-badge-wrapper',
        html: `<div class="city-badge-marker">
                <span class="city-badge-name">${cityName}</span>
                <span class="city-badge-count">${count} properties</span>
              </div>`,
        iconSize: [120, 50],
        iconAnchor: [60, 25],
    });
};

// 2. Hotel Price Tag Marker (PILL STYLE)
const createPriceIcon = (price, isActive, isHovered) => {
    const activeClass = isActive ? 'active' : '';
    const hoverClass = isHovered ? 'hovered' : '';
    return L.divIcon({
        className: 'price-pill-marker-wrapper',
        html: `<div class="price-pill-marker ${activeClass} ${hoverClass}">
                <span class="price-badge-currency">₹</span>
                <span class="price-pill-text">${price?.toLocaleString()}</span>
              </div>`,
        iconSize: [90, 38],
        iconAnchor: [45, 38],
        popupAnchor: [0, -40]
    });
};

// --- HELPER COMPONENTS ---

const MapController = ({ center, zoom }) => {
    const map = useMap();
    useEffect(() => {
        if (center) {
            map.flyTo([center.lat, center.lng], zoom || 15, { duration: 1.5 });
        }
    }, [center, zoom, map]);
    return null;
};

// Component to track zoom level and bounds
const MapEventsHandler = ({ onZoomEnd }) => {
    useMapEvents({
        zoomend: (e) => {
            onZoomEnd(e.target.getZoom());
        }
    });
    return null;
};

const HotelMap = ({ hotels, hoveredHotelId, onMarkerClick, activeHotelId, center }) => {
    const navigate = useNavigate();
    const [zoom, setZoom] = useState(center ? 14 : 6);
    const [mapCenter, setMapCenter] = useState(center || { lat: 13.0827, lng: 80.2707 });
    const isCityView = zoom < 10 && !center; // Never show city view on specific hotel view

    // Group hotels by city for the initial macro view
    const cityGroups = useMemo(() => {
        const groups = {};
        hotels.forEach(hotel => {
            const city = hotel.city || 'Other';
            if (!groups[city]) {
                groups[city] = {
                    name: city,
                    count: 0,
                    lat: hotel.latitude,
                    lng: hotel.longitude,
                    hotels: []
                };
            }
            groups[city].count++;
            groups[city].hotels.push(hotel);
            // Simple center point (first hotel found in that city)
            // In a real app we'd average the coords
        });
        return Object.values(groups);
    }, [hotels]);

    const handleCityClick = (city) => {
        setMapCenter({ lat: city.lat, lng: city.lng });
        setZoom(13); // Zoom in to show individual hotels
    };

    return (
        <div style={{ width: '100%', height: '100%', position: 'relative' }} className="animate-in fade-in duration-1000">
            <MapContainer
                center={[mapCenter.lat, mapCenter.lng]}
                zoom={zoom}
                scrollWheelZoom={true}
                style={{ width: '100%', height: '100%', borderRadius: '24px' }}
                zoomControl={false}
            >
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png" // Modern light theme
                />
                
                <MapController center={mapCenter} zoom={zoom} />
                <MapEventsHandler onZoomEnd={setZoom} />

                {/* Macro View: Show City Badges */}
                {isCityView && cityGroups.map((city, idx) => (
                    <Marker
                        key={`city-${idx}`}
                        position={[city.lat, city.lng]}
                        icon={createCityIcon(city.name, city.count)}
                        eventHandlers={{
                            click: () => handleCityClick(city)
                        }}
                    />
                ))}

                {/* Micro View: Show Individual Hotel Price Markers */}
                {!isCityView && hotels.map((hotel) => {
                    if (!hotel.latitude || !hotel.longitude) return null;

                    const isHovered = hoveredHotelId === hotel._id;
                    const isActive = activeHotelId === hotel._id;

                    return (
                        <Marker
                            key={hotel._id}
                            position={[hotel.latitude, hotel.longitude]}
                            icon={createPriceIcon(hotel.cheapestPrice, isActive, isHovered)}
                            eventHandlers={{
                                click: () => {
                                    if (onMarkerClick) onMarkerClick(hotel);
                                }
                            }}
                            zIndexOffset={isActive || isHovered ? 1000 : 0}
                        >
                            <Popup className="fs-marker-popup" minWidth={300} offset={[0, -20]}>
                                <div 
                                    className="map-elite-popup-card cursor-pointer group/popup"
                                    onClick={() => navigate(`/hotels/${hotel._id}`)}
                                >
                                    {/* Elite Image Header */}
                                    <div className="popup-premium-image h-[150px] overflow-hidden relative">
                                        <img 
                                            src={hotel.images?.[0] ? (hotel.images[0].startsWith('http') ? hotel.images[0] : `${BACKEND_URL}${hotel.images[0]}`) : 'https://placehold.co/400x300?text=No+Image'}
                                            className="w-full h-full object-cover transition-transform duration-1000 group-hover/popup:scale-110"
                                            alt={hotel.name}
                                        />
                                        <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-md px-3 py-1 rounded-lg text-[10px] font-black text-slate-900 shadow-xl border border-white/20">
                                            HOTEL
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
                                                <span className="text-[26px] font-black text-slate-950 tracking-tighter leading-none">₹{hotel.cheapestPrice?.toLocaleString()}</span>
                                            </div>
                                            <button 
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    navigate(`/hotels/${hotel._id}`);
                                                }}
                                                className="bg-[#6d5dfc] hover:bg-indigo-700 text-white font-black text-[12px] px-6 py-3.5 rounded-xl shadow-[0_10px_25px_rgba(109,93,252,0.3)] border-b-2 border-indigo-800/20 active:scale-95 transition-all"
                                            >
                                                View Rooms
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </Popup>
                        </Marker>
                    );
                })}
            </MapContainer>
            
            {/* Minimal Zoom Controls Overlay */}
            <div className="absolute top-4 right-4 z-[1000] flex flex-col gap-2">
                <button 
                    onClick={() => setZoom(prev => Math.min(prev + 1, 18))}
                    className="w-10 h-10 bg-white border border-slate-200 rounded-xl shadow-lg flex items-center justify-center font-black text-slate-600 hover:bg-slate-50 transition-colors"
                >
                    +
                </button>
                <button 
                    onClick={() => setZoom(prev => Math.max(prev - 1, 3))}
                    className="w-10 h-10 bg-white border border-slate-200 rounded-xl shadow-lg flex items-center justify-center font-black text-slate-600 hover:bg-slate-50 transition-colors"
                >
                    -
                </button>
            </div>

            {/* Attribution overlay */}
            <div className="absolute bottom-2 left-2 z-[1000] text-[8px] text-slate-400 pointer-events-none opacity-40">
                &copy; OpenStreetMap | CartoDB Light
            </div>

            <style>{`
                .fs-marker-popup .leaflet-popup-content-wrapper { padding: 0 !important; border-radius: 40px !important; overflow: hidden !important; box-shadow: 0 40px 100px rgba(0,0,0,0.25) !important; border: 1px solid #f1f5f9; }
                .fs-marker-popup .leaflet-popup-content { margin: 0 !important; width: 320px !important; }
                .fs-marker-popup .leaflet-popup-tip-container { display: none; }
                .price-pill-marker-wrapper { background: transparent; border: none; }
                .price-pill-marker { background: #0f172a; border: 2.5px solid white; border-radius: 18px; padding: 10px 20px; display: flex; align-items: center; justify-content: center; box-shadow: 0 15px 40px rgba(0,0,0,0.3); cursor: pointer; transition: all 0.4s cubic-bezier(0.18, 0.89, 0.32, 1.28); white-space: nowrap; position: relative; color: white; gap: 4px; }
                .price-pill-marker.active { background: #6d5dfc !important; transform: scale(1.25) translateY(-12px); z-index: 1000 !important; box-shadow: 0 25px 60px rgba(109,93,252,0.4); border-color: white; }
                .price-pill-marker:after { content: ''; position: absolute; bottom: -8px; left: 50%; transform: translateX(-50%); border-left: 8px solid transparent; border-right: 8px solid transparent; border-top: 8px solid #0f172a; transition: all 0.4s; }
                .price-pill-marker.active:after { border-top-color: #6d5dfc; bottom: -10px; }
                .price-badge-currency { font-size: 13px; font-weight: 800; opacity: 0.8; }
                .price-pill-text { font-size: 17px; font-weight: 950; letter-spacing: -0.8px; }
            `}</style>
        </div>
    );
};

export default React.memo(HotelMap);
