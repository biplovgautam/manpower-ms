"use client";

import axios from 'axios';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import AdminDashboard from '../../../components/Admin/AdminDashboard';
import { DashboardLayout } from '../../../components/DashboardLayout';

export default function TenantAdminPage() {
    const router = useRouter();
    const [isReady, setIsReady] = useState(false);

    // Combined state for all dashboard data
    const [data, setData] = useState({
        user: null,
        notifications: [],
        loading: true
    });

    useEffect(() => {
        const fetchDashboardData = async () => {
            const token = localStorage.getItem('token');
            const role = localStorage.getItem('role');

            if (!token || role !== 'admin') {
                router.replace('/login');
                return;
            }

            try {
                const res = await axios.get('http://localhost:5000/api/dashboard', {
                    headers: { Authorization: `Bearer ${token}` }
                });

                if (res.data.success) {
                    setData({
                        user: res.data.data.user,
                        notifications: res.data.data.notes || [],
                        loading: false
                    });
                    setIsReady(true);
                }
            } catch (err) {
                console.error("Dashboard fetch error:", err);
                if (err.response?.status === 401) {
                    localStorage.clear();
                    router.replace('/login');
                }
            }
        };

        fetchDashboardData();
    }, [router]);

    const handleNavigation = (path) => {
        if (!path) return;

        // Add mapping for notifications
        const routes = {
            'notifications': '/dashboard/tenant-admin/notifications',
            'settings': '/dashboard/tenant-admin/settings',
            'dashboard': '/dashboard/tenant-admin',
        };

        // Allow direct absolute paths or use the map
        const targetPath = path.startsWith('/') ? path : (routes[path] || '/dashboard/tenant-admin');
        router.push(targetPath);
    };

    const handleLogout = () => {
        localStorage.clear();
        import('js-cookie').then(Cookies => {
            Cookies.default.remove('token', { path: '/' });
            Cookies.default.remove('role', { path: '/' });
        });
        router.push('/login');
    };

    if (!isReady || data.loading) {
        return (
            <div className="h-screen w-screen flex items-center justify-center bg-slate-50">
                <div className="flex flex-col items-center gap-3">
                    <div className="animate-spin rounded-full h-10 w-10 border-t-4 border-blue-600 border-gray-200"></div>
                    <span className="font-bold text-slate-600 animate-pulse">Initializing Dashboard...</span>
                </div>
            </div>
        );
    }

    return (
        <DashboardLayout
            role={data.user?.role || "admin"}
            user={data.user}
            notifications={data.notifications}
            currentPath="/dashboard/tenant-admin"
            onNavigate={handleNavigation}
            onLogout={handleLogout}
        >
            <AdminDashboard
                data={data}
                onNavigate={handleNavigation}
            />
        </DashboardLayout>
    );
}