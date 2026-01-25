"use client";
import axios from 'axios';
import { useRouter } from 'next/navigation'; // Use Next.js router
import { useEffect, useState } from 'react';
import { DashboardLayout } from '../../../../components/DashboardLayout';
import NotificationsPage from '../../../../components/NotificationPage';

export default function AdminNotifPage() {
    const router = useRouter(); // Initialize router
    const [user, setUser] = useState(null);
    const [notifications, setNotifications] = useState([]);

    // Centralized navigation handler
    const handleNavigation = (path) => {
        // If path is a simple slug, map it; otherwise use the path directly
        const routes = {
            'dashboard': '/dashboard/tenant-admin',
            'notifications': '/dashboard/tenant-admin/notifications',
            'worker': '/dashboard/tenant-admin/worker',
        };
        const target = routes[path] || `/dashboard/tenant-admin/${path}`;
        router.push(target);
    };

    useEffect(() => {
        const fetchData = async () => {
            const token = localStorage.getItem('token');
            try {
                const res = await axios.get('http://localhost:5000/api/dashboard', {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setUser(res.data.data.user);
                setNotifications(res.data.data.notes || []);
            } catch (err) {
                console.error("Failed to fetch logs", err);
            }
        };
        fetchData();
    }, []);

    return (
        <DashboardLayout
            role="admin"
            user={user}
            notifications={notifications}
            currentPath="/dashboard/tenant-admin/notifications"
            onNavigate={handleNavigation} // <--- MUST PASS THIS FUNCTION
            onLogout={() => {
                localStorage.removeItem('token');
                router.push('/login');
            }}
        >
            <NotificationsPage notifications={notifications} />
        </DashboardLayout>
    );
}