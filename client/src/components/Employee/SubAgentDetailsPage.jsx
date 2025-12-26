"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { DashboardLayout } from '../DashboardLayout';
import { SubAgentListPage } from '../Employee/SubAgentListPage';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/Table';
import { ArrowLeft, Globe, TrendingUp, Users, Ship } from 'lucide-react';

export default function SubAgentPage() {
    const router = useRouter();
    const [view, setView] = useState('list'); // 'list' or 'details'
    const [subAgents, setSubAgents] = useState([]);
    const [selectedSubAgent, setSelectedSubAgent] = useState(null);
    const [userData, setUserData] = useState({ fullName: '', role: '' });
    const [loading, setLoading] = useState(true);

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
        
        fetchAgents(token);
    }, [router]);

    const fetchAgents = async (token) => {
        setLoading(true);
        try {
            const res = await fetch('http://localhost:5000/api/sub-agents', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const result = await res.json();
            if (result.success) {
                setSubAgents(result.data || []);
            }
        } catch (err) {
            console.error("Fetch error:", err);
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
            console.error("Add error:", err);
            return false;
        }
    };

    return (
        <DashboardLayout 
            role="employee"
            userName={userData.fullName}
            currentPath="/dashboard/employee/subagent"
            onLogout={() => { localStorage.clear(); router.push('/login'); }}
        >
            {loading && view === 'list' ? (
                <div className="flex h-[60vh] items-center justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
            ) : (
                <>
                    {view === 'list' && (
                        <div className="p-6 max-w-7xl mx-auto">
                            <SubAgentListPage 
                                subAgents={subAgents} 
                                onAddSubAgent={handleAddAgent}
                                onSelectSubAgent={(id) => {
                                    const agent = subAgents.find(a => a._id === id);
                                    setSelectedSubAgent(agent);
                                    setView('details');
                                }}
                            />
                        </div>
                    )}

                    {view === 'details' && (
                        <SubAgentDetailsView 
                            subAgent={selectedSubAgent} 
                            onBack={() => setView('list')} 
                        />
                    )}
                </>
            )}
        </DashboardLayout>
    );
}

/**
 * SUB-COMPONENT: SubAgentDetailsView
 * Includes Mock Data for Workers and Statistics
 */
function SubAgentDetailsView({ subAgent, onBack }) {
    if (!subAgent) return null;

    // --- MOCK DATA FOR UI PREVIEW ---
    const mockWorkers = [
        { name: "John Doe", job: "Electrician", employer: "Global Tech", status: "Deployed", date: "2023-10-12" },
        { name: "Jane Smith", job: "Welder", employer: "BuildCo", status: "Pending", date: "2023-11-05" },
        { name: "Ahmed Khan", job: "Driver", employer: "Logistics Pro", status: "Interview", date: "2023-11-20" },
    ];

    const stats = {
        total: subAgent.totalWorkersBrought || 12, // fallback to mock 12
        deployed: Math.floor((subAgent.totalWorkersBrought || 12) * 0.7),
        pending: Math.ceil((subAgent.totalWorkersBrought || 12) * 0.3)
    };

    return (
        <div className="p-6 space-y-6 max-w-7xl mx-auto animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button variant="outline" size="icon" onClick={onBack}>
                        <ArrowLeft size={20} />
                    </Button>
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">{subAgent.name}</h1>
                        <p className="text-gray-500">Partner from {subAgent.country}</p>
                    </div>
                </div>
                <Badge className="px-4 py-1 text-md" variant={subAgent.status === 'active' ? 'success' : 'secondary'}>
                    {subAgent.status.toUpperCase()}
                </Badge>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Basic Info */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                            <Globe className="text-blue-500" size={18}/> Contact Details
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex justify-between items-center py-2 border-b">
                            <span className="text-gray-500 text-sm">Phone/Contact</span>
                            <span className="font-mono">{subAgent.contact}</span>
                        </div>
                        <div className="flex justify-between items-center py-2 border-b">
                            <span className="text-gray-500 text-sm">Country</span>
                            <span className="font-semibold">{subAgent.country}</span>
                        </div>
                        <div className="flex justify-between items-center py-2">
                            <span className="text-gray-500 text-sm">Joined</span>
                            <span>{new Date(subAgent.createdAt).toLocaleDateString()}</span>
                        </div>
                    </CardContent>
                </Card>

                {/* Performance Stats */}
                <Card className="lg:col-span-2">
                    <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                            <TrendingUp className="text-green-500" size={18}/> Performance Overview
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="p-4 bg-blue-50 rounded-xl border border-blue-100">
                                <Users className="text-blue-600 mb-2" size={20}/>
                                <p className="text-2xl font-bold text-blue-700">{stats.total}</p>
                                <p className="text-xs text-blue-600 font-medium">Total Referred</p>
                            </div>
                            <div className="p-4 bg-green-50 rounded-xl border border-green-100">
                                <Ship className="text-green-600 mb-2" size={20}/>
                                <p className="text-2xl font-bold text-green-700">{stats.deployed}</p>
                                <p className="text-xs text-green-600 font-medium">Total Deployed</p>
                            </div>
                            <div className="p-4 bg-amber-50 rounded-xl border border-amber-100">
                                <TrendingUp className="text-amber-600 mb-2" size={20}/>
                                <p className="text-2xl font-bold text-amber-700">{stats.pending}</p>
                                <p className="text-xs text-amber-600 font-medium">In Pipeline</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Workers Table */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg">Recent Referrals from this Agent</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Worker Name</TableHead>
                                <TableHead>Job Category</TableHead>
                                <TableHead>Assigned Employer</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Date Added</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {mockWorkers.map((worker, i) => (
                                <TableRow key={i}>
                                    <TableCell className="font-medium">{worker.name}</TableCell>
                                    <TableCell>{worker.job}</TableCell>
                                    <TableCell>{worker.employer}</TableCell>
                                    <TableCell>
                                        <Badge variant={worker.status === 'Deployed' ? 'success' : 'warning'}>
                                            {worker.status}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>{worker.date}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}