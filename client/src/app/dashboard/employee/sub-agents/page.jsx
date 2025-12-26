"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { DashboardLayout } from '../../../../components/DashboardLayout';
import { SubAgentListPage } from '../../../../components/Employee/SubAgentListPage';
import { Card, CardHeader, CardTitle, CardContent } from '../../../../components/ui/Card';
import { Badge } from '../../../../components/ui/Badge';
import { Button } from '../../../../components/ui/Button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../../../components/ui/Table';
import { ArrowLeft, Globe, TrendingUp, Users, Ship } from 'lucide-react';

export default function SubAgentPage() {
    const router = useRouter();
    const [view, setView] = useState('list'); // 'list', 'details', or 'add'
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
                        {/* ONLY show list if view is 'list' */}
                        {view === 'list' && (
                            <SubAgentListPage 
                                subAgents={subAgents} 
                                onSelectSubAgent={(id) => {
                                    const agent = subAgents.find(a => a._id === id);
                                    setSelectedSubAgent(agent);
                                    setView('details'); // Switch to details view
                                }}
                                // If your ListPage has an internal 'add' view, 
                                // it's better to manage it here or ensure it doesn't conflict
                            />
                        )}

                        {/* ONLY show details if view is 'details' */}
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

// --- Details Sub-Component with Mocks ---
function SubAgentDetailsView({ subAgent, onBack }) {
    const mockWorkers = [
        { name: "John Doe", job: "Electrician", employer: "Global Tech", status: "Deployed", date: "2023-10-12" },
        { name: "Jane Smith", job: "Welder", employer: "BuildCo", status: "Pending", date: "2023-11-05" }
    ];

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="flex items-center gap-4">
                <Button variant="outline" size="sm" onClick={onBack}>
                    <ArrowLeft size={16} className="mr-2" /> Back to List
                </Button>
                <h1 className="text-2xl font-bold">{subAgent.name}</h1>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card>
                    <CardHeader><CardTitle className="text-sm font-medium">Contact Info</CardTitle></CardHeader>
                    <CardContent>
                        <p className="text-sm text-gray-500">Country: <span className="text-black font-semibold">{subAgent.country}</span></p>
                        <p className="text-sm text-gray-500">Phone: <span className="text-black font-semibold">{subAgent.contact}</span></p>
                    </CardContent>
                </Card>
                <Card className="md:col-span-2">
                    <CardHeader><CardTitle className="text-sm font-medium">Stats</CardTitle></CardHeader>
                    <CardContent className="flex gap-8">
                        <div>
                            <p className="text-2xl font-bold text-blue-600">{subAgent.totalWorkersBrought || 0}</p>
                            <p className="text-xs text-gray-400">Total Referrals</p>
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-green-600">85%</p>
                            <p className="text-xs text-gray-400">Success Rate</p>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader><CardTitle>Recent Workers</CardTitle></CardHeader>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Name</TableHead>
                                <TableHead>Status</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {mockWorkers.map((w, i) => (
                                <TableRow key={i}>
                                    <TableCell>{w.name}</TableCell>
                                    <TableCell><Badge variant="outline">{w.status}</Badge></TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}