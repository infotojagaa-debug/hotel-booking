import React, { useState, useEffect, useCallback } from 'react';


// Dynamically import all images from the hero_section_image directory
const imageModules = import.meta.glob('../assets/hero_section_image/*.{jpg,jpeg,png,webp}', { eager: true });
const images = Object.values(imageModules).map(mod => mod.default);

console.log(`HeroSlider: Loaded ${images.length} images.`);

const HeroSlider = () => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isPaused, setIsPaused] = useState(false);
    const [progress, setProgress] = useState(0);

    const nextSlide = useCallback(() => {
        setCurrentIndex((prevIndex) => (prevIndex + 1) % images.length);
        setProgress(0); // Reset progress on manual or auto change
    }, []);

    useEffect(() => {
        if (isPaused) return;

        // Reset progress visually when starting
        const intervalTime = 8000;
        const startTime = Date.now();
        
        const interval = setInterval(() => {
            nextSlide();
        }, intervalTime);

        // Update progress bar
        const progressInterval = setInterval(() => {
            setProgress((prev) => Math.min(prev + (100 / (intervalTime / 100)), 100));
        }, 100);

        return () => {
            clearInterval(interval);
            clearInterval(progressInterval);
        };
    }, [isPaused, nextSlide]);

    return (
        <section 
            className={`hero-slider-wrap ${isPaused ? 'paused' : ''}`}
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => setIsPaused(false)}
        >
            {/* Background Layers for Smooth Fading */}
            {images.map((image, index) => (
                <div
                    key={index}
                    className={`slider-bg ${index === currentIndex ? 'active' : ''}`}
                    style={{ backgroundImage: `url(${image})` }}
                >
                    <div className="slider-zoom-layer" style={{ backgroundImage: `url(${image})` }}></div>
                </div>
            ))}

            <div 
                className="overlay" 
                style={{ 
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    background: 'linear-gradient(to bottom, rgba(0,0,0,0.45) 0%, rgba(0,0,0,0.82) 100%)',
                    zIndex: 2 
                }}
            ></div>
            
            {/* Progress Bar */}
            <div className="slider-progress-wrap">
                <div 
                    className="slider-progress-bar" 
                    style={{ width: `${isPaused ? progress : progress}%`, transition: isPaused ? 'none' : 'width 0.1s linear' }}
                ></div>
            </div>

            {/* Two-zone flex layout: heading floats in center, search anchors to bottom */}
            <div className="hero-content-layout">

                {/* Zone 1 — Centered Content (Title + Subtitle + Search Bar) */}
                <div className="hero-centered-layout animate-fade-up">
                    <div className="hero-heading-zone">
                        <h1 className="hero-title">
                            Discover Your <span className="text-gradient">Perfect Stay</span><br />
                            Across India
                            <svg className="hero-swoosh" viewBox="0 0 36 34" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ marginLeft: '10px' }}>
                                <path d="M11 28C11 28 5 18 10 7" stroke="#6d5dfc" strokeWidth="4" strokeLinecap="round"/>
                                <path d="M22 23C22 23 27 15 33 11" stroke="#6d5dfc" strokeWidth="4" strokeLinecap="round"/>
                            </svg>
                        </h1>
                        <p className="hero-subtitle" style={{ animationDelay: '0.2s' }}>
                            Book unique stays that bring travelers and locals together.<br />
                            Your gateway to shared adventures and luxury retreats.
                        </p>

                    </div>
                </div>

            </div>
        </section>
    );
};

export default HeroSlider;
