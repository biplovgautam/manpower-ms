"use client";

import axios from 'axios';
import { RefreshCw } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
import { WorkerDetailsPage } from '../../../../components/Admin/WorkersDetailsPage';
import { WorkersListPage } from '../../../../components/Admin/WorkersListPage';
import { DashboardLayout } from '../../../../components/DashboardLayout';

export default function AdminWorkersPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const action = searchParams.get('action');
    const selectedId = searchParams.get('id');

    const [workers, setWorkers] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedWorker, setSelectedWorker] = useState(null);
    const [loadingDetail, setLoadingDetail] = useState(false);

    const fetchWorkers = useCallback(async () => {
        const token = localStorage.getItem('token');
        try {
            setIsLoading(true);
            const response = await fetch('http://localhost:5000/api/workers', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const result = await response.json();

            if (response.ok) {
                setWorkers(result.data || []);

                // Update selected worker if already viewing details
                if (selectedWorker) {
                    const updatedWorker = (result.data || []).find(
                        w => w._id === selectedWorker._id
                    );
                    if (updatedWorker) setSelectedWorker(updatedWorker);
                }
            }
        } catch (err) {
            console.error("Network error:", err);
        } finally {
            setIsLoading(false);
        }
    }, [selectedWorker]);

    // Auto-load detail when ?id= is present (from search)
    useEffect(() => {
        if (selectedId) {
            const fetchDetail = async () => {
                setLoadingDetail(true);
                try {
                    const token = localStorage.getItem('token');
                    const res = await axios.get(`http://localhost:5000/api/workers/${selectedId}`, {
                        headers: { Authorization: `Bearer ${token}` }
                    });
                    if (res.data.success) {
                        setSelectedWorker(res.data.data);
                    } else {
                        toast.error("Worker not found");
                        router.replace('/dashboard/tenant-admin/workers');
                    }
                } catch (err) {
                    toast.error("Failed to load worker details");
                    router.replace('/dashboard/tenant-admin/workers');
                } finally {
                    setLoadingDetail(false);
                }
            };
            fetchDetail();
        } else {
            setSelectedWorker(null);
        }
    }, [selectedId, router]);

    useEffect(() => {
        fetchWorkers();
    }, [fetchWorkers]);

    const handleSelectWorker = (worker) => {
        router.push(`/dashboard/tenant-admin/workers?id=${worker._id}`);
    };

    const handleBackToList = () => {
        router.replace('/dashboard/tenant-admin/workers');
    };

    // If we have selected ID and loaded worker → show full details page
    if (selectedId && selectedWorker) {
        return (
            <DashboardLayout role="admin" currentPath="/dashboard/tenant-admin/workers">
                <div className="py-6 max-w-[1600px] mx-auto px-4">
                    {loadingDetail ? (
                        <div className="flex justify-center items-center h-64">
                            <RefreshCw className="animate-spin text-indigo-600" size={48} />
                        </div>
                    ) : (
                        <WorkerDetailsPage
                            worker={selectedWorker}
                            onBack={handleBackToList}
                        />
                    )}
                </div>
            </DashboardLayout>
        );
    }

    // Add form view (placeholder — replace with real form when ready)
    if (action === 'add') {
        return (
            <DashboardLayout role="admin" currentPath="/dashboard/tenant-admin/workers">
                <div className="py-6 max-w-[1600px] mx-auto px-4">
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                        <h2 className="text-xl font-bold mb-4">Add New Worker</h2>
                        {/* <AddWorkerForm onBack={handleBackToList} onSuccess={...} /> */}
                        <button onClick={handleBackToList} className="text-blue-500 underline">Go Back</button>
                    </div>
                </div>
            </DashboardLayout>
        );
    }

    // Default: list view
    return (
        <DashboardLayout role="admin" currentPath="/dashboard/tenant-admin/workers">
            <div className="py-6 max-w-[1600px] mx-auto px-4">
                <WorkersListPage
                    workers={workers}
                    isLoading={isLoading}
                    onAddWorker={() => router.push('/dashboard/tenant-admin/workers?action=add')}
                    onSelect={handleSelectWorker}
                />
            </div>
        </DashboardLayout>
    );
}