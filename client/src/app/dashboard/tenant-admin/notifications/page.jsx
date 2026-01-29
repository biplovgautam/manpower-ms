"use client";
import axios from 'axios';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { DashboardLayout } from '../../../../components/DashboardLayout';
import NotificationsPage from '../../../../components/NotificationPage';

export default function AdminNotifPage() {
    const router = useRouter();
    const [data, setData] = useState({ user: null, notifications: [], loading: true });

    const fetchData = useCallback(async () => {
        try {
            const token = localStorage.getItem('token');
            const headers = { Authorization: `Bearer ${token}` };

            // Fetch both Dashboard data and Auth Profile in parallel
            const [dashRes, authRes] = await Promise.all([
                axios.get('http://localhost:5000/api/dashboard', { headers }),
                axios.get('http://localhost:5000/api/auth/me', { headers })
            ]);

            // Use the user data from auth/me because it contains the fullName
            const fullUser = authRes.data?.data || authRes.data?.user || authRes.data;
            const notifData = dashRes.data?.data?.notifications || dashRes.data?.notifications || [];

            setData({
                user: fullUser,
                notifications: notifData,
                loading: false
            });
        } catch (err) {
            console.error("Fetch error:", err);
            toast.error("Failed to load user profile");
            setData(prev => ({ ...prev, loading: false }));
        }
    }, []);

    const handleMarkAllAsRead = async () => {
        const userId = String(data.user?._id || data.user?.id || "");
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
            toast.success("All activity marked as read");
        } catch (err) { toast.error("Sync error"); }
    };

    useEffect(() => { fetchData(); }, [fetchData]);

    if (data.loading) {
        return (
            <div className="h-screen w-full flex items-center justify-center bg-slate-50">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    return (
        <DashboardLayout
            role="admin"
            user={data.user}
            notifications={data.notifications}
            onMarkAllAsRead={handleMarkAllAsRead}
            onNavigate={(p) => router.push(`/dashboard/tenant-admin/${p}`)}
        >
            <NotificationsPage
                notifications={data.notifications}
                currentUserId={String(data.user?._id || data.user?.id || "")}
                onMarkAllAsRead={handleMarkAllAsRead}
            />
        </DashboardLayout>
    );
}