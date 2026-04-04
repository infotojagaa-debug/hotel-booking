import React from 'react';
import { FaChevronDown, FaCheck } from 'react-icons/fa';

const TrivagoFilterSidebar = ({ filters, onFilterChange }) => {

    const amenities = ['WiFi', 'AC', 'Parking', 'Pool', 'Breakfast'];
    const propTypes = ['Hotel', 'Apartment', 'Resort', 'Villa'];

    const handleTypeToggle = (type) => {
        const newTypes = filters.type.includes(type)
            ? filters.type.filter(t => t !== type)
            : [...filters.type, type];
        onFilterChange('type', newTypes);
    };

    return (
        <div className="w-full space-y-6">
            {/* Price Filter */}
            <div className="bg-white p-4 rounded-md shadow-sm border border-gray-100">
                <h4 className="text-sm font-bold text-[#37454d] mb-4 flex justify-between items-center">
                    Price per night
                    <FaChevronDown className="text-gray-400 text-[10px]" />
                </h4>
                <div className="px-2">
                    <input 
                        type="range" 
                        min="50" 
                        max="5000" 
                        step="50"
                        value={filters.maxPrice}
                        onChange={(e) => onFilterChange('maxPrice', e.target.value)}
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[#007faf]"
                    />
                    <div className="flex justify-between text-[11px] text-gray-500 mt-2 font-medium">
                        <span>₹50</span>
                        <span className="text-[#007faf] font-bold">Up to ₹{filters.maxPrice}</span>
                    </div>
                </div>
            </div>

            {/* Star Rating Filter */}
            <div className="bg-white p-4 rounded-md shadow-sm border border-gray-100">
                <h4 className="text-sm font-bold text-[#37454d] mb-4">Hotel class</h4>
                <div className="flex flex-wrap gap-2 text-xs">
                    {[5, 4, 3, 2, 1].map(star => (
                        <button 
                            key={star}
                            onClick={() => onFilterChange('minRating', star === filters.minRating ? 0 : star)}
                            className={`flex items-center gap-1 px-3 py-2 rounded-sm border transition-all ${
                                filters.minRating === star 
                                ? 'bg-trivago-blue text-white border-trivago-blue' 
                                : 'bg-white text-gray-700 border-gray-200 hover:border-trivago-blue'
                            }`}
                        >
                            {star} ★
                        </button>
                    ))}
                </div>
            </div>

            {/* Property Types */}
            <div className="bg-white p-4 rounded-md shadow-sm border border-gray-100">
                <h4 className="text-sm font-bold text-[#37454d] mb-4">Property type</h4>
                <div className="space-y-3">
                    {propTypes.map(type => (
                        <label key={type} className="flex items-center gap-3 cursor-pointer group">
                            <div className="relative flex items-center justify-center">
                                <input 
                                    type="checkbox" 
                                    checked={filters.type.includes(type)}
                                    onChange={() => handleTypeToggle(type)}
                                    className="appearance-none h-5 w-5 border-2 border-gray-300 rounded-sm checked:bg-[#007faf] checked:border-[#007faf] transition-all"
                                />
                                {filters.type.includes(type) && <FaCheck className="absolute text-white text-[10px]" />}
                            </div>
                            <span className="text-sm text-[#37454d] group-hover:text-trivago-blue transition-colors font-medium">{type}</span>
                        </label>
                    ))}
                </div>
            </div>

            {/* Guest Rating Filter */}
            <div className="bg-white p-4 rounded-md shadow-sm border border-gray-100">
                <h4 className="text-sm font-bold text-[#37454d] mb-4">Guest rating</h4>
                <div className="space-y-4">
                    {[
                        { label: 'Excellent 8.5+', val: 8.5 },
                        { label: 'Very Good 8.0+', val: 8.0 },
                        { label: 'Good 7.5+', val: 7.5 }
                    ].map(rating => (
                        <label key={rating.val} className="flex items-center gap-3 cursor-pointer group">
                            <input 
                                type="radio" 
                                name="guestRating"
                                className="h-4 w-4 text-[#007faf] focus:ring-[#007faf] border-gray-300 cursor-pointer"
                            />
                            <span className="text-sm text-[#37454d] group-hover:text-trivago-blue transition-colors">{rating.label}</span>
                        </label>
                    ))}
                </div>
            </div>

            {/* Reset Button */}
            <button 
                onClick={() => onFilterChange('reset')}
                className="w-full text-xs font-bold text-[#007faf] hover:underline uppercase tracking-widest pt-2"
            >
                Clear all filters
            </button>
        </div>
    );
};

export default TrivagoFilterSidebar;
