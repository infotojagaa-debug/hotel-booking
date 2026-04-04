import React from 'react';

const formatCurrency = (amt) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amt || 0);

const ManagerOverview = ({ analytics, reservations }) => {
    if (!analytics) return null;

    const today = new Date().toDateString();
    const checkInsToday = reservations.filter(r => new Date(r.checkInDate).toDateString() === today).length;

    const stats = [
        { label: 'Total Hotels', value: analytics.totalHotels, icon: '🏨', color: '#6d5dfc', bg: '#f1f0ff', sub: 'Properties registered' },
        { label: 'Total Rooms', value: analytics.totalRooms, icon: '🛏️', color: '#8b5cf6', bg: '#f5f3ff', sub: 'Across all hotels' },
        { label: 'Total Bookings', value: analytics.totalBookings, icon: '📅', color: '#10b981', bg: '#ecfdf5', sub: `${checkInsToday} check-ins today` },
        { label: 'Net Earnings', value: formatCurrency(analytics.netEarnings), icon: '💰', color: '#f59e0b', bg: '#fffbeb', sub: `Revenue: ${formatCurrency(analytics.totalRevenue)}` },
    ];

    const statusColors = {
        Confirmed: 'badge-green', Pending: 'badge-amber',
        Cancelled: 'badge-red', 'Checked-In': 'badge-blue', 'Checked-Out': 'badge-gray'
    };

    return (
        <div>
            {/* KPI Cards */}
            <div className="mgr-stats-grid">
                {stats.map((s) => (
                    <div className={`mgr-stat-card stat-${s.label.toLowerCase().replace(' ', '-')}`} key={s.label}>
                        <div className="stat-card-top">
                            <div className="stat-icon-box" style={{ background: s.bg }}>{s.icon}</div>
                            <div className="stat-value">{s.value}</div>
                        </div>
                        <div className="stat-card-bottom">
                            <div className="stat-label">{s.label}</div>
                            <div className="stat-sub">{s.sub}</div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Status Breakdown */}
            {analytics.statusBreakdown && (
                <div className="mgr-card mgr-section">
                    <div className="mgr-card-header"><h3>📊 Booking Status Overview</h3></div>
                    <div className="mgr-card-body" style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                        {Object.entries(analytics.statusBreakdown).map(([status, count]) => (
                            <div key={status} style={{ textAlign: 'center', padding: '12px 20px', background: 'var(--bg)', borderRadius: 'var(--radius-sm)', minWidth: 100 }}>
                                <div style={{ fontSize: '1.4rem', fontWeight: 800 }}>{count}</div>
                                <span className={`badge ${statusColors[status] || 'badge-gray'}`}>{status}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Occupancy */}
            <div className="mgr-card mgr-section" style={{ border: 'none', background: 'linear-gradient(135deg, var(--primary), var(--primary-dark))', color: '#fff' }}>
                <div className="mgr-card-header" style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}><h3 style={{ color: '#fff' }}>🏠 Portfolio Occupancy</h3></div>
                <div className="mgr-card-body" style={{ padding: '32px' }}>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 12 }}>
                        <div style={{ fontWeight: 900, fontSize: '3rem' }}>{analytics.occupancyRate}%</div>
                        <div style={{ fontSize: '0.9rem', opacity: 0.8, fontWeight: 600 }}>Currently Active Stays</div>
                    </div>
                    <div style={{ background: 'rgba(255,255,255,0.2)', borderRadius: 999, height: 12, overflow: 'hidden' }}>
                        <div style={{
                            height: '100%', width: `${analytics.occupancyRate}%`,
                            background: '#fff',
                            borderRadius: 999, transition: 'width(0.8s) ease',
                            boxShadow: '0 0 20px rgba(255,255,255,0.5)'
                        }} />
                    </div>
                    <div style={{ fontSize: '0.8rem', color: '#f1f0ff', marginTop: 12, fontWeight: 500 }}>
                         Real-time occupancy metrics across all your managed properties.
                    </div>
                </div>
            </div>

            {/* Recent Reservations */}
            <div className="mgr-card">
                <div className="mgr-card-header">
                    <h3>🕐 Recent Bookings</h3>
                    <span className="badge badge-blue">{reservations.length} Total</span>
                </div>
                <div className="mgr-table-wrap">
                    <table className="mgr-table">
                        <thead>
                            <tr>
                                <th>Guest</th>
                                <th>Hotel</th>
                                <th>Check-In</th>
                                <th>Status</th>
                                <th>Earnings</th>
                            </tr>
                        </thead>
                        <tbody>
                            {reservations.slice(0, 8).map(r => (
                                <tr key={r._id}>
                                    <td className="fw">{r.user?.name || '—'}</td>
                                    <td className="text-muted">{r.room?.hotel?.name || '—'}</td>
                                    <td className="text-muted">{new Date(r.checkInDate).toLocaleDateString('en-IN')}</td>
                                    <td><span className={`badge ${statusColors[r.status] || 'badge-gray'}`}>{r.status}</span></td>
                                    <td className="text-green">{formatCurrency(r.managerEarnings)}</td>
                                </tr>
                            ))}
                            {reservations.length === 0 && (
                                <tr><td colSpan={5} className="mgr-empty"><p>No bookings yet</p></td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default ManagerOverview;
