import React, { useEffect } from 'react';
import { FaTimes, FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import './ImageLightbox.css';

const ImageLightbox = ({ images, currentIndex, onClose, onPrev, onNext }) => {
    // Handle escape key
    useEffect(() => {
        const handleEsc = (e) => {
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', handleEsc);
        // Prevent scrolling background
        document.body.style.overflow = 'hidden';
        
        return () => {
            window.removeEventListener('keydown', handleEsc);
            document.body.style.overflow = 'unset';
        };
    }, [onClose]);

    if (!images || images.length === 0) return null;

    return (
        <div className="lightbox-overlay" onClick={onClose}>
            <button className="lightbox-close" onClick={onClose}>
                <FaTimes />
            </button>
            
            <div className="lightbox-content" onClick={(e) => e.stopPropagation()}>
                {images.length > 1 && (
                    <button className="lightbox-nav prev" onClick={onPrev}>
                        <FaChevronLeft />
                    </button>
                )}
                
                <img src={images[currentIndex]} alt={`Preview ${currentIndex}`} className="lightbox-image" />
                
                {images.length > 1 && (
                    <button className="lightbox-nav next" onClick={onNext}>
                        <FaChevronRight />
                    </button>
                )}
                
                <div className="lightbox-caption">
                    Image {currentIndex + 1} of {images.length}
                </div>
            </div>
        </div>
    );
};

export default ImageLightbox;
