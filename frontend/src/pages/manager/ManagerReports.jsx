import React from 'react';

const formatCurrency = (a) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(a || 0);

const ManagerReports = ({ reservations, analytics }) => {
    if (!analytics) return null;

    const paidBookings = reservations.filter(r => r.paymentStatus === 'Paid');

    // Monthly breakdown (last 6 months)
    const monthly = [];
    for (let i = 5; i >= 0; i--) {
        const d = new Date(); d.setMonth(d.getMonth() - i);
        const y = d.getFullYear(), m = d.getMonth();
        const monthBookings = paidBookings.filter(b => {
            const c = new Date(b.createdAt);
            return c.getFullYear() === y && c.getMonth() === m;
        });
        monthly.push({
            label: d.toLocaleDateString('en-IN', { month: 'short', year: '2-digit' }),
            revenue: monthBookings.reduce((s, b) => s + b.totalPrice, 0),
            earnings: monthBookings.reduce((s, b) => s + (b.managerEarnings || 0), 0),
            count: monthBookings.length,
        });
    }

    const maxRevenue = Math.max(...monthly.map(m => m.revenue), 1);

    // Payment tracking
    const totalRevenue = paidBookings.reduce((s, b) => s + b.totalPrice, 0);
    const totalEarnings = paidBookings.reduce((s, b) => s + (b.managerEarnings || 0), 0);
    const totalFees = paidBookings.reduce((s, b) => s + (b.platformFee || 0), 0);
    const pendingPayments = reservations.filter(r => r.paymentStatus === 'Unpaid').length;

    return (
        <div>
            <div className="mgr-section-title mb-16">📊 Reports & Analytics</div>

            {/* Summary Cards */}
            <div className="mgr-stats-grid" style={{ gridTemplateColumns: 'repeat(4,1fr)', marginBottom: 24 }}>
                {[
                    { label: 'Total Revenue', value: formatCurrency(totalRevenue), icon: '💳', color: 'blue' },
                    { label: 'Net Earnings', value: formatCurrency(totalEarnings), icon: '💰', color: 'green' },
                    { label: 'Platform Fees', value: formatCurrency(totalFees), icon: '🏦', color: 'purple' },
                    { label: 'Pending Payments', value: pendingPayments, icon: '⏳', color: 'amber' },
                ].map(s => (
                    <div className="mgr-stat-card" key={s.label}>
                        <div className={`stat-icon ${s.color}`}>{s.icon}</div>
                        <div className="stat-body">
                            <div className="stat-label">{s.label}</div>
                            <div className="stat-value" style={{ fontSize: '1.1rem' }}>{s.value}</div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Revenue Bar Chart */}
            <div className="mgr-card mgr-section">
                <div className="mgr-card-header"><h3>📈 Monthly Revenue (Last 6 Months)</h3></div>
                <div className="mgr-card-body">
                    <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end', height: 180, padding: '0 8px' }}>
                        {monthly.map((m, i) => (
                            <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                                <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                                    {m.revenue > 0 ? formatCurrency(m.revenue).replace('₹', '₹') : '—'}
                                </div>
                                <div style={{ width: '100%', background: 'var(--bg)', borderRadius: '6px 6px 0 0', height: 140, display: 'flex', alignItems: 'flex-end', overflow: 'hidden' }}>
                                    <div style={{
                                        width: '100%',
                                        height: `${Math.max((m.revenue / maxRevenue) * 100, 2)}%`,
                                        background: 'linear-gradient(180deg, var(--primary), #818cf8)',
                                        borderRadius: '4px 4px 0 0',
                                        transition: 'height 0.6s ease',
                                    }} />
                                </div>
                                <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', textAlign: 'center' }}>{m.label}</div>
                                <div style={{ fontSize: '0.68rem', color: 'var(--text-secondary)' }}>{m.count} bkg</div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Payment Summary Table */}
            <div className="mgr-card mgr-section">
                <div className="mgr-card-header"><h3>💳 Payment Tracking</h3></div>
                <div className="mgr-table-wrap">
                    <table className="mgr-table">
                        <thead>
                            <tr><th>Guest</th><th>Room</th><th>Total Paid</th><th>Manager Earnings</th><th>Platform Fee</th><th>Status</th></tr>
                        </thead>
                        <tbody>
                            {paidBookings.slice(0, 15).map(b => (
                                <tr key={b._id}>
                                    <td className="fw">{b.user?.name || '—'}</td>
                                    <td className="text-muted">{b.room?.name || '—'}</td>
                                    <td className="fw text-green">{formatCurrency(b.totalPrice)}</td>
                                    <td style={{ color: 'var(--primary)', fontWeight: 700 }}>{formatCurrency(b.managerEarnings)}</td>
                                    <td className="text-muted">{formatCurrency(b.platformFee)}</td>
                                    <td><span className="badge badge-green">Paid</span></td>
                                </tr>
                            ))}
                            {paidBookings.length === 0 && (
                                <tr><td colSpan={6}><div className="mgr-empty"><div className="empty-icon">💳</div><p>No paid bookings yet</p></div></td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default ManagerReports;
