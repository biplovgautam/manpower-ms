"use client";

import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { DashboardLayout } from '../../../../components/DashboardLayout';
import { SubAgentListPage } from '../../../../components/Admin/SubAgentsListPage';
// import { SubAgentDetailsPage } from '../../../../components/Admin/SubAgentDetailsPage';

export default function AdminSubAgentsPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const action = searchParams.get('action');

    const [subAgents, setSubAgents] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [view, setView] = useState('list'); // 'list' | 'detail' | 'add'
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
                
                // Refresh detail view if one is open
                if (selectedAgent) {
                    const updated = result.data.find(a => a._id === selectedAgent._id);
                    if (updated) setSelectedAgent(updated);
                }
            }
        } catch (err) {
            console.error("Error fetching sub-agents:", err);
        } finally {
            setIsLoading(false);
        }
    }, [selectedAgent]);

    useEffect(() => {
        fetchSubAgents();
    }, []);

    useEffect(() => {
        if (action === 'add') setView('add');
        else if (!action && view === 'add') setView('list');
    }, [action, view]);

    const handleSelectAgent = (agent) => {
        setSelectedAgent(agent);
        setView('detail');
    };

    const handleBackToList = () => {
        setView('list');
        setSelectedAgent(null);
        router.push('/dashboard/tenant-admin/sub-agents');
    };

    return (
        <DashboardLayout role="admin" currentPath="/dashboard/tenant-admin/sub-agents">
            <div className="py-6 max-w-[1600px] mx-auto px-4">
                
                {view === 'add' && (
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                        <h2 className="text-xl font-bold mb-4">Register New Sub-Agent</h2>
                        {/* <AddSubAgentForm onBack={handleBackToList} onSuccess={fetchSubAgents} /> */}
                        <button onClick={handleBackToList} className="text-blue-500 hover:underline">
                            ← Back to List
                        </button>
                    </div>
                )}

                {view === 'detail' && selectedAgent && (
                    <div className="space-y-4">
                        <button onClick={handleBackToList} className="text-sm text-gray-500 hover:text-black">
                            ← Back to Sub-Agents
                        </button>
                        {/* <SubAgentDetailsPage agent={selectedAgent} /> */}
                        <div className="bg-white p-8 rounded-lg shadow">
                            <h2 className="text-2xl font-bold">{selectedAgent.name}</h2>
                            <p>Country: {selectedAgent.country}</p>
                            <p>Status: {selectedAgent.status}</p>
                        </div>
                    </div>
                )}

                {view === 'list' && (
                    <SubAgentListPage
                        subAgents={subAgents}
                        isLoading={isLoading}
                        onAddAgent={() => router.push('/dashboard/tenant-admin/sub-agents?action=add')}
                        onSelectSubAgent={handleSelectAgent}
                    />
                )}
            </div>
        </DashboardLayout>
    );
}