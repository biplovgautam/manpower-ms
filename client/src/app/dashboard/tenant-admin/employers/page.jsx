"use client";

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { EmployerDetailPage } from '../../../../components/Admin/EmployerDetailPage';
import { EmployersListPage } from '../../../../components/Admin/EmployersListPage';
import { DashboardLayout } from '../../../../components/DashboardLayout';

export default function AdminEmployersPage() {
    const router = useRouter();
    const [employers, setEmployers] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isDetailLoading, setIsDetailLoading] = useState(false);
    const [selectedEmployer, setSelectedEmployer] = useState(null);
    const [adminData, setAdminData] = useState({ name: 'Admin', role: 'admin' });

    useEffect(() => {
        const fetchEmployers = async () => {
            // Get data from localStorage using keys defined in your Login component
            const token = localStorage.getItem('token');
            const role = localStorage.getItem('role'); // Updated from 'userRole' to 'role'
            const fullName = localStorage.getItem('fullName');

            // 1. Auth Guard: If no token or role isn't admin, kick to login
            if (!token || role?.toLowerCase() !== 'admin') {
                console.warn("Unauthorized access attempt or missing session.");
                router.push('/login');
                return;
            }

            // Set profile data for the sidebar/header
            setAdminData({ name: fullName || 'Admin', role });

            try {
                // 2. Fetch Initial List
                const response = await fetch('http://localhost:5000/api/employers', {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                });
                

                const result = await response.json();

                if (response.ok && result.success) {
                    setEmployers(result.data);
                } else if (response.status === 401) {
                    // Token likely expired on the server side
                    handleLogout();
                } else {
                    console.error("Failed to fetch employers:", result.message);
                }
            } catch (err) {
                console.error("Network error fetching employers:", err);
            } finally {
                setIsLoading(false);
            }
        };

        fetchEmployers();
    }, [router]);

    // --- Fetch Full Details when an employer is selected ---
    const handleSelectEmployer = async (employer) => {
        setIsDetailLoading(true);
        const token = localStorage.getItem('token');

        try {
            const response = await fetch(`http://localhost:5000/api/employers/${employer._id}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            const result = await response.json();

            if (response.ok && result.success) {
                // Contains enriched data (demands, workers, etc.)
                setSelectedEmployer(result.data);
            } else {
                console.error("Detail fetch error:", result.error);
                // Fallback to basic data if specific detail fetch fails
                setSelectedEmployer(employer);
            }
        } catch (err) {
            console.error("Network error during detail fetch:", err);
            setSelectedEmployer(employer);
        } finally {
            setIsDetailLoading(false);
        }
    };

    const handleLogout = () => {
        localStorage.clear();
        // Clear cookies if you're using them for middleware
        document.cookie.split(";").forEach((c) => {
            document.cookie = c
                .replace(/^ +/, "")
                .replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
        });
        router.push('/login');
    };

    return (
        <DashboardLayout
            role="admin"
            userName={adminData.name}
            currentPath="/dashboard/tenant-admin/employers"
            onNavigate={(path) => router.push(path)}
            onLogout={handleLogout}
        >
            {isLoading ? (
                <div className="flex flex-col items-center justify-center h-64 gap-3">
                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
                    <p className="text-gray-500 text-sm">Loading inventory...</p>
                </div>
            ) : isDetailLoading ? (
                <div className="flex flex-col items-center justify-center h-64 gap-4">
                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-600"></div>
                    <p className="text-gray-500 animate-pulse font-medium">
                        Fetching workers and job demands...
                    </p>
                </div>
            ) : selectedEmployer ? (
                <EmployerDetailPage
                    employer={selectedEmployer}
                    onBack={() => setSelectedEmployer(null)}
                />
            ) : (
                <EmployersListPage
                    employers={employers}
                    onSelectEmployer={handleSelectEmployer}
                />
            )}
        </DashboardLayout>
    );
}