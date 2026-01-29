"use client";
import axios from 'axios';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { Toaster } from 'react-hot-toast';
import AdminDashboard from '../../../components/Admin/AdminDashboard';
import { DashboardLayout } from '../../../components/DashboardLayout';

export default function TenantAdminPage() {
    const router = useRouter();
    const [data, setData] = useState({
        user: null,
        notifications: [],
        loading: true
    });

    // Stable navigation handler for Admin routes
    const handleNavigation = useCallback((path) => {
        const cleanPath = path.startsWith('/') ? path.substring(1) : path;
        router.push(`/dashboard/tenant-admin/${cleanPath}`);
    }, [router]);

    const fetchAllData = async () => {
        const token = localStorage.getItem('token');
        if (!token) {
            router.replace('/login');
            return;
        }

        try {
            const [dashRes, userRes] = await Promise.all([
                axios.get('http://localhost:5000/api/dashboard', {
                    headers: { Authorization: `Bearer ${token}` }
                }),
                axios.get('http://localhost:5000/api/auth/me', {
                    headers: { Authorization: `Bearer ${token}` }
                })
            ]);

            setData({
                user: userRes.data.user,
                notifications: dashRes.data.data.notifications || [],
                loading: false
            });
        } catch (err) {
            console.error("Auth fetch error:", err);
            router.replace('/login');
        }
    };

    const handleMarkAllAsRead = async () => {
        const userId = String(data.user?._id || data.user?.id || "");
        if (!userId) return;

        try {
            await axios.patch('http://localhost:5000/api/notifications/read-all', { userId }, {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            });

            setData(prev => ({
                ...prev,
                notifications: prev.notifications.map(n => ({
                    ...n,
                    isReadBy: Array.from(new Set([...(n.isReadBy || []).map(id => String(id)), userId]))
                }))
            }));
        } catch (err) {
            console.error("Mark read error:", err);
        }
    };

    useEffect(() => {
        fetchAllData();
    }, [router]);

    if (data.loading) {
        return (
            <div className="h-screen flex items-center justify-center font-bold text-indigo-600 bg-slate-50">
                <div className="flex flex-col items-center gap-3">
                    <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                    <p>Initializing Admin...</p>
                </div>
            </div>
        );
    }

    return (
        <>
            <Toaster position="top-right" />
            <DashboardLayout
                role="admin"
                user={data.user}
                notifications={data.notifications}
                currentPath="/dashboard/tenant-admin"
                onMarkAllAsRead={handleMarkAllAsRead}
                onNavigate={handleNavigation} // Passed to Header and Sidebar
                onLogout={() => {
                    localStorage.clear();
                    router.push('/login');
                }}
            >
                <AdminDashboard
                    data={data}
                    onNavigate={handleNavigation} // Passed to inner components
                />
            </DashboardLayout>
        </>
    );
}