"use client";

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

// Try relative paths if @/ is failing
import AdminDashboard from '../../../components/Admin/AdminDashboard';
import { DashboardLayout } from '../../../components/DashboardLayout';

export default function TenantAdminPage() {
    const router = useRouter();
    const [adminData, setAdminData] = useState({ fullName: '', role: '' });
    const [isReady, setIsReady] = useState(false);

    useEffect(() => {
        // 1. Get auth data from localStorage
        const token = localStorage.getItem('token');
        const role = localStorage.getItem('userRole');
        const fullName = localStorage.getItem('fullName');

        // 2. Security Check: If no token or wrong role, kick back to login
        if (!token || role !== 'admin') {
            router.push('/login');
            return;
        }

        setAdminData({ fullName, role });
        setIsReady(true);
    }, [router]);

    // Handle Logout logic
    const handleLogout = () => {
        localStorage.clear();
        router.push('/login');
    };

    if (!isReady) return null; // Or a loading spinner

    return (
        <DashboardLayout
            role="admin"
            userName={adminData.fullName}
            currentPath="/dashboard/tenant-admin"
            onNavigate={(path) => router.push(path)}
            onLogout={handleLogout}
        >
            {/* This renders the UI you built with the "Add Employee" Modal */}
            <AdminDashboard onNavigate={(path) => router.push(path)} />
        </DashboardLayout>
    );
}