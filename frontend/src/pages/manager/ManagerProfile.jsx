import React, { useState } from 'react';
import API from '../../utils/api';

const ManagerProfile = ({ userInfo, onRefresh }) => {
    const [profileForm, setProfileForm] = useState({ 
        name: userInfo?.name || '', 
        email: userInfo?.email || '',
        phone: userInfo?.phone || '' 
    });
    const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '', confirm: '' });
    const [profileMsg, setProfileMsg] = useState('');
    const [pwMsg, setPwMsg] = useState('');
    const [savingProfile, setSavingProfile] = useState(false);
    const [savingPw, setSavingPw] = useState(false);

    const handleProfileSave = async (e) => {
        e.preventDefault();
        setSavingProfile(true);
        setProfileMsg('');
        try {
            await API.put('/manager/profile', profileForm);
            setProfileMsg('✅ Profile updated successfully!');
            if (onRefresh) onRefresh();
        } catch (err) { 
            setProfileMsg('❌ ' + (err.response?.data?.message || 'Failed to update profile')); 
        }
        setSavingProfile(false);
    };

    const handlePwSave = async (e) => {
        e.preventDefault();
        if (pwForm.newPassword !== pwForm.confirm) { setPwMsg('❌ Passwords do not match'); return; }
        if (pwForm.newPassword.length < 6) { setPwMsg('❌ Password must be at least 6 characters'); return; }
        setSavingPw(true);
        try {
            await API.put('/manager/change-password', { currentPassword: pwForm.currentPassword, newPassword: pwForm.newPassword });
            setPwMsg('✅ Password changed successfully!');
            setPwForm({ currentPassword: '', newPassword: '', confirm: '' });
        } catch (err) { setPwMsg('❌ ' + (err.response?.data?.message || 'Failed')); }
        setSavingPw(false);
    };

    const initials = userInfo?.name ? userInfo.name.substring(0, 2).toUpperCase() : 'HM';

    return (
        <div>
            <div className="mgr-section-title mb-16">👤 Profile Management</div>
            <div className="mgr-two-col" style={{ gridTemplateColumns: '1fr 1fr', alignItems: 'start' }}>
                {/* Profile Info */}
                <div className="mgr-card">
                    <div className="mgr-card-header"><h3>Personal Information</h3></div>
                    <div className="mgr-card-body">
                        <div style={{ textAlign: 'center', marginBottom: 24, padding: '20px', background: 'var(--bg)', borderRadius: '24px' }}>
                            <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'linear-gradient(135deg, var(--primary), var(--primary-dark))', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '1.8rem', fontWeight: 900, margin: '0 auto 12px', boxShadow: '0 10px 20px rgba(109, 93, 252, 0.2)' }}>{initials}</div>
                            <div style={{ fontWeight: 800, fontSize: '1.2rem', color: 'var(--text-primary)' }}>{userInfo?.name}</div>
                            <div style={{ marginTop: 6 }}><span className="badge badge-purple" style={{ padding: '4px 12px', fontWeight: 700 }}>Elite Manager</span></div>
                        </div>
                        {profileMsg && <div style={{ marginBottom: 12, padding: '10px 14px', borderRadius: 8, background: profileMsg.startsWith('✅') ? 'var(--success-light)' : 'var(--danger-light)', color: profileMsg.startsWith('✅') ? '#065f46' : '#991b1b', fontSize: '0.85rem', fontWeight: 600 }}>{profileMsg}</div>}
                        <form onSubmit={handleProfileSave}>
                            <div className="mgr-form-group" style={{ marginBottom: 12 }}>
                                <label>Full Name</label>
                                <input className="mgr-input" value={profileForm.name} onChange={e => setProfileForm({ ...profileForm, name: e.target.value })} />
                            </div>
                            <div className="mgr-form-group" style={{ marginBottom: 16 }}>
                                <label>Email Address</label>
                                <input className="mgr-input" type="email" value={profileForm.email} onChange={e => setProfileForm({ ...profileForm, email: e.target.value })} />
                            </div>
                            <div className="mgr-form-group" style={{ marginBottom: 20 }}>
                                <label>Phone Number</label>
                                <input className="mgr-input" type="text" placeholder="+91 98765 43210" value={profileForm.phone} onChange={e => setProfileForm({ ...profileForm, phone: e.target.value })} />
                            </div>
                            <button type="submit" className="mgr-btn mgr-btn-primary w-100" disabled={savingProfile}>
                                {savingProfile ? 'Saving...' : 'Save Changes'}
                            </button>
                        </form>
                    </div>
                </div>

                {/* Change Password */}
                <div className="mgr-card">
                    <div className="mgr-card-header"><h3>🔒 Change Password</h3></div>
                    <div className="mgr-card-body">
                        {pwMsg && <div style={{ marginBottom: 12, padding: '10px 14px', borderRadius: 8, background: pwMsg.startsWith('✅') ? 'var(--success-light)' : 'var(--danger-light)', color: pwMsg.startsWith('✅') ? '#065f46' : '#991b1b', fontSize: '0.85rem', fontWeight: 600 }}>{pwMsg}</div>}
                        <form onSubmit={handlePwSave}>
                            <div className="mgr-form-group" style={{ marginBottom: 12 }}>
                                <label>Current Password</label>
                                <input className="mgr-input" type="password" value={pwForm.currentPassword} onChange={e => setPwForm({ ...pwForm, currentPassword: e.target.value })} required />
                            </div>
                            <div className="mgr-form-group" style={{ marginBottom: 12 }}>
                                <label>New Password</label>
                                <input className="mgr-input" type="password" value={pwForm.newPassword} onChange={e => setPwForm({ ...pwForm, newPassword: e.target.value })} required />
                            </div>
                            <div className="mgr-form-group" style={{ marginBottom: 16 }}>
                                <label>Confirm New Password</label>
                                <input className="mgr-input" type="password" value={pwForm.confirm} onChange={e => setPwForm({ ...pwForm, confirm: e.target.value })} required />
                            </div>
                            <button type="submit" className="mgr-btn mgr-btn-primary w-100" disabled={savingPw}>
                                {savingPw ? 'Changing...' : 'Change Password'}
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ManagerProfile;
