"use client";
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { DashboardLayout } from '../../../../components/DashboardLayout';
import { CreateJobDemandPage } from '../../../../components/Employee/CreateJobDemandPage';
import { JobDemandDetailsPage } from '../../../../components/Employee/JobDemandDetailsPage';
import { JobDemandListPage } from '../../../../components/Employee/JobDemandListPage';

export default function JobDemandsPage() {
    const router = useRouter();
    const [view, setView] = useState('list');
    const [jobDemands, setJobDemands] = useState([]);
    const [employers, setEmployers] = useState([]);
    const [selectedJobDemand, setSelectedJobDemand] = useState(null);
    const [userData, setUserData] = useState({ fullName: '', role: '' });
    const [isLoading, setIsLoading] = useState(true);

    const API_URL = 'http://localhost:5000/api/job-demands';
    const EMPLOYERS_API_URL = 'http://localhost:5000/api/employers';

    const fetchJobDemands = useCallback(async (token) => {
        try {
            const res = await fetch(API_URL, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const result = await res.json();
            if (result.success) setJobDemands(result.data);
        } catch (error) {
            console.error("Failed to fetch job demands:", error);
        }
    }, []);

    const fetchEmployers = useCallback(async (token) => {
        try {
            const res = await fetch(EMPLOYERS_API_URL, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const result = await res.json();
            if (result.success) setEmployers(result.data);
        } catch (error) {
            console.error("Failed to fetch employers:", error);
        }
    }, []);

    useEffect(() => {
        const token = localStorage.getItem('token');
        const role = localStorage.getItem('userRole');

        if (!token || role !== 'employee') {
            router.push('/login');
            return;
        }

        setUserData({
            fullName: localStorage.getItem('fullName') || 'Employee',
            role
        });

        const loadData = async () => {
            setIsLoading(true);
            await Promise.all([fetchJobDemands(token), fetchEmployers(token)]);
            setIsLoading(false);
        };
        loadData();
    }, [router, fetchJobDemands, fetchEmployers]);

    const handleSave = async (formData) => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(formData)
            });

            const result = await res.json();
            if (res.ok && result.success) {
                await fetchJobDemands(token);
                setView('list');
            } else {
                alert(result.error || "Failed to save job demand");
            }
        } catch (error) {
            console.error("Save error:", error);
        }
    };

    const handleUpdate = async (formData) => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_URL}/${selectedJobDemand._id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(formData)
            });

            const result = await res.json();
            if (res.ok && result.success) {
                await fetchJobDemands(token);
                setView('list');
                setSelectedJobDemand(null);
            } else {
                alert(result.error || "Failed to update job demand");
            }
        } catch (error) {
            console.error("Update error:", error);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to delete this job demand?")) return;

        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_URL}/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (res.ok) {
                fetchJobDemands(token);
                setView('list');
            }
        } catch (error) {
            console.error("Delete failed:", error);
        }
    };

    const handleNavigate = (targetView, data = null) => {
        if (data) setSelectedJobDemand(data);
        setView(targetView);
    };

    return (
        <DashboardLayout
            role="employee"
            userName={userData.fullName}
            currentPath="/dashboard/employee/job-demand"
            onLogout={() => { localStorage.clear(); router.push('/login'); }}
        >
            <div className="container mx-auto p-4">
                {isLoading ? (
                    <div className="flex justify-center items-center h-64">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                    </div>
                ) : (
                    <>
                        {view === 'list' && (
                            <JobDemandListPage
                                jobDemands={jobDemands}
                                onNavigate={handleNavigate}
                                onSelectJobDemand={(jd) => handleNavigate('details', jd)}
                                onDelete={handleDelete}
                            />
                        )}

                        {view === 'create' && (
                            <CreateJobDemandPage
                                employers={employers}
                                onNavigate={handleNavigate}
                                onSave={handleSave}
                            />
                        )}

                        {view === 'edit' && (
                            <CreateJobDemandPage
                                employers={employers}
                                initialData={selectedJobDemand}
                                isEditing={true}
                                onNavigate={handleNavigate}
                                onSave={handleUpdate}
                            />
                        )}

                        {view === 'details' && (
                            <JobDemandDetailsPage
                                jobDemand={selectedJobDemand}
                                onNavigate={handleNavigate}
                                onDelete={handleDelete}
                            />
                        )}
                    </>
                )}
            </div>
        </DashboardLayout>
    );
}