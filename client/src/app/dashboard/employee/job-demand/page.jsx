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
    const [isLoading, setIsLoading] = useState(true);
    const [jobDemands, setJobDemands] = useState([]);
    const [employers, setEmployers] = useState([]);
    const [selectedJobDemand, setSelectedJobDemand] = useState(null);
    const [userData, setUserData] = useState({ fullName: '', role: '' });

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

    // FULLY SYNCED WITH YOUR BACKEND CONTROLLER
    const fetchSingleJobDemand = async (id) => {
        if (!id) return;
        setIsLoading(true);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_URL}/${id}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const result = await res.json();

            if (result.success) {
                // Your backend returns { success: true, data: jobDemand }
                setSelectedJobDemand(result.data);
                setView('details');
            } else {
                // Your backend returns { success: false, error: "..." }
                alert("Error: " + (result.error || "Failed to load details"));
            }
        } catch (error) {
            console.error("Fetch Error:", error);
            alert("Network error. Is the server running?");
        } finally {
            setIsLoading(false);
        }
    };

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

        const loadInitialData = async () => {
            setIsLoading(true);
            await Promise.all([fetchJobDemands(token), fetchEmployers(token)]);
            setIsLoading(false);
        };

        loadInitialData();
    }, [router, fetchJobDemands, fetchEmployers]);

    const handleNavigate = (targetView, data = null) => {
        if (targetView === 'details') {
            const targetId = data?._id;
            if (targetId) fetchSingleJobDemand(targetId);
        } else if (targetView === 'edit' && data) {
            setSelectedJobDemand(data);
            setView('edit');
        } else if (targetView === 'list') {
            setSelectedJobDemand(null);
            setView('list');
        } else {
            if (data) setSelectedJobDemand(data);
            setView(targetView);
        }
    };

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
            if (result.success) {
                await fetchJobDemands(token);
                setView('list');
            } else {
                alert(result.error);
            }
        } catch (error) {
            console.error("Save Error:", error);
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
            if (result.success) {
                await fetchJobDemands(token);
                setView('list');
                setSelectedJobDemand(null);
            }
        } catch (error) {
            console.error("Update Error:", error);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Delete this record?")) return;
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_URL}/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const result = await res.json();
            if (result.success) {
                fetchJobDemands(token);
                setView('list');
            }
        } catch (error) {
            console.error("Delete Error:", error);
        }
    };

    return (
        <DashboardLayout
            role="employee"
            userName={userData.fullName}
            currentPath="/dashboard/employee/job-demand"
        >
            <div className="container mx-auto p-4">
                {isLoading ? (
                    <div className="flex justify-center items-center h-64">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
                    </div>
                ) : (
                    <>
                        {view === 'list' && (
                            <JobDemandListPage
                                jobDemands={jobDemands}
                                onNavigate={handleNavigate}
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

                        {view === 'details' && selectedJobDemand && (
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