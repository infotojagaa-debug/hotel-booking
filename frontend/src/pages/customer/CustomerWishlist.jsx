import React, { useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { WishlistContext } from '../../context/WishlistContext';
import API, { BACKEND_URL } from '../../utils/api';
import { FaHeart, FaMapMarkerAlt, FaRegHeart, FaPlus } from 'react-icons/fa';
import './dashboard.css';

const CustomerWishlist = () => {
    const { toggleWishlist } = useContext(WishlistContext);
    const [wishlistItems, setWishlistItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        let mounted = true;
        API.get('/wishlist')
            .then(({ data }) => {
                if (mounted) {
                    const items = (data || []).map(i => i.hotel).filter(Boolean);
                    setWishlistItems(items);
                }
            })
            .catch(err => console.error('Wishlist Fetch Error:', err))
            .finally(() => { if (mounted) setLoading(false); });
        return () => { mounted = false; };
    }, []);

    const handleRemove = async (e, id) => {
        e.preventDefault();
        e.stopPropagation();
        // Optimistic UI update
        setWishlistItems(prev => prev.filter(h => h._id !== id));
        try {
            await toggleWishlist(id);
        } catch (error) {
            console.error('Failed to remove from wishlist', error);
        }
    };

    if (loading) {
        return (
            <div className="cd-wishlist-grid">
                {[1, 2, 3].map(i => (
                    <div key={i} className="cd-hotel-card-v4 h-[380px] bg-white/50 animate-pulse rounded-2xl" />
                ))}
            </div>
        );
    }

    return (
        <div className="animate-fade-in">
            <div className="cd-section-header-v4">
                <h1 className="cd-welcome-title">Your Wishlist</h1>
                <p className="cd-welcome-sub">Explore your curated collection of luxury escapes.</p>
            </div>

            {wishlistItems.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-20 text-center bg-white/30 backdrop-blur-md rounded-[40px] border border-white/50 shadow-sm max-w-2xl mx-auto">
                    <div className="w-20 h-20 rounded-full bg-rose-50 flex items-center justify-center text-rose-300 text-3xl mb-6">
                        <FaRegHeart />
                    </div>
                    <h2 className="text-2xl font-bold text-slate-800 mb-2">It's quiet here...</h2>
                    <p className="text-slate-500 font-medium mb-10 max-w-xs leading-relaxed">Your favorites will appear here once you save them.</p>
                    <button onClick={() => navigate('/hotels')} className="cd-btn-gradient">
                         <FaPlus /> Discover Hotels
                    </button>
                </div>
            ) : (
                <div className="cd-wishlist-grid">
                    {wishlistItems.map((hotel, idx) => (
                        <div 
                            key={hotel._id || idx} 
                            className="cd-hotel-card-v4"
                            onClick={() => navigate(`/hotels/${hotel._id}`)}
                            style={{ animationDelay: `${idx * 0.1}s` }}
                        >
                            <div className="cd-hotel-image-v4">
                                <button 
                                    className="cd-wishlist-toggle-v4" 
                                    onClick={e => handleRemove(e, hotel._id)} 
                                    title="Remove from Wishlist"
                                >
                                    <FaHeart />
                                </button>
                                
                                <img 
                                    src={
                                        hotel.images?.[0] 
                                        ? (hotel.images[0].startsWith('http') ? hotel.images[0] : `${BACKEND_URL}${hotel.images[0]}`)
                                        : 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=600&q=80'
                                    } 
                                    alt={hotel.name} 
                                    loading="lazy"
                                />
                            </div>

                            <div className="cd-hotel-info-v4">
                                <h3 className="cd-hotel-name-v4 truncate">{hotel.name}</h3>
                                
                                <div className="cd-hotel-location-v4">
                                    <FaMapMarkerAlt className="text-slate-300" /> 
                                    {hotel.city || 'Global City'}
                                </div>
                                
                                <div className="cd-hotel-price-v4">
                                    <span className="text-[10px] text-slate-400 block uppercase tracking-wider font-bold mb-1">Starting From</span>
                                    ₹{hotel.pricePerNight?.toLocaleString() || '4,999'}
                                    <span className="text-xs text-slate-400 font-medium ml-1">/ night</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default CustomerWishlist;
