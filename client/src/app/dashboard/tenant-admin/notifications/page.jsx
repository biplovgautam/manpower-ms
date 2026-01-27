"use client";
import axios from 'axios';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { DashboardLayout } from '../../../../components/DashboardLayout';
import NotificationsPage from '../../../../components/NotificationPage';

export default function AdminNotifPage() {
    const router = useRouter();
    const [data, setData] = useState({ user: null, notifications: [], loading: true });

    const fetchData = async () => {
        try {
            const res = await axios.get('http://localhost:5000/api/dashboard', {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            });
            setData({
                user: res.data.data.user,
                notifications: res.data.data.notifications || [],
                loading: false
            });
        } catch (err) { toast.error("Load failed"); }
    };

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

    useEffect(() => { fetchData(); }, []);

    if (data.loading) return null;

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
                currentUserId={String(data.user?._id || data.user?.id)}
                onMarkAllAsRead={handleMarkAllAsRead}
            />
        </DashboardLayout>
    );
}