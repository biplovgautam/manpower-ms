"use client";

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { DashboardLayout } from '../../../components/DashboardLayout';
import { EmployeeDashboard } from '../../../components/Employee/EmployeeDashboard';

export default function EmployeePage() {
    const router = useRouter();
    const [userData, setUserData] = useState({ fullName: '', role: '' });
    const [isReady, setIsReady] = useState(false);

    useEffect(() => {
        const token = localStorage.getItem('token');
        const role = localStorage.getItem('userRole');
        const fullName = localStorage.getItem('fullName');

        // Security check: Only allow 'employee' role here
        if (!token || role !== 'employee') {
            router.push('/login');
            return;
        }

        setUserData({ fullName, role });
        setIsReady(true);
    }, [router]);

    const handleLogout = () => {
        localStorage.clear();
        router.push('/login');
    };

    if (!isReady) return null;

    return (
        <DashboardLayout
            role="employee"
            userName={userData.fullName}
            currentPath="/dashboard/employee"
            onNavigate={(path) => router.push(path)}
            onLogout={handleLogout}
        >
            {/* Rendering the EmployeeDashboard you provided. 
        Note: We pass mock stats for now as requested.
      */}
            <EmployeeDashboard
                onNavigate={(path) => router.push(path)}
                stats={{
                    employersAdded: 5,
                    activeJobDemands: 12,
                    workersInProcess: 45,
                    tasksNeedingAttention: 3,
                    activeSubAgents: 8
                }}
            />
        </DashboardLayout>
    );
}