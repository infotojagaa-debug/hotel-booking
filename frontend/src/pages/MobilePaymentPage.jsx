import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import API from '../utils/api';
import './MobilePaymentPage.css';

const MobilePaymentPage = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { roomId, checkIn, checkOut, nights, totalPrice, discountAmount = 0, bestOffer, room } = location.state || {};

    const [activeTab, setActiveTab] = useState('upi');
    const [formValid, setFormValid] = useState(false);
    
    // Process sim
    const [isProcessing, setIsProcessing] = useState(false);
    const [processStatus, setProcessStatus] = useState('');
    
    const [isVerified, setIsVerified] = useState(false);
    const [verifying, setVerifying] = useState(false);
    
    // States
    const [upiId, setUpiId] = useState('');
    const [selectedApp, setSelectedApp] = useState('gpay');
    const [cardData, setCardData] = useState({ number: '', name: '', expiry: '', cvv: '' });
    const [selectedBank, setSelectedBank] = useState(null);
    const [selectedWallet, setSelectedWallet] = useState(null);

    // Calc
    const basePrice = totalPrice || 0;
    const nightCount = nights || 1;
    const promotionDiscount = discountAmount || 0;
    const discountedSubtotal = basePrice - promotionDiscount;
    const taxesAndFees = Math.round(discountedSubtotal * 0.12);
    const serviceCharge = Math.round(discountedSubtotal * 0.05);
    const finalAmount = discountedSubtotal + taxesAndFees + serviceCharge;

    useEffect(() => {
        if (!roomId || !room) { navigate('/'); }
        document.body.classList.add('mobile-app-active');
        return () => document.body.classList.remove('mobile-app-active');
    }, [roomId, room, navigate]);

    useEffect(() => {
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
    }, [activeTab, cardData, upiId, selectedApp, selectedBank, selectedWallet, isVerified]);

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
            console.error('Payment Error:', error.response?.data || error.message);
            alert(`Payment Failed: ${error.response?.data?.message || 'A network or server error occurred. Please try again.'}`);
            setIsProcessing(false);
            setProcessStatus('Error');
        }
    };

    const runSimulationSteps = () => {
        setIsProcessing(true);
        const steps = activeTab === 'pay_at_hotel' 
            ? ["Connecting...", "Securing Booking..."] 
            : ["Authenticating...", "Authorizing..."];
        
        let current = 0;
        setProcessStatus(steps[0]);

        const interval = setInterval(() => {
            current++;
            if (current < steps.length) {
                setProcessStatus(steps[current]);
            } else {
                clearInterval(interval);
                finalizeBooking();
            }
        }, 1000);
    };

    return (
        <div className="mob-pay-root">
            {/* Header */}
            <header className="mob-pay-hdr">
                <button className="mob-btn-cr" onClick={() => navigate(-1)}>
                    <i className="fa fa-arrow-left"></i>
                </button>
                <h3>Checkout</h3>
                <div style={{width: 40}}></div>
            </header>

            <div className="mob-pay-body">
                
                {/* Summary Card */}
                <div className="mob-pay-sec">
                    <div className="mob-pay-room-info">
                        <img src={room?.images?.[0] || 'https://images.unsplash.com/photo-1566073771259-6a8506099945'} alt="Room" />
                        <div>
                            <h4>{room?.hotel?.name || 'Hotel'}</h4>
                            <p>{room?.name || 'Luxury Room'}</p>
                            <small>
                                {new Date(checkIn).toLocaleDateString('en-US', { day: 'numeric', month: 'short' })} - {new Date(checkOut).toLocaleDateString('en-US', { day: 'numeric', month: 'short' })}
                            </small>
                        </div>
                    </div>
                    {promotionDiscount > 0 && (
                        <div className="mob-pay-discount-alert">
                            <i className="fa fa-tag"></i> 
                            Offer Applied: Saved ₹{promotionDiscount.toLocaleString()}!
                        </div>
                    )}
                </div>

                {/* Amount Box */}
                <div className="mob-pay-sec">
                    <h2>Amount Payable</h2>
                    <div className="mob-price-big">₹{finalAmount.toLocaleString()}</div>
                    <p className="mob-price-subtxt">Includes taxes & fees</p>
                </div>

                {/* Payment Methods Wrapper */}
                <div className="mob-pay-methods-wrap">
                    <h2>Select Payment Method</h2>
                    
                    <div className="mob-pay-tabs-scroller">
                        {['upi', 'card', 'netbanking', 'wallet', 'pay_at_hotel'].map(tab => (
                            <div 
                                key={tab}
                                className={`mob-pay-tab ${activeTab === tab ? 'active' : ''}`}
                                onClick={() => setActiveTab(tab)}
                            >
                                {tab === 'upi' && <i className="fa fa-mobile-alt"></i>}
                                {tab === 'card' && <i className="fa fa-credit-card"></i>}
                                {tab === 'netbanking' && <i className="fa fa-university"></i>}
                                {tab === 'wallet' && <i className="fa fa-wallet"></i>}
                                {tab === 'pay_at_hotel' && <i className="fa fa-money-bill-alt"></i>}
                                <span>{tab.replace(/_/g, ' ')}</span>
                            </div>
                        ))}
                    </div>

                    <div className="mob-pay-content-pane">
                        {/* UPI */}
                        {activeTab === 'upi' && (
                            <div className="mob-upi-pane">
                                <div className="mob-upi-apps">
                                    {['gpay', 'phonepe', 'paytm'].map(app => (
                                        <div 
                                            key={app} 
                                            className={`mob-upi-app ${selectedApp === app ? 'active' : ''}`}
                                            onClick={() => { setSelectedApp(app); setUpiId(''); setIsVerified(false); }}
                                        >
                                            <div className="mob-app-circle">
                                                {app === 'gpay' && <span style={{color: '#4285F4'}}>G</span>}
                                                {app === 'phonepe' && <span style={{color: '#5f259f'}}>Pe</span>}
                                                {app === 'paytm' && <span style={{color: '#00BAF2'}}>Ptm</span>}
                                            </div>
                                            <small>{app}</small>
                                        </div>
                                    ))}
                                </div>
                                <div className="mob-or-divider">OR ENTER VPA</div>
                                <div className="mob-upi-input-grp">
                                    <input 
                                        type="email" 
                                        placeholder="username@bank"
                                        value={upiId}
                                        onChange={(e) => { setUpiId(e.target.value); setSelectedApp(null); setIsVerified(false); }}
                                    />
                                    <button 
                                        className={isVerified ? 'verified' : ''}
                                        disabled={upiId.length < 5 || isVerified || verifying}
                                        onClick={handleVerifyUpi}
                                    >
                                        {verifying ? '...' : isVerified ? '✓' : 'Verify'}
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Card */}
                        {activeTab === 'card' && (
                            <div className="mob-card-pane">
                                <input className="mob-inp" name="number" placeholder="Card Number 0000 0000 0000 0000" value={cardData.number} onChange={handleCardChange} />
                                <input className="mob-inp" name="name" placeholder="Name on Card" value={cardData.name} onChange={handleCardChange} />
                                <div className="mob-card-row">
                                    <input className="mob-inp" name="expiry" placeholder="MM/YY" value={cardData.expiry} onChange={handleCardChange} />
                                    <input className="mob-inp" name="cvv" placeholder="CVV" type="password" value={cardData.cvv} onChange={handleCardChange} />
                                </div>
                            </div>
                        )}

                        {/* Netbanking */}
                        {activeTab === 'netbanking' && (
                            <div className="mob-nb-pane">
                                <div className="mob-pay-grid">
                                    {[
                                        { id: 'hdfc', name: 'HDFC', icon: 'H' },
                                        { id: 'icici', name: 'ICICI', icon: 'I' },
                                        { id: 'sbi', name: 'SBI', icon: 'S' },
                                        { id: 'axis', name: 'Axis', icon: 'A' },
                                        { id: 'kotak', name: 'Kotak', icon: 'K' },
                                        { id: 'pnb', name: 'PNB', icon: 'P' }
                                    ].map(bank => (
                                        <div 
                                            key={bank.id} 
                                            className={`mob-pay-grid-item ${selectedBank === bank.id ? 'active' : ''}`}
                                            onClick={() => setSelectedBank(bank.id)}
                                        >
                                            <div className="mob-bank-logo">{bank.icon}</div>
                                            <span>{bank.name}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Wallet */}
                        {activeTab === 'wallet' && (
                            <div className="mob-wallet-pane">
                                <div className="mob-pay-grid">
                                    {[
                                        { id: 'razorpay', name: 'Razorpay', icon: 'RZ' },
                                        { id: 'amazonpay', name: 'Amazon Pay', icon: 'AP' },
                                        { id: 'stripe', name: 'Stripe', icon: 'ST' },
                                        { id: 'airtel', name: 'Airtel', icon: 'AM' }
                                    ].map(wallet => (
                                        <div 
                                            key={wallet.id} 
                                            className={`mob-pay-grid-item ${selectedWallet === wallet.id ? 'active' : ''}`}
                                            onClick={() => setSelectedWallet(wallet.id)}
                                        >
                                            <div className="mob-wallet-logo">{wallet.icon}</div>
                                            <span>{wallet.name}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Pay at hotel */}
                        {activeTab === 'pay_at_hotel' && (
                            <div className="mob-dumb-pane text-center">
                                <h3 style={{color: '#10b981', margin: '0 0 10px'}}><i className="fa fa-check-circle"></i> Zero Payment Now</h3>
                                <p style={{color: '#64748b', fontSize: '13px', margin: 0}}>Book instantly, pay nothing today. Settle directly at the hotel.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Bottom Sticky */}
            <div className="mob-pay-bot">
                <button 
                    className="mob-pay-btn" 
                    disabled={!formValid && activeTab !== 'pay_at_hotel'}
                    onClick={runSimulationSteps}
                >
                    <i className="fa fa-lock"></i> 
                    {activeTab === 'pay_at_hotel' ? 'Book Now' : `Pay ₹${finalAmount.toLocaleString()}`}
                </button>
            </div>

            {/* Overlay */}
            {isProcessing && (
                <div className="mob-proc-overlay">
                    <div className="mob-proc-box">
                        <div className="mob-proc-spin"></div>
                        <h4>{processStatus}</h4>
                        <p>Secure Transaction</p>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MobilePaymentPage;
