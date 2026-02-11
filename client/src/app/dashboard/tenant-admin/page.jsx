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

    // --- NAVIGATION LOGIC ---
    // This is the gatekeeper for all route changes
    const handleNavigation = useCallback((path) => {
        if (!path) return;

        // If the path already includes the dashboard prefix, don't double it!
        const targetPath = path.startsWith('/dashboard/tenant-admin') 
            ? path 
            : `/dashboard/tenant-admin/${path.startsWith('/') ? path.substring(1) : path}`;
        
        // Ensure it always starts with exactly one leading slash
        const finalPath = targetPath.startsWith('/') ? targetPath : `/${targetPath}`;
        
        console.log(`🚀 Navigating to: ${finalPath}`);
        router.push(finalPath);
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
            console.error("Auth error:", err);
            router.replace('/login');
        }
    }, [router]);

    const handleMarkAllAsRead = async () => {
        try {
            const token = localStorage.getItem('token');
            await axios.patch(apiUrl('/api/notifications/read-all'), {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            toast.success("All activities marked as read");
            // Note: DashboardLayout should handle the local state refresh of notifications
        } catch (err) {
            toast.error("Failed to update notifications");
        }
    };

    useEffect(() => { 
        fetchAllData(); 
    }, [fetchAllData]);

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
                {/* Children receive context from DashboardLayout.
                  This is where your Redpanda notifications will eventually render 
                */}
                <AdminDashboard data={data} onNavigate={handleNavigation} />
            </DashboardLayout>
        </>
    );
}