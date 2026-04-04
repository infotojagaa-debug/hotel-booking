import React, { useState } from 'react';
import API from '../../utils/api';

const STATUS_COLORS = {
    Confirmed: 'badge-green', Pending: 'badge-amber',
    Cancelled: 'badge-red', 'Checked-In': 'badge-blue', 'Checked-Out': 'badge-gray'
};
const formatCurrency = (a) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(a || 0);

const ManagerBookings = ({ reservations, onRefresh }) => {
    const [filter, setFilter] = useState('All');
    const [cancellationModal, setCancellationModal] = useState(null);
    const [refundPolicy, setRefundPolicy] = useState('full');

    const statuses = ['All', 'Pending', 'Confirmed', 'Checked-In', 'Checked-Out', 'Cancelled'];
    const filtered = filter === 'All' ? reservations : reservations.filter(r => r.status === filter);

    const handleStatus = async (id, status) => {
        try {
            await API.put(`/manager/bookings/${id}/status`, { status });
            onRefresh();
        } catch { alert('Status update failed'); }
    };

    const handleCancellation = async (id, action) => {
        try {
            await API.put(`/manager/bookings/${id}/cancellation`, { action, refundPolicy });
            setCancellationModal(null);
            onRefresh();
        } catch { alert('Failed'); }
    };

    const today = new Date().toDateString();
    const checkInsToday = reservations.filter(r => new Date(r.checkInDate).toDateString() === today);
    const checkOutsToday = reservations.filter(r => new Date(r.checkOutDate).toDateString() === today);

    return (
        <div>
            <div className="mgr-section-title mb-16">📅 Booking Management</div>

            {/* Today Summary */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16, marginBottom: 24 }}>
                {[
                    { label: "Check-Ins Today", value: checkInsToday.length, color: '#10b981', bg: '#d1fae5' },
                    { label: "Check-Outs Today", value: checkOutsToday.length, color: '#6d5dfc', bg: '#f1f0ff' },
                    { label: "Cancelled", value: reservations.filter(r => r.status === 'Cancelled').length, color: '#f43f5e', bg: '#fff1f2' },
                ].map(s => (
                    <div key={s.label} style={{ background: s.bg, borderRadius: '16px', padding: '20px 24px', border: `1px solid ${s.color}20`, display: 'flex', flexDirection: 'column', gap: 4 }}>
                        <div style={{ fontSize: '2rem', fontWeight: 900, color: s.color, lineHeight: 1 }}>{s.value}</div>
                        <div style={{ fontSize: '0.8rem', fontWeight: 700, color: s.color, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{s.label}</div>
                    </div>
                ))}
            </div>

            {/* Filters */}
            <div className="mgr-subtabs mb-16">
                {statuses.map(s => (
                    <button key={s} className={`mgr-subtab ${filter === s ? 'active' : ''}`} onClick={() => setFilter(s)}>{s}</button>
                ))}
            </div>

            {/* Table */}
            <div className="mgr-card">
                <div className="mgr-card-header">
                    <h3>All Reservations</h3>
                    <span className="badge badge-blue">{filtered.length} bookings</span>
                </div>
                <div className="mgr-table-wrap">
                    <table className="mgr-table">
                        <thead>
                            <tr><th>Guest</th><th>Hotel / Room</th><th>Stay Dates</th><th>Payment</th><th>Status</th><th>Net</th><th>Actions</th></tr>
                        </thead>
                        <tbody>
                            {filtered.map(r => (
                                <tr key={r._id}>
                                    <td>
                                        <div className="fw">{r.user?.name || '—'}</div>
                                        <div className="text-muted" style={{ fontSize: '0.73rem' }}>{r.user?.email}</div>
                                    </td>
                                    <td>
                                        <div>{r.room?.hotel?.name || '—'}</div>
                                        <div className="text-muted" style={{ fontSize: '0.73rem' }}>{r.room?.name}</div>
                                    </td>
                                    <td>
                                        <div>{new Date(r.checkInDate).toLocaleDateString('en-IN')}</div>
                                        <div className="text-muted" style={{ fontSize: '0.73rem' }}>→ {new Date(r.checkOutDate).toLocaleDateString('en-IN')}</div>
                                    </td>
                                    <td>
                                        <span className={`badge ${r.paymentStatus === 'Paid' ? 'badge-green' : r.paymentStatus === 'Refunded' ? 'badge-blue' : 'badge-amber'}`}>{r.paymentStatus}</span>
                                    </td>
                                    <td>
                                        <select className="status-select" value={r.status} onChange={e => handleStatus(r._id, e.target.value)}>
                                            <option>Pending</option>
                                            <option>Confirmed</option>
                                            <option>Checked-In</option>
                                            <option>Checked-Out</option>
                                            <option>Cancelled</option>
                                        </select>
                                    </td>
                                    <td className="text-green fw">{formatCurrency(r.managerEarnings)}</td>
                                    <td>
                                        {r.status === 'Pending' && (
                                            <button className="mgr-btn mgr-btn-xs mgr-btn-danger" onClick={() => setCancellationModal(r)}>
                                                Handle Cancel
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                            {filtered.length === 0 && (
                                <tr><td colSpan={7}><div className="mgr-empty"><div className="empty-icon">📅</div><p>No bookings found</p></div></td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Cancellation Modal */}
            {cancellationModal && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(26, 22, 45, 0.6)', backdropFilter: 'blur(4px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div style={{ background: '#fff', borderRadius: '24px', padding: 32, width: 440, boxShadow: '0 20px 50px rgba(0,0,0,0.15)', border: '1px solid var(--border)' }}>
                        <h3 style={{ marginBottom: 12, fontSize: '1.25rem', fontWeight: 900, color: 'var(--text-primary)' }}>⚠️ Handle Cancellation</h3>
                        <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: 24, lineHeight: 1.5 }}>
                            Reviewing request by <span className="font-bold text-gray-900">{cancellationModal.user?.name}</span> for <span className="font-bold text-gray-900">{cancellationModal.room?.hotel?.name}</span>. Select a refund policy to proceed.
                        </p>
                        <div className="mgr-form-group mb-24">
                            <label style={{ color: 'var(--text-primary)', fontWeight: 700, marginBottom: 8, display: 'block', fontSize: '0.85rem' }}>Refund Policy</label>
                            <select className="mgr-input" style={{ padding: '14px', borderRadius: '12px' }} value={refundPolicy} onChange={e => setRefundPolicy(e.target.value)}>
                                <option value="full">Full Refund (100%)</option>
                                <option value="partial">Partial Refund (50%)</option>
                                <option value="none">No Refund (0%)</option>
                            </select>
                        </div>
                        <div className="flex flex-col gap-3">
                            <div className="flex gap-3">
                                <button className="mgr-btn mgr-btn-primary flex-1" style={{ padding: '14px', borderRadius: '12px' }} onClick={() => handleCancellation(cancellationModal._id, 'approve')}>✓ Approve Cancellation</button>
                                <button className="mgr-btn mgr-btn-danger flex-1" style={{ padding: '14px', borderRadius: '12px' }} onClick={() => handleCancellation(cancellationModal._id, 'reject')}>✕ Reject Request</button>
                            </div>
                            <button className="mgr-btn mgr-btn-outline w-full" style={{ padding: '12px', borderRadius: '12px' }} onClick={() => setCancellationModal(null)}>Go Back</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ManagerBookings;
