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
import { SiGooglepay, SiPhonepe, SiPaytm, SiApplepay, SiStripe, SiRazorpay, SiAmazonpay } from 'react-icons/si';
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
    const [reservationStep, setReservationStep] = useState(2); // Start at 2 since we skip guest details manually as requested
    const [guestDetails, setGuestDetails] = useState({ firstName: '', lastName: '', email: '', phone: '' });
    
    // Payment States
    const [upiId, setUpiId] = useState('');
    const [selectedApp, setSelectedApp] = useState('gpay');
    const [cardData, setCardData] = useState({ number: '', name: '', expiry: '', cvv: '' });
    const [selectedBank, setSelectedBank] = useState(null);
    const [selectedWallet, setSelectedWallet] = useState(null);

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
            } else if (activeTab === 'wallet') {
                setFormValid(selectedWallet !== null);
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
            <BookingStepper currentStep={3} />
            
            <div className="checkout-main-container container-elite">
                {/* 1. PAYMENT OPTIONS (LEFT) */}
                <div className="payment-stack">
                    <div className="wizard-step-card animate-fade-up">
                        <h2 className="step-title-premium">Payment Options</h2>
                        <p className="step-subtitle-premium">Select your preferred way to pay securely for this luxury stay.</p>
                        
                        <div className="payment-method-tabs">
                            {[
                                { id: 'upi', label: 'UPI', icon: <FaMobileAlt /> },
                                { id: 'card', label: 'Credit/Debit Card', icon: <FaCreditCard /> },
                                { id: 'netbanking', label: 'Net Banking', icon: <FaUniversity /> },
                                { id: 'wallet', label: 'Wallet', icon: <FaWalletIcon /> },
                                { id: 'pay_at_hotel', label: 'Pay at Hotel', icon: <FaRegMoneyBillAlt /> }
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
                                <div className="upi-pane-premium animate-zoom-in">
                                    <p className="pane-subtitle-p">Select a UPI App</p>
                                    <div className="upi-apps-grid-p">
                                        {[
                                            { id: 'gpay', name: 'Google Pay', icon: <SiGooglepay style={{ color: '#4285F4' }} /> },
                                            { id: 'phonepe', name: 'PhonePe', icon: <SiPhonepe style={{ color: '#5f259f' }} /> },
                                            { id: 'paytm', name: 'Paytm', icon: <SiPaytm style={{ color: '#00BAF2' }} /> },
                                            { id: 'amazon', name: 'Amazon Pay', icon: <FaAmazon style={{ color: '#FF9900' }} /> },
                                            { id: 'bhim', name: 'BHIM UPI', icon: <FaMobileAlt style={{ color: '#0f172a' }} /> },
                                            { id: 'cred', name: 'CRED Pay', icon: <FaShieldAlt style={{ color: '#1a1a1a' }} /> }
                                        ].map(app => (
                                            <div 
                                                key={app.id} 
                                                className={`upi-app-box ${selectedApp === app.id ? 'active' : ''}`}
                                                onClick={() => { setSelectedApp(app.id); setUpiId(''); setIsVerified(false); }}
                                            >
                                                <div className="app-icon-wrap">{app.icon}</div>
                                                <div className="app-name-p">{app.name}</div>
                                            </div>
                                        ))}
                                    </div>

                                    <div className="upi-id-divider">
                                        <span>OR ENTER UPI ID</span>
                                    </div>

                                    <div className="upi-input-group">
                                        <label>Virtual Payment Address (VPA)</label>
                                        <div className="flex gap-4">
                                            <input 
                                                type="email" 
                                                className="modern-input-p" 
                                                placeholder="username@bank"
                                                value={upiId}
                                                onChange={(e) => { setUpiId(e.target.value); setSelectedApp(null); setIsVerified(false); }}
                                            />
                                            <button 
                                                className={`verify-btn-p ${isVerified ? 'verified' : ''}`}
                                                disabled={upiId.length < 5 || isVerified || verifying}
                                                onClick={handleVerifyUpi}
                                            >
                                                {verifying ? '...' : isVerified ? 'Verified ✓' : 'Verify'}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'card' && (
                                <div className="card-pane-premium animate-zoom-in">
                                    <p className="pane-subtitle-p">Enter Card Details</p>
                                    <div className="card-input-grid">
                                        <div className="input-field-group full">
                                            <label>Card Number</label>
                                            <input name="number" placeholder="0000 0000 0000 0000" value={cardData.number} onChange={handleCardChange} className="modern-input-field" />
                                        </div>
                                        <div className="input-field-group full">
                                            <label>Name on Card</label>
                                            <input name="name" placeholder="John Doe" value={cardData.name} onChange={handleCardChange} className="modern-input-field" />
                                        </div>
                                        <div className="input-field-group">
                                            <label>Expiry Date</label>
                                            <input name="expiry" placeholder="MM/YY" value={cardData.expiry} onChange={handleCardChange} className="modern-input-field" />
                                        </div>
                                        <div className="input-field-group">
                                            <label>CVV</label>
                                            <input name="cvv" placeholder="•••" value={cardData.cvv} type="password" onChange={handleCardChange} className="modern-input-field" />
                                        </div>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'netbanking' && (
                                <div className="netbanking-pane-premium animate-zoom-in">
                                    <p className="pane-subtitle-p">Popular Banks</p>
                                    <div className="bank-grid-p">
                                        {['HDFC Bank', 'ICICI Bank', 'State Bank of India', 'Axis Bank', 'Kotak Mahindra', 'Yes Bank'].map(bank => (
                                            <div 
                                                key={bank} 
                                                className={`bank-box-p ${selectedBank === bank ? 'active' : ''}`}
                                                onClick={() => setSelectedBank(bank)}
                                            >
                                                <div className="bank-logo-placeholder">{bank.charAt(0)}</div>
                                                <span>{bank}</span>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="mt-6 input-field-group">
                                        <label>Other Banks</label>
                                        <select className="modern-input-field" onChange={(e) => setSelectedBank(e.target.value)}>
                                            <option value="">Select your bank...</option>
                                            <option value="IDFC First Bank">IDFC First Bank</option>
                                            <option value="Punjab National Bank">Punjab National Bank</option>
                                            <option value="Bank of Baroda">Bank of Baroda</option>
                                        </select>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'wallet' && (
                                <div className="wallet-pane-premium animate-zoom-in">
                                    <p className="pane-subtitle-p">Digital Wallets</p>
                                    <div className="wallet-grid-p">
                                        {[
                                            { id: 'amazon', name: 'Amazon Pay', icon: <SiAmazonpay style={{ color: '#FF9900' }} /> },
                                            { id: 'stripe', name: 'Stripe', icon: <SiStripe style={{ color: '#635BFF' }} /> },
                                            { id: 'razorpay', name: 'Razorpay', icon: <SiRazorpay style={{ color: '#3395FF' }} /> }
                                        ].map(wallet => (
                                            <div 
                                                key={wallet.id} 
                                                className={`wallet-box-p ${selectedWallet === wallet.id ? 'active' : ''}`}
                                                onClick={() => setSelectedWallet(wallet.id)}
                                            >
                                                <div className="wallet-icon-wrap">{wallet.icon}</div>
                                                <span className="wallet-name-p">{wallet.name}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {activeTab === 'pay_at_hotel' && (
                                <div className="pay-at-hotel-pane animate-zoom-in p-6 text-center border-2 border-dashed border-gray-200 rounded-2xl">
                                    <div className="text-4xl text-emerald-500 mb-4 flex justify-center"><FaCheckCircle /></div>
                                    <h3 className="text-xl font-bold mb-2">Zero Payment Now</h3>
                                    <p className="text-gray-500 mb-6">Secure this room immediately. You pay absolutely nothing today. Settle your final bill directly at the property during your stay.</p>
                                    <div className="bg-emerald-50 text-emerald-700 p-4 rounded-xl text-sm font-semibold inline-block">
                                        100% Secure reservation guaranteed.
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Pay Button */}
                        <div className="mt-8 pt-6 border-t border-gray-100">
                            <button 
                                className="pay-final-btn-p"
                                disabled={!formValid && activeTab !== 'pay_at_hotel'}
                                onClick={() => runSimulationSteps()}
                            >
                                <FaLock /> 
                                {activeTab === 'pay_at_hotel' ? 'Complete Reservation' : `Pay ₹${finalAmount.toLocaleString()} Securely`}
                            </button>
                            <div className="checkout-trust-badges">
                                <span className="trust-badge"><FaShieldAlt /> 256-bit Encryption</span>
                                <span className="trust-badge"><FaLockOpen /> Safe & Secure</span>
                            </div>
                        </div>
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
