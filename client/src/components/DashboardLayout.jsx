"use client";

import axios from 'axios';
import Cookies from 'js-cookie';
import { usePathname, useRouter } from 'next/navigation';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { io } from 'socket.io-client';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { apiUrl, API_BASE_URL } from '@/lib/api';

export function DashboardLayout({ children, user: propUser, role }) {
    const [notifications, setNotifications] = useState([]);
    const [currentUser, setCurrentUser] = useState(null);
    const [socket, setSocket] = useState(null);
    const pathname = usePathname();
    const router = useRouter();

    const API_BASE = apiUrl('/api');

    // --- CENTRALIZED SMART NAVIGATION ---
    // This fixes the "Double Path" and "Other Pages" issue
    const handleNavigate = useCallback((path) => {
        if (!path) return;

        // 1. Define the base path based on the user's role
        // We normalize the role to handle "Admin", "admin", "Employee", etc.
        const userRole = (currentUser?.role || propUser?.role || role || "").toLowerCase();
        const base = userRole.includes('admin') ? '/dashboard/tenant-admin' : '/dashboard/employee';
        
        // 2. If the path is already absolute (starts with /dashboard), go there directly
        if (path.startsWith('/dashboard')) {
            router.push(path);
            return;
        }

        // 3. Otherwise, build a clean absolute path
        const cleanSegment = path.startsWith('/') ? path.substring(1) : path;
        const finalPath = `${base}/${cleanSegment}`;
        
        console.log("📍 Global Navigate to:", finalPath);
        router.push(finalPath);
    }, [router, currentUser, propUser, role]);

    // 1. Fetch User Profile
    const fetchUserProfile = useCallback(async () => {
        const token = localStorage.getItem('token');
        if (!token) return handleLogout();

        try {
            const res = await axios.get(`${API_BASE}/auth/me`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.data.success) {
                setCurrentUser(res.data.data || res.data.user);
            }
        } catch (err) {
            console.error("Profile Fetch Error:", err);
            if (err.response?.status === 401) handleLogout();
        }
    }, [API_BASE]);

    // 2. Logout
    const handleLogout = useCallback(() => {
        localStorage.clear();
        Cookies.remove('token', { path: '/' });
        Cookies.remove('role', { path: '/' });
        router.replace('/login');
        toast.success("Logged out successfully");
    }, [router]);

    // 3. ROBUST USER DATA MAPPING
    const memoizedUser = useMemo(() => {
        const activeUser = currentUser || propUser;
        const name = activeUser?.fullName || activeUser?.user?.fullName || activeUser?.name || "User";
        const userRole = activeUser?.role || role || "Member";

        return {
            id: String(activeUser?._id || activeUser?.id || ""),
            companyId: String(activeUser?.companyId || activeUser?.user?.companyId || ""), 
            fullName: name,
            role: userRole,
            avatar: name && name !== "User" ? name.charAt(0).toUpperCase() : "U",
        };
    }, [currentUser, propUser, role]);

    // 4. Fetch Notifications
    const fetchNotifications = useCallback(async () => {
        const token = localStorage.getItem('token');
        if (!token) return;
        try {
            const res = await axios.get(`${API_BASE}/notifications`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setNotifications(res.data?.data || []);
        } catch (err) {
            console.error("Notification Fetch Error:", err);
        }
    }, [API_BASE]);

    useEffect(() => {
        fetchUserProfile();
        fetchNotifications();
    }, [fetchUserProfile, fetchNotifications, pathname]);

    // 5. Socket Logic
    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!memoizedUser.id || !token) return;

        const newSocket = io(API_BASE_URL, {
            auth: { token },
            reconnectionAttempts: 5
        });

        if (memoizedUser.companyId && memoizedUser.companyId !== "undefined") {
            newSocket.emit('join', memoizedUser.companyId);
        }

        newSocket.on('newNotification', (notif) => {
            setNotifications(prev => {
                if (prev.find(n => n._id === notif._id)) return prev;
                return [notif, ...prev];
            });
            toast.success(`New ${notif.category}: ${notif.content}`, { position: 'bottom-right' });
        });

        setSocket(newSocket);
        return () => {
            newSocket.off('newNotification');
            newSocket.close();
        };
    }, [memoizedUser.id, memoizedUser.companyId]);

    // 6. Mark All Read
    const handleMarkAllRead = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.patch(`${API_BASE}/notifications/mark-all-read`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (res.data.success) {
                setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
                toast.success("Marked all as read");
            }
        } catch (err) {
            toast.error("Failed to sync notifications");
        }
    };

    return (
        <div className="flex h-screen bg-slate-50 overflow-hidden">
            <Sidebar
                role={memoizedUser.role.toLowerCase()}
                user={memoizedUser}
                onNavigate={handleNavigate} // Uses internal smart navigator
                onLogout={handleLogout}
            />

            <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                <Header
                    user={memoizedUser}
                    notifications={notifications}
                    onMarkAllRead={handleMarkAllRead}
                    onNavigate={handleNavigate} // Uses internal smart navigator
                />

                <main className="flex-1 overflow-y-auto p-4 md:p-8">
                    {React.Children.map(children, child => {
                        if (React.isValidElement(child) && typeof child.type !== 'string') {
                            return React.cloneElement(child, {
                                notifications,
                                onMarkAllRead: handleMarkAllRead,
                                user: memoizedUser,
                                refreshNotifications: fetchNotifications,
                                // Passing the smart navigator down to child pages automatically
                                onNavigate: handleNavigate 
                            });
                        }
                        return child;
                    })}
                </main>
            </div>
        </div>
    );
}