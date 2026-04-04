import React, { useState, useContext, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import API from '../utils/api';
import { AuthContext } from '../context/AuthContext';
import './Auth.css';

const Login = () => {
    const [view, setView] = useState('login'); // 'login' | 'register'
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [rememberMe, setRememberMe] = useState(false);
    const [mode, setMode] = useState('login'); // 'login' | 'otp'
    const [otp, setOtp] = useState(['', '', '', '', '', '']);
    const [loading, setLoading] = useState(false);
    
    const { login } = useContext(AuthContext);
    const navigate = useNavigate();
    const location = useLocation();

    const [msg, setMsg] = useState('');
    const [otpError, setOtpError] = useState(false);

    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const viewParam = params.get('view');
        if (viewParam === 'register' || viewParam === 'login') {
            setView(viewParam);
        }

        const requireOtp = params.get('require_otp');
        const queryEmail = params.get('email');
        const queryMsg = params.get('msg');

        if (queryMsg) {
            setMsg(queryMsg);
        } else {
            const redirect = params.get('redirect');
            if (redirect === '/rooms') setMsg('Please login to continue booking');
        }

        if (requireOtp === 'true' && queryEmail) {
            setEmail(queryEmail);
            setMode('otp');
        }
    }, [location]);

    const handleGoogleLogin = () => {
        window.location.href = 'http://localhost:5000/api/users/auth/google';
    };

    const handlePasswordLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const { data } = await API.post('/users/login', { 
                email: email.toLowerCase().trim(), 
                password 
            });
            login(data);
            
            if (data.role === 'admin') {
                navigate('/admin/dashboard');
            } else if (data.role === 'manager') {
                navigate('/manager/dashboard');
            } else {
                const params = new URLSearchParams(location.search);
                const redirect = params.get('redirect') || '/';
                navigate(redirect);
            }
        } catch (error) {
            alert(error.response?.data?.message || 'Login failed');
        } finally {
            setLoading(false);
        }
    };

    const handleRegister = async (e) => {
        e.preventDefault();
        if (password !== confirmPassword) {
            alert("Passwords do not match!");
            return;
        }
        setLoading(true);
        try {
            await API.post('/users/register', { 
                name: `${firstName} ${lastName}`.trim(), 
                email: email.toLowerCase().trim(), 
                password 
            });
            setMsg('Registration successful! Please login.');
            setView('login');
        } catch (error) {
            alert(error.response?.data?.message || 'Registration failed');
        } finally {
            setLoading(false);
        }
    };

    const handleOtpChange = (e, index) => {
        const value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
        if (value.length > 1) return;

        const newOtp = [...otp];
        newOtp[index] = value;
        setOtp(newOtp);
        setOtpError(false);

        if (value && index < 5) {
            document.getElementById(`otp-${index + 1}`).focus();
        }
    };

    const handleOtpKeyDown = (e, index) => {
        if (e.key === 'Backspace' && !otp[index] && index > 0) {
            document.getElementById(`otp-${index - 1}`).focus();
        }
    };

    const handleOtpPaste = (e) => {
        e.preventDefault();
        const pasteData = e.clipboardData.getData('text').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6).split('');
        if (pasteData.length === 0) return;

        const newOtp = [...otp];
        pasteData.forEach((char, i) => {
            if (i < 6) newOtp[i] = char;
        });
        setOtp(newOtp);
        setOtpError(false);

        const focusIdx = Math.min(pasteData.length, 5);
        document.getElementById(`otp-${focusIdx}`).focus();
    };

    const handleVerifyOtp = async (e) => {
        e.preventDefault();
        const otpString = otp.join('');
        if (otpString.length < 6) return alert("Please enter the full 6-character code.");

        setLoading(true);
        try {
            const { data } = await API.post('/users/verify-otp', { email, otp: otpString });
            login(data);
            
            if (data.role === 'admin') {
                navigate('/admin/dashboard');
            } else if (data.role === 'manager') {
                navigate('/manager/dashboard');
            } else {
                const params = new URLSearchParams(location.search);
                const redirect = params.get('redirect') || '/';
                navigate(redirect);
            }
        } catch (error) {
            setOtpError(true);
            alert(error.response?.data?.message || 'Invalid verification code');
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
                        {msg && <div className="auth-success-alert">{msg}</div>}

                        {mode === 'otp' ? (
                            <>
                                <h2 className="auth-form-title">Verify Account</h2>
                                <p className="auth-form-subtitle">Enter the 6-digit code sent to <strong>{email}</strong></p>
                                
                                <form onSubmit={handleVerifyOtp}>
                                    <div className="otp-modern-container">
                                        {otp.map((digit, idx) => (
                                            <input
                                                key={idx}
                                                id={`otp-${idx}`}
                                                type="text"
                                                maxLength="1"
                                                className={`otp-modern-input ${otpError ? 'error' : ''}`}
                                                value={digit}
                                                onChange={(e) => handleOtpChange(e, idx)}
                                                onKeyDown={(e) => handleOtpKeyDown(e, idx)}
                                                onPaste={handleOtpPaste}
                                                aria-label={`Digit ${idx + 1}`}
                                                autoFocus={idx === 0}
                                            />
                                        ))}
                                    </div>
                                    <button 
                                        type="submit" 
                                        className="auth-submit-btn" 
                                        disabled={loading || otp.join('').length !== 6}
                                    >
                                        {loading ? 'Verifying...' : 'Verify Now'}
                                    </button>
                                    <button type="button" onClick={() => setMode('login')} className="auth-submit-btn" style={{ background: 'transparent', border: '1px solid var(--auth-input-border)', marginTop: '15px' }}>
                                        Change Email
                                    </button>
                                </form>
                            </>
                        ) : (
                            <>
                                <h2 className="auth-form-title">
                                    {view === 'login' ? 'Log in' : 'Create an account'}
                                </h2>
                                <p className="auth-form-subtitle">
                                    {view === 'login' 
                                        ? <>New to Elite Stays? <span className="auth-bottom-link" onClick={() => setView('register')} style={{ cursor: 'pointer' }}>Register here</span></>
                                        : <>Already have an account? <span className="auth-bottom-link" onClick={() => setView('login')} style={{ cursor: 'pointer' }}>Log in</span></>
                                    }
                                </p>

                                <form onSubmit={view === 'login' ? handlePasswordLogin : handleRegister}>
                                    {view === 'register' && (
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
                                    )}

                                    <div className="modern-input-group">
                                        <input
                                            type="email"
                                            className="modern-input"
                                            placeholder="Email"
                                            value={email}
                                            onChange={(emailE => setEmail(emailE.target.value))}
                                            required
                                        />
                                    </div>

                                    <div className="modern-input-group">
                                        <div className="modern-password-wrapper">
                                            <input
                                                type={showPassword ? "text" : "password"}
                                                className="modern-input"
                                                placeholder={view === 'login' ? "Enter your password" : "Create password"}
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

                                    {view === 'register' && (
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
                                    )}

                                    <div className="auth-checkbox-row">
                                        {view === 'login' ? (
                                            <>
                                                <label className="checkbox-group-v3">
                                                    <input 
                                                        type="checkbox" 
                                                        checked={rememberMe}
                                                        onChange={(e) => setRememberMe(e.target.checked)}
                                                    />
                                                    <span>Remember me</span>
                                                </label>
                                                <a href="#" className="forgot-link-v3">Forgot Password?</a>
                                            </>
                                        ) : (
                                            <label className="checkbox-group-v3">
                                                <input type="checkbox" required />
                                                <span>I agree to the <a href="#" className="auth-bottom-link">Terms & Conditions</a></span>
                                            </label>
                                        )}
                                    </div>

                                    <button type="submit" className="auth-submit-btn" disabled={loading}>
                                        {loading 
                                            ? 'Processing...' 
                                            : (view === 'login' ? 'Log In' : 'Create account')
                                        }
                                    </button>
                                </form>

                                <div className="auth-divider-v3">
                                    <span>Or register with</span>
                                </div>

                                <div className="auth-social-row">
                                    <button className="social-btn-v3" onClick={handleGoogleLogin} type="button">
                                        <img src="https://upload.wikimedia.org/wikipedia/commons/c/c1/Google_%22G%22_logo.svg" alt="G" />
                                        Google
                                    </button>
                                    <button className="social-btn-v3" type="button" onClick={() => alert('Apple login coming soon!')}>
                                        <img src="https://upload.wikimedia.org/wikipedia/commons/f/fa/Apple_logo_black.svg" alt="A" style={{ filter: 'invert(1)' }} />
                                        Apple
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Login;
