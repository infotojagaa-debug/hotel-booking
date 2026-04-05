import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
    FaMapMarkerAlt, FaHotel, FaBuilding, FaSwimmingPool, FaWifi, 
    FaCar, FaDumbbell, FaUtensils, FaHome, FaCampground, 
    FaCamera, FaBolt, FaSpa, FaGlassMartini, FaTshirt, FaPlane 
} from 'react-icons/fa';

/**
 * BookingFilterSidebar Component
 * Redesigned for a premium, aligned and highly responsive interface.
 */
const BookingFilterSidebar = ({ filters, onFilterChange, stats = {}, onShowMap }) => {
    const navigate = useNavigate();
    const location = useLocation();

    const handleShowMap = () => {
        if (onShowMap) onShowMap();
        navigate(`/hotels/map${location.search}`);
    };

    // Define sections with dynamic counts from stats
    const filterSections = [
        {
            title: 'Property Type',
            id: 'type',
            items: [
                { id: 'Hotel', label: 'Hotels', count: stats.type?.['Hotel'] || 0, icon: <FaHotel /> },
                { id: 'Apartment', label: 'Apartments', count: stats.type?.['Apartment'] || 0, icon: <FaHome /> },
                { id: 'Resort', label: 'Resorts', count: stats.type?.['Resort'] || 0, icon: <FaBuilding /> },
                { id: 'Villa', label: 'Villas', count: stats.type?.['Villa'] || 0, icon: <FaHome /> },
                { id: 'Hostel', label: 'Hostels', count: stats.type?.['Hostel'] || 0, icon: <FaCampground /> },
                { id: 'Guest House', label: 'Guest Houses', count: stats.type?.['Guest House'] || 0, icon: <FaHome /> },
            ]
        },
        {
            title: 'Popular Amenities',
            id: 'amenities',
            items: [
                { id: 'Free WiFi', label: 'WiFi', count: stats.amenities?.['Free WiFi'] || 0, icon: <FaWifi /> },
                { id: 'Swimming Pool', label: 'Swimming Pool', count: stats.amenities?.['Swimming Pool'] || 0, icon: <FaSwimmingPool /> },
                { id: 'CCTV', label: 'CCTV', count: stats.amenities?.['CCTV'] || 0, icon: <FaCamera /> },
                { id: 'Power Backup', label: 'Power Backup', count: stats.amenities?.['Power Backup'] || 0, icon: <FaBolt /> },
                { id: 'Gym', label: 'Gym', count: stats.amenities?.['Gym'] || 0, icon: <FaDumbbell /> },
                { id: 'Restaurant', label: 'Restaurant', count: stats.amenities?.['Restaurant'] || 0, icon: <FaUtensils /> },
                { id: 'Parking', label: 'Parking', count: stats.amenities?.['Parking'] || 0, icon: <FaCar /> },
                { id: 'Spa', label: 'Spa', count: stats.amenities?.['Spa'] || 0, icon: <FaSpa /> },
                { id: 'AC', label: 'AC', count: stats.amenities?.['AC'] || 0, icon: <FaHome /> },
                { id: 'Bar', label: 'Bar', count: stats.amenities?.['Bar'] || 0, icon: <FaGlassMartini /> },
                { id: 'Laundry', label: 'Laundry', count: stats.amenities?.['Laundry'] || 0, icon: <FaTshirt /> },
                { id: 'Airport Shuttle', label: 'Airport Shuttle', count: stats.amenities?.['Airport Shuttle'] || 0, icon: <FaPlane /> },
            ]
        }
    ];

    return (
        <div className="w-full space-y-4 lg:sticky lg:top-[120px] font-sans">
            
            {/* 1. Map Interaction Card */}
            <div 
                onClick={handleShowMap}
                className="relative w-full rounded-lg overflow-hidden border border-[#e7e7e7] cursor-pointer group shadow-sm hover:shadow-md transition-shadow"
            >
                <div className="h-40 w-full relative">
                    <img 
                        src="https://images.unsplash.com/photo-1526772662000-3f88f10405ff?auto=format&fit=crop&q=80&w=600" 
                        alt="Map Background" 
                        className="w-full h-full object-cover grayscale-[0.2] transition-transform duration-700 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-white/10 group-hover:bg-transparent transition-colors"></div>
                    
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className="bg-[#6d5dfc] hover:bg-[#5b4dec] text-white px-6 py-2.5 rounded-full font-bold text-[14px] shadow-lg transition-all transform group-hover:scale-105 active:scale-95 flex items-center gap-2">
                            <FaMapMarkerAlt className="text-white text-[12px]" />
                            Show on map
                        </div>
                    </div>
                </div>
            </div>

            {/* 2. Primary Filters Card */}
            <div className="bg-white rounded-lg border border-[#e7e7e7] shadow-sm">
                <div className="p-4 border-b border-[#e7e7e7]">
                    <h3 className="font-bold text-[#1a1a1a] text-[15px]">Your previous filters</h3>
                </div>

                {filterSections.map((section) => (
                    <div key={section.id} className="p-4 border-b border-[#f2f2f2] last:border-b-0 font-sans">
                        <h4 className="text-[14px] font-bold text-[#1a1a1a] mb-4">{section.title}</h4>
                        <div className="flex flex-col gap-3">
                            {section.items.map(item => (
                                <label key={item.id} className={`filter-item-row group hover:opacity-80 transition-all cursor-pointer ${item.count === 0 ? 'opacity-50 grayscale' : ''}`}>
                                    <div className="filter-item-left">
                                        <input 
                                            type="checkbox" 
                                            checked={filters[section.id]?.includes(item.id) || false}
                                            onChange={() => onFilterChange(section.id, item.id)}
                                            className="filter-checkbox accent-[#6d5dfc]"
                                            disabled={item.count === 0 && !filters[section.id]?.includes(item.id)}
                                        />
                                        <div className="filter-item-icon text-gray-400 group-hover:text-[#6d5dfc] transition-colors">{item.icon}</div>
                                        <span className={`filter-item-label group-hover:text-[#6d5dfc] transition-colors ${filters[section.id]?.includes(item.id) ? 'font-semibold text-[#6d5dfc]' : 'text-[#4b5563]'}`}>
                                            {item.label}
                                        </span>
                                    </div>
                                    <span className={`text-[12px] px-1.5 py-0.5 rounded-full transition-colors ${item.count > 0 ? 'bg-gray-100 text-gray-600 font-medium group-hover:bg-[#6d5dfc]/10 group-hover:text-[#6d5dfc]' : 'text-gray-300'}`}>
                                        {item.count}
                                    </span>
                                </label>
                            ))}
                        </div>
                    </div>
                ))}
            </div>

            {/* 3. Promo Tip Card (Premium UI Element) */}
            <div className="bg-[#f8f6ff] border border-[#6d5dfc]/10 rounded-lg p-3.5">
                <h5 className="text-[13px] font-bold text-[#6d5dfc] mb-1 leading-tight">Finding the perfect stay?</h5>
                <p className="text-[11px] text-gray-500 leading-relaxed">
                    Filter by property type or amenities to narrow down your options quickly.
                </p>
            </div>
        </div>
    );
};

export default BookingFilterSidebar;
