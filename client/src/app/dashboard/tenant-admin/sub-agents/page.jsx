"use client";

import axios from 'axios';
import { RefreshCw } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
import { SubAgentDetailsPage } from '../../../../components/Admin/SubAgentDetailsPage';
import { SubAgentListPage } from '../../../../components/Admin/SubAgentsListPage';
import { DashboardLayout } from '../../../../components/DashboardLayout';

export default function AdminSubAgentsPage() {
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
        try {
            setIsLoading(true);
            const response = await fetch('http://localhost:5000/api/sub-agents', {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            const result = await response.json();
            if (response.ok) {
                setSubAgents(result.data || []);
            }
        } catch (err) {
            console.error("Error fetching sub-agents:", err);
        } finally {
            setIsLoading(false);
        }
    }, []);

    // Fetch workers for selected agent
    const fetchAgentWorkers = async (agentId) => {
        const token = localStorage.getItem('token');
        try {
            const response = await fetch(`http://localhost:5000/api/sub-agents/${agentId}/workers`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const result = await response.json();
            if (result.success) {
                setAgentWorkers(result.data || []);
            }
        } catch (err) {
            console.error("Error fetching workers:", err);
        }
    };

    // Auto-load detail when ?id= is present (from dashboard search)
    useEffect(() => {
        if (selectedId) {
            const fetchDetail = async () => {
                setLoadingDetail(true);
                try {
                    const token = localStorage.getItem('token');
                    const res = await axios.get(`http://localhost:5000/api/sub-agents/${selectedId}`, {
                        headers: { Authorization: `Bearer ${token}` }
                    });
                    if (res.data.success) {
                        setSelectedAgent(res.data.data);
                        fetchAgentWorkers(res.data.data._id);
                    } else {
                        toast.error("Sub-agent not found");
                        router.replace('/dashboard/tenant-admin/sub-agents');
                    }
                } catch (err) {
                    toast.error("Failed to load sub-agent details");
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
        router.push(`/dashboard/tenant-admin/sub-agents?id=${agent._id}`);
    };

    const handleUpdateStatus = async (id, newStatus) => {
        const token = localStorage.getItem('token');
        try {
            const response = await fetch(`http://localhost:5000/api/sub-agents/${id}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ status: newStatus })
            });
            if (response.ok) {
                const updatedResult = await response.json();
                setSelectedAgent(updatedResult.data);
                fetchSubAgents();
            }
        } catch (err) {
            console.error("Update failed:", err);
        }
    };

    const handleDeleteAgent = async (id) => {
        if (!confirm("Are you sure you want to delete this agent?")) return;
        const token = localStorage.getItem('token');
        try {
            const response = await fetch(`http://localhost:5000/api/sub-agents/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                handleBackToList();
                fetchSubAgents();
            }
        } catch (err) {
            console.error("Delete failed:", err);
        }
    };

    const handleBackToList = () => {
        router.replace('/dashboard/tenant-admin/sub-agents');
    };

    // If we have selected ID and loaded agent → show full details page (no modal)
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

    // Add form view (placeholder)
    if (action === 'add') {
        return (
            <DashboardLayout role="admin" currentPath="/dashboard/tenant-admin/sub-agents">
                <div className="py-6 max-w-[1600px] mx-auto px-4">
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                        <h2 className="text-xl font-bold mb-4">Register New Sub-Agent</h2>
                        <button onClick={handleBackToList} className="text-blue-500 hover:underline">
                            ← Back to List
                        </button>
                    </div>
                </div>
            </DashboardLayout>
        );
    }

    // Default: list view
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