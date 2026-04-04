import React, { useContext, useState } from 'react';
import { AuthContext } from '../../context/AuthContext';
import API from '../../utils/api';
import { 
    FaUser, FaLock, FaEnvelope, FaCheckCircle, 
    FaShieldAlt, FaCamera, FaSave
} from 'react-icons/fa';
import './dashboard.css';

const CustomerProfile = () => {
    const { userInfo } = useContext(AuthContext);
    const [name, setName] = useState(userInfo?.name || '');
    const [password, setPassword] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [success, setSuccess] = useState('');
    const [error, setError] = useState('');

    const handleUpdate = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        setSuccess('');
        setError('');

        try {
            await API.put('/users/profile', { name, password });
            setSuccess('Profile updated successfully!');
            setPassword('');
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to update profile');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="animate-fade-in">
            {/* Top Section */}
            <div className="cd-profile-top">
                <div className="cd-profile-avatar-large">
                    {userInfo?.name?.charAt(0).toUpperCase() || 'U'}
                </div>
                <h1 className="cd-profile-name">{userInfo?.name || 'Elite Member'}</h1>
                <p className="cd-profile-email">{userInfo?.email}</p>
            </div>

            <div className="max-w-[800px] mx-auto">
                {success && (
                    <div className="mb-8 p-4 bg-green-50 border border-green-100 text-green-600 rounded-2xl flex items-center gap-3 animate-in slide-in-from-top-4 duration-300">
                        <FaCheckCircle /> <span className="text-sm font-bold uppercase tracking-tight">{success}</span>
                    </div>
                )}
                {error && (
                    <div className="mb-8 p-4 bg-red-50 border border-red-100 text-red-600 rounded-2xl text-sm font-bold tracking-tight">
                        {error}
                    </div>
                )}

                <form onSubmit={handleUpdate} className="space-y-8">
                    {/* Personal Info Card */}
                    <div className="cd-profile-card-v4">
                        <h2 className="cd-card-title-v4">
                            <FaUser className="text-[#6d5dfc]" /> Personal Information
                        </h2>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="flex flex-col gap-3">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest pl-1">Full Name</label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        value={name}
                                        onChange={e => setName(e.target.value)}
                                        className="w-full bg-[#f8fafc] border border-slate-100 focus:border-[#6d5dfc] focus:bg-white rounded-2xl py-4 px-6 outline-none transition-all font-semibold text-[#1e293b] text-sm"
                                        placeholder="Your full name"
                                    />
                                </div>
                            </div>

                            <div className="flex flex-col gap-3">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest pl-1">Email Address</label>
                                <div className="relative">
                                    <input
                                        type="email"
                                        value={userInfo?.email || ''}
                                        readOnly
                                        disabled
                                        className="w-full bg-[#f8fafc] border border-slate-100 rounded-2xl py-4 px-6 outline-none font-semibold text-slate-400 text-sm cursor-not-allowed opacity-70"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Security Card */}
                    <div className="cd-profile-card-v4">
                        <h2 className="cd-card-title-v4">
                            <FaLock className="text-[#6d5dfc]" /> Security & Password
                        </h2>
                        
                        <div className="flex flex-col gap-3">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest pl-1">New Password</label>
                            <input
                                type="password"
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                className="w-full bg-[#f8fafc] border border-slate-100 focus:border-[#6d5dfc] focus:bg-white rounded-2xl py-4 px-6 outline-none transition-all font-semibold text-[#1e293b] text-sm"
                                placeholder="••••••••••••"
                            />
                            <p className="text-[11px] text-slate-400 font-medium mt-1 pl-1">Leave blank to keep your current password</p>
                        </div>

                        <div className="mt-10 pt-8 border-t border-slate-50 flex justify-end">
                            <button type="submit" className="cd-btn-gradient" disabled={submitting}>
                                {submitting ? 'Updating...' : <><FaSave /> Save Changes</>}
                            </button>
                        </div>
                    </div>
                </form>

                {/* Privacy Badge */}
                <div className="mt-12 p-8 bg-white/50 backdrop-blur-sm border border-white rounded-[32px] flex items-center gap-6">
                    <div className="w-16 h-16 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-500 text-2xl flex-shrink-0">
                        <FaShieldAlt />
                    </div>
                    <div>
                        <h4 className="text-sm font-bold text-slate-800 mb-1">Privacy & Safety Protected</h4>
                        <p className="text-xs text-slate-400 leading-relaxed font-medium">
                            Your account is secured with 256-bit encryption. We prioritize your data privacy and security.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CustomerProfile;
