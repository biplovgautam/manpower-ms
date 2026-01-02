"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { DashboardLayout } from '../../../../components/DashboardLayout';
import { SubAgentListPage } from '../../../../components/Employee/SubAgentListPage';
import { Card, CardHeader, CardTitle, CardContent } from '../../../../components/ui/Card';
import { Badge } from '../../../../components/ui/Badge';
import { Button } from '../../../../components/ui/Button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../../../components/ui/table';
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
            <div className="p-6 max-w-7xl mx-auto">
                {loading && view === 'list' ? (
                    <div className="flex h-[60vh] items-center justify-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    </div>
                ) : (
                    <>
                        {/* LIST VIEW */}
                        {view === 'list' && (
                            <SubAgentListPage 
                                subAgents={subAgents} 
                                onAddSubAgent={handleAddAgent}
                                onSelectSubAgent={(id) => {
                                    const agent = subAgents.find(a => a._id === id);
                                    setSelectedSubAgent(agent);
                                    setView('details');
                                }}
                            />
                        )}

                        {/* DETAILS VIEW */}
                        {view === 'details' && selectedSubAgent && (
                            <SubAgentDetailsView 
                                subAgent={selectedSubAgent} 
                                onBack={() => {
                                    setSelectedSubAgent(null);
                                    setView('list');
                                }} 
                            />
                        )}
                    </>
                )}
            </div>
        </DashboardLayout>
    );
}

/**
 * SUB-COMPONENT: SubAgentDetailsView
 */
function SubAgentDetailsView({ subAgent, onBack }) {
    if (!subAgent) return null;

    const mockWorkers = [
        { name: "John Doe", job: "Electrician", employer: "Global Tech", status: "Deployed", date: "2023-10-12" },
        { name: "Jane Smith", job: "Welder", employer: "BuildCo", status: "Pending", date: "2023-11-05" },
        { name: "Ahmed Khan", job: "Driver", employer: "Logistics Pro", status: "Interview", date: "2023-11-20" },
    ];

    const stats = {
        total: subAgent.totalWorkersBrought || 0,
        deployed: Math.floor((subAgent.totalWorkersBrought || 0) * 0.7),
        pending: Math.ceil((subAgent.totalWorkersBrought || 0) * 0.3)
    };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
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
                <Badge className="px-4 py-1 text-md uppercase">
                    {subAgent.status || 'Active'}
                </Badge>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Contact Info */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                            <Globe className="text-blue-500" size={18}/> Contact Details
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex justify-between items-center py-2 border-b">
                            <span className="text-gray-500 text-sm">Phone</span>
                            <span className="font-mono">{subAgent.contact}</span>
                        </div>
                        <div className="flex justify-between items-center py-2 border-b">
                            <span className="text-gray-500 text-sm">Country</span>
                            <span className="font-semibold">{subAgent.country}</span>
                        </div>
                        <div className="flex justify-between items-center py-2">
                            <span className="text-gray-500 text-sm">Joined</span>
                            <span>{subAgent.createdAt ? new Date(subAgent.createdAt).toLocaleDateString() : 'N/A'}</span>
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
                                <TableHead>Employer</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Date</TableHead>
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