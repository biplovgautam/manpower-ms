"use client";
import axios from 'axios';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { Toaster, toast } from 'react-hot-toast';
import AdminDashboard from '../../../components/Admin/AdminDashboard';
import { DashboardLayout } from '../../../components/DashboardLayout';
import { apiUrl } from '@/lib/api';

export default function TenantAdminPage() {
    const router = useRouter();
    const [data, setData] = useState({ user: null, loading: true });

    const handleNavigation = useCallback((path) => {
        const cleanPath = path.startsWith('/') ? path.substring(1) : path;
        router.push(`/dashboard/tenant-admin/${cleanPath}`);
    }, [router]);

    const fetchAllData = useCallback(async () => {
        const token = localStorage.getItem('token');
        if (!token) return router.replace('/login');

        try {
            const userRes = await axios.get(apiUrl('/api/auth/me'), {
                headers: { Authorization: `Bearer ${token}` }
            });
            setData({
                user: userRes.data?.data || userRes.data?.user || userRes.data,
                loading: false
            });
        } catch (err) {
            router.replace('/login');
        }
    }, [router]);

    // This is passed to the Layout. When Layout calls it, 
    // it will trigger its own refresh logic.
    const handleMarkAllAsRead = async () => {
        try {
            const token = localStorage.getItem('token');
            await axios.patch(apiUrl('/api/notifications/read-all'), {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            toast.success("All activities marked as read");
        } catch (err) {
            toast.error("Failed to update notifications");
        }
    };

    useEffect(() => { fetchAllData(); }, [fetchAllData]);

    if (data.loading) return (
        <div className="h-screen flex items-center justify-center bg-slate-50">
            <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
    );

    return (
        <>
            <Toaster position="top-right" />
            <DashboardLayout
                role="admin"
                user={data.user}
                onMarkAllAsRead={handleMarkAllAsRead}
                onNavigate={handleNavigation}
                onLogout={() => {
                    localStorage.clear();
                    router.push('/login');
                }}
            >
                {/* DashboardLayout automatically passes 'notifications' to AdminDashboard */}
                <AdminDashboard data={data} onNavigate={handleNavigation} />
            </DashboardLayout>
        </>
    );
}