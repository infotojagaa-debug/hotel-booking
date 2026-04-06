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
                    <div className="mgr-card mgr-section activity-card">
                        <div className="mgr-card-header">
                            <div className="mgr-header-icon-wrap">
                                <i className="fas fa-history"></i>
                                <h3>Recent Activity</h3>
                            </div>
                            <button className="mgr-btn-view-all">View All</button>
                        </div>
                        <div className="mgr-card-body">
                            <div className="recent-activity-list">
                                {reservations.slice(0, 6).map(r => (
                                    <div key={r._id} className="activity-row">
                                        <div className="activity-status-dot"></div>
                                        <div className="activity-info">
                                            <div className="activity-primary">
                                                <span className="activity-guest-name">{r.user?.name || 'Guest'}</span>
                                                <span className="activity-prop-tag">{r.room?.hotel?.name || 'Hotel'}</span>
                                            </div>
                                            <div className="activity-secondary">
                                                <span className="activity-checkin-date">
                                                    <i className="far fa-calendar-alt"></i> Check-in: {new Date(r.checkInDate).toLocaleDateString('en-IN')}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="activity-financial">
                                            <span className="activity-price">{formatCurrency(r.managerEarnings)}</span>
                                        </div>
                                    </div>
                                ))}
                                {reservations.length === 0 && (
                                    <div className="mgr-empty-state">
                                        <i className="fas fa-calendar-times empty-icon"></i>
                                        <p>No recent activity found.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="mgr-col-side">
                    {/* Portfolio Occupancy */}
                    <div className="mgr-card mgr-occupancy-card-premium">
                        <div className="mgr-occupancy-header">
                            <i className="fas fa-house-user"></i>
                            <h3>Occupancy</h3>
                        </div>
                        <div className="mgr-occupancy-body">
                            <div className="occupancy-value-wrap">
                                <span className="occupancy-number">{analytics.occupancyRate}%</span>
                                <span className="occupancy-tag">Live</span>
                            </div>
                            <div className="occupancy-progress-track">
                                <div className="occupancy-progress-bar" style={{ width: `${analytics.occupancyRate}%` }} />
                            </div>
                            <p className="occupancy-desc">
                                Current portfolio occupancy rate based on active stays today.
                            </p>
                        </div>
                    </div>

                    {/* Status Breakdown */}
                    {analytics.statusBreakdown && (
                        <div className="mgr-card status-breakdown-card">
                            <div className="mgr-card-header">
                                <div className="mgr-header-icon-wrap">
                                    <i className="fas fa-chart-pie"></i>
                                    <h3>Status Breakdown</h3>
                                </div>
                            </div>
                            <div className="mgr-card-body breakdown-grid">
                                {Object.entries(analytics.statusBreakdown).map(([status, count]) => (
                                    <div key={status} className="status-pill-row">
                                        <span className="status-pill-label">{status}</span>
                                        <div className="status-pill-value-wrap">
                                            <span className="status-pill-count">{count}</span>
                                            <div className="status-indicator-dot" style={{ background: statusColors[status] ? `var(--${statusColors[status].split('-')[1]})` : '#cbd5e1' }}></div>
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
