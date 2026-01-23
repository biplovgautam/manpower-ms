"use client";
import axios from 'axios';
import {
    AlertTriangle,
    Bell,
    CheckCircle, CreditCard, Eye, EyeOff, Lock, Mail,
    Save, Shield, UserX
} from 'lucide-react';
import { useState } from 'react';
import { toast } from 'react-hot-toast';

export function SettingsPage({ data, refreshData }) {
    const { user, billing, employees } = data;

    // Strict and robust role detection
    const userRole = (user?.role || "").toLowerCase();
    const isAdmin = userRole === 'admin' || userRole === 'super_admin';

    const [emails, setEmails] = useState({ newEmail: "" });
    const [passwords, setPasswords] = useState({ oldPassword: "", newPassword: "", confirmPassword: "" });
    const [showPass, setShowPass] = useState(false);
    const [loadingAction, setLoadingAction] = useState(null);

    // Notification State initialized from user data or defaults
    const [notifs, setNotifs] = useState(user?.notificationSettings || {
        enabled: true, newJob: true, newEmployer: true, newWorker: true, newSubAgent: true
    });

    const config = { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } };

    const handleTogglePrivacy = async () => {
        try {
            const res = await axios.patch('http://localhost:5000/api/settings/toggle-passport-privacy', {}, config);
            toast.success(res.data.isPassportPrivate ? "Privacy Enabled (Masked)" : "Privacy Disabled (Visible)");
            refreshData();
        } catch (err) { toast.error("Privacy update failed"); }
    };

    const handlePasswordUpdate = async (e) => {
        e.preventDefault();
        if (passwords.newPassword !== passwords.confirmPassword) return toast.error("New passwords don't match");
        setLoadingAction('pass');
        try {
            await axios.patch('http://localhost:5000/api/auth/change-password', passwords, config);
            toast.success("Password changed successfully");
            setPasswords({ oldPassword: "", newPassword: "", confirmPassword: "" });
        } catch (err) { toast.error(err.response?.data?.msg || "Current password incorrect"); }
        finally { setLoadingAction(null); }
    };

    const handleEmailUpdate = async () => {
        if (!emails.newEmail) return toast.error("Please enter a new email");
        setLoadingAction('email');
        try {
            await axios.patch('http://localhost:5000/api/settings/change-email', emails, config);
            toast.success("Email updated successfully");
            refreshData();
        } catch (err) { toast.error(err.response?.data?.msg || "Email update failed"); }
        finally { setLoadingAction(null); }
    };

    const handleBlockToggle = async (employeeId) => {
        try {
            const res = await axios.patch(`http://localhost:5000/api/settings/block-member/${employeeId}`, {}, config);
            toast.success(res.data.msg);
            refreshData();
        } catch (err) { toast.error("Action failed"); }
    };

    const handleToggleNotif = async (key) => {
        const updated = { ...notifs, [key]: !notifs[key] };
        setNotifs(updated);
        try {
            await axios.patch('http://localhost:5000/api/settings/notifications', { settings: updated }, config);
            toast.success("Preferences saved");
        } catch (err) { toast.error("Failed to update notifications"); }
    };

    return (
        <div className="max-w-7xl mx-auto space-y-8 pb-10">
            {/* GLOBAL NOTIFICATION WARNING */}
            {!notifs.enabled && (
                <div className="alert alert-warning shadow-sm flex gap-2 text-sm font-bold border-none bg-orange-100 text-orange-700">
                    <AlertTriangle size={18} />
                    <span>In-app & Email notifications are currently disabled.</span>
                </div>
            )}

            {/* ADMIN-SPECIFIC SECTION */}
            {isAdmin && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in duration-500">
                    {/* Requirement 1: Privacy Toggle */}
                    <div className="card bg-white border p-6 shadow-sm border-t-4 border-t-blue-500">
                        <div className="flex items-center gap-3 mb-4">
                            <Shield className="text-blue-500" size={24} />
                            <h3 className="font-bold text-gray-800">Privacy Settings</h3>
                        </div>
                        <p className="text-[11px] text-gray-500 mb-6">
                            When enabled, passport numbers are masked (e.g., 123xxxxxx) for all non-admin users.
                        </p>
                        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                            <span className="text-sm font-bold text-gray-700">Passport Masking</span>
                            <input
                                type="checkbox"
                                className="toggle toggle-primary"
                                checked={user?.companySettings?.isPassportPrivate || false}
                                onChange={handleTogglePrivacy}
                            />
                        </div>
                    </div>

                    {/* Requirement 3: Billing Info */}
                    <div className="card bg-slate-900 text-white p-6 shadow-xl lg:col-span-2">
                        <div className="flex justify-between items-start mb-8">
                            <div>
                                <h3 className="font-bold text-blue-400 flex items-center gap-2 uppercase tracking-tighter text-sm">
                                    <CreditCard size={18} /> Subscription Details
                                </h3>
                                <p className="text-3xl font-black mt-2 capitalize">{billing?.plan || 'Corporate Plan'}</p>
                            </div>
                            <div className={`badge font-bold p-3 border-none ${billing?.status === 'Active' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'}`}>
                                {billing?.status?.toUpperCase() || 'ACTIVE'}
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-white/10 p-4 rounded-xl">
                                <p className="text-[10px] text-slate-400 uppercase font-bold tracking-widest">Renewal Date</p>
                                <p className="text-sm font-bold mt-1 text-red-300">
                                    {billing?.expiryDate ? new Date(billing.expiryDate).toLocaleDateString() : 'N/A'}
                                </p>
                            </div>
                            <div className="bg-white/10 p-4 rounded-xl">
                                <p className="text-[10px] text-slate-400 uppercase font-bold tracking-widest">Status</p>
                                <p className="text-sm font-bold mt-1 text-green-300">Verified Organization</p>
                            </div>
                        </div>
                    </div>

                    {/* Requirement 5: Access Management */}
                    <div className="card bg-white border p-6 shadow-sm lg:col-span-3">
                        <div className="flex items-center gap-2 mb-6">
                            <UserX className="text-red-500" size={20} />
                            <h3 className="font-bold text-gray-800">Organization Access Management</h3>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            {employees && employees.length > 0 ? employees.map(emp => (
                                <div key={emp._id} className={`flex items-center justify-between p-3 border rounded-xl transition-all ${emp.isBlocked ? 'bg-red-50 border-red-100' : 'bg-gray-50'}`}>
                                    <div className="truncate">
                                        <p className="font-bold text-xs truncate text-gray-800">{emp.fullName}</p>
                                        <p className="text-[10px] text-gray-500">{emp.email}</p>
                                    </div>
                                    <button
                                        onClick={() => handleBlockToggle(emp._id)}
                                        className={`btn btn-xs rounded-lg ${emp.isBlocked ? 'btn-success' : 'btn-error btn-outline'}`}
                                    >
                                        {emp.isBlocked ? 'Restore' : 'Restrict'}
                                    </button>
                                </div>
                            )) : (
                                <p className="text-gray-400 text-xs italic">No members found.</p>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* SHARED SETTINGS (Notifications, Email, Password) */}
            <div className="card bg-white border p-6 shadow-sm">
                <div className="flex items-center gap-2 mb-6">
                    <Bell className="text-purple-500" size={20} />
                    <h3 className="font-bold text-gray-800">Notification Preferences</h3>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    <NotifToggle label="Master Switch" val={notifs.enabled} onToggle={() => handleToggleNotif('enabled')} color="toggle-primary" />
                    <NotifToggle label="New Job Demands" val={notifs.newJob} onToggle={() => handleToggleNotif('newJob')} />
                    <NotifToggle label="New Workers" val={notifs.newWorker} onToggle={() => handleToggleNotif('newWorker')} />
                    <NotifToggle label="New Employers" val={notifs.newEmployer} onToggle={() => handleToggleNotif('newEmployer')} />
                    <NotifToggle label="New Sub-Agents" val={notifs.newSubAgent} onToggle={() => handleToggleNotif('newSubAgent')} />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Requirement 4: Email Address */}
                <div className="card bg-white border p-6 shadow-sm">
                    <h3 className="font-bold text-gray-800 flex items-center gap-2 mb-6">
                        <Mail className="text-blue-500" size={20} /> Account Email
                    </h3>
                    <div className="space-y-4">
                        <div className="form-control">
                            <label className="label text-[10px] font-bold text-gray-400 uppercase">Current Email</label>
                            <input type="text" className="input input-bordered bg-gray-50" value={user?.email || ""} disabled />
                        </div>
                        <div className="form-control">
                            <label className="label text-[10px] font-bold text-gray-400 uppercase">New Email</label>
                            <input
                                type="email"
                                className="input input-bordered"
                                placeholder="new@email.com"
                                onChange={(e) => setEmails({ newEmail: e.target.value })}
                            />
                        </div>
                        <button onClick={handleEmailUpdate} disabled={loadingAction === 'email'} className="btn btn-primary w-full gap-2">
                            {loadingAction === 'email' ? <span className="loading loading-spinner"></span> : <Save size={18} />}
                            Update Email
                        </button>
                    </div>
                </div>

                {/* Requirement 2: Password Security */}
                <div className="card bg-white border p-6 shadow-sm">
                    <h3 className="font-bold text-gray-800 flex items-center gap-2 mb-6">
                        <Lock className="text-orange-500" size={20} /> Security & Password
                    </h3>
                    <form onSubmit={handlePasswordUpdate} className="space-y-3">
                        <div className="relative">
                            <input
                                type={showPass ? "text" : "password"}
                                placeholder="Current Password"
                                className="input input-bordered w-full pr-10"
                                required
                                value={passwords.oldPassword}
                                onChange={(e) => setPasswords({ ...passwords, oldPassword: e.target.value })}
                            />
                            <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-3 text-gray-400">
                                {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>
                        <input
                            type="password"
                            placeholder="New Password"
                            className="input input-bordered w-full"
                            required
                            value={passwords.newPassword}
                            onChange={(e) => setPasswords({ ...passwords, newPassword: e.target.value })}
                        />
                        <input
                            type="password"
                            placeholder="Confirm Password"
                            className="input input-bordered w-full"
                            required
                            value={passwords.confirmPassword}
                            onChange={(e) => setPasswords({ ...passwords, confirmPassword: e.target.value })}
                        />
                        <button type="submit" disabled={loadingAction === 'pass'} className="btn btn-neutral w-full gap-2">
                            {loadingAction === 'pass' ? <span className="loading loading-spinner"></span> : <CheckCircle size={18} />}
                            Apply New Password
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}

function NotifToggle({ label, val, onToggle, color = "toggle-secondary" }) {
    return (
        <div className="form-control bg-gray-50 p-3 rounded-xl border flex flex-row items-center justify-between">
            <span className="text-[9px] font-bold uppercase text-gray-600">{label}</span>
            <input type="checkbox" className={`toggle toggle-xs ${color}`} checked={val} onChange={onToggle} />
        </div>
    );
}