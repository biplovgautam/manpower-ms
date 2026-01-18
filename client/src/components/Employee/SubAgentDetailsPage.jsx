"use client";

import {
    ArrowLeft,
    Calendar,
    Globe,
    Loader2,
    Mail,
    Phone,
    Ship,
    TrendingUp,
    Users
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';

export function SubAgentDetailsPage({ subAgent, onBack }) {
    const [workers, setWorkers] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (subAgent?._id) {
            fetchAgentWorkers();
        }
    }, [subAgent]);

    const fetchAgentWorkers = async () => {
        setLoading(true);
        const token = localStorage.getItem('token');
        try {
            // Using the specific sub-agent workers endpoint for accurate filtering
            const res = await fetch(`http://localhost:5000/api/sub-agents/${subAgent._id}/workers`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            const result = await res.json();
            if (result.success) {
                setWorkers(result.data || []);
            }
        } catch (err) {
            console.error("Error fetching workers for this agent:", err);
        } finally {
            setLoading(false);
        }
    };

    const stats = {
        total: workers.length,
        active: workers.filter(w => w.status === 'active' || w.status === 'deployed').length,
        pending: workers.filter(w => w.status === 'pending' || w.status === 'processing').length,
    };

    if (!subAgent) return null;

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500 pb-10">
            {/* Header / Navigation */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <Button
                        variant="outline"
                        size="icon"
                        onClick={onBack}
                        className="rounded-full hover:bg-gray-100"
                    >
                        <ArrowLeft size={20} />
                    </Button>
                    <div>
                        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">
                            {subAgent.fullName || subAgent.name}
                        </h1>
                        <p className="text-gray-500 flex items-center gap-1">
                            <Globe size={14} /> Global Partner from {subAgent.country}
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Badge className="px-4 py-1.5 text-sm font-bold uppercase tracking-wider bg-green-100 text-green-700 border-green-200">
                        {subAgent.status || 'Active'}
                    </Badge>
                </div>
            </div>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="border-none shadow-sm ring-1 ring-gray-200">
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-500 uppercase tracking-wider">Total Referred</p>
                                <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
                            </div>
                            <div className="p-3 bg-blue-50 rounded-lg text-blue-600">
                                <Users size={24} />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-none shadow-sm ring-1 ring-gray-200">
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-500 uppercase tracking-wider">Currently Deployed</p>
                                <p className="text-3xl font-bold text-green-600">{stats.active}</p>
                            </div>
                            <div className="p-3 bg-green-50 rounded-lg text-green-600">
                                <Ship size={24} />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-none shadow-sm ring-1 ring-gray-200">
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-500 uppercase tracking-wider">In Process</p>
                                <p className="text-3xl font-bold text-amber-600">{stats.pending}</p>
                            </div>
                            <div className="p-3 bg-amber-50 rounded-lg text-amber-600">
                                <TrendingUp size={24} />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                {/* Detailed Profile Info */}
                <Card className="lg:col-span-1 border-none shadow-sm ring-1 ring-gray-200 h-fit">
                    <CardHeader className="border-b bg-gray-50/50 py-4">
                        <CardTitle className="text-sm font-bold text-gray-700 uppercase tracking-widest">Agent Profile</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-6 space-y-5">
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-gray-400 uppercase">Contact Number</label>
                            <p className="text-sm font-mono flex items-center gap-2"><Phone size={14} /> {subAgent.contact}</p>
                        </div>
                        {subAgent.email && (
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-gray-400 uppercase">Email Address</label>
                                <p className="text-sm flex items-center gap-2 text-blue-600"><Mail size={14} /> {subAgent.email}</p>
                            </div>
                        )}
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-gray-400 uppercase">Base Country</label>
                            <p className="text-sm font-semibold">{subAgent.country}</p>
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-gray-400 uppercase">Partner Since</label>
                            <p className="text-sm flex items-center gap-2 text-gray-600">
                                <Calendar size={14} />
                                {subAgent.createdAt ? new Date(subAgent.createdAt).toLocaleDateString() : 'N/A'}
                            </p>
                        </div>
                    </CardContent>
                </Card>

                {/* Referred Workers Table */}
                <Card className="lg:col-span-3 border-none shadow-sm ring-1 ring-gray-200 overflow-hidden">
                    <CardHeader className="border-b bg-gray-50/50 flex flex-row items-center justify-between py-4">
                        <CardTitle className="text-sm font-bold text-gray-700 uppercase tracking-widest">Workers referred by this Agent</CardTitle>
                        <Badge variant="secondary">{workers.length} Total</Badge>
                    </CardHeader>
                    <CardContent className="p-0">
                        {loading ? (
                            <div className="flex flex-col items-center justify-center p-20 gap-3">
                                <Loader2 className="animate-spin text-blue-600" size={32} />
                                <p className="text-sm text-gray-500 font-medium">Loading worker records...</p>
                            </div>
                        ) : workers.length === 0 ? (
                            <div className="text-center py-20 px-6">
                                <div className="bg-gray-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <Users className="text-gray-300" size={32} />
                                </div>
                                <h3 className="text-lg font-bold text-gray-900">No Workers Found</h3>
                                <p className="text-gray-500 max-w-xs mx-auto">This sub-agent hasn't registered any workers in the system yet.</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader className="bg-gray-50">
                                        <TableRow>
                                            <TableHead className="font-bold py-4">Full Name</TableHead>
                                            <TableHead className="font-bold">Passport</TableHead>
                                            <TableHead className="font-bold">Process Status</TableHead>
                                            <TableHead className="font-bold text-right">Registered</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {workers.map((worker) => (
                                            <TableRow key={worker._id} className="hover:bg-slate-50 transition-colors">
                                                <TableCell className="font-bold text-blue-700">{worker.name}</TableCell>
                                                <TableCell className="font-mono text-sm text-gray-600">{worker.passportNumber}</TableCell>
                                                <TableCell>
                                                    <Badge
                                                        variant={
                                                            worker.status === 'active' || worker.status === 'deployed' ? 'success' :
                                                                worker.status === 'pending' ? 'warning' : 'secondary'
                                                        }
                                                        className="capitalize"
                                                    >
                                                        {worker.status}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-right text-gray-500 text-sm">
                                                    {new Date(worker.createdAt).toLocaleDateString()}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}