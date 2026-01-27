"use client";
import axios from 'axios';
import { useEffect, useMemo, useState } from 'react';
import { Header } from './Header';
import { Sidebar } from './Sidebar';

export function DashboardLayout({
    children,
    user: propUser, // User passed from page.jsx (if any)
    notifications = [],
    role,
    currentPath,
    onNavigate,
    onLogout,
    onMarkAllAsRead
}) {
    const [internalUser, setInternalUser] = useState(null);

    // FETCH USER DATA IF PROPS ARE EMPTY (Handles other tabs)
    useEffect(() => {
        if (!propUser && !internalUser) {
            const fetchUser = async () => {
                try {
                    const token = localStorage.getItem('token');
                    if (!token) return;
                    const res = await axios.get('http://localhost:5000/api/auth/me', {
                        headers: { Authorization: `Bearer ${token}` }
                    });
                    if (res.data.success) {
                        setInternalUser(res.data.user);
                    }
                } catch (err) {
                    console.error("Layout Fetch Error:", err);
                }
            };
            fetchUser();
        }
    }, [propUser, internalUser]);

    // Normalize either the Prop User or the Internally Fetched User
    const memoizedUser = useMemo(() => {
        const activeUser = propUser || internalUser;
        return {
            id: activeUser?._id || "",
            fullName: activeUser?.fullName || activeUser?.name || "Loading...",
            role: activeUser?.role || role || "Member",
            avatar: (activeUser?.fullName || "U").charAt(0).toUpperCase()
        };
    }, [propUser, internalUser, role]);

    return (
        <div className="flex h-screen bg-slate-50 overflow-hidden font-sans text-slate-900">
            <Sidebar
                role={memoizedUser.role.toLowerCase()}
                currentPath={currentPath}
                onNavigate={onNavigate}
                onLogout={onLogout}
                user={memoizedUser}
            />

            <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                <Header
                    user={memoizedUser}
                    notifications={notifications}
                    onNavigate={onNavigate}
                    onRefreshNotifications={onMarkAllAsRead}
                />

                <main className="flex-1 overflow-y-auto p-4 md:p-8 bg-slate-50/50">
                    <div className="max-w-[1600px] mx-auto">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
}