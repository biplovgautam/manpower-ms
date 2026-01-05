"use client";

import { useRouter, useSearchParams } from 'next/navigation'; // Added useSearchParams
import { useCallback, useEffect, useState, Suspense } from 'react'; // Added Suspense
import { DashboardLayout } from '../../../../components/DashboardLayout';
import { CreateJobDemandPage } from '../../../../components/Employee/CreateJobDemandPage';
import { JobDemandDetailsPage } from '../../../../components/Employee/JobDemandDetailsPage';
import { JobDemandListPage } from '../../../../components/Employee/JobDemandListPage';

function JobDemandsContent() {
    const router = useRouter();
    const searchParams = useSearchParams(); // Hook to read URL params
    
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
                setSelectedJobDemand(result.data);
                setView('details');
            } else {
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
            
            // NAVIGATION LOGIC: Check for ?action=add
            const action = searchParams.get('action');
            if (action === 'add') {
                setView('create');
            } else {
                setView('list');
            }
            
            setIsLoading(false);
        };

        loadInitialData();
    }, [router, searchParams, fetchJobDemands, fetchEmployers]);

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
            // Clear URL params when going back to list
            router.replace('/dashboard/employee/job-demand');
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
                handleNavigate('list');
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
                handleNavigate('list');
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

// Wrap in Suspense to handle useSearchParams in Next.js
export default function JobDemandsPage() {
    return (
        <Suspense fallback={<div>Loading Job Demands...</div>}>
            <JobDemandsContent />
        </Suspense>
    );
}