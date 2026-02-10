"use client";

import axios from 'axios';
import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
import { AddEmployeeForm } from '../../../../components/Admin/AddEmployeeForm';
import { EmployeeDetailsPage } from '../../../../components/Admin/EmployeeDetailsPage';
import { EmployeesListPage } from '../../../../components/Admin/EmployeesListPage';
import { DashboardLayout } from '../../../../components/DashboardLayout';
import { apiUrl } from '@/lib/api';

export default function AdminEmployeesPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const action = searchParams.get('action');
    const selectedId = searchParams.get('id');

    const [employees, setEmployees] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedEmployee, setSelectedEmployee] = useState(null);

    const fetchEmployees = useCallback(async () => {
        const token = localStorage.getItem('token');
        if (!token) return;

        try {
            setIsLoading(true);
            const response = await fetch(apiUrl('/api/auth/employees'), {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const result = await response.json();

            console.log("Employees API Response:", result);

            if (response.ok && result.success) {
                setEmployees(result.data || []);
            } else {
                console.error("API returned error:", result.msg);
                setEmployees([]);
            }
        } catch (err) {
            console.error("Network error fetching employees:", err);
            setEmployees([]);
        } finally {
            setIsLoading(false);
        }
    }, []);

    // When ?id= is present, fetch full details and show detail view
    useEffect(() => {
        if (selectedId) {
            const fetchDetail = async () => {
                try {
                    const token = localStorage.getItem('token');
                    const res = await axios.get(apiUrl(`/api/auth/employees/${selectedId}`), {
                        headers: { Authorization: `Bearer ${token}` }
                    });
                    if (res.data.success) {
                        setSelectedEmployee(res.data.data);
                    } else {
                        toast.error("Employee not found");
                        router.replace('/dashboard/tenant-admin/employees');
                    }
                } catch (err) {
                    toast.error("Failed to load employee");
                    router.replace('/dashboard/tenant-admin/employees');
                }
            };
            fetchDetail();
        } else {
            setSelectedEmployee(null);
        }
    }, [selectedId, router]);

    useEffect(() => {
        fetchEmployees();
    }, [fetchEmployees]);

    const handleSelectEmployee = (emp) => {
        const latestData = employees.find(e => e._id === emp._id);
        router.push(`/dashboard/tenant-admin/employees?id=${emp._id}`);
    };

    const handleBackToList = () => {
        router.replace('/dashboard/tenant-admin/employees');
    };

    const handleAddSuccess = async () => {
        await fetchEmployees();
        handleBackToList();
    };

    // Determine what to show
    if (selectedId && selectedEmployee) {
        return (
            <DashboardLayout role="admin" currentPath="/dashboard/tenant-admin/employees">
                <div className="min-h-screen w-full py-6 px-4 md:px-8 bg-slate-50/50">
                    <EmployeeDetailsPage
                        employee={selectedEmployee}
                        onBack={handleBackToList}
                    />
                </div>
            </DashboardLayout>
        );
    }

    if (action === 'add') {
        return (
            <DashboardLayout role="admin" currentPath="/dashboard/tenant-admin/employees">
                <div className="min-h-screen w-full py-6 px-4 md:px-8 bg-slate-50/50">
                    <AddEmployeeForm
                        onBack={handleBackToList}
                        onSuccess={handleAddSuccess}
                    />
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout role="admin" currentPath="/dashboard/tenant-admin/employees">
            <div className="min-h-screen w-full py-6 px-4 md:px-8 bg-slate-50/50">
                <EmployeesListPage
                    employees={employees}
                    isLoading={isLoading}
                    onAddEmployee={() => router.push('/dashboard/tenant-admin/employees?action=add')}
                    onSelect={handleSelectEmployee}
                    onRefresh={fetchEmployees}
                />
            </div>
        </DashboardLayout>
    );
}