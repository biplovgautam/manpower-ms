"use client";
import axios from 'axios';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { DashboardLayout } from '../../../components/DashboardLayout';
import EmployeeDashboard from '../../../components/Employee/EmployeeDashboard';

export default function EmployeePage() {
    const router = useRouter();
    const [data, setData] = useState({ user: null, notifications: [], loading: true });

    useEffect(() => {
        const fetchInit = async () => {
            const token = localStorage.getItem('token');
            try {
                const [dash, me] = await Promise.all([
                    axios.get('http://localhost:5000/api/dashboard', { headers: { Authorization: `Bearer ${token}` } }),
                    axios.get('http://localhost:5000/api/auth/me', { headers: { Authorization: `Bearer ${token}` } })
                ]);

                setData({
                    user: me.data.user,
                    notifications: dash.data.data.notifications || [],
                    loading: false
                });
            } catch (err) { router.replace('/login'); }
        };
        fetchInit();
    }, [router]);

    if (data.loading) return null;

    return (
        <DashboardLayout
            role="employee"
            user={data.user}
            notifications={data.notifications}
            onNavigate={(p) => router.push(`/dashboard/employee/${p}`)}
            onLogout={() => { localStorage.clear(); router.push('/login'); }}
        >
          <EmployeeDashboard navigateTo={(path) => router.push(`/dashboard/employee/${path}`)} />
        </DashboardLayout>
    );
}