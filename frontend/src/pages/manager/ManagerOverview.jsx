import React from 'react';

const formatCurrency = (amt) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amt || 0);

const ManagerOverview = ({ analytics, reservations }) => {
    if (!analytics) return null;

    const today = new Date().toDateString();
    const checkInsToday = reservations.filter(r => new Date(r.checkInDate).toDateString() === today).length;

    const stats = [
        { label: 'Properties', value: analytics.totalHotels, icon: 'fas fa-building', colorClass: 'stat-blue', sub: 'Active locations' },
        { label: 'Room Inventory', value: analytics.totalRooms, icon: 'fas fa-bed', colorClass: 'stat-green', sub: 'Total capacity' },
        { label: 'Active Bookings', value: analytics.totalBookings, icon: 'fas fa-clipboard-check', colorClass: 'stat-orange', sub: `${checkInsToday} today` },
        { label: 'Net Revenue', value: formatCurrency(analytics.netEarnings), icon: 'fas fa-wallet', colorClass: 'stat-pink', sub: `Gross: ${formatCurrency(analytics.totalRevenue)}` },
    ];

    const statusColors = {
        Confirmed: 'badge-green', Pending: 'badge-amber',
        Cancelled: 'badge-red', 'Checked-In': 'badge-blue', 'Checked-Out': 'badge-gray'
    };

    return (
        <div className="mgr-overview-content">
            {/* KPI Analytics Grid */}
            <div className="mgr-analytics-grid">
                {stats.map((s) => (
                    <div className={`admin-stat-card ${s.colorClass}`} key={s.label}>
                        <div className="stat-icon-wrap"><i className={s.icon}></i></div>
                        <div className="stat-content">
                            <span className="admin-stat-title">{s.label}</span>
                            <h3 className="admin-stat-value">{s.value}</h3>
                            <div className="admin-stat-sub">{s.sub}</div>
                        </div>
                    </div>
                ))}
            </div>

            <div className="mgr-two-col">
                <div className="mgr-col-main">
                    {/* Recent Reservations as Activity List */}
                    <div className="mgr-card mgr-section">
                        <div className="mgr-card-header">
                            <h3>🕐 Recent Activity</h3>
                            <button className="mgr-btn mgr-btn-xs mgr-btn-outline">View All</button>
                        </div>
                        <div className="mgr-card-body" style={{ padding: '0 20px' }}>
                            <div className="recent-activity-list">
                                {reservations.slice(0, 6).map(r => (
                                    <div key={r._id} className="activity-row">
                                        <div className="activity-dot"></div>
                                        <div className="activity-info">
                                            <span className="activity-name">{r.user?.name || 'Guest'} · {r.room?.hotel?.name || 'Hotel'}</span>
                                            <span className="activity-time">Check-in: {new Date(r.checkInDate).toLocaleDateString('en-IN')}</span>
                                        </div>
                                        <span className="activity-amount">{formatCurrency(r.managerEarnings)}</span>
                                    </div>
                                ))}
                                {reservations.length === 0 && (
                                    <div className="mgr-empty">
                                        <i className="fas fa-history empty-icon"></i>
                                        <p>No recent activity found.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="mgr-col-side">
                    {/* Portfolio Occupancy */}
                    <div className="mgr-card mgr-section" style={{ border: 'none', background: 'linear-gradient(135deg, var(--primary), var(--primary-dark))', color: '#fff', borderRadius: '24px' }}>
                        <div className="mgr-card-header" style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                            <h3 style={{ color: '#fff' }}>🏠 Occupancy</h3>
                        </div>
                        <div className="mgr-card-body" style={{ padding: '24px' }}>
                            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 10 }}>
                                <div style={{ fontWeight: 900, fontSize: '2.5rem' }}>{analytics.occupancyRate}%</div>
                            </div>
                            <div style={{ background: 'rgba(255,255,255,0.2)', borderRadius: 999, height: 8, overflow: 'hidden', marginBottom: 12 }}>
                                <div style={{
                                    height: '100%', width: `${analytics.occupancyRate}%`,
                                    background: '#fff',
                                    borderRadius: 999, transition: 'width(0.8s) ease',
                                    boxShadow: '0 0 15px rgba(255,255,255,0.5)'
                                }} />
                            </div>
                            <p style={{ fontSize: '0.8rem', color: '#f1f0ff', opacity: 0.9, lineHeight: 1.4 }}>
                                Current portfolio occupancy rate based on active stays today.
                            </p>
                        </div>
                    </div>

                    {/* Status Breakdown */}
                    {analytics.statusBreakdown && (
                        <div className="mgr-card">
                            <div className="mgr-card-header"><h3>📊 Status Breakdown</h3></div>
                            <div className="mgr-card-body" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                                {Object.entries(analytics.statusBreakdown).map(([status, count]) => (
                                    <div key={status} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', background: 'var(--bg)', borderRadius: '12px' }}>
                                        <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>{status}</span>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                            <span style={{ fontWeight: 800, color: 'var(--text-primary)' }}>{count}</span>
                                            <div style={{ width: 6, height: 6, borderRadius: '50%', background: statusColors[status] ? `var(--${statusColors[status].split('-')[1]})` : '#cbd5e1' }}></div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ManagerOverview;
