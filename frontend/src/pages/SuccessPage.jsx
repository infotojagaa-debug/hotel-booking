import React, { useEffect, useState } from 'react';
import { useSearchParams, Link, useLocation, useNavigate } from 'react-router-dom';
import { 
    FaCheck, FaCopy, FaCalendarAlt, FaMapMarkerAlt, FaUsers, 
    FaBed, FaCreditCard, FaRegEnvelope, FaChevronRight, 
    FaDownload, FaHeadset, FaWhatsapp, FaCheckCircle
} from 'react-icons/fa';
import API from '../utils/api';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import confetti from 'canvas-confetti';
import successIllustration from '../assets/success_illustration.png';
import './SuccessPage.css';

const SuccessPage = () => {
    const [searchParams] = useSearchParams();
    const location = useLocation();
    const navigate = useNavigate();
    
    // Booking ID from query param (Stripe) or local state (Mock)
    const bookingId = searchParams.get('booking_id') || location.state?.bookingId;
    
    const [status, setStatus] = useState('processing'); // 'processing' | 'verifying' | 'success' | 'error'
    const [booking, setBooking] = useState(null);
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        if (!bookingId) {
            navigate('/');
            return;
        }

        // Clear persistence data on successful reach of this page
        localStorage.removeItem('elite_stays_search');
        localStorage.removeItem('elite_stays_active_offer');

        // 1. Simulate "Processing Payment" Real-Time Experience (2.5 seconds)
        const timer = setTimeout(() => {
            fetchBookingDetails();
        }, 2500);

        return () => clearTimeout(timer);
    }, [bookingId, navigate]);

    const fetchBookingDetails = async () => {
        try {
            const { data } = await API.get(`/bookings/${bookingId}`);
            setBooking(data);
            
            // Short delay for "Verifying" feel before showing success
            setTimeout(() => {
                setStatus('success');
                // Celebrate!
                confetti({
                    particleCount: 150,
                    spread: 70,
                    origin: { y: 0.6 },
                    colors: ['#6C63FF', '#22C55E', '#FFFFFF']
                });
            }, 1000);
        } catch (err) {
            console.error('Error fetching booking:', err);
            setStatus('error');
        }
    };

    const copyToClipboard = () => {
        navigator.clipboard.writeText(bookingId);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleDownloadInvoice = () => {
        const doc = new jsPDF();
        const hotel = booking.room?.hotel || {};
        const room = booking.room || {};
        const user = booking.user || {};

        // --- Header / Branding ---
        doc.setFillColor(109, 93, 252); // Brand Purple
        doc.rect(0, 0, 210, 40, 'F');
        
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(24);
        doc.setFont('helvetica', 'bold');
        doc.text('ELITE STAYS', 20, 25);
        
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text('LUXURY LIVING REDEFINED', 20, 32);
        
        doc.setFontSize(12);
        doc.text('INVOICE / RECEIPT', 150, 25);

        // --- Invoice Metadata ---
        doc.setTextColor(0, 0, 0);
        doc.setFontSize(10);
        doc.text(`Invoice No: INV-${booking._id.toString().slice(-6).toUpperCase()}`, 20, 50);
        doc.text(`Date Issued: ${new Date().toLocaleDateString()}`, 20, 56);
        doc.text(`Booking ID: ${booking._id}`, 20, 62);

        // --- Billed To vs Hotel Info ---
        doc.setFont('helvetica', 'bold');
        doc.text('BILLED TO:', 20, 75);
        doc.text('HOTEL INFORMATION:', 110, 75);
        
        doc.setFont('helvetica', 'normal');
        doc.text(user.name || 'Guest', 20, 81);
        doc.text(user.email || '', 20, 87);
        
        doc.text(hotel.name || 'Elite Stays', 110, 81);
        doc.text(hotel.address || '', 110, 87);
        doc.text(`${hotel.city || ''}`, 110, 93);

        // --- Booking Summary Table ---
        const tableData = [
            ['Room Type', room.name || 'Standard'],
            ['Stay Duration', `${new Date(booking.checkInDate).toLocaleDateString()} - ${new Date(booking.checkOutDate).toLocaleDateString()}`],
            ['Total Nights', Math.ceil((new Date(booking.checkOutDate) - new Date(booking.checkInDate)) / (1000 * 60 * 60 * 24)).toString()],
            ['Guests', `${room.maxGuests} Adults`],
            ['Payment Method', booking.paymentId ? 'Online' : 'Card/UPI'],
            ['Status', 'PAID (Verified)']
        ];

        autoTable(doc, {
            startY: 105,
            head: [['Description', 'Details']],
            body: tableData,
            theme: 'striped',
            headStyles: { fillColor: [109, 93, 252], textColor: [255, 255, 255], fontStyle: 'bold' },
            styles: { fontSize: 10, cellPadding: 5 },
            columnStyles: { 0: { cellWidth: 50, fontStyle: 'bold' } }
        });

        // --- Total Section ---
        const finalY = doc.lastAutoTable.finalY + 15;
        doc.setDrawColor(226, 232, 240);
        doc.line(20, finalY, 190, finalY);
        
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text('TOTAL AMOUNT PAID:', 25, finalY + 12);
        doc.text(`INR ${booking.totalPrice?.toLocaleString()}`, 155, finalY + 12, { align: 'right' });

        // --- Footer / Terms ---
        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(100, 116, 139);
        doc.text('Terms & Conditions:', 20, 250);
        doc.text('1. This invoice is computer-generated and confirms successful payment.', 20, 256);
        doc.text('2. Please present a digital copy of this invoice at check-in.', 20, 262);
        doc.text('3. Cancellation policies apply as per hotel standards.', 20, 268);
        
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(109, 93, 252);
        doc.text('Thank you for choosing Elite Stays! Enjoy your luxury stay.', 105, 285, { align: 'center' });

        // Save
        doc.save(`Invoice_${booking._id}.pdf`);
    };

    if (status === 'processing' || status === 'verifying') {
        return (
            <div className="processing-overlay">
                <div className="luxury-spinner"></div>
                <h2 className="processing-title">
                    {status === 'processing' ? 'Processing Payment...' : 'Verifying Your Booking...'}
                </h2>
                <p className="processing-subtitle">Building your luxury experience. Please do not refresh.</p>
            </div>
        );
    }

    if (status === 'error') {
        return (
            <div className="success-page-wrapper">
                <div className="success-card glass-card p-12 text-center">
                    <div className="checkmark-bounce bg-red-500 mx-auto">!</div>
                    <h2 className="success-title">Something went wrong</h2>
                    <p className="success-subtitle max-w-md mx-auto">We couldn't retrieve your booking details, but your payment might have been processed. Please check your dashboard.</p>
                    <div className="success-action-stack justify-center">
                        <Link to="/dashboard" className="btn-primary-sc">Go to Dashboard</Link>
                        <Link to="/" className="btn-secondary-sc">Back to Home</Link>
                    </div>
                </div>
            </div>
        );
    }

    if (!booking) return null;

    const checkIn = new Date(booking.checkInDate);
    const checkOut = new Date(booking.checkOutDate);

    return (
        <div className="success-page-wrapper">
            <div className="success-split-container">
                
                {/* 70% LEFT CONTENT */}
                <div className="success-left-content">
                    <h1 className="success-title">
                        <span className="checkmark-inline">
                            <FaCheck />
                        </span>
                        Booking Confirmed!
                    </h1>
                    <p className="success-subtitle">
                        Stay reserved at <strong>{booking.room?.hotel?.name}</strong>. Invoice sent to email.
                    </p>

                    <div className="details-cluster">
                        <h3 className="cluster-title">🧾 Booking Summary</h3>
                        
                        <div className="booking-main-card">
                            <div className="hotel-header">
                                <div className="hotel-name-wrap">
                                    <h3>{booking.room?.hotel?.name}</h3>
                                    <span className="hotel-loc">
                                        <FaMapMarkerAlt /> {booking.room?.hotel?.city}
                                    </span>
                                </div>
                                <div className="paid-badge">
                                    <FaCheckCircle className="text-[14px]" /> PAID
                                </div>
                            </div>

                            <div className="stay-grid-s">
                                <div className="stay-node">
                                    <h4>Check-In</h4>
                                    <div className="node-val">
                                        <FaCalendarAlt className="text-[#6c63ff] text-xs" />
                                        {checkIn.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                                    </div>
                                </div>
                                <div className="stay-node">
                                    <h4>Check-Out</h4>
                                    <div className="node-val">
                                        <FaCalendarAlt className="text-[#6c63ff] text-xs" />
                                        {checkOut.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                                    </div>
                                </div>
                                <div className="stay-node">
                                    <h4>Room</h4>
                                    <div className="node-val truncate">
                                        <FaUsers className="text-[#6c63ff] text-xs" />
                                        {booking.room?.name}
                                    </div>
                                </div>
                                <div className="stay-node">
                                    <h4>Booking ID</h4>
                                    <div className="node-val">
                                        <span className="text-[11px] font-mono text-gray-500">#{booking._id.toString().slice(-8).toUpperCase()}</span>
                                        <button className="ml-1 text-gray-400 hover:text-indigo-600" onClick={copyToClipboard}>
                                            <FaCopy className="text-[10px]" />
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <div className="price-node">
                                <span className="price-label">Total Amount Paid</span>
                                <span className="price-amount">₹{booking.totalPrice?.toLocaleString()}</span>
                            </div>
                        </div>
                    </div>

                    <div className="details-cluster mb-4">
                        <h3 className="cluster-title">💳 Payment</h3>
                        <div className="flex gap-6">
                            <div className="flex items-center gap-2">
                                <FaCreditCard className="text-indigo-600 text-sm" />
                                <span className="text-[13px] font-medium text-gray-700">{booking.paymentId ? 'Online' : 'Verified'}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <FaCheckCircle className="text-green-600 text-sm" />
                                <span className="text-[13px] font-medium text-gray-700">Success</span>
                            </div>
                        </div>
                    </div>

                    <div className="success-action-stack">
                        <Link to="/dashboard" className="btn-primary-sc">
                           My Booking
                        </Link>
                        <button onClick={handleDownloadInvoice} className="btn-secondary-sc">
                            <FaDownload className="text-xs" /> Invoice
                        </button>
                        <Link to="/" className="btn-secondary-sc">
                            Home
                        </Link>
                    </div>
                </div>

                {/* 30% RIGHT ANIMATED PANE */}
                <div className="success-right-pane">
                    <div className="glow-orb"></div>
                    <div className="particle-group">
                        <span className="p1"></span>
                        <span className="p2"></span>
                        <span className="p3"></span>
                    </div>

                    <img 
                        src={successIllustration} 
                        alt="Success Illustration" 
                        className="floating-asset"
                    />

                    <div className="text-center mt-8 z-10 text-white/90">
                        <h4 className="font-bold text-xl">Pack Your Bags!</h4>
                        <p className="text-sm opacity-75">Your luxury stay is just a few steps away.</p>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default SuccessPage;
