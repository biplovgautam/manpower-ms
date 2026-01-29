"use client";
import axios from 'axios';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { DashboardLayout } from '../../../../components/DashboardLayout';
import NotificationsPage from '../../../../components/NotificationPage';

export default function EmployeeNotifPage() {
    const router = useRouter();
    const [data, setData] = useState({ user: null, notifications: [], loading: true });

    const fetchNotifs = useCallback(async () => {
        try {
            const token = localStorage.getItem('token');
            const headers = { Authorization: `Bearer ${token}` };

            const [dashRes, authRes] = await Promise.all([
                axios.get('http://localhost:5000/api/dashboard', { headers }),
                axios.get('http://localhost:5000/api/auth/me', { headers })
            ]);

            const fullUser = authRes.data?.data || authRes.data?.user || authRes.data;
            const notifData = dashRes.data?.data?.notifications || dashRes.data?.notifications || [];

            setData({
                user: fullUser,
                notifications: notifData,
                loading: false
            });
        } catch (err) {
            console.error("Employee Fetch Error:", err);
            toast.error("Fetch failed");
            setData(prev => ({ ...prev, loading: false }));
        }
    }, []);

    useEffect(() => { fetchNotifs(); }, [fetchNotifs]);

    const handleMarkAllAsRead = async () => {
        const userId = String(data.user?._id || data.user?.id || "");
        try {
            await axios.patch('http://localhost:5000/api/notifications/read-all', {}, {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            });

            setData(prev => ({
                ...prev,
                notifications: prev.notifications.map(n => ({
                    ...n,
                    isReadBy: Array.from(new Set([...(n.isReadBy || []).map(id => String(id)), userId]))
                }))
            }));
            toast.success("Activities cleared");
        } catch (err) { toast.error("Update error"); }
    };

    if (data.loading) {
        return (
            <div className="h-screen w-full flex items-center justify-center bg-slate-50">
                <div className="flex flex-col items-center gap-3">
                    <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-slate-500 text-sm font-medium">Loading Log...</p>
                </div>
            </div>
        );
    }

    return (
        <DashboardLayout
            role="employee"
            user={data.user}
            notifications={data.notifications}
            onMarkAllAsRead={handleMarkAllAsRead}
            onNavigate={(p) => router.push(`/dashboard/employee/${p}`)}
        >
            <NotificationsPage
                notifications={data.notifications}
                currentUserId={String(data.user?._id || data.user?.id || "")}
                onMarkAllAsRead={handleMarkAllAsRead}
            />
        </DashboardLayout>
    );
}