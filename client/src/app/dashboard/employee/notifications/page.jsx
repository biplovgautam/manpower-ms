"use client";

import axios from 'axios';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { DashboardLayout } from '../../../../components/DashboardLayout';
import NotificationsPage from '../../../../components/NotificationPage';

/**
 * PATH: app/dashboard/employee/notifications/page.js
 */
export default function EmployeeNotificationsFullPage() {
    const router = useRouter();
    const [data, setData] = useState({
        user: null,
        notifications: [],
        loading: true,
        error: null
    });

    useEffect(() => {
        const fetchAllData = async () => {
            const token = localStorage.getItem('token');

            if (!token) {
                router.push('/login');
                return;
            }

            try {
                // Fetching from your central dashboard endpoint
                const res = await axios.get('http://localhost:5000/api/dashboard', {
                    headers: { Authorization: `Bearer ${token}` }
                });

                // Mapping the backend 'notes' to notifications
                setData({
                    user: res.data.data.user,
                    notifications: res.data.data.notes || [],
                    loading: false,
                    error: null
                });
            } catch (err) {
                console.error("Fetch Error:", err);
                setData(prev => ({
                    ...prev,
                    loading: false,
                    error: "Failed to load activity logs. Please try again later."
                }));
            }
        };

        fetchAllData();
    }, [router]);

    /**
     * Handles navigation for both Sidebar and Header pop-up
     */
    const handleNavigation = (path) => {
        const routes = {
            'dashboard': '/dashboard/employee',
            'notifications': '/dashboard/employee/notifications',
            'worker': '/dashboard/employee/worker',
            'employer': '/dashboard/employee/employer',
            'agent': '/dashboard/employee/sub-agent',
            'demand': '/dashboard/employee/job-demand',
        };

        const target = routes[path] || path;
        router.push(target);
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        router.push('/login');
    };

    // --- Loading State ---
    if (data.loading) {
        return (
            <div className="h-screen flex flex-col items-center justify-center bg-slate-50">
                <div className="relative w-12 h-12">
                    <div className="absolute top-0 left-0 w-full h-full border-4 border-indigo-200 rounded-full"></div>
                    <div className="absolute top-0 left-0 w-full h-full border-4 border-indigo-600 rounded-full border-t-transparent animate-spin"></div>
                </div>
                <p className="mt-4 text-slate-500 font-medium animate-pulse">Loading Activity Logs...</p>
            </div>
        );
    }

    // --- Error State ---
    if (data.error) {
        return (
            <div className="h-screen flex items-center justify-center bg-slate-50 p-4">
                <div className="bg-white p-8 rounded-3xl shadow-sm border border-red-100 text-center max-w-md">
                    <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg size={32} fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-8 h-8">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                    </div>
                    <h2 className="text-xl font-bold text-slate-800">Connection Error</h2>
                    <p className="text-slate-500 mt-2">{data.error}</p>
                    <button
                        onClick={() => window.location.reload()}
                        className="mt-6 px-6 py-2 bg-slate-800 text-white rounded-xl font-bold hover:bg-slate-700 transition-all"
                    >
                        Try Again
                    </button>
                </div>
            </div>
        );
    }

    return (
        <DashboardLayout
            role="employee"
            user={data.user}
            notifications={data.notifications}
            currentPath="/dashboard/employee/notifications"
            onNavigate={handleNavigation}
            onLogout={handleLogout}
        >
            {/* The actual Activity Log UI component */}
            <NotificationsPage notifications={data.notifications} />
        </DashboardLayout>
    );
}