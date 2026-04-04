import React from 'react';
import { FaSlidersH, FaStar, FaMoneyBillWave } from 'react-icons/fa';

const RoyalFilterSidebar = ({ filters, onFilterChange }) => {

    const ratings = [
        { label: '4+ Stars', val: 4, stars: 4 },
        { label: '3+ Stars', val: 3, stars: 3 },
        { label: '2+ Stars', val: 2, stars: 2 }
    ];

    return (
        <div className="bg-[#ebf0e6] p-8 rounded-3xl space-y-10 shadow-sm border border-white/40 sticky top-28">
            {/* Header */}
            <div className="flex items-center gap-3 text-royal-sage">
                <FaSlidersH className="text-xl" />
                <h3 className="text-lg font-black uppercase tracking-widest">Filters</h3>
            </div>

            {/* Price Range */}
            <div>
                <label className="flex items-center gap-2 text-royal-dark font-black mb-4 uppercase text-xs tracking-wider">
                    <span className="text-royal-sage text-sm">$</span> Price Range
                </label>
                <div className="flex items-center gap-2">
                    <input 
                        type="number" 
                        placeholder="Min"
                        className="w-full bg-white h-12 rounded-xl px-4 text-sm font-bold border-2 border-transparent focus:border-royal-sage outline-none shadow-inner"
                        onChange={(e) => onFilterChange('minPrice', e.target.value)}
                    />
                    <span className="text-gray-400 font-bold">-</span>
                    <input 
                        type="number" 
                        placeholder="Max"
                        className="w-full bg-white h-12 rounded-xl px-4 text-sm font-bold border-2 border-transparent focus:border-royal-sage outline-none shadow-inner"
                        value={filters.maxPrice}
                        onChange={(e) => onFilterChange('maxPrice', e.target.value)}
                    />
                </div>
            </div>

            {/* Minimum Rating */}
            <div>
                <label className="flex items-center gap-2 text-royal-dark font-black mb-4 uppercase text-xs tracking-wider">
                    <FaStar className="text-royal-sage text-sm" /> Minimum Rating
                </label>
                <div className="space-y-4">
                    {ratings.map(rating => (
                        <label key={rating.val} className="flex items-center gap-3 cursor-pointer group">
                            <div className="relative flex items-center justify-center">
                                <input 
                                    type="radio" 
                                    name="minRating"
                                    checked={filters.minRating === rating.val}
                                    onChange={() => onFilterChange('minRating', rating.val)}
                                    className="appearance-none h-5 w-5 border-2 border-gray-300 rounded-full checked:border-royal-sage transition-all"
                                />
                                {filters.minRating === rating.val && (
                                    <div className="absolute w-2.5 h-2.5 bg-royal-sage rounded-full"></div>
                                )}
                            </div>
                            <div className="flex items-center gap-1.5 ml-1">
                                <span className="text-sm font-bold text-gray-700">{rating.label}</span>
                                <div className="flex text-[#ffb700] text-[10px]">
                                    {[...Array(rating.stars)].map((_, i) => <FaStar key={i} />)}
                                </div>
                            </div>
                        </label>
                    ))}
                </div>
            </div>

            {/* Clear Button */}
            <button 
                onClick={() => onFilterChange('reset')}
                className="w-full py-4 mt-4 bg-white/60 hover:bg-white text-royal-sage text-[10px] font-black uppercase tracking-widest rounded-2xl border-2 border-dashed border-royal-sage/30 transition-all"
            >
                Clear all filters
            </button>
        </div>
    );
};

export default RoyalFilterSidebar;
