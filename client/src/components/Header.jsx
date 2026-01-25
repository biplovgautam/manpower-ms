"use client";
import { Bell, CheckCheck, ExternalLink, Search } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

export function Header({
    user,
    notifications = [],
    showSearch = true,
    onNavigate // This prop might be undefined in some views
}) {
    const [isNotifOpen, setIsNotifOpen] = useState(false);
    const [localNotifications, setLocalNotifications] = useState(notifications);
    const dropdownRef = useRef(null);

    useEffect(() => {
        setLocalNotifications(notifications);
    }, [notifications]);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsNotifOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const userData = user?.user || user;
    const currentUserId = userData?._id || userData?.userId;
    const userName = userData?.fullName || userData?.name || "User Account";

    const rawRole = userData?.role || "Member";
    const userRole = rawRole.toLowerCase().split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

    const unreadNotifications = localNotifications.filter(
        n => !n.isReadBy?.includes(currentUserId)
    );

    const handleMarkAllRead = async (e) => {
        e.preventDefault();
        e.stopPropagation();

        try {
            const token = localStorage.getItem('token');
            const markedLocally = localNotifications.map(n => ({
                ...n,
                isReadBy: [...(n.isReadBy || []), currentUserId]
            }));
            setLocalNotifications(markedLocally);

            await fetch('http://localhost:5000/api/v1/notifications/read-all', {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            setTimeout(() => setIsNotifOpen(false), 500);
        } catch (err) {
            console.error("Mark read failed", err);
        }
    };

    return (
        <header className="bg-white border-b border-gray-200 px-8 py-4 relative z-50">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4 flex-1 max-w-xl">
                    {showSearch && (
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                            <input
                                type="text"
                                placeholder="Search..."
                                className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                            />
                        </div>
                    )}
                </div>

                <div className="flex items-center gap-4">
                    <div className="relative" ref={dropdownRef}>
                        <button
                            onClick={() => setIsNotifOpen(!isNotifOpen)}
                            className={`p-2 rounded-lg transition-all relative ${isNotifOpen ? 'bg-blue-50 text-blue-600' : 'text-gray-600 hover:bg-gray-100'}`}
                        >
                            <Bell size={20} />
                            {unreadNotifications.length > 0 && (
                                <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white"></span>
                            )}
                        </button>

                        {isNotifOpen && (
                            <div className="absolute right-0 mt-3 w-80 bg-white border border-gray-200 shadow-2xl rounded-2xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                                <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                                    <h3 className="font-bold text-sm text-gray-800">New Updates</h3>
                                    <button onClick={handleMarkAllRead} className="flex items-center gap-1 text-[11px] font-bold text-blue-600 hover:text-blue-800">
                                        <CheckCheck size={14} /> MARK ALL READ
                                    </button>
                                </div>
                                <div className="max-h-[300px] overflow-y-auto">
                                    {unreadNotifications.length > 0 ? (
                                        unreadNotifications.map((item) => (
                                            <div key={item._id} className="p-4 border-b border-gray-50 hover:bg-gray-50 transition-colors">
                                                <p className="text-[12px] text-gray-700">
                                                    <span className="font-bold text-gray-900">{item.createdBy?.fullName || 'System'}</span> {item.content}
                                                </p>
                                                <span className="text-[10px] text-gray-400 mt-1 block">
                                                    {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="p-10 text-center text-gray-400 text-xs">No new notifications</div>
                                    )}
                                </div>
                                <button
                                    onClick={() => {
                                        // --- SAFETY CHECK ADDED HERE ---
                                        if (typeof onNavigate === 'function') {
                                            onNavigate('notifications');
                                        } else {
                                            console.warn("Navigation handler missing. Redirecting via window...");
                                            window.location.href = "/dashboard/employee/notifications";
                                        }
                                        setIsNotifOpen(false);
                                    }}
                                    className="w-full py-3 text-[11px] font-bold text-blue-600 hover:bg-blue-50 border-t border-gray-100 flex items-center justify-center gap-2 uppercase"
                                >
                                    VIEW FULL LOGS <ExternalLink size={12} />
                                </button>
                            </div>
                        )}
                    </div>

                    <div className="flex items-center gap-3 pl-4 border-l border-gray-200">
                        <div className="text-right hidden sm:block">
                            <p className="text-sm font-black text-gray-900 leading-none mb-1">{userName}</p>
                            <p className="text-[10px] text-blue-600 font-bold uppercase tracking-widest">{userRole}</p>
                        </div>
                        <div className="w-10 h-10 bg-gradient-to-tr from-blue-600 to-blue-400 rounded-xl flex items-center justify-center text-white font-black shadow-md border-2 border-white">
                            {userName.charAt(0).toUpperCase()}
                        </div>
                    </div>
                </div>
            </div>
        </header>
    );
}