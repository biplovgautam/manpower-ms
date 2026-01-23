"use client";

import { useRouter } from 'next/navigation';
import { Suspense, useCallback, useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
import { DashboardLayout } from '../../../components/DashboardLayout';
import { SettingsPage } from '../../../components/SettingsPage';

function SettingsContent() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(true);
    const [settingsData, setSettingsData] = useState({
        user: null,
        billing: null,
        employees: []
    });

    const fetchAllData = useCallback(async () => {
        const token = localStorage.getItem('token');
        if (!token) return router.push('/login');

        const config = {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        };

        try {
            // 1. Get the freshest user profile from the server
            const response = await fetch('http://localhost:5000/api/auth/me', config);
            const userRes = await response.json();

            // Handle the specific "User not found" or "Unauthorized" case
            if (!response.ok) {
                if (response.status === 404 || response.status === 401) {
                    throw new Error("SESSION_EXPIRED");
                }
                throw new Error(userRes.msg || "Failed to fetch user");
            }

            const currentUser = userRes.user;

            // 2. Identify role dynamically
            const userRole = (currentUser?.role || "").toLowerCase();
            const isAdmin = userRole === 'admin' || userRole === 'super_admin';

            let billingData = null;
            let employeeData = [];

            // 3. Fetch Admin-only data if authorized
            if (isAdmin) {
                const [bRes, eRes] = await Promise.allSettled([
                    fetch('http://localhost:5000/api/settings/billing', config).then(r => r.json()),
                    fetch('http://localhost:5000/api/settings/blocked-members', config).then(r => r.json())
                ]);

                billingData = bRes.status === 'fulfilled' ? bRes.value : null;
                employeeData = eRes.status === 'fulfilled' ? (eRes.value.data || []) : [];
            }

            setSettingsData({
                user: currentUser,
                billing: billingData,
                employees: employeeData
            });
        } catch (error) {
            console.error("Data Sync Error:", error);

            if (error.message === "SESSION_EXPIRED") {
                toast.error("Session invalid. Please login again.");
                localStorage.clear();
                router.push('/login');
            } else {
                toast.error("Failed to synchronize settings with server");
            }
        } finally {
            setIsLoading(false);
        }
    }, [router]);

    useEffect(() => {
        fetchAllData();
    }, [fetchAllData]);

    return (
        <DashboardLayout
            role={settingsData.user?.role?.toLowerCase()}
            userName={settingsData.user?.fullName}
            currentPath="/dashboard/settings"
            onLogout={() => { localStorage.clear(); router.push('/login'); }}
        >
            <div className="p-4 md:p-8">
                {isLoading ? (
                    <div className="flex flex-col items-center justify-center py-20 gap-4">
                        <span className="loading loading-spinner loading-lg text-blue-600"></span>
                        <p className="text-gray-400 animate-pulse">Verifying account access...</p>
                    </div>
                ) : (
                    <SettingsPage data={settingsData} refreshData={fetchAllData} />
                )}
            </div>
        </DashboardLayout>
    );
}

export default function Page() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <SettingsContent />
        </Suspense>
    );
}