"use client";
import axios from 'axios';
import Cookies from 'js-cookie';
import {
    Bell,
    Calendar,
    CheckCircle,
    Eye, EyeOff,
    Fingerprint,
    Lock, Mail,
    Save, Shield,
    ShieldCheck,
    User,
    Users
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
import { apiUrl } from '@/lib/api';

export function SettingsPage({ data, refreshData }) {
    const router = useRouter();
    const { user, billing, employees } = data;

    const userRole = (user?.role || "").toLowerCase();
    const isAdmin = userRole === 'admin' || userRole === 'super_admin';

    const [emails, setEmails] = useState({ newEmail: "" });
    const [passwords, setPasswords] = useState({ oldPassword: "", newPassword: "", confirmPassword: "" });
    const [showPass, setShowPass] = useState(false);
    const [loadingAction, setLoadingAction] = useState(null);

    const [isPassportPrivate, setIsPassportPrivate] = useState(false);
    const [notifs, setNotifs] = useState({
        enabled: true, newJob: true, newEmployer: true, newWorker: true, newSubAgent: true
    });

    useEffect(() => {
        if (user?.isBlocked) { handleLogout(); return; }
        if (user?.notificationSettings) setNotifs(user.notificationSettings);
        const privacyValue = user?.companySettings?.isPassportPrivate ?? user?.isPassportPrivate;
        if (privacyValue !== undefined) setIsPassportPrivate(privacyValue);
    }, [user]);

    const handleLogout = () => {
        localStorage.clear();
        Cookies.remove('token', { path: '/' });
        router.replace('/login');
    };

    const config = { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } };

    const handleTogglePrivacy = async () => {
        const previousState = isPassportPrivate;
        setIsPassportPrivate(!previousState);
        try {
            const res = await axios.patch(apiUrl('/api/settings/toggle-passport-privacy'), {}, config);
            if (res.data.success) {
                setIsPassportPrivate(res.data.isPassportPrivate);
                toast.success(res.data.isPassportPrivate ? "Privacy Enabled" : "Privacy Disabled");
                refreshData();
            }
        } catch (err) {
            setIsPassportPrivate(previousState);
            toast.error("Privacy update failed");
        }
    };

    const handleBlockToggle = async (employeeId) => {
        try {
            const res = await axios.patch(apiUrl(`/api/settings/block-member/${employeeId}`), {}, config);
            toast.success(res.data.msg);
            refreshData();
        } catch (err) {
            toast.error(err.response?.data?.msg || "Action failed");
        }
    };

    const handleToggleNotif = async (key) => {
        const previousNotifs = { ...notifs };
        const updated = { ...notifs, [key]: !notifs[key] };
        setNotifs(updated);
        try {
            const res = await axios.patch(apiUrl('/api/settings/notifications'), { settings: updated }, config);
            if (res.data.success) setNotifs(res.data.data);
        } catch (err) {
            setNotifs(previousNotifs);
            toast.error("Failed to update notifications");
        }
    };

    const handleEmailUpdate = async () => {
        if (!emails.newEmail) return toast.error("Please enter a new email");
        setLoadingAction('email');
        try {
            await axios.patch(apiUrl('/api/settings/change-email'), emails, config);
            toast.success("Email updated");
            setEmails({ newEmail: "" });
            refreshData();
        } catch (err) {
            toast.error(err.response?.data?.msg || "Failed to update email");
        } finally {
            setLoadingAction(null);
        }
    };

    const handlePasswordUpdate = async (e) => {
        e.preventDefault();
        if (passwords.newPassword !== passwords.confirmPassword) return toast.error("Passwords do not match!");
        setLoadingAction('pass');
        try {
            await axios.patch(apiUrl('/api/settings/change-password'), {
                oldPassword: passwords.oldPassword,
                newPassword: passwords.newPassword
            }, config);
            toast.success("Password updated successfully");
            setPasswords({ oldPassword: "", newPassword: "", confirmPassword: "" });
        } catch (err) {
            toast.error(err.response?.data?.msg || "Failed to update password");
        } finally {
            setLoadingAction(null);
        }
    };

    return (
        <div className="max-w-7xl mx-auto px-4 py-10 bg-[#f8fafc] min-h-screen font-sans">
            <header className="mb-10 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-8">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight">Account Control Center</h1>
                    <p className="text-slate-500 font-medium">Global configuration for your identity and organization.</p>
                </div>
                <div className="flex items-center gap-3">
                    <button onClick={handleLogout} className="px-5 py-2.5 text-sm font-bold text-red-600 hover:bg-red-50 rounded-xl transition-colors border border-transparent hover:border-red-100">
                        Sign Out
                    </button>
                </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

                {/* LEFT COLUMN: PROFILE OVERVIEW */}
                <aside className="lg:col-span-3 space-y-6 lg:sticky lg:top-10">
                    <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200">
                        <div className="flex flex-col items-center text-center">
                            <div className="h-20 w-20 rounded-3xl bg-blue-600 flex items-center justify-center text-white text-3xl font-black shadow-xl shadow-blue-100 mb-4">
                                {user?.fullName?.charAt(0) || 'U'}
                            </div>
                            <h2 className="text-xl font-bold text-slate-800 leading-tight">{user?.fullName}</h2>
                            <p className="text-xs font-black text-blue-600 bg-blue-50 px-3 py-1 rounded-full uppercase tracking-widest mt-2">
                                {userRole}
                            </p>
                        </div>
                        <div className="mt-8 pt-6 border-t border-slate-100 space-y-4">
                            <SidebarInfo label="Email" value={user?.email} icon={<Mail size={14} />} />
                            <SidebarInfo label="Security" value="Active" icon={<ShieldCheck size={14} />} />
                        </div>
                    </div>
                </aside>

                {/* MIDDLE COLUMN: CORE SETTINGS */}
                <main className="lg:col-span-6 space-y-10">

                    {/* 1. Account Security & Email */}
                    <section id="account" className="space-y-6">
                        <h3 className="flex items-center gap-2 text-sm font-black text-slate-400 uppercase tracking-[0.2em] ml-2">
                            <User size={16} /> Identity Settings
                        </h3>
                        <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-8">
                            <div className="space-y-4">
                                <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-2">
                                    <Mail size={14} className="text-blue-500" /> Update Communication Email
                                </label>
                                <div className="grid gap-3">
                                    <input type="text" className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-slate-400 font-medium cursor-not-allowed" value={user?.email || ""} readOnly />
                                    <div className="flex gap-2">
                                        <input
                                            type="email"
                                            className="flex-1 px-5 py-3.5 rounded-2xl border border-slate-200 focus:ring-4 focus:ring-blue-50 focus:border-blue-500 transition-all outline-none font-medium text-slate-700"
                                            placeholder="Enter new email address"
                                            value={emails.newEmail}
                                            onChange={(e) => setEmails({ newEmail: e.target.value })}
                                        />
                                        <button onClick={handleEmailUpdate} disabled={loadingAction === 'email' || !emails.newEmail} className="px-6 bg-slate-900 text-white rounded-2xl font-bold hover:bg-black transition-all disabled:opacity-50">
                                            {loadingAction === 'email' ? '...' : <Save size={20} />}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* 2. Security Section */}
                    <section id="security" className="space-y-6">
                        <h3 className="flex items-center gap-2 text-sm font-black text-slate-400 uppercase tracking-[0.2em] ml-2">
                            <Lock size={16} /> Security Credentials
                        </h3>
                        <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-8">
                            <form onSubmit={handlePasswordUpdate} className="space-y-4">
                                <div className="relative">
                                    <input
                                        type={showPass ? "text" : "password"}
                                        placeholder="Current Password"
                                        className="w-full px-5 py-4 rounded-2xl border border-slate-200 focus:ring-4 focus:ring-blue-50 transition-all outline-none pr-14 text-slate-700"
                                        required
                                        value={passwords.oldPassword}
                                        onChange={(e) => setPasswords({ ...passwords, oldPassword: e.target.value })}
                                    />
                                    <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-5 top-4.5 text-slate-400">
                                        {showPass ? <EyeOff size={20} /> : <Eye size={20} />}
                                    </button>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <input type="password" placeholder="New Password" className="w-full px-5 py-4 rounded-2xl border border-slate-200 focus:ring-4 focus:ring-blue-50 outline-none text-slate-700" required value={passwords.newPassword} onChange={(e) => setPasswords({ ...passwords, newPassword: e.target.value })} />
                                    <input type="password" placeholder="Confirm New" className="w-full px-5 py-4 rounded-2xl border border-slate-200 focus:ring-4 focus:ring-blue-50 outline-none text-slate-700" required value={passwords.confirmPassword} onChange={(e) => setPasswords({ ...passwords, confirmPassword: e.target.value })} />
                                </div>
                                <button type="submit" disabled={loadingAction === 'pass'} className="w-full py-4 bg-slate-900 text-white rounded-2xl font-bold hover:shadow-lg transition-all flex items-center justify-center gap-2 shadow-sm">
                                    {loadingAction === 'pass' ? <span className="loading loading-spinner"></span> : <CheckCircle size={18} />}
                                    Refresh Access Credentials
                                </button>
                            </form>
                        </div>
                    </section>

                    {/* 3. Notifications */}
                    <section id="notifications" className="space-y-6">
                        <h3 className="flex items-center gap-2 text-sm font-black text-slate-400 uppercase tracking-[0.2em] ml-2">
                            <Bell size={16} /> Notification Channels
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <SinglePageNotifToggle label="Master Alerts" val={notifs.enabled} onToggle={() => handleToggleNotif('enabled')} desc="Enable/disable all" />
                            <SinglePageNotifToggle label="Job Demands" val={notifs.newJob} onToggle={() => handleToggleNotif('newJob')} desc="New vacancy alerts" />
                            <SinglePageNotifToggle label="Staffing" val={notifs.newWorker} onToggle={() => handleToggleNotif('newWorker')} desc="New applications" />
                            <SinglePageNotifToggle label="Sub-Agents" val={notifs.newSubAgent} onToggle={() => handleToggleNotif('newSubAgent')} desc="Agent activity" />
                        </div>
                    </section>

                    {/* 4. Team Management */}
                    {isAdmin && (
                        <section id="team" className="space-y-6">
                            <h3 className="flex items-center gap-2 text-sm font-black text-slate-400 uppercase tracking-[0.2em] ml-2">
                                <Users size={16} /> Team Access Control
                            </h3>
                            <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
                                {employees?.length > 0 ? (
                                    <div className="divide-y divide-slate-100">
                                        {employees.map(emp => (
                                            <div key={emp._id} className="p-6 flex items-center justify-between hover:bg-slate-50/50 transition-colors">
                                                <div className="flex items-center gap-4">
                                                    <div className="h-10 w-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-500 font-bold">
                                                        {emp.fullName.charAt(0)}
                                                    </div>
                                                    <div>
                                                        <div className="font-bold text-slate-800">{emp.fullName}</div>
                                                        <div className="text-xs text-slate-400">{emp.email}</div>
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={() => handleBlockToggle(emp._id)}
                                                    className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest border transition-all ${emp.isBlocked ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-red-50 text-red-600 border-red-100'}`}
                                                >
                                                    {emp.isBlocked ? 'Unblock' : 'Block'}
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="p-10 text-center text-slate-400 font-medium">No team members registered.</div>
                                )}
                            </div>
                        </section>
                    )}
                </main>

                {/* RIGHT COLUMN: EXPIRY & PRIVACY */}
                <aside className="lg:col-span-3 space-y-6 lg:sticky lg:top-10">
                    {/* EXPIRY CARD (Refined) */}
                    <div className="bg-slate-900 rounded-[2.5rem] p-8 shadow-2xl shadow-slate-200 relative overflow-hidden text-white border border-white/10">
                        <div className="relative z-10 space-y-8">
                            <div className="flex justify-between items-center">
                                <span className="px-3 py-1 bg-blue-500/20 rounded-full text-[10px] font-black tracking-widest text-blue-300 border border-blue-500/30">
                                    {billing?.plan?.toUpperCase() || 'PREMIUM'}
                                </span>
                                <div className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.8)]"></div>
                            </div>

                            <div className="space-y-2">
                                <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em]">License Expires On</p>
                                <div className="flex items-end gap-2">
                                    <h4 className="text-2xl font-black">
                                        {billing?.expiryDate ? new Date(billing.expiryDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Lifetime'}
                                    </h4>
                                    <Calendar size={18} className="text-slate-500 mb-1.5" />
                                </div>
                            </div>

                            <div className="space-y-3">
                                <div className="flex justify-between text-[10px] font-bold uppercase text-slate-500 tracking-tighter">
                                    <span>Account Status</span>
                                    <span className="text-emerald-400">Active</span>
                                </div>
                                <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                                    <div className="bg-blue-500 h-full w-[85%] rounded-full shadow-[0_0_12px_rgba(59,130,246,0.5)]"></div>
                                </div>
                                <p className="text-[10px] text-slate-400 leading-relaxed font-medium">
                                    All services are currently operational. To extend your license, contact your administrator.
                                </p>
                            </div>
                        </div>
                        <Shield className="absolute -bottom-10 -right-10 text-white/5 w-48 h-48 rotate-12" />
                    </div>

                    {/* PRIVACY CARD */}
                    {isAdmin && (
                        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">
                            <div className="flex items-center gap-2 mb-4">
                                <div className="p-2 bg-blue-50 text-blue-600 rounded-xl"><Fingerprint size={18} /></div>
                                <h4 className="font-bold text-slate-800">Privacy Shield</h4>
                            </div>
                            <p className="text-xs text-slate-400 font-medium leading-relaxed mb-6">
                                Masking ensures sensitive digits are only visible to authorized administrators.
                            </p>
                            <button
                                onClick={handleTogglePrivacy}
                                className={`flex items-center justify-between w-full p-4 rounded-2xl font-bold text-xs transition-all border ${isPassportPrivate ? 'bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-100' : 'bg-slate-50 border-slate-100 text-slate-600 hover:bg-slate-100'}`}
                            >
                                {isPassportPrivate ? 'Masking Active' : 'Masking Inactive'}
                                <div className={`w-10 h-5 rounded-full relative flex items-center px-1 transition-all ${isPassportPrivate ? 'bg-white/20' : 'bg-slate-300'}`}>
                                    <div className={`w-3 h-3 rounded-full bg-white transition-all ${isPassportPrivate ? 'translate-x-5' : 'translate-x-0'}`}></div>
                                </div>
                            </button>
                        </div>
                    )}
                </aside>
            </div>
        </div>
    );
}

function SidebarInfo({ label, value, icon }) {
    return (
        <div className="flex items-start gap-3">
            <div className="mt-0.5 text-slate-300">{icon}</div>
            <div className="flex flex-col overflow-hidden">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">{label}</span>
                <span className="text-sm font-bold text-slate-700 truncate">{value || 'Not set'}</span>
            </div>
        </div>
    );
}

function SinglePageNotifToggle({ label, val, onToggle, desc }) {
    return (
        <div className="bg-white p-5 rounded-3xl border border-slate-200 hover:shadow-xl hover:shadow-slate-100 transition-all flex items-center justify-between group cursor-pointer" onClick={onToggle}>
            <div className="pr-2">
                <p className="text-xs font-black text-slate-800 uppercase tracking-tight">{label}</p>
                <p className="text-[10px] text-slate-400 font-medium mt-1 leading-tight">{desc}</p>
            </div>
            <div className={`flex-shrink-0 h-6 w-11 rounded-full flex items-center px-1 transition-all ${val ? 'bg-blue-600' : 'bg-slate-200'}`}>
                <div className={`h-4 w-4 rounded-full bg-white shadow-sm transition-all ${val ? 'translate-x-5' : 'translate-x-0'}`}></div>
            </div>
        </div>
    );
}