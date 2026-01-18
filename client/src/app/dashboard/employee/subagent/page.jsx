"use client";

import { Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { DashboardLayout } from '../../../../components/DashboardLayout';
import { SubAgentDetailsPage } from '../../../../components/Employee/SubAgentDetailsPage';
import { SubAgentListPage } from '../../../../components/Employee/SubAgentListPage';

export default function SubAgentPage() {
    const router = useRouter();
    const [view, setView] = useState('list');
    const [subAgents, setSubAgents] = useState([]);
    const [selectedSubAgent, setSelectedSubAgent] = useState(null);
    const [userData, setUserData] = useState({ fullName: '', role: '' });
    const [loading, setLoading] = useState(true);

    // Centralized logout
    const handleLogout = () => {
        localStorage.clear();
        router.push('/login');
    };

    useEffect(() => {
        const token = localStorage.getItem('token');
        // FIX: Changed 'userRole' to 'role' to match your Login component logic
        const role = localStorage.getItem('role');

        // 1. Auth Guard with case-insensitive check
        if (!token || role?.toLowerCase() !== 'employee') {
            console.warn("Access denied: Invalid session or role mismatch.");
            handleLogout();
            return;
        }

        setUserData({
            fullName: localStorage.getItem('fullName') || 'Employee',
            role: role
        });

        fetchAgents(token);
    }, [router]);

    const fetchAgents = async (token) => {
        setLoading(true);
        try {
            // 1. Fetch both simultaneously
            const [agentsRes, workersRes] = await Promise.all([
                fetch('http://localhost:5000/api/sub-agents', {
                    headers: { 'Authorization': `Bearer ${token}` }
                }),
                fetch('http://localhost:5000/api/workers', {
                    headers: { 'Authorization': `Bearer ${token}` }
                })
            ]);

            // Handle session expiration (401)
            if (agentsRes.status === 401 || workersRes.status === 401) {
                handleLogout();
                return;
            }

            const agentsResult = await agentsRes.json();
            const workersResult = await workersRes.json();

            if (agentsResult.success && workersResult.success) {
                const allWorkers = workersResult.data || [];

                // 2. Map and Attach Count
                const processedAgents = agentsResult.data.map(agent => {
                    const matchingWorkers = allWorkers.filter(worker => {
                        const wId = worker.subAgentId?._id || worker.subAgentId;
                        const aId = worker.agent?._id || worker.agent;
                        const targetId = wId || aId;

                        return String(targetId) === String(agent._id);
                    });

                    return {
                        ...agent,
                        totalWorkersBrought: matchingWorkers.length
                    };
                });

                setSubAgents(processedAgents);
            }
        } catch (err) {
            console.error("Error in Parent Fetch:", err);
        } finally {
            setLoading(false);
        }
    };

    const handleAddAgent = async (agentData) => {
        const token = localStorage.getItem('token');
        try {
            const res = await fetch('http://localhost:5000/api/sub-agents', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(agentData),
            });
            const result = await res.json();
            if (result.success) {
                await fetchAgents(token);
                setView('list');
                return true;
            }
            return false;
        } catch (err) {
            return false;
        }
    };

    return (
        <DashboardLayout
            role="employee"
            userName={userData.fullName}
            currentPath="/dashboard/employee/subagent"
            onLogout={handleLogout}
        >
            <div className="p-6 max-w-7xl mx-auto">
                {loading && view === 'list' ? (
                    <div className="flex h-[60vh] flex-col items-center justify-center gap-4">
                        <Loader2 className="animate-spin text-blue-600" size={32} />
                        <p className="text-gray-500 font-medium">Loading agents and worker data...</p>
                    </div>
                ) : (
                    <>
                        {view === 'list' && (
                            <SubAgentListPage
                                subAgents={subAgents}
                                onAddSubAgent={handleAddAgent}
                                onSelectSubAgent={(id) => {
                                    const agent = subAgents.find(a => String(a._id) === String(id));
                                    setSelectedSubAgent(agent);
                                    setView('details');
                                }}
                            />
                        )}
                        {view === 'details' && selectedSubAgent && (
                            <SubAgentDetailsPage
                                subAgent={selectedSubAgent}
                                onBack={() => setView('list')}
                            />
                        )}
                    </>
                )}
            </div>
        </DashboardLayout>
    );
}