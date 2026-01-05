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

    /**
     * Updated Navigation Handler
     * Now supports query parameters (like ?action=add)
     */
    const handleNavigation = (path) => {
        if (!path) return;
        
        let targetPath = path;

        // NEW LOGIC: If the path already includes a query parameter (?),
        // we push it directly to preserve the 'action' (e.g., ?action=add)
        if (path.includes('?')) {
            router.push(path);
            return;
        }

        // 1. Map Employer paths
        if (path.includes('employer')) {
            targetPath = '/dashboard/employee/employer';
        }

        // 2. Map 'job-demand' paths
        else if (path.includes('job-demand')) {
            targetPath = '/dashboard/employee/job-demand';
        }

        // 3. Map 'worker' paths
        else if (path.includes('worker')) {
            targetPath = '/dashboard/employee/worker';
        }

        // 4. Map 'subagent' variations
        else if (path.includes('subagent') || path.includes('sub-agent')) {
            targetPath = '/dashboard/employee/subagent';
        }
            
        router.push(targetPath);
    };

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
            onNavigate={handleNavigation}
            onLogout={handleLogout}
        >
            <EmployeeDashboard
                onNavigate={handleNavigation}
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