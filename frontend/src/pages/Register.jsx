import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import API, { BACKEND_URL } from '../utils/api';
import './Auth.css';

const Register = () => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    
    // Interactive States
    const [focusedInput, setFocusedInput] = useState(null);
    const [passwordStrength, setPasswordStrength] = useState(0);
    const [formProgress, setFormProgress] = useState(0);
    
    const navigate = useNavigate();

    // Calculate password strength & form progress
    useEffect(() => {
        let strength = 0;
        if (password.length > 5) strength += 20;
        if (password.length > 7) strength += 20;
        if (/[A-Z]/.test(password)) strength += 20;
        if (/[0-9]/.test(password)) strength += 20;
        if (/[^A-Za-z0-9]/.test(password)) strength += 20;
        setPasswordStrength(strength);

        let progress = 0;
        if (name.length > 2) progress += 25;
        if (email.includes('@') && email.includes('.')) progress += 25;
        if (strength > 40) progress += 25;
        if (confirmPassword && confirmPassword === password) progress += 25;
        setFormProgress(progress);
    }, [name, email, password, confirmPassword]);

    const isMatch = password && confirmPassword && password === confirmPassword;

    const handleRegister = async (e) => {
        e.preventDefault();
        if (password !== confirmPassword) return alert("Passwords do not match");
        
        setLoading(true);
        try {
            await API.post('/users/register', { 
                name, 
                email: email.toLowerCase().trim(), 
                password 
            });
            alert('Registration successful! Please login.');
            navigate('/login');
        } catch (error) {
            alert(error.response?.data?.message || 'Registration failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-split-wrapper register-theme">
            <div className="auth-visual-side register-visual">
                <div className="visual-content-wrapper interactive-wrapper">
                    <span className="tagline-badge register-badge">Discover stays across India</span>
                    <h1 className="visual-title register-title">Your Next Luxury <br/> Stay Awaits</h1>
                    <p className="auth-hero-subtitle">Experience the finest hospitality and premium comfort. Create your account and begin the journey.</p>
                    
                    <div className="floating-icons-container">
                        <div className="float-icon icon-1" title="Top Locations">
                            <img src="https://cdn-icons-png.flaticon.com/512/684/684908.png" alt="Location" />
                        </div>
                        <div className="float-icon icon-2" title="Verified Stays">
                            <img src="https://cdn-icons-png.flaticon.com/512/190/190411.png" alt="Verified" />
                        </div>
                        <div className="float-icon icon-3" title="Easy Booking">
                            <img src="https://cdn-icons-png.flaticon.com/512/2693/2693507.png" alt="Calendar" />
                        </div>
                    </div>
                </div>
            </div>

            <div className="auth-form-section">
                <div className="auth-form-container register-form">
                    
                    <div className="form-progress-container">
                        <div className="form-progress-bar" style={{ width: `${formProgress}%`, background: formProgress === 100 ? '#a5c1a1' : '#6c63ff' }}></div>
                    </div>

                    <div className="auth-modern-tabs">
                        <Link to="/login" className="auth-tab">
                            Log In
                        </Link>
                        <button className="auth-tab active" type="button">
                            Register
                        </button>
                    </div>

                    <h2 className="auth-form-title interactive-title">Create Account</h2>
                    <p className="auth-form-subtitle">Join Elite Stays and discover your perfect getaway</p>

                    <form onSubmit={handleRegister}>
                        <div className={`modern-input-group interactive-group ${focusedInput === 'name' ? 'focused' : ''} ${name.length > 2 ? 'valid' : ''}`}>
                            <label>Full Name {name.length > 2 && <span className="valid-check">✔</span>}</label>
                            <div className="modern-password-wrapper">
                                <div className="input-icon-left">👤</div>
                                <input
                                    type="text"
                                    className="modern-input"
                                    placeholder="John Doe"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    onFocus={() => setFocusedInput('name')}
                                    onBlur={() => setFocusedInput(null)}
                                    required
                                />
                            </div>
                        </div>

                        <div className={`modern-input-group interactive-group ${focusedInput === 'email' ? 'focused' : ''} ${email.includes('@') ? 'valid' : ''}`}>
                            <label>Email Address {email.includes('@') && <span className="valid-check">✔</span>}</label>
                            <div className="modern-password-wrapper">
                                <div className="input-icon-left">
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>
                                </div>
                                <input
                                    type="email"
                                    className="modern-input"
                                    placeholder="name@company.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    onFocus={() => setFocusedInput('email')}
                                    onBlur={() => setFocusedInput(null)}
                                    required
                                />
                            </div>
                        </div>

                        <div className={`modern-input-group interactive-group ${focusedInput === 'password' ? 'focused' : ''}`}>
                            <label className="password-label">
                                Password
                                {password && <span className="strength-text" style={{ color: passwordStrength > 80 ? '#4ade80' : passwordStrength > 40 ? '#facc15' : '#f87171' }}>
                                    {passwordStrength > 80 ? 'Strong' : passwordStrength > 40 ? 'Good' : 'Weak'}
                                </span>}
                            </label>
                            <div className="modern-password-wrapper">
                                <div className="input-icon-left">
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
                                </div>
                                <input
                                    type={showPassword ? "text" : "password"}
                                    className="modern-input"
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    onFocus={() => setFocusedInput('password')}
                                    onBlur={() => setFocusedInput(null)}
                                    required
                                />
                                <button 
                                    type="button" 
                                    className="password-toggle"
                                    onClick={() => setShowPassword(!showPassword)}
                                >
                                    {showPassword ? "Hide" : "Show"}
                                </button>
                            </div>
                            <div className="password-progress-underlay">
                                <div className="password-progress-fill" style={{ width: `${passwordStrength}%`, background: passwordStrength > 80 ? '#4ade80' : passwordStrength > 40 ? '#facc15' : '#f87171' }}></div>
                            </div>
                        </div>

                        <div className={`modern-input-group interactive-group ${focusedInput === 'confirm' ? 'focused' : ''} ${isMatch ? 'match' : confirmPassword ? 'mismatch' : ''}`}>
                            <label>Confirm Password {isMatch && <span className="match-icon">✅</span>} {confirmPassword && !isMatch && <span className="mismatch-icon">❌</span>}</label>
                            <div className="modern-password-wrapper">
                                <div className="input-icon-left">🛡️</div>
                                <input
                                    type={showPassword ? "text" : "password"}
                                    className="modern-input"
                                    placeholder="••••••••"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    onFocus={() => setFocusedInput('confirm')}
                                    onBlur={() => setFocusedInput(null)}
                                    required
                                />
                            </div>
                        </div>

                        {/* Interactive Re-designed Submit Button Area */}
                        <div className={`register-submit-wrapper ${formProgress === 100 ? 'ready' : ''}`}>
                            <button type="submit" className="register-custom-btn" disabled={loading || formProgress < 100}>
                                {loading ? 'PROCESSING...' : 'REGISTER'}
                            </button>
                        </div>
                    </form>

                    <div className="auth-social-group mt-15">
                        <button className="btn-social-modern" type="button" onClick={() => window.location.href = `${BACKEND_URL}/api/users/auth/google`}>
                            <img src="https://upload.wikimedia.org/wikipedia/commons/c/c1/Google_%22G%22_logo.svg" alt="G" />
                            Google
                        </button>
                        <button className="btn-social-modern" type="button" onClick={() => alert('Coming soon!')}>
                            <img src="https://upload.wikimedia.org/wikipedia/commons/b/b8/2021_Facebook_icon.svg" alt="F" />
                            Facebook
                        </button>
                    </div>

                    <div className="auth-bottom-text">
                        Already have an account? <Link to="/login" className="auth-bottom-link">Log In</Link>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Register;

