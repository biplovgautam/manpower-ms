"use client";

import axios from 'axios';
import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
import { AdminJobDemandDetailsPage } from '../../../../components/Admin/JobDemandDetailPage';
import { AdminJobDemandListPage } from '../../../../components/Admin/JobDemandListPage';
import { DashboardLayout } from '../../../../components/DashboardLayout';

// Placeholder form (replace with your real add form)
const AdminJobDemandForm = ({ onBack, onSuccess }) => (
    <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
        <h2 className="text-2xl font-bold mb-4">Create New Job Demand</h2>
        <p className="text-slate-500 mb-6">The demand registration form will go here.</p>
        <button onClick={onBack} className="px-4 py-2 bg-slate-900 text-white rounded-lg">Go Back</button>
    </div>
);

export default function AdminJobDemandPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const action = searchParams.get('action');
    const selectedId = searchParams.get('id');

    const [jobDemands, setJobDemands] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedDemand, setSelectedDemand] = useState(null);
    const [loadingDetail, setLoadingDetail] = useState(false);

    const fetchJobDemands = useCallback(async () => {
        const token = localStorage.getItem('token');
        if (!token) return;

        try {
            setIsLoading(true);
            const response = await fetch('http://localhost:5000/api/job-demands', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const result = await response.json();

            console.log("Job Demands API Response:", result);

            if (response.ok && result.success) {
                setJobDemands(result.data || []);
            } else {
                console.error("API Error:", result.msg);
                setJobDemands([]);
            }
        } catch (err) {
            console.error("Network error fetching demands:", err);
            setJobDemands([]);
        } finally {
            setIsLoading(false);
        }
    }, []);

    // Auto-load detail when ?id= is present (from search)
    useEffect(() => {
        if (selectedId) {
            const fetchDetail = async () => {
                setLoadingDetail(true);
                try {
                    const token = localStorage.getItem('token');
                    const res = await axios.get(`http://localhost:5000/api/job-demands/${selectedId}`, {
                        headers: { Authorization: `Bearer ${token}` }
                    });
                    if (res.data.success) {
                        setSelectedDemand(res.data.data);
                    } else {
                        toast.error("Job demand not found");
                        router.replace('/dashboard/tenant-admin/job-demand');
                    }
                } catch (err) {
                    toast.error("Failed to load details");
                    router.replace('/dashboard/tenant-admin/job-demand');
                } finally {
                    setLoadingDetail(false);
                }
            };
            fetchDetail();
        } else {
            setSelectedDemand(null);
        }
    }, [selectedId, router]);

    // Load list on mount / refresh
    useEffect(() => {
        fetchJobDemands();
    }, [fetchJobDemands]);

    const handleSelectDemand = (demand) => {
        const latestData = jobDemands.find(d => d._id === demand._id);
        router.push(`/dashboard/tenant-admin/job-demand?id=${demand._id}`);
    };

    const handleBackToList = () => {
        router.replace('/dashboard/tenant-admin/job-demand');
    };

    const handleAddSuccess = async () => {
        await fetchJobDemands();
        handleBackToList();
    };

    // If we have selected ID and loaded details → show full details page
    if (selectedId && selectedDemand) {
        return (
            <DashboardLayout role="admin" currentPath="/dashboard/tenant-admin/job-demand">
                <div className="min-h-screen w-full py-6 px-4 md:px-8 bg-slate-50/50">
                    {loadingDetail ? (
                        <div className="flex justify-center items-center h-64">
                            <RefreshCw className="animate-spin text-indigo-600" size={48} />
                        </div>
                    ) : (
                        <AdminJobDemandDetailsPage
                            jobDemand={selectedDemand}
                            onNavigate={(target) => {
                                if (target === 'list') handleBackToList();
                            }}
                        />
                    )}
                </div>
            </DashboardLayout>
        );
    }

    // Add form view
    if (action === 'add') {
        return (
            <DashboardLayout role="admin" currentPath="/dashboard/tenant-admin/job-demand">
                <div className="min-h-screen w-full py-6 px-4 md:px-8 bg-slate-50/50">
                    <AdminJobDemandForm
                        onBack={handleBackToList}
                        onSuccess={handleAddSuccess}
                    />
                </div>
            </DashboardLayout>
        );
    }

    // Default: list view
    return (
        <DashboardLayout role="admin" currentPath="/dashboard/tenant-admin/job-demand">
            <div className="min-h-screen w-full py-6 px-4 md:px-8 bg-slate-50/50">
                <AdminJobDemandListPage
                    jobDemands={jobDemands}
                    isLoading={isLoading}
                    onNavigate={(action, data) => {
                        if (action === 'create') router.push('/dashboard/tenant-admin/job-demand?action=add');
                        if (action === 'details') handleSelectDemand(data);
                    }}
                />
            </div>
        </DashboardLayout>
    );
}