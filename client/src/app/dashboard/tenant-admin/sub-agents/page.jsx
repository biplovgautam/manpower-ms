"use client";

import axios from 'axios';
import { RefreshCw } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useCallback, useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
import { SubAgentDetailsPage } from '../../../../components/Admin/SubAgentDetailsPage';
import { SubAgentListPage } from '../../../../components/Admin/SubAgentsListPage';
import { DashboardLayout } from '../../../../components/DashboardLayout';
import { apiUrl } from '@/lib/api';

function AdminSubAgentsPageContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const action = searchParams.get('action');
    const selectedId = searchParams.get('id');

    const [subAgents, setSubAgents] = useState([]);
    const [agentWorkers, setAgentWorkers] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedAgent, setSelectedAgent] = useState(null);
    const [loadingDetail, setLoadingDetail] = useState(false);

    const fetchSubAgents = useCallback(async () => {
        const token = localStorage.getItem('token');
        if (!token) return;

        try {
            setIsLoading(true);
            const response = await fetch(apiUrl('/api/sub-agents'), {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            const result = await response.json();
            if (response.ok) {
                setSubAgents(result.data || []);
            } else {
                toast.error(result.msg || "Failed to load sub-agents");
            }
        } catch (err) {
            console.error("Error fetching sub-agents:", err);
            toast.error("Network error while loading agents");
        } finally {
            setIsLoading(false);
        }
    }, []);

    const fetchAgentWorkers = async (agentId) => {
        const token = localStorage.getItem('token');
        try {
            const response = await fetch(apiUrl(`/api/sub-agents/${agentId}/workers`), {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const result = await response.json();
            if (result.success) {
                setAgentWorkers(result.data || []);
            } else {
                toast.error("Failed to load workers for this agent");
            }
        } catch (err) {
            console.error("Error fetching workers:", err);
        }
    };

    // When ?id appears (from search or list click) → load details
    useEffect(() => {
        if (selectedId) {
            const fetchDetail = async () => {
                setLoadingDetail(true);
                try {
                    const token = localStorage.getItem('token');
                    const res = await axios.get(apiUrl(`/api/sub-agents/${selectedId}`), {
                        headers: { Authorization: `Bearer ${token}` }
                    });

                    if (res.data.success) {
                        setSelectedAgent(res.data.data);
                        await fetchAgentWorkers(res.data.data._id);
                    } else {
                        toast.error(res.data.msg || "Sub-agent not found");
                        router.replace('/dashboard/tenant-admin/sub-agents');
                    }
                } catch (err) {
                    console.error("Detail fetch error:", err);
                    toast.error("Failed to load agent details");
                    router.replace('/dashboard/tenant-admin/sub-agents');
                } finally {
                    setLoadingDetail(false);
                }
            };

            fetchDetail();
        } else {
            setSelectedAgent(null);
            setAgentWorkers([]);
        }
    }, [selectedId, router]);

    useEffect(() => {
        fetchSubAgents();
    }, [fetchSubAgents]);

    const handleSelectSubAgent = (agent) => {
        if (!agent?._id) return;
        router.push(`/dashboard/tenant-admin/sub-agents?id=${agent._id}`);
    };

    const handleUpdateStatus = async (id, newStatus) => {
        const token = localStorage.getItem('token');
        try {
            const response = await fetch(apiUrl(`/api/sub-agents/${id}`), {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ status: newStatus })
            });

            const result = await response.json();
            if (response.ok) {
                setSelectedAgent(result.data);
                fetchSubAgents();
                toast.success("Status updated");
            } else {
                toast.error(result.msg || "Failed to update status");
            }
        } catch (err) {
            console.error("Update failed:", err);
            toast.error("Network error updating status");
        }
    };

    const handleDeleteAgent = async (id) => {
        if (!confirm("Are you sure you want to delete this agent?")) return;

        const token = localStorage.getItem('token');
        try {
            const response = await fetch(apiUrl(`/api/sub-agents/${id}`), {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.ok) {
                toast.success("Agent deleted");
                handleBackToList();
                fetchSubAgents();
            } else {
                const result = await response.json();
                toast.error(result.msg || "Failed to delete agent");
            }
        } catch (err) {
            console.error("Delete failed:", err);
            toast.error("Network error deleting agent");
        }
    };

    const handleBackToList = () => {
        router.replace('/dashboard/tenant-admin/sub-agents');
    };

    // ─── RENDER ────────────────────────────────────────────────

    // Details view (full page)
    if (selectedId && selectedAgent) {
        return (
            <DashboardLayout role="admin" currentPath="/dashboard/tenant-admin/sub-agents">
                <div className="py-6 max-w-[1600px] mx-auto px-4">
                    {loadingDetail ? (
                        <div className="flex justify-center items-center h-64">
                            <RefreshCw className="animate-spin text-indigo-600" size={48} />
                        </div>
                    ) : (
                        <SubAgentDetailsPage
                            agent={selectedAgent}
                            workers={agentWorkers}
                            onDelete={handleDeleteAgent}
                            onStatusChange={handleUpdateStatus}
                        />
                    )}
                </div>
            </DashboardLayout>
        );
    }

    // Add form (placeholder)
    if (action === 'add') {
        return (
            <DashboardLayout role="admin" currentPath="/dashboard/tenant-admin/sub-agents">
                <div className="py-6 max-w-[1600px] mx-auto px-4">
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                        <h2 className="text-xl font-bold mb-4">Register New Sub-Agent</h2>
                        <p className="text-gray-600 mb-6">Form coming soon...</p>
                        <button
                            onClick={handleBackToList}
                            className="px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800"
                        >
                            ← Back to List
                        </button>
                    </div>
                </div>
            </DashboardLayout>
        );
    }

    // List view
    return (
        <DashboardLayout role="admin" currentPath="/dashboard/tenant-admin/sub-agents">
            <div className="py-6 max-w-[1600px] mx-auto px-4">
                <SubAgentListPage
                    subAgents={subAgents}
                    isLoading={isLoading}
                    onSelectSubAgent={handleSelectSubAgent}
                />
            </div>
        </DashboardLayout>
    );
}

export default function AdminSubAgentsPage() {
    return (
        <Suspense fallback={<div className="p-6 text-sm text-slate-500">Loading...</div>}>
            <AdminSubAgentsPageContent />
        </Suspense>
    );
}