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
    const [isDetailLoading, setIsDetailLoading] = useState(false); // New loading state for details
    const [selectedEmployer, setSelectedEmployer] = useState(null);
    const [adminData, setAdminData] = useState({ name: 'Admin', role: 'admin' });

    useEffect(() => {
        const fetchEmployers = async () => {
            const token = localStorage.getItem('token');
            const role = localStorage.getItem('userRole');
            const fullName = localStorage.getItem('fullName');

            if (!token || role !== 'admin') {
                router.push('/login');
                return;
            }

            setAdminData({ name: fullName || 'Admin', role });

            try {
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
                }
            } catch (err) {
                console.error("Network error:", err);
            } finally {
                setIsLoading(false);
            }
        };

        fetchEmployers();
    }, [router]);

    // --- NEW: Fetch Full Details when an employer is selected ---
    const handleSelectEmployer = async (employer) => {
        setIsDetailLoading(true);
        const token = localStorage.getItem('token');

        try {
            // Note: Use your specific detail endpoint /api/employers/:id
            const response = await fetch(`http://localhost:5000/api/employers/${employer._id}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            const result = await response.json();

            if (response.ok && result.success) {
                // This 'result.data' now contains 'demands' and 'workers' from your controller
                setSelectedEmployer(result.data);
            } else {
                console.error("Detail fetch error:", result.error);
                // Fallback to basic data if fetch fails
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
                <div className="flex items-center justify-center h-64">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
            ) : isDetailLoading ? (
                /* Loading spinner while fetching workers and demands */
                <div className="flex flex-col items-center justify-center h-64 gap-4">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
                    <p className="text-gray-500 animate-pulse">Loading workers and job demands...</p>
                </div>
            ) : selectedEmployer ? (
                <EmployerDetailPage
                    employer={selectedEmployer}
                    onBack={() => setSelectedEmployer(null)}
                />
            ) : (
                <EmployersListPage
                    employers={employers}
                    onSelectEmployer={handleSelectEmployer} // Use the new fetcher function
                />
            )}
        </DashboardLayout>
    );
}