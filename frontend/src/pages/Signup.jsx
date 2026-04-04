import React, { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import API from '../utils/api';
import { AuthContext } from '../context/AuthContext';
import './Auth.css';

const Signup = () => {
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    
    const { login } = useContext(AuthContext);
    const navigate = useNavigate();

    const handleGoogleLogin = () => {
        window.location.href = 'http://localhost:5000/api/users/auth/google';
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (password !== confirmPassword) {
            return alert("Passwords do not match");
        }
        setLoading(true);
        try {
            const { data } = await API.post('/users/register', { 
                name: `${firstName} ${lastName}`.trim(), 
                email: email.toLowerCase().trim(), 
                password 
            });
            login(data);
            navigate('/');
        } catch (error) {
            alert(error.response?.data?.message || 'Registration failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-split-wrapper">
            <div className="auth-modern-card">
                {/* 1. Visual Panel (Left) */}
                <div className="auth-visual-side">
                    <div className="visual-content-wrapper">
                        <div className="auth-logo-text">EL<span>ITE</span></div>
                        
                        <div className="hero-quote-box">
                            <h1 className="visual-title">Capturing Moments,<br/> Creating Memories</h1>
                            <div className="slide-indicators-custom">
                                <span className="indicator-line"></span>
                                <span className="indicator-line"></span>
                                <span className="indicator-line active"></span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 2. Form Panel (Right) */}
                <div className="auth-form-section">
                    <div className="auth-form-container">
                        <h2 className="auth-form-title">Create account</h2>
                        <p className="auth-form-subtitle">
                            Already have an account? <Link to="/login" className="auth-bottom-link">Log in</Link>
                        </p>

                        <form onSubmit={handleSubmit}>
                            <div className="name-row-inline">
                                <div className="modern-input-group">
                                    <input
                                        type="text"
                                        className="modern-input"
                                        placeholder="First name"
                                        value={firstName}
                                        onChange={(e) => setFirstName(e.target.value)}
                                        required
                                    />
                                </div>
                                <div className="modern-input-group">
                                    <input
                                        type="text"
                                        className="modern-input"
                                        placeholder="Last name"
                                        value={lastName}
                                        onChange={(e) => setLastName(e.target.value)}
                                        required
                                    />
                                </div>
                            </div>

                            <div className="modern-input-group">
                                <input
                                    type="email"
                                    className="modern-input"
                                    placeholder="Email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                />
                            </div>

                            <div className="modern-input-group">
                                <div className="modern-password-wrapper">
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        className="modern-input"
                                        placeholder="Enter your password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                    />
                                    <button 
                                        type="button" 
                                        className="password-toggle-v3"
                                        onClick={() => setShowPassword(!showPassword)}
                                    >
                                        {showPassword ? <i className="fas fa-eye-slash"></i> : <i className="fas fa-eye"></i>}
                                    </button>
                                </div>
                            </div>

                            <div className="modern-input-group">
                                <div className="modern-password-wrapper">
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        className="modern-input"
                                        placeholder="Confirm password"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        required
                                    />
                                </div>
                            </div>

                            <div className="auth-checkbox-row">
                                <label className="checkbox-group-v3">
                                    <input type="checkbox" required />
                                    <span>I agree to the <a href="#" className="auth-bottom-link">Terms & Conditions</a></span>
                                </label>
                            </div>

                            <button type="submit" className="auth-submit-btn" disabled={loading}>
                                {loading ? 'Processing...' : 'Create account'}
                            </button>
                        </form>

                        <div className="auth-divider-v3">
                            <span>Or register with</span>
                        </div>

                        <div className="auth-social-row">
                            <button className="social-btn-v3" type="button" onClick={handleGoogleLogin}>
                                <img src="https://upload.wikimedia.org/wikipedia/commons/c/c1/Google_%22G%22_logo.svg" alt="G" />
                                Google
                            </button>
                            <button className="social-btn-v3" type="button" onClick={() => alert('Apple login coming soon!')}>
                                <img src="https://upload.wikimedia.org/wikipedia/commons/f/fa/Apple_logo_black.svg" alt="A" style={{ filter: 'invert(1)' }} />
                                Apple
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Signup;
