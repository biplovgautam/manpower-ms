"use client";
import axios from 'axios';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Toaster } from 'react-hot-toast';
import AdminDashboard from '../../../components/Admin/AdminDashboard';
import { DashboardLayout } from '../../../components/DashboardLayout';

export default function TenantAdminPage() {
    const router = useRouter();
    const [data, setData] = useState({
        user: null, // Full details from /me
        notifications: [],
        loading: true
    });

    useEffect(() => {
        const fetchAllData = async () => {
            const token = localStorage.getItem('token');
            if (!token) { router.replace('/login'); return; }

            try {
                // RUN BOTH CALLS SIMULTANEOUSLY
                const [dashRes, userRes] = await Promise.all([
                    axios.get('http://localhost:5000/api/dashboard', {
                        headers: { Authorization: `Bearer ${token}` }
                    }),
                    axios.get('http://localhost:5000/api/auth/me', {
                        headers: { Authorization: `Bearer ${token}` }
                    })
                ]);

                setData({
                    // userRes.data.user contains the fullName you want
                    user: userRes.data.user,
                    notifications: dashRes.data.data.notifications || [],
                    loading: false
                });
            } catch (err) {
                console.error("Auth fetch error:", err);
                router.replace('/login');
            }
        };
        fetchAllData();
    }, [router]);

    if (data.loading) return <div className="h-screen flex items-center justify-center font-bold text-indigo-600">Initializing Admin...</div>;

    return (
        <>
            <Toaster position="top-right" />
            <DashboardLayout
                role="admin"
                user={data.user}
                notifications={data.notifications}
                currentPath="/dashboard/tenant-admin"
                onNavigate={(path) => router.push(`/dashboard/tenant-admin/${path}`)}
                onLogout={() => { localStorage.clear(); router.push('/login'); }}
            >
                <AdminDashboard data={data} onNavigate={(path) => router.push(`/dashboard/tenant-admin/${path}`)} />
            </DashboardLayout>
        </>
    );
}