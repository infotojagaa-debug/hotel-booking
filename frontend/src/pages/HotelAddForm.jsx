import React, { useState } from 'react';
import { FaWifi, FaCoffee, FaUtensils, FaSwimmingPool, FaDumbbell, FaCar, FaSnowflake, FaSpa, FaPaw, FaTv, FaCheck, FaSoap, FaMapMarkedAlt, FaBus, FaConciergeBell } from 'react-icons/fa';
import API from '../utils/api';

const AMENITY_ICONS = {
    'WiFi': <FaWifi />,
    'Breakfast': <FaCoffee />,
    'Restaurant': <FaUtensils />,
    'Pool': <FaSwimmingPool />,
    'Gym': <FaDumbbell />,
    'Parking': <FaCar />,
    'AC': <FaSnowflake />,
    'Spa': <FaSpa />,
    'Pet-friendly': <FaPaw />,
    'TV': <FaTv />,
};

const ADDON_ICONS = {
    'Breakfast': <FaCoffee />,
    'Airport Shuttle': <FaBus />,
    'Spa Package': <FaConciergeBell />,
    'Laundry Service': <FaSoap />,
    'Guided Tour': <FaMapMarkedAlt />,
};
import './HotelAddForm.css';

const AMENITIES = ['WiFi', 'Breakfast', 'Restaurant', 'Pool', 'Gym', 'Parking', 'AC', 'Spa', 'Pet-friendly', 'TV'];
const ADD_ONS = [
    { name: 'Breakfast', emoji: '🍳' },
    { name: 'Airport Shuttle', emoji: '🚐' },
    { name: 'Spa Package', emoji: '🧖' },
    { name: 'Laundry Service', emoji: '🫧' },
    { name: 'Guided Tour', emoji: '📖' },
];
const HOTEL_TYPES = ['Hotel', 'Apartment', 'Resort', 'Villa', 'Hostel', 'Guest House'];

const HotelAddForm = ({ onSuccess }) => {
    const [form, setForm] = useState({
        name: '', city: '', zipCode: '', address: '',
        locationHint: '', description: '', type: 'Hotel',
        starRating: 3, cheapestPrice: '', distanceFromCenter: '1km',
    });
    const [selectedAmenities, setSelectedAmenities] = useState([]);
    const [selectedAddOns, setSelectedAddOns] = useState([]);
    const [imageMode, setImageMode] = useState('upload'); // 'upload' | 'url'
    const [imageUrl, setImageUrl] = useState('');
    const [imageFile, setImageFile] = useState(null);
    const [imagePreview, setImagePreview] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [successMsg, setSuccessMsg] = useState('');
    const [errorMsg, setErrorMsg] = useState('');

    const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

    const toggleAmenity = (item) => {
        setSelectedAmenities(prev =>
            prev.includes(item) ? prev.filter(a => a !== item) : [...prev, item]
        );
    };

    const toggleAddOn = (name) => {
        setSelectedAddOns(prev =>
            prev.includes(name) ? prev.filter(a => a !== name) : [...prev, name]
        );
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setImageFile(file);
        setImagePreview(URL.createObjectURL(file));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        setErrorMsg('');

        try {
            let imagesList = [];

            if (imageMode === 'url' && imageUrl) {
                imagesList = [imageUrl];
            } else if (imageMode === 'upload' && imageFile) {
                const formData = new FormData();
                formData.append('image', imageFile);
                const { data } = await API.post('/upload', formData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
                imagesList = [data.url || data.imagePath];
            }

            const extraServices = selectedAddOns.map(name => ({ name, price: 0, icon: '' }));

            await API.post('/admin/hotels', {
                ...form,
                images: imagesList,
                amenities: selectedAmenities,
                extraServices,
                isAdminHotel: true,
                isApproved: true,
            });

            setSuccessMsg('Hotel registered successfully!');
            setTimeout(() => { if (onSuccess) onSuccess(); }, 1500);
        } catch (err) {
            setErrorMsg(err.response?.data?.message || 'Failed to add hotel. Please check all fields.');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="hotel-form-wrapper">
            {successMsg && <div className="form-alert form-alert-success"><i className="fas fa-check-circle"></i> {successMsg}</div>}
            {errorMsg && <div className="form-alert form-alert-error"><i className="fas fa-exclamation-circle"></i> {errorMsg}</div>}

            <form onSubmit={handleSubmit} className="hotel-add-form">

                {/* Row 1: Name + City */}
                <div className="form-row">
                    <div className="form-group">
                        <label>HOTEL NAME</label>
                        <input name="name" className="form-input" placeholder="Enter hotel name" value={form.name} onChange={handleChange} required />
                    </div>
                    <div className="form-group">
                        <label>CITY</label>
                        <input name="city" className="form-input" placeholder="Enter city name" value={form.city} onChange={handleChange} required />
                    </div>
                </div>

                {/* Row 2: ZIP + Address */}
                <div className="form-row">
                    <div className="form-group">
                        <label>ZIP CODE / PINCODE</label>
                        <input name="zipCode" className="form-input" placeholder="Enter zip or postal code" value={form.zipCode} onChange={handleChange} />
                    </div>
                    <div className="form-group">
                        <label>FULL ADDRESS</label>
                        <input name="address" className="form-input" placeholder="Enter complete hotel address" value={form.address} onChange={handleChange} required />
                    </div>
                </div>

                {/* Row 3: Location Hint */}
                <div className="form-group full-width">
                    <label>GENERAL LOCATION HINT (E.G. NEAR AIRPORT)</label>
                    <input name="locationHint" className="form-input" placeholder="Shortcut location for list view" value={form.locationHint} onChange={handleChange} />
                </div>

                {/* Row 4: Description */}
                <div className="form-group full-width">
                    <label>DESCRIPTION</label>
                    <textarea name="description" className="form-input form-textarea" placeholder="Write a compelling description of the property..." value={form.description} onChange={handleChange} required rows={4} />
                </div>

                {/* Row 5: Type + Star Rating + Price */}
                <div className="form-row form-row-three">
                    <div className="form-group">
                        <label>PROPERTY TYPE</label>
                        <select name="type" className="form-input" value={form.type} onChange={handleChange}>
                            {HOTEL_TYPES.map(t => <option key={t}>{t}</option>)}
                        </select>
                    </div>
                    <div className="form-group">
                        <label>STAR RATING</label>
                        <select name="starRating" className="form-input" value={form.starRating} onChange={handleChange}>
                            {[1,2,3,4,5].map(n => <option key={n} value={n}>{n} Star{n>1?'s':''}</option>)}
                        </select>
                    </div>
                    <div className="form-group">
                        <label>STARTING PRICE (₹)</label>
                        <input name="cheapestPrice" type="number" className="form-input" placeholder="e.g. 2500" value={form.cheapestPrice} onChange={handleChange} required />
                    </div>
                </div>

                {/* Add-on Services */}
                <div className="form-group full-width">
                    <label>ADD-ON SERVICES (EXTRAS)</label>
                    <div className="addon-row">
                        {ADD_ONS.map(addon => (
                            <button type="button" key={addon.name}
                                className={`addon-chip ${selectedAddOns.includes(addon.name) ? 'addon-chip-selected' : ''}`}
                                onClick={() => toggleAddOn(addon.name)}
                            >
                                <span className="chip-icon">{ADDON_ICONS[addon.name] || addon.emoji}</span> {addon.name}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Amenities Section */}
                <div className="form-group full-width">
                    <label>AMENITIES (Visual identification for accessibility)</label>
                    <div className="amenity-section-container">
                        <div className="amenity-grid">
                            {AMENITIES.map(item => (
                                <label key={item} className={`amenity-chip ${selectedAmenities.includes(item) ? 'amenity-chip-selected' : ''}`}>
                                    <input
                                        type="checkbox"
                                        checked={selectedAmenities.includes(item)}
                                        onChange={() => toggleAmenity(item)}
                                    />
                                    <span className="chip-icon">
                                        {AMENITY_ICONS[item] || <FaCheck />}
                                    </span>
                                    <span>{item}</span>
                                </label>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Property Images */}
                <div className="form-group full-width">
                    <label>PROPERTY IMAGES</label>
                    <div className="image-mode-tabs">
                        <button type="button" className={`mode-tab ${imageMode === 'upload' ? 'mode-tab-active' : ''}`} onClick={() => setImageMode('upload')}>
                            <i className="fas fa-upload"></i> Upload File
                        </button>
                        <button type="button" className={`mode-tab ${imageMode === 'url' ? 'mode-tab-active' : ''}`} onClick={() => setImageMode('url')}>
                            <i className="fas fa-link"></i> Image URL
                        </button>
                    </div>

                    {imageMode === 'upload' ? (
                        <label className="file-upload-zone">
                            {imagePreview
                                ? <img src={imagePreview} alt="preview" className="image-preview" />
                                : <>
                                    <i className="fas fa-cloud-upload-alt"></i>
                                    <span>Click or drag an image here</span>
                                    <small>PNG, JPG, WEBP up to 5MB</small>
                                  </>
                            }
                            <input type="file" accept="image/*" onChange={handleFileChange} style={{display:'none'}} />
                        </label>
                    ) : (
                        <input
                            type="url"
                            className="form-input"
                            placeholder="https://example.com/hotel-image.jpg"
                            value={imageUrl}
                            onChange={e => { setImageUrl(e.target.value); setImagePreview(e.target.value); }}
                        />
                    )}
                    {imagePreview && imageMode === 'url' && (
                        <img src={imagePreview} alt="preview" className="image-preview-url" onError={e => e.target.style.display='none'} />
                    )}
                </div>

                {/* Submit */}
                <div className="form-submit-row">
                    <button type="submit" className="form-submit-btn" disabled={submitting}>
                        {submitting ? <><i className="fas fa-spinner fa-spin"></i> Registering...</> : <><i className="fas fa-plus-circle"></i> Register Property</>}
                    </button>
                    <button type="button" className="form-cancel-btn" onClick={onSuccess}>
                        Cancel
                    </button>
                </div>

            </form>
        </div>
    );
};

export default HotelAddForm;
