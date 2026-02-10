"use client";
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';
import { DashboardLayout } from '../../../../components/DashboardLayout';
import { AddEmployerPage } from '../../../../components/Employee/AddEmployer';
import { CreateJobDemandPage } from '../../../../components/Employee/CreateJobDemandPage';
import { EmployerDetailsPage } from '../../../../components/Employee/EmployerDetailPage';
import { EmployerListPage } from '../../../../components/Employee/EmployerListPage';
import { apiUrl } from '@/lib/api';

function EmployersContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [view, setView] = useState('list'); // views: 'list', 'add', 'details', 'edit', 'createDemand'
    const [employers, setEmployers] = useState([]);
    const [selectedEmployer, setSelectedEmployer] = useState(null);
    const [isLoadingDetails, setIsLoadingDetails] = useState(false);
    const [userData, setUserData] = useState({ fullName: '', role: '' });

    // Centralized Logout helper
    const handleLogout = () => {
        localStorage.clear();
        router.push('/login');
    };

    useEffect(() => {
        const token = localStorage.getItem('token');
        const role = localStorage.getItem('role');
        const fullName = localStorage.getItem('fullName');

        if (!token || role?.toLowerCase() !== 'employee') {
            console.warn("Auth check failed. Token exists:", !!token, "Role:", role);
            handleLogout();
            return;
        }

        setUserData({ fullName: fullName || 'Employee', role });

        fetchEmployers(token);

        // Check for action parameter
        const action = searchParams.get('action');
        if (action === 'add') {
            setView('add');
        } else {
            setView('list');
        }
    }, [router, searchParams]);

    const fetchEmployers = async (token) => {
        try {
            const res = await fetch(apiUrl('/api/employers'), {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const result = await res.json();
            if (result.success) {
                setEmployers(result.data);
            } else if (res.status === 401) {
                handleLogout();
            }
        } catch (error) {
            console.error("Failed to fetch employers:", error);
        }
    };

    const handleSelectEmployer = async (emp) => {
        setSelectedEmployer(emp);
        setView('details');
        setIsLoadingDetails(true);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(apiUrl(`/api/employers/${emp._id}`), {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const result = await res.json();
            if (result.success) {
                setSelectedEmployer(result.data);
            } else if (res.status === 401) {
                handleLogout();
            }
        } catch (error) {
            console.error("Failed to load details:", error);
        } finally {
            setIsLoadingDetails(false);
        }
    };

    const handleSaveDemand = async (submissionData) => {
        try {
            const token = localStorage.getItem('token');
            const targetEmployer = employers.find(e => e.employerName === submissionData.employerName);
            const res = await fetch(apiUrl('/api/demands'), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    ...submissionData,
                    employerId: targetEmployer?._id
                })
            });
            const result = await res.json();
            if (result.success) {
                handleSelectEmployer(targetEmployer || selectedEmployer);
            }
        } catch (error) {
            console.error("Save Demand Failed:", error);
        }
    };

    const handleSave = async (formData) => {
        const token = localStorage.getItem('token');
        const res = await fetch(apiUrl('/api/employers'), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify(formData)
        });
        const result = await res.json();
        if (res.ok && result.success) {
            fetchEmployers(token);
            setView('list');
            router.replace('/dashboard/employee/employer'); // clean URL
        }
    };

    const handleUpdate = async (formData) => {
        const token = localStorage.getItem('token');
        const res = await fetch(apiUrl(`/api/employers/${selectedEmployer._id}`), {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify(formData)
        });
        if (res.ok) {
            fetchEmployers(token);
            setView('list');
            setSelectedEmployer(null);
            router.replace('/dashboard/employee/employer');
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure?")) return;
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(apiUrl(`/api/employers/${id}`), {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                fetchEmployers(token);
                setView('list');
                router.replace('/dashboard/employee/employer');
            }
        } catch (error) {
            console.error(error);
        }
    };

    const goToList = () => {
        setView('list');
        router.replace('/dashboard/employee/employer');
    };

    return (
        <DashboardLayout
            role="employee"
            userName={userData.fullName}
            currentPath="/dashboard/employee/employer"
            onLogout={handleLogout}
        >
            <div className="p-4">
                {view === 'list' && (
                    <EmployerListPage
                        employers={employers}
                        onNavigate={setView}
                        onSelectEmployer={handleSelectEmployer}
                        onDelete={handleDelete}
                    />
                )}
                {view === 'add' && (
                    <AddEmployerPage
                        onNavigate={goToList}
                        onSave={handleSave}
                    />
                )}
                {view === 'edit' && (
                    <AddEmployerPage
                        onNavigate={goToList}
                        onSave={handleUpdate}
                        initialData={selectedEmployer}
                        isEdit={true}
                    />
                )}
                {view === 'details' && (
                    <EmployerDetailsPage
                        employer={selectedEmployer}
                        onNavigate={setView}
                        onDelete={handleDelete}
                        isLoading={isLoadingDetails}
                        onCreateDemand={() => setView('createDemand')}
                    />
                )}
                {view === 'createDemand' && (
                    <CreateJobDemandPage
                        employers={employers}
                        initialData={{ employerName: selectedEmployer?.employerName }}
                        onNavigate={() => setView('details')}
                        onSave={handleSaveDemand}
                    />
                )}
            </div>
        </DashboardLayout>
    );
}

export default function EmployersPage() {
    return (
        <Suspense fallback={
            <div className="flex items-center justify-center h-screen">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
            </div>
        }>
            <EmployersContent />
        </Suspense>
    );
}