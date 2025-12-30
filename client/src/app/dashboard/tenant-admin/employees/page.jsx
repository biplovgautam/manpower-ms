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
    const [view, setView] = useState('list');
    const [selectedEmployee, setSelectedEmployee] = useState(null);

    const fetchEmployees = useCallback(async () => {
        const token = localStorage.getItem('token');
        try {
            setIsLoading(true);
            const response = await fetch('http://localhost:5000/api/auth/employees', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const result = await response.json();
            if (response.ok) setEmployees(result.employees || []);
        } catch (err) {
            console.error("Network error:", err);
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
        } else if (!selectedEmployee) {
            setView('list');
        }
    }, [action, selectedEmployee]);

    const handleSelectEmployee = (emp) => {
        setSelectedEmployee(emp);
        setView('detail');
    };

    const handleBackToList = () => {
        setView('list');
        setSelectedEmployee(null);
        router.push('/dashboard/tenant-admin/employees');
    };

    return (
        <DashboardLayout role="admin" currentPath="/dashboard/tenant-admin/employees">
            {/* min-h-screen ensures the page can scroll down to the tables */}
            <div className="min-h-screen w-full py-6 px-4 md:px-8">
                {view === 'add' && (
                    <AddEmployeeForm
                        onBack={handleBackToList}
                        onSuccess={() => {
                            handleBackToList();
                            fetchEmployees();
                        }}
                    />
                )}

                {view === 'detail' && (
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
                    />
                )}
            </div>
        </DashboardLayout>
    );
}