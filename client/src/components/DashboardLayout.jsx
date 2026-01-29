"use client";
import axios from 'axios';
import Cookies from 'js-cookie';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { Header } from './Header';
import { Sidebar } from './Sidebar';

export function DashboardLayout({
    children,
    user: propUser,
    notifications = [],
    role,
    currentPath,
    onNavigate,
    onLogout: propOnLogout,
    onMarkAllAsRead
}) {
    const [internalUser, setInternalUser] = useState(null);
    const router = useRouter();

    const safeNavigate = (path) => {
        if (onNavigate) {
            onNavigate(path);
        } else {
            const basePath = currentPath?.includes('tenant-admin') ? 'tenant-admin' : 'employee';
            router.push(`/dashboard/${basePath}/${path}`);
        }
    };

    useEffect(() => {
        const token = localStorage.getItem('token') || Cookies.get('token');

        // IMPORTANT: If propUser is already provided by the Page, don't fetch again
        if (!propUser && !internalUser && token) {
            const fetchUser = async () => {
                try {
                    const res = await axios.get('http://localhost:5000/api/auth/me', {
                        headers: { Authorization: `Bearer ${token}` }
                    });
                    const data = res.data?.user || res.data?.data?.user || res.data?.data || res.data;
                    if (data) setInternalUser(data);
                } catch (err) {
                    console.error("Layout Fetch Error:", err);
                }
            };
            fetchUser();
        }
    }, [propUser, internalUser]);

    const memoizedUser = useMemo(() => {
        const activeUser = propUser || internalUser;

        // Exhaustive search for the name field
        const foundName = activeUser?.fullName ||
            activeUser?.name ||
            activeUser?.username ||
            activeUser?.displayName ||
            (activeUser?.email ? activeUser.email.split('@')[0] : "");

        const displayRole = activeUser?.role || role || "User";

        return {
            id: String(activeUser?._id || activeUser?.id || ""),
            fullName: foundName,
            role: displayRole,
            avatar: foundName
                ? foundName.charAt(0).toUpperCase()
                : displayRole.charAt(0).toUpperCase()
        };
    }, [propUser, internalUser, role]);

    const handleLogout = () => {
        if (propOnLogout) propOnLogout();
        localStorage.clear();
        Cookies.remove('token');
        window.location.href = '/login';
    };

    return (
        <div className="flex h-screen bg-slate-50 overflow-hidden font-sans text-slate-900">
            <Sidebar
                role={memoizedUser.role.toLowerCase()}
                currentPath={currentPath}
                onNavigate={safeNavigate}
                onLogout={handleLogout}
                user={memoizedUser}
            />

            <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                <Header
                    user={memoizedUser}
                    notifications={notifications}
                    onNavigate={safeNavigate}
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