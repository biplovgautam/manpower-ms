"use client";

import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { SubAgentDetailsPage } from '../../../../components/Admin/SubAgentDetailsPage';
import { SubAgentListPage } from '../../../../components/Admin/SubAgentsListPage';
import { DashboardLayout } from '../../../../components/DashboardLayout';

export default function AdminSubAgentsPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const action = searchParams.get('action');

    const [subAgents, setSubAgents] = useState([]);
    const [agentWorkers, setAgentWorkers] = useState([]); // Store workers for the selected agent
    const [isLoading, setIsLoading] = useState(true);
    const [view, setView] = useState('list');
    const [selectedAgent, setSelectedAgent] = useState(null);

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

    // Fetch workers for a specific agent when details are viewed
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

    useEffect(() => {
        fetchSubAgents();
    }, [fetchSubAgents]);

    useEffect(() => {
        if (action === 'add') {
            setView('add');
        } else if (selectedAgent) {
            setView('detail');
            fetchAgentWorkers(selectedAgent._id);
        } else {
            setView('list');
        }
    }, [action, selectedAgent]);

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
        setSelectedAgent(null);
        setAgentWorkers([]);
        setView('list');
        router.push('/dashboard/tenant-admin/sub-agents');
    };

    return (
        <DashboardLayout role="admin" currentPath="/dashboard/tenant-admin/sub-agents">
            <div className="py-6 max-w-[1600px] mx-auto px-4">

                {view === 'add' && (
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                        <h2 className="text-xl font-bold mb-4">Register New Sub-Agent</h2>
                        <button onClick={handleBackToList} className="text-blue-500 hover:underline">
                            ← Back to List
                        </button>
                    </div>
                )}

                {view === 'detail' && selectedAgent && (
                    <div className="space-y-4">
                        <button onClick={handleBackToList} className="text-sm text-gray-500 hover:text-black flex items-center gap-1">
                            ← Back to Sub-Agents
                        </button>

                        <SubAgentDetailsPage
                            agent={selectedAgent}
                            workers={agentWorkers}
                            onDelete={handleDeleteAgent}
                            onStatusChange={handleUpdateStatus}
                        />
                    </div>
                )}

                {view === 'list' && (
                    <SubAgentListPage
                        subAgents={subAgents}
                        isLoading={isLoading}
                        onSelectSubAgent={(agent) => {
                            setSelectedAgent(agent);
                            router.push(`/dashboard/tenant-admin/sub-agents?id=${agent._id}`);
                        }}
                    />
                )}
            </div>
        </DashboardLayout>
    );
}