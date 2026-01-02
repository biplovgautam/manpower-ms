"use client";

import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { AddEmployeeForm } from '../../../../components/Admin/AddEmployeeForm';
import { EmployeeDetailsPage } from '../../../../components/Admin/EmployeeDetailsPage';
import { EmployeesListPage } from '../../../../components/Admin/EmployeesListPage';
import { DashboardLayout } from '../../../../components/DashboardLayout';

export default function AdminEmployeesPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const action = searchParams.get('action');

    const [employees, setEmployees] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedEmployee, setSelectedEmployee] = useState(null);
    const [view, setView] = useState('list');

    const fetchEmployees = useCallback(async () => {
        const token = localStorage.getItem('token');
        if (!token) return;

        try {
            setIsLoading(true);
            const response = await fetch('http://localhost:5000/api/auth/employees', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const result = await response.json();

            // DEBUG LOG - Check this in your browser console!
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

    useEffect(() => {
        fetchEmployees();
    }, [fetchEmployees]);

    useEffect(() => {
        if (action === 'add') {
            setView('add');
        } else if (selectedEmployee) {
            setView('detail');
        } else {
            setView('list');
        }
    }, [action, selectedEmployee]);

    const handleSelectEmployee = (emp) => {
        // Re-find the employee from the state to ensure we have the latest counts 
        // that were just fetched by fetchEmployees
        const latestData = employees.find(e => e._id === emp._id);
        setSelectedEmployee(latestData || emp);
    };

    const handleBackToList = () => {
        setSelectedEmployee(null);
        router.push('/dashboard/tenant-admin/employees');
    };

    const handleAddSuccess = async () => {
        await fetchEmployees();
        handleBackToList();
    };

    return (
        <DashboardLayout role="admin" currentPath="/dashboard/tenant-admin/employees">
            <div className="min-h-screen w-full py-6 px-4 md:px-8 bg-slate-50/50">
                {view === 'add' && (
                    <AddEmployeeForm
                        onBack={handleBackToList}
                        onSuccess={handleAddSuccess}
                    />
                )}

                {view === 'detail' && selectedEmployee && (
                    <EmployeeDetailsPage
                        employee={selectedEmployee}
                        onBack={handleBackToList}
                    />
                )}

                {view === 'list' && (
                    <EmployeesListPage
                        employees={employees}
                        isLoading={isLoading}
                        onAddEmployee={() => router.push('/dashboard/tenant-admin/employees?action=add')}
                        onSelect={handleSelectEmployee}
                        onRefresh={fetchEmployees}
                    />
                )}
            </div>
        </DashboardLayout>
    );
}