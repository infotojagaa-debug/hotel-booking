import React from 'react';
import { FaCalendarAlt, FaUsers, FaTag, FaTimes } from 'react-icons/fa';
import './BookingSummaryBar.css';

const BookingSummaryBar = ({ searchData, activeOffer, onClear }) => {
    if (!searchData && !activeOffer) return null;

    const { location, checkIn, checkOut, adults, children, rooms } = searchData || {};
    const totalGuests = Number(adults || 0) + Number(children || 0);

    return (
        <div className="booking-summary-sticky-bar">
            <div className="summary-bar-content container">
                <div className="summary-left-info">
                    <div className="summary-item">
                        <FaCalendarAlt className="summary-icon" />
                        <div className="summary-text">
                            <span className="summary-label">Dates</span>
                            <span className="summary-value">
                                {checkIn && checkOut 
                                    ? `${new Date(checkIn).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} - ${new Date(checkOut).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}`
                                    : 'Select dates'}
                            </span>
                        </div>
                    </div>
                    <div className="summary-divider"></div>
                    <div className="summary-item">
                        <FaUsers className="summary-icon" />
                        <div className="summary-text">
                            <span className="summary-label">Guests</span>
                            <span className="summary-value">{totalGuests} Guests • {rooms} Room{rooms > 1 ? 's' : ''}</span>
                        </div>
                    </div>
                </div>

                <div className="summary-right-actions">
                    {activeOffer && (
                        <div className="summary-offer-badge">
                            <FaTag className="offer-icon-small" />
                            <span>{activeOffer.title} Applied</span>
                        </div>
                    )}
                    <button className="summary-reset-btn" onClick={onClear} title="Clear search context">
                        <FaTimes />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default BookingSummaryBar;
