import React, { useState } from 'react';
import { 
    FaEnvelope, FaMoon, FaSave, FaShieldAlt, 
    FaBell, FaGlobe, FaTrashAlt, FaFingerprint, FaMobileAlt
} from 'react-icons/fa';
import './dashboard.css';

const CustomerSettings = () => {
    const [prefs, setPrefs] = useState({
        marketingEmails: true,
        bookingAlerts: true,
        smsAlerts: false,
        promotions: true,
        twoFactor: false,
        darkMode: false,
        language: 'English',
    });

    const toggle = (key) => setPrefs(p => ({ ...p, [key]: !p[key] }));

    return (
        <div className="animate-fade-in max-w-[800px] mx-auto">
            <div className="mb-10 text-center sm:text-left">
                <h1 className="text-3xl font-extrabold text-slate-900 mb-2">Settings</h1>
                <p className="text-slate-500 font-medium">Manage your account preferences and security settings.</p>
            </div>

            <div className="space-y-8">
                {/* 1. Communication Preferences */}
                <div className="cd-card-premium">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-500 flex items-center justify-center text-lg">
                            <FaEnvelope />
                        </div>
                        <h2 className="text-lg font-bold text-slate-800">Communication</h2>
                    </div>
                    
                    <div className="space-y-1">
                        <div className="ios-toggle-wrap">
                            <div>
                                <h4 className="text-sm font-bold text-slate-800">Email Notifications</h4>
                                <p className="text-xs text-slate-400 font-medium">Receive updates about your bookings via email.</p>
                            </div>
                            <input 
                                type="checkbox" 
                                className="ios-toggle" 
                                checked={prefs.marketingEmails} 
                                onChange={() => toggle('marketingEmails')} 
                            />
                        </div>
                        <div className="ios-toggle-wrap">
                            <div>
                                <h4 className="text-sm font-bold text-slate-800">SMS Alerts</h4>
                                <p className="text-xs text-slate-400 font-medium">Get instant SMS for confirmed check-ins.</p>
                            </div>
                            <input 
                                type="checkbox" 
                                className="ios-toggle" 
                                checked={prefs.smsAlerts} 
                                onChange={() => toggle('smsAlerts')} 
                            />
                        </div>
                        <div className="ios-toggle-wrap">
                            <div>
                                <h4 className="text-sm font-bold text-slate-800">Offers & Promotions</h4>
                                <p className="text-xs text-slate-400 font-medium">Special deals tailored just for you.</p>
                            </div>
                            <input 
                                type="checkbox" 
                                className="ios-toggle" 
                                checked={prefs.promotions} 
                                onChange={() => toggle('promotions')} 
                            />
                        </div>
                    </div>
                </div>

                {/* 2. Security & Access */}
                <div className="cd-card-premium">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-500 flex items-center justify-center text-lg">
                            <FaShieldAlt />
                        </div>
                        <h2 className="text-lg font-bold text-slate-800">Security & Access</h2>
                    </div>

                    <div className="space-y-4">
                        <div className="flex items-center justify-between py-2 border-b border-slate-50">
                            <div>
                                <h4 className="text-sm font-bold text-slate-800">Change Password</h4>
                                <p className="text-xs text-slate-400 font-medium">Update your login credentials.</p>
                            </div>
                            <button className="text-xs font-bold text-[#6d5dfc] hover:bg-[#6d5dfc]/5 px-4 py-2 rounded-lg transition-all">
                                Update
                            </button>
                        </div>
                        <div className="ios-toggle-wrap">
                            <div>
                                <h4 className="text-sm font-bold text-slate-800">Two-Factor Authentication</h4>
                                <p className="text-xs text-slate-400 font-medium">Add an extra layer of security.</p>
                            </div>
                            <input 
                                type="checkbox" 
                                className="ios-toggle" 
                                checked={prefs.twoFactor} 
                                onChange={() => toggle('twoFactor')} 
                            />
                        </div>
                        <div className="flex items-center justify-between py-2">
                            <div>
                                <h4 className="text-sm font-bold text-slate-800">Device Activity</h4>
                                <p className="text-xs text-slate-400 font-medium">Manage your active sessions.</p>
                            </div>
                            <button className="text-xs font-bold text-slate-600 hover:bg-slate-100 px-4 py-2 rounded-lg transition-all">
                                View All
                            </button>
                        </div>
                    </div>
                </div>

                {/* 3. App Preferences */}
                <div className="cd-card-premium">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-500 flex items-center justify-center text-lg">
                            <FaMoon />
                        </div>
                        <h2 className="text-lg font-bold text-slate-800">App Preferences</h2>
                    </div>

                    <div className="space-y-1">
                        <div className="ios-toggle-wrap">
                            <div>
                                <h4 className="text-sm font-bold text-slate-800">Dark Mode</h4>
                                <p className="text-xs text-slate-400 font-medium">Switch to a darker visual theme.</p>
                            </div>
                            <input 
                                type="checkbox" 
                                className="ios-toggle" 
                                checked={prefs.darkMode} 
                                onChange={() => toggle('darkMode')} 
                            />
                        </div>
                        <div className="flex items-center justify-between py-4">
                            <div>
                                <h4 className="text-sm font-bold text-slate-800">Language</h4>
                                <p className="text-xs text-slate-400 font-medium">Select your preferred language.</p>
                            </div>
                            <select 
                                className="bg-slate-50 border-none text-xs font-bold text-slate-600 rounded-lg px-3 py-2 outline-none cursor-pointer"
                                value={prefs.language}
                                onChange={(e) => setPrefs(p => ({ ...p, language: e.target.value }))}
                            >
                                <option>English</option>
                                <option>Spanish</option>
                                <option>French</option>
                                <option>German</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* 4. Privacy */}
                <div className="cd-card-premium !bg-rose-50/30 border-rose-100">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center text-lg">
                            <FaTrashAlt />
                        </div>
                        <h2 className="text-lg font-bold text-rose-800">Privacy & Data</h2>
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div>
                            <h4 className="text-sm font-bold text-rose-900">Delete Account</h4>
                            <p className="text-xs text-rose-700/60 font-medium max-w-sm">Permanently remove your account and all associated data. This action cannot be undone.</p>
                        </div>
                        <button className="bg-rose-500 hover:bg-rose-600 text-white px-6 py-3 rounded-xl text-xs font-bold transition-all shadow-lg shadow-rose-200">
                            Delete Account
                        </button>
                    </div>
                </div>
            </div>

            <div className="mt-12 flex justify-center">
                <button 
                    onClick={() => alert('Settings saved successfully!')}
                    className="cd-btn-gradient px-12 py-4 rounded-2xl text-sm font-bold"
                >
                    <FaSave className="mr-2" /> Save All Changes
                </button>
            </div>
        </div>
    );
};

export default CustomerSettings;
