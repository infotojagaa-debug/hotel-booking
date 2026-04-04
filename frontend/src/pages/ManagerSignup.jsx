import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import API from '../utils/api';

const ManagerSignup = () => {
    const navigate = useNavigate();
    const [step, setStep] = useState(1);
    const [form, setForm] = useState({
        name: '', email: '', phone: '', password: '', confirmPassword: '',
        hotelName: '', hotelLocation: '', licenseInfo: '',
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (form.password !== form.confirmPassword) { setError('Passwords do not match'); return; }
        if (form.password.length < 6) { setError('Password must be at least 6 characters'); return; }
        setLoading(true); setError('');
        try {
            await API.post('/users', {
                name: form.name, email: form.email, password: form.password,
                role: 'manager', phone: form.phone,
                hotelName: form.hotelName, hotelLocation: form.hotelLocation, licenseInfo: form.licenseInfo,
            });
            setStep(3); // Success
        } catch (err) {
            setError(err.response?.data?.message || 'Registration failed. Please try again.');
        }
        setLoading(false);
    };

    if (step === 3) {
        return (
            <div style={styles.page}>
                <div style={styles.card}>
                    <div style={{ fontSize: 56, marginBottom: 16 }}>🎉</div>
                    <h2 style={styles.title}>Application Submitted!</h2>
                    <p style={styles.sub}>Your manager account has been created and is <strong>pending admin approval</strong>. You'll be able to login once an admin reviews your application.</p>
                    <div style={{ ...styles.alert, background: '#d1fae5', color: '#065f46', marginTop: 20 }}>
                        ✅ Check your email for confirmation details.
                    </div>
                    <Link to="/login" style={styles.btn}>Go to Login</Link>
                </div>
            </div>
        );
    }

    return (
        <div style={styles.page}>
            <div style={styles.card}>
                {/* Header */}
                <div style={{ textAlign: 'center', marginBottom: 28 }}>
                    <div style={{ width: 52, height: 52, background: 'linear-gradient(135deg,#6366f1,#818cf8)', borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, margin: '0 auto 12px' }}>🏨</div>
                    <h1 style={styles.title}>Manager Registration</h1>
                    <p style={styles.sub}>Register as a Hotel Manager — pending admin approval</p>
                </div>

                {/* Step Indicator */}
                <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
                    {['Personal Info', 'Hotel Details'].map((label, i) => (
                        <div key={i} style={{ flex: 1, textAlign: 'center' }}>
                            <div style={{ height: 4, borderRadius: 9999, background: step > i + 1 || (step === i + 1) ? '#6366f1' : '#e2e8f0', marginBottom: 6, transition: 'background 0.3s' }} />
                            <span style={{ fontSize: '0.72rem', color: step === i + 1 ? '#6366f1' : '#94a3b8', fontWeight: step === i + 1 ? 700 : 400 }}>Step {i + 1}: {label}</span>
                        </div>
                    ))}
                </div>

                {error && <div style={styles.alert}>{error}</div>}

                <form onSubmit={step === 1 ? (e) => { e.preventDefault(); setError(''); setStep(2); } : handleSubmit}>
                    {step === 1 && (
                        <>
                            <div style={styles.row}>
                                <div style={styles.group}>
                                    <label style={styles.label}>Full Name *</label>
                                    <input style={styles.input} placeholder="Your full name" value={form.name} onChange={e => set('name', e.target.value)} required />
                                </div>
                                <div style={styles.group}>
                                    <label style={styles.label}>Phone Number *</label>
                                    <input style={styles.input} placeholder="+91 XXXXX XXXXX" value={form.phone} onChange={e => set('phone', e.target.value)} required />
                                </div>
                            </div>
                            <div style={styles.group}>
                                <label style={styles.label}>Email Address *</label>
                                <input style={styles.input} type="email" placeholder="you@example.com" value={form.email} onChange={e => set('email', e.target.value)} required />
                            </div>
                            <div style={styles.row}>
                                <div style={styles.group}>
                                    <label style={styles.label}>Password *</label>
                                    <input style={styles.input} type="password" placeholder="Min. 6 characters" value={form.password} onChange={e => set('password', e.target.value)} required />
                                </div>
                                <div style={styles.group}>
                                    <label style={styles.label}>Confirm Password *</label>
                                    <input style={styles.input} type="password" placeholder="Repeat password" value={form.confirmPassword} onChange={e => set('confirmPassword', e.target.value)} required />
                                </div>
                            </div>
                            <button type="submit" style={styles.btn}>Continue →</button>
                        </>
                    )}

                    {step === 2 && (
                        <>
                            <div style={styles.group}>
                                <label style={styles.label}>Hotel/Property Name *</label>
                                <input style={styles.input} placeholder="e.g. The Grand Palace" value={form.hotelName} onChange={e => set('hotelName', e.target.value)} required />
                            </div>
                            <div style={styles.group}>
                                <label style={styles.label}>Hotel Location *</label>
                                <input style={styles.input} placeholder="City, State" value={form.hotelLocation} onChange={e => set('hotelLocation', e.target.value)} required />
                            </div>
                            <div style={styles.group}>
                                <label style={styles.label}>License / Registration Number *</label>
                                <input style={styles.input} placeholder="Hotel license or GST number" value={form.licenseInfo} onChange={e => set('licenseInfo', e.target.value)} required />
                            </div>
                            <div style={{ ...styles.alert, background: '#dbeafe', color: '#1e40af', marginBottom: 16 }}>
                                ℹ️ Your account will be <strong>pending</strong> until an admin reviews and approves your application.
                            </div>
                            <div style={{ display: 'flex', gap: 10 }}>
                                <button type="button" onClick={() => setStep(1)} style={{ ...styles.btn, background: '#f1f5f9', color: '#0f172a', flex: '0 0 auto' }}>← Back</button>
                                <button type="submit" style={{ ...styles.btn, flex: 1 }} disabled={loading}>
                                    {loading ? 'Submitting...' : 'Submit Application'}
                                </button>
                            </div>
                        </>
                    )}
                </form>

                <p style={{ textAlign: 'center', marginTop: 20, fontSize: '0.85rem', color: '#64748b' }}>
                    Already registered? <Link to="/login" style={{ color: '#6366f1', fontWeight: 600 }}>Sign In</Link>
                    &nbsp;·&nbsp;
                    <Link to="/signup" style={{ color: '#6366f1', fontWeight: 600 }}>Customer Sign Up</Link>
                </p>
            </div>
        </div>
    );
};

const styles = {
    page:   { minHeight: '100vh', background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #0f172a 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 16px', fontFamily: "'Inter', sans-serif" },
    card:   { background: '#fff', borderRadius: 20, padding: '40px 36px', width: '100%', maxWidth: 560, boxShadow: '0 25px 50px rgba(0,0,0,0.4)' },
    title:  { fontSize: '1.5rem', fontWeight: 800, color: '#0f172a', margin: '0 0 6px' },
    sub:    { fontSize: '0.875rem', color: '#64748b', margin: 0 },
    label:  { fontSize: '0.78rem', fontWeight: 600, color: '#64748b', marginBottom: 4, display: 'block' },
    input:  { width: '100%', padding: '10px 14px', border: '1.5px solid #e2e8f0', borderRadius: 8, fontSize: '0.875rem', color: '#0f172a', outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit', transition: 'border-color 0.2s' },
    group:  { marginBottom: 14, flex: 1 },
    row:    { display: 'flex', gap: 12 },
    btn:    { display: 'block', width: '100%', padding: '12px 0', background: 'linear-gradient(135deg,#6366f1,#4f46e5)', color: '#fff', border: 'none', borderRadius: 10, fontWeight: 700, fontSize: '0.95rem', cursor: 'pointer', textDecoration: 'none', textAlign: 'center', marginTop: 8, fontFamily: 'inherit' },
    alert:  { padding: '10px 14px', borderRadius: 8, background: '#fee2e2', color: '#991b1b', fontSize: '0.85rem', fontWeight: 600, marginBottom: 14 },
};

export default ManagerSignup;
