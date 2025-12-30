"use client";

import {
    AlertCircle,
    Building2,
    CheckCircle,
    Clock,
    Search,
    Users
} from 'lucide-react';
import React, { useState } from 'react';
import { Badge } from '../ui/Badge';
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle
} from '../ui/Card';
import { Input } from '../ui/Input';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '../ui/table';

export function WorkersListPage({ workers = [], isLoading, onSelect, onRefresh }) {
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');

    // --- Stats Calculation ---
    const stats = {
        total: workers.length,
        active: workers.filter(w => w.status?.toLowerCase() === 'active').length,
        processing: workers.filter(w => ['processing', 'pending'].includes(w.status?.toLowerCase())).length,
        unassigned: workers.filter(w => !w.employerId).length
    };

    // --- Filtering Logic ---
    const filteredWorkers = workers.filter((worker) => {
        const name = worker.name || "";
        const passport = worker.passportNumber || "";
        const employerName = worker.employerId?.name || worker.employerId?.employerName || "";

        const matchesSearch =
            name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            passport.toLowerCase().includes(searchTerm.toLowerCase()) ||
            employerName.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesStatus =
            statusFilter === 'all' || worker.status?.toLowerCase() === statusFilter.toLowerCase();

        return matchesSearch && matchesStatus;
    });

    const getStatusVariant = (status) => {
        switch (status?.toLowerCase()) {
            case 'active': return 'success';
            case 'processing': return 'warning';
            case 'pending': return 'secondary';
            default: return 'outline';
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* 1. Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Workers</h1>
                    <p className="text-gray-500 mt-1">Monitor recruitment pipeline and worker assignments.</p>
                </div>

            </div>

            {/* 2. Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <QuickStat cardTitle="Total Workers" value={stats.total} icon={<Users className="text-blue-600" />} bgColor="bg-blue-50" />
                <QuickStat cardTitle="Active Status" value={stats.active} icon={<CheckCircle className="text-emerald-600" />} bgColor="bg-emerald-50" />
                <QuickStat cardTitle="Processing" value={stats.processing} icon={<Clock className="text-orange-600" />} bgColor="bg-orange-50" />
                <QuickStat cardTitle="Unassigned" value={stats.unassigned} icon={<AlertCircle className="text-rose-600" />} bgColor="bg-rose-50" />
            </div>

            {/* 3. Table Card */}
            <Card className="border-none shadow-sm bg-white overflow-hidden">
                <CardHeader className="pb-4 border-b border-gray-50">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                        <CardTitle className="text-lg font-bold text-gray-800">
                            Worker List ({filteredWorkers.length})
                        </CardTitle>

                        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 w-full lg:w-auto">
                            {/* Status Tabs */}
                            <div className="flex flex-wrap gap-1 bg-gray-100/80 p-1 rounded-xl">
                                {['all', 'active', 'processing', 'pending'].map((status) => (
                                    <button
                                        key={status}
                                        onClick={() => setStatusFilter(status)}
                                        className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${statusFilter === status
                                            ? 'bg-white text-blue-600 shadow-sm'
                                            : 'text-gray-500 hover:text-gray-700'
                                            }`}
                                    >
                                        {status.toUpperCase()}
                                    </button>
                                ))}
                            </div>

                            {/* Search */}
                            <div className="relative w-full sm:w-64">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                                <Input
                                    placeholder="Search name or passport..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pl-9 bg-gray-50 border-gray-200 rounded-xl text-sm focus:bg-white transition-all"
                                />
                            </div>
                        </div>
                    </div>
                </CardHeader>

                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader className="bg-gray-50/50">
                                <TableRow>
                                    <TableHead className="pl-6 font-semibold text-gray-600">Worker Identity</TableHead>
                                    <TableHead className="font-semibold text-gray-600">Passport</TableHead>
                                    <TableHead className="font-semibold text-gray-600">Status</TableHead>
                                    <TableHead className="font-semibold text-gray-600">Stage</TableHead>
                                    <TableHead className="font-semibold text-gray-600">Employer</TableHead>
                                    <TableHead className="font-semibold text-gray-600">Contact</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {isLoading ? (
                                    <TableRow><TableCell colSpan={6} className="h-40 text-center text-gray-400 italic">Fetching data...</TableCell></TableRow>
                                ) : filteredWorkers.length > 0 ? (
                                    filteredWorkers.map((worker) => (
                                        <TableRow
                                            key={worker._id}
                                            onClick={() => onSelect(worker)}
                                            className="cursor-pointer hover:bg-blue-50/30 border-b border-gray-100 transition-colors group"
                                        >
                                            <TableCell className="pl-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-bold">
                                                        {worker.name?.charAt(0)}
                                                    </div>
                                                    <span className="font-bold text-gray-900">{worker.name}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="font-mono text-sm text-gray-500">{worker.passportNumber}</TableCell>
                                            <TableCell>
                                                <Badge variant={getStatusVariant(worker.status)} className="capitalize px-2 py-0.5 text-[10px]">
                                                    {worker.status}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                <span className="text-blue-600 font-semibold text-xs bg-blue-50 px-2 py-1 rounded-md capitalize">
                                                    {worker.currentStage}
                                                </span>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2 text-sm">
                                                    <Building2 size={14} className={worker.employerId ? "text-blue-500" : "text-gray-300"} />
                                                    <span className={worker.employerId ? "font-medium text-gray-700" : "italic text-gray-400"}>
                                                        {worker.employerId?.name || worker.employerId?.employerName || "Unassigned"}
                                                    </span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-sm text-gray-600">{worker.contact}</TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow><TableCell colSpan={6} className="h-40 text-center text-gray-400">No results found.</TableCell></TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

// --- Helper Component for Stats ---
function QuickStat({ cardTitle, value, icon, bgColor }) {
    return (
        <Card className="border-none shadow-sm overflow-hidden">
            <CardContent className="p-5">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">{cardTitle}</p>
                        <p className="text-2xl font-black text-gray-900 mt-1">{value}</p>
                    </div>
                    <div className={`p-3 rounded-2xl ${bgColor}`}>
                        {React.cloneElement(icon, { size: 24 })}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}