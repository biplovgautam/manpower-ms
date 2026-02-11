"use client";

import { Bell, CheckCheck, ExternalLink, Loader2, LogOut, Search } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';

export function Header({
    user,
    notifications = [],
    showSearch = false,
    onNavigate,
    onMarkAllRead,
    onLogout
}) {
    const [isNotifOpen, setIsNotifOpen] = useState(false);
    const [isMarkingRead, setIsMarkingRead] = useState(false);
    const dropdownRef = useRef(null);

    // 1. ROBUST USER DATA MAPPING
    // This ensures that even if data is nested or loading, the UI remains stable.
    const userData = useMemo(() => {
        const name = 
            user?.fullName || 
            user?.user?.fullName || 
            user?.data?.fullName || 
            user?.name || 
            user?.user?.name || 
            "User";

        const role = 
            user?.role || 
            user?.user?.role || 
            user?.data?.role || 
            "Employee";

        return {
            id: String(user?._id || user?.id || user?.user?._id || ""),
            fullName: name,
            role: role,
            // Only show initials if we have a real name, otherwise "U"
            avatar: name && name !== "User" ? name.charAt(0).toUpperCase() : "U",
        };
    }, [user]);

    // 2. FILTER UNREAD NOTIFICATIONS
    const unreadNotifications = useMemo(() => {
        const list = Array.isArray(notifications) ? notifications : [];
        return list
            .filter((n) => n && n.isRead === false)
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }, [notifications]);

    // 3. CLOSE DROPDOWN ON OUTSIDE CLICK
    useEffect(() => {
        const handleClick = (e) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
                setIsNotifOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClick);
        return () => document.removeEventListener("mousedown", handleClick);
    }, []);

    // 4. ACTION HANDLERS
    const handleMarkAllRead = async (e) => {
        if (e) {
            e.preventDefault();
            e.stopPropagation();
        }

        if (isMarkingRead || unreadNotifications.length === 0) return;

        setIsMarkingRead(true);
        try {
            if (typeof onMarkAllRead === 'function') {
                await onMarkAllRead();
            }
        } catch (err) {
            console.error("Header: Failed to mark as read", err);
        } finally {
            setIsMarkingRead(false);
        }
    };

    const handleViewHistory = (e) => {
        e.preventDefault();
        setIsNotifOpen(false);
        if (onNavigate) onNavigate('notifications');
    };

    return (
        <header className="bg-white border-b border-slate-200 px-6 md:px-8 py-4 relative z-50">
            <div className="flex items-center justify-between max-w-[1600px] mx-auto">
                
                {/* Left: Search Bar */}
                <div className="flex-1 max-w-xl">
                    {showSearch && (
                        <div className="relative group">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={18} />
                            <input
                                type="text"
                                placeholder="Search records..."
                                className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none text-sm focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all"
                            />
                        </div>
                    )}
                </div>

                {/* Right: Actions & Profile */}
                <div className="flex items-center gap-4 md:gap-6">
                    
                    {/* Notification Dropdown */}
                    <div className="relative" ref={dropdownRef}>
                        <button
                            onClick={() => setIsNotifOpen(!isNotifOpen)}
                            className={`p-2.5 rounded-xl relative transition-all ${isNotifOpen ? 'bg-indigo-50 text-indigo-600' : 'text-slate-500 hover:bg-slate-100'}`}
                            aria-label="Toggle Notifications"
                        >
                            <Bell size={20} />
                            {unreadNotifications.length > 0 && (
                                <span className="absolute top-2 right-2.5 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white animate-pulse"></span>
                            )}
                        </button>

                        {isNotifOpen && (
                            <div className="absolute right-0 mt-3 w-80 sm:w-96 bg-white border border-slate-200 shadow-2xl rounded-2xl overflow-hidden animate-in fade-in zoom-in duration-150 origin-top-right">
                                <div className="p-4 border-b flex justify-between items-center bg-slate-50/70">
                                    <h3 className="font-bold text-sm text-slate-800">Notifications</h3>

                                    {unreadNotifications.length > 0 && (
                                        <button
                                            onClick={handleMarkAllRead}
                                            disabled={isMarkingRead}
                                            className={`flex items-center gap-1.5 text-xs font-bold ${isMarkingRead ? 'text-slate-400' : 'text-indigo-600 hover:text-indigo-800'} transition-colors`}
                                        >
                                            {isMarkingRead ? <Loader2 size={14} className="animate-spin" /> : <CheckCheck size={14} />}
                                            Mark all read
                                        </button>
                                    )}
                                </div>

                                <div className="max-h-[340px] overflow-y-auto divide-y divide-slate-100">
                                    {unreadNotifications.length > 0 ? (
                                        unreadNotifications.map((item) => (
                                            <div key={item._id || item.id} className="p-4 hover:bg-slate-50/50 transition-colors cursor-default">
                                                <div className="flex justify-between items-start gap-2">
                                                    <p className="text-sm text-slate-700 leading-relaxed">
                                                        <span className="font-bold text-slate-900">
                                                            {item.createdBy?.fullName || item.createdBy?.name || 'System'}
                                                        </span>{' '}
                                                        {item.content}
                                                    </p>
                                                    <span className="text-[10px] px-2 py-0.5 bg-slate-100 text-slate-500 rounded-full font-bold uppercase whitespace-nowrap">
                                                        {item.category || 'Alert'}
                                                    </span>
                                                </div>
                                                <span className="text-[11px] text-slate-400 mt-2 block font-medium">
                                                    {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {new Date(item.createdAt).toLocaleDateString()}
                                                </span>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="p-10 text-center">
                                            <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-3">
                                                <CheckCheck className="text-slate-300" size={24} />
                                            </div>
                                            <p className="text-slate-400 text-sm italic">You're all caught up!</p>
                                        </div>
                                    )}
                                </div>

                                <button
                                    onClick={handleViewHistory}
                                    className="w-full p-3.5 bg-slate-50 border-t border-slate-100 text-center text-xs font-bold text-slate-500 hover:text-indigo-600 flex items-center justify-center gap-2 transition-colors uppercase tracking-wider"
                                >
                                    <ExternalLink size={14} /> Full History
                                </button>
                            </div>
                        )}
                    </div>

                    <div className="h-8 w-[1px] bg-slate-200 mx-1 hidden md:block"></div>

                    {/* Profile Section */}
                    <div className="flex items-center gap-3 pl-1">
                        <div className="text-right hidden sm:block">
                            <p className="text-sm font-bold text-slate-900 leading-none">
                                {userData.fullName}
                            </p>
                            <p className="text-[10px] text-indigo-600 font-bold mt-1 uppercase tracking-tighter">
                                {userData.role.replace(/_/g, ' ')}
                            </p>
                        </div>
                        <div className="group relative">
                            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-bold shadow-indigo-200 shadow-lg cursor-pointer hover:scale-105 transition-transform">
                                {userData.avatar}
                            </div>
                            {onLogout && (
                                <button
                                    onClick={(e) => {
                                        e.preventDefault();
                                        onLogout();
                                    }}
                                    className="absolute -bottom-1 -right-1 p-1 bg-white border border-slate-200 rounded-full text-slate-400 hover:text-red-500 shadow-sm transition-colors"
                                    title="Logout"
                                >
                                    <LogOut size={12} />
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </header>
    );
}