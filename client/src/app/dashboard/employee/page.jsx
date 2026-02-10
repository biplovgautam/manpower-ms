"use client";

import axios from 'axios';
import { RefreshCw } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { Toaster } from 'react-hot-toast';
import { DashboardLayout } from '../../../components/DashboardLayout';
import EmployeeDashboard from '../../../components/Employee/EmployeeDashboard';
import { apiUrl } from '@/lib/api';

/**
 * EmployeePage (Root Dashboard)
 * This acts as the landing page after login. It fetches the user profile
 * and provides the base context for the dashboard layout.
 */
export default function EmployeePage({ notifications, onMarkAllRead }) {
    const router = useRouter();
    const [data, setData] = useState({ user: null, loading: true });

    const fetchUser = useCallback(async () => {
        const token = localStorage.getItem('token');
        const role = localStorage.getItem('role');

        // 1. Basic Auth Guard
        if (!token || role?.toLowerCase() !== 'employee') {
            localStorage.clear();
            return router.replace('/login');
        }

        try {
            // 2. Fetch fresh user profile from backend
            const response = await axios.get(apiUrl('/api/auth/me'), {
                headers: { Authorization: `Bearer ${token}` }
            });

            const userData = response.data?.data || response.data?.user || response.data;
            setData({ user: userData, loading: false });
        } catch (err) {
            console.error("Session verification failed:", err);
            localStorage.clear();
            router.replace('/login');
        }
    }, [router]);

    useEffect(() => {
        fetchUser();
    }, [fetchUser]);

    // Global Loading State (Appears during first boot or refresh)
    if (data.loading) return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 gap-4">
            <RefreshCw className="animate-spin text-indigo-600" size={48} />
            <p className="text-slate-500 font-medium animate-pulse">Establishing secure session...</p>
        </div>
    );

    return (
        <>
            <Toaster position="top-right" />

            <DashboardLayout
                role="employee"
                user={data.user}
                userName={data.user?.fullName}
                currentPath="/dashboard/employee"
                onLogout={() => {
                    localStorage.clear();
                    router.push('/login');
                }}
            >
                {/* We pass 'notifications' and 'user' to the inner EmployeeDashboard 
                  so the "Stats Cards" (e.g., Pending Workers, Active Demands) 
                  can render immediately.
                */}
                <div className="animate-in fade-in duration-500">
                    <EmployeeDashboard
                        data={data}
                        notifications={notifications}
                        onMarkAllRead={onMarkAllRead}
                    />
                </div>
            </DashboardLayout>
        </>
    );
}