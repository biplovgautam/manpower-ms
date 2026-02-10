"use client";

import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
import { EmployerDetailPage } from '../../../../components/Admin/EmployerDetailPage';
import { EmployersListPage } from '../../../../components/Admin/EmployersListPage';
import { DashboardLayout } from '../../../../components/DashboardLayout';
import { apiUrl } from '@/lib/api';

export default function AdminEmployersPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const selectedId = searchParams.get('id');

    const [employers, setEmployers] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedEmployer, setSelectedEmployer] = useState(null);
    const [adminData, setAdminData] = useState({ name: 'Admin', role: 'admin' });

    useEffect(() => {
        const fetchEmployers = async () => {
            const token = localStorage.getItem('token');
            const role = localStorage.getItem('role');
            const fullName = localStorage.getItem('fullName');

            if (!token || role?.toLowerCase() !== 'admin') {
                router.push('/login');
                return;
            }

            setAdminData({ name: fullName || 'Admin', role });

            try {
                setIsLoading(true);
                const response = await fetch(apiUrl('/api/employers'), {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                });

                const result = await response.json();

                if (response.ok && result.success) {
                    setEmployers(result.data);
                } else if (response.status === 401) {
                    localStorage.clear();
                    router.push('/login');
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

    // When ?id= is present, fetch full details
    useEffect(() => {
        if (selectedId) {
            const fetchDetail = async () => {
                const token = localStorage.getItem('token');
                try {
                    const response = await fetch(apiUrl(`/api/employers/${selectedId}`), {
                        headers: { 'Authorization': `Bearer ${token}` }
                    });

                    const result = await response.json();

                    if (response.ok && result.success) {
                        setSelectedEmployer(result.data);
                    } else {
                        toast.error("Employer not found");
                        router.replace('/dashboard/tenant-admin/employers');
                    }
                } catch (err) {
                    toast.error("Failed to load employer details");
                    router.replace('/dashboard/tenant-admin/employers');
                }
            };

            fetchDetail();
        } else {
            setSelectedEmployer(null);
        }
    }, [selectedId, router]);

    const handleSelectEmployer = (employer) => {
        router.push(`/dashboard/tenant-admin/employers?id=${employer._id}`);
    };

    const handleBackToList = () => {
        router.replace('/dashboard/tenant-admin/employers');
    };

    if (selectedId && selectedEmployer) {
        return (
            <DashboardLayout
                role="admin"
                userName={adminData.name}
                currentPath="/dashboard/tenant-admin/employers"
            >
                <EmployerDetailPage
                    employer={selectedEmployer}
                    onBack={handleBackToList}
                />
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout
            role="admin"
            userName={adminData.name}
            currentPath="/dashboard/tenant-admin/employers"
        >
            <EmployersListPage
                employers={employers}
                onSelectEmployer={handleSelectEmployer}
            />
        </DashboardLayout>
    );
}