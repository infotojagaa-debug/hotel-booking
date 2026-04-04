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
        if (activeTab === 'card') {
            const isVal = cardData.number.replace(/\s/g, '').length === 16 && cardData.name.length > 2 && cardData.expiry.length === 5 && cardData.cvv.length === 3;
            setFormValid(isVal);
        } else if (activeTab === 'upi') {
            setFormValid(selectedApp !== null || (upiId.includes('@') && isVerified));
        } else if (activeTab === 'netbanking') {
            setFormValid(selectedBank !== null);
        } else if (activeTab === 'pay_at_hotel') {
            setFormValid(true);
        } else {
            setFormValid(true);
        }
    }, [activeTab, cardData, upiId, selectedApp, selectedBank, isVerified]);

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
            <BookingStepper currentStep={3} />
            
            <div className="checkout-main-container">
                {/* 1. PAYMENT SECTION (LEFT) */}
                <div className="payment-stack">
                    <h1 className="payment-page-title">Choose Payment Method</h1>
                    
                    <div className="payment-options-card">
                        {/* Tabs */}
                        <div className="payment-tabs-row">
                            {[
                                { id: 'upi', label: 'UPI', icon: <FaMobileAlt /> },
                                { id: 'card', label: 'Cards', icon: <FaCreditCard /> },
                                { id: 'netbanking', label: 'Netbanking', icon: <FaUniversity /> },
                                { id: 'wallet', label: 'Wallets', icon: <FaWallet /> },
                                { id: 'pay_at_hotel', label: 'Pay at Hotel', icon: <FaRegMoneyBillAlt /> }
                            ].map(tab => (
                                <button 
                                    key={tab.id}
                                    className={`tab-item-p ${activeTab === tab.id ? 'active' : ''}`}
                                    onClick={() => setActiveTab(tab.id)}
                                >
                                    {tab.icon} <span>{tab.label}</span>
                                </button>
                            ))}
                        </div>

                        {/* Content */}
                        <div className="tab-content-p">
                            {activeTab === 'upi' && (
                                <div className="upi-pane animate-fade-in">
                                    <p className="pane-subtitle-p">Recommended Apps</p>
                                    <div className="upi-apps-grid-p">
                                        {[
                                            { id: 'gpay', name: 'Google Pay', icon: <SiGooglepay className="text-[#4285F4]" /> },
                                            { id: 'phonepe', name: 'PhonePe', icon: <SiPhonepe className="text-[#5f259f]" /> },
                                            { id: 'paytm', name: 'Paytm', icon: <SiPaytm className="text-[#00baf2]" /> }
                                        ].map(app => (
                                            <div 
                                                key={app.id} 
                                                className={`upi-app-box ${selectedApp === app.id ? 'active' : ''}`}
                                                onClick={() => { setSelectedApp(app.id); setUpiId(''); setIsVerified(false); }}
                                            >
                                                <div className="app-icon-wrap">{app.icon}</div>
                                                <span className="app-name-p">{app.name}</span>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="upi-id-divider"><span>OR</span></div>
                                    <div className="upi-input-group">
                                        <label>Enter UPI ID</label>
                                        <div className="flex gap-3">
                                            <input 
                                                type="text" 
                                                placeholder="username@bank" 
                                                className="modern-input-p"
                                                value={upiId}
                                                onChange={(e) => { 
                                                    setUpiId(e.target.value); 
                                                    setIsVerified(false);
                                                    setSelectedApp(null);
                                                }}
                                            />
                                            <button 
                                                className={`verify-btn-p ${isVerified ? 'verified' : ''}`}
                                                onClick={handleVerifyUpi}
                                                disabled={verifying || isVerified || !upiId.includes('@')}
                                            >
                                                {verifying ? '...' : isVerified ? 'Verified' : 'Verify'}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'card' && (
                                <div className="card-pane animate-fade-in">
                                    <div className="card-input-grid">
                                        <div className="full-width">
                                            <label>Card Number</label>
                                            <input name="number" type="text" className="modern-input-p" placeholder="0000 0000 0000 0000" value={cardData.number} onChange={handleCardChange} />
                                        </div>
                                        <div className="full-width">
                                            <label>Card Holder Name</label>
                                            <input name="name" type="text" className="modern-input-p" placeholder="Enter Full Name" value={cardData.name} onChange={handleCardChange} />
                                        </div>
                                        <div>
                                            <label>Expiry Date</label>
                                            <input name="expiry" type="text" className="modern-input-p" placeholder="MM/YY" value={cardData.expiry} onChange={handleCardChange} />
                                        </div>
                                        <div>
                                            <label>CVV</label>
                                            <input name="cvv" type="password" className="modern-input-p" placeholder="***" value={cardData.cvv} onChange={handleCardChange} />
                                        </div>
                                    </div>
                                    <div className="card-trust-row mt-4 flex items-center gap-2 text-slate-400 text-[10px] font-bold uppercase tracking-widest">
                                        <FaShieldAlt className="text-emerald-500" />
                                        <span>256-bit SSL Encrypted Payment</span>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'netbanking' && (
                                <div className="nb-pane animate-fade-in">
                                    <p className="pane-subtitle-p">Popular Banks</p>
                                    <div className="bank-grid-p">
                                        {['SBI', 'HDFC', 'ICICI', 'Axis'].map(bank => (
                                            <div 
                                                key={bank} 
                                                className={`bank-box-p ${selectedBank === bank ? 'active' : ''}`}
                                                onClick={() => setSelectedBank(bank)}
                                            >
                                                <div className="bank-logo-placeholder">{bank[0]}</div>
                                                <span>{bank} Bank</span>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="mt-8">
                                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 block">Choose another bank</label>
                                        <select className="modern-select-p" onChange={e => setSelectedBank(e.target.value)}>
                                            <option value="">Select your bank</option>
                                            <option>Yes Bank</option>
                                            <option>Kotak Mahindra</option>
                                            <option>Bank of Baroda</option>
                                            <option>Punjab National Bank</option>
                                        </select>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'wallet' && (
                                <div className="wallet-pane animate-fade-in">
                                    <div className="wallet-list-p">
                                        {[
                                            { id: 'paytm', name: 'Paytm Wallet', icon: <SiPaytm className="text-[#00baf2]" /> },
                                            { id: 'amazon', name: 'Amazon Pay', icon: <FaAmazon className="text-[#ff9900]" /> },
                                            { id: 'phonepe', name: 'PhonePe Wallet', icon: <SiPhonepe className="text-[#5f259f]" /> }
                                        ].map(wallet => (
                                            <div 
                                                key={wallet.id} 
                                                className={`wallet-item-p ${selectedWallet === wallet.id ? 'active' : ''}`}
                                                onClick={() => setSelectedWallet(wallet.id)}
                                            >
                                                <div className="flex items-center gap-4">
                                                    <div className="wallet-icon-p">{wallet.icon}</div>
                                                    <span className="font-bold text-slate-700">{wallet.name}</span>
                                                </div>
                                                <div className={`radio-dot-p ${selectedWallet === wallet.id ? 'active' : ''}`} />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {activeTab === 'pay_at_hotel' && (
                                <div className="pay-at-hotel-pane animate-fade-in text-center py-10 px-6">
                                    <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-6">
                                        <FaRegMoneyBillAlt className="text-3xl text-emerald-500" />
                                    </div>
                                    <h3 className="text-xl font-black text-slate-800 mb-2">Reserve Now, Pay Later</h3>
                                    <p className="text-slate-500 text-sm leading-relaxed max-w-[400px] mx-auto">
                                        Your luxury stay is just a click away! No payment is required right now. 
                                        You can settle the bill directly at the hotel during your stay.
                                    </p>
                                    <div className="mt-8 p-4 bg-slate-50 rounded-2xl border border-slate-100 inline-flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                        <FaShieldAlt className="text-emerald-500 text-xs" />
                                        <span>Guaranteed Reservation</span>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Pay Button */}
                        <button 
                            className="pay-final-btn-p"
                            disabled={!formValid}
                            onClick={runSimulationSteps}
                        >
                            <span>{activeTab === 'pay_at_hotel' ? 'Confirm Reservation' : `Pay ₹${finalAmount.toLocaleString()}`}</span>
                            <FaArrowRight />
                        </button>

                        {/* Trust Badges */}
                        <div className="trust-badges-row-p">
                            <div className="badge-item-p">
                                <FaShieldAlt /> <span>100% Secure</span>
                            </div>
                            <div className="badge-item-p">
                                <FaFingerprint /> <span>Encrypted</span>
                            </div>
                            <div className="badge-item-p">
                                <FaLockOpen /> <span>PCI DSS Compliant</span>
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
