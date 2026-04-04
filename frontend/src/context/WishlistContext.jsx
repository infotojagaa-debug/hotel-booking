import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import API from '../utils/api';
import { AuthContext } from './AuthContext';

export const WishlistContext = createContext();

export const WishlistProvider = ({ children }) => {
    const { userInfo } = useContext(AuthContext);
    const [wishlistIds, setWishlistIds] = useState(new Set()); // Set of hotel IDs for O(1) lookup
    const [wishlistCount, setWishlistCount] = useState(0);
    const [loading, setLoading] = useState(false);

    // Fetch full wishlist on login
    const fetchWishlist = useCallback(async () => {
        if (!userInfo) {
            setWishlistIds(new Set());
            setWishlistCount(0);
            return;
        }
        try {
            const { data } = await API.get('/wishlist');
            const ids = new Set(data.map(item => item.hotel?._id).filter(Boolean));
            setWishlistIds(ids);
            setWishlistCount(ids.size);
        } catch {
            // silently fail — user may not be logged in
        }
    }, [userInfo]);

    useEffect(() => {
        fetchWishlist();
    }, [fetchWishlist]);

    const toggleWishlist = async (hotelId) => {
        if (!userInfo) return { requiresLogin: true };
        setLoading(true);
        try {
            const { data } = await API.post(`/wishlist/toggle/${hotelId}`);
            if (data.saved) {
                setWishlistIds(prev => new Set([...prev, hotelId]));
                setWishlistCount(c => c + 1);
            } else {
                setWishlistIds(prev => {
                    const next = new Set(prev);
                    next.delete(hotelId);
                    return next;
                });
                setWishlistCount(c => Math.max(0, c - 1));
            }
            return { saved: data.saved };
        } catch (error) {
            console.error('Wishlist toggle failed', error);
            return { error: true };
        } finally {
            setLoading(false);
        }
    };

    const isSaved = (hotelId) => wishlistIds.has(hotelId);

    return (
        <WishlistContext.Provider value={{ wishlistIds, wishlistCount, toggleWishlist, isSaved, loading, fetchWishlist }}>
            {children}
        </WishlistContext.Provider>
    );
};

export const useWishlist = () => useContext(WishlistContext);
