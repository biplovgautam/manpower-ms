"use client";
import { useRouter } from 'next/navigation';
import { Suspense, useCallback, useEffect, useState } from 'react';
import { DashboardLayout } from '../../../components/DashboardLayout';
import { SettingsPage } from '../../../components/SettingsPage';
import { apiUrl } from '@/lib/api';

function SettingsContent() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(true);
    const [settingsData, setSettingsData] = useState({ user: null, billing: null, employees: [] });

    const fetchAllData = useCallback(async () => {
        const token = localStorage.getItem('token');
        if (!token) return router.push('/login');

        const config = {
            headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
        };

        try {
            // 1. Get User + Company Settings
            const response = await fetch(apiUrl('/api/auth/me'), config);
            const userRes = await response.json();
            if (!response.ok) throw new Error("SESSION_EXPIRED");

            const currentUser = userRes.user;
            const isAdmin = ['admin', 'super_admin'].includes(currentUser?.role?.toLowerCase());

            let employeeData = [];

            // 2. Fetch Employee List if Admin
            if (isAdmin) {
                const eRes = await fetch(apiUrl('/api/settings/blocked-members'), config);
                const eJson = await eRes.json();
                // Extracting the .data array from the response
                employeeData = eJson.data || [];
            }

            setSettingsData({
                user: currentUser,
                billing: currentUser.billing,
                employees: employeeData
            });
        } catch (error) {
            console.error(error);
            if (error.message === "SESSION_EXPIRED") {
                localStorage.clear();
                router.push('/login');
            }
        } finally {
            setIsLoading(false);
        }
    }, [router]);

    useEffect(() => { fetchAllData(); }, [fetchAllData]);

    return (
        <DashboardLayout
            role={settingsData.user?.role}
            userName={settingsData.user?.fullName}
        >
            <div className="p-4 md:p-8">
                {isLoading ? (
                    <div className="flex justify-center py-20">
                        <span className="loading loading-spinner loading-lg text-blue-600"></span>
                    </div>
                ) : (
                    <SettingsPage data={settingsData} refreshData={fetchAllData} />
                )}
            </div>
        </DashboardLayout>
    );
}

export default function Page() {
    return <Suspense fallback={null}><SettingsContent /></Suspense>;
}