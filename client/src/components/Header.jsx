"use client";
import { Bell, CheckCheck, Loader2, Search } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';

export function Header({
    user, // This now receives the full user object from the /me API call
    notifications = [],
    showSearch = false,
    onNavigate,
    onRefreshNotifications
}) {
    const [isNotifOpen, setIsNotifOpen] = useState(false);
    const [isMarkingRead, setIsMarkingRead] = useState(false);
    const dropdownRef = useRef(null);

    // 1. Robust Data Normalization
    const userData = useMemo(() => {
        // Since /api/auth/me returns the user object directly:
        // We prioritize fullName, then name, then fallback to the Role as a string
        const nameToDisplay = user?.fullName || user?.name || user?.username || (user?.role ? user.role.toUpperCase() : "User");

        return {
            id: String(user?._id || user?.id || ""),
            fullName: nameToDisplay,
            role: user?.role || "Member",
            // Avatar takes the first letter of the resolved name
            avatar: nameToDisplay.charAt(0).toUpperCase()
        };
    }, [user]);

    // 2. Notification Filtering (Activity Log)
    const { unreadNotifications } = useMemo(() => {
        const list = Array.isArray(notifications) ? notifications : [];
        const unread = list.filter(n => {
            const readList = n.isReadBy?.map(id => String(id)) || [];
            return !readList.includes(userData.id);
        }).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        return { unreadNotifications: unread };
    }, [notifications, userData.id]);

    // Close dropdown on outside click
    useEffect(() => {
        const handleClick = (e) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
                setIsNotifOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClick);
        return () => document.removeEventListener("mousedown", handleClick);
    }, []);

    const handleMarkAllReadLocal = async (e) => {
        e.preventDefault();
        if (onRefreshNotifications && !isMarkingRead && unreadNotifications.length > 0) {
            setIsMarkingRead(true);
            try {
                await onRefreshNotifications();
                setIsNotifOpen(false);
            } catch (error) {
                console.error("Error marking read:", error);
            } finally {
                setIsMarkingRead(false);
            }
        }
    };

    return (
        <header className="bg-white border-b border-slate-200 px-8 py-4 relative z-50">
            <div className="flex items-center justify-between">
                {/* Left Section: Optional Search */}
                <div className="flex-1 max-w-xl">
                    {showSearch && (
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                            <input
                                type="text"
                                placeholder="Search..."
                                className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none text-sm focus:ring-2 focus:ring-indigo-500/20 transition-all"
                            />
                        </div>
                    )}
                </div>

                {/* Right Section: Notifications & User Profile */}
                <div className="flex items-center gap-6">

                    {/* Notification Bell */}
                    <div className="relative" ref={dropdownRef}>
                        <button
                            onClick={() => setIsNotifOpen(!isNotifOpen)}
                            className={`p-2.5 rounded-xl relative transition-colors ${isNotifOpen ? 'bg-indigo-50 text-indigo-600' : 'text-slate-500 hover:bg-slate-100'}`}
                        >
                            <Bell size={20} />
                            {unreadNotifications.length > 0 && (
                                <span className="absolute top-2 right-2 w-3 h-3 bg-red-500 rounded-full border-2 border-white animate-pulse"></span>
                            )}
                        </button>

                        {isNotifOpen && (
                            <div className="absolute right-0 mt-3 w-80 bg-white border border-slate-200 shadow-2xl rounded-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
                                <div className="p-4 border-b flex justify-between items-center bg-slate-50/50">
                                    <h3 className="font-bold text-sm text-slate-800">Activity Log</h3>
                                    {unreadNotifications.length > 0 && (
                                        <button
                                            onClick={handleMarkAllReadLocal}
                                            disabled={isMarkingRead}
                                            className="flex items-center gap-1 text-[10px] font-black text-indigo-600 uppercase hover:text-indigo-700 disabled:opacity-50"
                                        >
                                            {isMarkingRead ? <Loader2 size={12} className="animate-spin" /> : <CheckCheck size={14} />}
                                            Mark all read
                                        </button>
                                    )}
                                </div>
                                <div className="max-h-[320px] overflow-y-auto">
                                    {unreadNotifications.length > 0 ? (
                                        unreadNotifications.map((item) => (
                                            <div key={item._id} className="p-4 border-b last:border-0 hover:bg-slate-50 transition-colors">
                                                <p className="text-[12px] text-slate-600 leading-relaxed">
                                                    <span className="font-bold text-slate-900">{item.createdBy?.fullName || 'System'}</span> {item.content}
                                                </p>
                                                <span className="text-[10px] text-slate-400 mt-1 block">
                                                    {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="p-10 text-center text-slate-400 text-xs">No new updates</div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* User Info Section */}
                    <div className="flex items-center gap-3 pl-6 border-l border-slate-200">
                        <div className="text-right hidden md:block">
                            {/* Full Name from Database via /me */}
                            <p className="text-sm font-black text-slate-900 leading-none">
                                {userData.fullName}
                            </p>
                            {/* Formatted Role */}
                            <p className="text-[10px] text-indigo-600 font-bold uppercase mt-1 tracking-wider">
                                {userData.role.replace('_', ' ')}
                            </p>
                        </div>

                        {/* Avatar Initial */}
                        <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-black shadow-lg shadow-indigo-100 ring-2 ring-white">
                            {userData.avatar}
                        </div>
                    </div>
                </div>
            </div>
        </header>
    );
}