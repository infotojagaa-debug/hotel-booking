import React, { useEffect, useState, useMemo, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from 'react-leaflet';
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

// 2. Hotel Price Tag Marker
const createPriceIcon = (price, isActive, isHovered) => {
    const formattedPrice = price ? `₹${price.toLocaleString()}` : 'Check Price';
    const activeClass = isActive ? 'active' : '';
    const hoverClass = isHovered ? 'hovered-from-list' : '';
    
    return L.divIcon({
        className: 'price-marker-wrapper',
        html: `<div class="price-marker-container ${activeClass} ${hoverClass}">
                <span class="price-marker-text">${formattedPrice}</span>
              </div>`,
        iconSize: [80, 40],
        iconAnchor: [40, 40],
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
                            <Popup minWidth={240} closeButton={false} className="premium-map-popup">
                                <div className="map-info-window overflow-hidden">
                                    <div className="relative">
                                        <img 
                                            src={hotel.images?.[0] ? (hotel.images[0].startsWith('http') ? hotel.images[0] : `${BACKEND_URL}${hotel.images[0]}`) : 'https://placehold.co/400x300?text=No+Image'} 
                                            alt={hotel.name} 
                                            className="w-full h-32 object-cover"
                                        />
                                        <div className="absolute top-2 right-2 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-md shadow-sm flex items-center gap-1">
                                            <FaStar className="text-amber-400 text-[10px]" />
                                            <span className="text-[11px] font-bold">{hotel.rating || '4.5'}</span>
                                        </div>
                                    </div>
                                    <div className="p-4 bg-white">
                                        <h4 className="text-[15px] font-black text-[#1e293b] leading-tight mb-1">{hotel.name}</h4>
                                        <div className="flex items-center gap-2 mb-3">
                                            <FaMapMarkerAlt className="text-[#6d5dfc] text-[10px]" />
                                            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-tighter">{hotel.city || 'District'}</span>
                                        </div>
                                        <div className="flex items-center justify-between pt-2 border-t border-slate-50">
                                            <div className="flex flex-col">
                                                <span className="text-[9px] text-slate-400 font-bold uppercase">Price From</span>
                                                <span className="text-[16px] font-black text-[#1e293b]">₹{hotel.cheapestPrice?.toLocaleString()}</span>
                                            </div>
                                            <button className="bg-[#6d5dfc] text-white px-3 py-1.5 rounded-lg text-[11px] font-bold hover:bg-[#5b4cdb] transition-colors">
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
        </div>
    );
};

export default React.memo(HotelMap);
