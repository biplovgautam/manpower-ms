"use client";
import axios from 'axios';
import Cookies from 'js-cookie';
import {
    AlertTriangle, Bell, CheckCircle, CreditCard, Eye, EyeOff, Lock, Mail,
    Save, Shield, UserX, Users
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';

export function SettingsPage({ data, refreshData }) {
    const router = useRouter();
    const { user, billing, employees } = data;

    const userRole = (user?.role || "").toLowerCase();
    const isAdmin = userRole === 'admin' || userRole === 'super_admin';

    const [activeTab, setActiveTab] = useState('account');
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
            const res = await axios.patch('http://localhost:5000/api/settings/toggle-passport-privacy', {}, config);
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
            const res = await axios.patch(`http://localhost:5000/api/settings/block-member/${employeeId}`, {}, config);
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
            const res = await axios.patch('http://localhost:5000/api/settings/notifications', { settings: updated }, config);
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
            await axios.patch('http://localhost:5000/api/settings/change-email', emails, config);
            toast.success("Email updated");
            setEmails({ newEmail: "" });
            refreshData();
        } catch (err) { toast.error(err.response?.data?.msg || "Failed"); }
        finally { setLoadingAction(null); }
    };

    return (
        <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
                    <p className="text-sm text-gray-500">Manage your account, organization, and preferences.</p>
                </div>
                {!notifs.enabled && (
                    <div className="flex items-center gap-2 px-4 py-2 bg-amber-50 text-amber-700 rounded-lg border border-amber-200 text-xs font-medium animate-pulse">
                        <AlertTriangle size={14} /> Notifications are disabled
                    </div>
                )}
            </header>

            {/* Tab Navigation */}
            <div className="tabs tabs-boxed bg-transparent p-0 gap-2">
                <button onClick={() => setActiveTab('account')} className={`tab px-6 py-2 h-auto rounded-lg transition-all ${activeTab === 'account' ? 'bg-white shadow-sm text-blue-600 font-bold' : 'text-gray-500'}`}>
                    Account
                </button>
                {isAdmin && (
                    <button onClick={() => setActiveTab('org')} className={`tab px-6 py-2 h-auto rounded-lg transition-all ${activeTab === 'org' ? 'bg-white shadow-sm text-blue-600 font-bold' : 'text-gray-500'}`}>
                        Organization
                    </button>
                )}
                <button onClick={() => setActiveTab('security')} className={`tab px-6 py-2 h-auto rounded-lg transition-all ${activeTab === 'security' ? 'bg-white shadow-sm text-blue-600 font-bold' : 'text-gray-500'}`}>
                    Security
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column: Main Forms */}
                <div className="lg:col-span-2 space-y-6">
                    {activeTab === 'account' && (
                        <>
                            <div className="card bg-white shadow-sm border border-gray-100 overflow-hidden">
                                <div className="p-6 border-b border-gray-50 flex items-center gap-3">
                                    <div className="p-2 bg-blue-50 rounded-lg text-blue-600"><Mail size={20} /></div>
                                    <h3 className="font-semibold text-gray-800">Email Address</h3>
                                </div>
                                <div className="p-6 space-y-4">
                                    <div className="grid md:grid-cols-2 gap-4">
                                        <div className="form-control">
                                            <label className="label text-xs font-semibold text-gray-400 uppercase">Current</label>
                                            <input type="text" className="input input-bordered bg-gray-50 text-gray-500" value={user?.email || ""} readOnly />
                                        </div>
                                        <div className="form-control">
                                            <label className="label text-xs font-semibold text-gray-400 uppercase">New Email</label>
                                            <input
                                                type="email"
                                                className="input input-bordered focus:border-blue-500"
                                                placeholder="Enter new email"
                                                value={emails.newEmail}
                                                onChange={(e) => setEmails({ newEmail: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                    <div className="flex justify-end">
                                        <button onClick={handleEmailUpdate} disabled={loadingAction === 'email' || !emails.newEmail} className="btn btn-primary btn-md gap-2">
                                            {loadingAction === 'email' ? <span className="loading loading-spinner"></span> : <Save size={18} />}
                                            Save Changes
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <div className="card bg-white shadow-sm border border-gray-100">
                                <div className="p-6 border-b border-gray-50 flex items-center gap-3">
                                    <div className="p-2 bg-purple-50 rounded-lg text-purple-600"><Bell size={20} /></div>
                                    <h3 className="font-semibold text-gray-800">Notifications</h3>
                                </div>
                                <div className="p-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        <NotifToggle label="Master Alerts" val={notifs.enabled} onToggle={() => handleToggleNotif('enabled')} color="toggle-primary" desc="Enable/disable all communications" />
                                        <NotifToggle label="New Job Demands" val={notifs.newJob} onToggle={() => handleToggleNotif('newJob')} desc="Alerts for new positions" />
                                        <NotifToggle label="Worker Updates" val={notifs.newWorker} onToggle={() => handleToggleNotif('newWorker')} desc="Notifications for new applicants" />
                                        <NotifToggle label="Agent Activity" val={notifs.newSubAgent} onToggle={() => handleToggleNotif('newSubAgent')} desc="Sub-agent registration alerts" />
                                    </div>
                                </div>
                            </div>
                        </>
                    )}

                    {activeTab === 'org' && isAdmin && (
                        <div className="card bg-white shadow-sm border border-gray-100">
                            <div className="p-6 border-b border-gray-50 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-red-50 rounded-lg text-red-600"><Users size={20} /></div>
                                    <h3 className="font-semibold text-gray-800">Team Members</h3>
                                </div>
                                <span className="badge badge-ghost font-mono text-[10px]">{employees?.length || 0} TOTAL</span>
                            </div>
                            <div className="p-6">
                                {employees?.length > 0 ? (
                                    <div className="overflow-x-auto">
                                        <table className="table w-full">
                                            <thead>
                                                <tr className="text-gray-400 uppercase text-[10px]">
                                                    <th>Member</th>
                                                    <th>Status</th>
                                                    <th className="text-right">Action</th>
                                                </tr>
                                            </thead>
                                            <tbody className="text-sm">
                                                {employees.map(emp => (
                                                    <tr key={emp._id} className="hover:bg-gray-50/50 transition-colors">
                                                        <td>
                                                            <div className="font-bold text-gray-700">{emp.fullName}</div>
                                                            <div className="text-xs text-gray-400">{emp.email}</div>
                                                        </td>
                                                        <td>
                                                            <span className={`badge badge-sm ${emp.isBlocked ? 'badge-error' : 'badge-success'} badge-outline`}>
                                                                {emp.isBlocked ? 'Blocked' : 'Active'}
                                                            </span>
                                                        </td>
                                                        <td className="text-right">
                                                            <button
                                                                onClick={() => handleBlockToggle(emp._id)}
                                                                className={`btn btn-ghost btn-xs ${emp.isBlocked ? 'text-success' : 'text-error'}`}
                                                            >
                                                                {emp.isBlocked ? 'Unblock' : 'Block'}
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                ) : (
                                    <div className="text-center py-12">
                                        <div className="bg-gray-50 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-3">
                                            <UserX className="text-gray-300" size={24} />
                                        </div>
                                        <p className="text-gray-500 text-sm">No sub-accounts registered yet.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {activeTab === 'security' && (
                        <div className="card bg-white shadow-sm border border-gray-100">
                            <div className="p-6 border-b border-gray-50 flex items-center gap-3">
                                <div className="p-2 bg-orange-50 rounded-lg text-orange-600"><Lock size={20} /></div>
                                <h3 className="font-semibold text-gray-800">Change Password</h3>
                            </div>
                            <form onSubmit={handlePasswordUpdate} className="p-6 space-y-4 max-w-md">
                                <div className="relative">
                                    <input
                                        type={showPass ? "text" : "password"}
                                        placeholder="Current Password"
                                        className="input input-bordered w-full pr-12"
                                        required
                                        value={passwords.oldPassword}
                                        onChange={(e) => setPasswords({ ...passwords, oldPassword: e.target.value })}
                                    />
                                    <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-4 top-3.5 text-gray-400 hover:text-gray-600">
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
                                    placeholder="Confirm New Password"
                                    className="input input-bordered w-full"
                                    required
                                    value={passwords.confirmPassword}
                                    onChange={(e) => setPasswords({ ...passwords, confirmPassword: e.target.value })}
                                />
                                <button type="submit" disabled={loadingAction === 'pass'} className="btn btn-neutral w-full gap-2">
                                    {loadingAction === 'pass' ? <span className="loading loading-spinner"></span> : <CheckCircle size={18} />}
                                    Update Security Credentials
                                </button>
                            </form>
                        </div>
                    )}
                </div>

                {/* Right Column: Sidebar info */}
                <div className="space-y-6">
                    {/* Subscription Mini Card */}
                    <div className="card bg-slate-900 text-white p-6 shadow-lg overflow-hidden relative">
                        <div className="relative z-10 space-y-4">
                            <div className="flex justify-between items-start">
                                <div className="badge badge-primary bg-blue-600 border-none text-[10px] font-bold">CURRENT PLAN</div>
                                <CheckCircle className="text-emerald-400" size={20} />
                            </div>
                            <div>
                                <h2 className="text-2xl font-black capitalize tracking-tight">{billing?.plan || 'Standard'}</h2>
                                <p className="text-slate-400 text-xs mt-1">Status: <span className="text-emerald-400 font-bold">{billing?.status || 'Active'}</span></p>
                            </div>
                            <div className="pt-4 border-t border-white/10">
                                <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Expires on</p>
                                <p className="text-sm font-semibold">{billing?.expiryDate ? new Date(billing.expiryDate).toLocaleDateString() : 'N/A'}</p>
                            </div>
                        </div>
                        <CreditCard className="absolute -bottom-4 -right-4 text-white/5 w-32 h-32 rotate-12" />
                    </div>

                    {/* Privacy Toggle Card */}
                    {isAdmin && (
                        <div className="card bg-white shadow-sm border border-gray-100 p-6">
                            <div className="flex items-center gap-2 mb-4">
                                <Shield className="text-blue-500" size={18} />
                                <h4 className="font-bold text-gray-800 text-sm">Privacy Controls</h4>
                            </div>
                            <p className="text-[11px] text-gray-500 mb-6 leading-relaxed">
                                Enable masking to hide sensitive passport digits from non-admin accounts.
                            </p>
                            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-100">
                                <span className="text-xs font-bold text-gray-600">Passport Masking</span>
                                <input
                                    type="checkbox"
                                    className="toggle toggle-primary toggle-sm"
                                    checked={isPassportPrivate}
                                    onChange={handleTogglePrivacy}
                                />
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

function NotifToggle({ label, val, onToggle, color = "toggle-info", desc }) {
    return (
        <div className="flex items-start justify-between p-4 bg-gray-50/50 rounded-xl border border-gray-100 hover:border-blue-100 transition-all group">
            <div className="flex flex-col">
                <span className="text-xs font-bold text-gray-700">{label}</span>
                {desc && <span className="text-[10px] text-gray-400 group-hover:text-gray-500">{desc}</span>}
            </div>
            <input
                type="checkbox"
                className={`toggle toggle-sm ${color}`}
                checked={!!val}
                onChange={onToggle}
            />
        </div>
    );
}