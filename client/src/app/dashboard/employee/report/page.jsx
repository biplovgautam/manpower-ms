"use client";

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { DashboardLayout } from '../../../../components/DashboardLayout';
import { ReportsPage } from '../../../../components/Employee/ReportPage';
import { apiUrl } from '@/lib/api';

export default function ReportsDashboard() {
    const router = useRouter();
    const [realData, setRealData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [userData, setUserData] = useState({ fullName: '', role: '' });

    const handleLogout = () => {
        localStorage.clear();
        router.push('/login');
    };

    // FIXED NAVIGATION HANDLER
    const handleNavigate = (destination) => {
        console.log("Parent received navigation request for:", destination);
        
        switch (destination) {
            // Must match the string exactly as sent from ReportsPage
            case 'worker': 
                router.push('/dashboard/employee/worker');
                break;
            case 'job-demand': 
                router.push('/dashboard/employee/job-demand');
                break;
            default:
                console.warn(`No route defined for key: ${destination}`);
        }
    };

    useEffect(() => {
        const token = localStorage.getItem('token');
        const role = localStorage.getItem('role');

        if (!token || role?.toLowerCase() !== 'employee') {
            handleLogout();
            return;
        }

        setUserData({
            fullName: localStorage.getItem('fullName') || 'Employee',
            role: role
        });

        fetchReportStats(token);
    }, [router]);

    const fetchReportStats = async (token) => {
        try {
            const res = await fetch(apiUrl('/api/reports/performance-stats'), {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (res.status === 401) {
                handleLogout();
                return;
            }

            const result = await res.json();
            if (result.success && result.data && result.data.length > 0) {
                setRealData(result.data);
            }
        } catch (err) {
            console.error("Backend fetch failed.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <DashboardLayout
            role="employee"
            userName={userData.fullName}
            currentPath="/dashboard/employee/report"
            onLogout={handleLogout}
        >
            <div className="p-4 sm:p-6 lg:p-8">
                {loading ? (
                    <div className="flex h-[60vh] flex-col items-center justify-center gap-4">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
                        <p className="text-gray-500 font-medium">Gathering analytics...</p>
                    </div>
                ) : (
                    <ReportsPage 
                        data={realData || undefined} 
                        onNavigate={handleNavigate}
                    />
                )}
            </div>
        </DashboardLayout>
    );
}