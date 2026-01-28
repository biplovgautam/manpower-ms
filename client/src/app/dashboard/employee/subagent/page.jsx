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

    const handleLogout = () => {
        localStorage.clear();
        router.push('/login');
    };

    useEffect(() => {
        const token = localStorage.getItem('token');
        const role = localStorage.getItem('role');

        if (!token || role?.toLowerCase() !== 'employee') {
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
            const [agentsRes, workersRes] = await Promise.all([
                fetch('http://localhost:5000/api/sub-agents', {
                    headers: { 'Authorization': `Bearer ${token}` }
                }),
                fetch('http://localhost:5000/api/workers', {
                    headers: { 'Authorization': `Bearer ${token}` }
                })
            ]);

            if (agentsRes.status === 401 || workersRes.status === 401) {
                handleLogout();
                return;
            }

            const agentsResult = await agentsRes.json();
            const workersResult = await workersRes.json();

            if (agentsResult.success && workersResult.success) {
                const allWorkers = workersResult.data || [];
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

    // --- NEW: UPDATE FUNCTION ---
    const handleUpdateAgent = async (id, updatedData) => {
        const token = localStorage.getItem('token');
        try {
            const res = await fetch(`http://localhost:5000/api/sub-agents/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(updatedData),
            });
            const result = await res.json();
            if (result.success) {
                await fetchAgents(token);
                setSelectedSubAgent(result.data); // Refresh details view
                return true;
            }
            return false;
        } catch (err) {
            console.error("Update failed:", err);
            return false;
        }
    };

    // --- NEW: DELETE FUNCTION ---
    const handleDeleteAgent = async (id) => {
        if (!window.confirm("Are you sure you want to delete this agent?")) return;

        const token = localStorage.getItem('token');
        try {
            const res = await fetch(`http://localhost:5000/api/sub-agents/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const result = await res.json();
            if (result.success) {
                await fetchAgents(token);
                setView('list'); // Go back to list after deletion
                return true;
            }
            return false;
        } catch (err) {
            console.error("Delete failed:", err);
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
                        <p className="text-gray-500 font-medium">Loading data...</p>
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
                                onUpdate={handleUpdateAgent} // Prop passed
                                onDelete={handleDeleteAgent} // Prop passed
                            />
                        )}
                    </>
                )}
            </div>
        </DashboardLayout>
    );
}