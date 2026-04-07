import React, { useState, useEffect } from 'react';
import { FaFileInvoiceDollar, FaCheckCircle, FaDownload, FaRegCreditCard, FaHistory, FaPlusCircle, FaCalendarAlt } from 'react-icons/fa';
import API from '../../utils/api';
import './dashboard.css';

const CustomerPayments = () => {
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth <= 768);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const handleDownloadInvoice = async (bookingId) => {
        try {
            const response = await API.get(`/bookings/${bookingId}/invoice`, {
                responseType: 'blob'
            });

            if (response.data.type === 'application/json') {
                const text = await response.data.text();
                const errorData = JSON.parse(text);
                throw new Error(errorData.message || 'Server error generating invoice');
            }

            const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `EliteStays_Invoice_${bookingId.slice(-6).toUpperCase()}.pdf`);
            document.body.appendChild(link);
            link.click();

            setTimeout(() => {
                link.remove();
                window.URL.revokeObjectURL(url);
            }, 100);

        } catch (err) {
            console.error('Invoice download failed:', err);
            alert(`Download Failed: ${err.message || 'Could not download invoice'}`);
        }
    };

    useEffect(() => {
        API.get('/bookings/mybookings')
            .then(({ data }) => {
                const sorted = data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
                setBookings(sorted);
            })
            .catch(console.error)
            .finally(() => setLoading(false));
    }, []);

    if (loading) return <div className="cd-loader"><div className="cd-spinner" /></div>;

    return (
        <div className="animate-in fade-in duration-600">

            {/* ── Page Header ── */}
            <div className="cd-payments-page-header flex items-center justify-between mb-8">
                <div>
                    <h1 className="cd-welcome-title">Payment History</h1>
                    <p className="cd-welcome-sub">Monitor your real-time transactions and download invoices.</p>
                </div>
                <div className="cd-txn-count-badge flex items-center gap-3 py-2 px-4 bg-[#f5f3ff] rounded-2xl border border-indigo-50">
                    <FaHistory className="text-[#6d5dfc]" />
                    <span className="text-xs font-black uppercase tracking-widest text-[#1e293b]">{bookings.length} Total Transactions</span>
                </div>
            </div>

            {/* ══════════════════════════════════
                DESKTOP VIEW — Premium Table
                ══════════════════════════════════ */}
            {!isMobile && (
                <div className="cd-table-container">
                    <table className="cd-premium-table">
                        <thead>
                            <tr>
                                <th>Transaction Details</th>
                                <th>Booking Date</th>
                                <th>Total Amount</th>
                                <th>Payment Status</th>
                                <th style={{ textAlign: 'right' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {bookings.length === 0 ? (
                                <tr>
                                    <td colSpan="5" style={{ textAlign: 'center', padding: '100px 0', color: '#64748b' }}>
                                        <div className="flex flex-col items-center gap-4 opacity-30">
                                            <FaRegCreditCard className="text-6xl" />
                                            <p className="font-black uppercase tracking-tighter text-xl">No transactions yet</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                bookings.map((p) => (
                                    <tr key={p._id}>
                                        <td>
                                            <div className="flex items-center gap-5">
                                                <div className="w-12 h-12 rounded-2xl bg-[#f5f3ff] flex items-center justify-center text-[#8b5cf6] text-xl shadow-sm">
                                                    <FaFileInvoiceDollar />
                                                </div>
                                                <div>
                                                    <div className="cd-inv-id">TRX-{p._id.substring(0, 10).toUpperCase()}</div>
                                                    <div className="text-[11px] text-slate-400 font-black uppercase tracking-widest mt-0.5">
                                                        {p.hotel?.name || p.room?.name || 'Grand Suite Booking'}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="text-slate-600 font-bold text-sm">
                                            {new Date(p.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                                            <div className="text-[10px] text-slate-300 font-medium">
                                                {new Date(p.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </div>
                                        </td>
                                        <td>
                                            <span className="cd-amount-bold">₹{p.totalPrice?.toLocaleString() || 0}</span>
                                        </td>
                                        <td>
                                            <span className={`cd-status-badge ${p.paymentStatus === 'Paid' ? 'paid' : 'pending'}`}>
                                                {p.paymentStatus === 'Paid' ? <FaCheckCircle className="text-[10px]" /> : <FaPlusCircle className="text-[10px]" />}
                                                {p.paymentStatus || 'Awaiting'}
                                            </span>
                                        </td>
                                        <td style={{ textAlign: 'right' }}>
                                            <button
                                                onClick={() => handleDownloadInvoice(p._id)}
                                                className="w-10 h-10 rounded-full bg-[#f8fafc] border border-slate-100 flex items-center justify-center text-[#64748b] hover:bg-[#6d5dfc] hover:text-white hover:shadow-lg transition-all m-auto"
                                                title="Download Official Invoice"
                                            >
                                                <FaDownload />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            )}

            {/* ══════════════════════════════════
                MOBILE VIEW — Premium Card List
                ══════════════════════════════════ */}
            {isMobile && (
                <div className="mob-pay-list">
                    {bookings.length === 0 ? (
                        <div className="mob-pay-empty">
                            <FaRegCreditCard className="mob-pay-empty-icon" />
                            <p className="mob-pay-empty-title">No transactions yet</p>
                            <p className="mob-pay-empty-sub">Your payment history will appear here once you complete a booking.</p>
                        </div>
                    ) : (
                        bookings.map((p, idx) => (
                            <div key={p._id} className="mob-pay-card" style={{ animationDelay: `${idx * 40}ms` }}>
                                {/* Card Top — Icon + TRX ID + Status */}
                                <div className="mob-pay-card-top">
                                    <div className="mob-pay-icon-wrap">
                                        <FaFileInvoiceDollar />
                                    </div>
                                    <div className="mob-pay-trx-info">
                                        <div className="mob-pay-trx-id">TRX-{p._id.substring(0, 10).toUpperCase()}</div>
                                        <div className="mob-pay-hotel-name">
                                            {p.hotel?.name || p.room?.name || 'Grand Suite Booking'}
                                        </div>
                                    </div>
                                    <span className={`mob-pay-status-badge ${p.paymentStatus === 'Paid' ? 'paid' : 'pending'}`}>
                                        {p.paymentStatus === 'Paid' ? <FaCheckCircle /> : <FaPlusCircle />}
                                        {p.paymentStatus || 'Awaiting'}
                                    </span>
                                </div>

                                {/* Card Middle — Date + Amount */}
                                <div className="mob-pay-card-mid">
                                    <div className="mob-pay-meta-item">
                                        <span className="mob-pay-meta-label">Date</span>
                                        <span className="mob-pay-meta-value">
                                            <FaCalendarAlt className="mob-pay-meta-icon" />
                                            {new Date(p.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                                        </span>
                                        <span className="mob-pay-meta-time">
                                            {new Date(p.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                    </div>
                                    <div className="mob-pay-divider" />
                                    <div className="mob-pay-meta-item mob-pay-meta-right">
                                        <span className="mob-pay-meta-label">Amount Paid</span>
                                        <span className="mob-pay-amount">₹{p.totalPrice?.toLocaleString() || 0}</span>
                                    </div>
                                </div>

                                {/* Card Footer — Download Invoice */}
                                <div className="mob-pay-card-foot">
                                    <button
                                        onClick={() => handleDownloadInvoice(p._id)}
                                        className="mob-pay-invoice-btn"
                                    >
                                        <FaDownload />
                                        Download Invoice
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}

        </div>
    );
};

export default CustomerPayments;
