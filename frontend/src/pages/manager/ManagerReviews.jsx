import React, { useState } from 'react';
import API from '../../utils/api';

const Stars = ({ rating }) => '⭐'.repeat(Math.round(rating || 0));

const ManagerReviews = ({ reviews, onRefresh }) => {
    const [replyTexts, setReplyTexts] = useState({});
    const [showReplyId, setShowReplyId] = useState(null);
    const [saving, setSaving] = useState(null);
    const [filter, setFilter] = useState('All');

    const filtered = filter === 'All' ? reviews
        : filter === 'Replied' ? reviews.filter(r => r.managerReply?.text)
        : filter === 'Pending' ? reviews.filter(r => !r.managerReply?.text)
        : reviews.filter(r => r.isReported);

    const handleReply = async (id) => {
        const text = replyTexts[id];
        if (!text?.trim()) return;
        setSaving(id);
        try {
            await API.put(`/manager/reviews/${id}/reply`, { text });
            onRefresh();
            setShowReplyId(null);
            setReplyTexts(t => ({ ...t, [id]: '' }));
        } catch { alert('Failed to post reply'); }
        setSaving(null);
    };

    const handleReport = async (id) => {
        if (!window.confirm('Report this review as inappropriate?')) return;
        try {
            await API.put(`/manager/reviews/${id}/report`, { reason: 'Inappropriate content' });
            onRefresh();
        } catch { alert('Report failed'); }
    };

    const avgRating = reviews.length > 0 ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1) : 0;

    return (
        <div>
            <div className="mgr-section-title mb-16">⭐ Reviews & Ratings</div>

            {/* Summary */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16, marginBottom: 24 }}>
                {[
                    { label: 'Avg Rating', value: `${avgRating} ⭐`, color: '#f59e0b', bg: '#fef3c7' },
                    { label: 'Total Reviews', value: reviews.length, color: '#6d5dfc', bg: '#f1f0ff' },
                    { label: 'Replied', value: reviews.filter(r => r.managerReply?.text).length, color: '#10b981', bg: '#d1fae5' },
                    { label: 'Reported', value: reviews.filter(r => r.isReported).length, color: '#f43f5e', bg: '#fff1f2' },
                ].map(s => (
                    <div key={s.label} style={{ background: s.bg, borderRadius: '16px', padding: '16px 20px', border: `1px solid ${s.color}20`, display: 'flex', flexDirection: 'column', gap: 4 }}>
                        <div style={{ fontSize: '1.5rem', fontWeight: 900, color: s.color, lineHeight: 1 }}>{s.value}</div>
                        <div style={{ fontSize: '0.75rem', fontWeight: 700, color: s.color, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{s.label}</div>
                    </div>
                ))}
            </div>

            {/* Filter Tabs */}
            <div className="mgr-subtabs mb-16">
                {['All', 'Pending', 'Replied', 'Reported'].map(f => (
                    <button key={f} className={`mgr-subtab ${filter === f ? 'active' : ''}`} onClick={() => setFilter(f)}>{f}</button>
                ))}
            </div>

            {/* Review List */}
            {filtered.map(review => (
                <div key={review._id} className="review-card">
                    <div className="review-header">
                        <div>
                            <div className="reviewer-name">{review.user?.name || 'Guest'}</div>
                            <div className="stars">{Stars({ rating: review.rating })} ({review.rating}/5)</div>
                            {review.hotel?.name && <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginTop: 2 }}>📍 {review.hotel.name}</div>}
                        </div>
                        <div style={{ textAlign: 'right' }}>
                            <div className="review-date">{new Date(review.createdAt).toLocaleDateString('en-IN')}</div>
                            {review.isReported && <span className="badge badge-red" style={{ marginTop: 4 }}>🚩 Reported</span>}
                        </div>
                    </div>

                    <div className="review-text">"{review.comment}"</div>

                    {/* Existing Reply */}
                    {review.managerReply?.text && (
                        <div className="reply-box" style={{ background: 'var(--primary-light)', borderLeft: '3px solid var(--primary)', padding: '12px 16px', borderRadius: '8px', marginTop: '12px' }}>
                            <div style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--primary-dark)', textTransform: 'uppercase', marginBottom: '4px' }}>Manager Response</div>
                            <div style={{ fontSize: '0.85rem', color: 'var(--text-primary)', lineHeight: 1.5 }}>{review.managerReply.text}</div>
                            <div style={{ fontSize: '0.7rem', marginTop: 8, opacity: 0.6, color: 'var(--text-secondary)' }}>Replied on {new Date(review.managerReply.repliedAt).toLocaleDateString('en-IN', { dateStyle: 'medium' })}</div>
                        </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex-gap" style={{ marginTop: 10 }}>
                        {!review.managerReply?.text && (
                            <button className="mgr-btn mgr-btn-outline mgr-btn-sm" onClick={() => setShowReplyId(showReplyId === review._id ? null : review._id)}>
                                💬 Reply
                            </button>
                        )}
                        {review.managerReply?.text && (
                            <button className="mgr-btn mgr-btn-outline mgr-btn-sm" onClick={() => setShowReplyId(showReplyId === review._id ? null : review._id)}>
                                ✏️ Edit Reply
                            </button>
                        )}
                        {!review.isReported && (
                            <button className="mgr-btn mgr-btn-outline mgr-btn-sm" onClick={() => handleReport(review._id)}>
                                🚩 Report
                            </button>
                        )}
                    </div>

                    {/* Reply Input */}
                    {showReplyId === review._id && (
                        <div className="reply-input-area">
                            <textarea
                                className="mgr-input"
                                placeholder="Write your response to this review..."
                                value={replyTexts[review._id] || review.managerReply?.text || ''}
                                onChange={e => setReplyTexts(t => ({ ...t, [review._id]: e.target.value }))}
                                style={{ minHeight: 70, marginBottom: 8 }}
                            />
                            <div className="flex-gap">
                                <button className="mgr-btn mgr-btn-primary mgr-btn-sm" onClick={() => handleReply(review._id)} disabled={saving === review._id}>
                                    {saving === review._id ? 'Saving...' : 'Post Reply'}
                                </button>
                                <button className="mgr-btn mgr-btn-outline mgr-btn-sm" onClick={() => setShowReplyId(null)}>Cancel</button>
                            </div>
                        </div>
                    )}
                </div>
            ))}

            {filtered.length === 0 && (
                <div className="mgr-empty"><div className="empty-icon">⭐</div><p>No reviews in this category</p></div>
            )}
        </div>
    );
};

export default ManagerReviews;
