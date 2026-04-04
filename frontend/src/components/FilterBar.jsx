import React from 'react';
import './FilterBar.css';

const FilterBar = ({ filters, onFilterChange }) => {

    const handleAmenityChange = (amenity) => {
        const currentAmenities = [...filters.amenities];
        if (currentAmenities.includes(amenity)) {
            onFilterChange({ amenities: currentAmenities.filter(a => a !== amenity) });
        } else {
            onFilterChange({ amenities: [...currentAmenities, amenity] });
        }
    };

    return (
        <div className="trivago-sidebar">
            {/* Map View Placeholder Button */}
            <div className="sidebar-map-container">
                <button className="view-map-btn" style={{ background: '#e5e7eb', width: '100%', height: '90px' }}>
                    <span className="map-btn-text"><i className="fas fa-map-marker-alt"></i> View on map</span>
                </button>
            </div>

            <div className="sidebar-filter-section">
                <h3>Popular filters</h3>
                <div className="checkbox-group">
                    <label className="custom-checkbox">
                        <input type="checkbox" checked={filters.amenities.includes('Breakfast')} onChange={() => handleAmenityChange('Breakfast')} />
                        <span className="checkmark"></span>
                        Breakfast included
                    </label>
                    <label className="custom-checkbox">
                        <input type="checkbox" checked={filters.amenities.includes('Free WiFi')} onChange={() => handleAmenityChange('Free WiFi')} />
                        <span className="checkmark"></span>
                        Free WiFi
                    </label>
                    <label className="custom-checkbox">
                        <input type="checkbox" checked={filters.amenities.includes('Pool')} onChange={() => handleAmenityChange('Pool')} />
                        <span className="checkmark"></span>
                        Pool
                    </label>
                    <label className="custom-checkbox">
                        <input type="checkbox" checked={filters.amenities.includes('Parking')} onChange={() => handleAmenityChange('Parking')} />
                        <span className="checkmark"></span>
                        Parking
                    </label>
                </div>
            </div>

            <div className="sidebar-filter-section">
                <h3>Price per night</h3>
                <div className="price-inputs">
                    <div className="price-input-wrapper">
                        <span>$</span>
                        <input 
                            type="number" 
                            placeholder="Min" 
                            value={filters.minPrice}
                            onChange={(e) => onFilterChange({ minPrice: e.target.value })}
                        />
                    </div>
                    <span>-</span>
                    <div className="price-input-wrapper">
                        <span>$</span>
                        <input 
                            type="number" 
                            placeholder="Max" 
                            value={filters.maxPrice}
                            onChange={(e) => onFilterChange({ maxPrice: e.target.value })}
                        />
                    </div>
                </div>
            </div>

            <div className="sidebar-filter-section">
                <h3>Hotel class</h3>
                <div className="star-rating-buttons">
                    {[5, 4, 3, 2].map(star => (
                        <button 
                            key={star}
                            className={`star-btn ${filters.starRating === star.toString() ? 'active' : ''}`}
                            onClick={() => onFilterChange({ starRating: filters.starRating === star.toString() ? '' : star.toString() })}
                        >
                            {star} <i className="fas fa-star"></i>
                        </button>
                    ))}
                </div>
            </div>

            <div className="sidebar-filter-section">
                <h3>Guest rating</h3>
                <div className="radio-group">
                    <label className="custom-radio">
                        <input type="radio" name="rating" />
                        <span className="radio-mark"></span>
                        Excellent 8.5+
                    </label>
                    <label className="custom-radio">
                        <input type="radio" name="rating" />
                        <span className="radio-mark"></span>
                        Very good 8.0+
                    </label>
                    <label className="custom-radio">
                        <input type="radio" name="rating" />
                        <span className="radio-mark"></span>
                        Good 7.5+
                    </label>
                </div>
            </div>

        </div>
    );
};

export default FilterBar;
