"use client";

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { DashboardLayout } from '../../../../components/DashboardLayout';
import { ReportsPage } from '../../../../components/Employee/ReportPage';

export default function ReportsDashboard() {
    const router = useRouter();
    const [realData, setRealData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [userData, setUserData] = useState({ fullName: '', role: '' });

    // Centralized logout helper
    const handleLogout = () => {
        localStorage.clear();
        router.push('/login');
    };

    useEffect(() => {
        const token = localStorage.getItem('token');
        // FIX: Changed 'userRole' to 'role' to match your Login logic
        const role = localStorage.getItem('role');

        // Robust Auth Guard
        if (!token || role?.toLowerCase() !== 'employee') {
            console.warn("Unauthorized access to Reports. Redirecting...");
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
            const res = await fetch('http://localhost:5000/api/reports/performance-stats', {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            // Handle session expiration
            if (res.status === 401) {
                handleLogout();
                return;
            }

            const result = await res.json();

            // If backend has data, use it. Otherwise, stay null to trigger Mock Data.
            if (result.success && result.data && result.data.length > 0) {
                setRealData(result.data);
            }
        } catch (err) {
            console.error("Backend report fetch failed, using mock data instead.");
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
                    /* If realData is null, ReportsPage will use its internal mock data.
                       Passing 'undefined' allows the component's default props to kick in.
                    */
                    <ReportsPage data={realData || undefined} />
                )}
            </div>
        </DashboardLayout>
    );
}