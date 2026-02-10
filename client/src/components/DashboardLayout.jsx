"use client";

import axios from 'axios';
import Cookies from 'js-cookie';
import { usePathname, useRouter } from 'next/navigation';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { io } from 'socket.io-client';
import { Header } from './Header';
import { Sidebar } from './Sidebar';

export function DashboardLayout({ children, user: propUser, role, onNavigate }) {
    const [notifications, setNotifications] = useState([]);
    const [currentUser, setCurrentUser] = useState(null);
    const [socket, setSocket] = useState(null);
    const pathname = usePathname();
    const router = useRouter();

    const API_BASE = "http://localhost:5000/api";

    // 1. Fetch User Profile
    const fetchUserProfile = useCallback(async () => {
        const token = localStorage.getItem('token');
        if (!token) return handleLogout();

        try {
            const res = await axios.get(`${API_BASE}/auth/me`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.data.success) {
                setCurrentUser(res.data.data);
            }
        } catch (err) {
            if (err.response?.status === 401) handleLogout();
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

    // 3. User Data mapping
    const memoizedUser = useMemo(() => {
        const activeUser = currentUser || propUser;
        return {
            id: String(activeUser?._id || activeUser?.id || ""),
            companyId: String(activeUser?.companyId || ""), // Crucial for Socket Rooms
            fullName: activeUser?.fullName || activeUser?.name || "User",
            role: activeUser?.role || role || "Member",
        };
    }, [currentUser, propUser, role]);

    // 4. Fetch Notifications (Corrected Endpoint)
    const fetchNotifications = useCallback(async () => {
        const token = localStorage.getItem('token');
        if (!token) return;
        try {
            // Using the route we defined in the previous step
            const res = await axios.get(`${API_BASE}/notifications`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setNotifications(res.data?.data || []);
        } catch (err) {
            console.error("Notification Fetch Error:", err);
        }
    }, []);

    useEffect(() => {
        fetchUserProfile();
        fetchNotifications();
    }, [fetchUserProfile, fetchNotifications, pathname]);

    // 5. Socket Logic (Joining Company Room)
    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!memoizedUser.id || !token) return;

        const newSocket = io('http://localhost:5000', {
            auth: { token },
            reconnectionAttempts: 5
        });

        // Join the company room so we get team alerts
        if (memoizedUser.companyId) {
            newSocket.emit('join', memoizedUser.companyId);
        }

        newSocket.on('newNotification', (notif) => {
            // Check if notif already exists to prevent duplicates
            setNotifications(prev => {
                const exists = prev.find(n => n._id === notif._id);
                if (exists) return prev;
                return [notif, ...prev];
            });
            
            // Subtle sound or toast
            toast.custom((t) => (
                <div className={`${t.visible ? 'animate-enter' : 'animate-leave'} max-w-md w-full bg-white shadow-lg rounded-lg pointer-events-auto flex ring-1 ring-black ring-opacity-5`}>
                    <div className="flex-1 w-0 p-4">
                        <div className="flex items-start">
                            <div className="ml-3 flex-1">
                                <p className="text-sm font-medium text-gray-900">New Alert: {notif.category}</p>
                                <p className="mt-1 text-sm text-gray-500">{notif.content}</p>
                            </div>
                        </div>
                    </div>
                </div>
            ), { position: 'bottom-right' });
        });

        setSocket(newSocket);
        return () => {
            newSocket.off('newNotification');
            newSocket.close();
        };
    }, [memoizedUser.id, memoizedUser.companyId]);

    // 6. Mark All Read (Updated Endpoint)
    const handleMarkAllRead = async () => {
        try {
            const token = localStorage.getItem('token');
            // Matches the router.patch('/mark-all-read') route
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
                    {React.Children.map(children, child => {
                        if (React.isValidElement(child) && typeof child.type !== 'string') {
                            return React.cloneElement(child, {
                                notifications,
                                onMarkAllRead: handleMarkAllRead,
                                user: memoizedUser,
                                // Pass fetch to children in case they trigger actions that need a refresh
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