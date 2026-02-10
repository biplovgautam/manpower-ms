"use client";

import axios from 'axios';
import Cookies from 'js-cookie';
import { usePathname, useRouter } from 'next/navigation';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { io } from 'socket.io-client';
import { API_BASE_URL, apiUrl } from '@/lib/api';
import { Header } from './Header';
import { Sidebar } from './Sidebar';

export function DashboardLayout({ children, user: propUser, role, onNavigate }) {
    const [notifications, setNotifications] = useState([]);
    const [currentUser, setCurrentUser] = useState(null);
    const [socket, setSocket] = useState(null);
    const pathname = usePathname();
    const router = useRouter();

    const API_BASE = apiUrl('/api');

    // 1. Fetch User Profile
    const fetchUserProfile = useCallback(async () => {
        const token = localStorage.getItem('token');
        if (!token) return handleLogout();

        try {
            const res = await axios.get(`${API_BASE}/auth/me`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.data.success) {
                // Ensure we are saving the nested data object if the API returns it that way
                setCurrentUser(res.data.data || res.data.user);
            }
        } catch (err) {
            // Only force logout on actual 401/403 errors
            if (err.response?.status === 401 || err.response?.status === 403) {
                handleLogout();
            }
        }
    }, []);

    // 2. Logout
    const handleLogout = useCallback(() => {
        localStorage.clear();
        Cookies.remove('token', { path: '/' });
        Cookies.remove('role', { path: '/' });
        router.replace('/login');
        toast.success("Logged out successfully");
    }, [router]);

    // 3. Robust User Data Mapping
    const memoizedUser = useMemo(() => {
        // Priority: Fetch Results > Props from the Page > Hardcoded role
        const activeUser = currentUser || propUser;
        
        return {
            id: String(activeUser?._id || activeUser?.id || ""),
            companyId: String(activeUser?.companyId || ""), 
            fullName: activeUser?.fullName || activeUser?.name || propUser?.fullName || "User",
            role: activeUser?.role || role || propUser?.role || "Member",
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
    }, []);

    // Run Profile and Notification fetch on mount and path changes
    useEffect(() => {
        fetchUserProfile();
        fetchNotifications();
    }, [fetchUserProfile, fetchNotifications, pathname]);

    // 5. Socket Logic
    useEffect(() => {
        const token = localStorage.getItem('token');
        // Wait for user ID to be available before connecting
        if (!memoizedUser.id || !token) return;

        const newSocket = io(API_BASE_URL, {
            auth: { token },
            reconnectionAttempts: 5,
            transports: ['websocket'] // Often more stable for Node backends
        });

        // Join the company room for targeted team alerts
        if (memoizedUser.companyId && memoizedUser.companyId !== "undefined") {
            newSocket.emit('join', memoizedUser.companyId);
        }

        newSocket.on('newNotification', (notif) => {
            setNotifications(prev => {
                const exists = prev.find(n => n._id === notif._id);
                if (exists) return prev;
                return [notif, ...prev];
            });
            
            toast.custom((t) => (
                <div className={`${t.visible ? 'animate-enter' : 'animate-leave'} max-w-md w-full bg-white shadow-lg rounded-lg pointer-events-auto flex ring-1 ring-black ring-opacity-5 border-l-4 border-indigo-500`}>
                    <div className="flex-1 w-0 p-4">
                        <div className="flex items-start">
                            <div className="ml-3 flex-1">
                                <p className="text-sm font-bold text-gray-900">
                                    {notif.category || 'New Update'}
                                </p>
                                <p className="mt-1 text-xs text-gray-500 line-clamp-2">
                                    {notif.content}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            ), { position: 'bottom-right' });
        });

        setSocket(newSocket);
        
        return () => {
            newSocket.disconnect();
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
                toast.success("All caught up!");
            }
        } catch (err) {
            toast.error("Failed to sync notifications");
        }
    };

    return (
        <div className="flex h-screen bg-slate-50 overflow-hidden font-sans">
            <Sidebar
                role={memoizedUser.role.toLowerCase()}
                user={memoizedUser}
                onNavigate={onNavigate}
                onLogout={handleLogout}
            />

            <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                <Header
                    user={memoizedUser}
                    notifications={notifications}
                    onMarkAllRead={handleMarkAllRead}
                    onNavigate={onNavigate}
                    onLogout={handleLogout}
                />

                <main className="flex-1 overflow-y-auto p-4 md:p-8">
                    {/* Injecting shared props into children to avoid 
                       redundant API calls in child components 
                    */}
                    {React.Children.map(children, child => {
                        if (React.isValidElement(child) && typeof child.type !== 'string') {
                            return React.cloneElement(child, {
                                notifications,
                                onMarkAllRead: handleMarkAllRead,
                                user: memoizedUser,
                                refreshNotifications: fetchNotifications 
                            });
                        }
                        return child;
                    })}
                </main>
            </div>
        </div>
    );
}