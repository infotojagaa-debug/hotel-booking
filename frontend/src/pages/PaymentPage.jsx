import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { 
    FaCcVisa, FaCcMastercard, FaMobileAlt, FaUniversity, 
    FaWallet, FaRegMoneyBillAlt, FaLock, FaCheckCircle,
    FaArrowRight, FaMapMarkerAlt, FaCalendarAlt, FaUsers,
    FaChevronRight, FaCreditCard, FaTag, FaInfoCircle,
    FaTimes, FaWallet as FaWalletIcon, FaAmazon, FaShieldAlt,
    FaFingerprint, FaLockOpen
} from 'react-icons/fa';
import { SiGooglepay, SiPhonepe, SiPaytm, SiApplepay } from 'react-icons/si';
import BookingStepper from '../components/BookingStepper';
import HotelMap from '../components/HotelMap';
import API from '../utils/api';
import './PaymentPage.css';

const PaymentPage = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { roomId, checkIn, checkOut, nights, totalPrice, discountAmount = 0, bestOffer, room } = location.state || {};

    const [activeTab, setActiveTab] = useState('upi');
    const [loading, setLoading] = useState(false);
    const [formValid, setFormValid] = useState(false);

    // --- REAL-TIME CHECKOUT SIMULATION ---
    const [isProcessing, setIsProcessing] = useState(false);
    const [processStatus, setProcessStatus] = useState('');
    const [processStep, setProcessStep] = useState(0); // 0-selection, 1-authenticating, 2-authorizing, 3-finalizing
    const [isVerified, setIsVerified] = useState(false);
    const [verifying, setVerifying] = useState(false);
    const [reservationStep, setReservationStep] = useState(1); // 1-Details, 2-Payment, 3-Confirm
    const [guestDetails, setGuestDetails] = useState({ firstName: '', lastName: '', email: '', phone: '' });
    
    // Payment States
    const [upiId, setUpiId] = useState('');
    const [selectedApp, setSelectedApp] = useState('gpay');
    const [cardData, setCardData] = useState({ number: '', name: '', expiry: '', cvv: '' });
    const [selectedBank, setSelectedBank] = useState(null);
    const [selectedWallet, setSelectedWallet] = useState('paytm');

    // Promotion / Calculation
    const basePrice = totalPrice || 0;
    const nightCount = nights || 1;
    const promotionDiscount = discountAmount || 0;
    const discountedSubtotal = basePrice - promotionDiscount;
    const taxesAndFees = Math.round(discountedSubtotal * 0.12); // GST 12%
    const serviceCharge = Math.round(discountedSubtotal * 0.05); // 5% Service Charge
    const finalAmount = discountedSubtotal + taxesAndFees + serviceCharge;

    useEffect(() => {
        if (!roomId || !room) { navigate('/'); }
    }, [roomId, room, navigate]);

    // Validation
    useEffect(() => {
        if (reservationStep === 1) {
            setFormValid(guestDetails.firstName && guestDetails.lastName && guestDetails.email.includes('@') && guestDetails.phone.length >= 10);
        } else if (reservationStep === 2) {
            if (activeTab === 'card') {
                const isVal = cardData.number.replace(/\s/g, '').length === 16 && cardData.name.length > 2 && cardData.expiry.length === 5 && cardData.cvv.length === 3;
                setFormValid(isVal);
            } else if (activeTab === 'upi') {
                setFormValid(selectedApp !== null || (upiId.includes('@') && isVerified));
            } else if (activeTab === 'netbanking') {
                setFormValid(selectedBank !== null);
            } else {
                setFormValid(true);
            }
        } else {
            setFormValid(true);
        }
    }, [reservationStep, guestDetails, activeTab, cardData, upiId, selectedApp, selectedBank, isVerified]);

    const handleCardChange = (e) => {
        let { name, value } = e.target;
        if (name === 'number') {
            value = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '').substring(0, 16);
            value = value.match(/.{1,4}/g)?.join(' ') || value;
        }
        if (name === 'expiry') {
            value = value.replace(/[^0-9/]/g, '').substring(0, 5);
            if (value.length === 2 && !value.includes('/')) value += '/';
        }
        if (name === 'cvv') value = value.replace(/[^0-9]/g, '').substring(0, 3);
        setCardData({ ...cardData, [name]: value });
    };

    const handleVerifyUpi = () => {
        if (!upiId.includes('@')) return;
        setVerifying(true);
        setTimeout(() => {
            setVerifying(false);
            setIsVerified(true);
        }, 1200);
    };

    const runSimulationSteps = () => {
        const onlineSteps = [
            "Authenticating with secure gateway...",
            "Requesting authorization from bank...",
            "Encrypting payment details...",
            "Finalizing your luxury reservation..."
        ];

        const payAtHotelSteps = [
            "Connecting with property...",
            "Verifying room availability...",
            "Securing your booking...",
            "Generating confirmation receipt..."
        ];

        const steps = activeTab === 'pay_at_hotel' ? payAtHotelSteps : onlineSteps;
        
        let current = 0;
        setProcessStatus(steps[0]);
        setIsProcessing(true);

        const interval = setInterval(() => {
            current++;
            if (current < steps.length) {
                setProcessStatus(steps[current]);
            } else {
                clearInterval(interval);
                finalizeBooking();
            }
        }, 900);
    };

    const finalizeBooking = async () => {
        try {
            const bookingPayload = {
                roomId: roomId || room?._id,
                checkInDate: checkIn || new Date().toISOString(),
                checkOutDate: checkOut || new Date(Date.now() + 86400000).toISOString(),
                totalPrice: finalAmount,
                paymentMethod: activeTab,
            };
            const { data } = await API.post('/bookings', bookingPayload);
            navigate('/success', { state: { bookingId: data._id } });
        } catch (error) {
            alert('Something went wrong. Redirecting home.');
            navigate('/');
        }
    };

    return (
        <div className="checkout-page-root">
            <div className="checkout-bg-decoration" />
            <BookingStepper currentStep={reservationStep === 3 ? 3 : reservationStep} />
            
            <div className="checkout-main-container container-elite">
                {/* 1. RESERVATION WIZARD (LEFT) */}
                <div className="payment-stack">
                    
                    {/* STEP 1: GUEST DETAILS */}
                    {reservationStep === 1 && (
                        <div className="wizard-step-card animate-fade-up">
                            <h2 className="step-title-premium">Enter Your Details</h2>
                            <p className="step-subtitle-premium">We'll use these to secure your luxury reservation.</p>
                            
                            <div className="guest-form-grid">
                                <div className="input-field-group">
                                    <label>First Name</label>
                                    <input 
                                        type="text" placeholder="e.g. John" className="modern-input-field" 
                                        value={guestDetails.firstName} onChange={(e) => setGuestDetails({...guestDetails, firstName: e.target.value})}
                                    />
                                </div>
                                <div className="input-field-group">
                                    <label>Last Name</label>
                                    <input 
                                        type="text" placeholder="e.g. Doe" className="modern-input-field"
                                        value={guestDetails.lastName} onChange={(e) => setGuestDetails({...guestDetails, lastName: e.target.value})}
                                    />
                                </div>
                                <div className="input-field-group full">
                                    <label>Email Address</label>
                                    <input 
                                        type="email" placeholder="john@example.com" className="modern-input-field"
                                        value={guestDetails.email} onChange={(e) => setGuestDetails({...guestDetails, email: e.target.value})}
                                    />
                                </div>
                                <div className="input-field-group full">
                                    <label>Phone Number</label>
                                    <input 
                                        type="tel" placeholder="+91 00000 00000" className="modern-input-field"
                                        value={guestDetails.phone} onChange={(e) => setGuestDetails({...guestDetails, phone: e.target.value})}
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* STEP 2: PAYMENT METHOD */}
                    {reservationStep === 2 && (
                        <div className="wizard-step-card animate-fade-up">
                            <h2 className="step-title-premium">Payment Method</h2>
                            <p className="step-subtitle-premium">Select your preferred way to pay for this stay.</p>
                            
                            <div className="payment-method-tabs">
                                {[
                                    { id: 'upi', label: 'UPI', icon: <FaMobileAlt /> },
                                    { id: 'card', label: 'Card', icon: <FaCreditCard /> },
                                    { id: 'netbanking', label: 'Bank', icon: <FaUniversity /> },
                                    { id: 'pay_at_hotel', label: 'Pay Later', icon: <FaRegMoneyBillAlt /> }
                                ].map(tab => (
                                    <button 
                                        key={tab.id}
                                        className={`method-tab-btn ${activeTab === tab.id ? 'is-active' : ''}`}
                                        onClick={() => setActiveTab(tab.id)}
                                    >
                                        <div className="method-icon">{tab.icon}</div>
                                        <span>{tab.label}</span>
                                    </button>
                                ))}
                            </div>

                            <div className="method-content-pane">
                                {activeTab === 'upi' && (
                                    <div className="upi-pane-premium">
                                        <div className="upi-apps-row">
                                            {['gpay', 'phonepe', 'paytm'].map(app => (
                                                <div 
                                                    key={app} 
                                                    className={`upi-app-pill ${selectedApp === app ? 'is-selected' : ''}`}
                                                    onClick={() => setSelectedApp(app)}
                                                >
                                                    {app === 'gpay' && <SiGooglepay />}
                                                    {app === 'phonepe' && <SiPhonepe />}
                                                    {app === 'paytm' && <SiPaytm />}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                                {activeTab === 'card' && (
                                    <div className="card-pane-premium">
                                        <div className="card-mock-input">
                                            <input name="number" placeholder="Card Number" value={cardData.number} onChange={handleCardChange} className="modern-input-field mb-4" />
                                            <div className="flex gap-4">
                                                <input name="expiry" placeholder="MM/YY" value={cardData.expiry} onChange={handleCardChange} className="modern-input-field" />
                                                <input name="cvv" placeholder="CVV" value={cardData.cvv} type="password" onChange={handleCardChange} className="modern-input-field" />
                                            </div>
                                        </div>
                                    </div>
                                )}
                                {activeTab === 'pay_at_hotel' && (
                                    <div className="pay-later-notice">
                                        <div className="notice-icon"><FaShieldAlt /></div>
                                        <p>Secure this room now with <strong>Zero payment</strong>. Pay at the property during your stay.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* STEP 3: FINAL CONFIRMATION */}
                    {reservationStep === 3 && (
                        <div className="wizard-step-card animate-fade-up">
                            <h2 className="step-title-premium">Final Review</h2>
                            <p className="step-subtitle-premium">Double check everything before completing your booking.</p>
                            
                            <div className="final-review-grid">
                                <div className="review-item">
                                    <label>Guest</label>
                                    <p>{guestDetails.firstName} {guestDetails.lastName}</p>
                                </div>
                                <div className="review-item">
                                    <label>Contact</label>
                                    <p>{guestDetails.email}</p>
                                </div>
                                <div className="review-item">
                                    <label>Payment</label>
                                    <p className="capitalize">{activeTab.replace(/_/g, ' ')}</p>
                                </div>
                                <div className="review-item highlight">
                                    <label>Total to Pay</label>
                                    <p>₹{finalAmount.toLocaleString()}</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Wizard Controls */}
                    <div className="wizard-controls">
                        {reservationStep > 1 && (
                            <button className="btn-wizard-back" onClick={() => setReservationStep(prev => prev - 1)}>
                                Back
                            </button>
                        )}
                        <button 
                            className="btn-wizard-next btn-elite-primary" 
                            disabled={!formValid}
                            onClick={() => {
                                if (reservationStep < 3) setReservationStep(prev => prev + 1);
                                else runSimulationSteps();
                            }}
                        >
                            <span>{reservationStep === 3 ? 'Confirm & Book' : 'Continue'}</span>
                            <FaChevronRight />
                        </button>
                    </div>

                    <div className="checkout-trust-badges">
                        <div className="trust-badge"><FaLock /> 256-bit SSL</div>
                        <div className="trust-badge"><FaShieldAlt /> Secure Payments</div>
                    </div>
                </div>

                {/* 2. BOOKING SUMMARY (RIGHT - STICKY) */}
                <div className="summary-stack">
                    <div className="summary-sticky-card">
                        <div className="summary-image-p">
                            <img src={room.images?.[0] || 'https://images.unsplash.com/photo-1566073771259-6a8506099945'} alt="hotel" />
                            {promotionDiscount > 0 && <div className="save-badge-p">YOU SAVED ₹{promotionDiscount.toLocaleString()}</div>}
                        </div>
                        
                        <div className="summary-info-p">
                            <h2 className="hotel-name-p">{room.hotel?.name || 'Luxury Suite'}</h2>
                            <p className="hotel-loc-p"><FaMapMarkerAlt /> {room.hotel?.district || room.hotel?.city || 'Elite Location'} District</p>
                            
                            <div className="stay-details-card-p">
                                <div className="stay-seg">
                                    <label>IN</label>
                                    <p>{new Date(checkIn).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</p>
                                </div>
                                <div className="stay-divider" />
                                <div className="stay-seg">
                                    <label>OUT</label>
                                    <p>{new Date(checkOut).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</p>
                                </div>
                                <div className="stay-divider" />
                                <div className="stay-seg">
                                    <label>ROOM</label>
                                    <p>{room.name || 'Premium Room'}</p>
                                </div>
                            </div>

                            <div className="detailed-price-p">
                                <div className="price-line-p">
                                    <span>Room Base Price ({nightCount} {nightCount > 1 ? 'nights' : 'night'})</span>
                                    <span>₹{basePrice.toLocaleString()}</span>
                                </div>
                                {promotionDiscount > 0 && (
                                    <div className="price-line-p discount highlight">
                                        <div className="flex items-center gap-1">
                                            <FaTag /> <span>Special Offer Applied</span>
                                        </div>
                                        <span>-₹{promotionDiscount.toLocaleString()}</span>
                                    </div>
                                )}
                                <div className="price-line-p">
                                    <span>Taxes & Service Fees</span>
                                    <span>₹{(taxesAndFees + serviceCharge).toLocaleString()}</span>
                                </div>
                                
                                <div className="dashed-separator-p" />
                                
                                <div className="total-main-p">
                                    <div className="total-label-p">
                                        <span>Total Amount</span>
                                        {promotionDiscount > 0 && <span className="green-pill-p">Offers Applied</span>}
                                    </div>
                                    <span className="total-val-p">₹{finalAmount.toLocaleString()}</span>
                                </div>
                            </div>

                            {/* 📍 Non-interactive Map Preview */}
                            <div className="payment-map-preview" style={{ height: '140px', marginTop: '24px', borderRadius: '16px', overflow: 'hidden', border: '1px solid #f1f5f9', position: 'relative' }}>
                                <HotelMap 
                                    hotels={[room.hotel]} 
                                    center={{ lat: room.hotel?.latitude || 13.08, lng: room.hotel?.longitude || 80.27 }}
                                />
                                <div style={{ position: 'absolute', inset: 0, zIndex: 10, cursor: 'default' }} /> {/* Overlay to prevent interaction */}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* FULL-SCREEN PROCESSING OVERLAY */}
            {isProcessing && (
                <div className="gate-processing-overlay animate-fade-in">
                    <div className="overlay-content animate-zoom-in">
                        <div className="mega-spinner-p">
                            <div className="spinner-inner-p" />
                            <FaLock className="lock-icon-p" />
                        </div>
                        <h3 className="status-title-p">{processStatus}</h3>
                        <p className="status-subtitle-p">Please do not refresh or press back button.</p>
                        <div className="secure-line-p">
                            <FaShieldAlt /> Verified Secure Transaction
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PaymentPage;
